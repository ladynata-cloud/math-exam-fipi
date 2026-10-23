#!/usr/bin/env python3
"""Independent structural audit of this edition's875positions and exact required-part mapping.
This checks inventory identities and source metadata, not the truth of authored solutions.
It never changes inventoryComplete, lesson reviews or the source index.
"""
import collections,hashlib,json
from pathlib import Path
R=Path(__file__).resolve().parents[2];C=R/'stereo-course/merzlyak-10-base';idx=json.loads((C/'source-index.json').read_text());entries=idx['entries'];checks=0

def check(ok,label):
 global checks;checks+=1
 assert bool(ok),label

def source_key(s):return(s['collection'],s.get('examTask'),s.get('chapter')if s['collection']in['selfcheck','example']else None,s.get('exercise'),s.get('point'))
def pagecheck(s,label):
 check(s['bookId']=='merzlyak-2022-10-base',label+' book');check(s['pdfPages']==[p+1 for p in s['printedPages']],label+' offset');check(len(s['pdfPages'])==len(set(s['pdfPages'])),label+' repeated page');check(all(isinstance(p,int)and 1<=p<=209 for p in s['pdfPages']),label+' page range')
check(len(entries)==875,'875sourcepositions');check(len({e['id']for e in entries})==875,'unique source IDs');check(len({source_key(e['source'])for e in entries})==875,'unique source identities')
bycollection=collections.Counter(e['source']['collection']for e in entries);check(bycollection=={'main':723,'selfcheck':97,'theory':19,'practical':18,'research':18},'edition collection counts')
# Verify every decimal exercise number, independently of coverage manifests.
exercise_counts=[27,20,32,28,41,34,40,18,41,41,30,34,41,35,19,47,29,59,16,91]
expected_numbers={f'{p}.{n}'for p,total in enumerate(exercise_counts,1)for n in range(1,total+1)}
check({e['source']['exercise']for e in entries if e['source']['collection']=='main'}==expected_numbers,'all723paragraph exercise numbers, none skipped or added')
expected_supplements={f'sections-{n}'for n in range(1,7)}|{f'skew-lines-{n}'for n in range(1,8)}
research={e['source']['exercise']for e in entries if e['source']['collection']=='research'};check(research==expected_supplements|{f'project-{n}'for n in range(1,6)},'13supplements plus5projects');check(len(expected_numbers)+len(expected_supplements)==736,'736standalone numbers')
check({e['source']['point']for e in entries if e['source']['collection']=='theory'}=={str(n)for n in range(1,20)},'19theorypoints')
qcounts=[5,2,4,7,4,4,7,4,8,8,1,1,7,3,1,11,7,7,6]
check({e['source']['exercise']for e in entries if e['source']['collection']=='selfcheck'}=={f'{p}.{n}'for p,total in enumerate(qcounts,1)for n in range(1,total+1)},'97numbered theory questions')
check({e['source']['exercise']for e in entries if e['source']['collection']=='practical'}=={f'paragraph-{n}'for n in range(1,20)if n!=11},'18computer blocks; no source block11')
indexed={source_key(e['source']):e for e in entries};grouped=collections.defaultdict(list);lessonids=set();fingerprint=[]
for p in sorted((C/'lessons').glob('*.json')):
 data=p.read_bytes();d=json.loads(data);s=d['source'];key=source_key(s);pagecheck(s,d['id']);check(d['id']not in lessonids,'unique lesson ID');lessonids.add(d['id']);check(key in indexed,d['id']+' has sourcegroup');e=indexed[key];check(d['kind']==e['kind'],d['id']+' kind');check(s.get('chapter')==e['source'].get('chapter'),d['id']+' exact chapter');check(set(s['pdfPages'])<=set(e['source']['pdfPages']),d['id']+' source page containment');grouped[key].append(d);fingerprint.append([p.relative_to(R).as_posix(),hashlib.sha256(data).hexdigest()])
manifest_cache={};component_count=0
for key,e in indexed.items():
 pagecheck(e['source'],e['id']);parts=e.get('requiredParts');check(isinstance(parts,list)and bool(parts),e['id']+' explicit required parts');check(len(set(parts))==len(parts),e['id']+' distinct required parts');check(all(x is None or(isinstance(x,str)and x.strip())for x in parts),e['id']+' meaningful part identities');actual=[l['source'].get('subpart')for l in grouped[key]];check(sorted(actual,key=str)==sorted(parts,key=str),e['id']+' exact one-to-one authored parts');component_count+=len(parts)
 if e.get('authorshipManifest'):
  f=e['authorshipManifest']
  if f not in manifest_cache:
   m=json.loads((R/f).read_text());records=m.get('entries',m.get('paragraphs',[]));manifest_cache[f]={r.get('sourceId',r.get('sourceEntryId')):r for r in records}
  record=manifest_cache[f].get(e['id']);check(record is not None,e['id']+' manifest identity');check(record['requiredParts']==parts,e['id']+' explicit manifest contract unchanged')
check(len(grouped)==875,'every sourcegroup has authored components');check(component_count==len(lessonids),'allrequiredcomponents represented exactly once')
result={'result':'PASS','checks':checks,'sourcePositions':875,'standaloneNumberedExercises':736,'paragraphExercises':723,'supplementaryExercises':13,'theoryParagraphs':19,'theoryQuestions':97,'computerBlocks':18,'projectTopics':5,'requiredComponents':component_count,'authoredCards':len(lessonids),'inventoryCompleteFlag':idx['inventoryComplete'],'sourceIndexSHA256':hashlib.sha256((C/'source-index.json').read_bytes()).hexdigest(),'lessonFilesFingerprintSHA256':hashlib.sha256(json.dumps(fingerprint,ensure_ascii=False,separators=(',',':')).encode()).hexdigest(),'fingerprintFormat':'SHA256 of compact JSON sorted [repositoryRelativePath,fileSHA256] pairs','mathematicsReviewedByThisAudit':False}
print(json.dumps(result,ensure_ascii=False))
