"""Arithmetic scenes for short animated worked examples."""


def division(card, stage):
    digits = [65, 101, 137, 173]
    card.rect((46, 85, 300, 260), fill='white', outline='edge', radius=9)
    for x in range(47, 300, 36):
        card.line([(x, 91), (x, 254)], fill='grid', width=1)
    for y in range(92, 256, 32):
        card.line([(49, y), (297, y)], fill='grid', width=1)

    if stage == 0:
        card.rect((49, 95, 154, 127), fill='soft', radius=5)
    elif stage == 1:
        card.rect((200, 129, 236, 159), fill='soft', radius=5)
    elif stage == 2:
        card.rect((119, 160, 191, 192), fill='soft', radius=5)
    elif stage == 3:
        card.rect((237, 129, 271, 159), fill='soft', radius=5)
    else:
        card.rect((200, 129, 272, 159), fill='soft', radius=5)

    def row(number, first_column, y, color='ink'):
        for index, digit in enumerate(number, start=first_column):
            card.text(digits[index], y, digit, size=25, fill=color, anchor='mt')

    row('1344', 0, 100)
    card.line([(192, 91), (192, 247)], width=3)
    card.line([(192, 124), (281, 124)], width=3)
    card.text(219, 100, '1', size=25, anchor='mt')
    card.text(254, 100, '6', size=25, anchor='mt')

    if stage >= 1:
        card.text(219, 132, '8', size=25, fill='accent', bold=True, anchor='mt')
        row('128', 0, 132, color='muted')
        card.text(51, 132, '−', size=18, fill='muted', anchor='mt')
        card.line([(53, 157), (154, 157)], width=2)
    if stage >= 2:
        row('64', 2, 164, color='accent')
    if stage >= 3:
        card.text(254, 132, '4', size=25, fill='accent', bold=True, anchor='mt')
        row('64', 2, 195, color='muted')
        card.text(119, 195, '−', size=18, fill='muted', anchor='mt')
        card.line([(120, 220), (189, 220)], width=2)
        row('0', 3, 229, color='accent')

    labels = (
        ('Первое неполное делимое', '13 < 16', '134 ≥ 16'),
        ('Первая цифра частного', '16 · 8 = 128', '16 · 9 = 144'),
        ('Вычитаем и сносим', '134 − 128 = 6', 'Сносим 4 → 64'),
        ('Вторая цифра частного', '16 · 4 = 64', '64 − 64 = 0'),
        ('Проверяем умножением', '16 · 84 = 1344', 'Частное 84'),
    )
    heading, first, second = labels[stage]
    card.text(323, 111, heading, size=18, fill='muted', bold=True)
    card.text(323, 151, first, size=28, fill='accent', bold=True)
    card.text(323, 196, second, size=25)


