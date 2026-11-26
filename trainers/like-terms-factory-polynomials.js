// Continuation of the existing factory, not a new route or progress key migration.
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./like-terms-factory-math.js'));
  } else {
    root.LikeTermsPolynomials = factory(root.FactoryMath);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (MathChecker) {
  'use strict';
  const storageKey = 'likeTermsFactory.polynomials.v1';
  const field = (label, expected, form = 'simplified') => ({ label, expected, form });
  const factorFields = (factor, remainder, expanded) => [
    field('Наибольший общий одночленный множитель (с положительным коэффициентом)', factor),
    field('Что останется внутри скобок', remainder),
    field('Проверка: раскрытые скобки, в стандартном виде', expanded)
  ];
  const polynomialSteps = [
    {
      id: 'standard', title: 'Собери подобные члены', expression: '4x² − 3x + 2x² + 5x − 1',
      prompt: 'Приведи многочлен к стандартному виду. Не меняй степени при сложении.',
      fields: [field('Стандартный вид', '6x²+2x-1')],
      hints: ['Отдельно собери члены с x², с x и свободный член.', 'У каждой группы сложи коэффициенты вместе со знаками.'],
      explain: '4x² + 2x² = 6x²; −3x + 5x = 2x. Получаем 6x² + 2x − 1.'
    },
    {
      id: 'degree', title: 'Степень после упрощения', expression: '2a³ − 2a³ + 5ab − 3b',
      prompt: 'Запиши стандартный вид и только затем найди степень ненулевого многочлена.',
      fields: [field('Стандартный вид', '5ab-3b'), field('Степень многочлена', '2', 'degree')],
      hints: ['Какую сумму дают два члена с a³?', 'Степень одночлена ab — сумма показателей степеней двух букв.'],
      explain: 'Члены с a³ уничтожаются. У 5ab степень 2, у −3b степень 1. Степень многочлена 2.'
    },
    {
      id: 'distribute', title: 'Одночлен умножается на каждый член', expression: '−2x(3x − 4) + x²',
      prompt: 'В первой строке выполни умножение, но не приводи подобные. Во второй приведи.',
      fields: [field('Раскрытая сумма из трёх слагаемых', '-6x²+8x+x²', 'expanded'), field('Стандартный вид', '-5x²+8x')],
      hints: ['Умножь −2x на оба члена скобок. Последнее x² не входило в скобки.', 'Минус на минус даёт плюс, при умножении одинаковых букв показатели складываются.'],
      explain: '−2x · 3x = −6x²; −2x · (−4) = 8x. Добавляем x² и получаем −5x² + 8x.'
    },
    {
      id: 'factor', title: 'Обратное распределительное действие', expression: '6x² + 9x', factor: true,
      prompt: 'Вынеси наибольший общий одночленный множитель с положительным коэффициентом. Затем раздели каждый член на него и проверь раскрытием скобок.',
      fields: factorFields('3x', '2x+3', '6x²+9x'),
      hints: ['Найди НОД коэффициентов 6 и 9 и наименьшую степень x, общую для обоих членов.', 'Внутри скобок запиши частные каждого исходного члена и найденного множителя.'],
      explain: 'НОД(6, 9) = 3; общая буквенная часть x. 6x² + 9x = 3x(2x + 3). Обратное раскрытие возвращает исходный многочлен.'
    },
    {
      id: 'factor-two-letters', title: 'Общий множитель нескольких букв', expression: '12a³b − 8a²b²', factor: true,
      prompt: 'Вынеси наибольший общий одночленный множитель с положительным коэффициентом и проверь результат.',
      fields: factorFields('4a²b', '3a-2b', '12a³b-8a²b²'),
      hints: ['Сравни числовые коэффициенты и степени каждой буквы отдельно.', 'В общую часть войдут только степени, присутствующие в обоих членах. При делении показатели вычитаются.'],
      explain: 'НОД(12, 8) = 4, общие степени a² и b. Получаем 4a²b(3a − 2b); обратное раскрытие даёт 12a³b − 8a²b².'
    },
    {
      id: 'independent-factor', title: 'Самостоятельное разложение', expression: '−15y² + 10y', factor: true, checkpoint: true,
      prompt: 'Без подсказки вынеси наибольший общий одночленный множитель с положительным коэффициентом и выполни проверку.',
      fields: factorFields('5y', '-3y+2', '-15y²+10y'),
      explain: 'НОД(15, 10) = 5, общая буквенная часть y. −15y² + 10y = 5y(−3y + 2).'
    },
    {
      id: 'independent-area', title: 'Перенос: площадь прямоугольника', expression: 'S = 8x² + 12x,  ширина = 4x,  x > 0', checkpoint: true,
      prompt: 'Площадь прямоугольника дана в см², ширина — в см. Найди длину в см. Проверь ответ, умножив длину на ширину. Вводи только выражения.',
      fields: [field('Длина прямоугольника', '2x+3'), field('Произведение ширины и длины в стандартном виде', '8x²+12x')],
      explain: '8x² + 12x = 4x(2x + 3). Так как x > 0, ширина 4x положительна; длина 2x + 3 см. Умножение возвращает площадь.'
    }
  ];


  const groupingKey = 'likeTermsFactory.grouping.v1';
  const productFields = (expanded, result) => [
    field('Четыре произведения до приведения подобных', expanded, 'expanded'),
    field('Стандартный вид', result)
  ];
  // Both group order and factor order are independent mathematical choices.
  const independentGroups = [
    ['6x²+15x','4xy+10y'], ['4xy+10y','6x²+15x'],
    ['6x²+4xy','15x+10y'], ['15x+10y','6x²+4xy']
  ];
  const groupingSteps = [
    {
      id: 'multiply', title: 'Каждый член умножается на каждый', expression: '(x + 2)(x + 5)',
      prompt: 'Рассмотри четыре клетки. В первой строке вычисли все четыре произведения, не собирая подобные. Во второй строке приведи многочлен к стандартному виду.',
      grid: { rows: ['x','2'], cols: ['x','5'], caption: 'Модель площади при x > 0. Алгебраическое равенство верно при любом x.' },
      fields: productFields('x²+5x+2x+10','x²+7x+10'),
      hints: ['Каждый член первой скобки умножь на каждый член второй.', 'Сначала запиши четыре отдельных результата, затем сложи коэффициенты при x.'],
      explain: '(x+2)(x+5) = x²+5x+2x+10 = x²+7x+10.'
    },
    {
      id: 'common-binomial', title: 'От двух групп к одному произведению', expression: '3ax + 6a + 5x + 10',
      prompt: 'Объедини первые два и последние два слагаемых. В каждой группе вынеси наибольший общий одночленный множитель с положительным коэффициентом. Найди одинаковый двучлен, сложи внешние множители и проверь раскрытием.',
      fields: [field('Множитель первой группы','3a'),field('Множитель второй группы','5'),field('Одинаковый двучлен','x+2'),field('Сумма внешних множителей','3a+5'),field('Проверка: стандартный вид произведения','3ax+6a+5x+10')],
      hints: ['В 3ax и 6a есть общий числовой и буквенный множитель. Что общего у 5x и 10?', 'Раздели каждый член на множитель своей группы. Сравни две скобки, как если бы они были одной буквой.'],
      explain: '3a(x+2)+5(x+2)=(3a+5)(x+2). Повторно раскрывая скобки, возвращаем все четыре слагаемых.'
    },
    {
      id: 'opposite', title: 'Одинаковые скобки со сменой знака', expression: '2a(x − 3) + 5(3 − x)',
      prompt: 'Приведи вторые скобки к виду x − 3. Запиши новый внешний множитель второй группы. Затем вынеси одинаковые скобки и проверь произведение.',
      fields: [field('Новый множитель второй группы','-5'),field('Сумма внешних множителей','2a-5'),field('Одинаковый двучлен','x-3'),field('Проверка раскрытием','2ax-6a-5x+15')],
      hints: ['Сравни 3 − x и x − 3: одно выражение является противоположным другому.', 'Если меняешь знаки обоих членов внутри скобок, что происходит со знаком внешнего множителя?'],
      explain: '5(3−x)=−5(x−3). Поэтому 2a(x−3)−5(x−3)=(2a−5)(x−3). Проверка: 2ax−6a−5x+15.'
    },
    {
      id: 'independent-grouping', title: 'Самостоятельно выбери группы', expression: '6x² + 10y + 15x + 4xy', checkpoint: true,
      prompt: 'Раздели четыре слагаемых на две группы по два члена с общим множителем. Затем запиши два двучлена итогового произведения с положительными коэффициентами при буквах. Порядок групп и множителей произвольный.',
      fields: [field('Первая группа (сумма двух членов)','6x²+15x'),field('Вторая группа (сумма двух членов)','4xy+10y'),field('Первый двучлен','3x+2y'),field('Второй двучлен','2x+5')],
      variants: independentGroups.flatMap(pair => [pair.concat('3x+2y','2x+5'),pair.concat('2x+5','3x+2y')]),
      explain: 'Можно собрать 3x(2x+5)+2y(2x+5), а можно 2x(3x+2y)+5(3x+2y). Оба пути дают (3x+2y)(2x+5).'
    },
    {
      id: 'square-sum', title: 'Почему появляется удвоенное произведение', expression: '(x + 3)(x + 3)',
      prompt: 'Это квадрат суммы. Найди четыре отдельные части произведения по таблице, затем собери подобные.',
      grid: { rows: ['x','3'], cols: ['x','3'], caption: 'Квадрат со стороной x + 3 при x > 0. Две прямоугольные части равны; тождество верно при любом x.' },
      fields: productFields('x²+3x+3x+9','x²+6x+9'),
      hints: ['В таблице есть две разные клетки с одинаковым произведением.', 'Не заменяй квадрат суммы суммой квадратов: учитывай обе прямоугольные части.'],
      explain: '(x+3)²=x²+3x+3x+9=x²+6x+9. В общем виде (a+b)²=a²+2ab+b².'
    },
    {
      id: 'square-difference', title: 'Квадрат разности', expression: '(2x − 3)(2x − 3)',
      prompt: 'Запиши четыре отдельные произведения с их знаками, затем приведи подобные.',
      fields: productFields('4x²-6x-6x+9','4x²-12x+9'),
      hints: ['Умножь каждый член на каждый, учитывая оба минуса.', 'У квадрата отрицательного числа положительный знак. У двух смешанных произведений знак отрицательный.'],
      explain: '(2x−3)²=4x²−6x−6x+9=4x²−12x+9. В общем виде (a−b)²=a²−2ab+b².'
    },
    {
      id: 'conjugates', title: 'Почему сокращаются смешанные члены', expression: '(2x − 3)(2x + 3)',
      prompt: 'Раскрой обе скобки и сохрани четыре отдельных произведения, затем приведи подобные. Сравни с предыдущим квадратом разности.',
      fields: productFields('4x²+6x-6x-9','4x²-9'),
      hints: ['Сравни знаки двух смешанных произведений.', 'У этих двух членов одинаковая буквенная часть и противоположные коэффициенты.'],
      explain: '(2x−3)(2x+3)=4x²+6x−6x−9=4x²−9. В общем виде (a−b)(a+b)=a²−b².'
    },
    {
      id: 'independent-squares', title: 'Самостоятельно: разность квадратов', expression: '4x² − 25', checkpoint: true,
      prompt: 'Разложи на два двучлена с положительными коэффициентами при x (порядок произвольный). Проверь раскрытием: сначала четыре произведения, затем стандартный вид.',
      fields: [field('Первый двучлен','2x-5'),field('Второй двучлен','2x+5'),...productFields('4x²+10x-10x-25','4x²-25')],
      variants: [['2x-5','2x+5','4x²+10x-10x-25','4x²-25'],['2x+5','2x-5','4x²+10x-10x-25','4x²-25']],
      explain: '4x²−25=(2x−5)(2x+5). При раскрытии смешанные члены уничтожаются, возвращается исходная разность квадратов.'
    }
  ];


  // Separate storage namespaces let completed earlier workshops remain exact.
  const identityKey = 'likeTermsFactory.identities.v1';
  const rationalKey = 'likeTermsFactory.rational.v1';
  const applicationKey = 'likeTermsFactory.applications.v1';
  const excluded = expected => field('ОДЗ: исключённые значения x (через ;, если нет — «нет»)', expected, 'domain');
  const rootSet = (label, expected) => field(label + ' (через ;, если нет — «нет»)', expected, 'roots');
  const finalFraction = (n,d) => [
    field('Итоговый числитель (стандартный вид)',''+n),
    field('Итоговый знаменатель (стандартный вид)',''+d)
  ];
  const numberField = (label,expected) => field(label,expected,'number');
  const intervals = expected => field('Ответ интервалами: например (-∞;0)∪[2;+∞)',expected,'intervals');
  const sign = (label, expected) => field(label + ' (+ или −)',expected,'sign');
  const identitySteps = [
    {
      id:'reverse-square', title:'Узнай квадрат суммы', expression:'9x² + 30x + 25',
      prompt:'Найди основания крайних квадратов (с положительными коэффициентами). Проверь средний член, запиши двучлен под квадратом и раскрой его обратно.',
      fields:[field('Основание первого квадрата','3x'),field('Основание последнего квадрата','5'),field('Удвоенное произведение','30x'),field('Двучлен под квадратом','3x+5'),field('Проверка: стандартный вид','9x²+30x+25')],
      hints:['Из 9x² выдели квадрат одночлена, из 25 — квадрат числа.','Средний член должен равняться удвоенному произведению этих оснований.'],
      explain:'9x²+30x+25=(3x+5)²: 2·3x·5=30x.'
    },
    {
      id:'not-square', title:'Почему крайних квадратов недостаточно', expression:'4x² + 10x + 9',
      prompt:'Предположи, что это квадрат суммы с основаниями 2x и 3. Какой средний член требовался бы? Найди разность исходного и предполагаемого многочленов.',
      fields:[field('Средний член предполагаемого квадрата','12x'),field('Исходный многочлен минус предполагаемый квадрат','-2x')],
      hints:['Средний член квадрата суммы не выбирают произвольно.','Квадрат суммы имеет средний член 2·2x·3; вычти его из 10x.'],
      explain:'(2x+3)²=4x²+12x+9. Исходный многочлен отличается на −2x, поэтому предложенное тождество неверно.'
    },
    {
      id:'cube-sum', title:'Куб суммы через уже известный квадрат', expression:'(x + 2)³',
      prompt:'Сначала раскрой квадрат x + 2. Затем умножь полученные три члена на x + 2. Запиши все шесть произведений, только потом собери подобные.',
      fields:[field('Стандартный вид квадрата','x²+4x+4'),field('Шесть произведений до приведения','x³+2x²+4x²+8x+4x+8','expanded'),field('Стандартный вид куба','x³+6x²+12x+8')],
      hints:['Куб — это квадрат, умноженный ещё на одну такую же скобку.','Три члена умножаются на два: проверь шесть отдельных произведений.'],
      explain:'(x+2)³=(x²+4x+4)(x+2)=x³+6x²+12x+8. В общем виде (a+b)³=a³+3a²b+3ab²+b³.'
    },
    {
      id:'cube-difference', title:'Куб разности и чередование знаков', expression:'(2x − 1)³',
      prompt:'Сначала раскрой квадрат разности. Умножь три полученных члена на 2x − 1, сохрани шесть произведений, затем приведи.',
      fields:[field('Квадрат разности','4x²-4x+1'),field('Шесть произведений','8x³-4x²-8x²+4x+2x-1','expanded'),field('Стандартный вид куба','8x³-12x²+6x-1')],
      hints:['Квадрат разности имеет два отрицательных смешанных произведения, а последний член положителен.','Умножая на −1, меняй знак каждого соответствующего произведения.'],
      explain:'(2x−1)³=8x³−12x²+6x−1. У формулы (a−b)³ знаки +, −, +, −.'
    },
    {
      id:'sum-cubes', title:'Сумма кубов — не куб суммы', expression:'8x³ + 27',
      prompt:'Разложи сумму кубов. Запиши двучлен и трёхчлен с положительными старшими коэффициентами, затем проверку умножением (шесть отдельных произведений и стандартный вид).',
      fields:[field('Двучлен','2x+3'),field('Трёхчлен','4x²-6x+9'),field('Шесть произведений','8x³-12x²+18x+12x²-18x+27','expanded'),field('Стандартный вид','8x³+27')],
      hints:['Основания кубов — 2x и 3. Первая скобка содержит их сумму.','Средний член трёхчлена должен уничтожить смешанные члены при раскрытии.'],
      explain:'8x³+27=(2x+3)(4x²−6x+9). Смешанные члены попарно сокращаются. a³+b³=(a+b)(a²−ab+b²).'
    },
    {
      id:'difference-cubes', title:'Разность кубов', expression:'27a³ − 8',
      prompt:'Разложи разность кубов на двучлен и трёхчлен с положительными старшими коэффициентами. Проверь шестью произведениями и стандартным видом.',
      fields:[field('Двучлен','3a-2'),field('Трёхчлен','9a²+6a+4'),field('Шесть произведений','27a³+18a²+12a-18a²-12a-8','expanded'),field('Стандартный вид','27a³-8')],
      hints:['Основания кубов — 3a и 2. Двучлен содержит разность.','В трёхчлене средний знак должен обеспечивать сокращение смешанных произведений.'],
      explain:'27a³−8=(3a−2)(9a²+6a+4). В общем виде a³−b³=(a−b)(a²+ab+b²).'
    },
    {
      id:'independent-square', title:'Самостоятельное распознавание квадрата', expression:'16y² − 40y + 25', checkpoint:true,
      prompt:'Запиши двучлен с положительным коэффициентом при y, квадрат которого равен исходному многочлену. Проверь средний член и полное раскрытие.',
      fields:[field('Двучлен под квадратом','4y-5'),field('Средний член со знаком','-40y'),field('Стандартный вид квадрата','16y²-40y+25')],
      explain:'(4y−5)²=16y²−40y+25.'
    },
    {
      id:'independent-chain', title:'Самостоятельно: выбери две формулы подряд', expression:'3x³ − 12x', checkpoint:true,
      prompt:'Вынеси наибольший положительный общий одночленный множитель, затем разложи остаток на два двучлена с положительными коэффициентами при x. Проверь итоговое произведение. Порядок двучленов произвольный.',
      fields:[field('Общий одночленный множитель','3x'),field('Остаток после вынесения','x²-4'),field('Первый двучлен','x-2'),field('Второй двучлен','x+2'),field('Проверка полного произведения','3x³-12x')],
      variants:[['3x','x²-4','x+2','x-2','3x³-12x']],
      explain:'3x³−12x=3x(x²−4)=3x(x−2)(x+2).'
    },
    {
      id:'independent-identity', title:'Самостоятельно: доказательство тождества', expression:'(x + 4)² − x(x + 8)', checkpoint:true,
      prompt:'Раскрой квадрат и произведение отдельно, затем вычти второй многочлен из первого. Покажи, почему результат не зависит от x.',
      fields:[field('Стандартный вид квадрата','x²+8x+16'),field('Стандартный вид произведения','x²+8x'),field('Разность','16')],
      explain:'(x+4)²−x(x+8)=x²+8x+16−x²−8x=16 для любого действительного x.'
    }
  ];
  const rationalSteps = [
    {
      id:'domain', title:'Когда алгебраическая дробь имеет смысл?', expression:'(x + 1)/(x − 4)',
      prompt:'Найди все значения, при которых исходный знаменатель равен нулю. Затем вычисли значение дроби при x = −1. Нулевой числитель не запрещён, если знаменатель ненулевой.',
      fields:[excluded('4'),numberField('Значение при x = −1','0')],
      hints:['Проверяй знаменатель исходной дроби.','При x = −1 числитель равен нулю; подставь это значение и в знаменатель.'],
      explain:'ОДЗ: x≠4. При x=−1 получаем 0/(−5)=0.'
    },
    {
      id:'cancel-monomial', title:'Сокращаются множители, а не слагаемые', expression:'12x²/(18x)',
      prompt:'Сначала запиши ОДЗ. Сократи общий множитель числителя и знаменателя. Запиши несократимую дробь с положительным знаменателем.',
      fields:[excluded('0'),field('Общий множитель','6x'),...finalFraction('2x','3')],
      hints:['18x нельзя приравнивать к ненулевому числу без проверки x.','Раздели и числитель, и знаменатель на 6x в пределах ОДЗ.'],
      explain:'При x≠0 сокращаем 6x и получаем 2x/3. При x=0 исходная дробь по-прежнему не определена.'
    },
    {
      id:'cancel-square', title:'Формула разности квадратов помогает сокращению', expression:'(x² − 9)/(x − 3)',
      prompt:'Запиши ОДЗ, затем два множителя числителя с положительными коэффициентами при x. Сократи общий множитель и запиши результат без знаменателя. Порядок множителей произвольный.',
      fields:[excluded('3'),field('Первый множитель числителя','x-3'),field('Второй множитель числителя','x+3'),field('Упрощённое выражение','x+3')],
      variants:[['3','x+3','x-3','x+3']],
      hints:['В числителе разность квадратов.','После сокращения не возвращай исключённое значение 3 в область определения.'],
      explain:'(x²−9)/(x−3)=(x−3)(x+3)/(x−3)=x+3 только при x≠3.'
    },
    {
      id:'cancel-two-denominator', title:'Два исходных запрета сохраняются', expression:'(x² − 4)/(x² + x − 6)',
      prompt:'Запиши все исключённые значения. Разложи знаменатель на два двучлена с положительными коэффициентами при x. Затем сократи дробь и запиши несократимые числитель и знаменатель с положительным старшим коэффициентом.',
      fields:[excluded('-3;2'),field('Первый множитель знаменателя','x-2'),field('Второй множитель знаменателя','x+3'),...finalFraction('x+2','x+3')],
      variants:[['-3;2','x+3','x-2','x+2','x+3']],
      hints:['Найди два числа с суммой 1 и произведением −6.','В числителе разность квадратов. После сокращения x−2 остаются оба исходных ограничения.'],
      explain:'(x−2)(x+2)/((x−2)(x+3))=(x+2)/(x+3), но x≠2 и x≠−3.'
    },
    {
      id:'illegal-cancel', title:'Проверка ошибочного сокращения слагаемых', expression:'(x + 6)/(x + 3) ≟ 6/3',
      prompt:'Ученик «сократил» x в двух суммах. Запиши ОДЗ, вычисли левую часть при x=1 и сравни с правой. Введи точные числа, не округляй.',
      fields:[excluded('-3'),numberField('Левая часть при x = 1','7/4'),numberField('Правая часть','2')],
      hints:['Сокращать можно только общие множители всего числителя и знаменателя.','Подставь 1 в обе части. Для опровержения тождества достаточно одного допустимого контрпримера.'],
      explain:'7/4≠2, поэтому тождество неверно. Слагаемое x не является общим множителем сумм.'
    },
    {
      id:'same-denominator', title:'Сложение с одинаковыми знаменателями', expression:'(3x − 1)/(x + 2) + (x + 5)/(x + 2)',
      prompt:'Запиши ОДЗ, сложи числители и сохрани общий знаменатель. Запиши итоговую несократимую дробь.',
      fields:[excluded('-2'),...finalFraction('4x+4','x+2')],
      hints:['Знаменатель общий, его не нужно складывать.','В числителе сложи 3x и x, затем −1 и 5.'],
      explain:'(4x+4)/(x+2), x≠−2. Общего неконстантного множителя у числителя и знаменателя нет.'
    },
    {
      id:'different-denominators', title:'Приведение к общему знаменателю', expression:'1/(x − 2) + 3/(x + 2)',
      prompt:'Запиши ОДЗ, выбери общий знаменатель наименьшей степени со старшим коэффициентом 1 или −1. Запиши соответствующие дополнительные множители первой и второй дробей, затем числитель и выбранный знаменатель результата в стандартном виде.',
      fields:[excluded('-2;2'),field('Дополнительный множитель первой дроби','x+2'),field('Дополнительный множитель второй дроби','x-2'),...finalFraction('4x-4','x²-4')],
      variants:[['-2;2','-x-2','-x+2','-4x+4','-x²+4']],
      hints:['Общий знаменатель — произведение двух исходных двучленов или это произведение с противоположным знаком.','Для положительного старшего коэффициента числитель: 1·(x+2)+3·(x−2). При выборе противоположного знаменателя поменяй знаки обоих дополнительных множителей и всего числителя. Раскрой и приведи.'],
      explain:'(x+2+3x−6)/((x−2)(x+2))=(4x−4)/(x²−4)=(-4x+4)/(−x²+4), x≠±2.'
    },
    {
      id:'multiply-fractions', title:'Умножение дробей и сохранение ОДЗ', expression:'(x² − 4)/(x + 1) · (x + 1)/(x − 2)',
      prompt:'Найди запреты по обоим исходным знаменателям, разложи x²−4, затем сократи произведение и запиши итоговое выражение.',
      fields:[excluded('-1;2'),field('Множитель x²−4, совпадающий со вторым знаменателем','x-2'),field('Другой множитель','x+2'),field('Итоговое выражение','x+2')],
      hints:['Оба исходных знаменателя должны быть ненулевыми.','Разность квадратов даёт два множителя. Сокращение не отменяет первоначальных запретов.'],
      explain:'При x≠−1,2 произведение равно x+2.'
    },
    {
      id:'divide-fractions', title:'Делитель тоже должен быть ненулевым', expression:'(x² − 9)/(x + 2) : (x − 3)/(x + 2)',
      prompt:'Найди все исключённые значения с учётом того, что делить на ноль нельзя. Запиши числитель и знаменатель обратной дроби, затем упрощённый результат.',
      fields:[excluded('-2;3'),field('Числитель обратной дроби','x+2'),field('Знаменатель обратной дроби','x-3'),field('Итоговое выражение','x+3')],
      hints:['Проверь оба знаменателя и числитель дроби-делителя.','При делении умножь на обратную дробь, затем сократи общие множители.'],
      explain:'x≠−2 (оба знаменателя), x≠3 (делитель равен нулю). После умножения на (x+2)/(x−3) получаем x+3.'
    },
    {
      id:'independent-rational', title:'Самостоятельно: преобразование рационального выражения', expression:'(x² − 9)/(x − 3) − (2x + 6)/(x + 3)', checkpoint:true,
      prompt:'Без подсказок запиши ОДЗ, упрости отдельно обе дроби и найди их разность. Сохрани запреты исходного выражения.',
      fields:[excluded('-3;3'),field('Первая дробь после сокращения','x+3'),field('Вторая дробь после сокращения','2'),field('Разность','x+1')],
      explain:'ОДЗ: x≠−3,3. Первая дробь равна x+3, вторая 2, поэтому разность x+1, но не при исключённых значениях.'
    }
  ];
  const applicationSteps = [
    {
      id:'linear', title:'Равносильные преобразования уравнения', expression:'3(2x − 1) − 2(x + 4) = x + 7',
      prompt:'Раскрой скобки слева. Перенеси члены с x влево, числа вправо. Запиши обе стороны полученного уравнения, корень и проверку подстановкой в исходное уравнение.',
      fields:[field('Левая часть после упрощения','4x-11'),field('Левая часть после переноса','3x'),numberField('Правая часть после переноса','18'),rootSet('Корень','6'),numberField('Значение каждой исходной части при корне','13')],
      hints:['Минус перед 2 умножает оба члена второй скобки.','Прибавь 11 к обеим частям, вычти x из обеих частей.'],
      explain:'4x−11=x+7; 3x=18; x=6. Обе исходные части равны 13.'
    },
    {
      id:'zero-product', title:'Произведение равно нулю', expression:'(2x − 3)(x + 4) = 0',
      prompt:'Приравняй каждый множитель к нулю. Укажи корень первого, корень второго и полное множество решений.',
      fields:[numberField('Корень первого множителя','3/2'),numberField('Корень второго множителя','-4'),rootSet('Все корни','-4;3/2')],
      hints:['Произведение равно нулю, если хотя бы один множитель равен нулю.','Реши два линейных уравнения отдельно.'],
      explain:'2x−3=0 или x+4=0; x=3/2 или x=−4.'
    },
    {
      id:'square-equation', title:'Уравнение, сводящееся к квадрату', expression:'x² − 6x + 9 = 0',
      prompt:'Распознай квадрат двучлена с положительным коэффициентом при x и найди корни.',
      fields:[field('Двучлен под квадратом','x-3'),rootSet('Все корни','3')],
      hints:['Проверь крайние квадраты и удвоенное произведение.','Квадрат действительного числа равен нулю только при нулевом основании.'],
      explain:'(x−3)²=0, поэтому единственный корень 3.'
    },
    {
      id:'excluded-root', title:'Почему после сокращения может исчезнуть корень', expression:'(x² − 4)/(x − 2) = 4',
      prompt:'Укажи ОДЗ, упрощённую левую часть, кандидата из полученного уравнения и множество решений исходного уравнения.',
      fields:[excluded('2'),field('Упрощённая левая часть','x+2'),rootSet('Кандидат','2'),rootSet('Корни исходного уравнения','нет')],
      hints:['До сокращения исходный знаменатель не может быть нулём.','Кандидат должен принадлежать исходной ОДЗ.'],
      explain:'При x≠2 имеем x+2=4, откуда кандидат 2. Он исключён; исходное уравнение не имеет корней.'
    },
    {
      id:'numerator-roots', title:'Нуль дроби и допустимый корень', expression:'(x² − 5x + 6)/(x − 2) = 0',
      prompt:'Запиши ОДЗ и оба корня числителя. Отбери корни исходного уравнения.',
      fields:[excluded('2'),rootSet('Корни числителя','2;3'),rootSet('Корни исходного уравнения','3')],
      hints:['Дробь равна нулю, если числитель равен нулю, а знаменатель — нет.','Числитель раскладывается на (x−2)(x−3).'],
      explain:'Числитель равен нулю при 2 и 3; x=2 запрещён. Остаётся x=3.'
    },
    {
      id:'rational-equation', title:'Уравнение с разными знаменателями', expression:'2/(x − 1) = 3/(x + 1)',
      prompt:'Сначала зафиксируй ОДЗ. Умножь обе части на общий знаменатель и раскрой. Найди корни и проверь точное значение каждой исходной части.',
      fields:[excluded('-1;1'),field('Левая часть после умножения','2x+2'),field('Правая часть после умножения','3x-3'),rootSet('Корни','5'),numberField('Значение обеих исходных частей','1/2')],
      hints:['Общий знаменатель ненулевой на ОДЗ.','Слева остаётся 2(x+1), справа 3(x−1).'],
      explain:'x≠±1; 2x+2=3x−3; x=5. Проверка: 2/4=3/6=1/2.'
    },
    {
      id:'negative-inequality', title:'Неравенство и отрицательный множитель', expression:'−2(x − 3) ≥ 8',
      prompt:'Раскрой левую часть, перенеси свободный член вправо и реши неравенство. Запиши решение интервалом; при делении на отрицательное число проверь знак.',
      fields:[field('Левая часть после раскрытия','-2x+6'),numberField('Правая часть после переноса','2'),intervals('(-∞;-1]')],
      hints:['После вычитания 6 из обеих частей получаем −2x≥2.','При делении обеих частей на −2 знак неравенства меняется.'],
      explain:'−2x≥2, значит x≤−1. Ответ (−∞;−1].'
    },
    {
      id:'rational-sign', title:'Метод интервалов: нуль и запрещённая точка', expression:'(x − 2)/(x + 1) ≥ 0',
      prompt:'Найди исключённое значение и нуль числителя. Определи знаки дроби на трёх интервалах. Запиши решение: нуль числителя включается, запрещённая точка никогда не включается.',
      fields:[excluded('-1'),rootSet('Нули числителя','2'),sign('Знак на (−∞;−1)','+'),sign('Знак на (−1;2)','-'),sign('Знак на (2;+∞)','+'),intervals('(-∞;-1)∪[2;+∞)')],
      hints:['Раздели прямую точками −1 и 2; возьми по допустимому числу из каждого интервала.','В исходном неравенстве знак ≥, поэтому нуль числителя допустим, но знаменатель не может быть нулём.'],
      explain:'На интервалах знаки +, −, +. x=2 входит, x=−1 исключён. Ответ (−∞;−1)∪[2;+∞).'
    },
    {
      id:'independent-inequality', title:'Самостоятельно: строгое дробное неравенство', expression:'(x + 3)/(x − 2) < 0', checkpoint:true,
      prompt:'Без подсказок найди ОДЗ, нули числителя, знаки на трёх интервалах и запиши множество решений.',
      fields:[excluded('2'),rootSet('Нули числителя','-3'),sign('Знак на (−∞;−3)','+'),sign('Знак на (−3;2)','-'),sign('Знак на (2;+∞)','+'),intervals('(-3;2)')],
      explain:'Дробь отрицательна только между −3 и 2. При строгом знаке нуль числителя не включается, а 2 запрещено. Ответ (−3;2).'
    },
    {
      id:'independent-identity-domain', title:'Самостоятельно: тождество на ОДЗ', expression:'(x² − 9)/(x + 3) = x − 3', checkpoint:true,
      prompt:'Найди исключённое значение, упрости левую часть, запиши все решения исходного уравнения интервалами. Не объявляй решением все действительные числа без проверки исходного знаменателя.',
      fields:[excluded('-3'),field('Упрощённая левая часть','x-3'),intervals('(-∞;-3)∪(-3;+∞)')],
      explain:'Левая часть равна x−3 при x≠−3. Уравнение истинно на всей ОДЗ: (−∞;−3)∪(−3;+∞).'
    }
  ];

  // Exact numerical notation for roots and boundary values. No evaluation,
  // floating-point tolerance, or arbitrary code. Fractions/decimals are reduced.
  function gcd(a,b) { a=a<0n?-a:a; b=b<0n?-b:b; while(b){const t=a%b;a=b;b=t;} return a; }
  function normalizeMath(value) { return value.trim().replace(/[−–—]/g,'-').replace(/\s+/g,''); }
  // Whitespace may separate tokens, but must never join two digit strings.
  // E.g. '1 3' is not a written 13 and '1 5/10' is not 15/10.
  const splitDigits = value => /\d\s+\d/.test(value);
  function parseNumber(value) {
    if (splitDigits(value)) return null;
    const s=normalizeMath(value);
    if (!s || s.length>240) return null;
    let n,d;
    const fraction=s.match(/^([+-]?\d+)\/([+-]?\d+)$/);
    const decimal=s.match(/^([+-]?)(\d+)(?:[.,](\d+))?$/);
    if(fraction){n=BigInt(fraction[1]);d=BigInt(fraction[2]);}
    else if(decimal){const f=decimal[3]||'';d=10n**BigInt(f.length);n=BigInt(decimal[2]+f)*(decimal[1]==='-'?-1n:1n);}
    else return null;
    if(d===0n)return null;
    if(d<0n){n=-n;d=-d;}
    const g=gcd(n,d);return {n:n/g,d:d/g};
  }
  const numberKey = v => v.n+'/'+v.d;
  function parseSet(value) {
    if (splitDigits(value)) return null;
    let s=normalizeMath(value).toLowerCase();
    if (s==='нет'||s==='∅'||s==='{}'||s==='пусто') return [];
    if (s.startsWith('{')&&s.endsWith('}')) s=s.slice(1,-1);
    if (!s) return null;
    const parts=s.split(';').map(parseNumber);
    if(parts.some(v=>v===null))return null;
    return [...new Set(parts.map(numberKey))].sort();
  }
  function endpoint(value) {
    const s=value.toLowerCase();
    if (/^-?(?:∞|inf|infty)$/.test(s)||/^\+(?:∞|inf|infty)$/.test(s)) return {inf:s[0]==='-'?-1:1};
    return parseNumber(s);
  }
  function compareEndpoints(a,b) {
    if(a.inf||b.inf)return (a.inf||0)-(b.inf||0);
    const k=a.n*b.d-b.n*a.d;return k<0n?-1:k>0n?1:0;
  }
  function parseIntervals(value) {
    if (splitDigits(value)) return null;
    const s=normalizeMath(value).replace(/[Uu∪]/g,'∪');
    if (!s || s.length>240) return null;
    const parsed=[];
    for(const part of s.split('∪')){
      const left=part[0],right=part[part.length-1];
      if(!['(','['].includes(left)||![')',']'].includes(right))return null;
      const pieces=part.slice(1,-1).split(';');if(pieces.length!==2)return null;
      const a=endpoint(pieces[0]),b=endpoint(pieces[1]);
      if(!a||!b||a.inf===1||b.inf===-1)return null;
      const order=compareEndpoints(a,b);
      // A closed degenerate segment [a;a] is the singleton {a}; it can
      // legitimately close a neighbouring open endpoint in a union.
      if(order>0||(order===0&&(a.inf||b.inf||left!=='['||right!==']')))return null;
      if((a.inf&&left!=='(')||(b.inf&&right!==')'))return null;
      parsed.push({a,b,lc:left==='[',rc:right===']'});
    }
    parsed.sort((x,y)=>compareEndpoints(x.a,y.a)||Number(y.lc)-Number(x.lc));
    // The exercises request an ordinary union of intervals; coalesce equivalent
    // overlapping or touching intervals when the common point is included.
    const merged=[];
    for(const item of parsed){
      const last=merged[merged.length-1];const cmp=last?compareEndpoints(last.b,item.a):-1;
      if(!last||cmp<0||(cmp===0&&!last.rc&&!item.lc)){merged.push({...item});continue;}
      const end=compareEndpoints(last.b,item.b);
      if(end<0){last.b=item.b;last.rc=item.rc;}
      else if(end===0)last.rc=last.rc||item.rc;
    }
    const key=v=>v.inf?(v.inf<0?'-∞':'+∞'):numberKey(v);
    return merged.map(v=>(v.lc?'[':'(')+key(v.a)+';'+key(v.b)+(v.rc?']':')')).join('∪');
  }

  // The existing exact checker deliberately accepts repeated factors such as xx.
  // For this particular lesson, also require every monomial to have one occurrence
  // of each variable (with a power if needed). Do not alter the legacy checker.
  function repeatedLetter(value) {
    const aliases = { а:'a', в:'b', с:'c', д:'d', е:'e', к:'k', м:'m', н:'n', о:'o', р:'p', т:'t', у:'y', х:'x' };
    return value.toLowerCase().replace(/[а-яё]/g, c => aliases[c] || c)
      .replace(/[−–—]/g, '-').split(/[+-]/).some(term => {
        const letters = term.match(/[a-z]/g) || [];
        return new Set(letters).size !== letters.length;
      });
  }
  function fieldStatus(value, f) {
    if (typeof value !== 'string' || !value.trim()) return 'empty';
    if (f.form === 'number') {const a=parseNumber(value),b=parseNumber(f.expected);return a&&b&&numberKey(a)===numberKey(b)?'correct':'number';}
    if (f.form === 'domain'||f.form === 'roots') {
      const a=parseSet(value),b=parseSet(f.expected);
      return a&&b&&JSON.stringify(a)===JSON.stringify(b)?'correct':f.form;
    }
    if (f.form === 'intervals') {const a=parseIntervals(value),b=parseIntervals(f.expected);return a&&a===b?'correct':'intervals';}
    if (f.form === 'sign') return normalizeMath(value)===f.expected?'correct':'sign';
    if (f.form === 'degree') return /^\d+$/.test(value.trim()) && BigInt(value.trim()) === BigInt(f.expected) ? 'correct' : 'degree';
    const status = MathChecker.check(value, f.expected, f.form).status;
    return status === 'correct' && repeatedLetter(value) ? 'powers' : status;
  }
  function grade(step, drafts) {
    const values = step.fields.map((_, i) => typeof drafts[i] === 'string' ? drafts[i].slice(0, 240) : '');
    let statuses = step.fields.map((f, i) => fieldStatus(values[i], f));
    // A correct alternative must match one complete approved decomposition.
    // Score partial variants only to select a useful field for feedback.
    if (step.variants) {
      const score = a => a.filter(v => v === 'correct').length;
      const prefix = a => a.every(v => v === 'correct') ? a.length : a.findIndex(v => v !== 'correct');
      for (const variant of step.variants) {
        const alt = step.fields.map((f,i) => fieldStatus(values[i], {...f, expected: variant[i]}));
        if (score(alt) > score(statuses) || (score(alt) === score(statuses) && prefix(alt) > prefix(statuses))) statuses = alt;
      }
    }
    if (step.factor && statuses[0] === 'wrong' && values[0].trim() && values[1].trim()) {
      const product = MathChecker.check('(' + values[0] + ')(' + values[1] + ')', step.fields[2].expected).status;
      if (product === 'expand') statuses[0] = 'maxfactor';
    }
    const index = statuses.findIndex(s => s !== 'correct');
    return { done: index < 0, index, status: index < 0 ? 'correct' : statuses[index], statuses };
  }
  const feedbackFor = {
    empty: 'Заполни эту строку.', syntax: 'Проверь знаки, буквы и формат записи.',
    expand: 'Значение верно, но скобки ещё не раскрыты.',
    collect: 'Значение верно. Вычисли оставшиеся произведения и приведи подобные члены.',
    multiply: 'Значение верно. Выполни умножение, не приводя пока подобные.',
    terms: 'Значение верно, но требуется промежуточная сумма с каждым отдельным слагаемым.',
    powers: 'Значение верно. Повторяющиеся буквы запиши одной буквой со степенью.',
    degree: 'Сравни степени членов уже приведённого многочлена. Для ab учитывай обе буквы.',
    maxfactor: 'Произведение равно исходному многочлену, но нужен наибольший общий одночленный множитель с положительным коэффициентом.',
    number: 'Введи точное число (целое, десятичное или обыкновенную дробь). Проверь вычисление.',
    domain: 'Проверь все исходные знаменатели и ограничения. При делении проверь, не равен ли делитель нулю. Перечисли исключённые числа через ;.',
    roots: 'Проверь полноту множества корней, а в дробном уравнении — исходную ОДЗ. Числа разделяй ;, для пустого множества введи «нет».',
    intervals: 'Проверь границы, знаки и включение конечных точек. Записывай интервалы через ;, объединение через ∪, бесконечность через ∞ или inf.',
    sign: 'Подставь допустимое число из этого интервала. Введи только + или −.',
    wrong: 'Проверь знак, коэффициент и буквенную часть в этой строке.'
  };
  function cleanRecord(raw, step) {
    const r = raw && typeof raw === 'object' ? raw : {};
    const drafts = step.fields.map((_, i) => typeof r.drafts?.[i] === 'string' ? r.drafts[i].slice(0, 240) : '');
    const attempts = Number.isSafeInteger(r.attempts) ? Math.max(0, r.attempts) : 0;
    const hints = step.checkpoint ? 0 : Math.max(0, Math.min(step.hints.length, Number.isSafeInteger(r.hints) ? r.hints : 0));
    const done = r.done === true && grade(step, drafts).done;
    return { drafts, attempts, hints, done, first: ['correct','wrong','assisted'].includes(r.first) ? r.first : null };
  }
  function createWorkshop(steps, storageKey, config) {
  function cleanProgress(raw) {
    const records = {};
    for (const step of steps) records[step.id] = cleanRecord(raw?.records?.[step.id], step);
    const current = raw?.current === 'summary' || steps.some(s => s.id === raw?.current) ? raw.current : steps[0].id;
    return { current, records };
  }
  function createStore(storage) {
    let state = cleanProgress(null), canSave = true;
    function read() {
      if (!canSave) return state;
      try { const raw = storage.getItem(storageKey); if (raw !== null) state = cleanProgress(JSON.parse(raw)); }
      catch { /* private mode or bad saved record; keep in-memory state */ }
      return state;
    }
    function update(change) {
      read(); change(state);
      if (canSave) try { storage.setItem(storageKey, JSON.stringify(state)); } catch { canSave = false; }
      return state;
    }
    return { read, update };
  }
  const sessionStores = new WeakMap();
  function open(root, onBack) {
    const doc = root.ownerDocument;
    let storage;
    try { storage = doc.defaultView.localStorage; } catch { storage = null; }
    let store = sessionStores.get(root);
    if (!store) { store = createStore(storage); sessionStores.set(root, store); }
    const make = (tag, text, cls) => { const e = doc.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
    const button = (text, action) => { const b = make('button', text); b.type = 'button'; b.addEventListener('click', action); return b; };
    function go(id) { store.update(p => { p.current = id; }); render(true); }
    function render(moveFocus) {
      const p = store.read(), first = steps.findIndex(s => !p.records[s.id].done);
      const wanted = steps.findIndex(s => s.id === p.current);
      root.replaceChildren();
      root.dataset.step = config.summaryId;
      root.append(button(config.backLabel, onBack));
      if (first === -1 && p.current === 'summary') {
        const title = make('h2', config.summaryTitle); title.tabIndex = -1; root.append(title);
        const independent = steps.filter(s => p.records[s.id].first === 'correct' && !p.records[s.id].hints).length;
        const aided = steps.filter(s => p.records[s.id].hints > 0).length;
        root.append(make('p', `С первой попытки без подсказки: ${independent}. После исправления без подсказки: ${steps.length-independent-aided}. С подсказкой: ${aided}.`));
        for (const step of steps.filter(s => s.checkpoint)) root.append(make('p', step.title + ' — ' + (p.records[step.id].first === 'correct' ? 'с первой попытки' : 'после исправления')));
        const links = make('div', undefined, 'bridge-links');
        for (const [label, href] of config.links) {
          const a = make('a', label); a.href = href; links.append(a);
        }
        if (config.next) {
          const nextLesson = button(config.nextLabel, () => config.next(root, () => render(true)));
          nextLesson.id = config.nextId; root.append(nextLesson);
        }
        root.append(links, button('Посмотреть свои записи', () => go(steps[0].id)));
        if (moveFocus) title.focus(); return;
      }
      const index = first < 0 ? Math.max(0, wanted) : Math.min(first, Math.max(0, wanted < 0 ? first : wanted));
      const step = steps[index], state = p.records[step.id];
      root.dataset.step = config.stepPrefix + step.id;
      root.append(make('p', `Шаг ${index+1} из ${steps.length}${step.checkpoint ? ' · Самостоятельно' : ''}`, 'bridge-progress'));
      const title = make('h2', step.title); title.tabIndex = -1;
      root.append(title, make('p', step.expression, 'expr'), make('p', step.prompt, 'bridge-prompt'));
      if (step.grid) {
        // Multiplication/area model exposes factors, never the calculated products.
        const table = make('table'); table.setAttribute('aria-label', 'Четыре произведения');
        table.style.cssText = 'border-collapse:collapse;width:100%;max-width:26rem;table-layout:fixed;margin:0.75rem 0';
        const caption = make('caption', step.grid.caption); caption.style.cssText = 'text-align:left;padding:.35rem;line-height:1.4'; table.append(caption);
        const head = make('thead'), heading = make('tr'); heading.append(make('th','×'));
        for (const col of step.grid.cols) { const cell = make('th',col); cell.scope='col'; heading.append(cell); }
        head.append(heading); table.append(head);
        const body = make('tbody');
        for (const row of step.grid.rows) {
          const tr = make('tr'), th = make('th',row); th.scope='row'; tr.append(th);
          for (const col of step.grid.cols) { const cell = make('td',row+' · '+col); cell.style.cssText='border:1px solid #a88a68;padding:.6rem .25rem;text-align:center;background:#fef3c7;color:#451a03;overflow-wrap:anywhere'; tr.append(cell); }
          body.append(tr);
        }
        table.append(body); root.append(table);
      }
      const form = make('form', undefined, 'bridge-form'), inputs = [];
      for (const [i, f] of step.fields.entries()) {
        const id = `poly-answer-${i}`, label = make('label', f.label), input = make('input', undefined, 'bridge-answer');
        label.htmlFor = id; input.id = id; input.type = 'text'; input.maxLength = 240;
        input.autocomplete = 'off'; input.spellcheck = false; input.value = state.drafts[i]; input.readOnly = state.done;
        if (f.form === 'degree') input.inputMode = 'numeric';
        input.addEventListener('input', () => store.update(p => { const r = p.records[step.id]; if (!r.done) r.drafts[i] = input.value.slice(0, 240); }));
        inputs.push(input); form.append(label, input);
      }
      const message = make('p'); message.id = 'poly-feedback'; message.setAttribute('role', 'status'); message.setAttribute('aria-live', 'polite');
      if (!state.done) {
        const submit = make('button', 'Проверить'); submit.type = 'submit'; form.append(submit);
        if (!step.checkpoint) {
          const hint = button('Подсказка', () => {
            const updated = store.update(p => { const r = p.records[step.id]; if (!r.done) r.hints = Math.min(step.hints.length, r.hints + 1); }).records[step.id];
            if (updated.done) { render(false); return; }
            message.textContent = step.hints[updated.hints - 1]; hint.disabled = updated.hints >= step.hints.length;
          });
          hint.disabled = state.hints >= step.hints.length; form.append(hint);
          if (state.hints) message.textContent = step.hints[state.hints - 1];
        }
        form.addEventListener('submit', event => {
          event.preventDefault(); const values = inputs.map(i => i.value); const verdict = grade(step, values);
          const updated = store.update(p => {
            const r = p.records[step.id]; if (r.done) return; r.drafts = values;
            if (verdict.status === 'empty') return;
            r.attempts++; if (!r.first) r.first = r.hints ? 'assisted' : verdict.done ? 'correct' : 'wrong'; r.done = verdict.done;
          }).records[step.id];
          if (updated.done) { render(false); root.querySelector('#poly-next')?.focus(); return; }
          message.textContent = step.fields[verdict.index].label + '. ' + (feedbackFor[verdict.status] || feedbackFor.wrong);
          inputs[verdict.index]?.focus();
        });
      } else message.textContent = 'Верно. ' + step.explain;
      root.append(form, message);
      if (index > 0) root.append(button('Предыдущий шаг', () => go(steps[index-1].id)));
      if (state.done) { const next = button(index === steps.length - 1 ? 'Итоги' : 'Следующий шаг', () => go(steps[index+1]?.id || 'summary')); next.id = 'poly-next'; root.append(next); }
      if (moveFocus) title.focus();
    }
    render(true);
  }
  return { steps, storageKey, grade, createStore, cleanProgress, open };
  }

  const applications = createWorkshop(applicationSteps, applicationKey, {
    summaryId:'applications', stepPrefix:'application-', backLabel:'← Итоги урока об алгебраических дробях',
    summaryTitle:'Итоги: уравнения и неравенства',
    links:[['Линейные уравнения','../equations/linear-pilot/'],['Макарычев 8 · Формула корней и дискриминант','../school/makarychev8/#lesson/p21'],['Макарычев 8 · Теорема Виета','../school/makarychev8/#lesson/p23'],['Макарычев 8 · Квадратный трёхчлен','../school/makarychev8/#lesson/p24'],['Макарычев 8 · Разложение квадратного трёхчлена','../school/makarychev8/#lesson/p25'],['Макарычев 8 · Дробные рациональные уравнения','../school/makarychev8/#lesson/p26'],['Макарычев 8 · Решение систем','../school/makarychev8/#lesson/p31'],['Макарычев 8 · Уравнения с параметром','../school/makarychev8/#lesson/p33'],['Никольский · Рациональные уравнения','../school/nikolsky10/#lesson/p16'],['Никольский · Метод интервалов','../school/nikolsky10/#lesson/p18'],['Никольский · Рациональные неравенства','../school/nikolsky10/#lesson/p19'],['ОГЭ №9 · Уравнения','oge-task9-equations.html'],['ОГЭ №13 · Неравенства','oge13-inequalities-series.html'],['ОГЭ №20 · Письменные уравнения','oge-task20-equations.html'],['ЕГЭ база · Линейные уравнения со скобками','../ege-baza/path/index.html#lesson=equations-brackets'],['Курс ОГЭ','oge-course/index.html'],['Профильный ЕГЭ','../ege-profil/']]
  });
  const rational = createWorkshop(rationalSteps, rationalKey, {
    summaryId:'rational', stepPrefix:'rational-', backLabel:'← Итоги урока о формулах',
    summaryTitle:'Итоги: алгебраические дроби и ОДЗ',
    links:[['Макарычев 8 · Рациональные выражения','../school/makarychev8/#lesson/p01'],['§2 · Сокращение дробей','../school/makarychev8/#lesson/p02'],['§3 · Сложение и вычитание: одинаковые знаменатели','../school/makarychev8/#lesson/p03'],['§4 · Сложение и вычитание: разные знаменатели','../school/makarychev8/#lesson/p04'],['§5 · Умножение','../school/makarychev8/#lesson/p05'],['§6 · Деление дробей','../school/makarychev8/#lesson/p06'],['§7 · Преобразование','../school/makarychev8/#lesson/p07']],
    nextId:'rationalToApplications', nextLabel:'Дальше: уравнения и неравенства', next:applications.open
  });
  const identities = createWorkshop(identitySteps, identityKey, {
    summaryId:'identities', stepPrefix:'identity-', backLabel:'← Итоги урока о группировке',
    summaryTitle:'Итоги: формулы и разложение на множители',
    links:[['§32 · Квадраты и кубы','../school/makarychev7/#lesson/p32'],['§33 · Распознавание квадрата','../school/makarychev7/#lesson/p33'],['§36 · Сумма и разность кубов','../school/makarychev7/#lesson/p36'],['§37 · Тождественные преобразования','../school/makarychev7/#lesson/p37'],['Лаборатория формул сокращённого умножения','formuly-sokrashchennogo-umnozheniya.html']],
    nextId:'identityToRational', nextLabel:'Дальше: алгебраические дроби и ОДЗ', next:rational.open
  });
  const grouping = createWorkshop(groupingSteps, groupingKey, {
    summaryId: 'grouping', stepPrefix: 'grouping-', backLabel: '← Итоги урока о многочленах',
    summaryTitle: 'Итоги: группировка и первые формулы',
    nextId:'groupingToIdentities', nextLabel:'Дальше: формулы и разложение на множители', next:identities.open,
    links: [['§29 · Умножение многочленов','../school/makarychev7/#lesson/p29'],['§30 · Группировка','../school/makarychev7/#lesson/p30'],['§32 · Квадраты и кубы двучленов','../school/makarychev7/#lesson/p32'],['§33 · Квадрат суммы и разности','../school/makarychev7/#lesson/p33'],['§34 · Сумма и разность','../school/makarychev7/#lesson/p34'],['§35 · Разность квадратов','../school/makarychev7/#lesson/p35'],['§36 · Сумма и разность кубов','../school/makarychev7/#lesson/p36'],['Лаборатория формул сокращённого умножения','formuly-sokrashchennogo-umnozheniya.html']]
  });
  const polynomials = createWorkshop(polynomialSteps, storageKey, {
    summaryId: 'polynomials', stepPrefix: 'polynomial-', backLabel: '← Итоги урока о скобках',
    summaryTitle: 'Итоги: многочлены и общий множитель',
    links: [['§25 · Стандартный вид', '../school/makarychev7/#lesson/p25'], ['§27 · Умножение одночлена', '../school/makarychev7/#lesson/p27'], ['§28 · Общий множитель', '../school/makarychev7/#lesson/p28'], ['§30 · Группировка', '../school/makarychev7/#lesson/p30']],
    nextId: 'polyToGrouping', nextLabel: 'Дальше: группировка и первые формулы', next: grouping.open
  });
  return {...polynomials, grouping, identities, rational, applications};
});
