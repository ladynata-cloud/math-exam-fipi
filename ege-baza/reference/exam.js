(function(root){
 'use strict';
 const D=root.EgeExamReference,U=root.EgeReferenceUI,content=document.getElementById('exam-content');
 if(!D||!U||!content)return;
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function table(kind){
  if(kind==='squares')return `<div class="exam-table-scroll" role="region" aria-label="Квадраты чисел: таблицу можно прокрутить" tabindex="0"><table class="exam-table"><caption>Десятки ↓ · единицы →</caption><thead><tr><th scope="col">Десятки</th>${Array.from({length:10},(_,n)=>`<th scope="col">${n}</th>`).join('')}</tr></thead><tbody>${Array.from({length:10},(_,t)=>`<tr><th scope="row">${t}</th>${Array.from({length:10},(_,u)=>`<td title="${10*t+u}²">${(10*t+u)**2}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  const rows=[['Радианы','0','[[π|6]]','[[π|4]]','[[π|3]]','[[π|2]]','π','[[3π|2]]','2π'],['Градусы','0°','30°','45°','60°','90°','180°','270°','360°'],['sin α','0','[[1|2]]','[[√2|2]]','[[√3|2]]','1','0','−1','0'],['cos α','1','[[√3|2]]','[[√2|2]]','[[1|2]]','0','−1','0','1'],['tg α','0','[[√3|3]]','1','√3','—','0','—','0']];
  return `<div class="exam-table-scroll" role="region" aria-label="Значения функций: таблицу можно прокрутить" tabindex="0"><table class="exam-table"><caption>Угол α и значения функций</caption><tbody>${rows.map((row,i)=>`<tr><th scope="row">${E(row[0])}</th>${row.slice(1).map(x=>i===0?`<th scope="col">${U.math(x)}</th>`:`<td>${U.math(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 }
 function diagram(){return '<svg class="exam-diagram" viewBox="0 0 240 220" role="img" aria-label="Единичная окружность: точка P имеет координаты косинус альфа, синус альфа"><g fill="none" stroke="#416957" stroke-width="1.5"><circle cx="110" cy="110" r="78"/><path d="M15 110H220 M110 205V12 M110 110L157 48"/><path d="M157 48V110 M157 48H110" stroke-dasharray="4 4"/><path d="M137 110A27 27 0 0 0 126 88"/></g><circle cx="157" cy="48" r="3.5" fill="#b66146"/><g fill="#244c3b" font-size="13"><text x="162" y="40">Pα</text><text x="210" y="128">x</text><text x="120" y="20">y</text><text x="94" y="128">0</text><text x="185" y="128">1</text><text x="135" y="94">α</text><text x="125" y="143">cos α</text><text x="50" y="53">sin α</text></g></svg>';}
 function card(g){return `<article class="ref-sheet exam-card${g.table?' exam-wide':''}" id="${E(g.id)}"><h3>${E(g.title)}</h3>${g.table?table(g.table):''}${g.diagram?diagram():''}<div class="exam-formulas">${g.formula.map(x=>`<p>${U.math(x).replace('a в степени logₐ b равно b','a<sup>logₐ b</sup> = b')}</p>`).join('')}</div><p class="ref-small">${E(g.note)}</p><details class="exam-pin-list"><summary aria-label="Задачи к формуле: ${E(g.title)}">Задачи к этой формуле <span class="ref-count">${g.pins.length}</span></summary><div class="ref-pin-grid">${g.pins.map(p=>`<a class="ref-pin" data-pin-id="${E(p.id)}" href="${E(U.safeHref(p.href))}" target="_blank" rel="noopener"><span class="ref-pin-head" aria-hidden="true"></span><span>${p.note?`<small>${E(p.note)}</small>`:''}${E(p.label)}</span><span aria-hidden="true">↗</span></a>`).join('')}</div><p class="ref-small">Откроется отдельная вкладка. Чтобы вернуться к формуле, выбери эту вкладку.</p></details></article>`;}
 function render(focus=false){
  let hash;try{hash=decodeURIComponent(location.hash.slice(1));}catch{hash='';}
  const selected=D.groups.find(g=>g.id===hash),section=selected?.section||(D.sections.some(([id])=>id===hash)?hash:'algebra');
  const title=D.sections.find(([id])=>id===section)[1];
  content.innerHTML=`<h2 class="exam-heading">${E(title)}</h2><div class="exam-grid">${D.groups.filter(g=>g.section===section).map(card).join('')}</div>`;
  document.title=title+' · Экзаменационная справка · MathExam';
  for(const a of document.querySelectorAll('#exam-sections a')){if(a.hash==='#'+section)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
  if(focus||selected){const target=selected?document.getElementById(selected.id):content;target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView?.({block:'start'});}
 }
 // Only reference-owned section hashes; no arbitrary redirect parameters.
 document.querySelector('.ref-skip').addEventListener('click',e=>{e.preventDefault();content.focus();content.scrollIntoView?.({block:'start'});});
 root.addEventListener('hashchange',()=>render(true));render();
})(window);
