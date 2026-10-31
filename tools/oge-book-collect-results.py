"""Join actual book inventory and separately scoped learner evidence.

Missing actions, stale bytes and source-derived answer keys never become PASS.
The workbook builder consumes this JSON; raw browser reports remain evidence.
"""
import argparse
import datetime
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path, PurePosixPath
import re
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parent.parent
WIDTHS = {320, 390, 1280}
ACTIONS = ['start', 'wrong-answer', 'correct-answer', 'hints', 'next-example',
           'finish', 'saved-result', 'layout', 'topic']
NA = {'NA', 'NOT_APPLICABLE'}
GOOD = {'PASS', *NA}
SHA = re.compile(r'[0-9a-f]{64}')
FINITE_EXAM_NUMBERS = {7, 8, 9, 10, 11, 12, 14, 16, 17, 18, 23, 24, 25}
ALWAYS_APPLICABLE = {'start', 'layout', 'topic', 'runtime', 'identity', 'provenance'}
# The six navigation targets in this exact book inventory. An exercise with
# omitted/NA actions must never acquire navigation status by inference.
NAVIGATION = {
    '/': ('01', 'basics'),
    '/trainers/oge-1-5-trainers/practice-1-5-map.html': ('07', 'exam'),
    '/trainers/oge-basics/': ('14', 'basics'),
    '/trainers/oge-basics/multiplication-division/': ('19', 'basics'),
    '/trainers/oge-basics/percentages/': ('42', 'basics'),
    '/trainers/oge-course/': ('52', 'basics'),
}
NAVIGATION_NA = {'wrong-answer', 'correct-answer', 'hints', 'next-example', 'finish', 'saved-result'}
EXERCISE_NA = {
    '/oge/geometry/task-15-external-angle.html': {'next-example', 'saved-result'},
    '/trainers/oge-1-5-trainers/practice-1-5-entry-diagnostic-2026.html': {'hints'},
}
PUBLIC_ORIGIN = 'https://mathexam.space'
# Reviewed exception for the owner's 31 October continuation. This is an exact
# caption delta, not a general allowlist supplied by a report or a caller.
APPROVED_DOCUMENT_CORRECTIONS = [{
    'paragraph': 168, 'pdf_page': 13,
    'before': 'Входная диагностика ОГЭ-2026.',
    'after': 'Входная диагностика ОГЭ-2027.',
}]
DOCUMENT_NEGATIVE_CASES = {
    'swapped_docx_qr_images', 'wrong_displayed_url_unchanged_hyperlink',
    'swapped_same_page_pdf_qr', 'moved_pdf_qr_page',
    'extra_non_url_edit', 'diagnostic_edit_without_opt_in',
    'missing_diagnostic_edit', 'duplicated_diagnostic_edit',
    'moved_diagnostic_edit', 'wrong_diagnostic_year',
    'stale_pdf_diagnostic_caption', 'moved_pdf_diagnostic_caption',
}


def document_text_evidence_valid(document):
    corrections = document.get('approved_editorial_corrections', [])
    if corrections == []:
        return document.get('all_non_url_text_unchanged') is True
    return (corrections == APPROVED_DOCUMENT_CORRECTIONS
            and document.get('all_non_url_text_unchanged') is False
            and document.get('all_non_url_text_unchanged_except_approved_corrections') is True)


def document_negative_cases_valid(cases):
    return (isinstance(cases, dict) and set(cases) == DOCUMENT_NEGATIVE_CASES
            and all(value == 'rejected' for value in cases.values()))


