from __future__ import annotations

import io
import json
import os
import re
import sqlite3
import zipfile
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from flask import Flask, jsonify, request, send_file, Response
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "storyatlas.db"

COLLECTIONS = [
    "characters", "locations", "factions", "items", "lore", "history",
    "systems", "cultures", "plots", "chapters", "scenes", "volumes",
    "combatSequences", "themes", "foreshadowing", "languages",
    "dialogueVoices", "panels", "manuscripts", "timelineEvents",
    "bibliography", "publishing",
]


def now_iso() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def safe_slug(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "untitled"


def strip_html(value: str) -> str:
    return re.sub(r"<[^>]+>", "", value or "")


def csv_escape(value) -> str:
    text = str(value or "").replace('"', '""')
    return f'"{text}"'


# ── Database helpers ────────────────────────────────────────────────────

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_connection()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS meta (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS entries (
            id TEXT NOT NULL,
            collection_name TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            PRIMARY KEY (collection_name, id)
        );
    """)
    conn.commit()
    conn.close()


def load_meta(conn: sqlite3.Connection) -> dict:
    rows = conn.execute("SELECT key, value FROM meta").fetchall()
    meta = {}
    for row in rows:
        try:
            meta[row["key"]] = json.loads(row["value"])
        except json.JSONDecodeError:
            meta[row["key"]] = row["value"]
    return meta


def save_meta(conn: sqlite3.Connection, meta: dict) -> None:
    for key, value in meta.items():
        conn.execute(
            "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, json.dumps(value, ensure_ascii=False)),
        )


def load_collection(conn: sqlite3.Connection, collection: str) -> list[dict]:
    rows = conn.execute(
        "SELECT data_json FROM entries WHERE collection_name = ? ORDER BY updated_at DESC",
        (collection,),
    ).fetchall()
    items = []
    for row in rows:
        try:
            items.append(json.loads(row["data_json"]))
        except json.JSONDecodeError:
            continue
    return items


def load_entry(conn: sqlite3.Connection, collection: str, entry_id: str) -> dict | None:
    row = conn.execute(
        "SELECT data_json FROM entries WHERE collection_name = ? AND id = ?",
        (collection, entry_id),
    ).fetchone()
    if row is None:
        return None
    return json.loads(row["data_json"])


def save_entry(conn: sqlite3.Connection, collection: str, entry: dict) -> None:
    conn.execute(
        """INSERT INTO entries (id, collection_name, data_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(collection_name, id)
           DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at""",
        (entry["id"], collection, json.dumps(entry, ensure_ascii=False),
         entry.get("createdAt", now_iso()), entry.get("updatedAt", now_iso())),
    )


def validate_collection(collection: str):
    if collection not in COLLECTIONS:
        return jsonify({"error": f"Unknown collection: {collection}"}), 400
    return None


# ── Export helpers ──────────────────────────────────────────────────────

def entry_to_markdown(collection: str, item: dict) -> str:
    title = item.get("name") or item.get("title") or "Untitled"
    lines = [f"# {title}\n\n_Collection: {collection}_\n\n"]
    for key in ["status", "type", "role", "arc", "pov", "date"]:
        if item.get(key):
            lines.append(f"- **{key}:** {item[key]}\n")
    lines.append("\n")
    for key, value in item.items():
        if key in ("id", "createdAt", "updatedAt", "name", "title", "status", "type", "role", "arc", "pov", "date"):
            continue
        if not value:
            continue
        if isinstance(value, list):
            lines.append(f"## {key}\n")
            for v in value:
                lines.append(f"- {v}\n")
            lines.append("\n")
        else:
            lines.append(f"## {key}\n{strip_html(str(value))}\n\n")
    return "".join(lines)


def build_world_bible(data: dict) -> str:
    meta = data.get("meta", {})
    project = meta.get("projectName") or "StoryAtlas Project"
    lines = [
        f"# {project} -- World Bible\n\n",
        f"**Genre:** {meta.get('genre', 'Unspecified')}\n\n",
    ]
    sections = [
        ("Characters", "characters", ["role", "affiliation", "personality", "motivations"]),
        ("Locations", "locations", ["type", "region", "overview"]),
        ("Factions", "factions", ["type", "leader", "ideology", "goals"]),
        ("Power Systems", "systems", ["type", "overview", "mechanics"]),
        ("Lore", "lore", ["category", "overview"]),
        ("Plot Arcs", "plots", ["type", "status", "synopsis", "conflict"]),
    ]
    for title, col, fields in sections:
        items = data.get(col, [])
        lines.append(f"## {title}\n\n")
        if not items:
            lines.append("No entries yet.\n\n")
            continue
        for item in items[:12]:
            name = item.get("name") or item.get("title") or "Untitled"
            lines.append(f"### {name}\n")
            for f in fields:
                v = item.get(f)
                if v:
                    lines.append(f"- **{f}:** {strip_html(str(v))[:300]}\n")
            lines.append("\n")
    return "".join(lines)


# ── Flask app ──────────────────────────────────────────────────────────

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)
    init_db()

    @app.route("/api/all")
    def api_all():
        conn = get_connection()
        payload = {"meta": load_meta(conn)}
        for col in COLLECTIONS:
            payload[col] = load_collection(conn, col)
        conn.close()
        return jsonify(payload)

    @app.route("/api/meta", methods=["PUT"])
    def api_meta():
        updates = request.get_json(silent=True) or {}
        conn = get_connection()
        current = load_meta(conn)
        current.update(updates)
        save_meta(conn, current)
        conn.commit()
        conn.close()
        return jsonify(current)

    @app.route("/api/<collection>", methods=["POST"])
    def api_create(collection: str):
        err = validate_collection(collection)
        if err:
            return err
        payload = request.get_json(silent=True) or {}
        ts = now_iso()
        entry = dict(payload)
        entry["id"] = uuid4().hex[:12]
        entry["createdAt"] = ts
        entry["updatedAt"] = ts
        conn = get_connection()
        save_entry(conn, collection, entry)
        conn.commit()
        conn.close()
        return jsonify(entry), 201

    @app.route("/api/<collection>/<entry_id>", methods=["PUT"])
    def api_update(collection: str, entry_id: str):
        err = validate_collection(collection)
        if err:
            return err
        updates = request.get_json(silent=True) or {}
        conn = get_connection()
        existing = load_entry(conn, collection, entry_id)
        if existing is None:
            conn.close()
            return jsonify({"error": "Not found"}), 404
        existing.update(updates)
        existing["id"] = entry_id
        existing["updatedAt"] = now_iso()
        save_entry(conn, collection, existing)
        conn.commit()
        conn.close()
        return jsonify(existing)

    @app.route("/api/<collection>/<entry_id>", methods=["DELETE"])
    def api_delete(collection: str, entry_id: str):
        err = validate_collection(collection)
        if err:
            return err
        conn = get_connection()
        conn.execute("DELETE FROM entries WHERE collection_name = ? AND id = ?", (collection, entry_id))
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

    @app.route("/api/export.json")
    def api_export_json():
        conn = get_connection()
        data = {"meta": load_meta(conn)}
        for col in COLLECTIONS:
            data[col] = load_collection(conn, col)
        conn.close()
        return Response(
            json.dumps(data, indent=2, ensure_ascii=False),
            mimetype="application/json",
            headers={"Content-Disposition": "attachment; filename=storyatlas_backup.json"},
        )

    @app.route("/api/import", methods=["POST"])
    def api_import_json():
        payload = request.get_json(silent=True) or {}
        if not isinstance(payload, dict):
            return jsonify({"error": "Invalid payload"}), 400
        conn = get_connection()
        conn.execute("DELETE FROM meta")
        conn.execute("DELETE FROM entries")
        meta = payload.get("meta") or {}
        if isinstance(meta, dict):
            save_meta(conn, meta)
        # Support both flat format and nested {data: {...}} format
        source = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        for col in COLLECTIONS:
            entries = source.get(col, [])
            if not isinstance(entries, list):
                continue
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                entry = dict(entry)
                entry["id"] = entry.get("id") or uuid4().hex[:12]
                entry["createdAt"] = entry.get("createdAt") or now_iso()
                entry["updatedAt"] = entry.get("updatedAt") or entry["createdAt"]
                save_entry(conn, col, entry)
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

    @app.route("/api/import-file", methods=["POST"])
    def api_import_file():
        uploaded = request.files.get("file")
        if uploaded is None:
            return jsonify({"error": "No file uploaded"}), 400
        filename = (uploaded.filename or "").lower()
        raw = uploaded.read()
        if not raw:
            return jsonify({"error": "Empty file"}), 400
        try:
            if filename.endswith(".zip"):
                with zipfile.ZipFile(io.BytesIO(raw), "r") as zf:
                    target = next((n for n in zf.namelist() if n.endswith(".json")), None)
                    if not target:
                        return jsonify({"error": "No JSON found in ZIP"}), 400
                    with zf.open(target) as fh:
                        payload = json.loads(fh.read().decode("utf-8"))
            else:
                payload = json.loads(raw.decode("utf-8"))
        except Exception:
            return jsonify({"error": "Invalid file"}), 400
        # Reuse the import logic
        conn = get_connection()
        conn.execute("DELETE FROM meta")
        conn.execute("DELETE FROM entries")
        meta = payload.get("meta") or {}
        if isinstance(meta, dict):
            save_meta(conn, meta)
        source = payload.get("data") if isinstance(payload.get("data"), dict) else payload
        for col in COLLECTIONS:
            entries = source.get(col, [])
            if not isinstance(entries, list):
                continue
            for entry in entries:
                if not isinstance(entry, dict):
                    continue
                entry = dict(entry)
                entry["id"] = entry.get("id") or uuid4().hex[:12]
                entry["createdAt"] = entry.get("createdAt") or now_iso()
                entry["updatedAt"] = entry.get("updatedAt") or entry["createdAt"]
                save_entry(conn, col, entry)
        conn.commit()
        conn.close()
        return jsonify({"ok": True})

    @app.route("/api/export.zip")
    def api_export_zip():
        conn = get_connection()
        data = {"meta": load_meta(conn)}
        for col in COLLECTIONS:
            data[col] = load_collection(conn, col)
        conn.close()
        project_name = data["meta"].get("projectName") or "StoryAtlas"
        root = safe_slug(project_name)
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f"{root}/data/storyatlas_data.json", json.dumps(data, indent=2, ensure_ascii=False))
            wiki_cols = ["characters", "locations", "factions", "items", "lore", "history", "systems", "cultures"]
            story_cols = ["plots", "chapters", "scenes", "volumes"]
            for col in wiki_cols + story_cols:
                for item in data.get(col, []):
                    name = item.get("name") or item.get("title") or item.get("id") or "untitled"
                    folder = "story" if col in story_cols else "wiki"
                    zf.writestr(f"{root}/{folder}/{col}/{safe_slug(name)}.md", entry_to_markdown(col, item))
            for item in data.get("manuscripts", []):
                title = item.get("title") or item.get("name") or "untitled"
                slug = safe_slug(title)
                plain = strip_html(item.get("content", ""))
                zf.writestr(f"{root}/manuscripts/{slug}.txt", f"# {title}\n\n{plain}\n")
            rows = ["Date,Name,Type,Scale,Overview"]
            for item in data.get("timelineEvents", []):
                rows.append(",".join([
                    csv_escape(item.get("date", "")), csv_escape(item.get("name", "")),
                    csv_escape(item.get("type", "")), csv_escape(item.get("scale", "")),
                    csv_escape(strip_html(item.get("overview", ""))),
                ]))
            zf.writestr(f"{root}/timeline/timeline_events.csv", "\n".join(rows))
            zf.writestr(f"{root}/world_bible.md", build_world_bible(data))
        buf.seek(0)
        return send_file(buf, mimetype="application/zip", as_attachment=True,
                         download_name=f"{safe_slug(project_name)}_export.zip")

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
