"""Explicit source-binding refresh; never edits HTML or grants source/math approval.

Commit and review the intended source changes under their own task first. Pass
that exact commit, task document and exact changed-file set. The default is a
preview. --write changes only the navigator provenance manifest. All other
source/math/publication gates remain required and keep their own receipts.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess

from public_navigator_preservation import SNIPPET

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / 'assets/assistant/page-rollout.json'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def source_bytes(raw, required):
    count = raw.count(SNIPPET)
    require(count == 1 if required else count in (0, 1), 'Missing or duplicate exact navigator pair')
    restored = raw.replace(SNIPPET, b'', 1) if count else raw
    require(b'navigator-data.js' not in restored and b'navigator-widget.js' not in restored,
            'Unknown, partial, executable or altered navigator tags')
    return restored


def refresh(manifest, source_base, task, paths, baseline, current):
    require(bool(re.fullmatch(r'[a-f0-9]{40}', source_base)), 'Use one explicit full source commit SHA')
    require(task.startswith('docs/tasks/') and task.endswith('.md') and '..' not in PurePosixPath(task).parts,
            'Name the repository-relative approved task document')
    require(manifest['snippet'].encode() == SNIPPET, 'Navigator code/version changes need a separate reviewed scope')
    require(len(paths) == len(set(paths)), 'Duplicate declared source path')
    require(set(paths) <= set(manifest['addedPages']), 'Unknown source path; this command cannot expand coverage')
    result = copy.deepcopy(manifest)
    changed = []
    for name, row in manifest['addedPages'].items():
        require(not name.startswith('/') and '..' not in PurePosixPath(name).parts, 'Unsafe source path')
        old = source_bytes(baseline(name), required=False)
        raw = current(name)
        restored = source_bytes(raw, required=True)
        require(restored == old, 'Unbound source change: ' + name + '; commit/review that source and name its exact commit first')
        before, after = sha(old), sha(raw)
        if before != row['beforeSha256'] or after != row['afterSha256']:
            changed.append(name)
            result['addedPages'][name].update(beforeSha256=before, afterSha256=after)
    previous = manifest.get('sourceBindingUpdates', [])
    repeat = (not changed and previous and previous[-1]['sourceBaseSha'] == source_base
              and previous[-1]['task'] == task and previous[-1]['changedPaths'] == sorted(paths)
              and manifest['baseSha'] == source_base)
    if repeat:
        return result
    require(set(changed) == set(paths), 'Declared paths must exactly match changed bindings; actual: ' + ', '.join(changed))
    if not changed and source_base == manifest['baseSha']:
        return result
    result.setdefault('originBaseSha', manifest['baseSha'])
    result['baseSha'] = source_base
    result.setdefault('sourceBindingUpdates', []).append({
        'previousBaseSha': manifest['baseSha'], 'sourceBaseSha': source_base,
        'task': task, 'changedPaths': sorted(changed),
        'boundary': 'Explicit committed source identity only; not mathematical, source or publication approval.'})
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-base', required=True)
    parser.add_argument('--task', required=True)
    parser.add_argument('--paths', nargs='*', required=True, help='Exact reviewed source paths; pass an empty list for a provenance-only base update.')
    parser.add_argument('--write', action='store_true', help='Write the reviewed manifest update; otherwise preview only.')
    args = parser.parse_args()
    require((ROOT / args.task).is_file(), 'Task document does not exist')
    manifest = json.loads(MANIFEST.read_text())
    def baseline(name):
        return subprocess.check_output(['git', 'show', args.source_base + ':' + name], cwd=ROOT)
    updated = refresh(manifest, args.source_base, args.task, args.paths, baseline,
                      lambda name: (ROOT / name).read_bytes())
    changed = updated != manifest
    if args.write and changed:
        MANIFEST.write_text(json.dumps(updated, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'status': 'BINDINGS_UPDATED' if args.write and changed else 'BINDINGS_PREVIEW' if changed else 'BINDINGS_CURRENT',
                      'sourceBase': args.source_base, 'task': args.task, 'declaredPaths': args.paths,
                      'htmlFilesWritten': 0, 'approvalGranted': False}))


if __name__ == '__main__':
    main()
