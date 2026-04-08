from __future__ import annotations

import io
import json
import os
import re
import sqlite3
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from flask import Flask, jsonify, render_template, request, send_file, Response
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / 'worldforge.db'

COLLECTIONS = [
    'characters', 'locations', 'factions', 'items', 'lore', 'history',
    'systems', 'cultures', 'plots', 'chapters', 'timelineEvents',
    'manuscripts', 'bibliography'
]


def now_iso() -> str:
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')


def safe_slug(value: str) -> str:
    value = (value or '').strip().lower()
    value = re.sub(r'[^a-z0-9]+', '-', value)
    return value.strip('-') or 'untitled'


def normalize_import_payload(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict):
        raise ValueError('Invalid payload')
    return payload


def load_payload_from_uploaded_file(file_storage) -> dict[str, Any]:
    filename = secure_filename(file_storage.filename or '').lower()
    raw = file_storage.read()
    if not raw:
        raise ValueError('Uploaded file was empty')

    if filename.endswith('.json'):
        try:
            return normalize_import_payload(json.loads(raw.decode('utf-8')))
        except Exception as exc:
            raise ValueError('Invalid JSON backup') from exc

    if filename.endswith('.zip'):
        try:
            with zipfile.ZipFile(io.BytesIO(raw), 'r') as zf:
                target = next((name for name in zf.namelist() if name.endswith('storyatlas_data.json')), None)
                if not target:
                    target = next((name for name in zf.namelist() if name.lower().endswith('.json')), None)
                if not target:
                    raise ValueError('ZIP did not contain a StoryAtlas JSON backup')
                with zf.open(target) as fh:
                    return normalize_import_payload(json.loads(fh.read().decode('utf-8')))
        except ValueError:
            raise
        except Exception as exc:
            raise ValueError('Invalid ZIP backup') from exc

    raise ValueError('Unsupported file type')


def import_payload_into_db(conn: sqlite3.Connection, payload: dict[str, Any]) -> None:
    conn.execute('DELETE FROM meta')
    conn.execute('DELETE FROM entries')

    meta = payload.get('meta') or {}
    if isinstance(meta, dict):
        save_meta(conn, meta)

    for collection in COLLECTIONS:
        entries = payload.get(collection) or []
        if not isinstance(entries, list):
            continue
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            entry = dict(entry)
            entry['id'] = entry.get('id') or uuid4().hex[:12]
            entry['createdAt'] = entry.get('createdAt') or now_iso()
            entry['updatedAt'] = entry.get('updatedAt') or entry['createdAt']
            if collection != 'manuscripts' and not entry.get('name') and entry.get('title'):
                entry['name'] = entry['title']
            if collection == 'manuscripts' and not entry.get('title') and entry.get('name'):
                entry['title'] = entry['name']
            save_entry(conn, collection, entry)



