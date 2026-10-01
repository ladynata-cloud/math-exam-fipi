const assert=require('node:assert/strict');
const M=require('../ege-baza/labs/math.js');
let checks=0;const near=(x,y)=>{assert(Math.abs(x-y)<1e-8,`${x} != ${y}`);checks++;};
// Independent conservation equation, including dry, partially and fully submerged states.
for(let i=0;i<=100;i++){const b=7*(1-i/100),h=M.water(b),displaced=16*Math.max(0,Math.min(4,h-b));near(100*h-displaced,400);assert(h>=4&&h<=4.64+1e-8);}
near(M.water(7),4);near(M.water(0),4.64);near(M.water(3),88/21);
// Similarity compared with actual volume formula, rather than the returned ratio itself.
for(const k of [.1,1/3,.5,.8,1]){const c=M.cone(k);near(Math.PI*c.radius**2*c.height/3/(Math.PI*9*6/3),k**3);}
for(const [s,b,h,A] of [[10,12,8,48],[13,10,12,60],[17,16,15,120],[15,18,12,108]]){const t=M.isosceles(s,b);near(t.height,h);near(t.area,A);}
for(const [r,a,b] of [[5,6,8],[6.5,5,12],[8.5,8,15],[12.5,7,24]]){const p=M.chord(r,a);near(p.x**2+p.y**2,r*r);near(Math.hypot(p.x+r,p.y),a);near(Math.hypot(p.x-r,p.y),b);near(p.other,b);}
for(const a of [-720,-390,-210,-90,0,30,90,150,180,270,360,390,750,1080]){const t=M.trig(a);near(t.sin*t.sin+t.cos*t.cos,1);near(t.sin,M.trig(a+360).sin);near(t.cos,M.trig(a+360).cos);}
near(M.trig(750).sin,.5);near(M.trig(-210).cos,-Math.sqrt(3)/2);assert.equal(M.trig(90).tan,null);assert.equal(M.trig(270).tan,null);assert.equal(M.radLabel(210),'7π/6');assert.equal(M.radLabel(-90),'−π/2');
const expectations=[x=>x<=-2,x=>x>=-2&&x<=3,x=>x< -2||x>3,x=>x< -2||x>3,x=>x>1&&x<=5,x=>x<=-1];
for(let i=0;i<M.cases.length;i++)for(const x of [-7,-4,-2.001,-2,-1.999,-1,0,.999,1,1.001,2,2.999,3,3.001,5,5.001,7]){assert.equal(M.contains(M.cases[i],x),expectations[i](x),M.cases[i].id+' at '+x);assert.equal(M.selectedContains(M.cases[i],x,M.cases[i].zones,M.cases[i].closed),expectations[i](x));checks+=2;}
assert(!M.contains(M.cases[3],-2));assert(!M.contains(M.cases[3],3));assert(!M.contains(M.cases[4],1));
console.log(`PASS: conservation, similarity, constructed geometry, angle identities, domains and boundaries (${checks} numerical assertions).`);
