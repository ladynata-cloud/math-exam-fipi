"""Draw the four OGE examples for the trainer skill animations."""


def draw_equation(card, stage):
    before = (
        '3(x − 2) = 2x + 5',
        '3(x − 2) = 2x + 5',
        '3x − 6 = 2x + 5',
        'x − 6 = 5',
        'x = 11',
    )
    after = (
        '3 · x − 3 · 2',
        '3x − 6 = 2x + 5',
        'x − 6 = 5',
        'x = 11',
        '27 = 27',
    )
    operation = (
        'Умножаем на 3 каждое слагаемое',
        'Раскрываем скобки',
        'Вычитаем 2x из обеих частей',
        'Прибавляем 6 к обеим частям',
        'Подставляем x = 11 в исходное уравнение',
    )
    card.rect((32, 86, 608, 259), fill='white', outline='edge', radius=16)
    card.text(320, 105, before[stage], size=34, bold=True, anchor='mt')
    card.text(320, 157, operation[stage], size=20, fill='muted', anchor='mt')
    card.rect((112, 191, 528, 244), fill='soft', radius=11)
    card.text(320, 202, after[stage], size=32, bold=True, fill='accent', anchor='mt')


def draw_graph(card, stage):
    origin_x, origin_y = 180, 224
    unit = 32

    def point(x, y):
        return origin_x + x * unit, origin_y - y * unit

    for x in range(-4, 6):
        grid_x = point(x, 0)[0]
        card.line([(grid_x, 91), (grid_x, 256)], fill='grid', width=1)
    for y in range(-1, 5):
        grid_y = point(0, y)[1]
        card.line([(48, grid_y), (352, grid_y)], fill='grid', width=1)
    card.arrow((48, origin_y), (352, origin_y), fill='ink', width=2)
    card.arrow((origin_x, 256), (origin_x, 88), fill='ink', width=2)
    card.text(352, 229, 'x', size=17, anchor='rt')
    card.text(166, 89, 'y', size=17, anchor='rt')
    card.text(172, 231, '0', size=15, fill='muted', anchor='rt')
    card.text(212, 231, '1', size=15, fill='muted', anchor='mt')
    card.text(170, 184, '1', size=15, fill='muted', anchor='rt')
    card.text(170, 120, '3', size=15, fill='muted', anchor='rt')
    card.line([point(-1, -1), point(1.5, 4)], fill='accent', width=5)

    if stage >= 2:
        card.arrow(point(0, 1), point(1, 1), fill='blue', width=3)
        card.arrow(point(1, 1), point(1, 3), fill='blue', width=3)
        card.text(196, 199, '1', size=17, fill='blue', anchor='mt')
        card.text(222, 152, '2', size=17, fill='blue')
        card.circle(*point(1, 3), 6, fill='blue', outline='white', width=2)
    if stage >= 1:
        card.circle(*point(0, 1), 6, fill='amber', outline='white', width=2)

    card.rect((375, 95, 609, 254), fill='white', outline='edge', radius=15)
    card.text(394, 113, ('Прямая', 'Пересечение с Oy', 'Шаг и подъём', 'Формула прямой')[stage],
              size=22, fill='muted')
    card.text(394, 156, ('y = kx + b', 'b = 1', 'k = 2 : 1 = 2', 'y = 2x + 1')[stage],
              size=29, bold=True, fill='accent')
    if stage == 1:
        card.text(394, 206, 'Точка (0; 1)', size=22)
    elif stage == 2:
        card.text(394, 206, '(0; 1) и (1; 3)', size=22)
    elif stage == 3:
        card.text(394, 206, 'k = 2,  b = 1', size=22)


def draw_inequality(card, stage):
    card.rect((32, 86, 608, 259), fill='white', outline='edge', radius=16)
    card.text(320, 105, ('−2x + 4 > 0', '−2x > −4', 'x < 2', 'x < 2')[stage],
              size=40, bold=True, fill='ink' if stage < 2 else 'accent', anchor='mt')
    if stage < 3:
        card.text(320, 187, (
            'Оставим слагаемое с x слева',
            'Вычли 4 из обеих частей',
            'Разделили на −2 и поменяли > на <',
        )[stage], size=24, fill='muted', anchor='mt')
        return

    axis_y, bound = 193, 376
    card.arrow((78, axis_y), (563, axis_y), fill='ink', width=3)
    card.arrow((bound - 11, axis_y), (86, axis_y), fill='accent', width=7)
    for x, tick in ((144, '0'), (260, '1'), (bound, '2'), (492, '3')):
        card.line([(x, 186), (x, 200)], width=2)
        card.text(x, 214, tick, size=22, bold=x == bound, anchor='mt')
    card.circle(bound, axis_y, 9, fill='white', outline='accent', width=3)


