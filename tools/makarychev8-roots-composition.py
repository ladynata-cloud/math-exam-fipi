#!/usr/bin/env python3
"""Validate PR482's isolated composition without moving a branch or merging it.

Example (after fetching the exact base and head, with full history):
  python3 tools/makarychev8-roots-composition.py \
    --base <full-main-sha> --head <full-pr-head-sha> --output "$RUNNER_TEMP/roots-composition"

The output contains candidate/, git-env.json, identity.json and gate logs.
Use the environment in git-env.json when running further candidate gates; no
.git file is installed in candidate/. Only tracked repository files are copied.
An unmerged composition uses an unreferenced, single-parent, synthetic source
checkpoint. Never publish its manifest or claim it is an authorized merge. An
actual merge requires its own source-checkpoint refresh and verification. For
an already-synchronized head, the existing real checkpoint and manifest are
verified without rebinding them.
"""

import argparse
import copy
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import subprocess
import sys


ROOT = Path(__file__).resolve().parent.parent
TASK = 'docs/tasks/MAKARYCHEV8_SQUARE_ROOTS_COMPLETE.md'
MANIFEST = 'assets/assistant/page-rollout.json'
COURSE_PAGE = 'school/makarychev8/index.html'
ORIGINAL_BASE = '6c64ac63e6bad70993ec50995d3a39976b1b0a36'
VPR_PAGES = {'trainers/vpr-math/index.html', 'vpr/index.html'}
# The published saved-work audit and example catalogue also changed the course shell.
# The composed head must preserve those features and pass their existing gates.
COMPOSITION_PATHS = {MANIFEST, 'docs/PROJECT_STATUS.md', COURSE_PAGE,
                     'school/makarychev8/app.js', '.github/workflows/makarychev8-quality.yml'}

# Independently matched to merged PR metadata on 2026-11-07. This is commit
# provenance, not owner authorization. Unknown main commits require review;
# they must not be silently absorbed by a green synthetic test.
MAIN_PROVENANCE = {
    'ace9e409deb0520d4e8d8ae9fbf4afcde1fc83a9': 479,
    '66172e7398d63c1f809cb3befbd29dbb92651109': 476,
    '25548b86df75b8c90a5dc5c6f1f1925c2ad70636': 475,
    'd435af8a6be1823210901d4e4dc13a44f65591a0': 478,
    'e145b7109e6254908120c2b2022cda799aabad5f': 480,
    'ac0fdfa68f3e6a79f5b08ae2ef43c16dc138c1f8': 477,
}

