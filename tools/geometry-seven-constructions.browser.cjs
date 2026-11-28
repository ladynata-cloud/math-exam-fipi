'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {chromium} = require('playwright');
const checkPracticeAndArea = require('./geometry-practice-and-area.browser.cjs');
const root = path.resolve(__dirname, '..');
const origin = 'https://mathexam.space';
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml'};

async function openLocalBrowser() {
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined});
  return browser;
}
async function serveRepository(context) {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== origin) return route.abort();
    const name = url.pathname.endsWith('/') ? url.pathname+'index.html' : url.pathname;
    const file = path.resolve(root, '.'+decodeURIComponent(name));
    if (!file.startsWith(root+path.sep)) return route.abort();
    try { await route.fulfill({body:await fs.readFile(file),contentType:mime[path.extname(file)]||'application/octet-stream'}); }
    catch { await route.fulfill({status:404,body:''}); }
  });
}
async function noOverflow(page) {
  assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1), 'Horizontal overflow at '+page.url());
}
async function base(page,id) {
  await page.goto(origin+'/ege-baza/path/index.html#lesson='+id);
  const initial = page.locator('.task-support .plane-figure:visible');
  await initial.waitFor();
  assert.equal(await initial.locator('.construction').count(),0);
  const answers = await page.evaluate(id=>{
    const lesson=PathCourse.state().lessons[id],t=PathData.task(id,lesson.seed);
    return t.steps.map(s=>s.a);
  },id);
  await page.locator('#startSteps').click();
  const fig=page.locator('#taskStepsBody .plane-figure');
  for(let i=0;i<answers.length;i++){
    const build=page.locator('[data-construct="yes"]');
    if(await build.isVisible()){
      assert.equal(await fig.locator('.construction').count(),0);
      if(id==='practice-diameter-chord'){
        await page.locator('[data-construct="no"]').click();
        assert.equal(await fig.locator('.construction').count(),0);
      }
      await build.click();
      assert.equal(await fig.locator('.construction').count(),1);
      await page.reload();
    }
    await page.locator('#stepAnswer:visible').waitFor();
    assert.equal(await page.locator('.plane-figure:visible').count(),1);
    const bounds=await fig.boundingBox(),field=await page.locator('#stepAnswer').boundingBox();
    assert(field.y-(bounds.y+bounds.height)<225,'Drawing too far from input '+id+' step '+i+' gap '+(field.y-bounds.y-bounds.height));
    await noOverflow(page);
    if(process.env.GEOMETRY_QA_DIR && id==='triangle' && i===1){
      await fs.mkdir(process.env.GEOMETRY_QA_DIR,{recursive:true});
      await page.locator('.plane-work').screenshot({path:path.join(process.env.GEOMETRY_QA_DIR,'height-'+page.viewportSize().width+'.png')});
    }
    await page.locator('#stepAnswer').fill(String(answers[i]));
    await page.locator('#stepAnswerForm button[type="submit"]').click();
  }
  await page.getByText('Разбор завершён',{exact:true}).waitFor();
  assert.equal(await page.locator('.plane-history[open] li').count(),answers.length);
}
async function vpr(page,variant) {
  const id='g8-circle-'+variant,leg=variant===3?12:15,r=variant===3?5:8;
  await page.goto(origin+'/trainers/vpr-math/index.html#task='+id);
  const figure=page.locator('.task-card > figure:first-child');
  const angle=figure.locator('[data-angle="OAP"]'),hypotenuse=figure.locator('[data-segment="OP"]');
  await figure.locator('svg').waitFor();
  const radius=figure.locator('[data-segment="OA"]');
  assert.equal(await radius.count(),1);
  assert(await radius.evaluate(node=>getComputedStyle(node).visibility==='visible'&&node.getTotalLength()>0));
  assert.equal(await angle.count(),1);
  assert.equal(await angle.isVisible(),false);
  assert.equal(await hypotenuse.isVisible(),false);
  await page.getByRole('radio',{name:'90°'}).click();
  await page.locator('.step.current [data-action="check"]').click();
  await angle.waitFor();await hypotenuse.waitFor();
  assert.equal(await page.locator('.task-card .step.current input').count(),1);
  const gap=await page.locator('.task-card').evaluate(card=>
    card.querySelector('.step.current input').getBoundingClientRect().top-card.querySelector('svg').getBoundingClientRect().bottom);
  assert(gap<240,'The tangent calculation stays next to its drawing: '+gap);
  await page.locator('.step.current input').fill(String(r*r+leg*leg));
  await page.locator('.step.current [data-action="check"]').click();
  await page.locator('.step.current input').fill(String(Math.hypot(r,leg)));
  await page.locator('.step.current [data-action="check"]').click();
  await page.locator('.complete').waitFor();
  await page.locator('[data-action="mode"][data-mode="solo"]').first().click();
  await page.locator('.step.current').waitFor();
  assert.equal(await angle.isVisible(),false);
  assert.equal(await hypotenuse.isVisible(),false);
  await noOverflow(page);
}
async function textbooks(page) {
  for(const [num,top] of [['032','A'],['033','B']]){
    await page.goto('about:blank');
    await page.goto(origin+'/stereo-course/merzlyak-10-base/index.html#merz-ex-10-'+num);
    await page.locator('svg[data-view="neutral"]').waitFor();
    assert.equal(await page.locator('svg [data-label="H"]').count(),0);
    await page.getByRole('button',{name:'Подсказка по шагу',exact:true}).click();
    await page.locator('svg[data-view="step-1"] [data-segment="'+top+'-H"]').first().waitFor({state:'attached'});
    await page.locator('svg[data-view="step-1"] [data-label="H"]').waitFor();
    await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
    const figure=page.locator('[data-main-model] svg[data-view="step-2"]');
    await figure.waitFor();
    assert.equal(await page.locator('svg[data-view="step-2"]').count(),1);
    const marks=await figure.evaluate(svg=>{
      const strokes=[...svg.querySelectorAll('[data-right-angle], [data-segment^="_r"]')];
      return strokes.map(stroke=>{
        const style=getComputedStyle(stroke);
        let visible=style.visibility==='visible' && style.stroke!=='none' && style.strokeOpacity!=='0';
        for(let el=stroke;visible && el;el=el.parentElement){
          const css=getComputedStyle(el);
          visible=css.display!=='none' && css.opacity!=='0' && css.contentVisibility!=='hidden';
        }
        return {
          name:stroke.getAttribute('data-right-angle') || stroke.getAttribute('data-segment'),
          visible:visible && stroke.getTotalLength()>0
        };
      });
    });
    // The viewer draws each right-angle sign with two strokes. No. 10.33
    // retains its authored square corners from the staged construction.
    const expected=num==='032'
      ? ['A H C','A H C','M A H','M A H']
      : ['_rB1-_rB2','_rB2-_rB3','_rH1-_rH2','_rH2-_rH3'];
    assert.deepEqual(marks.map(mark=>mark.name).sort(),expected);
    assert(marks.every(mark=>mark.visible),'Both right angles have visible strokes');
    await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
    await page.locator('svg[data-view="step-3"]').waitFor();
    await noOverflow(page);
  }
  await page.goto(origin+'/geometry-course/textbook/index.html#atanasyan-7-9-main-488-part-1');
  const diagram=page.locator('svg[data-view]').first();
  await diagram.waitFor();
  assert.equal(await diagram.locator('[data-point="D__case1"]').count(),0);
  const first=page.getByRole('button',{name:'Разобрать по шагам',exact:true});
  if(!await first.isVisible())await page.locator('[data-main-help]>summary').click();
  await first.click();
  await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
  await diagram.locator('[data-point="D__case1"]').first().waitFor();
  assert.equal(await diagram.getAttribute('data-view'),'step-2');
  await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
  await page.locator('svg[data-view="step-3"] polygon.planar-polygon').waitFor();
  await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
  await page.locator('svg[data-view="step-4"]').waitFor();
  await noOverflow(page);
}
async function profile(page,i) {
  await page.goto(origin+'/ege-profil/part-two/index.html#task/p2-15-dihedral-'+i+'/guided');
  await page.locator('[data-construction="0"]').waitFor();
  assert.equal(await page.locator('[data-proof-segment="SM"]').count(),0);
  for(const [n,value] of [[0,'AB'],[1,'MS'],[2,'MO']]){
    await page.locator('[data-construction="'+n+'"]').getByRole('button',{name:value,exact:true}).click();
  }
  await page.locator('#step-answer').waitFor();
  assert.equal(await page.locator('form [data-right-angle]').count(),2);
  await page.reload();await page.locator('#step-answer').waitFor();
  const a=[8,6,10,12,14,16][i-1],h=[3,4,6,5,9,6][i-1];
  for(const [index,answer] of [String(a/2),'90',2*h+'/'+a].entries()){
    await page.locator('#step-form').getByText('Шаг '+(index+1)+' из 3',{exact:true}).waitFor();
    await page.locator('#step-answer').fill(answer);
    await page.locator('#step-form button[type=submit]').click();
  }
  await page.getByText(/Шаги пройдены/).waitFor();
  await page.locator('#final-0').fill(2*h+'/'+a);
  await page.locator('#final-form button[type=submit]').click();
  await page.locator('#completion').waitFor();
  await noOverflow(page);
}
async function oge(page) {
  await page.goto(origin+'/trainers/oge-task25-geometry.html');
  const svg=page.locator('#panel-train svg').first();
  await svg.waitFor();
  assert.deepEqual([...new Set(await svg.locator('text').allTextContents())].sort(),['A','B','C','D','E','P']);
  assert(await svg.locator('polyline').count()>=1);
  await page.locator('#courseSettings>summary').click();
  await page.locator('[data-tab="learn"]').click();
  await page.getByText(/BE — биссектриса, AD — медиана/).first().waitFor();
}
(async()=>{
  for(const width of [320,1280]){
    const browser=await openLocalBrowser();
    try{
      const context=await browser.newContext({viewport:{width,height:800}});
      await serveRepository(context);
      const page=await context.newPage(),errors=[];
      page.setDefaultTimeout(9000);
      page.on('pageerror',error=>errors.push(error.message));
      for(const id of ['triangle','circle','practice-diameter-chord'])await base(page,id);
      await oge(page);await vpr(page,3);await vpr(page,4);await textbooks(page);
      for(let i=1;i<=6;i++)await profile(page,i);
      await checkPracticeAndArea(page,origin);
      await checkPracticeAndArea.checkManaged(page,origin);
      assert.deepEqual(errors,[]);
      console.log('All seven corrections and six dihedral variants at '+width+'px');
    }finally{await browser.close();}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
