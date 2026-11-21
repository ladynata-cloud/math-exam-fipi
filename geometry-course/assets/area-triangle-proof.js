(function (root) {
  'use strict';

  const A = [120, 150], B = [268, 150], C = [200, 42], D = [52, 42];
  const ink = '#244d41', accent = '#9a461e';
  const path = (d, color = ink, width = 2.5, attrs = '') =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round" ${attrs}/>`;
  const text = (x,y,s) => `<text x="${x}" y="${y}" fill="#18382c" font-family="system-ui,sans-serif" font-size="17" text-anchor="middle" paint-order="stroke" stroke="white" stroke-width="3">${s}</text>`;

  function arc(v, p, q, r) {
    const onRay = end => {
      const dx=end[0]-v[0], dy=end[1]-v[1], k=r/Math.hypot(dx,dy);
      return [(v[0]+dx*k).toFixed(2),(v[1]+dy*k).toFixed(2)];
    };
    const sweep=(p[0]-v[0])*(q[1]-v[1])-(p[1]-v[1])*(q[0]-v[0])>0 ? 1 : 0;
    return path(`M${onRay(p)}A${r} ${r} 0 0 ${sweep} ${onRay(q)}`,ink,1.7);
  }

  function figure(step) {
    const captions = [
      'CH — высота к основанию AB. Как достроить треугольник до параллелограмма с тем же основанием и той же высотой?',
      'CD ∥ AB и AD ∥ BC. В точке D пересеклись проведённые прямые.',
      'Диагональ AC общая. Одинаковыми дугами отмечены равные накрест лежащие углы.',
      'Треугольник ABC занимает половину параллелограмма. Поэтому S треугольника = AB · h / 2.'
    ];
    const shades = step >= 2 ? '<path data-region="ABC" d="M120 150H268L200 42Z" fill="#c8e3d2"/><path data-region="ACD" d="M120 150L200 42H52Z" fill="'+(step === 2 ? '#f5d9b5' : '#f3f4ef')+'"/>' : '';
    const parallels = step >= 1 ? path('M200 42H52L120 150',accent,2.7,'data-construction="D"') +
      path('M153 38l6 4-6 4 M217 146l6 4-6 4',ink,1.7) +
      [[86,96],[234,96]].map(([x,y])=>`<g transform="translate(${x} ${y}) rotate(${Math.atan2(108,68)*180/Math.PI})">${path('M-5 -4l5 4-5 4 M0 -4l5 4-5 4',ink,1.7)}</g>`).join('') : '';
    const angles = step === 2 ? arc(A,B,C,18)+arc(C,D,A,18)+arc(A,C,D,14)+arc(A,C,D,19)+arc(C,A,B,14)+arc(C,A,B,19) : '';
    const diagonal = step >= 2 ? path('M120 150L200 42',accent,3,'data-diagonal="AC"') : '';
    return `<figure data-area-proof="${step}" style="max-width:380px;margin:8px 0 14px">
      <svg viewBox="0 0 318 184" width="318" style="display:block;width:100%;height:auto" role="img" aria-label="${captions[step]}">
        <title>${captions[step]}</title>${shades}${path('M120 150H268L200 42Z')}${parallels}${diagonal}
        ${path('M200 42V150',ink,1.5,'stroke-dasharray="5 4"')}${path('M200 140h10v10',ink,1.8,'data-right-angle="CHB"')}${angles}
        ${text(112,169,'A')}${text(277,167,'B')}${text(206,31,'C')}${text(200,170,'H')}${text(211,106,'h')}${step>=1?text(44,36,'D'):''}
      </svg><figcaption>${captions[step]}</figcaption></figure>`;
  }

  function preview(host, choice) {
    const current=host.querySelector('[data-area-proof]');
    const next={s1:1,s2:2}[choice];
    if(current && next===Number(current.dataset.areaProof)+1) current.outerHTML=figure(next);
  }

  root.MathExamAreaProof = {figure, preview};
})(globalThis);
