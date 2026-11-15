# Скачиваемые тренажёры MathExam

В этой папке лежат статические файлы для скачивания тренажёров: HTML-копии, промпты для адаптации в DeepSeek и ZIP-архивы.

Архивы пересобираются командой:

```bash
node scripts/build-trainer-downloads.mjs
```

Доступные тренажёры и следующие этапы перечислены в `downloads/trainers-manifest.json`.
У новых записей есть поле `adaptation`. Их HTML открывается отдельно, а ZIP содержит тот же HTML, промпт, `README.md`, GIF и статичные кадры.

Собрать только выбранные комплекты можно одной командой:

```bash
node scripts/build-trainer-downloads.mjs --only=oge-task9-equations --only=ege-profil-part-two
```

`--downloads-only` пересобирает файлы для скачивания без записи на публичные страницы. После правки исходной HTML-страницы со школьным навигатором сначала обновите её привязку по действующему порядку в `tools/public_navigator_bindings.py`, затем повторите сборку. Источники и приоритеты следующей партии описаны в [задаче второго этапа](../docs/tasks/TRAINER_DOWNLOADS_STAGE2_20261114.md).

