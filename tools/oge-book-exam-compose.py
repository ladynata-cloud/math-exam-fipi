"""Compose unchanged learner evidence and targeted reruns without hiding raw runs.

Chromium's text response.body() strips UTF-8 BOM. Old evidence recorded both an
initial exact-file digest and the decoded-body digest. Only when both prove the
same current payload do we restore the BOM identity. Other changes require an
actual targeted rerun. The current browser runner verifies this during the run.
"""
import copy
import datetime
import hashlib
import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIT = ROOT / 'artifacts/book-audit-exam'
WIDTHS = {320, 390, 1280}


def sha_bytes(data):
    return hashlib.sha256(data).hexdigest()


def compose(version, runs):
    chosen = {}
    inputs = []
    for run in runs:
        folder = AUDIT / run
        path = folder / 'results.json'
        payload = path.read_bytes()
        data = json.loads(payload)
        script_sha = sha_bytes((folder / 'runner-used.cjs').read_bytes())
        assert data['testScriptSha256'] == script_sha
        pointer = path.relative_to(ROOT).as_posix()
        inputs.append({'path': pointer, 'sha256': sha_bytes(payload),
                       'testScriptSha256': script_sha,
                       'generatedAt': data['generatedAt'], 'cases': len(data['reports'])})
        for index, raw in enumerate(data['reports']):
            assert raw['testScriptSha256'] == script_sha
            row = copy.deepcopy(raw)
            row['sourceEvidence'] = {'path': pointer, 'sha256': sha_bytes(payload),
                                     'pointer': '/reports/' + str(index),
                                     'testScriptSha256': script_sha}
            chosen[(row['id'], row['width'])] = (row, folder)
    assert len(chosen) == 93
    assert {width for _, width in chosen} == WIDTHS
    output = AUDIT / version
    output.mkdir(exist_ok=True)
    reports = []
    for (ident, width), (row, folder) in sorted(chosen.items(), key=lambda item: (item[0][1], item[0][0])):
        normalized = []
        assert not row.get('error'), (ident, width, row.get('error'))
        assert not row['resourceHashErrors'], (ident, width, row['resourceHashErrors'])
        for resource, evidence in row['resources'].items():
            local = ROOT / resource.lstrip('/')
            payload = local.read_bytes()
            actual = sha_bytes(payload)
            observed = evidence['sha256']
            if observed != actual:
                assert payload.startswith(b'\xef\xbb\xbf'), (ident, width, resource, 'stale payload')
                assert observed == sha_bytes(payload[3:]), (ident, width, resource, 'not an exact BOM decode')
                assert resource == row['prefix'] + row['route'], (ident, width, resource, 'uncaptured exact original bytes')
                assert row['sha256'] == actual, (ident, width, resource, 'initial payload digest changed')
                evidence['decodedBodySha256'] = observed
                evidence['sha256'] = actual
                evidence['bytes'] = len(payload)
                evidence['method'] = 'postprocessed UTF-8 BOM identity: original exact-file SHA and decoded browser-body SHA both match this payload'
                normalized.append({'path': resource, 'decodedBodySha256': observed,
                                   'rawPayloadSha256': actual, 'restoredPrefixHex': 'efbbbf',
                                   'originalExactFileSha256': row['sha256']})
        row['resourceHashes'] = {p: e['sha256'] for p, e in row['resources'].items()}
        row['rawFinalHtmlSha256'] = row.get('finalHtmlSha256')
        row['finalHtmlSha256'] = row['resources'][row['finalPath']]['sha256']
        row['identityNormalization'] = normalized
        for action in row['actions']:
            if action['action'] == 'resource-identity':
                assert action['status'] == 'PASS'
                action['finalHtmlSha256'] = row['finalHtmlSha256']
                if normalized:
                    action['normalization'] = 'See identityNormalization and immutable raw sourceEvidence.'
        assert row['status'] == 'PASS_SELECTED_CASE'
        assert not any(a['status'] in {'FAIL', 'NOT_RUN'} for a in row['actions'])
        for image in folder.glob(f'{ident}-{width}-*.png'):
            target = output / image.name
            if image.resolve() != target.resolve():
                shutil.copyfile(image, target)
        (output / f'{ident}-{width}.json').write_text(json.dumps(row, ensure_ascii=False, indent=2) + '\n')
        reports.append(row)
    # The raw runner's legacy 'base' field captures git HEAD at execution.
    # Commits created during the task can differ without changing tested bytes;
    # never relabel those raw heads or omit the per-resource identity checks.
    checkout_heads = sorted({r['base'] for r in reports})
    current_head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
    for head in checkout_heads:
        subprocess.run(['git', 'merge-base', '--is-ancestor', head, current_head], cwd=ROOT, check=True)
    common_base = subprocess.check_output(['git', 'merge-base', '--octopus', *checkout_heads], cwd=ROOT, text=True).strip() if len(checkout_heads) > 1 else checkout_heads[0]
    script_shas = sorted({r['testScriptSha256'] for r in reports})
    report = {'schemaVersion': 2, 'generatedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'base': common_base, 'recordedCheckoutHeads': checkout_heads,
              'baseSemantics': 'Common ancestor of recorded checkout HEADs; these are launch anchors, not claims that a committed tree was tested. Each record retains its raw base field and every actual response payload is matched to current bytes.',
              'prefix': reports[0]['prefix'], 'widths': sorted(WIDTHS),
              'testScriptSha256': script_shas[0] if len(script_shas) == 1 else None,
              'testScriptSha256s': script_shas,
              'composition': {'method': 'Latest targeted case replaces the matching id/width; every retained byte is reverified. Raw runs remain immutable.',
                              'script': Path(__file__).relative_to(ROOT).as_posix(),
                              'scriptSha256': sha_bytes(Path(__file__).read_bytes()),
                              'sourceRuns': inputs,
                              'utf8BomNormalization': 'Only original exact-file SHA plus an exact matching BOM-stripped browser body can establish raw payload identity.'},
              'coverage': 'Recorded learner UI lifecycle at 320/390/1280; complete finite assessments at 1280 where available; source-derived mathematical oracles require independent review.',
              'reports': reports}
    (output / 'results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(version, len(reports), 'PASS_SELECTED_CASE', 'BOM-normalized', sum(bool(r['identityNormalization']) for r in reports))


if __name__ == '__main__':
    compose('source', ['source-seeded-baseline', 'source-targeted', 'source-task6-html', 'source-storage-review-final', 'source-tire-image-fix', 'source-map-tire-image-fix'])
    compose('frozen', ['frozen-jekyll-final', 'frozen-tire-image-fix', 'frozen-map-tire-image-fix'])
