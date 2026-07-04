# Скачиваемые тренажёры MathExam

В этой папке лежат статические файлы для скачивания тренажёров: HTML-копии, промпты для адаптации в DeepSeek и ZIP-архивы.

Архивы пересобираются командой:

```bash
node scripts/build-trainer-downloads.mjs
```

Список тренажёров первого этапа и TODO для следующих этапов хранится в `downloads/trainers-manifest.json`.

