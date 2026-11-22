/* Виленкин и соавторы, часть 2, §26, печатная с. 15. */
(function(root) {
  'use strict';
  const words={1:'одна',2:'две',3:'три',4:'четыре',5:'пять',7:'семь',8:'восемь',13:'тринадцать',15:'пятнадцать',75:'семьдесят пять'};
  const names={
    2:['вторая','вторых'],3:['третья','третьих'],4:['четвёртая','четвёртых'],5:['пятая','пятых'],8:['восьмая','восьмых'],10:['десятая','десятых'],13:['тринадцатая','тринадцатых'],
    49:['сорок девятая','сорок девятых'],100:['сотая','сотых'],347:['триста сорок седьмая','триста сорок седьмых'],1000:['тысячная','тысячных'],90000:['девяностотысячная','девяностотысячных']
  };
  const readSource=[[2,5],[3,4],[7,10],[3,13],[13,1000],[15,347],[75,90000]];
  const writeSource=[[4,8],[1,3],[1,2],[2,4],[8,10],[3,100],[13,49]];
  const practice=[[2,8],[4,5],[1,1000],[3,49],[5,13],[8,347],[13,90000],[15,1000],[75,1000],[4,10],[1,13],[7,100],[5,8],[2,3]];
  const lessons=[
    {number:'5.51',key:'printed-5-51',part:2,point:26,page:15,title:'Прочитай семь дробей и назови оба числа',explanation:'У дроби два сообщения. Верхнее число говорит, сколько долей взяли. Нижнее сообщает, на сколько равных долей разделили целое. При чтении длинного знаменателя его название стоит после числителя.',worked:['5/100 читается «пять сотых». Числитель равен 5, знаменатель равен 100.','У дроби 2/49 нижнее число читаем в составе названия: две сорок девятых.'],misconception:'Большее число в дроби всегда нужно читать первым.',reflect:'Почему при чтении знаменателя 347 только последнее слово становится порядковым?'},
    {number:'5.52',key:'printed-5-52',part:2,point:26,page:15,title:'Запиши дробь по словам',explanation:'Сначала назови доли, о которых речь, затем их количество. Сохрани именно те числитель и знаменатель, которые произнесены. Запиши их через дробную черту.',worked:['«Три восьмых» пишется 3/8.','У слов «половина» и «одна вторая» одна запись — 1/2.'],misconception:'При записи с голоса любые равные по величине дроби передают те же названные числа.',reflect:'Что общего у двух четвертей и половины? Чем различаются их записи по словам?'}
  ].map(x=>({...x,requires:['v5f-printed-5-45'],related:[]}));
  function spoken(n,d){return words[n]+' '+names[d][n===1?0:1];}
  function promptWords(n,d,short=false){
    if(short&&d===2&&n===1)return 'половина';
    if(short&&d===3&&n===1)return 'одна треть';
    if(short&&d===4&&n===2)return 'две четверти';
    return spoken(n,d);
  }
  const norm=v=>String(v).toLowerCase().replaceAll('ё','е').replace(/[.!,?«»]/gu,'').replace(/\s+/gu,' ').trim();
  function wordsAccepted(raw,n,d) {
    const options=[spoken(n,d),promptWords(n,d,true)];
    if(d===4&&n===3)options.push('три четверти');
    if(d===2&&n===1)options.push('одна половина');
    if(d===3&&n===1)options.push('треть');
    // The nominative plural is also used with два, три, четыре in independent readings.
    if([2,3,4].includes(n))options.push(spoken(n,d).replace(/(ых|их)$/u,(m)=>m==='ых'?'ые':'ие'));
    return options.some(v=>norm(v)===norm(raw));
  }
  function literal(v){
    const m=String(v).trim().match(/^(\d+)\s*[/⁄]\s*(\d+)$/u);
    if(!m)return null;
    const n=Number(m[1]),d=Number(m[2]);
    return Number.isSafeInteger(n)&&Number.isSafeInteger(d)&&d>0?[n,d]:null;
  }
  function build(number,seed,r,step) {
    const reading=number===51,source=reading?readSource:writeSource;
    const data=source.map(row=>row.slice());
    if(seed){const pool=practice.slice();for(let i=0;i<data.length;i++)data[i]=pool.splice(r(0,pool.length-1),1)[0];}
    const rows=[];
    for(const [i,[n,d]] of data.entries()){
      const letter='абвгдеж'[i],say=spoken(n,d),f=n+'/'+d;
      if(reading){
        rows.push({...step(letter+'. Посмотри на дробь '+f+'. Как её прочитать? Напиши словами.',say,'Начни с верхнего числа. Затем назови доли по знаменателю.',[]),answerFormat:'v5-spoken-fraction',languageRow:[n,d]});
        rows.push({...step('Назови для '+f+' числитель, затем знаменатель. Введи два числа через точку с запятой.',[n,d],'Первое число над чертой, второе под ней.',[{value:[d,n],text:'Числа нашлись, но перепутаны местами. Числитель находится над чертой.'}]),answerFormat:'v5-pair'});
      } else {
        const sayText=promptWords(n,d,!seed);
        rows.push({...step(letter+'. Услышь словами: «'+sayText+'». Запиши именно названную обыкновенную дробь через косую черту.',f,'В словах «'+sayText+'» сначала распознай число долей, затем название доли.',[{value:d+'/'+n,text:'Проверь верх и низ дроби. Какое число отвечает на вопрос «сколько взяли»?'}]),answerFormat:'v5-dictated-fraction',languageRow:[n,d]});
      }
    }
    const final=rows.pop();return {...final,steps:rows,inputPrompt:reading?'Числитель; знаменатель':'Дробь через черту',data:{languageRows:data,reading},conditionKey:'language/'+number+'/'+data.map(v=>v.join(':')).join('/')};
  }
  function card(row,reading,focus=-1,short=false){
    const [n,d]=row;
    if(!reading)return '<figure style="margin:.4em 0;padding:.75em;background:#ecf3ee"><figcaption>Слова для записи</figcaption><strong>'+promptWords(n,d,short)+'</strong></figure>';
    const letters=['числитель','знаменатель'];
    return '<figure style="display:flex;gap:.7em;align-items:center;margin:.4em 0;padding:.65em;background:#ecf3ee"><span role="img" aria-label="Дробь '+n+' делённое на '+d+'" style="display:inline-grid;text-align:center;font-size:1.3em"><b style="border-bottom:2px solid #294844;'+(focus===0?'background:#f7e0a1':'')+'">'+n+'</b><b style="'+(focus===1?'background:#f7e0a1':'')+'">'+d+'</b></span><figcaption>'+(focus<0?'Прочитай запись сверху вниз.':'Выделен '+letters[focus]+'.')+'</figcaption></figure>';
  }
  function draw(t,s){
    const i=s?.mode==='learn'?s.step:t.steps.length,index=t.data.reading?Math.floor(i/2):i;
    return card(t.data.languageRows[index],t.data.reading,-1,!!t.conditionKey.startsWith('language/52/')&&t.data.languageRows.every((a,j)=>a[0]===writeSource[j][0]&&a[1]===writeSource[j][1]));
  }
  function explore(t,s){
    const row=t.data.languageRows[s.row];return {title:'Какое число играет эту роль?',controls:[{key:'row',title:'Строка',values:t.data.languageRows.map((v,i)=>[i,'абвгдеж'[i]])},{key:'part',title:'Что найти',values:[[0,'Числитель'],[1,'Знаменатель']]}],visual:card(row,t.data.reading,s.part,true),question:s.part?'На сколько равных долей разделили целое?':'Сколько долей взяли?',answer:row[s.part],why:s.part?'Знаменатель даёт каждой доле название.':'Сколько взяли долей, показывает числитель.'};
  }
  function accepts(value,t){
    if(t.answerFormat==='v5-spoken-fraction')return wordsAccepted(value,...t.languageRow);
    const v=literal(value),answer=literal(t.answer);return !!v&&!!answer&&v[0]===answer[0]&&v[1]===answer[1];
  }
  const bounds={row:[0,6,0],part:[0,1,0]};
  const api={lessons,generators:{'5.51':(s,r,f)=>build(51,s,r,f),'5.52':(s,r,f)=>build(52,s,r,f)},bounds:{'5.51':bounds,'5.52':bounds},accepts,literal,draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5FractionLanguage=api;
})(typeof window!=='undefined'?window:globalThis);
