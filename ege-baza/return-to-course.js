(function(){'use strict';
 const value=new URLSearchParams(location.search).get('returnTo');if(!value||value.length>300)return;
 let url;try{url=new URL(value,location.origin);}catch(e){return;}
 // Only the two known course pages can be return destinations; no external redirect.
 if(url.origin!==location.origin||url.search||!['/ege-baza/path/index.html','/ege-baza/work-rate/index.html'].includes(url.pathname))return;
 if(!/^#(?:lesson=[a-z]+|learn|practice|map)$/.test(url.hash))return;
 const aside=document.createElement('aside');aside.id='ege-return';aside.setAttribute('aria-label','Вернуться в курс ЕГЭ');aside.style='padding:14px 18px;margin:0 auto 12px;max-width:1100px;background:#eef5e9;border:1px solid #bbcdb3;border-radius:12px;font:16px/1.5 system-ui;color:#203e34';
 const link=document.createElement('a');link.href=url.href;link.textContent='← Вернуться к той же задаче ЕГЭ';link.style='display:inline-block;padding:10px 3px;color:#17674e;font-weight:700';
 const text=document.createElement('p');text.textContent='Потренируй нужное действие и вернись к сохранённому шагу. Этот тренажёр не выставляет зачёт за исходную задачу.';text.style.margin='4px 0';aside.append(link,text);document.body.prepend(aside);
})();
