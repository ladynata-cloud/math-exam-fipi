#!/usr/bin/env python3
"""Single bounded ready-result consultation; failure is not approval."""
import datetime,hashlib,json,os,urllib.request,urllib.error
from pathlib import Path
root=Path(__file__).resolve().parents[2];out=root/'artifacts/shestakov-consultation/result.json';out.parent.mkdir(parents=True,exist_ok=True)
r={'provider':'Anthropic','model':'claude-opus-4-7','purpose':'Bounded review of three authored examples, not exhaustive review or deployment approval','base':os.getenv('REVIEW_BASE_SHA'),'head':os.getenv('REVIEW_HEAD_SHA'),'pr':os.getenv('REVIEW_PR_URL'),'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'unavailable'}
def save():out.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print('Consultation status: '+r['status'])
key=os.environ.get('ANTHROPIC_API_KEY','').strip()
if not key:r['reason']='Authorized API credential unavailable in this Actions job';save();raise SystemExit(0)
b=json.loads((root/'stereo-course/shestakov-yaschenko-10-11/data/course.json').read_text())
samples=[]
for section in ['1.3','4.2','6.1']:
 candidates=[x for x in b['lessons'] if x['source']['section']==section and x['kind']=='exercise' and x['source']['level']=='C']
 if not candidates:candidates=[x for x in b['lessons'] if x['source']['section']==section and x['kind']=='exercise']
 x=candidates[0];samples.append({k:x[k] for k in ['id','statement','steps','answer','help','visualization']})
brief={'goal':'Проверить три авторских разбора геометрии 10–11. Условие и крупная модель, подсказка по запросу, предыдущие шаги сохраняются. Умение с помощью отделяется от самостоятельного; доказательства не оцениваются автоматически. Курс охватывает 27 тем, имеет 324 решения; ещё 1656 вариантов не разобраны и честно помечены.','limitations':'Видишь только этот brief и три карточки; нет исходного PDF, скриншотов или полного кода. Не утверждай, что видел их. Это ограниченная консультация, не release verdict всей книги.','request':'Отдельно оцени математику/координаты и понятность/размер шагов. Дай конкретные ошибки с id или no-findings-in-scope. Не придумывай внешнюю проверку. Предложи одно полезное действие ученика.','samples':samples}
data=json.dumps({'model':r['model'],'max_tokens':2200,'messages':[{'role':'user','content':json.dumps(brief,ensure_ascii=False)}]}).encode()
r['inputSHA256']=hashlib.sha256(data).hexdigest();r['inputBytes']=len(data);r['sampleIds']=[x['id'] for x in samples]
if len(data)>100000:r.update(status='insufficient-evidence',reason='Fixed input size bound exceeded');save();raise SystemExit(0)
req=urllib.request.Request('https://api.anthropic.com/v1/messages',data=data,headers={'x-api-key':key,'anthropic-version':'2023-06-01','content-type':'application/json'})
try:
 with urllib.request.urlopen(req,timeout=150) as response:d=json.load(response)
 text='\n'.join(x.get('text','') for x in d.get('content',[]) if x.get('type')=='text')
 if not text:raise ValueError('empty response')
 r.update(status='truncated' if d.get('stop_reason')=='max_tokens' else 'completed',response=text,responseId=d.get('id'),actualModel=d.get('model'),usage=d.get('usage'))
except urllib.error.HTTPError as e:r.update(status='failed',reason='Provider HTTP '+str(e.code)+'; no automatic retry')
except Exception as e:r.update(status='failed',reason=type(e).__name__+'; no automatic retry')
save()
