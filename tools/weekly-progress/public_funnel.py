#!/usr/bin/env python3
"""Fetch public HTML/JS only. No JS execution, private reports, cookies or outbound messages."""
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse
import concurrent.futures, datetime, hashlib, json, os, pathlib, subprocess, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[2]
ROUTES = ['/', '/lessons/', '/courses/', '/foundations/', '/trainers/oge-course/', '/topics/', '/topics/delenie-ugolkom/', '/topics/obyknovennye-drobi/', '/topics/procenty/', '/topics/lineynye-uravneniya/', '/topics/oge-geometriya/', '/assets/lesson-funnel.js']
OUT = pathlib.Path(os.environ.get('WEEKLY_EVIDENCE', 'artifacts/weekly/funnel'))
OUT.mkdir(parents=True, exist_ok=True)

CONTACTS = ['https://t.me/ladynata3000', 'https://vk.ru/ladynata3000']
CHANNELS = ['https://t.me/mathexamspace', 'https://max.ru/join/KKMgzGoEUezcYD_sJGMdvP1hcy90-3sTiZvkRk1_I3c']
EVENTS = ['lesson_page_view', 'lesson_details_click', 'lesson_invitation_view', 'channel_invitation_view', 'lesson_contact_click', 'channel_click']

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links, self.scripts, self.active = [], [], None
    def handle_starttag(self, tag, attributes):
        a = dict(attributes)
        if tag == 'a':
            self.active = {'href': a.get('href',''), 'classes': a.get('class','').split(), 'text': ''}
            self.links.append(self.active)
        if tag == 'script':
            self.scripts.append(a)
    def handle_endtag(self, tag):
        if tag == 'a':
            self.active = None
    def handle_data(self, value):
        if self.active is not None:
            self.active['text'] += value

def coverage(content, route):
    text = content.decode('utf-8')
    if route.endswith('.js'):
        literal = [name for name in EVENTS if name in text]
        dynamic = "kind + '_invitation_view'" in text and "? 'channel' : 'lesson'" in text
        missing = [name for name in EVENTS if name not in literal and not (dynamic and name.endswith('_invitation_view'))]
        return {'counter':113810914, 'literalEventIdentifiers':literal, 'dynamicInvitationEvents':dynamic, 'behaviorGate':'tools/lesson-funnel.test.cjs', 'errors':missing + ([] if '113810914' in text else ['counter missing'])}
    parser = Links()
    parser.feed(text)
    for link in parser.links:
        link['text'] = ' '.join(link['text'].split())
    primary = [a for a in parser.links if 'me-contact-button' in a['classes'] and a['href'] in CONTACTS + CHANNELS]
    errors = []
    for url in CONTACTS + CHANNELS:
        matching = [a for a in primary if a['href'] == url]
        if len(matching) != 1 or not matching[0]['text']:
            errors.append('Missing, duplicated or unlabelled primary button: '+url)
    if len(primary) != 4:
        errors.append('Expected exactly four primary buttons')
    script = [a for a in parser.scripts if a.get('src') == '/assets/lesson-funnel.js?v=20261026']
    if len(script) != 1 or 'defer' not in script[0]:
        errors.append('Expected one deferred counter module')
    navigation, anchors = [], []
    for link in parser.links:
        target = urlparse(urljoin('https://mathexam.space'+route,link['href']))
        if target.netloc == 'mathexam.space' and target.path == '/lessons/':
            (anchors if route == '/lessons/' and target.fragment else navigation).append({'href':link['href'],'text':link['text']})
    return {'personalButtons':[a for a in primary if a['href'] in CONTACTS], 'subscriptionButtons':[a for a in primary if a['href'] in CHANNELS], 'lessonNavigation':navigation, 'lessonAnchors':anchors, 'errors':errors}

def check(route):
    relative = route.lstrip('/') + ('index.html' if route.endswith('/') else '')
    result = {'route':route, 'sourceSha256':hashlib.sha256((ROOT/relative).read_bytes()).hexdigest()}
    try:
        req = urllib.request.Request('https://mathexam.space'+route, headers={'User-Agent':'MathExam-Public-ReadOnly-QA/1.0','Cache-Control':'no-cache'})
        with urllib.request.urlopen(req, timeout=35) as response:
            content=response.read()
            result.update(status=response.status,finalUrl=response.url,date=response.headers.get('Date'),age=response.headers.get('Age'),liveSha256=hashlib.sha256(content).hexdigest())
        result['matchesSource']=result['sourceSha256']==result['liveSha256']
        result['coverage']=coverage(content,route)
        destination=OUT/'public-bytes'/relative
        destination.parent.mkdir(parents=True,exist_ok=True)
        destination.write_bytes(content)
    except Exception as error:
        result.update(error=str(error),matchesSource=None)
    return result

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    results=list(pool.map(check, ROUTES))
report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sourceHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'resources':results,'coverageTotals':{'personalButtons':sum(len(r.get('coverage',{}).get('personalButtons',[])) for r in results),'subscriptionButtons':sum(len(r.get('coverage',{}).get('subscriptionButtons',[])) for r in results),'lessonNavigation':sum(len(r.get('coverage',{}).get('lessonNavigation',[])) for r in results),'lessonNavigationFromOtherPages':sum(len(r.get('coverage',{}).get('lessonNavigation',[])) for r in results if r['route']!='/lessons/')},'privateAnalyticsAccess':False,'analyticsTotals':None,'sentMessages':None,'bookings':None,'liveAnalyticsRequests':False}
(OUT/'public-funnel.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
if not all(item.get('status')==200 and item.get('matchesSource') is True and item.get('coverage',{}).get('errors')==[] for item in results):
    raise SystemExit('LIVE_FUNNEL_PARITY_NOT_CONFIRMED: inspect per-resource evidence; missing data is not zero.')
print('LIVE_FUNNEL_12_RESOURCES_MATCH')
