# ОГЭ «Шины»: вернуть анимацию в явное поле зрения

## Identity
- Task: TIRES-VIS-01, прямое поручение владельца 26.11.2026.
- Base: main 0dc629ff055f99fa0409b363ecbc24148807a05f; branch fix/oge-tires-visible-roll-20261126.
- Review: MEDIUM (узкое изменение представления).
- Authorization: [standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md).

## Goal and evidence
В задаче 5 вернуть исходную SVG-анимацию одного оборота двух колёс непосредственно под условием. В исходном HTML drawAnimScene/rollAnim/finishAnim существуют, но practical-discovery.js перемещал .anim-block в закрытую .pd-original-steps внутри скрытой .pd-panel. Не копировать модель. Не раскрывать точный ответ обычным запуском анимации: существующий #anim-result сохраняется в оригинальном разделе помощи; при явном открытии помощи результат по-прежнему доступен.

## Scope
- practical-discovery.js: перемещение существующего DOM-узла, нейтральная инструкция, отделение исходного числового результата.
- Две существующие тестовые программы (DOM и Chromium): видимость до открытия помощи, единственность модели, 21 вариант, прокатка и сброс, отсутствие выдачи ответа и изменения результата/черновика, доступность прежнего объяснения. Ранее выпущенный ZIP не изменяется; прежние offline проверки сохраняются.
- Не менять inline engine, формулы, банк, IDs, storage, проверяющие алгоритмы, режим доски, опубликованные ZIP и книги, другие страницы и ветки.

## Checks
- Проверить actual diff, syntax, DOM regression, действующие OGE 1–5 interactive discoveries, применимые CI exact head/composition.
- Реальный Chromium 320/360/1280 online, сохранённые offline проверки старого комплекта; проверить публичную страницу после release. Не переносить результаты старых SHA.
- Внешний аудит именно данной правки не запрошен; серия вопросов Fable относится к будущей визуальной педагогике. Реальная ученическая апробация не выполнена.

## Rollback
Revert only this scoped commit/PR; learner data and prior ZIP unchanged. No new dependency or API.

## Execution
Исходный код обследован, синтаксис трёх новых текстов проверен в V8 без исполнения браузерного DOM. Full checkout, git diff --check, JSDOM, Chromium и CI не объявляются пройденными до фактического результата. Publication only after all applicable checks and fresh main/head.
