#!/usr/bin/env python3
"""Build the seven editable teacher DOCX files, exact ZIP and manifest.

Requires python-docx 1.2.0. No network access or external conversion is used by
the builder. Render QA is a separate release gate. Mathematics uses native
OMML and coordinate diagrams use native editable Word VML line/text shapes.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import re
import zipfile

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor
from lxml import etree

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'pedagogam/raboty'
SOURCE = OUT / 'word-packs.json'
STAMP = (2026, 11, 6, 0, 0, 0)
NS = {'v': 'urn:schemas-microsoft-com:vml',
      'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def element(name, attributes=None, text=None):
    prefix, local = name.split(':')
    el = etree.Element('{'+NS[prefix]+'}'+local)
    for key, value in (attributes or {}).items():
        el.set(qn(key) if ':' in key else key, str(value))
    if text is not None:
        el.text = text
    return el


def add_text(paragraph, text, bold=False):
    """Emit inline source math as native Word equations, never bitmap text."""
    for index, value in enumerate(re.split(r'\[\[(.*?)\]\]', text)):
        if not value:
            continue
        if index % 2:
            equation = OxmlElement('m:oMath')
            run = OxmlElement('m:r')
            props = OxmlElement('m:rPr')
            normal = OxmlElement('m:nor')
            props.append(normal)
            run.append(props)
            content = OxmlElement('m:t')
            content.text = value
            run.append(content)
            equation.append(run)
            paragraph._p.append(equation)
        else:
            paragraph.add_run(value).bold = bold


def document(title):
    doc = Document()
    sec = doc.sections[0]
    sec.page_width, sec.page_height = Inches(8.5), Inches(11)
    sec.top_margin = sec.bottom_margin = Inches(.6)
    sec.left_margin = sec.right_margin = Inches(.7)
    sec.header_distance = sec.footer_distance = Inches(.25)
    for name in ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Header', 'Footer']:
        style = doc.styles[name]
        style.font.name = 'DejaVu Sans'
        style.font.color.rgb = RGBColor(0, 0, 0)
        style._element.get_or_add_rPr().get_or_add_rFonts().set(qn('w:eastAsia'), 'DejaVu Sans')
        style.paragraph_format.space_after = Pt(6)
    doc.styles['Normal'].font.size = Pt(11)
    doc.styles['Normal'].paragraph_format.line_spacing = 1.08
    doc.styles['Title'].font.size = Pt(22)
    doc.styles['Title'].font.bold = True
    doc.styles['Title'].paragraph_format.space_after = Pt(5)
    doc.styles['Subtitle'].font.size = Pt(11)
    doc.styles['Heading 1'].font.size = Pt(13)
    doc.styles['Heading 1'].paragraph_format.space_before = Pt(9)
    doc.styles['Heading 2'].font.size = Pt(11.5)
    doc.styles['Heading 2'].paragraph_format.space_before = Pt(7)
    doc.styles['Footer'].font.size = Pt(8)
    # Remove any inherited title borders/theme colors from the bundled template.
    for name in ['Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Header']:
        for node in doc.styles[name]._element.xpath('.//w:pBdr'):
            node.getparent().remove(node)
        for color in doc.styles[name]._element.xpath('.//w:color'):
            color.attrib.clear()
            color.set(qn('w:val'), '000000')
    footer = sec.footer.paragraphs[0]
    footer.text = 'MathExam   mathexam.space/pedagogam/raboty/'
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cp = doc.core_properties
    cp.title = title
    cp.subject = 'Редактируемые задания и ответы для урока математики'
    cp.author = cp.last_modified_by = 'MathExam'
    cp.comments = ''
    cp.keywords = 'MathExam, математика, четыре варианта'
    cp.created = cp.modified = datetime(2026, 11, 6, tzinfo=timezone.utc)
    cp.revision = 1
    return doc


def paragraph(doc, text, *, style=None, after=6, before=0, keep=False):
    p = doc.add_paragraph(style=style)
    add_text(p, text)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.space_before = Pt(before)
    p.paragraph_format.keep_with_next = keep
    return p


def writing_lines(doc, count=2):
    for _ in range(count):
        p = doc.add_paragraph('_______________________________________________________________________')
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1
        p.runs[0].font.size = Pt(9)
        p.runs[0].font.color.rgb = RGBColor.from_string('9A9A9A')


def coordinate_graph(doc, graph, teacher, uid):
    """A group of editable Word vectors, with no image or external relation."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.space_before = Pt(1)
    pict = OxmlElement('w:pict')
    size = 174 if teacher else 216
    group = element('v:group', {'id':uid, 'style':f'width:{size}pt;height:{size}pt',
        'coordorigin':'0,0', 'coordsize':'480,480',
        'alt':'Координатная сетка от минус 6 до 6'+('; прямая y = x + '+str(graph['b']) if teacher else '')})
    sequence = 0
    def line(x1,y1,x2,y2,color='#D9D9D9',width='.45pt',arrow=False):
        nonlocal sequence
        sequence += 1
        shape = element('v:line', {'id':f'{uid}-line-{sequence}', 'style':'position:absolute',
            'from':f'{x1},{y1}', 'to':f'{x2},{y2}', 'strokecolor':color, 'strokeweight':width})
        if arrow:
            side='start' if arrow=='start' else 'end'
            shape.append(element('v:stroke', {side+'arrow':'block', side+'arrowwidth':'narrow', side+'arrowlength':'short'}))
        group.append(shape)
    def label(text,x,y,width=50,height=23):
        nonlocal sequence
        sequence += 1
        shape = element('v:rect', {'id':f'{uid}-label-{sequence}', 'style':f'position:absolute;left:{x};top:{y};width:{width};height:{height}',
            'filled':'t', 'fillcolor':'#FFFFFF', 'stroked':'f'})
        box = element('v:textbox', {'inset':'0,0,0,0'})
        content = OxmlElement('w:txbxContent')
        para = OxmlElement('w:p')
        props = OxmlElement('w:pPr')
        spacing = OxmlElement('w:spacing');spacing.set(qn('w:before'),'0');spacing.set(qn('w:after'),'0')
        align=OxmlElement('w:jc');align.set(qn('w:val'),'center')
        props.extend([spacing,align]);para.append(props)
        run = OxmlElement('w:r');rp = OxmlElement('w:rPr')
        font = OxmlElement('w:rFonts');font.set(qn('w:ascii'),'DejaVu Sans');font.set(qn('w:hAnsi'),'DejaVu Sans')
        sz = OxmlElement('w:sz');sz.set(qn('w:val'),'18')
        rp.extend([font,sz]);run.append(rp)
        t=OxmlElement('w:t');t.text=str(text);run.append(t);para.append(run)
        content.append(para);box.append(content);shape.append(box);group.append(shape)
    xy = lambda x,y:(240+32*x,240-32*y)
    for n in range(-6,7):
        x,y=xy(n,n)
        line(x,48,x,432);line(48,y,432,y)
    if teacher:
        k,b=graph['k'],graph['b']
        candidates=[(-6,k*-6+b),(6,k*6+b),((-6-b)/k,-6),((6-b)/k,6)]
        inside=[point for point in candidates if all(-6<=v<=6 for v in point)]
        start=inside[0];end=next(point for point in inside if point!=start)
        line(*xy(*start),*xy(*end),'#000000','1.5pt')
        for x,y in graph['points']:
            px,py=xy(x,y)
            circle=element('v:oval',{'id':f'{uid}-point-{x}', 'style':f'position:absolute;left:{px-4};top:{py-4};width:8;height:8',
                'fillcolor':'#000000','strokecolor':'#000000'})
            group.append(circle)
    # Labels sit above the plotted line with a white background. Otherwise
    # the y=x+5 example crosses the minus-six glyph and obscures its value.
    for n in [-6,-4,-2,2,4,6]:
        x,y=xy(n,n)
        label(str(n).replace('-','−'),x-25,246)
        label(str(n).replace('-','−'),185,y-12)
    label('0',240,245);label('x',435,225);label('y',235,16)
    # Draw axes last so the axis-letter backgrounds cannot hide arrowheads.
    line(40,240,448,240,'#000000','1pt',True)
    # Positive VML dimensions keep the vertical line visible in Word and LO.
    line(240,32,240,440,'#000000','1pt','start')
    pict.append(group)
    p.add_run()._r.append(pict)
    return p


