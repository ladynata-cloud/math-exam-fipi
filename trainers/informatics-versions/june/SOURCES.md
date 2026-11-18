# Источники июньского выпуска

Файлы взяты из дерева MathExam от 30 июня 2026 года, 20:39:53 UTC+3. [Коммит 0d285c6d7](https://github.com/ladynata-cloud/math-exam-fipi/tree/0d285c6d7cafd5f025ebf30ddfc623f6cc8f238e/trainers).

Исходный путь для каждой строки — `trainers/<имя файла>`. Суффикс `.txt` добавлен при сохранении для передачи браузеру как текста. Содержимое каждого оригинала побайтно сверено с Git blob. При сравнении 3 и 30 июня основной файл ОГЭ №1–10 имеет один blob. [Первое добавление ОГЭ, 3 июня](https://github.com/ladynata-cloud/math-exam-fipi/commit/1a6ea4ba40c50108e45541bfe71276415e5f7948). [Первое добавление ЕГЭ №1, 3 июня](https://github.com/ladynata-cloud/math-exam-fipi/commit/a129b85690b5a5f6dc6a611807592a3f790b6296).

Даты Git показывают, когда файлы находились в репозитории. Наталья относит создание июньских упражнений к своей работе с Claude. Git не хранит переписку или идентификатор модели. Рекурсивная лестница имелась уже в мае и включена как часть июньского состояния.

| HTML в исходном дереве | Git blob | SHA-256 |
|---|---|---|
| ege-informatics-19-21-fipi.html | `9fe1dac6a4228918ff89f84b90b110fca86d8a06` | `b910b59cdf3282b944f2415544c458bb8bbb60d4969290fbc753c672b01d522b` |
| ege-informatics-19-21-yandex.html | `b77af7c6e668c2a47d3dc7659abbb36714f7ea44` | `2d7b97622d69f83aca0d26c5325916485e736680bf970bd89feb763d338eee9a` |
| ege-informatics-task1-graphs-trainer.html | `60fa469d29c7848fcf981df0a6e6aeee3b15153b` | `38c150be1e71edd21a51447d04f9d132b38488f7f6f6b6ef7e52303257df1551` |
| ege-informatics-task15-logic-operations-mini.html | `c5156f21142f26968c4a25fc80b003975e57b3f8` | `201285ed96ef7a4b3c9e624188bbcc5a0363113e9635ce7e6e623d9d4d7c12ed` |
| ege-informatics-task15-logic-operations.html | `8a581afd1a1b7f81beb8b58a1b5160546699829a` | `5e4294a7bca052c44e970005fb97c2f320e72ec2958f3de8f0a2f8b224e6d991` |
| fipi-ege-informatics-task1-report.html | `2d9d89ba9404d5b5c72335eb6f8c5983aec2e7b7` | `dd6ab527001a16ca2fa8c3eabfb22c66dd56c60c2aca1e4ceca01e01441b5a77` |
| fipi-oge-informatics-report.html | `dcbaf3fdf83eb064f3ae24feea824ceedc4ff4e4` | `5db1e15cf5376336ec558767f984561e94831a3d35758e5a8847a9b4bf7c54a5` |
| oge-informatics-1-10-tutor.html | `3bce1360e14e9463d702941ee69729de741a9257` | `2f6e1df370e7039107bce7fa51f259a4dd1f33f4d9d9ab0b8491b8f5ef164bec` |
| pitosha-python-trainer.html | `3025d50c48bdf7a24a0eea17900cc962a7ace27b` | `9721cc6774170108be2829f5fa8c3e8c707131f9367a77af6fbe5f3ced924f08` |
| python-for-nested-if-trainer.html | `599bb862c2f5b1092a425ce9a42d2369314e4a21` | `a55ebcd2547ef65561a929abe1205f59e0784ea8382e947844f04a555b731ab0` |
| recursion_ladder_paths.html | `1c1989bf2c0115c9fd8de79f6d5905043a97d5b1` | `460c8a7092f23921c13587821c20a60e79b74b12d8b4de3656bc67dcac6630e7` |
| turing-trainer-polish.html | `1790f154d7c80a18156db2805867b87c17d763db` | `9a8078491f06b34189ae80b57fe07f910436b9846809a1f37d24a3347537afa0` |

## Что воспроизводит проигрыватель

Оригинал исполняется в изолированном фрейме. Данные для одного тренажёра и периода сохраняются в отдельном пространстве имён. Это важно для ОГЭ (`ogeInfoTrainerStats`, `ogeInfoTrainerMode`), логики (ключи `logicTrainer.logicOperations.v1/v2`), графов (`ege_inf_task1_trainer_v1`), рекурсивной лестницы (`mathExamCourseProgress.v1`) и машины Тьюринга (в том числе `turingTrainer.progress`). Исходный файл можно получить независимо от проигрывателя.

Внешние скрипты отсутствуют в перечисленных HTML. В версиях ЕГЭ №1 и «Питоша» ссылки на Google Fonts исключены из сетевой загрузки политикой проигрывателя. Используется резервный шрифт. Игры №19–21 в июньском дереве были статическими подборками условий. Банки заданий сопровождают тренажёры как справочные материалы.

Июньский отчёт ЕГЭ №1 ссылается на 216 локальных иллюстраций в папке `fipi_ege_informatics_task1_assets_2026-06-03`. В зафиксированном дереве папки нет. Сохранён текст исходника для проверки происхождения. В меню запуска отчёт исключён. В интерактивном тренажёре ЕГЭ №1 изображения встроены непосредственно в HTML.
