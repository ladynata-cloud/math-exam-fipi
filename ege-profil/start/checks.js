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
 function product(){let v=unary();while(tokens[i]==='*'||tokens[i]==='/'){const op=tokens[i++],b=unary();v=op==='*'?v*b:v/b;}return v;}
 function sum(){let v=product();while(tokens[i]==='+'||tokens[i]==='-'){const op=tokens[i++],b=product();v=op==='+'?v+b:v-b;}return v;}
 try{const v=sum();return i===tokens.length&&Number.isFinite(v)?v:NaN;}catch(_){return NaN;}
}
function check(expected,input,choices){if(String(input).trim()==='')return false;if(choices&&typeof expected==='string')return String(input).trim()===expected;const a=typeof expected==='number'?expected:number(expected),b=number(input);return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a));}
const api={number,check};root.ProfileCheck=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
