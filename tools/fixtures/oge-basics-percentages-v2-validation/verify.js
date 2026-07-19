const fs=require('fs');
const helpers=fs.readFileSync('helpers.js','utf8');
const FILES=['percent-meaning','percent-of-number-and-whole','percent-choose-question','percent-change','proportion','percent-final-checkpoint'];
function api(f){const c=fs.readFileSync('topics/'+f+'.js','utf8');
  return new Function(helpers+'\n'+c+'\nreturn {makeTask,SKILLS,LESSONS,CHECK_PLAN,TITLE,norm};')();}
const strip=s=>String(s).replace(/<br\s*\/?>/gi,' ').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const N=s=>Number(String(s).replace(',','.'));
const ok=(a,b)=>Math.abs(a-b)<1e-9;

const M=[
 [/Найдите 1% от числа (\d+)/,m=>N(m[1])/100],
 [/В городе (\d+) тысяч жителей\. Сколько тысяч составляет 1%/,m=>N(m[1])/100],
 [/Один процент от числа (\d+)/,m=>N(m[1])/100],
 [/Из (\d+) предметов выбрали (\d+)/,m=>N(m[2])/N(m[1])*100],
 [/В классе (\d+) учени\S+, на олимпиаду поехали (\d+)/,m=>N(m[2])/N(m[1])*100],
 [/Какую часть в процентах составляет (\d+) от (\d+)/,m=>N(m[1])/N(m[2])*100],
 [/^Найдите (\d+)% от числа (\d+)/,m=>N(m[2])*N(m[1])/100],
 [/Товар стоит (\d+) ₽\. Скидка (\d+)%/,m=>N(m[1])*N(m[2])/100],
 [/В городе (\d+) тысяч жителей, (\d+)% из них/,m=>N(m[1])*N(m[2])/100],
 [/(\d+)% некоторого числа равны ([\d,]+)/,m=>N(m[2])*100/N(m[1])],
 [/Скидка составила (\d+)%, то есть ([\d,]+) ₽/,m=>N(m[2])*100/N(m[1])],
 [/Известно, что ([\d,]+) — это (\d+)% от задуманного/,m=>N(m[1])*100/N(m[2])],
 [/Сколько процентов составляет ([\d,]+) от ([\d,]+)/,m=>N(m[1])/N(m[2])*100],
 [/В зале ([\d,]+) мест, занято ([\d,]+)/,m=>N(m[2])/N(m[1])*100],
 [/Число ([\d,]+) — какую часть числа ([\d,]+)/,m=>N(m[1])/N(m[2])*100],
 [/Число (\d+) (увеличили|уменьшили) на (\d+)%\. Найдите результат/,m=>N(m[1])*(100+(m[2]==='увеличили'?1:-1)*N(m[3]))/100],
 [/Цена ([\d,]+) ₽ (выросла|снизилась) на (\d+)%\. Какой она стала/,m=>N(m[1])*(100+(m[2]==='выросла'?1:-1)*N(m[3]))/100],
 [/Величина была равна (\d+) и изменилась на (\+|−)(\d+)%/,m=>N(m[1])*(100+(m[2]==='+'?1:-1)*N(m[3]))/100],
 [/Значение изменилось с ([\d,]+) до ([\d,]+)/,m=>Math.abs(N(m[2])-N(m[1]))/N(m[1])*100],
 [/Цена была ([\d,]+) ₽, стала ([\d,]+) ₽/,m=>Math.abs(N(m[2])-N(m[1]))/N(m[1])*100],
 [/Показатель (?:вырос|упал) с ([\d,]+) до ([\d,]+)/,m=>Math.abs(N(m[2])-N(m[1]))/N(m[1])*100],
 [/Новое значение составляет (\d+)% от старого/,m=>Math.abs(N(m[1])-100)],
 [/Величина (выросла|уменьшилась) на (\d+)%\. Сколько процентов/,m=>100+(m[1]==='выросла'?1:-1)*N(m[2])],
 [/Число (\d+) сначала (увеличили|уменьшили) на (\d+)%, затем результат (увеличили|уменьшили) на (\d+)%/,
   m=>N(m[1])*(100+(m[2]==='увеличили'?1:-1)*N(m[3]))/100*(100+(m[4]==='увеличили'?1:-1)*N(m[5]))/100],
 [/пропорции: x : (\d+) = (\d+) : (\d+)/,m=>N(m[1])*N(m[2])/N(m[3])],
 [/пропорции: (\d+) : x = (\d+) : (\d+)/,m=>N(m[1])*N(m[3])/N(m[2])],
 [/пропорции: (\d+) : (\d+) = x : (\d+)/,m=>N(m[1])*N(m[3])/N(m[2])],
 [/пропорции: (\d+) : (\d+) = (\d+) : x/,m=>N(m[2])*N(m[3])/N(m[1])],
 [/Составьте пропорцию и найдите (\d+)% от числа (\d+)/,m=>N(m[2])*N(m[1])/100],
 [/Составьте пропорцию и найдите число, если (\d+)% его равны ([\d,]+)/,m=>N(m[2])*100/N(m[1])],
 [/Составьте пропорцию и найдите, сколько процентов составляет ([\d,]+) от ([\d,]+)/,m=>N(m[1])/N(m[2])*100],
 [/По схеме .*найдите (\d+)% от (\d+)/,m=>N(m[2])*N(m[1])/100],
];

