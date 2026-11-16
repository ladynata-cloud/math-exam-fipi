"""Negative controls for the evidence delta; original math fixture pins stay exact."""
import copy
import importlib.util
import json
import subprocess
import unittest
from unittest.mock import patch
from oge_video_models_book_context import (ROOT, PINS, UPDATES, LABEL, SUMMARY_HTML, ASSETS,
    GRAPH_INTERSECTIONS, TASK19_CACHE_VERSIONS, sha, restore_graph_intersections,
    restore_task19_cache_versions, without_download_controls,
    without_closed_video_summary, without_closed_video_geometry)

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
        record=copy.deepcopy(self.record);c=record['videoModelContext'];route='/trainers/oge-task24-proofs.html';pin=PINS['pages'][route[1:]] | UPDATES['pages'][route[1:]];raw=(ROOT/route[1:]).read_bytes()
        record.update(id='65',route=route,finalPath=route);c.update(route=route,bookId='65',task=24,sourceBase=pin['sourceCommit'],sourceSha256=sha(raw),nativeSha256=pin['sha256'])
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

    def test_intersection_delta_rejects_partial_duplicate_and_unrelated_math_even_with_matching_served_hash(self):
        file = GRAPH_INTERSECTIONS['file']
        self.assertEqual(file, self.record['route'][1:])
        self.assertEqual(GRAPH_INTERSECTIONS['sourceBase'], '1dea53a92200942bd40712cfed2ce06085d0c892')
        self.assertEqual(GRAPH_INTERSECTIONS['task'], 'docs/tasks/TRAINER_DOWNLOADS_STAGE4_20261114.md')
        self.assertEqual(len(GRAPH_INTERSECTIONS['fragments']), 3)
        target = ROOT / file
        raw = target.read_bytes()
        self.assertNotEqual(restore_graph_intersections(file, raw), raw)
        self.assertEqual(restore_graph_intersections('unrelated.html', raw), raw)
        mutations = []
        for fragment in GRAPH_INTERSECTIONS['fragments']:
            after = fragment['after'].encode()
            self.assertEqual(raw.count(after), 1)
            for replacement in (fragment['before'].encode(), after * 2, after.replace(b'addMeasureH', b'unreviewedMeasureH')):
                changed = raw.replace(after, replacement, 1)
                self.assertNotEqual(changed, raw)
                self.assertEqual(restore_graph_intersections(file, changed), changed)
                mutations.append(changed)
        changed_math = raw.replace(b'const x=1/(C-m);', b'const x=2/(C-m);', 1)
        self.assertNotEqual(changed_math, raw)
        self.assertIn(b'const x=2/(C-m);', restore_graph_intersections(file, changed_math))
        mutations.append(changed_math)
        original_read = type(target).read_bytes
        for changed in mutations:
            record = copy.deepcopy(self.record)
            digest = sha(changed)
            record['videoModelContext']['sourceSha256'] = digest
            record['resources'][record['route']]['sha256'] = digest
            record['publicWayfinding']['servedHtmlSha256'] = digest
            with patch.object(type(target), 'read_bytes', lambda p: changed if p == target else original_read(p)):
                self.assertIsNone(without_closed_video_summary(record), 'a current served hash cannot excuse changed native mathematics')

    def task19_context(self):
        file = 'trainers/task19-trainer.html'
        route = '/' + file
        raw = (ROOT / file).read_bytes()
        pin = dict(PINS['pages'][file], sourceCommit=PINS['baseCommit']) | UPDATES['pages'][file]
        fixture = self.fixtures['71'].get('sourceVariant', self.fixtures['71'])
        before, after = fixture['visibleText'].split(' ', 1)
        before += ' '
        after = ' ' + after
        record = copy.deepcopy(self.record)
        record.update(id='71', route=route, finalPath=route,
                      initialVisibleText=before + LABEL + after)
        record['unfilteredInitialVisibleText'] = record['publicWayfinding']['visibleText'] + ' ' + record['initialVisibleText']
        record['publicWayfinding']['servedHtmlSha256'] = sha(raw)
        record['videoModelContext'].update(route=route, bookId='71', task=19,
            sourceBase=pin['sourceCommit'], sourceSha256=sha(raw), nativeSha256=pin['sha256'],
            offsetCodePoints=len(before), beforeText=before, afterText=after)
        record['resources'] = {route: dict(sha256=sha(raw), status=200),
                              **{asset: copy.deepcopy(self.record['resources'][asset]) for asset in ASSETS}}
        return record, fixture

    def test_task19_cache_fixture_binds_only_six_exact_tags_to_the_approved_source(self):
        delta = TASK19_CACHE_VERSIONS
        self.assertEqual(delta['file'], 'trainers/task19-trainer.html')
        self.assertEqual(delta['task'], 'docs/tasks/OGE19_MAJOR_SOURCE_EXPANSION_20261116.md')
        self.assertEqual(delta['sourceCommit'], 'd75801c4aa85b3960dcc4414f0ae57ae7e54b9f9')
        self.assertTrue((ROOT / delta['task']).is_file())
        scripts = ['task19-visual-data.js', 'task19-models-triangles.js', 'task19-models-circles.js',
                   'task19-models-lines-polygons.js', 'task19-visual-models.js', 'task19-textbook-data.js']
        expected = [dict(script=script,
                        before=f'  <script defer src="{script}?v=sources-20261021"></script>\n',
                        after=f'  <script defer src="{script}?v=major-sources-20261116"></script>\n')
                    for script in scripts]
        self.assertEqual(delta['fragments'], expected)

    def test_task19_complete_cache_delta_preserves_old_full_body_pin_and_receipt(self):
        file = TASK19_CACHE_VERSIONS['file']
        raw = (ROOT / file).read_bytes()
        restored = restore_task19_cache_versions(file, raw)
        self.assertNotEqual(restored, raw)
        for fragment in TASK19_CACHE_VERSIONS['fragments']:
            self.assertEqual(raw.count(fragment['after'].encode()), 1)
            self.assertEqual(restored.count(fragment['before'].encode()), 1)
            self.assertNotIn(fragment['after'].encode(), restored)
        self.assertEqual(restore_task19_cache_versions(file, restored), restored)
        for other in ['unrelated.html', 'trainers/geometry_statements_trainer_improved.html',
                      '/trainers/task19-trainer.html', 'book/oge/2026-10-31/v1/trainers/task19-trainer.html']:
            self.assertEqual(restore_task19_cache_versions(other, raw), raw)
        block = (b'<!-- OGE video-model investigations: standalone practice -->\n'
                 b'<link rel="stylesheet" href="oge-video-models.css">\n'
                 b'<script defer src="oge-video-graphs.js"></script>\n'
                 b'<script defer src="oge-video-geometry.js"></script>\n'
                 b'<script defer src="oge-video-models.js" data-oge-video-task="19"></script>\n')
        historical = subprocess.check_output(['git', 'show', UPDATES['pages'][file]['sourceCommit'] + ':' + file], cwd=ROOT)
        self.assertEqual(restore_task19_cache_versions(file, historical), historical)
        native = without_download_controls(file, restored).replace(block, b'', 1)
        self.assertEqual(native, historical.replace(block, b'', 1), 'entire historical native HTML remains exact')
        self.assertEqual(sha(native), UPDATES['pages'][file]['sha256'])
        record, fixture = self.task19_context()
        original_record = copy.deepcopy(record)
        self.assertEqual(without_closed_video_summary(record), fixture['visibleText'])
        self.assertTrue(math.exact_reviewed_context(record, fixture['oracles'][0], self.fixtures))
        self.assertEqual(record, original_record, 'raw receipts are not rewritten by the inverse')

    def test_task19_partial_duplicate_altered_tags_and_native_edits_reject_even_with_matching_receipts(self):
        file = TASK19_CACHE_VERSIONS['file']
        target = ROOT / file
        raw = target.read_bytes()
        mutations = []
        for fragment in TASK19_CACHE_VERSIONS['fragments']:
            before, after = fragment['before'].encode(), fragment['after'].encode()
            replacements = [before, b'', after * 2, after + before,
                            after.replace(b'defer', b'async'),
                            after.replace(fragment['script'].encode(), b'unreviewed-' + fragment['script'].encode()),
                            after.replace(b'major-sources-20261116', b'unreviewed-version')]
            for replacement in replacements:
                changed = raw.replace(after, replacement, 1)
                self.assertNotEqual(changed, raw)
                self.assertEqual(restore_task19_cache_versions(file, changed), changed,
                                 'partial or ambiguous six-tag delta must stay untouched')
                mutations.append(changed)
        first = TASK19_CACHE_VERSIONS['fragments'][0]['after'].encode()
        mutations += [raw + b'\n', raw.replace(b'<title>', b'<title>Changed ', 1),
                      raw.replace(b'</body>', b'<p>Changed condition</p></body>', 1),
                      raw.replace(first, first + first.replace(b'defer', b'async'), 1),
                      raw.replace(b'task19-reference.js?v=sources-20261021', b'task19-reference.js?v=major-sources-20261116', 1)]
        # A cache inverse must not stand in for the exact optional addon block.
        mutations.append(raw.replace(b'<script defer src="oge-video-models.js" data-oge-video-task="19"></script>\n', b'', 1))
        original_read = type(target).read_bytes
        original_record, fixture = self.task19_context()
        for changed in mutations:
            self.assertNotEqual(changed, raw)
            record = copy.deepcopy(original_record)
            digest = sha(changed)
            record['videoModelContext']['sourceSha256'] = digest
            record['resources'][record['route']]['sha256'] = digest
            record['publicWayfinding']['servedHtmlSha256'] = digest
            with patch.object(type(target), 'read_bytes', lambda p: changed if p == target else original_read(p)):
                self.assertIsNone(without_closed_video_summary(record), 'matching served hashes cannot excuse altered native HTML')
                self.assertFalse(math.exact_reviewed_context(record, fixture['oracles'][0], self.fixtures))
        for route in ['/other.html', '/trainers/geometry_statements_trainer_improved.html',
                      '/book/oge/2026-10-31/v1/trainers/task19-trainer.html']:
            record = copy.deepcopy(original_record)
            record.update(route=route, finalPath=route)
            record['videoModelContext']['route'] = route
            record['resources'][route] = record['resources'][original_record['route']]
            self.assertIsNone(without_closed_video_summary(record), 'wrong route cannot use the task19 cache inverse')

    def test_task19_seeded_source_case_is_independent_and_keeps_every_frozen_fixture_exact(self):
        before = copy.deepcopy(self.fixtures)
        source = before['71'].pop('sourceVariant')
        # Entire canonical fixture map at 403eba9d. A shallow CI checkout does
        # not need that historical Git object to enforce the immutable pin.
        self.assertEqual(sha(math.stable(before).encode()),
            'f09dd4fac5dfc47ac39cfe0a39cce88bd89526d2f1c035ba3bb812ff85fba258',
            'all original cases, including frozen71, remain exact')
        old = before
        oracle = dict(prompt='При пересечении параллельных прямых секущей соответственные углы равны.', expected=True)
        self.assertEqual(source['oracles'], old['71']['oracles'] + [oracle])
        self.assertEqual(source['visibleText'], old['71']['visibleText'])
        self.assertEqual(source['geometrySha256'], old['71']['geometrySha256'])
        self.assertEqual(source['sourceOnlyRoute'], '/trainers/task19-trainer.html')
        record, _ = self.task19_context()
        for item in source['oracles']:
            self.assertTrue(math.exact_reviewed_context(record, item, self.fixtures))
        result, proof, verdict, reason = math.reviewed(record, oracle, 1)
        self.assertIs(result, True)
        self.assertEqual(verdict, 'PASS')
        self.assertIsNone(reason)
        self.assertIn('Перенос на вектор PQ', proof)
        # The proof never reads the submitted truth value; the caller compares it.
        changed = dict(oracle, expected=False)
        self.assertIs(math.reviewed(record, changed, 1)[0], True)
        self.assertFalse(math.exact_reviewed_context(record, changed, self.fixtures))
        for prefix, banner in math.BOOK_BANNERS.items():
            frozen = dict(id='71', prefix=prefix, route=record['route'],
                finalPath=prefix + record['route'],
                initialVisibleText=banner+' '+old['71']['visibleText'], visibleSvgLabels=[])
            for item in old['71']['oracles']:
                self.assertTrue(math.exact_reviewed_context(frozen, item, self.fixtures))
            self.assertFalse(math.exact_reviewed_context(frozen, oracle, self.fixtures), prefix)

    def test_task19_new_exact_case_rejects_changed_premises_route_context_and_geometry(self):
        record, fixture = self.task19_context()
        oracle = fixture['oracles'][-1]
        for prompt in [oracle['prompt'].replace('параллельных ', ''),
                       oracle['prompt'].replace('равны.', 'в сумме дают 180°.'),
                       oracle['prompt'].replace('соответственные', 'любые')]:
            changed = dict(oracle, prompt=prompt)
            self.assertFalse(math.exact_reviewed_context(record, changed, self.fixtures))
            self.assertEqual(math.reviewed(record, changed, 1)[2], 'PENDING')
        for key, value in [('id','70'), ('route','/other.html'), ('finalPath','/other.html'),
                           ('prefix','/book/oge/2026-10-31/v1')]:
            changed = copy.deepcopy(record); changed[key] = value
            self.assertFalse(math.exact_reviewed_context(changed, oracle, self.fixtures), key)
        changed = copy.deepcopy(record)
        changed['visibleSvgLabels'] = [{'svg':'<svg><text>unreviewed geometry</text></svg>'}]
        self.assertFalse(math.exact_reviewed_context(changed, oracle, self.fixtures))
        changed = copy.deepcopy(record); context = changed['videoModelContext']
        context['afterText'] += ' changed premise'
        changed['initialVisibleText'] = context['beforeText'] + LABEL + context['afterText']
        changed['unfilteredInitialVisibleText'] = changed['publicWayfinding']['visibleText'] + ' ' + changed['initialVisibleText']
        self.assertFalse(math.exact_reviewed_context(changed, oracle, self.fixtures))


if __name__=='__main__':
    unittest.main()
