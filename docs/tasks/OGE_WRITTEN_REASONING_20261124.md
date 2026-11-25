# OГЭ №24–25: письменная мастерская после консультаций Claude

## Identity
- Task: OGE_WRITTEN_REASONING_20261124
- Owner request: «выполни содержательную работу» после восьми консультаций и приоритетов.
- Date: 2026-11-24. Review level: MEDIUM (дополнительный автономный учебный маршрут; без сетевых вызовов, прав доступа, общей доски и изменения существующей истории).
- Base: main eb1203bad1736cd74a0be125ed2860fcb088b7c0; branch: work/oge-written-reasoning-20261124.

## Goal and evidence
Письменная практика дополняет существующие карточки №24 и числовую проверку №25, а не заменяет их. В trainers/oge-course-proof.js уже есть draft(), decorate24(), decorate25() и общий board-state; их не меняем. Вход trainers/oge-course/index.html содержит все 25 номеров. №25 уже содержит семейства «Биссектриса и медиана» и «Равнобедренная трапеция с вписанной окружностью». Консультации Fable q1, q5, q6, q7, q8 — проектные советы, не выпускной аудит. В q8 предложенное доказательство по двум сторонам и углу неверно (угол не между сторонами); заменено условием AB=BC, M — середина AC и доказательством по трём сторонам. q4 содержит лишний корень в вымышленной работе с потерянной ветвью; это следующий отдельный этап. Точный файл рецензий и персональные данные не публикуются.

## Scope
- Новый автономный HTML с шестью задачами: четыре доказательства, две задачи с вычислениями и письменными обоснованиями. Рисунок перед условием, прямые углы по docs/GEOMETRY_DRAWINGS.md. У возвращения к обратному утверждению знак прямого угла появляется только после открытия образца.
- Первая запись (или явное «не знаю») перед доступом к содержательным опорам; отдельные зафиксированные версии, типы открытой помощи, самостоятельная самопроверка, разбор вымышленных ошибок; экспорт JSON вручную. Не обещаем распознать авторство или правильность свободного текста. Состояние только в открытой вкладке, заметное предупреждение перед закрытием. Не создаём параллельный журнал, не присваиваем экзаменационные баллы.
- Один дополнительный вход на странице наглядного курса. Прежние банки, адреса, ключи прогресса, shared-mode, offline ZIP, книга, кабинеты и аналитика неизменны. Новый модуль работает автономно; ссылки возврата требуют интернет. Нет API-вызовов.
- Не в scope: изменение существующего механизма прогресса и синхронизации доски, автоматическая оценка доказательств, подтверждение освоения, массовая замена тренажёров, дальнейшие задачи базы и профиля.

## Acceptance and gates
- Первоначальная запись сохраняется при повторных записях; до неё опоры заблокированы; после опоры новая запись содержит вид помощи. Чек-лист не является проверкой правильности. Экспорт содержит записи и отдельно опоры.
- Проверить шесть задач и соответствие чертежей условиям; 320/390/1280 px, клавиатура, переход между задачами, экспорт, отсутствие запросов, отсутствие изменения старого прогресса. Проверить ссылку курса, CI, canonical/source registry и applicable gates перед выпуском. Новую страницу не объявлять опубликованной до live evidence.
- Выполнены 53 assertions в JS при подготовке (модель записи, сохранение первого текста, блокирование опор, отсутствие дублей, проверка ключей отрезков, координаты квадратов прямых углов, арифметика двух задач №25, сохранение исходной страницы при удалении новой ссылки). Это не браузерная проверка. Реальные ученики, полный CI, внешний аудит exact-head и браузерная приёмка пока не выполнены. Не ослаблять проверки. Review перед выпуском обязателен; не выдавать предыдущую консультацию за PASS. 

## Risk and rollback
Отдельная страница; старые данные не изменяются. Если обнаружена проблема, удалить только новый вход и новый файл обратным коммитом после проверки; экспортированные пользователем записи сохраняются у пользователя. Статусы не утверждают правильность.

## Permissions
Поручение текущего чата разрешает работу и Draft PR; политика docs/OWNER_RELEASE_AUTHORIZATION.md разрешает только проверенный выпуск. До applicable gates и подтверждения базы/головы слияние не выполнять. Никаких платных API. 

