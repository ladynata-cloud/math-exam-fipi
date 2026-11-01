#!/usr/bin/env python3
"""Rebuild the three equation-method handouts for the separate Peterson 6 route.

The original task conditions, preparation exercises, and final answers are
preserved. Homework contains prompts and writing space, not a solution key.
Peterson6_Procenty_340.pdf is deliberately outside this generator's outputs.

Requires reportlab, matplotlib, and pypdf. Mathematical expressions are native
PDF text with drawn fraction bars (including symbolic fractions), not bitmaps.
Run with --check-only for the exact-rational mathematical preflight.
"""

from __future__ import annotations

import argparse
from fractions import Fraction as F
from pathlib import Path
import hashlib
import os
import re
import tempfile

os.environ.setdefault("MPLCONFIGDIR", str(Path(tempfile.gettempdir()) / "mathexam-peterson6-mpl"))

from matplotlib.font_manager import FontProperties
from matplotlib.mathtext import MathTextParser
from pypdf import PdfReader
from reportlab import rl_config
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    Flowable, KeepTogether, PageBreak, Paragraph, SimpleDocTemplate,
    Spacer, Table, TableStyle,
)


REPO = Path(__file__).resolve().parents[1]
OUTPUT_NAMES = (
    "Peterson6_Shpargalki.pdf",
    "Maxim_Peterson6_Novye_shpargalki.pdf",
    "Peterson6_Domashnyaya_rabota.pdf",
)
PUBLIC_URL = "https://mathexam.space/trainers/maxim-peterson6/"
GREEN = colors.HexColor("#216A50")
INK = colors.HexColor("#22332C")
MUTED = colors.HexColor("#59675F")
PALE = colors.HexColor("#EFF6F1")
LINE = colors.HexColor("#C7D8CE")
PAGE_W, PAGE_H = A4
CONTENT_W = PAGE_W - 88
PARSER = MathTextParser("path")
MATH_FONTS = {}
rl_config.invariant = 1


def register_fonts() -> None:
    font_dir = Path("/usr/share/fonts/truetype/dejavu")
    pdfmetrics.registerFont(TTFont("PetersonSans", str(font_dir / "DejaVuSans.ttf")))
    pdfmetrics.registerFont(TTFont("PetersonBold", str(font_dir / "DejaVuSans-Bold.ttf")))
    pdfmetrics.registerFontFamily(
        "PetersonSans", normal="PetersonSans", bold="PetersonBold",
        italic="PetersonSans", boldItalic="PetersonBold",
    )


STYLES = {
    "body": ParagraphStyle(
        "body", fontName="PetersonSans", fontSize=14, leading=19,
        textColor=INK, spaceAfter=7, alignment=TA_LEFT,
    ),
    "small": ParagraphStyle(
        "small", fontName="PetersonSans", fontSize=12, leading=16.5,
        textColor=MUTED, spaceAfter=6,
    ),
    "title": ParagraphStyle(
        "title", fontName="PetersonBold", fontSize=23, leading=28,
        textColor=INK, spaceAfter=16,
    ),
    "section": ParagraphStyle(
        "section", fontName="PetersonBold", fontSize=16, leading=21,
        textColor=GREEN, spaceBefore=10, spaceAfter=7,
    ),
    "cell": ParagraphStyle(
        "cell", fontName="PetersonSans", fontSize=13, leading=17,
        textColor=INK, spaceAfter=0,
    ),
    "cue": ParagraphStyle(
        "cue", fontName="PetersonSans", fontSize=11.5, leading=15.5,
        textColor=GREEN, spaceAfter=5,
    ),
}


def p(text: str, style: str = "body") -> Paragraph:
    return Paragraph(text, STYLES[style])


def title(text: str) -> Paragraph:
    return p(text, "title")


def section(text: str) -> Paragraph:
    return p(text, "section")


class MathLine(Flowable):
    """Render mathtext positions using embedded Unicode fonts and PDF lines."""

    def __init__(self, expression: str, size: float = 17, gap: float = 8):
        super().__init__()
        # TeX permits one-character unbraced arguments; mathtext requires braces.
        expression = re.sub(
            r"\\frac(?!\{)([A-Za-z0-9])(?:\{([^{}]+)\}|([A-Za-z0-9]))",
            lambda match: r"\frac{" + match[1] + "}{" + (match[2] or match[3]) + "}",
            expression,
        )
        self.expression = expression
        self.size = size
        self.gap = gap
        self.parsed = PARSER.parse(
            "$" + expression + "$", dpi=72,
            prop=FontProperties(family="DejaVu Sans", size=size),
        )
        for font, *_ in self.parsed.glyphs:
            if font.fname not in MATH_FONTS:
                name = "PetersonMath-" + Path(font.fname).stem
                pdfmetrics.registerFont(TTFont(name, font.fname))
                MATH_FONTS[font.fname] = name
        self.width = float(self.parsed.width) + 4
        self.height = float(self.parsed.height) + gap
        self.scale = 1.0

    def wrap(self, available_width: float, available_height: float):
        self.scale = min(1.0, available_width / max(self.width, 1))
        return self.width * self.scale, self.height * self.scale

    def draw(self):
        c = self.canv
        c.saveState()
        c.scale(self.scale, self.scale)
        c.setFillColor(INK)
        base = float(self.parsed.depth) + self.gap / 2
        for font, fontsize, codepoint, x, y in self.parsed.glyphs:
            c.setFont(MATH_FONTS[font.fname], float(fontsize))
            c.drawString(float(x) + 2, float(y) + base, chr(codepoint))
        for x, y, width, height in self.parsed.rects:
            c.rect(float(x) + 2, float(y) + base, float(width), float(height),
                   fill=1, stroke=0)
        c.restoreState()


