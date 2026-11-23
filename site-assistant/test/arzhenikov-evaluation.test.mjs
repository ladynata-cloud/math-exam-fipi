import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, rmSync, existsSync, readFileSync, readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {ENDPOINT, planEvaluation, runEvaluation as evaluate, parseArguments} from '../arzhenikov/run-evaluation.mjs';

const fakeKey = 'synthetic-test-key-not-a-credential';
const fakeProject = 'proj_synthetic_test';
const env = {OPENAI_API_KEY:fakeKey, OPENAI_PROJECT_ID:fakeProject};
const runEvaluation = (options, dependencies = {}) => evaluate(options, {
  now:()=>'2026-11-24T12:00:00.000Z', ...dependencies
});
const rows = out => readFileSync(join(out,'journal.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse);
function setup(t, options = {}) {
  const parent = mkdtempSync(join(tmpdir(),'arzhenikov-evaluation-'));
  t.after(() => rmSync(parent,{recursive:true}));
  return {run:true, limit:1, out:join(parent,'run'), expectedProjectId:fakeProject, ...options};
}
function body(request, n = 1) {
  return {id:'resp_synthetic_' + n, model:request.model, status:'completed',service_tier:'default',
    reasoning:{effort:request.reasoning.effort},
    usage:{input_tokens:100, output_tokens:20, total_tokens:120,
      input_tokens_details:{cached_tokens:40},output_tokens_details:{reasoning_tokens:0}},
    output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',
      text:'Сверь две группы с условием. Какую группу нужно присоединить?'}]}]};
}
function response(data, options = {}) {
  return {status:200, url:ENDPOINT, redirected:false, headers:{get:()=>'req_synthetic'},
    text:async()=>JSON.stringify(data), ...options};
}

test('default is a credential-free dry run with no directory and no transport', async t => {
  const options = setup(t); delete options.run;
  let calls = 0;
  const result = await runEvaluation(options, {env:new Proxy({}, {get(){throw Error('credential read');}}),
    now:()=>{throw Error('clock read');},
    fetchImpl:async()=>{calls += 1; throw Error('unexpected');}});
  assert.equal(result.kind,'dry-run'); assert.equal(result.actualCalls,0);
  assert.equal(calls,0); assert(!existsSync(options.out));
});

test('both fixed model plans fit the ceiling; unknown model, calls or budget fail before network', async t => {
  for (const model of ['gpt-6-luna','gpt-6.2-sol']) {
    const plan = planEvaluation({model});
    assert.equal(plan.caseCount,24); assert.equal(plan.callCount,28);
    assert(Number(plan.worstCaseUsd) < 1); assert.equal(plan.maximumUsd,'1.000000000');
    assert.equal(plan.store,false); assert.equal(plan.serviceTier,'default');
    assert(plan.calls.every(call => call.outputTokenBound === 1024));
  }
  const options = setup(t); let calls = 0;
  const deps = {env,fetchImpl:async()=>{calls += 1;}};
  for (const bad of [{model:'unknown'},{limit:0},{limit:25},{maxUsd:'1.01'}, {maxUsd:'0.000000001'}]) {
    await assert.rejects(runEvaluation({...options,...bad},deps), error => /^E_(MODEL|CASE_LIMIT|BUDGET)/.test(error.code));
  }
  assert.equal(calls,0); assert(!existsSync(options.out));
});

test('a missing key or mismatched bonus project cannot create a run or make a request', async t => {
  const options = setup(t); let calls = 0;
  const fetchImpl = async()=>{calls += 1;};
  await assert.rejects(runEvaluation(options,{env:{},fetchImpl}),{code:'E_KEY_MISSING'});
  await assert.rejects(runEvaluation(options,{env:{OPENAI_API_KEY:fakeKey},fetchImpl}),{code:'E_BONUS_PROJECT_REQUIRED'});
  await assert.rejects(runEvaluation({...options,expectedProjectId:'proj_other'},{env,fetchImpl}),{code:'E_BONUS_PROJECT_MISMATCH'});
  assert.equal(calls,0); assert(!existsSync(options.out));
});

test('seven-day UTC pricing expires closed, including invalid and out-of-range clocks', async t => {
  const plan = planEvaluation();
  assert.equal(plan.pricing.checkedAt,'2026-11-23T17:26:52.000Z');
  assert.equal(plan.pricing.expiresAt,'2026-11-30T17:26:52.000Z');
  for (const [time, code] of [
    ['invalid','E_CLOCK'], [null,'E_CLOCK'], ['2026-11-31T12:00:00.000Z','E_CLOCK'],
    ['2026-11-23T17:26:51.999Z','E_PRICING_NOT_CURRENT'],
    ['2026-11-30T17:26:52.000Z','E_PRICING_EXPIRED'],
    ['2099-01-01T00:00:00.000Z','E_PRICING_EXPIRED']
  ]) {
    const options = setup(t); let calls = 0;
    await assert.rejects(runEvaluation(options,{env,now:()=>time,fetchImpl:async()=>{calls += 1;}}),{code});
    assert.equal(calls,0); assert(!existsSync(options.out));
    assert.equal((await runEvaluation({...options,run:false},{now:()=>time})).kind,'dry-run');
  }
  let time = '2026-11-30T17:26:51.999Z', calls = 0;
  const options = setup(t,{limit:2});
  await assert.rejects(runEvaluation(options,{env,now:()=>time,fetchImpl:async(_url,init)=>{
    calls += 1; time = '2026-11-30T17:26:52.000Z';
    return response(body(JSON.parse(init.body)));
  }}),{code:'E_PRICING_EXPIRED'});
  assert.equal(calls,1);
  assert.equal(rows(options.out).filter(row=>row.event === 'reserved').length,1);
});