def create_app() -> Flask:
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.environ.get('WORLDFORGE_SECRET_KEY', 'storyatlas-local-dev')
    init_db()

    @app.route('/')
    def index() -> str:
        return render_template('index.html')

    @app.route('/api/all')
    def api_all():
        conn = get_connection()
        payload: dict[str, Any] = {'meta': load_meta(conn)}
        for collection in COLLECTIONS:
            payload[collection] = load_collection(conn, collection)
        conn.close()
        return jsonify(payload)

    @app.route('/api/meta', methods=['PUT'])
    def api_meta():
        payload = request.get_json(silent=True) or {}
        conn = get_connection()
        current = load_meta(conn)
        current.update(payload)
        save_meta(conn, current)
        conn.commit()
        conn.close()
        return jsonify(current)

    @app.route('/api/<collection>', methods=['POST'])
    def api_create(collection: str):
        validate_collection(collection)
        payload = request.get_json(silent=True) or {}
        entry_id = payload.get('id') or uuid4().hex[:12]
        ts = now_iso()
        entry = dict(payload)
        entry['id'] = entry_id
        entry['createdAt'] = ts
        entry['updatedAt'] = ts
        if collection != 'manuscripts' and not entry.get('name') and entry.get('title'):
            entry['name'] = entry['title']
        if collection == 'manuscripts' and not entry.get('title') and entry.get('name'):
            entry['title'] = entry['name']

        conn = get_connection()
        save_entry(conn, collection, entry)
        conn.commit()
        conn.close()
        return jsonify(entry), 201

    @app.route('/api/<collection>/<entry_id>', methods=['PUT'])
    def api_update(collection: str, entry_id: str):
        validate_collection(collection)
        payload = request.get_json(silent=True) or {}
        conn = get_connection()
        existing = load_entry(conn, collection, entry_id)
        if existing is None:
            conn.close()
            return jsonify({'error': 'Not found'}), 404
        existing.update(payload)
        existing['id'] = entry_id
        existing['updatedAt'] = now_iso()
        if collection != 'manuscripts' and not existing.get('name') and existing.get('title'):
            existing['name'] = existing['title']
        if collection == 'manuscripts' and not existing.get('title') and existing.get('name'):
            existing['title'] = existing['name']
        save_entry(conn, collection, existing)
        conn.commit()
        conn.close()
        return jsonify(existing)

    @app.route('/api/<collection>/<entry_id>', methods=['DELETE'])
    def api_delete(collection: str, entry_id: str):
        validate_collection(collection)
        conn = get_connection()
        conn.execute('DELETE FROM entries WHERE collection_name = ? AND id = ?', (collection, entry_id))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})


    @app.route('/api/export.json')
    def api_export_json():
        conn = get_connection()
        data = {'meta': load_meta(conn)}
        for collection in COLLECTIONS:
            data[collection] = load_collection(conn, collection)
        conn.close()
        return Response(
            json.dumps(data, indent=2, ensure_ascii=False),
            mimetype='application/json',
            headers={'Content-Disposition': 'attachment; filename=storyatlas_backup.json'},
        )

    @app.route('/api/import', methods=['POST'])
    def api_import_json():
        payload = request.get_json(silent=True) or {}
        if not isinstance(payload, dict):
            return jsonify({'error': 'Invalid payload'}), 400

        conn = get_connection()
        import_payload_into_db(conn, payload)
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    @app.route('/api/import-file', methods=['POST'])
    def api_import_file():
        uploaded = request.files.get('file')
        if uploaded is None:
            return jsonify({'error': 'No file uploaded'}), 400
        try:
            payload = load_payload_from_uploaded_file(uploaded)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400

        conn = get_connection()
        import_payload_into_db(conn, payload)
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    @app.route('/api/export.zip')
    def api_export_zip():
        conn = get_connection()
        data = {'meta': load_meta(conn)}
        for collection in COLLECTIONS:
            data[collection] = load_collection(conn, collection)
        conn.close()

        project_name = data['meta'].get('projectName') or 'StoryAtlas Project'
        root = safe_slug(project_name)
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.writestr(f'{root}/README.md', build_readme(data))
            zf.writestr(f'{root}/data/storyatlas_data.json', json.dumps(data, indent=2, ensure_ascii=False))

            wiki_cols = ['characters', 'locations', 'factions', 'items', 'lore', 'history', 'systems', 'cultures']
            story_cols = ['plots', 'chapters']

            for collection in wiki_cols + story_cols:
                for item in data.get(collection, []):
                    name = item.get('name') or item.get('title') or item.get('id') or 'untitled'
                    filename = safe_slug(name) + '.md'
                    folder = 'story' if collection in story_cols else 'wiki'
                    zf.writestr(f'{root}/{folder}/{collection}/{filename}', entry_to_markdown(collection, item))

            for item in data.get('manuscripts', []):
                title = item.get('title') or item.get('name') or item.get('id') or 'untitled'
                slug = safe_slug(title)
                plain = strip_html(item.get('content', ''))
                zf.writestr(
                    f'{root}/manuscripts/{slug}.txt',
                    f"# {title}\n\nStatus: {item.get('status', '')}\nLinked Chapter: {item.get('linkedChapter', 'N/A')}\n\n---\n\n{plain}\n",
                )
                zf.writestr(
                    f'{root}/manuscripts/{slug}.html',
                    f"<!doctype html><html><head><meta charset='utf-8'><title>{title}</title></head><body>{item.get('content','')}</body></html>",
                )

            timeline_rows = ['Date,DateValue,Name,Type,Scale,Overview']
            for item in data.get('timelineEvents', []):
                row = [
                    csv_escape(item.get('date', '')),
                    csv_escape(item.get('dateValue', '')),
                    csv_escape(item.get('name', '')),
                    csv_escape(item.get('type', '')),
                    csv_escape(item.get('scale', '')),
                    csv_escape(strip_html(item.get('overview', ''))),
                ]
                timeline_rows.append(','.join(row))
            zf.writestr(f'{root}/timeline/timeline_events.csv', '\n'.join(timeline_rows))

            bib_md = ['# Bibliography & Inspiration\n']
            for item in data.get('bibliography', []):
                bib_md.append(f"## {item.get('name', 'Untitled')}\n")
                bib_md.append(f"- **Type:** {item.get('type', '')}\n")
                bib_md.append(f"- **Creator:** {item.get('creator', '')}\n")
                bib_md.append(f"\n**Influence:**\n{item.get('influence', '')}\n")
                aspects = item.get('aspects') or []
                if aspects:
                    bib_md.append('\n**Specific Aspects:**\n')
                    bib_md.extend([f'- {aspect}\n' for aspect in aspects])
                bib_md.append('\n---\n')
            zf.writestr(f'{root}/bibliography.md', ''.join(bib_md))

            zf.writestr(f'{root}/world_bible.md', build_world_bible(data))
            zf.writestr(f'{root}/world_bible.html', build_world_bible_html(data))
            zf.writestr(f'{root}/indexes/collection_index.md', build_collection_index(data))
            zf.writestr(f'{root}/indexes/relationship_index.json', json.dumps(build_relationship_index(data), indent=2, ensure_ascii=False))
            zf.writestr(f'{root}/indexes/export_manifest.json', json.dumps(build_export_manifest(data), indent=2, ensure_ascii=False))

        buffer.seek(0)
        return send_file(
            buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f"{safe_slug(project_name)}_export.zip",
        )

    return app


