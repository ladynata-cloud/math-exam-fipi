"""Math scenes for the profile EGE trainer animations."""

from math import cos, pi, sin


def _formula(card, heading, *lines, size=28):
    card.rect((316, 91, 615, 254), fill="white", outline="edge", radius=14)
    card.text(333, 109, heading, size=20, fill="muted")
    for index, text in enumerate(lines):
        card.text(333, 147 + 45 * index, text, size=size, bold=True,
                  fill="accent" if index == len(lines) - 1 else "ink")


def _planimetry(card, stage):
    a, b, c = (82, 230), (254, 230), (82, 101)
    card.polygon((a, b, c), fill="soft")
    card.line((a, b), "blue" if stage >= 1 else "muted", width=5)
    card.line((a, c), "blue" if stage >= 1 else "muted", width=5)
    card.line((b, c), "accent" if stage >= 2 else "muted", width=5)
    card.line(((82, 211), (101, 211), (101, 230)), "ink", width=3)
    card.text(64, 236, "A", size=20, bold=True)
    card.text(255, 237, "B", size=20, bold=True)
    card.text(59, 89, "C", size=20, bold=True)
    card.text(53, 155, "3", size=24, fill="blue", bold=True)
    card.text(158, 237, "4", size=24, fill="blue", bold=True)
    card.text(177, 142, "5" if stage == 3 else "?", size=26,
              fill="accent", bold=True)
    if stage == 0:
        _formula(card, "Прямой угол", "∠A = 90°")
    elif stage == 1:
        _formula(card, "Катеты", "AC = 3", "AB = 4")
    elif stage == 2:
        _formula(card, "Теорема Пифагора", "BC² = AC² + AB²", "BC² = 3² + 4²")
    else:
        _formula(card, "Гипотенуза", "BC² = 25", "BC = 5")


def _vectors(card, stage):
    origin, unit = (72, 239), 24

    def point(x, y):
        return origin[0] + x * unit, origin[1] - y * unit

    for i in range(1, 7):
        card.line((point(i, 0), point(i, 6)), "grid", width=1)
        card.line((point(0, i), point(7, i)), "grid", width=1)
    card.arrow(origin, point(8, 0), "muted", width=2)
    card.arrow(origin, (origin[0], 87), "muted", width=2)
    card.text(267, 238, "x", size=17, fill="muted")
    card.text(58, 87, "y", size=17, fill="muted")
    for x in (1, 4):
        xp, yp = point(x, 0)
        card.line(((xp, yp - 3), (xp, yp + 4)), "muted", width=2)
        card.text(xp - 4, yp + 7, str(x), size=15, fill="muted")
    for y in (1, 5):
        xp, yp = point(0, y)
        card.line(((xp - 4, yp), (xp + 3, yp)), "muted", width=2)
        card.text(xp - 16, yp - 7, str(y), size=15, fill="muted")

    a, b, corner = point(1, 1), point(4, 5), point(4, 1)
    card.arrow(a, b, "accent", width=4)
    card.circle(*a, 5, fill="ink")
    card.text(82, 194, "A", size=18, bold=True)
    card.text(181, 103, "B", size=18, bold=True)
    if stage >= 1:
        card.arrow(a, corner, "blue", width=4)
        card.text(123, 220, "3", size=19, fill="blue", bold=True)
    if stage >= 2:
        card.line((corner, b), "amber", width=3)
        card.text(179, 163, "4", size=19, fill="amber", bold=True)
    if stage == 0:
        _formula(card, "Начало и конец", "A(1; 1)", "B(4; 5)")
    elif stage == 1:
        _formula(card, "Абсцисса вектора", "4 − 1 = 3")
    elif stage == 2:
        _formula(card, "Ордината вектора", "5 − 1 = 4", "Координаты: (3; 4)", size=25)
    else:
        _formula(card, "Длина вектора", "√(3² + 4²) = 5")


