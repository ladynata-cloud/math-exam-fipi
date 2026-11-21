/* Устное чтение шести печатных дробей, Виленкин, 2023, часть 2, §26, с. 14, №5.45. */
(function(root){
  'use strict';
  const lesson={number:'5.45',key:'printed-5-45',part:2,point:26,page:14,title:'Прочитай дробь вместе с названием целого',requires:['v5f-printed-5-40'],related:[],explanation:'Прочитай сначала верхнее число, затем назови доли по нижнему. Заверши названием целого. Скажи запись вслух, затем введи её словами, чтобы проверить себя.',
    worked:['1/5 ленты — одна пятая ленты.','2/5 ленты — две пятых ленты.','У некоторых долей есть короткое название. Например, половина — это одна вторая, треть — одна третья.'],
    misconception:'Если внизу записана восьмёрка, дробь нужно читать с числа «восемь».',reflect:'Как в словах меняется чтение, если вместо одной доли взять две?'}; 
  const names={2:['вторая','вторую','вторых','половина','половину'],3:['третья','третью','третьих','треть','треть'],4:['четвертая','четвертую','четвертых','четверть','четверть'],5:['пятая','пятую','пятых'],8:['восьмая','восьмую','восьмых'],10:['десятая','десятую','десятых'],24:['двадцать четвертая','двадцать четвертую','двадцать четвертых'],1000:['тысячная','тысячную','тысячных']};
  const nouns=['квадрата','тонны','суток','огорода','арбуза','круга'],nums=['','одна','две','три'],printed=[8,1000,24,2,4,3];
  const clean=v=>String(v).toLowerCase().replaceAll('ё','е').replace(/[.,!?:;«»"]/gu,' ').replace(/\s+/gu,' ').trim();
  function forms(n,d,o){
    const [nom,acc,plural,shortNom,shortAcc]=names[d],noun=nouns[o];
    const head=n===1?['одна '+nom,'одну '+acc,...(shortNom?[shortNom,shortAcc,'одна '+shortNom,'одну '+shortAcc]:[])]:[nums[n]+' '+plural];
    const withPart=n===1?['одна '+nom+' часть','одну '+acc+' часть',nom+' часть',acc+' часть']:[nums[n]+' '+plural+' части'];
    return [...new Set(head.concat(withPart).map(x=>x+' '+noun))];
  }
  function row(seed,r){
    if(!seed)return printed.map((d,i)=>[1,d,i]);
    const den=[3,4,5,8,10,24,1000];return nouns.map((_,i)=>{const d=den[r(0,den.length-1)];return [i===0?2:r(1,Math.min(3,d-1)),d,i];});
  }
  function generate(seed,r,step){
    const rows=row(seed,r);
    const parts=rows.map(([n,d,o],i)=>{const allowed=forms(n,d,o),word=allowed[0].replaceAll('четверт','четвёрт');
      const inverse=names[d][0],wrongItem=n===1?'две '+names[d][2]+' '+nouns[o]:'одна '+inverse+' '+nouns[o];
      return {...step('абвгде'[i]+'. Как прочитать '+n+'/'+d+' '+nouns[o]+'? Произнеси вслух, затем введи словами вместе с названием целого.',word,'Числитель '+n+' называет количество долей. Знаменатель '+d+' даёт их название.',[{value:wrongItem,text:'Проверь верхнее число: оно показывает, сколько именно долей взяли.'}]),answerFormat:'v5-fraction-reading',clarifications:n===1&&d===24&&o===2?[{value:'час',text:'Ты верно перевёл эту долю суток в часы. Здесь просят произнести саму дробь словами.'}]:n===1&&d===1000&&o===1?[{value:'килограмм',text:'Это верный перевод массы. Для чтения дроби произнеси числитель и название доли.'}]:[]};});
    const last=parts.pop();return {...last,steps:parts,inputPrompt:'Запись словами',why:'Для последней строки подходит «'+last.answer+'».',data:{fractionReadings:rows},conditionKey:'read-fractions/'+rows.join('/')};
  }
  const ways=new Map();
  for(const text of Object.keys(names)){const d=Number(text);for(let n=1;n<=Math.min(3,d-1);n++)for(let o=0;o<nouns.length;o++){const all=forms(n,d,o);ways.set(all[0],new Set(all));}}
  function accepts(raw,canonical){return ways.get(clean(canonical))?.has(clean(raw))||false;}
  function fraction(n,d,o){
    return '<figure style="margin:.4em 0;padding:.65em;background:#eaf3ef;display:flex;align-items:center;gap:.6em"><span role="img" aria-label="'+n+' делится на '+d+'" style="display:inline-grid;text-align:center;font-size:1.3em;font-weight:bold"><span style="border-bottom:2px solid #28565b">'+n+'</span><span>'+d+'</span></span><figcaption>'+nouns[o]+'</figcaption></figure>';
  }
  function draw(t,s){const i=s?.mode==='learn'?s.step:t.steps.length;return fraction(...t.data.fractionReadings[i]);}
  function explore(t,s){const v=t.data.fractionReadings[s.row],n=v[0],d=v[1];return {title:'Какую часть записи ты читаешь?',controls:[{key:'row',title:'Запись',values:nouns.map((name,i)=>[i,name])},{key:'part',title:'Смысл числа',values:[[0,'Сколько долей взяли'],[1,'На сколько равных долей делили']]}],visual:fraction(...v),question:s.part?'Сколько таких равных долей в целом?':'Сколько долей взято?',answer:s.part?d:n,why:s.part?'Знаменатель под чертой задаёт вид долей.':'Числитель над чертой считает, сколько долей взяли.'};}
  const api={lesson,generate,accepts,draw,explore,bounds:{row:[0,5,0],part:[0,1,0]}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5FractionReading=api;
})(typeof window!=='undefined'?window:globalThis);