test('plan precedes runtime, reservation precedes request, and all input uses the maximum cache-write rate', async t => {
  const options = setup(t); let planned = false, calls = 0;
  const result = await runEvaluation(options,{env,
    onPlan:plan=>{assert(!existsSync(options.out)); assert.equal(plan.callCount,1); planned = true;},
    fetchImpl:async(url,init)=>{
      assert(planned); calls += 1;
      assert.equal(url,ENDPOINT); assert.equal(init.redirect,'error');
      const request = JSON.parse(init.body);
      assert.equal(request.store,false); assert.equal(request.service_tier,'default');
      assert(!Object.hasOwn(request,'tools')); assert(!init.body.includes('criterion'));
      assert.equal(rows(options.out).at(-1).event,'reserved');
      assert.equal(init.headers['OpenAI-Project'],fakeProject);
      return response(body(request));
    }});
  assert.equal(calls,1); assert.equal(result.actualCalls,1);
  assert.equal(result.estimatedCostUsd,'0.000022500');
  assert.equal(result.uncertainReservedUsd,'0.000000000');
  const log = rows(options.out);
  assert.deepEqual(log.map(row=>row.event),['started','reserved','response','completed']);
  assert.equal(log[0].accountBinding.projectSha256, createHash('sha256').update(fakeProject).digest('hex'));
  assert.equal(log[2].cachedTokens,40);
  for (const file of readdirSync(options.out)) {
    const content = readFileSync(join(options.out,file),'utf8');
    assert(!content.includes(fakeKey)); assert(!content.includes(fakeProject));
  }
});

test('a completed or halted output directory cannot be used again', async t => {
  const options = setup(t); let calls = 0;
  const deps = {env,fetchImpl:async(_url,init)=>{calls += 1; return response(body(JSON.parse(init.body)));}};
  await runEvaluation(options,deps);
  await assert.rejects(runEvaluation(options,deps),{code:'E_OUTPUT_DIRECTORY_NOT_FRESH'});
  assert.equal(calls,1); assert(existsSync(join(options.out,'run.lock')));
});

test('HTTP failure saves numerical status and request ID, retains reserve and never reads error body', async t => {
  const options = setup(t); let calls = 0;
  const deps = {env,fetchImpl:async()=>{calls += 1;return response(null,{status:503,text:async()=>{throw Error('error body must not be read');}});}};
  await assert.rejects(runEvaluation(options,deps),error=>error.code === 'E_HTTP_STATUS' && error.httpStatus === 503 && Number(error.uncertainReservedUsd) > 0);
  assert.equal(calls,1);
  const log = rows(options.out), halted = log.at(-1);
  assert.equal(halted.httpStatus,503); assert.equal(halted.requestId,'req_synthetic');
  assert.equal(halted.retryAllowed,false); assert.equal(halted.estimatedCostUsd,'0.000000000');
  assert.equal(halted.uncertainReservedUsd,log.find(row=>row.event === 'reserved').reservedUsd);
  await assert.rejects(runEvaluation(options,deps),{code:'E_OUTPUT_DIRECTORY_NOT_FRESH'});
  assert.equal(calls,1);
});

test('provider metadata and replies cannot reflect key or account identifiers into files or errors', async t => {
  const fakeOrganization = 'org-synthetic-test';
  const credentials = {...env,OPENAI_ORG_ID:fakeOrganization};
  for (const secret of [fakeKey, fakeProject, fakeOrganization]) {
    for (const where of ['failed-request-id','successful-request-id','response-id','reply']) {
      const options = setup(t); let calls = 0, failure = null;
      try {
        const result = await runEvaluation(options,{env:credentials,fetchImpl:async(_url,init)=>{
          calls += 1; const data = body(JSON.parse(init.body));
          if (where === 'response-id') data.id = 'resp_' + secret;
          if (where === 'reply') data.output[0].content[0].text = 'Отражённое значение: ' + secret;
          return response(data, where.endsWith('request-id') ? {
            status:where === 'failed-request-id' ? 503 : 200,
            headers:{get:()=>'req_' + secret},
            ...(where === 'failed-request-id' ? {text:async()=>{throw Error('never read error body');}} : {})
          } : {});
        }});
        assert.equal(where,'successful-request-id'); assert.equal(result.kind,'completed');
      } catch (error) { failure = error; }
      assert.equal(calls,1);
      if (where !== 'successful-request-id') {
        assert.equal(failure?.code,where === 'failed-request-id' ? 'E_HTTP_STATUS' : 'E_SECRET_IN_OUTPUT');
        assert(Number(failure.uncertainReservedUsd) > 0);
      }
      const log = rows(options.out);
      if (where.endsWith('request-id')) assert.equal(log.find(row=>row.event === (failure ? 'halted' : 'response')).requestId,null);
      for (const file of readdirSync(options.out)) {
        const content = readFileSync(join(options.out,file),'utf8');
        for (const value of [fakeKey,fakeProject,fakeOrganization]) assert(!content.includes(value));
      }
      for (const value of [fakeKey,fakeProject,fakeOrganization]) assert(!JSON.stringify(failure).includes(value));
    }
  }
});