def _stereometry(card, stage):
    a, b, c, d = (59, 236), (192, 236), (266, 198), (133, 198)
    a1, b1, c1, d1 = (59, 126), (192, 126), (266, 88), (133, 88)
    card.polygon((a, b, b1, a1), fill="white")
    card.polygon((b, c, c1, b1), fill="soft")
    if stage == 1:
        card.polygon((a, b, c), fill="soft")
    if stage >= 2:
        card.polygon((a, c, c1), fill="soft")
    card.line((a, d, c), "muted", width=2, dashed=True)
    card.line((d, d1), "muted", width=2, dashed=True)
    card.line((a, a1, d1, c1, b1, a1), "muted", width=2)
    card.line((b, b1), "muted", width=2)
    card.line((a, b, c), "blue", width=4)
    card.line((c, c1), "blue" if stage >= 2 else "muted", width=4)
    if stage >= 1:
        card.line((a, c), "accent", width=4, dashed=stage == 1)
    if stage >= 2:
        card.line((a, c1), "amber" if stage == 2 else "accent", width=5)
        card.line(((253, 200), (253, 189), (266, 187)), "ink", width=2)

    card.text(42, 241, "A", size=18, bold=True)
    card.text(190, 241, "B", size=18, bold=True)
    card.text(272, 202, "C", size=18, bold=True)
    card.text(273, 88, "C₁", size=18, bold=True)
    card.text(119, 241, "3", size=18, fill="blue", bold=True)
    card.text(230, 222, "2", size=18, fill="blue", bold=True)
    card.text(273, 141, "6", size=18, fill="blue", bold=True)

    if stage == 0:
        _formula(card, "Длины рёбер", "AB = 3,  BC = 2", "CC₁ = 6", size=25)
    elif stage == 1:
        _formula(card, "Диагональ основания", "AC² = 3² + 2²", "AC² = 13")
    elif stage == 2:
        _formula(card, "Прямой угол при C", "AC₁² = AC² + CC₁²", "AC₁² = 13 + 36", size=25)
    else:
        _formula(card, "Длина диагонали", "AC₁² = 49", "AC₁ = 7")


def _trigonometry(card, stage):
    center = (158, 174)
    radius = 69
    angle = pi / 6
    p = (center[0] + round(radius * cos(angle)), center[1] - round(radius * sin(angle)))
    foot, level = (p[0], center[1]), (center[0], p[1])
    card.circle(*center, radius, fill="white", outline="edge", width=3)
    if stage >= 1:
        card.polygon((center, foot, p), fill="soft")
    card.arrow((65, center[1]), (255, center[1]), "muted", width=2)
    card.arrow((center[0], 257), (center[0], 88), "muted", width=2)
    card.text(258, 170, "x", size=18, fill="muted")
    card.text(166, 87, "y", size=18, fill="muted")
    card.text(137, 184, "O", size=17, fill="muted")
    card.line((center, p), "blue", width=4)
    arc = tuple((center[0] + round(35 * cos(t * angle / 8)),
                 center[1] - round(35 * sin(t * angle / 8))) for t in range(9))
    card.line(arc, "amber", width=3)
    card.circle(*p, 5, fill="accent")
    card.text(p[0] + 8, p[1] - 19, "P", size=20, bold=True)
    card.text(183, 175, "30°", size=17, fill="amber", bold=True)
    if stage >= 1:
        card.line((p, foot), "accent" if stage >= 2 else "blue", width=4)
        card.line(((foot[0] - 11, foot[1]), (foot[0] - 11, foot[1] - 11),
                   (foot[0], foot[1] - 11)), "muted", width=2)
        card.text(173, 147, "1", size=17, fill="blue", bold=True)
    if stage >= 3:
        card.line((p, level), "accent", width=3, dashed=True)
        card.line((center, level), "accent", width=4)
        card.text(114, 130, "1/2", size=18, fill="accent", bold=True)
    if stage == 0:
        _formula(card, "Угол от оси x", "α = 30°")
    elif stage == 1:
        _formula(card, "Радиус окружности", "OP = 1")
    elif stage == 2:
        _formula(card, "Катет напротив 30°", "1 : 2 = 1/2")
    else:
        _formula(card, "Ордината точки P", "sin 30° = 1/2")


def build_all(build):
    build("profile-planimetry", "№1. Теорема Пифагора", (
        "Найди прямой угол на чертеже. Здесь он при вершине A.",
        "Стороны, образующие прямой угол, — катеты. Их длины 3 и 4.",
        "Сторона напротив прямого угла — гипотенуза. Сложи квадраты катетов.",
        "BC² = 25. Длина стороны положительна, поэтому BC = 5.",
    ), _planimetry)
    build("profile-vectors", "№2. Координаты и длина вектора", (
        "Отметь начало A(1; 1) и конец B(4; 5) вектора.",
        "Из абсциссы конца вычти абсциссу начала. Получится 3.",
        "Из ординаты конца вычти ординату начала. Получится 4.",
        "Длина вектора — квадратный корень из суммы квадратов его координат.",
    ), _vectors)
    build("profile-stereometry", "№3. Диагональ параллелепипеда", (
        "В основании прямоугольник со сторонами 3 и 2. Высота параллелепипеда — 6.",
        "Найди квадрат диагонали основания AC по теореме Пифагора.",
        "AC и CC₁ перпендикулярны. Примени теорему Пифагора к треугольнику ACC₁.",
        "Квадрат диагонали AC₁ равен 49. Значит, её длина — 7.",
    ), _stereometry)
    build("profile-trigonometry", "Синус на единичной окружности", (
        "От положительного направления оси x отложи 30° против часовой стрелки.",
        "Опусти перпендикуляр из P на ось x. Радиус OP — гипотенуза длиной 1.",
        "Катет напротив угла 30° равен половине гипотенузы. Здесь это 1/2.",
        "Синус угла — ордината точки P на единичной окружности. Получаем 1/2.",
    ), _trigonometry)
