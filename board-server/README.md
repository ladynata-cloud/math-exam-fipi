# Mathexam Board Server

MVP-сервер для режима `v2-lite`: учитель пишет на доске, ученик открывает ссылку и видит доску в реальном времени. По умолчанию ученик только смотрит, но учитель может временно передать ему ход.

## Установка локально

```bash
cd board-server
npm install
```

## Запуск локально

```bash
npm start
```

По умолчанию сервер запускается на `http://localhost:3000`.

Можно изменить порт:

```bash
PORT=4000 npm start
```

Сервер слушает `0.0.0.0`, чтобы его можно было запускать в облачных контейнерах.

## Деплой на Amvera

Для Amvera подготовлен корневой `Dockerfile`. Это безопасный вариант для текущего репозитория, потому что backend лежит не в корне, а в папке `board-server/`. Dockerfile собирает и запускает именно `board-server`, не трогая статический сайт.

В корне репозитория есть amvera.yml, он сообщает Amvera, что контейнер слушает порт 3000.

Рабочий адрес Amvera:

```text
https://mathexam-board-ladynata.amvera.io
```

Проверка рабочего сервера:

```text
https://mathexam-board-ladynata.amvera.io/health
```

Если доска не используется, приложение на Amvera можно остановить, чтобы не тратить баланс.

Dockerfile сохраняет структуру `/app/board-server` и кладёт manifest в
`/app/trainers/board-compat.json`, поэтому server loader использует один и тот
же путь относительно `__dirname` локально и в контейнере.

Что делает Dockerfile:

```bash
npm install
npm start
```

Порядок деплоя:

1. Создайте новый проект в Amvera Cloud.
2. Подключите GitHub-репозиторий `ladynata-cloud/math-exam-fipi` или загрузите проект архивом.
3. В типе запуска выберите Dockerfile / Docker-контейнер, если Amvera предлагает несколько вариантов.
4. Убедитесь, что используется Dockerfile из корня репозитория.
5. Добавьте переменную окружения:

```bash
CORS_ALLOWED_ORIGINS=https://mathexam.space,http://localhost:3000,http://127.0.0.1:3000
```

6. Если Amvera просит порт приложения, укажите `3000`. В коде также поддерживается переменная `PORT`.
7. Запустите деплой.
8. После деплоя проверьте endpoint:

```text
https://ВАШ-АМВЕРА-ДОМЕН/health
```

Ожидаемый ответ:

```json
{"ok":true,"rooms":0}
```

После этого откройте:

```text
https://mathexam.space/trainers/trainer-board.html
```

В блоке “Общая доска” вставьте адрес сервера без `/health`, например:

```text
https://ВАШ-АМВЕРА-ДОМЕН
```

Нажмите “Создать комнату” и скопируйте ссылку ученика.

Если Amvera в выбранном режиме требует, чтобы backend лежал в корне проекта, используйте один из безопасных вариантов:

- оставить текущий Dockerfile в корне репозитория: он уже запускает именно `board-server`;
- создать отдельный репозиторий только из содержимого папки `board-server/`;
- загрузить в Amvera архив, где содержимое `board-server/` лежит в корне.

## Выкладка на Render

В корне репозитория есть `render.yaml`. Он описывает отдельный web service:

- имя сервиса: `mathexam-board-server`
- build context: корень репозитория
- build command: `npm --prefix board-server install`
- start command: `npm --prefix board-server start`
- health check: `/health`

Manifest находится вне `board-server`, поэтому `rootDir` намеренно не задан.
Build filter следит за `board-server/**`, `trainers/board-compat.json` и
`render.yaml`: изменение registry запускает backend deploy и manifest доступен
процессу по тому же пути относительно `__dirname`, что и при локальном запуске.

Порядок действий:

1. Откройте Render.
2. Создайте новый Blueprint / Web Service из GitHub-репозитория `ladynata-cloud/math-exam-fipi`.
3. Render прочитает `render.yaml` и создаст сервис `mathexam-board-server`.
4. После деплоя откройте URL сервиса, например `https://mathexam-board-server.onrender.com/health`.
5. Если виден JSON с `ok: true`, сервер работает.
6. На странице `https://mathexam.space/trainers/trainer-board.html` вставьте URL сервера без `/health`, например `https://mathexam-board-server.onrender.com`.
7. Нажмите “Создать комнату” и скопируйте ссылку ученика.

## CORS

По умолчанию разрешены:

- `http://localhost`
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`
- `https://mathexam.space`

Для хостинга можно задать список явно:

