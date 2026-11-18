"""Verify two clean course builds against the public pages, including their headers."""
import json
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
COURSE = Path('geometry-merzlyak')
BUILD = Path('tools/merzlyak/build.py')
INPUTS = [BUILD, COURSE/'data/course.json', COURSE/'data/proofs.json',
          Path('tools/geometry-inscribed-angle/proof.html'), Path('assets/assistant/page-rollout.json')]


def main():
    units = json.loads((ROOT/COURSE/'data/course.json').read_text(encoding='utf-8'))['units']
    expected = {COURSE/'atlas'/f'{unit["id"]}.html' for unit in units}
    expected.update(COURSE/name for name in ('index.html', 'teacher.html', 'README.md'))
    with TemporaryDirectory() as directory:
        work = Path(directory)
        for relative in INPUTS:
            (work/relative).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT/relative, work/relative)
        for number in (1, 2):
            subprocess.run([sys.executable, str(work/BUILD)], cwd=work, check=True)
            for relative in sorted(expected):
                if (work/relative).read_bytes() != (ROOT/relative).read_bytes():
                    raise AssertionError(f'Build {number} differs from checked-in {relative}')
    print(f'MERZLYAK_BUILD_OK {len(expected)} checked-in outputs reproduced twice')


if __name__ == '__main__':
    main()
