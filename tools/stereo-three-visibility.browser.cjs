'use strict';
// Real-page gate. The HTTP response appends a read-only closure probe; all
// navigation, selection, construction and camera changes use public controls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const out = process.env.STEREO_THREE_VISIBILITY_OUT || path.join(root, 'artifacts/stereo-three-visibility');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const folders = ['ege-profil/trainers/stereo', 'trainers/ege-profile-stereometry-3d'];
const THREE = require(path.join(root, folders[1], 'js/three.min.js'));
const routes = folders.map((folder, i) => {
  const context = vm.createContext({ THREE });
  vm.runInContext(read(folder + '/js/data.js') + '\nglobalThis.bank = PROBLEMS; globalThis.describe = p => sceneData(p).gen;', context);
  assert.equal(context.bank.length, i ? 143 : 288, 'real published bank size');
  const cone = context.bank.find(p => context.describe(p).some(g => !g.ghost && g.surfaces.some(s => s.type === 'cone')));
  assert(cone, 'a real curved-body fixture exists');
  const ids = i ? ['27055', '27054', String(cone.id), '27061', '676923', '27125', '27163'] : ['27055', '27054', 'pir-09', 'kon-19', 'kon-22', '27125', '27163'];
  const cases = ids.map(id => {
    const index = context.bank.findIndex(p => String(p.id) === id); assert(index >= 0, 'actual fixture ' + id);
    const p = context.bank[index], bodies = context.describe(p);
    return { id, index, construct: !!p.construct, ghost: bodies.some(g => g.ghost), curved: bodies.some(g => g.surfaces.length), expensive: ['27125', '27163'].includes(id) };
  });
  return { folder, label: i ? 'legacy143' : 'canonical288', count: context.bank.length, cases };
});
const files = ['assets/stereo-three-visibility.js', ...folders.flatMap(folder => ['trainer.html', 'css/style.css', 'js/three.min.js', 'js/data.js', 'js/trainer.js', 'js/visibility.js'].map(p => folder + '/' + p))];
const sources = () => Object.fromEntries(files.map(file => [file, hash(fs.readFileSync(path.join(root, file)))]));
// It exposes copies and computed projections only: no setter, scene mutation,
// direct selection call or answer/progress mutation is available to the gate.
const probe = String.raw`
const visibilityBankBefore = JSON.stringify(PROBLEMS);
Object.defineProperty(window, '__stereoVisibilityRead', { value: () => {
  const canvas = T.renderer.domElement, rect = canvas.getBoundingClientRect();
  const shown = object => { for(let p=object;p;p=p.parent)if(!p.visible)return false; return true; };
  const project = vector => { const p=vector.clone().project(T.camera);return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2,z:p.z}; };
  const pickable = s => T.segPickable ? T.segPickable(s) : s.mesh.visible&&s.mesh.parent?.visible!==false;
  const pickObjects = [...Object.values(T.vertMap).filter(v=>v.mesh.visible&&v.mesh.parent?.visible!==false).map(v=>v.mesh),...Object.values(T.segMap).filter(pickable).map(s=>s.mesh)];
  const canPick = (point,type,key) => {
    if(point.z < -1 || point.z > 1 || point.x<rect.left+10 || point.x>rect.right-10 || point.y<rect.top+10 || point.y>rect.bottom-10 || document.elementFromPoint(point.x,point.y)!==canvas)return false;
    const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((point.x-rect.left)/rect.width*2-1,-(point.y-rect.top)/rect.height*2+1),T.camera);
    return ray.intersectObjects(pickObjects,false)[0]?.object.userData[type]===key;
  };
  const displayName = name => T.displayName ? T.displayName(name) : name;
  const vertices=Object.entries(T.vertMap).filter(([,v])=>shown(v.mesh)).map(([name,v])=>{const point=project(v.mesh.getWorldPosition(new THREE.Vector3()));return{name,label:displayName(name),...point,clickable:canPick(point,'vertex',name)};});
  const inspector=T.visibility.inspect(),hiddenCandidates=[],segmentCandidates=[];
  for(const stroke of inspector.strokes){
    const rec=T.segMap[stroke.name];if(!rec||!pickable(rec)||!stroke.curve||stroke.curve.kind!=='line')continue;
    for(const part of stroke.parts.filter(p=>p.end-p.start>.05))for(const fraction of[.23,.5,.77]){
      const t=part.start+(part.end-part.start)*fraction,a=new THREE.Vector3(...stroke.curve.a),b=new THREE.Vector3(...stroke.curve.b),point=project(a.lerp(b,t));
      if(canPick(point,'seg',stroke.name)){const candidate={key:stroke.name,...point};segmentCandidates.push(candidate);if(part.hidden)hiddenCandidates.push(candidate);}
    }
  }
  const rendered=[];
  T.group.traverse(group=>{if(group.name!=='classified-stroke')return;const previous=group.parent.children[group.parent.children.indexOf(group)-1];rendered.push({name:previous?.userData.seg||'circle',shown:shown(group),pieces:group.children.filter(p=>p.visible).map(p=>({ ...p.userData.visibility,color:p.material.color.getHex(),depthTest:p.material.depthTest,position:p.position.toArray(),scale:p.scale.toArray()}))});});
  let manualPair=null;
  const available=vertices.filter(v=>v.clickable);
  for(let i=0;i<available.length&&!manualPair;i++)for(let j=i+1;j<available.length;j++){
    const a=available[i],b=available[j],key=segKey(a.name,b.name);
    if(!T.segMap[key]&&Math.hypot(a.x-b.x,a.y-b.y)>25){manualPair={a:a.name,b:b.name,key};break;}
  }
  const source=sceneData(prob()),sourceGeometry=source.gen.map(g=>({ghost:!!g.ghost,edges:g.edges.map(([a,b])=>({names:[a,b],a:source.toW(g.pts[a]).toArray(),b:source.toW(g.pts[b]).toArray()}))}));
  return {id:String(prob().id),index:idx,bankSize:PROBLEMS.length,bankUnchanged:JSON.stringify(PROBLEMS)===visibilityBankBefore,
    camera:T.camera.position.toArray(),spherical:{...T.sph},autoRot,constructOn,constructVisible:!!T.constructGroup?.visible,anims:T.anims.length,
    rect:{x:rect.left,y:rect.top,width:rect.width,height:rect.height},vertices,hiddenCandidates,segmentCandidates,manualPair,sourceGeometry,
    segments:Object.entries(T.segMap).map(([key,s])=>({key,kind:s.kind,selected:s.selected,shown:shown(s.mesh),materialVisible:s.mesh.material.visible,a:s.A.toArray(),b:s.B.toArray(),names:[displayName(s.p1),displayName(s.p2)],given:T.givenMap?.[key]||s.given,sourceLength:T.scaleFn(s.p1,s.p2)})),
    selected:selected.map(s=>({...s})),inspector,rendered,selectColor:COL.select,
    progress:localStorage.getItem('stereo3.status'),answer:$('answer').value,uiAliasLeak:/__body\d+_/.test(document.body.innerText)};
}});
`;
// Check the emitted String.raw code, not a separately recreated regular
// expression: a doubled escape would silently miss real internal aliases.
const aliasProbe = probe.match(/uiAliasLeak:(\/[^/]+\/)\.test/);
assert(aliasProbe, 'emitted alias detector exists');
const aliasPattern = vm.runInNewContext(aliasProbe[1]);
assert(aliasPattern.test('__body0_P'), 'actual emitted detector recognizes a body alias');
assert(!aliasPattern.test('__body\\d_P'), 'actual emitted detector does not match a literal escaped d');
const ending = 'showProblem();\n})();';
function instrument(source) {
  assert.equal(source.split(ending).length, 2, 'one final boot call, no rewritten production logic');
  return source.replace(ending, 'showProblem();\n' + probe + '\n})();');
}
for (const folder of folders) new vm.Script(instrument(read(folder + '/js/trainer.js')));
const evidence = {
  completed: false, widths: [320, 1280], sourceHashes: sources(),
  instrumentation: { placement: 'Immediately after the final showProblem() inside the existing trainer closure', code: probe, sha256: hash(probe), readOnly: true,
    responses: Object.fromEntries(folders.map(folder => [folder + '/js/trainer.js', { originalSHA256: hash(read(folder + '/js/trainer.js')), instrumentedSHA256: hash(instrument(read(folder + '/js/trainer.js'))) }])) },
  fixtureCorrection: 'Requested ID27040 is absent from both source banks; actual cube27055 is used. The legacy curved-body case is derived from sceneData.',
  routes, cases: [], screenshots: [], errors: []
};
const save = () => fs.writeFileSync(path.join(out, 'stereo-three-visibility-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
let browser, page;
const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    let file = path.resolve(root, '.' + pathname); if (!file.startsWith(root + path.sep)) throw Error('outside root');
    if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const relative = path.relative(root, file).split(path.sep).join('/');
    const body = folders.some(folder => relative === folder + '/js/trainer.js') ? instrument(fs.readFileSync(file, 'utf8')) : fs.readFileSync(file);
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' })[path.extname(file)] || 'application/octet-stream');
    res.end(body);
  } catch { res.writeHead(404).end(); }
});
const snapshot = () => page.evaluate(() => window.__stereoVisibilityRead());
async function frames(n = 2) { await page.evaluate(n => new Promise(resolve => { let left=n;const next=()=>--left<=0?resolve():requestAnimationFrame(next);requestAnimationFrame(next); }), n); }
async function canvasReady() { await page.locator('#viewport canvas').scrollIntoViewIfNeeded(); await frames(); return snapshot(); }
async function capture(name, state, fullPage=false) {
  const filename = name + '.png', bytes = fullPage ? await page.screenshot({path:path.join(out,filename),fullPage:true,animations:'disabled'}) : await page.locator('.stage').screenshot({ path: path.join(out, filename), animations: 'disabled' });
  evidence.screenshots.push({ filename, sha256: hash(bytes), id: state.id, camera: state.camera }); save();
}
function inspect(state, label) {
  assert(state.bankUnchanged, label + ' bank and answers unchanged');
  assert(!state.uiAliasLeak&&state.vertices.every(v=>!/__body\d+_/.test(v.label)),label+' internal body aliases never replace displayed mathematical names');
  assert(state.inspector.strokes.length, label + ' actual classified strokes');
  assert.equal(state.rendered.length, state.inspector.strokes.length, label + ' no missing/orphan render groups');
  for (const stroke of state.inspector.strokes) {
    assert.equal(stroke.pickMaterialVisible, false, label + ' original pick mesh never repaints dash gaps');
    for (const part of stroke.parts) assert(Number.isFinite(part.start) && Number.isFinite(part.end) && part.start>=0 && part.end<=1 && part.end>part.start, label + ' finite classified interval');
  }
  for (const group of state.rendered) for (const part of group.pieces) {
    assert(Number.isFinite(part.start) && Number.isFinite(part.end) && part.end>part.start, label + ' actual rendered interval');
    assert([...part.position,...part.scale].every(Number.isFinite), label + ' finite actual mesh transform');
    assert.equal(part.depthTest, false, label + ' hidden dashes remain visible through translucent faces');
  }
}
function distinctBodies(state) {
  const same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-7);
  assert.equal(state.sourceGeometry.length,2,'collision fixture has two distinct source bodies');
  for(const body of state.sourceGeometry)for(const edge of body.edges)assert(state.segments.some(s=>same(s.a,edge.a)&&same(s.b,edge.b)||same(s.a,edge.b)&&same(s.b,edge.a)),'each source body edge remains at its own actual coordinates');
  if(state.id==='27061'){assert.equal(state.segments.length,24,'both cubes keep all twelve edges');assert.equal(state.inspector.surfaces,24,'both cubes keep all six quadrilateral faces');}
}
async function drag(dx = 74, dy = 26) {
  await canvasReady(); const r = await page.locator('#viewport canvas').boundingBox();
  await page.mouse.move(r.x+r.width*.45, r.y+r.height*.55); await page.mouse.down();
  await page.mouse.move(r.x+r.width*.45+dx, r.y+r.height*.55+dy, { steps: 8 }); await page.mouse.up(); await frames();
}
async function findInteraction(kind) {
  for (let attempt=0;attempt<7;attempt++) {
    const state=await canvasReady(); if(kind==='hidden'?state.hiddenCandidates.length:state.manualPair)return state;
    if(attempt===1){const r=await page.locator('#viewport canvas').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.wheel(0,250);await frames();}
    await drag(attempt%2? -82:68, attempt%3?20:-32);
  }
  throw Error('No actual pickable '+kind+' target after seven real camera positions');
}
function assertDashedSelection(state, key) {
  const stroke=state.inspector.strokes.find(s=>s.name===key),group=state.rendered.find(g=>g.name===key);
  assert(stroke&&group&&group.shown, 'selected line has actual render group');
  assert.equal(stroke.color,state.selectColor,'selection color propagated');
  const hidden=stroke.parts.filter(p=>p.hidden).reduce((n,p)=>n+p.end-p.start,0);
  const painted=group.pieces.filter(p=>p.hidden).reduce((n,p)=>n+p.end-p.start,0);
  assert(hidden>.05&&painted>0&&painted<hidden-1e-6,'selected hidden line retains actual unpainted dash gaps');
  assert(group.pieces.every(p=>p.color===state.selectColor),'every actual selected dash uses selection color');
  assert.equal(state.segments.find(s=>s.key===key).materialVisible,false,'selected pick mesh stays invisible');
}
async function selectedAndManual(name,row) {
  let state=await findInteraction('hidden'),target=state.hiddenCandidates[0];
  const old=state.inspector.strokes.find(s=>s.name===target.key).parts;
  await page.mouse.click(target.x,target.y); await frames(); state=await snapshot();
  assert(state.selected.some(s=>s.key===target.key),'real canvas click selects hidden line');
  assert.deepEqual(state.inspector.strokes.find(s=>s.name===target.key).parts,old,'selection preserves depth partition');
  assertDashedSelection(state,target.key); await capture(name+'-selected-hidden',state);
  await page.locator('#measureList .measure-del').click(); await frames(); assert.equal((await snapshot()).selected.length,0);
  state=await findInteraction('manual'); const pair=state.manualPair;
  for(let repeat=0;repeat<2;repeat++) {
    for(const vertex of[pair.a,pair.b]) {
      state=await canvasReady(); const point=state.vertices.find(v=>v.name===vertex&&v.clickable);assert(point,'manual endpoint is really pickable');
      await page.mouse.click(point.x,point.y); await frames();
    }
    state=await snapshot(); inspect(state,'manual construction');
    assert(state.segments.some(s=>s.key===pair.key&&s.kind==='user'),'real two-point click creates user segment');
    assert(state.selected.some(s=>s.key===pair.key&&s.user),'new manual line is selected');
    assert(state.inspector.strokes.some(s=>s.name===pair.key),'manual line receives visibility classification');
    if(!repeat)await capture(name+'-manual',state);
    await page.locator('#measureList .measure-del').click(); await frames();state=await snapshot();
    assert(!state.segments.some(s=>s.key===pair.key),'delete removes manual source line');
    assert(!state.inspector.strokes.some(s=>s.name===pair.key),'delete removes classification record');
    assert(!state.rendered.some(s=>s.name===pair.key),'delete leaves no rendered dash group');
  }
  row.hiddenSelection={key:target.key,dashesVerified:true}; row.manual={...pair,deletedAndRecreated:true};
}
async function construction(name,row) {
  await page.locator('#btnConstruct').click(); await frames(1); const during=await snapshot();
  assert(during.constructOn&&during.constructVisible,'construction appears');
  inspect(during,'during animation'); row.animationObserved=during.anims>0;
  await page.locator('#btnConstruct').click(); await frames(); const hidden=await snapshot();
  assert(!hidden.constructOn&&!hidden.constructVisible,'construction can hide during animation');
  const constructionKeys=new Set(hidden.segments.filter(s=>s.kind==='construct').map(s=>s.key));
  assert(hidden.rendered.filter(g=>constructionKeys.has(g.name)).every(g=>!g.shown),'hidden construction renders no leftover dash group');
  await page.waitForFunction(()=>window.__stereoVisibilityRead().anims===0,{},{timeout:15000});
  await page.locator('#btnConstruct').click(); await frames();const shown=await canvasReady(); inspect(shown,'reshown construction');
  assert(shown.constructOn&&shown.constructVisible,'construction reappears');
  if(row.id==='pir-09')assert(shown.inspector.strokes.find(s=>s.name==='Q|T')?.owners.includes(1),'ghost-pyramid construction retains body ownership');
  if(['kon-19','kon-22'].includes(row.id)) {
    assert(shown.inspector.strokes.filter(s=>s.name==='circle').every(s=>s.owners.includes(0)),'rear section circle belongs to ghost cone');
    assert(shown.inspector.strokes.find(s=>s.name==='K|M')?.owners.includes(0),'section radius belongs to ghost cone');
  }
  row.construct={hiddenKeys:[...constructionKeys],shownInspector:shown.inspector}; await capture(name+'-construction',shown);
}
async function collisionLabels(name,row) {
  for(const [letters,length]of [['OP',3],['SP',6],['SQ',6]]) {
    let target,record;
    for(let attempt=0;attempt<7;attempt++){
      const state=await canvasReady();record=state.segments.find(s=>s.names.join('')===letters&&Math.abs(s.sourceLength-length)<1e-7);
      assert(record,'primary cone '+letters+' has correct source length');assert.equal(String(record.given),String(length),'primary cone given label');
      target=state.segmentCandidates.find(s=>s.key===record.key);if(target)break;
      if(attempt===1){const r=await page.locator('#viewport canvas').boundingBox();await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.wheel(0,250);await frames();}
      await drag(attempt%2?-78:65,attempt%3?22:-32);
    }
    assert(target,'given cone line is pickable through public canvas');await page.mouse.click(target.x,target.y);await frames();
    const state=await snapshot();assert(state.selected.some(s=>s.key===record.key),'actual given line selected');
    assert((await page.locator('#measureList').innerText()).replace(/\s+/g,' ').includes(letters+' = '+length),'actual measurement UI preserves '+letters+' = '+length);
  }
  const state=await canvasReady();distinctBodies(state);inspect(state,'primary cone labels');row.collisionLabels={values:{OP:3,SP:6,SQ:6},selection:state.selected};await capture(name+'-given-labels',state,true);
}
async function responsiveness() {
  await page.locator('#btnRotate').click();await frames(3);
  const result=await page.evaluate(()=>new Promise(resolve=>{const times=[],camera0=__stereoVisibilityRead().camera;let previous=performance.now();function next(now){times.push(now-previous);previous=now;if(times.length===14)resolve({times,camera0,camera1:__stereoVisibilityRead().camera});else requestAnimationFrame(next);}requestAnimationFrame(next);}));
  const start=Date.now();await page.locator('#btnRotate').click();await frames();result.stopLatencyMs=Date.now()-start;
  const times=result.times.slice(2).sort((a,b)=>a-b);result.medianMs=times[Math.floor(times.length/2)];result.p95Ms=times[Math.floor((times.length-1)*.95)];
  assert.notDeepEqual(result.camera0,result.camera1,'real auto-rotation advances camera');
  assert(result.medianMs<250&&result.p95Ms<1500&&result.stopLatencyMs<3000,'SwiftShader remains responsive on expensive sphere card');
  assert.equal((await snapshot()).autoRot,false);return result;
}
(async()=>{
  if(process.env.STEREO_THREE_VISIBILITY_CHECK_ONLY==='1') {
    console.log('STEREO_THREE_VISIBILITY_PREFLIGHT_OK',JSON.stringify({banks:routes.map(r=>r.count),cases:routes.map(r=>({route:r.folder,ids:r.cases.map(c=>c.id)})),widths:evidence.widths,instrumentationSHA256:hash(probe)}));return;
  }
  fs.mkdirSync(out,{recursive:true});save();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const {chromium}=require('playwright');browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  evidence.browserVersion=browser.version();evidence.browserArgs=['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'];save();
  const base='http://127.0.0.1:'+server.address().port;
  for(const width of evidence.widths)for(const route of routes) {
    const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce'});
    await context.route('**/*',routeRequest=>{const url=new URL(routeRequest.request().url());return url.origin===base?routeRequest.continue():routeRequest.abort();});
    page=await context.newPage();page.setDefaultTimeout(15000);
    page.on('pageerror',error=>{evidence.errors.push(route.label+': '+error.message);save();});
    // A real supported previous-position key selects the first card on load.
    await context.addInitScript(index=>{if(!sessionStorage.getItem('visibility-position-set')){localStorage.setItem('stereo3.last.all',String(index));sessionStorage.setItem('visibility-position-set','1');}},route.cases[0].index);
    await page.goto(base+'/'+route.folder+'/trainer.html');await page.waitForFunction(()=>typeof window.__stereoVisibilityRead==='function');
    evidence.webgl=await page.locator('#viewport canvas').evaluate(canvas=>{const gl=canvas.getContext('webgl2')||canvas.getContext('webgl');return gl?{version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER)}:null;});assert(evidence.webgl,'actual WebGL context');
    const progress=await page.evaluate(()=>localStorage.getItem('stereo3.status'));
    for(const testCase of route.cases) {
      const name=route.label+'-'+testCase.id+'-'+width,row={route:route.folder,width,...testCase};evidence.cases.push(row);save();
      try {
        if((await snapshot()).id!==testCase.id){await page.locator('#navToggle').click();await page.locator('#navBody').getByRole('button',{name:String(testCase.index+1),exact:true}).click();}
        await page.waitForFunction(id=>window.__stereoVisibilityRead().id===id,testCase.id);await page.locator('#answer').fill('7/');
        const initial=await canvasReady();inspect(initial,name);assert.equal(initial.bankSize,route.count);assert(initial.inspector.strokes.some(s=>s.parts.some(p=>p.hidden)),name+' actual hidden parts');
        row.initial=initial;if(route.label==='legacy143'&&['27061','676923'].includes(testCase.id))distinctBodies(initial);await capture(name+'-initial',initial);
        await drag();const rotated=await canvasReady();inspect(rotated,name+' rotated');assert.notDeepEqual(rotated.camera,initial.camera,'actual pointer drag rotates camera');row.rotated=rotated;await capture(name+'-rotated',rotated);
        await page.locator('#btnHome').click();await frames();const home=await canvasReady();home.camera.forEach((n,i)=>assert(Math.abs(n-initial.camera[i])<1e-7,'home restores original camera'));
        if(testCase.id==='27055')await selectedAndManual(name,row);
        if(testCase.construct)await construction(name,row);
        if(route.label==='legacy143'&&testCase.id==='676923')await collisionLabels(name,row);
        if(testCase.expensive)row.responsiveness=await responsiveness();
        const final=await snapshot();inspect(final,name+' final');assert.equal(final.answer,'7/','camera and construction preserve unfinished answer');assert.equal(final.progress,progress,'no answer attempts or progress were mutated');
        row.completed=true;save();
      }catch(error){row.error=error.stack||String(error);evidence.errors.push(name+': '+row.error);try{await page.screenshot({path:path.join(out,name+'-failure.png'),fullPage:true});}catch{}save();}
    }
    await context.close();
  }
  assert(evidence.cases.some(c=>c.animationObserved),'actual construction animation observed');
  assert.equal(evidence.cases.length,routes.reduce((n,r)=>n+r.cases.length,0)*evidence.widths.length);
  assert.deepEqual(evidence.errors,[]);assert.deepEqual(sources(),evidence.sourceHashes,'sources unchanged during evidence');evidence.completed=true;save();
  console.log('STEREO_THREE_VISIBILITY_BROWSER_OK',JSON.stringify({journeys:evidence.cases.length,screenshots:evidence.screenshots.length,widths:evidence.widths,swiftShader:true}));
})().catch(error=>{evidence.errors.push(error.stack||String(error));if(fs.existsSync(out))save();console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();if(server.listening)await new Promise(resolve=>server.close(resolve));});
