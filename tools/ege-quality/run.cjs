// Bounded role-based regression checks. No LLM calls and no production mutations.
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),role=process.argv[2],out=path.join(root,'ege-quality-results');fs.mkdirSync(out,{recursive:true});
const roles={
 teacher:['ege-baza-2027-gate.mjs','ege-baza-foundation.test.mjs','ege-baza-data.test.mjs','ege-baza-algebra-percent.test.cjs','ege-baza-reasoning.test.cjs','ege-baza-labs.test.cjs','ege-release/math.cjs','ege-release/work-rate.math.cjs'],
 student:['ege-release/browser.cjs','ege-release/work-rate.browser.cjs','ege-quality/student.browser.cjs'],
 tester:['ege-baza-navigator.test.mjs','ege-baza-backup.test.mjs','ege-baza-foundation.browser.mjs','ege-baza-data.browser.mjs','ege-baza-algebra-percent.browser.cjs','ege-baza-reasoning.browser.cjs','ege-baza-labs.browser.cjs','ege-baza-navigator.browser.mjs','ege-baza-backup.browser.mjs']
};
if(!roles[role])throw Error('Use teacher, student or tester');
const env={...process.env};if(env.CHROMIUM_EXECUTABLE_PATH){env.FOUNDATION_CHROMIUM_PATH=env.CHROMIUM_EXECUTABLE_PATH;env.NAVIGATOR_CHROMIUM_PATH=env.CHROMIUM_EXECUTABLE_PATH;}
const results=[];for(const script of roles[role]){const start=Date.now(),r=spawnSync(process.execPath,['tools/'+script],{cwd:root,env,encoding:'utf8',timeout:180000,maxBuffer:4e6});const log=(r.stdout||'')+(r.stderr||'')+(r.error?'\n'+r.error.message:'');fs.writeFileSync(path.join(out,role+'-'+path.basename(script)+'.log'),log);const ok=r.status===0&&!r.error;results.push({script,ok,milliseconds:Date.now()-start});console.log(`${ok?'PASS':'FAIL'} ${role}: ${script}`);if(!ok)console.log(log.slice(-3000));}
const report={role,commit:process.env.GITHUB_SHA||'local',timestamp:new Date().toISOString(),simulation:true,results};fs.writeFileSync(path.join(out,role+'.json'),JSON.stringify(report,null,2));
const title={teacher:'Учитель: математические ключи',student:'Ученик: ошибки, помощь и возврат',tester:'Тестировщик: интерфейс и сохранение'}[role];const summary=`## ${title}\n\nАвтоматическая симуляция. Не опыт реальных учеников и не независимая педагогическая экспертиза.\n\n| Проверка | Результат |\n|---|---|\n${results.map(r=>`| ${r.script} | ${r.ok?'PASS':'FAIL'} |`).join('\n')}\n\nКоммит: ${report.commit}\n`;
fs.writeFileSync(path.join(out,role+'.md'),summary);if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,summary);if(results.some(r=>!r.ok))process.exitCode=1;
