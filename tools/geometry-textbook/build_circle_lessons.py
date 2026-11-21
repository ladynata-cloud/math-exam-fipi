"""Build the numbered proofs at the beginning of the chapter IX enrichment section."""
import argparse
import json
from math import dist
from build_area_lessons import BOOK, ROOT, lesson
from circle_lessons import beginning
from chord_followup import follow
from circle_bisectors import final_four
from circle_theorems import centers, theorems
from circle_constructions import tangents_and_chords, triangle_constructions

OUT = ROOT / 'geometry-course/textbook/data/circle-lessons.json'
# A child can test the same geometric relation with different data in a later step.
REPEATS = {
    (900, ''): ('Радиусы двух касающихся окружностей равны 12 и 3. Какова длина хорды меньшей окружности, если соответствующая хорда большей равна 20?', '5', 'Меньший радиус составляет четверть большего. Во столько же раз уменьшается длина хорды.'),
    (901, 'а'): ('Если касательная BD и хорда BA образуют в показанной конфигурации угол 36°, сколько градусов в угле ACB?', '36', 'Угол между касательной и хордой измеряется половиной той же дуги, что и вписанный угол ACB.'),
    (901, 'б'): ('В другой паре пересекающихся окружностей AB=10, AD=25. Найди BC.', '4', 'Запиши AB²=AD·BC. Возведи 10 в квадрат и раздели на 25.'),
    (901, 'в'): ('Если BD/AC=4, чему равно AD/BC?', '16', 'Отношение AD/BC равно квадрату BD/AC.'),
    (902, ''): ('Дуги AY и BX равны 76° и 54°. Найди величину угла ANM в градусах.', '65', 'Углы при M и N равны. Сложи меры двух дуг и раздели сумму на два.'),
    (903, ''): ('Точка P внутри окружности. От неё до середины хорды 2, половина хорды равна 8. Какое расстояние от P до концов хорды меньше?', '6', 'P между концами хорды. Ближайший конец на расстоянии |8−2| от P.'),
    (904, ''): ('Для другой хорды этой же конструкции AB=6, AD=2. Каков радиус окружности?', '9', 'Из AB²/AD получается диаметр. Радиус в два раза меньше диаметра.'),
    (905, ''): ('При секущей, параллельной линии центров, длина BC равна 16. Найди расстояние между центрами.', '8', 'В этом положении проекция имеет полную длину и BC=2·OQ.'),
    (906, ''): ('Диаметр исходной окружности равен 24. Каков радиус каждой из окружностей геометрического места?', '6', 'Диаметр малой окружности равен радиусу исходной. Перейди от диаметра к радиусу дважды.'),
    (907, ''): ('В той же конфигурации замени 17° на 20°. Сколько градусов составит угол BAM?', '140', 'AB=AM. В треугольнике ABM вычти из 180° два равных угла по 20°.'),
    (908, ''): ('В другой вершине угол между внешней биссектрисой и продолжением стороны равен 64°. Сколько градусов во внутреннем угле?', '52', 'Удвой 64°, чтобы получить внешний угол. Соседний внутренний дополняет его до 180°.'),
    (909, ''): ('Ортоцентр отразили относительно середины BC в точку Y. Если AY=18, чему равен радиус описанной окружности?', '9', 'Концы AY диаметрально противоположны. Радиус — половина диаметра.'),
    (910, ''): ('В новом треугольнике AB=6, BC=8; биссектриса разделила AC на отрезки 3 и 4. Найди BD².', '36', 'Сначала перемножь AB и BC. Затем вычти произведение двух частей AC.'),
    (911, ''): ('В другой конфигурации угол OBH равен 34°. Сколько градусов в угле между BE и BH?', '17', 'Луч BE делит угол между BO и BH на две равные части.'),
    (912, ''): ('Теперь X на дуге AC без B. Если BX=13 и AX=5, найди CX.', '8', 'Для этой дуги самая длинная линия идёт к B. Из BX=AX+CX вырази CX.'),
    (913, ''): ('У другого вписанного четырёхугольника с перпендикулярными диагоналями BC=8, DA=15. Найди диаметр.', '17', 'Сумма квадратов противоположных сторон даёт квадрат диаметра. Проверь 8²+15².'),
    (914, ''): ('В другом четырёхугольнике CD=18, AD=2. При таком же условии о биссектрисах найди BC.', '16', 'Используй CD=AD+BC и вычти известную сторону из CD.'),
    (915, ''): ('У описанной прямоугольной трапеции основания равны 6 и 15. Найди площадь.', '90', 'Используй доказанное произведение оснований, а не их полусумму.'),
    (916, ''): ('У другого вписанного четырёхугольника обе диагонали по 13, AB·CD=25. Найди AD·BC.', '144', 'Птолемей даёт 13·13=25+AD·BC.'),
    (917, ''): ('В прямоугольном треугольнике со сторонами 8, 15, 17 известно R=8,5 и r=3. Найди квадрат расстояния OI.', '21,25', 'Вычти 2·8,5·3 из 8,5². Нужен квадрат расстояния, извлекать корень не требуется.'),
    (918, ''): ('Длина OH равна 9. Каково расстояние от O до центра окружности девяти точек?', '4,5', 'Центр Q — образ O при гомотетии с центром H и коэффициентом ½.'),
    (919, ''): ('В другой конфигурации радиус окружности с диаметром CX равен 7. Найди CX.', '14', 'Отрезок CX — весь диаметр, состоящий из двух радиусов.'),
    (920, ''): ('Теперь радиусы 5 и 2, расстояние между центрами 4. Сколько общих касательных останется?', '2', 'Сравни 4 с разностью 3 и суммой 7: окружности пересекаются, поэтому обе внутренние касательные исчезли.'),
    (921, ''): ('В другой окружности R=13, а расстояние от центра до найденной прямой 5. Вычисли полную длину хорды.', '24', 'Катет равен √(13²−5²), это лишь половина хорды.'),
    (922, ''): ('Теперь R=10, а OP=8. Чему равна длина кратчайшей хорды?', '12', 'P должна стать серединой хорды. Половина имеет длину √(10²−8²).'),
    (923, 'а'): ('В полукруге над BC=10 ищут вершину прямого угла на высоте 3. Сколько разных точек подходят сверху?', '2', 'Горизонталь находится ниже верхней точки полуокружности и пересекает её дважды.'),
    (923, 'б'): ('При p=24 и q=4,8 вычисли сторону a таким же построением.', '10', 'Умножь полупериметр 12 на отношение 24/(24+4,8).'),
    (924, ''): ('Хорда YZ другой окружности длиной 10, радиус 13. Каково расстояние от центра до середины хорды?', '12', 'Половина хорды 5. Перпендикуляр от центра имеет длину √(13²−5²).'),
    (925, ''): ('Для другого набора точек P,Q,R выберем I и U вершинами искомого треугольника. Сколько есть вариантов третьей вершины?', '2', 'К паре I,U можно добавить либо V, либо W; четвёртый центр автоматически станет ортоцентром.'),
}


