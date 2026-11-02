#!/usr/bin/env python3
"""Wait for exact published catalogue resources; no deployment or data writes."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
ORIGIN = 'https://mathexam.space'
RESOURCES = {
    '/': 'index.html',
    '/oge/': 'oge/index.html',
    '/oge/variants/2027/': 'oge/variants/2027/index.html',
    '/oge/variants/2027/manifest.json': 'oge/variants/2027/manifest.json',
    '/sitemap.xml': 'sitemap.xml',
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--wait-seconds', type=int, default=480)
    parser.add_argument('--output', type=Path,
                        default=Path('artifacts/oge-pdf-catalogue-live/availability.json'))
    args = parser.parse_args()
    if not 0 <= args.wait_seconds <= 600:
        parser.error('--wait-seconds must be between 0 and 600')
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    expected = {url: hashlib.sha256((ROOT / path).read_bytes()).hexdigest()
                for url, path in RESOURCES.items()}
    report = {'status': 'WAITING', 'source_commit': commit, 'origin': ORIGIN,
              'resources': [], 'errors': [], 'attempts': 0}
    deadline = time.monotonic() + args.wait_seconds
    try:
        while True:
            report['attempts'] += 1
            report['resources'], report['errors'] = [], []
            for relative, wanted in expected.items():
                url = ORIGIN + relative
                try:
                    request = urllib.request.Request(url, headers={
                        'User-Agent': 'MathExam-OGE104-Release-Check/1.0',
                        'Cache-Control': 'no-cache',
                    })
                    with urllib.request.urlopen(request, timeout=15) as response:
                        if response.status != 200 or response.geturl() != url:
                            raise ValueError('Unexpected HTTP status or redirect')
                        actual = hashlib.sha256(response.read()).hexdigest()
                    if actual != wanted:
                        raise ValueError('Published bytes do not match release candidate')
                    report['resources'].append({'url': url, 'sha256': actual})
                except (OSError, ValueError) as error:
                    report['errors'].append({'url': url, 'error': str(error)})
            if not report['errors']:
                report['status'] = 'PASS'
                report['gate'] = 'OGE_104_PUBLISHED_BYTES_OK'
                print(json.dumps(report, ensure_ascii=False))
                return
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                report['status'] = 'FAIL'
                raise RuntimeError(json.dumps(report['errors'], ensure_ascii=False))
            print(json.dumps({'status': 'WAITING', 'attempt': report['attempts'],
                              'errors': report['errors']}, ensure_ascii=False), flush=True)
            time.sleep(min(10, remaining))
    finally:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
