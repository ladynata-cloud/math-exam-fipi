"""Invert only a reviewed, route-bound standalone help block, never other bytes."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / 'tools/habr-gifs-integration.json'
EXTERNAL_BLOCK = ('<!-- habr-entry-help:start -->\n'
                  '<link rel="stylesheet" href="/assets/habr-entry-gifs.css">\n'
                  '<script defer src="/assets/habr-entry-gifs.js"></script>\n'
                  '<!-- habr-entry-help:end -->\n')


def inline_block():
    css = (ROOT / 'assets/habr-entry-gifs.css').read_text()
    script = (ROOT / 'assets/habr-entry-gifs.js').read_text()
    if '</script' in script.lower() or '</style' in css.lower():
        raise ValueError('Unsafe inline help boundary')
    return ('<!-- habr-entry-help:start -->\n<style>\n' + css + '</style>\n<script>\n' + script + '</script>\n<!-- habr-entry-help:end -->\n')


def restore_habr_help(name, raw):
    manifest = json.loads(MANIFEST_PATH.read_text())
    row = manifest['pages'].get(str(name))
    if row is None or hashlib.sha256(raw).hexdigest() != row['afterSha256']:
        return raw
    block = row['block'].encode()
    if raw.count(block) != 1:
        raise ValueError('Exact standalone help block missing or duplicated: ' + str(name))
    restored = raw.replace(block, b'', 1)
    if hashlib.sha256(restored).hexdigest() != row['beforeSha256']:
        raise ValueError('Original full document not recovered: ' + str(name))
    return restored
