"""Export the course as one offline HTML file, without the textbook."""
from pathlib import Path
import argparse

parser=argparse.ArgumentParser()
parser.add_argument('destination',type=Path)
args=parser.parse_args()
source=Path(__file__).resolve().parents[2]/'geometry-pogorelov/textbook'
html=(source/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(source/'style.css').read_text()+'</style>')
for name in ['data.js','core.js','app.js']:
    html=html.replace('<script src="'+name+'"></script>','<script>'+(source/name).read_text().replace('</script','<\\/script')+'</script>')
args.destination.parent.mkdir(parents=True,exist_ok=True)
args.destination.write_text(html)
print('Offline course exported:',args.destination.name)
