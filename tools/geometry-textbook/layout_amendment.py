"""Exact reversible UI amendment for historical publication checks.

Historical content receipts and course.json retain their original build identity.
These checks reconstruct ONLY the two reviewed presentation deltas, byte for byte;
all teaching, model, storage and other runtime bytes are still checked normally.
The current presentation has its own SHA256 map and real-browser gate. An unknown
byte change is never normalized and must invalidate the historical checks.
"""
import hashlib
import json
from pathlib import Path

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