def m(expression: str, size: float = 17) -> MathLine:
    return MathLine(expression, size)


def box(heading: str, text: str) -> Table:
    table = Table([[p("<b>" + heading + "</b><br/>" + text, "cell")]],
                  colWidths=[CONTENT_W])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.5, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    table.spaceBefore = 7
    table.spaceAfter = 10
    return table


def table(rows, widths=None, header=True, padding=7) -> Table:
    converted = [
        [p(cell, "cell") if isinstance(cell, str) else cell for cell in row]
        for row in rows
    ]
    obj = Table(converted, colWidths=widths or [CONTENT_W / len(rows[0])] * len(rows[0]))
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, LINE),
    ]
    if header:
        commands.append(("BACKGROUND", (0, 0), (-1, 0), PALE))
    obj.setStyle(TableStyle(commands))
    obj.spaceAfter = 10
    return obj


class WritingLines(Flowable):
    def __init__(self, count=4, spacing=21):
        super().__init__()
        self.count = count
        self.spacing = spacing
        self.width = CONTENT_W
        self.height = count * spacing + 7

    def draw(self):
        self.canv.setStrokeColor(LINE)
        self.canv.setLineWidth(0.45)
        for index in range(self.count):
            y = self.height - 12 - index * self.spacing
            self.canv.line(0, y, self.width, y)


def page(heading: str, *items):
    return [title(heading), *items]