def draw_river_problem(card, stage):
    if stage == 0:
        card.rect((48, 124, 592, 209), fill='soft', radius=16)
        card.text(320, 91, 'Катер прошёл 12 км и вернулся', size=27, bold=True, anchor='mt')
        card.arrow((88, 157), (553, 157), fill='blue')
        card.arrow((553, 196), (88, 196), fill='accent')
        card.text(124, 132, 'по течению', size=20, fill='blue')
        card.text(518, 171, 'против течения', size=20, fill='accent', anchor='rt')
        card.text(320, 225, 'Течение 2 км/ч  ·  Всего 2 ч 30 мин', size=25, anchor='mt')
        return

    if stage == 1:
        card.text(320, 88, 'x км/ч — собственная скорость, x > 2', size=25, bold=True, anchor='mt')
        card.rect((35, 133, 605, 254), fill='white', outline='edge', radius=12)
        for x in (211, 317, 456):
            card.line([(x, 134), (x, 253)], fill='edge', width=1)
        for y in (171, 211):
            card.line([(36, y), (604, y)], fill='edge', width=1)
        for x, label in ((123, 'Путь'), (264, 'км'), (387, 'км/ч'), (530, 'ч')):
            card.text(x, 143, label, size=20, fill='muted', anchor='mt')
        rows = (
            ('По течению', '12', 'x + 2', '12/(x + 2)'),
            ('Против течения', '12', 'x − 2', '12/(x − 2)'),
        )
        for y, row in zip((181, 220), rows):
            for x, label in zip((123, 264, 387, 530), row):
                card.text(x, y, label, size=20, anchor='mt')
        return

    card.rect((32, 86, 608, 259), fill='white', outline='edge', radius=16)
    lines = (
        ('Время в пути равно t = s : v', '12/(x + 2) + 12/(x − 2) = 2,5', 'Складываем время двух участков'),
        ('5x² − 48x − 20 = 0', '(x − 10)(5x + 2) = 0', 'x > 2  →  x = 10'),
        ('По течению  12 : 12 = 1 ч', 'Против течения  12 : 8 = 1,5 ч', '1 + 1,5 = 2,5 ч  ·  Ответ 10 км/ч'),
    )
    for i, (y, label) in enumerate(zip((111, 166, 220), lines[stage - 2])):
        card.text(320, y, label, size=26 if i == 1 else 23,
                  fill='accent' if i == 1 or stage == 4 and i == 2 else 'ink',
                  bold=i == 1 or stage == 4 and i == 2, anchor='mt')


def build_all(build):
    build('oge-equations', 'ОГЭ №9. Уравнение со скобками', (
        'Умножь на 3 оба слагаемых в скобках.',
        'Замени 3(x − 2) на 3x − 6.',
        'Вычти 2x из обеих частей уравнения.',
        'Прибавь 6 к обеим частям. Получится x = 11.',
        'При x = 11 обе части исходного уравнения равны 27.',
    ), draw_equation)
    build('oge-graphs', 'ОГЭ №11. Формула прямой', (
        'Для прямой ищем формулу вида y = kx + b.',
        'Прямая пересекает ось Oy в точке (0; 1). Значит, b = 1.',
        'На 1 клетку вправо график поднимается на 2 клетки. Значит, k = 2.',
        'Подставь k = 2 и b = 1. Получится y = 2x + 1.',
    ), draw_graph)
    build('oge-inequalities', 'ОГЭ №13. Знак неравенства', (
        'Решим неравенство −2x + 4 > 0.',
        'Вычти 4 из обеих частей. Получится −2x > −4.',
        'При делении на отрицательное число −2 замени > на <. Получится x < 2.',
        'Отметь 2 пустым кружком. Выдели луч слева.',
    ), draw_inequality)
    build('oge-word-problems', 'ОГЭ №21. Задача о катере', (
        'По течению катер прошёл 12 км. Туда и обратно он шёл 2 ч 30 мин. Течение 2 км/ч.',
        'Обозначь собственную скорость через x. Скорости туда и обратно равны x + 2 и x − 2.',
        'Для каждого участка раздели путь на скорость. Сумма времён равна 2,5 ч.',
        'При x > 2 умножь обе части на 2(x² − 4). Из корней подходит только 10.',
        'Проверь сумму 12 : 12 + 12 : 8. Катер затратил 2,5 ч, значит, ответ 10 км/ч.',
    ), draw_river_problem)
