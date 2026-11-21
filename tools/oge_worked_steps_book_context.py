"""Exact source-bound UI delta; exercise text, geometry and math remain sealed."""
import hashlib
import json
from pathlib import Path

from oge_video_models_book_context import without_download_controls, restore_quadrilateral_angles

ROOT = Path(__file__).resolve().parent.parent
PINS = json.loads((ROOT / 'tools/fixtures/oge-worked-steps-book-ui.json').read_text())
OLD_HELP = 'Хочешь подсказку?'
NEW_HELP = 'Разобрать по шагам'
PAN = 'Если рисунок не помещается, прокрути его пальцем или кнопками. Стрелки клавиатуры тоже работают. ← ВлевоВправо → '


def matches_worked_steps_ui(record, text, fixture_texts):
    """Permit only the renamed help button and the absent, non-overflowing pan bar."""
    try:
        pin = PINS['pages'].get(record['id'])
        if not pin or record['prefix'] != '' or record['width'] not in (320, 390, 1280):
            return False
        if record['route'] != pin['route'] or record['finalPath'] != pin['route']:
            return False
        for route, expected in {pin['route']: pin['sha256'], **PINS['assets']}.items():
            loaded = record['resources'][route]
            file = route[1:]
            raw = (ROOT / file).read_bytes()
            if loaded['status'] != 200 or loaded['sha256'] != hashlib.sha256(raw).hexdigest():
                return False
            native = without_download_controls(file, raw) if route == pin['route'] else raw
            native = restore_quadrilateral_angles(file, native)
            if hashlib.sha256(native).hexdigest() != expected:
                return False
        for original in fixture_texts:
            if original.count(OLD_HELP) != 1 or NEW_HELP in original:
                continue
            expected_text = original.replace(OLD_HELP, NEW_HELP, 1)
            # Only the two seeded figures that fit on desktop lose this exact bar.
            if record['width'] == 1280 and record['id'] in ('59', '60'):
                if expected_text.count(PAN) != 1:
                    continue
                expected_text = expected_text.replace(PAN, '', 1)
            if text == expected_text:
                return True
        return False
    except (KeyError, TypeError, ValueError, OSError):
        return False
