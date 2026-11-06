"""Invert only the exact public navigator includes; retain all review receipts."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROLLOUT = json.loads((ROOT / 'assets/assistant/page-rollout.json').read_text())
SNIPPET = ('\n<script defer src="/assets/assistant/navigator-data.js?v=20261105-site1"></script>\n'
           '<script defer src="/assets/assistant/navigator-widget.js?v=20261105-site1"></script>\n').encode()
assert ROLLOUT['schemaVersion'] == 1
assert ROLLOUT['snippet'].encode() == SNIPPET, 'Only the exact existing deferred navigator includes may be inverted'


def restore_public_navigator(name, raw):
    row = ROLLOUT['addedPages'].get(str(name))
    if row is None or hashlib.sha256(raw).hexdigest() != row['afterSha256']:
        return raw  # Unknown bytes must still fail the existing historical gate.
    assert raw.count(SNIPPET) == 1, 'One exact navigator include pair: ' + str(name)
    restored = raw.replace(SNIPPET, b'', 1)
    assert hashlib.sha256(restored).hexdigest() == row['beforeSha256'], 'Full original document identity: ' + str(name)
    return restored
