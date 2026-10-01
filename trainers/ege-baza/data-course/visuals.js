(function(root){
 'use strict';
 const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=n=>Number(n.toFixed(4)).toLocaleString('ru-RU',{maximumFractionDigits:4});
 function draw(v,selected=-1){
  if(!v)return '';
  if(v.kind==='table')return `<div class="table-wrap stimulus"><table><caption>${esc(v.title)}</caption><thead><tr>${v.headers.map(h=>`<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${v.rows.map(row=>`<tr>${row.map(x=>`<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const min=Math.min(0,...v.values),max=Math.max(1,...v.values),span=max-min;
  const xs=v.xs||v.values.map((_,i)=>i),left=68,right=532,top=35,bottom=275;
  const X=i=>v.kind==='bars'?left+(i+.5)*(right-left)/xs.length:left+(xs[i]-xs[0])/(xs.at(-1)-xs[0]||1)*(right-left);
  const Y=y=>bottom-(y-min)/span*(bottom-top);
  const description=v.values.map((y,i)=>(v.labels?.[i]??xs[i])+': '+fmt(y)).join('; ');
  let plot='';
  for(let i=0;i<=4;i++){const value=min+span*i/4,y=Y(value);plot+=`<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="#c7d6c5"/><text x="${left-9}" y="${y+4}" text-anchor="end">${esc(fmt(value))}</text>`;}
  plot+=`<line x1="${left}" x2="${left}" y1="${top}" y2="${bottom}" stroke="#173e3c"/><line x1="${left}" x2="${right}" y1="${Y(0)}" y2="${Y(0)}" stroke="#173e3c"/>`;
  if(v.kind==='line')plot+=`<polyline points="${v.values.map((y,i)=>X(i)+','+Y(y)).join(' ')}" fill="none" stroke="#176652" stroke-width="3"/>`;
  v.values.forEach((value,i)=>{
   const x=X(i),y=Y(value);
   if(v.kind==='bars')plot+=`<rect x="${x-24}" y="${Math.min(y,Y(0))}" width="48" height="${Math.abs(y-Y(0))}" fill="#176652" rx="3"/>`;
   else plot+=`<circle cx="${x}" cy="${y}" r="${selected===i?8:5}" fill="${selected===i?'#ac6513':'#176652'}" stroke="#fffef9" stroke-width="2"/>`;
   plot+=`<text x="${x}" y="${y-10}" text-anchor="middle">${esc(fmt(value))}</text><text x="${x}" y="${bottom+22}" text-anchor="middle">${esc(v.labels?.[i]??xs[i])}</text>`;
  });
  return `<figure class="stimulus"><figcaption>${esc(v.title)}</figcaption><div class="chart-scroll" tabindex="0" role="region" aria-label="${esc(v.title)} — область графика"><svg class="data-chart" viewBox="0 0 600 330" role="img" aria-label="${esc(v.title+'. '+v.yLabel+'. '+description)}"><text x="${left}" y="18">${esc(v.yLabel)}</text>${plot}<text x="${right}" y="322" text-anchor="end">${esc(v.xLabel||'Номер')}</text></svg></div></figure>`;
 }
 function modelHTML(s){const settings={data:['Количество тетрадей',0,50,20,5],probability:['Красных шаров из десяти',0,10,4,1],graphs:['Время, часы',0,4,0,1],logic:['Номер утверждения для проверки',1,4,1,1]}[s.id];return `<label for="slider">${settings[0]}: <output id="factor-label"></output></label><input id="slider" type="range" min="${settings[1]}" max="${settings[2]}" value="${settings[3]}" step="${settings[4]}"><div id="model-output" aria-live="polite"></div>`;}
 function updateModel(s){
  const n=Number(document.getElementById('slider').value);document.getElementById('factor-label').textContent=n;let out='';
  if(s.id==='data')out=draw({kind:'bars',labels:['Книги','Тетради','Ручки'],values:[20,n,15],yLabel:'Количество, штук',title:'Покупки для кружка'})+`<p>Всего: 20 + ${n} + 15 = ${35+n} предметов. Доля тетрадей: ${n}/${35+n} ≈ ${fmt(100*n/(35+n))}%.</p><p class="small">До движения ползунка предположите: когда тетради станут самой большой группой? При 20 — равенство с книгами, при большем количестве — отдельный максимум.</p>`;
  if(s.id==='probability')out=`<div class="balls" aria-label="Красных ${n}, синих ${10-n}">${Array.from({length:10},(_,i)=>`<span class="ball ${i<n?'red':'blue'}" aria-hidden="true">${i<n?'К':'С'}</span>`).join('')}</div><div class="equation">P(красный) = ${n}/10 = ${fmt(n/10)}</div><p>Все десять шаров равновозможны. Вероятность синего: 1 − ${fmt(n/10)} = ${fmt((10-n)/10)}.</p><p class="small">При 0 красных событие невозможно. При 10 — достоверно. Даже вероятность 0,8 не означает ровно восемь красных в любых десяти попытках.</p>`;
  if(s.id==='graphs'){const ys=[1,4,4,2,6];out=draw({kind:'line',xs:[0,1,2,3,4],values:ys,xLabel:'Время, ч',yLabel:'Температура, °C',title:'Температура по часам'},n)+`<p>В ${n} ч температура ${ys[n]} °C.${n?` На предыдущем часовом участке она ${ys[n]>ys[n-1]?'выросла':ys[n]<ys[n-1]?'снизилась':'не менялась'}; изменение ${fmt(ys[n]-ys[n-1])} °C.`:' Это начальное значение.'}</p><p class="small">Значение может быть положительным даже на убывающем участке: от 2 до 3 часов температура падает с 4 до 2 °C. Не путайте знак значения со знаком изменения.</p>`;}
  if(s.id==='logic'){const cases=[['Все кратные 4 числа чётные.','Верно: 4k = 2 · (2k).'],['Все чётные числа кратны 4.','Неверно. Контрпример: 6 чётное, но на 4 не делится.'],['Если число не кратно 4, то оно нечётное.','Неверно. Тот же контрпример: 6 не кратно 4, но чётное.'],['Нечётное число не кратно 4.','Верно: кратность 4 обязательно влечёт чётность.']];out=`<div class="logic-set"><b>Чётные числа</b><p>2, 6, 10, …</p><div><b>Из них кратны 4</b><p>4, 8, 12, …</p></div></div><h3>${cases[n-1][0]}</h3><p>${cases[n-1][1]}</p><p class="small">Сначала сформулируйте свой ответ и пример, затем проверьте объяснение. Обратное условие нужно доказывать отдельно.</p>`;}
  document.getElementById('model-output').innerHTML=out;
 }
 root.EgeBazaDataVisuals={draw,modelHTML,updateModel};
})(globalThis);
