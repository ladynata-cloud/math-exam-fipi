"""Build the three authored cards and their planar scenes for course review."""
import argparse
from fractions import Fraction
import json
from pathlib import Path

from verify_areas import number_842, number_843, number_844, segment_point


HERE = Path(__file__).resolve().parent
F = Fraction


def edges(names):
    return [[a, b] for a, b in zip(names, names[1:] + names[:1])]


def drawing(points, segments, fills=(), dashed=()):
    return points, segments, fills, dashed


def model(frames):
    xs, ys = zip(*(tuple(point) for points, *_ in frames for point in points.values()))
    span_x, span_y = max(xs) - min(xs), max(ys) - min(ys)
    scale = min(F(76) / span_x, F(52) / span_y)
    center_x, center_y = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    result = dict(points={}, edges=[], planar=True, bounds=[0, 0, 100, 70],
                  views={}, labels={}, labelOffsets={}, labelOnly=[], checks=[],
                  description="Чертёж к задаче. По мере разбора выделяются нужные участки фигуры.")
    for i, (points, segments, fills, dashed) in enumerate(frames):
        names = {name: f"{name}__v{i}" for name in points}
        result["points"].update({names[name]: [float(50 + scale * (x - center_x)),
                                               float(35 + scale * (y - center_y)), 0]
                                 for name, (x, y) in points.items()})
        result["labels"].update({names[name]: name for name in points})
        view = dict(label=f"Шаг {i}" if i else "Условие", points=list(names.values()),
                    segments=[[names[a], names[b]] for a, b in segments])
        if fills:
            view["polygons"] = [[names[name] for name in polygon] for polygon in fills]
        if dashed:
            view["dashSegments"] = [[names[a], names[b]] for a, b in dashed]
        result["views"][f"step-{i}" if i else "neutral"] = view
    return result


def step(prompt, explanation, justification, *theory_points):
    return dict(prompt=prompt, explanation=explanation, justification=justification,
                theoryPoints=list(theory_points))


def card(number, condition, answer, steps, frames, hint, self_check):
    assert len(frames) == len(steps) + 1
    return dict(number=number, part="single", printedPages=[215], pdfPages=[216], condition=condition,
                answer=answer, steps=steps, model=model(frames), sourceFigures=[],
                notes=[f"Подсказка. {hint}", f"Самопроверка. {self_check}"])


def parallelogram(x, y):
    a, b, d, c = (0, 0), (8, 0), (2, 5), (10, 5)
    p, q = segment_point(a, b, x), segment_point(b, c, y)
    r, t = segment_point(d, c, x), segment_point(a, d, y)
    m = segment_point(p, r, y)
    return dict(A=a, B=b, C=c, D=d, M=m, P=p, Q=q, R=r, T=t)


