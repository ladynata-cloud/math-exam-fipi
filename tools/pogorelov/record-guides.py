"""Record the actual lesson board and its measurements using pupil-facing controls.

Run with Python, Pillow, Playwright and Chromium installed:
  python tools/pogorelov/record-guides.py
Select topics by supplying their numbers after the command.
"""
import argparse
import io
import json
import math
import os
import re
from pathlib import Path

from tempfile import TemporaryDirectory

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'assets/geometry-experiment-gifs'
RECIPES = Path(__file__).with_name('guide-recipes.json')
WIDTH = 672
PAPER = '#fffefa'
INK = '#163c52'


def font(size, bold=False):
    from PIL import ImageFont
    name = 'DejaVuSans-Bold.ttf' if bold else 'DejaVuSans.ttf'
    return ImageFont.truetype(name, size)


def wrap(text, face, limit):
    lines = []
    line = ''
    for word in text.split():
        candidate = (line + ' ' + word).strip()
        if line and face.getlength(candidate) > limit:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def compose(canvas, recipe, step_index, readout, tool_name, pointer):
    """Keep the captured diagram untouched. Enlarge the real readout and add captions."""
    from PIL import Image, ImageDraw
    picture = Image.new('RGB', (WIDTH, 700), PAPER)
    draw = ImageDraw.Draw(picture)
    heading = font(23, True)
    headings = wrap(recipe['title'], heading, WIDTH - 105)
    top = 14
    for line in headings:
        draw.text((16, top), line, fill=INK, font=heading, anchor='lt')
        top += 29
    draw.text((WIDTH - 16, 14), f"{step_index + 1}/{len(recipe['steps'])}",
              fill=INK, font=font(19, True), anchor='rt')
    top = max(46, top + 3)
    draw.text((16, top), tool_name, fill='#176763', font=font(17, True), anchor='lt')
    top += 27
    picture.paste(canvas, (16, top))
    if pointer:
        x, y = pointer[0] + 16, pointer[1] + top
        draw.ellipse((x - 11, y - 11, x + 11, y + 11), outline='#ad4616', width=3)
    top += canvas.height + 10
    face = font(20, True)
    for line in wrap(readout, face, WIDTH - 36):
        draw.text((18, top), line, font=face, fill='#176763', anchor='lt')
        top += 26
    top += 10
    caption = recipe['steps'][step_index]['caption']
    draw.rounded_rectangle((10, top - 3, WIDTH - 10, 693), radius=12, fill='#edf3f1')
    face = font(23)
    for line in wrap(caption, face, WIDTH - 52):
        draw.text((25, top + 9), line, font=face, fill=INK, anchor='lt')
        top += 29
    if top + 8 > 692:
        raise ValueError(f"Text overflows in {recipe['id']} step {step_index + 1}")
    return picture


def check_state(board, step):
    points = board['points']
    for check in step.get('checks', []):
        kind = check['type']
        if kind == 'readout':
            assert all(value in board['readout'] for value in check['includes']), (check, board)
        elif kind == 'point':
            assert math.dist(points[check['id']], check['at']) < .01, (check, board)
        elif kind == 'coincident':
            for a, b in check['pairs']:
                assert math.dist(points[a], points[b]) < .01, (check, board)
        else:
            raise ValueError(f'Unknown guide check {kind}')