def general_pages():
    return [
        page("Путь, скорость и время",
            p("Скорость постоянная. Сначала обозначь искомую величину буквой и подпиши её единицу измерения."),
            table([
                ["Что ищем", "Связь величин", "Пример"],
                ["Путь s", m(r"s=vt", 16), m(r"s=6\cdot3=18", 16)],
                ["Скорость v", m(r"vt=s", 16), m(r"3v=18,\quad v=6", 16)],
                ["Время t", m(r"vt=s", 16), m(r"6t=18,\quad t=3", 16)],
            ], [123, 132, CONTENT_W - 255]),
            p("В примере путь измерен в километрах, скорость - в км/ч, время - в часах.", "small"),
            section("План решения"),
            p("<b>1.</b> Пусть x - неизвестная величина.<br/>"
              "<b>2.</b> Вырази через x остальные величины.<br/>"
              "<b>3.</b> Объясни, какие величины равны, и составь уравнение.<br/>"
              "<b>4.</b> Реши его и ответь на вопрос задачи.<br/>"
              "<b>5.</b> Проверь ответ по исходному условию."),
            section("Минуты переводим в часы"),
            table([
                ["Минуты", "Часы", "Минуты", "Часы"],
                ["15", m(r"\frac14=0{,}25", 14), "30", m(r"\frac12=0{,}5", 14)],
                ["20", m(r"\frac13", 14), "40", m(r"\frac23", 14)],
                ["45", m(r"\frac34=0{,}75", 14), "75", m(r"1\frac14=1{,}25", 14)],
                ["80", m(r"1\frac13", 14), "90", m(r"1{,}5", 14)],
            ], [79, 175, 79, CONTENT_W - 333], padding=4),
            p("Минуты дели на 60; часы умножай на 60. 1 ч 20 мин - это 80 мин. А 1,2 ч - это 1 ч 12 мин.", "small"),
            box("Согласуй единицы", "При скорости в км/ч подставляй время в часах; при скорости в м/мин - в минутах.")),
        page("Четыре схемы движения",
            p("Определи, уменьшается или увеличивается промежуток. Подпиши направление движения каждого участника."),
            section("1. Навстречу"),
            p("Скорости 4 км/ч и 5 км/ч. Промежуток уменьшается."),
            m(r"v=4+5=9"),
            p("Если начальный промежуток S км, а до встречи x ч, то 9x = S."),
            section("2. В противоположные стороны"),
            p("Скорости 12 км/ч и 18 км/ч. Промежуток увеличивается."),
            m(r"v=12+18=30"),
            p("Через t часов расстояние между участниками: S = 30t."),
            section("3. Вдогонку: сзади быстрее"),
            p("Сзади 12 км/ч, впереди 8 км/ч. Промежуток уменьшается."),
            m(r"v=12-8=4"),
            p("При начальном промежутке S км время догонки x ч находим из 4x = S."),
            section("4. С отставанием: впереди быстрее"),
            p("Сзади 8 км/ч, впереди 12 км/ч. Промежуток увеличивается на 4 км за каждый час."),
            m(r"v=12-8=4"),
            box("Не забудь начальный промежуток", "Новое расстояние равно прежнему плюс увеличение. При одинаковых скоростях и одном направлении промежуток не меняется.")),
        page("Тип №303. Движение навстречу",
            p("Между городами 270 км. Два поезда выехали одновременно навстречу. Первый едет в 1,25 раза быстрее второго. Сколько километров проедет первый до встречи?"),
            section("1. Обозначим неизвестную скорость"),
            p("Пусть x км/ч - скорость второго поезда, x &gt; 0. Тогда скорость первого равна 1,25x км/ч."),
            section("2. Найдём скорость сближения"),
            m(r"x+1{,}25x=2{,}25x"),
            section("3. Выразим время до встречи"),
            p("Расстояние делим на скорость сближения. Оба поезда движутся одинаковое время."),
            m(r"t=\frac{270}{2{,}25x}=\frac{120}{x}"),
            section("4. Вычислим путь первого"),
            m(r"s_1=1{,}25x\cdot\frac{120}{x}=150"),
            box("Ответ: 150 км", "Второй поезд проехал 120 км. Проверка: 150 + 120 = 270; 150 : 120 = 1,25."),
            box("Почему x не найдено?", "Неизвестная скорость сократилась. По условию нельзя отдельно узнать скорости и время; для вычисления пути это не требуется.")),
        page("Тип №305. Найти скорости",
            p("Участники выехали из одной точки в противоположные стороны. Скорость второго в 3 раза больше скорости первого. Через 1 ч 15 мин между ними 90 км."),
            section("1. Время и неизвестная"),
            m(r"1+\frac{15}{60}=1{,}25"),
            p("Пусть x км/ч - скорость первого. Тогда скорость второго равна 3x км/ч."),
            section("2. Составим уравнение"),
            p("Скорость удаления x + 3x. За 1,25 ч расстояние стало 90 км."),
            m(r"1{,}25(x+3x)=90"),
            section("3. Решим и найдём обе скорости"),
            m(r"5x=90,\qquad x=18"),
            m(r"3x=3\cdot18=54"),
            box("Ответ: 18 км/ч и 54 км/ч", "Проверка: (18 + 54) · 1,25 = 90 км; 54 : 18 = 3."),
            box("Если один начал позже", "Времена движения разные. Сначала найди путь первого до старта второго, затем составь уравнение для догонки.")),
        page("Движение по реке",
            p("Собственная скорость - скорость лодки в стоячей воде. Плот без мотора движется со скоростью течения."),
            table([
                ["Направление", "Скорость"],
                ["По течению", "собственная + течение"],
                ["Против течения", "собственная - течение"],
                ["Плот без мотора", "скорость течения"],
            ], [196, CONTENT_W - 196]),
            section("Если известны обе скорости движения"),
            p("Пусть по течению 19 км/ч, против течения 13 км/ч. Обозначим скорость течения x км/ч. Собственную скорость можно выразить двумя способами:"),
            m(r"19-x=13+x"),
            m(r"2x=6,\qquad x=3"),
            p("Собственная скорость: 19 - 3 = 16 км/ч. Проверка: 16 + 3 = 19; 16 - 3 = 13."),
            p("Разность скоростей движения содержит две скорости течения. Поэтому её делят на 2. Половина суммы даёт собственную скорость."),
            section("Туда и обратно"),
            p("Для каждого участка обозначь своё время. Если путь в одну сторону S, скорости по течению a и против течения b:"),
            m(r"at_1=S,\qquad bt_2=S"),
            m(r"t_1=\frac{S}{a},\quad t_2=\frac{S}{b},\quad t=t_1+t_2"),
            box("Проверь смысл", "На равные пути уходит разное время. Для движения против течения собственная скорость лодки должна быть больше скорости течения.")),
        page("Проценты, числа и дроби",
            p("Один процент - одна сотая выбранной величины. Сначала назови, что принято за 100%."),
            m(r"1\%=\frac1{100}=0{,}01;\quad100\%=1;\quad50\%=0{,}5"),
            section("Проценты в число: раздели на 100"),
            table([
                ["Процент", "Число", "Процент", "Число"],
                ["9%", "0,09", "4,5%", "0,045"],
                ["0,6%", "0,006", "175%", "1,75"],
            ], padding=6),
            section("Число в проценты: умножь на 100"),
            m(r"0{,}12=12\%;\quad0{,}035=3{,}5\%;\quad1{,}7=170\%", 16),
            m(r"\frac38=\left(\frac38\cdot100\right)\%=37{,}5\%", 16),
            section("Смешанное число перед знаком %"),
            m(r"16\frac23\%=\frac{50}{3}:100=\frac{50}{300}=\frac16", 16),
            m(r"12\frac12\%=12{,}5:100=0{,}125=\frac18", 16),
            p("Если десятичная запись бесконечная, оставь точную дробь. Для положительной величины: меньше 100% - число меньше 1; больше 100% - число больше 1.", "small"),
            box("«Составляет» и «увеличили на»", "Стало 150% от прежнего - стало 1,5 прежней величины. Увеличили на 150% - стало 250%, то есть 2,5 прежней величины.")),
        page("Проценты: составляем уравнение",
            section("1. Процент от известной величины"),
            p("В книге 200 страниц. Прочитано 15%. Сколько страниц прочитано? Пусть x - число прочитанных страниц."),
            m(r"\frac{x}{200}=0{,}15,\qquad x=30"),
            p("Ответ: 30 страниц. Проверка: 30 : 200 · 100% = 15%.", "small"),
            section("2. Вся величина по её проценту"),
            p("24 страницы - это 15% книги. Сколько страниц в книге? Пусть x - общее число страниц; это 100%."),
            m(r"0{,}15x=24,\qquad x=\frac{24}{0{,}15}=160"),
            p("Ответ: 160 страниц. Проверка: 160 · 0,15 = 24 страницы.", "small"),
            section("3. Сколько процентов составляет часть"),
            p("Из 80 карточек разобрали 28. Пусть x% - доля разобранных карточек."),
            m(r"\frac{x}{100}=\frac{28}{80},\qquad80x=2800,\qquad x=35", 16),
            p("Ответ: 35%. Проверка: 80 · 0,35 = 28 карточек.", "small"),
            box("Вопрос перед уравнением", "Что принято за 100%? Что обозначает x: всю величину, её часть или количество процентов? Единицу подпиши сразу."),
            p("Продолжение темы №340: №359 - величина по проценту; №367 - процентное отношение; №405 - процент от величины.", "small")),
    ]


