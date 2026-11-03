'use strict';
// Exercise actual scene geometry and animation with a no-op renderer; no browser required.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=require('path').resolve(__dirname,'..');
const Three=require(root+'/trainers/ege-profile-stereometry-3d/js/three.min.js');
function check(width,height){
 let scene,camera,next,clock=1000,frameId=0;
 const ids=['all','tires','apartment','graphs','geometry','stove','plot','paper','dice'];
 const make=(id)=>({dataset:id?{model:id}:{},style:{},handlers:{},setAttribute(){},toggleAttribute(){},addEventListener(k,v){this.handlers[k]=v},setPointerCapture(){}});
 const elements={},buttons=ids.map(make);for(const id of ['model-stage','oge-model-canvas','model-pause','model-number','model-description','model-link','model-hint'])elements[id]=make();
 elements['model-stage'].clientWidth=width;elements['model-stage'].clientHeight=height;
 const generic=make(),media={matches:true,addEventListener(k,v){this.change=v}};
 const renderer=class{setPixelRatio(){}setSize(){}render(s,c){scene=s;camera=c;scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);camera.matrixWorldInverse.copy(camera.matrixWorld).invert();}};
 const win={THREE:{...Three,WebGLRenderer:renderer},matchMedia:()=>media,addEventListener(){},devicePixelRatio:1};
 const context={window:win,document:{hidden:false,querySelector:()=>generic,querySelectorAll:()=>buttons,getElementById:id=>elements[id],addEventListener(){}},requestAnimationFrame:cb=>(next=cb,++frameId),cancelAnimationFrame:()=>{next=null}};
 vm.runInNewContext(fs.readFileSync(root+'/assets/oge-home.js','utf8'),context);
 const system=scene.children.find(g=>g.type==='Group'),models=system.children.slice(2);
 assert.equal(models.length,8);
 const initial=models.map(g=>g.position.clone()), visited=models.map(()=>new Set());
 media.matches=false;media.change();
 let maxProjected=0;
 const measure=()=>{for(const [index,g] of models.entries()){if(!g.visible)continue;g.traverse(mesh=>{if(!mesh.isMesh)return;const vertices=mesh.geometry.attributes.position;for(let i=0;i<vertices.count;i++){const p=new Three.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld).project(camera);maxProjected=Math.max(maxProjected,Math.abs(p.x),Math.abs(p.y));assert(Math.abs(p.x)<=1&&Math.abs(p.y)<=1,'actual vertex frustum clipping '+width+' model '+index+' '+[p.x,p.y]);}});}};
 for(let i=0;i<7500;i++){const f=next;next=null;clock+=16;f(clock);if(i%60===0){measure();models.forEach((g,index)=>visited[index].add((g.position.x>0?1:0)+(g.position.y>0?2:0)));}}
 models.forEach((g,i)=>{assert(g.position.distanceTo(initial[i])>.1,'every center moves');assert.equal(visited[i].size,4,'every model traverses all four quadrants around the common center');});
 elements['model-pause'].handlers.click();assert.equal(next,null,'pause cancels frame');
 for(const id of ids.slice(1)){buttons.find(b=>b.dataset.model===id).handlers.click();assert.equal(models.filter(g=>g.visible).length,1);measure();}
 console.log(JSON.stringify({stage:[width,height],models:8,simulatedSeconds:120,centersRevolve:true,allAndSoloFit:true,maxProjected}));
}
for(const dims of [[282,330],[352,330],[385,360],[629,390]])check(...dims);
console.log('OGE_HOME_ORBITS_OK');
