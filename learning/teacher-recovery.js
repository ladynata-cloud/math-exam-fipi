/* Owner-issued recovery links are consumed only by an explicit password submission. */
(function(){
'use strict';
const $=id=>document.getElementById(id),form=$('teacher-recovery-form');
let recoveryToken='',busy=false,revision=0,controller=null;
function clear(){recoveryToken='';form.reset();}
function showHelp(message=''){$('recovery-help').hidden=false;$('recovery-entry').hidden=true;$('recovery-card').setAttribute('aria-labelledby','recovery-title');$('recovery-link-error').hidden=!message;$('recovery-link-error').textContent=message;}
function consume(){
 const params=new URLSearchParams(location.hash.slice(1)),raw=params.get('token');
 const supplied=location.hash.length>1;
 history.replaceState(null,'',location.pathname+location.search);
 clear();form.hidden=false;
 if(supplied&&params.size===1&&typeof raw==='string'&&/^[A-Za-z0-9_-]{43}$/.test(raw)){
  recoveryToken=raw;$('recovery-entry').querySelector('h2').textContent='Задать код из 4 цифр';$('recovery-entry').querySelector('p').textContent='Введите новый код два раза. После сохранения сразу откроются Ваши ученики. Повторно задавать код не нужно.';$('recovery-help').hidden=true;$('recovery-entry').hidden=false;$('recovery-card').removeAttribute('aria-labelledby');$('recovery-link-error').hidden=true;
 }else showHelp(supplied?'Ссылка восстановления неполная. Откройте выданную ссылку ещё раз.':'');
}
consume();
form.addEventListener('submit',async event=>{
 event.preventDefault();if(busy)return;
 const password=form.elements.password.value,confirmation=form.elements.confirm.value;
 $('recovery-error').textContent='';$('recovery-status').textContent='';
 if(!recoveryToken){showHelp('Откройте ссылку восстановления ещё раз.');return;}
 if(password!==confirmation){$('recovery-error').textContent='Коды не совпадают.';return;}
 if(!/^[0-9]{4}$/.test(password)){$('recovery-error').textContent='Код входа — ровно 4 цифры.';return;}
 const run=++revision,token=recoveryToken,button=form.querySelector('[type=submit]');
 busy=true;button.disabled=true;form.reset();$('recovery-status').textContent='Сохраняем код…';
 controller=new AbortController();const timer=setTimeout(()=>controller?.abort(),15000);
 try{
  const response=await fetch('/api/learning/teacher/password-recovery',{method:'POST',credentials:'same-origin',cache:'no-store',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password}),signal:controller.signal});
  let data;try{data=await response.json();}catch(_){throw Error('RESPONSE_UNKNOWN');}
  if(run!==revision)return;
  if(!response.ok){
   if(response.status===401){$('recovery-error').textContent='Ссылка истекла, уже использована или заменена. Если Вы уже сохраняли код, попробуйте войти с ним. Заново задавать код не нужно. Иначе нужна новая ссылка.';}
   else if(response.status===429)$('recovery-error').textContent='Слишком много попыток. Подождите немного и попробуйте снова.';
   else if(data.error==='LEARNING_PASSWORD_INVALID')$('recovery-error').textContent='Код входа — ровно 4 цифры.';
   else throw Error('RESPONSE_UNKNOWN');
   return;
  }
  if(data.account?.role!=='teacher')throw Error('RESPONSE_UNKNOWN');
  clear();form.hidden=true;$('recovery-entry').querySelector('h2').textContent='Код входа сохранён';$('recovery-entry').querySelector('p').textContent='Открываем Ваш кабинет. Повторно вводить или менять код не нужно.';
  location.replace(new URL('./?role=teacher#students',location.href).href);
 }catch(_){if(run===revision)$('recovery-error').textContent='Не удалось получить подтверждение. Попробуйте войти с сохранённым кодом или повторите отправку того же кода, когда появится связь.';}
 finally{clearTimeout(timer);if(run===revision){busy=false;controller=null;button.disabled=false;if($('recovery-error').textContent)$('recovery-status').textContent='';}}
});
window.addEventListener('hashchange',()=>{if(busy){history.replaceState(null,'',location.pathname+location.search);return;}consume();});
window.addEventListener('pagehide',()=>{++revision;controller?.abort();controller=null;busy=false;clear();});
window.addEventListener('pageshow',event=>{if(event.persisted){showHelp('Откройте ссылку восстановления ещё раз или вернитесь в уже открытый кабинет.');form.querySelector('[type=submit]').disabled=false;}});
})();
