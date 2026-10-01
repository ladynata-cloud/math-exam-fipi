'use strict';
const assert=require('assert/strict'),S=require('../../stereo-course/assets/store.js'),T=require('../../stereo-course/assets/tasks.js'),C=require('../../stereo-course/data/course.json'),book=require('../../stereo-course/data/textbook.json');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

// Quota failures leave reads available: export, navigation and imports must use
// the newest in-memory work rather than the last successful disk write.
const disk=new Map();let blocked=false;
global.localStorage={getItem:key=>disk.get(key)||null,setItem:(key,value)=>{if(blocked)throw Error('QuotaExceededError');disk.set(key,value);}};
const warnings=[],store=S.open(['space','box'],message=>warnings.push(message));
store.put('space',{written:'before'});blocked=true;
const openedKey=JSON.stringify(['Сколько плоскостей?',1]);
store.put('space',{written:'latest work',seenTasks:[openedKey],currentTaskKey:openedKey,repeatedTask:true,independent:7,attempts:9});
assert.equal(store.export().units.space.written,'latest work');
assert.equal(store.get('space').written,'latest work');
assert.deepEqual(store.get('space').seenTasks,[openedKey]);
assert.equal(store.get('space').currentTaskKey,openedKey);
assert.equal(store.get('space').repeatedTask,true);
assert.equal(store.get('space').independent,7);
assert.equal(store.get('space').attempts,9);
store.put('box',{observation:'another lesson'});
assert.equal(store.export().units.space.written,'latest work');
store.import({version:1,units:{space:{written:'imported after quota failure',updated:Date.now()+1000}}});
assert.equal(store.get('space').written,'imported after quota failure');
assert.equal(store.export().units.box.observation,'another lesson');
assert.ok(warnings.length>0);
assert.deepEqual(S.clean({independent:3}).seenTasks,[]);
assert.equal(S.clean({independent:3}).independent,3);
delete global.localStorage;

const plane=C.units.find(unit=>unit.id==='plane-equation');
assert.ok(plane.idea.includes('|ax₀+by₀+cz₀+d|/√(a²+b²+c²)'));
assert.ok(plane.investigate.startsWith('Поверни секущую плоскость'));
assert.ok(plane.pitfall.startsWith('Если a=b=c=0'));
assert.ok(!plane.pitfall.includes('|'));
// Printed opening pages, checked against the owner's 2024 contents pp. 284–286.
assert.deepEqual(book.topics.slice(42).map(topic=>topic.page),[100,101,102,103,104,105,106,107,108,116,118,121,122,125,126,128,129,133,134,135,142,143,145,146,147,150,151,152,160,161,163,164,166,171,171,173,174,180,181,182,182,183,194,195,196,198,200,202,204,206,207,208,214,216,219,223,226]);

const radians=degrees=>degrees*Math.PI/180;
// A Gram determinant independently checks whether three ray directions exist.
function gram(angles){const [x,y,z]=angles.map(angle=>Math.cos(radians(angle)));return 1+2*x*y*z-x*x-y*y-z*z;}
for(let seed=0;seed<120;seed++){
 const solid=T.make('solid-angle',seed),values=solid.q.match(/\d+/g).map(Number);
 if(seed%4===0){near(solid.a,values.reduce((a,b)=>a+b,0));assert.ok(gram(values)>0);}
 if(seed%4===1)assert.equal(solid.a,gram(values)>1e-8?'да':'нет');
 if(seed%4===2){near(gram([...values,solid.a[0]]),0);near(gram([...values,solid.a[1]]),0);assert.ok(gram([...values,(solid.a[0]+solid.a[1])/2])>0);}
 if(seed%4===3){assert.ok(solid.a*values[0]<360);assert.ok((solid.a+1)*values[0]>=360);}

 const conic=T.make('conic',seed),nums=conic.q.match(/\d+/g).map(Number);
 if(seed%6<3){const coefficient=1-(Math.tan(radians(nums[0]))/Math.tan(radians(nums[1])))**2;assert.equal(conic.a,Math.abs(coefficient)<1e-8?'парабола':coefficient>0?'эллипс':'гипербола');}
 if(seed%6===3)assert.equal(conic.a,'окружность');
 if(seed%6===4)assert.equal(conic.a,2);
 if(seed%6===5)near(conic.a,nums[0]/Math.sin(radians(nums[1])));

 const ceva=T.make('ceva',seed),ns=ceva.q.match(/\d+/g).map(Number);
 if(seed%4<2){const [p,q]=ns,D=[1/(p+1),p/(p+1)],E=[0,1/(q+1)];
  // Meet AD with BE, then intersect the line from C through this point with AB.
  const s=E[1]/(D[1]+D[0]*E[1]),P=D.map(v=>v*s),fx=P[0]/(1-P[1]),ratio=fx/(1-fx);
  if(seed%4===0)near(ceva.a,ratio);else assert.equal(ceva.a,Math.abs(ns[2]/ns[3]-ratio)<1e-8?'да':'нет');
 }else{const p=ns[1],q=ns[3],D=[p/(p+1),1/(p+1)],E=[0,q/(q+1)],fx=D[0]-D[1]*(E[0]-D[0])/(E[1]-D[1]);
  near(ceva.a,seed%4===2?ns[4]*(fx-1):fx/(fx-1));
 }
}
for(const kind of ['solid-angle','conic','ceva'])assert.ok(new Set(Array.from({length:120},(_,seed)=>T.make(kind,seed).q)).size>=20,kind+' must offer different conditions');
console.log(JSON.stringify({status:'PASS',checks:'quota recovery, complete plane formula, 57 page references, 360 geometric task variants'}));
