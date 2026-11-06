'use strict';
// Each child releases its DOM and module graph before the next batch. Every
// selected card still opens all assistance, submits every step and checks the final feedback.
const {JSDOM}=require('jsdom'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const [start,end]=process.argv.slice(2).map(Number), errors=[];
assert(Number.isInteger(start)&&Number.isInteger(end)&&end>start&&start>=0);
  const fullDom=new JSDOM(fs.readFileSync(path.join(__dirname,'index.html'),'utf8'),{url:'https://peterson-render.test/',runScripts:'outside-only',pretendToBeVisual:true}),fw=fullDom.window,fd=fw.document;
  fw.scrollTo = () => {};
  fw.console.error=(...e)=>errors.push(e.join(' '));
  for(const file of ['math.js','continuation-models.js','models.js','data.js','app.js'])fw.eval(fs.readFileSync(path.join(__dirname,file),'utf8'));
  const node=selector=>{const el=fd.querySelector(selector);assert(el,'Missing '+selector);return el;};
  const enter=(selector,value)=>{const el=node(selector);el.value=value;el.dispatchEvent(new fw.Event('input',{bubbles:true}));};
  const send=selector=>node(selector).dispatchEvent(new fw.Event('submit',{bubbles:true,cancelable:true}));
  const clearTokens=id=>assert.doesNotMatch(node('#main').textContent,/\{\{(?:frac|mix|mathfrac):/,id+' rendered math');
  function answerValue(q){if(q.answerFormat==='decimal'||q.answerFormat==='canonical-decimal')return fw.PetersonMath.decimal(q.answer);if(q.answerFormat==='mixed-number'){const r=fw.PetersonMath.parse(q.answer),n=Math.abs(Number(r.n)),den=Number(r.d),whole=Math.floor(n/den),rem=n%den;return (r.n<0?'-':'')+(rem?whole+' '+rem+'/'+den:whole);}return String(q.answer);}
  const ids = []; let steps = 0;
  try {
    for (const lesson of fw.PetersonCourse.lessons.slice(start,end))
      for (let index = 0; index < lesson.tasks.length; index++) {
        const task=lesson.tasks[index];
        fw.history.replaceState(null,'','#lesson/'+lesson.id+'/'+index);
        fw.PetersonApp.route();
        clearTokens(task.id);
        node('[data-action="hint"]').click();
        clearTokens(task.id+' hint');
        if (task.steps.length) {
          node('[data-action="guided"]').click();
          for (let i = 0; i < task.steps.length; i++) {
            const step = task.steps[i];
            clearTokens(task.id+' step '+i);
            if (step.kind === 'instruction' || typeof step === 'string')
              node('[data-action="instruction"]').click();
            else {
              node('[data-action="step-hint"][data-step="'+i+'"]').click();
              node('[data-action="reveal"][data-step="'+i+'"]').click();
              clearTokens(task.id+' step help '+i);
              if (step.kind === 'choice') node('[data-action="step-choice"][data-step="' + i + '"][data-choice="' + step.choices.indexOf(step.answer) + '"]').click();
              else enter('[data-step-input="'+i+'"]',answerValue(step));
              send('[data-step-form="'+i+'"]');
            }
            assert.equal(fw.PetersonApp.getState().tasks[task.id].step,i+1,task.id+' accepted step '+i);
            clearTokens(task.id+' completed step '+i);
          }
        }
        if(task.kind!=='manual'){if(task.kind==='choice')node('[data-choice="'+task.choices.indexOf(task.answer)+'"]').click();else enter('#final-answer',answerValue(task));send('#answer-form');assert.equal(fw.PetersonApp.getState().tasks[task.id].correct,true,task.id+' final explanation');clearTokens(task.id+' final explanation');}
        ids.push(task.id); steps += task.steps.length;
      }
  } finally { fullDom.window.close(); }
assert.equal(errors.length,0,errors.join('\n'));
console.log(JSON.stringify({ids,steps}));