class DeclaredAssets(HTMLParser):
    """Only executable script tags and browser stylesheet/module declarations."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs, self.inline, self.refreshes = [], [], []
        self.base, self.capture = None, None

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'base' and self.base is None:
            self.base = attrs.get('href')
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'refresh':
            self.refreshes.append(attrs.get('content', ''))
        if tag == 'script':
            kind = attrs.get('type', '').lower().split(';')[0]
            executable = kind in {'', 'module', 'text/javascript', 'application/javascript', 'application/ecmascript', 'text/ecmascript'}
            if executable and 'nomodule' not in attrs:
                if attrs.get('src'):
                    self.refs.append(('script', attrs['src']))
                else:
                    self.capture = ['script', []]
        if tag == 'style':
            self.capture = ['style', []]
        if tag == 'link':
            rel = set(attrs.get('rel', '').lower().split())
            if attrs.get('href') and ('stylesheet' in rel or 'modulepreload' in rel or ('preload' in rel and attrs.get('as') in {'script', 'style'})):
                self.refs.append(('style' if 'stylesheet' in rel or attrs.get('as') == 'style' else 'script', attrs['href']))

    def handle_data(self, text):
        if self.capture:
            self.capture[1].append(text)

    def handle_endtag(self, tag):
        if self.capture and tag == self.capture[0]:
            self.inline.append((self.capture[0], ''.join(self.capture[1])))
            self.capture = None


def static_imports(source, kind):
    """Required static imports; conditional import()/computed URLs are excluded.

    Those dynamic requests still require the runner's observed-response hashes.
    This closure does not claim to enumerate unexecuted JavaScript branches.
    """
    source = re.sub(r'/\*[\s\S]*?\*/', '', source)
    if kind == 'style':
        return [('style', match.group(1) or match.group(2) or match.group(3)) for match in
                re.finditer(r'''@import\s+(?:url\(\s*(?:["']([^"']+)["']|([^\s)]+))\s*\)|["']([^"']+)["'])''', source, re.I)]
    # Static ESM imports are statements. Do not interpret a string containing
    # "import" or a dynamic import() call as an unconditional network request.
    source = re.sub(r'(?m)^\s*//[^\n]*', '', source)
    pattern = r'''(?:^|[;\n])\s*(?:import\s+(?:[^;"']*?\bfrom\s*)?|export\s+[^;"']*?\bfrom\s*)["']([^"']+)["']'''
    return [('script', match.group(1)) for match in re.finditer(pattern, source)]


def declared_dependencies(root, observed, report, entry, frozen):
    """Require hashes for the recursively declared local script/style closure."""
    problems, exclusions, checked, visited = [], [], [], set()
    prefix = entry[:-len(report['route'])] if report['route'] != '/' else entry.rstrip('/')
    alias_route = '/trainers/oge-task13-inequalities.html'
    target_route = '/trainers/oge13-inequalities-series.html'

    def enqueue(kind, reference, parent, queue, redirect_shell=False):
        absolute = urljoin(parent if urlsplit(parent).scheme else PUBLIC_ORIGIN + parent, reference)
        parsed = urlsplit(absolute)
        if parsed.scheme in {'data', 'blob'}:
            return  # Embedded bytes are already bound by the parent resource.
        if parsed.netloc != urlsplit(PUBLIC_ORIGIN).netloc or parsed.scheme not in {'http', 'https'}:
            if not frozen and kind == 'style' and parsed.scheme == 'https' and parsed.netloc == 'fonts.googleapis.com' and parsed.path in {'/css', '/css2'}:
                exclusions.append({'parent': parent, 'resource': absolute, 'status': 'NA',
                                   'reason': 'External source-only font stylesheet is outside the recorded local payload identity; frozen editions remove this optional font request.'})
            else:
                problems.append(absolute + ': declared external dependency has no local observed-byte contract')
            return
        try:
            relative = path_for_url(absolute)
        except ValueError:
            problems.append(absolute + ': invalid declared dependency path')
            return
        if relative not in observed:
            if redirect_shell and kind == 'style':
                exclusions.append({'parent': parent, 'resource': parsed.path, 'status': 'NA',
                                   'reason': 'Unloaded stylesheet of the known zero-delay redirect shell; the actual destination and its dependencies are separately required and hashed.'})
            else:
                problems.append(parsed.path + ': declared ' + kind + ' dependency was not hashed (from ' + parent + ')')
            return
        checked.append(parsed.path)
        queue.append((parsed.path, kind))

    queue = [('/' + relative, 'html' if relative.endswith('.html') else 'style' if relative.endswith('.css') else 'script')
             for relative in observed if relative.endswith(('.html', '.css', '.js', '.mjs'))]
    while queue:
        resource, kind = queue.pop()
        key = (resource, kind)
        if key in visited:
            continue
        visited.add(key)
        local = root / path_for_url(resource)
        if not local.is_file():
            continue  # resource_identity reports the missing file separately.
        source = local.read_text(encoding='utf-8-sig')
        if kind == 'html':
            document = DeclaredAssets()
            document.feed(source)
            parent = urljoin(PUBLIC_ORIGIN + resource, document.base) if document.base else resource
            known_alias = (resource == prefix + alias_route and report.get('finalPath') == prefix + target_route
                           and any(re.fullmatch(r'\s*0\s*;\s*url\s*=\s*["\']?' + re.escape(target_route) + r'["\']?\s*', value, re.I)
                                   or re.fullmatch(r'\s*0\s*;\s*url\s*=\s*["\']?' + re.escape(prefix + target_route) + r'["\']?\s*', value, re.I)
                                   for value in document.refreshes))
            for dependency_kind, reference in document.refs:
                enqueue(dependency_kind, reference, parent, queue, known_alias)
            for inline_kind, inline_source in document.inline:
                for dependency_kind, reference in static_imports(inline_source, inline_kind):
                    enqueue(dependency_kind, reference, parent, queue)
        else:
            for dependency_kind, reference in static_imports(source, kind):
                enqueue(dependency_kind, reference, resource, queue)
    return {'status': 'FAIL' if problems else 'PASS', 'problems': sorted(set(problems)),
            'requiredObservedDependencies': sorted(set(checked)),
            'exclusions': list({json.dumps(item, sort_keys=True): item for item in exclusions}.values()),
            'scope': 'Declared local script/stylesheet tags, CSS @imports and static ESM imports, plus every separately recorded runtime resource. Dynamic or unexecuted JavaScript branches are not inferred.'}


def read(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def outcome(actions):
    values = [x.get('status') for x in actions]
    if 'FAIL' in values:
        return 'FAIL'
    if not values or any(x not in GOOD for x in values):
        return 'NOT_RUN'
    if all(x in NA for x in values):
        return 'NA'
    return 'PASS' if all(x == 'PASS' or x in NA for x in values) else 'NOT_RUN'


def safe_reason(action):
    return action.get('reason') or action.get('scope') or action.get('mode') or ''


def normalized_oracle(oracle):
    return json.dumps({'prompt': oracle.get('prompt'), 'expected': oracle.get('expected')},
                      ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def path_for_url(value):
    path = unquote(urlsplit(value).path)
    if not path.startswith('/') or '..' in PurePosixPath(path).parts or '\\' in path:
        raise ValueError('Invalid resource path')
    return path.lstrip('/') + ('index.html' if path.endswith('/') else '')


def resource_identity(root, report, entry, frozen=False):
    """Both runner schemas bind every observed resource, including redirects."""
    hashes, problems = {}, []
    for resource, expected in report.get('resourceHashes', {}).items():
        hashes[resource] = expected
    for resource, value in report.get('resources', {}).items():
        if not isinstance(value, dict) or value.get('status') != 200:
            problems.append(resource + ': response was not a recorded HTTP 200')
            continue
        expected = value.get('sha256')
        if resource in hashes and hashes[resource] != expected:
            problems.append(resource + ': conflicting resource schemas')
        hashes[resource] = expected
    if not hashes:
        return 'NOT_RUN', ['No complete observed-resource hashes'], {}, {'status': 'NOT_RUN', 'exclusions': []}
    normalized = {}
    for resource, expected in hashes.items():
        try:
            relative = path_for_url(resource)
        except ValueError:
            problems.append(resource + ': invalid resource path')
            continue
        if not isinstance(expected, str) or not SHA.fullmatch(expected):
            problems.append(resource + ': missing or invalid SHA-256')
            continue
        if relative in normalized and normalized[relative] != expected:
            problems.append(resource + ': resource changed during the scenario')
        normalized[relative] = expected
        local = root / relative
        if not local.is_file() or sha(local) != expected:
            problems.append(resource + ': missing or stale local bytes')
    required = [entry]
    if report.get('finalPath'):
        required.append(report['finalPath'])
    required.extend(a['destination'] for a in report.get('actions', [])
                    if a.get('action') == 'navigation' and a.get('destination'))
    for resource in required:
        try:
            if path_for_url(resource) not in normalized:
                problems.append(resource + ': entry/redirect/navigation destination was not hashed')
        except ValueError:
            problems.append(resource + ': invalid required destination')
    if report.get('sha256') and normalized.get(path_for_url(entry)) != report['sha256']:
        problems.append(entry + ': initial HTML identity disagrees with observed bytes')
    if report.get('finalPath') and report.get('finalHtmlSha256') != normalized.get(path_for_url(report['finalPath'])):
        problems.append(report['finalPath'] + ': final HTML identity is missing or inconsistent')
    if report.get('resourceHashErrors'):
        problems.append('Runner recorded unreadable or changing resource responses')
    closure = declared_dependencies(root, normalized, report, entry, frozen)
    problems.extend(closure['problems'])
    return ('FAIL' if problems else 'PASS'), problems, hashes, closure


def finite_check(report, family):
    """Require the separate desktop assessment promised by this task's suite."""
    match = re.search(r'/oge-task(\d+)-', report['route'])
    if family != 'exam' or report['width'] != 1280 or not match or int(match[1]) not in FINITE_EXAM_NUMBERS:
        return 'NA', 'Separate desktop assessment is not required for this case.'
    actions = report.get('actions', [])
    starts = [i for i, a in enumerate(actions) if a.get('action') == 'assessment-start']
    finishes = [i for i, a in enumerate(actions) if a.get('action') == 'assessment-finish']
    if not starts or not finishes or max(starts) >= max(finishes):
        return 'NOT_RUN', 'Required 1280 px finite assessment has no ordered start/finish.'
    finish = max(finishes)
    saves = [a for i, a in enumerate(actions) if i > finish and a.get('action') in {'saved-result', 'assessment-saved-result'}]
    complete = [a for a in actions if a.get('action') == 'session-completion' and a.get('mode') == 'finite assessment']
    states = [outcome([actions[i] for i in starts]), outcome([actions[i] for i in finishes]), outcome(saves), outcome(complete)]
    if 'FAIL' in states:
        return 'FAIL', 'A required finite assessment or saved result failed.'
    if states != ['PASS'] * 4:
        return 'NOT_RUN', 'Finite assessment completion and a subsequent saved result must all be explicit PASS.'
    return 'PASS', 'Required desktop assessment reached its result and restored a saved outcome.'


