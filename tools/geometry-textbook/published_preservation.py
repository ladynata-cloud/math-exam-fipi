"""The label-only runtime amendment cannot change published teaching or work IDs.

The new oracle was read from the actual published base, not candidate output.
Historical fixtures remain intact. Permitted caption changes cover the three
presentation surfaces and fixed board adapter; every changed byte needs a
current review binding.
"""
from chapter06_extension import validate_extension, previous_inventory, restore_manifest, RECEIPT as EXTENSION
from copy import deepcopy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COURSE = ROOT / 'geometry-course/textbook'
FIXTURE = Path(__file__).with_name('published-chapters-01-05.json')
FIXTURE_SHA256 = 'ab9c380dbf6e4a9d3cbd753437a10a9e973b99e3581b406a0f52f796dea4e1b3'
REVIEW_PATH = 'docs/reviews/ATANASYAN_7_9_LABELS_RUNTIME_REVIEW.json'
ALLOWED_RUNTIME = {'index.html', 'assets/engine.js', 'assets/style.css', 'assets/board-adapter.js'}


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def digest(value):
    return sha(json.dumps(value, ensure_ascii=False, sort_keys=True,
                          separators=(',', ':')).encode())


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def frozen():
    raw = FIXTURE.read_bytes()
    require(sha(raw) == FIXTURE_SHA256, 'Published I–V oracle changed')
    result = json.loads(raw)
    require(result['sourceCommit'] == 'fa8d1b7ced31a5941ad52d8a21a48b63daaa84a8',
            'Wrong I–V publication identity')
    require(result['cards'] == len(result['perCardHashes']) == 705,
            'Wrong I–V publication coverage')
    return result


def runtime_review(implementation_hash=None):
    base = frozen()
    path = ROOT / REVIEW_PATH
    require(path.is_file(), 'Changed captions need an actual runtime review')
    raw = path.read_bytes()
    review = json.loads(raw)
    require(review.get('status') == 'passed' and review.get('browser') == 'passed',
            'Caption runtime/browser review is not passed')
    require(all(review.get(k) == 'unchanged' for k in ('source', 'mathematics', 'models')),
            'Caption amendment must retain the published teaching and models')
    require(bool(review.get('reviewer')) and bool(review.get('at')),
            'Caption review lacks provenance')
    require(review.get('oldImplementationSha256') == base['implementationSha256'],
            'Caption review points to the wrong published runtime')
    files = review.get('implementationFiles', {})
    require(set(files) == set(base['implementationFiles']) | {'source-inventory.json', 'assets/board-adapter.js'},
            'Caption review changed the runtime-file boundary')
    for name, old in base['implementationFiles'].items():
        require(files[name] == sha((COURSE / name).read_bytes()),
                'Stale caption runtime review: ' + name)
        require(name in ALLOWED_RUNTIME or files[name] == old,
                'Caption amendment changed geometry/math rendering: ' + name)
    inventory_raw = (COURSE / 'source-inventory.json').read_bytes()
    if (ROOT/EXTENSION).exists():
        extension, _ = validate_extension(ROOT)
        inventory_raw = previous_inventory(inventory_raw, ROOT)
    require(files['source-inventory.json'] == sha(inventory_raw), 'Stale reviewed paragraph index')
    require(files['assets/board-adapter.js'] == sha((COURSE / 'assets/board-adapter.js').read_bytes()),
            'Stale reviewed caption adapter')
    assert_source_inventory_preserved(json.loads(inventory_raw), digest(base['sourceInventory']))
    require(review.get('implementationSha256') == digest(files),
            'Caption runtime digest does not match reviewed files')
    if implementation_hash is not None:
        from chapter07_extension import has_vii, validate_extension as validate_vii
        expected_hash = extension['implementationSha256'] if (ROOT/EXTENSION).exists() else review['implementationSha256']
        if has_vii((COURSE/'source-inventory.json').read_bytes()):
            expected_hash = validate_vii(ROOT)[0]['implementationSha256']
        require(implementation_hash == expected_hash,
                'Bundle runtime does not match caption review')
    return review, {'path': REVIEW_PATH, 'sha256': sha(raw)}