## Next independent tasks
1. Смешанная практика: разнести близкие аналоги и перенос. Не называть переносом только перестановку членов sin(2x)=sin x; добавить изменённый общий множитель и перемешать способы. Проверять работу без раскрытия названия метода.
2. ЕГЭ база: четыре задания диагностики. Уточнить процент от нужного целого через задачу, где целое меняется, а не единственное данное число. Существующий #foundation и повтор через сутки первых двух модулей сохранить. Показывать один следующий шаг.
3. Профиль №13: три ученические записи. При потерянной ветви cos x=0 оставить только 19π/12, 23π/12; 5π/2 относится к пропущенной ветви. Проверить все границы k. 
4. Профиль №14: рисунок с данными, затем построение ученика, только после обоснования — знак прямого угла; доказывать принадлежность F плоскости и EF ⟂ плоскости. 
5. Адресные вопросы по шести типам ошибок; не приписывать ошибку по одному результату. Повторение через действующие журналы: отдельно правильность, новизна, помощь, самокоррекция, дата следующего возвращения. 
6. Наблюдения на обычном уроке с одним учеником, без заявлений об эффективности, без персональных данных в отчётах.

## Integration follow-up
- Exact candidate HTML was executed in an isolated JS DOM harness: 14 checks passed (first text remains immutable; help gated; switching restores draft; square shown only after model in converse problem; JSON export preserves attempts and assistance). This is not Chromium.
- Initial CI detected missing public sitemap entry. Added exactly one reviewed seed and one sorted canonical URL, preserved all previous 632 URLs, added page description. Re-run all applicable checks on the resulting head.
- Added `tools/oge-written-practice.browser.cjs`, invoked from existing OGE skill-course CI, for real Chromium 320/390/1280 px, write/help flow, export, old localStorage keys, no external requests. Its result must be obtained from CI; no unrun test claimed as passed.

## Follow-up after failed CI, 2026-11-25
- Public navigator visibility failed because `trainers/oge-written-practice.html` did not satisfy the mandatory direct home-return contract. Added a visible same-tab home link with the existing `data-mathexam-home-link` marker; local file use resolves the link to the public site without an automatic network request.
- OGE skill course failed at the first `innerText` assertion, while the first recorded work was inside closed `<details>`. A loss of data is not established by that failure: the rendering code writes `textContent` from the immutable first record. The browser regression now checks both stored DOM text and visible text after opening the real summary, closes it again, switches tasks with an uncommitted draft, returns, and checks the first record again. JSON export still verifies the original and now also checks the corrected draft and exact attempt count. No assertion is removed or relaxed; no storage behavior or examination mathematics is changed.
- Updated against main `85a9971123fc752390c63f9a59e4bcd1be40378e` by a history-preserving merge of the previous PR head `cd5aab3513ae116c663cad383e1ce887d860f8a5` with the one intervening, disjoint #747 change (seven files); prior source modifications retained. Existing offline/no-network behavior, old learners' progress keys and examination content remain untouched.
- Local source/diff checks only; new exact-head browser/CI and release review must be obtained before publication. No external provider or paid API request.

## Reconciliation with Vilenkin/registry release, 25.11

Previous candidate b9461b7536a89a5464dd68a383b5479e6e6e4f80: 11/12 workflows passed. Public navigator rejected the changed course entrance's historic hash and a fixed 632-page count. The main branch 0bdb4f2031c5c73e10eed8b4eb09dc58e9756036 now includes the extensible sitemap coverage check from #752 and 633 existing public URLs. Compose the two independently reviewed additions, preserve all 633 routes and add one written-practice route (634). Bind only the exact additive course entrance to a new immutable source SHA. Add the standard public navigator script pair to the new page; the core six-task exercise remains self-contained and independent of optional navigation and network. Browser test serves the two exact same-origin JS assets from the checkout and rejects all other requests; existing learning/first-attempt/geometry/export checks remain. No public release or new paid API. Exact candidate CI required.

## 25 November — mobile home-return correction

Exact head c4956d099a3e8af237342c80d5d6fdea2a0b5278: 12/13 workflows succeeded; Public navigator visibility shard 0 failed at 320px on the new page's reachable home-link geometry (`tools/public-home.browser.cjs:98`). The inline anchor did not explicitly meet the common 44px touch-target contract. Give only that anchor a 44px minimum height, flex centering and bounded width. Add the actual bounding-box and actionability assertions to the existing three-width written-practice browser test; leave the independent public-home gate intact. No task data, geometry, export, progress, other links or navigator implementation changes. Recompose on main 99dcbf35ef6d24cb5de73f7f70254457dd5c5aa3 after #757 (six disjoint board-only paths); preserve its exact blobs and all other existing files. New CI required; do not transfer previous passes.