def record(browser, unit, recipe, target):
    from PIL import Image, ImageChops
    page = browser.new_page(viewport={'width': 1440, 'height': 1050}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    # Local paths work offline and preserve the normal entry point and event handlers.
    page.goto((ROOT / 'geometry-pogorelov/atlas' / (unit['id'] + '.html')).as_uri())
    page.evaluate("""() => {
        const original = GeoLab.mount;
        GeoLab.mount = function (...args) {
            const lab = original.apply(this, args);
            if (args[0].id === 'geo-board') window.recordingBoard = lab.board;
            return lab;
        };
    }""")
    page.locator('button[data-stage="1"]').click()
    container = page.locator('#geo-board')
    canvas = container.locator('canvas')
    canvas.wait_for()
    # The curriculum uses 640×420 model coordinates. A one-to-one scale makes
    # exact tangency and point coincidence reproducible with pointer controls.
    container.evaluate("(el) => { el.style.width = '642px'; }")
    rect = canvas.bounding_box()
    assert rect['width'] == 640 and rect['height'] == 420, rect
    pointer = None
    frames, durations, stills, readouts = [], [], [], []

    def state():
        return page.evaluate("""() => ({
            points: Object.fromEntries(recordingBoard.points.map(p => [p.id, [p.x, p.y]])),
            readout: document.querySelector('#geo-board .lab-readout').textContent
        })""")

    def snap(index, ms, still=False):
        raw = Image.open(io.BytesIO(canvas.screenshot(animations='disabled'))).convert('RGB')
        value = state()['readout']
        tool = container.locator('.tools button.on').inner_text()
        frame = compose(raw, recipe, index, value, 'Инструмент «' + tool + '»', pointer)
        if still:
            stills.append(frame)
        frames.append(frame)
        durations.append(ms)

    def client(xy):
        box = canvas.bounding_box()
        return box['x'] + xy[0], box['y'] + xy[1]

    def position(pid):
        return state()['points'][pid]

    def exact(pid, dest):
        container.locator('.point-select').select_option(pid)
        for key, value in zip(('.point-x', '.point-y'), dest):
            container.locator(key).fill(str(value))
        container.locator('[data-act="move"]').click()
        canvas.scroll_into_view_if_needed()

    for index, step in enumerate(recipe['steps']):
        for action in step.get('actions', []):
            kind = action['type']
            if kind == 'tool':
                container.locator(f'[data-tool="{action["tool"]}"]').click()
                pointer = None
            elif kind == 'point':
                canvas.scroll_into_view_if_needed()
                pointer = position(action['id'])
                page.mouse.click(*client(pointer))
                snap(index, 350)
            elif kind == 'drag':
                canvas.scroll_into_view_if_needed()
                pid, dest = action['id'], action['to']
                start = position(pid)
                page.mouse.move(*client(start))
                page.mouse.down()
                for n in range(1, 7):
                    pointer = [a + (b - a) * n / 6 for a, b in zip(start, dest)]
                    page.mouse.move(*client(pointer))
                    snap(index, 130)
                page.mouse.up()
                # A constrained point can project onto a circle or a tangent.
                # Apply the exact user-specified target through the same numeric
                # controls when pixel rounding leaves the pointer slightly off.
                if math.dist(position(pid), dest) > .001:
                    exact(pid, dest)
                pointer = position(pid)
            elif kind == 'coords':
                exact(action['id'], action['to'])
                pointer = position(action['id'])
            elif kind == 'goal':
                container.locator('[data-act="goal"]').click()
                pointer = None
            else:
                raise ValueError(f'Unknown guide action {kind}')
            error = container.locator('.lab-feedback.error')
            assert not error.count() or not error.inner_text(), (action, error.inner_text())
        final_state = state()
        check_state(final_state, step)
        readouts.append(final_state['readout'])
        snap(index, max(3200, len(step['caption']) * 60), still=True)
    assert not errors, errors

    name = recipe['id']
    for index, frame in enumerate(stills, 1):
        path = target / f'{name}-{index:02}.png'
        frame.quantize(colors=160).save(path, optimize=True)
    palette_source = Image.new('RGB', (224 * len(stills), 233))
    for i, frame in enumerate(stills):
        palette_source.paste(frame.resize((224, 233)), (224 * i, 0))
    palette = palette_source.quantize(colors=160)
    indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
    path = target / f'{name}.gif'
    indexed[0].save(path, save_all=True, append_images=indexed[1:], duration=durations,
                    loop=0, disposal=1, optimize=True)
    with Image.open(path) as gif:
        assert gif.n_frames >= len(stills) and gif.size == (WIDTH, 700)
        # The encoder merges repeated frames. Compare their pixels at each
        # original timestamp so moving points never leave a stale trail.
        end = gif.info['duration']
        elapsed = 0
        for expected, duration in zip(indexed, durations):
            while elapsed >= end:
                gif.seek(gif.tell() + 1)
                end += gif.info['duration']
            delta = ImageChops.difference(expected.convert('RGB'), gif.convert('RGB'))
            assert delta.getbbox() is None, (name, elapsed)
            elapsed += duration
        assert end == elapsed
    print(f'{name}: {len(stills)} steps, {len(frames)} captures, {path.stat().st_size} bytes', flush=True)
    page.close()
    return readouts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('topics', type=int, nargs='*')
    parser.add_argument('--recipes', type=Path, default=RECIPES)
    parser.add_argument('--output', type=Path, default=ASSETS)
    parser.add_argument('--update-readouts', action='store_true', help='Refresh the text alternative from the actual lesson after an intentional change.')
    parser.add_argument('--index-only', action='store_true', help='Update captions without recapturing images.')
    options = parser.parse_args()
    recipes = json.loads(options.recipes.read_text())
    units = json.loads((ROOT / 'geometry-pogorelov/data/course.json').read_text())['units']
    models = {u['points'][0]: u for u in units if u.get('topicQuestion')}
    topics = {item['topicPoint'] for item in recipes}
    if len(topics) != len(recipes) or len({item['id'] for item in recipes}) != len(recipes):
        raise ValueError('Each guide needs a distinct topic and media name')
    if topics - set(models) or set(options.topics) - topics:
        raise ValueError('Unknown lesson or guide')
    if not options.index_only:
        options.output.mkdir(exist_ok=True, parents=True)
        from playwright.sync_api import sync_playwright
        with TemporaryDirectory(dir=options.output) as temp, sync_playwright() as playwright:
            pending = Path(temp)
            for recipe in recipes:
                point = recipe['topicPoint']
                if options.topics and point not in options.topics:
                    continue
                assert re.fullmatch(r'[a-z0-9-]+', recipe['id'])
                executable = os.environ.get('GEOMETRY_GIFS_BROWSER')
                with playwright.chromium.launch(executable_path=executable) as browser:
                    readouts = record(browser, models[point], recipe, pending)
                if options.update_readouts:
                    recipe['readouts'] = readouts
                elif recipe['readouts'] != readouts:
                    raise ValueError(f'{point}: measurements have changed; verify the recording and refresh text alternatives')
            for file in pending.iterdir():
                file.replace(options.output / file.name)
        if options.update_readouts:
            options.recipes.write_text(json.dumps(recipes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    index = {str(item['topicPoint']): {
        'id': item['id'], 'title': item['title'], 'steps': [s['caption'] for s in item['steps']],
        'readouts': item['readouts']
    } for item in recipes}
    index_path = ROOT / 'geometry-pogorelov/assets/topic-guide-index.js'
    index_path.write_text('window.PogorelovTopicGuideIndex = ' + json.dumps(index, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')


if __name__ == '__main__':
    main()
