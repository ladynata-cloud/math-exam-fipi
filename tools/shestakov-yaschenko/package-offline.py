#!/usr/bin/env python3
"""Produce one self-contained user-facing HTML; no external fetch or fonts."""
from pathlib import Path
import json,re,sys
root=Path(__file__).resolve().parents[2];course=root/'stereo-course/shestakov-yaschenko-10-11'
page=(course/'index.html').read_text()
styles=[root/'stereo-course/assets/task-scenes.css',root/'stereo-course/textbook/assets/style.css',course/'assets/style.css']
css='\n'.join(re.sub(r'@import[^;]+;','',p.read_text()) for p in styles)
page=re.sub(r'<link rel="stylesheet"[^>]*>','',page).replace('</head>','<style>'+css+'</style></head>')
page=page.replace('href="../"','href="https://mathexam.space/stereo-course/"').replace('href="/ege-profil/"','href="https://mathexam.space/ege-profil/"')
for url,path in [('../assets/math-text.js',root/'stereo-course/assets/math-text.js'),('../assets/task-scene-viewer.js',root/'stereo-course/assets/task-scene-viewer.js'),('assets/engine.js',course/'assets/engine.js')]:
 page=page.replace('<script src="'+url+'"></script>','<script>'+path.read_text().replace('</script','<\\/script')+'</script>')
bundle=json.loads((course/'data/course.json').read_text());assert all(l['status']=='reviewed' for l in bundle['lessons'])
bootstrap="'use strict';window.textbookApp=StereoTextbook.createApp(document.getElementById('textbook-app'),"+json.dumps(bundle,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+");"
page=re.sub(r"<script>\s*'use strict';fetch[\s\S]*?</script>",lambda _: '<script>'+bootstrap+'</script>',page)
assert 'fetch(' not in page
out=Path(sys.argv[1]);out.parent.mkdir(parents=True,exist_ok=True);out.write_text(page);print(out)
