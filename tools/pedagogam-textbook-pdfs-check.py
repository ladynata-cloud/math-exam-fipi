#!/usr/bin/env python3
"""Check the published bank, exact mathematical claims and printable artifacts.

The numerical/symbolic claims are recomputed by SymPy, independently of each
authoring module. Semantic interpretation, proofs and variant difficulty need
the separate reading review; this program never labels those machine-verified.
"""
from pathlib import Path
from collections import Counter
import ast
import hashlib
import importlib.util
import json
import re
import sys
import zipfile
import fitz
import sympy as s

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'pedagogam/raboty'
symbols = {v: s.Symbol(v, real=True) for v in ('x', 'y', 'n', 'C', 'a', 'b', 't')}
allowed = {**symbols, 'pi': s.pi, 'E': s.E, 'oo': s.oo,
           **{n: getattr(s, n) for n in ('sqrt','sin','cos','tan','acos','log','exp','diff','integrate',
              'Rational','Abs','factorial','binomial','gcd','lcm','floor','ceiling')}}


def expr(value):
    value = str(value)
    tree = ast.parse(value, mode='eval')
    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute) and node.attr != 'subs':
            raise ValueError('Forbidden method: ' + value)
        if isinstance(node, (ast.Subscript, ast.Lambda, ast.ListComp, ast.DictComp)):
            raise ValueError('Forbidden expression: ' + value)
        if isinstance(node, ast.Name) and node.id not in allowed:
            raise ValueError('Unknown name ' + node.id + ': ' + value)
        if isinstance(node, ast.Constant) and not isinstance(node.value, (int, float)):
            raise ValueError('Non-numeric literal: ' + value)
    return s.sympify(value, locals=allowed, rational=True)


def equal(left, right):
    return s.simplify(left - right) == 0


