/* Vilenkin 5, revised 2023 edition, part 1, exercise 1.8, printed p. 10. */
(function (root) {
  'use strict';
  const lesson = {
    number:'1.8', key:'printed-1-8', page:10, title:'Как менялась погода с 1 по 15 сентября?',
    explanation:'Записывай погоду каждый день с 1 по 15 сентября. Отметь небо, осадки и температуру в одно выбранное время. Из записей получится частотная таблица. Один день может попасть сразу в несколько столбцов.',
    worked:['В учебном примере были дождливые дни с температурой 8 °C и 12 °C. Первый день холодный, второй тёплый.','Одного дождливого дня с температурой 12 °C достаточно, чтобы опровергнуть вывод «все дождливые дни холодные».','При температуре ровно 10 °C день не попадает ни в группу «ниже 10», ни в группу «выше 10».'],
    misconception:'Если в день наблюдали дождь, его обязательно надо записать в холодные дни.',
    reflect:'Как показать по своей таблице, что утверждение обо всех днях неверно?'
  };
  const names = ['Солнечные','Пасмурные','Дождливые','Холоднее 10 °C','Теплее 10 °C'];
  const skies = ['Переменная облачность','Солнечно','Пасмурно'];
  const keys = Array.from({length:15},(_,i)=>'day'+String.fromCharCode(97+i));
  const prompts = [
    'а. У каких групп наибольшая частота? Введи все коды через точку с запятой. 1 — солнечные, 2 — пасмурные, 3 — дождливые, 4 — холодные, 5 — тёплые.',
    'б. Сравни солнечные и пасмурные дни. Введи 1, если солнечных больше, 2, если пасмурных больше, или 0 при равенстве.',
    'в. Сколько дней были холодными по правилу этого наблюдения?',
    'г. Все ли дождливые дни были холодными? Введи 1 — да, 0 — нашёл исключение или 2 — таких дождливых дней не наблюдали.',
    'д. Все ли солнечные дни были тёплыми? Введи 1 — да, 0 — нашёл исключение или 2 — таких солнечных дней не наблюдали.'
  ];
  const hints = [
    'Сравни все пять частот. При равенстве максимальных частот укажи каждую группу с этим числом.',
    'Сравни только числа дней в двух строках «Солнечные» и «Пасмурные».',
    'Считай температуру строго ниже 10 °C. День с ровно 10 °C не входит в эту группу.',
    'Посмотри только дни с дождём. Ищи среди них хотя бы один день с температурой 10 °C или выше.',
    'Посмотри только солнечные дни. Ищи среди них хотя бы один день с температурой 10 °C или ниже.'
  ];
  const code = (sky,rain,temp) => 1+(Math.round(temp*10)+1000)*6+sky*2+Number(rain);
  function record(n) {
    if(!n)return null;
    const v=n-1;
    return {sky:Math.floor(v%6/2), rain:Boolean(v%2), temp:(Math.floor(v/6)-1000)/10};
  }
  function analyze(codes) {
    const rows=codes.filter(Boolean).map(record);
    const counts=[rows.filter(d=>d.sky===1).length,rows.filter(d=>d.sky===2).length,rows.filter(d=>d.rain).length,rows.filter(d=>d.temp<10).length,rows.filter(d=>d.temp>10).length];
    const highest=Math.max(...counts),winners=counts.flatMap((n,i)=>n===highest?[i+1]:[]);
    const all=(group,test)=>!group.length?2:group.every(test)?1:0;
    return {days:rows.length,counts,answers:[winners,counts[0]===counts[1]?0:counts[0]>counts[1]?1:2,counts[3],all(rows.filter(d=>d.rain),d=>d.temp<10),all(rows.filter(d=>d.sky===1),d=>d.temp>10)]};
  }
  function sample(seed,random) {
    if(!seed) {
      const temperatures=[8,13,10,9,14,11,7,10,12,6,10,14,15,8,7];
      return temperatures.map((temp,i)=>code([2,1,0,2,1,1,2,1,0,2,0,1,1,2,0][i],[0,3,6,8,9,13].includes(i),temp));
    }
    return keys.map(()=>code(random(0,2),random(0,1),random(5,16)));
  }
  const degree=n=>String(n).replace('.',',')+' °C';
  function describe(n) {
    const d=record(n);
    return d?skies[d.sky]+', '+(d.rain?'был дождь':'без дождя')+', '+degree(d.temp):'ещё нет записи';
  }
  function generate(seed,random,step) {
    const observations=sample(seed,random),stats=analyze(observations);
    const steps=prompts.map((p,i)=>Object.assign(step(p,stats.answers[i],hints[i]),i===0?{answerFormat:'unordered'}:{}));
    const prompt='Посчитай, к каким группам относится больше всего дней в приведённых учебных записях. Введи все коды этих групп через точку с запятой. Коды: 1 — солнечные, 2 — пасмурные, 3 — дождливые, 4 — холодные, 5 — тёплые.';
    return {prefix:seed?'Новые вымышленные наблюдения для тренировки. ':'Вымышленные наблюдения для разбора. ',prompt,inputPrompt:'Коды всех самых частых групп',answer:stats.answers[0],answerFormat:'unordered',steps,errors:[],table:{caption:'Учебные наблюдения. Для собственных записей используй дневник выше.',headers:['Сентябрь','Условия в выбранное время'],rows:observations.map((n,i)=>[i+1,describe(n)]),columnWidths:[28,72]},data:{observations},conditionKey:observations.join(',')};
  }
  function defaults() {
    return {...Object.fromEntries(keys.map(k=>[k,0])),day:1,sky:0,rain:false,temp:'',question:0,response:'',verdict:0,helped:false,corrected:false};
  }
  const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
  function validate(s) {
    if(keys.some(k=>!integer(s[k],0,10206))||!integer(s.day,1,15)||!integer(s.sky,0,2)||typeof s.rain!=='boolean'||typeof s.temp!=='string'||s.temp.length>8||!integer(s.question,0,4)||typeof s.response!=='string'||s.response.length>40||!integer(s.verdict,0,2)||typeof s.helped!=='boolean'||typeof s.corrected!=='boolean')throw new TypeError('Invalid weather diary');
    return s;
  }
  function parseTemp(value) {
    const raw=String(value).trim().replace('−','-').replace(',','.');
    if(!/^[+-]?\d{1,3}(?:\.\d)?$/.test(raw))return null;
    const n=Number(raw);
    return n>=-100&&n<=70?n:null;
  }
  function mount(host,{state,onChange}) {
    let s={...state};
    const select=(selector)=>host.querySelector(selector);
    const publish=()=>onChange?.({...s});
    const clearReview=()=>Object.assign(s,{response:'',verdict:0,helped:false,corrected:false});
    const options=(items,current)=>items.map(([k,title])=>'<option value="'+k+'"'+(k===current?' selected':'')+'>'+title+'</option>').join('');
    function draw() {
      const values=keys.map(k=>s[k]),stats=analyze(values),complete=stats.days===15;
      const field='data-v5-weather-';
      const frequencies=names.map((name,i)=>'<tr><th scope="row">'+(i+1)+'. '+name+'</th><td>'+stats.counts[i]+'</td></tr>').join('');
      const entries=values.map((n,i)=>'<tr><th scope="row">'+(i+1)+'</th><td>'+describe(n)+'</td></tr>').join('');
      host.innerHTML='<section class="v5q-model"><h2>Мой дневник погоды</h2><p>С 1 по 15 сентября отмечай свои наблюдения в одно и то же время. Дождь отмечай отдельно от вида неба. Можно вернуться к любому дню и поправить запись.</p>'+
        '<form '+field+'form><label>Число сентября <select '+field+'day>'+options(keys.map((k,i)=>[i+1,(i+1)+' сентября']),s.day)+'</select></label>'+
        '<label>Небо <select '+field+'sky>'+options(skies.map((v,i)=>[i,v]),s.sky)+'</select></label>'+
        '<label><input type="checkbox" '+field+'rain'+(s.rain?' checked':'')+'> Был дождь</label>'+
        '<label>Температура, °C <input '+field+'temp inputmode="text" maxlength="8" placeholder="Например, 9,5"></label><button type="submit">Записать этот день</button><p role="status" '+field+'note></p></form>'+
        '<h3>Таблица частот</h3><p>Заполнено '+stats.days+' из 15 дней. '+(complete?'Можно отвечать на вопросы.':'Пока это промежуточные частоты.')+'</p>'+
        '<table class="v5q-place-table"><thead><tr><th scope="col">Группа</th><th scope="col">Дней</th></tr></thead><tbody>'+frequencies+'</tbody></table>'+
        '<details><summary>Посмотреть записи за 15 дней</summary><table class="v5q-place-table"><thead><tr><th scope="col">Сентябрь</th><th scope="col">Мои наблюдения</th></tr></thead><tbody>'+entries+'</tbody></table></details>'+
        (complete?'<h3>Выводы по моим наблюдениям</h3><form '+field+'review><label>Выбери вопрос <select '+field+'question>'+options(prompts.map((p,i)=>[i,p.slice(0,2)+' '+['Самые частые группы','Солнечные и пасмурные','Холодные дни','Дождь и холод','Солнце и тепло'][i]]),s.question)+'</select></label><label>'+prompts[s.question]+' <input '+field+'response autocomplete="off" maxlength="40"></label><button>Проверить вывод</button> <button type="button" class="quiet" '+field+'hint>Нужна подсказка</button><p role="status" '+field+'result></p></form>':'')+'</section>';
      const day=select('['+field+'day]'),sky=select('['+field+'sky]'),rain=select('['+field+'rain]'),temp=select('['+field+'temp]'),note=select('['+field+'note]');
      temp.value=s.temp;
      day.onchange=()=>{s.day=Number(day.value);const d=record(s[keys[s.day-1]]);s.sky=d?.sky??0;s.rain=d?.rain??false;s.temp=d?String(d.temp).replace('.',','):'';publish();draw();select('['+field+'day]').focus();};
      sky.onchange=()=>{s.sky=Number(sky.value);publish();};rain.onchange=()=>{s.rain=rain.checked;publish();};temp.oninput=()=>{s.temp=temp.value.slice(0,8);publish();};
      select('['+field+'form]').onsubmit=e=>{
        e.preventDefault();const n=parseTemp(s.temp);
        if(n===null){note.textContent='Запиши температуру от −100 до +70 °C с точностью до десятых. Дату пока не записали.';temp.focus();return;}
        const key=keys[s.day-1],entry=code(s.sky,s.rain,n);
        if(s[key]!==entry)clearReview();
        s[key]=entry;publish();draw();select('['+field+'note]').textContent='Запись за '+s.day+' сентября сохранена.';
      };
      if(!complete)return;
      const q=select('['+field+'question]'),response=select('['+field+'response]'),result=select('['+field+'result]');
      response.value=s.response;q.onchange=()=>{s.question=Number(q.value);clearReview();publish();draw();select('['+field+'question]').focus();};
      const feedback=()=>{result.textContent=s.verdict===2?(s.helped?'Верно после подсказки.':s.corrected?'Верно после исправления.':'Верно по твоим записям.'):(s.verdict===1?'Проверь свой вывод. ':'')+((s.helped||s.verdict===1)?hints[s.question]:'');};feedback();
      response.oninput=()=>{s.response=response.value.slice(0,40);s.verdict=0;publish();feedback();};
      select('['+field+'review]').onsubmit=e=>{e.preventDefault();if(!s.response.trim()){result.textContent='Сначала запиши свой вывод.';return;}s.verdict=root.WorkshopMath.accepts(s.response,{v6Full:true,answer:stats.answers[s.question],answerFormat:s.question===0?'unordered':''})?2:1;if(s.verdict===1)s.corrected=true;publish();feedback();};
      select('['+field+'hint]').onclick=()=>{s.helped=true;publish();feedback();};
    }
    draw();return ()=>host.replaceChildren();
  }
  const api={lesson,generate,defaults,validate,mount,analyze,code,record,parseTemp};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5WeatherDiary=api;
})(typeof window!=='undefined'?window:globalThis);
