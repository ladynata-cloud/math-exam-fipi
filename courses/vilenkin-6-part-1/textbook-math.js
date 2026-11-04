(function (global) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = value => String(value ?? '').trim().toLowerCase().replace(/ё/g, 'е').replace(/−/g, '-').replace(/\s+/g, ' ');
  function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a,b] = [b,a % b]; return a || 1n; }
  function rational(n,d = 1n) { if (!d) return null; if (d < 0n) { n = -n; d = -d; } const g = gcd(n,d); return {n:n/g,d:d/g}; }
  function parse(value) {
    const s = String(value ?? '').trim().replace(/−/g,'-').replace(/,/g,'.');
    if (!s || s.length > 90) return null;
    let m = s.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) { const d = BigInt(m[3]); return rational(BigInt(m[1])*d + (m[1][0] === '-' ? -1n : 1n)*BigInt(m[2]),d); }
    m = s.match(/^([+-]?\d+)\s*\/\s*(\d+)$/);
    if (m) return rational(BigInt(m[1]),BigInt(m[2]));
    m = s.match(/^([+-]?)(\d+)(?:\.(\d+))?$/);
    return m ? rational(BigInt((m[1] === '-' ? '-' : '')+m[2]+(m[3] || '')),10n**BigInt((m[3] || '').length)) : null;
  }
  const equal = (a,b) => !!a && !!b && a.n === b.n && a.d === b.d;
  const rawFraction = value => { const m = String(value).trim().replace(/−/g,'-').match(/^([+-]?\d+)\s*\/\s*(\d+)$/); return m && BigInt(m[2]) > 0n ? {n:BigInt(m[1]),d:BigInt(m[2])} : null; };
  function primeProduct(value) {
    const s = String(value).trim().replace(/[×·хx]/g,'*').replace(/\s/g,'');
    if (!s || s.length > 150) return null;
    const parts = s.split('*'); if (parts.length > 30) return null;
    let product = 1n;
    for (const p of parts) {
      const m = p.match(/^(\d{1,7})(?:\^(\d{1,2}))?$/); if (!m) return null;
      const n = Number(m[1]), power = Number(m[2] || 1);
      if (n < 2 || n > 1000000 || power < 1 || power > 30) return null;
      for (let d=2; d*d<=n; d++) if (n%d === 0) return null;
      product *= BigInt(n)**BigInt(power); if (product.toString().length > 90) return null;
    }
    return rational(product);
  }
  const formats = {
    number: 'Можно ввести целое число, десятичную дробь (0,5), обычную дробь (1/2) или смешанное число (2 1/3).',
    integer: 'Введи целое число.',
    decimal: 'Запиши десятичную дробь с запятой или точкой, например 0,25.',
    fraction: 'Запиши обычную дробь через /, например 3/4.',
    'reduced-fraction': 'Запиши несократимую дробь через /, например 3/4.',
    'improper-fraction': 'Запиши неправильную дробь через /, например 7/3.',
    mixed: 'Запиши целую часть, пробел и правильную дробь: например 2 1/3.',
    'reduced-mixed': 'Запиши целую часть, пробел и несократимую правильную дробь: например 2 1/3.',
    'prime-factors': 'Запиши произведение простых чисел: например 2 · 2 · 3 или 2^2 · 3.',
    'number-list': 'Разделяй числа знаком ;. Порядок чисел не важен.',
    'ordered-pair': 'Введи два значения в указанном порядке через ;.',
    'fixed-denominator-pair': 'Введи две дроби через ; с требуемым общим знаменателем.',
    text: 'Введи ответ словами или выбери предложенный вариант.',
    'self-check': 'Выполни построение в тетради и проверь его по каждому пункту.'
  };
  function check(value, target, type = 'number') {
    if (type === 'self-check') return {ok:false,format:false};
    const s = String(value ?? '').trim();
    if (!s || s.length > 180) return {ok:false,format:false};
    const targets = Array.isArray(target) ? target : [target];
    let format = true;
    if (type === 'text') return {ok:targets.some(t => norm(s) === norm(t)),format:true};
    if (type === 'prime-factors') { const actual=primeProduct(s); return {ok:!!actual && targets.some(t=>equal(actual,primeProduct(t) || parse(t))),format:!!actual}; }
    if (type === 'number-list' || type === 'ordered-pair' || type === 'fixed-denominator-pair') {
      const bits=s.split(';').map(x=>x.trim());
      const p = type === 'fixed-denominator-pair' ? rawFraction : parse;
      const actual=bits.map(p);
      format=actual.length > 0 && actual.length <= 50 && actual.every(Boolean) && (type === 'number-list' || actual.length === 2);
      return {format,ok:format && targets.some(t=>{
        const expected=String(t).split(';').map(p); if (expected.length !== actual.length || !expected.every(Boolean)) return false;
        if (type !== 'number-list') return actual.every((a,i)=>equal(a,expected[i]));
        const remaining=expected.slice();
        return actual.every(a=>{ const i=remaining.findIndex(b=>equal(a,b)); if (i<0) return false; remaining.splice(i,1); return true; });
      })};
    }
    const actual=parse(s), fraction=rawFraction(s);
    if (type === 'decimal') format=/^[+-]?\d+[.,]\d+$/.test(s.replace(/−/g,'-'));
    else if (type === 'integer') format=/^[+-]?\d+$/.test(s.replace(/−/g,'-'));
    else if (type === 'fraction') format=!!fraction;
    else if (type === 'reduced-fraction') format=!!fraction && gcd(fraction.n,fraction.d) === 1n;
    else if (type === 'improper-fraction') format=!!fraction && fraction.n >= fraction.d;
    else if (type === 'mixed' || type === 'reduced-mixed') { const m=s.replace(/−/g,'-').match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/); format=!!m && BigInt(m[1]) !== 0n && BigInt(m[2]) > 0n && BigInt(m[2]) < BigInt(m[3]) && (type !== 'reduced-mixed' || gcd(BigInt(m[2]),BigInt(m[3])) === 1n); }
    else if (type !== 'number') format=false;
    return {format:format && !!actual,ok:format && !!actual && targets.some(t=>equal(actual,parse(t)))};
  }
  function fmt(value) {
    return esc(value).replace(/\[\[([^\[\]]+)\/([^\[\]]+)\]\]/g,(_,n,d)=>`<span class="fraction" role="math" aria-label="${n} разделить на ${d}"><span>${n}</span><span>${d}</span></span>`).replace(/\n/g,'<br>');
  }
  global.TextbookMath={check,parse,primeProduct,esc,fmt,formats};
  if(typeof module==='object'&&module.exports)module.exports=global.TextbookMath;
})(typeof window === 'undefined' ? globalThis : window);
