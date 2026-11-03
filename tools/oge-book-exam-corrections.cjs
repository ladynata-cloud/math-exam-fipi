'use strict';
const assert=require('node:assert/strict');

// Exact inverse of reviewed persistence, disclosure and image-construction fixes.
// Historical engine/bank hashes stay unchanged. Only the explicitly reviewed
// fragments below may be reversed; unknown or modified fragments are rejected.
const corrections=Object.freeze({
  "trainers/oge-task6-fractions.html": {
    "historicalSha256": "44ce6c8c70977007e9ea54a293ac2efe88ab32d1a2308f85a847989e9dc07f97",
    "fragments": [
      {
        "before": "<p class=\"session-note\" id=\"sessionNote\">Прогресс хранится только до обновления страницы. Смена раздела или режима «вперемешку» начинает текущий раздел заново.</p>\n",
        "after": "<p class=\"session-note\" id=\"sessionNote\">Прогресс сохраняется в этом браузере после обновления страницы. Смена раздела или режима «вперемешку» начинает текущий раздел заново.</p>\n"
      },
      {
        "before": "",
        "after": "const PROGRESS_KEY='mathExam.oge6.practice.v1';\nfunction saveProgress(){\n  try{localStorage.setItem(PROGRESS_KEY,JSON.stringify({v:1,cat,order,pos,shuffle,records,streak}));}catch(e){}\n}\nfunction restoreProgress(){\n  try{\n    const saved=JSON.parse(localStorage.getItem(PROGRESS_KEY)||'null');\n    if(!saved||saved.v!==1||!CATS.some(c=>c[0]===saved.cat)||!Array.isArray(saved.order)||!saved.order.length)return false;\n    const expected=TASKS.map((task,index)=>saved.cat==='all'||task.cat===saved.cat?index:null).filter(index=>index!==null);\n    if(saved.order.length!==expected.length||new Set(saved.order).size!==expected.length||!saved.order.every(index=>expected.includes(index)))return false;\n    if(!Number.isInteger(saved.pos)||saved.pos<0||saved.pos>saved.order.length)return false;\n    const kept={};\n    if(saved.records&&typeof saved.records==='object')for(const [key,value] of Object.entries(saved.records)){\n      if(!expected.includes(Number(key))||!value||!Number.isSafeInteger(value.wrongAttempts)||value.wrongAttempts<0)continue;\n      if(value.status!==null&&!['solved-first','solved-retry','revealed','skipped'].includes(value.status))continue;\n      kept[key]={wrongAttempts:value.wrongAttempts,answerWasRevealed:value.answerWasRevealed===true,status:value.status,lastInput:String(value.lastInput||'').slice(0,128)};\n    }\n    cat=saved.cat;order=saved.order;pos=saved.pos;shuffle=saved.shuffle===true;records=kept;streak=Number.isSafeInteger(saved.streak)&&saved.streak>=0?saved.streak:0;\n    return true;\n  }catch(e){return false;}\n}\n"
      },
      {
        "before": "",
        "after": "  saveProgress();\n"
      },
      {
        "before": "  pos=0;records={};hintSessions={};streak=0;buildChips();renderTask();\n",
        "after": "  pos=0;records={};hintSessions={};streak=0;saveProgress();buildChips();renderTask();\n"
      },
      {
        "before": "  $('previous').disabled=pos===0;$('previous').onclick=()=>{if(pos>0){pos--;renderTask();}};\n",
        "after": "  $('previous').disabled=pos===0;$('previous').onclick=()=>{if(pos>0){pos--;saveProgress();renderTask();}};\n"
      },
      {
        "before": "function next(){pos++;renderTask();}\n",
        "after": "function next(){pos++;saveProgress();renderTask();}\n"
      },
      {
        "before": "$('taskJump').onchange=event=>{pos=Number(event.target.value);renderTask();};\nbuildChips();startSet();\n",
        "after": "$('taskJump').onchange=event=>{pos=Number(event.target.value);saveProgress();renderTask();};\nif(restoreProgress()){$('shuffle').checked=shuffle;buildChips();renderTask();}else{buildChips();startSet();}\n"
      }
    ]
  },
  "trainers/oge-task20-equations.html": {
    "historicalSha256": "25585fa7083755e9894d14cd68669471577d7a287eeadaf5875de4a760051d45",
    "fragments": [
      {
        "before": "",
        "after": "  var progressKey='mathExam.oge20.practice.v1', moduleKey=STATE.module;\n  try{\n    var saved=JSON.parse(localStorage.getItem(progressKey)||'{}')[moduleKey];\n    if(saved) ['streak','solved'].forEach(function(k){if(Number.isSafeInteger(saved[k])&&saved[k]>=0)state[k]=saved[k];});\n  }catch(e){}\n  function savePractice(){\n    try{\n      var all={};\n      try{all=JSON.parse(localStorage.getItem(progressKey)||'{}');}catch(e){}\n      if(!all||typeof all!=='object'||Array.isArray(all))all={};\n      all[moduleKey]={streak:state.streak,solved:state.solved};\n      localStorage.setItem(progressKey,JSON.stringify(all));\n    }catch(e){}\n  }\n"
      },
      {
        "before": "  function refreshTop(){ top.querySelector('.solved b').textContent=state.solved; top.querySelector('.streak b').textContent=state.streak; top.querySelector('.probno').textContent='задача №'+state.n; }\n",
        "after": "  function refreshTop(){ top.querySelector('.solved b').textContent=state.solved; top.querySelector('.streak b').textContent=state.streak; top.querySelector('.probno').textContent='задача №'+state.n; savePractice(); }\n"
      }
    ]
  },
  "trainers/oge-task22-functions-graphs.html": {
    "historicalSha256": "c3059f278932b36c2d442a45b874d0c9096bc456edd43e138a7d06548cf0fed4",
    "fragments": [
      {
        "before": "",
        "after": "  const progressKey='mathExam.oge22.practice.v1';\n  try{const saved=JSON.parse(localStorage.getItem(progressKey)||'{}')[mod.id];if(saved)for(const k of ['solved','tries'])if(Number.isSafeInteger(saved[k])&&saved[k]>=0)score[k]=saved[k];}catch(e){}\n"
      },
      {
        "before": "  function updScore(){scoreEl.innerHTML=`Решено: <b>${score.solved}</b> · попыток: ${score.tries}`;}\n",
        "after": "  function updScore(){\n    scoreEl.innerHTML=`Решено: <b>${score.solved}</b> · попыток: ${score.tries}`;\n    try{\n      let all={};\n      try{all=JSON.parse(localStorage.getItem(progressKey)||'{}');}catch(e){}\n      if(!all||typeof all!=='object'||Array.isArray(all))all={};\n      all[mod.id]={solved:score.solved,tries:score.tries};\n      localStorage.setItem(progressKey,JSON.stringify(all));\n    }catch(e){}\n  }\n"
      }
    ]
  },
  "trainers/oge-1-5-trainers/practice-1-5-tires.html": {
    "historicalSha256": "73773a765b524fe5fd358e8a6fa352012ec070e88e294090cbe6b9e53613dd2d",
    "fragments": [
      {
        "before": "\n\n",
        "after": "\n\n// Set image URLs on actual nodes, so HTML preload scanning cannot request\n// JavaScript template placeholders before the inline engine has rendered them.\nfunction setTireFigureSources(section){\n  const sources={marking:RIS1,dimensions:RIS2};\n  section.querySelectorAll('img[data-tire-figure]').forEach(image=>{\n    image.src=sources[image.dataset.tireFigure];\n  });\n}\n\n"
      },
      {
        "before": "      <figure class=\"fig\"><img src=\"${RIS1}\" alt=\"шина с маркировкой 195/65 R15\"><figcaption>Рис. 1 — пример: маркировка 195/65 R15 на боковине</figcaption></figure>\n      <figure class=\"fig\"><img src=\"${RIS2}\" alt=\"схема размеров шины: D, d, H, B\"><figcaption>Рис. 2 — из чего складывается колесо</figcaption></figure>\n",
        "after": "      <figure class=\"fig\"><img data-tire-figure=\"marking\" alt=\"шина с маркировкой 195/65 R15\"><figcaption>Рис. 1 — пример: маркировка 195/65 R15 на боковине</figcaption></figure>\n      <figure class=\"fig\"><img data-tire-figure=\"dimensions\" alt=\"схема размеров шины: D, d, H, B\"><figcaption>Рис. 2 — из чего складывается колесо</figcaption></figure>\n"
      },
      {
        "before": "  if(VD.v.sourceKind==='author-analogue') renderCrossSection(document.getElementById('author-wheel'),f);\n",
        "after": "  setTireFigureSources(sec);\n  if(VD.v.sourceKind==='author-analogue') renderCrossSection(document.getElementById('author-wheel'),f);\n"
      },
      {
        "before": "    ${VD.v.sourceKind==='author-analogue' ? `<div class=\"schema-ref\"><div class=\"sr-text\">Сверху боковина <b>H</b>, посередине диск <b>d</b>, снизу ещё боковина <b>H</b>. Поэтому <b>D = H + d + H = 2H + d</b>. Ниже — авторская схема с размерами заводского колеса.</div></div>` : `<div class=\"schema-ref\"><img src=\"${RIS2}\" alt=\"схема шины из условия\"><div class=\"sr-text\">Как на схеме из условия (Рис. 2): сверху боковина <b>H</b>, посередине диск <b>d</b>, снизу ещё боковина <b>H</b>. Сложи их по высоте — получишь полный диаметр: <b>D = H + d + H = 2H + d</b>. Ниже — то же самое, но с числами твоей шины.</div></div>`}\n",
        "after": "    ${VD.v.sourceKind==='author-analogue' ? `<div class=\"schema-ref\"><div class=\"sr-text\">Сверху боковина <b>H</b>, посередине диск <b>d</b>, снизу ещё боковина <b>H</b>. Поэтому <b>D = H + d + H = 2H + d</b>. Ниже — авторская схема с размерами заводского колеса.</div></div>` : `<div class=\"schema-ref\"><img data-tire-figure=\"dimensions\" alt=\"схема шины из условия\"><div class=\"sr-text\">Как на схеме из условия (Рис. 2): сверху боковина <b>H</b>, посередине диск <b>d</b>, снизу ещё боковина <b>H</b>. Сложи их по высоте — получишь полный диаметр: <b>D = H + d + H = 2H + d</b>. Ниже — то же самое, но с числами твоей шины.</div></div>`}\n"
      },
      {
        "before": "  // wire cells\n",
        "after": "  setTireFigureSources(sec);\n  // wire cells\n"
      }
    ]
  }
});
function restoreHistoricalBytes(file,source){
 const rule=corrections[file];
 if(!rule)return source;
 let restored=String(source);
 for(const [index,{before,after}]of rule.fragments.entries()){
  assert.equal(restored.split(after).length,2,file+': exactly one approved persistence fragment '+index);
  restored=restored.replace(after,before);
 }
 return restored;
}
module.exports={corrections,restoreHistoricalBytes};
