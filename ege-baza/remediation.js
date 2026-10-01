(function(root){'use strict';
const skills={
 signs:{title:'Сложение и вычитание чисел с разными знаками',path:'/trainers/oge-basics/negative-add-subtract.html'},
 fractions:{title:'Общий знаменатель и действия с дробями',path:'/trainers/oge-basics/fraction-common-denominator.html'},
 part:{title:'Смысл дроби: часть одного целого',path:'/trainers/oge-basics/fraction-meaning.html'},
 percent:{title:'Процент от числа и восстановление целого',path:'/trainers/oge-basics/percentages/percent-of-number-and-whole.html'},
 change:{title:'Процентное изменение и новая база',path:'/trainers/oge-basics/percentages/percent-change.html'},
 proportion:{title:'Пропорции и связь величин',path:'/trainers/oge-basics/percentages/proportion.html'},
 equations:{title:'Простые уравнения по шагам',path:'/trainers/simple-equations-stepwise.html'},
 powers:{title:'Степени и корни',path:'/trainers/oge-task8-powers-roots.html'},
 line:{title:'Отрицательные числа на прямой',path:'/trainers/oge-basics/negative-number-line.html'}
};
function numeric(s){const m=String(s).trim().replace('−','-').replace(',','.').match(/^([+-]?[\d.]+)(?:\s*\/\s*([+-]?[\d.]+))?$/);if(!m||m[2]!==undefined&&+m[2]===0)return null;const n=+m[1]/(m[2]===undefined?1:+m[2]);return Number.isFinite(n)?n:null;}
function recommend({id,value,expected}){
 const n=numeric(value);let key,why;
 if(Number.isFinite(expected)&&expected!==0&&n!==null&&Math.abs(n+expected)<1e-7){key='signs';why='Получился ответ с противоположным знаком. Возможно, стоит проверить действие со знаками.';}
 else if(/\/\s*[+-]?0(?:[.,]0*)?\s*$/.test(String(value))){key='part';why='У дроби не может быть нулевого знаменателя. Вспомним, что означает деление целого на части.';}
 else if(id==='percent'){key='change';why='На этом шаге важно, от какого числа считаются проценты: после изменения база может стать другой.';}
 else if(id==='choice'||id==='mixtures'){key='percent';why='Здесь помогает связь процента, части и целого. Проверь, какая величина принята за 100%.';}
 else if(['fractions','share','gardens'].includes(id)){key='fractions';why='Для этого шага нужны доли одного целого и действия с дробями. Можно отдельно потренировать общий знаменатель.';}
 else if(['joint','reverse','delay','leave'].includes(id)){key='part';why='Время на всю работу и доля работы за час — разные величины. Вспомним смысл единичной дроби.';}
 else if(['crew','minimum','ratio','motion','practical','scale'].includes(id)){key='proportion';why='Сначала установи, как связаны величины: увеличение одной не всегда увеличивает другую.';}
 else if(id==='equations'||id==='expressions'){key='equations';why='Если трудно выполнить преобразование, можно вернуться к простому уравнению и действию с обеими частями.';}
 else if(['powers','functions','triangle','circle','roundbody','pyramid'].includes(id)){key='powers';why='В этом шаге используются степени или корни. Проверь базовое действие отдельно от всей задачи.';}
 else if(id==='numberline'){key='line';why='Вспомним порядок чисел на прямой и положение отрицательных чисел.';}
 if(!key)return null;return {key,...skills[key],why};
}
function show(context){const hint=recommend(context);document.getElementById('ege-remediation')?.remove();if(!hint)return;
 const feedback=document.getElementById('feedback');if(!feedback)return;
 const box=document.createElement('aside');box.id='ege-remediation';box.className='callout';box.setAttribute('aria-label','Вспомнить нужный навык');
 const title=document.createElement('strong');title.textContent='Можно вернуться к основе';
 const text=document.createElement('p');text.textContent=hint.why;
 const link=document.createElement('a');link.className='btn';link.textContent=hint.title+' →';
 const origin=location.protocol==='file:'?'https://mathexam.space':location.origin;
 const url=new URL(hint.path,origin);url.searchParams.set('returnTo',location.protocol==='file:'?'/ege-baza/path/index.html#map':location.pathname+location.hash);link.href=url.href;
 const note=document.createElement('p');note.className='muted';note.textContent='Текущий шаг и ответ сохранены. В тренажёре есть кнопка возврата к этой задаче. Рекомендация — предположение о трудности, а не оценка твоих способностей.';
 box.append(title,text,link,note);feedback.after(box);
}
const api={skills,recommend,numeric,show};root.EgeRemediation=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
