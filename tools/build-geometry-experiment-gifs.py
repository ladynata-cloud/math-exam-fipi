#!/usr/bin/env python3
"""Encode actual browser recordings into captioned GIFs and independent stills.

Input comes only from tools/geometry-experiment-gifs.browser.cjs. No diagrams or
controls are redrawn. Browser screenshots retain the source course UI order.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / 'assets' / 'geometry-experiment-gifs'
FONT_ROOT = Path('/usr/share/fonts/truetype/dejavu')
WIDTH = 720


def digest(data):
    return hashlib.sha256(data).hexdigest()


def font(size, bold=False):
    return ImageFont.truetype(str(FONT_ROOT / ('DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf')), size)


def wrapped(draw, text, face, width):
    lines = ['']
    for word in text.split():
        candidate = (lines[-1] + ' ' + word).strip()
        if lines[-1] and draw.textlength(candidate, font=face) > width:
            lines.append(word)
        else:
            lines[-1] = candidate
    return lines


def compose(record, frame, source, image_height):
    metrics = ImageDraw.Draw(Image.new('RGB', (WIDTH, 20)))
    title = record['title']
    heading = font(18, True)
    title_lines = wrapped(metrics, title, heading, 605)
    if len(title_lines) > 2:
        raise ValueError(f'Clip title too long: {title}')
    header = 54 if len(title_lines) == 1 else 70
    result = Image.new('RGB', (WIDTH, header + image_height + 96), '#fffefa')
    draw = ImageDraw.Draw(result)
    draw.rectangle((0, 0, WIDTH, header - 1), fill='#163c52')
    for i, line in enumerate(title_lines):
        draw.text((18, 14 + i * 23), line, font=heading, fill='#ffffff')
    draw.rounded_rectangle((640, 11, 704, 41), radius=7, fill='#e8f2ed')
    draw.text((672, 26), f"{frame['stepIndex'] + 1}/{len(record['logicalFrames'])}", anchor='mm', font=font(15, True), fill='#163c52')
    with Image.open(source / frame['filename']) as screenshot:
        picture = screenshot.convert('RGB')
        if picture.width > WIDTH - 24:
            raise ValueError('Recorder screenshot wider than accepted capture width')
        result.paste(picture, ((WIDTH - picture.width) // 2, header))
    top = header + image_height
    draw.rounded_rectangle((12, top + 6, WIDTH - 12, top + 86), radius=10, fill='#edf3f1')
    body = font(22)
    lines = wrapped(draw, frame['caption'], body, WIDTH - 64)
    if len(lines) > 2:
        body = font(20)
        lines = wrapped(draw, frame['caption'], body, WIDTH - 64)
    if len(lines) > 3:
        raise ValueError(f"Caption too long: {frame['caption']}")
    y = top + 46 - len(lines) * 13
    for line in lines:
        draw.text((30, y), line, font=body, fill='#163c52')
        y += 26
    return result


def build(source, target, selected):
    index = json.loads((source / 'recordings.json').read_text(encoding='utf-8'))
    ids = [identifier for identifier in index['clips'] if not selected or identifier in selected]
    if not ids:
        raise ValueError('No completed browser recordings found')
    target.mkdir(parents=True, exist_ok=True)
    manifest_path = target / 'media.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if selected and manifest_path.exists() else {'schemaVersion': 1, 'clips': {}}
    for identifier in ids:
        record_path = source / identifier / 'recording.json'
        record = json.loads(record_path.read_text(encoding='utf-8'))
        for file, expected in record['sourceHashes'].items():
            content = subprocess.check_output(['git', 'show', f"{record['sourceRef']}:{file}"], cwd=ROOT) if record.get('sourceRef') else (ROOT / file).read_bytes()
            if digest(content) != expected:
                raise ValueError(f'Recording uses a different source: {file}; recapture {identifier}')
        image_height = max(Image.open(source / frame['filename']).height for frame in record['frames'])
        images = [compose(record, frame, source, image_height) for frame in record['frames']]
        still_paths = []
        for number, frame_index in enumerate(record['logicalFrames'], 1):
            filename = f'{identifier}-{number:02}.png'
            images[frame_index].quantize(colors=192, method=Image.Quantize.MEDIANCUT).save(target / filename, optimize=True)
            still_paths.append(filename)
        palette = images[0].quantize(colors=192, method=Image.Quantize.MEDIANCUT)
        animated = [image.quantize(palette=palette, dither=Image.Dither.NONE) for image in images]
        filename = f'{identifier}.gif'
        durations = [frame['duration'] for frame in record['frames']]
        # Complete opaque screenshots allow disposal=1: only changed rectangles
        # need encoding. Verify decoded pixels below so no old geometry trails.
        animated[0].save(target / filename, save_all=True, append_images=animated[1:], duration=durations, loop=0, disposal=1, optimize=True)
        with Image.open(target / filename) as encoded:
            animation_frames = encoded.n_frames
            encoded_duration = 0
            for frame_index in range(encoded.n_frames):
                encoded.seek(frame_index)
                encoded_duration += encoded.info.get('duration', 0)
            encoded.seek(0)
            frame_index = 0
            frame_end = encoded.info['duration']
            elapsed = 0
            actual = encoded.convert('RGB')
            for expected, duration in zip(animated, durations):
                while elapsed >= frame_end:
                    frame_index += 1
                    encoded.seek(frame_index)
                    frame_end += encoded.info['duration']
                    actual = encoded.convert('RGB')
                if ImageChops.difference(expected.convert('RGB'), actual).getbbox() is not None:
                    raise ValueError(f'GIF pixel mismatch or stale trail: {identifier} at {elapsed} ms')
                elapsed += duration
        if encoded_duration != sum(durations):
            raise ValueError(f'Duration changed during GIF encoding: {identifier}')
        all_files = [filename, *still_paths]
        manifest['clips'][identifier] = {
            'gif': filename, 'poster': still_paths[0], 'frames': still_paths,
            'width': WIDTH, 'height': images[0].height, 'durationMs': sum(durations),
            'animationFrames': animation_frames, 'recordedFrames': len(images), 'sourcePage': record['sourcePage'],
            'sourceCourse': record['sourceCourse'], 'surface': record['surface'],
            'sourceRef': record.get('sourceRef'),
            'browser': record['browser'], 'recorderSha256': record.get('recorderSha256'),
            'encoderSha256': digest(Path(__file__).read_bytes()),
            'sourceHashes': record['sourceHashes'], 'scenarioSha256': record['scenarioSha256'],
            'recordingSha256': digest(record_path.read_bytes()),
            'bytes': {name: (target / name).stat().st_size for name in all_files},
            'sha256': {name: digest((target / name).read_bytes()) for name in all_files},
            'states': record['states'],
        }
        print(f"ENCODED {identifier}: {len(still_paths)} steps, {sum(durations) / 1000:.1f}s, {(target / filename).stat().st_size:,} GIF bytes")
    manifest['catalogueSha256'] = index['catalogueSha256']
    manifest['clips'] = dict(sorted(manifest['clips'].items()))
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('recordings', type=Path)
    parser.add_argument('--output', type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument('--clips', default='')
    options = parser.parse_args()
    build(options.recordings, options.output, set(filter(None, options.clips.split(','))))
