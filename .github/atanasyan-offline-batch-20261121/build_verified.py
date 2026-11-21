"""Rebuild five immutable school release ZIPs, compare every member, then create five new feature refs atomically."""
from pathlib import Path, PurePosixPath
import hashlib,json,os,re,shutil,subprocess as sp,sys,zipfile

package='downloads/trainers/geometry-course/geometry-course-package.zip'
changed_sources={'geometry-course/README.txt','scripts/geometry-download-offline.mjs','tools/atanasyan-harmonization/download.test.cjs'}
archive=Path(package)
staging=Path(sys.argv[1])
records=json.loads((staging/'records.json').read_bytes())
assert [r['count'] for r in records]==[1516,1716,1887,1996,2056]
assert len({r['base'] for r in records})==len(records)


def capture(*args):
    return sp.check_output(args,text=True).strip()


def run(*args):
    sp.run(args,check=True)


def git(*args):
    return capture('git',*args)


def blob(path):
    return git('hash-object',str(path))


def checksum(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def confirm_archives(generated,reviewed,previous,record):
    with zipfile.ZipFile(generated) as fresh,zipfile.ZipFile(reviewed) as final,zipfile.ZipFile(previous) as old:
        names=final.namelist()
        assert final.testzip() is None and fresh.testzip() is None and len(names)==len(set(names))==record['members']
        assert fresh.namelist()==names
        expected_only=record['commonSourcePatch']
        if expected_only:assert old.namelist()==names
        assert ('Доступно карточек в задачнике: '+str(record['count'])+'.') in final.read('README.txt').decode()
        for name in names:
            assert not PurePosixPath(name).is_absolute() and '..' not in PurePosixPath(name).parts
            assert fresh.read(name)==final.read(name),name
            a,b=fresh.getinfo(name),final.getinfo(name)
            assert (a.date_time,a.external_attr,a.compress_type)==(b.date_time,b.external_attr,b.compress_type),name
            if expected_only:assert (old.read(name)!=final.read(name))==(name=='README.txt'),name


refs=[]
for record in records:
    count=str(record['count']);base=record['base'];target=record['target']
    assert re.fullmatch(r'[0-9a-f]{40}',base)
    assert target=='integration/atanasyan-offline-count-'+count+'-20261121'
    name='refs/heads/'+target
    assert not git('ls-remote','origin',name),'Target branch already exists'
    run('git','fetch','--depth=1','--no-tags','origin',base)
    run('git','checkout','--detach',base)
    assert git('rev-parse','HEAD^{tree}')==record['basisTree'] and blob(archive)==record['zipBefore']
    prev=staging/(count+'-previous.zip');shutil.copyfile(archive,prev)
    if record['commonSourcePatch']:run('git','apply','--index',str(staging/'readme-generator.patch'))
    run('node','scripts/build-trainer-downloads.mjs','--only=geometry-course','--downloads-only')
    generated=staging/(count+'-rebuilt.zip');archive.replace(generated)
    run('git','restore','--',package)
    patch=staging/record['patch']
    assert patch.name==count+'.zip.patch' and blob(patch)==record['patchBlob']
    run('git','apply','--binary',str(patch))
    assert blob(archive)==record['zipAfter'] and archive.stat().st_size==record['size'] and checksum(archive)==record['sha256']
    confirm_archives(generated,archive,prev,record)
    output=capture('node','tools/atanasyan-harmonization/download.test.cjs')
    assert '"textbookCards":'+count+',' in output and '"zipFiles":'+str(record['members'])+'}' in output
    print(output)
    run('git','add','--',package)
    wanted=changed_sources|{package} if record['commonSourcePatch'] else {package}
    assert set(git('diff','--cached','--name-only').splitlines())==wanted
    assert git('write-tree')==record['tree']
    run('git','-c','user.name=github-actions[bot]','-c','user.email=41898282+github-actions[bot]@users.noreply.github.com','commit','-m','Собрать автономный задачник с количеством доступных карточек '+count)
    assert git('rev-parse','HEAD^')==base and git('rev-parse','HEAD^{tree}')==record['tree']
    refs.append((name,git('rev-parse','HEAD'),record))
    generated.unlink();prev.unlink()
# Nothing goes to the remote before every source, regeneration, and target tree succeeds.
run('git','push','--atomic',*['--force-with-lease='+name+':' for name,_,_ in refs],'origin',*[sha+':'+name for name,sha,_ in refs])
with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as report:
    for name,sha,record in refs:
        assert git('ls-remote','--exit-code','--heads','origin',name).split()[0]==sha
        print(sha,record['count'],record['zipAfter'],record['tree'],file=report)
