'use strict';

// Capture each illustrated step in the trainer's real drawing and writing tools.
const assert = require('node:assert/strict');
const { createReadStream, mkdirSync, statSync, writeFileSync } = require('node:fs');
const { createServer } = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.argv[2] || '../geometry7-control-frames');
const type = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.gif': 'image/gif' };
const polar = ([x, y], degrees, distance) => {
  const angle = degrees * Math.PI / 180;
  return [x + Math.cos(angle) * distance, y - Math.sin(angle) * distance];
};
const O = [320, 230];
const flat = { A: [105, 230], B: [535, 230] };
const cross = angle => ({ ...flat, C: polar(O, 180 - angle, 150), D: polar(O, -angle, 150) });

const clips = [
  {
    id: '1-1', title: 'Смежные углы и дополнительные лучи',
    steps: [
      ['Поставь точки A и C. Инструментом «Прямая» проведи AC.', [['points', { A: [105, 285], C: [495, 285] }], ['line', 'AC']]],
      ['Поставь O на AC. Проведи луч OB, начиная с O.', [['points', { O: [310, 285], B: polar([310, 285], 112, 170) }], ['ray', 'OB']]],
      ['Отметь дугой ∠AOB. В «Подписи» введи 68° и помести её рядом.', [['arc', 'AOB'], ['label', '68°', [235, 243]]]],
      ['Поставь D на луче OC. Сравни направление лучей OC и OD.', [['points', { D: [565, 285] }]]]
    ]
  },
  {
    id: '1-2', title: 'Две прямые и сумма углов',
    steps: [
      ['Поставь A, B, C, D. Проведи через них две прямые.', [['points', cross(56)], ['line', 'AB'], ['line', 'CD']]],
      ['Нажми «Пересечение» и выбери обе прямые. Получится O.', [['intersection', 'AB', 'CD']]],
      ['Отметь дугами противоположные углы. Что известно об их сумме?', [['arc', 'AOC'], ['arc', 'BOD'], ['label', '112° вместе', [82, 63]]]]
    ]
  },
  {
    id: '1-3', title: 'Чертёж с прямыми AB и CD',
    steps: [
      ['Поставь четыре точки. Выбери «Прямая» и укажи A, B, затем C, D.', [['points', cross(54)], ['line', 'AB'], ['line', 'CD']]],
      ['Построй точку пересечения O, нажав на обе прямые вдали от центра.', [['intersection', 'AB', 'CD']]],
      ['Выбери «Дуга угла», нажми A, O, C. Подпиши данный угол 54°.', [['arc', 'AOC'], ['label', '54°', [238, 203]]]],
      ['Найди на чертеже углы AOD, DOB и BOC. Во всех вершина — O.', [['label', '∠AOD', [244, 316]], ['label', '∠DOB', [398, 267]], ['label', '∠BOC', [387, 175]]]]
    ]
  },
  {
    id: '1-4', title: 'Биссектриса и расстояния до сторон',
    steps: [
      ['Поставь B и две точки A, C. Проведи лучи BA и BC.', [['points', { A: polar([105, 210], 42, 210), B: [105, 210], C: polar([105, 210], -42, 210) }], ['ray', 'BA'], ['ray', 'BC']]],
      ['Выбери «Биссектриса» и нажми A, B, C. На луче появится K.', [['bisector', 'ABC'], ['remember', 'K', [205, 210]]]],
      ['Выбери «Перпендикуляр». Нажми K, B, A, чтобы построить KH.', [['perpendicular', 'KBA']]],
      ['Повтори для K, B, C. Сравни два прямоугольных треугольника.', [['perpendicular', 'KBC']]]
    ]
  },
  {
    id: '1-5', title: 'Два равных треугольника',
    steps: [
      ['Поставь A, B, C. Соедини их инструментом «Отрезок».', [['points', { A: [60, 294], B: [134, 203], C: [270, 294] }], ['triangle', 'ABC']]],
      ['Подпиши известные стороны с помощью инструмента «Подпись».', [['label', '5 см', [63, 227]], ['label', '7 см', [206, 224]], ['label', '9 см', [147, 324]]]],
      ['Построй MNK. Сопоставь буквы в записях △ABC и △MNK.', [['points', { M: [349, 242], N: [423, 151], K: [559, 242] }], ['triangle', 'MNK'], ['label', 'A ↔ M', [352, 298]]]]
    ]
  },
  {
    id: '2-1', title: 'Два смежных угла в отношении 1 к 3',
    steps: [
      ['Поставь M и P, проведи прямую MP. Между ними поставь N.', [['points', { M: [100, 282], P: [535, 282] }], ['line', 'MP'], ['points', { N: [318, 282] }]]],
      ['Поставь K и проведи луч NK. Он общий для обоих углов.', [['points', { K: polar([318, 282], 135, 170) }], ['ray', 'NK']]],
      ['Подпиши меньший угол x, больший — 3x. Найди их общую сумму.', [['arc', 'MNK'], ['arc', 'KNP'], ['label', 'x', [257, 262]], ['label', '3x', [334, 227]]]]
    ]
  },
  {
    id: '2-2', title: 'Два угла различаются на 34°',
    steps: [
      ['Построй две пересекающиеся прямые и обозначь точку O.', [['points', cross(73)], ['line', 'AB'], ['line', 'CD'], ['intersection', 'AB', 'CD']]],
      ['Отметь два разных соседних угла. У них есть общая сторона.', [['arc', 'AOC'], ['arc', 'COB']]],
      ['Обозначь меньший угол x и подпиши соседний как x + 34°.', [['label', 'x', [265, 200]], ['label', 'x + 34°', [347, 164]]]]
    ]
  },
  {
    id: '2-3', title: 'Вертикальные углы 1 и 3',
    steps: [
      ['Проведи две прямые. Отметь O инструментом «Пересечение».', [['points', cross(63)], ['line', 'AB'], ['line', 'CD'], ['intersection', 'AB', 'CD']]],
      ['Расставь подписи 1, 2, 3, 4 по кругу вокруг O.', [['label', '1', [265, 204]], ['label', '2', [356, 179]], ['label', '3', [373, 267]], ['label', '4', [279, 291]]]],
      ['Отметь дугами углы 1 и 3. Они равны и вместе дают 126°.', [['arc', 'AOC'], ['arc', 'BOD'], ['label', '∠1 + ∠3 = 126°', [70, 68]]]]
    ]
  },
  {
    id: '2-4', title: 'Три луча в одной полуплоскости',
    steps: [
      ['Поставь A и B. Проведи луч AB, начиная с A.', [['points', { A: [110, 325], B: [540, 325] }], ['ray', 'AB']]],
      ['На одной стороне от AB поставь C и D. Проведи AC и AD.', [['points', { C: polar([110, 325], 30, 275), D: polar([110, 325], 55, 270) }], ['ray', 'AC'], ['ray', 'AD']]],
      ['Отметь ∠BAC = 30°. Для дуги нажми B, A, C.', [['arc', 'BAC'], ['label', '30°', [210, 300]]]],
      ['Отметь ∠BAD = 55°. Какой угол остаётся между AC и AD?', [['arc', 'BAD'], ['label', '∠BAD = 55°', [263, 92]]]]
    ]
  },
  {
    id: '2-5', title: 'Отметки на чертеже к доказательству',
    steps: [
      ['Построй отрезки AB и CD, затем отметь их пересечение O.', [['points', { A: [140, 132], B: [500, 328], C: [200, 348], D: [440, 112] }], ['segment', 'AB'], ['segment', 'CD'], ['intersection', 'AB', 'CD']]],
      ['Соедини A с C и B с D. Получатся треугольники AOC и BOD.', [['segment', 'AC'], ['segment', 'BD']]],
      ['Поставь одинаковые засечки на AO и OB. Они равны по условию.', [['tick', 'AO'], ['tick', 'OB']]],
      ['Отметь дугами ∠ACO и ∠BDO. Какие углы при O уже равны?', [['arc', 'ACO'], ['arc', 'BDO']]]
    ]
  },
  {
    id: 'format', title: 'Как записать решение задачи', variant: 1, question: 1, writing: true,
    steps: [
      ['В «Дано» перепиши известные из условия связи и числа.', [['fill', 'given', '∠AOB и ∠BOC смежные.\n∠AOB = 68°.']]],
      ['В «Найти» запиши обозначение нужного угла.', [['fill', 'goal', '∠BOC']]],
      ['В «Решение» сначала назови свойство, потом примени его к задаче.', [['fill', 'solution', 'Сумма смежных углов равна 180°.\n∠AOB + ∠BOC = 180°.']]]
    ]
  },
  {
    id: 'proof-format', title: 'Как начать доказательство', variant: 2, question: 5, writing: true,
    steps: [
      ['В «Дано» запиши равенства и положение точки O.', [['fill', 'given', 'AB и CD пересекаются в O.\nAO = OB, ∠ACO = ∠BDO.']]],
      ['В «Доказать» запиши цель, которую нужно обосновать.', [['fill', 'goal', '△AOC = △BOD']]],
      ['Начни доказательство с одного утверждения и объясни его.', [['fill', 'solution', '∠AOC = ∠BOD, так как это вертикальные углы.\nДальше найди углы, прилежащие к AO и OB.']]]
    ]
  },
  {
    id: 'tool-segment', title: 'Точки, отрезок и отмена', variant: 1, question: 1, showTools: true,
    steps: [
      ['Инструментом «Точка» поставь A и B.', [['points', { A: [135, 245], B: [510, 170] }]]],
      ['Выбери «Отрезок». Нажми на первый конец A.', [['tool', 'segment'], ['tap', 'A']]],
      ['Нажми на второй конец B. Появится отрезок AB.', [['tap', 'B'], ['check-added']]],
      ['Нажми «Отменить». Отрезок исчезнет, точки останутся.', [['undo']]]
    ]
  },
  {
    id: 'tool-intersection', title: 'Точка пересечения', variant: 1, question: 3, showTools: true,
    steps: [
      ['Проведи прямые AB и CD через две точки каждую.', [['points', cross(54)], ['line', 'AB'], ['line', 'CD']]],
      ['Выбери «Пересечение». Нажми на AB в стороне от центра.', [['tool', 'intersection'], ['choose-line', 'AB']]],
      ['Нажми на CD в стороне от центра. В пересечении появится O.', [['choose-line', 'CD'], ['check-added']]]
    ]
  },
  {
    id: 'tool-arc', title: 'Дуга угла', variant: 1, question: 1, showTools: true,
    steps: [
      ['Проведи лучи OA и OB. У них общее начало O.', [['points', { A: [125, 285], O: [365, 285], B: [312, 112] }], ['ray', 'OA'], ['ray', 'OB']]],
      ['Выбери «Дуга угла». Нажми A на первой стороне угла.', [['tool', 'arc'], ['tap', 'A']]],
      ['Второй нажми вершину O. Она стоит посередине в ∠AOB.', [['tap', 'O']]],
      ['Нажми B на второй стороне. Появится дуга ∠AOB.', [['tap', 'B'], ['check-added']]]
    ]
  },
  {
    id: 'tool-tick', title: 'Засечки на равных отрезках', variant: 2, question: 5, showTools: true,
    steps: [
      ['Построй два отрезка, длины которых по условию равны.', [['points', { A: [138, 140], B: [501, 140], C: [138, 284], D: [501, 284] }], ['segment', 'AB'], ['segment', 'CD']]],
      ['Выбери «Засечка». Нажми A, затем B.', [['tick', 'AB']]],
      ['Нажми C, затем D. Одинаковые засечки показывают, что AB = CD.', [['tick', 'CD']]]
    ]
  }
];