def init_db() -> None:
    conn = get_connection()
    conn.executescript(
        '''
        PRAGMA foreign_keys = ON;

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
        '''
    )
    conn.commit()
    conn.close()


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def validate_collection(collection: str) -> None:
    if collection not in COLLECTIONS:
        raise ValueError(f'Unknown collection: {collection}')


def load_meta(conn: sqlite3.Connection) -> dict[str, Any]:
    rows = conn.execute('SELECT key, value FROM meta').fetchall()
    meta: dict[str, Any] = {}
    for row in rows:
        try:
            meta[row['key']] = json.loads(row['value'])
        except json.JSONDecodeError:
            meta[row['key']] = row['value']
    return meta


def save_meta(conn: sqlite3.Connection, meta: dict[str, Any]) -> None:
    for key, value in meta.items():
        conn.execute(
            'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            (key, json.dumps(value, ensure_ascii=False)),
        )


def load_collection(conn: sqlite3.Connection, collection: str) -> list[dict[str, Any]]:
    rows = conn.execute(
        'SELECT data_json FROM entries WHERE collection_name = ? ORDER BY updated_at DESC, created_at DESC',
        (collection,),
    ).fetchall()
    items: list[dict[str, Any]] = []
    for row in rows:
        try:
            items.append(json.loads(row['data_json']))
        except json.JSONDecodeError:
            continue
    return items


def load_entry(conn: sqlite3.Connection, collection: str, entry_id: str) -> dict[str, Any] | None:
    row = conn.execute(
        'SELECT data_json FROM entries WHERE collection_name = ? AND id = ?',
        (collection, entry_id),
    ).fetchone()
    if row is None:
        return None
    return json.loads(row['data_json'])


def save_entry(conn: sqlite3.Connection, collection: str, entry: dict[str, Any]) -> None:
    created_at = entry.get('createdAt') or now_iso()
    updated_at = entry.get('updatedAt') or now_iso()
    conn.execute(
        '''
        INSERT INTO entries (id, collection_name, data_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(collection_name, id)
        DO UPDATE SET data_json = excluded.data_json, updated_at = excluded.updated_at
        ''',
        (
            entry['id'],
            collection,
            json.dumps(entry, ensure_ascii=False),
            created_at,
            updated_at,
        ),
    )


