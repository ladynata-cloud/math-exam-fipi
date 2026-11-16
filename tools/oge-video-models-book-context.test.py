"""Negative controls for the evidence delta; original math fixture pins stay exact."""
import copy
import importlib.util
import json
import subprocess
import unittest
from unittest.mock import patch
from oge_video_models_book_context import ROOT, PINS, UPDATES, V3, LABEL, SUMMARY_HTML, ASSETS, GRAPH_INTERSECTIONS, WAYFINDING_LABEL, sha, source_pin, verified_v3_files, verified_v3_wayfinding, restore_graph_intersections, without_closed_video_summary, without_closed_video_geometry

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
        record=copy.deepcopy(self.record);c=record['videoModelContext'];route='/trainers/oge-task24-proofs.html';pin=source_pin(route[1:]);raw=(ROOT/route[1:]).read_bytes()
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

    def frozen_record(self):
        record = copy.deepcopy(self.record)
        prefix, route = V3['prefix'], record['route']
        record['prefix'], record['finalPath'] = prefix, prefix + route
        del record['publicWayfinding']
        files = [route, *ASSETS, '/edition-assets/bootstrap.js', '/edition-assets/edition.css',
                 '/assets/oge-wayfinding.css', '/assets/oge-wayfinding.js']
        record['resources'] = {prefix + file: dict(status=200, sha256=sha((ROOT / (prefix + file)[1:]).read_bytes()))
                               for file in files}
        raw_hash = record['resources'][prefix + route]['sha256']
        record['frozenWayfinding'] = dict(kind='oge-frozen-return-v3', visibleText=WAYFINDING_LABEL,
                                         servedHtmlSha256=raw_hash, manifestSha256=V3['manifestSha256'])
        c = record['videoModelContext']
        c.update(kind='oge-video-models-closed-v3', sourceBase=V3['sourceCommit'], sourceSha256=raw_hash,
                 manifestSha256=V3['manifestSha256'],
                 assets={prefix + asset: record['resources'][prefix + asset]['sha256'] for asset in ASSETS})
        c['afterText'] += ' ' + math.BOOK_BANNERS[prefix]
        record['initialVisibleText'] = c['beforeText'] + LABEL + c['afterText']
        record['unfilteredInitialVisibleText'] = WAYFINDING_LABEL + ' ' + record['initialVisibleText']
        return record

    def test_frozen_v3_keeps_the_exact_manifest_resources_navigation_and_math(self):
        record = self.frozen_record()
        self.assertTrue(verified_v3_files(record, ASSETS))
        self.assertTrue(verified_v3_wayfinding(record))
        self.assertEqual(without_closed_video_summary(record), self.original_text + ' ' + math.BOOK_BANNERS[V3['prefix']])
        self.assertTrue(self.accepted(record))
        for field, value in [('prompt', self.oracle['prompt'] + ' changed'), ('expected', ['999'])]:
            self.assertFalse(self.accepted(record, dict(self.oracle, **{field: value})), field)
        changed = copy.deepcopy(record)
        changed['videoModelContext']['afterText'] += ' changed problem'
        c = changed['videoModelContext']
        changed['initialVisibleText'] = c['beforeText'] + LABEL + c['afterText']
        changed['unfilteredInitialVisibleText'] = WAYFINDING_LABEL + ' ' + changed['initialVisibleText']
        self.assertFalse(self.accepted(changed))
        changed = copy.deepcopy(record); changed['visibleSvgLabels'] = [{'svg': '<svg><text>changed</text></svg>'}]
        self.assertFalse(self.accepted(changed))

    def test_frozen_v3_identity_and_receipts_cannot_be_forged(self):
        record = self.frozen_record()
        for field, value in [('id', '54'), ('route', '/other.html'), ('finalPath', record['route']),
                             ('prefix', ''), ('prefix', '/book/oge/2026-10-31/v1'),
                             ('prefix', '/book/oge/2026-10-31/v2'), ('prefix', '/book/oge/2026-11-17/v3')]:
            changed = dict(record, **{field: value})
            self.assertIsNone(without_closed_video_summary(changed), field)
        for field, value in [('kind', 'oge-video-models-closed-v1'), ('manifestSha256', '0' * 64),
                             ('sourceBase', PINS['baseCommit']), ('nativeSha256', '0' * 64),
                             ('closed', False), ('extra', 'unreviewed')]:
            changed = copy.deepcopy(record); changed['videoModelContext'][field] = value
            self.assertIsNone(without_closed_video_summary(changed), field)
        for field, value in [('kind', 'oge-return-v1'), ('visibleText', 'other'),
                             ('servedHtmlSha256', '0' * 64), ('manifestSha256', '0' * 64), ('extra', True)]:
            changed = copy.deepcopy(record); changed['frozenWayfinding'][field] = value
            self.assertFalse(verified_v3_wayfinding(changed), field)
        for field in ['frozenWayfinding', 'unfilteredInitialVisibleText']:
            changed = copy.deepcopy(record); del changed[field]
            self.assertFalse(verified_v3_wayfinding(changed), field)
        for route in record['resources']:
            changed = copy.deepcopy(record); del changed['resources'][route]
            self.assertIsNone(without_closed_video_summary(changed), route)
            for field, value in [('status', 404), ('sha256', '0' * 64)]:
                changed = copy.deepcopy(record); changed['resources'][route][field] = value
                self.assertIsNone(without_closed_video_summary(changed), route)

    def test_only_task13_uses_the_existing_exact_frozen_redirect(self):
        record = self.frozen_record()
        route = '/trainers/oge-task13-inequalities.html'
        target = '/trainers/oge13-inequalities-series.html'
        record.update(id='56', route=route, finalPath=V3['prefix'] + target)
        for file in (route, target):
            served = V3['prefix'] + file
            record['resources'][served] = dict(status=200, sha256=sha((ROOT / served[1:]).read_bytes()))
        self.assertTrue(verified_v3_files(record))
        for field, value in [('id', '55'), ('route', target), ('finalPath', V3['prefix'] + route),
                             ('finalPath', V3['prefix'] + target + 'changed')]:
            self.assertFalse(verified_v3_files(dict(record, **{field: value})), field)
        for file in (route, target):
            changed = copy.deepcopy(record); del changed['resources'][V3['prefix'] + file]
            self.assertFalse(verified_v3_files(changed), file)

    def test_modified_frozen_bytes_fail_even_with_forged_record_or_manifest_hashes(self):
        original = self.frozen_record()
        read = type(ROOT).read_bytes
        manifest_file = ROOT / V3['prefix'][1:] / 'manifest.json'
        for route in [original['finalPath'], V3['prefix'] + ASSETS[-1], V3['prefix'] + '/edition-assets/bootstrap.js']:
            target = ROOT / route[1:]
            edited = target.read_bytes() + b'\n// unreviewed payload\n'
            changed = copy.deepcopy(original)
            changed['resources'][route]['sha256'] = sha(edited)
            if route == original['finalPath']:
                changed['videoModelContext']['sourceSha256'] = sha(edited)
                changed['frozenWayfinding']['servedHtmlSha256'] = sha(edited)
            elif route in changed['videoModelContext']['assets']:
                changed['videoModelContext']['assets'][route] = sha(edited)
            forged = json.loads(manifest_file.read_bytes())
            row = next(row for row in forged['files'] if row['path'] == route[1:])
            row.update(sha256=sha(edited), bytes=len(edited))
            forged = json.dumps(forged).encode()
            for manifest in [None, forged]:
                overrides = {target: edited}
                if manifest is not None:
                    overrides[manifest_file] = manifest
                    changed['videoModelContext']['manifestSha256'] = sha(manifest)
                    changed['frozenWayfinding']['manifestSha256'] = sha(manifest)
                with patch.object(type(ROOT), 'read_bytes', lambda p: overrides[p] if p in overrides else read(p)):
                    self.assertIsNone(without_closed_video_summary(changed), route)
        # Frozen evidence is bound to its own snapshot, not the evolving public files.
        source = ROOT / original['route'][1:]
        with patch.object(type(ROOT), 'read_bytes', lambda p: b'changed later public source' if p == source else read(p)):
            self.assertTrue(self.accepted(original))


if __name__=='__main__':
    unittest.main()
