#!/usr/bin/env python3
"""Stage an already-approved VII release outside the working repository.

Requires actual independent runtime and content receipts. Creates no approval,
changes no public files and never performs Git operations or deployment.
"""
import argparse,json,shutil
from pathlib import Path
from build_course import ROOT,COURSE,compose,read
from chapter07_preservation import assert_public893
from chapter07_extension import (PREFIX,RECEIPT,BINDING,PARAGRAPHS,SCOPE,
 frozen,encoded,sha,validate_extension,check_evidence,require)
from chapter07_release import validate_release

def stage(output):
 output=Path(output).resolve()
 require(output!=ROOT and ROOT not in output.parents,'Staging must be outside the working repository')
 require(not output.exists(),'Existing output is never overwritten')
 assert_public893(compose(COURSE),root=ROOT)
 receipt_raw=(ROOT/RECEIPT).read_bytes();receipt=json.loads(receipt_raw)
 manifest=read(COURSE/'release-review-chapter-07.json')
 require(manifest.get('status')=='passed' and all(manifest.get(k)=='passed' for k in ['source','mathematics','models','pedagogy','browser']),'Actual independent VII content approval required before staging')
 require(bool(manifest.get('reviewer')) and bool(manifest.get('at')),'VII reviewer provenance required')
 check_evidence(manifest.get('evidence'),ROOT,'independent VII content')
 source=read(ROOT/'tools/geometry-textbook/chapter-07-source-map.json')
 require(source['paragraphs']==PARAGRAPHS,'Independent source map changed')
 target=output/PREFIX;shutil.copytree(COURSE,target)
 inventory=read(target/'source-inventory.json')
 require(not any(p['chapter']==7 for p in inventory['paragraphs']),'VII is already promoted')
 inventory['paragraphs']+=PARAGRAPHS;(target/'source-inventory.json').write_bytes(encoded(inventory))
 binding={'path':RECEIPT,'sha256':sha(receipt_raw)}
 for name in frozen(ROOT)['immutableFiles']:
  if name.startswith(PREFIX+'release-review'):
   p=target/name.removeprefix(PREFIX);obj=read(p)
   require(BINDING not in obj,'Unexpected existing VII binding')
   obj['implementationSha256']=receipt['implementationSha256'];obj[BINDING]=binding;p.write_bytes(encoded(obj))
 validate_extension(ROOT,target)
 registry=read(target/'candidate-chapters.json')
 require([x['chapter'] for x in registry['chapters']]==[7],'Unexpected candidate registry')
 registry['chapters']=[];(target/'candidate-chapters.json').write_bytes(encoded(registry))
 scope=read(ROOT/'tools/geometry-textbook/release-scope.json');scope['chapters'].append(SCOPE);scope['totalCards']+=190
 dest=output/'tools/geometry-textbook';dest.mkdir(parents=True);(dest/'release-scope.json').write_bytes(encoded(scope))
 bundle=compose(target);validate_release(bundle,ROOT,target,scope=scope)
 (target/'data/course.json').write_text(json.dumps(bundle,ensure_ascii=False,separators=(',',':'))+'\n')
 print(json.dumps({'stageOnly':True,'cards':len(bundle['lessons']),'allExistingApprovalsVerified':True,'publicationApprovalGranted':False,'publicFilesModified':False,'output':str(output)},ensure_ascii=False))
 return bundle
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);a=p.parse_args();stage(a.output)