def textbook_pages():
    return [
        page("№223. Единицы и неизвестная",
            box("Метры в минуту → километры в час", "Умножь число метров в минуту на 60 и раздели на 1000. Сначала согласуй единицы, затем составляй уравнение."),
            section("№223(1). Скорость по течению"),
            p("Собственная скорость 14,8 км/ч; течение 40 м/мин. Найди скорость по течению."),
            m(r"40\cdot60=2400;\qquad\frac{2400}{1000}=2{,}4", 16),
            p("Пусть x км/ч - скорость по течению. Если убрать добавку течения, получится собственная скорость."),
            m(r"x-2{,}4=14{,}8,\qquad x=17{,}2"),
            p("Ответ: 17,2 км/ч. Проверка: 17,2 - 14,8 = 2,4 км/ч.", "small"),
            section("№223(2). Скорость против течения известна"),
            p("Против течения катер идёт 280 м/мин; течение 2,7 км/ч. Найди собственную скорость и скорость по течению."),
            m(r"\frac{280\cdot60}{1000}=16{,}8"),
            p("Пусть x км/ч - собственная скорость. Против течения скорость меньше на 2,7 км/ч."),
            m(r"x-2{,}7=16{,}8,\qquad x=19{,}5"),
            m(r"v=19{,}5+2{,}7=22{,}2"),
            box("Ответ и проверка", "Собственная скорость 19,5 км/ч; по течению 22,2 км/ч. Проверка: 19,5 - 2,7 = 16,8; 22,2 - 16,8 = 2 · 2,7.")),
        page("№306. Две трубы и бассейн",
            p("Первая труба наполняет бассейн за 9 ч. Обе вместе - за 3 ч 36 мин. За сколько часов наполнит его вторая труба одна?"),
            section("1. Выберем неизвестную"),
            p("Весь бассейн примем за 1. Пусть x бассейна в час - производительность второй трубы. Первая за час наполняет одну девятую бассейна."),
            m(r"3+\frac{36}{60}=3{,}6=\frac{18}{5}"),
            section("2. Свяжем работу, скорость и время"),
            p("Совместная производительность, умноженная на время, даёт один полный бассейн."),
            m(r"\left(\frac19+x\right)\cdot\frac{18}{5}=1"),
            section("3. Найдём производительность второй трубы"),
            m(r"\frac19+x=\frac5{18}"),
            m(r"x=\frac5{18}-\frac2{18}=\frac3{18}=\frac16"),
            section("4. Найдём время t"),
            m(r"\frac16\,t=1,\qquad t=6"),
            box("Ответ: 6 часов", "Проверка: за 3,6 часа первая труба заполнит 0,4 бассейна, вторая - 0,6. Вместе получится 1 бассейн."),
            p("Вычитать 9 - 3,6 нельзя: складываются производительности труб, а не времена заполнения по отдельности.", "small")),
        page("Проценты: что обозначить за x?",
            p("В задачах по реке сначала назови скорость, принятую за 100%. Это собственная скорость катера."),
            section("Собственная скорость известна"),
            p("Собственная скорость 20 км/ч. Течение составляет 12% от неё. Пусть x км/ч - скорость течения."),
            m(r"\frac{x}{20}=0{,}12,\qquad x=2{,}4"),
            p("Проверка: 2,4 : 20 · 100% = 12%.", "small"),
            section("Известна только скорость течения"),
            p("Течение 2,4 км/ч - это 12% собственной скорости. Теперь x км/ч обозначает собственную скорость."),
            m(r"0{,}12x=2{,}4,\qquad x=20"),
            p("Проверка: 20 · 0,12 = 2,4 км/ч.", "small"),
            box("В №226", "Собственная скорость 11,2 км/ч известна. Она равна 100%. Неизвестна скорость течения, составляющая 25% от неё."),
            box("В №245", "Скорость плота 2,4 км/ч известна. Она равна 12% собственной скорости катера. Неизвестна сама собственная скорость."),
            box("Проверяй размер ответа", "Если течение составляет 12% собственной скорости, собственная скорость больше течения. Ответ 0,288 км/ч здесь не подходит.")),
        page("№226. Течение задано в процентах",
            p("Между причалами 16,8 км. Собственная скорость лодки 11,2 км/ч. Течение составляет 25% от неё. Найди время туда и обратно."),
            section("1. Скорость течения"),
            p("Пусть x км/ч - скорость течения. За 100% принята собственная скорость."),
            m(r"25\%=\frac14=0{,}25;\qquad\frac{x}{11{,}2}=0{,}25", 16),
            m(r"x=11{,}2\cdot0{,}25=2{,}8"),
            section("2. Скорости и времена на участках"),
            p("По течению: 11,2 + 2,8 = 14 км/ч. Против течения: 11,2 - 2,8 = 8,4 км/ч. Обозначим времена t₁ и t₂."),
            m(r"14t_1=16{,}8,\qquad t_1=1{,}2"),
            m(r"8{,}4t_2=16{,}8,\qquad t_2=2"),
            section("3. Общее время"),
            m(r"t=1{,}2+2=3{,}2"),
            p("0,2 ч = 0,2 · 60 = 12 мин."),
            box("Ответ: 3 ч 12 мин", "Проверка: 14 · 1,2 = 16,8 км; 8,4 · 2 = 16,8 км. Для обоих участков получен путь из условия."),
            p("Удваивать время одного участка нельзя: расстояния одинаковые, скорости и времена разные.", "small")),
        page("№245. Плот помогает найти течение",
            p("Плот движется со скоростью 2,4 км/ч. Это 12% собственной скорости катера. Катер проходит 123,2 км по течению и возвращается обратно. Найди время всего пути."),
            section("1. Собственная скорость"),
            p("Скорость течения равна скорости плота: 2,4 км/ч. Пусть x км/ч - собственная скорость катера, то есть 100%."),
            m(r"0{,}12x=2{,}4,\qquad x=20"),
            section("2. Скорости и времена"),
            p("По течению: 20 + 2,4 = 22,4 км/ч. Против течения: 20 - 2,4 = 17,6 км/ч."),
            m(r"22{,}4t_1=123{,}2,\qquad t_1=5{,}5"),
            m(r"17{,}6t_2=123{,}2,\qquad t_2=7"),
            section("3. Сложим времена"),
            m(r"t=5{,}5+7=12{,}5"),
            box("Ответ: 12,5 ч = 12 ч 30 мин", "Проверка: 20 · 0,12 = 2,4 км/ч; 22,4 · 5,5 = 123,2 км; 17,6 · 7 = 123,2 км."),
            p("Собственная скорость 20 км/ч больше скорости течения, поэтому катер может вернуться против течения.", "small")),
        page("№303. Скорость сближения и x",
            p("Между городами 385 км. Два поезда выехали одновременно навстречу друг другу. Первый движется в 1,2 раза быстрее второго. Какой путь проедет первый до встречи?"),
            section("1. Обозначим скорости"),
            p("Пусть x км/ч - скорость второго, x &gt; 0. Тогда скорость первого равна 1,2x км/ч."),
            section("2. Выразим скорость сближения и время"),
            m(r"v=x+1{,}2x=2{,}2x"),
            m(r"t=\frac{385}{2{,}2x}=\frac{175}{x}"),
            section("3. Найдём путь первого"),
            m(r"s_1=1{,}2x\cdot\frac{175}{x}=210"),
            box("Ответ: 210 км", "Второй поезд проехал 175 км. Проверка: 210 + 175 = 385; 210 : 175 = 1,2. Время движения у поездов одинаковое."),
            box("x обозначает скорость, а не путь", "Скорость x сократилась. Число 175 - путь второго поезда в километрах. Нельзя записывать x = 175 км/ч: отдельные скорости в условии не определены.")),
        page("№305. Скорости в отношении 1 : 3",
            p("Велосипедист и мотоциклист выехали одновременно из одной точки в противоположные стороны. Мотоциклист движется в 3 раза быстрее. Через 1 ч 20 мин между ними 96 км."),
            section("1. Время и неизвестная скорость"),
            m(r"1+\frac{20}{60}=\frac43"),
            p("Пусть x км/ч - скорость велосипедиста. Тогда скорость мотоциклиста 3x км/ч, а скорость удаления x + 3x."),
            section("2. Составим и решим уравнение"),
            m(r"\frac43(x+3x)=96"),
            m(r"\frac{16}{3}x=96"),
            p("Умножим обе части уравнения на 3."),
            m(r"16x=288,\qquad x=18"),
            m(r"3x=54"),
            box("Ответ: 18 км/ч и 54 км/ч", "Первая скорость - велосипедиста, вторая - мотоциклиста. Их отношение 1 : 3."),
            m(r"(18+54)\cdot\frac43=96"),
            p("Дополнительная проверка: 80 мин = 1 ч 20 мин; 96 : 80 = 1,2 км/мин; 1,2 · 60 = 72 км/ч - скорость удаления.", "small")),
    ]


