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
    build_graph(build)
    build_derivative(build)
    build_finance(build)
    build_log_inequality(build)
    build_divisibility(build)


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


def build_graph(build):
    steps = (
        'Скачай HTML №22. Пример для сравнения: C = 3 и p = −1.',
        'Попроси добавить пример с C = 3 и p = −2, сохранив прежний банк.',
        'Сохрани копию с окончанием -my.html. После сокращения x ≠ 0 и x ≠ 2.',
        'Точка (2; 2,5) выколота. Прямые y = 3 и y = 2,5 не пересекают график.',
        'Открой без сети: пусто и «2 и 3» не подходят; «2,5 и 3» верно.',
    )

    def fraction(card, x, y, numerator, denominator):
        font = card.font(25)
        width = max(card.draw.textlength(text, font=font)
                    for text in (numerator, denominator)) + 16
        card.text(x + width / 2, y, numerator, 25, anchor='mt')
        card.line([(x, y + 29), (x + width, y + 29)], width=2)
        card.text(x + width / 2, y + 35, denominator, 25, anchor='mt')

    def graph(card):
        # One coordinate unit is exactly 22 pixels on both axes. Draw the
        # canceled expression's graph only at valid x, with the hole marked.
        origin_x, origin_y, scale = 115, 247, 22

        def point(x, y):
            return (origin_x + scale * x, origin_y - scale * y)

        for x in range(-2, 6):
            card.line([point(x, 0), point(x, 5)], 'grid', 1)
        for y in range(6):
            card.line([point(-2, y), point(5, y)], 'grid', 1)
        card.line([point(-2, 0), point(5, 0)], 'muted', 2)
        card.line([point(0, 0), point(0, 5)], 'muted', 2)
        card.text(*point(5, 0), 'x', 14, 'muted', anchor='lt')
        card.text(origin_x - 12, origin_y - scale * 5 - 4, 'y', 14, 'muted', anchor='rt')
        card.text(origin_x - 4, origin_y + 3, '0', 13, 'muted', anchor='rt')
        for x in (2, 4):
            card.text(origin_x + scale * x, origin_y + 3, str(x), 13, 'muted', anchor='mt')
        card.text(origin_x - 5, origin_y - scale * 3, '3', 13, 'muted', anchor='rm')

        for y in (3, 2.5):
            card.line([point(-2, y), point(5, y)], 'amber', 2, dashed=True)
        for start, end in ((-2, -.5), (1 / 3, 5)):
            xs = [start + (end - start) * index / 180 for index in range(181)]
            curve = [point(x, 3 - 1 / x) for x in xs]
            card.line(curve, 'blue', 3)
        card.circle(*point(2, 2.5), 5, 'white', 'blue', 2)

    def draw(card, index):
        card.rect((32, 88, 608, 265), outline='edge', radius=12)
        if index == 0:
            card.text(50, 105, 'ОГЭ №22 · Выколотая точка', 24, bold=True)
            card.text(51, 170, 'y = 3 −', 28, bold=True)
            fraction(card, 174, 142, 'x − 1', 'x² − x')
            card.text(348, 153, 'C = 3, p = −1', 22)
            card.text(348, 203, 'Скачать HTML', 22, 'accent', True)
        elif index == 1:
            card.text(50, 106, 'Запрос + исходный HTML', 24, bold=True)
            card.text(51, 149, 'Добавь пример: C = 3, p = −2.', 23)
            card.text(51, 183, 'Сохрани прежний банк и проверку.', 21)
            card.text(51, 226, 'oge-task22-functions-graphs.html', 20, 'blue')
        elif index == 2:
            card.text(50, 105, 'Сохрани новую копию', 24, bold=True)
            card.text(51, 143, 'oge-task22-functions-graphs-my.html', 19, 'blue')
            card.text(51, 204, 'y = 3 −', 27, bold=True)
            fraction(card, 171, 176, 'x − 2', 'x² − 2x')
            card.text(359, 186, 'x ≠ 0', 27, 'accent', True)
            card.text(359, 224, 'x ≠ 2', 27, 'accent', True)
        elif index == 3:
            card.text(50, 104, 'Сверь график и ограничения', 23, bold=True)
            graph(card)
            card.text(317, 147, 'y = 3 − 1/x', 25, 'blue', True)
            card.text(317, 184, 'Нет общих точек:', 20)
            card.text(317, 217, 'm = 3 или 2,5', 25, 'accent', True)
        else:
            card.text(50, 106, 'При каких m нет пересечений?', 23, bold=True)
            rows = [('Пусто', 'Не засчитывать', 'ink'),
                    ('2 и 3', 'Отклонить', 'red'),
                    ('2,5 и 3', 'Принять', 'accent')]
            for row, (answer, feedback, ink) in enumerate(rows):
                y = 151 + row * 36
                card.text(52, y, answer, 22, ink, True)
                card.text(220, y, feedback, 22, ink)

    build('adapt-graph', 'Как изменить график и ограничения', steps, draw)


