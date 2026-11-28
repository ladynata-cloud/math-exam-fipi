'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const manifest = require('../downloads/trainers-manifest.json');
const root = path.resolve(__dirname,'..');
const slugs = ['long-division-stepwise','rounding-stepwise','simple-equations-stepwise'];
const disk = href => path.join(root,href.slice(1));
const guide = fs.readFileSync(path.join(root,'pedagogam/kak-skachat-i-adaptirovat-trenazher/index.html'),'utf8');
const extract = [
  'import sys, zipfile, pathlib',
  'archive, standalone, target = map(pathlib.Path, sys.argv[1:])',
  'with zipfile.ZipFile(archive) as z:',
  '    assert z.testzip() is None, archive',
  '    names = [i.filename for i in z.infolist() if not i.is_dir() and pathlib.PurePosixPath(i.filename).name == standalone.name]',
  '    assert len(names) == 1, (archive,names)',
  '    data = z.read(names[0])',
  '    assert data == standalone.read_bytes(), archive',
  '    target.write_bytes(data)'
].join('\n');

async function rounding(page) {
  await page.locator('#rounding-options summary').click();
  await page.locator('#place').selectOption('1');
  const prompt = await page.locator('#prompt').innerText();
  const match = /^Округли число (\d+) до десятков$/.exec(prompt);
  assert(match,prompt);
  const n = Number(match[1]), answer = Math.floor((n+5)/10)*10;
  const digits = page.locator('#digits button[data-i]');
  const target = digits.filter({has:page.locator('small',{hasText:/^десятки$/})});
  const right = digits.filter({has:page.locator('small',{hasText:/^единицы$/})});
  assert.equal(await target.count(),1);
  assert.equal(await right.count(),1);
  await target.click();
  await right.click();
  await page.locator(n%10>=5?'#up':'#keep').click();
  await page.locator('#ans').fill(String(answer+10));
  await page.locator('#check').click();
  assert(await page.locator('#fb.err').isVisible());
  assert.equal(await page.locator('#total').textContent(),'0');
  await page.locator('#ans').fill(String(answer));
  await page.locator('#check').click();
  assert(await page.locator('#fb.ok').isVisible());
  assert.equal(await page.locator('#total').textContent(),'1');
  assert.equal(await page.locator('#right').textContent(),'0');
}
async function equations(page) {
  const eq = (await page.locator('#eq').innerText()).trim();
  let m, answer, op;
  if ((m=/^x \+ (\d+) = (-?\d+)$/.exec(eq))) {op='Minus';answer=Number(m[2])-Number(m[1]);}
  else if ((m=/^x − (\d+) = (-?\d+)$/.exec(eq))) {op='Plus';answer=Number(m[2])+Number(m[1]);}
  else if ((m=/^(\d+) · x = (-?\d+)$/.exec(eq))) {op='Divide';answer=Number(m[2])/Number(m[1]);}
  else if ((m=/^x : (\d+) = (-?\d+)$/.exec(eq))) {op='Multiply';answer=Number(m[1])*Number(m[2]);}
  else throw Error('Unexpected equation: '+eq);
  assert(Number.isInteger(answer));
  assert(await page.locator('#ans').isDisabled());
  await page.locator('#op'+op).click();
  await page.locator('#ans').fill(String(answer));
  await page.locator('#check').click();
  assert.match(await page.locator('#fb').innerText(),/Верно самостоятельно/);
  assert.equal(await page.locator('#right').textContent(),'1');
}
async function division(page) {
  assert.equal((await page.locator('#problem').innerText()).trim(),'48 : 2');
  const plan=await page.evaluate(()=>DivisionGuided.plan(DivisionGuided.make('start',0)));
  assert.equal(Number(plan.quotient),24);
  assert(plan.actions.length>5);
  assert.equal(plan.actions[0].answer,'4');
  await page.locator('#answer').fill('999');
  await page.locator('#primary').click();
  assert(await page.locator('#feedback.error').isVisible());
  for(const [i,action] of plan.actions.entries()){
    assert.match(await page.locator('#step-counter').innerText(),new RegExp('Шаг '+(i+1)+' из '+plan.actions.length));
    if(action.options)await page.locator('#answer-options button[data-option='+JSON.stringify(action.answer)+']').click();
    else await page.locator('#answer').fill(action.answer);
    await page.locator('#primary').click();
  }
  await page.locator('#completion').waitFor({state:'visible'});
  assert.match(await page.locator('#completion-text').innerText(),/Ответ: 24(?:\.|$)/);
  assert(!/без ошибок и подсказок/.test(await page.locator('#completion-text').innerText()));
}
const scenarios={'rounding-stepwise':rounding,'simple-equations-stepwise':equations,'long-division-stepwise':division};
(async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'math-offline-entrance-'));
  let browser;
  try {
    browser=await chromium.launch({headless:true});
    for(const slug of slugs){
      const entry=manifest.trainers.find(e=>e.slug===slug);
      assert(entry?.public && entry.mode==='single' && !entry.adaptation,slug);
      for(const href of [entry.sourceHtml,entry.package]){
        assert.equal(guide.split('href="'+href+'"').length,2,href);
        assert(fs.statSync(disk(href)).size>0,href);
      }
      const extracted=path.join(dir,slug+'.html');
      execFileSync('python3',['-c',extract,disk(entry.package),disk(entry.downloadHtml),extracted]);
      for(const file of [disk(entry.downloadHtml),extracted]){
        for(const width of [320,1280]){
          const context=await browser.newContext({offline:true,viewport:{width,height:900},reducedMotion:'reduce'});
          try{
            const page=await context.newPage(),errors=[],network=[];
            page.on('pageerror',e=>errors.push(e.message));
            page.on('request',req=>{if(/^https?:/.test(req.url()))network.push(req.url())});
            await context.route(/^https?:\/\//,route=>route.abort());
            await page.goto(pathToFileURL(file).href);
            assert.equal(new URL(page.url()).protocol,'file:');
            await scenarios[slug](page);
            assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),slug+' overflow '+width);
            assert.deepEqual(errors,[],slug+' runtime errors');
            assert.deepEqual(network,[],slug+' network requests while offline');
          }finally{await context.close();}
        }
      }
      console.log('PASS '+slug+' standalone + exact ZIP HTML, 320/1280, actual exercise, no network');
    }
    console.log('OFFLINE_ENTRANCE_OK: three legacy ZIPs, six paths, twelve real offline exercises');
  } finally {await browser?.close();fs.rmSync(dir,{recursive:true,force:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