HOMEWORK = {
    1: ("Часы и минуты", "Вырази в часах: 15 мин; 40 мин; 1 ч 15 мин; 1 ч 20 мин. Вырази в минутах: 0,5 ч; 0,75 ч; 1,2 ч; 1,5 ч."),
    2: ("Навстречу друг другу", "Из двух посёлков на расстоянии 18 км одновременно навстречу вышли два пешехода. Их скорости 4 км/ч и 5 км/ч. Через сколько часов они встретятся? Сколько километров пройдёт каждый?"),
    3: ("В противоположные стороны", "Из одной точки одновременно в противоположных направлениях выехали два велосипедиста со скоростями 12 км/ч и 18 км/ч. Какое расстояние будет между ними через 40 минут?"),
    4: ("Кто догоняет?", "Два лыжника идут в одном направлении. Впереди идёт лыжник со скоростью 9,6 км/ч, позади - со скоростью 13,2 км/ч. Сейчас между ними 2,7 км. Через сколько минут второй догонит первого?"),
    5: ("Промежуток увеличивается", "Два велосипедиста едут в одном направлении. Впереди едет велосипедист со скоростью 14 км/ч, позади - со скоростью 10 км/ч. Сейчас между ними 1,5 км. Какое расстояние будет между ними через 30 минут?"),
    6: ("Один выехал позже", "В 9:00 из посёлка выехал велосипедист со скоростью 12 км/ч. В 9:30 вслед за ним выехал мотоциклист со скоростью 36 км/ч. Через сколько минут после своего выезда мотоциклист догонит велосипедиста? Во сколько это произойдёт?"),
    7: ("Аналог типа №303", "Из двух городов, расстояние между которыми 315 км, одновременно навстречу друг другу выехали два поезда. Скорость первого поезда в 1,25 раза больше скорости второго. Какое расстояние пройдёт первый поезд до встречи?"),
    8: ("Аналог типа №305", "Из одного посёлка одновременно в противоположных направлениях выехали велосипедист и мотоциклист. Скорость мотоциклиста в 4 раза больше скорости велосипедиста. Через 1 час 15 минут между ними стало 100 км. Найди скорость каждого."),
    9: ("По течению и против течения", "Собственная скорость катера равна 18 км/ч, а скорость течения - 2,5 км/ч. Найди скорость катера по течению и против течения."),
    10: ("Найди течение", "Скорость катера по течению равна 22 км/ч, а против течения - 14 км/ч. Найди скорость течения и собственную скорость катера. Объясни, почему разность 22 - 14 нужно разделить на 2."),
    11: ("Плот", "Плот без мотора плывёт со скоростью течения. Скорость течения равна 2,4 км/ч. Какое расстояние проплывёт плот за 1 час 15 минут?"),
    12: ("Два участка пути", "Собственная скорость катера равна 15 км/ч, скорость течения - 3 км/ч. Катер прошёл 36 км по течению, а затем вернулся обратно. Сколько времени занял весь путь? Время остановки не учитывать."),
    13: ("Задача по желанию", "Катер прошёл путь между двумя пристанями по течению за 4 часа, а обратно - за 5 часов. Собственная скорость катера равна 18 км/ч. Найди скорость течения и расстояние между пристанями."),
    14: ("Переведи проценты в числа", "Запиши десятичную или обыкновенную дробь. Если десятичная запись бесконечная, оставь точную обыкновенную дробь."),
    15: ("Переведи числа в проценты", "Для двух третей оставь точный ответ в виде смешанного числа процентов. Округлять не нужно."),
    16: ("Найди и исправь ошибки", "а) 0,6% = 0,6. б) 2,5 = 25%. в) 40 мин = 0,4 ч."),
    17: ("Процент от числа", "Найди 18% от 250. Сначала запиши, какое число соответствует 18%."),
    18: ("Найди всё число", "Число 36 составляет 12% некоторого числа. Найди это число."),
    19: ("Какая часть в процентах?", "Из 60 заданий ученик решил 21. Сколько процентов заданий решено?"),
    20: ("Скидка", "Блокнот стоил 240 рублей. На него сделали скидку 15%. Сколько рублей стоит блокнот после скидки?"),
}

