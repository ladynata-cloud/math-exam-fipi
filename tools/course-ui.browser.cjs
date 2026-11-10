'use strict';
// Run in CI. A paired control renders each same page without the new shell.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const pages = require('../assets/course-ui-pages.json');
const scenarios = [
  ...['box','sections'].map(id=>({
    file:'stereo-course/index.html',family:'stereo',name:'stereo-'+id,
    hash:'#'+id,ready:'#answer-form',compactHeading:'.workspace > h1',
    model:'#task-model svg',preserveModelTop:true
  })),
  ...Object.entries(pages).map(([file,family])=>({file,family})),
  {
    file:'trainers/vpr-math/index.html', family:'vpr', name:'vpr-route-g5',
    hash:'#view=route&route=g5', ready:'.route-head h1',
    contrast:{background:'.route-head',text:['.route-head h1','.route-head .eyebrow']}
  },
  {
    file:'geometry-course/textbook/index.html', family:'geometry', name:'geometry-textbook-task',
    hash:'#atanasyan-7-9-main-1-part-1', ready:'.textbook-lesson-header h1',
    compactHeading:'.textbook-lesson-header h1', model:'[data-main-model] .planar-svg'
  },
  {
    file:'ege-profil/start/index.html', family:'profile', name:'profile-practice',
    hash:'#practice/geo-angles/independent', ready:'.practice-head h1',
    compactHeading:'.practice-head h1'
  },
  {
    file:'ege-profil/start/index.html', family:'profile', name:'profile-similarity',
    hash:'#practice/geo-similarity/independent', ready:'#answer-form',
    compactHeading:'.practice-head h1', model:'#task-model svg', firstScreenModel:true
  },
  {
    file:'school/makarychev8/index.html', family:'textbook', name:'makarychev8-ex041',
    hash:'#lesson/p02/' + (require('../school/makarychev8/exercises-25-54.json').findIndex(task=>task.id==='p02-ex041-')+6),
    ready:'#task-graph', model:'#task-graph', firstScreenModel:true
  }
];
const root = path.resolve(__dirname, '..');
const out = process.env.ARTIFACT_DIR;
assert(out, 'Set ARTIFACT_DIR for review screenshots');
fs.mkdirSync(out, {recursive:true});
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server = http.createServer((req,res)=>{
  try {
    let file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://local').pathname));
    if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
    if (fs.statSync(file).isDirectory()) file = path.join(file,'index.html');
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404).end(); }
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE_PATH});
  const results = [], failures = [];
  try {
    for (const width of [1280,320]) {
      for (const scenario of scenarios) {
        const {file,family,name=file,hash=''} = scenario;
        const samples = [];
        for (const control of [true,false]) {
          const context = await browser.newContext({viewport:{width,height:900}});
          const page = await context.newPage(), errors = [];
          page.on('pageerror', e=>errors.push(e.message));
          await context.route('**/*', route=>{
            const url = new URL(route.request().url());
            if(url.origin!==origin) return route.abort();
            // Redirect destinations need the same unstyled control as the entry.
            const documentFile = decodeURIComponent(url.pathname).replace(/^\//,'').replace(/\/$/,'/index.html');
            if(control && route.request().resourceType()==='document' && Object.hasOwn(pages,documentFile)) {
              const html = fs.readFileSync(path.join(root,documentFile),'utf8')
                .replace('<link rel="stylesheet" href="/assets/course-ui.css?v=20261109-1">\n','')
                .replace(/ data-mx-course="[^"]+"/,'');
              return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
            }
            return route.continue();
          });
          try {
            await page.goto(origin + '/' + file + hash,{waitUntil:'load'});
            if(file==='courses/vilenkin-6-part-1/index.html') {
              await page.waitForURL(url=>url.pathname==='/courses/vilenkin-6-part-1/textbook.html',{waitUntil:'load'});
            }
            await page.locator(scenario.ready || 'h1').first().waitFor({state:'visible',timeout:15000});
            if(scenario.model) await page.locator(scenario.model).waitFor({state:'visible',timeout:15000});
            const sample = await page.evaluate(({compactHeading,model,contrast})=>{
              const result = {
                url:location.href,
                width:document.documentElement.clientWidth,
                scrollWidth:document.documentElement.scrollWidth,
                colour:getComputedStyle(document.body).backgroundColor,
                family:document.body.dataset.mxCourse,
                heading:document.querySelector('h1').innerText,
                styles:[...document.styleSheets].filter(s=>s.href?.includes('/course-ui.css')).map(s=>s.cssRules.length)
              };
              if(compactHeading) {
                const style=getComputedStyle(document.querySelector(compactHeading));
                result.compactHeading=Object.fromEntries(['fontSize','marginTop','marginBottom'].map(key=>[key,parseFloat(style[key])]));
              }
              if(model) {
                const element=document.querySelector(model),rect=element.getBoundingClientRect();
                result.model={width:rect.width,height:rect.height,top:rect.top,bottom:rect.bottom,viewBox:element.getAttribute('viewBox')};
              }
              if(contrast) {
                // These regression fixtures use an opaque, solid panel background.
                function luminance(colour) {
                  const rgb=colour.match(/^rgba?\(([^)]+)\)$/)?.[1].split(',').map(Number);
                  if(!rgb || rgb.length<3 || (rgb.length===4 && rgb[3]!==1)) throw Error('Expected opaque RGB colour: '+colour);
                  return rgb.slice(0,3).map(value=>{
                    const channel=value/255;
                    return channel<=0.04045?channel/12.92:((channel+0.055)/1.055)**2.4;
                  }).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
                }
                const background=getComputedStyle(document.querySelector(contrast.background)).backgroundColor;
                result.contrast=contrast.text.map(selector=>{
                  const colour=getComputedStyle(document.querySelector(selector)).color;
                  const levels=[luminance(colour),luminance(background)].sort((a,b)=>a-b);
                  return {selector,colour,background,ratio:(levels[1]+0.05)/(levels[0]+0.05)};
                });
              }
              return result;
            },scenario);
            sample.errors=errors.sort(); samples.push(sample);
            if(control) {
              if(scenario.preserveModelTop) await page.screenshot({path:path.join(out,name+'-'+width+'-without-shell.png'),animations:'disabled'});
              assert.equal(sample.family,undefined,'Control document must not opt into the shared CSS');
              assert.equal(sample.styles.length,0,'Control document must not load the shared CSS');
            }
            if(!control) {
              await page.screenshot({path:path.join(out,name.replaceAll('/','-')+'-'+width+'.png'),animations:'disabled'});
              assert.equal(sample.family,family);
              assert.equal(sample.colour,'rgb(246, 247, 242)');
              assert.ok(sample.styles[0]>20,'Shared CSS parsed and loaded');
              assert.deepEqual(sample.errors,samples[0].errors,'No additional page errors');
              assert.ok(sample.scrollWidth<=width+1,
                `Horizontal page overflow: ${sample.scrollWidth} > ${width} (control ${samples[0].scrollWidth})`);
              if(scenario.compactHeading) {
                for(const [property,value] of Object.entries(sample.compactHeading)) {
                  assert.ok(value<=samples[0].compactHeading[property]+0.1,
                    `Compact heading ${property} grew: ${samples[0].compactHeading[property]} -> ${value}`);
                }
              }
              if(scenario.model) {
                assert.ok(sample.model.width>0 && sample.model.height>0,'Task drawing is rendered');
                if(scenario.firstScreenModel) assert.ok(sample.model.top>=0 && sample.model.bottom<=900,
                  `Complete task drawing must fit the first screen: ${JSON.stringify(sample.model)}`);
                if(scenario.preserveModelTop) assert.ok(sample.model.top<=samples[0].model.top+1,
                  `Task drawing moved down: ${samples[0].model.top} -> ${sample.model.top}`);
                assert.equal(sample.model.viewBox,samples[0].model.viewBox,'Drawing coordinate system is unchanged');
                for(const dimension of ['width','height']) assert.ok(sample.model[dimension]>=samples[0].model[dimension]-1,
                  `Task drawing ${dimension} shrank: ${samples[0].model[dimension]} -> ${sample.model[dimension]}`);
              }
              if(scenario.contrast) {
                for(const [index,text] of sample.contrast.entries()) {
                  assert.ok(text.ratio>=4.5,`${text.selector} contrast is ${text.ratio.toFixed(2)}:1; expected at least 4.5:1`);
                  assert.ok(text.ratio>=samples[0].contrast[index].ratio-0.01,
                    `${text.selector} contrast fell from ${samples[0].contrast[index].ratio.toFixed(2)}:1 to ${text.ratio.toFixed(2)}:1`);
                }
              }
              if(file==='courses/index.html') {
                await page.getByText('Как учиться в любом курсе',{exact:true}).click();
                assert.equal(await page.locator('.mx-course-guide').getAttribute('open'),'');
                await page.screenshot({path:path.join(out,'learning-guide-'+width+'.png'),animations:'disabled'});
              }
            }
          } catch(e) { failures.push({file,scenario:name,hash,width,control,error:e.message}); }
          finally { await context.close(); }
        }
        results.push({file,scenario:name,hash,width,samples});
      }
    }
  } finally {
    await browser.close(); server.close();
    fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,failures},null,2));
  }
  for(const failure of failures) console.error(JSON.stringify(failure));
  assert.equal(failures.length,0,'Course layout regressions');
  console.log(`COURSE_UI_BROWSER_OK: ${Object.keys(pages).length} entrances + ${scenarios.length-Object.keys(pages).length} task/route regressions × 2 widths, paired controls`);
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
