#!/usr/bin/env python3
"""Build original teacher packs from reviewed source; requires reportlab.

Run from the repository root. No network calls or pupil data.
"""
import html
import json
from pathlib import Path
import zipfile
from public_navigator_preservation import SNIPPET
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'pedagogam/materialy'
PACKS = json.loads((OUT / 'materials.json').read_text())
FONT = Path('/usr/share/fonts/truetype/dejavu')
pdfmetrics.registerFont(TTFont('DejaVu', str(FONT / 'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVuBold', str(FONT / 'DejaVuSans-Bold.ttf')))
pdfmetrics.registerFontFamily('DejaVu', normal='DejaVu', bold='DejaVuBold')
INK = colors.HexColor('#20352d')
GREEN = colors.HexColor('#246246')
GRAY = colors.HexColor('#65716b')
WIDTH, HEIGHT = 595.276, 841.89
LEFT, CONTENT = 44, 507
STYLE = ParagraphStyle('body', fontName='DejaVu', fontSize=11.4, leading=16,
                       textColor=INK, spaceAfter=0)

def paragraph(c, text, y, size=11.4, leading=16, color=INK, bold=False):
    style = ParagraphStyle('p', parent=STYLE, fontSize=size, leading=leading,
                           textColor=color, fontName='DejaVuBold' if bold else 'DejaVu')
    p = Paragraph(html.escape(text), style)
    _, h = p.wrap(CONTENT, 1000)
    if y-h < 46:
        raise ValueError(f'Page overflow: {text[:70]} at {y-h}')
    p.drawOn(c, LEFT, y-h)
    return y-h

def page_start(c, pack, label, page):
    c.setFillColor(GREEN)
    c.setFont('DejaVuBold', 10)
    c.drawString(LEFT, HEIGHT-39, 'MathExam  /  Материалы для урока')
    y = paragraph(c, pack['title'], HEIGHT-61, 18, 23, bold=True)
    y = paragraph(c, f"{pack['grade']} • {pack['minutes']} • {label}", y-10, 10, 14, GRAY)
    c.setStrokeColor(colors.HexColor('#b9c7bf'))
    c.line(LEFT, 40, WIDTH-LEFT, 40)
    c.setFont('DejaVu', 8)
    c.setFillColor(GRAY)
    c.drawString(LEFT, 26, f"mathexam.space/pedagogam/ • {page}")
    c.drawRightString(WIDTH-LEFT, 26, 'Для занятий и адаптации учителем')
    return y-17

def diagram_svg(labels):
    a,b,cc,d = labels
    return f'''<svg class="diagram" viewBox="0 0 300 155" role="img" aria-label="Схема треугольника {a}{b}{cc}, точка {d} на стороне {b}{cc}; проведён отрезок {a}{d}">
<path d="M150 22 L35 125 L265 125 Z M150 22 L150 125" fill="none" stroke="#20352d" stroke-width="2"/>
<g font-family="Arial,sans-serif" font-size="17" fill="#20352d"><text x="143" y="17">{a}</text><text x="17" y="140">{b}</text><text x="271" y="140">{cc}</text><text x="143" y="146">{d}</text></g></svg>'''

def draw_diagram(c, labels, y):
    a,b,cc,d = labels
    x = WIDTH/2
    bottom = y-73
    c.setStrokeColor(INK)
    c.setLineWidth(1.2)
    p=c.beginPath(); p.moveTo(x,y-7); p.lineTo(x-80,bottom); p.lineTo(x+80,bottom); p.close()
    c.drawPath(p); c.line(x,y-7,x,bottom)
    c.setFont('DejaVu',10); c.setFillColor(INK)
    for label,px,py in [(a,x-4,y),(b,x-92,bottom-5),(cc,x+84,bottom-5),(d,x-4,bottom-15)]:
        c.drawString(px,py,label)
    return y-99

def pdf_students(pack, target):
    c=canvas.Canvas(str(target),pagesize=(WIDTH,HEIGHT),invariant=1)
    c.setTitle(pack['title']+' — задания'); c.setAuthor('MathExam')
    page=0
    for v in pack['variants']:
        chunks=[v['tasks']] if 'diagram' not in v else [v['tasks'][:3],v['tasks'][3:]]
        for ci, tasks in enumerate(chunks):
            page+=1
            label=f"Вариант {v['name']}"+(f" • лист {ci+1} из 2" if len(chunks)>1 else '')
            y=page_start(c,pack,label,page)
            y=paragraph(c,'Имя __________________________  Дата __________',y,10,14)
            y=paragraph(c,pack['instruction'],y-12,10.5,14)-14
            if 'diagram' in v:
                y=paragraph(c,'Схема к заданиям 2 и 6. Каждое условие рассматривайте отдельно.',y,9,12,GRAY)-8
                y=draw_diagram(c,v['diagram'],y)
            row=(y-56)/len(tasks)
            for i,(question,_) in enumerate(tasks):
                n=i+1+(ci*3 if len(chunks)>1 else 0)
                top=y-i*row
                end=paragraph(c,f'{n}. {question}',top)
                next_top=top-row
                if end-next_top<20:
                    raise ValueError(f'Insufficient working room: {pack["slug"]} {v["name"]} {n}')
                c.setStrokeColor(colors.HexColor('#c7ceca')); c.setLineWidth(.35)
                line=end-17
                while line>next_top+10:
                    c.line(LEFT,line,WIDTH-LEFT,line); line-=18
            c.showPage()
    c.save()

def pdf_teacher(pack,target):
    c=canvas.Canvas(str(target),pagesize=(WIDTH,HEIGHT),invariant=1)
    c.setTitle(pack['title']+' — ответы и рекомендации'); c.setAuthor('MathExam')
    for i,v in enumerate(pack['variants']):
        y=page_start(c,pack,f"Ответы • вариант {v['name']}",i+1)
        for n,(_,answer) in enumerate(v['tasks'],1):
            y=paragraph(c,f'{n}. {answer}',y)-17
        c.showPage()
    y=page_start(c,pack,'Рекомендации учителю',3)
    for title,key in [('Как провести работу','teacher'),('Как проверить','rubric'),('Что повторить','route')]:
        y=paragraph(c,title,y,13,18,bold=True)-8
        y=paragraph(c,pack[key],y)-22
    y=paragraph(c,'Продолжить в тренажёре',y,13,18,bold=True)-8
    y=paragraph(c,'Откройте страницу комплекта: там собраны ссылки на подходящие тренажёры.',y)-10
    url='https://mathexam.space/pedagogam/materialy/'+pack['slug']+'/'
    # Short readable link plus a real PDF annotation.
    c.setFont('DejaVuBold',11); c.setFillColor(GREEN)
    c.drawString(LEFT,y-12,'Перейти к материалу и тренировкам →')
    c.linkURL(url,(LEFT,y-17,LEFT+350,y+2),relative=0)
    y-=45
    paragraph(c,'Новые задания MathExam. Можно распечатывать для занятий и изменять под свой класс. Работа не является официальным экзаменационным материалом. Проверка с реальными классами пока не проводилась.',y,9.5,13,GRAY)
    c.showPage(); c.save()

CSS='''
:root{color-scheme:light;--ink:#20352d;--green:#246246}*{box-sizing:border-box}body{margin:0;background:#f6f7f3;color:var(--ink);font:18px/1.6 Arial,sans-serif}main,header,footer{max-width:1000px;margin:auto;padding:24px}header{display:flex;gap:20px;flex-wrap:wrap;font-size:16px}a{color:var(--green);text-underline-offset:3px}h1{font-size:clamp(28px,4vw,40px);line-height:1.18;margin:12px 0}h2{font-size:25px;line-height:1.3}h3{font-size:20px}p{margin:.7em 0}.meta{color:#58645d;font-size:15px}.actions{display:flex;flex-wrap:wrap;gap:12px;margin:22px 0}.button,button{font:inherit;font-size:16px;border:1px solid var(--green);background:var(--green);color:#fff;padding:11px 16px;border-radius:8px;text-decoration:none;cursor:pointer}.secondary{background:#fff;color:var(--green)}:focus-visible{outline:3px solid #e19b2f;outline-offset:4px}.sheet,details,.note{background:white;border:1px solid #d5ded6;border-radius:12px;padding:24px;margin:24px 0}.sheet h2{margin-top:0}.tasks{padding-left:27px}.tasks li{padding-left:5px;margin:0 0 25px}.workroom{height:36px;border-bottom:1px solid #d5ded6}.diagram{display:block;width:240px;max-width:100%;height:auto;margin:0 auto}.caption{text-align:center;color:#58645d;font-size:14px}summary{font-size:21px;font-weight:bold;cursor:pointer}li{overflow-wrap:anywhere}.answer-list li{margin:15px 0}.links li{margin:9px 0}footer{font-size:14px}.identity{font-size:15px}.print-page{break-after:page}.print-page:last-child{break-after:auto}@media(max-width:540px){main,header,footer{padding:16px}.sheet,details,.note{padding:17px}.actions>*{width:100%;text-align:center}.tasks{padding-left:23px}}
@page{size:A4;margin:16mm}@media print{body{background:#fff;font:12pt/1.4 Arial,sans-serif}header,footer,.intro,.actions,.note,.links,details{display:none!important}main{padding:0;max-width:none}.sheet{padding:0;margin:0;border:0;border-radius:0;break-after:page}.sheet:last-child{break-after:auto}h1{font-size:20pt}h2{font-size:17pt}.tasks li{break-inside:avoid;margin-bottom:18px}.workroom{height:28px}.identity{font-size:11pt}.diagram{width:190px}.teacher-print .sheet{display:none!important}.teacher-print details{display:block!important;border:0;padding:0;margin:0}.teacher-print details summary{display:none}.teacher-print .teacher-only{display:block!important}.teacher-print details:not([open])>*{display:block}.teacher-only{display:none}.print-page{break-after:page}}
'''

def e(s): return html.escape(s)

def pack_html(pack):
    slug=pack['slug']; url=f'https://mathexam.space/pedagogam/materialy/{slug}/'
    sheets=[]; answers=[]
    for v in pack['variants']:
        chunks=[v['tasks']] if 'diagram' not in v else [v['tasks'][:3],v['tasks'][3:]]
        for ci,tasks in enumerate(chunks):
            start=ci*3+1 if len(chunks)>1 else 1
            diagram=diagram_svg(v['diagram'])+'<p class="caption">Схема к заданиям 2 и 6. Условия рассматриваются отдельно.</p>' if 'diagram' in v else ''
            sheets.append(f'''<section class="sheet"><p class="meta">MathExam • {e(pack['grade'])}</p><h2>{e(pack['title'])} — вариант {v['name']}{(' / лист '+str(ci+1)) if len(chunks)>1 else ''}</h2><p class="identity">Имя __________________________ Дата __________</p><p>{e(pack['instruction'])}</p>{diagram}<ol class="tasks" start="{start}">{''.join('<li>'+e(q)+'<div class="workroom" aria-hidden="true"></div></li>' for q,a in tasks)}</ol></section>''')
        answers.append(f'''<section class="print-page"><h2>Ответы — вариант {v['name']}</h2><ol class="answer-list">{''.join('<li>'+e(a)+'</li>' for q,a in v['tasks'])}</ol></section>''')
    method=''.join(f'<h3>{title}</h3><p>{e(pack[key])}</p>' for title,key in [('Как провести','teacher'),('Как проверить','rubric'),('Что повторить','route')])
    return f'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{e(pack['title'])} — задания и ответы для учителя | MathExam</title><meta name="description" content="{e(pack['intro'])} Два варианта, PDF для ученика и ответы учителю."><link rel="canonical" href="{url}"><style>{CSS}</style></head><body>
<header><a href="https://mathexam.space/">MathExam</a><a href="https://mathexam.space/pedagogam/#materialy">← Все материалы для педагогов</a></header><main>
<div class="intro"><p class="meta">{e(pack['grade'])} • {e(pack['kind'])} • {e(pack['minutes'])}</p><h1>{e(pack['title'])}</h1><p>{e(pack['intro'])}</p><p>Два варианта. Задания и ответы скачиваются отдельно. Бесплатно, без регистрации.</p></div>
<div class="actions"><a class="button" href="{url}zadaniya.pdf" download>Задания PDF</a><a class="button secondary" href="{url}otvety.pdf" download>Ответы и рекомендации PDF</a><a class="button secondary" href="{url}index.html" download="{slug}.html">Скачать HTML</a></div>
<div class="actions"><button type="button" data-print="student">Распечатать задания</button><button class="secondary" type="button" data-print="teacher">Распечатать ответы</button></div>
<p class="note">HTML можно сохранить, открыть без интернета и изменить в текстовом редакторе. PDF предназначены для печати на A4. Для работы онлайн выберите тренажёр внизу страницы.</p>
{''.join(sheets)}
<details id="answers"><summary>Ответы и рекомендации учителю</summary><div class="teacher-only"><h1>{e(pack['title'])}</h1></div>{''.join(answers)}<section class="print-page">{method}</section></details>
<section class="links"><h2>После проверки — потренироваться</h2><ul>{''.join(f'<li><a href="https://mathexam.space{href}">{e(label)}</a></li>' for label,href in pack['links'])}</ul><p><a href="https://mathexam.space/pedagogam/#materialy">← Вернуться к подборке</a></p></section>
</main><footer>Новые задания MathExam. Можно распечатывать для занятий и адаптировать под свой класс. Это не официальные экзаменационные материалы. Проверка с реальными классами пока не проводилась.</footer>
<script>
const answers = document.getElementById('answers');
let previousOpen = false;
document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => {{
 previousOpen = answers.open;
 const teacher = button.dataset.print === 'teacher';
 document.body.classList.toggle('teacher-print', teacher);
 if (teacher) answers.open = true;
 window.print();
}}));
window.addEventListener('afterprint', () => {{document.body.classList.remove('teacher-print'); answers.open = previousOpen;}});
</script></body></html>
'''

def catalog_fragment():
    cards=[]
    for pack in PACKS:
        base='/pedagogam/materialy/'+pack['slug']+'/'
        cards.append(f'''<article class="entry"><span class="kicker">{e(pack['grade'])} · {e(pack['minutes'])}</span><h3><a href="{base}">{e(pack['title'])}</a></h3><p>{e(pack['intro'])}</p><p class="byline">{e(pack['kind'])} · 2 варианта · ответы отдельно</p><a class="go" href="{base}">Открыть комплект →</a><p><a href="{base}zadaniya.pdf" download>Задания PDF</a> · <a href="{base}otvety.pdf" download>Ответы PDF</a></p></article>''')
    return '''<!-- ready-materials:start -->
