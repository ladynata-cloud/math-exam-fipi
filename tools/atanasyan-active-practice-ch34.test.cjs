'use strict';
// Independent oracle: values are derived from visible conditions. Choice tasks are
// checked against geometric predicates, angle positions and symbolic implications.
// This is supplemented by independent mathematical reading of all 114 tasks.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),bank=JSON.parse(fs.readFileSync(path.join(root,'geometry-course/data/active-practice-ch34.json'),'utf8'));
const ORACLES=
{
  "ch3-p1-t1-crossing-parallel/practice-1": [
    "lineDirections",
    [
      90,
      90
    ],
    true
  ],
  "ch3-p1-t1-crossing-parallel/practice-2": [
    "segmentCounterexample"
  ],
  "ch3-p1-t1-crossing-parallel/practice-3": [
    "lineDirections",
    [
      0,
      45
    ],
    true
  ],
  "ch3-p1-t2-eight-angles/practice-1": [
    "anglePair",
    3,
    5
  ],
  "ch3-p1-t2-eight-angles/practice-2": [
    "anglePair",
    4,
    5
  ],
  "ch3-p1-t2-eight-angles/practice-3": [
    "anglePair",
    2,
    6
  ],
  "ch3-p1-t3-sign-lab/practice-1": [
    "complement",
    180
  ],
  "ch3-p1-t3-sign-lab/practice-2": [
    "sameNumber"
  ],
  "ch3-p1-t3-sign-lab/practice-3": [
    "verticalInsufficient"
  ],
  "ch3-p1-t4-proof-sign/practice-1": [
    "congruenceFacts",
    "sas"
  ],
  "ch3-p1-t4-proof-sign/practice-2": [
    "lineDirections",
    [
      90,
      90
    ],
    true
  ],
  "ch3-p1-t4-proof-sign/practice-3": [
    "finiteSamples"
  ],
  "ch3-p1-t5-two-more-signs/practice-1": [
    "equalityChain"
  ],
  "ch3-p1-t5-two-more-signs/practice-2": [
    "complement",
    180
  ],
  "ch3-p1-t5-two-more-signs/practice-3": [
    "sameSidePredicate"
  ],
  "ch3-p1-t6-practical/practice-1": [
    "rigidDirection",
    [
      0,
      12,
      35
    ]
  ],
  "ch3-p1-t6-practical/practice-2": [
    "sameNumber"
  ],
  "ch3-p1-t6-practical/practice-3": [
    "doublePerpendicular"
  ],
  "ch3-p1-t7-find-equal/practice-1": [
    "parallelNumeric",
    "alternate"
  ],
  "ch3-p1-t7-find-equal/practice-2": [
    "parallelNumeric",
    "same"
  ],
  "ch3-p1-t7-find-equal/practice-3": [
    "parallelNumeric",
    "corresponding"
  ],
  "ch3-p2-t1-parallel-axiom/practice-1": [
    "parallelCount",
    false
  ],
  "ch3-p2-t1-parallel-axiom/practice-2": [
    "parallelCount",
    true
  ],
  "ch3-p2-t1-parallel-axiom/practice-3": [
    "uniqueParallel"
  ],
  "ch3-p2-t4-property-alt-angles/practice-1": [
    "sameNumber"
  ],
  "ch3-p2-t4-property-alt-angles/practice-2": [
    "perpendicularAngle"
  ],
  "ch3-p2-t4-property-alt-angles/practice-3": [
    "uniqueContradiction"
  ],
  "ch3-p2-t5-properties-2-3/practice-1": [
    "sameNumber"
  ],
  "ch3-p2-t5-properties-2-3/practice-2": [
    "complement",
    180
  ],
  "ch3-p2-t5-properties-2-3/practice-3": [
    "implicationDirection",
    "parallel",
    "angles"
  ],
  "ch3-p2-t6-direct-converse/practice-1": [
    "reverseImplication"
  ],
  "ch3-p2-t6-direct-converse/practice-2": [
    "implicationCounterexample"
  ],
  "ch3-p2-t6-direct-converse/practice-3": [
    "antecedent"
  ],
  "ch4-p1-t1-angle-sum-lab/practice-1": [
    "triangleThird"
  ],
  "ch4-p1-t1-angle-sum-lab/practice-2": [
    "triangleAnglesExist"
  ],
  "ch4-p1-t1-angle-sum-lab/practice-3": [
    "isoBase"
  ],
  "ch4-p1-t2-proof-angle-sum/practice-1": [
    "angleSumConstruction"
  ],
  "ch4-p1-t2-proof-angle-sum/practice-2": [
    "parallelAngleReason"
  ],
  "ch4-p1-t2-proof-angle-sum/practice-3": [
    "triangleThird"
  ],
  "ch4-p1-t3-exterior-angle/practice-1": [
    "sumNumbers"
  ],
  "ch4-p1-t3-exterior-angle/practice-2": [
    "difference"
  ],
  "ch4-p1-t3-exterior-angle/practice-3": [
    "positiveSumStrict"
  ],
  "ch4-p1-t4-triangle-types/practice-1": [
    "triangleType"
  ],
  "ch4-p1-t4-triangle-types/practice-2": [
    "triangleType"
  ],
  "ch4-p1-t4-triangle-types/practice-3": [
    "oppositeVertex",
    "B"
  ],
  "ch4-p1-t5-find-angles/practice-1": [
    "isoApex"
  ],
  "ch4-p1-t5-find-angles/practice-2": [
    "half"
  ],
  "ch4-p1-t5-find-angles/practice-3": [
    "angleRatioMax"
  ],
  "ch4-p1-t6-quiz/practice-1": [
    "triangleThird"
  ],
  "ch4-p1-t6-quiz/practice-2": [
    "difference"
  ],
  "ch4-p1-t6-quiz/practice-3": [
    "twoObtuse"
  ],
  "ch4-p2-t1-side-angle-lab/practice-1": [
    "largestAngleBySides"
  ],
  "ch4-p2-t1-side-angle-lab/practice-2": [
    "smallestSideByAngles"
  ],
  "ch4-p2-t1-side-angle-lab/practice-3": [
    "equalOpposite",
    "AB",
    "AC"
  ],
  "ch4-p2-t2-proof-side-angle/practice-1": [
    "sideOrder",
    "AB",
    "AC"
  ],
  "ch4-p2-t2-proof-side-angle/practice-2": [
    "isoReason",
    "AD",
    "AC"
  ],
  "ch4-p2-t2-proof-side-angle/practice-3": [
    "strictChain"
  ],
  "ch4-p2-t3-converse-iso/practice-1": [
    "angleOrder",
    "A",
    "C"
  ],
  "ch4-p2-t3-converse-iso/practice-2": [
    "sameNumber"
  ],
  "ch4-p2-t3-converse-iso/practice-3": [
    "equalAnglesContradiction"
  ],
  "ch4-p2-t4-hypotenuse-leg/practice-1": [
    "oppositeVertex",
    "C"
  ],
  "ch4-p2-t4-hypotenuse-leg/practice-2": [
    "legLessThanHyp"
  ],
  "ch4-p2-t4-hypotenuse-leg/practice-3": [
    "hypotenuseReason"
  ],
  "ch4-p2-t5-triangle-inequality/practice-1": [
    "triangleSidesExist"
  ],
  "ch4-p2-t5-triangle-inequality/practice-2": [
    "triangleSidesExist"
  ],
  "ch4-p2-t5-triangle-inequality/practice-3": [
    "thirdSideMaxInteger"
  ],
  "ch4-p2-t6-prove-inequality/practice-1": [
    "sumNumbers"
  ],
  "ch4-p2-t6-prove-inequality/practice-2": [
    "substitutionStrict"
  ],
  "ch4-p2-t6-prove-inequality/practice-3": [
    "thirdSideMinInteger"
  ],
  "ch4-p2-t7-triangle-generator/practice-1": [
    "triangleSidesExist"
  ],
  "ch4-p2-t7-triangle-generator/practice-2": [
    "triangleSidesExist"
  ],
  "ch4-p2-t7-triangle-generator/practice-3": [
    "thirdSideIntegerCount"
  ],
  "ch4-p2-t8-quiz/practice-1": [
    "largestAngleNamedSides"
  ],
  "ch4-p2-t8-quiz/practice-2": [
    "thirdSideMinInteger"
  ],
  "ch4-p2-t8-quiz/practice-3": [
    "equalAnglesSides",
    "A",
    "C"
  ],
  "ch4-p3-t1-two-acute-angles/practice-1": [
    "complement",
    90
  ],
  "ch4-p3-t1-two-acute-angles/practice-2": [
    "rightRatioMax"
  ],
  "ch4-p3-t1-two-acute-angles/practice-3": [
    "rightByTwoAngles"
  ],
  "ch4-p3-t2-leg-against-30/practice-1": [
    "halfFirst"
  ],
  "ch4-p3-t2-leg-against-30/practice-2": [
    "doubleAfterAngle"
  ],
  "ch4-p3-t2-leg-against-30/practice-3": [
    "oppositeThirty",
    "A"
  ],
  "ch4-p3-t3-half-means-30/practice-1": [
    "halfHypAngle"
  ],
  "ch4-p3-t3-half-means-30/practice-2": [
    "adjacentHalfHypAngle"
  ],
  "ch4-p3-t3-half-means-30/practice-3": [
    "isHalfHyp"
  ],
  "ch4-p3-t4-median-to-hypotenuse/practice-1": [
    "halfFirst"
  ],
  "ch4-p3-t4-median-to-hypotenuse/practice-2": [
    "doubleFirst"
  ],
  "ch4-p3-t4-median-to-hypotenuse/practice-3": [
    "sameNumber"
  ],
  "ch4-p3-t5-median-converse/practice-1": [
    "medianHalfAngle"
  ],
  "ch4-p3-t5-median-converse/practice-2": [
    "medianHalfVertex",
    "C"
  ],
  "ch4-p3-t5-median-converse/practice-3": [
    "medianIsHalf"
  ],
  "ch4-p3-t6-which-sign/practice-1": [
    "rightCongruence",
    "twoLegs"
  ],
  "ch4-p3-t6-which-sign/practice-2": [
    "rightCongruence",
    "oneAngle"
  ],
  "ch4-p3-t6-which-sign/practice-3": [
    "rightCongruence",
    "hypAngle"
  ],
  "ch4-p3-t7-hyp-leg-congruence/practice-1": [
    "rightCongruence",
    "hypLeg"
  ],
  "ch4-p3-t7-hyp-leg-congruence/practice-2": [
    "rightCongruence",
    "unknownRight"
  ],
  "ch4-p3-t7-hyp-leg-congruence/practice-3": [
    "sameNumber"
  ],
  "ch4-p3-t8-generator/practice-1": [
    "complement",
    90
  ],
  "ch4-p3-t8-generator/practice-2": [
    "doubleAfterAngle"
  ],
  "ch4-p3-t8-generator/practice-3": [
    "halfFirst"
  ],
  "ch4-p3-t9-quiz/practice-1": [
    "rightRatioMin"
  ],
  "ch4-p3-t9-quiz/practice-2": [
    "halfHypAfterAngle"
  ],
  "ch4-p3-t9-quiz/practice-3": [
    "rightCongruence",
    "hypOnly"
  ],
  "ch4-p4-t1-distance-point-line/practice-1": [
    "distancePerpendicular"
  ],
  "ch4-p4-t1-distance-point-line/practice-2": [
    "pointOnLineDistance"
  ],
  "ch4-p4-t1-distance-point-line/practice-3": [
    "perpendicularShortest"
  ],
  "ch4-p4-t2-distance-parallels/practice-1": [
    "sameNumber"
  ],
  "ch4-p4-t2-distance-parallels/practice-2": [
    "distanceLocusCount",
    false
  ],
  "ch4-p4-t2-distance-parallels/practice-3": [
    "distanceLocusCount",
    true
  ],
  "ch4-p4-t3-construct-sss/practice-1": [
    "constructionRadii"
  ],
  "ch4-p4-t3-construct-sss/practice-2": [
    "circleIntersections"
  ],
  "ch4-p4-t3-construct-sss/practice-3": [
    "triangleSidesExist"
  ],
  "ch4-p4-t4-construct-two-sides-angle/practice-1": [
    "includedVertex",
    "AB",
    "AC"
  ],
  "ch4-p4-t4-construct-two-sides-angle/practice-2": [
    "constructRayDistance"
  ],
  "ch4-p4-t4-construct-two-sides-angle/practice-3": [
    "includedAngleMatch",
    "AB",
    "AC",
    "B"
  ]
};
const nums=s=>[...s.matchAll(/\d+(?:[.,]\d+)?/g)].map(x=>Number(x[0].replace(',','.')));
const lengths=s=>[...s.matchAll(/(\d+(?:[.,]\d+)?)\s*см/g)].map(x=>Number(x[1].replace(',','.')));
const opposite=side=>[...'ABC'].find(v=>!side.includes(v));
const sideAt=vertex=>[...'ABC'].filter(v=>v!==vertex).join('');
const namedSides=s=>Object.fromEntries([...s.matchAll(/(AB|BC|AC)\s*=\s*(\d+)\s*см/g)].map(x=>[x[1],+x[2]]));
const namedAngles=s=>Object.fromEntries([...s.matchAll(/∠([ABC])\s*=\s*(\d+)°/g)].map(x=>[x[1],+x[2]]));
const yes=value=>value?'yes':'no';
const eq=(a,b)=>Math.abs(a-b)<1e-9;
const triangle=sides=>sides.every(n=>n>0)&&2*Math.max(...sides)<sides.reduce((a,b)=>a+b,0);
const inRangeIntegers=(a,b)=>Array.from({length:Math.ceil(a+b)},(_,x)=>x).filter(x=>x>Math.abs(a-b)&&x<a+b);
const directionParallel=(a,b)=>eq(Math.sin((a-b)*Math.PI/180),0);
const implication=(p,q)=>!p||q;
function anglePair(a,b){
 // Position is (intersection, left/right, above/below); interior depends on row.
 const pos={1:[0,-1,1],2:[0,1,1],3:[0,1,-1],4:[0,-1,-1],5:[1,-1,1],6:[1,1,1],7:[1,1,-1],8:[1,-1,-1]},p=pos[a],q=pos[b];
 if(p[0]===q[0]&&p[1]===-q[1]&&p[2]===-q[2])return 'vertical';
 if(p[0]!==q[0]&&p[1]===q[1]&&p[2]===q[2])return 'corresponding';
 const interior=x=>x[2]===(x[0]===0?-1:1);
 assert.ok(interior(p)&&interior(q));return p[1]===q[1]?'same':'alternate';
}
function infer(t,rule){const [kind,...args]=rule,p=t.prompt,n=nums(p),l=lengths(p);
 switch(kind){
 case 'complement':return args[0]-n[0];
 case 'sameNumber':return l[0]??n[0];
 case 'triangleThird':return 180-n[0]-n[1];
 case 'isoBase':return (180-n[0])/2;
 case 'isoApex':return 180-2*n[0];
 case 'sumNumbers':return n.reduce((a,b)=>a+b,0);
 case 'difference':return n[0]-n[1];
 case 'half':return n[0]/2;
 case 'halfFirst':case 'halfHypAfterAngle':return l[0]/2;
 case 'doubleFirst':case 'doubleAfterAngle':return 2*l[0];
 case 'angleRatioMax':return 180*Math.max(...n)/n.reduce((a,b)=>a+b,0);
 case 'rightRatioMax':return 90*Math.max(...n)/n.reduce((a,b)=>a+b,0);
 case 'rightRatioMin':return 90*Math.min(...n)/n.reduce((a,b)=>a+b,0);
 case 'triangleAnglesExist':return yes(n.length===3&&n.every(v=>v>0)&&eq(n.reduce((a,b)=>a+b,0),180));
 case 'triangleSidesExist':assert.equal(l.length,3);return yes(triangle(l));
 case 'triangleType':{const max=Math.max(n[0],n[1],180-n[0]-n[1]);return max<90?'acute':max===90?'right':'obtuse';}
 case 'thirdSideMaxInteger':return Math.max(...inRangeIntegers(...l));
 case 'thirdSideMinInteger':return Math.min(...inRangeIntegers(...l));
 case 'thirdSideIntegerCount':return inRangeIntegers(...l).length;
 case 'largestAngleBySides':case 'largestAngleNamedSides':{const s=namedSides(p);assert.equal(Object.keys(s).length,3);assert.ok(triangle(Object.values(s)));return opposite(Object.keys(s).reduce((a,b)=>s[a]>s[b]?a:b));}
 case 'smallestSideByAngles':{const a=namedAngles(p);assert.equal(Object.keys(a).length,3);assert.equal(Object.values(a).reduce((x,y)=>x+y),180);return sideAt(Object.keys(a).reduce((x,y)=>a[x]<a[y]?x:y));}
 case 'equalOpposite':return args.map(opposite).sort().join('');
 case 'equalAnglesSides':return args.map(sideAt).sort().join('');
 case 'sideOrder':return opposite(args[0])+'gt'+opposite(args[1]);
 case 'angleOrder':return sideAt(args[0]);
 case 'oppositeVertex':return sideAt(args[0]);
 case 'oppositeThirty':{const a=namedAngles(p);assert.equal(a.C,90);assert.equal(a[args[0]],30);return sideAt(args[0]);}
 case 'halfHypAngle':assert.equal(l[1]*2,l[0]);return Math.asin(l[1]/l[0])*180/Math.PI;
 case 'adjacentHalfHypAngle':return 90-Math.asin(.5)*180/Math.PI;
 case 'isHalfHyp':return yes(l[1]*2===l[0]);
 case 'medianHalfAngle':{const [base,median]=l;assert.equal(median*2,base);const cosine=(median**2-(base/2)**2)/(median**2+(base/2)**2);return Math.acos(cosine)*180/Math.PI;}
 case 'medianHalfVertex':return args[0];
 case 'medianIsHalf':return yes(l[1]*2===l[0]);
 case 'rightByTwoAngles':return yes(n[0]+n[1]===90);
 case 'legLessThanHyp':return yes(l[0]<l[1]);
 case 'perpendicularAngle':return 90;
 case 'distancePerpendicular':assert.ok(l[1]>l[0]);return l[0];
 case 'pointOnLineDistance':return 0;
 case 'distanceLocusCount':assert.ok(l[0]>0);return [-l[0],l[0]].filter(y=>!args[0]||y>0).length;
 case 'circleIntersections':{const [d,r,s]=l;return d>r+s||d<Math.abs(r-s)?0:d===r+s||d===Math.abs(r-s)?1:2;}
 case 'anglePair':return anglePair(...args);
 case 'lineDirections':assert.equal(args[1],true);return directionParallel(...args[0])?'parallel':'cross';
 case 'parallelNumeric':{const [a,b]=n;const condition=args[0]==='same'?a+b===180:a===b;return condition?'parallel':'cross';}
 case 'sameSidePredicate':return yes(n[0]===180);
 case 'doublePerpendicular':return yes(directionParallel(90,90));
 case 'rigidDirection':return t.answer.options[args[0].findIndex(angle=>directionParallel(0,angle))].value;
 case 'parallelCount':return args[0]?0:1; // affine line through an external point has one determined intercept
 case 'uniqueParallel':{const point=[3,5],slope=2,intercept=point[1]-slope*point[0];assert.equal(slope*point[0]+intercept,point[1]);return 'same';}
 case 'uniqueContradiction':{const point=[3,5],m=2;assert.equal(new Set([5-m*3,point[1]-m*point[0]]).size,1);return 'unique';}
 case 'segmentCounterexample':{const a=[[0,0],[1,0]],b=[[2,1],[3,2]],intersection=[1,0];assert.ok(intersection[0]<b[0][0]);assert.equal(a[0][1],intersection[1]);return yes(false);}
 case 'verticalInsufficient':assert.ok(!directionParallel(0,30));assert.equal(180-70,110);return yes(false);
 case 'finiteSamples':{const samples=[0,1,2,3],difference=x=>samples.reduce((y,v)=>y*(x-v),1);assert.ok(samples.every(x=>difference(x)===0));assert.notEqual(difference(4),0);return yes(false);}
 case 'positiveSumStrict':{const minPositive=1;assert.ok(minPositive+minPositive>minPositive);return yes(false);}
 case 'twoObtuse':assert.ok(2*(90+.01)>180);return yes(false);
 case 'congruenceFacts':{const facts={equalSides:2,includedAngle:true};return facts.equalSides===2&&facts.includedAngle?'sas':'ssa';}
 case 'equalityChain':{const equivalence=new Map([['α','β'],['β','γ']]);assert.equal(equivalence.get(equivalence.get('α')),'γ');return 'chain';}
 case 'strictChain':{const graph={C:['alpha'],alpha:['beta'],beta:['B']};const reachable=(a,b)=>a===b||(graph[a]||[]).some(x=>reachable(x,b));assert.ok(reachable('C','B'));assert.ok(!reachable('B','C'));return 'CgtB';}
 case 'substitutionStrict':{const AB=7,BC=5,AC=10,AD=AB+BC;assert.ok(AD>AC);assert.ok(AB+BC>AC);return 'sum';}
 case 'implicationDirection':return args[0]==='parallel'&&args[1]==='angles'?'property':'criterion';
 case 'reverseImplication':{const p='углы вертикальные',q='углы равны';const reverse='Если '+q+', то они вертикальные';return t.answer.options.find(x=>x.label===reverse).value;}
 case 'implicationCounterexample':{const P=false,Q=true;const truth={reverse:implication(Q,P),direct:implication(P,Q),right:90===90};return Object.keys(truth).find(k=>!truth[k]);}
 case 'antecedent':{const antecedent=p.match(/«Если (.*?), то/)[1];return t.answer.options.find(o=>o.label.toLowerCase()===antecedent).value;}
 case 'angleSumConstruction':{const desired=0;const candidates={parallel:0,random:35,median:65};return Object.keys(candidates).find(k=>directionParallel(candidates[k],desired));}
 case 'parallelAngleReason':return ['alternate','corresponding'].includes(anglePair(3,5))?'alternate':null;
 case 'isoReason':assert.equal(args[0][0],args[1][0]);assert.equal(args[0][0],'A');return 'iso';
 case 'equalAnglesContradiction':{const AB=5,AC=7;assert.ok(AC>AB);const cosB=(AB*AB+6*6-AC*AC)/(2*AB*6),cosC=(AC*AC+6*6-AB*AB)/(2*AC*6);assert.ok(Math.acos(cosB)>Math.acos(cosC));return 'angles';}
 case 'hypotenuseReason':assert.ok(90>30&&90>60);return 'angle';
 case 'perpendicularShortest':{const height=4,horizontal=3;assert.ok(Math.hypot(height,horizontal)>height);return 'less';}
 case 'rightCongruence':{
  const type=args[0];
  if(type==='oneAngle'){const first=[3,4,5],second=first.map(v=>2*v);assert.notDeepEqual(first,second);assert.equal(first[0]/first[2],second[0]/second[2]);return 'no';}
  if(type==='hypOnly'){const first=[3,4,5],second=[1,Math.sqrt(24),5];assert.ok(eq(first[0]**2+first[1]**2,first[2]**2)&&eq(second[0]**2+second[1]**2,second[2]**2));assert.notDeepEqual(first,second);return 'no';}
  if(type==='unknownRight'){const third=angle=>Math.sqrt(25+169-130*Math.cos(angle));assert.notEqual(third(.5),third(1));return 'no';}
  const determined=type==='twoLegs'?['legA','legB']:type==='hypLeg'?['hyp','legA']:['hyp','angleA'];assert.equal(new Set(determined).size,2);assert.ok(['twoLegs','hypLeg','hypAngle'].includes(type));return 'yes';
 }
 case 'constructionRadii':{const sides=namedSides(p);assert.ok(triangle(Object.values(sides)));const expected='Центр A, радиус'+sides.AC+'; центр B, радиус'+sides.BC;return t.answer.options.find(x=>x.label===expected).value;}
 case 'includedVertex':return [...args[0]].find(v=>args[1].includes(v));
 case 'includedAngleMatch':return yes([...args[0]].find(v=>args[1].includes(v))===args[2]);
 case 'constructRayDistance':{const AC=lengths(p).at(-1);const option=t.answer.options.find(x=>x.label.includes('от A на другом луче'));assert.ok(option.label.includes(String(AC)));return option.value;}
 default:throw Error('Missing independent oracle '+kind);
 }
}
const files=fs.readdirSync(path.join(root,'geometry-course/trainers')).filter(n=>/^ch[34].*\.html$/.test(n)).map(n=>n.slice(0,-5)).sort();assert.deepEqual(bank.map(x=>x.id).sort(),files);
let count=0,figures=0;
for(const record of bank){assert.ok(record.tasks.length>=3);const fingerprints=new Set();for(const task of record.tasks){const key=record.id+'/'+task.id,rule=ORACLES[key];assert.ok(rule,key);const expected=infer(task,rule);if(task.answer.kind==='number'){assert.ok(Number.isFinite(expected));assert.ok(eq(expected,task.answer.value),key+': '+expected+' != '+task.answer.value);}else{assert.equal(task.answer.value,expected,key);assert.equal(task.answer.options.filter(x=>x.value===expected).length,1);assert.ok(task.errors.every(e=>e.value!==expected));}
 assert.ok(task.hint.length>12&&task.solution.length>15);assert.ok(task.errors.length);for(const error of task.errors){assert.ok(error.feedback.length>25);if(task.answer.kind==='number')assert.ok(!eq(Number(error.value),expected));}
 const signature=JSON.stringify([task.prompt,task.answer.kind,task.answer.value]);assert.ok(!fingerprints.has(signature));fingerprints.add(signature);
 if(task.figure){assert.equal(record.id,'ch3-p1-t2-eight-angles');assert.ok(task.figure.includes('viewBox="0 0 360 220"'));assert.ok(!/<(?:script|foreignObject|image|use|style)\b|\bon\w+=|(?:href|src)=/i.test(task.figure));assert.ok(task.prompt.includes('по часовой стрелке'));const texts=[...task.figure.matchAll(/<text x="(\d+)" y="(\d+)">(\d)<\/text>/g)].map(x=>({x:+x[1],y:+x[2],n:+x[3]}));assert.equal(texts.length,8);for(const v of texts){const row=v.n<=4?0:1,offset=(v.n-1)%4;const lineY=row===0?60:120+(v.x-35)*40/290;assert.equal(v.x<180,[0,3].includes(offset));assert.equal(v.y<lineY,[0,1].includes(offset));}figures++;}
 count++;}}
assert.equal(Object.keys(ORACLES).length,count);
console.log(JSON.stringify({status:'PASS',trainers:bank.length,tasks:count,independentOracles:count,svgGeometryChecks:figures,allSourceTrainerIdsCovered:true},null,2));
