# SEO: полноценный вход в «Основы и методы»

## Identity

- Task: `SEO_METHODS_ENTRANCE_20261118`.
- Owner: MathExam.
- Date: 2026-11-18, Asia/Novosibirsk.
- Base branch: `main`.
- Base SHA: `93bb989f7b5cb7aea99de388ce35dfcb6deb336d`.
- Planned branch: `fix/seo-methods-entrance-20261118`.
- Review level: `MEDIUM`.
- Related issue or ADR: не требуется; архитектура тренажёров не меняется.

## Goal

Сделать существующий раздел «Основы и методы» понятным поисковому роботу
и читателю до запуска JavaScript: корректные метаданные, единый адрес,
читаемый список тем и рабочая навигация в прежние упражнения. Оценить
целесообразность SEO-статей по трём сайтам из приложенного аудита.

## Context and evidence

- Владелец приложил аудит трёх сайтов и поручил «выполни задание,
  посмотри еще на идею писать сео статьи».
- На проверенной базе раздел не имеет canonical, отсутствует в sitemap,
  а `#alphabet-main` содержит только короткое сообщение `noscript`.
- Действующий каталог содержит 11 тем и 44 навыка. Номера заданий берутся
  из `exam-map.js`; старые внутренние ID не являются номерами ФИПИ.
- До правок `seo-check.py` и `build-sitemap.py --check` проходят:
  582 публичных URL, 31 проверяемый вход. Это локальная проверка,
  не измерение индексации Google или Яндекса.
- Публичная страница ОГЭ уже содержит примеры и ссылки на базовые навыки.
  Опубликованный текст проверен при начале задачи. Исторические показатели
  Search Console из вложения не объявляются новым замером.
- Текущие инструкции владельца в разговоре требуют отдельного разрешения
  на merge. Они имеют приоритет над более ранней standing policy в репозитории.

## Approved scope

### In scope

- Метаданные и canonical существующего `/ege-profil/azbuka-metodov/`.
- Статический каталог, воспроизводимый из действующего каталога курса.
- Включение раздела в reviewed sitemap и проверки SEO/совпадения каталогов.
- Проверка прежних упражнений и сохранённых ответов после замены начального HTML.
- Редакторская записка о полезных поисковых статьях, существующих дублях,
  конкретных пилотах и критериях оценки результата без выдуманной частотности.
- Сверка текущего статуса и отчёт с точными результатами.

### Out of scope

- Новые курсы, массовая генерация статей, переписывание учебных банков.
- Изменение маршрутизации, хранилища, кабинета, доски и аналитики.
- Обещания индексации, позиции или поискового трафика.
- Merge, auto-merge, deployment и вмешательство в другие PR.
- Текстовые правки двух других сайтов: отдельные задачи/ветки/PR их репозиториев.

### Files or areas that must not change

`ege-profil/azbuka-metodov` runtime JS, mathematical data, styles, downloadable
trainer packages, private pages, robots exclusions and learner records.

## Acceptance criteria

- [ ] Один HTTPS canonical; title/description/OG/Twitter согласованы.
- [ ] Sitemap добавляет только canonical раздела, без query/hash вариантов.
- [ ] Все 11 тем видны в исходном HTML и совпадают с JS по названиям,
  описаниям, порядку и адресам; не создаётся второй список после загрузки.
- [ ] Чтение списка не записывает прогресс; прежние deep links работают.
- [ ] На 320/390/1280 px нет горизонтальной прокрутки и дублированного H1.
- [ ] SEO-записка различает подтверждённые наблюдения и гипотезы.
- [ ] Все применимые проверки пройдены, ограничения перечислены честно.

## Checks and gates

- Required tests: `tools/profile-alphabets.test.cjs`,
  `tools/profile-fipi-2027-contract.test.cjs`, `tools/seo-catalog.test.cjs`.
- Required static checks: reproducible entrance build, `seo-sitemap.test.py`,
  `build-sitemap.py --check`, `seo-check.py`, `git diff --check`.
- Manual checks: Chromium, JS on/off, 320/390/1280 px; каталог, переход
  к навыку, ввод/восстановление ответа, возврат к каталогу.
- Final gate marker: `SEO_METHODS_ENTRANCE_20261118_OK`.
- Checks intentionally not run: production release and private search dashboards;
  backend/full learner-suite outside the unchanged runtime boundary.

## Review plan

- Review-level rationale: небольшой HTML-вход, генератор и CI; требуется
  focused review совпадения с приложением и сохранения прежнего поведения.
- Trainer design consultation applicable: no; учебные шаги и задачи не меняются.
- Ready-result review: SEO consistency, static/JS parity, local link checks,
  browser navigation, retained draft, independent focused review.
- External provider review required: no; не запрошен владельцем.
- Sanitized handoff: только публичный diff и сведения о проверках;
  без ключей, личных документов и абсолютных путей окружения.
- Если внешнее review состоится, record должен содержать provider, PR,
  base/head SHA, verdict и проверяемый источник/время.

## Risk and rollback

- Main risks: устаревшая статическая копия каталога, дублирование после JS,
  лишние URL в sitemap, конфликт с параллельными изменениями общего каталога.
- Rollback: обратный обычный коммит точного diff после разрешения владельца;
  пользовательские данные миграции не требуют.
- Data/compatibility: прежние ID, параметры, hashes и storage keys сохраняются.

## Permissions

- `START`: прямое поручение владельца «выполни задание» в текущем разговоре.
- Branch creation, local commits, push, Draft PR: yes.
- Merge, auto-merge, deployment: **no**; нужно отдельное явное разрешение
  согласно предоставленному владельцем `AGENTS.md`.
- No force, reset, rebase, non-fast-forward merge or gate weakening.

## Execution record

Точные результаты и ограничения — в
[`../reports/SEO_METHODS_ENTRANCE_20261118.md`](../reports/SEO_METHODS_ENTRANCE_20261118.md)
и в PR. Commit SHA записывается в PR, чтобы не создавать самоссылочный коммит.

## Required handoff

```text
EXECUTIVE STATUS

Task:
PR:
Base:
Head:
Gate:
Tests:
Failures:
Not run:
Scope deviations:
Recommendation:
Next user decision:
```
