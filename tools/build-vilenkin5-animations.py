#!/usr/bin/env python3
"""Build 53 exact mathematical explanations for the Vilenkin 5 course.

The drawing primitives and 19 applicable recipes are shared with the Peterson
builder. By default it lives beside this file after the Peterson change lands.
--peterson-source can select that builder in an isolated, parallel worktree.
--check reads only the completed Vilenkin assets and needs no source override.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import re
from decimal import Decimal, ROUND_HALF_UP
from fractions import Fraction as F
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageSequence

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "school/vilenkin5-media"
DATA_JS = ROOT / "school/vilenkin5-media-data.js"
W, H = 640, 420
BG, INK, GREEN = "#F6F6EF", "#203B36", "#166753"
PALE, GOLD, SAND = "#E3EFDF", "#C28C3A", "#F0D5A0"
LINE, MUTED, WHITE, CLAY = "#B8CBB8", "#62766E", "#FFFEF9", "#A76843"

# Filled below from the approved topic map; all metadata is self-contained so
# checking a Vilenkin branch does not depend on a sibling worktree.
EXPECTED_UNITS = ['Читаем таблицы',
 'Цифры, числа и разряды',
 'Отрезок, ломаная, многоугольник',
 'Прямая, луч и угол',
 'Шкалы и координаты',
 'Сравниваем натуральные числа',
 'Столбчатые диаграммы',
 'Сложение и его свойства',
 'Вычитание и его свойства',
 'Числовые и буквенные выражения',
 'Уравнения',
 'Умножение и его свойства',
 'Деление',
 'Деление с остатком',
 'Упрощаем выражения',
 'Порядок действий',
 'Степени',
 'Делители и кратные',
 'Признаки делимости',
 'Формулы',
 'Площадь прямоугольника',
 'Единицы площади',
 'Прямоугольный параллелепипед',
 'Объём',
 'Окружность, круг, шар и цилиндр',
 'Доли и дроби на прямой',
 'Сравниваем дроби',
 'Правильные и неправильные дроби',
 'Дроби с одинаковыми знаменателями',
 'Деление и дробь',
 'Смешанные числа',
 'Действия со смешанными числами',
 'Основное свойство дроби',
 'Сокращение дробей',
 'Общий знаменатель',
 'Разные знаменатели',
 'Умножение дробей',
 'Находим часть целого',
 'Деление дробей',
 'Восстанавливаем целое',
 'Десятичная запись',
 'Сравнение десятичных дробей',
 'Сложение и вычитание десятичных дробей',
 'Округление и прикидка',
 'Умножаем десятичную дробь на натуральное число',
 'Делим десятичную дробь на натуральное число',
 'Умножаем на десятичную дробь',
 'Делим на десятичную дробь',
 'Калькулятор с проверкой смысла',
 'Виды углов',
 'Транспортир и построения',
 'Собираем знания: итоговые задачи',
 'Мост в шестой класс']
REUSED = {11: (4,
      'Найди неизвестную часть',
      'В равенстве x + 7 = 19 неизвестная часть вместе с семью составляет девятнадцать. Убирая семь из обеих '
      'равных величин, получаем x = 12. Проверка: 12 + 7 = 19.'),
 15: (10,
      'Почему верно всегда',
      'Чётные количества состоят из пар. При объединении двух таких количеств все предметы остаются в парах. '
      'Буквенная запись 2a + 2b = 2(a + b) объясняет общий случай, а рисунок иллюстрирует его.'),
 16: (1,
      'Скобки меняют смысл',
      'Без скобок в 8 + 3 · 4 первым выполняют умножение и получают 20. В (8 + 3) · 4 сначала складывают; '
      'результат равен 44. Меняется порядок действий, хотя числа те же.'),
 17: (21,
      'Степень — это множители',
      'В записи 3³ показатель 3 означает три одинаковых множителя. Сначала 3 · 3 = 9, затем 9 · 3 = 27. '
      'Степень не означает умножение основания на показатель.'),
 18: (12,
      'Собери пары делителей',
      'Двенадцать предметов образуют прямоугольники 1 на 12, 2 на 6 и 3 на 4. Получаем все пары делителей '
      'числа 12; его делители — 1, 2, 3, 4, 6, 12.'),
 19: (17,
      'Сначала сумма цифр',
      'У числа 381 сумма цифр равна 3 + 8 + 1 = 12. Двенадцать делится на 3, но не на 9. Поэтому 381 делится '
      'на 3, но не делится на 9.'),
 27: (27,
      'Сравни одинаковые доли',
      'Две одинаковые полоски показывают 2/3 и 3/4. После деления на двенадцатые это 8/12 и 9/12. Вторая '
      'часть больше: 2/3 < 3/4.'),
 29: (28,
      'Размер доли сохраняется',
      'К одной четверти того же целого добавили две четверти. Получились три четверти. Складывают количество '
      'долей, а знаменатель сохраняют: 1/4 + 2/4 = 3/4.'),
 32: (29,
      'Размени одну целую',
      'Для 2 1/4 − 3/4 одной четверти недостаточно. Размениваем одну целую на четыре четверти: получается '
      'одна целая и пять четвертей. После вычитания трёх четвертей остаётся 1 1/2.'),
 33: (26,
      'Доли мельче, часть та же',
      'Каждую треть разделили пополам. В целом стало шесть равных долей, а в закрашенной части — четыре. '
      'Закрашенная величина не изменилась: 2/3 = 4/6.'),
 37: (30,
      'Половина от двух третей',
      'В прямоугольнике закрашены две трети. Половина этой закрашенной части занимает две клетки из шести, '
      'то есть треть целого. Поэтому 1/2 · 2/3 = 1/3.'),
 38: (33,
      'От целого к части',
      'Разделим 20 на пять равных частей: в каждой по 4. Три такие части дают 12. Поэтому 3/5 от 20 равны 20 '
      ': 5 · 3 = 12.'),
 39: (31,
      'Сколько частей поместится',
      'Три четверти равны шести восьмым. В них помещаются шесть частей по одной восьмой. Поэтому 3/4 : 1/8 = '
      '6.'),
 41: (36,
      'Ноль удерживает разряд',
      '205 сотых — это две целые и пять сотых. Десятых в дробной части нет, поэтому их место занимает ноль. '
      'Получаем 2,05; запись 2,5 означала бы другое число.'),
 42: (39,
      'Сравни разряд за разрядом',
      'Можно дописать ноль справа: 0,8 = 0,80. В первом числе восемь десятых, во втором семь: 0,80 > 0,75. '
      'Длина дробной записи не определяет величину числа.'),
 43: (40,
      'Запятая под запятой',
      'Записываем 3,7 как 3,70 и складываем одинаковые разряды с 0,46. Шесть сотых остаются в сотых; '
      'одиннадцать десятых превращаются в одну целую и одну десятую. Получаем 4,16.'),
 44: (38,
      'Округляем с переносом',
      'Округляем 3,96 до десятых. Следующая цифра 6 требует увеличить девять десятых. Десять десятых дают '
      'новую целую: 3,96 ≈ 4,0.'),
 47: (42,
      'Умножаем десятичные доли',
      'На квадратной сетке из 100 клеток ширина 0,6 и высота 0,4 выделяют прямоугольник из 24 клеток. Это 24 '
      'сотых целого: 0,6 · 0,4 = 0,24.'),
 48: (43,
      'Одинаковый сдвиг обоих',
      'В 0,84 : 0,07 умножаем и делимое, и делитель на 100. Цифры в обеих строках сдвигаются одинаково; '
      'частное сохраняется. Получаем 84 : 7 = 12.')}
NEW_TOPICS = {
 1: ("Число задают две подписи", "Чтобы узнать число книг за вторник, выбираем строку «Книги» и столбец «Вт». На пересечении стоит 8. Число 7 ниже относится к журналам, а 12 слева — к понедельнику."),
 2: ("Место цифры меняет её вес", "В числе 40 706 цифра 7 стоит в разряде сотен и означает 700. Два нуля сохраняют пустые разряды тысяч и десятков. Разложение: 40 000 + 700 + 6."),
 3: ("Длина — разность отметок", "Отрезок начинается у отметки 3 см и заканчивается у 11 см. Между ними восемь сантиметровых промежутков. Длина равна 11 − 3 = 8 см, хотя конец стоит у числа 11."),
 4: ("Сколько концов у линии", "У отрезка два конца. У луча одно начало, а в другом направлении он продолжается неограниченно. Прямая продолжается в обе стороны и не имеет концов. Стрелки обозначают продолжение за пределы рисунка."),
 5: ("Считаем именно промежутки", "На шкале от 20 до 40 четыре равных промежутка и пять рисок. Цена одного деления равна (40 − 20) : 4 = 5. Промежуточные отметки: 25, 30 и 35."),
 6: ("Первый разряд, где не равно", "Сравниваем 43 099 и 42 999 слева направо. Десятки тысяч равны. В тысячах 3 больше 2, поэтому 43 099 > 42 999; последующие цифры уже не меняют вывод."),
 7: ("Высота читается по шкале", "Шаг вертикальной шкалы равен 6. Первый столбец достигает 30, второй — 18. Разность значений 30 − 18 = 12: это два промежутка шкалы, а не разность ширины столбцов."),
 8: ("Переносим целый десяток", "Складываем 278 и 146 по разрядам. 8 + 6 = 14: оставляем 4 единицы и переносим десяток. 7 + 4 + 1 = 12 десятков: оставляем 2 и переносим сотню. 2 + 1 + 1 = 4 сотни. Получаем 424."),
 9: ("Размен через пустой разряд", "Для 403 − 178 разменяем сотню на десять десятков, затем один десяток — на десять единиц. То же число 403 представлено как 3 сотни, 9 десятков и 13 единиц. По разрядам получаем 225; проверка: 225 + 178 = 403."),
 10: ("Подставляем одно значение", "В выражении 3a + 7 дано a = 4. Три одинаковые части a превращаются в три четвёрки. В каждое вхождение буквы подставляем одно значение: 3 · 4 + 7 = 19."),
 12: ("Десятки требуют сдвига", "Умножаем 24 на 13. Сначала 24 · 3 = 72, затем 24 · 10 = 240. Второе частичное произведение относится к десяткам. Складываем 72 и 240 и получаем 312."),
 13: ("Ноль тоже цифра частного", "Делим 1206 на 3 уголком. Берём 12 сотен: 12 : 3 = 4 сотни, остаток 0. Сносим ноль десятков и обязательно пишем 0 в частном. Сносим 6 единиц: 6 : 3 = 2, остаток 0. Частное 402; 402 · 3 = 1206."),
 14: ("Полные группы и остаток", "Из 17 предметов собираем группы по 5. Получаются три полные группы и два предмета в остатке. Запись проверки: 17 = 5 · 3 + 2. Остаток 2 меньше делителя 5."),
 20: ("Формула считает все стороны", "У прямоугольника стороны 4 см и 3 см. Обход границы считает каждую сторону ровно один раз. Периметр равен 4 + 3 + 4 + 3 = 2 · (4 + 3) = 14 см."),
 21: ("Площадь считаем квадратами", "Прямоугольник со сторонами 4 см и 3 см содержит три ряда по четыре квадратных сантиметра. Площадь равна 4 · 3 = 12 см². Мы считаем внутренние квадраты, а не длину границы."),
 22: ("В площади множитель дважды", "В одном дециметре десять сантиметров. Квадрат со стороной 1 дм разбивается на 10 рядов по 10 квадратных сантиметров. Поэтому 1 дм² = 100 см², а не 10 см²."),
 23: ("Рёбра: три четвёрки", "У прямоугольного параллелепипеда четыре ребра направлены вдоль длины, четыре вдоль ширины и четыре вдоль высоты. Поочерёдно выделяем эти группы. Всего 4 + 4 + 4 = 12 рёбер, включая невидимые спереди."),
 24: ("Объём собираем слоями", "Параллелепипед имеет размеры 3 см, 2 см и 2 см. В нижнем слое 3 · 2 = 6 кубиков объёмом 1 см³, и таких слоёв два. Объём равен 3 · 2 · 2 = 12 см³."),
 25: ("Граница и вся область", "Окружность — линия из точек на одном расстоянии от центра; круг включает и границу, и внутреннюю область. Радиус равен 3, диаметр состоит из двух радиусов и равен 6. Вращающийся радиус описывает окружность."),
 26: ("Доля на координатной прямой", "Единичный отрезок от 0 до 1 разделён на пять равных промежутков. Три шага по одной пятой приводят к точке 3/5. Числитель считает шаги, знаменатель задаёт размер каждого шага."),
 28: ("Семь пятых больше целой", "В одной целой пять пятых. Из семи одинаковых долей выделяем пять, образующих целую, и ещё две доли. Поэтому 7/5 > 1: неправильная дробь может быть больше единицы."),
 30: ("Разделить — получить дробь", "Три целые полоски делим поровну между четырьмя получателями. Каждую полоску разрезаем на четыре четверти. Каждый получает по одной четверти от каждой полоски, всего три четверти. Поэтому 3 : 4 = 3/4."),
 31: ("Выделяем полные целые", "Одиннадцать четвертей группируем по четыре. Получаются две полные группы и три четверти сверх них. Поэтому 11/4 = 2 3/4; при обратном переходе 2 · 4 + 3 = 11."),
 34: ("Объединяем доли попарно", "На полоске закрашены 6 из 8 равных долей. Объединяем соседние доли попарно: теперь закрашены 3 из 4 более крупных равных частей. Величина сохраняется: 6/8 = 3/4; 3 и 4 взаимно простые."),
 35: ("Нужен общий размер доли", "Для четвертей и шестых выбираем двенадцатые: 12 делится и на 4, и на 6 и является их наименьшим общим кратным. Каждая четверть содержит три двенадцатых, каждая шестая — две. Получаем 1/4 = 3/12 и 1/6 = 2/12."),
 36: ("Сначала одинаковые доли", "Чтобы сложить 1/2 и 1/3 одного целого, делим обе полоски на шестые. Половина равна трём шестым, треть — двум шестым. Объединяем пять одинаковых долей: 1/2 + 1/3 = 5/6."),
 40: ("От известной части к целому", "Три пятых некоторого количества равны 12. Значит, одна пятая равна 12 : 3 = 4, а все пять долей равны 4 · 5 = 20. На схеме известна часть, а восстановить нужно целое."),
 45: ("Складываем одинаковые доли", "Умножение 1,2 на 3 объединяет три одинаковые группы по 12 десятых. Получаются 36 десятых. Перегруппировываем их в три целые и шесть десятых: 1,2 · 3 = 3,6."),
 46: ("Остаток переводим в десятые", "Делим 4,8 на 3 уголком. Из четырёх целых каждый получает одну, остаётся одна целая. Вместе с восемью десятыми это 18 десятых. 18 : 3 = 6 десятых, поэтому частное 1,6. Проверка: 1,6 · 3 = 4,8."),
 49: ("Калькулятор проверяем смыслом", "Для 1,2 + 0,5 · 6 сначала отдельно вычисляем произведение 0,5 · 6 = 3. Затем складываем 1,2 + 3 = 4,2. Такой порядок двух вычислений не зависит от того, как конкретный калькулятор обрабатывает длинную запись."),
 50: ("Размер угла — это поворот", "При неизменной длине лучей угол может меняться. 30° — острый угол, 90° — прямой, 130° — тупой, 180° — развёрнутый. Величину определяет поворот от одного луча к другому."),
 51: ("Транспортир: от нужного нуля", "Совмещаем центр транспортира с вершиной, а нулевую отметку справа — с начальной стороной. Отсчитываем 60° по этой шкале и проводим второй луч через найденную отметку. Получается угол 60°, а не 120° по обратной шкале."),
 52: ("Площадь, упаковки и стоимость", "Пол комнаты — прямоугольник 8 м на 5 м, его площадь 40 м². Одной упаковки покрытия хватает на 5 м², поэтому нужны 40 : 5 = 8 упаковок. При цене 700 рублей за упаковку стоимость равна 5600 рублей."),
 53: ("Процент — сотая доля", "25% означает 25 сотых, то есть четверть целого. На сетке из 100 клеток выделяем 25. Если всё количество равно 80, четверть равна 80 : 4 = 20. Поэтому 25% от 80 равны 20.")
}
TOPICS = []
P5 = None
Canvas = mix = clamp = smooth = progress = None


def configure_metadata():
    global TOPICS
    assert set(NEW_TOPICS) | set(REUSED) == set(range(1, 54))
    assert not set(NEW_TOPICS) & set(REUSED)
    TOPICS = [NEW_TOPICS.get(i) or tuple(REUSED[i][1:]) for i in range(1, 54)]


def load_drawing(path):
    global P5, Canvas, mix, clamp, smooth, progress
    spec = importlib.util.spec_from_file_location("peterson5_exact_animation", path)
    if spec is None or spec.loader is None:
        raise ValueError("Cannot load Peterson drawing source")
    P5 = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(P5)
    Canvas, mix, clamp, smooth, progress = P5.Canvas, P5.mix, P5.clamp, P5.smooth, P5.progress
    for _, (source, title, description) in REUSED.items():
        assert tuple(P5.TOPICS[source - 1]) == (title, description), "Shared recipe metadata has changed; review the Vilenkin mapping"


def polygon(c, points, fill, outline=LINE, width=2):
    s = P5.SCALE
    c.d.polygon([(x*s, y*s) for x, y in points], fill=fill)
    c.line(points + [points[0]], outline, width)


def arc(c, center, radius, start, end, fill=GREEN, width=4):
    steps = max(2, int(abs(end-start)/3)+1)
    points = [(center[0]+radius*math.cos(math.radians(start+(end-start)*i/steps)), center[1]-radius*math.sin(math.radians(start+(end-start)*i/steps))) for i in range(steps+1)]
    c.line(points, fill, width)


def grid(c, x, y, cols, rows, cell, filled, fill=GREEN):
    for r in range(rows):
        for col in range(cols):
            c.rect(x+col*cell, y+r*cell, cell, cell, fill if r*cols+col < filled else WHITE, LINE, 1, 0)


def right_angle(c, vertex, u, v):
    # u and v are projections of equal, perpendicular sides of a small square.
    # Draw only its two inner sides; the figure already supplies the other two.
    points = [(vertex[0]+u[0], vertex[1]+u[1]),
              (vertex[0]+u[0]+v[0], vertex[1]+u[1]+v[1]),
              (vertex[0]+v[0], vertex[1]+v[1])]
    c.line(points, BG, 6)
    c.line(points, INK, 3)


def render(point, t):
    if point in REUSED:
        return P5.render(REUSED[point][0], t)
    c = Canvas(TOPICS[point-1][0])
    z = progress(t)
    a, b = clamp(z), clamp(z-1)
    if point == 1:
        for row, values in enumerate(((12,8,15),(4,7,6))):
            y=153+91*row
            c.text(("Книги","Журналы")[row],82,y+42,27,MUTED,max_width=145)
            for col,value in enumerate(values):
                shade=mix(WHITE,PALE,a) if row==0 else WHITE
                if col==1: shade=mix(shade,SAND,b)
                target=row==0 and col==1 and b>.8
                c.rect(160+col*140,y,140,84,shade,GREEN if target else LINE,4 if target else 2,radius=0)
                c.text(value,230+col*140,y+42,58)
        for col,label in enumerate(("Пн","Вт","Ср")): c.text(label,230+col*140,119,32)
        c.text("8 книг",320,370,58,mix(BG,GREEN,b))
    elif point == 2:
        for i,(label,digit) in enumerate(zip(("10 тыс.","тыс.","сот.","дес.","ед."),(4,0,7,0,6))):
            x=96+i*112
            c.text(label,x,123,27,MUTED)
            c.rect(x-55,155,110,103,mix(WHITE,SAND,a) if i==2 else WHITE,LINE,radius=0)
            c.text(digit,x,207,74)
        c.arrow(320,279,320,303,GOLD)
        c.text("7 · 100 = 700",320,365,54,mix(BG,GREEN,b))
    elif point == 3:
        for i in range(13):
            x=58+i*44
            c.line([(x,222),(x,249)],LINE,2)
            if i in (0,6,9): c.text(i,x,277,27,MUTED)
        c.line([(58,235),(586,235)],INK,3)
        c.line([(190,145),(542,145)],GREEN,6)
        for x,label in ((190,3),(542,11)):
            c.dot(x,145,9);c.line([(x,163),(x,230)],LINE,2);c.text(label,x,279,48)
        c.arrow(190,195,190+352*a,195,GOLD,4)
        c.text("11 − 3 = 8 см",320,365,56,mix(BG,GREEN,b))
    elif point == 4:
        for row,label in enumerate(("Отрезок","Луч","Прямая")):
            y=134+102*row
            show=clamp(z*1.5-row+1)
            c.text(label,108,y,29,MUTED)
            end=250+320*show
            c.line([(250,y),(end,y)],mix(BG,GREEN,show),4)
            if row<2: c.dot(250,y,8,mix(BG,GREEN,show))
            else: c.arrow(320,y,250,y,mix(BG,GREEN,show),4)
            if row==0: c.dot(570,y,8,mix(BG,GREEN,show))
            else: c.arrow(max(250,end-40),y,end,y,mix(BG,GREEN,show),4)
            c.text(2-row,608,y,48,mix(BG,GREEN,show))
    elif point == 5:
        c.line([(100,220),(540,220)],INK,4)
        for i,value in enumerate((20,25,30,35,40)):
            x=100+110*i;c.line([(x,204),(x,236)],INK,3)
            show=1 if i in (0,4) else clamp(t*5-i+1)
            c.text(value,x,272,48,mix(BG,GREEN if i not in (0,4) else INK,show))
        c.arrow(100,161,100+440*a,161,GOLD,4)
        c.text("(40 − 20) : 4 = 5",320,368,49)
    elif point == 6:
        for col in range(5):
            x=140+90*col
            if col<2: c.rect(x-41,113,82,180,mix(WHITE,PALE if col==0 else SAND,a if col==0 else b),LINE)
            for row,digits in enumerate(((4,3,0,9,9),(4,2,9,9,9))):
                c.text(digits[col],x,158+91*row,67,mix(INK,MUTED,b) if col>1 else INK)
        c.text("43 099 > 42 999",320,370,52,mix(BG,GREEN,b))
    elif point == 7:
        for i in range(6):
            y=310-i*36;c.line([(108,y),(536,y)],LINE,1);c.text(i*6,75,y,26,MUTED)
        c.line([(110,112),(110,310),(538,310)],INK,3)
        for i,(target,f) in enumerate(((30,a),(18,b))):
            value=round(target*f);x=220+200*i;h=value*6
            if h: c.rect(x,310-h,80,h,GREEN if i==0 else GOLD,LINE,1,0)
            c.text(value,x+40,278-h,52,GREEN if i==0 else GOLD)
            c.text(("А","Б")[i],x+40,340,30,MUTED)
        c.text("30 − 18 = 12",320,387,49,mix(BG,GREEN,b))
    elif point == 8:
        stage=progress(t,4);active=2-min(2,int(stage))
        c.rect(154+140*active,109,92,236,PALE,LINE)
        for row,digits in enumerate(((2,7,8),(1,4,6))):
            for col,digit in enumerate(digits): c.text(digit,200+140*col,151+82*row,67)
        c.text("+",100,228,58);c.line([(150,274),(535,274)],INK,3)
        for col,digit in enumerate((4,2,4)):
            show=clamp(stage-(2-col));c.text(digit,200+140*col,322,67,mix(BG,GREEN,show))
        for col,threshold in ((1,0),(0,1)):
            c.text(1,200+140*col,88,48,mix(BG,GOLD,clamp(stage-threshold)))
        c.text("14 единиц → 1 десяток и 4 единицы" if stage<1.5 else "12 десятков → 1 сотня и 2 десятка",320,390,25,MUTED)
    elif point == 9:
        for row,digits in enumerate(((4,0,3),(1,7,8))):
            for col,digit in enumerate(digits): c.text(digit,200+140*col,151+82*row,67,mix(INK,MUTED,a) if row==0 else INK)
        c.text("−",100,228,58);c.line([(150,274),(535,274)],INK,3)
        for col,digit in enumerate((3,9,13)):
            c.text(digit,200+140*col,91,48,mix(BG,GOLD,a))
            if a: c.line([(175+140*col,155),(225+140*col,142)],mix(BG,GOLD,a),3)
        for col,digit in enumerate((2,2,5)):
            show=clamp(b*3-(2-col));c.text(digit,200+140*col,322,67,mix(BG,GREEN,show))
        c.text("Размен сохраняет число 403",320,389,29,MUTED)
    elif point == 10:
        c.text("3a + 7;  a = 4",320,104,49)
        for i in range(3):
            c.bar(70+i*100,164,100,81,4,4,PALE)
            c.text("a" if a<.8 else 4,120+i*100,205,58,GREEN)
        c.bar(370,164,175,81,7,7,SAND);c.text(7,457,205,58)
        c.text("3 · 4 + 7 = 19",320,357,56,mix(BG,GREEN,b))
    elif point == 12:
        stage=progress(t,4)
        c.rect(414 if stage<1.5 else 314,133,72,70,SAND,LINE)
        for row,digits in enumerate(((2,4),(1,3))):
            for col,digit in enumerate(digits): c.text(digit,350+100*col,105+63*row,59)
        c.text("×",210,166,52);c.line([(209,204),(504,204)],INK,3)
        for value,x in ((7,350),(2,450)): c.text(value,x,239,57,mix(BG,GREEN,clamp(stage)))
        for value,x in ((2,250),(4,350),(0,450)): c.text(value,x,296,57,mix(BG,GOLD,clamp(stage-1)))
        c.text("+",180,291,48,mix(BG,INK,clamp(stage-1)));c.line([(209,329),(504,329)],INK,3)
        for value,x in ((3,250),(1,350),(2,450)): c.text(value,x,373,60,mix(BG,GREEN,clamp(stage-2)))
    elif point == 13:
        stage=progress(t,4);part=min(2,int(stage))
        digits=(1,2,0,6);xs=(120,183,246,309)
        for i,digit in enumerate(digits):
            selected=i in ((0,1) if part==0 else (2,) if part==1 else (3,))
            if selected: c.rect(xs[i]-28,68,56,53,SAND,LINE)
            c.text(digit,xs[i],95,54)
        c.line([(355,70),(355,195)],INK,3);c.line([(355,131),(576,131)],INK,3)
        c.text(3,407,95,58)
        for i,digit in enumerate((4,0,2)):
            show=clamp(stage-i);c.text(digit,407+i*65,175,57,mix(BG,GREEN,show))
        first,second,third=clamp(stage),clamp(stage-1),clamp(stage-2)
        c.text("−",76,139,48,mix(BG,INK,first))
        c.text(1,120,139,48,mix(BG,GOLD,first));c.text(2,183,139,48,mix(BG,GOLD,first))
        if first: c.line([(96,162),(207,162)],mix(BG,INK,first),2)
        c.text(0,183,185,48,mix(BG,INK,first));c.text(0,246,185,48,mix(BG,INK,second))
        c.text("−",202,229,48,mix(BG,INK,second));c.text(0,246,229,48,mix(BG,GOLD,second))
        if second: c.line([(220,252),(272,252)],mix(BG,INK,second),2)
        c.text(0,246,275,48,mix(BG,INK,second));c.text(6,309,275,48,mix(BG,INK,third))
        c.text("−",265,319,48,mix(BG,INK,third));c.text(6,309,319,48,mix(BG,GOLD,third))
        if third: c.line([(283,342),(335,342)],mix(BG,INK,third),2)
        c.text(0,309,366,48,mix(BG,GREEN,third))
        c.text(("12 сотен","0 десятков","6 единиц")[part],476,267,30,MUTED)
        c.text(("пишем 4","пишем 0","пишем 2")[part],476,310,30,GREEN)
    elif point == 14:
        for group in range(3): c.rect(100+160*group,115,100,164,None,mix(BG,LINE,b),2)
        for i in range(17):
            x0=88+29*i;y0=210
            if i<15:
                group,within=divmod(i,5);x1=150+160*group+((within%2)*40-20 if within<4 else 0);y1=150+(within//2)*50
            else: x1=288+64*(i-15);y1=315
            c.dot(x0+(x1-x0)*a,y0+(y1-y0)*a,12,GOLD if i>=15 else GREEN)
        c.text("17 = 5 · 3 + 2",320,380,53)
    elif point in (20,21):
        x,y,cell=204,121,58
        c.rect(x,y,4*cell,3*cell,WHITE,GREEN,3,0)
        c.text("4 см",x+2*cell,333,48);c.text("3 см",139,y+1.5*cell,42)
        if point==20:
            corners=[(x,y),(x+4*cell,y),(x+4*cell,y+3*cell),(x,y+3*cell),(x,y)]
            f=t*4
            for side in range(4):
                amount=clamp(f-side);p,q=corners[side],corners[side+1]
                if amount: c.line([p,(p[0]+(q[0]-p[0])*amount,p[1]+(q[1]-p[1])*amount)],GOLD,7)
            c.text("2 · (4 + 3) = 14 см",320,388,48)
        else:
            count=min(12,int(t*13))
            for row in range(3):
                for col in range(4): c.rect(x+cell*col,y+cell*row,cell,cell,GREEN if row*4+col<count else WHITE,LINE,2,0)
            c.text("4 · 3 = 12 см²",320,388,52)
        right_angle(c,(x,y+3*cell),(20,0),(0,-20))
    elif point == 22:
        c.rect(210,127,220,220,WHITE,GREEN,3,0)
        for i in range(1,10):
            c.line([(210+i*22,127),(210+i*22,127+220*a)],LINE,1)
            c.line([(210,127+i*22),(210+220*a,127+i*22)],LINE,1)
        right_angle(c,(210,347),(18,0),(0,-18))
        c.text("1 дм",320,87,48)
        c.text("1 дм² = 100 см²",320,385,49,mix(BG,GREEN,b))
    elif point == 23:
        def project(x,y,z): return 165+70*x+45*y,285-33.5*y-62.5*z
        coords={(x,y,z):project(3*x,2*y,2*z) for x in (0,1) for y in (0,1) for z in (0,1)}
        for direction in range(3):
            show=clamp(z*1.5-direction+1)
            for key,p in coords.items():
                if key[direction]: continue
                other=list(key);other[direction]=1;q=coords[tuple(other)]
                c.line([p,q],mix(LINE,(GREEN,GOLD,CLAY)[direction],show),5 if show>.5 else 2)
        for p in coords.values(): c.dot(*p,5,INK)
        # The upper face is the x/y plane. Project a 0.35 by 0.35 square,
        # rather than drawing a screen-aligned 90-degree mark in perspective.
        vertex=project(3,0,2);px=project(2.65,0,2);py=project(3,.35,2)
        right_angle(c,vertex,(px[0]-vertex[0],px[1]-vertex[1]),(py[0]-vertex[0],py[1]-vertex[1]))
        c.text("4 + 4 + 4 = 12",320,365,55)
    elif point == 24:
        def pos(x,y,z): return 140+66*x+30*y,310-22*y-58*z
        # The full container is visible even while only its bottom layer is full.
        corners={(x,y,z):pos(x,y,z) for x in (0,3) for y in (0,2) for z in (0,2)}
        for key,p in corners.items():
            for axis,extent in enumerate((3,2,2)):
                if key[axis]: continue
                other=list(key);other[axis]=extent;c.line([p,corners[tuple(other)]],LINE,2)
        for level in range(2):
            if level and b==0: continue
            opacity=1 if level==0 else b
            for depth in (1,0):
                for col in range(3):
                    p=lambda dx,dy,dz:pos(col+dx,depth+dy,level+dz)
                    polygon(c,[p(0,0,0),p(1,0,0),p(1,0,1),p(0,0,1)],mix(BG,GREEN if level==0 else GOLD,opacity),mix(BG,INK,opacity))
                    polygon(c,[p(1,0,0),p(1,1,0),p(1,1,1),p(1,0,1)],mix(BG,PALE,opacity),mix(BG,INK,opacity))
                    polygon(c,[p(0,0,1),p(1,0,1),p(1,1,1),p(0,1,1)],mix(BG,SAND,opacity),mix(BG,INK,opacity))
        c.text(3,240,339,48);c.text(2,92,252,48);c.text(2,424,284,48)
        c.text("3 · 2 · 2 = 12 см³",320,385,48)
    elif point == 25:
        s=P5.SCALE
        for cx in (180,460):
            box=((cx-89)*s,132*s,(cx+89)*s,310*s)
            c.d.ellipse(box,fill=WHITE if cx==180 else mix(WHITE,PALE,b),outline=LINE,width=2*s)
        arc(c,(180,221),89,0,360*a,GREEN,4)
        angle=360*a
        c.line([(180,221),(180+89*math.cos(math.radians(angle)),221-89*math.sin(math.radians(angle)))],GOLD,3)
        c.line([(371,221),(549,221)],GREEN,3);c.dot(180,221,5);c.dot(460,221,5)
        c.text("r = 3;  d = 6",320,94,49)
        c.text("Окружность",180,350,29);c.text("Круг",460,350,29)
    elif point == 26:
        c.bar(70,129,500,73,5,3,PALE)
        c.line([(70,261),(570,261)],INK,3)
        for i in range(6): c.line([(70+i*100,249),(70+i*100,273)],INK,3)
        c.dot(370,261,9,GREEN)
        c.arrow(70,226,70+300*a,226,GOLD,3)
        c.text(0,70,310,48);c.text(1,570,310,48)
        c.text("3/5",370,366,64,mix(BG,GREEN,b))
    elif point == 28:
        for i in range(7):
            x=72+66*i+(20*a if i>=5 else 0)
            c.rect(x,161,58,84,GREEN if i<5 else GOLD,LINE,2,0)
        c.rect(66,155,328,96,None,mix(BG,GOLD,a),4)
        c.text("1 целая",230,111,48,mix(BG,GREEN,a))
        c.text("7/5 > 1",320,356,64,mix(BG,GREEN,b))
    elif point == 30:
        for i in range(12):
            row,col=divmod(i,4)
            x0=190+col*61;y0=125+row*72
            x1=176+row*74;y1=107+col*64
            c.rect(x0+(x1-x0)*a,y0+(y1-y0)*a,56,46,(GREEN,GOLD,CLAY)[row],LINE,1,0)
        for row in range(4): c.text("3/4",495,130+64*row,48,mix(BG,GREEN,b))
        c.text("3 : 4 = 3/4",320,383,56)
    elif point == 31:
        for i in range(11):
            row,col=divmod(i,4)
            x0=72+i*45;y0=212
            x1=178+col*58;y1=130+row*72
            c.rect(x0+(x1-x0)*a,y0+(y1-y0)*a,41,49,(GREEN,GOLD,GREEN)[row],LINE,1,0)
        if b>0:
            for row,label in enumerate(("1","1","3/4")): c.text(label,493,155+row*72,48,mix(BG,GREEN,b))
        c.text("11/4 = 2 3/4",320,382,55)
    elif point == 34:
        c.bar(70,132,500,92,8,6)
        for i in (1,3,5,7):
            fill=GREEN if i<6 else WHITE
            c.line([(70+500*i/8,133),(70+500*i/8,223)],mix(LINE,fill,a),3)
        for i in (2,4,6): c.line([(70+500*i/8,132),(70+500*i/8,224)],mix(LINE,GOLD,a),3)
        c.fraction(6,8,220,316,52);c.text("=",320,316,56);c.fraction(3,4,420,316,52,mix(BG,GREEN,b))
    elif point == 35:
        for row,den in enumerate((4,6)):
            y=111+120*row;c.fraction(1,den,64,y+34,48);c.bar(125,y,450,72,den,1)
            for i in range(1,12): c.line([(125+450*i/12,y),(125+450*i/12,y+72*a)],mix(LINE,GOLD,a),1)
        c.text("3/12  и  2/12",344,372,50,mix(BG,GREEN,b))
    elif point == 36:
        slide,join=clamp(b*2),clamp(b*2-1)
        y1,y2=120+62*join,248-66*join
        c.bar(80,y1,480,72,2,0);c.bar(80,y2,480,72,3,0)
        c.rect(82,y1+2,236,68,GREEN,GREEN,1,0);c.rect(82+240*slide,y2+2,156,68,SAND,SAND,1,0)
        for y in (y1,y2):
            for i in range(1,6): c.line([(80+i*80,y),(80+i*80,y+72*a)],LINE,1)
        if join>.99: c.bar(80,182,480,72,6,5,GREEN,gold_from=3)
        c.text("1/2 + 1/3 = 5/6",320,375,48)
    elif point == 40:
        c.bar(70,151,500,92,5,3,PALE)
        c.line([(70,126),(370,126)],GOLD,4);c.text(12,220,92,56)
        for i in range(5): c.text(4,120+i*100,198,53,mix(BG,GREEN,a))
        c.text("12 : 3 · 5 = 20",320,353,52,mix(BG,GREEN,b))
    elif point == 45:
        for i in range(36):
            row,col=divmod(i,12);target_row,target_col=divmod(i,10)
            x0=164+26*col;y0=112+68*row
            x1=190+26*target_col;y1=100+55*target_row
            c.rect(x0+(x1-x0)*a,y0+(y1-y0)*a,24,38,(GREEN,GOLD,CLAY)[row],LINE,1,0)
        if a==0:
            for row in range(3): c.text("1,2",538,131+68*row,48)
        elif b>0:
            for row,label in enumerate((1,1,1,"0,6")): c.text(label,532,119+55*row,48,mix(BG,GREEN,b))
        c.text("1,2 · 3 = 3,6",320,378,56,mix(INK,GREEN,b))
    elif point == 46:
        c.text(4,150,106,65);c.text(",",190,106,65);c.text(8,230,106,65)
        c.line([(334,78),(334,207)],INK,3);c.line([(334,146),(563,146)],INK,3);c.text(3,395,106,65)
        c.text("1," if b<.95 else "1,6",445,189,64,mix(BG,GREEN,a))
        c.text(3,150,168,57,mix(BG,GOLD,a));c.text("−",91,168,48,mix(BG,INK,a));c.line([(125,203),(182,203)],INK,2)
        c.text(1,150,242,57,mix(BG,INK,a));c.text(8,230,242,57,mix(BG,INK,b))
        for value,x in ((1,150),(8,230)): c.text(value,x,299,57,mix(BG,GOLD,b))
        c.text("−",91,299,48,mix(BG,INK,b));c.line([(125,333),(255,333)],INK,2)
        c.text(0,230,368,53,mix(BG,GREEN,b))
    elif point == 49:
        stage=progress(t,4)
        c.text("1,2 + 0,5 · 6",320,105,51)
        c.rect(145,151,350,191,PALE,GREEN,3)
        c.rect(171,174,298,76,WHITE,LINE)
        screen="0,5 · 6" if stage<.6 else "3" if stage<1.6 else "1,2 + 3" if stage<2.6 else "4,2"
        active=0 if stage<.6 else 1 if stage<1.6 else 2 if stage<2.6 else 1
        c.text(screen,320,212,56,GREEN)
        for i,key in enumerate(("×","=","+")):
            c.chip(key,220+100*i,293,SAND if i==active else WHITE,76,61,48)
        positions=(220,320,420,320);phase=min(2,int(stage));fraction=stage-phase
        c.dot(positions[phase]+(positions[phase+1]-positions[phase])*fraction,334,5,GOLD)
        c.text("Сначала произведение, затем сумма",320,385,27,MUTED)
    elif point == 50:
        q=progress(t,4);k=min(2,int(q));f=q-k
        degrees=round((30,90,130,180)[k]+((30,90,130,180)[k+1]-(30,90,130,180)[k])*f)
        deg=degrees;angle=math.radians(degrees)
        c.arrow(320,300,546,300,INK,4);c.arrow(320,300,320+226*math.cos(angle),300-226*math.sin(angle),GREEN,4)
        arc(c,(320,300),75,0,degrees,GOLD,4)
        if abs(degrees-90)<.001: c.line([(320,275),(345,275),(345,300)],GOLD,3)
        c.text(f"{deg}°",540,100,60)
        label="Острый" if degrees<90-.001 else "Прямой" if abs(degrees-90)<.001 else "Тупой" if degrees<180-.001 else "Развёрнутый"
        c.text(label,320,382,36)
    elif point == 51:
        center=(300,310);arc(c,center,180,0,180,LINE,2)
        for deg in range(0,181,10):
            theta=math.radians(deg);r=180 if deg%30==0 else 185
            c.line([(300+r*math.cos(theta),310-r*math.sin(theta)),(300+194*math.cos(theta),310-194*math.sin(theta))],INK,2)
            if deg%30==0: c.text(deg,300+216*math.cos(theta),310-216*math.sin(theta),27,MUTED)
        c.line([(300,310),(511,310)],INK,4)
        angle=math.radians(60*a)
        c.arrow(300,310,300+192*math.cos(angle),310-192*math.sin(angle),GREEN,5)
        arc(c,center,65,0,60*a,GOLD,3);c.dot(300,310,6)
        c.text("60°",520,110,56,mix(BG,GREEN,b));c.text("От нуля на начальной стороне",320,390,28,MUTED)
    elif point == 52:
        count=min(40,int(a*41));grid(c,54,135,8,5,35,count,GREEN)
        for col in range(8):
            if b>(col/8): c.rect(54+35*col,135,35,175,None,GOLD,2,0)
        c.text("8 м",194,97,48);c.text(5,28,222,48)
        c.text("40 м²",489,171,52,mix(BG,GREEN,a));c.text("5 м²/уп.",489,222,28,MUTED);c.text("8 уп.",489,267,52,mix(BG,GOLD,b))
        c.text("8 · 700 = 5600 ₽",320,376,49,mix(BG,GREEN,b))
    elif point == 53:
        for row in range(10):
            for col in range(10):
                selected=row<5 and col<5
                c.rect(76+25*col,115+25*row,25,25,mix(WHITE,GREEN,a) if selected else WHITE,LINE,1,0)
        c.rect(76,115,125,125,None,mix(LINE,GOLD,b),4)
        c.text("25%",482,158,66);c.text("= 1/4",482,238,52)
        c.text("80 : 4 = 20",320,391,55,mix(BG,GREEN,b))
    else:
        raise AssertionError(f"Missing animation {point}")
    return c.finish()


def validate_mathematics():
    assert len(TOPICS)==53 and len(EXPECTED_UNITS)==53
    source=(ROOT/"school/vilenkin5-lessons.js").read_text()
    unit_block=re.search(r"const unitRows=\[(.*?)\n\];",source,re.S)
    assert unit_block, "Cannot locate approved unit map"
    units=re.findall(r"\['([^']+)',(?:\d+|null)\]",unit_block.group(1))
    assert units==EXPECTED_UNITS, "Vilenkin unit order changed: review the animation mapping"
    assert 40706==40000+700+6 and 11-3==8 and (40-20)//4==5
    assert 43099>42999 and 30-18==12
    assert 278+146==424 and 403-178==225 and 403==300+90+13
    assert 3*4+7==19 and 19-7==12
    assert 24*13==24*3+24*10==312
    assert divmod(1206,3)==(402,0) and divmod(12,3)==(4,0) and divmod(0,3)==(0,0) and divmod(6,3)==(2,0)
    assert divmod(17,5)==(3,2) and 2<5
    assert all(2*x+2*y==2*(x+y) for x in range(1,16) for y in range(1,16))
    assert 8+3*4==20 and (8+3)*4==44 and 3**3==27
    assert [d for d in range(1,13) if 12%d==0]==[1,2,3,4,6,12]
    assert sum(map(int,str(381)))==12 and 381%3==0 and 381%9!=0
    assert 2*(4+3)==14 and 4*3==12 and 10**2==100 and 4*3==12 and 3*2*2==12
    assert 2*3==6 and F(3,5)<1 and F(2,3)<F(3,4) and F(7,5)>1
    assert F(1,4)+F(2,4)==F(3,4) and F(3,4)==F(3,4)
    assert F(11,4)==2+F(3,4) and 2+F(1,4)-F(3,4)==F(3,2)
    assert F(2,3)==F(4,6) and F(6,8)==F(3,4) and math.gcd(3,4)==1
    assert math.lcm(4,6)==12 and F(1,4)==F(3,12) and F(1,6)==F(2,12)
    assert F(1,2)+F(1,3)==F(5,6) and F(1,2)*F(2,3)==F(1,3)
    assert F(3,5)*20==12 and F(3,4)/F(1,8)==6 and F(12,1)/F(3,5)==20
    assert F(205,100)==F('2.05') and F('0.80')>F('0.75') and F('3.7')+F('0.46')==F('4.16')
    assert Decimal('3.96').quantize(Decimal('.1'),rounding=ROUND_HALF_UP)==Decimal('4.0')
    assert F('1.2')*3==F('3.6') and F('4.8')/3==F('1.6')
    assert F('.6')*F('.4')==F('.24') and F('.84')/F('.07')==12
    assert F('1.2')+F('.5')*6==F('4.2') and 0<30<90<130<180 and 180-60==120
    assert 8*5==40 and 40//5==8 and 8*700==5600 and F(25,100)*80==20


def write_assets(points=None):
    OUT.mkdir(parents=True,exist_ok=True)
    selected=sorted(set(points)) if points else list(range(1,54))
    manifest=json.loads((OUT/'manifest.json').read_text()) if len(selected)<53 else [None]*53
    for point in selected:
        frames=[render(point,i/32) for i in range(33)]
        contact=Image.new('RGB',(160*11,105*3),BG)
        for i,frame in enumerate(frames): contact.paste(frame.resize((160,105)),((i%11)*160,(i//11)*105))
        palette=contact.quantize(colors=128,method=Image.Quantize.MEDIANCUT)
        indexed=[frame.quantize(palette=palette,dither=Image.Dither.NONE) for frame in frames]
        name=f'u{point:02}'
        indexed[0].save(OUT/(name+'.gif'),save_all=True,append_images=indexed[1:],duration=[700]+[150]*31+[1100],loop=0,disposal=2,optimize=True)
        with Image.open(OUT/(name+'.gif')) as gif:
            count=gif.n_frames;duration=sum(frame.info.get('duration',0) for frame in ImageSequence.Iterator(gif))
            gif.seek(count-1);gif.convert('RGB').save(OUT/(name+'.png'),compress_level=9)
        manifest[point-1]={'id':name,'point':point,'src':f'vilenkin5-media/{name}.gif','poster':f'vilenkin5-media/{name}.png','title':TOPICS[point-1][0],'description':TOPICS[point-1][1],'frames':count,'durationMs':duration,'width':W,'height':H}
        print(name,count,duration,flush=True)
    payload=json.dumps(manifest,ensure_ascii=False,indent=2)
    (OUT/'manifest.json').write_text(payload+'\n')
    DATA_JS.write_text('// Generated by tools/build-vilenkin5-animations.py.\nwindow.Vilenkin5MediaData = '+payload+';\n')


def check_assets():
    manifest=json.loads((OUT/'manifest.json').read_text())
    assert [item['id'] for item in manifest]==[f'u{i:02}' for i in range(1,54)]
    assert [item['point'] for item in manifest]==list(range(1,54))
    payload=json.dumps(manifest,ensure_ascii=False,indent=2)
    assert DATA_JS.read_text()=='// Generated by tools/build-vilenkin5-animations.py.\nwindow.Vilenkin5MediaData = '+payload+';\n'
    hashes=set()
    for point,item in enumerate(manifest,1):
        name=item['id'];assert item['src']==f'vilenkin5-media/{name}.gif' and item['poster']==f'vilenkin5-media/{name}.png'
        assert (item['title'],item['description'])==TOPICS[point-1]
        assert len(item['description'])>=70 and item['width']==W and item['height']==H
        path=OUT/(name+'.gif');digest=hashlib.sha256(path.read_bytes()).hexdigest()
        assert digest not in hashes,f'Duplicate Vilenkin topic animation: {name}';hashes.add(digest)
        with Image.open(path) as gif:
            assert gif.size==(W,H) and gif.info.get('loop')==0
            assert gif.n_frames==item['frames'] and gif.n_frames>=5, f'Too few visual steps: {name}'
            duration=sum(frame.info.get('duration',0) for frame in ImageSequence.Iterator(gif))
            assert duration==item['durationMs'] and 5000<=duration<=8000
            gif.seek(gif.n_frames-1);final=gif.convert('RGB')
        with Image.open(OUT/(name+'.png')) as poster:
            assert poster.size==(W,H) and ImageChops.difference(poster.convert('RGB'),final).getbbox() is None
    print('VILENKIN5_ANIMATIONS_OK: 53 unique GIFs, 53 exact final-frame posters, mathematics, curriculum mapping and both manifests checked')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true',help='read and validate assets without recreating them')
    parser.add_argument('--points',type=int,nargs='+',choices=range(1,54),help='rebuild only these points, preserving other completed assets')
    parser.add_argument('--peterson-source',type=Path,default=ROOT/'tools/build-peterson5-animations.py',help='shared deterministic drawing source, needed only when rebuilding')
    args=parser.parse_args()
    if args.check and args.points: parser.error('--points rebuilds assets and cannot be combined with --check')
    configure_metadata();validate_mathematics()
    if not args.check:
        load_drawing(args.peterson_source);write_assets(args.points)
    check_assets()
