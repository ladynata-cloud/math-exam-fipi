"""Embed the personal learning notebook in the retained offline trainers."""
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
START='<!-- atanasyan-personal-notebook:start -->'
END='<!-- atanasyan-personal-notebook:end -->'
runtime=(ROOT/'tools/atanasyan-legacy-audit.runtime.js').read_text()
def mapping(name):
    if 'ch1-p3' in name:return 'equality','Какое движение совместит фигуры? Какие части совпадут и почему?'
    if 'ch1-p6' in name:return 'perpendicular','Сначала назови вершину и стороны угла. Какие углы смежные, а какие вертикальные?'
    if 'constr-angle-bisector' in name:return 'angle-locus','Почему выбранная точка равноудалена от сторон угла? Отдели свойство от обратного утверждения.'
    if 'constr-perp-bisector' in name:return 'perp-locus','Какие две длины будут равны после построения и почему это сохранится при перемещении?'
    if 'constr' in name:return 'compass','Какая геометрическая связь должна определять новое построение вместо выбора на глаз?'
    if 'ch2-p1-t1' in name:return 'equality','Предскажи, какое движение совместит фигуры. Совпадение на одном рисунке ещё нужно объяснить.'
    if 'ch2-p1' in name:return 'triangle-sas','Между какими сторонами расположен данный угол? Запиши соответствие вершин до выбора признака.'
    if 'ch2-p2-t2' in name or 'ch2-p2-t3' in name:return 'cevians','Какие стороны равны и где находится основание? Почему равны именно углы при основании?'
    if 'ch2-p2' in name:return 'cevians','Что задаёт эту линию: середина стороны, равные углы или прямой угол? Какие дополнительные условия нужны для совпадения линий?'
    if 'ch2-p3' in name or 'ch2-p4' in name:return 'triangle-signs','Запиши соответствие вершин. Какие стороны и углы даны, и какого условия пока не хватает для признака?'
    if 'ch3-p1' in name:return 'parallel-angles','Это условие параллельности или её следствие? Назови пару углов и направления их сторон.'
    if 'ch3-p2' in name:return 'parallels','Что дано: параллельность или равенство углов? Не используй вывод как исходное условие.'
    if 'ch4-p2-t4' in name:return 'right-triangle','Сначала найди прямой угол и гипотенузу. Какие стороны можно сравнить? Что именно требуется доказать?'
    if 'ch4-p2-t3' in name:return 'cevians','Равенство углов дано или его нужно доказать? Какое обратное утверждение здесь применимо?'
    if 'ch4-p1' in name or 'ch4-p2' in name:return 'triangle-angles','Проверь существование треугольника, затем свяжи углы со сторонами. Какое равенство или неравенство нужно?'
    if 'ch4-p3' in name:return 'right-triangle','Сначала найди прямой угол и гипотенузу. Какая особая связь применима именно к этому условию?'
    if 'ch4-p4' in name:return 'distance','К какой прямой строится перпендикуляр? Может ли основание лежать на продолжении отрезка?'
    raise ValueError(name)
for path in sorted((ROOT/'geometry-course/trainers').glob('*.html')):
    content=path.read_bytes().decode('utf-8');unit,prompt=mapping(path.stem)
    config=json.dumps({'id':path.stem,'unit':unit,'prompt':prompt},ensure_ascii=False).replace('</','<\\/')
    block=START+'\n<script type="application/json" id="atanasyan-notebook-config">'+config+'</script>\n<script>\n'+runtime.replace('</script','<\\/script')+'</script>\n'+END
    content=re.sub(re.escape(START)+r'.*?'+re.escape(END)+r'\s*','',content,flags=re.S)
    assert content.count('</body>')==1,path
    target='<!-- atanasyan-active-practice:start -->' if '<!-- atanasyan-active-practice:start -->' in content else '</body>'
    result=content.replace(target,block+'\n'+target,1).encode('utf-8')
    if result!=path.read_bytes():path.write_bytes(result)
print('Embedded personal notebooks in 70 retained trainers')