def heading(doc, pack, variant, teacher):
    paragraph(doc, pack['title'], style='Title', keep=True)
    paragraph(doc, 'Ответы и решения для учителя' if teacher else 'Самостоятельная работа', style='Subtitle', keep=True)
    paragraph(doc, f"Вариант {variant['name']}", style='Heading 1', keep=True)
    paragraph(doc, f"{pack['grade']}    Около {pack['minutes']} минут    6 баллов", after=9, keep=True)
    if teacher:
        paragraph(doc,pack['teacherNote'],after=9)
    else:
        paragraph(doc,'Имя ______________________________  Класс ______  Дата __________',after=9)
        paragraph(doc,pack['instruction'],after=10)


def pack_document(pack, teacher):
    doc=document(pack['title'])
    for vi,variant in enumerate(pack['variants']):
        if vi:doc.add_page_break()
        heading(doc,pack,variant,teacher)
        for number,task in enumerate(variant['tasks'],1):
            if teacher:
                paragraph(doc,f'Задание {number}',style='Heading 2',keep=True)
                paragraph(doc,'Ответ: '+task['answer'],after=3)
                for step in task['solution']:paragraph(doc,step,after=3)
                if task.get('graph'):coordinate_graph(doc,task['graph'],True,f'answer-{pack["id"]}-{vi}')
            else:
                p=paragraph(doc,'',before=5,after=6,keep=bool(task.get('graph')))
                p.add_run(f'{number}. ').bold=True
                add_text(p,task['prompt'])
                points=p.add_run(f'  ({task["points"]} '+('балл' if task['points']==1 else 'балла')+')')
                points.font.size=Pt(9)
                if task.get('graph'):
                    coordinate_graph(doc,task['graph'],False,f'work-{pack["id"]}-{vi}')
                    paragraph(doc,'Точки: __________________________ и __________________________',after=5)
                else:
                    writing_lines(doc,1 if pack['id']=='lineynye-grafiki-oge' else 3)
    return doc


