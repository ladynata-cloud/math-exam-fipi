#!/usr/bin/env python3
"""Integrity tests with disposable synthetic fixtures, never recording evidence."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image, __version__ as pillow_version

TOOLS = Path(__file__).parent
spec = importlib.util.spec_from_file_location('habr_encoder', TOOLS / 'build-habr-gifs.py')
encoder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(encoder)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n')


class Integrity(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='habr-encoder-fixture-')
        self.root = Path(self.temp.name)
        self.repo = self.root / 'repo'
        self.raw = self.root / 'raw'
        self.repo.mkdir()
        self.raw.mkdir()
        (self.repo / 'source.js').write_text('fixture source')
        sources = {'source.js': digest((self.repo / 'source.js').read_bytes())}
        clips, records = [], []
        for number in range(8):
            id = f'fixture-{number}'
            directory = self.raw / id
            directory.mkdir()
            frames = [{'caption': f'Тестовый кадр {i}', 'durationMs': 1500, 'actions': [], 'assertions': []} for i in range(3)]
            clip = {'id': id, 'url': f'/fixture/{number}', 'runtimeFiles': ['source.js'], 'frames': frames}
            clips.append(clip)
            recording = {'id': id, 'url': clip['url'], 'sourceHashes': sources, 'complete': True,
                         'scenarioSha256': digest(json.dumps(clip, ensure_ascii=False, separators=(',', ':')).encode()), 'frames': []}
            for i, frame in enumerate(frames):
                name = f'frame-{i+1:02}.png'
                Image.new('RGB', (320, 100), (i*50, number*20, 120)).save(directory / name)
                recording['frames'].append(dict(frame, file=name, sha256=digest((directory / name).read_bytes())))
            write(directory / 'recording.json', recording)
            records.append({'id': id, 'complete': True, 'recordingSha256': digest((directory / 'recording.json').read_bytes())})
        self.plan = self.root / 'plan.json'
        write(self.plan, {'clips': clips, 'sourceHashes': sources, 'pillowVersion': pillow_version})
        self.receipt = {'complete': True, 'head': 'fixture-only', 'tree': 'fixture-only',
                        'clipList': [c['id'] for c in clips], 'records': records,
                        'planSha256': digest(self.plan.read_bytes()),
                        'recorderSha256': digest((TOOLS / 'habr-gifs.browser.cjs').read_bytes()),
                        'encoderSha256': digest((TOOLS / 'build-habr-gifs.py').read_bytes()),
                        'sourceHashes': sources, 'browser': 'synthetic-test-fixture-not-browser',
                        'playwrightVersion': 'fixture', 'chromiumExecutableSha256': 'fixture'}
        self.save()

    def tearDown(self):
        self.temp.cleanup()

    def save(self):
        write(self.raw / 'capture-receipt.json', self.receipt)

    def run_encoder(self):
        return encoder.encode(self.raw, self.root / 'output', self.repo, self.plan)

    def test_all_eight_fixture_roundtrips(self):
        result = self.run_encoder()
        self.assertTrue(result['complete'])
        self.assertEqual(len(result['clips']), 8)
        self.assertTrue(all(c['frameCount'] == 3 for c in result['clips']))

    def test_incomplete_is_rejected(self):
        self.receipt['complete'] = False
        self.save()
        with self.assertRaises(AssertionError):
            self.run_encoder()

    def test_missing_clip_is_rejected(self):
        self.receipt['clipList'].pop()
        self.receipt['records'].pop()
        self.save()
        with self.assertRaises(AssertionError):
            self.run_encoder()

    def test_duplicate_record_is_rejected(self):
        self.receipt['records'].append(copy.deepcopy(self.receipt['records'][0]))
        self.save()
        with self.assertRaises(AssertionError):
            self.run_encoder()

    def test_false_recorder_identity_is_rejected(self):
        self.receipt['recorderSha256'] = '0'*64
        self.save()
        with self.assertRaises(AssertionError):
            self.run_encoder()

    def test_changed_runtime_is_rejected(self):
        (self.repo / 'source.js').write_text('different source')
        with self.assertRaises(AssertionError):
            self.run_encoder()

    def test_corrupt_raw_frame_is_rejected(self):
        with (self.raw / 'fixture-0' / 'frame-01.png').open('ab') as file:
            file.write(b'changed')
        with self.assertRaises(AssertionError):
            self.run_encoder()


if __name__ == '__main__':
    unittest.main()
