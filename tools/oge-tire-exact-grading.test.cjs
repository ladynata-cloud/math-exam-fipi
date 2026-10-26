'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../trainers/oge-1-5-trainers/practice-1-5-tires.html'),'utf8');
const model=html.slice(html.indexOf('const VARIANTS ='),html.indexOf('/* ===== STATE + STORAGE ===== */'));
const context=vm.createContext({});vm.runInContext(model+';globalThis.audit={VARIANTS,buildVariant,parseNum,parseWidths,approxEq};',context);const a=context.audit;
const dimensions=m=>{const[B,p,d]=m.match(/\d+/g).map(Number);return{H:B*p/100,D:(2540*d+2*B*p)/100};};
let checked=0;
for(const variant of a.VARIANTS){const actual=a.buildVariant(variant).ans,f=dimensions(variant.factory),two=dimensions(variant.t2),four=dimensions(variant.t4),base=dimensions(variant.t4Base||variant.factory),five=dimensions(variant.t5);const widths=variant.t1.compat.rows.filter(row=>row.cells[variant.t1.disk]).map(row=>row.w);
  const expected={t1:Math[variant.t1.mode==='min'?'min':'max'](...widths),t2:two.H,t3:f.D,t4:Math.round(Math.abs(four.D-base.D)/(variant.t4Measure==='radius'?2:1)*10)/10,t5:Math.round(Math.abs(five.D-f.D)/f.D*1000)/10};
  for(const[key,value]of Object.entries(expected)){assert.ok(Math.abs(actual[key]-value)<1e-8,variant.code+' independently calculated '+key);assert.equal(a.approxEq(a.parseNum(String(value).replace('.',',')),actual[key],.5),true);for(const wrong of[value+.4,value+.04,value-.04])assert.equal(a.approxEq(wrong,actual[key],.5),false,variant.code+' distinct '+key);assert.equal(a.parseNum(String(value)+'abc'),null);checked++;}
}
for(const input of['','Infinity','0x10','1/2','1e3','195abc','195%'])assert.equal(a.parseNum(input),null,input);
assert.equal(a.parseNum(' 614,6 '),614.6);assert.equal(a.parseNum('1 200'),1200);
assert.deepEqual(JSON.parse(JSON.stringify(a.parseWidths('205; 195'))),[195,205]);
for(const input of['195abc,205','195,205,garbage','195.4;205','195;205;',''])assert.equal(a.parseWidths(input),null,input);
assert.equal(a.approxEq(null,0,.5),false);assert.equal(a.approxEq(0.1+0.2,.3,.1),true);
// Exercise the native multi-answer branch, including the former silently ignored suffix.
const checker=html.slice(html.indexOf('function handleSubstepCheck(id)'),html.indexOf('function handleSingleChoice'));
let status;const input={value:'',disabled:false,classList:{add(){},remove(){}}},feedback={},sub={querySelector:s=>s==='.substep-input'?input:feedback};
Object.assign(context,{CHECKS:{list:{custom:'multi',expect:[195,205],okMsg:'ok',hint:()=> 'wrong'}},document:{getElementById:()=>sub},showFb:(_el,kind)=>{status=kind;},markSubstepDone(){},unlockNextSubstep(){},resetStreak(){}});vm.runInContext(checker,context);
for(const [value,expected]of[['195,205','correct'],['195.4;205','warn'],['195,205,garbage','warn'],['195abc;205','warn'],['195,195','warn']]){input.value=value;input.disabled=false;context.handleSubstepCheck('list');assert.equal(status,expected,value);assert.equal(input.disabled,expected==='correct');}
console.log('OGE_TIRE_EXACT_GRADING_OK: '+checked+' independent answers; nearby wrong decimals and malformed lists rejected; native multi-answer branch.');