test('redirects, network errors and timeouts halt after one attempt with uncertain reservation', async t => {
  for (const [name, code, transport] of [
    ['redirect','E_REDIRECT',async()=>response(null,{status:302,redirected:true,url:'https://example.org/'})],
    ['network','E_TRANSPORT',async()=>{throw Error('untrusted network diagnostic');}],
    ['timeout','E_TIMEOUT',async()=>{const error = Error('timeout');error.name='AbortError';throw error;}]
  ]) {
    const options = setup(t); options.out += '-' + name; let calls = 0;
    await assert.rejects(runEvaluation(options,{env,fetchImpl:async(...args)=>{calls += 1;return transport(...args);}}),{code});
    assert.equal(calls,1); const last = rows(options.out).at(-1);
    assert.equal(last.code,code); assert(Number(last.uncertainReservedUsd) > 0);
    assert(!JSON.stringify(last).includes('untrusted network diagnostic'));
  }
});

test('incomplete, wrong-profile, tool, malformed or unbounded outputs cannot release the reservation', async t => {
  const mutations = [
    ['E_RESPONSE_MODEL',data=>{data.model='another-model';}],
    ['E_RESPONSE_TIER',data=>{data.service_tier='priority';}],
    ['E_RESPONSE_REASONING',data=>{data.reasoning.effort='high';}],
    ['E_INCOMPLETE',data=>{data.status='incomplete';}],
    ['E_USAGE_BOUND',data=>{data.usage.output_tokens=2048; data.usage.total_tokens=2148;}],
    ['E_USAGE_DETAILS',data=>{data.usage.input_tokens_details.cached_tokens=101;}],
    ['E_UNEXPECTED_USAGE_DETAILS',data=>{data.usage.input_tokens_details.cache_write_tokens=5;}],
    ['E_OUTPUT_TYPE',data=>{data.output.push({type:'web_search_call'});}],
    ['E_REPLY_BOUND',data=>{data.output[0].content[0].text='x'.repeat(20000);}]
  ];
  for (const [code,mutate] of mutations) {
    const options = setup(t); let calls = 0;
    await assert.rejects(runEvaluation(options,{env,fetchImpl:async(_url,init)=>{
      calls += 1; const data = body(JSON.parse(init.body));mutate(data);return response(data);
    }}),error=>error.code === code && error.httpStatus === 200);
    assert.equal(calls,1);assert(Number(rows(options.out).at(-1).uncertainReservedUsd) > 0);
  }
  const options = setup(t);
  await assert.rejects(runEvaluation(options,{env,fetchImpl:async()=>response(null,{text:async()=>'{bad json'})}),{code:'E_RESPONSE_JSON'});
});

test('later turns receive the actual earlier response and each new case starts fresh', async t => {
  const options = setup(t,{limit:2}); let calls = 0;
  await runEvaluation(options,{env,fetchImpl:async(_url,init)=>{
    calls += 1; const request = JSON.parse(init.body);
    if (calls <= 2) assert(request.input.every(item=>item.role !== 'assistant'));
    else assert.equal(request.input.find(item=>item.role === 'assistant').content,'Сохранённый ответ модели номер 2');
    const data = body(request,calls); data.output[0].content[0].text='Сохранённый ответ модели номер ' + calls;
    return response(data);
  }});
  assert.equal(calls,3);
});

test('duplicate response identifiers halt without a retry or double settlement', async t => {
  const options = setup(t,{limit:2}); let calls = 0;
  await assert.rejects(runEvaluation(options,{env,fetchImpl:async(_url,init)=>{
    calls += 1; return response(body(JSON.parse(init.body),1));
  }}),{code:'E_DUPLICATE_RESPONSE'});
  assert.equal(calls,2);
  const log = rows(options.out);
  assert.equal(log.filter(row=>row.event === 'response').length,1);
  assert.equal(log.at(-1).estimatedCostUsd,'0.000022500');
  assert(Number(log.at(-1).uncertainReservedUsd) > 0);
});

test('CLI rejects endpoint overrides, duplicate switches and accidental run values', () => {
  assert.deepEqual(parseArguments([]),{});
  assert.deepEqual(parseArguments(['--model','gpt-6-luna','--limit','2']),{model:'gpt-6-luna',limit:2});
  for (const argv of [['--endpoint','https://example.org'],['--run','--run'],['--run=false'],['--max-usd']]) {
    assert.throws(()=>parseArguments(argv),{code:'E_ARGUMENT'});
  }
});
