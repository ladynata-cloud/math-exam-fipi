'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright'),root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}});

const clockCourses = [
 '/ege-profil/trigonometry/', '/ege-profil/atanasyan-10-11/', '/stereo-course/sections/',
 '/geometry-merzlyak/', '/geometry-course/textbook/', '/ege-profil/trainers/derivative-t8.html',
 '/trainers/ege-profile/log-inequalities/'
];

async function checkClockMechanism(stage) {
 const frames = await stage.locator('canvas').evaluate(canvas => new Promise(resolve => {
  const context = canvas.getContext('2d');
  const drawImage = context.drawImage;
  const clearRect = context.clearRect;
  const canvasBox = canvas.getBoundingClientRect();
  const scaleX = canvasBox.width / canvas.width;
  const scaleY = canvasBox.height / canvas.height;
  const boxes = [...canvas.closest('.profile-clock-case').querySelectorAll('[data-clock-dial="second"]')]
   .map(group => group.getBoundingClientRect());
  const samples = [];
  let frame = {pinions:boxes.map(() => []), gnomes:0};
  const finish = () => {
   delete context.drawImage;
   delete context.clearRect;
   resolve(samples);
  };
  const timeout = setTimeout(finish, 1600);

  // Observe the actual painted wheels. The catalogue links stay still while
  // the smaller wheels turn independently inside the large gear assemblies.
  context.drawImage = function(image, ...args) {
   if (image instanceof HTMLCanvasElement && args.length === 4 && args[0] < 0 && args[1] < 0) {
    const transform = this.getTransform();
    const x = canvasBox.left + transform.e * scaleX;
    const y = canvasBox.top + transform.f * scaleY;
    const angle = Math.atan2(transform.b * scaleY, transform.a * scaleX);
    const size = Math.hypot(transform.a * scaleX, transform.b * scaleY) * args[2];
    const group = boxes.findIndex(box => size < box.width * .6 &&
     Math.hypot(x - box.left - box.width / 2, y - box.top - box.height / 2) < box.width / 2);
    if (group >= 0) frame.pinions[group].push(angle);
   }
   if (image instanceof HTMLImageElement && args.length === 8 && image.src.endsWith('/clockwork-gnomes.webp')) {
    frame.gnomes++;
   }
   return drawImage.call(this, image, ...args);
  };
  context.clearRect = function(...args) {
   if (frame.gnomes && (!samples.length || performance.now() - samples[0].time >= 100)) {
    samples.push({...frame, time:performance.now()});
    if (samples.length === 2) {
     clearTimeout(timeout);
     finish();
    }
   }
   frame = {pinions:boxes.map(() => []), gnomes:0};
   return clearRect.apply(this, args);
  };
 }));
 assert.equal(frames.length, 2, 'two animated workshop frames painted');
 for (const frame of frames) {
  assert.equal(frame.gnomes, 8, 'six workers and two meeting gnomes are drawn');
  assert.deepEqual(frame.pinions.map(cluster => cluster.length), [3, 3, 3], 'three pinions inside each large gear');
 }
 const rotations = frames[1].pinions.flatMap((cluster, index) => cluster.map((angle, pinion) => {
  const delta = angle - frames[0].pinions[index][pinion];
  return Math.atan2(Math.sin(delta), Math.cos(delta));
 }));
 assert(rotations.every(delta => Math.abs(delta) > .001), 'all nine pinions rotate');
 assert(new Set(rotations.map(delta => delta.toFixed(3))).size > 1, 'pinions rotate at different rates or directions');
}

