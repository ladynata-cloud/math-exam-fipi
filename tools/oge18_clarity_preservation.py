"""Exact OGE18 source receipt; never a general UI or mathematics exception."""
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
RECEIPT = json.loads((ROOT / 'tools/fixtures/oge18-answer-model-clarity.json').read_text())
ALLOWED = frozenset({
    'trainers/oge-task18-grid.html',
    'trainers/oge-course-geometry.js',
    'trainers/oge-course-geometry.css',
})


def restore_oge18_clarity(file, raw):
    """Invert only a full recorded revision; unrelated/partial changes remain."""
    if (RECEIPT.get('schemaVersion') != 1 or
            RECEIPT.get('task') != 'docs/tasks/OGE18_ANSWER_MODEL_CLARITY_20261116.md' or
            not re.fullmatch(r'[a-f0-9]{40}', RECEIPT.get('sourceBase', '')) or
            file not in ALLOWED):
        return raw
    row = RECEIPT.get('files', {}).get(file)
    if (not row or
            not re.fullmatch(r'[a-f0-9]{64}', row.get('beforeSha256', '')) or
            not re.fullmatch(r'[a-f0-9]{64}', row.get('afterSha256', '')) or
            row['beforeSha256'] == row['afterSha256'] or
            hashlib.sha256(raw).hexdigest() != row['afterSha256']):
        return raw
    fragments = row.get('fragments')
    if not isinstance(fragments, list) or not fragments:
        return raw
    restored = raw
    for fragment in fragments:
        if (not isinstance(fragment, dict) or
                not isinstance(fragment.get('before'), str) or
                not isinstance(fragment.get('after'), str) or not fragment['after']):
            return raw
        before, after = fragment['before'].encode(), fragment['after'].encode()
        if raw.count(after) != 1 or restored.count(after) != 1:
            return raw
        restored = restored.replace(after, before, 1)
    return restored if hashlib.sha256(restored).hexdigest() == row['beforeSha256'] else raw
