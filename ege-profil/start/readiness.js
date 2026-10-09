(function(root){'use strict';
// These are low-stakes placement questions, not an exam score or a diagnosis.
const checks=[
 {id:'signs',title:'Минус и квадрат',prompt:'Вычислите <b>−3²</b>. Скобок вокруг −3 нет.',answer:-9,lesson:'bridge-signs',why:'Сначала 3² = 9, затем минус перед результатом: −9. Запись (−3)² дала бы 9.'},
 {id:'fractions',title:'Деление дробей',prompt:'Вычислите <b>3/4 : 1/2</b>.',answer:1.5,lesson:'bridge-fractions',why:'Деление на 1/2 заменяем умножением на 2: 3/4 · 2 = 3/2 = 1,5.'},
 {id:'roots',title:'Корень из дроби',prompt:'Вычислите <b>√(25/36)</b>.',answer:5/6,lesson:'bridge-roots',why:'Корень неотрицателен: √25 / √36 = 5/6.'},
 {id:'equations',title:'Уравнение со скобками',prompt:'Решите <b>3(x − 2) = 12</b>. Введите x.',answer:6,lesson:'bridge-equations',why:'Делим обе части на 3: x − 2 = 4. Прибавляем 2: x = 6.'},
 {id:'coordinates',title:'Координаты',prompt:'Точка A имеет координаты <b>(−2; 3)</b>. Чему равна её горизонтальная координата x?',answer:-2,lesson:'bridge-coordinates',why:'Первое число — x, горизонтальная координата. Второе число — y, вертикальная.'},
 {id:'triangle',title:'Косинус острого угла',prompt:'В прямоугольном треугольнике прилежащий к углу α катет равен <b>4</b>, гипотенуза — <b>5</b>. Найдите cos α.',answer:0.8,lesson:'bridge-triangle',why:'Косинус острого угла — прилежащий катет, делённый на гипотенузу: 4/5.'},
 {id:'powers',title:'Отрицательный показатель',prompt:'Вычислите <b>2<sup>−3</sup></b>.',answer:0.125,lesson:'expr-powers',why:'Минус в показателе даёт обратное число: 2⁻³ = 1/2³ = 1/8.'},
 {id:'quadratic',title:'Выбор корня',prompt:'Найдите <b>больший</b> корень уравнения <b>x² − 5x + 6 = 0</b>.',answer:3,lesson:'eq-quadratic',why:'(x − 2)(x − 3) = 0. Корни 2 и 3; больший — 3.'},
 {id:'circle',title:'Косинус на окружности',prompt:'Точка единичной окружности: <b>P = (−3/5; 4/5)</b>. Найдите cos α.',answer:-0.6,lesson:'trig-coordinates',why:'На окружности cos α = x, sin α = y. Нужна первая координата: −3/5.'},
 {id:'radians',title:'Градусы и радианы',prompt:'Угол <b>240° = kπ рад</b>. Найдите <b>k</b>. Число π вводить не нужно.',answer:4/3,lesson:'trig-angle',why:'180° = π рад, поэтому k = 240/180 = 4/3. Переводим весь исходный угол.'},
 {id:'exact',title:'Точное значение',prompt:'Вычислите <b>2 · sin 30°</b>.',answer:1,lesson:'trig-special',why:'sin 30° = 1/2, поэтому 2 · 1/2 = 1.'},
 {id:'cosine',title:'Квадрат и знак',prompt:'<b>sin α = 3/5</b>, угол во <b>II четверти</b>. Найдите cos α.',answer:-0.8,lesson:'algebra-cosine',why:'cos² α = 1 − 9/25 = 16/25. Модуль косинуса 4/5. Во II четверти x отрицателен, поэтому cos α = −4/5.'}
];
const foundation=['bridge-signs','bridge-fractions','bridge-roots','bridge-equations','bridge-coordinates','bridge-triangle'];
const trig=['bridge-triangle','trig-angle','trig-coordinates','trig-special','trig-tangent','algebra-cosine','algebra-double-angle'];
const routes=[
 {title:'Можно начинать параллельно',text:'Для этих тем не требуется закончить всю тригонометрию.',ids:['geo-right','vec-coordinates','prob-count','eq-linear','applied-formula']},
 {title:'Алгебра перед сложными задачами',text:'Степени и дроби → уравнения → текстовые задачи. Если основа знакома, сразу проверьте себя.',ids:['expr-powers','expr-roots','expr-fractions','eq-linear','eq-rational','eq-quadratic','algebra-exponential','algebra-logarithmic']},
 {title:'Графики перед производной',text:'Сначала читаем координаты и график. Затем связываем наклон с производной.',ids:['fn-line','calc-tangent']}
];
const next={
 'bridge-signs':'bridge-fractions','bridge-fractions':'bridge-roots','bridge-roots':'bridge-equations','bridge-equations':'eq-linear','bridge-coordinates':'vec-coordinates','bridge-triangle':'trig-angle',
 'trig-angle':'trig-coordinates','trig-coordinates':'trig-special','trig-special':'trig-tangent','trig-tangent':'algebra-cosine','algebra-cosine':'algebra-double-angle',
 'eq-linear':'eq-rational','eq-rational':'eq-quadratic','eq-quadratic':'algebra-exponential','algebra-exponential':'algebra-logarithmic','algebra-logarithmic':'eq-root',
 'expr-powers':'expr-roots','expr-roots':'expr-fractions'
};
const prerequisites={
 'trig-angle':['bridge-fractions'], 'trig-coordinates':['bridge-coordinates','bridge-triangle'], 'trig-special':['trig-angle','trig-coordinates','bridge-roots'],
 'trig-tangent':['trig-coordinates','bridge-fractions'],'algebra-cosine':['trig-coordinates','bridge-roots'],'algebra-double-angle':['trig-special','bridge-triangle'],
 'algebra-exponential':['expr-powers','bridge-equations'],'algebra-logarithmic':['expr-powers','bridge-equations'],
 'expr-roots':['bridge-roots'],'expr-fractions':['bridge-fractions'],'eq-root':['bridge-roots','bridge-equations'],'eq-quadratic':['bridge-signs','bridge-roots'],
 'eq-rational':['bridge-fractions','bridge-equations'],'applied-motion':['expr-fractions','eq-rational','eq-quadratic'],'applied-work':['expr-fractions','eq-rational','eq-quadratic']
};
function recommend(results){return [...new Set(checks.filter(q=>results[q.id]!==true).map(q=>q.lesson))];}
const api={checks,foundation,trig,routes,next,prerequisites,recommend};root.ProfileReadiness=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
