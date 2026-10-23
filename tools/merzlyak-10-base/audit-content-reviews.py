#!/usr/bin/env python3
"""Read-only independent content evidence audit.

API: audit(root, write=False, manifest_path=None, ledger_path=None) -> dict.
write=True writes only content-review-audit.json; no lesson or source report is
modified. CLI exits 0=PASS, 1=PENDING, 2=FAIL. Missing/unconfigured reports stay
pending. Every accepted verdict is selected by the explicit pinned manifest.

Ledger v1: contentKeys must equal CONTENT_KEYS; allowedChangedKeys must equal
['status','review']. entries cover the complete current lesson path set. Each
entry has path, lessonId, beforeSha256, afterSha256, contentSha256, and either
beforeValues={status,review} plus serialization=SERIALIZATION, or beforeFileUtf8.
The restored original bytes must hash to the exact SHA in each source report.
A compact content hash alone never authorizes a changed full-file hash.
"""
import argparse
import copy
import hashlib
import json
from pathlib import Path, PurePosixPath
import re

CONTENT_KEYS = ['id', 'kind', 'title', 'source', 'statement', 'visualization', 'help', 'steps', 'answer']
DIMENSIONS = ('source', 'mathematics', 'pedagogy')
SERIALIZATION = 'json-utf8-ensure-ascii-false-indent-2-final-lf'
TOOL_DIR = 'tools/merzlyak-10-base'
LESSON_DIR = 'stereo-course/merzlyak-10-base/lessons'


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def canonical(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False).encode('utf-8')


def content_hash(card):
    return sha(canonical({key: card[key] for key in CONTENT_KEYS if key in card}))


def json_bytes(card):
    return (json.dumps(card, ensure_ascii=False, indent=2, allow_nan=False) + '\n').encode('utf-8')


def strict_json(raw):
    def pairs(items):
        out = {}
        for key, value in items:
            if key in out:
                raise ValueError('duplicate JSON key: ' + key)
            out[key] = value
        return out
    return json.loads(raw, object_pairs_hook=pairs, parse_constant=lambda value: (_ for _ in ()).throw(ValueError(value)))


def select(obj, dotted):
    for key in dotted.split('.'):
        if not isinstance(obj, dict) or key not in obj:
            raise ValueError('missing explicit selector ' + dotted)
        obj = obj[key]
    return obj


def safe_path(root, value):
    if not isinstance(value, str) or not value or PurePosixPath(value).is_absolute() or '..' in PurePosixPath(value).parts or '\\' in value:
        raise ValueError('invalid repository-relative path ' + repr(value))
    path = root / value
    if not path.resolve().is_relative_to(root.resolve()) or path.is_symlink():
        raise ValueError('path outside root or symlink: ' + value)
    return path


def valid_hash(value):
    return isinstance(value, str) and re.fullmatch(r'[a-f0-9]{64}', value) is not None


def restore_ledger(entry, current_raw, current):
    """Return exact before bytes after proving only status/review changed."""
    if entry.get('afterSha256') != sha(current_raw):
        raise ValueError('ledger afterSha256 differs from current exact bytes')
    if entry.get('lessonId') != current['id']:
        raise ValueError('ledger lessonId differs')
    if 'beforeFileUtf8' in entry:
        if 'beforeValues' in entry:
            raise ValueError('ambiguous ledger restore mechanism')
        before_raw = entry['beforeFileUtf8'].encode('utf-8')
        before = strict_json(before_raw)
    else:
        if entry.get('serialization') != SERIALIZATION or set(entry.get('beforeValues', {})) != {'status', 'review'}:
            raise ValueError('ledger needs exact serialization and exactly status/review beforeValues')
        before = copy.deepcopy(current)
        before.update(copy.deepcopy(entry['beforeValues']))
        before_raw = json_bytes(before)
    if entry.get('beforeSha256') != sha(before_raw):
        raise ValueError('restored bytes do not match exact beforeSha256')
    immutable = lambda card: {key: value for key, value in card.items() if key not in ('status', 'review')}
    if canonical(immutable(before)) != canonical(immutable(current)):
        raise ValueError('fields outside status/review changed')
    if content_hash(before) != content_hash(current) or entry.get('contentSha256') != content_hash(current):
        raise ValueError('ledger canonical content SHA differs')
    return before_raw


