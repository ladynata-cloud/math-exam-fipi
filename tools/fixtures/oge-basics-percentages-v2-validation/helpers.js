const $=id=>document.getElementById(id);
const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const pick=a=>a[rnd(0,a.length-1)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};
const r2=x=>Math.round(x*100)/100;
const plural=(n,a,b,c)=>{const x=Math.abs(n)%100,y=x%10;return (x>10&&x<20)?c:y===1?a:(y>=2&&y<=4)?b:c};
const fmt=n=>{const v=r2(n);return Number.isInteger(v)?String(v):String(v).replace('.',',')};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const grid=(n,cls)=>'<div class="grid100" aria-hidden="true">'+Array.from({length:100},(_,i)=>
  '<span class="'+(i<n?(cls||'on'):'')+'"></span>').join('')+'</div>';
const bars=rows=>'<div class="bars">'+rows.map(r=>'<div class="barline"><i>'+r[0]+'</i>'+
  '<u style="width:'+Math.max(4,Math.min(100,r[1]))+'%"><b>'+(r[2]||'')+'</b></u></div>').join('')+'</div>';
function norm(t){if(t&&Array.isArray(t.traps)){const seen=new Set();
 t.traps=t.traps.filter(x=>Number.isFinite(x.v)&&Math.abs(x.v-t.answer)>1e-9&&!seen.has(r2(x.v))&&seen.add(r2(x.v)))}
 return t}
