#!/usr/bin/env python3
"""Build the exact three-file OGE15 candidate without editing the source tree.
No network, Git operations, CI edits, deployment or credentials are involved.
By default validate only. --output must name a NEW directory outside the source.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SOURCE_REF = '2069d21d96943602a03844ffb52f83d50b4700c9'
FILES = {
    'trainers/oge-task15-triangles.html': (
        'd6397deccc7522db70e5c3044ba895a0e54290914a53505f3d27a2124459a718',
        'f0e641fc489c282e4a14274880b51184f8629b7e1ea97cac7ccffae697bff002'),
    'tools/oge-task15-triangles.test.mjs': (
        '057783e79b973579363e0d73d6a63bc774a84b996f21cf90fc6a28433156b999',
        '86f9be52b644937fd97834b1dd743df3ef6f8799608e2beddee9f255279c86d2'),
    'tools/oge-task15-triangles.browser.mjs': (
        '0b9ff29a87f38fa9b957c7ad7020942074c83f11f921938655e0b2528173f614',
        '80702e9be3f63a225e0d3cc906f2c5b138a5bc8eaf2ffd5575bf11d65e06978c'),
}
HUNK = re.compile(r'^@@ -(\d+),(\d+) \+(\d+),(\d+) @@\n$')

def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def apply_exact(originals: dict[str, bytes], patch: str) -> dict[str, bytes]:
    """No fuzz/offset matching, extra paths, duplicated paths or silent fallback."""
    rows = patch.splitlines(keepends=True)
    result = {}
    i = 0
    while i < len(rows):
        if not rows[i].startswith('--- a/'):
            raise ValueError('Expected an exact source header')
        name = rows[i][6:].rstrip('\n')
        i += 1
        if name not in FILES or name in result:
            raise ValueError('Unexpected or duplicate path: '+name)
        if i >= len(rows) or rows[i] != '+++ b/'+name+'\n':
            raise ValueError('Target path must match source path')
        i += 1
        old = originals[name].decode('utf-8').splitlines(keepends=True)
        cursor = 0
        output = []
        hunks = 0
        while i < len(rows) and rows[i].startswith('@@ '):
            match = HUNK.fullmatch(rows[i])
            if not match:
                raise ValueError('Unsupported hunk header')
            old_start, old_count, new_start, new_count = map(int, match.groups())
            start = old_start-1
            if start < cursor or start > len(old):
                raise ValueError('Overlapping or out-of-range hunk')
            output.extend(old[cursor:start])
            cursor = start
            if len(output) != new_start-1:
                raise ValueError('New hunk position mismatch')
            seen_old = seen_new = 0
            i += 1
            while i < len(rows) and not rows[i].startswith(('@@ ', '--- a/')):
                row = rows[i]
                if not row or row[0] not in ' +-':
                    raise ValueError('Unsupported patch line')
                mark, text = row[0], row[1:]
                if mark in ' -':
                    if cursor >= len(old) or old[cursor] != text:
                        raise ValueError('Exact source context mismatch: '+name)
                    cursor += 1
                    seen_old += 1
                if mark in ' +':
                    output.append(text)
                    seen_new += 1
                i += 1
            if (seen_old, seen_new) != (old_count, new_count):
                raise ValueError('Hunk size mismatch')
            hunks += 1
        if not hunks:
            raise ValueError('Empty file patch')
        output.extend(old[cursor:])
        result[name] = ''.join(output).encode('utf-8')
        if sha(result[name]) != FILES[name][1]:
            raise ValueError('Candidate hash mismatch: '+name)
    if set(result) != set(FILES):
        raise ValueError('Incomplete candidate')
    return result

def prepare(source: Path, patch: str) -> tuple[dict[str, bytes], bool]:
    source = source.resolve(strict=True)
    originals = {}
    for name in FILES:
        file = source/name
        if file.is_symlink() or not file.resolve(strict=True).is_relative_to(source):
            raise ValueError('Source path escapes its root')
        originals[name] = file.read_bytes()
    if all(sha(originals[n]) == FILES[n][1] for n in FILES):
        return originals, True
    if any(sha(originals[n]) != FILES[n][0] for n in FILES):
        raise ValueError('Source drift or partial application; stop without writing')
    return apply_exact(originals, patch), False

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    try:
        patch = Path(__file__).with_name('task15-remediation.patch').read_bytes().decode('utf-8')
        result, already = prepare(args.source, patch)
        report = {
            'status': 'CANDIDATE_ALREADY_PRESENT' if already else 'CANDIDATE_VALIDATED',
            'source_ref': SOURCE_REF,
            'source_modified': False,
            'published': False,
            'browser_validated': False,
            'files': {n: {'sha256': sha(b), 'bytes': len(b)} for n,b in result.items()},
        }
        if args.output:
            source = args.source.resolve(strict=True)
            target = args.output.resolve()
            if target.is_relative_to(source) or source.is_relative_to(target):
                raise ValueError('Output and source directories must be disjoint')
            target.mkdir(parents=True, exist_ok=False)
            for name, data in result.items():
                file = target/name
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_bytes(data)
            (target/'candidate-manifest.json').write_text(json.dumps(report, indent=2)+'\n', encoding='utf-8')
        print(json.dumps(report, indent=2))
        return 0
    except (ValueError, OSError, KeyError, UnicodeError) as error:
        print(json.dumps({'status':'BLOCKED','reason':str(error),'published':False}), file=sys.stderr)
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
