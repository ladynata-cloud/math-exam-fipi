(function(){'use strict';
const lesson=window.MathExamGuidedLesson,viewer=window.AtanasyanModel.mount(document.getElementById('model'),lesson.model);
let last='';function update(){const state=window.__atanasyanLesson.getState(),step=lesson.steps[Math.min(state.step,lesson.steps.length-1)],key=step.modelView||'neutral';if(key!==last){viewer.setView(key);last=key;}}
const observer=new MutationObserver(update);observer.observe(document.getElementById('step-count'),{childList:true,subtree:true,characterData:true});update();window.addEventListener('pagehide',event=>{if(!event.persisted){observer.disconnect();viewer.destroy();}});
})();
