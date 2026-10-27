(function(root){'use strict';
const E=root.PetersonBook;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function frac(n,d){return '<span class="frac" aria-label="'+esc(n)+' разделить на '+esc(d)+'"><span>'+esc(n)+'</span><span>'+esc(d)+'</span></span>';}
function fmt(text){let s=esc(text);s=s.replace(/\{\{mix:([^:}]+):([^:}]+):([^}]+)\}\}/g,(_,w,n,d)=>'<span class="mixed">'+w+' '+frac(n,d)+'</span>');s=s.replace(/\{\{frac:([^:}]+):([^}]+)\}\}/g,(_,n,d)=>frac(n,d));return s.replace(/(^|[\s(=;+−·:])(-?\d+)\s*\/\s*(\d+)(?=$|[\s).,;:+−·=%])/g,(_,p,n,d)=>p+frac(n,d));}
function expression(node,parent=0,side='',parentOp=''){
 if(typeof node!=='object'){const s=String(node).trim(),m=s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);if(m)return fmt('{{mix:'+m[1]+':'+m[2]+':'+m[3]+'}}');if(/^[-+]?\d+\s*\/\s*\d+$/.test(s)){const [n,d]=s.split('/');return frac(n.trim(),d.trim());}return esc(s.replace('.',','));}
 const priority=node.op==='add'||node.op==='subtract'?1:2,wrap=priority<parent||(side==='right'&&priority===parent&&(parentOp==='subtract'||parentOp==='divide'));
 const body=expression(node.left,priority,'left',node.op)+' '+esc(E.OPS[node.op])+' '+expression(node.right,priority,'right',node.op);
 return '<span class="math-group">'+(wrap?'(':'')+body+(wrap?')':'')+'</span>';
}
function diagram(d){if(!d)return '';const title=d.type==='river'?'Движение по реке':d.type==='work'?'Совместная работа':d.type==='percent'?'Целое и часть':'Схема движения';const text=(x,y,s,anchor='middle')=>/\{\{(?:frac|mix):|\d+\s*\/\s*\d+/.test(s||'')?'<foreignObject x="'+(x-250)+'" y="'+(y-26)+'" width="500" height="52"><div xmlns="http://www.w3.org/1999/xhtml" style="text-align:center;font-size:17px;line-height:1.3">'+fmt(s)+'</div></foreignObject>':'<text x="'+x+'" y="'+y+'" text-anchor="'+anchor+'">'+esc(s||'')+'</text>';let body='';
 const arrow=(x1,y1,x2,y2,color='#16745b')=>'<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" stroke="'+color+'" stroke-width="3" fill="none" marker-end="url(#arrow)"/>';
 if(d.type==='motion'){body='<path d="M45 130H515" stroke="#a5b4bd" stroke-width="3"/>'+text(125,36,d.left)+text(425,36,d.right)+text(280,169,d.gap)+text(280,200,d.time);if(d.mode==='meeting')body+=arrow(80,85,215,85)+arrow(480,85,345,85);else if(d.mode==='apart')body+=arrow(260,85,80,85)+arrow(300,85,480,85);else body+=arrow(65,85,195,85)+arrow(350,85,480,85);body+='<circle cx="80" cy="130" r="5"/><circle cx="480" cy="130" r="5"/>';
 }else if(d.type==='river'){body='<path d="M25 65Q130 25 250 65T535 65 M25 125Q130 85 250 125T535 125" fill="none" stroke="#6fa8bf" stroke-width="3"/>'+arrow(80,92,470,92)+text(280,28,'Течение: '+(d.current||'?'))+text(280,163,'Собственная скорость: '+(d.own||'?'))+text(280,192,d.distance)+text(280,221,d.other);
 }else if(d.type==='work'){body='<path d="M155 105V205H405V105 M80 40H190V95 M480 40H370V95" fill="none" stroke="#5e98b2" stroke-width="10"/>'+text(125,23,'Первая: '+(d.first||'?'))+text(435,23,'Вторая: '+(d.second||'?'))+text(280,151,'1 бассейн')+text(280,180,'Вместе: '+(d.together||'?'));
 }else if(d.type==='percent'){body='<rect x="35" y="75" width="490" height="50" rx="8" fill="#eaf3ed" stroke="#16745b" stroke-width="2"/>'+text(280,38,(d.whole||'Всё целое')+' — 100%')+text(280,107,(d.rate||'p%')+' → '+(d.part||'часть'))+text(280,169,d.other);}
 const label=[title,...Object.values(d).slice(1)].join('. ').replace(/\{\{frac:([^:}]+):([^}]+)\}\}/g,'$1 / $2').replace(/\{\{mix:([^:}]+):([^:}]+):([^}]+)\}\}/g,'$1 $2 / $3');
 return '<figure class="diagram"><svg viewBox="0 0 560 240" role="img" aria-label="'+esc(label)+'"><title>'+esc(title)+'</title><defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#16745b"/></marker></defs>'+body+'</svg><figcaption>'+esc(title)+'. Данные условия.</figcaption></figure>';
}
function download(name,data,type='application/json'){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([data],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function status(s){return s.independent?'Решено самостоятельно':s.correct?'Решено с помощью':s.submitted?'Записано · нужна проверка':s.draft||s.note||s.stepDrafts?.some(Boolean)?'В работе':'Ещё не решали';}
root.PetersonUI={esc,fmt,frac,expression,diagram,download,status};
})(globalThis);
