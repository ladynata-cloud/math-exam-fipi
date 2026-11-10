(function (root) {
  'use strict';

  function diagram(viewBox, label, drawing, labels) {
    return `<svg class="proof-diagram" viewBox="${viewBox}" role="img" aria-label="${label}"
      style="width:100%;max-width:360px;height:auto;display:block;margin:12px auto 16px">
      <g fill="none" stroke="#183247" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${drawing}</g>
      <g fill="#183247" font-size="15" font-weight="600" text-anchor="middle">${labels}</g>
    </svg>`;
  }

  const diagrams = new Map([
    ['segment', diagram('0 0 320 86', 'Отрезок AB длиной 10. Точка M отмечена посередине.', `
      <path d="M30 34v-6h260v6" stroke="#147c78"/>
      <path d="M30 53h260"/>
      <path d="M91 58l8-10m122 10l8-10" stroke="#147c78"/>
      <g fill="#183247" stroke="none">
        <circle cx="30" cy="53" r="3"/><circle cx="160" cy="53" r="3"/><circle cx="290" cy="53" r="3"/>
      </g>`, `
      <text x="160" y="21">AB = 10</text>
      <text x="30" y="75">A</text><text x="160" y="75">M</text><text x="290" y="75">B</text>
    `)],
    ['tangent', diagram('0 0 320 184', 'Окружность с центром O и радиусом OT. Прямая l проходит через T перпендикулярно радиусу. P — произвольная точка прямой, отличная от T.', `
      <circle cx="128" cy="84" r="65" fill="#e8f2ed"/>
      <path d="M128 84v65M27 149h266"/>
      <path d="M128 84l110 65" stroke="#147c78" stroke-dasharray="6 5"/>
      <path d="M128 136h13v13" stroke="#147c78"/>
      <g fill="#183247" stroke="none">
        <circle cx="128" cy="84" r="3"/><circle cx="128" cy="149" r="3"/><circle cx="238" cy="149" r="3"/>
      </g>`, `
      <text x="116" y="79">O</text><text x="128" y="171">T</text><text x="238" y="171">P</text><text x="290" y="138">l</text>
    `)],
    ['projection', diagram('0 0 336 202', 'Треугольник ABC с прямым углом C. Высота CH перпендикулярна гипотенузе AB. Точка H лежит между A и B.', `
      <path d="M18 172L126 28l192 144Z" fill="#e8f2ed"/>
      <path d="M126 28v144" stroke="#147c78" stroke-dasharray="6 5"/>
      <path d="M117 40l12 9 9-12m-12 122h13v13" stroke="#147c78"/>
      <g fill="#183247" stroke="none">
        <circle cx="18" cy="172" r="3"/><circle cx="126" cy="28" r="3"/>
        <circle cx="126" cy="172" r="3"/><circle cx="318" cy="172" r="3"/>
      </g>`, `
      <text x="18" y="193">A</text><text x="126" y="20">C</text><text x="126" y="193">H</text><text x="318" y="193">B</text>
    `)],
    ['pythagoras', diagram('0 0 260 240', 'Квадрат со стороной a + b. В его углах лежат четыре одинаковых прямоугольных треугольника с катетами a и b. Их гипотенузы c ограничивают внутреннюю фигуру.', `
      <path d="M34 22h192v192H34Z" fill="#e8f2ed"/>
      <path d="M106 22l120 72-72 120L34 142Z" fill="#fffefa" stroke="#147c78"/>
      <path d="M214 22v12h12"/>
    `, `
      <text x="70" y="16">a</text><text x="166" y="16">b</text>
      <text x="239" y="62">a</text><text x="239" y="160">b</text>
      <text x="94" y="234">b</text><text x="190" y="234">a</text>
      <text x="21" y="86">b</text><text x="21" y="184">a</text>
      <text x="172" y="54">c</text>
    `)]
  ]);

  root.GeoProofDiagrams = { render: (proofId) => diagrams.get(proofId) || '' };
})(window);
