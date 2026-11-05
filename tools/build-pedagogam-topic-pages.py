#!/usr/bin/env python3
"""Render ten edited teacher topic guides from existing packs; never write PDFs."""
from pathlib import Path
import argparse
import html
import importlib.util
import json

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = 'https://mathexam.space'
OUT = ROOT / 'pedagogam/raboty'
esc = html.escape


def load_content():
    return sum((json.loads((ROOT / ('tools/teacher-topic-content-' + part + '.json')).read_text())
                for part in ('lower', 'upper')), [])


def bullets(items):
    return '<ul>' + ''.join('<li>' + esc(x) + '</li>' for x in items) + '</ul>'


def render(c, p, all_content):
    base = '/pedagogam/raboty/' + p['id'] + '/'
    title = c['heading'] + ' | MathExam'
    short_heading = c['heading'].split(':')[0]
    if str(c['grade']) not in short_heading:
        short_heading += ', ' + str(c['grade']) + ' класс'
    display_heading = esc(short_heading).replace('тригонометрические', 'тригоно&shy;метрические')
    schema = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'LearningResource', '@id': ORIGIN + base + '#material',
         'name': c['heading'], 'description': c['description'], 'url': ORIGIN + base,
         'inLanguage': 'ru', 'isAccessibleForFree': True, 'educationalLevel': str(c['grade']) + ' класс',
         'learningResourceType': ['Самостоятельная работа', 'Контрольная работа'],
         'author': {'@type': 'Organization', 'name': 'MathExam', 'url': ORIGIN + '/'},
         'hasPart': [{'@type': 'DigitalDocument', 'name': label, 'url': ORIGIN + base + name,
                      'encodingFormat': 'application/pdf'} for name, label in (
             ('samostoyatelnaya.pdf', 'Самостоятельная: задания'),
             ('samostoyatelnaya-otvety.pdf', 'Самостоятельная: ответы, решения, критерии'),
             ('kontrolnaya.pdf', 'Контрольная: задания'),
             ('kontrolnaya-otvety.pdf', 'Контрольная: ответы, решения, критерии'))]},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i, 'name': label, 'item': ORIGIN + url}
            for i, (label, url) in enumerate([
                ('Педагогам', '/pedagogam/'), ('Самостоятельные и контрольные', '/pedagogam/raboty/'),
                (c['heading'], base)], 1)]}]}
    cards = []
    for kind, name, file in [('sr', 'Самостоятельная работа', 'samostoyatelnaya'), ('kr', 'Контрольная работа', 'kontrolnaya')]:
        tasks = p['variants'][0][kind]
        cards.append(f'''<section class="download-card" aria-labelledby="{kind}">
<p class="eyebrow">{len(tasks)} {'задания' if len(tasks) == 4 else 'заданий'} · {sum(t['points'] for t in tasks)} баллов · около {p[kind + '_minutes']} минут</p>
<h2 id="{kind}">{name}</h2>
<a class="button" href="{base}{file}.pdf" download>Скачать задания PDF</a>
<a class="answer-link" href="{base}{file}-otvety.pdf" download>Ответы, решения и критерии PDF</a>
<p class="small">Все 4 варианта в одном PDF. Один вариант — одна страница A4.</p><details><summary>Когда выбрать эту работу</summary><p>{esc(c[kind + '_use'])}</p></details></section>''')
    previews = ''.join(f'<li><p>{esc(t["q"])}</p><details><summary>Посмотреть решение</summary><p>{esc(t["solution"])}</p><p><strong>Ответ:</strong> {esc(t["a"])}</p></details></li>' for t in p['variants'][0]['sr'][:2])
    trainers = ''.join(f'<li><a href="{esc(t["url"], quote=True)}">{esc(t["label"])}</a><p>{esc(t["reason"])}</p></li>' for t in c['trainers'])
    mistakes = ''.join(f'<li><strong>{esc(m["error"])}</strong><p>{esc(m["remedy"])}</p></li>' for m in c['mistakes'])
    books = [b for b in p['books'] if c['grade'] in p.get('book_grades', {}).get(b, [c['grade']])]
    refs = [r['sections'] for r in p['source_refs'] if r['path'] != 'tools/teacher-textbook-coverage.json']
    related = c.get('related_material')
    related_html = (f'<aside class="note"><h3>Ещё один формат по этой теме</h3><p><a href="{esc(related["url"], quote=True)}">{esc(related["label"])}</a>. {esc(related["reason"])}</p></aside>' if related else '')
    near = sorted((x for x in all_content if x['id'] != c['id']), key=lambda x: abs(x['grade'] - c['grade']))[:3]
    near_html = ''.join(f'<li><a href="/pedagogam/raboty/{x["id"]}/">{esc(x["heading"])}</a></li>' for x in near)
    return f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title><meta name="description" content="{esc(c['description'], quote=True)}">
