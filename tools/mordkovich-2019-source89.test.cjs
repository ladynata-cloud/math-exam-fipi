'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const context = vm.createContext({window:{}});
require('./public-page-script.cjs').loadSchoolModels(root,read('school/index.html'),context);
const book = context.window.WorkshopCurriculum.books.find(b=>b.id==='source-89');
assert.equal(book.source.sha256,'d4a9d47bd2a22b069ff4368bb96ce1033d642abbd488da7c8df1c11f765a00ae');
assert.equal(book.source.pages,234);
assert(book.note.includes('978-5-346-04407-9'));
assert.equal(book.mapping.length,66);
const printedPages=[5,11,12,17,21,31,36,42,48,60,74,77,84,89,92,97,103,107,111,113,120,123,124,129,131,134,137,140,144,147,149,151,154,162,165,167,171,174,179,186,190,195,199,203,209,215,217,224];
const paragraphs=book.mapping.filter(r=>/^§ /.test(r.sectionLabel));
assert.deepEqual(Array.from(paragraphs,r=>r.page),printedPages);
for(const [i,row] of paragraphs.entries()) {
  assert.equal(row.sectionLabel,'§ '+(i+1));
  assert.equal(row.sourcePath,'https://pdf.my-uchebnik.ru/pdf/algebra/00000069.pdf#page='+(row.page+1));
  assert.equal(row.coverage,i<19?'module':'source');
  if(i<19)assert.equal(row.externalPath,row.boardPath);
  else assert(row.bookOnly&&!row.externalPath&&!row.boardPath);
}
const dir='trainers/mordkovich-2019/';
const ids=['1-ex1','1-ex2-a','1-ex2-b','1-ex2-c','1-q1','1-q2','1-q3','1-q4','1-q5','1-q6','1-q7','1-q8','1-q9','1-q10','1-q11','1-q12','2-q1-add','2-q1-div','2-q2','2-q3','2-q4','3-ex1','3-ex2','3-q1','3-q2','3-q3','4-ex1','4-ex2','4-q1','4-q2','4-q3','4-q4','4-q5-a','4-q5-b','4-q5-c','4-q6','4-q7','4-q8-a','4-q8-b','5-ex1','5-ex2','5-ex3','5-ex4','5-ex5','5-ex6','5-ex7','5-ex8','5-ex9','5-ex10','5-ex11','5-ex12','5-ex13','6-ex1','6-ex2','6-ex3','6-q1','6-q2','6-q3','6-q4-a','6-q4-b','6-q4-c','6-q4-d','6-q5-rays','6-q5-bounded','7-intro-1','7-intro-2','7-intro-3','7-intro-4','7-intro-5','7-intro-6','7-intro-7','7-intro-8','7-intro-9','7-intro-10','7-ex1','7-ex2-a','7-ex2-b','7-ex2-c','7-ex2-d','7-q1','7-q2','7-q3','7-q4','7-q5','7-q6','7-q7','7-q8','7-q9','8-ex1-a','8-ex1-b','8-ex1-c','8-ex1-d','8-ex2-rect','8-ex2-x','8-ex2-y','8-ex2-o','8-q1','8-q2','8-q3-a','8-q3-b','8-q3-c','8-q3-d','8-q4-a','8-q4-b','8-q5-a','8-q5-b','8-q6','8-q7-x','8-q7-y','8-q7-o','9-trains','9-ex1','9-ex2','9-ex3','9-case1','9-case2','9-case3','9-case4','9-case5','9-ex4','9-ex5','9-ex6','9-ex7-a','9-ex7-b','9-ex7-c','9-ex7-d','9-q1','9-q2','9-q3','9-q4','9-q5','9-q6','9-q7','9-q8','9-q9-h','9-q9-v','9-q10-yes','9-q10-no','10-convert','10-ex1','10-stock-in','10-stock-out','10-walk','10-ex2-a','10-ex2-b','10-ex3','10-ex4-a','10-ex4-b','10-ex4-c','10-ex4-d','10-ex4-e','10-ex5-a','10-ex5-b','10-ex5-c','10-ex5-d','10-ex6','10-q1','10-q2','10-q3','10-q4-segment','10-q4-interval','10-q5','10-q6-zero','10-q6-positive','10-q6-negative','10-q7','10-q8','10-q9','10-q10','10-q11-up','10-q11-down','11-ex1-a','11-ex1-b','11-ex2','11-ex3','11-q1','11-q2','11-q3','11-q4-a','11-q4-b','11-q5-up','11-q5-down','11-q6','12-ex1-a','12-ex1-b','12-ex1-c','12-ex1-d','12-median-odd-three','12-median-odd-nine','12-median-even-four','12-median-even-ten','12-unpack','12-ex2','12-q1','12-q2','12-q3','12-q4','12-q5','12-q6','12-q7','12-q8-gt','12-q8-lt','12-q8-eq','12-q9-gt','12-q9-lt','12-q9-eq','12-q10-gt','12-q10-lt','12-q10-eq','13-intro-1','13-intro-2','13-intro-3','13-intro-4','13-garden','13-ex1','13-ex2','13-ex3','13-q1','13-q2','13-q3','13-q4-a','13-q4-b','13-q4-c','13-q5','13-q6','13-q7','13-q8','14-garden','14-ex1','14-ex2','14-q1','14-q2','15-intro','15-ex1','15-ex2','15-ex3','15-ex4','15-ex5-a-plus','15-ex5-a-minus','15-ex5-b-pp','15-ex5-b-pn','15-ex5-b-np','15-ex5-b-nn','15-ex6','15-q1','15-q2-a','15-q2-b','16-ex1','16-ex2','16-ex3','16-ex4','16-q1','16-q2','17-football','17-ex1','17-ex2-a','17-ex2-b','17-ex2-c','17-ex2-d','17-q1-a','17-q1-b','17-q1-c','17-q1-d','17-q1-e','17-q1-f','17-q1-g','17-q1-h','17-q2','17-q3','18-ex1','18-ex2','18-ex3','18-ex4-a','18-ex4-b','18-ex4-c','18-ex4-d','18-ex4-e','18-ex4-f','18-ex4-g','18-ex4-h','18-ex5','18-q1','18-q2','18-q3','18-q4','19-ex1','19-ex2','19-q1-even','19-q1-odd','19-q2','19-q3','19-q4'];
const printed=[6,9,9,9,10,10,10,10,10,10,11,11,11,11,11,11,12,12,12,12,12,14,15,17,17,17,19,20,21,21,21,21,21,21,21,21,21,21,21,22,22,23,24,25,26,27,27,28,28,29,30,30,32,33,36,36,36,36,36,36,36,36,36,36,37,37,37,37,37,37,37,37,37,37,38,39,39,39,39,40,40,40,40,40,40,40,40,40,46,46,46,46,47,47,47,47,47,47,47,47,47,47,47,47,47,47,48,48,48,48,48,49,50,51,52,52,52,52,52,52,54,54,56,56,56,56,59,59,59,59,59,60,60,60,60,60,60,60,60,62,65,65,66,67,67,68,69,69,69,69,69,70,70,70,70,72,73,73,73,73,73,73,73,73,73,73,73,73,73,73,73,74,74,75,76,76,76,76,76,76,77,77,77,77,77,77,77,78,79,79,79,79,80,81,81,81,81,81,81,81,82,82,82,82,82,82,82,82,82,85,85,85,85,86,86,87,88,89,89,89,89,89,89,89,89,89,89,89,91,92,92,92,93,93,94,95,95,96,96,96,96,96,96,96,97,97,97,98,100,101,101,102,102,103,104,104,104,104,104,105,105,105,105,105,105,105,105,106,106,108,109,109,109,109,109,109,109,109,109,109,110,110,110,110,110,111,112,113,113,113,113,113];
const html=read(dir+'index.html');
const files=[...html.matchAll(/<script defer src="([^"]+)"/g)].map(m=>m[1])
  .filter(x=>!x.startsWith('/')&&!x.includes('board-bridge')).map(x=>read(path.join(dir,x)));
