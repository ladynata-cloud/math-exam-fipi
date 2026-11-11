'use strict';
const assert=require('node:assert/strict');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function poll(check,label){const until=Date.now()+20000;while(Date.now()<until){if(await check())return;await delay(100);}throw Error(label+' timed out');}
module.exports=async function inkFaults({page,origin,server,lesson,token,seatId,readWork}){
  const actionURL=server+'/api/group-lessons/'+lesson+'/actions';
  const key='mathexam.group.outbox.v2.'+encodeURIComponent(JSON.stringify([server,lesson,seatId]));
  const queue=()=>page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)||'{}'),key);
  const mode=async name=>{const b=page.locator('#materialTabs [data-surface="'+name+'"]');if(await b.getAttribute('aria-pressed')!=='true')await b.click();await poll(async()=>await b.getAttribute('aria-pressed')==='true','material '+name);};
  const ink=()=>page.locator('#boardCanvas').evaluate(canvas=>{const p=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;for(let i=3;i<p.length;i+=4)if(p[i])return true;return false;});
  const draw=async()=>{await mode('board');const canvas=page.locator('#boardCanvas');await canvas.scrollIntoViewIfNeeded();const b=await canvas.boundingBox();await page.mouse.move(b.x+35,b.y+45);await page.mouse.down();await page.mouse.move(b.x+110,b.y+100,{steps:8});await page.mouse.up();};
  const acceptUnload=dialog=>dialog.accept();page.on('dialog',acceptUnload);
  await page.goto(origin+'/trainers/group-board.html#'+new URLSearchParams({lesson,token,server}));
  await page.locator('#focus').waitFor({state:'visible'});
  assert.equal((await readWork()).strokes.length,0,'isolated fault scenario starts with empty ink');
  async function lostAck(type,perform,expectedInk){
    let accepted=false,opId,release,retried=false,injectionError;
    const barrier=new Promise(resolve=>{release=resolve;});
    const ids=[];
    const handler=async route=>{
      const request=route.request();if(request.method()!=='POST'||request.postDataJSON()?.type!==type)return route.continue();
      const body=request.postDataJSON();ids.push(body.opId);
      if(!accepted){
        try {const result=await route.fetch();assert.equal(result.status(),200,'fault occurs AFTER durable acceptance');opId=body.opId;accepted=true;await route.abort('failed');}
        catch(error){injectionError=error;await route.abort().catch(()=>{});}
      }else{retried=true;await barrier;await route.continue().catch(()=>{});}
    };
    await page.route(actionURL,handler);
    try{
      await perform();
      await poll(()=>{if(injectionError)throw injectionError;return accepted;},type+' durably accepted before ACK loss');
      const canonical=await readWork();assert.equal(canonical.strokes.length,expectedInk?1:0);
      await poll(async()=>/Нет связи/.test(await page.locator('#connectionStatus').textContent()),'lost response visibly disconnects');
      assert.equal((await queue()).outbox[0].opId,opId,'unacknowledged operation retained');
      const requestsBeforeReload=ids.length;
      await page.reload();await page.locator('#focus').waitFor({state:'visible'});await mode('board');
      await poll(()=>retried&&ids.length>requestsBeforeReload,'same action replayed after reload');
      assert.equal((await queue()).outbox[0].opId,opId,'reload preserves idempotency identity');
      assert.equal(await ink(),expectedInk,'canvas agrees with accepted action plus pending preview');
      release();
      await poll(async()=>(await queue()).outbox.length===0,'retry durably acknowledged');
      assert.deepEqual(await readWork(),canonical,'retry changes no canonical work or versions');
      assert.ok(ids.length>=2&&ids.every(id=>id===opId),'all retries use original operation id');
      assert.equal(await ink(),expectedInk,'ACK does not duplicate or resurrect ink');
    }finally{release();await page.unroute(actionURL,handler);}
  }
  await lostAck('stroke',draw,true);
  await lostAck('undo',()=>page.locator('#undoButton').click(),false);
  let release,held=false;
  const barrier=new Promise(resolve=>{release=resolve;});
  const reject=async route=>{if(route.request().method()!=='POST'||route.request().postDataJSON()?.type!=='stroke')return route.continue();held=true;await barrier;await route.fulfill({status:403,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({error:'GROUP_FORBIDDEN'})});};
  await page.route(actionURL,reject);
  try{
    await draw();await poll(()=>held,'rejected stroke first held');
    assert.equal(await ink(),true,'pending ink remains visible before rejection');
    release();await poll(async()=>(await queue()).rejected?.length===1,'permanent rejection retained separately');
    await poll(async()=>!await ink(),'rejected preview disappears');
    assert.equal((await readWork()).strokes.length,0,'rejection changes no saved ink');
    assert.match(await page.locator('#connectionStatus').textContent(),/отклонённые/);
    assert.equal(await page.locator('#recoverWorkButton').isVisible(),true);
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#recoverWorkButton').click()]);
    const stream=await download.createReadStream();let text='';for await(const chunk of stream)text+=chunk.toString();
    const recovery=JSON.parse(text);assert.equal(recovery.rejected[0].action.type,'stroke');assert.equal(recovery.unsent.length,0);assert.equal(text.includes(token),false,'recovery export contains no bearer');
    await page.reload();await page.locator('#focus').waitFor({state:'visible'});await mode('board');
    assert.equal((await queue()).rejected.length,1,'permanent refusal survives reload');
    assert.equal(await ink(),false,'rejected work does not reappear as saved ink');
  }finally{release();await page.unroute(actionURL,reject);page.off('dialog',acceptUnload);}
  console.log('PASS ink stroke/undo lost ACK after durable append, reload, dedup, permanent reject and credential-free recovery');
};