let tot=0,issues=new Map();
const flag=(f,k,msg)=>{const key=f+'|'+k+'|'+msg.replace(/\d+/g,'#');
  if(!issues.has(key))issues.set(key,{n:0,s:f+' · '+k+' — '+msg});issues.get(key).n++};

for(const f of FILES){
 const {makeTask,SKILLS,LESSONS,CHECK_PLAN,norm}=api(f);
 Object.keys(CHECK_PLAN.reduce((a,k)=>(a[k]=1,a),{})).forEach(k=>{if(!SKILLS[k])flag(f,k,'навык из CHECK_PLAN отсутствует в SKILLS')});
 for(const k of Object.keys(SKILLS)){
  for(let i=0;i<12000;i++){
   tot++;const t=norm(makeTask(k));const p=strip(t.prompt);
   if(t.type==='choice'){
    const os=t.options.map(strip);
    if(new Set(os).size!==os.length)flag(f,k,'повторяющиеся варианты ответа');
    if(!(t.answer>=0&&t.answer<os.length))flag(f,k,'индекс верного ответа вне диапазона');
    const w=t.wrong||{};
    for(let j=0;j<os.length;j++){if(j!==t.answer&&!w[j])flag(f,k,'у неверного варианта нет объяснения');
                                 if(j===t.answer&&w[j])flag(f,k,'у верного варианта есть объяснение ошибки')}
   }else{
    if(!Number.isFinite(t.answer))flag(f,k,'ответ не число');
    if(/\.\d{5,}/.test(String(t.answer)))flag(f,k,'артефакт плавающей точки в ответе: '+t.answer);
    const tr=t.traps||[];
    if(tr.some(x=>ok(x.v,t.answer)))flag(f,k,'ловушка совпадает с верным ответом');
    if(new Set(tr.map(x=>x.v)).size!==tr.length)flag(f,k,'две ловушки с одинаковым значением');
    const hit=M.find(([re])=>re.test(p));
    if(!hit)flag(f,k,'ФОРМА не разобрана: '+p.slice(0,72));
    else{const want=hit[1](hit[0].exec(p));
     if(!ok(Math.round(want*1e6)/1e6,Math.round(t.answer*1e6)/1e6))
      flag(f,k,'ответ '+t.answer+' вместо '+Math.round(want*1e6)/1e6+' — '+p.slice(0,60))}
   }
   if(!t.hint1||!t.hint2||!t.solution)flag(f,k,'нет подсказки или разбора');
  }
 }
 for(const L of LESSONS){const q=norm(L.question());
  if(q.type==='choice'&&new Set(q.options.map(strip)).size!==q.options.length)flag(f,'урок','повторы в вариантах');
  if(!L.success||!L.error)flag(f,'урок','нет текста реакции');}
 console.log('  '+(f+'                                   ').slice(0,36)+'навыков: '+Object.keys(SKILLS).length+', уроков: '+LESSONS.length+', в проверке: '+CHECK_PLAN.length);
}
console.log('\n  сгенерировано и проверено задач:',tot);
const bad=[...issues.values()].sort((a,b)=>b.n-a.n);
if(!bad.length)console.log('  замечаний нет');
else bad.slice(0,14).forEach(b=>console.log('  ['+b.n+'x] '+b.s));
