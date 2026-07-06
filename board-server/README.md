# Mathexam Board Server

MVP-сервер для режима `v2-lite`: учитель пишет на доске, ученик открывает ссылку и видит доску в реальном времени. Ученик пока только смотрит.

## Установка локально

```bash
cd board-server
npm install
```

## Запуск локально

```bash
npm start
```

По умолчанию сервер запускается на `http://localhost:3001`.

Можно изменить порт:

```bash
PORT=4000 npm start
```

## Выкладка на Render

В корне репозитория есть `render.yaml`. Он описывает отдельный web service:

- имя сервиса: `mathexam-board-server`
- рабочая папка: `board-server`
- build command: `npm install`
- start command: `npm start`
- health check: `/health`

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
CORS_ALLOWED_ORIGINS=https://mathexam.space,http://localhost:3000 npm start
```

## Как открыть доску локально

1. Запустите сервер.
2. Откройте `trainers/trainer-board.html` из проекта или страницу на GitHub Pages.
3. В блоке “Общая доска” укажите адрес сервера, например `http://localhost:3001`.
4. Нажмите “Создать комнату”.
5. Скопируйте ссылку ученика.

## Проверка в двух вкладках

1. Откройте teacher-вкладку с `trainers/trainer-board.html`.
2. Создайте комнату.
3. Скопируйте student-ссылку.
4. Откройте student-ссылку во второй вкладке или другом браузере.
5. Нарисуйте линию у учителя.
6. Убедитесь, что ученик видит линию.
7. Проверьте маркер, ластик, текст, очистку листа, новый лист, переключение листов и фон.
8. Обновите student-вкладку: она должна получить актуальное состояние комнаты.
9. Убедитесь, что student не может рисовать и очищать доску.

## Реализованные события Socket.IO

- `room:create`
- `room:join`
- `room:state`
- `room:error`
- `board:stroke-start`
- `board:stroke-points`
- `board:stroke-end`
- `board:text-add`
- `board:clear-page`
- `board:page-add`
- `board:page-switch`
- `board:bg-change`
- `board:snapshot`
- `board:trainer-url-change`

## Ограничения MVP

- Комнаты хранятся только в памяти сервера.
- Нет базы данных и долговременного хранения уроков.
- Нет регистрации и личного кабинета.
- Нет роли “ученик-писатель”.
- Нет совместного редактирования тренажёра.
- Нет чата, видеосвязи, CRM и сложной админки.

Следующий разумный этап: добавить срок жизни комнат, аккуратное удаление старых комнат и простую страницу статуса сервера.