async function checkProfileClock(page, width) {
 const workshop = page.getByRole('region', {name:'Пещера сокровищ ЕГЭ'});
 const stage = workshop.locator('.profile-clock-case');
 const links = stage.locator('.profile-clock-number');
 const courses = stage.locator('.profile-clock-course');
 await stage.scrollIntoViewIfNeeded();
 assert.deepEqual(await links.evaluateAll(all => all.map(link => link.getAttribute('href'))),
  await page.locator('#profile-2027 .first-three-link[data-exam-number]').evaluateAll(all => all.map(link => link.getAttribute('href'))));
 assert.equal(await links.count(), 20);
 const dials = await stage.locator('.profile-clock-dial').evaluateAll(groups => groups.map(group => ({
  part:group.dataset.clockDial,
  width:group.getBoundingClientRect().width,
  numbers:[...group.querySelectorAll('.profile-clock-number')].map(link => Number(link.textContent))
 })));
 assert.deepEqual(dials.map(dial => dial.part), ['first', 'second', 'second', 'second']);
 assert.deepEqual(dials.map(dial => dial.numbers), [Array.from({length:13}, (_, i) => i + 1), [14,15,16], [17,18], [19,20]]);
 assert(dials[0].width > 0 && dials.slice(1).every(dial => dial.width > dials[0].width), 'all second-part gears are larger at ' + width);
 assert.deepEqual(await courses.evaluateAll(all => all.map(link => link.getAttribute('href'))), clockCourses);
 assert(await stage.locator('.profile-clock-number, .profile-clock-course').evaluateAll(all => {
  const bounds = all[0].closest('.profile-clock-case').getBoundingClientRect();
  const boxes = all.map(link => link.getBoundingClientRect());
  return boxes.every((box, index) => {
   const x = box.left + box.width / 2, y = box.top + box.height / 2;
   return box.width >= 44 && box.height >= 44 &&
    box.left >= bounds.left && box.right <= bounds.right && box.top >= bounds.top && box.bottom <= bounds.bottom &&
    !boxes.some((other, otherIndex) => {
     if (otherIndex === index) return false;
     if (all[index].classList.contains('profile-clock-number') && all[otherIndex].classList.contains('profile-clock-number')) {
      return Math.hypot(x - other.left - other.width / 2, y - other.top - other.height / 2) < 43.9;
     }
     return x > other.left && x < other.right && y > other.top && y < other.bottom;
    });
  });
 }), 'all clockwork task and course targets fit at ' + width);
 if (width === 1280) {
  const responses = await Promise.all(clockCourses.map(route => page.request.get(new URL(route, page.url()).href)));
  for (const [index, response] of responses.entries()) assert(response.ok(), clockCourses[index] + ' opens');
 }
 await workshop.getByRole('link', {name:'№2 · Векторы с нуля'}).focus();
 assert.equal(await workshop.locator('.profile-clock-topic').textContent(), '№2 · Векторы с нуля');
 await links.nth(12).focus();
 await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(() => document.activeElement.textContent), '14', 'keyboard continues from the first part to the second');
 await links.last().focus();
 await page.keyboard.press('Tab');
 assert.equal(await page.evaluate(() => document.activeElement.getAttribute('href')), clockCourses[0], 'extra courses follow exam tasks by keyboard');
 const alphabetNav = workshop.getByRole('navigation', {name:'Основы и методы в часовом механизме'});
 const alphabetLinks = alphabetNav.getByRole('link');
 assert.equal(await alphabetLinks.count(), 11);
 assert(await alphabetLinks.evaluateAll(links => links.every(link => link.getBoundingClientRect().height >= 44)));
 for(const name of ['Метод координат в стереометрии','Функции и графики для задач с параметром','Методы решения задач с параметром']){
  assert.equal(await alphabetNav.getByRole('link',{name,exact:true}).count(),1);
 }
 await workshop.getByRole('link', {name:/^№16 ·/}).focus();
 assert.equal(await workshop.getByRole('link', {name:'Основы для №16'}).getAttribute('href'), '/ege-profil/azbuka-metodov/?exam=16');

 const pause = workshop.getByRole('button', {name:'Пауза анимации'});
 const play = workshop.getByRole('button', {name:'Запустить анимацию'});
 const snapshot = () => stage.locator('canvas').evaluate(canvas => canvas.toDataURL());
 const changes = previous => page.waitForFunction(frame => document.querySelector('#profile-clock canvas').toDataURL() !== frame, previous);
 const freezes = async () => {
  const frame = await snapshot();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await snapshot(), frame);
 };
 await page.waitForFunction(() => performance.getEntriesByType('resource').some(resource => resource.name.endsWith('/clockwork-gnomes.webp')));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
 await play.waitFor();
 assert.equal(await alphabetLinks.first().locator('.profile-clock-alphabet-wheel').evaluate(wheel => getComputedStyle(wheel).animationPlayState), 'paused');
 await freezes();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForFunction(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
 await pause.waitFor();
 await stage.scrollIntoViewIfNeeded();
 await changes(await snapshot());
 await pause.click();
 await play.waitFor();
 await freezes();
 await play.click();
 await stage.scrollIntoViewIfNeeded();
 await changes(await snapshot());
 await checkClockMechanism(stage);
}