def build_derivative(build):
    steps = (
        'Скачай HTML тренажёра производной. Пример: A(1; −2), B(3; 2).',
        'Попроси добавить пример A(1; −2), B(3; 1), x₀ = 2. Приложи HTML.',
        'Сохрани ege-profil-derivative-my.html. Свой рисунок сверь с условием.',
        'Δy = 3, Δx = 2. Производная равна их отношению: f′(2) = 1,5.',
        'Открой копию без сети: пустой ответ и 2 не подходят; 1,5 — верно.',
    )

    def tangent(card):
        # GEN.tangent draws a tangent from its two grid points, with x0 marked.
        # These coordinates fit the native generator: dx=2, dy=3, |k|<=2.5.
        # Keep the same 22-pixel coordinate unit on both axes.
        origin_x, origin_y, scale = 100, 203, 22

        def point(x, y):
            return (origin_x + scale * x, origin_y - scale * y)

        for x in range(-1, 6):
            card.line([point(x, -2), point(x, 3)], 'grid', 1)
        for y in range(-2, 4):
            card.line([point(-1, y), point(5, y)], 'grid', 1)
        card.line([point(-1, 0), point(5, 0)], 'muted', 2)
        card.line([point(0, -2), point(0, 3)], 'muted', 2)
        card.text(*point(5, 0), 'x', 14, 'muted', anchor='lt')
        card.text(origin_x - 7, origin_y - scale * 3 - 1, 'y', 14, 'muted', anchor='rt')
        card.text(origin_x - 5, origin_y + 3, '0', 13, 'muted', anchor='rt')
        for x in (1, 3):
            card.text(origin_x + scale * x, origin_y + 3, str(x), 13, 'muted', anchor='mt')
        for y in (-2, 1):
            card.text(origin_x - 5, origin_y - scale * y, str(y), 13, 'muted', anchor='rm')

        card.line([point(1, -2), point(3, -2), point(3, 1)], 'amber', 2, dashed=True)
        card.line([point((-2.4 + 3.5) / 1.5, -2.4),
                   point((2.8 + 3.5) / 1.5, 2.8)], 'blue', 3)
        for x, y, label, offset in ((1, -2, 'A', (-10, -16)), (3, 1, 'B', (7, -15))):
            card.circle(*point(x, y), 4, 'blue')
            px, py = point(x, y)
            card.text(px + offset[0], py + offset[1], label, 16, 'blue', True)
        card.circle(*point(2, -.5), 4, 'red')
        px, py = point(2, -.5)
        card.text(px + 7, py + 3, 'x₀', 15, 'red', True)

    def draw(card, index):
        card.rect((32, 88, 608, 265), outline='edge', radius=12)
        if index == 0:
            card.text(50, 106, 'ЕГЭ · Касательная по клеткам', 24, bold=True)
            card.text(51, 151, 'A(1; −2), B(3; 2)', 27)
            card.text(51, 195, 'Прежний ответ: 4 : 2 = 2', 23)
            card.text(51, 230, 'Скачать HTML', 21, 'accent', True)
        elif index == 1:
            card.text(50, 106, 'Добавь свой пример', 24, bold=True)
            card.text(51, 150, 'A(1; −2), B(3; 1), x₀ = 2', 25)
            card.text(51, 191, 'Сохрани прежние задачи и разбор.', 21)
            card.text(51, 229, 'ege-profil-derivative.html', 20, 'blue')
        elif index == 2:
            card.text(50, 105, 'Сохрани копию и сверь касательную', 23, bold=True)
            tangent(card)
            card.text(263, 146, 'ege-profil-derivative-my.html', 18, 'blue')
            card.text(263, 186, 'A(1; −2), B(3; 1)', 23)
            card.text(263, 224, 'x₀ = 2', 25, 'red', True)
        elif index == 3:
            card.text(50, 106, 'Пересчитай производную', 24, bold=True)
            card.text(51, 151, 'Δx = 3 − 1 = 2', 25)
            card.text(51, 187, 'Δy = 1 − (−2) = 3', 25)
            card.text(51, 226, 'f′(2) = 3 : 2 = 1,5', 29, 'accent', True)
        else:
            card.text(50, 106, 'Проверь новую копию', 24, bold=True)
            rows = [('Пусто', 'Не засчитывать', 'ink'),
                    ('2', 'Отклонить', 'red'), ('1,5', 'Принять', 'accent')]
            for row, (answer, feedback, ink) in enumerate(rows):
                y = 151 + row * 36
                card.text(52, y, answer, 22, ink, True)
                card.text(220, y, feedback, 22, ink)

    build('adapt-derivative', 'Как изменить задачу о производной', steps, draw)