<link rel="canonical" href="{ORIGIN}{base}"><meta property="og:title" content="{esc(c['heading'], quote=True)}">
<meta property="og:description" content="{esc(c['description'], quote=True)}"><meta property="og:url" content="{ORIGIN}{base}">
<meta property="og:type" content="website"><meta property="og:site_name" content="MathExam"><meta property="og:locale" content="ru_RU">
<link rel="stylesheet" href="/assets/pedagogam-topic-pages.css">
<script type="application/ld+json">{json.dumps(schema, ensure_ascii=False).replace('<', chr(92) + 'u003c')}</script>
</head><body><a class="skip-link" href="#main">К материалам</a>
<header><a class="brand" href="/">∑ MathExam</a><nav aria-label="Основные разделы"><a href="/pedagogam/">Педагогам</a><a href="/trainers/">Тренажёры</a><a href="/courses/">Курсы</a></nav></header>
<main id="main" class="topic-content">
<nav class="breadcrumbs" aria-label="Путь к странице"><a href="/pedagogam/">Педагогам</a><span aria-hidden="true"> / </span><a href="/pedagogam/raboty/">Все работы</a></nav>
<section class="intro"><p class="eyebrow">{c['grade']} класс · {esc(p['subject'])} · Бесплатно, без регистрации</p>
<h1>{display_heading}</h1><p class="lead">Самостоятельная и контрольная: 4 базовых варианта, отдельные ответы и решения.</p>
<nav class="jump-links" aria-label="На этой странице"><a href="#sr">Самостоятельная</a><a href="#kr">Контрольная</a><a href="#practice">Тренажёры</a></nav></section>
<div class="download-grid">{''.join(cards)}</div>
<p class="archive"><a href="{base}komplekt.zip" download>Скачать весь комплект ZIP</a> · 4 PDF: два вида работ и два файла с решениями.</p>
<section class="section"><h2>Что проверяет работа</h2><p>{esc(c['intro'])}</p>{bullets(c['skills'])}
<h3>Что нужно знать перед проверкой</h3>{bullets(c['prerequisites'])}</section>
<section class="section"><h2>Место в школьной программе</h2><p>{esc(c['curriculum'])}</p>
<details><summary>Учебники и границы соответствия</summary>{bullets(books)}{bullets(refs)}
<p>Темы сверены по указанным учебникам. Это авторские работы MathExam, а не копии упражнений издательства. Порядок изучения и объём темы у разных авторов различаются; комплект проверяет навыки, перечисленные выше.</p></details></section>
<section class="section"><h2>Посмотрите задания перед скачиванием</h2><p>Первые два задания самостоятельной, вариант 1. Полная работа с местом для решения — в PDF.</p><ol class="examples">{previews}</ol></section>
<section class="section"><h2>Как провести и проверить</h2><ol>{''.join('<li>' + esc(x) + '</li>' for x in c['lesson_plan'])}</ol>
<p>Самостоятельная: 1 + 1 + 2 + 2 = 6 баллов. Контрольная: 5 заданий по 2 балла = 10 баллов. Подробные критерии и предлагаемая шкала отметок находятся в файлах с решениями. Время ориентировочное; его можно изменить с учётом класса.</p></section>
<section class="section"><h2>Типичные ошибки и работа над ними</h2><ul class="mistakes">{mistakes}</ul></section>
<section class="section" id="practice"><h2>Подготовка и разбор ошибок в тренажёрах</h2><ul class="trainer-links">{trainers}</ul></section>
{related_html}<section class="section"><h2>Другие работы для уроков</h2><ul>{near_html}</ul><p><a href="/pedagogam/raboty/#{p['id']}">К этому комплекту в общем каталоге</a> · <a href="/pedagogam/raboty/">Все классы и темы</a></p></section>
</main><footer><p>MathExam · Материалы можно распечатывать для занятий. <a href="/pedagogam/raboty/istochniki.html">Источники и границы подборки</a>.</p></footer>
<script defer src="/assets/assistant/navigator-data.js?v=20261105-site1"></script><script defer src="/assets/assistant/navigator-widget.js?v=20261105-site1"></script>
</body></html>
'''


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = load_content()
    assert len(content) == len({c['id'] for c in content}) == 10
    packs = json.loads((OUT / 'bank.json').read_text())
    by_id = {p['id']: p for p in packs}
    outputs = {OUT / c['id'] / 'index.html': render(c, by_id[c['id']], content) for c in content}
    spec = importlib.util.spec_from_file_location('pdf_catalog', ROOT / 'tools/build-pedagogam-textbook-pdfs.py')
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    outputs[OUT / 'index.html'] = module.page_html(packs)
    for path, value in outputs.items():
        if args.check:
            assert path.read_text() == value, f'Stale HTML: {path.relative_to(ROOT)}'
        else:
            path.write_text(value)
    print(('Checked' if args.check else 'Wrote') + ' ten topic pages and catalog; no PDFs or ZIPs written.')


if __name__ == '__main__':
    main()