<section class="section alt" id="materialy"><div class="container">
<h2>Готовые материалы для урока</h2>
<p>Выберите тему, распечатайте задания и после проверки дайте ученику подходящую тренировку. В каждом комплекте — два варианта, отдельные ответы, критерии проверки и рекомендации по работе с ошибками.</p>
<p><strong>5 комплектов · 64 задания · бесплатно и без регистрации.</strong> На страницах есть версия для просмотра, печати и скачивания в HTML. Её можно адаптировать под свой класс.</p>
<div class="entry-grid">'''+''.join(cards)+'''</div>
<p style="margin-top:24px"><a class="btn" style="background:#246246" href="/pedagogam/materialy/mathexam-5-komplektov.zip" download>Скачать все 5 комплектов ZIP</a></p>
<p class="byline">В архиве: 10 PDF, 5 страниц HTML и памятка. Задания составлены для MathExam; результаты применения в реальных классах пока не собирались.</p>
</div></section>
<!-- ready-materials:end -->'''

def main():
    offline_html = {}
    for p in PACKS:
        dest=OUT/p['slug'];dest.mkdir(parents=True,exist_ok=True)
        pdf_students(p,dest/'zadaniya.pdf')
        pdf_teacher(p,dest/'otvety.pdf')
        # The downloadable page must remain usable directly from the ZIP.
        # Only its hosted counterpart receives the public navigation scripts.
        source = pack_html(p)
        assert source.count('</head>') == 1
        offline_html[p['slug']] = source.encode('utf-8')
        (dest/'index.html').write_text(source.replace('</head>', SNIPPET.decode() + '</head>', 1))
    hub=ROOT/'pedagogam/index.html';text=hub.read_text()
    fragment=catalog_fragment()
    if '<!-- ready-materials:start -->' in text:
        before,tail=text.split('<!-- ready-materials:start -->',1)
        _,after=tail.split('<!-- ready-materials:end -->',1)
        text=before+fragment+after
    else:
        position=text.index('<section class="section">')
        text=text[:position]+fragment+'\n\n'+text[position:]
    hub.write_text(text)
    readme='''МАТЕРИАЛЫ MATHEXAM ДЛЯ УРОКА