CUES = {
    2: "Пусть x ч - время до встречи. Вырази оба пути и их сумму.",
    3: "Пусть x км - расстояние между велосипедистами. Запиши равенство по формуле пути, согласовав единицы времени.",
    4: "Пусть x ч - время догонки. Вырази, на сколько километров второй сокращает промежуток за это время.",
    5: "Пусть x км - новый промежуток. Вырази его увеличение через x и через скорости участников.",
    6: "Пусть x ч - время движения мотоциклиста. Велосипедист движется на полчаса дольше. При встрече их пути равны.",
    7: "Пусть x км/ч - скорость второго поезда. Вырази скорость сближения, время до встречи и путь первого. Неизвестная скорость сократится.",
    8: "Пусть x км/ч - скорость велосипедиста. Вырази скорость мотоциклиста и расстояние между ними через x.",
    9: "Обозначь искомые скорости x и y. Для каждой составь своё равенство со собственной скоростью и течением.",
    10: "Пусть x км/ч - скорость течения. Вырази собственную скорость через 22 и через 14. Эти выражения равны.",
    11: "Пусть x км - путь плота. Запиши равенство по формуле пути и проверь единицы времени.",
    12: "Обозначь времена участков t₁ и t₂. Для каждого запиши уравнение: скорость · время = путь. Затем найди сумму времён.",
    13: "Пусть x км/ч - скорость течения. Вырази два пути; по условию они равны. Проверь возможность движения против течения.",
    17: "Пусть x - искомое число. Какая доля числа 250 соответствует x? Составь равенство.",
    18: "Пусть x - всё число, принятое за 100%. Вырази 12% от x и составь уравнение.",
    19: "Пусть x% - доля решённых заданий. Запиши отношение решённых заданий ко всем и вырази его через x.",
    20: "Пусть x рублей - новая цена. Вырази сумму новой цены и скидки; она равна прежней цене.",
}


def homework_task(number: int, lines: int = 4):
    heading, prompt = HOMEWORK[number]
    suffix = "*" if number == 13 else ""
    content = [section(f"{number}{suffix}. {heading}"), p(prompt)]
    if number in CUES:
        content.append(p(CUES[number], "cue"))
    content.append(WritingLines(lines))
    return KeepTogether(content)


