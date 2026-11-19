#!/usr/bin/env python3
"""Encode native browser frames only; never modify trainers or their storage.

Captions and a neutral matte are the only added graphics. Captured pixels are
neither redrawn nor rescaled. Every decoded GIF frame is compared to its exact
quantized input. A failed capture/encode never receives complete:true.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageSequence, __version__ as pillow_version


def sha(data):
    return hashlib.sha256(data).hexdigest()


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def safe(root, name):
    candidate = (root / name).resolve()
    if not candidate.is_relative_to(root.resolve()) or candidate == root.resolve():
        raise ValueError('Path outside capture directory')
    return candidate


def wrap(text, font, width):
    lines = ['']
    for word in text.split():
        attempt = (lines[-1] + ' ' + word).strip()
        if font.getlength(attempt) <= width:
            lines[-1] = attempt
        else:
            lines.append(word)
    if len(lines) > 4:
        raise ValueError('Caption exceeds four lines')
    return lines


def encode(recordings, output, repo, plan_path):
    receipt = load(recordings / 'capture-receipt.json')
    plan = load(plan_path)
    assert receipt['complete'] is True
    assert receipt['planSha256'] == sha(plan_path.read_bytes())
    assert receipt['encoderSha256'] == sha(Path(__file__).read_bytes())
    assert receipt['recorderSha256'] == sha((Path(__file__).parent / 'habr-gifs.browser.cjs').read_bytes())
    assert receipt['sourceHashes'] == plan['sourceHashes']
    assert receipt['clipList'] == [c['id'] for c in plan['clips']], 'All eight clips in approved order required'
    assert len(receipt['records']) == len(plan['clips'])
    assert {r['id'] for r in receipt['records']} == set(receipt['clipList'])
    for source, expected in receipt['sourceHashes'].items():
        assert sha(safe(repo, source).read_bytes()) == expected, 'Runtime drift: ' + source
    if output.exists():
        raise ValueError('Output must be new; never mix old and new artifacts')
    output.mkdir(parents=True)
    font_path = Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
    font = ImageFont.truetype(str(font_path), 24)
    result = {'schemaVersion': 1, 'complete': False, 'recordingHead': receipt['head'],
              'recordingTree': receipt['tree'], 'clipList': receipt['clipList'],
              'workflowRunId': receipt.get('workflowRunId'), 'workflowRunAttempt': receipt.get('workflowRunAttempt'),
              'planSha256': receipt['planSha256'], 'recorderSha256': receipt['recorderSha256'],
              'encoderSha256': receipt['encoderSha256'], 'sourceHashes': receipt['sourceHashes'],
              'browser': receipt['browser'], 'playwrightVersion': receipt['playwrightVersion'],
              'chromiumExecutableSha256': receipt['chromiumExecutableSha256'],
              'pillowVersion': pillow_version, 'captionFontSha256': sha(font_path.read_bytes()),
              'captureReceiptSha256': sha((recordings / 'capture-receipt.json').read_bytes()),
              'clips': []}
    assert pillow_version == plan['pillowVersion'], 'Encoder version mismatch'
    try:
        for entry in receipt['records']:
            assert entry['complete'] is True
            clip_plan = next(c for c in plan['clips'] if c['id'] == entry['id'])
            record_path = safe(recordings, entry['id'] + '/recording.json')
            assert sha(record_path.read_bytes()) == entry['recordingSha256']
            record = load(record_path)
            assert record['complete'] is True and record['id'] == clip_plan['id']
            # JSON canonical form matches JS JSON.stringify: same key order, compact UTF-8.
            assert record['scenarioSha256'] == sha(json.dumps(clip_plan, ensure_ascii=False, separators=(',', ':')).encode())
            assert record['sourceHashes'] == {s: plan['sourceHashes'][s] for s in clip_plan['runtimeFiles']}
            assert len(record['frames']) == len(clip_plan['frames'])
            images = []
            for frame, frame_plan in zip(record['frames'], clip_plan['frames']):
                assert frame['caption'] == frame_plan['caption']
                assert frame['durationMs'] == frame_plan['durationMs']
                p = safe(record_path.parent, frame['file'])
                assert sha(p.read_bytes()) == frame['sha256']
                with Image.open(p) as original:
                    assert original.format == 'PNG'
                    images.append(original.convert('RGB'))
            width = max(640, max(im.width for im in images))
            height = max(im.height for im in images) + 148
            frames, durations = [], []
            clipdir = output / entry['id']
            clipdir.mkdir()
            for index, (image, frame) in enumerate(zip(images, record['frames'])):
                canvas = Image.new('RGB', (width, height), '#f4f7fa')
                canvas.paste(image, ((width-image.width)//2, 0))
                draw = ImageDraw.Draw(canvas)
                caption = f"{index+1}/{len(images)}. {frame['caption']}"
                for line_index, line in enumerate(wrap(caption, font, width-40)):
                    draw.text((20, height-132+line_index*30), line, font=font, fill='#16263b')
                canvas.save(clipdir / f'frame-{index+1:02}.png')
                frames.append(canvas.quantize(colors=256, method=Image.Quantize.MEDIANCUT))
                durations.append(frame['durationMs'])
            gif = clipdir / (entry['id'] + '.gif')
            frames[0].save(gif, save_all=True, append_images=frames[1:], duration=durations,
                           loop=0, optimize=False, disposal=2)
            with Image.open(gif) as decoded:
                assert decoded.n_frames == len(frames), 'Encoder merged frames'
                for i, actual in enumerate(ImageSequence.Iterator(decoded)):
                    assert actual.info['duration'] == durations[i]
                    assert actual.convert('RGB').tobytes() == frames[i].convert('RGB').tobytes(), 'GIF pixels differ'
            # Contact sheet previews are separately named and never used as source frames.
            thumb_width = 400
            thumb_height = round(height * thumb_width / width)
            sheet = Image.new('RGB', (thumb_width * 2, thumb_height * ((len(frames)+1)//2)), 'white')
            for i, frame in enumerate(frames):
                sheet.paste(frame.convert('RGB').resize((thumb_width, thumb_height), Image.Resampling.LANCZOS),
                            ((i % 2)*thumb_width, (i//2)*thumb_height))
            sheet.save(clipdir / 'contact-sheet.png')
            files = {p.name: {'bytes': p.stat().st_size, 'sha256': sha(p.read_bytes())}
                     for p in sorted(clipdir.iterdir())}
            result['clips'].append({'id': entry['id'], 'sourcePage': record['url'], 'complete': True,
                                    'scenarioSha256': record['scenarioSha256'],
                                    'recordingSha256': entry['recordingSha256'],
                                    'frameCount': len(frames), 'width': width, 'height': height,
                                    'durationsMs': durations, 'frames': [dict(file=f'frame-{i+1:02}.png', caption=f['caption'], durationMs=f['durationMs']) for i, f in enumerate(record['frames'])], 'files': files})
        result['complete'] = True
    finally:
        (output / 'media-receipt.json').write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for option in ('recordings', 'output', 'repo', 'plan'):
        parser.add_argument('--'+option, type=Path, required=True)
    a = parser.parse_args()
    assert not a.output.resolve().is_relative_to(a.repo.resolve()), 'Artifacts must be outside checkout'
    result = encode(a.recordings, a.output, a.repo, a.plan)
    print(json.dumps({'complete': result['complete'], 'clips': result['clipList']}))


if __name__ == '__main__':
    main()
