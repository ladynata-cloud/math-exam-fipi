"use strict";
function witness(task) {
  switch (task.type) {
    case "experiment": return {probes:task.exampleSolution.probes.slice(),modelId:task.exampleSolution.modelId};
    case "number": case "numberline": return {answer:String(task.answer)};
    case "choice": case "multi": return {selected:task.options.flatMap((o,i)=>o.correct?[i]:[])};
    case "match": return {matches:Object.fromEntries(task.pairs.map((p,i)=>[i,p.right]))};
    case "order": return {order:task.answer.slice()};
    case "build": return {values:Object.fromEntries(Object.entries(task.exampleSolution).map(([k,v])=>[k,String(v)]))};
    case "counterexample": return {answer:String(task.exampleCounterexample)};
    case "battle": return {answer:String(task.a+task.b),sign:task.a+task.b<0?"−":task.a+task.b>0?"+":"0"};
    case "graph": return {k:task.k,b:task.b};
    case "fraction": {
      const partition=task.denominatorA*task.denominatorB;
      return {partition,answer:String(partition*(task.numeratorA/task.denominatorA+task.numeratorB/task.denominatorB))};
    }
    case "probability": return {red:Array.from({length:task.total*task.numerator/task.denominator},(_,i)=>i)};
    case "tiltArea": return {answer:String(task.base*task.height)};
    case "triangleGate": return {answer:String((Math.abs(task.sideA-task.sideB)+task.sideA+task.sideB)/2)};
    default: throw Error("Unsupported task type: "+task.type);
  }
}
module.exports={witness};