def cards():
    off = parallelogram(F(3, 5), F(2, 5))
    on = parallelogram(F(3, 5), F(3, 5))
    lines = edges("ABCD") + [["P", "R"], ["T", "Q"]]
    colored = ("MPBQ", "MRDT")
    assert number_842((0, 0), (8, 0), (2, 5), F(3, 5), F(2, 5)) == (F(32, 5), F(72, 5))
    assert number_842((0, 0), (8, 0), (2, 5), F(3, 5), F(3, 5)) == (F(48, 5), F(48, 5))
    first = card(
        842, "В параллелограмме ABCD через внутреннюю точку M провели две прямые, параллельные сторонам. "
        "Они пересекают стороны AB, BC, CD и DA в точках P, Q, R и T. "
        "При каком положении M площади MPBQ и MRDT равны? Докажи оба направления.",
        "Ровно тогда, когда M лежит на диагонали AC.",
        [
            step("Какие две доли определяют положение точки M?",
                 "Обозначим x = AP/AB и y = AT/AD. При движении вдоль AC обе доли совпадают. "
                 "Если доли совпадают, M лежит на AC.", "Параллельные прямые делят соответствующие отрезки в одном отношении."),
            step("Вырази площади через x, y и площадь S большого параллелограмма.",
                 "[MPBQ] = (1 − x)yS, а [MRDT] = x(1 − y)S. Угол между сторонами у фигур одинаков.",
                 "Площадь параллелограмма при неизменном угле меняется в отношении произведений длин сторон.", 57),
            step("Что получится, если вычесть площади?",
                 "Разность равна S(y − x). Поскольку S > 0, разность равна нулю ровно при x = y. "
                 "Значит, равенство площадей равносильно тому, что M лежит на AC.",
                 "Положительное число, умноженное на разность, равно нулю только при нулевой разности."),
        ],
        [drawing(off, lines), drawing(off, lines, dashed=(("A", "C"),)),
         drawing(off, lines, colored), drawing(on, lines, colored, (("A", "C"),))],
        "Начни с двух долей отрезков от вершины A.",
        "При x = 3/5 и y = 2/5 площади равны 32/5 и 72/5. При x = y = 3/5 обе равны 48/5.",
    )

    triangle = dict(A=(4, 0), B=(0, 3), C=(F(-12, 5), F(-12, 5)),
                    O=(0, 0), M=(0, F(-3, 2)), K=(F(-4, 3), 0))
    lines = edges("ABC") + [["A", "K"], ["B", "M"]]
    given = ("OMA", "OAB", "OBK")
    assert number_843(triangle["A"], triangle["B"], triangle["C"], triangle["M"], triangle["K"])[-1] == F(12, 5)
    second = card(
        843, "На сторонах AC и BC треугольника ABC лежат точки M и K. Отрезки AK и BM пересекаются в O. "
        "Даны площади S₁ = [OMA], S₂ = [OAB], S₃ = [OBK]. Вырази площадь [CMK].",
        "[CMK] = S₁S₃(S₁ + S₂)(S₂ + S₃) / (S₂(S₂² − S₁S₃)).",
        [
            step("Как найти площадь треугольника OMK?",
                 "У OMA и OAB одинаковая высота из A, поэтому OM/OB = S₁/S₂. "
                 "С общей высотой из K получаем [OMK] = S₁S₃/S₂.", "При общей высоте площади относятся как основания.", 58),
            step("Какие доли сторон занимает треугольник CMK?",
                 "Сравни AMK и AMB по основанию AM, затем BKM и BKA по основанию BK. "
                 "Получатся CK/CB = S₁(S₂ + S₃)/(S₂(S₁ + S₂)) и CM/CA = S₃(S₁ + S₂)/(S₂(S₂ + S₃)).",
                 "При общем основании площади относятся как расстояния до основания.", 58),
            step("Как восстановить площадь всего ABC?",
                 "Из предыдущей доли найди BK/BC = (S₂² − S₁S₃)/(S₂(S₁ + S₂)). "
                 "По отношению [ABK]/[ABC] = BK/BC получаем [ABC] = S₂(S₁ + S₂)(S₂ + S₃)/(S₂² − S₁S₃).",
                 "ABK и ABC имеют общую высоту из A. Поскольку BK/BC > 0, имеем S₂² > S₁S₃.", 58),
            step("Во сколько раз [CMK] меньше [ABC]?",
                 "Отношение равно произведению CM/CA и CK/CB. Умножь две найденные доли на [ABC] и сократи общие множители.",
                 "У CMK и CAB общий угол C. Площадь зависит от произведения прилежащих к нему сторон.", 58),
        ],
        [drawing(triangle, lines, given), drawing(triangle, lines, given + ("OMK",)),
         drawing(triangle, lines, ("AMK", "BKM")), drawing(triangle, lines, ("ABK",)),
         drawing(triangle, lines + [["M", "K"]], ("CMK",))],
        "Сравни треугольники OMA и OAB с общей высотой.",
        "При S₁ = 3, S₂ = 6 и S₃ = 2 получаются [OMK] = 1 и [CMK] = 12/5.",
    )

    c, a, b = (0, 0), (9, 0), (0, 6)
    m, k = segment_point(c, a, F(1, 3)), segment_point(c, b, F(2, 3))
    p = segment_point(m, k, F(2, 3))
    points = dict(A=a, B=b, C=c, M=m, K=k, P=p)
    lines = edges("ABC") + [["M", "K"]]
    assert number_844(a, b, c, F(2)) == (8, 1, 27)
    third = card(
        844, "На сторонах AC и BC треугольника ABC лежат точки M и K, а P лежит на MK. "
        "Известно, что AM/MC = CK/KB = MP/PK. Площади AMP и BKP равны S₁ и S₂. Найди площадь ABC.",
        "[ABC] = (∛S₁ + ∛S₂)³.",
        [
            step("Какая доля соответствует отношению t к 1?",
                 "Обозначь общее отношение через t. Первая доля равна t/(1 + t), а вторая 1/(1 + t). "
                 "Поэтому AM/AC = CK/CB = MP/MK = t/(1 + t).",
                 "Если две части равны t и 1 в условных единицах, целое равно t + 1."),
            step("Почему для площади AMP доля встречается трижды?",
                 "Основание AM составляет долю t/(1 + t) от AC. Высота из K составляет ту же долю высоты из B, "
                 "а высота из P составляет такую долю высоты из K. Поэтому S₁ = (t/(1 + t))³[ABC].",
                 "Площадь треугольника равна половине произведения основания на высоту.", 58),
            step("Какие три доли входят в площадь BKP?",
                 "Это BK/BC, KP/KM и CM/CA. Каждая равна 1/(1 + t). Значит, S₂ = (1/(1 + t))³[ABC].",
                 "Доля основания умножается на две доли высоты.", 58),
            step("Как исключить t?",
                 "Извлеки кубические корни и сложи. Доли t/(1 + t) и 1/(1 + t) дают 1, "
                 "поэтому ∛[ABC] = ∛S₁ + ∛S₂.",
                 "При извлечении кубического корня положительные кубы превращаются в исходные множители."),
        ],
        [drawing(points, lines), drawing(points, lines), drawing(points, lines, ("AMP",)),
         drawing(points, lines, ("BKP",)), drawing(points, lines, ("AMP", "BKP"))],
        "Для AMP высота дважды меняется в отношении t к 1 при переходах B → K → P.",
        "Если S₁ = 8 и S₂ = 1, то [ABC] = 27. При t = 1 каждая из данных площадей равна одной восьмой [ABC].",
    )
    return [first, second, third]


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data = dict(schemaVersion=1, bookId="atanasyan-2023-7-9", grade=8,
                sourceSection="Задачи повышенной трудности к главе VII",
                source=dict(edition=2023, isbn="978-5-09-102538-5", printedPage=215),
                review=dict(status="in-review", independentSource="pending",
                            independentMathematics="pending", independentPedagogy="pending"),
                cards=cards())
    output = HERE / "authored.json"
    rendered = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if args.check:
        assert output.read_text() == rendered, "The checked-in card data differs from the builder output."
    else:
        output.write_text(rendered)
    print("ATANASYAN_AREA_CARDS_OK", len(data["cards"]),
          sum(len(c["steps"]) for c in data["cards"]))
