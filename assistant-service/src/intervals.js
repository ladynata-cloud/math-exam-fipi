import { R, add, div, compare, pAt } from './math-kernel.js';
import { er, eCompare, eEqual, eText, parseExact, rootsOf } from './exact-roots.js';
export const whole = () => [{l:null,r:null,lc:false,rc:false}];
export function normalizeIntervals(intervals){
  const sorted=intervals.map(x=>({...x})).sort((a,b)=>a.l===null?-1:b.l===null?1:eCompare(a.l,b.l));const out=[];
  for(const item of sorted){if(item.l&&item.r){const c=eCompare(item.l,item.r);if(c>0||c===0&&!(item.lc&&item.rc))throw Error('INTERVAL_ORDER');}if(!item.l)item.lc=false;if(!item.r)item.rc=false;
    const prior=out.at(-1);if(!prior){out.push(item);continue;}
    const c=prior.r===null||item.l===null?-1:eCompare(item.l,prior.r);
    if(prior.r===null||item.l===null||c<0||c===0&&(prior.rc||item.lc)){
      if(prior.l&&item.l&&eEqual(prior.l,item.l))prior.lc ||= item.lc;
      if(prior.r===null)continue;if(item.r===null){prior.r=null;prior.rc=false;continue;}const end=eCompare(item.r,prior.r);if(end>0){prior.r=item.r;prior.rc=item.rc;}else if(end===0)prior.rc ||= item.rc;
    }else out.push(item);
  }return out;
}
export function intervalText(items){const xs=normalizeIntervals(items);if(!xs.length)return '∅';if(xs.length===1&&!xs[0].l&&!xs[0].r)return 'ℝ';return xs.map(x=>x.l&&x.r&&eEqual(x.l,x.r)?`{${eText(x.l)}}`:`${x.lc?'[':'('}${x.l?eText(x.l):'-∞'}; ${x.r?eText(x.r):'+∞'}${x.rc?']':')'}`).join(' ∪ ');}
export function parseIntervals(value){const q=value.trim().replace(/[−–—]/g,'-').replace(/^x\s*∈\s*/,'');if(/^(?:ℝ|r|все действительные числа)$/i.test(q))return whole();if(/^(?:∅|нет решений|решений нет)$/i.test(q))return [];
  return normalizeIntervals(q.split(/∪|\s+U\s+|\s+или\s+/i).map(part=>{const s=part.trim();if(/^\{.+\}$/.test(s)){const point=parseExact(s.slice(1,-1));return {l:point,r:point,lc:true,rc:true};}if(!/^[[(].+[)\]]$/.test(s))throw Error('INTERVAL_FORMAT');const bounds=s.slice(1,-1).split(';').map(s=>s.trim());if(bounds.length!==2)throw Error('INTERVAL_FORMAT');const l=/^-(?:∞|inf)$/.test(bounds[0])?null:parseExact(bounds[0]),r=/^\+?(?:∞|inf)$/.test(bounds[1])?null:parseExact(bounds[1]);const lc=s[0]==='[',rc=s.at(-1)===']';if(!l&&lc||!r&&rc)throw Error('INFINITY_OPEN');return {l,r,lc,rc};}));}