def collect_case(root, report, data, family, version, directory, index, mapped, book_prefix):
    actions = report.get('actions', [])
    status = {name: outcome([a for a in actions if a.get('action') == name]) for name in ACTIONS}
    status['runtime'] = outcome([a for a in actions if a.get('action') in {'runtime', 'runtime-errors'}])
    problems = []
    prefix = '' if version == 'source' else book_prefix
    entry = prefix + urlsplit(mapped['sourceUrl']).path
    actual_prefix = report.get('prefix', data.get('prefix'))
    if report['route'] != urlsplit(mapped['sourceUrl']).path or actual_prefix != prefix:
        problems.append('Recorded route/prefix does not match the mapped book target.')
    if family == 'basics' and report.get('testedPath') != entry:
        problems.append('Basics testedPath does not match the mapped target.')
    navigation = NAVIGATION.get(report['route']) == (report['id'], family)
    if report.get('family') == 'navigation' and not navigation:
        problems.append('Navigation family is not one of the six declared book navigation targets.')
    if navigation and family == 'basics' and report.get('family') != 'navigation':
        problems.append('Declared basics navigation target lacks its navigation family contract.')
    allowed_na = NAVIGATION_NA if navigation else EXERCISE_NA.get(report['route'], set())
    for name in ACTIONS:
        if status[name] == 'NA' and name not in allowed_na:
            problems.append(name + ': NA is not applicable to this exact book target.')
    if navigation:
        for name in NAVIGATION_NA - {'next-example'}:
            if status[name] != 'NA':
                problems.append(name + ': navigation has no exercise contract; an explicit NA is required.')
    if version == 'frozen':
        declared = [a for a in actions if a.get('action') == 'immutable-dependencies']
        escapes = report.get('networkEscapes', report.get('dependencyEscapes'))
        status['dependencies'] = outcome(declared)
        if not isinstance(escapes, list):
            status['dependencies'] = 'NOT_RUN'
        elif escapes:
            status['dependencies'] = 'FAIL'
    else:
        status['dependencies'] = 'NA'
    status['identity'], stale, hashes, closure = resource_identity(root, report, entry, version == 'frozen')
    individual = directory / (('book-' if family == 'basics' else '') + report['id'] + '-' + str(report['width']) + '.json')
    individual_sha = None
    if not individual.is_file():
        problems.append('Individual case evidence is missing.')
    else:
        individual_sha = sha(individual)
        if read(individual) != report:
            problems.append('Aggregate row differs from its individual case evidence.')
    # The legacy basics schema records a single runner hash for its complete
    # aggregate. Exam reruns can mix runner versions, so use each row's hash.
    runner_sha = report.get('testScriptSha256') or (data.get('testScriptSha256') if family == 'basics' else None)
    seed = report.get('randomSeed', report.get('seed'))
    if not isinstance(runner_sha, str) or not SHA.fullmatch(runner_sha):
        problems.append('Recorded test script SHA-256 is missing or invalid.')
    if not isinstance(seed, int) or isinstance(seed, bool) or seed < 0:
        problems.append('Recorded random fixture seed is missing or invalid.')
    status['provenance'] = 'FAIL' if problems else 'PASS'
    status['finite-assessment'], finite_reason = finite_check(report, family)
    failures = [a for a in actions if a.get('status') not in GOOD]
    for a in actions:
        if a.get('action') in ALWAYS_APPLICABLE | {'runtime-errors', 'resource-identity'} and a.get('status') != 'PASS':
            failures.append({'action': a.get('action'), 'status': 'NOT_RUN', 'reason': 'This check is always applicable and requires an explicit PASS.'})
        if a.get('status') in NA and not safe_reason(a):
            failures.append({'action': a.get('action'), 'status': 'NOT_RUN', 'reason': 'NA has no applicability explanation.'})
    if report.get('errors') or report.get('network') or report.get('error'):
        failures.append({'action': 'runner-errors', 'status': 'FAIL', 'reason': 'Runner recorded an error or failed response.'})
    expected_status = 'PASS' if family == 'basics' else 'PASS_SELECTED_CASE'
    if report.get('status') != expected_status:
        failures.append({'action': 'recorded-case-status', 'status': 'NOT_RUN', 'reason': str(report.get('status'))})
    finite = [a for a in actions if a.get('action') in {'session-completion', 'assessment-start', 'assessment-finish', 'assessment-saved-result'}]
    applicable_pass = all(status[name] == 'PASS' for name in ALWAYS_APPLICABLE)
    case = {'id': report['id'], 'version': version, 'prefix': prefix, 'family': family,
            'width': report['width'], 'route': report['route'],
            'status': 'PASS' if not failures and applicable_pass and all(v in {'PASS', 'NA'} for v in status.values()) else 'INCOMPLETE',
            'actions': status, 'finite': finite, 'finiteReason': finite_reason,
            'notes': '; '.join(safe_reason(a) for a in actions if a.get('status') in NA and safe_reason(a)),
            'failures': failures, 'staleResources': stale, 'provenanceProblems': problems,
            'resourceHashes': hashes, 'declaredDependencies': closure, 'oracles': report.get('oracles', []),
            'evidenceId': f'{family}-{version}', 'pointer': f'/reports/{index}',
            'individualEvidencePath': individual.relative_to(root).as_posix(),
            'individualReportSha256': individual_sha,
            'checkedAt': report.get('checkedAt', data.get('generatedAt')),
            'seed': seed, 'testedSha256': report.get('sha256'), 'testScriptSha256': runner_sha,
            'testScriptProvenance': 'individual' if report.get('testScriptSha256') else 'single-run basics aggregate',
            'title': report.get('title') or next((a.get('title') for a in actions if a.get('action') == 'topic'), ''),
            'navigation': navigation}
    if family == 'basics' and not case['navigation']:
        case['oracles'] = [{'prompt': a['prompt'], 'expected': a['expected'],
                            'method': 'independent visible calculation in the reviewed basics runner'}
                           for a in actions if a.get('action') in {'correct-answer', 'quiz-answer', 'division-step', 'guided-step'}
                           and 'prompt' in a and 'expected' in a]
    return case


