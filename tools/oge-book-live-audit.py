"""Availability and exact source identity for resolved OGE book destinations.

This is NOT a functional learner test. HTTPS verification stays enabled. Inputs
contain extracted public URL metadata, never the private book's full content.
"""
import argparse
import concurrent.futures
import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_title = False
        self.title = []
        self.refresh = []
        self.refs = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'meta' and values.get('http-equiv', '').lower() == 'refresh':
            self.refresh.append(values.get('content', ''))
        if tag in ('script', 'img', 'iframe', 'source') and values.get('src'):
            self.refs.append(values['src'])
        if tag == 'link' and values.get('href') and values.get('rel') == 'stylesheet':
            self.refs.append(values['href'])

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--inventory', required=True)
    parser.add_argument('--base', required=True)
    parser.add_argument('--output', default='artifacts/book-audit-live/report.json')
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', args.base):
        raise ValueError('An exact 40-character base commit SHA is required')
    inventory = json.loads(Path(args.inventory).read_text())
    rows = inventory['urls']
    repo = Path(__file__).resolve().parent.parent
    resolved = subprocess.check_output(['git', 'rev-parse', '--verify', args.base + '^{commit}'], cwd=repo, text=True).strip()
    if resolved != args.base:
        raise ValueError('The supplied base must resolve to that exact commit')
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    html_dir = output.parent / 'responses'
    html_dir.mkdir(exist_ok=True)

    def inspect(row):
        url = row['url']
        parts = urllib.parse.urlsplit(url)
        if parts.scheme != 'https' or parts.netloc != 'mathexam.space':
            raise ValueError('Only extracted public MathExam HTTPS URLs are allowed')
        result = {'id': row['id'], 'url': url,
                  'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                  'functional_status': 'not-established-by-http'}
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'MathExamBookAudit/1.0'})
            with urllib.request.urlopen(request, timeout=35) as response:
                data = response.read(12_000_001)
                if len(data) > 12_000_000:
                    raise ValueError('Unexpected response size')
                result.update(http_status=response.status, final_http_url=response.url,
                              content_type=response.headers.get('Content-Type'),
                              last_modified=response.headers.get('Last-Modified'),
                              response_sha256=digest(data), bytes=len(data))
            page = Page()
            if 'text/html' in (result.get('content_type') or ''):
                page.feed(data.decode('utf-8-sig', errors='replace'))
            result.update(title=''.join(page.title).strip(), meta_refresh=page.refresh,
                          declared_assets=page.refs)
            source_path = urllib.parse.unquote(parts.path).lstrip('/')
            if not source_path or source_path.endswith('/'):
                source_path += 'index.html'
            result['source_path'] = source_path
            source = subprocess.run(['git', 'show', f'{args.base}:{source_path}'],
                                    cwd=repo, capture_output=True, check=False)
            if source.returncode:
                result['source_match'] = 'no-source-at-base'
            else:
                result['base_source_sha256'] = digest(source.stdout)
                result['source_match'] = 'exact' if source.stdout == data else 'different'
            suffix = Path(source_path).suffix or '.bin'
            (html_dir / (row['id'] + suffix)).write_bytes(data)
        except urllib.error.HTTPError as error:
            result.update(http_status=error.code, error=f'HTTP {error.code}')
        except (urllib.error.URLError, TimeoutError, ValueError) as error:
            result['error'] = str(error)[:400]
        return result

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(inspect, rows))
    report = {'scope': 'Extracted book URLs only; availability is not functional verification',
              'base_sha': args.base,
              'checked_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'counts': {'urls': len(results),
                         'http_200': sum(r.get('http_status') == 200 for r in results),
                         'exact_base_bytes': sum(r.get('source_match') == 'exact' for r in results),
                         'errors': sum('error' in r for r in results)},
              'results': results}
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report['counts']))
    for result in results:
        if 'error' in result or result.get('source_match') != 'exact':
            print(json.dumps({k: result.get(k) for k in ('id', 'url', 'http_status', 'source_match', 'error')}, ensure_ascii=False))
    if report['counts']['http_200'] != len(results) or report['counts']['exact_base_bytes'] != len(results):
        raise SystemExit('Availability/source identity did not pass for every input URL; inspect the recorded results.')


if __name__ == '__main__':
    main()