def assert_runtime_preserved(implementation_hash, old_hash):
    names = set(frozen()['implementationFiles']) | {'source-inventory.json', 'assets/board-adapter.js'}
    actual = {name: sha((COURSE/name).read_bytes()) for name in names}
    require(implementation_hash == digest(actual), 'Bundle implementation hash is stale')
    if implementation_hash == old_hash:
        return
    require(old_hash == frozen()['implementationSha256'],
            'Unknown original implementation')
    runtime_review(implementation_hash)


def assert_source_inventory_preserved(inventory, old_digest):
    original = deepcopy(inventory)
    paragraphs = original.pop('paragraphs', None)
    require(digest(original) == old_digest,
            'Existing source inventory changed beyond the paragraph index')
    if paragraphs is not None:
        require(isinstance(paragraphs, list) and bool(paragraphs),
                'Paragraph addition must be a nonempty independently checked index')
        identities = [(row.get('chapter'), row.get('number')) for row in paragraphs]
        require(len(identities) == len(set(identities)), 'Duplicate source paragraph identity')


def assert_file_preserved(name, raw, expected):
    """Exact bytes, except the owner's explicitly scoped and reviewed label delta."""
    if sha(raw) == expected:
        return
    base = frozen()
    prefix = 'geometry-course/textbook/'
    relative = name.removeprefix(prefix)
    if name.startswith(prefix) and relative in ALLOWED_RUNTIME:
        require(base['implementationFiles'].get(relative, base['immutableFiles'].get(name)) == expected,
                'Unknown original presentation file: ' + name)
        review, _ = runtime_review()
        require(sha(raw) == review['implementationFiles'][relative],
                'Unreviewed caption file bytes: ' + name)
    elif name == prefix + 'source-inventory.json':
        require(base['immutableFiles'][name] == expected, 'Unknown original source inventory')
        assert_source_inventory_preserved(json.loads(raw), digest(base['sourceInventory']))
    elif name in base['releaseReviews']:
        require(base['releaseReviewSha256'][name] == expected, 'Unknown original chapter review')
        if (ROOT/EXTENSION).exists():
            raw = restore_manifest(name, raw, ROOT)
        current = json.loads(raw)
        require(raw == (json.dumps(current, ensure_ascii=False, indent=2) + '\n').encode(),
                'Amended historical review has unrelated byte changes')
        review, binding = runtime_review()
        require(current.pop('runtimeLabelReview', None) == binding,
                'Chapter review lacks the exact caption-review binding')
        require(current.get('implementationSha256') == review['implementationSha256'],
                'Chapter review has a stale caption runtime')
        current['implementationSha256'] = base['releaseReviews'][name]['implementationSha256']
        require(current == base['releaseReviews'][name],
                'Caption amendment rewrote historical chapter review evidence')
    else:
        raise AssertionError('Published file changed: ' + name)


def assert_all_705_preserved(bundle):
    base = frozen()
    ids = {row['id'] for row in base['perCardHashes']}
    lessons = [row for row in bundle['lessons'] if row['id'] in ids]
    entries = [row for row in bundle['catalog']['entries'] if row['id'] in ids]
    require(digest(lessons) == base['normalizedLessonsSha256'],
            'Published I–V lesson payload, ordering or review provenance changed')
    require(digest(entries) == base['normalizedCatalogEntriesSha256'],
            'Published I–V catalog or storage identity changed')
    require(bundle['catalog']['book'] == base['catalogBook'], 'Published edition changed')
    require([c for c in bundle['build']['chapters'] if c['chapter'] <= 5] == base['buildChapters'],
            'Supplement changed existing chapter boundaries or review bindings')
    assert_source_inventory_preserved(bundle['sourceInventory'], digest(base['sourceInventory']))
    assert_runtime_preserved(bundle['build']['implementationSha256'], base['implementationSha256'])
    for name, expected in {**base['immutableFiles'], **base['releaseReviewSha256']}.items():
        assert_file_preserved(name, (ROOT / name).read_bytes(), expected)
    for name, expected in base['implementationFiles'].items():
        assert_file_preserved('geometry-course/textbook/' + name, (COURSE / name).read_bytes(), expected)
