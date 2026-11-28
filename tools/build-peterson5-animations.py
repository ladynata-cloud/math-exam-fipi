#!/usr/bin/env python3
"""Build exact, deterministic mathematical GIFs for the Peterson 5 workshop.

Run normally to regenerate the 43 animations, posters and manifest.  --check
only reads and validates the existing assets; it never recreates them.
"""
from __future__ import annotations

import argparse
import hashlib
import itertools
import json
import math
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction as F
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "school/peterson5/media"
DATA_JS = ROOT / "school/peterson5/media-data.js"
W, H, SCALE = 640, 420, 2
BG = "#F6F6EF"
INK = "#203B36"
GREEN = "#166753"
PALE = "#E3EFDF"
GOLD = "#C28C3A"
SAND = "#F0D5A0"
LINE = "#B8CBB8"
MUTED = "#62766E"
WHITE = "#FFFEF9"
CLAY = "#A76843"
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
FONTS = {}

# The verbal description remains useful when motion is paused or unavailable.
TOPICS = [
 ("Скобки меняют смысл", "Без скобок в 8 + 3 · 4 первым выполняют умножение и получают 20. В (8 + 3) · 4 сначала складывают; результат равен 44. Меняется порядок действий, хотя числа те же."),
 ("Действуем слева направо", "В выражении 24 : 6 · 2 деление и умножение равноправны. Сначала 24 : 6 = 4, затем 4 · 2 = 8. Умножать 6 на 2 до деления здесь нельзя."),
 ("Из условия — в выражение", "Четыре тетради по 6 рублей изображены четырьмя одинаковыми частями. Общая стоимость равна 4 · 6 = 24 рубля. Числа в выражении сохраняют смысл условия."),
 ("Найди неизвестную часть", "В равенстве x + 7 = 19 неизвестная часть вместе с семью составляет девятнадцать. Убирая семь из обеих равных величин, получаем x = 12. Проверка: 12 + 7 = 19."),
 ("Пробуем и проверяем", "Ширина прямоугольника x, длина на 3 больше, площадь 28. Пробы 2 и 3 дают площади 10 и 18. При ширине 4 длина равна 7 и площадь 28: оба условия выполнены."),
 ("Перебор без пропусков", "Из цифр 1, 2, 3 составляем двузначные числа без повторения цифр. Заполняем таблицу по строкам: 12, 13, 21, 23, 31, 32. Диагональные клетки запрещены; всего шесть вариантов."),
 ("Высказывание проверяем", "Утверждение «12 делится на 3» можно проверить. Двенадцать предметов разбиваются на четыре тройки без остатка. Поэтому это истинное высказывание."),
 ("Одного возражения хватит", "Несколько нечётных простых чисел не доказывают, что все простые нечётные. Число 2 простое и чётное. Оно является контрпримером и опровергает общее утверждение."),
 ("Найди хотя бы один", "Чтобы подтвердить существование чётного простого числа, достаточно предъявить подходящий пример. Число 2 чётное и имеет ровно два делителя: 1 и 2. Нужный пример найден."),
 ("Почему верно всегда", "Чётные количества состоят из пар. При объединении двух таких количеств все предметы остаются в парах. Буквенная запись 2a + 2b = 2(a + b) объясняет общий случай, а рисунок иллюстрирует его."),
 ("Буква сохраняет смысл", "Пусть x обозначает первое количество. Если второе на 3 больше, его обозначают x + 3. На схеме видны две одинаковые части x и три дополнительных единицы: вместе 2x + 3."),
 ("Собери пары делителей", "Двенадцать предметов образуют прямоугольники 1 на 12, 2 на 6 и 3 на 4. Получаем все пары делителей числа 12; его делители — 1, 2, 3, 4, 6, 12."),
 ("Только два делителя", "У семи есть только делители 1 и 7. При попытке разбить семь предметов на двойки или тройки остаётся один предмет. Число 7 простое."),
 ("Делимость произведения", "Шесть предметов разбиваются на две тройки. Четыре группы по шесть поэтому разбиваются на восемь троек: 6 · 4 = 24, а 24 : 3 = 8. Делимость одного множителя обеспечивает делимость произведения."),
 ("Складываем целые группы", "Двенадцать и восемнадцать делятся на 6. Они состоят из двух и трёх шестёрок. Вместе получаются пять шестёрок: 12 + 18 = 30, и 30 : 6 = 5."),
 ("Решает последняя цифра", "У числа 120 последняя цифра 0: оно делится на 2, 5 и 10. Число 125 делится на 5, но не на 2 и 10. Число 128 делится на 2, но не на 5 и 10. Проверяем последнюю цифру."),
 ("Сначала сумма цифр", "У числа 381 сумма цифр равна 3 + 8 + 1 = 12. Двенадцать делится на 3, но не на 9. Поэтому 381 делится на 3, но не делится на 9."),
 ("До простых множителей", "Разбиваем 36 на 6 · 6, а каждую шестёрку — на 2 · 3. Получаем только простые множители: 36 = 2 · 2 · 3 · 3 = 2² · 3²."),
 ("Общая часть разложений", "12 = 2 · 2 · 3, а 18 = 2 · 3 · 3. В общую часть входят одна двойка и одна тройка. Их произведение равно 6: это наибольший общий делитель."),
 ("Собери общий комплект", "Чтобы число делилось и на 12, и на 18, нужны две двойки и две тройки. Берём каждый простой множитель с наибольшим числом повторений: НОК(12, 18) = 2 · 2 · 3 · 3 = 36."),
 ("Степень — это множители", "В записи 3³ показатель 3 означает три одинаковых множителя. Сначала 3 · 3 = 9, затем 9 · 3 = 27. Степень не означает умножение основания на показатель."),
 ("Выбираем удобную пару", "В произведении 25 · 17 · 4 можно переставить и сгруппировать множители. Сначала 25 · 4 = 100, затем 100 · 17 = 1700. Значение произведения при этом не меняется."),
 ("Проверь оба направления", "Если число делится на 10, оно делится и на 5. Обратное утверждение неверно: 15 делится на 5, но не на 10. Поэтому эти два условия не равносильны."),
 ("Уточни определение", "Делиться на 1 и на себя недостаточно, чтобы быть простым: число 4 имеет ещё делитель 2. У простого числа ровно два различных натуральных делителя. У числа 5 это 1 и 5."),
 ("Целое и равные доли", "Полоску разделили на пять равных частей и взяли три. Знаменатель 5 указывает размер доли, числитель 3 — количество взятых долей. Закрашены три пятых одного целого."),
 ("Доли мельче, часть та же", "Каждую треть разделили пополам. В целом стало шесть равных долей, а в закрашенной части — четыре. Закрашенная величина не изменилась: 2/3 = 4/6."),
 ("Сравни одинаковые доли", "Две одинаковые полоски показывают 2/3 и 3/4. После деления на двенадцатые это 8/12 и 9/12. Вторая часть больше: 2/3 < 3/4."),
 ("Размер доли сохраняется", "К одной четверти того же целого добавили две четверти. Получились три четверти. Складывают количество долей, а знаменатель сохраняют: 1/4 + 2/4 = 3/4."),
 ("Размени одну целую", "Для 2 1/4 − 3/4 одной четверти недостаточно. Размениваем одну целую на четыре четверти: получается одна целая и пять четвертей. После вычитания трёх четвертей остаётся 1 1/2."),
 ("Половина от двух третей", "В прямоугольнике закрашены две трети. Половина этой закрашенной части занимает две клетки из шести, то есть треть целого. Поэтому 1/2 · 2/3 = 1/3."),
 ("Сколько частей поместится", "Три четверти равны шести восьмым. В них помещаются шесть частей по одной восьмой. Поэтому 3/4 : 1/8 = 6."),
 ("Сначала умножение", "В выражении 2/3 + 1/2 · 3/5 сначала находим произведение 3/10. На сетке из 30 равных клеток две трети — 20 клеток, три десятых — 9. Сумма равна 29/30."),
 ("От целого к части", "Разделим 20 на пять равных частей: в каждой по 4. Три такие части дают 12. Поэтому 3/5 от 20 равны 20 : 5 · 3 = 12."),
 ("У остатка новое целое", "Из 40 взяли четверть — 10; осталось 30. Затем взяли две трети именно остатка, то есть 20. Осталось 10. Нельзя вторую долю брать от первоначальных 40."),
 ("Складываем работу за час", "Один исполнитель делает работу за 3 часа, второй за 6. При постоянной производительности без помех за час они выполняют 1/3 + 1/6 = 1/2 работы. Вместе вся работа займёт 2 часа."),
 ("Ноль удерживает разряд", "205 сотых — это две целые и пять сотых. Десятых в дробной части нет, поэтому их место занимает ноль. Получаем 2,05; запись 2,5 означала бы другое число."),
 ("Две записи одной части", "75 сотых изображены тремя закрашенными четвертями квадратной сетки. Объединяя клетки в четыре одинаковых блока по 25, получаем 0,75 = 75/100 = 3/4."),
 ("Округляем с переносом", "Округляем 3,96 до десятых. Следующая цифра 6 требует увеличить девять десятых. Десять десятых дают новую целую: 3,96 ≈ 4,0."),
 ("Сравни разряд за разрядом", "Можно дописать ноль справа: 0,8 = 0,80. В первом числе восемь десятых, во втором семь: 0,80 > 0,75. Длина дробной записи не определяет величину числа."),
 ("Запятая под запятой", "Записываем 3,7 как 3,70 и складываем одинаковые разряды с 0,46. Шесть сотых остаются в сотых; одиннадцать десятых превращаются в одну целую и одну десятую. Получаем 4,16."),
 ("Разряды меняют вес", "При делении 3,7 на 100 каждая цифра получает в сто раз меньший вес. Три единицы становятся тремя сотыми, семь десятых — семью тысячными. Получается 0,037."),
 ("Умножаем десятичные доли", "На квадратной сетке из 100 клеток ширина 0,6 и высота 0,4 выделяют прямоугольник из 24 клеток. Это 24 сотых целого: 0,6 · 0,4 = 0,24."),
 ("Одинаковый сдвиг обоих", "В 0,84 : 0,07 умножаем и делимое, и делитель на 100. Цифры в обеих строках сдвигаются одинаково; частное сохраняется. Получаем 84 : 7 = 12.")
]