# The original 28-file PR, the reviewed legacy-state regression, and this
# validator. Adding another path is an explicit scope-review decision.
ALLOWED_TASK_PATHS = {
    '.github/workflows/makarychev8-quality.yml',
    MANIFEST,
    'docs/PROJECT_STATUS.md',
    'docs/reviews/MAKARYCHEV8_ROOTS_345_436_AND_RUNTIME_REVIEW.md',
    'docs/reviews/MAKARYCHEV8_ROOTS_345_436_AUTHOR.md',
    'docs/reviews/MAKARYCHEV8_ROOTS_437_509_AUTHOR.md',
    'docs/reviews/MAKARYCHEV8_ROOTS_INTEGRATION_REVIEW.md',
    TASK,
    'school/makarychev8/README.md',
    'school/makarychev8/app.js',
    'school/makarychev8/build.cjs',
    'school/makarychev8/check.js',
    'school/makarychev8/data.js',
    COURSE_PAGE,
    'school/makarychev8/roots-268-344.json',
    'school/makarychev8/roots-345-436.json',
    'school/makarychev8/roots-437-509.json',
    'school/makarychev8/roots-oracle-268-344.json',
    'school/makarychev8/roots-oracle-345-436.json',
    'school/makarychev8/roots-oracle-437-509.json',
    'school/makarychev8/roots-prior-tasks.json',
    'school/makarychev8/roots-review.json',
    'school/makarychev8/style.css',
    'school/makarychev8/task-graphs.js',
    'school/makarychev8/test-browser-roots.cjs',
    'school/makarychev8/test-course.cjs',
    'school/makarychev8/test-roots-engine.cjs',
    'school/makarychev8/test-roots-source.py',
    'school/makarychev8/test-state.cjs',
    'tools/makarychev8-roots-composition.py',
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def run(command, *, cwd=ROOT, env=None, input_data=None, allowed=(0,)):
    completed = subprocess.run(command, cwd=cwd, env=env, input=input_data,
                               stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                               timeout=600)
    if completed.returncode not in allowed:
        detail = completed.stderr.decode(errors='replace')[-4000:]
        raise ValueError(f'{command[0]} failed ({completed.returncode}): {detail}')
    return completed


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def safe_name(name):
    require(name and not name.startswith('/') and '\\' not in name
            and '..' not in PurePosixPath(name).parts,
            'Unsafe repository path: ' + repr(name))
    return name


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', required=True)
    parser.add_argument('--head', required=True)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    for label, value in [('base', args.base), ('head', args.head)]:
        require(re.fullmatch(r'[0-9a-f]{40}', value), label + ' must be an explicit full SHA')

    # A caller's alternate worktree/index must not redirect source inspection.
    source_env = dict(os.environ)
    for name in ('GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE', 'GIT_COMMON_DIR',
                 'GIT_PREFIX', 'GIT_NAMESPACE'):
        source_env.pop(name, None)
    source_env['GIT_OPTIONAL_LOCKS'] = '0'

    def git(*command, input_data=None, environment=source_env, allowed=(0,)):
        return run(['git', *command], env=environment, input_data=input_data, allowed=allowed)

    def git_text(*command, **kwargs):
        return git(*command, **kwargs).stdout.decode().strip()

    require(Path(git_text('rev-parse', '--show-toplevel')).resolve() == ROOT,
            'Validator must run from the MathExam checkout containing this script')
    require(git_text('rev-parse', 'HEAD') == args.head,
            'Checkout HEAD differs from --head; check out the exact PR candidate first')
    for value in (ORIGINAL_BASE, args.base, args.head):
        require(git_text('cat-file', '-t', value) == 'commit',
                'Required source commit is unavailable; fetch full base/head history')
    require(git('merge-base', '--is-ancestor', ORIGINAL_BASE, args.base, allowed=(0, 1)).returncode == 0,
            'Current main does not descend from the verified task starting base')
    require(git('merge-base', '--is-ancestor', ORIGINAL_BASE, args.head, allowed=(0, 1)).returncode == 0,
            'PR head does not descend from the verified task starting base')
    refs_before = git('for-each-ref', '--format=%(refname) %(objectname)').stdout
    merge_bases = git_text('merge-base', '--all', args.base, args.head).splitlines()
    require(len(merge_bases) == 1, 'Multiple merge bases require manual composition review')
    merge_base = merge_bases[0]
    concurrent_commits = git_text('rev-list', '--reverse', merge_base + '..' + args.base).splitlines()
    require(set(concurrent_commits) <= set(MAIN_PROVENANCE),
            'Unreviewed concurrent main commits: ' +
            ', '.join(sorted(set(concurrent_commits) - set(MAIN_PROVENANCE))))

    def changed_paths(before, after):
        return {safe_name(p.decode()) for p in git('diff', '--no-renames', '--name-only', '-z',
                                                 before, after).stdout.split(b'\0') if p}

    task_paths = changed_paths(merge_base, args.head)
    require(task_paths <= ALLOWED_TASK_PATHS,
            'Unexpected task paths require review: ' + ', '.join(sorted(task_paths - ALLOWED_TASK_PATHS)))
    require(COURSE_PAGE in task_paths and MANIFEST in task_paths,
            'Expected roots source and navigator binding changes are absent')
    concurrent_paths = changed_paths(ORIGINAL_BASE, args.base)
    require(concurrent_paths & task_paths <= COMPOSITION_PATHS,
            'Unexpected main/task overlap: ' + ', '.join(sorted((concurrent_paths & task_paths) - COMPOSITION_PATHS)))

    merged = git('merge-tree', '--write-tree', '--name-only', '--no-messages', '-z',
                 args.base, args.head, allowed=(0, 1))
    fields = [field.decode() for field in merged.stdout.split(b'\0') if field]
    require(fields and re.fullmatch(r'[0-9a-f]{40}', fields[0]), 'Missing virtual tree identity')
    raw_tree, conflicts = fields[0], set(fields[1:])
    require(conflicts <= {MANIFEST}, 'Unexpected virtual conflicts: ' + ', '.join(sorted(conflicts)))
    require(bool(conflicts) == (merged.returncode == 1), 'Inconsistent virtual conflict result')

    def raw(ref, name):
        return git('show', ref + ':' + safe_name(name)).stdout

    ancestor_manifest = json.loads(raw(merge_base, MANIFEST))
    base_manifest = json.loads(raw(args.base, MANIFEST))
    head_manifest = json.loads(raw(args.head, MANIFEST))
    snippet = base_manifest['snippet'].encode()
    require(snippet == ancestor_manifest['snippet'].encode() == head_manifest['snippet'].encode(),
            'Navigator include/version changes are outside this task')
    require(base_manifest['schemaVersion'] == head_manifest['schemaVersion'] == 1,
            'Unexpected navigator schema')
    require(set(head_manifest['addedPages']) == set(ancestor_manifest['addedPages']),
            'The roots task must not add/remove public navigator routes')
    for key in set(ancestor_manifest) | set(head_manifest):
        if key not in {'baseSha', 'addedPages', 'sourceBindingUpdates'}:
            require(ancestor_manifest.get(key) == head_manifest.get(key),
                    'Unexpected roots manifest metadata change: ' + key)
    head_changed = sorted(name for name, row in head_manifest['addedPages'].items()
                          if row != ancestor_manifest['addedPages'].get(name))
    require(head_changed == [COURSE_PAGE], 'Unexpected roots bindings: ' + ', '.join(head_changed))
    require(len(base_manifest['addedPages']) >= 612 and VPR_PAGES <= set(base_manifest['addedPages']),
            'The expected published VPR routes are missing from main')
    head_source = head_manifest['baseSha']
    require(re.fullmatch(r'[0-9a-f]{40}', head_source), 'Invalid roots source checkpoint')
    require(git('merge-base', '--is-ancestor', head_source, args.head, allowed=(0, 1)).returncode == 0,
            'Roots binding must name a real source checkpoint in the PR history')

    union = copy.deepcopy(base_manifest)
    union['addedPages'][COURSE_PAGE] = copy.deepcopy(head_manifest['addedPages'][COURSE_PAGE])
    for row in head_manifest.get('sourceBindingUpdates', []):
        if row not in union.setdefault('sourceBindingUpdates', []):
            union['sourceBindingUpdates'].append(copy.deepcopy(row))
    for previous in (base_manifest, head_manifest):
        require(all(row in union['sourceBindingUpdates'] for row in previous.get('sourceBindingUpdates', [])),
                'A source-binding history record was lost')

    def check_bindings(manifest, source):
        for name, row in manifest['addedPages'].items():
            data = raw(source, name)
            require(data.count(snippet) == 1, 'Missing/duplicate exact navigator pair: ' + name)
            restored = data.replace(snippet, b'', 1)
            require(b'navigator-data.js' not in restored and b'navigator-widget.js' not in restored,
                    'Unexpected navigator code in source: ' + name)
            require(sha(data) == row['afterSha256'] and sha(restored) == row['beforeSha256'],
                    'Incorrect current/source bytes in binding: ' + name)

    check_bindings(base_manifest, args.base)
    check_bindings(head_manifest, args.head)
    check_bindings(union, raw_tree)
    inventory = json.loads(raw(raw_tree, 'assets/assistant/pages.json'))
    require(inventory == sorted(set(union['addedPages']) | set(union['existingPages'])),
            'Public inventory differs from the preserved manifest')
    require(set(union['provenance']) == set(inventory), 'Public discovery provenance is incomplete')
    already_synchronized = merge_base == args.base and not conflicts
    if already_synchronized:
        require(raw_tree == git_text('rev-parse', args.head + '^{tree}'),
                'Already-synchronized composition unexpectedly changed the head tree')
        for row in base_manifest.get('sourceBindingUpdates', []):
            require(row in head_manifest.get('sourceBindingUpdates', []),
                    'Synchronized head lost a main source-history record')
        check_bindings(head_manifest, head_source)

    output = args.output.resolve()
    require(not output.is_relative_to(ROOT) and not ROOT.is_relative_to(output),
            '--output must be a temporary directory outside the source checkout')
    require(not output.exists() or not any(output.iterdir()), '--output must be new or empty')
    output.mkdir(parents=True, exist_ok=True)
    candidate = output / 'candidate'
    candidate.mkdir()
    logs = output / 'gates'
    logs.mkdir()
    git_dir = git_text('rev-parse', '--absolute-git-dir')
    isolated_env = {**source_env, 'GIT_DIR': git_dir, 'GIT_WORK_TREE': str(candidate),
                    'GIT_INDEX_FILE': str(output / 'virtual.index'), 'PYTHONDONTWRITEBYTECODE': '1'}
    (output / 'git-env.json').write_text(json.dumps({name: isolated_env[name] for name in
                                                  ('GIT_DIR', 'GIT_WORK_TREE', 'GIT_INDEX_FILE')}, indent=2) + '\n')
    git('read-tree', raw_tree, environment=isolated_env)
    if already_synchronized:
        source_tree, checkpoint = raw_tree, head_source
    else:
        union_bytes = (json.dumps(union, ensure_ascii=False, indent=2) + '\n').encode()
        (output / 'page-rollout.union-before-checkpoint.json').write_bytes(union_bytes)
        union_blob = git_text('hash-object', '-w', '--stdin', input_data=union_bytes)
        git('update-index', '--add', '--cacheinfo', '100644', union_blob, MANIFEST, environment=isolated_env)
        source_tree = git_text('write-tree', environment=isolated_env)
        timestamp = datetime.fromtimestamp(int(git_text('show', '-s', '--format=%ct', args.head)), timezone.utc).isoformat()
        synthetic_env = {**isolated_env, 'GIT_AUTHOR_NAME': 'MathExam virtual verification',
                         'GIT_AUTHOR_EMAIL': 'virtual-verification@invalid',
                         'GIT_COMMITTER_NAME': 'MathExam virtual verification',
                         'GIT_COMMITTER_EMAIL': 'virtual-verification@invalid',
                         'GIT_AUTHOR_DATE': timestamp, 'GIT_COMMITTER_DATE': timestamp}
        message = ('SYNTHETIC UNREFERENCED: PR482 local virtual source checkpoint\n\n'
                   f'Base: {args.base}\nHead: {args.head}\n'
                   'No branch/ref is moved. Not a published merge or release authorization.\n').encode()
        checkpoint = git_text('commit-tree', source_tree, '-p', args.base,
                              input_data=message, environment=synthetic_env)

    def entries(ref):
        result = {}
        for record in git('ls-tree', '-rz', ref).stdout.split(b'\0'):
            if not record:
                continue
            meta, name = record.split(b'\t', 1)
            result[safe_name(name.decode())] = tuple(meta.decode().split())
        return result

    source_entries = entries(source_tree)
    require(all(mode in ('100644', '100755') and kind == 'blob'
                for mode, kind, _ in source_entries.values()),
            'Unexpected symlink/submodule requires an explicit materialization review')
    selected = b'\0'.join(name.encode() for name in source_entries) + b'\0'
    git('checkout-index', '--stdin', '-z', '--ignore-skip-worktree-bits',
        '--prefix=' + str(candidate) + '/', input_data=selected, environment=isolated_env)

    gate_results = {}

    def gate(name, command):
        completed = run(command, cwd=candidate, env=isolated_env, allowed=(0, 1))
        (logs / (name + '.log')).write_bytes(completed.stdout + completed.stderr)
        require(completed.returncode == 0, name + ' failed; see its isolated gate log')
        gate_results[name] = 'PASS'

    gate('canonical-refresh', [sys.executable, 'tools/public_navigator_bindings.py',
                              '--source-base', checkpoint, '--task', TASK, '--paths', '--write'])
    final_manifest_bytes = (candidate / MANIFEST).read_bytes()
    final_manifest = json.loads(final_manifest_bytes)
    require(final_manifest['baseSha'] == checkpoint, 'Unexpected composition source checkpoint')
    if already_synchronized:
        require(final_manifest_bytes == raw(args.head, MANIFEST),
                'An already-synchronized manifest must remain byte-identical')
    else:
        require(final_manifest['sourceBindingUpdates'][-1]['changedPaths'] == [],
                'Composition refresh must bind only source identity, not change HTML/bindings')
        require(final_manifest['sourceBindingUpdates'][:-1] == union['sourceBindingUpdates'],
                'Refresh changed previous provenance history')
    require(final_manifest['addedPages'] == union['addedPages'], 'Refresh changed a reviewed binding')
    for key, value in base_manifest.items():
        if key not in {'baseSha', 'addedPages', 'sourceBindingUpdates'}:
            require(final_manifest[key] == value, 'Lost concurrent manifest metadata: ' + key)
    gate('preservation', ['node', '--test', 'tools/public-navigator-preservation.test.cjs'])
    gate('bindings', [sys.executable, 'tools/public_navigator_bindings.test.py'])
    gate('navigator-regressions', ['node', 'tools/public-navigator-regression.cjs',
                                  'assets/assistant/navigator-data.js', str(output / 'navigator-regressions.json')])
    gate('navigator-data-syntax', ['node', '--check', 'assets/assistant/navigator-data.js'])
    gate('navigator-widget-syntax', ['node', '--check', 'assets/assistant/navigator-widget.js'])

    final_blob = git_text('hash-object', '-w', '--stdin', input_data=final_manifest_bytes)
    git('update-index', '--cacheinfo', '100644', final_blob, MANIFEST, environment=isolated_env)
    final_tree = git_text('write-tree', environment=isolated_env)
    final_paths = changed_paths(args.base, final_tree)
    require(final_paths == task_paths, 'Composed diff added/lost task files: ' +
            json.dumps({'extra': sorted(final_paths - task_paths), 'missing': sorted(task_paths - final_paths)}))
    final_entries, head_entries, base_entries = entries(final_tree), entries(args.head), entries(args.base)
    for name in task_paths - COMPOSITION_PATHS:
        require(final_entries.get(name) == head_entries.get(name), 'Composed task blob/mode changed: ' + name)
    for name in concurrent_paths - task_paths:
        require(final_entries.get(name) == base_entries.get(name), 'Concurrent main blob/mode was lost: ' + name)
    for name in set(base_manifest['addedPages']) - {COURSE_PAGE}:
        require(final_manifest['addedPages'][name] == base_manifest['addedPages'][name],
                'Concurrent source binding changed: ' + name)
    gate('diff-check', ['git', 'diff', '--check', args.base, final_tree])
    patch = git('diff', '--no-ext-diff', '--binary', args.base, final_tree).stdout
    (output / 'synthetic-composition.diff').write_bytes(patch)
    patch_id = git_text('patch-id', '--stable', input_data=patch).split()[0]
    require(git_text('rev-parse', 'HEAD') == args.head and
            git('for-each-ref', '--format=%(refname) %(objectname)').stdout == refs_before,
            'Source HEAD/refs moved during the read-only check; revalidate the new candidate')
    if not already_synchronized:
        require(not git_text('for-each-ref', '--format=%(refname)', '--points-at', checkpoint),
                'Synthetic checkpoint unexpectedly has a published/local branch ref')
    identity = {
        'status': 'VIRTUAL_COMPOSITION_STATIC_GATES_PASS',
        'base': args.base, 'head': args.head, 'mergeBase': merge_base,
        'rawVirtualTree': raw_tree, 'conflicts': sorted(conflicts),
        'sourceTree': source_tree, 'sourceCheckpoint': checkpoint,
        'sourceCheckpointKind': 'existing-committed-source' if already_synchronized else 'synthetic-unreferenced',
        'syntheticSourceCheckpoint': None if already_synchronized else checkpoint,
        'syntheticCheckpointParent': None if already_synchronized else args.base,
        'syntheticCheckpointPublished': False,
        'finalVirtualTree': final_tree, 'stablePatchId': patch_id,
        'candidatePath': 'candidate', 'gitEnvironmentFile': 'git-env.json',
        'materializedTrackedFiles': len(source_entries),
        'changedFiles': sorted(final_paths), 'changedFileCount': len(final_paths),
        'exactHeadBlobsPreserved': len(task_paths - COMPOSITION_PATHS),
        'concurrentMainFileCount': len(concurrent_paths),
        'concurrentMainBlobsPreserved': len(concurrent_paths - task_paths),
        'concurrentMainCommits': [{'sha': value, 'pr': MAIN_PROVENANCE[value],
                                  'url': 'https://github.com/ladynata-cloud/math-exam-fipi/pull/' + str(MAIN_PROVENANCE[value])}
                                 for value in concurrent_commits],
        'totalPublicPages': len(inventory), 'sourceBoundPages': len(final_manifest['addedPages']),
        'unchangedMainBindings': len(base_manifest['addedPages']) - 1,
        'rootsChangedBindings': head_changed, 'vprRoutesPreserved': sorted(VPR_PAGES),
        'sourceBindingHistoryRows': len(final_manifest['sourceBindingUpdates']),
        'coverageHistoryRows': len(final_manifest.get('coverageUpdates', [])),
        'sitemap': final_manifest['sitemap'], 'finalManifestSha256': sha(final_manifest_bytes),
        'validatorSha256': sha(Path(__file__).read_bytes()), 'gates': gate_results,
        'sourceRefsUnchanged': True, 'authorizationGranted': False,
        'requiresActualMergeCheckpointRefresh': not already_synchronized,
        'notRun': ['native candidate browser gates', 'actual branch synchronization',
                   'actual merge/checkpoint refresh', 'deployment', 'real-pupil trials'],
    }
    (output / 'identity.json').write_text(json.dumps(identity, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(identity, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError, subprocess.TimeoutExpired) as error:
        print(json.dumps({'status': 'VIRTUAL_COMPOSITION_BLOCKED', 'error': str(error),
                          'authorizationGranted': False}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
