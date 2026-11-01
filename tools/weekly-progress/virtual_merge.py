#!/usr/bin/env python3
"""Build a disposable PR377 candidate without modifying a branch, index or working tree."""
import argparse, datetime, json, os, pathlib, re, subprocess, tarfile, tempfile


def git(*args, env=None, check=True):
    return subprocess.run(['git', *args], env=env, check=check, capture_output=True, text=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    parser.add_argument('--head', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--evidence', required=True)
    args = parser.parse_args()
    for sha in [args.base, args.head]:
        if not re.fullmatch(r'[0-9a-f]{40}', sha):
            raise ValueError('Expected immutable full commit IDs')
    output = pathlib.Path(args.output).resolve()
    evidence = pathlib.Path(args.evidence).resolve()
    evidence.mkdir(parents=True, exist_ok=True)
    if output.exists():
        raise ValueError('Candidate directory must not already exist')
    original = git('merge-base', args.base, args.head).stdout.strip()
    merge = git('merge-tree', '--write-tree', '--name-only', args.base, args.head, check=False)
    (evidence / 'original-virtual-merge.txt').write_text(merge.stdout + merge.stderr)
    if merge.returncode not in [0, 1]:
        raise RuntimeError(merge.stderr or merge.stdout)
    first = merge.stdout.split('\n\n', 1)[0].splitlines()
    tree = first[0]
    conflicts = first[1:] if merge.returncode else []
    allowed = {'docs/PROJECT_STATUS.md', 'downloads/trainers-manifest.json'}
    if set(conflicts) - allowed:
        raise RuntimeError('Unapproved product conflict: ' + repr(conflicts))
    main_files = set(git('diff', '--name-only', original, args.base).stdout.splitlines())
    pr_files = set(git('diff', '--name-only', original, args.head).stdout.splitlines())
    if (main_files & pr_files) - allowed:
        raise RuntimeError('Overlapping product files need an independent review')
    changed = {}
    status_path = 'docs/PROJECT_STATUS.md'
    status_main = git('show', args.base + ':' + status_path).stdout
    status_head = git('show', args.head + ':' + status_path).stdout
    heading = '## Prepared: clearer arithmetic entry and division (first release)'
    section = status_head.split(heading, 1)[1].split('\n## ', 1)[0]
    if heading in status_main:
        raise RuntimeError('Arithmetic status section already exists on main')
    title, body = status_main.split('\n\n', 1)
    changed[status_path] = title + '\n\n' + heading + section.rstrip() + '\n\n\n' + body
    manifest_path = 'downloads/trainers-manifest.json'
    raw_main = git('show', args.base + ':' + manifest_path).stdout
    main_manifest = json.loads(raw_main)
    head_manifest = json.loads(git('show', args.head + ':' + manifest_path).stdout)
    old_manifest = json.loads(git('show', original + ':' + manifest_path).stdout)
    without_date = lambda value: {k: v for k, v in value.items() if k != 'updated'}
    if without_date(head_manifest) != without_date(old_manifest):
        raise RuntimeError('PR manifest contains more than its reviewed date change')
    date = max(main_manifest['updated'], head_manifest['updated'])
    for value in [date, main_manifest['updated'], head_manifest['updated']]:
        datetime.date.fromisoformat(value)
    # Preserve the existing formatting and all current-main catalogue entries.
    changed[manifest_path], count = re.subn(r'("updated"\s*:\s*")[^"]+(")', lambda m: m[1]+date+m[2], raw_main, count=1)
    if count != 1:
        raise RuntimeError('Expected exactly one manifest date')
    with tempfile.TemporaryDirectory(prefix='mathexam-virtual-index-') as tmp:
        env = dict(os.environ, GIT_INDEX_FILE=str(pathlib.Path(tmp)/'index'))
        git('read-tree', tree, env=env)
        for name, content in changed.items():
            file = pathlib.Path(tmp) / pathlib.Path(name).name
            file.write_text(content)
            blob = git('hash-object', '-w', str(file)).stdout.strip()
            git('update-index', '--add', '--cacheinfo', '100644', blob, name, env=env)
        tree = git('write-tree', env=env).stdout.strip()
    git('diff', '--check', args.base, tree)
    delta = git('diff', '--name-only', args.base, tree).stdout.splitlines()
    if set(delta) - pr_files:
        raise RuntimeError('Candidate contains unrelated changes')
    def entry(ref, name):
        raw = git('ls-tree', ref, '--', name).stdout.strip()
        meta, filename = raw.split('\t', 1)
        mode, kind, sha = meta.split()
        return {'path': filename, 'mode': mode, 'type': kind, 'sha': sha}
    for name in pr_files - allowed:
        if entry(tree, name) != entry(args.head, name):
            raise RuntimeError('Reviewed product blob changed: '+name)
    elements = []
    for name in delta:
        item = entry(tree, name)
        if name in changed:
            item.pop('sha')
            item['content'] = changed[name]
        elements.append(item)
    (evidence/'candidate-tree-elements.json').write_text(json.dumps(elements, ensure_ascii=False, indent=2))
    archive = evidence/'candidate-source.tar'
    with archive.open('wb') as stream:
        subprocess.run(['git', 'archive', '--format=tar', tree], stdout=stream, check=True)
    output.mkdir()
    with tarfile.open(archive) as source:
        source.extractall(output, filter='data')
    archive.unlink()
    report = {'base':args.base, 'head':args.head, 'mergeBase':original, 'baseTree':git('rev-parse',args.base+'^{tree}').stdout.strip(), 'candidateTree':tree, 'originalConflicts':conflicts, 'resolutions':list(changed), 'changedFiles':delta, 'reviewedProductBlobsIdentical':True, 'remoteBranchesModified':False, 'releaseAuthorized':False, 'candidateOnly':True, 'concurrentCommits':git('log','--format=%H %s',original+'..'+args.base).stdout.splitlines()}
    (evidence/'virtual-merge.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
