#!/usr/bin/env python3
"""One bounded cloud consultation; never changes content or review flags.

Only public-intended, authored course material is sent. Original textbook scans,
OCR, pupil data, credentials, unrelated files and local absolute paths are absent.
An unavailable or failed provider is recorded explicitly and is not a waiver.
"""
import datetime
import hashlib
import json
import os
from pathlib import Path
import urllib.error
import urllib.request

root = Path(__file__).resolve().parents[2]
out = root / 'artifacts/merzlyak-consultation/result.json'
out.parent.mkdir(parents=True, exist_ok=True)
record = {
    'provider': 'Anthropic', 'model': 'claude-opus-4-7',
    'purpose': 'Focused design and representative authored-content consultation; not an exhaustive textbook review',
    'base': os.environ.get('REVIEW_BASE_SHA'),
    'head': os.environ.get('REVIEW_HEAD_SHA'),
    'pr': os.environ.get('REVIEW_PR_URL'),
    'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'status': 'unavailable', 'supplied': [],
}


def save():
    out.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print('Claude consultation status: ' + record['status'])


key = os.environ.get('ANTHROPIC_API_KEY', '').strip()
if not key:
    record['reason'] = 'ANTHROPIC_API_KEY is not available to this Actions job.'
    save()
    raise SystemExit(0)

course = root / 'stereo-course/merzlyak-10-base'
paths = [course / 'lessons' / name for name in
         ('ex-01-016.json', 'ex-01-024.json', 'ex-01-025.json',
          'ex-02-006.json', 'ex-02-016.json', 'theory-14.json')]
missing = [path.name for path in paths if not path.is_file()]
if missing:
    record.update(status='insufficient-evidence', reason='Required authored samples are missing: ' + ', '.join(missing))
    save()
    raise SystemExit(0)
samples = []
for path in paths:
    if path.is_file():
        content = json.loads(path.read_text(encoding='utf-8'))
        samples.append(content)
        record['supplied'].append(path.relative_to(root).as_posix())

brief = {
    'goal': 'Ученику 10 класса понять теорию базовой стереометрии и научиться самому рассуждать по условиям Мерзляка. Оцени конкретный подготовленный фрагмент, не весь учебник.',
    'sequence': 'Условие и крупная вращаемая модель. Подсказка по желанию. Один обоснованный шаг за раз; все предыдущие шаги, введённое рассуждение и положение модели сохраняются. Геометрическое доказательство сохраняется для обсуждения с учителем, а не объявляется автоматически правильным.',
    'constraints': ['Не загромождать фигуры подписями.', 'Контрпример должен точно нарушать утверждение, сохраняя условия.', 'Каждый шаг должен объяснять, почему его можно сделать.', 'Не заменять все задачи несколькими шаблонами.', 'Обзоры параграфов не считать полным разбором всех теорем и примеров.'],
    'runtime': 'Повторно используется опубликованный движок курса Атанасяна. В изолированной копии изменены только сдвиг PDF-страницы с +2 на +1 и точный поиск дробного номера 1.1. Новый тип взаимодействия не вводился.',
    'evidence_limit': 'Ты видишь только этот brief и перечисленные JSON. Исходные страницы учебника и скриншоты не предоставлены. Все карточки остаются draft/pending. Не подтверждай сверку с PDF или просмотр браузера и не выдавай разрешение на публикацию всей книги.',
    'request': 'Раздели 1) математическую проверку представленных рассуждений и координат моделей; 2) педагогическую оценку последовательности и размеров шагов. Укажи конкретные воспроизводимые ошибки с id и шагом, либо отсутствие найденных ошибок только в просмотренном объёме. Предложи одно улучшение через действие ученика. Начни с verdict: findings / no-findings-in-scope / insufficient-evidence. Это ограниченная консультация, не полный release verdict.',
    'samples': samples,
}
payload = json.dumps({'model': record['model'], 'max_tokens': 2500,
                      'messages': [{'role': 'user', 'content': json.dumps(brief, ensure_ascii=False)}]}).encode('utf-8')
if len(payload) > 120000:
    record.update(status='insufficient-evidence', reason='Sanitized consultation exceeds the fixed 120000-byte input budget.')
    save()
    raise SystemExit(0)
record['inputBytes'] = len(payload)
record['inputSHA256'] = hashlib.sha256(payload).hexdigest()
request = urllib.request.Request('https://api.anthropic.com/v1/messages', data=payload,
                                 headers={'x-api-key': key, 'anthropic-version': '2023-06-01',
                                          'content-type': 'application/json'}, method='POST')
try:
    with urllib.request.urlopen(request, timeout=180) as response:
        data = json.load(response)
    text = '\n'.join(block.get('text', '') for block in data.get('content', [])
                     if block.get('type') == 'text').strip()
    if not text:
        raise ValueError('Provider returned no textual consultation')
    record.update(status='truncated' if data.get('stop_reason') == 'max_tokens' else 'completed',
                  response=text, usage=data.get('usage'), stopReason=data.get('stop_reason'),
                  responseId=data.get('id'), actualModel=data.get('model'))
except urllib.error.HTTPError as error:
    record.update(status='failed', reason='Provider HTTP status ' + str(error.code) + '; no automatic retry.')
except Exception as error:
    record.update(status='failed', reason=type(error).__name__ + '; no response was accepted and no automatic retry was made.')
save()
