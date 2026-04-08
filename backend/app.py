from __future__ import annotations

import io
import json
import logging
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
BACKUP_DIR = BASE_DIR / 'backups'

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger('storyatlas')

COLLECTIONS = [
    'characters', 'locations', 'factions', 'items', 'lore', 'history',
    'systems', 'cultures', 'languages', 'plots', 'chapters', 'scenes',
    'volumes', 'timelineEvents', 'manuscripts', 'bibliography',
    'combatSequences', 'themes', 'foreshadowing', 'dialogueVoices',
    'panels', 'publishing',
]

VALID_META_KEYS = {
    'projectName', 'genre', 'format', 'description', 'author',
    'scratchpad', 'canvasNotes', 'series', 'outlineMethod',
    'targetWordCount', 'dailyWordGoal',
}

MAX_ENTRY_FIELD_LENGTH = 100_000
MAX_NAME_LENGTH = 500


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


def backup_current_data(conn: sqlite3.Connection) -> str | None:
    """Create a JSON backup of the current database before destructive operations."""
    try:
        BACKUP_DIR.mkdir(exist_ok=True)
        data: dict[str, Any] = {'meta': load_meta(conn)}
        for collection in COLLECTIONS:
            data[collection] = load_collection(conn, collection)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = BACKUP_DIR / f'backup_{timestamp}.json'
        backup_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
        logger.info('Auto-backup created: %s', backup_path.name)
        # Prune old backups (keep last 10)
        backups = sorted(BACKUP_DIR.glob('backup_*.json'), key=lambda p: p.stat().st_mtime, reverse=True)
        for old in backups[10:]:
            old.unlink()
            logger.info('Pruned old backup: %s', old.name)
        return str(backup_path)
    except Exception as exc:
        logger.error('Failed to create backup: %s', exc)
        return None


