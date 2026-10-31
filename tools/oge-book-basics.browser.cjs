'use strict';
// Learner scenarios for the actual OGE book URL set. All answers are computed
// from rendered questions and tables; no trainer state/check functions are used.
// Seeded randomness is a fixture for reproducibility, not completion evidence.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const PREFIX = (process.env.BOOK_PREFIX || '').replace(/\/$/, '');
const WIDTHS = (process.env.BOOK_BASICS_WIDTHS || '320,390,1280').split(',').map(Number);
const OUTPUT = path.resolve(process.env.BOOK_BASICS_OUTPUT || path.join(ROOT, 'artifacts/book-audit-basics', PREFIX ? 'frozen' : 'source'));
const MATCH = process.env.BOOK_BASICS_MATCH || '';
const SEED_OVERRIDE = process.env.BOOK_BASICS_SEED;
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/oge-book-edition/urls.json'), 'utf8'));
const ROUTES = MAP.map(row => ({id:row.id,route:new URL(row.sourceUrl).pathname})).filter(row =>
  (row.route.includes('/trainers/oge-basics/') || row.route === '/' || row.route === '/trainers/oge-course/') && (!MATCH || row.route.includes(MATCH)));
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const REQUIRED = ['start','wrong-answer','hints','correct-answer','next-example','finish','saved-result','topic','layout'];
const reports = [];
const TOPICS = {
  'decimal-add-subtract.html':'Десятичные дроби: сложение и вычитание',
  'fraction-common-denominator.html':'общий знаменатель', 'fraction-meaning.html':'Дробь: часть',
  'multiplication-division.html':'Умножение и деление',
  'column-multiplication-one-digit.html':'Умножение столбиком на одну цифру',
  'column-multiplication-two-digit.html':'Умножение столбиком на двузначное',
  'decimal-division-natural.html':'Десятичная дробь ÷ натуральное',
  'decimal-divisor-shift.html':'Десятичная дробь ÷ десятичную',
  'division-append-zeros.html':'дописываем нули','division-with-remainder.html':'Деление с остатком',
  'long-division-from-simple-to-decimals.html':'Деление уголком',
  'long-division-mixed-checkpoint.html':'Смешанная проверка: деление уголком',
  'long-division-one-digit.html':'Деление уголком на одну цифру',
  'long-division-quotient-digit.html':'Цифра частного',
  'long-division-two-digit.html':'двузначный делитель',
  'long-division-with-remainder.html':'Деление уголком с остатком',
  'long-division-zero-in-quotient.html':'Нули в частном',
  'multiplication-ladder.html':'лесенка','multiplication-meaning.html':'Умножение: смысл',
  'multiplication-mixed.html':'Таблица умножения вперемешку',
  'multiplication-pythagoras-table.html':'Таблица Пифагора','multiplication-tricks.html':'Таблица умножения: понятные приёмы',
  'tabular-division.html':'Табличное деление','negative-add-subtract.html':'Отрицательные числа: сложение и вычитание',
  'negative-number-line.html':'Отрицательные числа на прямой','order-of-operations.html':'Порядок действий',
  'percent-change.html':'Увеличение, уменьшение и изменение','percent-choose-question.html':'Что спрашивают в задаче',
  'percent-final-checkpoint.html':'Итоговая проверка по процентам','percent-meaning.html':'100%, 1% и доля',
  'percent-of-number-and-whole.html':'Три вопроса о проценте','proportion.html':'Пропорция',
  'rounding.html':'Округление','units-area.html':'Квадратные единицы','units-length-time.html':'Единицы длины и времени'
};
let origin;
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://fixture').pathname);
    let file = path.resolve(ROOT, '.' + pathname);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const bytes=fs.readFileSync(file);
    res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
    res.setHeader('X-Book-Audit-SHA256',createHash('sha256').update(bytes).digest('hex'));
    res.end(bytes);
  } catch (_) { res.writeHead(404).end(); }
});
class OracleUnsupported extends Error {}
const clean = text => String(text).replace(/\u2212/g,'-').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const nums = text => (clean(text).match(/-?\d+(?:[,.]\d+)?/g) || []).map(v => Number(v.replace(',','.')));
const number = v => Number(String(v).replace(',','.'));
const round = v => Math.round((v + Number.EPSILON) * 1e9) / 1e9;
const gcd = (a,b) => b ? gcd(b,a % b) : Math.abs(a);
const fraction = (n,d) => {const g = gcd(n,d); return (n/g)+'/'+(d/g);};
function arithmetic(text) {
  const expr = clean(text).replaceAll(',','.').replace(/[·×]/g,'*').replaceAll(':','/').replace(/\s/g,'');
  if (!/^[\d.+*/()\-]+$/.test(expr)) throw new OracleUnsupported('Unrecognized arithmetic expression: '+text);
  const tokens = expr.match(/\d+(?:\.\d+)?|[()+*/-]/g);let i=0;
  function atom(){if(tokens[i]==='-'){i++;return -atom();}if(tokens[i]==='+'){i++;return atom();}if(tokens[i]==='('){i++;const n=sum();if(tokens[i++]!==')')throw Error('Unbalanced math');return n;}return Number(tokens[i++]);}
  function product(){let v=atom();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],r=atom();v=op==='*'?v*r:v/r;}return v;}
  function sum(){let v=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],r=product();v=op==='+'?v+r:v-r;}return v;}
  const value=sum();if(i!==tokens.length||!Number.isFinite(value))throw new OracleUnsupported('Invalid visible expression: '+text);return round(value);
}
function check(rec, action, condition, detail = {}) {
  const row={...detail,action,status:condition?'PASS':'FAIL'};rec.actions.push(row);return condition;
}
function note(rec, action, status, detail) {rec.actions.push({action,status,...detail});}
async function observed(locator) {return clean(await locator.innerText());}
async function layout(page,rec,state) {
  const dimensions=await page.evaluate(() => ({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
    bodyWidth:document.body.scrollWidth,mainCount:document.querySelectorAll('main').length,
    overflowElements:document.documentElement.scrollWidth<=innerWidth+1?[]:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).slice(0,15).map(el=>({tag:el.tagName,id:el.id,class:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width}))}));
  check(rec,'layout',dimensions.scrollWidth<=dimensions.viewport+1,{state,...dimensions});
}
async function usable(locator,rec,label) {
  if(!await locator.isVisible()){check(rec,'controls',false,{label,reason:'Control is not visible'});return;}
  await locator.scrollIntoViewIfNeeded();
  const r=await locator.evaluate(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return {width:r.width,height:r.height,left:r.left,right:r.right,viewport:innerWidth,hit:top===el||el.contains(top)}});
  check(rec,'controls',r.width>=24&&r.height>=24&&r.left>=-1&&r.right<=r.viewport+1&&r.hit,{label,...r});
}
async function menu(page,route,percent=false) {
  const details=page.locator('details.bs-navigation');
  if(await details.count() && !await details.getAttribute('open')) await details.locator('summary').click();
  const selector=percent?'[data-nav="'+route+'"]:visible,[data-go="'+route+'"]:visible':'[data-route="'+route+'"]:visible';
  await page.locator(selector).first().click();
}
async function snapshotStorage(page) {
  return page.evaluate(()=>Object.fromEntries(Object.entries(localStorage).filter(([k])=>/mathExamBasics|ogeBasics|oge-basics|book:|book\./i.test(k))));
}
async function solveBasic(prompt,answers) {
  const p=clean(await prompt.innerText());
  const values=nums(p);
  const options=await answers.locator('button.choice').allTextContents();
  const choose = predicate => {const index=options.findIndex(x=>predicate(clean(x)));if(index<0)throw new OracleUnsupported('No matching visible choice: '+p);return {choice:index,prompt:p,options,expected:clean(options[index])};};
  let answer;
  if(options.length){
    if(/всех равных частей/.test(p))return choose(x=>number(x)===values[1]);
    if(/Какая дробь больше/.test(p)) {const ratios=options.map(x=>arithmetic(x));const max=Math.max(...ratios);return choose(x=>arithmetic(x)===max);}
    if(/Какое число больше/.test(p)){
      if(values[0]===values[1])throw Error('The displayed comparison asks for a larger number but both numbers are equal: '+p);
      return choose(x=>number(x)===Math.max(...values));
    }
    if(/Какие записи дают/.test(p))return choose(x=>x.includes('·')&&x.includes(' и '));
    if(/проверка верна|Как проверить/.test(p))return choose(x=>/[·×]/.test(x));
    throw new OracleUnsupported('Unsupported visible choices: '+p);
  }
  if(/выделенной клетке/.test(p)) {
    answer=await prompt.locator('table').evaluate(table=>{const rows=[...table.rows];for(let y=1;y<rows.length;y++)for(let z=1;z<rows[y].cells.length;z++)if(rows[y].cells[z].textContent.trim()==='?')return Number(rows[y].cells[0].textContent)*Number(rows[0].cells[z].textContent);return null;});
  } else if(/наименьший общий знаменатель/.test(p)) {answer=values[1]*values[3]/gcd(values[1],values[3]);}
  else if(/^Приведите/.test(p)) answer=values[0]*values[2]/values[1];
  else if(/^Сократите/.test(p)) answer=fraction(values[0],values[1]);
  else if(/^Заполните пропуск/.test(p)) answer=values[0]*values[2]/values[1];
  else if(/Вычислите и сократите/.test(p)) answer=fraction(values[0]*values[3]+values[2]*values[1],values[1]*values[3]);
  else if(/неполное частное|цифру частного/i.test(p)) answer=Math.floor(values[0]/values[1]);
  else if(/^Найдите остаток/.test(p)) answer=values[0]%values[1];
  else if(/противоположное/.test(p)) answer=-values[0];
  else if(p.includes('|')) answer=Math.abs(values[0]);
  else if(/^Старт /.test(p)) answer=values[0]+(/вправо/.test(p)?1:-1)*values[1];
  else if(/^Округлите/.test(p)){const unit=/десятков/.test(p)?10:/сотен/.test(p)?100:/десятых/.test(p)?.1:/сотых/.test(p)?.01:null;if(unit===null)throw new OracleUnsupported(p);answer=round(Math.floor(values[0]/unit+0.5+1e-9)*unit);}
  else if(/упаковок купить/.test(p)) answer=Math.ceil(values[0]);
  else if(/^Переведите/.test(p)){const m=p.match(/Переведите\s+([\d,.]+)\s+(см²|м²|км|см|м|ч)\s+в\s+(.+?)[.]*$/);if(!m)throw new OracleUnsupported(p);const scale={'м²':10000,'см²':1,'км':100000,'м':100,'см':1,'ч':60,'мин':1};const dest=/сантиметр|^см/.test(m[3])?(m[2].includes('²')?'см²':'см'):/^м²/.test(m[3])?'м²':/^метр|^м\.?$/.test(m[3])?'м':/^минут/.test(m[3])?'мин':null;if(!dest)throw new OracleUnsupported(p);answer=round(number(m[1])*scale[m[2]]/scale[dest]);}
  else if(/^Стороны прямоугольника/.test(p))answer=values[0]*values[1]/100;
  else if(/групп|ряд/.test(p)&&/Сколько/.test(p))answer=values[0]*values[1];
  else if(/^Известно:/.test(p))answer=values[3]*values[4];
  else if(/частное, остаток/.test(p))answer=Math.floor(values[0]/values[1])+', '+(values[0]%values[1]);
  else {
    const strong=await prompt.locator('strong').allTextContents();let expr=clean(strong[0]||p.replace(/^Вычислите:?\s*/,''));
    if(expr.includes('?')){
      const terms=nums(expr);if(/\?\s*[·×]/.test(expr)||/[·×]\s*\?/.test(expr))answer=terms[1]/terms[0];
      else if(/:\s*\?/.test(expr))answer=terms[0]/terms[1];
      else if(/=\s*\?/.test(expr))answer=arithmetic(expr.split('=')[0]);
      else throw new OracleUnsupported(p);
    }else answer=arithmetic(expr.replace(/\.$/,''));
  }
  if(answer===null||answer===undefined||!Number.isFinite(Number(String(answer).replace(',','.')))&&!String(answer).includes('/')&&!String(answer).includes(', '))throw new OracleUnsupported('No independent answer: '+p);
  return {answer:String(answer),expected:String(answer),prompt:p,options};
}
async function fillBasic(answers,plan,wrong=false) {
  if(plan.choice!==undefined){const opts=answers.locator('button.choice');await opts.nth(wrong?(plan.choice+1)%await opts.count():plan.choice).click();}
  else await answers.locator('input:not([type="radio"])').fill(wrong?'987654321':plan.answer.replace('.',','));
}
async function hint(page,rec,promptSelector,percent=false) {
  const prompt=await observed(page.locator(promptSelector));
  const toggle=page.locator('.bh-toggle:visible').first();
  await usable(toggle,rec,'Help toggle');
  await toggle.click();
  const panel=page.locator('.bh-panel:visible');await panel.waitFor();
  const text=await observed(panel);
  const second=page.locator(percent?'#p-h2':'#hint2');if(await second.isVisible())await second.click();
  check(rec,'hints',text.length>30&&await observed(page.locator(promptSelector))===prompt,{visibleText:text,prompt});
  await layout(page,rec,'help-open');
  await toggle.click();
}
async function basic(page,rec) {
  const prompt=page.locator('#practicePrompt'),answers=page.locator('#practiceAnswer');
  const plan=await solveBasic(prompt,answers);check(rec,'start',true,{prompt:plan.prompt});
  await usable(answers.locator('input,button').first(),rec,'Answer control');
  await fillBasic(answers,plan,true);await page.locator('#checkTask').click();
  check(rec,'wrong-answer',await page.locator('#practiceFeedback.bad').isVisible()&&await observed(prompt)===plan.prompt,{prompt:plan.prompt,submitted:plan.choice!==undefined?'alternative choice':'987654321',observed:await observed(page.locator('#practiceFeedback'))});
  await hint(page,rec,'#practicePrompt');
  await fillBasic(answers,plan);await page.locator('#checkTask').click();
  check(rec,'correct-answer',await page.locator('#practiceFeedback.good').isVisible(),{...plan,observed:await observed(page.locator('#practiceFeedback'))});
  await page.locator('#nextTask').click();
  check(rec,'next-example',await answers.locator('input:enabled,button:enabled').count()>0&&await page.locator('#checkTask').isVisible(),{prompt:await observed(prompt)});
  await menu(page,'check');
  for(let i=0;i<5;i++){
    const p=await solveBasic(page.locator('#checkPrompt'),page.locator('#checkAnswer'));
    await fillBasic(page.locator('#checkAnswer'),p);await page.locator('#checkNext').click();
    note(rec,'quiz-answer','PASS',{index:i+1,...p});
  }
  await page.locator('#checkResult').waitFor({state:'visible'});
  const score=await observed(page.locator('#resultScore'));
  check(rec,'finish',score==='5/5',{score});await layout(page,rec,'completed-check');
  const durable=await snapshotStorage(page);await page.reload();await page.locator('.bh-toggle').waitFor();await menu(page,'home');
  check(rec,'saved-result',await observed(page.locator('#statBest'))==='5/5',{visibleBest:await observed(page.locator('#statBest')),storageKeys:Object.keys(durable),scope:'Saved best score and counters. An unfinished legacy practice is not promised to resume.'});
  await layout(page,rec,'saved-result-after-reload');
}
function solveProportion(s){const m=clean(s).match(/([\d,.]+|x)\s*:\s*([\d,.]+|x)\s*=\s*([\d,.]+|x)\s*:\s*([\d,.]+|x)/);if(!m)throw new OracleUnsupported(s);const a=m.slice(1).map(v=>v==='x'?null:number(v));const i=a.indexOf(null);return [()=>a[1]*a[2]/a[3],()=>a[0]*a[3]/a[2],()=>a[0]*a[3]/a[1],()=>a[1]*a[2]/a[0]][i]();}
async function solvePercent(host) {
  const p=clean(await host.locator('.prompt').innerText()),ns=nums(p);
  const options=await host.locator('label.choice').allTextContents();
  const choose=pred=>{const i=options.findIndex(x=>pred(clean(x)));if(i<0)throw new OracleUnsupported('No percent choice: '+p);return {choice:i,expected:clean(options[i]),prompt:p,options};};
  const bold=(await host.locator('.prompt b').allTextContents()).map(clean);
  const bnums=bold.map(x=>nums(x)[0]).filter(x=>x!==undefined);
  let answer;
  if(options.length){
    if(/принято за 100%/.test(p)){const whole=/% числа/.test(p)?ns[1]:ns[0];return choose(x=>nums(x)[0]===whole);}
    if(/Какой это вопрос/.test(p)){
      const label=/На сколько процентов/.test(p)?'Узнать, на сколько процентов изменилось':/Сколько всего|до скидки/.test(p)?'Найти число по его проценту':/в процентах|Какой процент/.test(p)?'Узнать, сколько это процентов':'Найти процент от числа';return choose(x=>x===label);
    }
    if(/пропорция составлена верно/.test(p)){const [a,b,c]=bnums;const expected=b*c/a;return choose(x=>Math.abs(solveProportion(x)-expected)<1e-8&&clean(x).startsWith(a+' : '+c));}
    if(/больше|меньше/.test(p)){const more=/Само число будет/.test(p)||/Новое значение составляет/.test(p);return choose(x=>x===(more?'Больше':'Меньше'));}
    throw new OracleUnsupported(p);
  }
  if(/неизвестный член пропорции/.test(p))answer=solveProportion(p);
  else if(/сначала/.test(p)&&/затем/.test(p)){
    const m=p.match(/Число\s+([\d,.]+)\s+сначала\s+(увеличили|уменьшили)\s+на\s+([\d,.]+)%.*затем результат\s+(увеличили|уменьшили)\s+на\s+([\d,.]+)%/);
    if(!m)throw new OracleUnsupported(p);answer=number(m[1])*(1+(m[2]==='увеличили'?1:-1)*number(m[3])/100)*(1+(m[4]==='увеличили'?1:-1)*number(m[5])/100);
  }else if(/Новое значение составляет/.test(p))answer=Math.abs(ns[0]-100);
  else if(/^Величина (выросла|уменьшилась)/.test(p))answer=100+(/выросла/.test(p)?1:-1)*ns[0];
  else if(/На сколько процентов|Найдите процент изменения/.test(p))answer=Math.abs(bnums[1]-bnums[0])/bnums[0]*100;
  else if(/стала|результат|равна теперь/.test(p)&&/на [+-]?[\d,.]+%/.test(p))answer=bnums[0]*(1+(/уменьшили|снизилась|на -/.test(p)?-1:1)*bnums[1]/100);
  else if(/некоторого числа|до скидки|задуманного|найдите число, если/.test(p)){
    const pc=number(p.match(/([\d,.]+)%/)[1]);const v=/Известно, что/.test(p)?bnums[0]:bnums[1];answer=v*100/pc;
  }else if(/[Сс]колько процентов составляет|Какую часть в процентах составляет|какую часть числа/.test(p))answer=bnums[0]/bnums[1]*100;
  else if(/^Из .*предметов|^В классе|^В зале/.test(p)&&/процент/.test(p))answer=bnums[1]/bnums[0]*100;
  else if(/Один процент/.test(p)||/составляет 1%/.test(p))answer=bnums[0]/100;
  else {
    const pm=p.match(/([\d,.]+)%/);if(!pm)throw new OracleUnsupported(p);const pc=number(pm[1]);
    // Bold numeric data excludes the explanatory constant 100 in the formula.
    const whole=/Найдите\s+[\d,.]+%|найдите\s+[\d,.]+%/i.test(p)?bnums[bnums.length-1]:bnums[0];
    answer=whole*pc/100;
  }
  if(!Number.isFinite(answer))throw new OracleUnsupported('No percent answer: '+p);
  return {answer:String(round(answer)),expected:String(round(answer)),prompt:p,options};
}
async function fillPercent(host,plan,wrong=false){
  if(plan.choice!==undefined){const options=host.locator('label.choice');await options.nth(wrong?(plan.choice+1)%await options.count():plan.choice).click();}
  else await host.locator('input:not([type="radio"])').fill(wrong?'987654321':plan.answer.replace('.',','));
}
async function percent(page,rec){
  const host=page.locator('#p-q'),p=await solvePercent(host);check(rec,'start',true,{prompt:p.prompt});
  await fillPercent(host,p,true);await page.locator('#p-check').click();
  check(rec,'wrong-answer',await page.locator('#p-fb.bad').isVisible(),{prompt:p.prompt,observed:await observed(page.locator('#p-fb'))});
  await hint(page,rec,'#p-q .prompt',true);await fillPercent(host,p);await page.locator('#p-check').click();
  check(rec,'correct-answer',await page.locator('#p-fb.good').isVisible(),{...p,observed:await observed(page.locator('#p-fb'))});
  const worked=await observed(page.locator('#p-fb'));
  const equality=worked.match(/Разница\s+([\d,.]+)\s*[-−]\s*([\d,.]+)\s*=\s*([\d,.]+)%/);
  if(equality)check(rec,'worked-example-arithmetic',Math.abs(number(equality[1])-number(equality[2])-number(equality[3]))<1e-9,{visibleEquality:equality[0]});
  await page.locator('#p-next').click();check(rec,'next-example',await page.locator('#p-check').isEnabled(),{prompt:await observed(host.locator('.prompt'))});
  await menu(page,'check',true);await page.locator('#check-start').click();
  const tasks=page.locator('#check-list .qitem');const count=await tasks.count();
  for(let i=0;i<count;i++){const h=tasks.nth(i),plan=await solvePercent(h);await fillPercent(h,plan);note(rec,'quiz-answer','PASS',{index:i+1,...plan});}
  await page.locator('#check-finish').click();const score=await observed(page.locator('#r-score'));
  check(rec,'finish',score===count+' / '+count,{score});await layout(page,rec,'completed-check');
  const keys=Object.keys(await snapshotStorage(page));await page.reload();await page.locator('.bh-toggle').waitFor();await menu(page,'home',true);
  check(rec,'saved-result',(await observed(page.locator('#home-best'))).includes(count+' из '+count),{visibleBest:await observed(page.locator('#home-best')),storageKeys:keys});
  await layout(page,rec,'saved-result-after-reload');
}
async function divisionStep(page,rec,wrong=false){
  const phase=await observed(page.locator('#phaseText')),ns=nums(phase);let answer;
  if(/Пример решён/.test(phase))return false;
  if(/Подберите цифру/.test(phase)){
    const part=number(await observed(page.locator('#partialValue'))),d=number(await observed(page.locator('#divisorDisplay')));answer=Math.floor(part/d);
    await page.locator('#multiples button').nth(wrong?(answer+1)%10:answer).click();
  }else if(/Снесите/.test(phase)){await page.locator('#bringBtn').click();answer='bring';}
  else if(/Поставьте запятую/.test(phase)){await page.locator('#commaBtn').click();answer=',';}
  else{
    if(/Сколько знаков/.test(phase)){const s=phase.match(/делителе\s+([\d,]+)/)[1];answer=(s.split(',')[1]||'').length;}
    else if(/Сдвиньте/.test(phase))answer=round(ns[0]*10**ns[1]);
    else if(/Умножьте/.test(phase))answer=ns[0]*ns[1];
    else if(/Вычтите/.test(phase))answer=ns[1]-ns[0];
    else throw new OracleUnsupported('Legacy division step: '+phase);
    await page.locator('#answerArea input').fill(wrong?'987654321':String(answer).replace('.',','));await page.locator('#answerArea button').click();
  }
  note(rec,wrong?'wrong-step-submitted':'division-step','PASS',{prompt:phase,expected:answer,submitted:wrong?'deliberately wrong':answer});return true;
}
async function division(page,rec){
  const original=await observed(page.locator('#taskTitle'));check(rec,'start',true,{prompt:original,step:await observed(page.locator('#phaseText'))});
  await divisionStep(page,rec,true);check(rec,'wrong-answer',await page.locator('#feedback.bad').isVisible(),{observed:await observed(page.locator('#feedback'))});
  await hint(page,rec,'#taskTitle');let steps=0;while(await divisionStep(page,rec)){if(++steps>120)throw Error('Division failed to finish within 120 UI actions');}
  const fb=await observed(page.locator('#feedback'));
  check(rec,'correct-answer',await page.locator('#feedback.good').isVisible(),{prompt:original,steps,observed:fb});
  await page.locator('#nextBtn').click();check(rec,'next-example',!/Пример решён/.test(await observed(page.locator('#phaseText'))),{prompt:await observed(page.locator('#taskTitle'))});
  await menu(page,'check');
  for(let i=0;i<3;i++){
    const p=await observed(page.locator('#checkPrompt')),n=nums(p);
    const a=/частное, остаток/.test(p)?Math.floor(n[0]/n[1])+', '+round(n[0]%n[1]):/цифру частного|неполное частное/.test(p)?Math.floor(n[0]/n[1]):round(n[0]/n[1]);
    await page.locator('#checkAnswer input').fill(String(a).replace('.',','));await page.locator('#checkAnswer button').click();note(rec,'quiz-answer','PASS',{index:i+1,prompt:p,expected:a});
  }
  const score=await observed(page.locator('#resultScore'));check(rec,'finish',score==='3/3',{score});
  await layout(page,rec,'completed-check');const keys=Object.keys(await snapshotStorage(page));await page.reload();await page.locator('.bh-toggle').waitFor();await menu(page,'home');
  check(rec,'saved-result',(await observed(page.locator('#homeStats'))).includes('3/3'),{visibleStats:await observed(page.locator('#homeStats')),storageKeys:keys});
  await layout(page,rec,'saved-result-after-reload');
}
async function guided(page,rec){
  const original=await observed(page.locator('#problem')),data=nums(original),digits=String(data[0]);let used=0,lastRemainder=0,brought=0;
  check(rec,'start',original==='48 : 2',{prompt:original});
  await page.locator('#answer').fill('987654321');await page.locator('#primary').click();
  check(rec,'wrong-answer',(await observed(page.locator('#step-counter'))).startsWith('Шаг 1 '),{observed:await observed(page.locator('#feedback'))});
  const toggle=page.locator('.bh-toggle');await toggle.click();check(rec,'hints',(await observed(page.locator('#hint-text'))).length>30,{visibleText:await observed(page.locator('#hint-text'))});await layout(page,rec,'help-open');await toggle.click();
  let count=0;
  while(!await page.locator('#completion').isVisible()){
    const p=await observed(page.locator('#prompt')),n=nums(p);let answer;
    if(/С какого числа/.test(p)){used=1;while(used<digits.length&&number(digits.slice(0,used))<data[1])used++;answer=number(digits.slice(0,used));}
    else if(/Сколько цифр/.test(p))answer=String(Math.floor(data[0]/data[1])).length;
    else if(/Сколько раз/.test(p))answer=Math.floor(n[1]/n[0]);
    else if(/Умножь|Вычти|Проверь/.test(p)){answer=arithmetic(p.replace(/^[^:]+:\s*/,'').replace(/\s*=.*$/,''));if(/Вычти/.test(p))lastRemainder=answer;}
    else if(/Остаток .* меньше/.test(p)){answer=n[0]<n[1]?'да':'нет';}
    else if(/Снеси следующую цифру/.test(p)){brought=number(digits[used++]);answer=brought;}
    else if(/после сноса/.test(p))answer=lastRemainder*10+brought;
    else if(/Запиши ответ целиком|Запиши целое частное/.test(p))answer=round(data[0]/data[1]);
    else throw new OracleUnsupported('Guided prompt '+p);
    if(typeof answer==='string'&&['да','нет'].includes(answer))await page.locator('[data-option="'+answer+'"]').click();
    else await page.locator('#answer').fill(String(answer).replace('.',','));
    await page.locator('#primary').click();note(rec,'guided-step','PASS',{index:count+1,prompt:p,expected:answer});
    if(++count>50)throw Error('Guided division did not finish');
  }
  check(rec,'correct-answer',(await observed(page.locator('.quotient')))==='24',{prompt:original,steps:count,quotient:await observed(page.locator('.quotient'))});
  check(rec,'finish',true,{visibleText:await observed(page.locator('#completion-text'))});await layout(page,rec,'completed-example');
  await page.locator('#results summary').click();const results=await observed(page.locator('#results-text'));
  await page.reload();await page.locator('#completion').waitFor({state:'visible'});await page.locator('#results summary').click();
  check(rec,'saved-result',(await observed(page.locator('#results-text')))===results,{before:results,after:await observed(page.locator('#results-text'))});
  await page.locator('#next-example').click();check(rec,'next-example',(await observed(page.locator('#problem')))==='69 : 3',{prompt:await observed(page.locator('#problem'))});
  await page.locator('#answer').fill('6');await page.reload();await page.locator('#answer').waitFor();check(rec,'draft-resume',await page.locator('#answer').inputValue()==='6',{draft:await page.locator('#answer').inputValue()});
}
async function hub(page,rec){
  const child={'/':'/trainers/oge-course/','/trainers/oge-basics/':'/trainers/oge-basics/order-of-operations.html',
    '/trainers/oge-basics/multiplication-division/':'/trainers/oge-basics/multiplication-division/multiplication-meaning.html',
    '/trainers/oge-basics/percentages/':'/trainers/oge-basics/percentages/percent-meaning.html',
    '/trainers/oge-course/':'/trainers/oge-task6-fractions.html'}[rec.route];
  check(rec,'start',(await observed(page.locator('body'))).length>100,{title:await page.title()});
  for(const action of ['wrong-answer','hints','correct-answer','next-example','finish','saved-result'])note(rec,action,'NOT_APPLICABLE',{reason:'Navigation page: no exercise answer or completion contract.'});
  const links=await page.locator('a[href]').evaluateAll(es=>es.map(e=>({text:e.innerText,href:e.href})));const target=links.find(x=>new URL(x.href).pathname===PREFIX+child);
  if(!target){check(rec,'navigation',false,{expectedPath:PREFIX+child,reason:'Expected topic link missing'});return;}
  const match=page.locator('a[href]').filter({visible:true});
  let chosen=null;for(const l of await match.all()){if(new URL(await l.getAttribute('href'),page.url()).pathname===PREFIX+child){chosen=l;break;}}
  if(!chosen){check(rec,'navigation',false,{reason:'Topic link is not visible'});return;}
  await chosen.click();await page.waitForURL(url=>url.pathname===PREFIX+child);check(rec,'navigation',(await observed(page.locator('body'))).length>100,{destination:new URL(page.url()).pathname,title:await page.title()});
}
async function run(browser,row,width){
  const seed=SEED_OVERRIDE===undefined?parseInt(createHash('sha256').update(row.route+':'+width).digest('hex').slice(0,8),16):Number(SEED_OVERRIDE);
  const rec={id:row.id,route:row.route,width,height:900,seed,testedPath:PREFIX+row.route,actions:[],errors:[],networkEscapes:[],resourceHashes:{}};
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();page.setDefaultTimeout(5000);
  await page.addInitScript(seed=>{let n=seed>>>0;Math.random=()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};},seed);
  page.on('pageerror',e=>rec.errors.push(e.message));
  page.on('response',response=>{const sha=response.headers()['x-book-audit-sha256'];if(sha)rec.resourceHashes[new URL(response.url()).pathname]=sha;});
  page.on('request',req=>{const u=new URL(req.url());if(PREFIX&&u.protocol.startsWith('http')&&(u.origin!==origin||!u.pathname.startsWith(PREFIX+'/')))rec.networkEscapes.push({url:u.origin===origin?u.pathname:u.origin+u.pathname,type:req.resourceType()});});
  try{
    const response=await page.goto(origin+PREFIX+row.route,{waitUntil:'load'});
    check(rec,'availability',response?.status()===200,{status:response?.status()});
    const isHub=row.route.endsWith('/');
    if(!isHub){if(row.route.includes('long-division-from-simple'))await page.locator('#answer').waitFor();else await page.locator('body[data-basics-standalone]').waitFor();}
    const title=await page.title();
    const expectedTopic=TOPICS[path.basename(row.route)]||(row.route.endsWith('/multiplication-division/')?'Умножение и деление':row.route.endsWith('/percentages/')?'Проценты и пропорции':row.route.endsWith('/oge-basics/')?'ПредОГЭ':'ОГЭ');
    check(rec,'topic',title.toLowerCase().includes(expectedTopic.toLowerCase()),{title,expectedTopic,scope:'Book topic confirmed against the page title and the subsequently solved visible questions. This is not a textbook-wide curriculum equivalence claim.'});
    await layout(page,rec,'initial');
    await page.screenshot({path:path.join(OUTPUT,`book-${row.id}-${width}-initial.png`),fullPage:true,animations:'disabled'});
    if(isHub){rec.family='navigation';await hub(page,rec);}
    else if(await page.locator('#guided-division').count()){rec.family='guided-division';await guided(page,rec);}
    else if(await page.locator('#p-q').count()){rec.family='percent';await percent(page,rec);}
    else if(await page.locator('#phaseText').count()){rec.family='legacy-division';await division(page,rec);}
    else{rec.family='basic';await basic(page,rec);}
  }catch(error){
    note(rec,'scenario',error instanceof OracleUnsupported?'NOT_RUN':'FAIL',{reason:error.message});
    rec.lastVisibleText=(await page.locator('body').innerText().catch(()=>'' )).slice(0,14000);
    await page.screenshot({path:path.join(OUTPUT,`book-${row.id}-${width}-failure.png`),fullPage:true,animations:'disabled'}).catch(()=>{});
  }finally{
    for(const action of REQUIRED)if(!rec.actions.some(x=>x.action===action))note(rec,action,'NOT_RUN',{reason:'Scenario stopped before this action; see scenario evidence.'});
    check(rec,'runtime-errors',rec.errors.length===0,{errors:rec.errors});
    rec.networkEscapes=[...new Map(rec.networkEscapes.map(x=>[x.url+' '+x.type,x])).values()];
    if(PREFIX)check(rec,'immutable-dependencies',rec.networkEscapes.length===0,{escapes:rec.networkEscapes});
    rec.status=rec.actions.some(x=>x.status==='FAIL')?'FAIL':rec.actions.some(x=>x.status==='NOT_RUN')?'INCOMPLETE':'PASS';
    fs.writeFileSync(path.join(OUTPUT,`book-${row.id}-${width}.json`),JSON.stringify(rec,null,2));reports.push(rec);
    await context.close();console.log(rec.id,width,rec.status,rec.route,rec.actions.filter(x=>['FAIL','NOT_RUN'].includes(x.status)).map(x=>x.action+':'+(x.reason||x.score||'')).join('; '));
  }
}
(async()=>{
  fs.mkdirSync(OUTPUT,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));origin='http://127.0.0.1:'+server.address().port;
  let browser;try{
    browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE}:{})});
    const jobs=ROUTES.flatMap(row=>WIDTHS.map(width=>({row,width})));let next=0;
    await Promise.all(Array.from({length:Number(process.env.BOOK_BASICS_WORKERS||2)},async()=>{
      while(next<jobs.length){const job=jobs[next++];await run(browser,job.row,job.width);}
    }));
  }finally{
    if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));
    const summary={generatedAt:new Date().toISOString(),base:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),testScriptSha256:createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),prefix:PREFIX,routeCount:ROUTES.length,widths:WIDTHS,
      scope:'Seeded isolated browser contexts; one practice failure/help/success/new-example cycle and complete short check per applicable route. This does not enumerate every possible generated question or validate learning gains.',
      totals:{PASS:reports.filter(x=>x.status==='PASS').length,FAIL:reports.filter(x=>x.status==='FAIL').length,INCOMPLETE:reports.filter(x=>x.status==='INCOMPLETE').length},reports};
    fs.writeFileSync(path.join(OUTPUT,'report.json'),JSON.stringify(summary,null,2));console.log('OGE_BOOK_BASICS_BROWSER',JSON.stringify(summary.totals));
    if(summary.totals.FAIL||summary.totals.INCOMPLETE)process.exitCode=1;
  }
})().catch(e=>{console.error(e);process.exitCode=1;});