function open(entry,save) {
  const dom=new JSDOM(html,{url:'https://school.example'+entry.path,runScripts:'outside-only'});
  const w=dom.window, key='math:mordkovich-2019:v1:89-'+entry.path.split('89-').pop();
  w.TextEncoder=TextEncoder;w.Math.random=()=>0;
  if(save)w.localStorage.setItem(key,save);
  files.forEach(s=>w.eval(s));
  return {dom,w,doc:w.document,key};
}
function expected(i,s) {
  const u=s+2,v=s+4,a=s+2,b=ids[i]==='1-ex2-a'?s+4:-(s+1);
  const h=s+2,w=s+6,k=s+1, gap=s+3, initial=gap+2*k;
  switch(ids[i]) {
    case '1-ex1':return [-1/3,-3*(u+v),(-3*(u+v))/(5*s+5)];
    case '1-ex2-a':case '1-ex2-b':return [a-b,a*a-b*b,(a*a+2*a*b+b*b)/(a*a-b*b)];
    case '1-ex2-c':return [-a,a,2];
    case '2-q2':return [2*s+8,(s+2)*(s+4),2*s+8-(s+2)*(s+4)];
    case '2-q3':return [h*w,h*k,h*(w+k)];
    case '2-q4':return [h*w,h*k,h*(w-k)];
    case '3-ex1':return [2*k,initial,3*initial];
    case '3-ex2':return [6,2*s+4,3*s+6];
    case '4-ex1':{const x=(s+1)/3+(s+3)/6;return [6,12*x,4*x];}
    case '5-ex1':{const high=3*s+6,low=2*s+4;const total=high*(s+1)/(high-low);return [high*(s+1),total,low*total];}
    case '6-ex1':return [-s-2,-3*s-6,s+2];
    case '6-ex2':{
      const b=(s+1)/(s+6),c=(s+3+s%3)/(s+6),a=(s+8)/(s+6);
      return [Math.abs(c-b),Math.abs(a-c),2*c<a+b?b:a];
    }
    case '4-ex2':{
      const l=(s+3)/5, r=(s+2)/2;
      return [10*l,10*(l-r),((s+1)/5+(s+3)/2)/(l-r)];
    }
    case '4-q1':{const h=s+2, b=(s+1)*h+s+3;return [h,b,-b/h];}
    case '4-q2':return [1-2*s,s+2,-s];
    case '4-q3':return [(s+2)*(s+1),s+2,0];
    case '4-q4':return [2,s+1,1];
    case '4-q5-a':case '4-q5-b':case '4-q5-c':{
      const root=ids[i]==='4-q5-a'?0:ids[i]==='4-q5-b'?s+1:-s-1;
      return [(s+2)*root,s+4,(s+2)*(root+1)+s+4];
    }
    case '4-q6':return [-2*s-5,-s-2,(2*s+5)/(s+2)];
    case '4-q7':return [-s-3,-(s+2)*(s+3),s+2];
    case '4-q8-a':return [s+2,s+3,0];
    case '4-q8-b':return [3*s+4,s+2,2*s+2];
    case '5-ex2':{
      const t=2+s%3, lead=t*(s+2)-(s+3), pedestrian=(t*(s+2)-lead)/(t+1-t);
      return [t+1,pedestrian,pedestrian*(t+1)];
    }
    case '5-ex3':{
      const t=s+2+30/60, x=s+5, flow=1+s%3;
      return [t,t*(x+flow)+1.5*(x-flow)-x*(t+1.5),x];
    }
    case '5-ex4':{
      const v=s+2, saved=30+15*s, rest=(saved/60)/(1/v-1/(2*v));
      return [saved,rest,v/2+rest];
    }
    case '5-ex5':return [6,2*s+8,3*s+12];
    case '5-ex6':{
      const metres=10*s+40, kph=metres*3600/6000;
      return [metres/6,kph,kph-(2*s+8)];
    }
    case '5-ex7':{
      const d=5+s%3,n=10*(10+s)+d;return [100*d,Math.floor(n/10),n];
    }
    case '5-ex8':{
      const n=(1+s%2)*100000+60000+1001*s;return [Math.floor(n/100000)*100000,n%100000,n];
    }
    case '5-ex9':{
      const a=10*s+20,b=20*s+60;
      return [a,1.2*a-a,1.1*b-b];
    }
    case '5-ex10':{
      const c=3*s+12;return [1+1/5,c+c/4,(1.25*c)/(1.75-1.25*1.2)];
    }
    case '5-ex11':{
      const m=30*s+60,salt=m/5;return [salt,m/10,(salt-0.1*m)/0.3];
    }
    case '5-ex12':{
      const m=50*(s+2),r=20*(s+2),lost=r*(5+5*(s%3))/100,d=4+2*(s%4);
      const x=(lost*100+(m-r)*d)/r;
      return [lost,x,m*x/100-lost];
    }
    case '5-ex13':{
      const m=40*s+40,p=2*s+2,pure=m/2*(1-p/100);
      return [100-p,pure,(m-pure)/m*100];
    }
    case '6-ex3':{
      const n=2*s+1, good=s+1+s-Math.floor((2*s-1)/3)-1;
      return [n,good,good/n];
    }
    case '6-q1':{const h=s+1,t=2+s%3;return [-2*h,t*h,(t+2)*h];}
    case '6-q2':{const a=-s-3,b=2*s,h=(b-a)/3;return [h,b-h,a-h];}
    case '6-q3':return [2*s+1,-s,s+0.5];
    case '6-q4-a':case '6-q4-b':case '6-q4-c':case '6-q4-d':{
      const coords={'6-q4-a':[s+1,2*s+3],'6-q4-b':[-s-2,-2*s-3],'6-q4-c':[-s-1,s+3],'6-q4-d':[s+4,-2*s]}[ids[i]];
      const lo=Math.min(...coords),hi=Math.max(...coords);return [lo,hi-lo,hi+s+1-lo];
    }
    case '6-q5-rays':return [s-7,s-6,s-8];
    case '6-q5-bounded':{
      const values=Array.from({length:2*s+3},(_,k)=>k-s),b=s+2;
      return [values.length,values.filter(x=>x>-s&&x<b).length,values.filter(x=>x<b).length];
    }
    case '1-q1':return [2*s+7,s+2,(2*s+7)*(s+2)];
    case '1-q2':return [s+3,2*s+4,0];
    case '1-q3':return [s+3,(s+3)*(s+2)+s+1,s+3];
    case '1-q4':return [(s+2)**2,-(s+1)*(s+2),s+2];
    case '1-q5':return [-s-3,s+4,0];
    case '1-q6':return [s+4,s+2,(s+4)*(s+2)];
    case '1-q7':return [4*s+3,10*s+10,13*s+12];
    case '1-q8':return [4*s+12,100*s+100,(4*s+12)*25*(s+1)];
    case '1-q9':return [s+2,(s+1)*(s+2),s+4];
    case '1-q10':return [0,s+1,3];
    case '1-q11':return [2,s+4,(s+5)/2];
    case '1-q12':return [-s-3,s+2,2];
    case '2-q1-add':{const d=(s+2)*(2+s%3);return [d/(s+2),3+s%3,1/(s+2)+1/d];}
    case '2-q1-div':return [s+3,(s+2)*(s+3),(s+2)/(s+5)/(1/(s+3))];
    case '3-q1':return [2*s+6,4*s+9,s+1];
    case '3-q2':return [s+3,(s+2)*(s+1),s+3+(s+2)*(s+1)];
    case '3-q3':{const cap=s+3,n=(s+2)*cap+1;return [Math.floor(n/cap),n%cap,Math.ceil(n/cap)];}
    case '7-intro-1':return [s+2,-s-1,-(s+1)*(s+2)];
    case '7-intro-2':return [s+3,s+1,(s+1)*(s+2)];
    case '7-intro-3':return [2*s+5,-2*s-5,2*s+5];
    case '7-intro-4':return [(s+2)*(s+1),s+2,-s-1];
    case '7-intro-5':return [s+3,s+2,0];
    case '7-intro-6':return [(s+3)*(s+1),s+3,s+1];
    case '7-intro-7':return [(s+1)*(s+2),-s-2,-s-1];
    case '7-intro-8':return [-s-3,2*s+5,0];
    case '7-intro-9':return [1,s+4,(s+2)*(1-s-4)];
    case '7-intro-10':return [-2*s-3,1,-s-3];
    case '7-ex1':{
      const points=[0,1,2,3,6].map(n=>n*(s+1)-s-3),d=[];
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)d.push(Math.abs(points[i]-points[j]));
      const mode=d.toSorted((a,b)=>d.filter(x=>x===b).length-d.filter(x=>x===a).length)[0];
      return [d.length,Math.max(...d)-Math.min(...d),mode];
    }
    case '7-ex2-a':return [s+4,s+3,(s+4)*(s+3)];
    case '7-ex2-b':return [2,s+4,2*s+8];
    case '7-ex2-c':{const pairs=Array.from({length:s+4},(_,i)=>i+1).filter(i=>2*i<=s+4);return [pairs.at(-1),2*pairs.at(-1),pairs.length];}
    case '7-ex2-d':{const list=Array.from({length:s+4},(_,i)=>i+1),ev=list.filter(x=>x%2===0),od=list.filter(x=>x%2===1);return [ev.length,od.length,ev.length*od.length];}
    case '7-q1':return [8,s+4,2*s+3];
    case '7-q2':return [s-6,s+3,0];
    case '7-q3':return [3,1.5,-s-.5];
    case '7-q4':return [0,0,s+3];
    case '7-q5':return [-s-4,3,1];
    case '7-q6':return [6,5,s+4];
    case '7-q7':case '7-q8':{
      const n=ids[i]==='7-q7'?s+4:s+5;let count=0;
      for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)count++;
      return [n-1,2*count,count];
    }
    case '7-q9':return [s+1,(s+3)*(s+1),s+3];
    case '8-ex1-a':case '8-ex1-b':case '8-ex1-c':case '8-ex1-d':{
      const kind=ids[i].at(-1),p={a:[1+s%4,1+s%3],b:[-1-s%4,1+s%3],c:[s+1,0],d:[0,-s-1]}[kind];
      return [...p,(kind==='a'||kind==='d'?p[0]:p[1])+1+s%3];
    }
    case '8-ex2-rect':{
      const left=-2+s%4,bot=-2+s%3,right=left+2*(1+s%3),top=bot+2*(1+s%4);
      return [right-left,(right-left)*(top-bot),2*(right-left+top-bot)];
    }
    case '8-ex2-x':case '8-ex2-y':case '8-ex2-o':{
      const x=1+s%4,y=1+s%3,t=ids[i].at(-1);return [x,t==='x'?x:-x,t==='y'?y:-y];
    }
    case '8-q1':return [1+s%4,-1-s%3,1+s%3];
    case '8-q2':return [-1-s%4,1+s%3,1+s%4];
    case '8-q3-a':case '8-q3-b':case '8-q3-c':case '8-q3-d':{
      const t=ids[i].at(-1),x=1+s%4,y=1+s%3;
      return {a:[-x,y,2],b:[x,-y,4],c:[-x,-y,3],d:[x,y,1]}[t];
    }
    case '8-q4-a':case '8-q4-b':return [(s%2?-1:1)*(1+s%4),2+s%3+s%2,0];
    case '8-q5-a':case '8-q5-b':return [0,s+1,s+2+s%3];
    case '8-q6':return [-1-s%3,s%4-s%2,-1-s%3];
    case '8-q7-x':case '8-q7-y':case '8-q7-o':{
      const t=ids[i].at(-1),x=(s%2?-1:1)*(1+s%4),y=1+s%3;
      return [t==='x'?x:-x,t==='y'?y:-y,0];
    }
    case '9-trains':{const t=2+s%4;return [t+1+s%3,t*(s+5),s+5];}
    case '9-ex1':{const h=2+2*(s%3),k=1+s%4;return [h*k,h,(s+3)*k];}
    case '9-ex2':return [2,s+3,(s+3)*(1+s%3)];
    case '9-ex3':return [s+2,s+3+s%3,-2-2*(s%3)];
    case '9-ex4':{const a=1+s%4;return [s+1,a+s+1,-(2*s+2)/a];}
    case '9-ex5':return [s+2,s+3,(s+3)/2];
    case '9-ex6':return [7+2*(s%3),s+2,(2+s%3)*(s+2)];
    case '9-ex7-a':{const h=1+s%4;return [Math.abs(-h)*(1+s%3),-h,2];}
    case '9-ex7-b':{const v=(1+s%4)*(1+s%3);return [v,-v,0];}
    case '9-ex7-c':return [s+3,s+2-s%3,1];
    case '9-ex7-d':return [0,1+s%4,0];
    case '9-case1':{const nx=3+s%4,ny=3+s%3;return [0,ny,nx*ny];}
    case '9-case2':return [s+2,0,-s-2];
    case '9-case3':return [-s-2,0,s+2];
    case '9-case4':return [s+2,2*s+3,0];
    case '9-case5':return [0,-s-1,-(s+1)/(s+3)];
    case '9-q1':return [s+1,-s-2,-s-4];
    case '9-q2':return [-s-3,s+1,-s-5];
    case '9-q3':return [3*s+8,2,s+2];
    case '9-q4':return [s+2,s+3,0];
    case '9-q5':return [s+3,2*s+4,0];
    case '9-q6':{const y=2+s%4;return [(10*s+30)*(s+2),(10*s+10)*y,y];}
    case '9-q7':return [0,1+s%4,1+s%4];
    case '9-q8':return [0,s+1,2];
    case '9-q9-h':case '9-q9-v':return [-s-1,s+1,2*(1+s%3)];
    case '9-q10-yes':return [-(s+1)/(s+2),-2,-s-3];
    case '9-q10-no':return [s+1,3+2*(s%3),0];
    case '10-convert':return [1+s%3,s+1,2*(1+s%3)+s+1];
    case '10-ex1':return [-s-1,s%3-s,1+s%3];
    case '10-stock-in':{const d=2+s%4,p=1+s%3;return [d*p,s+4+d*p,2];}
    case '10-stock-out':{const p=s+2,n=3+s%5;return [(n-2)*p+1,n,1];}
    case '10-walk':{const v=2+s%3;return [s+3,s+3+v/2,s+3+(3+s%4)*v];}
    case '10-ex2-a':case '10-ex2-b':return [s+3+2*(s%3),s-3-2*(s%3),ids[i].endsWith('-a')?2:0];
    case '10-ex3':return [s%3,s+2+(s%3)/2,s+4+(s%3)/2];
    case '10-ex4-a':case '10-ex4-b':case '10-ex4-c':case '10-ex4-d':case '10-ex4-e':{
      const part=ids[i].slice(-1),v=1+s%3;
      return [part==='e'?s+2-(2+s%3)*v:s+2+(1+s%2)*v,'acd'.includes(part)?1:0,'ae'.includes(part)?1:0];
    }
    case '10-ex5-a':return [0,s+1,1+s%3];
    case '10-ex5-b':return [s+1,2*(1+s%3),1];
    case '10-ex5-c':return [s+1,-2*(1+s%3),1];
    case '10-ex5-d':return [s-2,s,1];
    case '10-ex6':return [(1+s%3)*(s+2),1+s%2,s+2];
    case '10-q1':return [s+3,-s-1,1-s];
    case '10-q2':return [s+2,0,1];
    case '10-q3':return [3,1+s%3,s+2];
    case '10-q4-segment':case '10-q4-interval':return [2*(s%3)-s,6,ids[i].endsWith('segment')?4:2];
    case '10-q5':return [-s-2,-s-2,3];
    case '10-q6-zero':return [(s+1)*(1+s%3),s+1,1];
    case '10-q6-positive':return [s+1,2*(1+s%3),2];
    case '10-q6-negative':return [s+1,-2*(1+s%3),1];
    case '10-q7':{const k=(s%2?-1:1)*(1+s%3);return [2*k,k,3*k];}
    case '10-q8':return [0,-s-2,s+2];
    case '10-q9':return [2*(1+s%3),2*(s+1),s+2+s%3];
    case '10-q10':return [2*(1+s%3),-s-2,0];
    case '10-q11-up':case '10-q11-down':{const up=ids[i].endsWith('up'),k=(up?1:-1)*(1+s%3);return [k,up?1:2,k];}
    case '11-ex1-a':return [3,1+s%4,s+2];
    case '11-ex1-b':return [2+s%4,2+s%4,0];
    case '11-ex2':return [0,s+2,3+s%3];
    case '11-ex3':return [0,s+1,0];
    case '11-q1':return [1+s%3,s+3+s%4,1+s%4];
    case '11-q2':return [-(2+s%3)*(s+1),s+1,5];
    case '11-q3':return [s+4-2*(1+s%3),s+5+s%3,1];
    case '11-q4-a':return [s+1,s+1,(1+s%3)*(s+1)+2];
    case '11-q4-b':return [0,s+2,0];
    case '11-q5-up':case '11-q5-down':{const a=ids[i].endsWith('up')?s+1:-s-1;return [a,s+1,a-1-s%3];}
    case '11-q6':return [1+s%3,s+1,1];
    case '12-ex1-a':return [-s-1,2,4];
    case '12-ex1-b':return [5,-s-2,2*s+6];
    case '12-ex1-c':return [-s-1,0,6];
    case '12-ex1-d':return [4,s+3,3];
    case '12-median-odd-three':return [2,s+3,s+3];
    case '12-median-odd-nine':return [5,s+3,s+3];
    case '12-median-even-four':return [2,s+4,s+3.5];
    case '12-median-even-ten':return [5,s+3,s+3];
    case '12-unpack':return [2+s%3,5+s%3,7+s%3];
    case '12-ex2':return [s+8+s%2,s+3,s+6+s%2];
    case '12-q1':return [6,5,s+2];
    case '12-q2':return [4,s+2,3];
    case '12-q3':return [3,4,8];
    case '12-q4':return [3,s+3,s+6];
    case '12-q5':return [5,s+3,2];
    case '12-q6':return [s+.5,3,0];
    case '12-q7':return [3,0,2];
    case '12-q8-gt':return [4,2,3];
    case '12-q8-lt':return [4,6,7];
    case '12-q8-eq':return [4,4,5];
    case '12-q9-gt':return [s+3,s+4,1];
    case '12-q9-lt':return [s+3,s+2,-1];
    case '12-q9-eq':return [s+3,s+3,0];
    case '12-q10-gt':return [s+4,s+3,2];
    case '12-q10-lt':return [s+4,s+5,2];
    case '12-q10-eq':return [s+4,s+4,3];
    case '13-intro-1':return [3*(1+s%3),0,1];
    case '13-intro-2':return [-1-s%3,0,1];
    case '13-intro-3':return [-2*s-3,0,1];
    case '13-intro-4':return [3*(s+3),-s-1,0];
    case '13-garden':return [3,s+1,2*(s+1)];
    case '13-ex1':return [2,s+3+s%4,0];
    case '13-ex2':{const x=s+3+s%3;return [2*x,x,s+2];}
    case '13-ex3':{const k=2+s%3,b=s+1,x=b+1/(k+1);return [k+1,x,k*x-b];}
    case '13-q1':return [s+4,s+2-2*(s%3),s+6+2*(s%3)];
    case '13-q2':return [2,2,1];
    case '13-q3':return [1,-1,s+3];
    case '13-q4-a':return [-s-2,s+2,1];
    case '13-q4-b':return [s+1,s+1,1];
    case '13-q4-c':return [2*s+4,-2,1];
    case '13-q5':return [1,0,0];
    case '13-q6':return [2*s+3,s+2,0];
    case '13-q7':return [(2+s%3)*(s+2),s+1,5];
    case '13-q8':return [0,s+1,0];
    case '14-garden':{const k=2+s%3;return [1+2*k,s+1,k*(s+1)];}
    case '14-ex1':return [3,s+4/3,s+5/3];
    case '14-ex2':return [-1-s%3,-3-2*(s%3),-s-2];
    case '14-q1':return [2,s+2,s+3+s%3];
    case '14-q2':return [2*(1+s%3),s+1,s+2+s%3];
    case '15-intro':return [0,s+1,2+s%3];
    case '15-ex1':return [-3,-3*(s+1),-1-s%3];
    case '15-ex2':return [3,17,s+1];
    case '15-ex3':return [-s-1,2*(1+s%3),1+s%4];
    case '15-ex4':return [0,s+1,-1-s%3];
    case '15-ex5-a-plus':return [100,s+4,1];
    case '15-ex5-a-minus':return [100,s+1.5,0];
    case '15-ex5-b-pp':return [2*(s+1)+1,1,s];
    case '15-ex5-b-pn':return [2*(s+1)+1,3,s-3];
    case '15-ex5-b-np':return [2*(s+1)-1,-3,s+5];
    case '15-ex5-b-nn':return [2*(s+1)-1,-1,s+2];
    case '15-ex6':return [s+7,s+11,2];
    case '15-q1':return [2,7,s+1];
    case '15-q2-a':return [1,s+1,1+s%3];
    case '15-q2-b':return [3,s+1,1+s%3];
    case '16-ex1':return [-2*(s+6),s+18,2*s+32];
    case '16-ex2':{const n=[13,14,15,16,17,25,26,28,29,35,38][(s-1)%11],x=Math.floor(n/10),y=n%10;return [10-Math.floor(n/(x+y)),x,n];}
    case '16-ex3':return [6*(s+1),2*(s+1),4*(s+1)];
    case '16-ex4':return [4*(s+1),s+1,2*(s+1)];
    case '16-q1':return [1,5,3*(1+s%3)];
    case '16-q2':return [3,1+s%3,s+2];
    case '17-football':{const count=s+7+s%3+s%2;return [count,s+4,(1+s%2)/count];}
    case '17-ex1':return [3,2,3/5];
    case '17-ex2-a':return s===1?[4,2,3]:[4,3,2];
    case '17-ex2-b':return s===1?[2,2,.5]:[3,1,.75];
    case '17-ex2-c':{const first=[1,1,1,3,1,3,3,1,3,3,1][s-1];return [first,first+1,0];}
    case '17-ex2-d':return s===1?[3,4,2]:[2,4,3];
    case '17-q1-a':return [1,4,2];
    case '17-q1-h':return [1,2,2];
    case '17-q1-c':return [1,.4,2];
    case '17-q1-g':return [1,30,2];
    case '17-q1-b':case '17-q1-d':case '17-q1-f':return [2,s+3,1/(s+5+s%2)];
    case '17-q1-e':{const n=s+1,g=1+s%3;return [3,n+g,(4*n+5*g)/(n+g)];}
    case '17-q2':return [1+s%2,s+3+s%2,0];
    case '17-q3':return [s+2,3+s%3,s+5+s%3];
    case '18-ex1':return [2+s%4,2+s%5,1+s%5];
    case '18-ex2':{const n=1+s%3,v=(2+s%4)**(2*n);return [n,v,-v];}
    case '18-ex3':return [(s+1)**3,(s+2)**3,((s+1)/(s+2))**3];
    case '18-ex4-a':return [2*s+1,4,(s+.5)**2];
    case '18-ex4-b':return [1,(s+2)**4,1/(s+2)**4];
    case '18-ex4-c':return [-s-1,-2*s-2,s+1];
    case '18-ex4-d':return [s+1,1,-1];
    case '18-ex4-e':return [s+1,-1,1];
    case '18-ex4-f':case '18-ex4-g':return [0,s+3,0];
    case '18-ex4-h':return [1,s+4,s+3];
    case '18-ex5':{const a=1+s%3,b=2+s%2;return [a*a,-(b**3),-(s+2)*a*a*b**3];}
    case '18-q1':{const n=2+s%3,a=s+3;return [n*a,a**n,a];}
    case '18-q2':return [-s-.5,s+.5,2];
    case '18-q3':return [s+3,1+s%3,(s+3)**(1+s%3)];
    case '18-q4':{const g=2+s%3;return [2**g,s+1,2*g];}
    case '19-ex1':return [2+s%6,2+s%4,s%6-s%4];
    case '19-ex2':return [0,2,(2+s%3)**2];
    case '19-q1-even':return [100+s,0,1];
    case '19-q1-odd':return [100+s,1,-1];
    case '19-q2':return [s+20,s+21,s+18];
    case '19-q3':return [0,1,1];
    case '19-q4':return [1,10+s,9+s];
    default:throw new Error('Unexpected lesson');
  }
}
assert.equal(book.exercises.length,ids.length);
for(const [i,entry] of book.exercises.entries()){
  const id='89-'+ids[i],{dom,w,doc,key}=open(entry);
  assert.equal(entry.path,'/'+dir+'index.html#lesson/'+id);
  assert.equal(entry.path,entry.boardPath);assert.equal(entry.page,printed[i]);
  assert.equal(doc.querySelector('#lesson').value,id);
  assert.equal(doc.querySelector('#back').hash,'#book/source-89');
  assert.equal(doc.querySelector('#source').href,'https://pdf.my-uchebnik.ru/pdf/algebra/00000069.pdf#page='+(printed[i]+1));
  assert.equal(new URL(doc.querySelector('#board').href).searchParams.get('trainer'),entry.path);
  const lesson=w.MathExamTopicPractice.lessons.get(id);
  assert.equal(lesson.title,entry.title);
  assert.equal(lesson.printedReference,entry.printed);
  assert.equal(w.MathExamTopicEdition.nextId(lesson),ids[i+1]&&'89-'+ids[i+1]);
  const variants=new Set();
  for(let s=1;s<=11;s++){
    const data=lesson.make(s), answers=expected(i,s);variants.add(JSON.stringify(data.rows));
    data.questions.forEach((q,j)=>{
      assert(Math.abs(q.answer-answers[j])<1e-8,id+' '+s+' '+j);
      for(const [bad,message] of q.mistakes){assert(Math.abs(bad-q.answer)>1e-7);assert(message.length>25);}
    });
    assert(w.MathExamTopicEdition.figure(data).includes('role="img"'));
  }
  assert.equal(variants.size,11);
  assert.deepEqual(JSON.parse(w.localStorage.getItem(key)).results,[]);
  doc.querySelector('[data-action="practice"]').click();
  const input=doc.querySelector('#answer');input.value='99875';input.dispatchEvent(new w.Event('input',{bubbles:true}));
  const saved=w.localStorage.getItem(key);
  const reopened=open(entry,saved);
  assert.equal(reopened.doc.querySelector('#answer').value,'99875');
  assert.deepEqual(JSON.parse(reopened.w.localStorage.getItem(key)).results,[]);
  const current=reopened.doc;
  const action=name=>current.querySelector('[data-action="'+name+'"]').click();
  function send(value){
    const a=current.querySelector('#answer');
    a.value=Number.isInteger(value)?String(value):value.toFixed(9);
    a.dispatchEvent(new reopened.w.Event('input',{bubbles:true}));
    current.querySelector('#work form').dispatchEvent(new reopened.w.Event('submit',{bubbles:true,cancelable:true}));
  }
  send(expected(i,2)[2]);action('next');
  for(let q=0;q<3;q++){
    if(q===0){
      const [wrong,message]=lesson.make(4).questions[q].mistakes[0];
      send(wrong);
      assert(current.querySelector('#feedback').textContent.includes(message));
    }
    if(q===2)action('hint');
    send(expected(i,q+4)[q]);action('next');
  }
  assert.deepEqual(JSON.parse(reopened.w.localStorage.getItem(key)).results,['fixed','first','help']);
  action('again');
  assert.notEqual(JSON.parse(reopened.w.localStorage.getItem(key)).variant,0);
  reopened.dom.window.close();dom.window.close();
}
console.log('Source 89: 48 printed paragraphs, 292 student routes, 9636 independently checked questions and 292 personal draft round trips.');