def fit_circles(model):
    """Fit the complete outlines, including parts beyond the labelled points."""
    points = model['points']
    xs = [p[0] for p in points.values()]
    ys = [p[1] for p in points.values()]
    for view in model['views'].values():
        for circle in view.get('circles', []):
            center, through = points[circle['center']], points[circle['through']]
            radius = dist(center[:2], through[:2])
            xs.extend([center[0] - radius, center[0] + radius])
            ys.extend([center[1] - radius, center[1] + radius])
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    factor = min(84 / (x1 - x0), 54 / (y1 - y0))
    for p in points.values():
        p[0] = 50 + (p[0] - (x0 + x1) / 2) * factor
        p[1] = 35 + (p[1] - (y0 + y1) / 2) * factor


def mark_perpendicular(model, step_numbers, vertex, first, second):
    for n in step_numbers:
        view = model['views'][f'step-{n}' if n else 'neutral']
        v, a, b = [f'{name}__v{n}' for name in (vertex, first, second)]
        for endpoint in (a, b):
            if all(set(edge) != {v, endpoint} for edge in view['segments']):
                view['segments'].append([v, endpoint])
        view.setdefault('rightAngles', []).append(dict(vertex=v, a=a, b=b, size=2))


def add_markers(number, model):
    # Marks become visible in the first proof step that uses each perpendicular.
    marks = {
        901: [(range(1, 4), 'A', 'O', 'C'), (range(1, 4), 'B', 'Q', 'D')],
        903: [(range(1, 4), 'U', 'O', 'P'), (range(1, 4), 'V', 'O', 'P')],
        904: [(range(4), 'D', 'A', 'B'), (range(1, 4), 'E', 'A', 'B'),
              (range(2, 4), 'A', 'B', 'C')],
        905: [(range(1, 4), 'U', 'O', 'A'), (range(1, 4), 'V', 'Q', 'A')],
        906: [(range(4), 'H', 'M', 'O'), (range(1, 4), 'P', 'U', 'O')],
        908: [(range(1, 4), 'A', 'I', 'V'), (range(1, 4), 'B', 'I', 'W'),
              (range(1, 4), 'C', 'I', 'U')],
        911: [([0, 2, 3], 'H', 'B', 'A')],
        920: [([1, 2, 3], 'X', 'O', 'Y'), ([1, 2, 3], 'Y', 'Q', 'X'), ([1,2], 'T', 'O', 'Q')],
        921: [(range(4), 'H', 'O', 'A'), ([2, 3], 'K', 'M', 'B')],
        922: [([1, 2], 'H', 'O', 'A'), ([2, 3], 'P', 'O', 'X')],
        923: [([0, 3], 'H', 'A', 'B')],
        924: [([2, 3], 'T', 'O', 'Z'), ([3], 'H', 'X', 'Z')],
        925: [([1], 'P', 'A', 'B'), ([1], 'Q', 'C', 'H'), ([1], 'R', 'B', 'H'),
              ([2, 3], 'P', 'U', 'V'), ([2, 3], 'Q', 'V', 'W'), ([2, 3], 'R', 'W', 'U')],
        915: [([0], 'A', 'B', 'D'), ([1], 'U', 'O', 'B'), ([1], 'T', 'O', 'B'), ([2, 3], 'H', 'C', 'B')],
        917: [([2], 'T', 'I', 'B'), ([2], 'B', 'N', 'M')],
        918: [([0, 2], 'U', 'A', 'B'), ([0], 'V', 'B', 'A'), ([0], 'W', 'C', 'A')],
        919: [([0, 1, 3], 'P', 'X', 'B'), ([0, 1, 2, 3], 'Q', 'X', 'B'),
              ([0, 2, 3], 'R', 'X', 'C')],
        913: [(range(4), 'H', 'A', 'D'), ([1, 3], 'C', 'D', 'Y'), ([1], 'B', 'D', 'Y')],
        909: [([0, 1], 'U', 'A', 'B'), ([0], 'V', 'B', 'A'),
              ([0], 'W', 'C', 'A'), ([2], 'B', 'A', 'Y'), ([2], 'C', 'A', 'Y')],
    }
    for args in marks.get(number, []):
        mark_perpendicular(model, *args)


