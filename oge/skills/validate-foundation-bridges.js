"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const bundle=require("./series-foundation-bridges.js");
const {checkTask}=require("./engine.js");
const {witness}=require("./task-input.js");
const {create,signature}=require("./series-runtime.js");
const registry=create([bundle]);
let checks=0,generations=0,diagnosticValues=0;
const stats=[];
function verify(v,message){assert.ok(v,message);checks++;}
function equal(a,b,message){assert.deepEqual(a,b,message);checks++;}
function close(a,b){return Math.abs(a-b)<=1e-12*Math.max(1,Math.abs(a),Math.abs(b));}
function parseDecimal(text){
  let s=String(text).trim().replace(/−/g,"-");
  if(s.startsWith("(")&&s.endsWith(")"))s=s.slice(1,-1);
  assert.match(s,/^-?\d+(?:,\d+)?$/);
  const sign=s.startsWith("-")?-1n:1n;if(sign<0)s=s.slice(1);
  const [whole,frac=""]=s.split(",");
  return {n:sign*BigInt(whole+frac),d:10n**BigInt(frac.length),places:frac.length};
}
function ratio(r){return Number(r.n)/Number(r.d);}
function diagnosticCheck(t){
  for(const d of t.diagnostics||[]){
    verify(Number.isFinite(d.value),t.id+" finite diagnostic");
    verify(!checkTask(t,{answer:String(d.value)}).ok,t.id+" diagnostic must not be a correct answer");
    verify(typeof d.message==="string"&&d.message.length>20,t.id+" actionable diagnostic text");
    diagnosticValues++;
  }
}
function decimalProduct(t){
  const m=t.prompt.match(/^Вычисли: (.+) × (.+)\.$/);verify(!!m,t.id+" parse actual prompt");
  const a=parseDecimal(m[1]),b=parseDecimal(m[2]);
  verify(a.n%a.d!==0n&&b.n%b.d!==0n,t.id+" both operands noninteger");
  const expected=Number(a.n*b.n)/Number(a.d*b.d);
  equal(t.answer,expected,t.id+" exact integer-scaled product");
  equal(a.places+b.places,t.math.leftPlaces+t.math.rightPlaces,t.id+" decimal place count");
  equal([Number(a.n),Number(b.n)],[t.math.leftUnits,t.math.rightUnits],t.id+" metadata matches visible operands");
  verify(checkTask(t,{answer:String(a.n*b.n)+"/"+String(a.d*b.d)}).ok,t.id+" exact fractional answer accepted");
  if(t.variant==="both-below-one")verify(expected<ratio(a)&&expected<ratio(b)&&expected>0,t.id+" product decreases positive factors below one");
  if(t.variant==="negative-factor")verify(expected<0,t.id+" negative product");
}
function rootPoint(t){
  const m=t.prompt.match(/число √(\d+)\?/);verify(!!m,t.id+" radicand visible in prompt");
  const n=Number(m[1]),v=t.visual,correct=t.options.flatMap((o,i)=>o.correct?[i]:[]);
  verify(!Number.isInteger(Math.sqrt(n)),t.id+" nonsquare radicand");
  equal(v.points.length,4,t.id+" four marked points");
  equal(correct.length,1,t.id+" one correct option");
  equal(v.points.map(p=>p.label),["A","B","C","D"],t.id+" spatial labels stable");
  equal(t.options.map(o=>o.text),["Точка A","Точка B","Точка C","Точка D"],t.id+" options match spatial labels");
  const target=correct[0];
  for(let i=0;i<4;i++){
    const p=v.points[i];
    verify(p.x>v.min&&p.x<v.max,t.id+" point lies inside visible scale");
    if(i>0)verify(p.x-v.points[i-1].x>=0.18,t.id+" points separated by at least 0.18 units");
    if(i===target){
      equal(p.x,Math.sqrt(n),t.id+" target stores exact Math.sqrt radicand");
      verify(close(p.x*p.x,n),t.id+" target square agrees");
    }else{
      verify(Math.abs(p.x-Math.sqrt(n))>=0.18,t.id+" distractor sufficiently separated");
      verify(!checkTask(t,{selected:[i]}).ok,t.id+" distractor rejected");
    }
  }
  const whole=Math.floor(Math.sqrt(n));
  const lower=t.variant==="one-unit-scale"?whole+target/4:whole;
  const upper=t.variant==="one-unit-scale"?lower+0.25:whole+1;
  equal([t.math.intervalLower,t.math.intervalUpper],[lower,upper],t.id+" explanation interval derived independently");
  verify(lower>=0&&lower*lower<n&&n<upper*upper,t.id+" exact squares certify stated interval");
  equal(v.points.filter(p=>p.x>lower&&p.x<upper).map(p=>p.label),[v.points[target].label],t.id+" unique point in certified interval");
  equal(v.tickStep,t.variant==="one-unit-scale"?0.25:1,t.id+" useful tick interval");
}
function algebraicFraction(t){
  const m=t.prompt.match(/^Найди значение выражения (−?\d+)?\(x² − (\d+)\)\/\(x − (\d+)\) при x = (−?\d+(?:,\d+)?)\. Исходное выражение определено при x ≠ (\d+)\.$/);
  verify(!!m,t.id+" parse full actual algebra condition");
  const multiplier=m[1]?BigInt(m[1].replace("−","-")):1n,constant=BigInt(m[2]),a=BigInt(m[3]),x=parseDecimal(m[4]);
  equal(constant,a*a,t.id+" numerator constant is the specified square");
  equal(BigInt(m[5]),a,t.id+" restriction matches denominator");
  verify(x.n!==a*x.d,t.id+" actual substituted x is admissible");
  const numerator=multiplier*(x.n*x.n-constant*x.d*x.d),denominator=x.d*(x.n-a*x.d);
  const raw=Number(numerator)/Number(denominator),expected=Object.is(raw,-0)?0:raw;
  equal(t.answer,expected,t.id+" unsimplified rational evaluation");
  equal(t.answer,Number(multiplier*(x.n+a*x.d))/Number(x.d),t.id+" simplification preserves admissible value");
  equal([t.math.a,t.math.multiplier,t.math.x,t.math.excluded],[Number(a),Number(multiplier),ratio(x),Number(a)],t.id+" metadata matches visible mathematics");
  verify(checkTask(t,{answer:String(numerator)+"/"+String(denominator)}).ok,t.id+" direct quotient accepted");
}