async function checkClockWithoutMediaEvent(page, origin) {
 await page.addInitScript(() => {
  const nativeMatchMedia = window.matchMedia;
  window.matchMedia = function(query) {
   const media = nativeMatchMedia.call(this, query);
   if (query === '(prefers-reduced-motion: reduce)') {
    const nativeAdd = media.addEventListener.bind(media);
    media.addEventListener = (type, ...args) => {
     if (type !== 'change') nativeAdd(type, ...args);
    };
   }
   return media;
  };
 });
 await page.goto(origin+'/ege-profil/');
 const toggle = page.locator('.profile-clock-toggle');
 await toggle.waitFor();
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
 await page.locator('.profile-clock-toggle[data-paused]').waitFor();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.waitForFunction(() => !matchMedia('(prefers-reduced-motion: reduce)').matches);
 await page.locator('.profile-clock-toggle:not([data-paused])').waitFor();
}

async function checkAlphabetReturn(page, origin) {
 await page.evaluate(() => localStorage.removeItem('mathexam.profile-alphabets.v1.domain/denominator'));
 await page.goto(origin + '/ege-profil/part-two/index.html#lesson/p16-cancelled-hole');
 await page.getByRole('link', {name:'Первое условие по шагам'}).click();
 await page.locator('#step-answer').fill('999');
 await page.getByRole('button', {name:'Проверить шаг'}).click();
 const source = new URL(page.url()).hash;
 await page.getByRole('link', {name:'Как исключить нули знаменателя'}).click();
 await page.getByRole('heading', {name:'Исключаю нули знаменателя',exact:true}).waitFor();
 assert.equal(new URL(page.url()).hash, '#/domain/denominator');
 await page.locator('#az-answer').fill('3');
 await page.getByRole('button', {name:'Проверить',exact:true}).click();
 await page.getByRole('button', {name:'Проверить себя на новом условии'}).click();
 await page.locator('#az-answer').fill('x ≠ −5');
 await page.getByRole('button', {name:'Проверить',exact:true}).click();
 await page.getByRole('button', {name:'Завершить',exact:true}).click();
 await page.getByRole('heading', {name:'Самостоятельная проверка пройдена'}).waitFor();
 assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
 await page.getByRole('link', {name:'Вернуться к исходному заданию'}).click();
 assert.equal(new URL(page.url()).hash, source);
 assert.equal(await page.locator('#step-answer').inputValue(), '999');
 await page.getByRole('button', {name:'Карта навыков'}).click();
 const linkedSkill = page.getByRole('link', {name:'Исключаю нули знаменателя'});
 await linkedSkill.waitFor();
 assert.match(await linkedSkill.getAttribute('href'), /#\/domain\/denominator$/);
 await linkedSkill.click();
 await page.getByRole('heading', {name:'Самостоятельная проверка пройдена'}).waitFor();
}

async function checkExamFoundations(page, origin) {
 const partTwo = origin + '/ege-profil/part-two/index.html';
 const methods = origin + '/ege-profil/azbuka-metodov/';
 const answer = async value => {
  await page.locator('#az-answer').fill(value);
  await page.getByRole('button', {name:'Проверить',exact:true}).click();
 };
 await page.evaluate(() => localStorage.removeItem('mathexam.profile-alphabets.v1.coordinate-method/axes'));
 await page.goto(partTwo + '#task/p2-15-line-plane-1/guided');
 await page.locator('#step-answer').fill('24601');
 await page.getByRole('button',{name:'Карта навыков'}).click();
 await page.getByRole('link',{name:'Выбираю оси и читаю координаты'}).click();
 await page.getByRole('heading',{name:'Выбираю оси и читаю координаты'}).waitFor();
 assert.equal(await page.getByRole('img',{name:/Из вершины O/}).count(),1);
 await answer('3; 2; 4');
 await page.getByRole('button',{name:'Проверить себя на новом условии'}).click();
 await page.locator('#az-answer').fill('5; 0');
 await page.reload();
 assert.equal(await page.locator('#az-answer').inputValue(),'5; 0');
 await answer('(5; 0; 2)');
 await page.getByRole('button',{name:'Завершить',exact:true}).click();
 await page.getByRole('heading',{name:'Самостоятельная проверка пройдена'}).waitFor();
 assert.match(await page.getByRole('link',{name:'Следующий шаг'}).getAttribute('href'),/#\/coordinate-method\/vector$/);
 await page.getByRole('link',{name:'Вернуться к исходному заданию'}).click();
 assert.equal(await page.locator('#step-answer').inputValue(),'24601');
 await page.goto(methods + '#/function-atlas');
 await page.getByRole('combobox',{name:'Функция'}).selectOption('hole');
 assert.equal(await page.locator('.az-atlas select option').count(),25);
 assert.equal(await page.locator('.atlas-open').count(),1);
 await page.getByText('Проверить число решений',{exact:true}).click();
 assert.match(await page.locator('.az-atlas-count').textContent(),/равно 0/);
 await page.getByRole('combobox',{name:'Функция'}).selectOption('plateau');
 assert.equal(await page.locator('.az-atlas details').evaluate(node=>node.open),false);
 await page.getByText('Проверить число решений',{exact:true}).click();
 assert.match(await page.locator('.az-atlas-count').textContent(),/бесконечно/);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 await page.goto(partTwo + '#exam/19');
 const route = page.getByRole('link',{name:'Функции и графики для задач с параметром',exact:true});
 assert.match(await route.getAttribute('href'),/#\/function-atlas$/);
 await page.getByRole('button',{name:'Карта навыков'}).click();
 const link = page.getByRole('link',{name:'Исключаю выколотую точку'});
 assert.match(await link.getAttribute('href'),/#\/parameter-methods\/hole$/);
}

async function checkParameterGraphs(page, origin) {
 const partTwo=origin+'/ege-profil/part-two/';
 const prefix='mathExam.profile.partTwo.v1.';
 const record=id=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),prefix+id);
 await page.goto(partTwo+'#exam/19');
 await page.evaluate(prefix=>{
  for(const family of ['param-modules','param-hole'])for(const number of [4,5,6])localStorage.removeItem(prefix+family+'-'+number);
 },prefix);
 await page.reload();
 const routes=page.getByRole('region',{name:'От графика к задаче №19'});
 const plateau=routes.getByRole('article').filter({hasText:'Горизонтальный участок'});
 const hole=routes.getByRole('article').filter({hasText:'Выколотая точка'});
 const answerCount=page.locator('.az-atlas-count');
 const level=page.getByRole('slider');
 const atlas=page.getByRole('combobox',{name:'Функция'});
 const fit=()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);
 const proof=page.locator('#proof-draft');
 const first=page.locator('#final-0'), second=page.locator('#final-1');
 const check=page.getByRole('button',{name:'Проверить ответы'});
 const help=page.getByRole('button',{name:'Посмотреть подсказку на графике'});
 const checkCount=async expected=>{
  assert.equal(await answerCount.isVisible(),false);
  await page.getByText('Проверить число решений',{exact:true}).click();
  assert.match(await answerCount.textContent(),expected);
 };

 assert.match(await plateau.getByRole('link',{name:'Решить новое условие'}).getAttribute('href'),/#task\/param-modules-4\/independent$/);
 assert(await fit());
 await plateau.getByRole('link',{name:'Исследовать график'}).click();
 assert.equal(await atlas.inputValue(),'plateau');
 await checkCount(/бесконечно/);
 await level.press('ArrowLeft');
 await checkCount(/равно 0\./);
 await level.press('ArrowRight');
 await level.press('ArrowRight');
 await checkCount(/равно 2\./);
 assert(await fit());
 await page.getByRole('link',{name:'К самостоятельному условию'}).click();
 assert.match(page.url(),/#task\/param-modules-4\/independent$/);
 await first.fill('a>10');
 await second.fill('∞');
 await proof.fill('Сравниваю уровни ниже, на участке и выше.');
 await check.click();
 await page.locator('#feedback.ok').waitFor();
 assert.equal((await record('param-modules-4')).independent,true);
 await page.getByRole('link',{name:'Все темы №19',exact:true}).click();
 assert.match(await plateau.getByRole('link',{name:'Решить новое условие'}).getAttribute('href'),/#task\/param-modules-5\/independent$/);

 await hole.getByRole('link',{name:'Исследовать график'}).click();
 assert.equal(await atlas.inputValue(),'hole');
 assert.equal(await page.locator('svg > :last-child.atlas-open').count(),1);
 await checkCount(/равно 0\./);
 await level.press('ArrowRight');
 await checkCount(/равно 1\./);
 await page.getByRole('link',{name:'К самостоятельному условию'}).click();
 assert.match(page.url(),/#task\/param-hole-4\/independent$/);
 await first.fill('4');
 await second.fill('9');
 const draft='Записываю ОДЗ до сокращения.';
 await proof.fill(draft);
 await check.click();
 await page.locator('#feedback.error').waitFor();
 assert.equal(await help.count(),0);
 await page.getByRole('link',{name:'Вернуться к темам №19'}).click();
 assert.match(await hole.getByRole('link',{name:'Продолжить условие'}).getAttribute('href'),/#task\/param-hole-4\/independent$/);
 await hole.getByRole('link',{name:'Продолжить условие'}).click();
 await page.getByText('№19 · условие 4 из 6',{exact:true}).waitFor();
 const firstScreen=await page.locator('.condition').evaluate(condition=>{
  const figure=condition.querySelector('svg').getBoundingClientRect();
  return {top:condition.getBoundingClientRect().top,bottom:figure.bottom,viewport:innerHeight,scroll:scrollY};
 });
 assert.equal(firstScreen.scroll,0,'a hash link opens the beginning of the condition');
 assert(firstScreen.top>=0&&firstScreen.bottom<=firstScreen.viewport,'condition and diagram fit the first screen');
 assert.equal(await proof.inputValue(),draft);
 await first.fill('5');
 await check.click();
 await help.waitFor();
 assert.equal((await record('param-hole-4')).helped,false);
 await page.reload();
 await help.click();
 assert.equal(await atlas.inputValue(),'hole');
 assert.match(await page.locator('#alphabet-main .az-hint').textContent(),/запрещённый x/);
 assert.doesNotMatch(await page.locator('#alphabet-main .az-hint').textContent(),/кандидат равен нулю/);
 assert(await fit());
 await page.getByRole('link',{name:'Вернуться к своему условию'}).click();
 assert.equal(await first.inputValue(),'5');
 assert.equal(await second.inputValue(),'9');
 assert.equal(await proof.inputValue(),draft);
 assert.equal((await record('param-hole-4')).helped,true);
 await second.fill('10');
 await check.click();
 await page.locator('#feedback.ok').waitFor();
 assert.equal((await record('param-hole-4')).independent,false);
 await page.getByRole('link',{name:/Другое условие самостоятельно/}).click();
 assert.match(page.url(),/#task\/param-hole-5\/independent$/);
 await page.getByText('№19 · условие 5 из 6',{exact:true}).waitFor();
 assert.equal(await proof.inputValue(),'');
 await first.fill('6');
 await second.fill('12');
 await check.click();
 await page.locator('#feedback.ok').waitFor();
 assert.equal((await record('param-hole-5')).independent,true);
 await page.getByRole('link',{name:/Следующее условие/}).click();
 await page.getByText('№19 · условие 6 из 6',{exact:true}).waitFor();
 await first.fill('7');
 await second.fill('14');
 await check.click();
 await page.locator('#feedback.ok').waitFor();
 await page.getByRole('link',{name:'Все темы №19',exact:true}).click();
 assert.match(await hole.getByRole('link',{name:'Открыть условия для повторения'}).getAttribute('href'),/#lesson\/param-hole$/);
 await hole.getByRole('link',{name:'Исследовать график'}).click();
 await page.getByRole('link',{name:'К условиям темы'}).click();
 assert.match(page.url(),/#lesson\/param-hole$/);
}

(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox']});
 const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,1280]){
  await page.setViewportSize({width,height:900});
  for(const course of ['ege-profil','ege-baza']){
   await page.goto(origin+'/'+course+'/');await page.locator('h1').first().waitFor();
   assert.match(await page.title(),/2027/);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),course+' fits '+width);
   const start=course==='ege-profil'?'#profile-2027 a[href="start/index.html#calm"]':'[data-exam-position="1"] .exam-start';
   assert(await page.locator(start).isVisible(),course+' direct task route');
   if(course==='ege-profil'){
    await checkProfileClock(page, width);
    await checkAlphabetReturn(page, origin);
    await checkExamFoundations(page, origin);
    await checkParameterGraphs(page, origin);
    await page.goto(origin+'/ege-profil/');
    // The complete-course entrance deliberately exposes every exam number
    // and the existing course. No summary click is allowed before these checks.
    for(let number=1;number<=20;number++){
     const href=number<=13?'start/index.html#calm/'+number:'part-two/index.html#exam/'+number;
     const entry=page.locator('#profile-2027 a[href="'+href+'"]');
     assert.equal(await entry.count(),1,'one current route for profile '+number);
     assert(await entry.isVisible(),'profile '+number+' visible without expanding a section at '+width);
     assert.equal(await entry.evaluate(a=>!!a.closest('details:not([open])')),false,'profile '+number+' is not hidden in a collapsed section');
    }
    assert.equal(await page.locator('#legacy-course').evaluate(n=>n.open),true,'existing profile catalogue stays expanded');
    assert.equal(await page.locator('#route .line').count(),19,'all historical 2026 lines retained');
    for(let number=1;number<=19;number++)assert(await page.locator('#route a[href="exam/variant.html?m='+number+'"]').isVisible(),'historical variant '+number+' remains directly visible');
    for(const href of ['trainers/stereo/index.html','trainers/trigonometry.html','trainers/inequalities.html','trainers/finance.html','trainers/planimetry-t17.html','trainers/parameters-18/index.html','trainers/numbers-t19.html']){
     assert(await page.locator('#legacy-course a[href="'+href+'"]').first().isVisible(),'existing trainer remains directly visible: '+href);
    }
    const legacyLinks=page.locator('#legacy-course a[href]');
    for(let index=0;index<await legacyLinks.count();index++)assert(await legacyLinks.nth(index).isVisible(),'existing profile link '+index+' visible without expanding a section');
    assert(await page.locator('#profile-2027 a[href="trigonometry/index.html"]').isVisible(),'earlier trigonometry course remains directly visible');
   }
   else {
    assert.equal(await page.locator('[data-exam-position]').count(),21,'base entrance includes all 21 exam tasks');
    assert.equal(await page.locator('#content details.journey-legacy').evaluate(n=>n.open),false,'broad learning lines remain secondary');
   }
   const shots=process.env.EGE_ENTRY_SHOTS;if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,course+'-'+width+'.png'),fullPage:true});}
   await page.locator(start).click();await page.locator('main h1').first().waitFor();
   if(course==='ege-baza')await page.locator('#answer').waitFor();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),course+' task menu fits '+width);
   if(course==='ege-profil'){
    // The old first-part continuation must still restore the actual work,
    // rather than merely landing somewhere inside the first-part application.
    const next=page.locator('[data-journey-start]');await next.waitFor();
    const savedRoute=await next.getAttribute('href');assert.match(savedRoute,/^#practice\/[^/]+\/independent$/);
    await next.click();await page.locator('#answer').waitFor();
    const draft=width===320?'7/3':'11/4';await page.locator('#answer').fill(draft);
    await page.waitForFunction(value=>Object.values(JSON.parse(localStorage.getItem('mathexam.profileStart2027.v1')).sessions).some(session=>session.draft===value),draft);
    await page.goto(origin+'/ege-profil/');await page.locator(start).click();await page.locator('[data-journey-start]').waitFor();
    assert.equal(await page.locator('[data-journey-start]').getAttribute('href'),savedRoute,'first-part continuation keeps the same lesson and mode');
    await page.locator('[data-journey-start]').click();await page.locator('#answer').waitFor();
    assert.equal(new URL(page.url()).hash,savedRoute,'first-part continuation restores the task route');
    assert.equal(await page.locator('#answer').inputValue(),draft,'first-part draft survives a return through the complete-course entrance');
   }
  }
 }
 await page.goto(origin+'/ege-profil/#route');assert(await page.locator('#legacy-course').evaluate(n=>n.open),'old deep link opens its containing catalogue');
 assert(await page.locator('#route-h').isVisible());assert.match(await page.locator('#route-h').textContent(),/2026/);
 await page.goto(origin+'/ege-profil/#%');assert(await page.locator('#myCode').textContent(),'malformed anchor does not prevent progress UI');
 await page.goto(origin+'/ege-baza/#today');await page.locator('.course-recommendation summary').click();assert(await page.locator('[data-recommendation] a.btn').first().isVisible(),'old module recommendations remain accessible');
 await checkClockWithoutMediaEvent(page, origin);
 assert.deepEqual(errors,[]);console.log('EGE_COURSE_ENTRIES_OK: 2027, all 20 profile routes and expanded legacy links, restored first-part draft, all 21 base numbers and optional checks, preserved deep links, 320/1280px');
}finally{await browser?.close();if(server.listening)await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;});
