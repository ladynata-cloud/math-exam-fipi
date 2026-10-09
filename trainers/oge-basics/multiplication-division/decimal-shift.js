(function (root) {
  'use strict';
  function parse(raw) {
    const text = String(raw).trim().replace('.', ',');
    const match = /^(\d{1,12})(?:,(\d{1,6}))?$/.exec(text);
    if (!match) throw Error('Нужно неотрицательное десятичное число.');
    const integer = match[1].replace(/^0+(?=\d)/, ''), fraction = match[2] || '';
    return {text:integer + (fraction ? ',' + fraction : ''), integer, fraction, digits:integer + fraction, point:integer.length};
  }
  function shifted(number, amount) {
    if (!Number.isInteger(amount) || amount < 0 || amount > 7) throw Error('Неверный сдвиг.');
    const point = number.point + amount;
    const digits = number.digits.padEnd(point, '0');
    const integer = digits.slice(0, point).replace(/^0+(?=\d)/, '') || '0';
    const fraction = digits.slice(point).replace(/0+$/, '');
    return integer + (fraction ? ',' + fraction : '');
  }
  function model(dividend, divisor) {
    const a = parse(dividend), b = parse(divisor);
    if (!/[1-9]/.test(b.digits)) throw Error('На ноль делить нельзя.');
    const target = b.fraction.length, maxShift = target + 1;
    return {dividend:a, divisor:b, target, maxShift,
      at(k) {
        if (!Number.isInteger(k) || k < 0 || k > maxShift) throw Error('Сдвиг вне диапазона.');
        return {dividend:shifted(a,k), divisor:shifted(b,k), factor:'1' + '0'.repeat(k)};
      }};
  }
  const word = k => k === 1 ? 'разряд' : k >= 2 && k <= 4 ? 'разряда' : 'разрядов';
  function create(container, options) {
    const m = model(options.dividend, options.divisor);
    const doc = container.ownerDocument;
    const clamp = k => Number.isFinite(k) ? Math.max(0, Math.min(m.maxShift, Math.round(k))) : 0;
    let value = clamp(options.value || 0), locked = !!options.locked, drag = null, destroyed = false;
    const listeners = [];
    function listen(node, type, callback) { node.addEventListener(type, callback); listeners.push(() => node.removeEventListener(type, callback)); }
    const box = doc.createElement('section'); box.className = 'decimal-shift'; box.setAttribute('aria-label','Переносим обе запятые вместе');
    const introduction = doc.createElement('p'); introduction.className = 'ds-instruction'; box.append(introduction);
    const rows = [], handles = [];
    const columns = Math.max(...[m.dividend,m.divisor].map(n => Math.max(n.digits.length, n.point + m.maxShift)));
    for (const [name,label,n] of [['dividend','Делимое',m.dividend],['divisor','Делитель',m.divisor]]) {
      const row = doc.createElement('div'); row.className = 'ds-row'; row.dataset.number = name;
      const heading = doc.createElement('div'); heading.className = 'ds-row-heading';
      const caption = doc.createElement('span'); caption.textContent = label;
      const result = doc.createElement('strong'); result.className = 'ds-result'; result.dataset.number = name;
      heading.append(caption,result); row.append(heading);
      const track = doc.createElement('div'); track.className = 'ds-track'; track.dataset.number = name;
      const digits = n.digits.padEnd(Math.max(n.digits.length,n.point+m.maxShift),'0');
      track.style.setProperty('--ds-digits',String(digits.length));
      const cells = doc.createElement('div'); cells.className = 'ds-digits'; cells.setAttribute('aria-hidden','true');
      [...digits].forEach((digit,i) => { const cell = doc.createElement('span'); cell.className = 'ds-digit'; cell.textContent = digit; cell.dataset.index = String(i); if(i>=n.digits.length)cell.dataset.added = 'true'; cells.append(cell); });
      const origin = doc.createElement('span'); origin.className = 'ds-origin'; origin.setAttribute('aria-hidden','true'); origin.textContent = '·'; origin.style.left = 'calc(22px + ' + n.point + ' * var(--ds-cell))';
      const handle = doc.createElement('button'); handle.type = 'button'; handle.className = 'ds-handle'; handle.dataset.number = name; handle.textContent = ',';
      handle.setAttribute('role','slider'); handle.setAttribute('aria-label','Запятая в ' + (name==='dividend'?'делимом':'делителе') + ': передвинуть обе запятые'); handle.setAttribute('aria-valuemin','0'); handle.setAttribute('aria-valuemax',String(m.maxShift)); handle.setAttribute('aria-orientation','horizontal');
      track.append(cells,origin,handle); row.append(track); box.append(row);
      rows.push({name,n,result,track,origin,cells,handle}); handles.push(handle);
    }
    const controls = doc.createElement('div'); controls.className = 'ds-controls';
    const back = doc.createElement('button'); back.type='button'; back.className='ds-back'; back.textContent='← На один разряд'; back.setAttribute('aria-label','Обе запятые на один разряд влево');
    const forward = doc.createElement('button'); forward.type='button'; forward.className='ds-forward'; forward.textContent='На один разряд →'; forward.setAttribute('aria-label','Обе запятые на один разряд вправо');
    controls.append(back,forward); box.append(controls);
    const status = doc.createElement('p'); status.className='ds-status'; status.setAttribute('role','status'); box.append(status);
    const equation = doc.createElement('p'); equation.className='ds-equation'; box.append(equation);
    const note = doc.createElement('p'); note.className='ds-note'; note.textContent='Пунктирные нули можно дописать справа: число от этого не меняется. Когда справа от запятой только нули, её можно не писать.'; box.append(note);
    container.replaceChildren(box);
    function render(position = value) {
      const values = m.at(value);
      rows.forEach(r => {
        r.handle.style.left = 'calc(' + (r.n.point + position) + ' * var(--ds-cell))';
        r.handle.setAttribute('aria-valuenow',String(value));
        r.handle.setAttribute('aria-valuetext','Обе запятые: на ' + value + ' ' + word(value) + ' вправо. ' + (r.name==='dividend'?'Делимое ':'Делитель ') + values[r.name]);
        r.handle.setAttribute('aria-disabled',String(locked)); r.handle.tabIndex = locked ? -1 : 0;
        r.result.textContent=values[r.name]; r.origin.hidden = position === 0;
        [...r.cells.children].forEach(cell => cell.classList.toggle('ds-used-zero',cell.dataset.added === 'true' && Number(cell.dataset.index) < r.n.point + value));
      });
      back.disabled=locked||value===0; forward.disabled=locked||value===m.maxShift;
      const divisorReady = !values.divisor.includes(',');
      const goal = divisorReady
        ? 'В делителе ' + values.divisor + ' запятой больше нет.'
        : 'В делителе ' + values.divisor + ' ещё есть запятая.';
      status.textContent = goal + (value ? ' Обе запятые сдвинули на ' + value + ' ' + word(value) + ' вправо: оба числа умножили на ' + values.factor + ', поэтому ответ не изменился.' : ' Переносим обе запятые вправо на одинаковое число разрядов.');
      equation.textContent=m.dividend.text + ' : ' + m.divisor.text + (value ? ' = ' + values.dividend + ' : ' + values.divisor : '');
      box.classList.toggle('ds-locked',locked);
      introduction.textContent = value > m.target
        ? 'Запятой в делителе уже нет. Для этого примера достаточно сдвига на ' + m.target + ' ' + word(m.target) + ': верни обе запятые на один разряд влево.'
        : divisorReady
          ? 'Цель достигнута: делитель без запятой. ' + (locked ? 'Запишем новые числа и будем делить уголком, как обычно.' : 'Проверь перенос. Затем запишем новые числа и будем делить уголком, как обычно.') + (values.dividend.includes(',') ? ' В делимом запятая может остаться.' : '')
          : 'Наша цель — убрать запятую в делителе. Возьми любую запятую и потяни вправо: обе переместятся на одинаковое число разрядов.';
    }
    function commit(k) { value=clamp(k); render(); if(options.onChange) options.onChange(value); }
    function cancel() {
      if(!drag)return;
      const old=drag; drag=null; value=old.value; box.classList.remove('ds-dragging');
      try { if(old.handle.hasPointerCapture(old.id))old.handle.releasePointerCapture(old.id); } catch(_) {}
      render();
    }
    handles.forEach(handle => {
      listen(handle,'pointerdown',event => {
        if(locked||drag||event.button!==0||event.isPrimary===false)return;
        event.preventDefault(); handle.focus({preventScroll:true});
        const cell=parseFloat(root.getComputedStyle(box).getPropertyValue('--ds-cell'));
        drag={id:event.pointerId,x:event.clientX,value,cell:cell||28,handle};
        handle.setPointerCapture(event.pointerId); box.classList.add('ds-dragging');
      });
      listen(handle,'pointermove',event => {
        if(!drag||event.pointerId!==drag.id)return;
        event.preventDefault(); const position=Math.max(0,Math.min(m.maxShift,drag.value+(event.clientX-drag.x)/drag.cell));
        value=clamp(position);render(position);
      });
      listen(handle,'pointerup',event => {
        if(!drag||event.pointerId!==drag.id)return;
        const old=drag;drag=null;box.classList.remove('ds-dragging');
        try{if(handle.hasPointerCapture(event.pointerId))handle.releasePointerCapture(event.pointerId);}catch(_){}
        commit(old.value+(event.clientX-old.x)/old.cell);
      });
      listen(handle,'pointercancel',event => {if(drag?.id===event.pointerId)cancel();});
      listen(handle,'lostpointercapture',event => {if(drag?.id===event.pointerId)cancel();});
      listen(handle,'keydown',event => {
        if(locked)return;let next;
        if(['ArrowRight','ArrowUp'].includes(event.key))next=value+1;
        if(['ArrowLeft','ArrowDown'].includes(event.key))next=value-1;
        if(event.key==='Home')next=0;if(event.key==='End')next=m.maxShift;
        if(next!==undefined){event.preventDefault();event.stopPropagation();commit(next);}
      });
    });
    listen(back,'click',()=>{if(!locked)commit(value-1);});
    listen(forward,'click',()=>{if(!locked)commit(value+1);});
    function resize(){if(destroyed)return;const width=box.clientWidth||container.clientWidth||280;box.style.setProperty('--ds-cell',Math.max(14,Math.min(34,(width-48)/columns))+'px');render();}
    const observer = root.ResizeObserver ? new root.ResizeObserver(resize) : null;
    observer?.observe(box);resize();
    return {getValue:()=>value,setValue(k){if(destroyed)return;cancel();value=clamp(k);render();},setLocked(v){if(destroyed)return;if(v)cancel();locked=!!v;render();},destroy(){if(destroyed)return;cancel();destroyed=true;observer?.disconnect();listeners.forEach(off=>off());box.remove();}};
  }
  const api={model,create};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.DecimalShift=api;
})(typeof window!=='undefined'?window:globalThis);
