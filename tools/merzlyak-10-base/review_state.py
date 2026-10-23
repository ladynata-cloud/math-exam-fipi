"""Verify a draft state or an explicitly recorded content-review transition.

This helper never changes cards or creates review evidence. The independent
audit-content-reviews gate additionally verifies the underlying reviewer reports.
"""
import copy
import datetime
import hashlib
import json
from functools import lru_cache
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTENT_KEYS = ['id', 'kind', 'title', 'source', 'statement', 'visualization',
                'help', 'steps', 'answer']
SERIALIZATION = 'json-utf8-ensure-ascii-false-indent-2-final-lf'


def serialized(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode('utf-8')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def content_sha(value):
    content = {key: value[key] for key in CONTENT_KEYS}
    return sha(json.dumps(content, ensure_ascii=False, sort_keys=True,
                          separators=(',', ':')).encode('utf-8'))


@lru_cache(maxsize=1)
def ledger_entries():
    path = ROOT / 'tools/merzlyak-10-base/content-review-ledger.json'
    ledger = json.loads(path.read_text())
    assert ledger['schemaVersion'] == 1, 'unknown review ledger schema'
    assert ledger['contentKeys'] == CONTENT_KEYS, 'unexpected content keys'
    assert ledger['allowedChangedKeys'] == ['status', 'review'], 'unsafe transition'
    assert ledger['serialization'] == SERIALIZATION, 'unknown serialization'
    rows = ledger['entries']
    entries = {row['lessonId']: row for row in rows}
    assert len(entries) == len(rows), 'duplicate ledger lesson identity'
    assert len({row['path'] for row in rows}) == len(rows), 'duplicate ledger path'
    return entries


def assert_review_state(lesson):
    """Accept unapproved drafts, or exact content recorded as independently reviewed."""
    expected = {'source': 'pending', 'mathematics': 'pending', 'pedagogy': 'pending'}
    if lesson['status'] == 'draft':
        assert lesson['review'] == expected, 'draft has contradictory review state'
        return True
    assert lesson['status'] == 'reviewed', 'unsupported content state'
    review = lesson['review']
    assert all(review.get(key) == 'passed' for key in expected), 'incomplete review'
    assert isinstance(review.get('reviewer'), str) and review['reviewer'].strip(), 'missing reviewer'
    assert isinstance(review.get('at'), str), 'missing review time'
    try:
        reviewed_at = datetime.datetime.fromisoformat(review['at'].replace('Z', '+00:00'))
    except ValueError as exc:
        raise AssertionError('invalid review time') from exc
    assert 'T' in review['at'] and reviewed_at.tzinfo is not None, 'review time needs timezone'
    row = ledger_entries()[lesson['id']]
    path = ROOT / row['path']
    assert path.parent == ROOT / 'stereo-course/merzlyak-10-base/lessons', 'wrong lesson path'
    assert sha(path.read_bytes()) == row['afterSha256'], 'changed reviewed file'
    assert path.read_bytes() == serialized(lesson), 'lesson differs from recorded file'
    assert row['beforeValues'] == {'status': 'draft', 'review': expected}, 'invalid prior state'
    before = copy.deepcopy(lesson)
    before.update(row['beforeValues'])
    assert sha(serialized(before)) == row['beforeSha256'], 'content changed during review transition'
    assert content_sha(lesson) == row['contentSha256'], 'changed educational content'
    return True


def matches_reviewed_hash(path, expected_sha):
    """Retain authorship-manifest hashes across a verified status-only transition."""
    path = Path(path)
    raw = path.read_bytes()
    if sha(raw) == expected_sha:
        return True
    lesson = json.loads(raw)
    assert_review_state(lesson)
    if lesson['status'] != 'reviewed':
        return False
    return ledger_entries()[lesson['id']]['beforeSha256'] == expected_sha