В каждой папке:
zadaniya.pdf — задания ученику, варианты А и Б;
otvety.pdf — ответы, критерии и рекомендации учителю;
index.html — просмотр, печать и редактируемый исходник страницы.

Откройте HTML двойным щелчком. Текст, рисунок, ответы и печать работают
без интернета. Скачивание PDF по кнопкам и переход в тренажёры требуют
интернета; для печати офлайн открывайте PDF из той же папки.
HTML можно изменить в любом текстовом редакторе. После изменения
проверьте ответы и печатную версию.

Можно распечатывать для занятий и адаптировать под свой класс.
Задания составлены для MathExam. Это не официальные экзаменационные
материалы. Проверка с реальными классами пока не проводилась.
https://mathexam.space/pedagogam/
'''
    with zipfile.ZipFile(OUT/'mathexam-5-komplektov.zip','w',zipfile.ZIP_DEFLATED) as z:
        # Fixed timestamps keep rebuilds reproducible.
        for p in PACKS:
            for filename in ['zadaniya.pdf','otvety.pdf','index.html']:
                info=zipfile.ZipInfo(p['slug']+'/'+filename,(2026,11,5,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
                payload = offline_html[p['slug']] if filename == 'index.html' else (OUT/p['slug']/filename).read_bytes()
                z.writestr(info, payload)
        info=zipfile.ZipInfo('README.txt',(2026,11,5,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,readme.encode('utf-8'))
    print('Built 5 packs, 10 PDFs, 5 standalone HTML pages and ZIP; 64 tasks.')

if __name__ == '__main__': main()