def strip_html(value: str) -> str:
    return re.sub(r'<[^>]+>', '', value or '')


def csv_escape(value: Any) -> str:
    text = str(value or '').replace('"', '""')
    return f'"{text}"'


def build_readme(data: dict[str, Any]) -> str:
    meta = data.get('meta', {})
    lines = [
        f"# {meta.get('projectName') or 'StoryAtlas Project'}\n",
        f"**Genre:** {meta.get('genre') or 'Unspecified'}\n",
        f"**Description:** {meta.get('description') or 'No description yet.'}\n\n",
        '## Included Data\n',
    ]
    for collection in COLLECTIONS:
        lines.append(f"- **{collection}**: {len(data.get(collection, []))}\n")
    lines.append('\nExport generated by the local StoryAtlas app.\n')
    return ''.join(lines)


def entry_to_markdown(collection: str, item: dict[str, Any]) -> str:
    title = item.get('name') or item.get('title') or item.get('id') or 'Untitled'
    lines = [f'# {title}\n\n', f'_Collection: {collection}_\n\n']
    infobox_fields = []
    for key in ['status', 'type', 'role', 'arc', 'pov', 'date', 'creator', 'linkedChapter']:
        if item.get(key):
            infobox_fields.append(f'- **{key}:** {item.get(key)}')
    if infobox_fields:
        lines.append('## Quick Info\n')
        lines.extend([f'{row}\n' for row in infobox_fields])
        lines.append('\n')

    for key, value in item.items():
        if key in {'id', 'createdAt', 'updatedAt'}:
            continue
        if value in ('', None, [], {}):
            continue
        if isinstance(value, list):
            lines.append(f'## {key}\n')
            for entry in value:
                if isinstance(entry, dict):
                    lines.append(f'- {json.dumps(entry, ensure_ascii=False)}\n')
                else:
                    lines.append(f'- {entry}\n')
            lines.append('\n')
        elif isinstance(value, dict):
            lines.append(f'## {key}\n')
            for sub_key, sub_value in value.items():
                lines.append(f'- **{sub_key}:** {sub_value}\n')
            lines.append('\n')
        else:
            lines.append(f'## {key}\n{strip_html(str(value))}\n\n')
    return ''.join(lines)


def first_text(item: dict[str, Any], keys: list[str]) -> str:
    for key in keys:
        value = item.get(key)
        if value:
            return strip_html(str(value)).strip()
    return ''


def build_collection_index(data: dict[str, Any]) -> str:
    lines = ['# Collection Index\n\n']
    for collection in COLLECTIONS:
        items = data.get(collection, [])
        lines.append(f'## {collection} ({len(items)})\n')
        if not items:
            lines.append('- No entries yet\n\n')
            continue
        for item in items[:200]:
            title = item.get('name') or item.get('title') or item.get('id') or 'Untitled'
            subtitle = first_text(item, ['overview', 'synopsis', 'description', 'influence', 'storyNotes'])
            if subtitle:
                lines.append(f'- **{title}** — {subtitle[:140]}\n')
            else:
                lines.append(f'- **{title}**\n')
        lines.append('\n')
    return ''.join(lines)


def build_relationship_index(data: dict[str, Any]) -> list[dict[str, Any]]:
    edges: list[dict[str, Any]] = []
    for collection in ['characters', 'factions']:
        for item in data.get(collection, []):
            source = item.get('name') or item.get('title') or item.get('id') or 'Untitled'
            rel_pool = []
            if isinstance(item.get('relationships'), list):
                rel_pool.extend(item.get('relationships') or [])
            if isinstance(item.get('members'), list):
                rel_pool.extend(item.get('members') or [])
            for rel in rel_pool:
                if isinstance(rel, dict) and any(rel.values()):
                    edges.append({
                        'source': source,
                        'collection': collection,
                        'target': rel.get('name', ''),
                        'type': rel.get('type', ''),
                        'description': rel.get('desc', ''),
                    })
            for tag_key, rel_type in [('allies', 'ally'), ('enemies', 'enemy'), ('relatedEntries', 'related')]:
                for target in item.get(tag_key, []) or []:
                    edges.append({
                        'source': source,
                        'collection': collection,
                        'target': target,
                        'type': rel_type,
                        'description': '',
                    })
    return edges