function serve(req, res) {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) || !type[path.extname(file)] || !statSync(file, { throwIfNoEntry: false })?.isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader('Content-Type', type[path.extname(file)]);
  createReadStream(file).pipe(res);
}

async function capture(browser, origin, clip) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const coordinates = {};
  const svg = page.locator('.drawing-surface');
  let currentTool;
  let lastClick;
  const setTool = async name => {
    if (currentTool === name) return;
    const tool = page.locator(`[data-tool="${name}"]`);
    if (!await tool.isVisible()) await page.locator('[data-written-panel="tools"] summary').click();
    await tool.click();
    currentTool = name;
  };
  const click = async point => {
    assert(point?.length === 2, 'named drawing point');
    await svg.scrollIntoViewIfNeeded();
    const xy = await svg.evaluate((element, point) => {
      const p = new DOMPoint(...point).matrixTransform(element.getScreenCTM());
      return [p.x, p.y];
    }, point);
    await page.mouse.click(...xy);
    lastClick = point;
  };
  const chooseLine = async line => {
    const [p, q] = Array.from(line, name => coordinates[name]);
    await click([p[0] * .72 + q[0] * .28, p[1] * .72 + q[1] * .28]);
  };
  const checkAdded = async () => assert.match(await page.locator('.drawing-feedback').textContent(), /Построение добавлено/);
  const construct = async (tool, points) => {
    await setTool(tool);
    for (const name of points) await click(coordinates[name]);
    await checkAdded();
  };
  try {
    const [v, q] = clip.id.split('-').map(Number);
    await page.goto(origin + '/trainers/geometry-7/control-work.html?mode=written');
    await page.locator(`[data-written-variant="${(clip.variant || v) - 1}"]`).click();
    await page.locator(`.steps [data-written-question="${(clip.question || q) - 1}"]`).click();
    const frames = [];
    for (const [index, [caption, operations]] of clip.steps.entries()) {
      lastClick = null;
      let undo = false;
      for (const [op, a, b] of operations) {
        if (op === 'points') {
          await setTool('point');
          for (const [name, point] of Object.entries(a)) {
            await page.getByLabel('Имя точки', { exact: true }).fill(name);
            await click(point);
            assert.match(await page.locator('.drawing-feedback').textContent(), /добавлена/);
            coordinates[name] = point;
          }
        } else if (op === 'intersection') {
          await setTool(op);
          await chooseLine(a);
          await chooseLine(b);
          await checkAdded();
          coordinates.O = await svg.locator('circle').last().evaluate(circle => [+circle.getAttribute('cx'), +circle.getAttribute('cy')]);
        } else if (op === 'tool') await setTool(a);
        else if (op === 'tap') await click(coordinates[a]);
        else if (op === 'choose-line') await chooseLine(a);
        else if (op === 'check-added') await checkAdded();
        else if (op === 'undo') {
          await page.locator('[data-drawing="undo"]').click();
          undo = true;
        } else if (op === 'remember') coordinates[a] = b;
        else if (op === 'label') {
          await setTool(op);
          await page.getByLabel('Текст на чертеже', { exact: true }).fill(a);
          await click(b);
          assert.match(await page.locator('.drawing-feedback').textContent(), /Подпись добавлена/);
        } else if (op === 'triangle') {
          for (const pair of [a.slice(0, 2), a.slice(1), a[2] + a[0]]) await construct('segment', pair);
        } else if (op === 'fill') await page.locator(`#written-${a}`).fill(b);
        else await construct(op, a);
      }
      const filename = clip.id + '-' + index + '.png';
      await (clip.writing ? page.locator('.written-fields') : svg).screenshot({ path: path.join(output, filename), animations: 'disabled' });
      const frame = { caption, filename };
      if (clip.showTools) {
        frame.toolFilename = clip.id + '-tool-' + index + '.png';
        const button = page.locator(undo ? '[data-drawing="undo"]' : `[data-tool="${currentTool}"]`);
        await button.screenshot({ path: path.join(output, frame.toolFilename), animations: 'disabled' });
        if (lastClick) frame.point = await svg.evaluate((element, point) => {
          const box = element.getBoundingClientRect();
          const target = new DOMPoint(...point).matrixTransform(element.getScreenCTM());
          return [(target.x - box.left) / box.width, (target.y - box.top) / box.height];
        }, lastClick);
      }
      frames.push(frame);
    }
    return { id: clip.id, title: clip.title, frames };
  } finally { await page.close(); }
}

(async () => {
  mkdirSync(output, { recursive: true });
  const server = createServer(serve);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_EXECUTABLE_PATH });
    const origin = 'http://127.0.0.1:' + server.address().port;
    const results = [];
    for (const clip of clips) {
      results.push(await capture(browser, origin, clip));
      console.log('Captured', clip.id);
    }
    writeFileSync(path.join(output, 'frames.json'), JSON.stringify(results));
  } finally {
    await browser?.close();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
