"""Build the two grade-five HTML outlines inside the existing application mounts."""
from collections import defaultdict
from html import escape
import json
import re
import subprocess


def grade5_entries(root):
    p5 = 'school/peterson5'
    v5 = 'courses/vilenkin-5-part-1'
    # Use exactly the titles/IDs served by the two builds of the Peterson course.
    reader = """
global.window = global;
require('./school/peterson5/data.js');
require('./school/peterson5/workshop-data.js');
const goals = new Map(PetersonWorkshopData.topics.map(t => [t.id, t.goal]));
console.log(JSON.stringify(PetersonCourse.lessons.map(l =>
    [l.part, l.chapter, l.id, l.title, goals.get(l.id)])));
"""
    groups = defaultdict(list)
    for part, chapter, key, title, goal in json.loads(subprocess.check_output(
            ['node', '-e', reader], cwd=root, text=True)):
        groups[f'Часть {part}. {chapter}'].append((f'topic/{key}/discover', title, goal))
    entries = {
        p5: ('Дорофеев и Петерсон · математика, 5 класс',
             'Обе части учебника. Составляй выражения, проверяй признаки делимости и исследуй дроби. '
             'В каждой теме есть исследование, две тренировки и самостоятельная проверка. '
             'Разборы номеров учебника доступны для выбранных задач.',
             'Начать с первой темы', groups)
    }

    data = root / v5 / 'data'
    lessons = {lesson['id']: lesson for file in sorted(data.glob('lessons-*.json'))
               for lesson in json.loads(file.read_text())}
    book = json.loads((data / 'textbook-index.json').read_text())
    groups = defaultdict(list)
    # The textbook orders each block of lessons followed by its applied workshop.
    heading = None
    for key in [0, *(topic['id'] for topic in book['topics'])]:
        lesson = lessons[key]
        if key and heading is None:
            heading = lesson['section']
        groups[heading or 'Повторение'].append(
            (f'lesson/{key}/theory', lesson['title'], lesson['goal']))
        if key > 24:  # Same practical-workshop IDs as the native home view.
            heading = None
    entries[v5] = ('Виленкин · математика, 5 класс · часть 1',
                   'Читай таблицы, решай уравнения, находи площадь и объём. '
                   'После повторения тебя ждут 24 темы и четыре практикума. '
                   'В каждом занятии можно исследовать модель, разобрать шаги и проверить ответ.',
                   'Начать с повторения', groups)

    outputs = {}
    for folder, (title, intro, action, sections) in entries.items():
        first_route = next(iter(sections.values()))[0][0]
        rows = ['<section class="grade5-entry">', f'<h1>{escape(title)}</h1>',
                f'<p class="entry-intro">{escape(intro)}</p>',
                f'<a class="entry-start" href="#{first_route}">{escape(action)} →</a>',
                '<noscript><p>Можно читать список тем. Для упражнений и проверки ответа включи JavaScript.</p></noscript>']
        for heading, topics in sections.items():
            rows.extend([f'<h2>{escape(heading)}</h2>', '<ul>'])
            for route, name, goal in topics:
                rows.append(f'<li id="{route}"><a href="#{route}">{escape(name)}</a>'
                            f'<p>{escape(goal)}</p></li>')
            rows.append('</ul>')
        rows.append('</section>')
        file = f'{folder}/index.html'
        source = (root / file).read_text()
        result, count = re.subn(r'(<main id="main" tabindex="-1">).*?(</main>)',
                                lambda m: m[1] + '\n' + '\n'.join(rows) + '\n' + m[2],
                                source, flags=re.S)
        if count != 1:
            raise ValueError(f'{file}: expected one application mount')
        outputs[file] = result
    return outputs
