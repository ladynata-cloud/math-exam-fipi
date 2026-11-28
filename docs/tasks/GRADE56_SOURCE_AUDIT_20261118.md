# Курсы 5–6 классов: сверка аудита и исправление учебного цикла

## Identity and goal

- Date: 18 ноября 2026, Asia/Novosibirsk.
- Base: `main@1d585e3e708fbe8f3ab07081073bcbe83e1ac72e`.
- Branch: `codex/grade56-source-audit-20261118`.
- Review: **HIGH** — результат самостоятельности и локальная история.
- Owner START: прямое поручение проверить и улучшить курсы 5–6 классов в текущем разговоре. Commit/push/Draft PR и проверенный выпуск разрешены [действующей политикой](../OWNER_RELEASE_AUTHORIZATION.md).

Проверить действующие входы Виленкина и Петерсон 5–6 по математике, понятности и рекомендациям прежнего выборочного внешнего аудита. Исправить подтверждённые нарушения существующего учебного цикла, сохранив условия, методику, помощь и ученические записи.

## Evidence and scope

- Прочитаны существующая [задача аудита](FOUNDATIONS_GRADE56_AUDIT_20261109.md), код текущих входов, каталог и правила review. Актуальная main подтверждена по remote.
- Сохранённый аудит Brilliant, редакция 12: прочитаны релевантные разделы 1–6. Различаются прямые наблюдения, архивы и собственные предложения MathExam. Официальные страницы Brilliant и IES/WWC дополнительно проверены 18 ноября. Это не новое полное прохождение внешних курсов и не измерение эффективности MathExam.
- В scope: распознавание числового формата в Петерсон 5/6; сохранение первой содержательной ошибки в существующей записи, если это не требует миграции; атрибуция реально открытой помощи/тренировки в текущем Виленкине 6; точные описания текущего входа в каталоге/метаданных.
- Уточнение зависимостей до правок: `school/peterson5/app.js`, `school/peterson6/app.js`, `school/peterson6/style.css` (закрытый помощник в потоке при раскрытой истории ошибки), `courses/vilenkin-6-part-1/textbook-course.js`, `courses/catalog.json`, `courses/index.html`, metadata `courses/vilenkin-6-part-1/index.html`, cache stamps `school/peterson5/index.html`, `school/peterson6/index.html`, `courses/vilenkin-6-part-1/textbook.html`, целевые тесты, отчёт и штатная provenance-привязка изменённого HTML при необходимости. Скачиваемые копии: `courses/vilenkin-6-part-1/offline.html` (его builder наследует metadata входа); самостоятельный HTML и ZIP `peterson6-math` (содержат изменённый app.js). Добавляется целевой browser gate и его запуск в существующий foundations workflow; прочие exports сохраняются.
- Не входят: новые темы/платформа/сервер; изменение банков, seed, ответов, ID, board-протокола; публикация чужих незавершённых PR; утверждение о полном покрытии учебников или внешних продуктов. Нельзя очищать или мигрировать прежние ученические данные.

## Learning design and acceptance

1. Нераспознанная числовая запись получает понятное сообщение формата и сохраняется как черновик без математической попытки. Осмысленное неверное число по-прежнему является попыткой; требования к виду ответа сохраняются.
2. Реально открытая помощь не даёт ложного самостоятельного зачёта, включая среднюю кнопку мыши и уход в другую практику. Простое отображение ссылки не считается помощью. Старые успешные результаты не отменяются.
3. Первая содержательная ошибка, если добавлена, переживает исправление/перезагрузку; повторный click её не заменяет. Старые записи без неё читаются без выдуманной истории. Учитывается режим read-only/shared.
4. Каталог сообщает о текущем курсе, отделяя тематическое покрытие от выбранных номеров учебника.
5. Применимые math/DOM/state/metadata проверки, реальный Chromium на 320/1280 px, независимый review и `git diff --check` успешны. Нельзя ослаблять прежние тесты.

## Review, risk and rollback

Независимое review подтверждает математический смысл распознавания, помощь, совместимость сохранений, актуальность callback и доступность обратной связи. Внешний provider review и ученический пилот не проводятся; внешние источники служат основаниями требований, не одобрением кода.

Риски: неверно исключить содержательную попытку; потерять историю; приписать помощь после завершения; рассинхронизировать автономный файл. Откат — обычный revert текущей задачи без удаления localStorage; новые необязательные поля безопасно игнорируются прежним кодом. Перед выпуском — свежие main/head, проверенная композиция и установленный путь GitHub Pages.

## Execution record

Проверки, подтверждённые дефекты, ограничения, exact head/PR и результат выпуска фиксируются в [отчёте](../reports/GRADE56_SOURCE_AUDIT_20261118.md) и PR. Незапущенные проверки не считаются успешными.


## Verified course coverage and route limits

Read from the candidate data, 18 November 2026; these counts describe material,
not learner mastery or complete exercise coverage. The independent routes keep
separate progress; their counts must not be added as unique curriculum coverage.

| Current entry | Material verified in source | Boundary |
| --- | --- | --- |
| Vilenkin 5, first part | 24 textbook topics, introductory review and four applications: 29 modules, 87 worked examples and 522 practice/check cards | Author exercises by topic; not every numbered exercise |
| Vilenkin 5, two-part workshop | 134 lessons across 51 textbook points, plus bridges/practice | Topic coverage; not every numbered exercise |
| Vilenkin 6, current first-part textbook | Introductory review + 23 topics; 194 selected cards: 185 numbered exercise cards, eight textbook examples, one question; separate 44-card author supplement on LCM of three or more integers | Selected cards and complete textbook numbers differ; full textbook coverage is false |
| Vilenkin 6, two-part workshop | 194 lessons across 44 points; three projects | Separate older topic route, not a second 194-card textbook bank |
| Peterson 5 | 43 topics in parts 1–2; 131 selected cards | Not every exercise |
| Peterson 6 | 14 topics and 224 cards from part 1 | Parts 2–3 in open #469 are not published scope of this task |

The old Vilenkin 6 thematic edition (27 modules, 81 examples, 475 cards) remains
accessible through explicit legacy/managed/offline entry. These quantities no
longer describe the ordinary public redirect, so they are removed from its
catalogue/search/social descriptions. The source-data count of 194 supersedes
the former static “192 selected tasks”; public copy avoids fragile counts.

Large follow-up priorities remain outside this bounded fix: exact draft/reload
continuation in the older full Vilenkin 5/6 workshop (currently only the
Makarychev 9 branch serializes full lesson drafts); controlled completion of
Peterson 6 parts 2–3 using #469 without replacing current methodology; short
teacher/pupil trials of navigation, interpretation and independent transfer.
The source audits do not establish measurable learning gains.