def main():
    packs = json.loads((OUT/'bank.json').read_text())
    specification = importlib.util.spec_from_file_location('teacher_pdf_builder', ROOT/'tools/build-pedagogam-textbook-pdfs.py')
    builder = importlib.util.module_from_spec(specification)
    specification.loader.exec_module(builder)
    assert packs == builder.load_packs(), 'Bank is stale: rebuild from modules and textbook coverage'
    assert (OUT/'index.html').read_text() == builder.page_html(packs), 'Catalog is stale: rebuild HTML'
    by_id = {p['id']: p for p in packs}
    normalize = lambda value: re.sub(r'\s+', '', re.sub(r'\^([23456789])\b', r'\1', value))
    manifest = json.loads((OUT/'manifest.json').read_text())
    assert len({p['id'] for p in packs}) == len(packs)
    assert {p['id'] for p in packs} == {p['id'] for p in manifest}
    expected_paths = set()
    for item in manifest:
        expected = {item['id']+'/'+name for name in ('samostoyatelnaya.pdf','samostoyatelnaya-otvety.pdf','kontrolnaya.pdf','kontrolnaya-otvety.pdf')}
        assert {f['path'] for f in item['files']} == expected
        expected_paths.update(expected)
    assert {str(p.relative_to(OUT)) for p in OUT.rglob('*.pdf')} == expected_paths, 'Orphan or missing PDF'
    counts = Counter()
    manual = []
    seen_questions = set()
    for pack in packs:
        assert re.fullmatch(r'[a-z0-9-]+', pack['id'])
        assert pack['books'] and pack['source_refs'] and pack['scope_note']
        for ref in pack['source_refs']:
            assert (ROOT/ref['path']).is_file(), (pack['id'], ref)
        assert [v['name'] for v in pack['variants']] == ['1','2','3','4']
        if 'book_grades' in pack:
            assert set(pack['book_grades']) == set(pack['books']), pack['id']
            assert all(gs and all(g in range(5,12) for g in gs) for gs in pack['book_grades'].values()), pack['id']
        for kind in ('sr','kr'):
            signatures = [tuple(t['q'] for t in v[kind]) for v in pack['variants']]
            assert len(set(signatures)) == 4, ('Duplicate complete variant',pack['id'],kind)
        for variant in pack['variants']:
            assert len(variant['sr']) == 4 and len(variant['kr']) == 5
            assert [t['points'] for t in variant['sr']] == [1,1,2,2]
            assert [t['points'] for t in variant['kr']] == [2,2,2,2,2]
            for kind in ('sr','kr'):
                for i, task in enumerate(variant[kind], 1):
                    identity = (pack['id'], variant['name'], kind, i)
                    assert all(isinstance(task[k],str) and task[k].strip() for k in ('q','a','solution')), identity
                    assert not re.search(r'\{(?:answer|root|[a-z])\}', task['q']+task['a']+task['solution']), identity
                    check = task['check']
                    ckind = check['kind']
                    try:
                        if ckind == 'expression':
                            assert equal(expr(check['expr']),expr(check['expected'])), (check, identity)
                        elif ckind == 'identity':
                            assert equal(expr(check['lhs']),expr(check['rhs'])), (check, identity)
                        elif ckind == 'equation':
                            left,right = expr(check['lhs']),expr(check['rhs'])
                            roots = [expr(r) for r in check['roots']]
                            assert all(equal(left.subs(symbols['x'],r),right.subs(symbols['x'],r)) for r in roots), (check,identity)
                            actual = s.solveset(left-right,symbols['x'],domain=s.S.Reals)
                            assert actual == s.FiniteSet(*roots), (actual,check,identity)
                        elif ckind == 'manual':
                            assert check['reason'].strip(), identity
                            manual.append({'pack':pack['id'],'variant':variant['name'],'work':kind,'task':i,
                                           'question':task['q'],'answer':task['a'],'solution':task['solution']})
                        else:
                            raise ValueError('Unknown check kind: ' + ckind)
                    except Exception as error:
                        raise ValueError(f'{identity}: {error}') from error
                    counts[ckind] += 1
                    seen_questions.add(task['q'])
        counts['packs'] += 1
    for item in manifest:
        for artifact in item['files']:
            path=OUT/artifact['path']
            assert hashlib.sha256(path.read_bytes()).hexdigest()==artifact['sha256'],path
            document=fitz.open(path)
            assert len(document)==4, (path,len(document))
            for n,page in enumerate(document,1):
                assert abs(page.rect.width-595.276)<.1
                text=page.get_text()
                assert f'Вариант {n}' in text, (path,n)
                assert 'MathExam' in text and 'Всего' in text if 'otvety' in path.name else 'Максимум' in text
                assert '\ufffd' not in text and '\x00' not in text, (path,n)
                pack = by_id[item['id']]
                kind = 'sr' if path.name.startswith('samostoyatelnaya') else 'kr'
                teacher = 'otvety' in path.name
                assert normalize(pack['grade']) in normalize(text), (path,n,'stale grade')
                for task_index, task in enumerate(pack['variants'][n-1][kind], 1):
                    for key in (('a','solution') if teacher else ('q',)):
                        expected_text = f'{task_index}. {task[key]}' if key in ('q','a') else task[key]
                        assert normalize(expected_text) in normalize(text), (path,n,key,'PDF content differs from bank')
                for block in page.get_text('dict')['blocks']:
                    for line in block.get('lines',[]):
                        for span in line['spans']:
                            x0,y0,x1,y1=span['bbox']
                            assert 20<=x0<=x1<=page.rect.width-20 and 15<=y0<y1<=page.rect.height-10, (path,n,span)
                if 'otvety' not in path.name:
                    assert 'Ответы, решения' not in text and 'Критерии' not in text, (path,n)
            counts['pdfs']+=1
            counts['pages']+=len(document)
        with zipfile.ZipFile(OUT/item['id']/'komplekt.zip') as z:
            assert len(z.namelist())==4 and z.testzip() is None
            for f in item['files']:
                assert z.read(f['path'])==(OUT/f['path']).read_bytes()
    with zipfile.ZipFile(OUT/'mathexam-raboty-pdf.zip') as z:
        assert len(z.namelist())==4*len(packs) and set(z.namelist())==expected_paths and z.testzip() is None
        for item in manifest:
            for f in item['files']:
                assert z.read(f['path'])==(OUT/f['path']).read_bytes()
    print('TEACHER_TEXTBOOK_PDFS_OK ' + json.dumps(dict(counts),ensure_ascii=False))
    print(f'Unique question texts: {len(seen_questions)}. Reading review required for {len(manual)} claims.')


if __name__=='__main__':
    main()
