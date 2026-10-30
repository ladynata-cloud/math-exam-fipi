#!/usr/bin/env python3
"""Fetch public HTML/JS only. No JS execution, private reports, cookies or outbound messages."""
import concurrent.futures, datetime, hashlib, json, os, pathlib, subprocess, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[2]
ROUTES = ['/', '/lessons/', '/courses/', '/foundations/', '/trainers/oge-course/', '/topics/', '/topics/delenie-ugolkom/', '/topics/obyknovennye-drobi/', '/topics/procenty/', '/topics/lineynye-uravneniya/', '/topics/oge-geometriya/', '/assets/lesson-funnel.js']
OUT = pathlib.Path(os.environ.get('WEEKLY_EVIDENCE', 'artifacts/weekly/funnel'))
OUT.mkdir(parents=True, exist_ok=True)

def check(route):
    relative = route.lstrip('/') + ('index.html' if route.endswith('/') else '')
    result = {'route':route, 'sourceSha256':hashlib.sha256((ROOT/relative).read_bytes()).hexdigest()}
    try:
        req = urllib.request.Request('https://mathexam.space'+route, headers={'User-Agent':'MathExam-Public-ReadOnly-QA/1.0','Cache-Control':'no-cache'})
        with urllib.request.urlopen(req, timeout=35) as response:
            content=response.read()
            result.update(status=response.status,finalUrl=response.url,date=response.headers.get('Date'),age=response.headers.get('Age'),liveSha256=hashlib.sha256(content).hexdigest())
        result['matchesSource']=result['sourceSha256']==result['liveSha256']
        destination=OUT/'public-bytes'/relative
        destination.parent.mkdir(parents=True,exist_ok=True)
        destination.write_bytes(content)
    except Exception as error:
        result.update(error=str(error),matchesSource=None)
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(check, ROUTES))
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'resources':results,'privateAnalyticsAccess':False,'analyticsTotals':None,'sentMessages':None,'bookings':None,'liveAnalyticsRequests':False}
(OUT/'public-funnel.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
if not all(item.get('status')==200 and item.get('matchesSource') is True for item in results):
    raise SystemExit('LIVE_FUNNEL_PARITY_NOT_CONFIRMED: inspect per-resource evidence; missing data is not zero.')
print('LIVE_FUNNEL_12_RESOURCES_MATCH')