export function verifyIntervals(expected,attempt){try{const a=normalizeIntervals(expected),b=parseIntervals(attempt);const same=a.length===b.length&&a.every((x,i)=>{const y=b[i];return ((!x.l&&!y.l)||(x.l&&y.l&&eEqual(x.l,y.l)))&&((!x.r&&!y.r)||(x.r&&y.r&&eEqual(x.r,y.r)))&&x.lc===y.lc&&x.rc===y.rc;});return {status:same?'correct':'incorrect',text:same?'Множество решений и границы указаны верно.':'Проверь направление промежутков, открытые и закрытые границы и запрещённые точки.'};}catch{return {status:'unsupported',text:'Запиши промежутки, например (-∞; 2] ∪ (3; +∞). Бесконечность не включается.'};}}
export const condition=(sign,op)=>op==='>'?sign>0:op==='<'?sign<0:op==='>='?sign>=0:sign<=0;
export function polynomialIntervals(p,op){
  if(!['>','<','>=','<='].includes(op)||p.length>3)throw Error('INEQUALITY_LIMIT');
  const inclusive=op.includes('='),positive=op.startsWith('>');
  if(p.length===1)return condition(p[0].n<0n?-1:p[0].n?1:0,op)?whole():[];
  const solved=rootsOf(p),leading=p.at(-1).n>0n?1:-1;
  if(solved.kind==='none')return condition(leading,op)?whole():[];
  const [a,b]=solved.roots;
  if(p.length===2){const right=positive===(leading>0);return [right?{l:a,r:null,lc:inclusive,rc:false}:{l:null,r:a,lc:false,rc:inclusive}];}
  const outside=positive===(leading>0);
  if(!b){if(outside)return inclusive?whole():[{l:null,r:a,lc:false,rc:false},{l:a,r:null,lc:false,rc:false}];return inclusive?[{l:a,r:a,lc:true,rc:true}]:[];}
  return outside?[{l:null,r:a,lc:false,rc:inclusive},{l:b,r:null,lc:inclusive,rc:false}]:[{l:a,r:b,lc:inclusive,rc:inclusive}];
}
export function allExcept(points){const sorted=points.filter((p,i)=>!points.slice(0,i).some(x=>eEqual(x,p))).sort(eCompare);let l=null;const out=[];for(const p of sorted){out.push({l,r:p,lc:false,rc:false});l=p;}out.push({l,r:null,lc:false,rc:false});return out;}
export function rationalIntervals(num,den,op){
  if(num.length>2||den.length>2)throw Error('RATIONAL_INEQUALITY_LIMIT');if(den.length===1&&!den[0].n)return [];
  const nr=rootsOf(num).roots,dr=rootsOf(den).roots;const cuts=[...nr,...dr].filter((v,i,a)=>!a.slice(0,i).some(x=>eEqual(x,v))).sort(eCompare);
  const included=p=>op.includes('=')&&pAt(num,p.a).n===0n&&pAt(den,p.a).n!==0n;
  const pieces=[];
  for(let i=0;i<=cuts.length;i++){const l=cuts[i-1]||null,r=cuts[i]||null;const sample=l&&r?div(add(l.a,r.a),R(2)):l?add(l.a,R(1)):r?add(r.a,R(-1)):R(0);const n=pAt(num,sample),d=pAt(den,sample);if(!d.n)throw Error('INVALID_SIGN_PROBE');const sign=compare(n,R(0))*compare(d,R(0));if(condition(sign,op))pieces.push({l,r,lc:!!l&&included(l),rc:!!r&&included(r)});}
  for(const p of cuts)if(included(p)&&!pieces.some(x=>x.l&&eEqual(x.l,p)||x.r&&eEqual(x.r,p)))pieces.push({l:p,r:p,lc:true,rc:true});
  return normalizeIntervals(pieces);
}

export function rationalChart(num,den){
  if(num.length>2||den.length>2||den.length===1&&!den[0].n)throw Error('RATIONAL_CHART_LIMIT');
  const cuts=[...rootsOf(num).roots,...rootsOf(den).roots].filter((v,i,a)=>!a.slice(0,i).some(x=>eEqual(x,v))).sort(eCompare);
  return Array.from({length:cuts.length+1},(_,i)=>{const l=cuts[i-1]||null,r=cuts[i]||null;const sample=l&&r?div(add(l.a,r.a),R(2)):l?add(l.a,R(1)):r?add(r.a,R(-1)):R(0);return {interval:intervalText([{l,r,lc:false,rc:false}]),sample,sign:compare(pAt(num,sample),R(0))*compare(pAt(den,sample),R(0))};});
}
