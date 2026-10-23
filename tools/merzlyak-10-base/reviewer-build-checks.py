#!/usr/bin/env python3
"""Independent read-only reproducibility test for the isolated course builder.
Writes only to a TemporaryDirectory; repository materials and generated bundle
are read inputs. Does not promote reviews or alter source completeness contracts.
"""
import hashlib,json,os,pathlib,shutil,subprocess,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[2]
course=pathlib.Path('stereo-course/merzlyak-10-base')
files=[pathlib.Path('tools/stereo-textbook/build_textbook.py'),pathlib.Path('stereo-course/textbook/schema/catalog.schema.json'),course/'source-index.json',*sorted((ROOT/course/'lessons').glob('*.json'))]
files=[f.relative_to(ROOT) if f.is_absolute() else f for f in files]
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
original={str(f):sha(ROOT/f) for f in files}
with tempfile.TemporaryDirectory(prefix='merzlyak-independent-build-') as td:
 target=pathlib.Path(td)
 for f in files:
  (target/f).parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/f,target/f)
 cmd=['python3',str(ROOT/'tools/merzlyak-10-base/build.py'),'--root',td]
 env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
 first=subprocess.run(cmd,env=env,capture_output=True,text=True,check=True)
 output=target/course/'data/course.json';one=output.read_bytes();bundle=json.loads(one)
 second=subprocess.run(cmd,env=env,capture_output=True,text=True,check=True)
 assert output.read_bytes()==one,'A repeated build must be byte-identical'
 for f in files:
  assert sha(target/f)==original[str(f)],f'Builder mutated input {f}'
  assert sha(ROOT/f)==original[str(f)],f'Input changed concurrently during review: {f}'
 schema=json.loads((ROOT/'stereo-course/textbook/schema/catalog.schema.json').read_text());allowed=set(schema['$defs']['source']['properties'])
 inputs={json.loads((target/f).read_text())['id']:json.loads((target/f).read_text()) for f in files if f.parent==course/'lessons'}
 assert len(bundle['lessons'])==len(inputs)
 for lesson in bundle['lessons']:
  authored=inputs[lesson['id']]
  assert lesson['status']==authored['status'] and lesson['review']==authored['review']
  assert lesson['statement']==authored['statement'] and lesson['visualization']==authored['visualization']
  assert lesson['source']=={k:v for k,v in authored['source'].items() if k in allowed}
  for step,original_step in zip(lesson['steps'],authored['steps']):
   assert step['explanation']==original_step['explanation']
 assert bundle['catalog']['inventoryComplete']==json.loads((target/course/'source-index.json').read_text())['inventoryComplete']
 print(json.dumps({'test':'independent-isolated-build','result':'pass','lessons':len(inputs),'catalogEntries':len(bundle['catalog']['entries']),'bundleSha256':hashlib.sha256(one).hexdigest(),'sourceIndexSha256':original[str(course/'source-index.json')],'repeatedBuildByteIdentical':True,'inputMutations':0}))
