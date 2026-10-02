(function (root) {
  'use strict';
  const models = {};
  let sequence = 0;
  const clean = n => Math.abs(n) < 1e-10 ? 0 : n;
  const fmt = n => clean(n).toFixed(3).replace(/\.?0+$/, '').replace('.', ',');
  const norm = d => ((d % 360) + 360) % 360;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const radText = d => {
    let n = Math.round(d * 10), den = 1800, a = Math.abs(n), b = den;
    if (!n) return '0';
    while (b) { const r = a % b; a = b; b = r; }
    n /= a; den /= a;
    return (n === 1 ? '' : n === -1 ? '−' : n) + 'π' + (den === 1 ? '' : '/' + den);
  };
  function lifecycle() {
    const subscriptions = [];
    return { on(el, name, fn, options) { el.addEventListener(name, fn, options); subscriptions.push(() => el.removeEventListener(name, fn, options)); }, cleanup() { subscriptions.forEach(fn => fn()); } };
  }
  const circleOptions = {
    'angle-circle': {
      title: 'Один луч — разные повороты', goal: 'Установите угол −300°. Убедитесь, что конечный луч совпадает с 60°, а запись в радианах сохраняет отрицательный поворот.',
      test: d => Math.abs(d + 300) < 0.05,
      success: 'Получилось: −300° и 60° заканчиваются на одном луче, но −300° = −5π/3 рад.',
      retry: 'Нужен именно поворот −300°, а не только совпадающий с ним луч. Введите отрицательное число или используйте кнопки.'
    },
    'unit-circle': {
      title: 'Постройте точку по условиям', goal: 'Поместите точку во II четверть так, чтобы sin α > 0,5 и cos α < −0,5. Следите за обеими проекциями.',
      test: (d, s, c) => s > 0.5 && c < -0.5,
      success: 'Обе координаты подходят: точка выше оси x и левее x = −0,5.',
      retry: 'Во II четверти y положителен, x отрицателен. Подберите положение, где обе координаты по модулю больше 0,5.'
    },
    'symmetry-circle': {
      title: 'Отражение сохраняет высоту', goal: 'Серая точка задаёт угол 40°. Постройте её отражение относительно вертикальной оси: высота та же, горизонтальная координата противоположна.', reference: 40,
      test: d => Math.abs(norm(d) - 140) < 0.05,
      success: 'Отражение найдено: 140° = 180° − 40°. Синусы равны, косинусы противоположны.',
      retry: 'Ищите точку на той же высоте слева от вертикальной оси. Угол вместе с 40° должен дать 180°.'
    },
    'tangent-circle': {
      title: 'Где пропадает тангенс', goal: 'Сначала исследуйте 89°, затем установите 90° и проверьте цель. Следите за cos α: в граничном положении знаменатель должен стать нулём.', tangent: true,
      test: (d, s, c) => Math.abs(norm(d) - 90) < 0.05 && c === 0,
      success: 'cos 90° = 0: деление на ноль невозможно. Тангенс не определён; это не числовое значение «бесконечность».',
      retry: 'При 89° знаменатель ещё не равен нулю. Установите ровно 90° и прочитайте строку тангенса.'
    },
    'cosine-circle': {
      title: 'Четверть выбирает знак корня', goal: 'Постройте точку в III четверти. Проследите, что квадраты sin и cos положительны, но сами sin и cos отрицательны.', squares: true,
      test: (d, s, c) => s < 0 && c < 0,
      success: 'Точка в III четверти: обе координаты отрицательны. Квадраты теряют знак; для косинуса здесь выбираем отрицательный корень.',
      retry: 'III четверть находится слева внизу. Точка на оси не относится ни к одной четверти.'
    },
    'double-angle-circle': {
      title: 'Свяжите угол и двойной угол', goal: 'Постройте острый угол α так, чтобы синяя точка двойного угла 2α оказалась на 64°. Сравните sin 2α и 2 sin α cos α.', double: true,
      test: d => Math.abs(d - 32) < 0.05,
      success: 'α = 32°, поэтому 2α = 64°. Вертикальная координата синей точки совпадает с 2 sin α cos α.',
      retry: 'Нужно удвоить α и получить 64°. Угол α должен быть острым, без полного оборота.'
    }
  };
  function circleFactory(kind) {
    return function (container) {
      const config = circleOptions[kind], life = lifecycle(), id = `profile-circle-${++sequence}`;
      let degrees = 20, dragging = false, activePointer = null, goalChecked = false;
      container.innerHTML = `<div class="circle-lab">
        <h3>${config.title}</h3>
        <p>Это лаборатория: её значения не связаны с ответами практики. Перетащите точку P или измените угол с клавиатуры.</p>
        <svg class="lab-svg" viewBox="0 0 520 370" style="display:block;width:100%;max-width:640px;height:auto;touch-action:none" role="img" tabindex="0" aria-labelledby="${id}-title ${id}-desc">
          <title id="${id}-title">Единичная окружность и проекции точки</title><desc id="${id}-desc">Стрелки клавиатуры меняют угол на один градус. Home возвращает к нулю. Точка P доступна для перетаскивания.</desc>
          <defs><clipPath id="${id}-clip"><rect x="4" y="5" width="512" height="355"/></clipPath></defs>
          <rect x="4" y="5" width="512" height="355" rx="16" fill="#f3f7fb"/>
          <path d="M220 60A125 125 0 0 0 95 185L220 185Z" fill="#ebeafb"/>
          <path d="M220 310A125 125 0 0 0 345 185L220 185Z" fill="#e9f2fa"/>
          <g fill="#606f83" font-size="14"><text x="287" y="117">I</text><text x="143" y="117">II</text><text x="140" y="265">III</text><text x="284" y="265">IV</text></g>
          <circle cx="220" cy="185" r="125" fill="none" stroke="#94a3b8" stroke-width="2"/>
          <path d="M40 185H398M220 337V28" stroke="#526075" stroke-width="1.5"/>
          <path d="M398 185l-8 -4v8zM220 28l-4 8h8z" fill="#526075"/>
          <g fill="#30445c" font-size="14"><text x="405" y="190">x = cos α</text><text x="233" y="31">y = sin α</text><text x="207" y="205">0</text><text x="345" y="205">1</text><text x="83" y="205">−1</text><text x="204" y="57">1</text><text x="198" y="327">−1</text></g>
          <g data-reference></g>
          <g data-tangent clip-path="url(#${id}-clip)"></g>
          <path data-arc fill="none" stroke="#9f5800" stroke-width="2"/>
          <line data-radius x1="220" y1="185" stroke="#334155" stroke-width="2"/>
          <line data-cos x1="220" y1="185" y2="185" stroke="#0369a1" stroke-width="6"/>
          <line data-sin x1="220" y1="185" x2="220" stroke="#b51b61" stroke-width="6"/>
          <path data-guides fill="none" stroke="#66768d" stroke-dasharray="5 4"/>
          <g data-double></g>
          <circle data-point r="12" fill="#137f70" stroke="#fff" stroke-width="3" style="cursor:grab"/>
          <text data-label fill="#0b5d53" font-size="15" font-weight="700">P</text>
        </svg>
        <div class="lab-controls" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">
          <label for="${id}-number">Угол α, градусы <input id="${id}-number" data-angle-number type="number" min="-3600" max="3600" step="1" value="20" style="width:110px"></label>
          <label for="${id}-range" style="flex:1;min-width:160px">Поворот <input id="${id}-range" data-angle-range type="range" min="-720" max="720" step="1" value="20" style="width:100%"></label>
        </div>
        <div class="lab-controls" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:10px">
          <button type="button" data-delta="-360">−360°</button><button type="button" data-delta="-15">−15°</button><button type="button" data-delta="15">+15°</button><button type="button" data-delta="360">+360°</button><button type="button" data-reset>Начать с 0°</button>
        </div>
        <p data-input-error role="status"></p>
        <div class="lab-readout" data-readout aria-live="off" style="padding:12px;background:#eef5f8;border-radius:12px"></div>
        <p><b>Цель:</b> ${config.goal}</p><button type="button" data-check>Проверить построение</button>
        <p class="lab-feedback" data-feedback role="status" aria-live="polite">Измените угол и проверьте свою конструкцию.</p>
      </div>`;
      const get = s => container.querySelector(s), svg = get('svg'), number = get('[data-angle-number]'), range = get('[data-angle-range]'), feedback = get('[data-feedback]');
      const setAttrs = (el, attrs) => Object.entries(attrs).forEach(([key,value]) => el.setAttribute(key,value));
      const point = a => ({x:220+125*Math.cos(a*Math.PI/180),y:185-125*Math.sin(a*Math.PI/180)});
      if (config.reference !== undefined) {
        const ref=point(config.reference);
        get('[data-reference]').innerHTML=`<path d="M220 185L${ref.x} ${ref.y}" stroke="#768397" stroke-dasharray="5 4"/><path d="M95 ${ref.y}H345" stroke="#aeb9c9" stroke-dasharray="4 4"/><circle cx="${ref.x}" cy="${ref.y}" r="7" fill="#768397"/><text x="${ref.x+10}" y="${ref.y+10}" fill="#4c5b71" font-size="14">40°</text>`;
      }
      function render() {
        const radians=degrees*Math.PI/180,s=clean(Math.sin(radians)),c=clean(Math.cos(radians)),p=point(degrees),tan=c===0?null:s/c;
        number.value=String(degrees); range.value=String(clamp(degrees,-720,720));
        setAttrs(get('[data-point]'),{cx:p.x,cy:p.y}); setAttrs(get('[data-label]'),{x:clamp(p.x+15,50,360),y:clamp(p.y-10,46,335)});
        setAttrs(get('[data-radius]'),{x2:p.x,y2:p.y});setAttrs(get('[data-cos]'),{x2:p.x});setAttrs(get('[data-sin]'),{y2:p.y});
        get('[data-guides]').setAttribute('d',`M${p.x} 185V${p.y}H220`);
        const rem=degrees%360,arc=point(degrees),ex=220+(arc.x-220)*0.3,ey=185+(arc.y-185)*0.3;
        get('[data-arc]').setAttribute('d',Math.abs(rem)<0.01?'':`M257.5 185A37.5 37.5 0 ${Math.abs(rem)>180?1:0} ${rem<0?1:0} ${ex} ${ey}`);
        const quadrant=s===0||c===0?'на оси':`${c>0?(s>0?'I':'IV'):(s>0?'II':'III')} четверть`;
        const sign=n=>n>0?'положительный':n<0?'отрицательный':'ноль';
        const turns=Math.floor(Math.abs(degrees)/360);
        let text=`<b>α = ${fmt(degrees)}° = ${radText(degrees)} рад</b><br>Полных оборотов: ${turns}; направление ${degrees<0?'по часовой стрелке':degrees>0?'против часовой стрелки':'не задано (нулевой угол)'}. Конечный луч: ${fmt(norm(degrees))}°; ${quadrant}.<br><span style="color:#0369a1"><b>cos α ≈ ${fmt(c)}</b> — x, ${sign(c)}</span><br><span style="color:#a11756"><b>sin α ≈ ${fmt(s)}</b> — y, ${sign(s)}</span><br><b>tg α ${tan===null?'не определён: cos α = 0':'≈ '+fmt(tan)}</b>`;
        if (config.squares) text+=`<br>sin² α ≈ ${fmt(s*s)}; cos² α ≈ ${fmt(c*c)}; сумма = 1. |cos α| ≈ ${fmt(Math.abs(c))}.`;
        if (config.reference!==undefined) text+=`<br>Для серой точки: sin 40° ≈ ${fmt(Math.sin(40*Math.PI/180))}; cos 40° ≈ ${fmt(Math.cos(40*Math.PI/180))}.`;
        if (config.double) {
          const q=point(degrees*2);
          get('[data-double]').innerHTML=`<line x1="220" y1="185" x2="${q.x}" y2="${q.y}" stroke="#1d4ed8" stroke-width="2" stroke-dasharray="6 3"/><circle cx="${q.x}" cy="${q.y}" r="7" fill="#1d4ed8"/><text x="${clamp(q.x+12,55,355)}" y="${clamp(q.y+20,50,335)}" fill="#1d4ed8" font-size="14">2α</text>`;
          text+=`<br>2α = ${fmt(2*degrees)}°; sin 2α ≈ ${fmt(Math.sin(2*radians))}; 2 sin α cos α ≈ ${fmt(2*s*c)}.`;
        }
        if (config.tangent) {
          let drawing='<line x1="345" y1="15" x2="345" y2="352" stroke="#8b5cf6" stroke-width="2" stroke-dasharray="4 4"/>';
          if (tan!==null) {
            const ty=185-125*tan;
            drawing+=`<line x1="220" y1="185" x2="345" y2="${ty}" stroke="#7e22ce" stroke-width="2"/><circle cx="345" cy="${ty}" r="6" fill="#7e22ce"/>`;
            text+=Math.abs(tan)>1.3?'<br>Пересечение с прямой x = 1 сейчас за пределами рисунка.':'<br>Высота пересечения прямой OP с прямой x = 1 равна tg α.';
          } else text+='<br>Луч параллелен прямой x = 1: точки пересечения нет.';
          get('[data-tangent]').innerHTML=drawing;
        }
        get('[data-readout]').innerHTML=text;
        get('desc').textContent=`Угол ${fmt(degrees)} градусов. Косинус ${fmt(c)}, синус ${fmt(s)}. ${quadrant}. Стрелки меняют угол на один градус, Home задаёт ноль.`;
        if (goalChecked) { goalChecked=false; feedback.textContent='Конструкция изменена. Проверьте цель ещё раз.';delete feedback.dataset.correct; }
      }
      function setDegree(value) {
        if (!Number.isFinite(value)||value < -3600||value > 3600) { get('[data-input-error]').textContent='Введите угол от −3600° до 3600°.';return; }
        degrees=Math.round(value*10)/10;get('[data-input-error]').textContent='';render();
      }
      life.on(number,'input',()=>{ if(number.value.trim()===''){get('[data-input-error]').textContent='Введите угол в градусах.';return;}setDegree(Number(number.value)); });
      life.on(range,'input',()=>setDegree(Number(range.value)));
      container.querySelectorAll('[data-delta]').forEach(button=>life.on(button,'click',()=>setDegree(clamp(degrees+Number(button.dataset.delta),-3600,3600))));
      life.on(get('[data-reset]'),'click',()=>setDegree(0));
      life.on(svg,'keydown',event=>{
        const delta={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1,PageUp:15,PageDown:-15}[event.key];
        if(delta!==undefined){event.preventDefault();setDegree(clamp(degrees+delta,-3600,3600));}
        if(event.key==='Home'){event.preventDefault();setDegree(0);}
      });
      function fromPointer(event) {
        const matrix=svg.getScreenCTM();if(!matrix)return;
        const pt=svg.createSVGPoint();pt.x=event.clientX;pt.y=event.clientY;
        const pos=pt.matrixTransform(matrix.inverse());
        if(Math.hypot(pos.x-220,pos.y-185)<12)return;
        const angle=Math.atan2(185-pos.y,pos.x-220)*180/Math.PI;
        let delta=angle-norm(degrees);while(delta>180)delta-=360;while(delta<-180)delta+=360;
        setDegree(clamp(Math.round(degrees+delta),-3600,3600));
      }
      life.on(svg,'pointerdown',event=>{if(event.button!==0)return;dragging=true;activePointer=event.pointerId;svg.setPointerCapture(event.pointerId);fromPointer(event);});
      life.on(svg,'pointermove',event=>{if(dragging&&event.pointerId===activePointer)fromPointer(event);});
      function endDrag(event){if(event.pointerId!==activePointer)return;dragging=false;if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);activePointer=null;}
      life.on(svg,'pointerup',endDrag);life.on(svg,'pointercancel',endDrag);life.on(svg,'lostpointercapture',()=>{dragging=false;activePointer=null;});
      life.on(get('[data-check]'),'click',()=>{
        const s=clean(Math.sin(degrees*Math.PI/180)),c=clean(Math.cos(degrees*Math.PI/180));
        const passed=config.test(degrees,s,c);feedback.textContent=passed?config.success:config.retry;feedback.dataset.correct=String(passed);goalChecked=true;
      });
      render();return()=>{life.cleanup();if(activePointer!==null&&svg.hasPointerCapture(activePointer))svg.releasePointerCapture(activePointer);};
    };
  }
  Object.keys(circleOptions).forEach(id=>{models[id]=circleFactory(id);});

  models['power-log'] = function (container) {
    const life=lifecycle(),id=`profile-power-${++sequence}`;
    let base=2,exponent=1,checked=false;
    container.innerHTML=`<div class="power-log-lab"><h3>Степень и логарифм читают одну пару чисел</h3>
      <p>Значения лаборатории отдельны от практики. Измените основание и показатель; точка степени и точка логарифма поменяются координатами.</p>
      <svg class="lab-svg" viewBox="0 0 500 340" style="display:block;width:100%;max-width:640px;height:auto" role="img" aria-labelledby="${id}-title ${id}-desc">
        <title id="${id}-title">Степенная и логарифмическая функции</title><desc id="${id}-desc">Графики отражаются друг в друга относительно прямой y = x.</desc>
        <defs><clipPath id="${id}-clip"><rect x="104" y="20" width="278" height="278"/></clipPath></defs>
        <rect x="104" y="20" width="278" height="278" rx="8" fill="#f3f7fb"/><g data-grid></g><g clip-path="url(#${id}-clip)"><path data-diagonal fill="none" stroke="#94a3b8" stroke-dasharray="5 5"/><path data-exp-path fill="none" stroke="#047857" stroke-width="3"/><path data-log-path fill="none" stroke="#7c3aed" stroke-width="3"/><path data-connector stroke="#64748b" stroke-dasharray="5 4"/><circle data-exp-point r="7" fill="#047857" stroke="#fff" stroke-width="2"/><circle data-log-point r="7" fill="#7c3aed" stroke="#fff" stroke-width="2"/></g><text x="395" y="315" fill="#334155" font-size="14">x</text><text x="88" y="18" fill="#334155" font-size="14">y</text>
      </svg>
      <div class="lab-controls" style="display:flex;flex-wrap:wrap;gap:14px;align-items:center"><label for="${id}-base">Основание a <select id="${id}-base" data-base><option value="2">2</option><option value="3">3</option><option value="0.5">1/2</option></select></label>
      <label for="${id}-exponent">Показатель t <input id="${id}-exponent" data-exponent type="number" min="-2" max="3" step="0.25" value="1" style="width:100px"></label>
      <label for="${id}-range">Двигать показатель <input id="${id}-range" data-exponent-range type="range" min="-2" max="3" step="0.25" value="1"></label></div>
      <p data-error role="status"></p><div class="lab-readout" data-readout style="padding:12px;background:#eef5f8;border-radius:12px"></div>
      <p><b>Цель:</b> выберите основание 3 и найдите показатель, при котором аргумент логарифма равен 1/9. Сравните зелёную точку (t; aᵗ) и фиолетовую (aᵗ; t).</p><button type="button" data-check>Проверить связь</button><p class="lab-feedback" data-feedback role="status" aria-live="polite">Подберите пару и проверьте её.</p></div>`;
    const get=s=>container.querySelector(s);
    let viewMax=3;
    const mapX=x=>104+(x+2.5)/(viewMax+2.5)*278,mapY=y=>298-(y+2.5)/(viewMax+2.5)*278;
    const point=(x,y)=>`${mapX(x)},${mapY(y)}`;
    function render(){
      const result=Math.pow(base,exponent),baseText=base===0.5?'1/2':String(base);
      viewMax=Math.max(3,Math.ceil(result+0.5),Math.ceil(exponent+0.5));
      const step=viewMax>15?5:viewMax>6?2:1,ticks=[];
      for(let t=-2;t<=viewMax;t+=step)ticks.push(t);
      get('[data-grid]').innerHTML=ticks.map(t=>`<path d="M${mapX(t)} 20V298M104 ${mapY(t)}H382" stroke="#dde5ed"/><text x="${mapX(t)}" y="315" text-anchor="middle" fill="#526075" font-size="12">${t}</text><text x="95" y="${mapY(t)+4}" text-anchor="end" fill="#526075" font-size="12">${t}</text>`).join('')+`<path d="M104 ${mapY(0)}H382M${mapX(0)} 20V298" stroke="#526075" stroke-width="1.5"/>`;
      get('[data-diagonal]').setAttribute('d',`M${point(-2.5,-2.5)}L${point(viewMax,viewMax)}`);
      get('[data-exponent]').value=String(exponent);get('[data-exponent-range]').value=String(exponent);
      let path='',inverse='';
      for(let i=0;i<=300;i++){const t=-5+i/300*10,v=Math.pow(base,t);path+=(i?'L':'M')+point(t,v);inverse+=(i?'L':'M')+point(v,t);}
      get('[data-exp-path]').setAttribute('d',path);get('[data-log-path]').setAttribute('d',inverse);
      get('[data-exp-point]').setAttribute('cx',mapX(exponent));get('[data-exp-point]').setAttribute('cy',mapY(result));
      get('[data-log-point]').setAttribute('cx',mapX(result));get('[data-log-point]').setAttribute('cy',mapY(exponent));
      get('[data-connector]').setAttribute('d',`M${point(exponent,result)}L${point(result,exponent)}`);
      get('[data-readout]').innerHTML=`<span style="color:#047857"><b>Степень:</b> (${baseText})<sup>${fmt(exponent)}</sup> ≈ ${fmt(result)}; точка (${fmt(exponent)}; ${fmt(result)})</span><br><span style="color:#6d28d9"><b>Логарифм:</b> log<sub>${baseText}</sub>(${fmt(result)}) ≈ ${fmt(exponent)}; точка (${fmt(result)}; ${fmt(exponent)})</span><br>Основание положительно и не равно 1; аргумент ${fmt(result)} > 0. ${base<1?'При увеличении показателя результат уменьшается.':'При увеличении показателя результат растёт.'} Значения на экране округлены; связь aᵗ = b ⇔ logₐb = t точная.`;
      get('desc').textContent=`Зелёная точка: показатель ${fmt(exponent)}, степень ${fmt(result)}. Фиолетовая точка меняет эти координаты местами. Серая диагональ y = x — ось отражения.`;
      if(checked){get('[data-feedback]').textContent='Пара изменена. Проверьте связь ещё раз.';delete get('[data-feedback]').dataset.correct;checked=false;}
    }
    life.on(get('[data-base]'),'change',()=>{base=Number(get('[data-base]').value);render();});
    function changeExponent(input){const value=Number(input.value);if(input.value.trim()===''||!Number.isFinite(value)||value< -2||value>3){get('[data-error]').textContent='Введите показатель от −2 до 3.';return;}get('[data-error]').textContent='';exponent=value;render();}
    life.on(get('[data-exponent]'),'input',()=>changeExponent(get('[data-exponent]')));life.on(get('[data-exponent-range]'),'input',()=>changeExponent(get('[data-exponent-range]')));
    life.on(get('[data-check]'),'click',()=>{const passed=base===3&&Math.abs(exponent+2)<1e-8;get('[data-feedback]').textContent=passed?'Связь найдена: 3⁻² = 1/9, поэтому log₃(1/9) = −2. Координаты точек переставлены.':'Проверьте основание 3. Число 1/9 обратно числу 3², поэтому нужен отрицательный показатель.';get('[data-feedback]').dataset.correct=String(passed);checked=true;});
    render();return life.cleanup;
  };
  root.ProfileModels=Object.assign(root.ProfileModels||{},models);
  if(typeof module!=='undefined'&&module.exports)module.exports=models;
})(typeof globalThis!=='undefined'?globalThis:window);
