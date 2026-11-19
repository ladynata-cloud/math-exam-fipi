"""Verify that the guide build preserves every pre-existing lesson byte outside its exact integration."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import zipfile

from geometry_experiment_guides import CONFIG, GUIDE_TAG, ROOT, _script, has_topic_guide, with_guides


def check_topic_guide_ownership():
    path = 'geometry-pogorelov/atlas/pogorelov-base-7-1.html'
    legacy = (ROOT / path).read_text()
    match = CONFIG.search(legacy)
    config = json.loads(match[2])
    config['unit']['topicQuestion'] = 'Какие точки задают прямую?'
    flagged = legacy[:match.start(2)] + json.dumps(config, ensure_ascii=False) + legacy[match.end(2):]
    marked = legacy.replace('<body>', '<body><details data-pogorelov-topic-guide></details>', 1)
    assert has_topic_guide(marked)
    assert not has_topic_guide('<script>const example = "<div data-pogorelov-topic-guide>";</script>')
    for source in (flagged, marked):
        cleaned = with_guides(path, source)
        assert 'experimentGuides' not in json.loads(CONFIG.search(cleaned)[2])
        assert not GUIDE_TAG.search(cleaned)
        assert with_guides(path, cleaned) == cleaned


def check(base):
    check_topic_guide_ownership()
    def original(path):
        return subprocess.check_output(['git', 'show', base + ':' + path], cwd=ROOT).decode()
    catalogue = json.loads((ROOT/'assets/geometry-experiment-gifs/catalog.json').read_text())
    old_lab = _script(original('geometry-course/assets/lab.js'))
    count = 0
    for relative in catalogue['pages']:
        old = original(relative)
        new = (ROOT/relative).read_text()
        before = CONFIG.search(old)
        after = CONFIG.search(new)
        assert before and after, relative + ': configuration missing'
        old_config = json.loads(before[2])
        new_config = json.loads(after[2])
        guides = new_config.pop('experimentGuides', None)
        if relative.startswith('geometry-pogorelov/') and (old_config['unit'].get('topicQuestion') or has_topic_guide(old)):
            assert guides is None and not GUIDE_TAG.search(new), relative + ': generic guide on a topic scene'
        else:
            assert guides and guides['unitId'] == catalogue['pages'][relative]['unitId'], relative
        assert new_config == old_config, relative + ': teaching config changed'
        restored = GUIDE_TAG.sub('', new)
        match = CONFIG.search(restored)
        restored = restored[:match.start()] + before[0] + restored[match.end():]
        if relative.startswith('geometry-course/'):
            count_lab = [0]
            def restore_lab(m):
                if re.search(r'root\.GeoLab\s*=\s*\{\s*mount\s*\}', m[1]):
                    count_lab[0] += 1
                    return '<script>' + old_lab + '</script>'
                return m[0]
            restored = re.sub(r'<script>(.*?)</script>', restore_lab, restored, flags=re.S)
            assert count_lab == [1], relative + ': embedded lab count'
        else:
            restored = restored.replace('../assets/lab.js?v=20261116-gifs', '../assets/lab.js')
        assert restored == old, relative + ': unrelated page bytes changed'
        count += 1
    # The harmonized predecessor now exports all 63 atlas lessons. Preserve
    # every other member; each changed lesson may contain only this exact guide
    # integration and the separately checked manual-lab source.
    package = 'downloads/trainers/geometry-course/geometry-course-package.zip'
    if (ROOT/package).is_file():
        old_bytes = subprocess.check_output(['git', 'show', base + ':' + package], cwd=ROOT)
        with zipfile.ZipFile(io.BytesIO(old_bytes)) as old_zip, zipfile.ZipFile(ROOT/package) as new_zip:
            assert sorted(new_zip.namelist()) == sorted(old_zip.namelist()), 'ZIP membership changed'
            atlas = {'atlas/' + Path(name).name for name in catalogue['pages'] if name.startswith('geometry-course/')}
            assert len(atlas) == 63 and atlas <= set(old_zip.namelist()), 'Expected complete predecessor atlas'
            for name in old_zip.namelist():
                before_bytes, after_bytes = old_zip.read(name), new_zip.read(name)
                if name == 'assets/lab.js':
                    assert after_bytes == (ROOT/'geometry-course/assets/lab.js').read_bytes(), 'ZIP lab must equal checked source'
                elif name in atlas:
                    before_html, after_html = before_bytes.decode(), after_bytes.decode()
                    before_config, after_config = CONFIG.search(before_html), CONFIG.search(after_html)
                    assert before_config and after_config, name + ': ZIP configuration missing'
                    config = json.loads(after_config[2])
                    guides = config.pop('experimentGuides', None)
                    assert guides and guides['unitId'] == Path(name).stem, name + ': ZIP guides missing'
                    assert config == json.loads(before_config[2]), name + ': ZIP teaching configuration changed'
                    restored = GUIDE_TAG.sub('', after_html)
                    match = CONFIG.search(restored)
                    restored = restored[:match.start()] + before_config[0] + restored[match.end():]
                    restored = re.sub(r'<script>(.*?)</script>', lambda m: '<script>' + old_lab + '</script>'
                                      if re.search(r'root\.GeoLab\s*=\s*\{\s*mount\s*\}', m[1]) else m[0], restored, flags=re.S)
                    assert restored == before_html, name + ': unrelated ZIP lesson bytes changed'
                else:
                    assert after_bytes == before_bytes, 'Unrelated ZIP member changed: ' + name
    print(json.dumps({'status':'PASS','preservedLessons':count,'base':base,
                      'teachingConfig':'unchanged','headNavigationProofs':'byte-identical'}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base', default='1469ad50a8659f66c8613164009e7387a3a68f2b')
    check(parser.parse_args().base)