```bash
CORS_ALLOWED_ORIGINS=https://mathexam.space,http://localhost:3000,http://127.0.0.1:3000 npm start
```

## Registry зеркальных тренажёров

Источник registry: `trainers/board-compat.json`. Сервер загружает и строго
проверяет его при старте, строит неизменяемую mirror-проекцию и вычисляет
детерминированный SHA-256 digest. Каталоговые поля не входят в digest.

По умолчанию loader открывает `../trainers/board-compat.json` относительно
`board-server/index.js`. Для отдельного runtime artifact можно задать путь без
изменения кода:

```bash
TRAINER_REGISTRY_PATH=/run/config/board-compat.json npm start
```

Относительное значение `TRAINER_REGISTRY_PATH` разрешается относительно папки
server-модуля, а не `process.cwd()`. Абсолютный путь никогда не публикуется.

Публичный endpoint:

```text
GET /api/trainer-registry
```

Для валидного manifest он возвращает `200`, `schemaVersion`, `digest` и только
безопасную mirror-проекцию. Для missing/invalid manifest он возвращает `503`,
пустой список и безопасный error code. Оба ответа используют
`Cache-Control: no-store`.

`/health` остаётся обратно совместимым и дополнительно возвращает:

- `registryLoaded`;
- `registrySchemaVersion`;
- `registryDigest`;
- `registrySource` (`env` или `bundled-default`);
- `registryEntryCount`;
- `registryError`.

Invalid registry не останавливает комнаты, presence, canvas или control, но
fail-closed отключает bridge и legacy trainer-state mirror.

Deployment checklist:

1. Убедиться, что `/health` показывает `registryLoaded:true` и две mirror entries.
2. Получить `/api/trainer-registry` и проверить `Cache-Control: no-store`.
3. Сверить digest endpoint с `/health`.
4. Проверить CORS для `https://mathexam.space` и локального origin.
5. Выполнить smoke обоих reference mirror trainers и grant/revoke.
6. При `registryLoaded:false` не включать client cutover и проверить `registryError`.

## Как открыть доску локально

1. Запустите сервер.
2. Откройте `trainers/trainer-board.html` из проекта или страницу на GitHub Pages.
3. В блоке “Общая доска” укажите адрес сервера, например `http://localhost:3000`.
4. Нажмите “Создать комнату”.
5. Скопируйте ссылку ученика.

## Проверка в двух вкладках

1. Откройте teacher-вкладку с `trainers/trainer-board.html`.
2. Создайте комнату.
3. Скопируйте student-ссылку.
4. Откройте student-ссылку во второй вкладке или другом браузере.
5. Нарисуйте линию у учителя.
6. Убедитесь, что ученик видит линию.
7. Убедитесь, что student по умолчанию не может рисовать.
8. Нажмите “Передать ход” у teacher.
9. Убедитесь, что student может рисовать на доске и управлять текущим тренажёром.
10. Нажмите “Вернуть ход” у student или “Забрать ход” у teacher.
11. Убедитесь, что student снова не может рисовать.
12. Проверьте маркер, ластик, текст, очистку листа, новый лист, переключение листов и фон.
13. Обновите student-вкладку: она должна получить актуальное состояние комнаты.

## Реализованные события Socket.IO

- `room:create`
- `room:join`
- `room:state`
- `room:error`
- `control:grant`
- `control:revoke`
- `control:release`
- `control:changed`
- `board:stroke-start`
- `board:stroke-points`
- `board:stroke-end`
- `board:text-add`
- `board:clear-page`
- `board:page-add`
- `board:page-delete`
- `board:page-switch`
- `board:page-state`
- `board:bg-change`
- `board:stroke-undo`
- `board:stroke-redo`
- `board:snapshot`
- `board:trainer-url-change`
- `board:trainer-state-change`

## Матрица прав

`control` хранится как `participantId`, а не как роль. Новая комната создаётся с `control` у teacher participant и `controlVersion:0`.

- writer = текущий control participant.
- structure = teacher-only.
- `teacher` может писать по умолчанию, передать ход student, забрать ход обратно и менять структуру урока в любой момент.
- `student` получает capability `draw:true` и `controlTrainer:true`, но право писать появляется только временно, когда `room.control === student.id`.
- Student writing не открыт по роли: без текущего `control` writer-события student тихо отбрасываются.
- Листы, фон, смена тренажёра, initial seed / legacy snapshot остаются teacher-only.
- Co-teacher, groups, hands/openBoard и AI-участники не входят в этот PR и остаются будущими этапами.