def build_export_manifest(data: dict[str, Any]) -> dict[str, Any]:
    meta = data.get('meta', {})
    return {
        'projectName': meta.get('projectName') or 'StoryAtlas Project',
        'genre': meta.get('genre') or '',
        'description': meta.get('description') or '',
        'generatedAt': now_iso(),
        'counts': {collection: len(data.get(collection, [])) for collection in COLLECTIONS},
        'totalEntries': sum(len(data.get(collection, [])) for collection in COLLECTIONS),
    }


def build_world_bible(data: dict[str, Any]) -> str:
    meta = data.get('meta', {})
    project = meta.get('projectName') or 'StoryAtlas Project'
    lines = [
        f'# {project} — World Bible\n\n',
        f"**Genre:** {meta.get('genre') or 'Unspecified'}\n\n",
        f"**Description:** {meta.get('description') or 'No description yet.'}\n\n",
    ]

    def add_section(title: str, collection: str, fields: list[str], limit: int = 12) -> None:
        items = data.get(collection, [])
        lines.append(f'## {title}\n\n')
        if not items:
            lines.append('No entries yet.\n\n')
            return
        for item in items[:limit]:
            name = item.get('name') or item.get('title') or item.get('id') or 'Untitled'
            lines.append(f'### {name}\n')
            for field in fields:
                value = item.get(field)
                if not value:
                    continue
                if isinstance(value, list):
                    preview = ', '.join(str(v) for v in value[:6])
                else:
                    preview = strip_html(str(value)).strip()
                if preview:
                    lines.append(f'- **{field}:** {preview[:320]}\n')
            lines.append('\n')

    add_section('Core Characters', 'characters', ['role', 'affiliation', 'powerTier', 'personality', 'motivations', 'storyNotes'])
    add_section('Important Locations', 'locations', ['type', 'region', 'controlledBy', 'overview', 'storySignificance'])
    add_section('Factions', 'factions', ['type', 'leader', 'territory', 'overview', 'ideology', 'goals'])
    add_section('Power Systems', 'systems', ['type', 'overview', 'mechanics', 'costs', 'counters'])
    add_section('Lore & Concepts', 'lore', ['category', 'overview', 'description'])
    add_section('Plot Arcs', 'plots', ['type', 'status', 'synopsis', 'conflict', 'resolution'])
    add_section('Timeline Highlights', 'timelineEvents', ['date', 'type', 'scale', 'overview'], limit=20)
    add_section('Bibliography & Influences', 'bibliography', ['type', 'creator', 'influence', 'aspects'])
    return ''.join(lines)


def build_world_bible_html(data: dict[str, Any]) -> str:
    md = build_world_bible(data)
    safe = md.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    safe = re.sub(r'^### (.*)$', r'<h3>\1</h3>', safe, flags=re.MULTILINE)
    safe = re.sub(r'^## (.*)$', r'<h2>\1</h2>', safe, flags=re.MULTILINE)
    safe = re.sub(r'^# (.*)$', r'<h1>\1</h1>', safe, flags=re.MULTILINE)
    safe = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', safe)
    blocks: list[str] = []
    for block in safe.split('\n\n'):
        if not block.strip():
            continue
        if block.startswith('<h'):
            blocks.append(block)
        elif block.strip().startswith('- '):
            items = ''.join(f'<li>{line[2:]}</li>' for line in block.splitlines() if line.startswith('- '))
            blocks.append(f'<ul>{items}</ul>')
        else:
            blocks.append(f'<p>{block.replace(chr(10), "<br>")}</p>')
    title = data.get('meta', {}).get('projectName', 'World Bible')
    return f"<!doctype html><html><head><meta charset='utf-8'><title>{title}</title><style>body{{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;line-height:1.6;color:#111}}h1,h2,h3{{line-height:1.2}}ul{{padding-left:20px}}</style></head><body>{''.join(blocks)}</body></html>"


app = create_app()

if __name__ == '__main__':
    app.run(debug=True)
