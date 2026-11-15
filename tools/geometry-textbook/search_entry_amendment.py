"""Invert only the separately bound catalogue-entry UI, never a content review.

The full before document is pinned to the task's real base commit. The full
after hash and reversible changes live in a new record; existing publication
receipts and the public-navigator record are not rewritten. Unknown bytes are
returned untouched so the ordinary historical publication checks reject them.
"""
import hashlib
import json
from pathlib import Path
from public_navigator_preservation import SNIPPET

NAME = 'geometry-course/textbook/index.html'
BASE_COMMIT = '5f25f75b6e7178ad1d492c7bcb28ed9e63c97bae'
BEFORE_SHA = 'f6fe2c259cd4e65c169071760301818df1f4188ef56c880c7400c3af0fffce44'
WITHOUT_NAVIGATOR_BEFORE_SHA = '098ee5017758a8fb892af5da256cbc945ba4002cbfd82b1a0bcbd4c339f01804'
PATCH = Path(__file__).with_name('search-entry-amendment.json')


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def restore_search_entry(name, raw):
    if str(name) != NAME or sha(raw) == BEFORE_SHA:
        return raw
    patch = json.loads(PATCH.read_text())
    assert patch['schemaVersion'] == 1 and patch['baseCommit'] == BASE_COMMIT
    assert patch['task'] == 'SEARCH_ENTRY_GEOMETRY_HARMONIZATION_20261116'
    assert set(patch['files']) == {'index.html'}, 'Entry amendment is one document only'
    item = patch['files']['index.html']
    assert item['beforeSha256'] == BEFORE_SHA, 'Unknown entry predecessor'
    normalized = item['withoutNavigator']
    assert normalized['beforeSha256'] == WITHOUT_NAVIGATOR_BEFORE_SHA
    without_navigator = sha(raw) == normalized['afterSha256']
    if without_navigator:
        # The ordinary navigator binding may already have removed its exact
        # pair after this task's source commit. Reconstitute the same full
        # document before applying the one recorded UI delta.
        offset = normalized['insertionOffset']
        assert isinstance(offset, int) and 0 <= offset <= len(raw)
        full = raw[:offset] + SNIPPET + raw[offset:]
        assert sha(full) == item['afterSha256'], 'Wrong navigator-free entry representation'
    elif sha(raw) == item['afterSha256']:
        full = raw
    else:
        return raw
    restored = full.decode()
    assert item['changes'], 'Missing reversible entry delta'
    for change in reversed(item['changes']):
        assert change['after'] and restored.count(change['after']) == 1, 'Ambiguous entry delta'
        restored = restored.replace(change['after'], change['before'], 1)
    result = restored.encode()
    assert sha(result) == BEFORE_SHA, 'Entry delta must recover the entire original document'
    if without_navigator:
        assert result.count(SNIPPET) == 1
        result = result.replace(SNIPPET, b'', 1)
        assert sha(result) == WITHOUT_NAVIGATOR_BEFORE_SHA
    return result
