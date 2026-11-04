# MathExam task specification

## Identity
- Task: ОГЭ — качество визуализации и связь лендинга с курсом
- Owner: владелец MathExam, запрос 4 ноября 2026
- Base branch: main
- Base SHA: 524cd81a79657fa5a40b694d1055f9790737cb0a
- Planned branch: feat/oge-landing-visual-clarity-20261104
- Review level: MEDIUM
- Related ADR: 0003 describes the OGE course; no architecture change.

## Goal
Сделать модели узнаваемыми при первом входе и связать наглядную витрину с
реальным действием ученика: тема, повторение основ или полный вариант.

## Context and evidence
- Владелец прислал снимок: 53 мелкие модели и 25 линий орбит сливаются.
- Главная PR433 опубликована в базовом commit. Pages41743144231 и live
  bytes подтверждены предыдущим выпуском; приглашение из PR432 сохранено.
  PROJECT_STATUS ещё описывает ранний лендинг; эта запись уточняет фактическую
  базу без отдельного служебного PR.
- Просмотрен опубликованный каталог /trainers/oge-course/: три группы
  1–14, 15–19, 20–25, спокойные карточки, прямой вход в тренажёры.
- Вывод: одновременная демонстрация всех объектов полезна как карта, но
  непригодна для узнавания мелких фигур на первом экране. Это дизайнерское
  решение по наблюдению, не результат исследования конверсии.

## Approved scope
### In scope
- Крупный первый вид из пяти моделей с отдельными прямыми кнопками.
- Сохранение полного режима 25 наклонённых орбит и всех 53 подтипов.
- Контраст, освещение, чёткость canvas; графики не исчезают ребром.
- Четыре точных векторных иллюстрации карточек, без генерации математических
  чертежей растровой моделью.
- Три стартовых пути и группы курса с существующими адресами.
- Небольшое оформление каталога в тех же цветах и ссылка к моделям.
- Расширение существующих проверок и визуальное сравнение.
### Out of scope / must not change
Математика и последовательности тренажёров, кабинеты, данные учеников,
сохранение, доска, сервисы, зависимости и развёртывание. Новые возможности
курса или доказанные изменения успеваемости/конверсии не заявляются.

## Acceptance criteria
- Первый вид показывает пять крупных объектов с явными кнопками.
- Все 25 уникальных плоскостей и 53 подтипа доступны одним переключением.
- Видимые вершины не обрезаются на мобильном и компьютере; сохраняются
  пауза, reduced motion, управление с клавиатуры, drag и fallback.
- Графики в обычном движении сохраняют различимую форму.
- Иллюстрации резкие, ссылки работают, названия групп совпадают с каталогом.
- Приглашение «Начни уже с чего-нибудь!» сохранено.

## Checks and gates
- JS syntax, geometry / orbit simulation at four sizes, SEO / sitemap,
  lesson-funnel, diff check.
- Existing CI: every 25-orbit/53-subtype interaction at four widths,
  fallbacks, pause, keyboard, destinations, new intro/map modes,
  topic SVG loading and landing → catalogue → landing journey.
- Managed preview: actual software rendering and page composition.
- Final gate markers: OGE_HOME_ORBITS_OK and OGE_HOME_3D_OK.
- Local browser automation not run: managed preview environment.

## Review plan
MEDIUM: bounded reversible public visual/navigation change. Self-review of
geometry, readability, exact diff and regression coverage. No new trainer
interaction or learning sequence. External review not performed under
OWNER_RELEASE_AUTHORIZATION.md and the current conversation's waiver.
No independent user study or real-pupil pilot is claimed.

## Risk and rollback
The complete map remains dense by design; first view and focused inspection
provide readability. Software lighting is an approximation. No guarantees of
speed on every device. Ordinary scoped revert PR restores previous display;
there is no data migration. Existing URLs and accessible fallback links remain.

## Permissions
The owner's current action request authorizes this task, branch, commits,
push and Draft PR. Publication after checks follows
[standing owner permission](../OWNER_RELEASE_AUTHORIZATION.md). No fresh
publication or provider-review consent is needed.

## Execution record
Candidate, checks, exact base/head, CI artefacts, deployment and live verification
are recorded in the task PR. Scope deviations: none.
