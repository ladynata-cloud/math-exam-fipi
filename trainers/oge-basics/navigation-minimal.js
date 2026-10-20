(function(){
  'use strict';
  function fold(nodes,label,before){
    nodes=nodes.filter(Boolean);if(!nodes.length)return null;
    const details=document.createElement('details');details.className='basics-secondary';
    const summary=document.createElement('summary');summary.textContent=label;details.append(summary);
    const anchor=before||nodes[0];anchor.before(details);nodes.forEach(node=>details.append(node));return details;
  }
  function ready(){
    if(window.MathExamRemediationManaged)return;
    const path=location.pathname,hub=/\/oge-basics\/(?:index\.html)?$/.test(path)||/\/(percentages|multiplication-division)\/(?:index\.html)?$/.test(path),map=/\/(arithmetic-route|division-course)\.html$/.test(path);
    document.body.classList.add(hub||map?'basics-navigation':'basics-special');
    if(hub){
      const title=document.querySelector('h1');
      if(title&&!/percentages/.test(path)&&!path.includes('/multiplication-division/'))title.textContent='Базовая подготовка к ОГЭ';
      const lead=document.querySelector('.hero-copy>.lead,.map-hero .lead,header.card>p');
      if(lead)lead.textContent='Выбери тему и начни с задачи. Если трудно — нажми «Нужна помощь?». Можно разобрать любой непонятный шаг.';
      fold([document.querySelector('.route-note')],'Как заниматься');
      const percentSummary=document.querySelector('header.card>.summary');if(percentSummary)fold([percentSummary],'Мои результаты');
      const how=[...document.querySelectorAll('section.card')].find(s=>s.querySelector('h2')?.textContent==='Как устроен каждый тренажёр');
      if(how)fold([how],'Как заниматься');
      const note=document.querySelector('main.wrap>.note');if(note){note.textContent='Начни с задачи. Если трудно, открой помощь к текущему шагу. Короткую проверку можно выбрать отдельно.';fold([note],'Как заниматься');}
      const extra=[...document.querySelectorAll('main>.module')].find(s=>s.querySelector('a[href="/soviet-math/"]'));if(extra)fold([extra],'Ещё материалы');
      const ordering=document.querySelector('#map')?.parentElement;
      if(ordering){const h=ordering.querySelector('h2');if(h)h.textContent='Выбрать тему';const p=ordering.querySelector(':scope > p');if(p)fold([p],'С чего начать');}
    }
    if(/arithmetic-route\.html$/.test(path)){
      const entry=document.getElementById('division-course-entry');if(entry)fold([entry],'Подробные линейки действий');
    }
    if(/division-course\.html$/.test(path)){
      const header=document.querySelector('.division-course-heading');
      if(header){const paragraphs=[...header.querySelectorAll(':scope > p:not(.eyebrow):not(.lead)')];fold(paragraphs,'О тренировке и сохранении');}
    }
    if(/arithmetic-foundations\.html$/.test(path)){
      fold([document.getElementById('stages')],'Выбрать шаг');
      const note=document.querySelector('main>.note');if(note)fold([note],'Где сохраняется работа');
    }
    if(/quotient-estimate\.html$/.test(path))fold([document.querySelector('.rounding-preparation')],'Потренировать округление отдельно');
    if(/division-lab\.html$/.test(path)){
      fold([document.querySelector('.controls')],'Выбрать тему или режим');
      const stats=document.getElementById('stats')?.closest('section');if(stats)fold([stats],'Мои результаты');
      const intro=document.querySelector('.intro');if(intro){const h=intro.querySelector('h1');if(h)h.textContent='Деление уголком';fold([...intro.querySelectorAll('p')],'Как заниматься');}
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
