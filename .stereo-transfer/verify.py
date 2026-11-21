"""Rebuild five exact textbook snapshots from the reviewed source files."""
import base64
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

source = Path('.stereo-transfer')
course = Path('stereo-course/textbook')
for stage, expected in zip(('through-676', 'through-681', 'through-696', 'through-718', 'reviewed-boundaries'), json.loads((source / 'manifest.json').read_text()), strict=True):
    for file in (source / stage).glob('*.json'):
        target = course / ('source-index.json' if file.name == 'source-index.json' else 'lessons/' + file.name)
        shutil.copyfile(file, target)
    subprocess.run(['python3', 'tools/stereo-textbook/build_textbook.py'], check=True)
    data = (course / 'data/course.json').read_bytes()
    assert len(data) == expected['bytes']
    assert hashlib.sha256(data).hexdigest() == expected['sha256']
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == expected['sha']
    if stage in ('through-676', 'through-681', 'through-696'):
        continue
    with open('book-blob-payload.json', 'w') as output:
        json.dump({'content': base64.b64encode(data).decode('ascii'), 'encoding': 'base64'}, output)
    result = subprocess.run(['gh', 'api', '--method', 'POST', 'repos/ladynata-cloud/math-exam-fipi/git/blobs', '--input', 'book-blob-payload.json', '--jq', '.sha'], check=True, capture_output=True, text=True)
    assert result.stdout.strip() == expected['sha']
    print(stage, expected['sha'], len(data), flush=True)
