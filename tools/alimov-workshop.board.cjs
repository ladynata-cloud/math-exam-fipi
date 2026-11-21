'use strict';
const assert = require('node:assert/strict');
const pages = [3,7,11,17,24,39,47,54,60,63,72,77,81,84,90,94,96,100,105,109,117,121,126,132,135,139,142,144,149,152,156,161,168,173,179,184,194,201,204,208,213,217,223,229,236,240,245,251,261,265,271,277,283,291,294,297,301,304,309,317,320,323,326,330,336,339,343,346,350,354,364,370,375,387,388,390,393,395];

module.exports = async function checkAlimov(browser, origin, serverOrigin) {
  const teacherContext=await browser.newContext(), pupilContext=await browser.newContext({viewport:{width:360,height:780}});
  const teacher=await teacherContext.newPage(), pupil=await pupilContext.newPage();
  const errors=[];
  [teacher,pupil].forEach(page=>{page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(25000);});
  try {
    await pupil.goto(origin+'/school/index.html#books');
    await pupil.locator('a[href="#book/source-18"]').click();
    const rows=pupil.locator('#main .skill-row');
    await rows.first().waitFor();
    const links=await rows.evaluateAll(elements=>elements.map(row=>({label:row.querySelector('.eyebrow').textContent,
      personal:row.querySelector('a').href,board:row.querySelector('a:nth-of-type(2)').href})));
    assert.equal(links.length,78);
    assert.equal(await pupil.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    for (const [i,row] of links.entries()) {
      const n=i+1, route='#lesson/p'+String(n).padStart(2,'0')+'/0';
      assert.equal(row.label,(n>73?'Приложение · § '+(n-73):'§ '+n)+' · с. '+pages[i]);
      assert.equal(new URL(row.board).searchParams.get('trainer'),'/trainers/alimov10-11.html'+route);
      if (i===0) await pupil.goto(row.personal,{waitUntil:'domcontentloaded'});
      else await pupil.evaluate(href=>{location.hash=new URL(href).hash;},row.personal);
      await pupil.waitForFunction(([n,page])=>{
        const l=window.AlimovCourse?.lessons[n-1];
        return l?.page===page && document.querySelector('.lesson-title')?.textContent===l.title &&
          document.querySelector('#problem h2')?.textContent===l.tasks[0].title && !!document.querySelector('#model svg');
      },[n,pages[i]]);
      assert.equal(await pupil.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page '+pages[i]);
    }
    await pupil.evaluate(href=>{location.hash=new URL(href).hash;},links[28].personal);
    await pupil.waitForFunction(()=>document.querySelector('.lesson-title')?.textContent==='Формулы двойного угла');
    await pupil.locator('#final-answer').fill('12/25');
    await pupil.locator('#answer-form button[type=submit]').click();
    await pupil.locator('#problem').getByText(/удвой это произведение/).waitFor();
    await pupil.locator('#final-answer').fill('24/25');await pupil.locator('#answer-form button[type=submit]').click();
    await pupil.locator('.task-heading .tag').filter({hasText:'Исправлено самостоятельно'}).waitFor();
    await pupil.getByRole('button',{name:/Следующая задача/}).click();
    await pupil.locator('[data-action=hint]').click();
    await pupil.locator('#final-answer').fill('120/169');await pupil.locator('#answer-form button[type=submit]').click();
    await pupil.locator('.task-heading .tag').filter({hasText:'С помощью'}).waitFor();
    await pupil.getByRole('button',{name:/Следующая задача/}).click();
    await pupil.locator('#final-answer').fill('101/103');
    const key='mathexam.alimov10-11.2016.v1';
    const personal=await pupil.evaluate(k=>localStorage.getItem(k),key);
    assert.equal(JSON.parse(personal).tasks['p29-a3'].value,'101/103');
    const shared=new URL(links[28].board);shared.searchParams.set('server',serverOrigin);
    await teacher.goto(shared.href,{waitUntil:"domcontentloaded"});await teacher.locator('#openShare').click();await teacher.locator('#createRoom').click();
    await teacher.waitForFunction(()=>document.querySelector('#studentLink')?.value.includes('role=student'));
    const invite=await teacher.locator('#studentLink').inputValue();await teacher.locator('#sharePanel [data-close-panel]').click();await pupil.goto(invite,{waitUntil:"domcontentloaded"});
    const connected=page=>page.waitForFunction(()=>document.querySelector('#mirrorStatus')?.dataset.mirrorStatus==='connected');
    await Promise.all([connected(teacher),connected(pupil)]);
    const frame=page=>page.frameLocator('#trainerFrame'),t=frame(teacher),s=frame(pupil);
    const received=(page,selector,expected)=>page.waitForFunction(([selector,expected])=>document.querySelector('#trainerFrame')?.contentDocument?.querySelector(selector)?.value===expected,[selector,expected]);
    await received(pupil,'#final-answer','');
    const slider='#model input[type=range]';
    await t.getByText('Исследовать на модели',{exact:true}).click();
    await t.locator('#model .model-readout').filter({hasText:'sin α = 3/5'}).waitFor();
    await t.locator('#model select').selectOption('show');
    await s.locator('#model .model-readout').filter({hasText:/sin 2α ≈ 0[,.]96/}).waitFor();
    await t.locator(slider).first().press('ArrowRight');
    await received(pupil,slider,await t.locator(slider).first().inputValue());
    await t.locator('#final-answer').fill('12/25');await t.locator('#answer-form button[type=submit]').click();
    await s.locator('#problem').getByText(/забыл|удвой|удвоить|умножь.*2/i).first().waitFor();
    await t.locator('[data-action=guided]').click();await s.locator('[data-step-input="0"]').waitFor();
    await t.locator('[data-step-input="0"]').fill('12/25');await t.locator('[data-step-form="0"] button').click();
    await s.locator('.step.completed').first().waitFor();
    await teacher.locator('#openShare').click();await teacher.locator('#controlToggle').click();await teacher.locator('#sharePanel [data-close-panel]').click();
    await pupil.waitForFunction(()=>document.body.classList.contains('control-owner'));
    await s.getByText('Мои записи к задаче',{exact:true}).click();
    await s.locator('#notebook').fill('Сначала 3/5 × 4/5, потом удвою');await received(teacher,'#notebook','Сначала 3/5 × 4/5, потом удвою');
    await s.locator(slider).first().press('ArrowLeft');await received(teacher,slider,await s.locator(slider).first().inputValue());
    await teacher.reload({waitUntil:"domcontentloaded"});await connected(teacher);await received(teacher,'#notebook','Сначала 3/5 × 4/5, потом удвою');
    await t.locator('.step.completed').first().waitFor();
    await pupil.reload({waitUntil:"domcontentloaded"});await connected(pupil);await received(pupil,'#notebook','Сначала 3/5 × 4/5, потом удвою');
    assert.equal(await pupil.evaluate(k=>localStorage.getItem(k),key),personal);
    const owner=await teacher.locator('body').evaluate(body=>body.classList.contains('control-owner'))?teacher:pupil;
    const watcher=owner===teacher?pupil:teacher;
    await frame(owner).getByRole('button',{name:/Следующая задача/}).click();
    await watcher.waitForFunction(()=>document.querySelector('#trainerFrame')?.contentWindow?.location.hash==='#lesson/p29/1');
    assert.equal(await watcher.frameLocator('#trainerFrame').locator('#final-answer').inputValue(),'');
    const controller=frame(owner), viewer=frame(watcher);
    const chooser=controller.getByRole('button',{name:/№ 503\(1\)/});
    if (!(await chooser.isVisible())) await controller.getByText('Задачи этой темы',{exact:true}).click();
    await chooser.click();await viewer.locator('#problem h2').filter({hasText:'№ 503(1)'}).waitFor();
    await controller.locator('#final-answer').fill('24/25');await controller.locator('#answer-form button[type=submit]').click();
    await viewer.locator('.feedback').filter({hasText:'Модуль подходит'}).waitFor();
    await controller.locator('#final-answer').fill('-24/25');await controller.locator('#answer-form button[type=submit]').click();
    await viewer.locator('.task-heading .tag').filter({hasText:'С помощью'}).waitFor();
    await controller.getByRole('button',{name:/Следующая задача/}).click();
    await viewer.locator('#problem h2').filter({hasText:'№ 503(2)'}).waitFor();
    await controller.locator('#final-answer').fill('24/25');await controller.locator('#answer-form button[type=submit]').click();
    await viewer.locator('.task-heading .tag').filter({hasText:'С помощью'}).waitFor();
    assert.deepEqual(errors,[]);
    console.log('ALIMOV_WORKSHOP_BOARD_OK: 78 printed sections, mobile forms and models, two independent participants, both printed №503 solutions, double-angle error, step, new task, control transfer, two reloads, isolated personal draft.');
  } finally {await teacherContext.close();await pupilContext.close();}
};
