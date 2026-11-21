"""Validate a disjoint, lossless main composition without moving any Git ref.

Only the reviewed disjoint-file case is accepted. Overlap or a moved main needs
fresh review; this tool never resolves conflicts or authorizes deployment.
"""
import json
import subprocess
import sys
from pathlib import Path


def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()


def changed(base, tip):
    return set(git('diff', '--name-only', base, tip).splitlines())


def blobs(ref):
    return {row.split('\t', 1)[1]: row.split()[2]
            for row in git('ls-tree', '-r', ref).splitlines()}


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def compose(main, destination):
    head = git('rev-parse', 'HEAD')
    ancestor = git('merge-base', head, main)
    task_files, main_files = changed(ancestor, head), changed(ancestor, main)
    require(not task_files & main_files, 'Concurrent file overlap requires review')
    tree = git('merge-tree', '--write-tree', head, main).splitlines()[0]
    require(changed(main, tree) == task_files, 'Unexpected composed delta')
    hb, mb, tb = blobs(head), blobs(main), blobs(tree)
    require(all(hb.get(p) == tb.get(p) for p in task_files), 'Task blob changed')
    require(all(mb.get(p) == tb.get(p) for p in main_files), 'Main blob changed')
    # The run must not silently validate an outdated base if main moves while
    # the archive is being prepared. Release still requires its own fresh check.
    remote = git('ls-remote', 'origin', 'refs/heads/main').split()[0]
    require(remote == main, 'Main moved during composition')
    Path(destination).write_text(json.dumps({
        'head': head, 'main': main, 'ancestor': ancestor, 'tree': tree,
        'taskFiles': sorted(task_files), 'preservedMainFiles': sorted(main_files),
        'overlap': [], 'exactDeltaAndBlobs': True,
        'releaseAuthorizedByThisCheck': False,
    }, indent=2) + '\n')
    print(tree)


if __name__ == '__main__':
    compose(sys.argv[1], sys.argv[2])
