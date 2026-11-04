(function(root){'use strict';
// A small arithmetic parser, never eval/Function. Supports fractions, π and roots.
function number(input){
 const source=String(input).trim().replace(/−/g,'-').replace(/,/g,'.').replace(/π/g,'pi').replace(/√/g,'sqrt');
 if(!source||source.length>120) return NaN;
 const tokens=source.match(/sqrt|pi|\d+(?:\.\d*)?|\.\d+|[()+*/^\-]/g)||[];
 if(tokens.join('')!==source.replace(/\s/g,''))return NaN;
 let i=0,depth=0;
 function atom(){if(++depth>30)throw Error();let v,t=tokens[i++];if(t==='('){v=sum();if(tokens[i++]!==')')throw Error();}else if(t==='pi')v=Math.PI;else if(t==='sqrt')v=Math.sqrt(unary());else if(t&&/^(\d|\.)/.test(t))v=Number(t);else throw Error();depth--;return v;}
 function power(){let v=atom();if(tokens[i]==='^'){i++;const p=unary();if(Math.abs(p)>50)throw Error();v=Math.pow(v,p);}return v;}
 function unary(){if(tokens[i]==='+'){i++;return unary();}if(tokens[i]==='-'){i++;return -unary();}return power();}
 // Juxtaposition has the same precedence as multiplication: 3/4π = (3/4)*π.
 // A product in a denominator must be bracketed, e.g. 3/(4π).
 function implicit(){return tokens[i]==='pi'||tokens[i]==='sqrt'||tokens[i]==='('||((tokens[i-1]===')'||tokens[i-1]==='pi')&&/^(\d|\.)/.test(tokens[i]||''));}
 function product(){let v=unary();while(tokens[i]==='*'||tokens[i]==='/'||implicit()){const op=implicit()?'*':tokens[i++],b=unary();v=op==='*'?v*b:v/b;}return v;}
 function sum(){let v=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();v=op==='+'?v+b:v-b;}return v;}
 try{const v=sum();return i===tokens.length&&Number.isFinite(v)?v:NaN;}catch(_){return NaN;}
}
function check(expected,input,choices,options){
 if(String(input).trim()==='')return false;
 if(choices&&typeof expected==='string')return String(input).trim()===expected;
 const a=typeof expected==='number'?expected:number(expected),b=number(input);
 if(!Number.isFinite(a)||!Number.isFinite(b))return false;
 // New financial tasks opt in: a whole number of periods cannot be a
 // nearby decimal, and a large rouble amount must not accept a kopeck error.
 // Keep an absolute tolerance for ordinary tasks, too: a large answer must
 // not admit a larger mathematical error merely because of its magnitude.
 if(options?.domain==='integer'&&!Number.isInteger(b))return false;
 const tolerance=options?.strictNumeric?Math.max(1e-9,8*Number.EPSILON*Math.abs(a)):1e-7;
 return Math.abs(a-b)<=tolerance;
}
const api={number,check};root.ProfileCheck=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