def negatives(card, stage):
    def x(number):
        return 60 + (number + 5) * 51

    card.text(320, 89, '−3 + 5 = 2' if stage == 3 else '−3 + 5', size=31, bold=True, anchor='mt')
    card.arrow((41, 188), (606, 188), fill='muted', width=2)
    for number in range(-5, 6):
        point = x(number)
        card.line([(point, 181), (point, 196)], fill='muted', width=2)
        label = str(number).replace('-', '−')
        card.text(point, 211, label, size=19, fill='muted', anchor='mt')

    card.circle(x(-3), 188, 7, fill='blue', outline='white', width=2)
    card.line([(x(-3), 183), (x(-3), 161)], fill='blue', width=2, dashed=True)
    if stage >= 1:
        card.arrow((x(-3), 154), (x(0), 154), fill='blue')
        card.text((x(-3) + x(0)) // 2, 126, '3 шага', size=18, fill='blue', bold=True, anchor='mt')
        card.circle(x(0), 188, 7, fill='blue', outline='white', width=2)
        card.line([(x(0), 183), (x(0), 161)], fill='blue', width=2, dashed=True)
    if stage >= 2:
        card.arrow((x(0), 154), (x(2), 154), fill='accent')
        card.text((x(0) + x(2)) // 2, 126, '2 шага', size=18, fill='accent', bold=True, anchor='mt')
        card.line([(x(2), 183), (x(2), 161)], fill='accent', width=2, dashed=True)
        card.circle(x(2), 188, 10 if stage == 3 else 7, fill='accent', outline='white', width=2)


def part_bar(card, top, cells, painted, label, second_color_start=None):
    left, bar_width, height = 160, 432, 42
    card.text(97, top + height // 2, label, size=27, bold=True, anchor='mm')
    for index in range(cells):
        start = left + index * bar_width // cells
        end = left + (index + 1) * bar_width // cells
        fill = painted[index] if index < len(painted) else 'white'
        card.rect((start, top, end, top + height), fill=fill, outline='edge')
    if second_color_start is not None:
        point = left + second_color_start * bar_width // cells
        card.line([(point, top - 3), (point, top + height + 3)], fill='ink', width=3)


def fractions(card, stage):
    if stage == 3:
        card.text(320, 95, '4/12 + 3/12 = 7/12', size=33, bold=True, anchor='mt')
        part_bar(card, 155, 12, ['accent'] * 4 + ['blue'] * 3, '7/12', second_color_start=4)
        card.text(232, 217, '4 части', size=20, fill='accent', bold=True, anchor='mt')
        card.text(358, 217, '3 части', size=20, fill='blue', bold=True, anchor='mt')
        return

    if stage == 0:
        part_bar(card, 105, 3, ['accent'], '1/3')
    else:
        part_bar(card, 105, 12, ['accent'] * 4, '4/12')
    if stage < 2:
        part_bar(card, 180, 4, ['blue'], '1/4')
    else:
        part_bar(card, 180, 12, ['blue'] * 3, '3/12')
    card.text(376, 237, 'Полоски одинаковой длины', size=19, fill='muted', anchor='mt')


def base_percent(card, stage):
    expressions = ('15% от 240', '10% от 240 = 24', '5% от 240 = 12', '15% от 240 = 36')
    card.text(320, 88, expressions[stage], size=31, bold=True, anchor='mt')
    left, cell, top = 50, 27, 151
    for index in range(20):
        fill = 'white'
        if stage in (1, 3) and index < 2:
            fill = 'accent'
        elif (stage == 2 and index == 0) or (stage == 3 and index == 2):
            fill = 'blue'
        start = left + index * cell
        card.rect((start, top, start + cell, top + 38), fill=fill, outline='edge')

    if stage in (1, 2, 3):
        width = {1: 2, 2: 1, 3: 3}[stage] * cell
        card.line([(left, 144), (left, 139), (left + width, 139), (left + width, 144)], fill='muted', width=2)
    card.line([(left, 197), (left, 205), (590, 205), (590, 197)], fill='muted', width=2)
    bottom = ('100% — всё число, 240', '100% = 240', '5% — половина от 10%', '10% + 5% → 24 + 12 = 36')
    card.text(320, 223, bottom[stage], size=22, fill='muted', anchor='mt')


def build_all(build):
    build('division', 'Деление уголком', (
        '13 меньше 16, поэтому первое неполное делимое — 134.',
        'Возьми 8, поскольку 16 · 8 не больше 134, а 16 · 9 уже больше.',
        'Вычти 128 из 134. Снеси цифру 4, получится 64.',
        '64 делится на 16 ровно 4 раза. Остаток равен нулю.',
        'Проверь ответ умножением: 16 · 84 = 1344.',
    ), division)
    build('negatives', 'Сложение на числовой прямой', (
        'Начни в точке −3. Прибавить 5 — значит пройти 5 шагов вправо.',
        'За 3 шага вправо дойдёшь от −3 до нуля.',
        'Осталось 2 шага вправо от нуля.',
        'Ты пришёл в точку 2. Значит, −3 + 5 = 2.',
    ), negatives)
    build('fractions', 'Общий знаменатель', (
        'Доли относятся к одинаковым целым, но части разного размера.',
        'Возьми общий знаменатель 12. Одна треть — это четыре двенадцатых.',
        'Одна четверть — это три двенадцатых. Теперь доли одинакового размера.',
        'Сложи числители: 4 + 3 = 7. Получится 7/12.',
    ), fractions)
    build('base-percent', 'Процент от числа', (
        'Выясни, что принято за 100%. Здесь всё число равно 240.',
        'Чтобы найти 10%, раздели 240 на 10. Получится 24.',
        '5% — половина от 10%. Половина от 24 равна 12.',
        '15% = 10% + 5%. Сложи 24 и 12. Ответ: 36.',
    ), base_percent)
