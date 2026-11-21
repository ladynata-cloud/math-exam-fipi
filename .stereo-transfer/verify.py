"""Rebuild the canonical coordinate-and-motions course from its reviewed lessons."""
import base64
from hashlib import sha1, sha256
import json
from pathlib import Path
import subprocess

from shutil import copyfile

for stage in ('expected','refined'):
    if stage == 'refined':
        for edition in Path('.stereo-transfer/reviewed').glob('*.json'):
            copyfile(edition, Path('stereo-course/textbook/lessons') / edition.name)
    expected = json.loads(Path('.stereo-transfer/' + stage + '.json').read_text())
    subprocess.run(['python3','tools/stereo-textbook/build_textbook.py'], check=True)
    data = Path('stereo-course/textbook/data/course.json').read_bytes()
    assert len(data) == expected['bytes']
    assert sha256(data).hexdigest() == expected['sha256']
    assert sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == expected['sha']
    for check in ('spatial-symmetries-and-fixed-sets', 'isometries-of-space-section-end','coordinates-chapter-seven-self-check'):
        subprocess.run(['node','tools/stereo-textbook/' + check + '.test.cjs'], check=True)
    with open('reviewed-course-object.json', 'w') as output:
        json.dump({'content': base64.b64encode(data).decode('ascii'), 'encoding':'base64'}, output)
    result = subprocess.run(['gh','api','--method','POST','repos/ladynata-cloud/math-exam-fipi/git/blobs','--input','reviewed-course-object.json','--jq','.sha'], text=True, check=True, capture_output=True)
    assert result.stdout.strip() == expected['sha']
    print('Verified course', expected['sha'], len(data))
