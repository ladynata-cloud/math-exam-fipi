/* Small original lessons using the existing PathData / grade7-construction contract. */
(function(root){'use strict';
const D=root.PathData,previous=D.task,builders=new Map(),families=[],count=72;
const normalized=seed=>{const n=Number(seed);return Number.isFinite(n)?((Math.trunc(n)%count)+count)%count:0;};
const point=(x,y,dx=0,dy=-18)=>({x,y,dx,dy});
const seg=(id,from,to,extra={})=>({id,from,to,...extra});
const angle=(id,vertex,from,to,extra={})=>({id,vertex,from,to,...extra});
const diagram=(description,points,segments=[],angles=[],extra={})=>({description,points,segments,angles,...extra});
const num=(q,a,why,feedback={})=>({q,a:String(a),why,strict:true,...(Object.keys(feedback).length?{feedback}:{} )});
function choice(q,labels,correct,seed,why,feedback=[]){
 const offset=normalized(seed)%labels.length,order=labels.map((_,i)=>(i+offset)%labels.length);
 const mapped={};order.forEach((old,i)=>{if(feedback[old])mapped[String(i+1)]=feedback[old];});
 return {...num(q,order.indexOf(correct)+1,why,mapped),choices:order.map((old,i)=>({value:String(i+1),label:labels[old]}))};
}
function project(world){
 const ps=Object.values(world),xs=ps.map(p=>p.x),ys=ps.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(390/(maxX-minX||1),220/(maxY-minY||1));
 return Object.fromEntries(Object.entries(world).map(([id,p])=>[id,{...p,...point(300+(p.x-(minX+maxX)/2)*scale,285-(p.y-minY)*scale,p.dx||0,p.dy===undefined?(p.y===minY?26:-20):p.dy)}]));
}
function elements(d){
 return [...Object.keys(d.points).filter(id=>d.points[id].label!==false&&!d.points[id].construction).map(id=>({id,label:'Точка '+id,description:'Найди точку '+id+' и прочитай условие: что о ней известно?'})),...(d.segments||[]).filter(s=>!s.construction).map(s=>({id:s.id,label:s.elementLabel||s.from+s.to,description:s.description||'Элемент '+(s.elementLabel||s.from+s.to)+'. Равенства и длины берём из условия и отметок, а не измеряем на экране.'})),...(d.angles||[]).filter(a=>!a.construction).map(a=>({id:a.id,label:'Угол '+a.from+a.vertex+a.to,description:a.description||'Вершина угла — '+a.vertex+'. Его стороны — лучи '+a.vertex+a.from+' и '+a.vertex+a.to+'.'})),...(d.circles||[]).filter(c=>!c.construction).map(c=>({id:c.id,label:'Окружность с центром '+c.center,description:'Все точки этой окружности находятся на одном и том же расстоянии от её центра '+c.center+'.'}))];
}
function make({q,steps,diagram:d,elements:parts,constructions=[],params={},...rest}){
 const last=steps.at(-1);if(!last)throw new Error('A lesson needs its reasoning steps.');
 return {q,answer:Number(last.a),a:String(last.a),answerExact:String(last.a),strict:true,steps,params,...(last.choices?{choices:last.choices.map(c=>({...c}))}:{}),...(last.feedback?{feedback:{...last.feedback}}:{}),model:{kind:'grade7-construction',diagram:d,elements:parts||elements(d),constructions},...rest};
}
function register({key,title,section,sourcePages,idea,prerequisites=[],build}){
 const id='grade7-r-'+key;if(builders.has(id)||D.meta.some(m=>m.id===id))throw new Error('Duplicate lesson '+id);
 const meta={id,title,section,sourcePages,idea,prerequisites:prerequisites.map(k=>k.startsWith('grade7-')?k:'grade7-r-'+k),gap:'logic',pos:null,trainingOnly:true,grade7:true,subject:'geometry',geometryRebuild:true};
 families.push(meta);D.meta.push(meta);builders.set(id,build);
}
D.task=function(id,seed=1){if(!builders.has(id))return previous(id,seed);const n=normalized(seed),t=builders.get(id)(n),meta=families.find(f=>f.id===id);return {...t,id,seed,pos:null,trainingOnly:true,grade7:true,subject:'geometry',geometryRebuild:true,sourcePages:meta.sourcePages,params:{...t.params,variant:n}};};
const api={register,families,count,normalized,point,seg,angle,diagram,num,choice,project,elements,make,has:id=>builders.has(id)};
D.geometryRebuild=api;root.Grade7Rebuild=api;
if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
