"""Exact reversible UI amendment for historical publication checks.

Historical content receipts and course.json retain their original build identity.
These checks reconstruct ONLY the two reviewed presentation deltas, byte for byte;
all teaching, model, storage and other runtime bytes are still checked normally.
The current presentation has its own SHA256 map and real-browser gate. An unknown
byte change is never normalized and must invalidate the historical checks.
"""
import hashlib
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from public_navigator_preservation import restore_public_navigator

PATCH = Path(__file__).with_name('first-viewport-amendment.json')
BASE = {
    'assets/engine.js': '85d395dbfb66f8a1409f1d2f930fbb6f742c0085239d34d18ec2a901f3bd6492',
    'assets/style.css': '2cd55ecb80028ae9160028c59bf5120047801e9d05a1f86a885d2abb0d0b577b',
}
def sha(raw):
    return hashlib.sha256(raw).hexdigest()

def before_quantity_check(path, raw):
    """Recover the exact runtime immediately preceding the numeric self-check."""
    if path.name != 'engine.js' or path.parent.name != 'assets':
        return raw
    amendment = json.loads(PATCH.with_name('quantity-amendment.json').read_text())
    if sha(raw) != amendment['afterSha256']:
        return raw
    start, end, call = (amendment[key].encode() for key in ('start', 'end', 'call'))
    assert all(raw.count(part) == 1 for part in (start, end, call))
    first, last = raw.index(start), raw.index(end) + len(end)
    restored = (raw[:first] + raw[last:]).replace(call, b'', 1)
    assert sha(restored) == amendment['beforeSha256']
    return restored


def advanced8_binding_bytes(path):
    """Use the presentation-layer runtime that the №824–841 receipt reviewed."""
    path = Path(path)
    raw = path.read_bytes()
    if path.name == 'index.html':
        return historical_bytes(path, raw)
    if path.parts[-3:] == ('tools', 'geometry-textbook', 'advanced8_release.py'):
        gate = json.loads(PATCH.with_name('quantity-amendment.json').read_text())['releaseGate']
        if sha(raw) == gate['afterSha256']:
            for edit in reversed(gate['changes']):
                old, new = edit['before'].encode(), edit['after'].encode()
                assert raw.count(new) == 1
                raw = raw.replace(new, old, 1)
            assert sha(raw) == gate['beforeSha256']
        return raw
    return before_quantity_check(path, raw)


def historical_bytes(path, raw=None):
    path = Path(path)
    raw = path.read_bytes() if raw is None else raw
    raw = before_quantity_check(path, raw)
    if path.name == 'index.html':
        raw = restore_public_navigator('geometry-course/textbook/index.html', raw)
        # The new independently loaded supplement has its own content and browser
        # checks. Undo precisely its two entry edits for older source receipts.
        if sha(raw) == '215296704e24b496cc6ab9b6c48c243d04ddb19becc0129c5d63565393b709cc':
            restored = raw.replace(b'<script src="assets/additional-lessons.js"></script>\n', b'', 1)
            restored = restored.replace(b'}).then(GeometryAdditionalLessons.forCourse).then(bundle=>{',
                                        b'}).then(bundle=>{', 1)
            assert sha(restored) == 'c26e8f026e5560c39bd0f9a841c0458b7ff4d260c038a42b4ccb2ed7a060ec2e'
            raw = restored
        # Restore the textbook entry as it was reviewed before the three-card
        # construction supplement. Historical receipts cover the original course.
        if sha(raw) == 'c26e8f026e5560c39bd0f9a841c0458b7ff4d260c038a42b4ccb2ed7a060ec2e':
            restored = raw.replace(b'<script src="/assets/geometry-step-views.js"></script>\n', b'', 1)
            restored = restored.replace(b'GeometryStepViews.prepare(bundle)', b'bundle', 1)
            assert sha(restored) == '098ee5017758a8fb892af5da256cbc945ba4002cbfd82b1a0bcbd4c339f01804', 'Invalid step-view entry amendment'
            raw = restored
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
