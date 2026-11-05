from pathlib import Path
import json,re

p=Path(__file__).resolve().parents[2]/'courses/vilenkin-5-part-1'
html=(p/'index.html').read_text()
data={'lessons':[json.loads((p/f'data/lessons-{i}.json').read_text()) for i in range(1,6)],'book':json.loads((p/'data/textbook-index.json').read_text())}
for css in ['styles.css','practice.css']:
    html=html.replace(f'<link rel="stylesheet" href="{css}">','<style>'+(p/css).read_text()+'</style>')
html=re.sub(r'<script defer src="[^"]+"></script>','',html)
scripts='<script>window.VILENKIN_DATA='+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';</script>'
for f in ['math.js','labs.js','practice.js','app.js']:
    scripts+='<script>'+(p/f).read_text().replace('</script','<\\/script')+'</script>'
html=html.replace('</body>',scripts+'</body>')
html=html.replace('href="/courses/"','href="https://mathexam.space/courses/"')
html=html.replace('<head>', '<head><meta name="robots" content="noindex,follow">')
(p/'offline.html').write_text(html)
print('Offline course bundled:',len(html.encode()),'bytes')
