'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),THREE=require('../ege-profil/trainers/stereo/js/three.min.js'),V=require('../assets/stereo-three-visibility.js');
const root=path.resolve(__dirname,'..');
function mount(fault){
 const dom=new JSDOM('<div id="solid"></div>',{runScripts:'outside-only'}),w=dom.window,host=w.document.querySelector('div'),registered=[];
 Object.defineProperties(host,{clientWidth:{value:500},clientHeight:{value:400}});
 class Renderer{constructor(){this.domElement=w.document.createElement('canvas');this.calls=0;}setPixelRatio(){}setSize(){}render(){this.calls++;}dispose(){this.disposed=true;}forceContextLoss(){this.lost=true;}}
 w.THREE={...THREE,WebGLRenderer:Renderer};w.ResizeObserver=class{observe(){}disconnect(){}};w.LabMath=require('../ege-baza/labs/math.js');
 w.StereoThreeVisibility={...V,create(...args){const v=V.create(...args),original=v.surface;v.surface=(mesh,o)=>{registered.push({mesh,options:{...o}});if(fault==='omit-block'&&o.body==='block')return;return original(mesh,fault==='opaque-vessel'&&o.body==='vessel'?{...o,context:false}:o);};return v;}};
 w.eval(fs.readFileSync(path.join(root,'ege-baza/labs/stereo.js'),'utf8'));const view=new w.SolidView(host);assert(view.live,view.error);return {dom,w,view,registered};
}
const hiddenLength=s=>s.parts.reduce((n,p)=>n+(p.hidden?p.end-p.start:0),0);
const signature=state=>JSON.stringify(state.strokes.map(s=>s.parts));
let models=0,rotations=0,tangencies=0;
const m=mount(),{view}=m;
for(const parameter of [0,.5,1]){
 view.set('water',parameter);view.home();let state=view.visibility.inspect();assert.equal(state.surfaces,22);assert.equal(state.strokes.length,25);
 const block=state.strokes.filter(s=>s.owners.includes('block'));assert.equal(block.length,12);assert.equal(block.filter(s=>hiddenLength(s)>.99).length,3,'transparent vessel preserves the cube: only its own three back edges are hidden');
 const registrations=m.registered.slice(-2),vessel=registrations.find(r=>r.options.body==='vessel'),body=registrations.find(r=>r.options.body==='block');assert.equal(vessel.options.context,true);assert.equal(body.options.context,undefined);
 const p=vessel.mesh.geometry.attributes.position;assert.equal(p.count,30);for(let i=0;i<p.count;i+=3)assert(![i,i+1,i+2].every(j=>p.getY(j)===4),'open vessel has no top cap');
 assert.equal(body.mesh.position.y,7*(1-parameter)+2);const level=m.w.LabMath.water(7*(1-parameter));assert(Math.abs(100*level-16*Math.max(0,Math.min(4,level-7*(1-parameter)))-400)<1e-8);
 const initial=signature(state);view.rotate(1.8,-.2);state=view.visibility.inspect();assert.notEqual(signature(state),initial);assert.equal(state.strokes.length,25);rotations++;models++;
}
for(const parameter of [.1,.5,1]){
 view.set('cone',parameter);view.home();let state=view.visibility.inspect();assert.equal(state.surfaces,192,'64 lateral triangles,64 zero-area apex triangles and64 base triangles from ConeGeometry');assert.equal(state.strokes.length,13);
 assert.equal(m.registered.at(-1).options.body,'cone');assert.equal(state.strokes.filter(s=>s.curve.kind==='circle').length,2,'base and section circles both exist');
 const circles=state.strokes.filter(s=>s.curve.kind==='circle');for(const s of circles){assert(hiddenLength(s)>.2&&hiddenLength(s)<.8,'both front and rear arcs exist');}
 const axis=state.strokes.find(s=>s.curve.kind==='line'&&s.curve.a[0]===0&&s.curve.a[2]===0&&s.curve.b[0]===0&&s.curve.b[2]===0);assert(hiddenLength(axis)>.99,'interior axis is hidden');
 for(const [theta,phi] of [[.7,1.05],[2.4,.8],[-1.4,1.45],[.2,.2]]){
  view.theta=theta;view.phi=phi;view.draw();const e=view.camera.position,radial=Math.hypot(e.x,e.z),ratio=3*(6-e.y)/(6*radial),expected=Math.abs(ratio)<1?2:0;assert.equal(view.silhouettes.length,expected);
  for(const line of view.silhouettes){const p=line.geometry.attributes.position,b=[p.getX(1),p.getY(1),p.getZ(1)];assert(Math.abs(b[0]*e.x+b[2]*e.z+1.5*(e.y-6))<1e-5,'perspective generator is tangent');assert(Math.abs(Math.hypot(b[0],b[2])-3)<1e-6);tangencies++;}
  assert.equal(view.visibility.inspect().strokes.length,11+expected);rotations++;
 }
 models++;
}
// Rebuilding on every animation frame must not retain old strokes or body surfaces.
for(let i=0;i<18;i++){view.set(i%2?'cone':'water',.1+i/25);assert(view.group.children.length<60);assert(view.visibility.inspect().strokes.length<26);}view.destroy();assert.equal(view.group.children.length,0);assert.equal(view.visibility,null);assert(view.renderer.disposed&&view.renderer.lost);assert.equal(view.live,false);m.dom.window.close();
for(const fault of ['omit-block','opaque-vessel']){const n=mount(fault);n.view.set('water',1);const block=n.view.visibility.inspect().strokes.filter(s=>s.owners.includes('block')),hidden=block.filter(s=>hiddenLength(s)>.99).length;assert.notEqual(hidden,3,'negative control rejected: '+fault);n.view.destroy();n.dom.window.close();}
console.log(`EGE_BASE_LAB_VISIBILITY_OK:${models} models,${rotations} camera cases,${tangencies} analytic tangent checks,18 rebuilds,2 negative controls (actual Three math; mock WebGL)`);