def math_binding(record):
    return (record.get('id'), record.get('width'), record.get('prefix'),
            record.get('evidence', {}).get('reportSha256'), normalized_oracle(record))


def mathematical_status(cases, records, navigation):
    if navigation:
        return 'NA', []
    if not cases:
        return 'PENDING', ['No learner case evidence.']
    index = {}
    for record in records:
        index.setdefault(math_binding(record), []).append(record.get('verdict'))
    pending, failed = [], []
    for case in cases:
        if not case['oracles']:
            pending.append('no mathematical oracle')
        for oracle in case['oracles']:
            key = (case['id'], case['width'], case['prefix'], case['individualReportSha256'], normalized_oracle(oracle))
            verdicts = index.get(key, [])
            if 'FAIL' in verdicts:
                failed.append('Exact independent review reported FAIL')
                continue
            if verdicts and any(value != 'PASS' for value in verdicts):
                pending.append('Exact independent review is partial/pending')
                continue
            if 'PASS' in verdicts:
                continue
            method = oracle.get('method', '')
            independent = method.startswith('independent') and 'pending' not in method.lower() and 'source-derived' not in method.lower()
            if not independent:
                pending.append(method or 'unlabelled oracle')
    if failed:
        return 'FAIL', sorted(set(failed + pending))
    return ('PENDING' if pending else 'PASS'), sorted(set(pending))


