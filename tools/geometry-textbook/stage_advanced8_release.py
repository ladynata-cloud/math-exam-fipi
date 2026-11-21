#!/usr/bin/env python3
"""Stage the already-reviewed824-841 supplement outside the repository.

--bindings prints content/runtime/evidence hashes only. It creates no approval.
--output requires the real independent content and all188-view visual receipts.
Neither mode writes to the working course or performs Git/deployment operations.
"""
import argparse
from copy import deepcopy
import json
import shutil
from pathlib import Path
from build_course import ROOT, COURSE, compose, read
from advanced8_release import (SCOPE, KEY, PREFIX, BASE_BUNDLE_SHA, serialized,
    encoded, sha, require, has_supplement, historical_ix_projection,
    binding_fields, append_release, validate_release)


def base_course(require_review=True):
    scope = read(ROOT / 'tools/geometry-textbook/release-scope.json')
    bundle = compose()
    if has_supplement(bundle, scope):
        bundle, scope = historical_ix_projection(bundle, scope, ROOT, COURSE, require_review)
    require(sha(serialized(bundle)) == BASE_BUNDLE_SHA, 'Published1407 baseline changed')
    return bundle, scope


def stage(output):
    output = Path(output).resolve()
    require(output != ROOT and ROOT not in output.parents,
            'Staging must be outside the working repository')
    require(not output.exists(), 'Existing staging output is never overwritten')
    current_scope = read(ROOT / 'tools/geometry-textbook/release-scope.json')
    require(not has_supplement(scope=current_scope), 'Advanced8 is already promoted')
    base, scope = base_course()
    scope = deepcopy(scope)
    scope['supplements'].append(SCOPE)
    scope['totalCards'] += 18
    bundle = append_release(base, ROOT, COURSE, scope)
    validate_release(bundle, ROOT, COURSE, True, scope)
    target = output / PREFIX
    shutil.copytree(COURSE, target)
    (target / 'data/course.json').write_bytes(serialized(bundle))
    destination = output / 'tools/geometry-textbook/release-scope.json'
    destination.parent.mkdir(parents=True)
    destination.write_bytes(encoded(scope))
    print(json.dumps(dict(stageOnly=True, cards=1425, preservedCards=1407,
                          newReviewedCards=18, publicFilesModified=False,
                          publicationApprovalCreated=False, output=str(output))))
    return bundle


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    options = parser.add_mutually_exclusive_group(required=True)
    options.add_argument('--bindings', action='store_true')
    options.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.bindings:
        # A stale receipt must not prevent obtaining hashes for a new review.
        # Validate the full candidate and frozen predecessor without approval.
        base, _ = base_course(require_review=False)
        print(json.dumps(binding_fields(base, ROOT, COURSE), ensure_ascii=False, indent=2))
    else:
        stage(args.output)
