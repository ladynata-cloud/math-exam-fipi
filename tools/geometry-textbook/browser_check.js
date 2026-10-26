'use strict';
// Runs in cloud/CI. The public entry point does not enable the engineering preview.
// This gate inspects authored views without changing review flags or bundle files.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),os=require('node:os'),crypto=require('node:crypto');
const {chromium}=require('playwright');
const root=path.resolve(process.env.GEOMETRY_TEXTBOOK_ROOT||path.join(__dirname,'../..'));
const bundleFile=path.join(root,'geometry-course/textbook/data/course.json');
const bundle=JSON.parse(fs.readFileSync(bundleFile,'utf8'));
const releaseScope=JSON.parse(fs.readFileSync(path.join(root,'tools/geometry-textbook/release-scope.json'),'utf8'));
assert.equal(bundle.lessons.length,releaseScope.totalCards,'Complete release candidate must contain every source-audited card');
for(const chapter of releaseScope.chapters)assert.equal(bundle.lessons.filter(l=>l.source.chapter===chapter.label).length,chapter.cards,'Complete chapter '+chapter.chapter);
const out=path.resolve(process.env.GEOMETRY_TEXTBOOK_ARTIFACTS||path.join(os.tmpdir(),'atanasyan-planar-browser'));
fs.mkdirSync(out,{recursive:true});
const interactionsOnly=process.env.GEOMETRY_TEXTBOOK_INTERACTIONS_ONLY==='1',viewsOnly=process.env.GEOMETRY_TEXTBOOK_VIEWS_ONLY==='1';
assert(!(interactionsOnly&&viewsOnly),'Select at most one focused browser mode');
// Optional full scene captures supplement, never replace, the existing gate.
const captureChapters=new Set((process.env.GEOMETRY_TEXTBOOK_CAPTURE_CHAPTERS||'').split(',').map(s=>s.trim()).filter(Boolean));
for(const chapter of captureChapters)assert(releaseScope.chapters.some(c=>c.label===chapter),'Unknown capture chapter '+chapter);
const evidence={schemaVersion:1,gateScriptSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),scope:interactionsOnly?'interactions-only':viewsOnly?'views-only':'full-course',head:process.env.GEOMETRY_TEXTBOOK_HEAD||process.env.GITHUB_SHA||null,implementationSha256:bundle.build?.implementationSha256||null,authoredContentSha256:bundle.build?.authoredContentSha256||null,bundleSha256:crypto.createHash('sha256').update(fs.readFileSync(bundleFile)).digest('hex'),widths:[320,1280],lessons:bundle.lessons.length,views:[],stepFlows:[],screenshots:[],reviewScreenshots:[],interactions:[],errors:[],completed:false};
let server,browser,context,page,base;
const write=()=>fs.writeFileSync(path.join(out,'browser-evidence.json'),JSON.stringify(evidence,null,2));
function serve(){return new Promise(resolve=>{server=http.createServer((request,response)=>{try{const url=new URL(request.url,'http://127.0.0.1'),pathname=decodeURIComponent(url.pathname),file=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));if(!file.startsWith(root+path.sep))return response.writeHead(403).end();const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8'};response.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).on('error',()=>response.end()).pipe(response);}catch{response.writeHead(404).end();}});server.listen(0,'127.0.0.1',()=>resolve('http://127.0.0.1:'+server.address().port+'/geometry-course/textbook/'));});}
async function settle(){await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
async function startPreview(initialId=null){
 await page.goto(base+(initialId?'#'+initialId:''));await page.waitForFunction(()=>window.GeometryTextbook&&window.textbookApp);
 if(initialId&&bundle.build?.publicationReviewMatches===true)assert.equal(await page.locator('.lesson-permalink').getAttribute('href'),'#'+initialId,'Reviewed public entry opens the requested source card');
 await page.evaluate(async initialId=>{const bundle=await(await fetch('data/course.json')).json();window.textbookApp.destroy();
  // Unreviewed cards remain unavailable at the public entry. Set only this
  // engineering fixture's URL before creating its explicitly labelled preview.
  if(initialId&&bundle.build?.publicationReviewMatches!==true)history.replaceState(null,'','#'+initialId);
  window.textbookApp=GeometryTextbook.createApp(document.getElementById('textbook-app'),{...bundle,allowInReview:bundle.build?.publicationReviewMatches!==true});window.__bundle=bundle;
 },initialId);
 assert.equal(await page.locator('[data-preview-notice]').count(),bundle.build?.publicationReviewMatches===true?0:1,'Only explicit engineering preview is labelled');
}
async function inspect(){return page.locator('[data-main-model] svg').evaluate(svg=>{
 const b=svg.viewBox.baseVal,m=svg.getScreenCTM(),scale=Math.min(Math.hypot(m.a,m.b),Math.hypot(m.c,m.d)),labels=[...svg.querySelectorAll('.planar-label')].map(node=>{const r=node.getBBox();return{id:node.dataset.point,placement:node.dataset.labelPlacement,offset:[Number(node.dataset.offsetX),Number(node.dataset.offsetY)],text:node.textContent,x:r.x,y:r.y,width:r.width,height:r.height,pixels:Number(node.getAttribute('font-size'))*scale};}),issues=[];
 for(const label of labels){if(!['authored','adjusted'].includes(label.placement))issues.push('unresolved label placement '+label.id);if(label.pixels<17.6)issues.push('small label '+label.id+': '+label.pixels);if(label.x<b.x||label.y<b.y||label.x+label.width>b.x+b.width||label.y+label.height>b.y+b.height)issues.push('clipped label '+label.id);}
 for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i],b=labels[j];if(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>.3&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>.3)issues.push('overlapping labels '+a.id+'/'+b.id);}
 if(/(?:NaN|Infinity)/.test(svg.outerHTML))issues.push('nonfinite SVG');
 if(document.documentElement.scrollWidth>innerWidth+1)issues.push('horizontal document overflow');
 const edges=[];for(const edge of svg.querySelectorAll('line.planar-edge,polyline.planar-edge,line.planar-marker,polyline.planar-marker')){if(edge.tagName.toLowerCase()==='line')edges.push([[edge.x1.baseVal.value,edge.y1.baseVal.value],[edge.x2.baseVal.value,edge.y2.baseVal.value]]);else for(let i=1;i<edge.points.numberOfItems;i++){const p=edge.points.getItem(i-1),q=edge.points.getItem(i);edges.push([[p.x,p.y],[q.x,q.y]]);}}
 function crosses(p,q,label){const lo=[label.x+.2,label.y+.2],hi=[label.x+label.width-.2,label.y+label.height-.2];let enter=0,leave=1;for(let axis=0;axis<2;axis++){const d=q[axis]-p[axis];if(Math.abs(d)<1e-9){if(p[axis]<=lo[axis]||p[axis]>=hi[axis])return false;continue;}let a=(lo[axis]-p[axis])/d,b=(hi[axis]-p[axis])/d;if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);leave=Math.min(leave,b);}return leave>enter&&Math.hypot(q[0]-p[0],q[1]-p[1])*(leave-enter)>.2;}
 const lineThroughLabel=[];for(const label of labels)for(const edge of edges)if(crosses(...edge,label))lineThroughLabel.push({label:label.id,edge});for(const id of new Set(lineThroughLabel.map(x=>x.label)))issues.push('line through label '+id);
 const circles=[...svg.querySelectorAll('circle.planar-edge')].map(node=>({x:node.cx.baseVal.value,y:node.cy.baseVal.value,r:node.r.baseVal.value})),circleThroughLabel=[];
 for(const circle of circles){
  if(circle.x-circle.r<b.x-.01||circle.y-circle.r<b.y-.01||circle.x+circle.r>b.x+b.width+.01||circle.y+circle.r>b.y+b.height+.01)issues.push('clipped circle');
  for(const label of labels){
   const left=label.x+.2,right=label.x+label.width-.2,top=label.y+.2,bottom=label.y+label.height-.2;
   const nearest=Math.hypot(Math.max(left-circle.x,0,circle.x-right),Math.max(top-circle.y,0,circle.y-bottom));
   const farthest=Math.max(...[[left,top],[left,bottom],[right,top],[right,bottom]].map(([x,y])=>Math.hypot(x-circle.x,y-circle.y)));
   if(nearest<circle.r-.05&&farthest>circle.r+.05)circleThroughLabel.push({label:label.id,circle});
  }
 }
 for(const id of new Set(circleThroughLabel.map(x=>x.label)))issues.push('circle through label '+id);
 // SVG viewBox containment alone does not detect a tall drawing hidden below
 // the scroll viewport at its initial 100% zoom. Check the actual CSS clip too.
 const viewport=svg.closest('.planar-viewport'),rect=viewport.getBoundingClientRect();
 const clip={left:rect.left+viewport.clientLeft,top:rect.top+viewport.clientTop};clip.right=clip.left+viewport.clientWidth;clip.bottom=clip.top+viewport.clientHeight;
 const viewportClipping=[];
 for(const [index,node] of [...svg.querySelectorAll('.planar-label,.planar-point,.planar-edge,.planar-marker,.planar-polygon')].entries()){
  const r=node.getBoundingClientRect();let strokePadX=0,strokePadY=0;
  if(node.matches('circle,ellipse,line,path,polygon,polyline,rect')){
   const style=getComputedStyle(node),halfStroke=parseFloat(style.strokeWidth)/2,matrix=node.getScreenCTM();
   if(style.stroke!=='none'&&Number(style.strokeOpacity)!==0&&halfStroke>0&&matrix){
    // DOM geometry bounds exclude painted strokes. The CTM row norms give
    // their maximum screen-space extension along each axis (round caps/joins).
    const fixed=style.vectorEffect==='non-scaling-stroke';
    strokePadX=halfStroke*(fixed?1:Math.hypot(matrix.a,matrix.c));
    strokePadY=halfStroke*(fixed?1:Math.hypot(matrix.b,matrix.d));
   }
  }
  if(r.left-strokePadX<clip.left-.05||r.top-strokePadY<clip.top-.05||r.right+strokePadX>clip.right+.05||r.bottom+strokePadY>clip.bottom+.05){
   const label=node.classList.contains('planar-label')?node.dataset.point:null;
   viewportClipping.push({index,tag:node.tagName,label,x:r.left-clip.left,y:r.top-clip.top,width:r.width,height:r.height,strokePadX,strokePadY});
   issues.push(label?'viewport clips label '+label:'viewport clips geometry '+index);
  }
 }
 return {view:svg.dataset.view,labels,lineThroughLabel,circleThroughLabel,viewport:{width:viewport.clientWidth,height:viewport.clientHeight},viewportClipping,issues};
});}
async function expansion(selector,label){
 const scope=page.locator(selector);const before=await scope.locator('svg').evaluate(node=>{window.__expandedSvg=node;return node.dataset.view;});const draft=await page.locator('#final-answer').count()?await page.locator('#final-answer').inputValue():null;
 for(const closeBy of ['button','Escape']){
  await scope.getByRole('button',{name:'На весь экран',exact:true}).click();await page.waitForFunction(()=>document.fullscreenElement!==null||!!document.querySelector('.planar-expanded'));await settle();await page.screenshot({path:path.join(out,'expanded-'+label+'-'+closeBy+'.png'),fullPage:false});
  if(closeBy==='Escape')await page.keyboard.press('Escape');else await scope.getByRole('button',{name:/Выйти из полного экрана|Закрыть большой чертёж/}).click();
  await page.waitForFunction(()=>!document.fullscreenElement&&!document.querySelector('.planar-expanded'));await settle();assert(await scope.locator('svg').evaluate(node=>node===window.__expandedSvg),'Expansion retains the actual SVG '+label);assert.equal(await scope.locator('svg').getAttribute('data-view'),before,'Expansion retains selected view '+label);if(draft!==null)assert.equal(await page.locator('#final-answer').inputValue(),draft,'Expansion retains answer '+label);
 }
 evidence.interactions.push('expansion-'+label+'-button-and-Escape');
}
async function interactions(){
 const exercise=bundle.lessons.find(l=>l.kind==='exercise'&&l.steps.length>1);assert(exercise,'Exercise with authored steps');
 await page.evaluate(()=>localStorage.clear());await page.evaluate(id=>window.textbookApp.open(id),exercise.id);const key='mathExamTextbook.v1:'+exercise.source.bookId+':'+exercise.id+':r'+exercise.revision;
 await page.locator('#final-answer').fill('Моё рассуждение до подсказки.');
 await page.locator('[data-main-help] > summary').click();await page.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();await page.getByRole('button',{name:'Следующий шаг',exact:true}).click();
 assert.equal(await page.locator('[data-step]').count(),2,'Previous steps remain visible');assert.equal(await page.locator('#final-answer').inputValue(),'Моё рассуждение до подсказки.');
 const saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(saved.revealed,2);assert.equal(saved.assisted,true);
 await startPreview();await page.evaluate(id=>window.textbookApp.open(id),exercise.id);assert.equal(await page.locator('#final-answer').inputValue(),'Моё рассуждение до подсказки.');assert.equal(await page.locator('[data-step]').count(),2);evidence.interactions.push('notes-and-steps-reload');
 const sample=bundle.lessons.find(l=>l.help.some(h=>(h.theoryIds||[]).length));
 if(sample){await page.evaluate(id=>window.textbookApp.open(id),sample.id);await page.locator('#final-answer').fill('Запись перед теорией.');if(!await page.locator('[data-main-help]').evaluate(n=>n.open))await page.locator('[data-main-help] > summary').click();const help=page.locator('[data-main-help] [data-help]').first();await help.locator(':scope > summary').click();await help.getByRole('button',{name:/^Почему\?/}).first().click();await page.locator('dialog').waitFor({state:'visible'});await expansion('dialog .textbook-model','theory-1280');assert.equal(await page.locator('dialog').count(),1,'First Escape only closes expanded drawing');await page.locator('dialog > button').first().click();assert.equal(await page.locator('#final-answer').inputValue(),'Запись перед теорией.');evidence.interactions.push('theory-return-retains-answer');}
 await page.evaluate(id=>window.textbookApp.open(id),exercise.id);await page.locator('[data-final-form] button').click();assert.match(await page.locator('[data-final-feedback]').innerText(),/обсудить с учителем/,'Manual proof is not certified correct');evidence.interactions.push('manual-answer-honesty');
 const old=await context.newPage();await old.goto(base);await old.waitForFunction(()=>window.textbookApp);await old.evaluate(async id=>{const bundle=await(await fetch('data/course.json')).json();window.textbookApp.destroy();window.textbookApp=GeometryTextbook.createApp(document.getElementById('textbook-app'),{...bundle,allowInReview:bundle.build?.publicationReviewMatches!==true});window.textbookApp.open(id);},exercise.id);evidence.twoTabs={before:{first:await page.evaluate(k=>({raw:localStorage.getItem(k),readonly:document.getElementById('final-answer').readOnly,conflict:!!document.querySelector('.course-conflict')}),key),second:await old.evaluate(k=>({raw:localStorage.getItem(k),readonly:document.getElementById('final-answer').readOnly,conflict:!!document.querySelector('.course-conflict')}),key)}};await page.locator('#final-answer').fill('Новое решение в первом окне.');await settle();evidence.twoTabs.after={first:await page.evaluate(k=>({raw:localStorage.getItem(k),value:document.getElementById('final-answer').value,readonly:document.getElementById('final-answer').readOnly,conflict:!!document.querySelector('.course-conflict')}),key),second:await old.evaluate(k=>({raw:localStorage.getItem(k),value:document.getElementById('final-answer').value,readonly:document.getElementById('final-answer').readOnly,conflict:!!document.querySelector('.course-conflict')}),key)};write();await old.locator('.course-conflict').waitFor({state:'visible'});assert(await old.locator('#final-answer').getAttribute('readonly')!==null);await old.close();evidence.interactions.push('two-tab-conflict-preserves-work');
 await chapterInteractions();
}
async function chapterInteractions(){
 const chapters=releaseScope.chapters.map(chapter=>chapter.label);
 const questions=chapters.map(chapter=>bundle.lessons.find(l=>l.source.chapter===chapter&&l.source.collection==='selfcheck'&&l.source.exercise==='1'));
 assert(questions.every(Boolean),'Every chapter review question must exist');assert.equal(new Set(questions.map(question=>question.id)).size,chapters.length);
 for(let i=0;i<questions.length;i++){await page.evaluate(id=>window.textbookApp.open(id),questions[i].id);await page.locator('#final-answer').fill('Отдельный черновик главы '+i);}
 await startPreview();
 for(let i=0;i<questions.length;i++){await page.evaluate(id=>window.textbookApp.open(id),questions[i].id);assert.equal(await page.locator('#final-answer').inputValue(),'Отдельный черновик главы '+i,'Restarted question numbers retain independent work after reload');}
 evidence.interactions.push('chapter-selfcheck-draft-isolation-and-reload');
 for(const chapter of chapters.slice(1)){
  const exercise=bundle.lessons.find(l=>l.source.chapter===chapter&&l.source.collection==='main'&&l.help.some(h=>h.theoryIds?.some(id=>bundle.lessons.find(t=>t.id===id)?.source.chapter===chapter)));
  assert(exercise,'An exercise links to chapter-'+chapter+' theory');
  const theoryId=exercise.help.flatMap(h=>h.theoryIds||[]).find(id=>bundle.lessons.find(t=>t.id===id)?.source.chapter===chapter),theory=bundle.lessons.find(l=>l.id===theoryId),draft='Доказательство по главе '+chapter;
  await page.evaluate(id=>window.textbookApp.open(id),exercise.id);await page.locator('#final-answer').fill(draft);
  await page.locator('[data-main-help] > summary').click();const help=page.locator('[data-main-help] [data-help="recall-theory"]');await help.locator(':scope > summary').click();await help.getByRole('button',{name:'Почему? '+theory.title,exact:true}).click();
  assert.equal(await page.locator('dialog').getAttribute('data-theory'),theoryId);await page.getByRole('button',{name:'Вернуться к задаче',exact:true}).click();assert.equal(await page.locator('#final-answer').inputValue(),draft);
  await page.getByRole('button',{name:'Разобрать по шагам',exact:true}).click();await startPreview();await page.evaluate(id=>window.textbookApp.open(id),exercise.id);assert.equal(await page.locator('#final-answer').inputValue(),draft);assert.equal(await page.locator('[data-step]').count(),1);evidence.interactions.push('chapter-'+chapter+'-theory-return-and-saved-step');
  const exercises=bundle.lessons.filter(lesson=>lesson.source.chapter===chapter&&lesson.source.collection==='main');
  for(const lesson of [exercises[0],exercises.at(-1)]){
   await startPreview(lesson.id);assert.equal(await page.locator('.lesson-permalink').getAttribute('href'),'#'+lesson.id);assert.equal(await page.locator('main h1').innerText(),lesson.title);assert.equal(await page.locator('[data-main-model] svg').count(),1);
  }
  evidence.interactions.push('chapter-'+chapter+'-first-and-last-direct-entry');
 }
}
(async()=>{
 try{
  base=await serve();browser=await chromium.launch({headless:true,executablePath:process.env.GEOMETRY_CHROMIUM||chromium.executablePath(),args:['--no-sandbox']});context=await browser.newContext();page=await context.newPage();page.on('pageerror',error=>evidence.errors.push(error.message));
  for(const width of interactionsOnly?[]:evidence.widths){await page.setViewportSize({width,height:900});await startPreview();let screenshotCount=0;
   for(const lesson of bundle.lessons){assert(await page.evaluate(({id,key})=>{localStorage.removeItem(key);return window.textbookApp.open(id);},{id:lesson.id,key:'mathExamTextbook.v1:'+lesson.source.bookId+':'+lesson.id+':r'+lesson.revision}),'Available in explicit preview '+lesson.id);
    if(!viewsOnly){await settle();const initialFile=lesson.id+'-initial-'+width+'.png';await page.locator('[data-main-model]').screenshot({path:path.join(out,initialFile)});evidence.screenshots.push({id:lesson.id,width,stage:'initial',file:initialFile});
    const initialCases=await page.locator('[data-main-model] [data-case]').evaluateAll(nodes=>nodes.map(n=>n.dataset.case).sort()),expectedInitialCases=Object.entries(lesson.visualization.model.views).filter(([id,v])=>/^case-/.test(id)&&!(v.availableFromStep>0)).map(([id])=>id).sort();assert.deepEqual(initialCases,expectedInitialCases,'Initial cases reveal only given configurations '+lesson.id);
    await page.locator('[data-main-help] > summary').click();for(let step=0;step<lesson.steps.length;step++)await page.getByRole('button',{name:step?'Следующий шаг':'Разобрать по шагам',exact:true}).click();assert.equal(await page.locator('[data-step]').count(),lesson.steps.length,'Every authored step remains visible '+lesson.id);
    await page.locator('[data-steps] details').evaluateAll(nodes=>nodes.forEach(n=>{n.open=true;}));await settle();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Expanded explanation overflow '+lesson.id+' '+width);assert.equal(await page.locator('[data-main-model] svg').getAttribute('data-view'),lesson.steps.at(-1).view||'neutral','Last actual step selects its authored scene '+lesson.id);
    evidence.stepFlows.push({id:lesson.id,width,steps:lesson.steps.length,allExplanationsOpened:true,overflow:false});if(lesson.id===bundle.lessons[0].id)await expansion('[data-main-model]','lesson-'+width);const lastFile=lesson.id+'-last-'+width+'.png';await page.locator('[data-main-model]').screenshot({path:path.join(out,lastFile)});evidence.screenshots.push({id:lesson.id,width,stage:'last',file:lastFile});}
    for(const view of Object.keys(lesson.visualization.model.views)){assert(await page.evaluate(({id,view})=>{window.__view?.destroy();const lesson=window.__bundle.lessons.find(l=>l.id===id),maxStep=Number(view.match(/^step-(\d+)$/)?.[1]||lesson.visualization.model.views[view].availableFromStep||0);window.__view=PlanarViewer.mount(document.querySelector('[data-main-model]'),lesson.visualization.model,{maxStep});return window.__view.setView(view);},{id:lesson.id,view}),'Reachable authored view '+lesson.id+'/'+view);if(!viewsOnly)await settle();const result=await inspect();assert.equal(result.view,view,'Requested exact scene '+lesson.id+'/'+view);const expected=(lesson.visualization.model.views[view].points||[]).filter(id=>!id.startsWith('_')).sort();if(JSON.stringify(result.labels.map(l=>l.id).sort())!==JSON.stringify(expected))result.issues.push('authored label visibility mismatch');evidence.views.push({id:lesson.id,width,...result});
     if(captureChapters.has(lesson.source.chapter)){const file='review-'+lesson.id+'-'+view+'-'+width+'.png';await page.locator('[data-main-model]').screenshot({path:path.join(out,file)});evidence.reviewScreenshots.push({id:lesson.id,chapter:lesson.source.chapter,view,width,file});}
     if(!viewsOnly&&result.issues.length&&screenshotCount++<30)await page.locator('[data-main-model]').screenshot({path:path.join(out,lesson.id+'-'+view+'-'+width+'.png')});
     if(!viewsOnly&&['1','31','61','89','91'].includes(lesson.source.exercise)&&view==='neutral')await page.screenshot({path:path.join(out,'sample-'+lesson.id+'-'+width+'.png'),fullPage:true});
    }await page.evaluate(()=>window.__view.destroy());
   }
  }
  if(!viewsOnly){await page.setViewportSize({width:1280,height:900});await startPreview();await interactions();}
  const problems=evidence.views.filter(v=>v.issues.length);assert.equal(problems.length,0,JSON.stringify(problems.map(v=>({id:v.id,width:v.width,view:v.view,issues:v.issues})).slice(0,50),null,2));assert.deepEqual(evidence.errors,[]);evidence.completed=true;console.log((interactionsOnly?'ATANASYAN_PLANAR_INTERACTIONS_OK ':viewsOnly?'ATANASYAN_PLANAR_VIEWS_OK ':'ATANASYAN_PLANAR_BROWSER_OK ')+JSON.stringify({lessons:evidence.lessons,views:evidence.views.length,interactions:evidence.interactions.length}));
 }catch(error){evidence.failure=error.stack||String(error);console.error(evidence.failure);process.exitCode=1;}finally{write();await browser?.close();server?.close();}
})();