equal(bundle.families.map(f=>f.id),["bridge-decimal-product","bridge-root-point","bridge-algebraic-fraction"],"three requested families");
equal(bundle.routes,[],"no unreviewed additional routes");
const knownSkills=new Set(["topics-arithmetic.json","topics-functions.json","topics-geometry.json"]
  .flatMap(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),"utf8"))).flatMap(t=>t.skills.map(s=>s.id)));
for(const topic of JSON.parse(fs.readFileSync(path.join(__dirname,"expansion-arithmetic.json"),"utf8")).topics)
  for(const s of topic.skills)knownSkills.add(s.id);
for(const f of bundle.families){
  equal(f.mode,"quick",f.id+" ordinary practice");
  verify(knownSkills.has(f.skillId),f.id+" defined skill");
  const signatures=new Set(),ids=new Set(),variants={},answers=new Set();
  for(let seed=0;seed<1000;seed++){
    const t=f.generate(seed),same=f.generate(seed);generations++;
    equal(t,same,f.id+" deterministic seed "+seed);
    verify(checkTask(t,witness(t)).ok,t.id+" declared correct response accepted");
    equal(t.witness,witness(t),t.id+" embedded and shared witness agree");
    if(f.id==="bridge-decimal-product")decimalProduct(t);
    else if(f.id==="bridge-root-point")rootPoint(t);
    else algebraicFraction(t);
    diagnosticCheck(t);
    signatures.add(signature(t));ids.add(registry.task(f.id,seed).id);
    variants[t.variant]=(variants[t.variant]||0)+1;
    if(t.answer!==undefined)answers.add(t.answer);
    // Returned task data must not poison a later call.
    if(seed===37){
      t.prompt="changed locally";if(t.options)t.options[0].correct=!t.options[0].correct;
      equal(f.generate(seed),same,f.id+" generation has no mutable returned cache");
    }
  }
  for(const bad of [-1,1000,0.5,NaN,"2",null]){assert.throws(()=>f.generate(bad),RangeError);checks++;}
  equal(ids.size,signatures.size,f.id+" no semantic identity collision");
  const first=registry.task(f.id,37),next=registry.next(f.id,37,[first.id]);
  verify(next.fresh&&next.task.id!==first.id,f.id+" can supply another mathematical card");
  stats.push({familyId:f.id,generations:1000,mathematicallyDistinctCards:signatures.size,variants,distinctNumericAnswers:answers.size||null});
}
console.log(JSON.stringify({status:"PASS",checks,generations,diagnosticValues,families:stats,
  scope:"Exact rational arithmetic, independent prompt parsing, diagram coordinates and answer checks. No browser layout claim."},null,2));
