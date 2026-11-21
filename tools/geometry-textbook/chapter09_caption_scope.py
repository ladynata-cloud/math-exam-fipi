"""Read an isolated IX caption snapshot and validate its historical boundary."""
import json
import sys
from pathlib import Path

from advanced8_release import (PREFIX, ROOT, has_supplement,
                               historical_ix_projection, read, require)


def checked_scope(snapshot):
    course = snapshot / PREFIX
    scope_path = Path('tools/geometry-textbook/release-scope.json')
    scope = read(snapshot / scope_path)
    bundle = read(course / 'data/course.json')
    current = read(ROOT / scope_path)
    old, old_scope = bundle, scope
    if has_supplement(scope=current) or has_supplement(bundle, scope):
        # A local copy cannot make the suffix disappear by editing its own scope.
        require(scope == current, 'Isolated supplement scope differs from reviewed scope')
        # Validate the full, unprojected union, exact frozen 1407 bundle, actual
        # source/implementation/review bindings and all 18 additions before slicing.
        old, old_scope = historical_ix_projection(
            bundle, scope, root=ROOT, course=course, require_review=True)
    require(len(old['lessons']) == len(old['catalog']['entries']) ==
            old['build']['authoredCards'] == old_scope['totalCards'] == 1407,
            'Chapter IX requires its exact 1407-card historical boundary')
    ix_ids = [row['id'] for row in old['lessons'] if row['source']['chapter'] == 'IX']
    require(len(ix_ids) == len(set(ix_ids)) == 160, 'Expected all 160 distinct IX cards')
    return dict(historicalCards=1407, supplementCards=len(bundle['lessons'])-1407,
                totalCards=scope['totalCards'], ixIds=ix_ids)


if __name__ == '__main__':
    print(json.dumps(checked_scope(Path(sys.argv[1]).resolve())))
