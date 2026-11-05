'use strict';
// Run the real scene/geometry with a no-op renderer. No browser or external runtime.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),Three=require(root+'/trainers/ege-profile-stereometry-3d/js/three.min.js');
const source=fs.readFileSync(root+'/assets/oge-home.js','utf8'),data=fs.readFileSync(root+'/assets/oge-home-topics.js','utf8');
function check(width,height){
 let scene,camera,next,clock=1000,frameId=0;
 const make=()=>({dataset:{},style:{},handlers:{},children:[],attributes:{},setAttribute(k,v){this.attributes[k]=v},toggleAttribute(){},addEventListener(k,v){this.handlers[k]=v},setPointerCapture(){},replaceChildren(){this.children=[]},append(b){this.children.push(b)},querySelectorAll(){return this.children}});
 const elements={};for(const id of ['model-stage','oge-model-canvas','model-pause','model-number','model-description','model-link','model-hint'])elements[id]=make();
 elements['model-stage'].clientWidth=width;elements['model-stage'].clientHeight=height;elements['oge-model-canvas'].getBoundingClientRect=()=>({left:0,top:0,width,height});
 const selectors={};for(const name of ['.model-exhibit','.orbit-picker','.model-tabs','.orbit-label','.model-fallback','.feature-picker','.orbit-numbers'])selectors[name]=make();
 for(const id of ['all',...Array.from({length:25},(_,i)=>String(i+1))]){const b=make();b.dataset.orbit=id;selectors['.orbit-picker'].append(b);}
 const introButton=make();introButton.dataset.orbit='intro';selectors['.orbit-picker'].append(introButton);
 for(let i=0;i<5;i++)selectors['.feature-picker'].append(make());
 const media={matches:true,addEventListener(k,v){this.change=v}};
 const Renderer=class{setPixelRatio(){}setSize(){}render(s,c){scene=s;camera=c;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);camera.matrixWorldInverse.copy(camera.matrixWorld).invert();}};
 const win={THREE:{...Three,WebGLRenderer:Renderer},matchMedia:()=>media,addEventListener(){},devicePixelRatio:1};
 const context=vm.createContext({window:win,document:{hidden:false,querySelector:s=>selectors[s],getElementById:id=>elements[id],createElement:make,addEventListener(){}},requestAnimationFrame:cb=>(next=cb,++frameId),cancelAnimationFrame:()=>{next=null}});
 vm.runInContext(data,context);vm.runInContext(source,context);
 const topics=win.OGE_HOME_TOPICS;assert.deepEqual(Array.from(topics,t=>t.number),Array.from({length:25},(_,i)=>i+1));
 for(const t of topics){assert(t.types.length>=2);for(const href of [t.href,...t.types.map(s=>s.href)])assert(fs.existsSync(root+href),'existing destination '+href);}
 const system=scene.children.find(g=>g.type==='Group'),orbits=system.children.filter(g=>g.name.startsWith('orbit-'));
 assert.equal(orbits.length,25);
 assert.equal(selectors['.model-exhibit'].dataset.detail,'intro');
 assert.equal(orbits.filter(g=>g.visible).length,5,'five readable featured models on first view');
 const featured=orbits.filter(g=>g.visible).flatMap(g=>g.children.filter(n=>n.name.startsWith('satellite-')&&n.visible));
 assert.equal(featured.length,5);
 assert(selectors['.orbit-numbers'].hidden,'number controls disclosed with the map');
 selectors['.orbit-picker'].children[0].handlers.click();
 const normals=orbits.map(g=>new Three.Vector3(0,0,1).applyQuaternion(g.quaternion));
 normals.forEach((n,i)=>normals.slice(i+1).forEach(other=>assert(Math.abs(n.dot(other))<.99995,'orbit planes must differ')));
 const satellites=orbits.flatMap(g=>g.children.filter(n=>n.name.startsWith('satellite-'))),visited=satellites.map(()=>new Set());
 assert.equal(satellites.length,53);
 let maxProjected=0;
 function measure(){
  system.traverse(m=>{if(!m.isMesh&&!m.isLine)return;for(let p=m;p;p=p.parent)if(!p.visible)return;
   const vertices=m.geometry.attributes.position;for(let i=0;i<vertices.count;i++){const p=new Three.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(m.matrixWorld).project(camera);maxProjected=Math.max(maxProjected,Math.abs(p.x),Math.abs(p.y));assert(Math.abs(p.x)<=1&&Math.abs(p.y)<=1,'clipped visible vertex at '+width+' '+m.parent.name);}
  });
 }
 // The first view is checked over a full circuit, at every size, before the complete map.
 introButton.handlers.click();
 media.matches=false;media.change();
 let minFeaturePixels=Infinity;
 for(let i=0;i<2400;i++){const f=next;next=null;clock+=50;f(clock);if(i%60===0){measure();
  for(const node of featured){const box=new Three.Box3().setFromObject(node.children[0]),size=box.getSize(new Three.Vector3());const center=node.getWorldPosition(new Three.Vector3());const left=center.clone().add(new Three.Vector3(-size.length()/4,0,0)).project(camera),right=center.clone().add(new Three.Vector3(size.length()/4,0,0)).project(camera);minFeaturePixels=Math.min(minFeaturePixels,(right.x-left.x)*width/2);}
 }}
 assert(minFeaturePixels>25,'featured objects remain visibly large on the narrowest viewport');
 selectors['.orbit-picker'].children[0].handlers.click();
 for(let i=0;i<2400;i++){const f=next;next=null;clock+=50;f(clock);if(i%60===0){measure();satellites.forEach((g,j)=>visited[j].add((g.position.x>0?1:0)+(g.position.y>0?2:0)));}}
 visited.forEach(set=>assert.equal(set.size,4,'each subtype completes a circuit in its own tilted plane'));
 elements['model-pause'].handlers.click();assert.equal(next,null,'pause stops all orbit and axial motion');
 const buttons=selectors['.orbit-picker'].children;
 for(let n=1;n<=25;n++){
  buttons[n].handlers.click();assert.equal(orbits.filter(g=>g.visible).length,1);measure();
  const tabs=selectors['.model-tabs'].children;assert.equal(tabs.length,topics[n-1].types.length+1);
  for(let j=1;j<tabs.length;j++){tabs[j].handlers.click();assert.equal(orbits[n-1].children.filter(g=>g.name.startsWith('satellite-')&&g.visible).length,1);measure();assert.equal(elements['model-link'].href,topics[n-1].types[j-1].href);}
 }
 // Click the center of the solid die in the real projected scene.
 buttons[10].handlers.click();
 const die=orbits[9].children.find(n=>n.name==='satellite-10-0'),screen=die.getWorldPosition(new Three.Vector3()).project(camera);
 const event={button:0,pointerId:1,clientX:(screen.x+1)*width/2,clientY:(1-screen.y)*height/2};
 elements['model-stage'].handlers.pointerdown(event);elements['model-stage'].handlers.pointerup(event);
 assert.equal(selectors['.model-exhibit'].dataset.detail,'model','canvas click opens a subtype');
 buttons[0].handlers.click();assert.equal(orbits.filter(g=>g.visible).length,25);assert(selectors['.model-tabs'].hidden);
 console.log(JSON.stringify({stage:[width,height],orbits:25,subtypes:53,distinctPlanes:true,simulatedSeconds:120,allOrbitsAndModelsFit:true,featured:5,minFeaturePixels,maxProjected}));
}
for(const dims of [[282,350],[352,350],[385,390],[629,430]])check(...dims);
console.log('OGE_HOME_ORBITS_OK');
