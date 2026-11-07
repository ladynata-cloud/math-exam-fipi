/* Exact, deliberately restricted linear-equation parser. No eval or sampling. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.EquationSteps=factory();})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
const LIMIT=10n**80n;
function gcd(a,b){a=a<0n?-a:a;b=b<0n?-b:b;while(b){let t=a%b;a=b;b=t;}return a;}
function q(n,d=1n){if(!d)throw Error('Деление на ноль недопустимо.');if(d<0n){n=-n;d=-d;}let g=gcd(n,d);n/=g;d/=g;if(n>LIMIT||n< -LIMIT||d>LIMIT)throw Error('Слишком большие числа.');return {n,d};}
const add=(u,v)=>q(u.n*v.d+v.n*u.d,u.d*v.d), neg=u=>q(-u.n,u.d), sub=(u,v)=>add(u,neg(v)), mul=(u,v)=>q(u.n*v.n,u.d*v.d), div=(u,v)=>q(u.n*v.d,u.d*v.n), eq=(u,v)=>u.n===v.n&&u.d===v.d;
const zero=q(0n),one=q(1n), iszero=v=>v.n===0n;
const lin=(a,b)=>({a,b}), plus=(u,v)=>lin(add(u.a,v.a),add(u.b,v.b)), minus=(u,v)=>lin(sub(u.a,v.a),sub(u.b,v.b));
function times(u,v){if(!iszero(u.a)&&!iszero(v.a))throw Error('Произведение выражений с x пока не поддерживается.');return lin(add(mul(u.a,v.b),mul(u.b,v.a)),mul(u.b,v.b));}
function over(u,v){if(!iszero(v.a))throw Error('Деление на выражение с x пока не поддерживается: могут измениться допустимые значения.');if(iszero(v.b))throw Error('Деление на ноль недопустимо.');return lin(div(u.a,v.b),div(u.b,v.b));}
function parse(s){
 if(typeof s!=='string'||s.length>160)throw Error('Запись слишком длинная.');
 s=s.replace(/[−–—]/g,'-').replace(/[×·]/g,'*').replace(/:/g,'/').replace(/х/gi,'x').replace(/,/g,'.').replace(/\s/g,'').toLowerCase();
 if(!s||/[^\dx.+\-*/()=]/.test(s))throw Error('Используй числа, x, знаки + − * / и скобки.');
 const tokens=s.match(/(?:\d+(?:\.\d+)?|\.\d+)|[x+\-*/()=]/g)||[];if(tokens.join('')!==s||tokens.length>120)throw Error('Проверь запись числа или знаки.');let i=0,depth=0;
 function atom(){if(++depth>32)throw Error('Слишком много скобок.');let t=tokens[i++],v;if(t==='('){v=expr();if(tokens[i++]!==')')throw Error('Проверь скобки.');}else if(t==='x')v=lin(one,zero);else if(t&&/^(\d+(\.\d+)?|\.\d+)$/.test(t)){let [a,b='']=t.split('.');if((a+b).length>24)throw Error('Слишком длинное число.');v=lin(zero,q(BigInt((a||'0')+b),10n**BigInt(b.length)));}else throw Error('Ожидалось число, x или выражение в скобках.');depth--;return v;}
 function unary(){if(tokens[i]==='+'){i++;return unary();}if(tokens[i]==='-'){i++;let v=unary();return lin(neg(v.a),neg(v.b));}return atom();}
 function term(){let v=unary();while(i<tokens.length){let t=tokens[i];if(t==='*'||t==='/'){i++;let w=unary();v=t==='*'?times(v,w):over(v,w);}else if(t==='x'||t==='('){v=times(v,unary());}else break;}return v;}
 function expr(){let v=term();while(tokens[i]==='+'||tokens[i]==='-'){let t=tokens[i++],w=term();v=t==='+'?plus(v,w):minus(v,w);}return v;}
 let left=expr();if(tokens[i++]!=='=')throw Error('Запиши обе части уравнения через знак =.');let right=expr();if(i!==tokens.length)throw Error('Проверь лишние знаки и скобки.');return {left,right,diff:minus(left,right)};
}
function check(previous,next){try{let p=parse(previous),n=parse(next),a=p.diff.a,b=p.diff.b,c=n.diff.a,d=n.diff.b;if(iszero(a))return {ok:false,code:'source',message:'Предыдущее уравнение должно иметь единственное решение.'};if(iszero(c))return {ok:false,code:'lost',message:iszero(d)?'Получилось верное равенство при любом x: исходное уравнение имеет одно решение. Проверь, не исчез ли x.':'Получилось неверное числовое равенство: решение потерялось. Проверь действия с обеими частями.'};if(!eq(mul(a,d),mul(c,b))){let msg='Получилось уравнение с другим решением. Проверь знаки и одинаковые действия с обеими частями.';if(eq(a,c))msg='Коэффициент при x сохранился, но числовая часть изменилась неверно. Проверь перенос числа и его знак.';return {ok:false,code:'different',message:msg};}let isolated=(eq(n.left.a,one)&&iszero(n.left.b)&&iszero(n.right.a))||(eq(n.right.a,one)&&iszero(n.right.b)&&iszero(n.left.a));return {ok:true,code:isolated?'solved':'equivalent',solved:isolated,message:isolated?'Верно! Уравнение решено.':'Верно: получилось равносильное уравнение.'};}catch(e){return {ok:false,code:'syntax',message:e.message||'Проверь запись.'};}}
return Object.freeze({parse,check});
});
