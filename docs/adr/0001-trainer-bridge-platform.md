# ADR 0001: Trainer Bridge Platform v1

- Status: Proposed
- Date: 2026-07-11
- Decision owners: MathExam
- Scope: board-mirror trainers and the trainer-to-board state protocol

## Context

Сейчас опубликованы два reference board-mirror trainer:

- `negative-numbers-line`;
- `linear-inequalities-stepwise`.

PR #75 был последним ручным mirror-подключением. Текущая модель дублирует protocol handling, origin checks, loop guards, allowlists и trainer-specific smoke logic между trainer, `trainer-board.html`, server и тестами. Она пригодна как совместимый reference implementation, но не должна распространяться на остальные trainers.

Этот ADR описывает целевую Trainer Bridge Platform v1. Существующие два adapter считаются legacy-compatible до миграции в PR A. Третий mirror-trainer не подключается ручным расширением client/server списков.

## Decisions

### 1. Общий Bridge SDK

Целевой API:

```js
const bridge = MathExamBoard.register({
  id,
  version,
  stateSchemaVersion,
  parentOrigin,
  getState,
  applyState,
  subscribe
});
```

`register()` возвращает handle:

- `notifyStateChanged()`;
- `isApplyingRemoteState()`;
- `destroy()`.

Bridge централизует:

- `postMessage`;
- origin validation;
- request/apply state;
- debounce и deduplication;
- loop guard;
- `protocolVersion`;
- diagnostics.

Bridge не записывает `localStorage`, не вызывает учебные действия и не изменяет статистику. Trainer-specific code отвечает только за чтение семантического состояния, безопасный render и подписку на локальные изменения.

### 2. Hydration handshake

Hydration выполняется в фиксированном порядке:

1. Trainer загружает свой UI и отправляет `mathexam:trainer-ready`.
2. Trainer не отправляет initial state до решения board.
3. Если у комнаты есть `latestTrainerState`, board сначала валидирует и применяет его.
4. Если server state отсутствует, board запрашивает state у текущего writer.
5. Исходящие `trainer-state` блокируются до `hydration complete`.
6. После hydration локальные изменения writer могут публиковаться.
7. Remote apply никогда не отправляет идентичный state обратно.

Handshake должен быть устойчив к reload, late join, повторной навигации iframe и смене control holder.

### 3. Origin model

Production не использует `targetOrigin: "*"`.

- Текущий same-origin режим поддерживается.
- Контракт допускает будущие разные origins, например `app.mathexam.space` и `trainers.mathexam.space`.
- `parentOrigin` и `trainerOrigin` задаются явной доверенной конфигурацией.
- Board проверяет `event.source`, `event.origin`, trainer id и текущий iframe.
- Trainer проверяет origin родителя и protocol envelope.
- Неизвестные внешние trainer URLs работают только как `opens-in-board`.

Manual URL остаётся dev/admin-функцией и не включает mirror для неизвестного trainer.

### 4. Registry

Source of truth — version-controlled manifest в git.

Manifest хранит как минимум:

- trainer id;
- canonical URL;
- owner;
- trainer version;
- state schema version;
- board compatibility;
- разрешённые origins;
- доступные capabilities.

Client, server validation и tests не должны иметь отдельные ручные списки trainer ids. First-party mirror разрешён только для одобренных manifest entries.

Коммерческие/private packages позднее потребуют server-verifiable metadata, version, owner и checksum. Эти поля не дают произвольному HTML право на mirror.

### 5. State schema v1

State содержит только JSON-safe данные:

- string;
- finite number;
- boolean;
- `null`;
- array;
- object.

Ограничения:

- serialized size не более 64 KiB;
- depth не более 8;
- array length не более 2000;
- обязательные `protocolVersion`, `trainerVersion` и `stateSchemaVersion`.

Запрещены:

- HTML;
- `innerHTML`;
- DOM snapshots;
- функции;
- `undefined`;
- `NaN` и `Infinity`;
- learner analytics и progress.

SVG и canvas восстанавливаются локальным render из семантических данных. Текущие legacy fields, содержащие HTML, должны быть заменены семантическими полями при миграции reference trainers в PR A.

При schema incompatibility state не применяется:

- создаётся diagnostic;
- board показывает понятный compatibility status;
- ошибка не исчезает молча;
- текущий валидный state не повреждается.

### 6. Statistics contract

Bridge предоставляет remote-apply guard. `applyState()` trainer обязан использовать безопасный render path.

Remote apply не вызывает:

- `save()`;
- `check()`;
- attempts/total/right;
- history;
- streak;
- analytics events.

Гарантия проверяется общим browser smoke до допуска trainer в registry как `board-mirror`.

### 7. Random trainers