def evidence_file(root, path):
    try:
        label = path.relative_to(root).as_posix()
    except ValueError:
        label = path.name
    return {'path': label, 'sha256': sha(path) if path.is_file() else None,
            'status': 'NOT_RUN'}


def live_verification(root, path, expected_urls, base):
    result = evidence_file(root, path)
    if not path.is_file() or expected_urls is None:
        return result
    data = read(path)
    rows = data.get('results', [])
    urls = [row.get('url') for row in rows]
    result.update(count=len(rows), http200=sum(row.get('http_status') == 200 for row in rows),
                  exactBaseBytes=sum(row.get('source_match') == 'exact' for row in rows),
                  base=data.get('base_sha'), checkedAt=data.get('checked_at_utc'))
    valid = (set(urls) == expected_urls and len(urls) == len(expected_urls)
             and data.get('base_sha') == base
             and all(row.get('http_status') == 200 and row.get('source_match') == 'exact'
                     and not row.get('error') and SHA.fullmatch(row.get('response_sha256', ''))
                     and row.get('response_sha256') == row.get('base_source_sha256') for row in rows))
    result['status'] = 'PASS' if valid else 'FAIL'
    return result


def collect_verification(root, mapping, inventory, manifest):
    """Only this task's concrete HTTP, document and visual evidence contracts."""
    work = root.parent / 'book-audit-work'
    output = root.parent / 'outputs/oge-book-20261031'
    stem = 'Kurs_molodogo_OGEshnika_MathExam_book_v1_candidate'
    docx, pdf = output / (stem + '.docx'), output / (stem + '.pdf')
    live = live_verification(root, root / 'artifacts/book-audit-live/report.json',
                             {row['sourceUrl'] for row in mapping}, manifest['sourceBase'])
    dependency_inventory = work / 'dependency-inventory.json'
    expected_dependencies = {row['url'] for row in read(dependency_inventory)['urls']} if dependency_inventory.is_file() else None
    dependencies = live_verification(root, root / 'artifacts/book-audit-live/dependencies.json', expected_dependencies, manifest['sourceBase'])
    dependencies['inventory'] = evidence_file(root, dependency_inventory)
    if expected_dependencies is not None:
        closure_paths = {row['path'] for row in manifest['sourceFiles']} | set(manifest['removedOptionalIntegrations'])
        closure_urls = {manifest['publicOrigin'].rstrip('/') + '/' + path for path in closure_paths}
        inventory_matches = len(expected_dependencies) == 158 and expected_dependencies == closure_urls
        dependencies['inventory']['status'] = 'PASS' if inventory_matches else 'FAIL'
        if not inventory_matches:
            dependencies['status'] = 'FAIL'
    document_path = root / 'docs/reports/oge-book-20261031/document-check.json'
    documents = evidence_file(root, document_path)
    document = read(document_path) if document_path.is_file() else {}
    if document:
        documents.update(pages=document.get('pages'), uniqueUrls=document.get('unique_urls'),
                         docxQr=document.get('docx_placed_qr'), pdfQr=document.get('pdf_placed_qr'),
                         docxSha256=document.get('docx_sha256'), pdfSha256=document.get('pdf_sha256'))
    source_docx_sha = next(row['sha256'] for row in inventory['sources'] if row['name'].endswith('.docx'))
    if document and docx.is_file() and pdf.is_file():
        checks = (document.get('status') == 'passed', document.get('pages') == 72,
                  document.get('unique_urls') == 71, document.get('docx_placed_qr') == 34,
                  document.get('pdf_placed_qr') == 34,
                  document.get('docx_sha256') == sha(docx), document.get('pdf_sha256') == sha(pdf),
                  document.get('source_docx_sha256') == source_docx_sha,
                  document.get('mapping_sha256') == sha(root / 'scripts/oge-book-edition/urls.json'),
                  document.get('all_qr_source_placements_match') is True,
                  document.get('all_docx_link_source_placements_match') is True,
                  document.get('visible_url_occurrences_checked') == 37,
                  document_text_evidence_valid(document),
                  document.get('all_non_qr_images_unchanged') is True)
        documents['status'] = 'PASS' if all(checks) else 'FAIL'
    regression_path = work / 'document-check-regressions.json'
    regressions = evidence_file(root, regression_path)
    if regression_path.is_file():
        data = read(regression_path)
        cases = data.get('negative_cases', {})
        regressions.update(cases=len(cases), rejected=sum(value == 'rejected' for value in cases.values()))
        valid = (documents['status'] == 'PASS' and data.get('status') == 'passed'
                 and data.get('positive_report_sha256') == documents['sha256']
                 and data.get('candidate_docx_sha256') == document.get('docx_sha256')
                 and data.get('candidate_pdf_sha256') == document.get('pdf_sha256')
                 and data.get('checker_sha256') == sha(root / 'tools/oge-book-document-check.py')
                 and data.get('test_script_sha256') == sha(root / 'tools/oge-book-document-check.test.py')
                 and data.get('stale_success_report_removed') is True
                 and document_negative_cases_valid(cases))
        regressions['status'] = 'PASS' if valid else 'FAIL'
    visual = {'status': 'NOT_RUN', 'pages': 0, 'evidence': [], 'problems': []}
    pages = []
    for name in ('visual-review-01-24.json', 'visual-review-25-48.json', 'visual-review-49-72.json'):
        path = work / name
        item = evidence_file(root, path)
        visual['evidence'].append(item)
        if not path.is_file():
            continue
        data = read(path)
        binding = data.get('candidate_pdf_sha256', data.get('sourcePdfSha256'))
        if documents['status'] != 'PASS' or binding != document.get('pdf_sha256'):
            visual['problems'].append(name + ': candidate PDF binding is missing or stale')
        for row in data.get('pages', []):
            number = row.get('page')
            image = work / 'render-book-v1' / f'page-{number}.png'
            if row.get('status', row.get('layoutStatus', '')).upper() not in {'PASS', 'PASSED'} or row.get('finding') or row.get('findings'):
                visual['problems'].append(f'{name}: page {number} has no passing visual review')
            if not image.is_file() or sha(image) != row.get('sha256'):
                visual['problems'].append(f'{name}: page {number} image is missing or stale')
            pages.append(number)
        item['status'] = 'PASS' if not visual['problems'] else 'FAIL'
    visual['pages'] = len(pages)
    if pages:
        visual['status'] = 'FAIL' if visual['problems'] else ('PASS' if sorted(pages) == list(range(1, 73)) else 'NOT_RUN')
    return {'livePages': live, 'liveDependencies': dependencies, 'documents': documents,
            'documentRegressions': regressions, 'visualLayout': visual}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    parser.add_argument('--math-review', type=Path)
    args = parser.parse_args()
    target = Path(args.output)
    protected = [ROOT / 'docs/reports/oge-book-20261031/source-inventory.json',
                 ROOT / 'scripts/oge-book-edition/urls.json',
                 ROOT / 'book/oge/2026-10-31/v1/manifest.json']
    if args.math_review:
        protected.append(args.math_review)
    if target.resolve() in {path.resolve() for path in protected}:
        raise ValueError('Collector output must not overwrite an input')
    target.unlink(missing_ok=True)
    inventory_path = ROOT / 'docs/reports/oge-book-20261031/source-inventory.json'
    inventory = read(inventory_path)
    mapping = read(ROOT / 'scripts/oge-book-edition/urls.json')
    mapped_by_id = {row['id']: row for row in mapping}
    manifest_path = ROOT / 'book/oge/2026-10-31/v1/manifest.json'
    manifest = read(manifest_path)
    manifest_sha = sha(manifest_path)
    live_path = ROOT / 'artifacts/book-audit-live/report.json'
    live = {x['url']: x for x in read(live_path)['results']} if live_path.is_file() else {}
    inventory_by_url = {x['url']: x for x in inventory['urls']}
    assert len(mapping) == len(inventory_by_url) == 71
    assert {r['sourceUrl'] for r in mapping} == set(inventory_by_url)

    evidence, all_cases = [], []
    for family, filename in [('basics', 'report.json'), ('exam', 'results.json')]:
        for version in ['source', 'frozen']:
            path = ROOT / f'artifacts/book-audit-{family}/{version}/{filename}'
            if not path.is_file():
                evidence.append({'path': path.relative_to(ROOT).as_posix(), 'status': 'NOT_RUN'})
                continue
            data = read(path)
            evidence_id = f'{family}-{version}'
            evidence.append({'id': evidence_id, 'path': path.relative_to(ROOT).as_posix(),
                             'sha256': sha(path), 'cases': len(data['reports']),
                             'generatedAt': data.get('generatedAt'),
                             'testScriptSha256': data.get('testScriptSha256')})
            for index, report in enumerate(data['reports']):
                all_cases.append(collect_case(ROOT, report, data, family, version,
                                              path.parent, index, mapped_by_id[report['id']],
                                              '/' + manifest['prefix'].strip('/')))

    math_records = []
    if args.math_review and args.math_review.is_file():
        math_data = read(args.math_review)
        math_records = math_data.get('records', [])
        evidence.append({'id': 'independent-math', 'path': args.math_review.name,
                         'sha256': sha(args.math_review), 'records': len(math_records)})
    math_pointers = {}
    for index, record in enumerate(math_records):
        math_pointers.setdefault(math_binding(record), []).append(f'/records/{index}')
    for case in all_cases:
        case['mathReviewPointers'] = sorted({pointer for oracle in case['oracles']
            for pointer in math_pointers.get((case['id'], case['width'], case['prefix'],
                                               case['individualReportSha256'], normalized_oracle(oracle)), [])})
    pages = []
    for mapped in mapping:
        id = mapped['id']
        inv = inventory_by_url[mapped['sourceUrl']]
        cases = [c for c in all_cases if c['id'] == id]
        versions = {}
        pending = []
        for version in ['source', 'frozen']:
            chosen = [c for c in cases if c['version'] == version]
            found = {c['width'] for c in chosen}
            versions[version] = 'PASS' if found == WIDTHS and len(chosen) == len(WIDTHS) and all(c['status'] == 'PASS' for c in chosen) else 'INCOMPLETE'
            if versions[version] != 'PASS':
                pending.append(version + ': missing/failed/stale learner evidence')
        navigation = bool(cases) and all(c['navigation'] for c in cases)
        mathematical, oracle_pending = mathematical_status(cases, math_records, navigation)
        if oracle_pending:
            pending.append('Independent mathematics: ' + ', '.join(sorted(set(oracle_pending))))
        action_states = {name: outcome([{'status': c['actions'][name]} for c in cases]) for name in ACTIONS}
        complete = versions['source'] == versions['frozen'] == 'PASS' and mathematical in {'PASS', 'NA'}
        full = ('NAVIGATION_CHECKED' if navigation else 'RECORDED_SCENARIO_COMPLETE') if complete else 'REQUIRES_TESTING'
        current = live.get(mapped['sourceUrl'], {})
        pages.append({**mapped, 'title': next((c['title'] for c in cases if c['title']), current.get('title', '')),
                      'kind': 'navigation' if navigation else 'trainer',
                      'bookTopic': inv.get('topic', ''), 'pdfPages': inv['pdf_pages'],
                      'qrCount': inv['pdf_qr_count'], 'pdfLinkCount': inv['pdf_link_count'],
                      'docxLinkCount': inv['docx_link_count'],
                      'oldRegistryRows': inv['prior_registry_rows'],
                      'oldFullCheck': 'Не выполнена',
                      'liveHttp': current.get('http_status'), 'liveSourceMatch': current.get('source_match'),
                      'sourceStatus': versions['source'], 'frozenStatus': versions['frozen'],
                      'mathematics': mathematical, 'actions': action_states,
                      'fullStatus': full, 'pending': pending,
                      'caseCount': len(cases),
                      'evidenceIds': sorted({c['evidenceId'] for c in cases} | ({'independent-math'} if any(c['mathReviewPointers'] for c in cases) else set())),
                      'publication': 'UNPUBLISHED_CANDIDATE'})

    result = {'schemaVersion': 2, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'base': manifest['sourceBase'], 'edition': manifest['edition'],
              'manifestSha256': manifest_sha, 'publication': 'UNPUBLISHED_CANDIDATE',
              'definition': 'Complete means the recorded applicable learner scenario at 320/390/1280 CSS px, plus the recorded finite assessment where provided. It does not enumerate every bank item, mode or random seed and does not claim real-pupil, physical-camera or production release verification.',
              'sources': inventory['sources'], 'inventorySummary': inventory['summary'],
              'counts': {'pages': len(pages), 'qr': sum(p['qrCount'] for p in pages),
                         'completeTrainers': sum(p['fullStatus'] == 'RECORDED_SCENARIO_COMPLETE' for p in pages),
                         'navigationChecked': sum(p['fullStatus'] == 'NAVIGATION_CHECKED' for p in pages),
                         'requiresTesting': sum(p['fullStatus'] == 'REQUIRES_TESTING' for p in pages),
                         'recordedCases': len(all_cases)},
              'verification': collect_verification(ROOT, mapping, inventory, manifest),
              'evidence': evidence, 'pages': pages, 'cases': all_cases}
    target.parent.mkdir(parents=True, exist_ok=True)
    if sha(manifest_path) != manifest_sha:
        raise ValueError('Edition manifest changed while results were being collected')
    target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(result['counts']))


if __name__ == '__main__':
    main()
