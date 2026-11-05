/* Public exercises stay on the trainer origin, inside a cabinet workspace.
 * No account data, credentials, messages or managed attempts enter the frame. */
(function(root){
  'use strict';
  const publicOrigin='https://mathexam.space';
  const prefixes=['/trainers/','/ege-baza/','/ege-profil/','/school/','/courses/','/stereo-course/','/geometry-course/','/foundations/','/grade7/'];
  const E=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function publicPath(value){
    try{
      const url=new URL(value,publicOrigin);
      if(url.origin!==publicOrigin||url.username||url.password||!prefixes.some(prefix=>url.pathname.startsWith(prefix)))return '';
      return url.pathname+url.search+url.hash;
    }catch(_){return '';}
  }
  function returnRoute(value){
    const route=String(value||'').replace(/^#/,'');
    // Only navigation routes, never quick-entry codes, invitations or logins.
    return /^(?:home|route|students|assignments|history|repeat|course(?:=[a-z0-9-]+)?|program-course=[a-z0-9-]+|(?:preview|student)=[a-zA-Z0-9_-]{1,100})$/.test(route)?route:'home';
  }
  function href(value,back=root.location.hash){
    const path=publicPath(value);
    return path?'#public-practice='+encodeURIComponent(path)+'&return='+encodeURIComponent(returnRoute(back)):'';
  }
  function enhance(host){
    for(const link of host.querySelectorAll('a[href]')){
      if(link.closest('[data-public-workspace], [data-peterson-workspace]'))continue;
      const raw=link.getAttribute('href');
      if(!raw.startsWith(publicOrigin+'/'))continue;
      const next=href(raw);
      if(!next)continue;
      link.href=next;
      link.removeAttribute('target');
      link.dataset.cabinetPractice='';
      link.textContent=link.textContent.replace(/↗/g,'→');
    }
  }
  function watch(host){
    enhance(host);
    const observer=new MutationObserver(()=>enhance(host));
    observer.observe(host,{childList:true,subtree:true});
    return ()=>observer.disconnect();
  }
  function mount(host,route){
    const params=new URLSearchParams(route),path=publicPath(params.get('public-practice')||'');
    const back='#'+returnRoute(params.get('return'));
    const origin=new URL(root.LearningTrainerOrigin||publicOrigin);
    const local=['localhost','127.0.0.1'].includes(origin.hostname);
    const validOrigin=origin.origin!==root.location.origin&&!origin.username&&!origin.password&&
      (origin.protocol==='https:'||(local&&origin.protocol==='http:'));
    if(!path||!validOrigin){
      host.innerHTML='<section class="empty"><h1>Не удалось открыть тренажёр</h1><p>Вернись в кабинет и выбери задание ещё раз.</p><a class="button primary" href="'+E(back)+'">← В кабинет</a></section>';
      return ()=>{};
    }
    const title=path.startsWith('/trainers/trainer-board.html')?'Общая доска':'Тренажёр';
    host.innerHTML=`<section class="public-practice-workspace" data-public-workspace><header class="public-practice-toolbar"><a class="button primary" data-cabinet-return href="${E(back)}">← В кабинет</a><h1>${title}</h1><details><summary>О результатах</summary><p>Это отдельная практика. Она не добавляет выполненное домашнее задание в отчёт кабинета. Уже сохранённые работы кабинета остаются на месте.</p></details></header><div class="public-practice-stage"><p class="public-practice-loading" role="status">Открываем задание… Кнопка «В кабинет» всегда сверху.</p></div></section>`;
    const frame=document.createElement('iframe');
    frame.title=title;
    frame.referrerPolicy='no-referrer';
    frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox');
    frame.setAttribute('allow','fullscreen');
    frame.src=new URL(path,origin.origin).href;
    const status=host.querySelector('[role="status"]');
    const timer=setTimeout(()=>{status.textContent='Если задание не открылось, проверь связь. Можно вернуться в кабинет и открыть его снова.';},15000);
    frame.addEventListener('load',()=>{clearTimeout(timer);status.hidden=true;},{once:true});
    host.querySelector('.public-practice-stage').append(frame);
    document.body.classList.add('public-practice-open');
    document.title=title+' · Мой кабинет · MathExam';
    host.querySelector('[data-cabinet-return]').focus({preventScroll:true});
    return ()=>{clearTimeout(timer);frame.remove();document.body.classList.remove('public-practice-open');};
  }
  root.LearningPublicPractice=Object.freeze({publicPath,returnRoute,href,enhance,watch,mount});
  const host=document.getElementById('main');
  if(host)watch(host);
})(window);
