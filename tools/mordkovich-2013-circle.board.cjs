'use strict';
const assert=require('node:assert/strict');

module.exports=async function workbookCircle(browser,origin,serverOrigin){
  const tc=await browser.newContext(),sc=await browser.newContext({viewport:{width:360,height:780}});
  try{
    const teacher=await tc.newPage(),student=await sc.newPage(), frame=p=>p.frameLocator('#trainerFrame');
    async function synced(p,route,checks={}){
      await p.waitForFunction(([route,checks])=>{
        const top=document.querySelector('#trainerFrame')?.contentWindow;
        const api=top?.__mordkovich2013CircleBoard;
        if(!api || document.querySelector('#mirrorStatus')?.dataset.mirrorStatus!=='connected')return false;
        const state=api.getState();if(!api.validateState(state) || state.route!==route)return false;
        return Object.entries(checks).every(([path,expected])=>{
          const actual=path.split('/').reduce((v,k)=>v?.[k],state);
          return typeof expected==='number' && typeof actual==='number'?Math.abs(expected-actual)<1e-8:actual===expected;
        });
      },[route,checks]).catch(async error=>{
        const actual=await p.evaluate(()=>document.querySelector('#trainerFrame')?.contentWindow?.__mordkovich2013CircleBoard?.getState());
        throw new Error('Shared state mismatch at '+route+' '+JSON.stringify(checks)+'; actual '+JSON.stringify(actual),{cause:error});
      });
    }
    const personalKey='mathexam.mordkovichCircle.v1';
    for(const [p,tag] of [[teacher,'teacher'],[student,'student']]){
      await p.goto(origin+'/school/index.html#book/source-21',{waitUntil:'domcontentloaded'});
      await p.locator('#main .skill-row').first().waitFor();
      const links=await p.locator('#main li a').evaluateAll(nodes=>nodes.map(n=>new URL(n.href).searchParams.get('trainer')).filter(s=>s?.includes('mordkovich-2013-circle.html')));
      assert.equal(links.length,75);assert.equal(links[0],'/trainers/mordkovich-2013-circle.html#number/4.1');assert.equal(links.at(-1),'/trainers/mordkovich-2013-circle.html#number/6.41');
      await p.evaluate(([key,v])=>localStorage.setItem(key,v),[personalKey,'synthetic personal draft '+tag]);
    }
    await teacher.goto(origin+'/trainers/trainer-board.html?server='+encodeURIComponent(serverOrigin),{waitUntil:'domcontentloaded'});
    await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
    await teacher.waitForFunction(()=>document.querySelector('#studentLink')?.value.includes('role=student'));
    const invite=await teacher.locator('#studentLink').inputValue();await teacher.locator('#sharePanel [data-close-panel]').click();
    await student.goto(invite,{waitUntil:'domcontentloaded'});
    await teacher.locator('#chooseTrainer').click();await teacher.locator('#pickerSearch').fill('mordkovich-2013-circle');
    const match=teacher.locator('#pickerResults .picker-item').filter({hasText:'75 номеров'});assert.equal(await match.count(),1);await match.click();
    const t=frame(teacher),s=frame(student),route='#task/m4-1-am/guided',key='progress/sessions/m4-1-am:guided/';
    await synced(student,'#home');
    await t.locator('#book-number').fill('4.1');await t.locator('#jump-form button').click();await synced(student,'#number/4.1');
    await t.locator('a[href="'+route+'"]').click();await synced(student,route);
    await t.locator('[data-angle-input]').fill('1.25');
    await synced(student,route,{'view/model/angleDraft':'1.25'});
    await t.locator('[data-apply-angle]').click();await synced(student,route,{'view/model/angle':1.25});
    await t.locator('#field-start').fill('2');await t.locator('#field-end').fill('3/4');
    await t.locator('#answer-form button[type=submit]').click();await synced(student,route,{'view/feedback':'wrong',[key+'draft/start']:'2'});
    await t.locator('#hint').click();await synced(student,route,{'view/hintOpen':true});
    await teacher.locator('#openShare').click();await teacher.locator('#controlToggle').click();await teacher.locator('#sharePanel [data-close-panel]').click();
    await student.waitForFunction(()=>document.body.classList.contains('control-owner'));
    await s.locator('#field-start').fill('0');await s.locator('#answer-form button[type=submit]').click();
    await synced(teacher,route,{'view/feedback':'right',[key+'draft/start']:'0'});
    await s.locator('#next').click();await synced(teacher,route,{[key+'step']:1});
    await teacher.reload({waitUntil:'domcontentloaded'});await synced(teacher,route,{[key+'step']:1});
    await student.reload({waitUntil:'domcontentloaded'});await synced(student,route,{[key+'step']:1});
    const writer=await teacher.locator('body').evaluate(el=>el.classList.contains('control-owner'))?teacher:student;
    const watcher=writer===teacher?student:teacher,view=frame(writer);
    await view.locator('a[href="#home"]').first().click();await view.locator('#book-number').fill('6.41');
    await view.locator('#jump-form button').click();await synced(watcher,'#number/6.41');
    await view.locator('a[href="#task/m6-41-a/independent"]').click();await synced(watcher,'#task/m6-41-a/independent');
    for(const [p,tag] of [[teacher,'teacher'],[student,'student']])
      assert.equal(await p.evaluate(key=>localStorage.getItem(key),personalKey),'synthetic personal draft '+tag);
    console.log('Full Mordkovich edition: 75 exact book/board URLs; a newly eligible directed arc and final inequality, both writers, model, tailored feedback, hint, step, two reloads and isolated personal drafts.');
  }finally{await sc.close();await tc.close();}
};