def build_finance(build):
    steps = (
        'Скачай HTML по финансовым задачам. Открой пример «Пени за задержку».',
        'Попроси заменить срок февральской просрочки с 5 на 4 дня. Приложи HTML.',
        'Сохрани свою копию. Сверь дату, строку таблицы и разбор за февраль.',
        'Сложи обязательные платежи и обе пени. Затем вычти сумму кредита.',
        'Без сети проверь: 375,1 отклоняется, 363,1 принимается. Ответ в тыс. ₽.',
    )

    def draw(card, index):
        card.rect((32, 88, 608, 265), outline='edge', radius=12)
        if index == 0:
            card.text(50, 105, 'Пени за задержку платежа', 24, bold=True)
            card.text(51, 151, 'Февраль: 5 дней, платёж 400 тыс. ₽', 23)
            card.text(51, 190, 'Май: 9 дней, платёж 130 тыс. ₽', 23)
            card.text(51, 228, 'Скачать HTML', 21, 'accent', True)
        elif index == 1:
            card.text(50, 104, 'Что хотите изменить?', 24, bold=True)
            card.text(51, 150, 'В феврале платёж внесли 14-го числа.', 22)
            card.text(51, 185, 'Срок — 10-е, значит просрочка 4 дня.', 22)
            card.text(51, 226, 'Пересчитай таблицу и проверку.', 20, 'blue')
        elif index == 2:
            card.text(50, 105, 'Пересчитай пени в таблице', 24, bold=True)
            card.text(51, 149, 'Февраль: 400 × 0,03 × 4 = 48', 23, 'blue', True)
            card.text(51, 188, 'Май: 130 × 0,03 × 9 = 35,1', 23)
            card.text(51, 227, 'ege-profil-finance-my.html', 19, 'accent')
        elif index == 3:
            card.text(50, 104, 'От всех выплат к переплате', 24, bold=True)
            card.text(51, 149, '1 280 + 48 + 35,1 = 1 363,1', 25)
            card.text(51, 187, '1 363,1 − 1 000 = 363,1', 25, 'accent', True)
            card.text(51, 229, 'Все суммы в тысячах рублей', 19, 'muted')
        else:
            card.text(50, 105, 'Проверь свою копию', 24, bold=True)
            for row, (answer, feedback, ink) in enumerate((
                ('Пусто', 'Не засчитывать', 'ink'),
                ('375,1', 'Отклонить', 'red'),
                ('363,1', 'Принять', 'accent'),
            )):
                y = 150 + row * 36
                card.text(51, y, answer, 22, ink, True)
                card.text(222, y, feedback, 22, ink)

    build('adapt-finance', 'Как изменить финансовую задачу', steps, draw)