def import_payload_into_db(conn: sqlite3.Connection, payload: dict[str, Any]) -> None:
    backup_current_data(conn)
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
    secret = os.environ.get('WORLDFORGE_SECRET_KEY')
    if not secret:
        secret = os.urandom(32).hex()
        logger.warning('WORLDFORGE_SECRET_KEY not set — using random key (sessions will not persist across restarts)')
    app.config['SECRET_KEY'] = secret
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB upload limit
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
        try:
            current = load_meta(conn)
            current.update(payload)
            save_meta(conn, current)
            conn.commit()
            logger.info('Metadata updated: keys=%s', list(payload.keys()))
        except Exception as exc:
            conn.close()
            logger.error('Failed to update metadata: %s', exc)
            return jsonify({'error': 'Failed to save metadata'}), 500
        conn.close()
        return jsonify(current)

    @app.route('/api/<collection>', methods=['POST'])
    def api_create(collection: str):
        try:
            validate_collection(collection)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
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

        # Validate field lengths
        name_val = entry.get('name') or entry.get('title') or ''
        if len(str(name_val)) > MAX_NAME_LENGTH:
            return jsonify({'error': f'Name/title exceeds {MAX_NAME_LENGTH} characters'}), 400
        for key, val in entry.items():
            if isinstance(val, str) and len(val) > MAX_ENTRY_FIELD_LENGTH:
                return jsonify({'error': f'Field "{key}" exceeds maximum length'}), 400

        conn = get_connection()
        try:
            save_entry(conn, collection, entry)
            conn.commit()
            logger.info('Created entry in %s: id=%s', collection, entry_id)
        except Exception as exc:
            conn.close()
            logger.error('Failed to create entry: %s', exc)
            return jsonify({'error': 'Failed to create entry'}), 500
        conn.close()
        return jsonify(entry), 201

    @app.route('/api/<collection>/<entry_id>', methods=['PUT'])
    def api_update(collection: str, entry_id: str):
        try:
            validate_collection(collection)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
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

        # Validate field lengths
        for key, val in existing.items():
            if isinstance(val, str) and len(val) > MAX_ENTRY_FIELD_LENGTH:
                conn.close()
                return jsonify({'error': f'Field "{key}" exceeds maximum length'}), 400

        try:
            # Save old version before updating
            old = load_entry(conn, collection, entry_id)
            if old:
                save_version(conn, collection, entry_id, old)
            save_entry(conn, collection, existing)
            conn.commit()
            logger.info('Updated entry in %s: id=%s', collection, entry_id)
        except Exception as exc:
            conn.close()
            logger.error('Failed to update entry: %s', exc)
            return jsonify({'error': 'Failed to update entry'}), 500
        conn.close()
        return jsonify(existing)

    @app.route('/api/<collection>/<entry_id>', methods=['DELETE'])
    def api_delete(collection: str, entry_id: str):
        try:
            validate_collection(collection)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
        conn = get_connection()
        try:
            conn.execute('DELETE FROM entries WHERE collection_name = ? AND id = ?', (collection, entry_id))
            conn.commit()
            logger.info('Deleted entry from %s: id=%s', collection, entry_id)
        except Exception as exc:
            conn.close()
            logger.error('Failed to delete entry: %s', exc)
            return jsonify({'error': 'Failed to delete entry'}), 500
        conn.close()
        return jsonify({'ok': True})

    @app.route('/api/health')
    def api_health():
        conn = get_connection()
        corrupted = 0
        total = 0
        for collection in COLLECTIONS:
            rows = conn.execute(
                'SELECT data_json FROM entries WHERE collection_name = ?', (collection,)
            ).fetchall()
            for row in rows:
                total += 1
                try:
                    json.loads(row['data_json'])
                except json.JSONDecodeError:
                    corrupted += 1
        conn.close()
        return jsonify({
            'status': 'ok',
            'totalEntries': total,
            'corruptedEntries': corrupted,
        })

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
        try:
            import_payload_into_db(conn, payload)
            conn.commit()
            logger.info('Import (JSON) completed successfully')
        except Exception as exc:
            conn.close()
            logger.error('Import (JSON) failed: %s', exc)
            return jsonify({'error': 'Import failed'}), 500
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
        try:
            import_payload_into_db(conn, payload)
            conn.commit()
            logger.info('Import (file) completed successfully')
        except Exception as exc:
            conn.close()
            logger.error('Import (file) failed: %s', exc)
            return jsonify({'error': 'Import failed'}), 500
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
                status_val = item.get('status', '')
                ch_link = item.get('linkedChapter', 'N/A')
                ms_txt = (
                    f"# {title}\n\nStatus: {status_val}\n"
                    f"Linked Chapter: {ch_link}\n\n---\n\n{plain}\n"
                )
                zf.writestr(
                    f'{root}/manuscripts/{slug}.txt', ms_txt,
                )
                safe_content = (
                    (item.get('content', '') or '')
                    .replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                )
                safe_title = (
                    title.replace('&', '&amp;')
                    .replace('<', '&lt;')
                    .replace('>', '&gt;')
                )
                ms_html = (
                    f"<!doctype html><html><head>"
                    f"<meta charset='utf-8'>"
                    f"<title>{safe_title}</title></head>"
                    f"<body><pre>{safe_content}</pre>"
                    f"</body></html>"
                )
                zf.writestr(
                    f'{root}/manuscripts/{slug}.html', ms_html,
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
            rel_json = json.dumps(
                build_relationship_index(data), indent=2,
                ensure_ascii=False,
            )
            zf.writestr(
                f'{root}/indexes/relationship_index.json', rel_json,
            )
            manifest_json = json.dumps(
                build_export_manifest(data), indent=2,
                ensure_ascii=False,
            )
            zf.writestr(
                f'{root}/indexes/export_manifest.json', manifest_json,
            )

        buffer.seek(0)
        return send_file(
            buffer,
            mimetype='application/zip',
            as_attachment=True,
            download_name=f"{safe_slug(project_name)}_export.zip",
        )

    # ─── Version History ──────────────────────────────────────────
    @app.route('/api/<collection>/<entry_id>/history')
    def api_entry_history(collection: str, entry_id: str):
        try:
            validate_collection(collection)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
        conn = get_connection()
        rows = conn.execute(
            'SELECT version_id, data_json, created_at FROM entry_versions '
            'WHERE entry_id = ? AND collection_name = ? ORDER BY created_at DESC LIMIT 50',
            (entry_id, collection),
        ).fetchall()
        conn.close()
        versions = []
        for row in rows:
            try:
                versions.append({
                    'versionId': row['version_id'],
                    'data': json.loads(row['data_json']),
                    'createdAt': row['created_at'],
                })
            except json.JSONDecodeError:
                continue
        return jsonify(versions)

    @app.route('/api/<collection>/<entry_id>/restore/<int:version_id>', methods=['POST'])
    def api_restore_version(collection: str, entry_id: str, version_id: int):
        try:
            validate_collection(collection)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
        conn = get_connection()
        row = conn.execute(
            'SELECT data_json FROM entry_versions WHERE version_id = ? AND entry_id = ? AND collection_name = ?',
            (version_id, entry_id, collection),
        ).fetchone()
        if not row:
            conn.close()
            return jsonify({'error': 'Version not found'}), 404
        entry = json.loads(row['data_json'])
        entry['id'] = entry_id
        entry['updatedAt'] = now_iso()
        # Save current as version before restoring
        existing = load_entry(conn, collection, entry_id)
        if existing:
            save_version(conn, collection, entry_id, existing)
        save_entry(conn, collection, entry)
        conn.commit()
        logger.info('Restored version %d for %s/%s', version_id, collection, entry_id)
        conn.close()
        return jsonify(entry)

    # ─── Tags ────────────────────────────────────────────────────
    @app.route('/api/tags')
    def api_tags():
        conn = get_connection()
        all_tags: set[str] = set()
        for collection in COLLECTIONS:
            items = load_collection(conn, collection)
            for item in items:
                for key in ['aliases', 'allies', 'enemies', 'tags', '_tags']:
                    val = item.get(key)
                    if isinstance(val, str):
                        for tag in val.split(','):
                            t = tag.strip()
                            if t:
                                all_tags.add(t)
                    elif isinstance(val, list):
                        for tag in val:
                            if isinstance(tag, str) and tag.strip():
                                all_tags.add(tag.strip())
        conn.close()
        return jsonify(sorted(all_tags))

    # ─── Bulk Operations ─────────────────────────────────────────
    @app.route('/api/bulk/delete', methods=['POST'])
    def api_bulk_delete():
        payload = request.get_json(silent=True) or {}
        items = payload.get('items', [])
        if not isinstance(items, list) or not items:
            return jsonify({'error': 'No items specified'}), 400
        conn = get_connection()
        deleted = 0
        for item in items:
            col = item.get('collection')
            eid = item.get('id')
            if col and eid:
                try:
                    validate_collection(col)
                    conn.execute('DELETE FROM entries WHERE collection_name = ? AND id = ?', (col, eid))
                    deleted += 1
                except ValueError:
                    continue
        conn.commit()
        logger.info('Bulk deleted %d entries', deleted)
        conn.close()
        return jsonify({'ok': True, 'deleted': deleted})

    @app.route('/api/bulk/tag', methods=['POST'])
    def api_bulk_tag():
        payload = request.get_json(silent=True) or {}
        items = payload.get('items', [])
        tag = payload.get('tag', '').strip()
        if not tag or not items:
            return jsonify({'error': 'Tag and items required'}), 400
        conn = get_connection()
        updated = 0
        for item in items:
            col = item.get('collection')
            eid = item.get('id')
            if not col or not eid:
                continue
            try:
                validate_collection(col)
            except ValueError:
                continue
            entry = load_entry(conn, collection=col, entry_id=eid)
            if not entry:
                continue
            existing_tags = entry.get('_tags', '')
            if isinstance(existing_tags, str):
                tags_list = [t.strip() for t in existing_tags.split(',') if t.strip()]
            elif isinstance(existing_tags, list):
                tags_list = existing_tags
            else:
                tags_list = []
            if tag not in tags_list:
                tags_list.append(tag)
            entry['_tags'] = ','.join(tags_list)
            entry['updatedAt'] = now_iso()
            save_entry(conn, col, entry)
            updated += 1
        conn.commit()
        logger.info('Bulk tagged %d entries with "%s"', updated, tag)
        conn.close()
        return jsonify({'ok': True, 'updated': updated})

    @app.route('/api/bulk/status', methods=['POST'])
    def api_bulk_status():
        payload = request.get_json(silent=True) or {}
        items = payload.get('items', [])
        status = payload.get('status', '').strip()
        if not status or not items:
            return jsonify({'error': 'Status and items required'}), 400
        conn = get_connection()
        updated = 0
        for item in items:
            col = item.get('collection')
            eid = item.get('id')
            if not col or not eid:
                continue
            try:
                validate_collection(col)
            except ValueError:
                continue
            entry = load_entry(conn, collection=col, entry_id=eid)
            if not entry:
                continue
            entry['_status'] = status
            entry['updatedAt'] = now_iso()
            save_entry(conn, col, entry)
            updated += 1
        conn.commit()
        logger.info('Bulk status changed %d entries to "%s"', updated, status)
        conn.close()
        return jsonify({'ok': True, 'updated': updated})

    # ─── Search ──────────────────────────────────────────────────
    @app.route('/api/search')
    def api_search():
        q = (request.args.get('q') or '').strip().lower()
        collection_filter = request.args.get('collection', '')
        status_filter = request.args.get('status', '')
        tag_filter = request.args.get('tag', '')
        sort_by = request.args.get('sort', 'updated')  # updated, name, completeness
        limit = min(int(request.args.get('limit', '50')), 200)

        conn = get_connection()
        results: list[dict[str, Any]] = []
        if collection_filter and collection_filter in COLLECTIONS:
            search_collections = [collection_filter]
        else:
            search_collections = COLLECTIONS

        for col in search_collections:
            for item in load_collection(conn, col):
                # Text search
                if q:
                    text_blob = ' '.join(
                        str(v) for v in item.values()
                        if isinstance(v, str)
                    ).lower()
                    if q not in text_blob:
                        continue
                # Status filter
                if status_filter and item.get('_status', 'draft') != status_filter:
                    continue
                # Tag filter
                if tag_filter:
                    tags_val = item.get('_tags', '')
                    if isinstance(tags_val, str):
                        tag_list = tags_val.split(',')
                    elif isinstance(tags_val, list):
                        tag_list = tags_val
                    else:
                        tag_list = []
                    if tag_filter not in [t.strip() for t in tag_list]:
                        continue
                item['_collection'] = col
                results.append(item)

        # Sort
        if sort_by == 'name':
            results.sort(key=lambda x: (x.get('name') or x.get('title') or '').lower())
        elif sort_by == 'created':
            results.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        else:
            results.sort(key=lambda x: x.get('updatedAt', ''), reverse=True)

        conn.close()
        return jsonify(results[:limit])

    # ─── Selective Export ─────────────────────────────────────────
    @app.route('/api/export/selective', methods=['POST'])
    def api_export_selective():
        payload = request.get_json(silent=True) or {}
        selected_collections = payload.get('collections', COLLECTIONS)
        fmt = payload.get('format', 'json')  # json or csv

        conn = get_connection()
        data: dict[str, Any] = {'meta': load_meta(conn)}
        for col in selected_collections:
            if col in COLLECTIONS:
                data[col] = load_collection(conn, col)
        conn.close()

        if fmt == 'csv':
            buffer = io.StringIO()
            buffer.write('collection,id,name,status,createdAt,updatedAt,fields_json\n')
            for col in selected_collections:
                for item in data.get(col, []):
                    row = [
                        csv_escape(col),
                        csv_escape(item.get('id', '')),
                        csv_escape(item.get('name') or item.get('title', '')),
                        csv_escape(item.get('status', '')),
                        csv_escape(item.get('createdAt', '')),
                        csv_escape(item.get('updatedAt', '')),
                        csv_escape(json.dumps(
                            {k: v for k, v in item.items()
                             if k not in ('id', 'name', 'title',
                                          'status', 'createdAt',
                                          'updatedAt')},
                            ensure_ascii=False,
                        )),
                    ]
                    buffer.write(','.join(row) + '\n')
            return Response(
                buffer.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=storyatlas_export.csv'},
            )

        return Response(
            json.dumps(data, indent=2, ensure_ascii=False),
            mimetype='application/json',
            headers={'Content-Disposition': 'attachment; filename=storyatlas_selective.json'},
        )

    # ─── Comments ────────────────────────────────────────────────
    @app.route('/api/<collection>/<entry_id>/comments')
    def api_get_comments(collection: str, entry_id: str):
        try:
            validate_collection(collection)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
        conn = get_connection()
        rows = conn.execute(
            'SELECT data_json FROM comments WHERE collection_name = ? AND entry_id = ? ORDER BY created_at DESC',
            (collection, entry_id),
        ).fetchall()
        conn.close()
        comments = []
        for row in rows:
            try:
                comments.append(json.loads(row['data_json']))
            except json.JSONDecodeError:
                continue
        return jsonify(comments)

    @app.route('/api/<collection>/<entry_id>/comments', methods=['POST'])
    def api_add_comment(collection: str, entry_id: str):
        try:
            validate_collection(collection)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400
        payload = request.get_json(silent=True) or {}
        content = (payload.get('content') or '').strip()
        if not content:
            return jsonify({'error': 'Comment cannot be empty'}), 400
        comment = {
            'id': uuid4().hex[:12],
            'entryId': entry_id,
            'collection': collection,
            'content': content,
            'author': payload.get('author', 'Anonymous'),
            'createdAt': now_iso(),
        }
        conn = get_connection()
        conn.execute(
            'INSERT INTO comments (id, collection_name, entry_id, data_json, created_at) VALUES (?, ?, ?, ?, ?)',
            (comment['id'], collection, entry_id, json.dumps(comment, ensure_ascii=False), comment['createdAt']),
        )
        conn.commit()
        logger.info('Comment added on %s/%s', collection, entry_id)
        conn.close()
        return jsonify(comment), 201

    @app.route('/api/<collection>/<entry_id>/comments/<comment_id>', methods=['DELETE'])
    def api_delete_comment(collection: str, entry_id: str, comment_id: str):
        conn = get_connection()
        conn.execute('DELETE FROM comments WHERE id = ?', (comment_id,))
        conn.commit()
        conn.close()
        return jsonify({'ok': True})

    # ─── Share Links ─────────────────────────────────────────────
    @app.route('/api/share', methods=['POST'])
    def api_create_share():
        token = uuid4().hex[:16]
        conn = get_connection()
        data_snapshot = {'meta': load_meta(conn)}
        for col in COLLECTIONS:
            data_snapshot[col] = load_collection(conn, col)
        conn.execute(
            'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            (f'_share_{token}', json.dumps(data_snapshot, ensure_ascii=False)),
        )
        conn.commit()
        conn.close()
        logger.info('Share link created: token=%s', token)
        return jsonify({'token': token})

    @app.route('/api/shared/<token>')
    def api_get_shared(token: str):
        conn = get_connection()
        row = conn.execute('SELECT value FROM meta WHERE key = ?', (f'_share_{token}',)).fetchone()
        conn.close()
        if not row:
            return jsonify({'error': 'Share link not found or expired'}), 404
        try:
            return jsonify(json.loads(row['value']))
        except json.JSONDecodeError:
            return jsonify({'error': 'Corrupted share data'}), 500

    return app


def init_db() -> None:
    conn = get_connection()
    conn.executescript(
        '''
        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;

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

        CREATE TABLE IF NOT EXISTS entry_versions (
            version_id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id TEXT NOT NULL,
            collection_name TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS comments (
            id TEXT PRIMARY KEY,
            collection_name TEXT NOT NULL,
            entry_id TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL
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
            logger.warning('Corrupted entry in collection=%s (skipped)', collection)
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


def save_version(conn: sqlite3.Connection, collection: str, entry_id: str, entry: dict[str, Any]) -> None:
    conn.execute(
        'INSERT INTO entry_versions (entry_id, collection_name, data_json, created_at) VALUES (?, ?, ?, ?)',
        (entry_id, collection, json.dumps(entry, ensure_ascii=False), now_iso()),
    )
    # Keep only last 30 versions per entry
    conn.execute(
        'DELETE FROM entry_versions WHERE entry_id = ? AND collection_name = ? '
        'AND version_id NOT IN ('
        'SELECT version_id FROM entry_versions '
        'WHERE entry_id = ? AND collection_name = ? '
        'ORDER BY created_at DESC LIMIT 30)',
        (entry_id, collection, entry_id, collection),
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

    add_section(
        'Core Characters', 'characters',
        ['role', 'affiliation', 'powerTier',
         'personality', 'motivations', 'storyNotes'],
    )
    add_section(
        'Important Locations', 'locations',
        ['type', 'region', 'controlledBy',
         'overview', 'storySignificance'],
    )
    add_section(
        'Factions', 'factions',
        ['type', 'leader', 'territory',
         'overview', 'ideology', 'goals'],
    )
    add_section(
        'Power Systems', 'systems',
        ['type', 'overview', 'mechanics', 'costs', 'counters'],
    )
    add_section(
        'Lore & Concepts', 'lore',
        ['category', 'overview', 'description'],
    )
    add_section(
        'Plot Arcs', 'plots',
        ['type', 'status', 'synopsis',
         'conflict', 'resolution'],
    )
    add_section(
        'Timeline Highlights', 'timelineEvents',
        ['date', 'type', 'scale', 'overview'], limit=20,
    )
    add_section(
        'Bibliography & Influences', 'bibliography',
        ['type', 'creator', 'influence', 'aspects'],
    )
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
    css = (
        "body{font-family:Arial,sans-serif;max-width:900px;"
        "margin:40px auto;padding:0 20px;line-height:1.6;"
        "color:#111}h1,h2,h3{line-height:1.2}"
        "ul{padding-left:20px}"
    )
    body = ''.join(blocks)
    return (
        f"<!doctype html><html><head>"
        f"<meta charset='utf-8'><title>{title}</title>"
        f"<style>{css}</style></head>"
        f"<body>{body}</body></html>"
    )


app = create_app()

if __name__ == '__main__':
    app.run(debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true')
