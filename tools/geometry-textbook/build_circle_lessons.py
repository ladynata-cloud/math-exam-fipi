"""Build the numbered proofs at the beginning of the chapter IX enrichment section."""
import argparse
import json
from math import dist
from build_area_lessons import BOOK, ROOT, lesson
from circle_lessons import beginning
from chord_followup import follow

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
        909: [([0, 1], 'U', 'A', 'B'), ([0], 'V', 'B', 'A'),
              ([0], 'W', 'C', 'A'), ([2], 'B', 'A', 'Y'), ([2], 'C', 'A', 'Y')],
    }
    for args in marks.get(number, []):
        mark_perpendicular(model, *args)


def build():
    items = []
    for card in beginning() + follow():
        item = lesson(card)
        question, answer, hint = REPEATS[card['number'], card.get('sourcePart', '')]
        target = item['steps'][-1]
        if 'input' in target:
            # Keep the first numerical check in its original proof step and add
            # an independent closing question using the demonstrated final view.
            target = dict(id='step-repeat', title='Проверь себя на новых данных',
                          prompt='Примени доказанное свойство ещё раз.',
                          explanation=hint, view=target['view'],
                          justifications=target['justifications'])
            item['steps'].append(target)
        target['input'] = dict(prompt=question, accepted=[answer], feedback=hint)
        model = item['visualization']['model']
        fit_circles(model)
        add_markers(card['number'], model)
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