Основной mirror-механизм — snapshot уже сгенерированных семантических данных задачи.

Seed:

- необязателен;
- используется для shareable/reproducible variants;
- не заменяет `trainerVersion` и `stateSchemaVersion`;
- не считается гарантией одинаковой генерации между разными trainer versions.

State должен содержать достаточно данных для восстановления уже выбранной задачи без повторной случайной генерации.

### 8. Test harness

Общее Playwright-ядро проверяет:

- teacher → student;
- grant/revoke;
- late join;
- reload;
- localStorage/statistics;
- message loop;
- iframe/source guard;
- origin и schema validation.

Trainer fixture содержит:

- `trainerId`;
- `url`;
- `waitReady()`;
- `makeChange()`;
- `readProbe()`;
- при необходимости `assertEquivalent()`.

Целевой объём fixture:

- простой DOM trainer: 10–15 строк;
- stepwise trainer: 15–25 строк;
- SVG/canvas trainer: 30–60 строк.

Один общий smoke command должен запускать одинаковые platform gates для всех registered mirror trainers.

### 9. PR sequence

#### PR A: Contract and Bridge SDK

- добавить protocol contract и Bridge SDK;
- мигрировать два reference trainers;
- сохранить существующие client/server allowlists как временную защиту.

Risk: несовместимость handshake с текущими комнатами или потеря первого state.

Acceptance: оба reference trainers проходят общий teacher/student, reload, late-join, statistics и loop smoke.

Rollback: вернуть adapters к текущему protocol и отключить SDK registration; server event names и room links остаются совместимыми.

Намеренно не входит: manifest-driven server validation и третий trainer.

#### PR B: Manifest-driven validation

- сделать manifest источником client capabilities;
- добавить безопасную server validation;
- удалить дублирующиеся ручные trainer-id списки только после parity tests.

Risk: рассинхронизация manifest deploy между static site и server.

Acceptance: client/server используют одну schema-derived registry версию, mismatch виден в diagnostics, оба reference trainers продолжают работать.

Rollback: вернуть временные allowlists и оставить manifest только информационным.

Намеренно не входит: новый trainer, marketplace и arbitrary uploads.

#### PR C: Shared Playwright harness and POC

- добавить общее Playwright-ядро;
- добавить fixtures двух reference trainers;
- подключить третий trainer как POC без изменений board/server core.

Risk: harness окажется trainer-specific или пропустит loop/statistics regression.

Acceptance: третий trainer требует только manifest entry, SDK adapter и компактную fixture; один smoke command проверяет все три trainers.

Rollback: убрать POC entry и adapter, сохранив SDK и reference fixtures.

Намеренно не входит: массовая миграция generators.

#### PR D: Snapshot-first generator migration

- мигрировать первую партию random generators;
- использовать seeded helper только как дополнительную возможность.

Risk: неполный snapshot воспроизводит другую задачу или schema становится слишком большой.

Acceptance: reload и late join восстанавливают ту же задачу без повторной генерации; size/depth limits соблюдены.

Rollback: вернуть trainers в `opens-in-board` без удаления их обычного режима.

Намеренно не входит: все trainers сразу и persistence вне текущего MVP.

## Platform acceptance criterion

Платформа считается доказанной, если третий и четвёртый обычные trainers:

- подключаются без изменений `trainer-board.html`;
- подключаются без изменений `board-server/index.js`;
- не требуют нового уникального harness;
- требуют максимум несколько десятков строк trainer-specific code;
- проходят один общий smoke command.

До выполнения этого критерия новые ручные mirror-подключения не принимаются как platform-complete.

## Deferred commercial scope

Пока не реализуются:

- workspaces;
- billing;
- marketplace;
- arbitrary HTML uploads;
- student accounts;
- PostgreSQL/Redis migration.

Эти функции рассматриваются после закрытой беты и подтверждённого спроса. Они не должны усложнять Bridge SDK v1 заранее.

## Consequences

Положительные последствия:

- единый protocol и lifecycle;
- явная security boundary;
- меньше client/server/test изменений для нового trainer;
- повторяемая проверка statistics и loop safety;
- понятная миграция random trainers.

Цена решения:

- два reference trainers нужно мигрировать повторно с legacy state fields;
- registry и schema versioning становятся обязательной дисциплиной;
- третий trainer откладывается до готовности PR A–C.

## Risks and rollback

Каждый PR A–D обязан в своём описании явно указывать:

- риск;
- критерий приёмки;
- rollback;
- что намеренно не входит.

Rollback выполняется на уровне конкретного PR и capability/manifest entry. Форматы room links, teacher/student permissions и существующие non-mirror trainers не должны зависеть от внедрения платформы.