def build_log_inequality(build):
    steps = (
        'Скачай HTML практикума. Открой первый вариант «Знак логарифма».',
        'В HTML найди блок engine.js. Замени первое число в массиве с 6 на 8.',
        'Сохрани копию. Проверь условие x > 0, x ≠ 1 и новый аргумент.',
        'При x > 1 из (x+2)/8 ≤ 1 получаем x ≤ 6. Отметь (1; 6].',
        'Без сети проверь границу 6 и итог (1; 6]. Прежняя граница 4 отклоняется.',
    )

    def draw(card, index):
        card.rect((32, 88, 608, 265), outline='edge', radius=12)
        if index == 0:
            card.text(50, 105, 'Знак логарифма · вариант 1', 24, bold=True)
            card.text(51, 151, 'logₓ((x + 2)/6) ≤ 0', 28, 'blue', True)
            card.text(51, 193, 'Исходный ответ: (1; 4]', 22)
            card.text(51, 229, 'Скачать HTML', 20, 'accent', True)
        elif index == 1:
            card.text(50, 105, 'Первый знаменатель в engine.js', 23, bold=True)
            card.text(51, 152, 'Было:  b = [6, 8, 10, 12][v]', 22)
            card.text(51, 191, 'Стало: b = [8, 8, 10, 12][v]', 22, 'blue', True)
            card.text(51, 231, 'Измени только первое число.', 19)
        elif index == 2:
            card.text(50, 105, 'Сверь условие в своей копии', 24, bold=True)
            card.text(51, 151, 'logₓ((x + 2)/8) ≤ 0', 28, 'blue', True)
            card.text(51, 193, 'ОДЗ: x > 0,  x ≠ 1', 22)
            card.text(51, 230, 'При x > 0 аргумент положителен.', 19)
        elif index == 3:
            card.text(50, 105, 'Построй ответ на числовой оси', 24, bold=True)
            card.text(51, 150, 'x > 1 и (x + 2)/8 ≤ 1 дают x ≤ 6.', 22)
            card.text(51, 194, '(1; 6]', 22, 'accent', True)
            card.arrow((160, 206), (573, 206), 'muted', 2)
            card.line([(239, 206), (465, 206)], 'accent', 6)
            card.circle(239, 206, 8, 'white', 'accent', 3)
            card.circle(465, 206, 8, 'accent')
            card.text(239, 226, '1', 19, anchor='mt')
            card.text(465, 226, '6', 19, anchor='mt')
        else:
            card.text(50, 105, 'Проверь интервалы без сети', 24, bold=True)
            card.text(51, 153, 'Границы 0, 1, 4', 21, 'red')
            card.text(289, 153, 'Неверно', 21, 'red', True)
            card.text(51, 188, 'Границы 0, 1, 6', 21, 'accent')
            card.text(289, 188, 'Верно', 21, 'accent', True)
            card.text(51, 224, 'На оси выбран ответ (1; 6].', 21, 'accent')

    build('adapt-log-inequality', 'Как изменить логарифмическое неравенство', steps, draw)


def build_divisibility(build):
    steps = (
        'Скачай HTML. Открой «Число минус сумма его цифр».',
        'В задаче p1 замени 2025 на 2043 и 2026 на 2044. Обнови проверку и разбор.',
        'Сравни остатки N и S(N) при делении на 9. Число 2044 не делится на 9.',
        'После проверки границ реши 1998 + 9x = 2043. Цифра десятков равна 5.',
        'Без сети проверь пример 2050, невозможность в б) и максимум 2059.',
    )

    def draw(card, index):
        card.rect((32, 88, 608, 265), outline='edge', radius=12)
        if index == 0:
            card.text(51, 105, 'Число минус сумма его цифр', 23, bold=True)
            card.text(51, 152, 'N − S(N) = 2025', 28, 'blue', True)
            card.text(51, 193, 'Исходный пример — 2030', 22)
            card.text(51, 230, 'Скачать HTML', 20, 'accent', True)
        elif index == 1:
            card.text(51, 105, 'Что изменить в задаче p1?', 24, bold=True)
            card.text(51, 151, 'Пункты а), в)    2025 → 2043', 23, 'blue')
            card.text(51, 188, 'Пункт б)           2026 → 2044', 23, 'blue')
            card.text(51, 229, 'Обнови условие, проверку и разбор.', 19)
        elif index == 2:
            card.text(51, 105, 'Почему в пункте б) решения нет', 23, bold=True)
            card.text(51, 151, 'N и S(N) дают одинаковый остаток.', 22)
            card.text(51, 192, 'N − S(N) кратно 9.', 24, 'blue', True)
            card.text(51, 229, '2044 = 9 · 227 + 1', 21, 'red')
        elif index == 3:
            card.text(51, 105, 'Найди все подходящие числа', 24, bold=True)
            card.text(51, 151, 'Сначала обоснуй 2044 ≤ N ≤ 2079.', 21)
            card.text(51, 188, '1998 + 9x = 2043   →   x = 5', 24, 'blue', True)
            card.text(51, 230, 'Подходят числа 2050–2059.', 21)
        else:
            card.text(51, 105, 'Проверь ответы без сети', 24, bold=True)
            card.text(51, 150, '2030 · прежний пример отклонён', 22, 'red')
            card.text(51, 187, '2050 · верный пример в пункте а)', 22, 'accent')
            card.text(51, 224, '2059 · максимум в пункте в)', 22, 'accent', True)

    build('adapt-divisibility', 'Как изменить задачу на делимость', steps, draw)
