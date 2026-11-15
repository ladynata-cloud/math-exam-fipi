"""Exact reversible UI amendment for historical publication checks.

Historical content receipts and course.json retain their original build identity.
These checks reconstruct ONLY the two first-viewport presentation deltas and
the separately recorded catalogue-entry delta, byte for byte; all teaching,
model, storage and other runtime bytes are still checked normally. Each UI
amendment has its own SHA256 map and real-browser gate. An unknown byte change
is never normalized and must invalidate the historical checks.
"""
import hashlib
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from public_navigator_preservation import restore_public_navigator
from search_entry_amendment import restore_search_entry

PATCH = Path(__file__).with_name('first-viewport-amendment.json')
BASE = {
    'assets/engine.js': '85d395dbfb66f8a1409f1d2f930fbb6f742c0085239d34d18ec2a901f3bd6492',
    'assets/style.css': '2cd55ecb80028ae9160028c59bf5120047801e9d05a1f86a885d2abb0d0b577b',
}
def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def historical_bytes(path, raw=None):
    path = Path(path)
    raw = path.read_bytes() if raw is None else raw
    if path.name == 'index.html':
        # Both pre-task and legitimately refreshed navigator bindings retain
        # the same historical result. The entry amendment accepts only its
        # two hash-bound forms, with and without that exact pair of includes.
        raw = restore_public_navigator('geometry-course/textbook/index.html', raw)
        raw = restore_search_entry('geometry-course/textbook/index.html', raw)
        raw = restore_public_navigator('geometry-course/textbook/index.html', raw)
    name = 'assets/' + path.name if path.parent.name == 'assets' else ''
    if name not in BASE or sha(raw) == BASE[name]:
        return raw
    patch = json.loads(PATCH.read_text())
    assert patch['baseCommit'] == '01e412d4314445366bcd4773a3789129aa7264bd'
    assert set(patch['files']) == set(BASE), 'Layout amendment exceeds two presentation files'
    item = patch['files'][name]
    assert item['beforeSha256'] == BASE[name], 'Unknown historical runtime'
    if sha(raw) != item['afterSha256']:
        return raw  # No wildcard allowance: normal historical checks reject it.
    restored = raw.decode()
    for change in reversed(item['changes']):
        assert change['after'] and restored.count(change['after']) == 1, 'Ambiguous layout delta'
        restored = restored.replace(change['after'], change['before'], 1)
    assert sha(restored.encode()) == BASE[name], 'Layout delta does not restore the entire original file'
    return restored.encode()
