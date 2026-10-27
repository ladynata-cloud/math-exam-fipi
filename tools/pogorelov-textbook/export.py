"""Export the course as one offline HTML file, without the textbook."""
from pathlib import Path
import argparse
import runpy

parser=argparse.ArgumentParser()
parser.add_argument('destination',type=Path)
args=parser.parse_args()
source=Path(__file__).resolve().parents[2]/'geometry-pogorelov/textbook'
html=(source/'index.html').read_text()
# The optional online navigator is not part of the standalone offline course.
# Strip only the exact reviewed block; reject any unexpected helper dependency.
helper=runpy.run_path(str(source.parents[1]/'tools/public-assistant-coverage.py'),run_name='public_helper_markup')
block=helper['BLOCK'].decode()
if block in html:
    if html.count(block)!=1:
        raise ValueError('Duplicate public helper block in offline source')
    html=html.replace(block,'',1)
if '/assets/assistant/' in html or 'MathExam public assistant' in html:
    raise ValueError('Unrecognized public helper markup in offline source')
html=html.replace('<link rel="stylesheet" href="style.css">','<style>'+(source/'style.css').read_text()+'</style>')
for name in ['data.js','core.js','app.js']:
    html=html.replace('<script src="'+name+'"></script>','<script>'+(source/name).read_text().replace('</script','<\\/script')+'</script>')
args.destination.parent.mkdir(parents=True,exist_ok=True)
args.destination.write_text(html)
print('Offline course exported:',args.destination.name)