def audit(root, write=False, manifest_path=None, ledger_path=None):
    root = Path(root).resolve()
    errors, pending = [], []
    fail = errors.append
    manifest_path = Path(manifest_path) if manifest_path else root / TOOL_DIR / 'content-review-manifest.json'
    manifest_raw = manifest_path.read_bytes()
    manifest = strict_json(manifest_raw)
    if manifest.get('schemaVersion') != 1 or manifest.get('contentKeys') != CONTENT_KEYS or manifest.get('lessonDirectory') != LESSON_DIR:
        raise ValueError('unsupported manifest contract')
    files = sorted((root / LESSON_DIR).glob('*.json'))
    if len(files) != manifest['expectedLessonCount']:
        fail('lesson count differs from manifest: ' + str(len(files)))
    cards, ids = {}, set()
    for path in files:
        relative = path.relative_to(root).as_posix()
        try:
            safe_path(root, relative)
            raw = path.read_bytes(); card = strict_json(raw)
            if card['id'] in ids:
                fail('duplicate lesson id ' + card['id'])
            ids.add(card['id'])
            owners = [x['agent'] for x in manifest['authors'] if re.fullmatch(x['fileNameRegex'], path.name)]
            if len(owners) != 1:
                fail(relative + ': requires exactly one explicit author, got ' + str(owners))
            cards[relative] = {'raw':raw, 'card':card, 'author':owners[0] if len(owners)==1 else None,
                               'path':relative, 'lessonId':card['id'], 'currentSha256':sha(raw),
                               'contentSha256':content_hash(card), 'evidence':{d:[] for d in DIMENSIONS}}
        except (ValueError, KeyError, TypeError) as exc:
            fail(relative + ': ' + str(exc))
    ledger_path = Path(ledger_path) if ledger_path else root / TOOL_DIR / 'content-review-ledger.json'
    ledger_info = None
    ledger = {}
    if ledger_path.exists():
        try:
            ledger_raw = ledger_path.read_bytes(); doc = strict_json(ledger_raw)
            ledger_info = {'path':str(ledger_path.relative_to(root)), 'sha256':sha(ledger_raw)}
            if doc.get('schemaVersion') != 1 or doc.get('contentKeys') != CONTENT_KEYS or doc.get('allowedChangedKeys') != ['status', 'review']:
                raise ValueError('unsupported ledger contract')
            for entry in doc['entries']:
                key = entry['path']
                safe_path(root, key)
                if key in ledger:
                    raise ValueError('duplicate ledger path ' + key)
                ledger[key] = entry
            if set(ledger) != set(cards):
                raise ValueError('ledger must cover exact full lesson path set; missing=' + str(len(set(cards)-set(ledger))) + ', extra=' + str(len(set(ledger)-set(cards))))
            for key, entry in ledger.items():
                try:
                    cards[key]['restoredRaw'] = restore_ledger(entry, cards[key]['raw'], cards[key]['card'])
                except (ValueError, KeyError, TypeError, UnicodeError) as exc:
                    fail(key + ': ' + str(exc))
        except (ValueError, KeyError, TypeError, UnicodeError) as exc:
            fail('ledger: ' + str(exc))
    reports = []
    report_names = set()
    for spec in manifest['reports']:
        name = spec['path']
        result = {'path':name, 'manifestSha256':spec.get('sha256'), 'expectedCards':spec['expectedCards'], 'reviewer':spec['reviewerAgent'], 'dimensions':list(spec['dimensions'])}
        reports.append(result)
        if name in report_names:
            fail('duplicate report in manifest: ' + name)
            continue
        report_names.add(name)
        try:
            path = safe_path(root, name)
            if not path.exists():
                pending.append(name + ': report missing'); result['status']='PENDING'; continue
            raw = path.read_bytes(); result['actualSha256']=sha(raw)
            if spec.get('sha256') is None:
                pending.append(name + ': report exists but its schema/verdict/hash has not been explicitly accepted into manifest'); result['status']='PENDING'; continue
            if not valid_hash(spec['sha256']) or result['actualSha256'] != spec['sha256']:
                raise ValueError('report SHA differs from explicit manifest')
            report = strict_json(raw)
            identity = spec['identityCheck']
            if select(report, identity['selector']) != identity['equals']:
                raise ValueError('reviewer identity field differs from explicit manifest')
            for check in spec['topLevelPassChecks']:
                if select(report, check['selector']) != check['equals']:
                    raise ValueError('non-PASS top-level verdict: ' + check['selector'])
            for selector in spec['unresolvedSelectors']:
                if select(report, selector) != []:
                    raise ValueError('unresolved findings: ' + selector)
            records = select(report, spec['records'])
            exclusions = {x['path']:x for x in spec.get('excludedRecords', [])}
            if len(exclusions) != len(spec.get('excludedRecords', [])):
                raise ValueError('duplicate excluded record')
            expected_paths = {key for key in cards if (Path(key).name in spec['fileNames'] if 'fileNames' in spec else re.fullmatch(spec['fileNameRegex'], Path(key).name))}
            if 'fileNames' in spec and (len(spec['fileNames']) != len(set(spec['fileNames'])) or len(spec['fileNames']) != spec['expectedCards']):
                raise ValueError('explicit fileNames scope has duplicates or wrong count')
            if len(records) != spec['expectedCards'] + len(exclusions) or len(expected_paths) != spec['expectedCards']:
                raise ValueError('scope count differs: records=' + str(len(records)) + ', expected current paths=' + str(len(expected_paths)))
            seen = set(); accepted = []
            for index, record in enumerate(records):
                key = record[spec['pathKey']]
                safe_path(root, key)
                if key in seen:
                    raise ValueError('duplicate report lesson path ' + key)
                seen.add(key)
                if key in exclusions:
                    exclusion = exclusions[key]
                    if record[spec['hashKey']] != exclusion['sha256'] or not exclusion.get('reason') or not exclusion.get('supersededByReport'):
                        raise ValueError('invalid explicit historical exclusion ' + key)
                    if key not in cards or record[spec['idKey']] != cards[key]['lessonId']:
                        raise ValueError('excluded historical record identity mismatch ' + key)
                    continue
                if key not in expected_paths:
                    raise ValueError('record path outside explicit scope ' + key)
                item = cards[key]
                if record[spec['idKey']] != item['lessonId']:
                    raise ValueError('record lessonId mismatch: ' + key)
                if item['author'] is None or item['author'] == spec['reviewerAgent']:
                    raise ValueError('review is not independent of author: ' + key)
                reviewed_sha = record[spec['hashKey']]
                if not valid_hash(reviewed_sha):
                    raise ValueError('invalid record SHA: ' + key)
                original_raw = item.get('restoredRaw', item['raw'])
                if reviewed_sha != sha(original_raw):
                    raise ValueError('exact reviewed SHA mismatch: ' + key)
                if ledger_info and key not in ledger:
                    raise ValueError('missing ledger entry for ' + key)
                evidence = {'report':name, 'reportSha256':sha(raw), 'recordPointer':'/'+spec['records'].replace('.', '/')+'/'+str(index),
                            'reviewer':spec['reviewerAgent'], 'author':item['author'], 'reviewedSha256':reviewed_sha,
                            'match':'ledger-restored-exact' if 'restoredRaw'in item else 'current-exact', 'verdictSelectors':{}}
                for dimension, rule in spec['dimensions'].items():
                    if dimension not in DIMENSIONS:
                        raise ValueError('unsupported dimension: ' + dimension)
                    verdict_origin = rule.get('origin', 'record')
                    if verdict_origin not in ('record', 'report'):
                        raise ValueError('unsupported verdict origin')
                    verdict = select(report if verdict_origin=='report' else record, rule['selector'])
                    if verdict not in rule['accept']:
                        raise ValueError('non-PASS record verdict: ' + key + ' ' + dimension + '=' + str(verdict))
                    evidence['verdictSelectors'][dimension] = {'origin':verdict_origin, 'selector':rule['selector'], 'value':verdict}
                accepted.append((key,evidence))
            if seen != expected_paths | set(exclusions):
                raise ValueError('report does not cover its exact declared path set')
            # Atomic report acceptance: one bad record cannot partially approve a report.
            for key,evidence in accepted:
                for dimension in spec['dimensions']:
                    cards[key]['evidence'][dimension].append(evidence)
            result['status']='PASS'; result['acceptedCards']=len(accepted); result['excludedHistoricalRecords']=list(exclusions.values())
        except (ValueError, KeyError, TypeError, UnicodeError) as exc:
            result['status']='FAIL';result['reason']=str(exc); fail(name + ': ' + str(exc))
    # An excluded historical record must have an actual accepted replacement for
    # each dimension previously supplied, not merely a named file on disk.
    for spec in manifest['reports']:
        for exclusion in spec.get('excludedRecords', []):
            key = exclusion['path']
            for dimension in spec['dimensions']:
                evidence = cards.get(key, {}).get('evidence', {}).get(dimension, [])
                if not any(e['report'] == exclusion['supersededByReport'] for e in evidence):
                    fail(key + ': historical exclusion has no accepted replacement for ' + dimension)
    output_cards=[]
    duplicate_agreements=0
    for key,item in cards.items():
        verdicts={}
        for dimension, evidence in item['evidence'].items():
            if not evidence:
                verdicts[dimension]='PENDING'
            else:
                if len({e['reviewedSha256'] for e in evidence}) != 1:
                    fail(key + ': disagreeing duplicate exact hashes for ' + dimension)
                if len(evidence)>1:
                    duplicate_agreements+=1
                verdicts[dimension]='PASS'
        output_cards.append({field:item[field] for field in ('path','lessonId','author','currentSha256','contentSha256')} | {'verdicts':verdicts,'evidence':item['evidence']})
    missing = [{'path':c['path'],'dimensions':[d for d,v in c['verdicts'].items() if v!='PASS']} for c in output_cards if any(v!='PASS' for v in c['verdicts'].values())]
    status='FAIL' if errors else ('PENDING' if pending or missing else 'PASS')
    result={'schemaVersion':1,'status':status,'manifest':{'path':str(manifest_path.relative_to(root)),'sha256':sha(manifest_raw)},'contentKeys':CONTENT_KEYS,
            'contentHashAlgorithm':'SHA-256 of UTF-8 JSON over present contentKeys, ensure_ascii=false, sorted keys, compact separators, finite numbers only.',
            'ledger':ledger_info,'lessonCount':len(cards),'fullyReviewedCards':len(cards)-len(missing),
            'dimensionPassCounts':{d:sum(c['verdicts'][d]=='PASS' for c in output_cards) for d in DIMENSIONS},
            'duplicateDimensionAgreements':duplicate_agreements,'errors':errors,'pendingReports':pending,'missingDimensions':missing,
            'reports':reports,'cards':output_cards,'changesLessonFiles':False,'releaseApproval':False}
    if write:
        (root/TOOL_DIR/'content-review-audit.json').write_bytes(json_bytes(result))
    return result


if __name__ == '__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path(__file__).resolve().parents[2])
    parser.add_argument('--manifest',type=Path)
    parser.add_argument('--ledger',type=Path)
    parser.add_argument('--no-write',action='store_true')
    args=parser.parse_args()
    result=audit(args.root,write=not args.no_write,manifest_path=args.manifest,ledger_path=args.ledger)
    print(json.dumps({k:result[k] for k in ('status','lessonCount','fullyReviewedCards','dimensionPassCounts','errors','pendingReports')},ensure_ascii=False,indent=2))
    raise SystemExit({'PASS':0,'PENDING':1,'FAIL':2}[result['status']])
