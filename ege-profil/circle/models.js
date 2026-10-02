(function (root) {
  'use strict';
  const TAU = 2 * Math.PI, LIMIT = 1000 * Math.PI, EPS = 1e-10;
  let sequence = 0;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const clean = n => Math.abs(n) < EPS ? 0 : Math.abs(n - 1) < EPS ? 1 : Math.abs(n + 1) < EPS ? -1 : n;
  const norm = n => { const v = ((n % TAU) + TAU) % TAU; return v < EPS || TAU - v < EPS ? 0 : v; };
  const fmt = n => clean(n).toFixed(4).replace(/\.?0+$/, '').replace('.', ',');
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function radians(t) {
    if (Math.abs(t) < EPS) return '0';
    for (const d of [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 30, 60, 120, 180]) {
      const n = Math.round(t / Math.PI * d);
      if (Math.abs(t - n * Math.PI / d) < 1e-8) return (n === 1 ? '' : n === -1 ? '−' : String(n).replace('-', '−')) + 'π' + (d === 1 ? '' : '/' + d);
    }
    return fmt(t);
  }
  function exact(n) {
    n = clean(n);
    if(Math.abs(n-Math.round(n))<1e-10)return String(Math.round(n)).replace('-', '−');
    if(Math.abs(n-Math.round(n))<1e-9)return String(Math.round(n)).replace('-', '−');
    for (const [v, text] of [[0,'0'],[.5,'1/2'],[1,'1'],[Math.SQRT1_2,'√2/2'],[Math.sqrt(3)/2,'√3/2'],[Math.sqrt(3),'√3'],[1/Math.sqrt(3),'√3/3']]) {
      if (Math.abs(Math.abs(n) - v) < 1e-8) return (n < 0 ? '−' : '') + text;
    }
    return '≈ ' + fmt(n);
  }
  // Keep editable radians in multiples of π, without snapping the actual point.
  function radiansInput(t) {
    if (Math.abs(t) < EPS) return '0';
    for (let d = 1; d <= 360; d++) {
      const n = Math.round(t / Math.PI * d);
      if (Math.abs(t - n * Math.PI / d) < EPS) return (n === 1 ? '' : n === -1 ? '−' : String(n).replace('-', '−')) + 'π' + (d === 1 ? '' : '/' + d);
    }
    return (t / Math.PI).toFixed(12).replace(/\.?0+$/, '').replace('.', ',').replace('-', '−') + 'π';
  }
  function values(t) {
    const x = clean(Math.cos(t)), y = clean(Math.sin(t));
    return {x, y, tan: x === 0 ? null : clean(y / x), cot: y === 0 ? null : clean(x / y), angle: t, normalized: norm(t)};
  }
  function belongs(value, threshold, relation) {
    if (relation === '>') return value > threshold + EPS;
    if (relation === '<') return value < threshold - EPS;
    if (relation === '<=') return value <= threshold + EPS;
    return value >= threshold - EPS;
  }
  function intersections(axis, threshold) {
    if (!Number.isFinite(threshold) || Math.abs(threshold) > 1) return [];
    const a = axis === 'x' ? Math.acos(threshold) : Math.asin(threshold);
    const angles = axis === 'x' ? [norm(a), norm(-a)] : [norm(a), norm(Math.PI - a)];
    return angles.filter((a, i) => angles.findIndex(b => Math.abs(a - b) < EPS) === i).sort((a,b) => a-b);
  }
  function sliceIntervals(axis, threshold, relation) {
    const roots = intersections(axis, threshold), cuts = [0, ...roots.filter(a => a > EPS), TAU];
    const intervals = [];
    for (let i = 1; i < cuts.length; i++) {
      const a = cuts[i-1], b = cuts[i], m = (a+b)/2;
      if (belongs(axis === 'x' ? Math.cos(m) : Math.sin(m), threshold, relation)) intervals.push([a,b]);
    }
    return {roots, intervals, closed: relation.includes('=')};
  }
  const labels = {arc:'Число превращается в путь', angle:'Поворот и положение точки', coordinates:'Координаты точки на окружности', slice:'От координаты к дуге', functions:'Синус, косинус, тангенс и котангенс', compare:'Сравниваем точки, а не рисунки чисел'};
  const snapAngle = (t, denominator) => denominator ? Math.round(t / Math.PI * denominator) * Math.PI / denominator : t;
  const helpers = {norm, radians, radiansInput, snapAngle, exact, values, belongs, intersections, sliceIntervals};
  function mount(container, supplied, hooks) {
    const config = Object.assign({mode:'arc',angle:0}, supplied || {}), options = hooks || {};
    const mode = Object.hasOwn(labels, config.mode) ? config.mode : 'arc';
    const id = 'mord-circle-' + (++sequence), subscriptions = [];
    let t = Number.isFinite(config.angle) ? clamp(config.angle, -LIMIT, LIMIT) : 0;
    let axis = config.axis === 'x' ? 'x' : 'y';
    let threshold = Number.isFinite(config.threshold) ? clamp(config.threshold, -2, 2) : .5;
    let relation = ['>','<','>=','<='].includes(config.relation) ? config.relation : '>=';
    let revealed = !options.practice, dragging = false, pointer = null, dead = false;
    let snapDenominator = 12;
    const point = (angle, r = 130) => ({x:230+r*Math.cos(angle),y:190-r*Math.sin(angle)});
    const on = (el, name, fn, opts) => {el.addEventListener(name, fn, opts); subscriptions.push(() => el.removeEventListener(name, fn, opts));};
    const attrs = (el, data) => Object.entries(data).forEach(([k,v]) => el.setAttribute(k,String(v)));
    const XY = p => `${p.x.toFixed(3)} ${p.y.toFixed(3)}`;
    function arc(start, delta, r) {
      if (!Number.isFinite(start) || !Number.isFinite(delta) || Math.abs(delta) < EPS) return '';
      delta = clamp(delta, -TAU, TAU);
      const n = Math.ceil(Math.abs(delta) / (Math.PI / 2)), a = delta / n;
      let d = 'M' + XY(point(start,r));
      for(let i = 1; i <= n; i++) d += `A${r} ${r} 0 0 ${a > 0 ? 0 : 1} ${XY(point(start+i*a,r))}`;
      return d;
    }
    const showProjections = ['coordinates','slice','functions','compare'].includes(mode);
    const named = Array.isArray(config.points) ? config.points.filter(p => p && Number.isFinite(p.angle)).slice(0,16) : [];
    container.innerHTML = `<section class="mord-lab" aria-labelledby="${id}-heading">
      <style>
        .mord-lab{--ml-ink:#16334b;--ml-muted:#536b7f;--ml-teal:#007f77;--ml-blue:#1768ba;--ml-rose:#ad376c;color:var(--ml-ink);min-width:0}
        .mord-lab *{box-sizing:border-box}.mord-lab h3{margin:.2rem 0 .5rem;font-size:1.2rem}.mord-lab p{margin:.5rem 0;overflow-wrap:anywhere}.mord-lab .ml-caption{color:var(--ml-muted);font-size:.94rem;line-height:1.5}
        .mord-lab .ml-canvas{display:block;width:100%;height:auto;max-width:720px;margin:auto;touch-action:none;border-radius:18px;background:linear-gradient(145deg,#f7fbff,#edf7f8)}
        .mord-lab .ml-canvas:focus{outline:3px solid #9b69ed;outline-offset:3px}.mord-lab .ml-controls{display:flex;align-items:end;gap:.65rem;flex-wrap:wrap;margin:.8rem 0}.mord-lab .ml-controls label{display:grid;gap:.35rem;min-width:0;font-weight:600;flex:1 1 145px;font-size:.9rem}
        .mord-lab input,.mord-lab select{min-width:0;width:100%;max-width:100%;font:inherit;color:inherit;background:white;border:1px solid #a4b8c6;border-radius:9px;padding:.65rem}.mord-lab input[type=range]{padding:0;margin:0;width:100%;accent-color:var(--ml-teal)}
        .mord-lab button{font:inherit;cursor:pointer;border:1px solid #a0b8c6;border-radius:10px;background:white;color:var(--ml-ink);padding:.6rem .8rem;min-height:44px;overflow-wrap:anywhere;max-width:100%}.mord-lab button:hover{background:#e5f2f4}.mord-lab button:focus-visible,.mord-lab input:focus-visible,.mord-lab select:focus-visible{outline:3px solid #9b69ed;outline-offset:2px}
        .mord-lab .ml-actions{display:flex;flex-wrap:wrap;gap:.45rem}.mord-lab .ml-primary{background:#006e67;color:white;border-color:#006e67}.mord-lab .ml-primary:hover{background:#00594f}
        .mord-lab .ml-readings{border:1px solid #c7dbe5;border-radius:13px;padding:.85rem;margin:.7rem 0;background:white;line-height:1.6}.mord-lab .ml-reading-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(180px,100%),1fr));gap:.65rem}.mord-lab .ml-value{padding:.5rem .65rem;border-radius:9px;background:#f0f6fb}.mord-lab .ml-x{color:var(--ml-blue)}.mord-lab .ml-y{color:var(--ml-rose)}.mord-lab .ml-error{color:#a12a38;min-height:1.3em;font-size:.9rem}.mord-lab .ml-tip{border-left:3px solid #e3b156;padding:.4rem .7rem;background:#fff9e8}.mord-lab .ml-strip{width:100%;height:auto;display:block;margin:.65rem 0}.mord-lab .ml-table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:.9rem}.mord-lab .ml-table th,.mord-lab .ml-table td{text-align:left;padding:.4rem;border-bottom:1px solid #dbe6eb;overflow-wrap:anywhere}.mord-lab [hidden]{display:none!important}
        @media(max-width:420px){.mord-lab .ml-controls label{flex-basis:125px}.mord-lab button{padding:.55rem .65rem}.mord-lab .ml-readings{padding:.6rem}.mord-lab .ml-table{font-size:.8rem}}
        @media(prefers-reduced-motion:reduce){.mord-lab *{animation:none!important;transition:none!important}}
      </style>
      <h3 id="${id}-heading">${labels[mode]}</h3>
      <p class="ml-caption">${config.goal ? esc(config.goal) : 'Перемещайте точку Q. Один полный оборот имеет длину 2π, а радиус окружности равен 1.'}</p>
      <svg class="ml-canvas" viewBox="0 0 480 385" tabindex="0" role="img" aria-labelledby="${id}-title ${id}-desc" data-circle-svg>
        <title id="${id}-title">Единичная окружность: точка Q и направленный поворот</title><desc id="${id}-desc">Стрелки двигают точку по выбранным делениям. Home возвращает к нулю. Значение можно ввести под рисунком.</desc>
        <defs><clipPath id="${id}-clip"><rect x="22" y="28" width="432" height="320" rx="4"/></clipPath><marker id="${id}-arrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#b87512"/></marker></defs>
        <path d="M100 190A130 130 0 0 1 230 60L230 190Z M230 190L360 190A130 130 0 0 1 230 320Z" fill="#e5f0f5"/>
        <g font-size="18" fill="#b0c0cc"><text x="296" y="121">I</text><text x="154" y="121">II</text><text x="151" y="277">III</text><text x="292" y="277">IV</text></g>
        <g data-slice-shade clip-path="url(#${id}-clip)"></g>
        <circle cx="230" cy="190" r="130" fill="none" stroke="#91acbf" stroke-width="2"/>
        <g data-special-ticks></g>
        <path d="M35 190H425M230 355V26" stroke="#6e8799" stroke-width="1.4"/><path d="M425 190l-7 -4v8z M230 26l-4 7h8z" fill="#6e8799"/>
        <g fill="#435f74" font-size="14"><text x="433" y="195">x</text><text x="239" y="27">y</text><text x="212" y="208">0</text></g>
        <g font-size="15" font-weight="600" fill="#3b566a"><text x="366" y="180">A (0)</text><text x="242" y="49">B (π/2)</text><text x="43" y="181">C (π)</text><text x="241" y="341">D (3π/2)</text></g>
        <g data-slice-line clip-path="url(#${id}-clip)"></g><g data-slice-arc></g>
        <path data-config-arc marker-end="url(#${id}-arrow)" fill="none" stroke="#8059bd" stroke-width="7" stroke-linecap="round" opacity=".6"/>
        <g data-function-lines clip-path="url(#${id}-clip)"></g>
        <g data-fixed-points></g>
        <path data-angle-arc fill="none" stroke="#b87512" stroke-width="3" marker-end="url(#${id}-arrow)"/>
        <path data-projections fill="none" stroke="#8097a7" stroke-width="1.5" stroke-dasharray="4 4"/>
        <line data-x-segment x1="230" y1="190" y2="190" stroke="#1768ba" stroke-width="6" stroke-linecap="round"/>
        <line data-y-segment x1="230" y1="190" x2="230" stroke="#ad376c" stroke-width="6" stroke-linecap="round"/>
        <line data-radius x1="230" y1="190" stroke="#007f77" stroke-width="2.5"/>
        <circle data-current-point r="10" fill="#007f77" stroke="white" stroke-width="3" style="cursor:grab"/>
        <text data-current-label text-anchor="middle" fill="#005c56" stroke="#f3f9fc" stroke-width="3" paint-order="stroke" font-size="17" font-weight="700">Q</text>
      </svg>
      <p class="ml-caption">Начало — A справа. «+» — против часовой стрелки, «−» — по часовой. Перетаскивайте точку или нажимайте стрелки: движение идёт по выбранным делениям. Точный ввод ниже позволяет задать любое число.</p>
      <div class="ml-controls"><label for="${id}-snap">Движение точки<select id="${id}-snap" data-angle-snap><option value="12">По делениям π/12 · 15°</option><option value="6">По делениям π/6 · 30°</option><option value="4">По делениям π/4 · 45°</option><option value="180">По делениям π/180 · 1°</option><option value="0">Свободно · без привязки</option></select></label></div>
      <div class="ml-controls"><label for="${id}-angle">Число t в радианах<input id="${id}-angle" data-angle-input type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="Например, -5*pi/3"></label><button type="button" class="ml-primary" data-apply-angle>Поставить точку</button></div>
      <p class="ml-caption" data-angle-precision hidden>Коэффициент перед π округлён. Положение точки сохраняется без округления.</p>
      <label class="ml-caption" for="${id}-range">Положение Q на одном обороте (0 … 2π)</label><input id="${id}-range" data-angle-range type="range" min="0" max="${TAU}" step="${Math.PI/180}" value="0" aria-label="Положение точки Q на одном обороте">
      <div class="ml-actions" style="margin-top:.7rem"><button type="button" data-delta="${-TAU}">−2π: оборот</button><button type="button" data-delta="${-Math.PI/12}">−π/12</button><button type="button" data-delta="${Math.PI/12}">+π/12</button><button type="button" data-delta="${TAU}">+2π: оборот</button><button type="button" data-zero>В начало A</button></div>
      <p class="ml-error" data-lab-error role="status" aria-live="polite"></p>
      <div data-slice-controls ${mode === 'slice' ? '' : 'hidden'}><div class="ml-controls"><label for="${id}-axis">Координата<select id="${id}-axis" data-axis><option value="x">Координата x</option><option value="y">Координата y</option></select></label><label for="${id}-relation">Условие<select id="${id}-relation" data-relation><option value=">">&gt;</option><option value=">=">≥</option><option value="<">&lt;</option><option value="<=">≤</option></select></label><label for="${id}-threshold">Граница<input id="${id}-threshold" data-threshold type="text" value="${threshold}" placeholder="1/2 или sqrt(2)/2"></label></div><button type="button" data-apply-slice>Применить условие</button></div>
      <div data-unwrapping ${mode === 'arc' || mode === 'angle' ? '' : 'hidden'}></div>
      <div class="ml-readings" data-lab-readings aria-live="off"></div>
      <button type="button" data-reveal-readings ${revealed ? 'hidden' : ''}>Показать значения и объяснение</button>
      <p class="ml-caption" data-help-note ${options.practice ? '' : 'hidden'}>В самостоятельной проверке числовые показания скрыты. Их открытие будет отмечено как помощь.</p>
    </section>`;
    const get = selector => container.querySelector(selector), svg = get('[data-circle-svg]');
    const input = get('[data-angle-input]'), range = get('[data-angle-range]');
    get('[data-axis]').value = axis; get('[data-relation]').value = relation;
    // Tick marks show equal geometric subdivisions without supplying answers.
    get('[data-special-ticks]').innerHTML = Array.from({length:24},(_,i) => { const p=point(i*Math.PI/12,127),q=point(i*Math.PI/12,133); return `<path d="M${XY(p)}L${XY(q)}" stroke="#9db2c1" stroke-width="${i%6===0?2:1}"/>`;}).join('');
    if(Number.isFinite(config.start) && Number.isFinite(config.end)) {
      let delta = norm(config.end-config.start); if(delta===0 && Math.abs(config.end-config.start)>EPS)delta=TAU;
      get('[data-config-arc]').setAttribute('d',arc(config.start,delta,137));
      [config.start,config.end].forEach((a,i) => { const p=point(a,137); get('[data-fixed-points]').innerHTML += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#8059bd"/><text x="${p.x+7}" y="${p.y+(i?-10:17)}" fill="#6b419f" font-size="13">${i?'конец':'начало'}</text>`; });
    }
    const palette = ['#6646b3','#bd622c','#2268ad','#aa3978','#65743d','#995429'];
    named.forEach((p,i) => {
      const pos=point(p.angle), lab=point(p.angle,149+(i%2)*8), colour=palette[i%palette.length];
      get('[data-fixed-points]').innerHTML += `<path d="M230 190L${XY(pos)}" stroke="${colour}" stroke-width="1" stroke-dasharray="4 4" opacity=".5"/><circle cx="${pos.x}" cy="${pos.y}" r="6" fill="${colour}" stroke="white" stroke-width="1.5"/><text x="${clamp(lab.x,15,465)}" y="${clamp(lab.y+5,18,371)}" text-anchor="middle" font-size="14" font-weight="600" fill="${colour}">${esc(p.label || String(i+1))}</text>`;
    });
    function unwrapping() {
      const u=norm(t), k=Math.floor((t-u)/TAU+.000000001), px=40+u/TAU*390;
      return `<p class="ml-caption">Разворачиваем один оборот в отрезок: <b>длина 2π</b>. Точка на отрезке и точка Q на окружности соответствуют друг другу.</p><svg class="ml-strip" viewBox="0 0 480 80" role="img" aria-label="Развёртка одного оборота окружности на числовой прямой"><path d="M40 30H430" stroke="#afc4cc" stroke-width="7" stroke-linecap="round"/><path d="M40 30H${px}" stroke="#007f77" stroke-width="7" stroke-linecap="round"/>${[0,1,2,3,4].map((i)=>`<path d="M${40+i*97.5} 23v14" stroke="#526d80"/><text x="${40+i*97.5}" y="63" text-anchor="middle" font-size="15" fill="#435f74">${['0','π/2','π','3π/2','2π'][i]}</text>`).join('')}<circle cx="${px}" cy="30" r="8" fill="#007f77" stroke="white" stroke-width="2"/></svg>${revealed?`<p class="ml-tip"><b>t = ${radians(t)}</b> = ${k} · 2π + ${radians(u)}. Здесь остаток выбран от 0 до 2π. Длина пройденного пути от A: |t| = ${radians(Math.abs(t))}; знак задаёт направление.</p>`:''}`;
    }
    function drawSlice() {
      const group=get('[data-slice-line]'), shade=get('[data-slice-shade]'), arcs=get('[data-slice-arc]');
      group.innerHTML=''; shade.innerHTML=''; arcs.innerHTML='';
      if(mode!=='slice')return '';
      const pos=axis==='x'?230+130*threshold:190-130*threshold;
      group.innerHTML = axis==='x'?`<path d="M${pos} 25V354" stroke="#8e52b8" stroke-dasharray="6 4" stroke-width="2"/>`:`<path d="M25 ${pos}H450" stroke="#8e52b8" stroke-dasharray="6 4" stroke-width="2"/>`;
      if(!revealed)return '<p>Поставьте Q на нужную сторону границы. Подумайте, входят ли точки равенства в ответ.</p>';
      const solution=sliceIntervals(axis,threshold,relation), greater=relation[0]==='>';
      if(axis==='x') shade.innerHTML=`<rect x="${greater?pos:22}" y="28" width="${Math.max(0,greater?454-pos:pos-22)}" height="320" fill="#b9e7d8" opacity=".45"/>`;
      else shade.innerHTML=`<rect x="22" y="${greater?28:pos}" width="432" height="${Math.max(0,greater?pos-28:348-pos)}" fill="#b9e7d8" opacity=".45"/>`;
      arcs.innerHTML = solution.intervals.map(([a,b])=>`<path d="${arc(a,b-a,130)}" stroke="#00836b" stroke-width="7" fill="none"/>`).join('') + solution.roots.map(a=>{const p=point(a);return `<circle cx="${p.x}" cy="${p.y}" r="6" fill="${solution.closed?'#00836b':'white'}" stroke="#00836b" stroke-width="2.5"/>`;}).join('');
      const v=values(t)[axis], yes=belongs(v,threshold,relation);
      return `<p><b>${axis} ${esc(relation.replace('>=','≥').replace('<=','≤'))} ${exact(threshold)}</b>: точка Q ${yes?'подходит':'не подходит'}. ${solution.closed?'Закрашенные границы включены: равенство допускается.':'Пустые границы исключены: неравенство строгое.'}</p>${solution.roots.length?`<p>Граница пересекает окружность при t = ${solution.roots.map(radians).join(' и ')} (в пределах одного оборота).</p>`:'<p>Граница не пересекает окружность. Проверьте, вся окружность подходит или ни одна точка.</p>'}`;
    }
    function drawFunctions(v) {
      const group=get('[data-function-lines]'); group.innerHTML='';
      if(mode!=='functions')return '';
      let drawing='<path d="M360 29V347" stroke="#7551a4" stroke-width="1.5" stroke-dasharray="5 4"/><path d="M25 60H453" stroke="#a76222" stroke-width="1.5" stroke-dasharray="5 4"/>';
      const notes=[];
      if(v.tan!==null){const ty=190-130*v.tan;drawing+=`<path d="M230 190L360 ${clamp(ty,-1e6,1e6)}" stroke="#7551a4" stroke-width="2"/><path d="M360 190V${clamp(ty,-1e6,1e6)}" stroke="#7551a4" stroke-width="4"/><circle cx="360" cy="${clamp(ty,-1e6,1e6)}" r="5" fill="#7551a4"/>`;if(ty<28||ty>348)notes.push('Пересечение с x = 1 находится за краем рисунка.');}
      else notes.push('tg t не определён: x = 0, прямая OP параллельна прямой x = 1.');
      if(v.cot!==null){const tx=230+130*v.cot;drawing+=`<path d="M230 190L${clamp(tx,-1e6,1e6)} 60" stroke="#a76222" stroke-width="2"/><path d="M230 60H${clamp(tx,-1e6,1e6)}" stroke="#a76222" stroke-width="4"/><circle cx="${clamp(tx,-1e6,1e6)}" cy="60" r="5" fill="#a76222"/>`;if(tx<22||tx>454)notes.push('Пересечение с y = 1 находится за краем рисунка.');}
      else notes.push('ctg t не определён: y = 0, прямая OP параллельна прямой y = 1.');
      group.innerHTML=drawing;
      return `<p class="ml-caption">Фиолетовая прямая — x = 1: высота пересечения с OP показывает tg t. Охристая — y = 1: горизонтальная координата пересечения показывает ctg t. Продлеваем именно прямую OQ в обе стороны.</p>${revealed?notes.map(s=>`<p>${s}</p>`).join(''):''}`;
    }
    function render(syncInput=true) {
      if(dead)return;
      const v=values(t),p=point(t),remainder=t%TAU;
      if(syncInput)input.value=radiansInput(t);
      get('[data-angle-precision]').hidden = !radiansInput(t).includes(',');
      range.value=String(v.normalized); range.setAttribute('aria-valuetext',revealed?radians(v.normalized)+' радиан':'Положение точки на окружности');
      attrs(get('[data-current-point]'),{cx:p.x,cy:p.y});attrs(get('[data-current-label]'),{x:point(t,108).x,y:point(t,108).y+5});
      attrs(get('[data-radius]'),{x2:p.x,y2:p.y});attrs(get('[data-x-segment]'),{x2:p.x,visibility:showProjections?'visible':'hidden'});attrs(get('[data-y-segment]'),{y2:p.y,visibility:showProjections?'visible':'hidden'});
      attrs(get('[data-projections]'),{d:`M${p.x} 190V${p.y}H230`,visibility:showProjections?'visible':'hidden'});
      let directed=remainder;if(Math.abs(directed)<EPS&&Math.abs(t)>EPS)directed=t>0?TAU:-TAU;
      get('[data-angle-arc]').setAttribute('d',arc(0,directed,43));
      const sliceText=drawSlice(),functionText=drawFunctions(v);
      get('[data-unwrapping]').innerHTML=(mode==='arc'||mode==='angle')?unwrapping():'';
      let reading = revealed?`<div class="ml-reading-grid"><div class="ml-value"><b>t = ${radians(t)} рад</b><br>${exact(t/Math.PI*180)}°; ${t<0?'по часовой стрелке':t>0?'против часовой стрелки':'начальная точка A'}</div><div class="ml-value">Конечное положение:<br><b>${radians(v.normalized)} рад</b><br>${v.x===0||v.y===0?'Q лежит на оси':`${v.x>0?(v.y>0?'I':'IV'):(v.y>0?'II':'III')} четверть`}</div></div>`:'<p><b>Показания скрыты для самостоятельной работы.</b> Перемещайте Q и рассуждайте по рисунку; для проверки используйте поля задания.</p>';
      if(revealed&&showProjections) reading+=`<div class="ml-reading-grid" style="margin-top:.65rem"><div class="ml-value ml-x"><b>${mode==='functions'?'cos t = ':''}x ${exact(v.x).startsWith('≈')?'':'= '}${exact(v.x)}</b><br>Горизонтальная проекция</div><div class="ml-value ml-y"><b>${mode==='functions'?'sin t = ':''}y ${exact(v.y).startsWith('≈')?'':'= '}${exact(v.y)}</b><br>Вертикальная проекция</div></div>`;
      if(mode==='functions'&&revealed)reading+=`<p><b>tg t = y/x</b>: ${v.tan===null?'не определён (деление на ноль)':exact(v.tan)}.<br><b>ctg t = x/y</b>: ${v.cot===null?'не определён (деление на ноль)':exact(v.cot)}.</p>`;
      reading+=sliceText+functionText;
      if(named.length && revealed)reading+=`<table class="ml-table"><thead><tr><th>Точка</th><th>t</th>${showProjections?'<th>x</th><th>y</th>':''}</tr></thead><tbody>${named.map(p=>{const w=values(p.angle);return `<tr><th>${esc(p.label||'Точка')}</th><td>${radians(p.angle)}</td>${showProjections?`<td>${exact(w.x)}</td><td>${exact(w.y)}</td>`:''}</tr>`;}).join('')}</tbody></table>`;
      get('[data-lab-readings]').innerHTML=reading;
      get('desc').textContent = revealed?`Точка Q: t ${radians(t)} радиан${showProjections?`, x ${exact(v.x)}, y ${exact(v.y)}`:''}. Стрелки меняют угол, Home возвращает в A.`:'Точка Q на единичной окружности. Значения скрыты. Стрелки меняют угол, Home возвращает в A. Можно ввести угол под рисунком.';
    }
    function update(value, syncInput=true) {
      if(!Number.isFinite(value)||Math.abs(value)>LIMIT){get('[data-lab-error]').textContent='Введите конечное число от −1000π до 1000π радиан.';return false;}
      t=clean(value);get('[data-lab-error]').textContent='';render(syncInput);
      if(typeof options.onChange==='function')options.onChange(t);
      return true;
    }
    function parse(text) { return root.ProfileCheck&&typeof root.ProfileCheck.number==='function'?root.ProfileCheck.number(text):Number(String(text).replace(',','.')); }
    function applyAngle(){const value=input.value.trim();if(!value){get('[data-lab-error]').textContent='Введите число: например, π/3, −5π/2 или 1,5.';return;}if(value===radiansInput(t)){get('[data-lab-error]').textContent='';return;}update(parse(value.replace(/(\d|\))\s*(?=π|pi\b)/g,'$1*')));}
    on(get('[data-apply-angle]'),'click',applyAngle);on(input,'change',applyAngle);on(input,'keydown',event=>{if(event.key==='Enter'){event.preventDefault();applyAngle();}});
    function motion(value){return update(clamp(snapAngle(value,snapDenominator),-LIMIT,LIMIT));}
    range.step=String(Math.PI/12);
    on(get('[data-angle-snap]'),'change',()=>{snapDenominator=Number(get('[data-angle-snap]').value);range.step=String(snapDenominator?Math.PI/snapDenominator:Math.PI/180);container.querySelectorAll('[data-delta]').forEach(b=>{if(Math.abs(Number(b.dataset.delta))<TAU){const delta=Math.sign(Number(b.dataset.delta))*Math.PI/(snapDenominator||12);b.dataset.delta=String(delta);b.textContent=(delta>0?'+':'')+radiansInput(delta);}});if(snapDenominator)motion(t);});
    on(range,'input',()=>{const u=norm(t),turns=Math.round((t-u)/TAU);motion(turns*TAU+Number(range.value));});
    container.querySelectorAll('[data-delta]').forEach(b=>on(b,'click',()=>{const delta=Number(b.dataset.delta);if(Math.abs(delta)===TAU)update(clamp(t+delta,-LIMIT,LIMIT));else motion(t+delta);}));
    on(get('[data-zero]'),'click',()=>update(0));
    on(get('[data-reveal-readings]'),'click',()=>{if(revealed)return;revealed=true;if(typeof options.onHelp==='function')options.onHelp();if(dead)return;get('[data-reveal-readings]').hidden=true;get('[data-help-note]').textContent='Значения открыты: эта попытка выполняется с помощью.';render(false);});
    function applySlice(){const n=parse(get('[data-threshold]').value);if(!Number.isFinite(n)||Math.abs(n)>2){get('[data-lab-error]').textContent='Введите границу от −2 до 2. Координаты окружности лежат от −1 до 1.';return;}threshold=n;axis=get('[data-axis]').value;relation=get('[data-relation]').value;get('[data-lab-error]').textContent='';render(false);}
    on(get('[data-apply-slice]'),'click',applySlice);on(get('[data-axis]'),'change',applySlice);on(get('[data-relation]'),'change',applySlice);on(get('[data-threshold]'),'keydown',event=>{if(event.key==='Enter'){event.preventDefault();applySlice();}});
    on(svg,'keydown',event=>{const key={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[event.key];if(key){event.preventDefault();motion(t+key*Math.PI/(snapDenominator||(event.shiftKey?12:180)));}else if(event.key==='Home'){event.preventDefault();update(0);}});
    function pointerAngle(event){const matrix=svg.getScreenCTM();if(!matrix)return;const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;const q=p.matrixTransform(matrix.inverse());if(Math.hypot(q.x-230,q.y-190)<20)return;const a=Math.atan2(190-q.y,q.x-230);let delta=a-norm(t);while(delta>Math.PI)delta-=TAU;while(delta< -Math.PI)delta+=TAU;motion(t+delta);}
    on(svg,'pointerdown',event=>{if(event.button!==0)return;dragging=true;pointer=event.pointerId;svg.setPointerCapture(pointer);pointerAngle(event);});
    on(svg,'pointermove',event=>{if(dragging&&event.pointerId===pointer)pointerAngle(event);});
    function release(event){if(event&&event.pointerId!==pointer)return;dragging=false;if(pointer!==null&&svg.hasPointerCapture(pointer))svg.releasePointerCapture(pointer);pointer=null;}
    on(svg,'pointerup',release);on(svg,'pointercancel',release);on(svg,'lostpointercapture',()=>{dragging=false;pointer=null;});
    render();
    return {getAngle:()=>t,destroy(){dead=true;release();subscriptions.forEach(fn=>fn());}};
  }
  root.MordLab={mount,math:helpers};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.MordLab;
})(typeof globalThis!=='undefined'?globalThis:window);
