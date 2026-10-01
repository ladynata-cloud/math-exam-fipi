import json
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'stereo-course';A=D/'assets'
c=json.loads((D/'data/course.json').read_text());p=json.loads((D/'data/proofs.json').read_text())
links={'polyhedra':'section','coordinates':'box-diagonal','sphere-equation':'sphere-cut','plane-equation':'dot','transformations':'scale','slices':'pyramid-volume','pyramid-frustum':'frustum','sphere':'sphere-cut','box':'box-diagonal'}
for u in c['units']:
 if u['id'] in links:u['proof']=links[u['id']]
scripts='<script>window.STEREO_COURSE='+json.dumps(c,ensure_ascii=False).replace('<','\\u003c')+';window.STEREO_PROOFS='+json.dumps(p,ensure_ascii=False).replace('<','\\u003c')+';</script>'
for name in ['space.js','viewer.js','answer.js','tasks.js','store.js','app.js']:scripts+='<script>'+(A/name).read_text().replace('</script','<\\/script')+'</script>'
html='<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Атанасян 10–11 · Пространственная мастерская</title><style>'+(A/'style.css').read_text()+'</style></head><body><header class="topbar"><button id="home" class="brand">MathExam / Стереометрия</button><nav class="toplinks"><a href="../geometry-course/index.html">Геометрия 7–9</a><button id="export-progress">Скачать прогресс</button></nav></header><div class="container"><p id="storage-notice" class="warning" role="alert" hidden></p><main id="app"></main><footer>Авторские объяснения и задачи по темам учебника Атанасяна и др., 10–11 классы, 2024. Исследование модели помогает построить догадку; общее доказательство требует рассуждения. Сохраните файл прогресса для переноса на другое устройство.</footer></div>'+scripts+'</body></html>'
(D/'index.html').write_text(html)
print('Built single-file course:',len(c['units']),'units;',len(p),'argument chains;',len(html.encode()),'bytes')
