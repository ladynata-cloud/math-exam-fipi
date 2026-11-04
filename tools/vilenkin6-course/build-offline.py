from pathlib import Path
import json,re
p=Path(__file__).resolve().parents[2]/'courses/vilenkin-6-part-1'
html=(p/'index.html').read_text()
# The retained offline edition must not redirect into the online textbook route.
html=re.sub(r'<script src="textbook-entry\.js(?:\?[^"<>]*)?"></script>', '', html)
data={'lessons':[json.loads((p/f'data/lessons-{i}.json').read_text()) for i in range(1,6)],'book':json.loads((p/'data/textbook-index.json').read_text())}
html=re.sub(r'<link rel="stylesheet" href="styles\.css(?:\?[^"<>]*)?">',lambda _: '<style>'+(p/'styles.css').read_text()+'</style>',html)
html=re.sub(r'<script defer src="[^"]+"></script>','',html)
scripts='<script>window.VILENKIN_DATA='+json.dumps(data,ensure_ascii=False).replace('</','<\\/')+';</script>'
for f in ['math.js','labs.js','app.js']:
 scripts+='<script>'+(p/f).read_text().replace('</script','<\\/script')+'</script>'
html=html.replace('</body>',scripts+'</body>')
html=html.replace('<head>', '<head><meta name="robots" content="noindex,follow">')
(p/'offline.html').write_text(html)
print('Offline course bundled:',len(html.encode()),'bytes')
