(function (root) {
  'use strict';

  function figure({ proof = '', step = 0, computing = false } = {}) {
    const extension = proof === 'midline-early';
    const showSecond = extension && step >= 2;
    const showConclusion = proof && step >= (extension ? 3 : 4);
    const view = extension ? '36 10 365 227' : '36 10 306 227';
    const label = extension
      ? 'Треугольник ABC. M и N — середины AC и BC. За N отмечена точка K, MN = NK.'
      : 'Треугольник ABC. Отрезок MN соединяет середины сторон AC и BC.';
    const highlight = extension && step === 1
      ? '<path d="M136 38L108 127H229ZM350 127H229L322 216Z"/>'
      : showSecond && !showConclusion ? '<path d="M80 216L108 127H350L322 216Z"/>'
      : proof && !extension && step === 2 ? '<path d="M136 38L108 127H229ZM136 38L80 216H322Z"/>' : '';
    const sides = showConclusion
      ? (extension ? '<path d="M108 127H350M80 216H322"/>' : '<path d="M108 127H229M80 216H322"/>')
      : '';
    const caption = computing ? ''
      : !proof ? 'M и N отмечены на сторонах треугольника.'
      : showConclusion ? (extension ? 'Сравни MK и AB. Какую часть MK составляет MN?' : 'Сравни выделенные отрезки.')
      : showSecond ? 'Найди противоположные стороны четырёхугольника AMKB.'
      : extension ? 'Найди точку пересечения отрезков CB и MK.'
      : 'Найди вершину, общую для треугольников CMN и CAB.';
    const baseLabel = computing ? '<text x="201" y="209" text-anchor="middle">AB дано</text>' : '';
    return `<figure class="midline-diagram${computing ? ' midline-computing' : ''}">
      <svg viewBox="${view}" role="img" aria-label="${label}">
        <g stroke="#35574e" stroke-width="2.5" fill="none"><path d="M80 216L136 38L322 216ZM108 127H229"/>
        ${extension ? '<path d="M229 127H350L322 216" stroke-dasharray="5 4"/>' : ''}</g>
        <g stroke="#18725b" stroke-width="3" fill="#18725b" fill-opacity=".12">${highlight}</g>
        <g stroke="#18725b" stroke-width="5" fill="none">${sides}</g>
        <g fill="#23483c"><circle cx="80" cy="216" r="3"/><circle cx="136" cy="38" r="3"/><circle cx="322" cy="216" r="3"/>
        <circle cx="108" cy="127" r="4"/><circle cx="229" cy="127" r="4"/>${extension ? '<circle cx="350" cy="127" r="4"/>' : ''}</g>
        <g fill="#14382e" font-family="system-ui,sans-serif" font-size="20" font-weight="700">
        <text x="60" y="217">A</text><text x="325" y="217">B</text><text x="125" y="31">C</text>
        <text x="82" y="126">M</text><text x="228" y="115">N</text>${extension ? '<text x="357" y="124">K</text>' : ''}${baseLabel}</g>
      </svg>${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`;
  }

  function preparePage() {
    document.body.classList.add('midline-lesson');
    const styles = document.createElement('style');
    styles.textContent = `
.midline-diagram{margin:12px 0;max-width:405px}
.midline-diagram.midline-computing{max-width:245px;margin:8px 0}
.midline-diagram svg{display:block;width:100%;height:auto;background:#f3f7f5;border-radius:8px}
.midline-diagram figcaption{margin-top:4px}
@media(max-width:600px){
 .midline-lesson .lesson-head{padding:6px 0;margin:0}
 .midline-lesson .lesson-head h1{font-size:24px;line-height:1.2;margin:4px 0}
 .midline-lesson .lesson-head .pill{display:none}
 .midline-lesson .lesson-head .eyebrow{margin:0 0 3px}
 .midline-diagram.midline-computing{max-width:195px}
 .midline-lesson .stage-nav{margin:6px 0 12px}
 .midline-lesson #lesson{padding:14px}
 .midline-lesson #lesson h2{margin:0 0 8px;font-size:22px;line-height:1.2}
 .midline-lesson #lesson .callout{padding:8px 12px;margin:8px 0}
 .midline-lesson #lesson .callout p{margin:3px 0}
}`;
    document.head.append(styles);
  }

  root.MathExamMidlineDiagram = { figure, preparePage };
})(globalThis);
