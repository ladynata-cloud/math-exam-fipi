'use strict';
// Verify the actual public bytes and learning journeys after the established Pages release.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..'), output = path.join(root, 'artifacts/skill-release');
fs.mkdirSync(output, {recursive:true});
const origin = 'https://mathexam.space';
const sha = execFileSync('git', ['rev-parse','HEAD'], {cwd:root,encoding:'utf8'}).trim();
const required = [
  'ege-baza/index.html','ege-baza/app.js','ege-baza/skill-map-data.js','ege-baza/skill-map.js','ege-baza/skill-map.css',
  'ege-baza/star-sky.js','ege-baza/star-sky.css','ege-baza/path/index.html','ege-baza/path/task-first.js',
  'ege-baza/algebra/index.html','ege-baza/algebra/app.js','ege-baza/percent/index.html','ege-baza/percent/app.js','ege-baza/percent/style.css',
  'ege-baza/reasoning/index.html','ege-baza/reasoning/app.js','ege-baza/work-rate/index.html','ege-baza/work-rate/app.js',
  'ege-baza/labs/index.html','ege-baza/labs/labs.js','trainers/ege-baza/index.html',
  'trainers/ege-baza/course/index.html','trainers/ege-baza/data-course/index.html'
];
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expected = new Map(required.map(file => [file,digest(fs.readFileSync(path.join(root,file)))]));
const report = {commit:sha, origin, started:new Date().toISOString(), files:[], checks:[], failures:[]};
function ok(condition, message) { assert.ok(condition, message); report.checks.push(message); }
async function publicFile(file) {
  try {
    const response = await fetch(origin + '/' + file + '?release=' + sha, {signal:AbortSignal.timeout(15000), cache:'no-store'});
    const bytes = Buffer.from(await response.arrayBuffer());
    return {file,status:response.status,sha256:digest(bytes),matches:response.ok && digest(bytes) === expected.get(file)};
  } catch (error) { return {file,status:0,matches:false,error:error.message}; }
}
async function waitForPages() {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (true) {
    const results = await Promise.all(required.map(publicFile));
    report.files = results;
    const pending = results.filter(item => !item.matches);
    if (!pending.length) return;
    console.log('Waiting for Pages: ' + pending.length + '/' + required.length + ' resources still differ.');
    fs.writeFileSync(path.join(output,'release.json'),JSON.stringify(report,null,2));
    if (Date.now() >= deadline) throw Error('Public resources did not match the tested commit: ' + pending.map(item => item.file).join(', '));
    await new Promise(resolve => setTimeout(resolve,15000));
  }
}
let browser;
(async () => {
  try {
    await waitForPages();
    ok(report.files.every(file=>file.matches),'All 23 public resources match the released checkout byte for byte');
    browser = await chromium.launch({headless:true, args:['--no-sandbox']});
    for (const width of [320,1280]) {
      const context = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
      const page = await context.newPage(), errors = [];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(origin+'/ege-baza/?release='+sha+'#map',{waitUntil:'networkidle'});
      await page.locator('.star-sky').waitFor();
      ok(await page.locator('[data-star-position]').count()===21,'Public sky has 21 stars at '+width);
      ok(await page.locator('[data-exam-position]').count()===21,'All numbered cards remain at '+width);
      ok(await page.locator('.star-sky').getAttribute('data-motion')==='paused','Reduced-motion sky remains still at '+width);
      const boxes = await page.locator('[data-star-position]').evaluateAll(nodes=>nodes.map(node=>{
        const rect=node.getBoundingClientRect();return {x:rect.x,y:rect.y,w:rect.width,h:rect.height};
      }));
      ok(boxes.every(rect=>rect.w>=44&&rect.h>=44&&rect.x>=0&&rect.x+rect.w<=width+.5),'Public sky touch targets fit at '+width);
      ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Public landing has no horizontal overflow at '+width);
      await page.locator('[data-star-position="17"]').click();
      ok((await page.locator('[data-sky-detail]').innerText()).includes('Уравнения'),'Selecting star 17 shows equations at '+width);
      await page.screenshot({path:path.join(output,'sky-'+width+'.png'),fullPage:false});
      await page.locator('[data-sky-skills]').click();
      await page.waitForURL(url=>url.hash==='#task?pos=17&skills=1');
      ok(await page.locator('[data-ege-skill-map]').evaluate(node=>node.open),'Public skill link opens its map at '+width);
      ok(await page.locator('[data-skill-node]').count()>=3,'Public position has concrete skills at '+width);
      await page.locator('[data-journey-item="equations"] a').first().click();
      await page.locator('#answer').waitFor();
      await page.locator('#answer').fill('12/');
      const before = await page.evaluate(()=>PathCourse.state().lessons.equations);
      const map = page.locator('[data-ege-skill-map="equations"]');
      await map.locator(':scope > summary').click();
      ok(await page.locator('#answer').inputValue()==='12/','Opening the public map preserves the answer draft at '+width);
      const after = await page.evaluate(()=>PathCourse.state().lessons.equations);
      ok(after.seed===before.seed&&after.help===true&&after.independent===before.independent,'Public map marks help and keeps seed/results at '+width);
      await page.screenshot({path:path.join(output,'trainer-map-'+width+'.png'),fullPage:true});
      await page.goto(origin+'/ege-baza/path/index.html?release='+sha+'#exam',{waitUntil:'networkidle'});
      await page.locator('#start').click();
      await page.waitForFunction(()=>window.PathCourse?.state().active?.kind==='exam');
      ok(await page.locator('[data-ege-skill-map]').count()===0,'Public exam contains no learning map at '+width);
      ok(errors.length===0,'No public JavaScript errors at '+width+': '+errors.join('; '));
      await context.close();
    }
    report.status='PASS';
    console.log('EGE_BASE_STAR_SKILL_RELEASE_PASS: '+report.checks.length+' checks; 23 exact public files; 320/1280px real browser journeys.');
  } catch (error) {
    report.status='FAIL';report.failures.push(error.stack||error.message);process.exitCode=1;console.error(error);
  } finally {
    if (browser) await browser.close();
    report.finished=new Date().toISOString();
    fs.writeFileSync(path.join(output,'release.json'),JSON.stringify(report,null,2));
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      '## Base EGE star and skill release\n\nCommit: '+sha+'\n\nStatus: '+report.status+'\n\n'+report.checks.map(item=>'- '+item).join('\n')+
      (report.failures.length?'\n\nFailures: '+report.failures.join('\n'):'')+'\n');
  }
})();