def build():
    items = []
    cards = beginning() + follow() + final_four() + theorems() + centers()
    for card in cards + tangents_and_chords() + triangle_constructions():
        item = lesson(card)
        question, answer, hint = REPEATS[card['number'], card.get('sourcePart', '')]
        target = item['steps'][-1]
        if 'input' in target:
            # Keep the first numerical check in its original proof step and add
            # an independent closing question using the demonstrated final view.
            target = dict(id='step-repeat', title='Проверь себя на новых данных',
                          prompt='Примени доказанное свойство ещё раз.',
                          explanation=hint, view='step-4',
                          justifications=target['justifications'])
            item['steps'].append(target)
        target['input'] = dict(prompt=question, accepted=[answer], feedback=hint)
        model = item['visualization']['model']
        fit_circles(model)
        add_markers(card['number'], model)
        if card['number'] == 923 and card['sourcePart'] == 'б':
            mark_perpendicular(model, [1, 2], 'T', 'A', 'I')
        if len(item['steps']) == 4:
            # The board restores its maximum visible view from the revealed step.
            # Give the repeat its own view ID, keeping the last construction.
            model['views']['step-4'] = {
                **model['views']['step-3'], 'label': 'Шаг 4. Проверь себя на новых данных'
            }
        items.append(item)
    return {'bookId': BOOK, 'lessons': items}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    content = json.dumps(build(), ensure_ascii=False, separators=(',', ':')) + '\n'
    if args.check:
        assert content == OUT.read_text()
    else:
        OUT.write_text(content)
