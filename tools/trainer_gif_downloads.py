"""Five frames for adapting a downloaded MathExam trainer."""

from build_trainer_skill_gifs import wrap


def build_all(build):
    steps = (
        'Открой «Скачать и изменить» и скачай HTML или комплект ZIP.',
        'Напиши одно изменение. Скопируй готовый промпт для DeepSeek.',
        'Вставь промпт в DeepSeek и приложи скачанный HTML.',
        'Сохрани полученный HTML под новым именем и открой в браузере.',
        'Проверь пустой, неверный и верный ответы на новом файле.',
    )

    def draw(card, index):
        def button(x, y, w, label):
            card.rect((x, y, x + w, y + 39), fill='accent', radius=8)
            card.text(x + w // 2, y + 9, label, 17, 'white', True, 'mt')

        def heading(label):
            card.text(49, 105, label, 25, bold=True)

        card.rect((32, 88, 608, 258), outline='edge', radius=12)
        if index == 0:
            heading('Скачать и изменить')
            button(49, 149, 283, 'Скачать тренажёр HTML')
            card.text(51, 214, 'oge-task9-equations.html', 21, 'blue')
        elif index == 1:
            heading('Что хотите изменить?')
            card.rect((49, 142, 591, 183), outline='edge', radius=7)
            card.text(62, 152, 'Сделать текст задачи крупнее', 20)
            button(49, 201, 359, 'Скопировать промпт для DeepSeek')
        elif index == 2:
            heading('Новое сообщение в DeepSeek')
            for row, line in enumerate(wrap(card.draw, 'Сделай текст задачи крупнее. Сохрани проверку ответов.', card.font(20), 540)):
                card.text(51, 153 + row * 25, line, 20)
            card.text(51, 213, 'Прикреплён: oge-task9-equations.html', 19, 'blue')
        elif index == 3:
            heading('Сохранить копию')
            card.text(50, 148, 'oge-task9-equations-my.html', 22, 'blue')
            card.line([(50, 182), (590, 182)], fill='edge', width=1)
            card.text(50, 207, '3(x + 8) − 2(x − 8) = 8', 29, bold=True)
        else:
            heading('Проверить ответ к уравнению')
            card.text(52, 150, 'Пусто', 20, bold=True)
            card.text(171, 150, 'Предложить ввести ответ', 20)
            card.text(52, 183, '32', 20, 'red', bold=True)
            card.text(171, 183, 'Отклонить', 20, 'red')
            card.text(52, 216, '−32', 20, 'accent', bold=True)
            card.text(171, 216, 'Принять', 20, 'accent')

    build('adapt-trainer', 'Как изменить скачанный тренажёр', steps, draw)
    build_geometry(build)


def build_geometry(build):
    steps = (
        'Скачай HTML тренажёра №17. Выбери задачу на площадь ромба.',
        'Попроси добавить пример с диагоналями 12 и 8. Приложи HTML к запросу.',
        'Сохрани новую копию и сверь длины диагоналей в условии и на рисунке.',
        'Пересчитай ответ: половина произведения диагоналей равна 48.',
        'Открой копию без сети. Проверь, что 42 отклоняется, а 48 принимается.',
    )

    def rhombus(card, x, y, half_width, half_height, d1, d2):
        corners = [(x - half_width, y), (x, y - half_height),
                   (x + half_width, y), (x, y + half_height)]
        card.polygon(corners, 'soft', 'ink', 2)
        card.line([corners[0], corners[2]], 'blue', 3)
        card.line([corners[1], corners[3]], 'amber', 3)
        card.text(x + half_width - 4, y + 10, str(d1), 20, 'blue', True, 'rt')
        card.text(x + 8, y - half_height + 7, str(d2), 20, 'amber', True)

    def draw(card, index):
        card.rect((32, 88, 608, 258), outline='edge', radius=12)
        if index == 0:
            card.text(51, 111, 'ОГЭ №17 · Площадь ромба', 24, bold=True)
            card.text(51, 158, 'Диагонали 14 и 6', 21)
            card.text(51, 207, 'Скачать тренажёр HTML', 20, 'accent', True)
            rhombus(card, 477, 173, 84, 36, 14, 6)
        elif index == 1:
            card.text(51, 109, 'Что хотите изменить?', 24, bold=True)
            card.rect((51, 147, 590, 199), outline='edge', radius=7)
            card.text(65, 165, 'Добавь ромб с диагоналями 12 и 8.', 22)
            card.text(51, 224, 'Приложи скачанный HTML.', 20, 'accent', True)
        elif index == 2:
            card.text(51, 110, 'Диагонали в условии и на рисунке', 23, bold=True)
            rhombus(card, 184, 191, 75, 50, 12, 8)
            card.text(323, 158, 'd₁ = 12', 25, 'blue', True)
            card.text(323, 204, 'd₂ = 8', 25, 'amber', True)
        elif index == 3:
            card.text(51, 110, 'Проверь формулу площади', 24, bold=True)
            card.text(51, 162, 'S = d₁ · d₂ : 2', 29, 'ink', True)
            card.text(51, 208, 'S = 12 · 8 : 2 = 48', 27, 'accent', True)
        else:
            card.text(51, 110, 'Проверка в локальной копии', 24, bold=True)
            rows = [('Пусто', 'Предложить ввести ответ', 'ink'),
                    ('42', 'Отклонить', 'red'), ('48', 'Принять', 'accent')]
            for i, (answer, feedback, ink) in enumerate(rows):
                y = 153 + i * 34
                card.text(52, y, answer, 21, ink, True)
                card.text(173, y, feedback, 21, ink)

    build('adapt-geometry', 'Как изменить геометрический тренажёр', steps, draw)
