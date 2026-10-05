/* Authored school diagrams: deterministic progress for the reader and MP4.
   Every label is text, every arrow refers to a token in a fixed lesson. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const colors = { letter: '#2159c9', number: '#ae4a13', plain: '#19313d' };
  const clamp = n => Math.max(0, Math.min(1, Number(n) || 0));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  function node(tag, attrs = {}, text) {
    const el = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function weight(text) { return Array.from(String(text)).reduce((sum, c) => sum + (/\s/.test(c) ? .3 : /[il1·:]/.test(c) ? .4 : .64), 0) + .55; }
  function positions(tokens, font, y) {
    const widths = tokens.map(t => weight(t.text) * font);
    const eq = tokens.findIndex(t => t.text.trim() === '=');
    let left = (640 - widths.reduce((a, b) => a + b, 0)) / 2;
    if (eq >= 0) left = 320 - widths[eq] / 2 - widths.slice(0, eq).reduce((a, b) => a + b, 0);
    return tokens.map((token, i) => { const p = { x: left + widths[i] / 2, y, token }; left += widths[i]; return p; });
  }
  function fit(tokens) {
    const eq = tokens.findIndex(t => t.text.trim() === '=');
    if (eq < 0) return 588 / tokens.reduce((n, t) => n + weight(t.text), 0);
    return Math.min(284 / tokens.slice(0, eq).reduce((n, t) => n + weight(t.text), .5),
      284 / tokens.slice(eq + 1).reduce((n, t) => n + weight(t.text), .5));
  }
  function token(svg, p, font, extra = {}) {
    const el = node('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'middle',
      fill: colors[p.token.tone] || colors.plain, 'font-size': font, 'font-weight': 750, ...extra }, p.token.text);
    svg.append(el); return el;
  }
  function pointAt(a, b, t) {
    const cy = 103, u = 1 - t;
    return { x: u * u * a.x + 2 * u * t * ((a.x + b.x) / 2) + t * t * b.x,
      y: u * u * a.y + 2 * u * t * cy + t * t * b.y };
  }
  function arrows(host, spec) {
    if (!Array.isArray(spec.before) || !Array.isArray(spec.after)) throw new Error('Motion needs authored token rows');
    const svg = node('svg', { viewBox: '0 0 640 230', class: 'motion-diagram', role: 'img', 'aria-label': spec.caption || 'Преобразование по шагам' });
    const font = Math.min(39, fit(spec.before), fit(spec.after));
    const before = positions(spec.before, font, 46), after = positions(spec.after, font, 179);
    const defs = node('defs'), marker = node('marker', { id: 'motion-arrowhead', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' });
    marker.append(node('path', { d: 'M 1 1 L 9 5 L 1 9', fill: 'none', stroke: 'context-stroke', 'stroke-width': 1.8 }));
    defs.append(marker); svg.append(defs);
    before.forEach(p => token(svg, p, font, { class: 'motion-source' }));
    const result = node('g', { class: 'motion-result' });
    after.forEach(p => token(result, p, font)); svg.append(result);
    const lines = (spec.arrows || []).map((edge, i) => {
      const a = before[edge.from], b = after[edge.to];
      if (!a || !b) throw new Error('Motion arrow points outside token rows');
      const tone = colors[a.token.tone] || '#237d68';
      const line = node('path', { d: `M ${a.x} 70 Q ${(a.x + b.x) / 2} ${98 + (i % 2) * 30} ${b.x} 152`,
        fill: 'none', stroke: tone, 'stroke-width': 3, 'marker-end': 'url(#motion-arrowhead)', class: 'motion-arrow' });
      svg.append(line); return line;
    });
    const moves = (spec.moves || []).map(edge => {
      const a = before[edge.from], b = after[edge.to];
      if (!a || !b) throw new Error('Motion transfer points outside token rows');
      const group = node('g', { class: 'motion-travel' });
      const width = Math.max(weight(a.token.text), weight(b.token.text)) * font + 12;
      group.append(node('rect', { x: -width / 2, y: -font * .64, width, height: font * 1.28, rx: 9, fill: '#fff', stroke: colors[a.token.tone] || colors.plain, 'stroke-width': 1.5 }));
      const label = node('text', { 'text-anchor': 'middle', 'dominant-baseline': 'middle', 'font-size': font, 'font-weight': 800, fill: colors[a.token.tone] || colors.plain }, a.token.text);
      group.append(label); svg.append(group); return { a, b, group, label };
    });
    host.append(svg);
    const caption = document.createElement('p'); caption.className = 'motion-caption'; caption.textContent = spec.caption || ''; host.append(caption);
    return value => {
      const p = clamp(value), travel = smooth((p - .12) / .7);
      result.style.opacity = String(smooth((p - .78) / .22));
      lines.forEach((line, i) => {
        const length = line.getTotalLength();
        const q = smooth((p - i * .09) / .6);
        line.style.strokeDasharray = String(length); line.style.strokeDashoffset = String(length * (1 - q)); line.style.opacity = p === 0 ? '0' : '1';
      });
      moves.forEach(({ a, b, group, label }) => {
        const xy = pointAt(a, b, travel);
        group.setAttribute('transform', `translate(${xy.x} ${xy.y})`);
        // Sign belongs to the whole summand; change it on crossing equality.
        const crossed = (a.x < 320 && b.x > 320) ? xy.x >= 320 : (a.x > 320 && b.x < 320) ? xy.x <= 320 : travel >= .5;
        label.textContent = crossed ? b.token.text : a.token.text;
        group.style.opacity = p >= .98 || p <= .02 ? '0' : '1';
      });
      svg.dataset.progress = String(p);
    };
  }
  function numberline(host, spec) {
    const svg = node('svg', { viewBox: '0 0 640 230', class: 'motion-diagram', role: 'img', 'aria-label': `От ${spec.start} перемещаемся на ${spec.delta}; получаем ${spec.end}` });
    const min = Number(spec.min), max = Number(spec.max), x = n => 38 + (n - min) / (max - min) * 564;
    if (![min, max, spec.start, spec.delta, spec.end].every(Number.isFinite) || max <= min || spec.start + spec.delta !== spec.end) throw new Error('Invalid authored number line');
    svg.append(node('line', { x1: 30, y1: 146, x2: 610, y2: 146, stroke: '#667b88', 'stroke-width': 2 }));
    const step = Math.max(1, Math.ceil((max - min) / 16));
    const ticks = new Set([spec.start, spec.end, 0]); for (let n = min; n <= max; n += step) ticks.add(n);
    [...ticks].filter(n => n >= min && n <= max).sort((a, b) => a - b).forEach(n => {
      svg.append(node('line', { x1: x(n), y1: 140, x2: x(n), y2: 152, stroke: '#667b88', 'stroke-width': 2 }));
      svg.append(node('text', { x: x(n), y: 180, 'text-anchor': 'middle', 'font-size': 22, fill: '#19313d' }, n));
    });
    const path = node('path', { d: `M ${x(spec.start)} 133 Q ${(x(spec.start) + x(spec.end)) / 2} 20 ${x(spec.end)} 133`, fill: 'none', stroke: '#2159c9', 'stroke-width': 4, class: 'motion-arrow' });
    const dot = node('circle', { cx: x(spec.start), cy: 133, r: 8, fill: '#2159c9', class: 'motion-travel' });
    svg.append(path, dot, node('text', { x: 320, y: 29, 'text-anchor': 'middle', 'font-size': 28, fill: '#2159c9', 'font-weight': 750 }, `${spec.delta > 0 ? '+' : '−'}${Math.abs(spec.delta)}: ${spec.delta >= 0 ? 'вправо' : 'влево'}`));
    host.append(svg);
    return value => { const p = smooth(value), length = path.getTotalLength(), point = path.getPointAtLength(length * p);
      path.style.strokeDasharray = String(length); path.style.strokeDashoffset = String(length * (1 - p));
      dot.setAttribute('cx', point.x); dot.setAttribute('cy', point.y); svg.dataset.progress = String(clamp(value)); };
  }
  function construction(host, spec) {
    const svg = node('svg', {viewBox:'0 0 640 230', class:'motion-diagram',role:'img','aria-label':spec.caption});
    const strokes=[], labels=[];
    const line=(x1,y1,x2,y2,color='#234b67',width=3)=>{const el=node('line',{x1,y1,x2,y2,stroke:color,'stroke-width':width,'stroke-linecap':'round'});strokes.push(el);svg.append(el);};
    const label=(x,y,text,color='#19313d')=>{const el=node('text',{x,y,'text-anchor':'middle','font-size':24,'font-weight':700,fill:color,class:text.length>12?'construction-note':'construction-label'},text);labels.push(el);svg.append(el);};
    const dot=(x,y)=>{const el=node('circle',{cx:x,cy:y,r:3.5,fill:'#234b67'});labels.push(el);svg.append(el);};
    if(spec.kind==='segment'){
      if(!Array.isArray(spec.parts)||spec.parts.length!==2||!spec.parts.every(x=>Number.isFinite(x)&&x>0))throw new Error('Invalid segment construction');
      const total=spec.parts[0]+spec.parts[1], points=[64,64+512*spec.parts[0]/total,576], y=107;
      line(points[0],y,points[1],y,'#2159c9',5);line(points[1],y,points[2],y,'#b05e23',5);
      points.forEach((x,i)=>{dot(x,y);label(x,y+38,spec.labels[i]);});
      if(spec.ticks){for(let i=0;i<2;i++){const x=(points[i]+points[i+1])/2;line(x-5,y-9,x+5,y+9,'#237d68');}}
      label(320,194,spec.ticks?'Одинаковые штрихи — равные части':'Внутренняя точка делит отрезок на части');
    }else if(spec.kind==='angles'){
      if(!Array.isArray(spec.angles)||spec.angles.length!==2||!spec.angles.every(x=>Number.isFinite(x)&&x>0)||spec.angles[0]+spec.angles[1]>180)throw new Error('Invalid angle construction');
      const ox=305,oy=195,r=165, rad=d=>d*Math.PI/180, at=(d,length)=>({x:ox+Math.cos(rad(d))*length,y:oy-Math.sin(rad(d))*length});
      const ends=[0,spec.angles[0],spec.angles[0]+spec.angles[1]];
      // Draw the boundary rays first, then the ray inside. A ray is shown as
      // a finite part without arrowheads, consistently with course diagrams.
      for(const i of [0,2,1]){const p=at(ends[i],r);line(ox,oy,p.x,p.y,i===1?'#237d68':'#234b67');}
      dot(ox,oy);label(ox-12,oy+28,'O');
      ends.forEach((d,i)=>{const p=at(d,r+20);label(p.x,Math.max(28,p.y)+(d===0||d===180?8:0),spec.labels[i]);});
      for(let i=0;i<2;i++){
        const radius=spec.equal?52:42+i*15,start=ends[i],end=ends[i+1],a=at(start,radius),b=at(end,radius);
        const arc=node('path',{d:`M ${a.x} ${a.y} A ${radius} ${radius} 0 0 0 ${b.x} ${b.y}`,fill:'none',stroke:i===0?'#2159c9':'#b05e23','stroke-width':3});strokes.push(arc);svg.append(arc);
        if(spec.equal){const mid=(start+end)/2,a=at(mid,radius-5),b=at(mid,radius+5);line(a.x,a.y,b.x,b.y,'#237d68',2);}
      }
    }else throw new Error('Unknown authored construction');
    host.append(svg);const caption=document.createElement('p');caption.className='motion-caption';caption.textContent=spec.caption;host.append(caption);
    return value=>{const p=clamp(value);strokes.forEach((stroke,i)=>{const length=stroke.getTotalLength(),q=smooth((p-i*.065)/.43);stroke.style.strokeDasharray=String(length);stroke.style.strokeDashoffset=String(length*(1-q));});labels.forEach(label=>{label.style.opacity=String(smooth((p-.55)/.35));});svg.dataset.progress=String(p);};
  }
  function geometry(condition) {
    const svg = condition.querySelector('svg.diagram');
    if (!svg) throw new Error('Geometry animation needs its authored drawing');
    svg.classList.add('motion-diagram');
    const strokes = [...svg.querySelectorAll('line,path')], labels = [...svg.querySelectorAll('text,circle')];
    return value => { const p = clamp(value); strokes.forEach((stroke, i) => {
      const length = stroke.getTotalLength(), q = smooth((p - i * .1) / .45);
      stroke.style.strokeDasharray = String(length); stroke.style.strokeDashoffset = String(length * (1 - q));
    }); labels.forEach(label => { label.style.opacity = String(smooth((p - .45) / .4)); }); svg.dataset.progress = String(p); };
  }
  window.MathExamMotion = Object.freeze({ mount(host, spec, condition) {
    host.replaceChildren();
    const seek = !spec ? () => {} : spec.type === 'geometry' ? geometry(condition) : spec.type === 'numberline' ? numberline(host, spec) : spec.type === 'construction' ? construction(host, spec) : arrows(host, spec);
    seek(1); return seek;
  } });
})();
