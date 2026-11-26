# Завершение базового арифметического маршрута Арженикова

## Identity

- Task: `ARZHENIKOV_COURSE_COMPLETION_20261123`
- Owner: владелец MathExam, поручение в текущем разговоре.
- Date: 2026-11-23 (начало задачи, Asia/Novosibirsk).
- Base branch: `main`
- Base SHA: `b944df23a069b593aa03c7bcc4f9938300695f41`
- Planned branch: `codex/arzhenikov-course-completion-20261123`
- Review level: `HIGH` — новые локальные записи проверок и связанный маршрут.
- Related ADR: нет нового платформенного контракта. Proposed ADR 0001 не
  используется как принятый источник архитектурных решений.

## Goal

Довести существующие уроки до законченного базового арифметического маршрута:
понятный вход, недостающие связующие умения, повторение изученного и свежие
смешанные задачи, в которых ученик сам выбирает способ. Сохранить прежние
курсы, игры, карту с приближением и практический подход Арженикова.

## Context and evidence

- PR #742 опубликован коммитом base; прежний состав — 76 уроков, 608 условий,
  76 вопросов с выбором объяснения. Точные release evidence находятся в #742.
- Код сохраняет первый ответ, помощь и исправление. Старые проверки дробей
  главным образом проверяют исполнение заданных шагов: 44/48 условий у
  обыкновенных и 48/48 у десятичных дробей имеют обязательные steps.
- Письменные сложение/вычитание/умножение и отдельный курс процентов уже есть.
  Повторно создавать эти полные курсы не требуется.
- В старой оранжерее startReview добавляет ещё не посещённые темы. Открытие
  полного разбора доступно лишь после первой попытки. Оба ограничения
  противоречат принятому направлению повторения и добровольной ранней помощи.
- Исторические основания мостов: Аржеников, часть IV (1924), с. 6–9, 12–15,
  32, 34–51, 68; часть III, с. 35, 71. Новые сюжеты, диагностика и интерфейс —
  современная адаптация MathExam, не факсимильное издание.

## Approved scope

Поручение владельца: «выполни ... все необходимые дополнения и уточнения ...
сначала курс завершим, а потом спросим у Клод через API ключ, как ... улучшить».
Позднее уточнён следующий этап: помощник курса на ранее обсуждённом бонусном
API Kimi после готовности курса и разбора замечаний.

### In scope

- Шесть мостовых уроков / 48 условий: дробь как частное; смешанные и
  неправильные дроби; самостоятельный выбор долей; общие единицы и время;
  доля/десятичная запись/процент; смешанные действия. Первые модели помогают,
  новые проверочные условия не сообщают готовый способ.
- Необязательная входная проверка, повторение только действительно начатых
  тем, итоговые смешанные задачи; отдельный банк свежих условий, отсутствие
  обязательного заранее раскрытого плана, помощь до первой попытки.
- Новый отдельный ключ сохранения проверок, восстановление черновика и
  неизменяемые сведения о первой попытке/помощи, честный знакомый повтор.
- Понятное продолжение после урока, конкретные ссылки при затруднениях,
  различение прохождения урока и самостоятельного переноса.
- Исправление ложной фразы об изменении размера доли при множителе 1 и
  избыточного утверждения о свободном объяснении после выбора ответа.
- Повторение оранжереи по изученным темам с сохранением истории, ранний разбор.
- Связи с прежними тренажёрами, карта, источники, автономный ZIP, релевантные
  проверки и согласование PROJECT_STATUS с подтверждённым выпуском #742.
- После готовности — минимизированный пакет для Claude, ограниченное
  обращение через доступный авторизованный API, разбор существенных замечаний.

### Out of scope

- Полный школьный курс алгебры/геометрии, полный постраничный задачник,
  периодические дроби, новая платформа или протокол доски, SEO-задача.
- Реализация и платные вызовы помощника Kimi до готовности курса.
- Утверждения об эффективности на реальных учениках без наблюдений.

### Files or areas that must not change

- Смысл, ID, числа, ответы и ключи прогресса прежних банков. Разрешена указанная
  точечная правка объяснения дробей; связанные ссылки добавляются оболочкой.
- Не относящиеся к курсу серверы, кабинеты, авторизация и API-секреты.

## Acceptance criteria

- [ ] Старые 76 уроков и игровые маршруты доступны; их учебные записи сохранены.
- [ ] Новые 6 уроков содержат 48 математически проверенных условий и 6 объяснений.
- [ ] Вход рекомендует уроки без блокировки свободного выбора.
- [ ] Повторение не выдаёт просмотренную, но не начатую тему за изученную.
- [ ] Итоговые условия не раскрывают способ до добровольной помощи.
- [ ] Первый ответ/помощь/исправление и знакомый повтор учитываются отдельно.
- [ ] Черновики и очереди восстанавливаются; повреждённое сохранение не затирается.
- [ ] Мобильный, клавиатурный и автономный сценарии проходят проверку.
- [ ] Подготовленный результат и ограничения переданы на запрошенный Claude review
  либо честно записан конкретный блокер доступа после завершения локальной работы.

## Checks and gates

- Required tests: existing course/arithmetic/legacy game and journeys tests;
  independent rational arithmetic for new bank; persistence/selection/help
  regression tests; DOM and Chromium journey including mobile and offline.
- Required static checks: syntax, links, canonical page binding, reproducible
  offline build, git diff --check, no secret/private material in handoff.
- Manual checks: entry → lesson → review; transfer help before answer;
  interrupted draft; summary with correction; map zoom and mobile layout.
- Final gate marker: `ARZHENIKOV_COURSE_COMPLETION_20261123_OK` only after checks.
- Real-learner trial not run: requires separate observation, not a technical gate.

## Review plan

- Independent technical review of math, restored records, selection and UI.
- Trainer consultation applies; owner explicitly chose implementation first,
  then Claude ready-result discussion. Earlier saved consultations are method
  context, not approval of this code or head.
- External review requested for improvement after course completion. Send only
  relevant public code/conditions and evidence, no private dialogue, credentials,
  personal data or machine paths. Record provider, PR, base/head, timestamp and
  verdict/limitations. Material later changes invalidate exact-head approval.

## Risk and rollback

- Risks: accidental evidence inflation, unstudied tasks, regression of old
  routes, mathematical/unit ambiguity, unavailable storage or API.
- Rollback: revert this task commit after separate authorization. New completion
  key can remain inert; old course/game schemas and records are compatible.

## Permissions

- START, branch, scoped edits, tests, logical commits, push, Draft PR: yes,
  by the current direct owner instruction to finish the course.
- Merge/auto-merge/deployment: **not authorized for this new task**. The direct
  AGENTS instructions supplied by the owner in this conversation require a
  separate exact-base/head authorization. Prior permission concerned #742 only
  and has already been fulfilled. It does not authorize this new PR.
- No force/reset/rebase/admin override/gate weakening.

## Execution record

- Actual branch: `codex/arzhenikov-course-completion-20261123`
- Actual base: `b944df23a069b593aa03c7bcc4f9938300695f41`
- Actual head / PR / tests / deviations: recorded in final report and PR.

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
