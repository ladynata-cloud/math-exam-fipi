(() => {
  'use strict';

  const views = {
    'coordinate-box': ['Из вершины O ребро OA идёт вдоль оси x, OB вдоль оси y, OC вдоль оси z. P прямо над A. Q — верхняя вершина, противоположная O.',
      '<path d="M48 102H148L190 72H90ZM48 102V40H148L190 10H90L48 40M148 40V102M190 72V10M90 10V72"/><path class="accent-edge" d="M148 102H162M90 72l16-11M48 40V27"/><text x="32" y="115">O</text><text x="144" y="121">A</text><text x="90" y="92">B</text><text x="30" y="42">C</text><text x="151" y="37">P</text><text x="194" y="17">Q</text><text x="164" y="107">x</text><text x="109" y="67">y</text><text x="44" y="22">z</text>'],
    box: ['Прямоугольный параллелепипед. Нижняя грань ABCD, верхняя A₁B₁C₁D₁.',
      '<path class="hidden-edge" d="M44 105 79 76H203M79 76V26"/><path d="M44 105H169L203 76V26H79L44 55ZM44 55H169L203 26M169 55V105"/><text x="26" y="118">A</text><text x="174" y="120">B</text><text x="207" y="84">C</text><text x="67" y="73">D</text><text x="23" y="56">A₁</text><text x="152" y="52">B₁</text><text x="205" y="23">C₁</text><text x="61" y="21">D₁</text>'],
    triangle: ['Треугольник ABC с высотой AH к основанию BC.',
      '<path d="M110 18 30 104H202Z"/><path class="accent-edge" d="M110 18V104M110 95h9v9"/><text x="104" y="15">A</text><text x="15" y="120">B</text><text x="204" y="120">C</text><text x="104" y="120">H</text>'],
    parallel: ['Треугольник ABC. Точки D и E лежат на сторонах AB и AC. DE параллелен BC.',
      '<path d="M110 18 30 104H202Z"/><path class="accent-edge" d="M73 58H153"/><text x="104" y="15">A</text><text x="15" y="120">B</text><text x="204" y="120">C</text><text x="55" y="59">D</text><text x="158" y="59">E</text>'],
    tangent: ['Окружность с центром O. Прямая через M касается окружности в T.',
      '<circle cx="91" cy="61" r="38"/><path d="M70 23H207M91 61l100-38"/><path class="accent-edge" d="M91 61V23"/><text x="78" y="76">O</text><text x="86" y="18">T</text><text x="186" y="18">M</text>'],
    diameter: ['Отрезок AB — диаметр окружности, P — точка на окружности.',
      '<circle cx="115" cy="65" r="44"/><path d="M71 65h88L115 21Z"/><text x="55" y="69">A</text><text x="165" y="69">B</text><text x="109" y="17">P</text>']
  };

  globalThis.ProfileAlphabetDiagram = id => {
    if (!Object.hasOwn(views, id)) return '';
    const [label, drawing] = views[id];
    return '<svg class="alphabet-diagram" role="img" aria-label="' + label + '" viewBox="0 0 230 128">' + drawing + '</svg>';
  };
})();
