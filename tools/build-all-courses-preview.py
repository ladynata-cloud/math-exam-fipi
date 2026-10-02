"""Build the complete release preview, keeping bundled links usable under file://.
Usage: python tools/build-ege-baza-preview.py /absolute/output.zip
The build does not publish or modify source files.
"""
from pathlib import Path
from urllib.parse import urlsplit,urljoin
import sys,zipfile,re,posixpath
ROOT=Path(__file__).resolve().parents[1]
DEST=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT/'all-courses-preview.zip'
files={}
for folder in ['ege-baza','trainers/ege-baza','geometry-course','geometry-merzlyak','geometry-pogorelov','stereo-course','school','equations','courses']:
 for p in (ROOT/folder).rglob('*'):
  if p.is_file() and p.suffix in ['.html','.css','.js','.pdf','.json','.jsonl','.csv','.txt']:
   files[p.relative_to(ROOT).as_posix()]=p.read_bytes()
for name in ['index.html','assets/site.css','ege-profil/trainers/stereo/js/three.min.js','trainers/oge-basics/multiplication-division/division-lab.html','trainers/oge-basics/multiplication-division/division-lab.js','trainers/oge-basics/multiplication-division/division-lab-core.js','trainers/oge-basics/multiplication-division/division-lab.css']:
 files[name]=(ROOT/name).read_bytes()
def href(name,value):
 if not value or value.startswith(('http:','https:','data:','#','mailto:','javascript:')) or '${' in value:return value
 u=urlsplit(value);target=posixpath.normpath(u.path.lstrip('/') if u.path.startswith('/') else posixpath.join(posixpath.dirname(name),u.path))
 if target in ('.',''):target='index.html'
 if target not in files and target+'/index.html' in files:target+='/index.html'
 if target not in files:return urljoin('https://mathexam.space/'+name,value)
 return posixpath.relpath(target,posixpath.dirname(name) or '.')+('?' +u.query if u.query else '')+('#'+u.fragment if u.fragment else '')
for name,b in list(files.items()):
 if not name.endswith(('.html','.js','.css')):continue
 s=b.decode('utf8')
 if name.endswith('.html'):s=re.sub(r'\b(href|src)="([^"]*)"',lambda m:m[1]+'="'+href(name,m[2])+'"',s)
 # Existing dynamic paths have known, verified destinations.
 s=s.replace("href:'../trainers/oge-basics/'+path","href:'https://mathexam.space/trainers/oge-basics/'+path")
 s=s.replace('../trainers/ege-baza/course/\'', '../trainers/ege-baza/course/index.html\'').replace('../trainers/ege-baza/data-course/\'', '../trainers/ege-baza/data-course/index.html\'')
 s=s.replace('../../../ege-baza/#','../../../ege-baza/index.html#')
 if name.endswith('.js'):
  s=s.replace('href="/', 'href="https://mathexam.space/')
 if name.startswith('trainers/ege-baza/'):
  s=re.sub(r"link:'([^']+)'",lambda m:"link:'"+href(name,m[1])+"'",s)
 files[name]=s.encode('utf8')
files['TEXTBOOK_TRAINERS_RELEASE.md']=(ROOT/'docs/TEXTBOOK_TRAINERS_RELEASE.md').read_bytes()
files['READ-ME.txt']=('Курсы MathExam — сборка для просмотра. Распакуйте весь архив и откройте index.html или ege-baza/index.html.\n'
 'Включены ЕГЭ база, Атанасян7–9 и10–11, Мерзляк и Погорелов, мастерская5–11, уравнения и лаборатория деления. Главная карта всех курсов: courses/index.html. Доска и внешние тренажёры открываются на действующем сайте.\n'
 'Покрытие всех подтипов ФИПИ не подтверждено. Источники и ограничения: ege-baza/sources/index.html.\n'
 'Прогресс зависит от браузера и адреса страницы; используйте экспорт. Облачного журнала групп нет.\n'
 'Внешние дополнительные тренажёры открываются на mathexam.space и требуют интернета.\n').encode('utf8')
# Verify static references after rewriting.
for name,b in files.items():
 if name.endswith('.html'):
  for value in re.findall(r'\b(?:href|src)="([^"]*)"',b.decode('utf8')):
   if not value or value.startswith(('http:','https:','data:','#','mailto:','javascript:')) or '${' in value:continue
   target=posixpath.normpath(posixpath.join(posixpath.dirname(name),urlsplit(value).path));assert target in files,(name,value,target)
DEST.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(DEST,'w',zipfile.ZIP_DEFLATED) as z:
 for name,b in files.items():z.writestr(name,b)
with zipfile.ZipFile(DEST) as z:assert z.testzip() is None
print('ALL_COURSES_PREVIEW_OK:',len(files),'files;',DEST.stat().st_size,'bytes; static links verified')
