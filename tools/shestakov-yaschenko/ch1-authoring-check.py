"""Regenerate chapter one and require byte-identical committed authored output."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parents[2]
path=root/'stereo-course/shestakov-yaschenko-10-11/chapters/ch1.json'
before=path.read_bytes()
subprocess.run([sys.executable,str(Path(__file__).with_name('author-1.py'))],cwd=root,check=True)
assert path.read_bytes()==before,'Chapter-one author modules differ from the recorded chapter; review/regeneration required'
print('SHESTAKOV_CH1_AUTHORING_OK: byte-identical regeneration')