def color(value):
    return tuple(int(value[i:i + 2], 16) for i in (1, 3, 5))


def mix(a, b, t):
    t = max(0, min(1, t))
    return tuple(round(x + (y - x) * t) for x, y in zip(color(a) if isinstance(a, str) else a, color(b) if isinstance(b, str) else b))


def clamp(t):
    return max(0, min(1, t))


def smooth(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def progress(t, states=3):
    if t >= 1:
        return states - 1
    value = t * (states - 1)
    integer = int(value)
    return integer + smooth((value - integer - .18) / .64)


def font(size, bold=False):
    key = (size, bold)
    if key not in FONTS:
        FONTS[key] = ImageFont.truetype(str(FONT_DIR / ("DejaVuSansCondensed-Bold.ttf" if bold else "DejaVuSansCondensed.ttf")), round(size * SCALE))
    return FONTS[key]


class Canvas:
    def __init__(self, title):
        self.image = Image.new("RGB", (W * SCALE, H * SCALE), BG)
        self.d = ImageDraw.Draw(self.image)
        self.text(title, 320, 32, 30, GREEN, True)
        self.line([(28, 64), (612, 64)], LINE, 1)

    def text(self, s, x, y, size=52, fill=INK, bold=False, max_width=590):
        s = str(s)
        f = font(size, bold)
        box = self.d.textbbox((x * SCALE, y * SCALE), s, font=f, anchor="mm")
        if box[2] - box[0] > max_width * SCALE:
            raise ValueError(f"Text is too wide: {s!r}, size {size}")
        if box[0] < 7 * SCALE or box[2] > (W - 7) * SCALE or box[1] < 5 * SCALE or box[3] > (H - 5) * SCALE:
            raise ValueError(f"Text outside canvas: {s!r}, box {box}")
        self.d.text((x * SCALE, y * SCALE), s, font=f, fill=fill, anchor="mm")

    def rect(self, x, y, w, h, fill=WHITE, outline=LINE, width=2, radius=8):
        self.d.rounded_rectangle((x * SCALE, y * SCALE, (x + w) * SCALE, (y + h) * SCALE), radius=radius * SCALE, fill=fill, outline=outline, width=round(width * SCALE))

    def line(self, points, fill=INK, width=3):
        self.d.line([(x * SCALE, y * SCALE) for x, y in points], fill=fill, width=round(width * SCALE), joint="curve")

    def dot(self, x, y, r=14, fill=GREEN):
        self.d.ellipse(((x - r) * SCALE, (y - r) * SCALE, (x + r) * SCALE, (y + r) * SCALE), fill=fill)

    def arrow(self, x1, y1, x2, y2, fill=GREEN, width=4):
        self.line([(x1, y1), (x2, y2)], fill, width)
        angle = math.atan2(y2 - y1, x2 - x1)
        pts = [(x2, y2)] + [(x2 - 13 * math.cos(angle + delta), y2 - 13 * math.sin(angle + delta)) for delta in (-.42, .42)]
        self.d.polygon([(x * SCALE, y * SCALE) for x, y in pts], fill=fill)

    def fraction(self, n, d, x, y, size=48, fill=INK):
        self.text(n, x, y - 30, size, fill)
        self.text(d, x, y + 30, size, fill)
        half = max(26, len(str(n)) * size * .27, len(str(d)) * size * .27)
        self.line([(x - half, y), (x + half, y)], fill, 2)

    def bar(self, x, y, w, h, divisions, filled=0, fill=GREEN, gold_from=None, cut_strength=1):
        self.rect(x, y, w, h, WHITE, LINE, radius=2)
        if filled > 0:
            self.rect(x + 2, y + 2, max(0, w * filled / divisions - 4), h - 4, fill, fill, radius=1)
        if gold_from is not None and w * (filled - gold_from) / divisions > 3:
            self.rect(x + w * gold_from / divisions + 1, y + 2, w * (filled - gold_from) / divisions - 3, h - 4, SAND, SAND, radius=1)
        for i in range(1, divisions):
            self.line([(x + w * i / divisions, y), (x + w * i / divisions, y + h)], mix(WHITE, LINE, cut_strength), 2)

    def chip(self, value, x, y, fill=WHITE, w=80, h=70, size=52, border=LINE):
        self.rect(x - w / 2, y - h / 2, w, h, fill, border)
        self.text(value, x, y, size, INK, True, max_width=w - 6)

    def finish(self):
        return self.image.resize((W, H), Image.Resampling.LANCZOS)


def pair_dots(c, x, y, pairs, fill=GREEN, gap=60):
    for i in range(pairs):
        c.rect(x + i * gap - 23, y - 38, 46, 76, WHITE, LINE)
        c.dot(x + i * gap, y - 15, 12, fill)
        c.dot(x + i * gap, y + 15, 12, fill)


def table(c, cols, y=105, row_h=87, label_size=25):
    xs = [80 + (i + .5) * 480 / len(cols) for i in range(len(cols))]
    for i, name in enumerate(cols):
        c.text(name, xs[i], y - 20, label_size, MUTED, max_width=480 / len(cols) - 5)
        c.rect(80 + i * 480 / len(cols), y + 4, 480 / len(cols), row_h, WHITE, LINE, radius=0)
    return xs


def render(n, t):
    c = Canvas(TOPICS[n - 1][0])
    z = progress(t)
    a, b = clamp(z), clamp(z - 1)
    if n == 1:
        c.rect(191, 92, 176, 76, mix(WHITE, SAND, 1 - a), mix(LINE, GOLD, 1 - a))
        for value, x in [(8, 95), ("+", 160), (3, 225), ("·", 280), (4, 335)]:
            c.text(value, x, 130, 58)
        c.text("=", 415, 130, 54, mix(BG, GREEN, a))
        c.text(20, 518, 130, 58, mix(BG, GREEN, a))
        c.rect(74, 221, 262, 76, mix(WHITE, SAND, a), mix(LINE, GOLD, a))
        c.text("(8 + 3)", 205, 259, 58)
        c.text("·", 370, 259, 58)
        c.text(4, 425, 259, 58)
        c.text("=", 483, 259, 54, mix(BG, GREEN, b))
        c.text(44, 555, 259, 58, mix(BG, GREEN, b))
        c.text("Сначала выделенное действие", 320, 370, 30, MUTED)
    elif n == 2:
        vals = [(24, 160), (6, 320), (2, 480)]
        for value, x in vals:
            c.chip(value, x, 155, mix(WHITE, SAND, a if value in (24, 6) else b), 110, 88, 60)
        c.text(":", 240, 155, 54)
        c.text("·", 400, 155, 54)
        c.arrow(230, 218, 230, 244 + 28 * a, GREEN)
        c.text("4 · 2 = 8" if z >= 1 else "24 : 6 = 4", 320, 330, 58)
    elif n == 3:
        for i in range(4):
            shown = clamp(z * 2 - i + 1)
            c.rect(62 + 130 * i, 125, 118, 112, mix(WHITE, PALE, shown), LINE)
            c.text(6, 121 + 130 * i, 181, 64, mix(BG, GREEN, shown))
        c.text("4 · 6 = 24", 320, 330, 64, mix(INK, GREEN, b))
        c.text("Четыре одинаковые цены", 320, 285, 28, MUTED)
    elif n == 4:
        c.rect(90, 112, 288, 76, PALE, GREEN, radius=1)
        c.rect(378 + 72 * a, 114 + 58 * a, 166, 72, mix(SAND, BG, a), mix(SAND, BG, a), radius=1)
        c.text("x", 230, 149, 64, GREEN)
        c.text("7", 462 + 50 * a, 149 + 58 * a, 60, mix(INK, BG, a))
        c.text("19", 320, 256, 68)
        c.text("− 7", 465, 256, 56, mix(BG, GOLD, a))
        c.text("x = 12", 320, 355, 64, mix(BG, GREEN, b))
    elif n == 5:
        value = 2 + min(2, int(z + 1e-9))
        x, y = 57, 124
        rw, rh = (value + 3) * 25, value * 25
        c.rect(x, y, rw, rh, PALE, GREEN, 3, 0)
        label = min(4, round(value))
        c.text(label + 3, x + rw / 2, y + rh + 43, 48)
        c.text(label, x + rw + 36, y + rh / 2, 48)
        c.text("x", 385, 80, 25, MUTED)
        c.text("Площадь", 506, 80, 25, MUTED)
        for i, (trial, area) in enumerate([(2, 10), (3, 18), (4, 28)]):
            c.rect(330, 98 + 77 * i, 252, 70, mix(WHITE, PALE if i == 2 else SAND, clamp(z - i + 1)), LINE)
            c.text(str(trial), 385, 133 + 77 * i, 50)
            c.text(str(area), 506, 133 + 77 * i, 50, GREEN if i == 2 else INK)
        c.text("4 · 7 = 28", 320, 370, 52, mix(BG, GREEN, b))
    elif n == 6:
        pairs = [(i, j) for i in (1, 2, 3) for j in (1, 2, 3) if i != j]
        for i in range(3):
            c.text(i + 1, 182 + 100 * i, 94, 48)
            c.text(i + 1, 92, 160 + 72 * i, 48)
            for j in range(3):
                c.rect(136 + 100 * j, 126 + 72 * i, 92, 65, WHITE if i != j else "#E4E7DF", LINE)
                if i == j:
                    c.line([(157 + 100 * j, 140 + 72 * i), (207 + 100 * j, 177 + 72 * i)], LINE, 3)
                else:
                    k = pairs.index((i + 1, j + 1))
                    c.text(10 * (i + 1) + j + 1, 182 + 100 * j, 160 + 72 * i, 48, mix(BG, GREEN, clamp(t * 7 - k)))
        c.text("6 чисел", 320, 378, 50, mix(BG, GREEN, b))
    elif n == 7:
        if b > 0:
            for i in range(4):
                c.rect(90 + 130 * i, 114, 66, 145, None, mix(BG, GOLD, b), 3)
        for i in range(12):
            gx = 123 + (i // 3) * 130
            xx = 105 + i * 39
            yy = 185
            c.dot(xx + (gx - xx) * a, yy + ((i % 3 - 1) * 44) * a, 16)
        c.text("12 : 3 = 4", 320, 335, 60)
        c.text("Утверждение верно", 320, 385, 28, GREEN)
    elif n in (8, 9):
        values = [3, 5, 7, 2] if n == 8 else [3, 5, 2]
        xs = [100, 245, 390, 535] if n == 8 else [150, 320, 490]
        for i, (value, x) in enumerate(zip(values, xs)):
            selected = clamp(z - .7) if value == 2 else clamp(1 - abs(z * 1.4 - i)) * .6
            c.chip(value, x, 148, mix(WHITE, SAND if n == 8 else PALE, selected), 108, 96, 68)
        target = xs[-1]
        c.dot(target - 21, 256, 17, mix(BG, GREEN, a))
        c.dot(target + 21, 256, 17, mix(BG, GREEN, a))
        c.rect(target - 49, 227, 98, 58, None, mix(BG, GREEN, b), 3)
        c.text("2 — контрпример" if n == 8 else "Подходит 2", 320, 362, 50, mix(BG, GREEN, b))
    elif n == 10:
        slide, join = clamp(a * 2), clamp(a * 2 - 1)
        pair_dots(c, 113, 139 + 55 * join, 4, GREEN)
        pair_dots(c, 173 + 180 * slide, 267 - 73 * join, 3, GOLD)
        c.text("2a + 2b = 2(a + b)", 320, 365, 48, mix(INK, GREEN, b))
    elif n == 11:
        for y in (130, 235):
            c.rect(95, y, 270, 70, PALE, GREEN)
            c.text("x", 230, y + 35, 62, GREEN)
        for i in range(3):
            c.rect(365 + i * 55, 235, 55, 70, mix(WHITE, SAND, clamp(z * 1.5 - i + 1)), GOLD, 2, 0)
            c.text(1, 392 + i * 55, 270, 48)
        c.text("Вместе: 2x + 3", 320, 367, 50)
    elif n in (12, 13):
        values = (12, [12, 6, 4]) if n == 12 else (7, [7, 2, 3])
        total, columns = values
        step = min(1, int(z))
        f = z - step
        old, new = columns[step], columns[step + 1]
        def position(i, cols):
            rows = math.ceil(total / cols)
            return 320 + (i % cols - (cols - 1) / 2) * 40, 194 + (i // cols - (rows - 1) / 2) * 43
        for i in range(total):
            x0, y0 = position(i, old); x1, y1 = position(i, new)
            c.dot(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 15, GOLD if n == 13 and i == 6 and z > .7 else GREEN)
        label = "1 × 12" if z < .8 else "2 × 6" if z < 1.8 else "3 × 4"
        c.text(label if n == 12 else "Делители: 1 и 7", 320, 344, 52)
        c.text("Все пары для 12" if n == 12 else "7 — простое число", 320, 389, 27, MUTED)
    elif n == 14:
        for group in range(4):
            opacity = clamp(z * 2 - group + 1)
            x = 105 + group * 142
            for row in range(2):
                c.rect(x - 54, 111 + row * 79, 110, 66, mix(BG, WHITE, opacity), mix(BG, LINE, opacity), 2)
                for col in range(3):
                    c.dot(x - 34 + col * 34, 144 + row * 79, 12, mix(BG, GREEN, opacity))
        c.text("24 : 3 = 8" if z >= 1 else "6 · 4 = 24", 320, 355, 58)
    elif n == 15:
        slide, join = clamp(a * 2), clamp(a * 2 - 1)
        for i in range(5):
            startx = 160 + (i if i < 2 else i - 2) * 140
            starty = 135 if i < 2 else 250
            x = startx + (88 + i * 116 - startx) * slide
            y = starty + (190 - starty) * join
            c.rect(x - 48, y - 47, 96, 94, WHITE, LINE)
            for k in range(6): c.dot(x - 27 + (k % 3) * 27, y - 17 + (k // 3) * 34, 10, GREEN if i < 2 else GOLD)
        c.text("12 + 18 = 30" if z < 1.4 else "30 : 6 = 5", 320, 360, 54)
    elif n == 16:
        stage = min(2, int(z + .3)); number = [120, 125, 128][stage]
        c.text(str(number), 320, 132, 82)
        c.rect(351, 84, 63, 99, None, mix(LINE, GOLD, .4 + .6 * abs(math.sin(t * math.pi * 3))), 4)
        for i, divisor in enumerate((2, 5, 10)):
            x = 153 + i * 166
            c.text("÷ " + str(divisor), x, 242, 50)
            c.text("✓" if number % divisor == 0 else "×", x, 319, 64, GREEN if number % divisor == 0 else MUTED)
        c.text("Проверяем только последнюю цифру", 320, 388, 26, MUTED)
    elif n == 17:
        for i, digit in enumerate((3, 8, 1)):
            c.chip(digit, 174 + i * 146, 135, mix(WHITE, SAND, a), 92, 84, 66)
            if i < 2: c.text("+", 247 + i * 146, 135, 50)
        c.arrow(320, 197, 320, 208 + 27 * a, GREEN)
        c.text("12", 320, 274, 74, mix(BG, GREEN, a))
        c.text("÷ 3  ✓", 195, 366, 48, mix(BG, GREEN, b))
        c.text("÷ 9  ×", 458, 366, 48, mix(BG, CLAY, b))
    elif n == 18:
        c.chip(36, 320, 112, PALE, 120, 76, 60)
        for i, x in enumerate((190, 450)):
            c.line([(320, 152), (320 + (x - 320) * a, 152 + 36 * a)], mix(BG, GREEN, a))
            c.text(6, x, 208, 56, mix(BG, INK, a))
            for j, xx in enumerate((x - 62, x + 62)):
                c.line([(x, 238), (x + (xx - x) * b, 238 + 31 * b)], mix(BG, GREEN, b))
                c.rect(xx - 39, 264, 78, 66, mix(BG, SAND, b), mix(BG, GOLD, b))
                c.text((2, 3)[j], xx, 297, 50, mix(BG, INK, b), True)
        c.text("36 = 2² · 3²", 320, 382, 50)
    elif n in (19, 20):
        for row, (value, factors) in enumerate(((12, [2, 2, 3]), (18, [2, 3, 3]))):
            y = 126 + row * 100
            c.text(str(value) + " =", 119, y, 50)
            for col, factor in enumerate(factors):
                selected = (col in (0, 2) if row == 0 else col in (0, 1)) if n == 19 else (col in (0, 1) if row == 0 else col in (1, 2))
                c.chip(factor, 255 + col * 113, y, mix(WHITE, SAND if selected else WHITE, a), 82, 75, 56, GOLD if selected and a > .5 else LINE)
                if col < 2: c.text("·", 311.5 + col * 113, y, 48)
        if n == 19:
            c.text("НОД = 2 · 3 = 6", 320, 362, 48, mix(BG, GREEN, b))
        else:
            c.text("2 · 2 · 3 · 3 = 36", 320, 351, 48, mix(BG, GREEN, b))
            c.text("Берём нужное число повторений", 320, 394, 25, MUTED)
    elif n == 21:
        for group in range(3):
            visibility = 1 if group == 0 else clamp((b - .65) / .35)
            if visibility == 0: continue
            gx = 320 + (group - 1) * 169 * b
            for i in range(9):
                show = visibility * (1 if i < 3 else a)
                if show == 0: continue
                c.dot(gx + (i % 3 - 1) * 38, 196 + (i // 3 - 1) * 41, 14, mix(BG, GREEN if group != 1 else GOLD, show))
        c.text("3³", 320, 95, 56)
        c.text("3" if z < .5 else "3 · 3 = 9" if z < 1.5 else "3 · 3 · 3 = 27", 320, 353, 54)
    elif n == 22:
        for value, start, end in [(25, 160, 160), (17, 320, 480), (4, 480, 320)]:
            arc = 90 * math.sin(math.pi * a) * (1 if value == 17 else -1 if value == 4 else 0)
            c.chip(value, start + (end - start) * a, 200 + arc, SAND if value in (25, 4) else WHITE, 112, 76, 60)
        if a > .99: c.rect(95, 147, 295, 106, None, GOLD, 3)
        c.text("25 · 17 · 4" if z < 1.5 else "100 · 17 = 1700", 320, 367, 51, GREEN if b > .5 else INK)
    elif n == 23:
        c.chip("÷ 10", 143, 175, PALE, 170, 100, 58)
        c.chip("÷ 5", 497, 175, PALE, 170, 100, 58)
        c.arrow(240, 120, 240 + 160 * a, 120, GREEN)
        c.text(20, 320, 88, 48, GREEN)
        c.arrow(400, 270, 400 - 118 * b, 270, GOLD)
        c.text(15, 345, 314, 50, GOLD)
        if b > .05:
            c.line([(258, 248), (283, 290)], mix(BG, CLAY, b), 5)
            c.line([(283, 248), (258, 290)], mix(BG, CLAY, b), 5)
        c.text("Обратный путь неверен", 320, 386, 30, MUTED)
    elif n == 24:
        for i in range(4): c.dot(150 + (i % 2) * 48, 127 + (i // 2) * 48, 16, mix(GREEN, BG, b))
        if b > 0:
            for i in range(5): c.dot(118 + i * 40, 157, 14, mix(BG, GREEN, b))
        c.text(4 if z < 1.5 else 5, 190, 242, 65)
        divisors = [1, 2, 4] if z < 1.5 else [1, 5]
        for i, divisor in enumerate(divisors): c.chip(divisor, 424, 117 + i * 79, SAND if divisor == 2 else WHITE, 88, 66, 50)
        c.text("Три делителя" if z < 1.5 else "Ровно два делителя", 320, 377, 48)
    elif n == 25:
        count = 1 + min(2, int(z + 1e-9))
        c.bar(70, 132, 500, 90, 5, count, GREEN)
        c.arrow(120 + 100 * z, 93, 120 + 100 * z, 122, GOLD, 3)
        c.fraction(count, 5, 320, 307, 56)
        c.text("Считаем равные доли", 320, 391, 28, MUTED)
    elif n == 26:
        c.bar(70, 132, 500, 92, 3, 2)
        for i in (1, 3, 5): c.line([(70 + 500 * i / 6, 132), (70 + 500 * i / 6, 132 + 92 * a)], GOLD, 3)
        c.fraction(2, 3, 220, 316, 52)
        c.text("=", 320, 316, 56)
        c.fraction(4, 6, 420, 316, 52, mix(BG, GREEN, b))
    elif n == 27:
        for row, (num, den) in enumerate(((2, 3), (3, 4))):
            y = 104 + row * 126
            c.fraction(num, den, 63, y + 36, 48)
            c.bar(126, y, 452, 74, den, num)
            for i in range(1, 12): c.line([(126 + 452 * i / 12, y), (126 + 452 * i / 12, y + 74 * a)], mix(LINE, GOLD, a), 1)
        c.text("8/12 < 9/12", 350, 369, 48, mix(BG, GREEN, b))
    elif n == 28:
        slide, join = clamp(a * 2), clamp(a * 2 - 1)
        c.bar(76, 121 + 66 * join, 488, 70, 4, 0)
        c.bar(76, 251 - 64 * join, 488, 70, 4, 0)
        c.rect(78, 123 + 66 * join, 118, 66, GREEN, GREEN, 1, 0)
        c.rect(78 + 122 * slide, 253 - 64 * join, 240, 66, SAND, SAND, 1, 0)
        if a > .99: c.bar(76, 187, 488, 70, 4, 3, GREEN, gold_from=1)
        c.text("1/4 + 2/4 = 3/4", 320, 372, 48)
    elif n == 29:
        for i in range(9):
            x = 65 + i * 58
            move = 48 * b if i >= 6 else 0
            fill = mix(GREEN, BG, b) if i >= 6 else GREEN
            c.rect(x, 150 + move, 53, 81, fill, mix(LINE, BG, b) if i >= 6 else LINE, 2, 1)
        c.rect(60, 145, 232, 91, None, GREEN, 3)
        c.rect(292, 145, 290, 91, None, mix(BG, GOLD, a * (1 - b)), 3)
        c.text("2 1/4 − 3/4", 320, 100, 52)
        c.text("1 1/2", 320, 331, 64, mix(BG, GREEN, b))
        c.text("Целая превращается в четыре доли", 320, 389, 25, MUTED)
    elif n == 30:
        for row in range(2):
            for col in range(3):
                initial = GREEN if col < 2 else WHITE
                final = GOLD if row == 0 and col < 2 else PALE if col < 2 else WHITE
                c.rect(80 + col * 160, 121 + row * 87, 160, 87, mix(initial, final, a), LINE, 2, 0)
        c.rect(80, 121, 320, 87, None, mix(BG, GOLD, b), 4)
        c.text("1/2 · 2/3 = 1/3", 320, 366, 48)
    elif n == 31:
        c.bar(80, 136, 480, 86, 8, 6)
        for i in range(6):
            s = clamp(t * 7 - i)
            c.rect(80 + i * 60, 136, 60, 86, None, mix(LINE, GOLD, s), 4)
            c.text(i + 1, 110 + i * 60, 268, 48, mix(BG, GREEN, s))
        c.text("3/4 : 1/8 = 6", 320, 370, 52)
    elif n == 32:
        c.text("2/3 + 1/2 · 3/5", 320, 105, 48)
        c.line([(297, 138), (517, 138)], mix(LINE, GOLD, a), 5)
        for i in range(30):
            fill = GREEN if i < 20 else mix(WHITE, SAND, a) if i < 29 else WHITE
            c.rect(119 + i % 10 * 40, 170 + i // 10 * 42, 40, 42, fill, LINE, 1, 0)
        c.text("29/30", 320, 365, 62, mix(BG, GREEN, b))
    elif n == 33:
        c.text(20, 320, 106, 58)
        c.bar(70, 154, 500, 88, 5, 3 * b, PALE)
        for i in range(5): c.text(4, 120 + i * 100, 198, 54, mix(BG, GREEN, a))
        c.rect(70, 154, 300, 88, None, mix(BG, GOLD, b), 4)
        c.text("20 : 5 · 3 = 12", 320, 352, 48)
    elif n == 34:
        for i in range(8):
            fade = a if i < 2 else b if i < 6 else 0
            c.rect(72 + i * 62, 173, 62, 88, mix(GREEN, WHITE, fade), LINE, 2, 0)
        c.line([(196, 148), (568, 148)], mix(BG, GOLD, a * (1 - b)), 4)
        c.text("40" if z < .65 else "30" if z < 1.65 else "10", 320, 112, 66)
        c.text("40 − 10 − 20 = 10", 320, 352, 48)
    elif n == 35:
        if z < 1:
            slide, join = clamp(a * 2), clamp(a * 2 - 1)
            c.fraction(1, 3, 67, 143, 48)
            c.fraction(1, 6, 67, 261, 48)
            c.bar(130, 108 + 51 * join, 450, 72, 6, 0)
            c.bar(130, 226 - 67 * join, 450, 72, 6, 0)
            c.rect(132, 110 + 51 * join, 146, 68, GREEN, GREEN, radius=1)
            c.rect(132 + 150 * slide, 228 - 67 * join, 71, 68, SAND, SAND, radius=1)
        else:
            c.bar(80, 150, 480, 95, 6, 3 + 3 * b, GREEN, gold_from=3)
            c.text("1 час" if b < .9 else "2 часа", 320, 111, 49)
        c.text("1/3 + 1/6 = 1/2" if z < 1 else "Вместе: 2 часа", 320, 362, 48)
    elif n == 36:
        xs = table(c, ["Единицы", "Десятые", "Сотые"], 150, 90)
        c.text("205 сотых", 320, 92, 52)
        for i, digit in enumerate([2, 0, 5]):
            opacity = b if i == 1 else a
            c.text(digit, xs[i], 199, 72, mix(BG, GOLD if i == 1 else GREEN, opacity))
        c.text("2,05", 320, 341, 76, mix(BG, GREEN, b))
    elif n == 37:
        for r in range(10):
            for col in range(10):
                on = r < 5 or col < 5
                c.rect(204 + col * 23, 101 + r * 23, 23, 23, GREEN if on else WHITE, mix(LINE, GREEN if on else WHITE, a), 1, 0)
        for r in range(2):
            for col in range(2): c.rect(204 + col * 115, 101 + r * 115, 115, 115, None, mix(LINE, GOLD, a), 4)
        c.text("0,75 = 75/100 = 3/4", 320, 379, 48)
    elif n in (38, 39):
        xs = table(c, ["Единицы", "Десятые", "Сотые"], 111, 83)
        vals = [3, 9, 6] if n == 38 else [0, 8, 0]
        for i, value in enumerate(vals):
            if n == 38 and b > .7: value = [4, 0, ""][i]
            fill = mix(INK, GOLD, a) if i in (1, 2) else INK
            if value != "": c.text(value, xs[i], 157, 69, fill if n == 38 else mix(BG, INK, a) if i == 2 else INK)
        c.rect(xs[1] - 78, 111, 156, 83, None, mix(LINE, GOLD, a), 4)
        if n == 38:
            c.arrow(xs[2], 225, xs[2] - 160 * a, 225, GOLD)
            c.text("+ 1", xs[1], 278, 50, mix(BG, GOLD, a * (1 - b)))
            c.text("3,96 ≈ 4,0", 320, 362, 58)
        else:
            for i, value in enumerate([0, 7, 5]):
                c.rect(80 + i * 160, 221, 160, 83, WHITE, LINE, radius=0)
                c.text(value, xs[i], 263, 69)
            c.text("0,80 > 0,75", 320, 372, 56)
    elif n == 40:
        xs = [245, 385, 525]
        for i, name in enumerate(["Единицы", "Десятые", "Сотые"]): c.text(name, xs[i], 88, 24, MUTED)
        for row, digits in enumerate(([3, 7, 0], [0, 4, 6])):
            for i, digit in enumerate(digits):
                c.text(digit, xs[i], 141 + row * 85, 68, mix(BG, INK, a) if row == 0 and i == 2 else INK)
            c.text(",", 310, 141 + row * 85, 64)
        c.text("+", 135, 218, 60)
        c.line([(189, 270), (576, 270)], INK, 3)
        for i, value in enumerate([4, 1, 6]): c.text(value, xs[i], 319, 68, mix(BG, GREEN, b))
        c.text(",", 310, 319, 64, mix(BG, GREEN, b))
        c.rect(337, 105, 96, 147, None, mix(BG, GOLD, a * (1 - b)), 3)
        c.text("Одиннадцать десятых → перенос", 320, 389, 26, MUTED)
    elif n == 41:
        xs = table(c, ["1", "0,1", "0,01", "0,001"], 128, 110, label_size=32)
        c.text(3, xs[0] + (xs[2] - xs[0]) * a, 185, 72, GREEN)
        c.text(7, xs[1] + (xs[3] - xs[1]) * a, 185, 72, GREEN)
        if b > 0:
            for i in (0, 1): c.text(0, xs[i], 185, 72, mix(BG, MUTED, b))
        c.arrow(172, 275, 172 + 235 * a, 275, GOLD)
        c.text("3,7 : 100 = 0,037", 320, 369, 48)
    elif n == 42:
        for row in range(10):
            for col in range(10):
                fill = mix(WHITE, PALE, a) if col < 6 else WHITE
                if col < 6 and row < 4: fill = mix(fill, GREEN, b)
                c.rect(64 + col * 25, 111 + row * 25, 25, 25, fill, LINE, 1, 0)
        c.rect(64, 111, 150, 100, None, mix(LINE, GOLD, b), 4)
        c.text("0,6", 472, 134, 64)
        c.text("×", 472, 198, 48)
        c.text("0,4", 472, 260, 64)
        c.text("0,24", 472, 342, 60, mix(BG, GREEN, b))
        c.text("24 клетки из 100", 196, 390, 26, MUTED)
    elif n == 43:
        xs = [105, 210, 315, 420, 525]
        for i, name in enumerate(["100", "10", "1", "0,1", "0,01"]):
            c.text(name, xs[i], 96, 29, MUTED)
            c.rect(xs[i] - 51, 121, 102, 180, WHITE, LINE, radius=0)
        for row, digits in enumerate(([0, 8, 4], [0, 0, 7])):
            for i, digit in enumerate(digits):
                fill = mix(INK, BG, a) if digit == 0 else GREEN
                c.text(digit, xs[i + 2] - 210 * a, 166 + row * 84, 64, fill)
        c.text("0,84 : 0,07" if z < 1 else "84 : 7 = 12", 320, 365, 54)
    else:
        raise ValueError(n)
    return c.finish()


def validate_mathematics():
    assert len(TOPICS) == 43
    assert 8 + 3 * 4 == 20 and (8 + 3) * 4 == 44
    assert F(24, 6) * 2 == 8 and 4 * 6 == 24 and 19 - 7 == 12
    assert [(x, x * (x + 3)) for x in (2, 3, 4)] == [(2, 10), (3, 18), (4, 28)]
    assert [10 * a + b for a, b in itertools.permutations((1, 2, 3), 2)] == [12, 13, 21, 23, 31, 32]
    divisors = lambda n: [d for d in range(1, n + 1) if n % d == 0]
    assert 12 // 3 == 4 and divisors(2) == [1, 2] and 2 % 2 == 0
    assert all(2 * a + 2 * b == 2 * (a + b) for a in range(1, 20) for b in range(1, 20))
    assert all(x + (x + 3) == 2 * x + 3 for x in range(1, 20))
    assert divisors(12) == [1, 2, 3, 4, 6, 12] and divisors(7) == [1, 7]
    assert 6 * 4 == 24 and 24 // 3 == 8 and (12 + 18) // 6 == 5
    assert [[n % d == 0 for d in (2, 5, 10)] for n in (120, 125, 128)] == [[True, True, True], [False, True, False], [True, False, False]]
    assert sum(map(int, str(381))) == 12 and 381 % 3 == 0 and 381 % 9 != 0
    assert 36 == 2**2 * 3**2 and math.gcd(12, 18) == 6 and math.lcm(12, 18) == 36
    assert 3**3 == 27 and 25 * 17 * 4 == 1700
    assert all(n % 5 == 0 for n in range(10, 1001, 10)) and 15 % 5 == 0 and 15 % 10 != 0
    assert divisors(4) == [1, 2, 4] and divisors(5) == [1, 5]
    assert F(3, 5) == F(3, 5) and F(2, 3) == F(4, 6)
    assert F(2, 3) == F(8, 12) < F(9, 12) == F(3, 4)
    assert F(1, 4) + F(2, 4) == F(3, 4) and 2 + F(1, 4) - F(3, 4) == F(3, 2)
    assert F(1, 2) * F(2, 3) == F(1, 3) and F(3, 4) / F(1, 8) == 6
    assert F(2, 3) + F(1, 2) * F(3, 5) == F(29, 30)
    assert 20 * F(3, 5) == 12 and 40 * (1 - F(1, 4)) * (1 - F(2, 3)) == 10
    assert (F(1, 3) + F(1, 6)) * 2 == 1
    assert F(205, 100) == F("2.05") and F("0.75") == F(75, 100) == F(3, 4)
    assert Decimal("3.96").quantize(Decimal(".1"), rounding=ROUND_HALF_UP) == Decimal("4.0")
    assert F("0.8") == F("0.80") > F("0.75")
    assert F("3.7") + F("0.46") == F("4.16") and F("3.7") / 100 == F("0.037")
    assert F("0.6") * F("0.4") == F("0.24") and F("0.84") / F("0.07") == 12
    curriculum = json.loads((ROOT / "school/peterson5/theory.json").read_text())
    assert [item["id"] for item in curriculum] == [f"p{i:02}" for i in range(1, 44)]


def write_assets():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for n in range(1, 44):
        frames = [render(n, i / 32) for i in range(33)]
        # One palette per animation avoids frame-to-frame palette flicker.
        contact = Image.new("RGB", (160 * 11, 105 * 3), BG)
        for i, frame in enumerate(frames): contact.paste(frame.resize((160, 105)), ((i % 11) * 160, (i // 11) * 105))
        palette = contact.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
        indexed = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in frames]
        file_id = f"p{n:02}"
        durations = [700] + [150] * 31 + [1100]
        indexed[0].save(OUT / (file_id + ".gif"), save_all=True, append_images=indexed[1:], duration=durations, loop=0, disposal=2, optimize=True)
        with Image.open(OUT / (file_id + ".gif")) as gif:
            count = gif.n_frames
            total = sum(frame.info.get("duration", 0) for frame in ImageSequence.Iterator(gif))
            gif.seek(count - 1)
            gif.convert("RGB").save(OUT / (file_id + ".png"), compress_level=9)
        manifest.append({"id": file_id, "src": f"media/{file_id}.gif", "poster": f"media/{file_id}.png", "title": TOPICS[n - 1][0], "description": TOPICS[n - 1][1], "frames": count, "durationMs": total, "width": W, "height": H})
        print(file_id, count, total, flush=True)
    payload = json.dumps(manifest, ensure_ascii=False, indent=2)
    (OUT / "manifest.json").write_text(payload + "\n")
    DATA_JS.write_text("// Generated by tools/build-peterson5-animations.py.\nwindow.Peterson5MediaData = " + payload + ";\n")


def check_assets():
    manifest = json.loads((OUT / "manifest.json").read_text())
    javascript = DATA_JS.read_text()
    expected = "// Generated by tools/build-peterson5-animations.py.\nwindow.Peterson5MediaData = " + json.dumps(manifest, ensure_ascii=False, indent=2) + ";\n"
    assert javascript == expected, "Synchronous media data differs from manifest"
    assert [item["id"] for item in manifest] == [f"p{i:02}" for i in range(1, 44)]
    hashes = set()
    for n, item in enumerate(manifest, 1):
        name = item["id"]
        assert item["src"] == f"media/{name}.gif" and item["poster"] == f"media/{name}.png"
        assert item["title"] == TOPICS[n - 1][0] and item["description"] == TOPICS[n - 1][1]
        assert len(item["description"]) >= 60 and item["width"] == W and item["height"] == H
        file = OUT / (name + ".gif")
        digest = hashlib.sha256(file.read_bytes()).hexdigest()
        assert digest not in hashes, f"Duplicate animation: {name}"
        hashes.add(digest)
        with Image.open(file) as gif:
            assert gif.size == (W, H) and gif.info.get("loop") == 0
            assert gif.n_frames == item["frames"] and gif.n_frames >= 5, f"Too few mathematical changes: {name}"
            duration = sum(frame.info.get("duration", 0) for frame in ImageSequence.Iterator(gif))
            assert duration == item["durationMs"] and 5000 <= duration <= 8000
            gif.seek(gif.n_frames - 1)
            final = gif.convert("RGB")
        with Image.open(OUT / (name + ".png")) as poster:
            assert poster.size == (W, H)
            assert ImageChops.difference(poster.convert("RGB"), final).getbbox() is None, f"Poster is not the final conclusion: {name}"
    print("PETERSON5_ANIMATIONS_OK: 43 unique GIFs, 43 final-frame posters, exact mathematics and manifest checked")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="validate existing assets without changing them")
    args = parser.parse_args()
    validate_mathematics()
    if not args.check:
        write_assets()
    check_assets()
