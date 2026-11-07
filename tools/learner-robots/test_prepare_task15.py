#!/usr/bin/env python3
"""Run exact-patch rejection tests against the specified frozen PR146 snapshot."""
import argparse
import json
import tempfile
from pathlib import Path
from prepare_task15 import FILES, apply_exact, prepare

def run(source: Path) -> dict:
    source=source.resolve(strict=True)
    patch=Path(__file__).with_name('task15-remediation.patch').read_bytes().decode('utf-8')
    originals={name:(source/name).read_bytes() for name in FILES}
    result,already=prepare(source,patch)
    assert not already, 'This probe requires the unmodified frozen snapshot'
    checks=['three exact output hashes']
    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory)
        for name,data in result.items():
            file=root/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(data)
        again,already=prepare(root,patch)
        assert already and again==result
        checks.append('idempotent complete candidate')
    mutations={
        'empty':'',
        'extra-path':patch+'--- a/unexpected.txt\n+++ b/unexpected.txt\n@@ -1,1 +1,1 @@\n-x\n+y\n',
        'duplicate-file':patch+patch,
        'unsafe-path':patch.replace('--- a/trainers/oge-task15-triangles.html','--- a/../../outside.html',1),
        'changed-target':patch.replace('+++ b/trainers/oge-task15-triangles.html','+++ b/elsewhere.html',1),
        'missing-file':patch.split('--- a/tools/oge-task15-triangles.browser.mjs')[0],
        'bad-count':patch.replace('@@ -142,7 +142,9 @@','@@ -142,8 +142,9 @@',1),
        'bad-position':patch.replace('@@ -142,7 +142,9 @@','@@ -142,7 +143,9 @@',1),
        'changed-context':patch.replace('   .grid{gap:10px}','   .grid{gap:11px}',1),
        'changed-result':patch.replace('grid-template-columns:.85fr','grid-template-columns:.86fr',1),
    }
    for name,changed in mutations.items():
        try:
            apply_exact(originals,changed)
        except ValueError:
            checks.append(name+' rejected')
        else:
            raise AssertionError(name+' unexpectedly accepted')
    with tempfile.TemporaryDirectory() as directory:
        root=Path(directory)
        for name,data in originals.items():
            file=root/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_bytes(data)
        first=next(iter(FILES))
        for label,data in [('partial application',result[first]),('source drift',originals[first]+b'\n')]:
            (root/first).write_bytes(data)
            try:
                prepare(root,patch)
            except ValueError:
                checks.append(label+' rejected')
            else:
                raise AssertionError(label+' unexpectedly accepted')
        file=root/first;file.unlink();file.symlink_to(source/first)
        try:
            prepare(root,patch)
        except ValueError:
            checks.append('symlink rejected')
        else:
            raise AssertionError('symlink unexpectedly accepted')
    assert all((source/name).read_bytes()==data for name,data in originals.items())
    checks.append('source tree unchanged')
    return {'status':'PASS','assertion_groups':len(checks),'checks':checks,'network':False,'browser':False}

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,required=True)
    args=parser.parse_args()
    print(json.dumps(run(args.source),indent=2))