def error_document():
    doc=document('Работа над ошибками')
    paragraph(doc,'Работа над ошибками',style='Title')
    paragraph(doc,'Разбери одно задание: найди ошибочный переход, исправь решение и проверь результат. Для следующей ошибки используй новый лист.',after=12)
    paragraph(doc,'Имя ______________________________  Класс ______  Дата __________',after=9)
    paragraph(doc,'Тема ______________________________  Вариант _____  Задание _____',after=12)
    paragraph(doc,'Условие задания',style='Heading 1');writing_lines(doc,2)
    paragraph(doc,'Мой ответ и место ошибки',style='Heading 1')
    paragraph(doc,'Перепиши ошибочный переход и подчеркни место, где нужно исправление.',after=3);writing_lines(doc,2)
    paragraph(doc,'Почему появилась ошибка',style='Heading 1')
    paragraph(doc,'□ Знак или скобки     □ Вычисление     □ Правило или свойство',after=3)
    paragraph(doc,'□ Чтение графика     □ Условие задания     □ Другая причина',after=4)
    writing_lines(doc,1)
    paragraph(doc,'Исправленное решение',style='Heading 1');writing_lines(doc,4)
    paragraph(doc,'Проверка и следующий шаг',style='Heading 1')
    paragraph(doc,'Как проверил результат __________________________________________',after=8)
    paragraph(doc,'Что сделаю иначе в похожем задании ______________________________',after=8)
    paragraph(doc,'Похожее задание для закрепления _________________________________',after=8)
    return doc


def normalized_docx(doc):
    memory=io.BytesIO();doc.save(memory)
    result=io.BytesIO()
    with zipfile.ZipFile(memory) as source,zipfile.ZipFile(result,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as target:
        for name in sorted(source.namelist()):
            info=zipfile.ZipInfo(name,STAMP);info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o100644<<16
            target.writestr(info,source.read(name))
    return result.getvalue()


def outputs():
    source=json.loads(SOURCE.read_text())
    result={}
    records=[]
    for pack in source['packs']:
        for teacher,key in [(False,'studentFile'),(True,'teacherFile')]:
            content=normalized_docx(pack_document(pack,teacher))
            result[pack[key]]=content
            records.append({'path':pack[key],'role':'answers' if teacher else 'student','topic':pack['id'],
                            'variants':4,'expectedPages':4,'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content)})
    content=normalized_docx(error_document())
    result[source['errorReviewFile']]=content
    records.append({'path':source['errorReviewFile'],'role':'error-review','expectedPages':1,
                    'sha256':hashlib.sha256(content).hexdigest(),'bytes':len(content)})
    archive=io.BytesIO()
    with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as zipped:
        for path,content in sorted(result.items()):
            info=zipfile.ZipInfo(path,STAMP);info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
            zipped.writestr(info,content)
    result[source['archive']]=archive.getvalue()
    manifest={'schemaVersion':1,'sourceSha256':hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
              'topics':3,'variants':12,'tasks':48,'files':records,
              'archive':{'path':source['archive'],'files':7,'sha256':hashlib.sha256(archive.getvalue()).hexdigest(),'bytes':len(archive.getvalue())}}
    result['word-manifest.json']=(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n').encode()
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args()
    generated=outputs()
    for path,content in generated.items():
        target=OUT/path
        if args.check:
            if not target.exists() or target.read_bytes()!=content:raise SystemExit('Stale generated file: '+path)
        else:
            target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(content)
    print(json.dumps({'status':'PASS','mode':'check' if args.check else 'build','docx':7,'questions':48,'files':len(generated)}))


if __name__=='__main__':main()