## Модель состояния доски

После первичного seed сервер становится владельцем `room.pages`. Новые участники получают актуальный `publicState(room)` из памяти сервера и больше не ждут клиентский `board:snapshot` от уже подключённого учителя.

- Новая комната стартует с `initialized:false`, `stateVersion:0`, `control:<teacher participantId>` и `controlVersion:0`.
- Первый валидный `board:snapshot` от teacher используется как initial seed, выставляет `initialized:true` и увеличивает `stateVersion`.
- После PR #67 `board:snapshot` используется как initial seed или legacy fallback.
- Для `proto:2` clients routine snapshots после `initialized:true` не перезаписывают `room.pages`.
- Legacy clients без `proto:2` всё ещё могут применять snapshot как fallback: их snapshot после инициализации применяется и ретранслируется.
- `page-add`, `page-delete`, `undo` и `redo` дополнительно отправляют synthesized `board:snapshot` для legacy clients.
- `clear-page`, `bg-change` и `page-switch` не требуют такого bridge, потому что старый клиент понимает эти события нативно.
- `stateVersion` растёт после server-applied board mutations и отдаётся в `publicState`.
- `control` и `controlVersion` также отдаются в `publicState`.

Server-applied events:

- `board:stroke-end`
- `board:text-add`
- `board:clear-page`
- `board:page-add`
- `board:page-delete`
- `board:page-switch`
- `board:bg-change`
- `board:stroke-undo`
- `board:stroke-redo`
- `board:trainer-state-change` for the current writer
- `board:snapshot` only as initial seed or legacy fallback
- `board:trainer-url-change` stays teacher-only because it changes lesson structure

Relay-only events:

- `board:stroke-start`
- `board:stroke-points`

New compatibility events:

- `board:stroke-undo` removes the last object authored by the current participant on the selected page.
- `board:stroke-redo` restores the last undo entry for an existing page id.
- `board:page-delete` deletes or replaces a page and clears redo entries for that page id.
- `board:page-state` broadcasts an authoritative page after undo/redo.

Control events:

- `control:grant` is teacher/moderator-only and passes writer control to the student participant.
- `control:revoke` is teacher/moderator-only and returns writer control to the teacher participant.
- `control:release` is available only to the current non-moderator holder, so the student can return the turn.
- `control:changed` broadcasts `{ control, controlVersion }` after every accepted control change.
- If the current student holder disconnects and `onlineCount` becomes `0`, control automatically returns to teacher.

`requireWriter` now checks `canWrite(room, participant)`: the participant must be the current `room.control`. `requireStructure` remains teacher-only. Policies, hand queue, open group board, co-teacher and AI participants are intentionally left for later PRs.

## Метаданные объектов доски

Объекты доски могут содержать служебные поля:

- `objectId` - стабильный идентификатор объекта доски.
- `authorId` - историческая метка участника, создавшего объект.
- `authorRole` - историческая роль автора: `teacher`, `student` или `bot`.
- `layerId` — идентификатор слоя, сейчас по умолчанию `participant:<authorId>`.
- `createdAt` - ISO-время создания объекта.

Сервер не доверяет клиентским `authorId`, `authorRole`, `layerId` и `createdAt` как источнику прав. Live-события доски всегда штампуются реальным socket-участником, который прошёл серверную проверку.

Snapshot-нормализация сохраняет валидную историческую metadata существующего participant, но legacy-объекты без metadata и fake/unknown `authorId` перештамповывает владельцем комнаты. Это нужно для совместимости с будущими слоями, группами и ИИ-участником. Запись ученика появляется только временно через `control`: права по-прежнему определяются серверными проверками, токенами комнаты и текущим control participant.

После PR #67 snapshot-перезапись больше не является штатным механизмом для `proto:2` clients: сервер защищает `room.pages` после initial seed. Этот PR добавляет только передачу хода между teacher и student; группы, открытая групповая доска, co-teacher, очередь рук и AI не входят в scope.

## Ограничения MVP

- Комнаты хранятся только в памяти сервера.
- Нет базы данных и долговременного хранения уроков.
- Нет регистрации и личного кабинета.
- Нет постоянной роли “ученик-писатель”: запись ученика работает только на время control.
- Нет совместного редактирования структуры урока: листы, фон, смена тренажёра и initial seed остаются teacher-only.
- Нет чата, видеосвязи, CRM и сложной админки.

Следующие этапы вне этого PR: policies/control model для нескольких участников, очередь рук, группы, co-teacher и AI.
