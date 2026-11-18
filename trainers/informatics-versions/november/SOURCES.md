# Ноябрьская фиксация · 19 ноября 2026

Учебный HTML сохранён для воспроизведения статьи. Для двух игровых подборок локальный внешний файл informatics-game-practice.js встроен в HTML с запуском после разбора документа. Источник привязан к версии Git в PR #677. Проигрыватель блокирует сетевые ресурсы и выделяет каждой версии отдельный прогресс.

| Источник в trainers/ | SHA-256 HTML | SHA-256 копии |
|---|---|---|
| oge-informatics-1-10-tutor.html | 51207ab0604989506d4cb1e1f9a374579fbdc0c6460839031e04678d38378dcc | 51207ab0604989506d4cb1e1f9a374579fbdc0c6460839031e04678d38378dcc |
| ege-informatics-task1-graphs-trainer.html | 7cbb16ce0edbee6c369b0348968dfffd4846a1cbb15b7120528d4c9323151004 | 7cbb16ce0edbee6c369b0348968dfffd4846a1cbb15b7120528d4c9323151004 |
| ege-informatics-task15-logic-operations.html | 4644f2544680547e1cac55b65d80c2a60a54c5277a18505a3ca3b4155fdb1231 | 4644f2544680547e1cac55b65d80c2a60a54c5277a18505a3ca3b4155fdb1231 |
| ege-informatics-task15-logic-operations-mini.html | 4da279a0c11fb3fda52b94821a7e3fe37d0c28619c7dfe6a5c88e30ee941d35e | 4da279a0c11fb3fda52b94821a7e3fe37d0c28619c7dfe6a5c88e30ee941d35e |
| ege-informatics-19-21-fipi.html | 40cfc62333123168de23d579d7a44be06f77efc86e94ae2da68a5b4fcf0a5279 | 14613fd4feb7d3c2075cd247579aba547df596fc85833713fe8434d00f5f5efc |
| ege-informatics-19-21-yandex.html | a88520e9cda249dca404ae24911fda536049a7c5fe1abdbfd8a3afa0325f72a3 | b359c595bcc72c0e2600a63b3987e3c05f17440fcccd1d86c7c5871ad3636690 |
| fipi-oge-informatics-report.html | 090502ec8739b89fd0144390f9c91bcc55b36c6f4966c5af26fa1d49c43af5a3 | 090502ec8739b89fd0144390f9c91bcc55b36c6f4966c5af26fa1d49c43af5a3 |
| recursion_ladder_paths.html | 4dd62b2aef21c5c75f4a442d036806a23bc2425767f034ec649012596e5b5938 | 4dd62b2aef21c5c75f4a442d036806a23bc2425767f034ec649012596e5b5938 |
| turing-trainer-polish.html | 50cbf02568b8b789a7c5b105cf024028a49d3f09851b8f5585fc3bbbb3e98e77 | 50cbf02568b8b789a7c5b105cf024028a49d3f09851b8f5585fc3bbbb3e98e77 |
| pitosha-python-trainer.html | 5cdb8e84de67c93ec7328fc6f52b392a32c14c5196b88a8c270ed75a27234409 | 5cdb8e84de67c93ec7328fc6f52b392a32c14c5196b88a8c270ed75a27234409 |
| python-for-nested-if-trainer.html | 2baea3e04fb8d615f8f89b0fe4249d32a46249a42aaf511723d4935ccca13160 | 2baea3e04fb8d615f8f89b0fe4249d32a46249a42aaf511723d4935ccca13160 |

## Автономная демонстрация модульного курса №15

Точные исходники опубликованы в [Git от 3 июня](https://github.com/ladynata-cloud/math-exam-fipi/tree/7bf4f41b22c73c65d8e231c929751e5f1714e9d6/trainers/logic-trainer). Учебное дерево assets `657ab238b69e3e252bebdd5dafaa99177b34a54a` совпадает в обеих редакциях. Демонстрационный HTML `logic-course.html.gz` имеет SHA-256 `3051991810bc48882ab1272a3c04f98b0b76603513e1753ead9c31aba674d144`. Встроены CSS, три модуля JS и шрифты KaTeX WOFF2. При упаковке удалены внешний импорт Google Fonts, резервные WOFF/TTF и ссылки за пределы курса. Два обращения маршрутизатора к URL адаптированы для hash-навигации внутри изолированной рамки. Математические данные общие для обоих выпусков. Входная диагностика показала десять вопросов в обоих экземплярах без запросов во внешнюю сеть.

Два HTML (логический курс и подборка Яндекса) упакованы в gzip без изменения байтов. В таблицах указаны SHA-256 распакованного HTML.
