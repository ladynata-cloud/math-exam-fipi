"""Negative controls for the evidence delta; original math fixture pins stay exact."""
import copy
import importlib.util
import json
import subprocess
import unittest
from unittest.mock import patch
from oge_video_models_book_context import ROOT, PINS, LABEL, SUMMARY_HTML, ASSETS, sha, without_closed_video_summary, without_closed_video_geometry

spec = importlib.util.spec_from_file_location('book_math', ROOT / 'tools/oge-book-exam-math.py')
math = importlib.util.module_from_spec(spec)
spec.loader.exec_module(math)


class ContextTests(unittest.TestCase):
    def setUp(self):
        self.fixtures = json.loads((ROOT / 'tools/fixtures/oge-book-exam-math.json').read_text())['fixtures']
        fixture = self.fixtures['63'].get('sourceVariant', self.fixtures['63'])
        self.oracle = fixture['oracles'][0]
        file = 'trainers/oge-task22-functions-graphs.html'
        route = '/' + file
        pin = PINS['pages'][file]
        raw = (ROOT / file).read_bytes()
        before, after = fixture['visibleText'].split(' ', 1)
        before += ' '
        after = ' ' + after
        assets = {asset: sha((ROOT / asset[1:]).read_bytes()) for asset in ASSETS}
        context = dict(kind='oge-video-models-closed-v1', route=route, bookId='63', task=22,
                       sourceBase=PINS['baseCommit'], sourceSha256=sha(raw), nativeSha256=pin['sha256'],
                       closed=True, summaryHtml=SUMMARY_HTML, label=LABEL, offsetCodePoints=len(before),
                       beforeText=before, afterText=after, assets=assets, closedSvg=[])
        text = before + LABEL + after
        nav = '← Все темы ОГЭ Главная'
        self.record = dict(id='63', prefix='', route=route, finalPath=route, initialVisibleText=text,
                           unfilteredInitialVisibleText=nav+' '+text, visibleSvgLabels=[], videoModelContext=context,
                           publicWayfinding=dict(kind='oge-return-v1', visibleText=nav,
                               servedHtmlSha256=sha(raw), originalHtmlSha256='a'*64),
                           resources={route:dict(sha256=sha(raw),status=200),
                                      **{asset:dict(sha256=value,status=200) for asset,value in assets.items()}})
        self.original_text = fixture['visibleText']

    def accepted(self, record, oracle=None):
        return math.exact_reviewed_context(record, self.oracle if oracle is None else oracle, self.fixtures)

    def test_exact_receipt_keeps_raw_evidence_and_restores_only_native_comparison(self):
        before = copy.deepcopy(self.record)
        self.assertEqual(without_closed_video_summary(self.record), self.original_text)
        self.assertTrue(self.accepted(self.record))
        self.assertEqual(self.record, before)

    def test_composed_task11_requires_both_exact_closed_summary_witnesses(self):
        record = copy.deepcopy(self.record)
        route = '/trainers/oge-task11-graphs-trainer.html'
        raw = (ROOT / route[1:]).read_bytes()
        record.update(id='54', route=route, finalPath=route)
        context = record['videoModelContext']
        before, after = 'Native condition. Разобраться на опыте ', ' Native footer.'
        context.update(route=route, bookId='54', task=11, sourceSha256=sha(raw),
                       nativeSha256=PINS['pages'][route[1:]]['sha256'],
                       beforeText=before, afterText=after, offsetCodePoints=len(before))
        record['initialVisibleText'] = before + LABEL + after
        record['unfilteredInitialVisibleText'] = record['publicWayfinding']['visibleText']+' '+record['initialVisibleText']
        record['publicWayfinding']['servedHtmlSha256'] = sha(raw)
        record['resources'][route] = dict(sha256=sha(raw), status=200)
        record['optionalActiveLearning'] = dict(kind='oge-active-learning-v1', task=11,
            collapsed=True, visibleText='Разобраться на опыте',
            includeBlockSha256=math.active_include_hash(11),
            preservedNativeSha256=math.ACTIVE_NATIVE[11][1])
        oracle = dict(prompt='Synthetic condition', expected=['1'])
        fixtures = {'54': dict(visibleText='Native condition. Native footer.',
                              geometrySha256=math.geom([]), oracles=[oracle])}
        accepted = lambda value: math.exact_reviewed_context(value, oracle, fixtures)
        self.assertTrue(accepted(record))
        for field in ['optionalActiveLearning', 'videoModelContext']:
            changed=copy.deepcopy(record);del changed[field]
            self.assertFalse(accepted(changed), field)
        for key, value in [('collapsed', False), ('task', 12), ('preservedNativeSha256', '0'*64)]:
            changed=copy.deepcopy(record);changed['optionalActiveLearning'][key]=value
            self.assertFalse(accepted(changed), key)
        original_read=type(ROOT).read_bytes;target=ROOT/route[1:]
        for change in [lambda value:value.replace(b'defer src="oge-active-learning.js?v=',b'async src="oge-active-learning.js?v='),
                       lambda value:value.replace(b' data-oa-task="11"',b' data-oa-task="12"'),
                       lambda value:value.replace(b'</head>',b'<script>void "unreviewed";</script></head>')]:
            self.assertNotEqual(change(raw), raw, 'negative control changes the actual source')
            with patch.object(type(ROOT),'read_bytes',lambda p:change(original_read(p)) if p==target else original_read(p)):
                self.assertFalse(accepted(record))

    def test_changed_identity_closed_state_source_and_asset_receipts_reject(self):
        for key, value in [('kind','other'),('route','/other.html'),('bookId','54'),('task',11),
                           ('sourceBase','0'*40),('sourceSha256','0'*64),('nativeSha256','0'*64),
                           ('closed',False),('summaryHtml','<summary>altered</summary>'),('label','altered'),
                           ('offsetCodePoints',0),('beforeText','altered '),('afterText',' altered')]:
            record=copy.deepcopy(self.record);record['videoModelContext'][key]=value
            self.assertFalse(self.accepted(record),key)
        for key,value in [('id','54'),('route','/other.html'),('finalPath','/other.html'),('prefix','/book/oge/2026-10-31/v1')]:
            record=copy.deepcopy(self.record);record[key]=value;self.assertFalse(self.accepted(record),key)
        for asset in ASSETS:
            for where in ['resources','videoModelContext']:
                record=copy.deepcopy(self.record)
                container=record[where] if where=='resources' else record[where]['assets']
                del container[asset];self.assertFalse(self.accepted(record))
            record=copy.deepcopy(self.record);record['resources'][asset]['sha256']='0'*64;self.assertFalse(self.accepted(record))
            record=copy.deepcopy(self.record);record['videoModelContext']['assets'][asset]='0'*64;self.assertFalse(self.accepted(record))
        record=copy.deepcopy(self.record);record['resources'][record['route']]['sha256']='0'*64;self.assertFalse(self.accepted(record))
        record=copy.deepcopy(self.record);del record['publicWayfinding'];del record['unfilteredInitialVisibleText'];self.assertFalse(self.accepted(record),'raw navigation chain cannot be omitted')

    def test_exact_native_text_prompt_answer_and_geometry_are_still_required(self):
        for side in ['beforeText','afterText']:
            record=copy.deepcopy(self.record);record['videoModelContext'][side]+='changed condition '
            c=record['videoModelContext'];c['offsetCodePoints']=len(c['beforeText'])
            record['initialVisibleText']=c['beforeText']+LABEL+c['afterText']
            record['unfilteredInitialVisibleText']=record['publicWayfinding']['visibleText']+' '+record['initialVisibleText']
            self.assertFalse(self.accepted(record),side)
        record=copy.deepcopy(self.record);c=record['videoModelContext'];c['afterText']=c['afterText'].replace(' ', '  ', 2)
        record['initialVisibleText']=c['beforeText']+LABEL+c['afterText']
        record['unfilteredInitialVisibleText']=record['publicWayfinding']['visibleText']+' '+record['initialVisibleText']
        self.assertFalse(self.accepted(record),'updated receipt cannot normalize unrelated native whitespace')
        for visible in [self.record['initialVisibleText'].replace(LABEL,''),self.record['initialVisibleText']+' '+LABEL]:
            record=copy.deepcopy(self.record);record['initialVisibleText']=visible;self.assertFalse(self.accepted(record))
        for field,value in [('prompt','changed problem'),('expected',['999'])]:
            oracle=copy.deepcopy(self.oracle);oracle[field]=value;self.assertFalse(self.accepted(self.record,oracle))
        record=copy.deepcopy(self.record);record['visibleSvgLabels']=[{'svg':'<svg><text x="1">changed geometry</text></svg>'}];self.assertFalse(self.accepted(record))

    def test_unicode_offsets_count_code_points_without_normalizing_native_text(self):
        record=copy.deepcopy(self.record);c=record['videoModelContext'];c['beforeText']='🧭 '+c['beforeText'];c['offsetCodePoints']=len(c['beforeText'])
        record['initialVisibleText']=c['beforeText']+LABEL+c['afterText'];record['unfilteredInitialVisibleText']=record['publicWayfinding']['visibleText']+' '+record['initialVisibleText']
        self.assertEqual(without_closed_video_summary(record),'🧭 '+self.original_text)
        c['offsetCodePoints']=len(c['beforeText'].encode('utf-16-le'))//2
        self.assertIsNone(without_closed_video_summary(record))

    def test_only_one_source_bound_closed_L8_preview_is_removed_from_geometry_comparison(self):
        preview=PINS['closedPreview']
        svg=subprocess.check_output(['node','-e',"const {JSDOM}=require('jsdom');const l=require('./trainers/oge-video-geometry.js').find(x=>x.id==='midpoints-common-circle');const d=new JSDOM(l.preview({x:2}).svg);process.stdout.write(d.window.document.querySelector('svg').outerHTML);d.window.close();"],cwd=ROOT,text=True)
        self.assertEqual(sha(svg.encode()),preview['svgSha256'])
        record=copy.deepcopy(self.record);c=record['videoModelContext'];route='/trainers/oge-task24-proofs.html';pin=PINS['pages'][route[1:]];raw=(ROOT/route[1:]).read_bytes()
        record.update(id='65',route=route,finalPath=route);c.update(route=route,bookId='65',task=24,sourceSha256=sha(raw),nativeSha256=pin['sha256'])
        record['resources'][route]=dict(sha256=sha(raw),status=200);record['publicWayfinding']['servedHtmlSha256']=sha(raw)
        native={'svg':'<svg><text>native sentinel</text></svg>'};record['visibleSvgLabels']=[native,{'svg':svg}]
        item=dict(index=1,selector=preview['selector'],lesson=preview['lesson'],stage=preview['stage'],closed=True,hidden=True,svgSha256=preview['svgSha256']);c['closedSvg']=[item]
        self.assertEqual(without_closed_video_geometry(record),[native]);self.assertEqual(len(record['visibleSvgLabels']),2)
        for key,value in [('index',0),('index',2),('selector','svg'),('lesson','other'),('stage','experiment'),('closed',False),('hidden',False),('svgSha256','0'*64)]:
            changed=copy.deepcopy(record);changed['videoModelContext']['closedSvg'][0][key]=value;self.assertIsNone(without_closed_video_geometry(changed),key)
        for hidden in [[],[item,item]]:
            changed=copy.deepcopy(record);changed['videoModelContext']['closedSvg']=hidden;self.assertIsNone(without_closed_video_geometry(changed))
        changed=copy.deepcopy(record);changed['visibleSvgLabels'][1]['svg']=svg.replace('130 0','131 0');self.assertIsNone(without_closed_video_geometry(changed))

    def test_mutated_or_missing_source_block_cannot_be_excused_by_forged_dom_receipt(self):
        original_read=type(ROOT).read_bytes;target=ROOT/self.record['route'][1:]
        for change in [lambda raw:raw.replace(b'</body>',b'<p>changed condition</p></body>'),
                       lambda raw:raw.replace(b'defer src="oge-video-models.js"',b'async src="oge-video-models.js"'),
                       lambda raw:raw.replace(b'<script defer src="oge-video-models.js"',b'<script defer src="missing-models.js"')]:
            with patch.object(type(ROOT),'read_bytes',lambda p:change(original_read(p)) if p==target else original_read(p)):
                self.assertIsNone(without_closed_video_summary(self.record))


if __name__=='__main__':
    unittest.main()