def homework_pages():
    return [
        page("Разминка и движение",
            p("Имя: ____________________ Дата: ______________", "small"),
            p("Обозначь неизвестную, составь буквенную модель или уравнение, реши и проверь. Скорости постоянны, остановок нет. №13* - по желанию; №17-20 - следующий шаг по процентам.", "small"),
            homework_task(1, 2), homework_task(2, 4), homework_task(3, 3)),
        page("Догонка и отставание",
            homework_task(4, 3), homework_task(5, 3), homework_task(6, 3)),
        page("Скорости, неизвестная и время",
            p("Перед решением объясни: одинаковое ли время двигались участники?", "small"),
            homework_task(7, 7), homework_task(8, 7),
            p("Проверка: сложи пути участников и сравни с расстоянием из условия. Проверь отношение скоростей.", "small")),
        page("Река: начальные задачи",
            homework_task(9, 4), homework_task(10, 4), homework_task(11, 4)),
        page("Река: туда и обратно",
            homework_task(12, 8), homework_task(13, 8),
            p("Проверка: путь туда должен быть равен пути обратно.", "small")),
        page("Проценты и числа",
            section("14. " + HOMEWORK[14][0]), p(HOMEWORK[14][1], "small"),
            table([
                ["Процент", "Решение и ответ"],
                ["а) 7%", ""], ["б) 24%", ""], ["в) 6,5%", ""],
                ["г) 0,8%", ""], ["д) 135%", ""], ["е) 420%", ""],
                [m(r"\mathrm{ж)}\quad12\frac12\%", 15), ""],
                [m(r"\mathrm{з)}\quad8\frac13\%", 15), ""],
            ], [143, CONTENT_W - 143], padding=5),
            section("15. " + HOMEWORK[15][0]),
            table([
                ["Число", "Ответ", "Число", "Ответ"],
                ["а) 0,09", "", m(r"\mathrm{е)}\quad\frac9{25}", 15), ""],
                ["б) 0,46", "", "ж) 1,6", ""],
                ["в) 0,7", "", "з) 3,2", ""],
                ["г) 0,032", "", m(r"\mathrm{и)}\quad\frac23", 15), ""],
                [m(r"\mathrm{д)}\quad\frac7{20}", 15), "", "", ""],
            ], [116, 138, 116, CONTENT_W - 370], padding=4),
            p(HOMEWORK[15][1], "small")),
        page("Проверка и первые уравнения",
            homework_task(16, 4), homework_task(17, 7), homework_task(18, 7)),
        page("Процентное отношение и скидка",
            homework_task(19, 7), homework_task(20, 7),
            box("Проверь себя", "Подставь найденное значение в исходное условие. Ответ должен содержать нужную величину и единицу: число процентов или цену в рублях.")),
    ]


def mathematical_preflight() -> dict:
    """Check all preserved word-problem answers against their conditions."""
    # Three distinct #303 conditions must never be accidentally interchanged.
    routes = ((F(270), F("1.25"), F(150)),
              (F(315), F("1.25"), F(175)),
              (F(385), F("1.2"), F(210)))
    for distance, ratio, faster_path in routes:
        slower_path = distance / (ratio + 1)
        assert slower_path * ratio == faster_path
        assert slower_path + faster_path == distance
        # The unknown speed cancels for any positive choice; it is not a root.
        for speed in (F(7), F(31, 2), F(100)):
            time = distance / ((ratio + 1) * speed)
            assert ratio * speed * time == faster_path
    for time, distance, ratio, slow, fast in (
        (F(5, 4), F(90), F(3), F(18), F(54)),
        (F(4, 3), F(96), F(3), F(18), F(54)),
        (F(5, 4), F(100), F(4), F(16), F(64)),
    ):
        assert (slow + fast) * time == distance and fast == ratio * slow
    assert F(40) * 60 / 1000 == F("2.4")
    assert F("17.2") - F("2.4") == F("14.8")
    assert F(280) * 60 / 1000 == F("16.8")
    assert F("19.5") - F("2.7") == F("16.8")
    assert F("19.5") + F("2.7") == F("22.2")
    assert (F(1, 9) + F(1, 6)) * F(18, 5) == 1
    assert F("11.2") * F(1, 4) == F("2.8")
    assert F(14) * F("1.2") == F("8.4") * 2 == F("16.8")
    assert F("1.2") + 2 == F("3.2") and F(".2") * 60 == 12
    assert F(20) * F(".12") == F("2.4")
    assert F("22.4") * F("5.5") == F("17.6") * 7 == F("123.2")
    assert F("5.5") + 7 == F("12.5")
    assert F(30, 200) == F(".15") and F(160) * F(".15") == 24
    assert F(80) * F(".35") == 28
    # All 16 homework word problems: answers stay out of the student worksheet.
    expected = {
        2: (F(2), F(8), F(10)), 3: F(20), 4: F(45), 5: F("3.5"),
        6: (F(15), "9:45"), 7: F(175), 8: (F(16), F(64)),
        9: (F("20.5"), F("15.5")), 10: (F(4), F(18)), 11: F(3),
        12: F(5), 13: (F(2), F(80)), 17: F(45), 18: F(300),
        19: F(35), 20: F(204),
    }
    assert set(CUES) == set(expected) == set(range(2, 14)) | set(range(17, 21))
    assert set(HOMEWORK) == set(range(1, 21))
    assert (4 + 5) * expected[2][0] == 18
    assert 4 * expected[2][0] == expected[2][1]
    assert 5 * expected[2][0] == expected[2][2]
    assert (12 + 18) * F(40, 60) == expected[3]
    assert (F("13.2") - F("9.6")) * expected[4] / 60 == F("2.7")
    assert expected[5] - F("1.5") == (14 - 10) * F(30, 60)
    assert 36 * expected[6][0] / 60 == 12 * (F(1, 2) + expected[6][0] / 60)
    assert expected[9][0] - F("2.5") == expected[9][1] + F("2.5") == 18
    assert 22 - expected[10][0] == 14 + expected[10][0] == expected[10][1]
    assert F("2.4") * F(5, 4) == expected[11]
    assert F(36, 18) + F(36, 12) == expected[12]
    assert 4 * (18 + expected[13][0]) == 5 * (18 - expected[13][0]) == expected[13][1]
    assert F(250) * F(".18") == expected[17]
    assert expected[18] * F(".12") == 36
    assert F(60) * expected[19] / 100 == 21
    assert expected[20] + F(240) * F(".15") == 240
    # Preserve preparation items, including exact recurring-fraction answers.
    percent_inputs = (F(7), F(24), F("6.5"), F(".8"), F(135), F(420), F(25, 2), F(25, 3))
    assert tuple(value / 100 for value in percent_inputs) == (
        F(".07"), F(".24"), F(".065"), F(".008"), F("1.35"), F("4.2"), F(1, 8), F(1, 12),
    )
    number_inputs = (F(".09"), F(".46"), F(".7"), F(".032"), F(7, 20), F(9, 25), F("1.6"), F("3.2"), F(2, 3))
    assert tuple(value * 100 for value in number_inputs) == (F(9), F(46), F(70), F("3.2"), F(35), F(36), F(160), F(320), F(200, 3))
    return {"homework_items": len(HOMEWORK), "word_problems": len(expected),
            "meeting_variants": len(routes)}


class InvariantCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        kwargs["invariant"] = 1
        super().__init__(*args, **kwargs)


def footer(label):
    def draw(c, doc):
        c.saveState()
        c.setFillColor(MUTED)
        c.setFont("PetersonSans", 9)
        c.drawString(44, PAGE_H - 30, "MathExam / Петерсон 6 класс")
        c.drawRightString(PAGE_W - 44, PAGE_H - 30, label)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.5)
        c.line(44, PAGE_H - 39, PAGE_W - 44, PAGE_H - 39)
        c.setFont("PetersonSans", 8.2)
        c.drawString(44, 37, "Дорофеев, Петерсон · 6 класс, часть 1")
        c.drawString(44, 24, PUBLIC_URL.removeprefix("https://"))
        c.linkURL(PUBLIC_URL, (44, 22, 310, 34), relative=0)
        c.drawRightString(PAGE_W - 44, 30, str(doc.page))
        c.restoreState()
    return draw


def build_document(path: Path, pages, label: str):
    story = []
    for index, contents in enumerate(pages):
        if index:
            story.append(PageBreak())
        story.extend(contents)
    doc = SimpleDocTemplate(
        str(path), pagesize=A4, leftMargin=44, rightMargin=44,
        topMargin=57, bottomMargin=55,
        title={OUTPUT_NAMES[0]: "Петерсон 6. Шпаргалки: неизвестная и уравнения",
               OUTPUT_NAMES[1]: "Петерсон 6. Разборы задач через неизвестную",
               OUTPUT_NAMES[2]: "Петерсон 6. Домашняя работа: уравнения"}[path.name],
        author="MathExam", subject="Постоянные условия задач; решение с неизвестной величиной",
    )
    doc.build(story, onFirstPage=footer(label), onLaterPages=footer(label),
              canvasmaker=InvariantCanvas)
    reader = PdfReader(path)
    if len(reader.pages) != len(pages):
        raise AssertionError(f"Unexpected overflow: {path.name}: {len(reader.pages)} pages, expected {len(pages)}")
    text = "\n".join(page.extract_text() or "" for page in reader.pages)
    assert "\ufffd" not in text, f"Replacement glyph in {path.name}"
    if path.name == OUTPUT_NAMES[2]:
        for number, (heading, _) in HOMEWORK.items():
            assert heading in text, f"Missing homework item {number}"
    return len(reader.pages)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path,
                        default=REPO / "trainers" / "maxim-peterson6")
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    checks = mathematical_preflight()
    print("Exact-rational preflight:", checks)
    if args.check_only:
        return
    register_fonts()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    protected = args.output_dir / "Peterson6_Procenty_340.pdf"
    before = hashlib.sha256(protected.read_bytes()).hexdigest() if protected.exists() else None
    for name, pages, label in (
        (OUTPUT_NAMES[0], general_pages(), "ШПАРГАЛКА"),
        (OUTPUT_NAMES[1], textbook_pages(), "РАЗБОРЫ ЗАДАЧ"),
        (OUTPUT_NAMES[2], homework_pages(), "ДОМАШНЯЯ РАБОТА"),
    ):
        path = args.output_dir / name
        count = build_document(path, pages, label)
        print(f"{name}: {count} pages; sha256={hashlib.sha256(path.read_bytes()).hexdigest()}")
    if before is not None:
        assert hashlib.sha256(protected.read_bytes()).hexdigest() == before
        print("Conversion-only PDF preserved byte-for-byte:", before)


if __name__ == "__main__":
    main()
