# Проверки курса ОГЭ

Запуск из `oge/`:

```bash
npm install
npm test
```

| Команда | Что проверяет | Маркер |
| --- | --- | --- |
| `node tests/registry-test.js` | реестр: файлы существуют с точным регистром, `NAMES`/`TYPES`/`LINES`/`CABINET` согласованы, `TYPES` опубликованных тренажёров совпадают с ключами, которые извлекает `tools/oge-registry-draft.mjs` (или с `TYPE_IDS` в файле, когда она появится); функции журнала | `OGE_REGISTRY_OK` |
| `node tests/adapters-test.js` | адаптеры (jsdom): `line` — «не начат / в работе / зачёт сдан», охват типов с потолком 3, полная полоса только при `passed === true`; `plots`, `diagnostic`, `exam`, `analogue`, `review`; маршрут «с чего начать»; правило клеток `bar()` | `OGE_ADAPTERS_OK` |
| `node tests/junk-test.js` | мусор в ключе (8 видов) и в ветке для каждого адаптера — без исключений и без `NaN`; фрагмент-помощник из `docs/OGE_PROGRESS_CONTRACT.md` выполняется как есть: пишет только свою ветку, перечитывает ключ перед записью, журнал и `?mode=review` по правилам | `OGE_JUNK_OK` |

Страницы курса (`site-test`, `teacher-test`, `links-test`, `cabinet-safety-test`)
добавляются задачами `OGE_COURSE_02A`/`02B` по образцу `ege-profil/tests/`.
