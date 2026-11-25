#!/usr/bin/env python3
"""Prepare and validate owner-requested task-15 fixes; never merge or deploy main.
The current script creates only local candidate commits and evidence. Remote
publication is deliberately separate from preparation and test execution.
"""
from pathlib import Path
import argparse, json, os, subprocess
MAIN='64c1079e0f2e73ad77d9fbd1d58526be5517246d'
HEAD146='2069d21d96943602a03844ffb52f83d50b4700c9'
H='trainers/oge-task15-triangles.html'
N='tools/oge-task15-triangles.test.mjs'
B='tools/oge-task15-triangles.browser.mjs'
SPEC='docs/tasks/OGE_COURSE_03B_TASK15.md'

def command(*args,cwd=None,check=True):
    return subprocess.run(list(args),cwd=cwd,check=check,capture_output=True,text=True)
def git(*args,cwd=None): return command('git',*args,cwd=cwd).stdout.strip()
def edit(root,path,old,new,count=1):
    p=root/path;s=p.read_bytes().decode('utf-8')
    if s.count(old)!=count: raise ValueError(f'{path}: expected {count} exact occurrences of {old[:70]!r}, found {s.count(old)}')
    p.write_bytes(s.replace(old,new).encode('utf-8'))

def fix146(w):
    edit(w,H,'.tabs{gap:4px;padding:8px 10px 0}', '.tabs{display:grid;grid-template-columns:.85fr 1.12fr .73fr 1.2fr;gap:4px;padding:8px 10px 0}\n  .tabs .tab{min-width:0;padding:6px 3px}\n  .diagram svg{max-height:min(25vh,180px)}')
    old='Подсказки ничего не отнимают. «Показать шаг» открывает результат ступени — после этого задача в счёт решённых не пойдёт (промахом это не считается). Ответ задачи — на последней ступени.'
    new='Подсказки помогают учиться: задача будет отмечена «с подсказкой», а не как самостоятельная. «Показать шаг» открывает результат ступени — после этого задача в счёт решённых не пойдёт (промахом это не считается). Ответ задачи — на последней ступени.'
    edit(w,H,old,new);edit(w,N,old,new)
    edit(w,H,'«Подсказка» и «Решить по шагам» ничего не отнимают.','В счётчике «Решено» сохраняется учебный результат. Содержательные подсказки и пояснения ошибок отмечаются отдельно: «с подсказкой». Они не считаются самостоятельной серией и не закрывают работу над ошибками. Решение по шагам без подсказок отмечается отдельно от решения сразу. Старые результаты не переклассифицируются.')
    edit(w,H,'const clean=!tr.shown;\n  if(clean){CP.solvedOne(tr.t.k);if(!tr.missed)logTaskVerdict(tr.t,true);}\n  streak=clean&&!tr.missed?streak+1:0;\n  CP.saveRec(rec=>{const x=CP.isObj(rec.train)?rec.train:{};rec.train={solved:CP.num(x.solved)+(clean?1:0),shown:CP.num(x.shown)+(clean?0:1)};});', '''const clean=!tr.shown, independent=clean&&!tr.hinted;
  // Preserve educational credit; never label assisted work as independent.
  if(clean){CP.solvedOne(tr.t.k);if(independent&&!tr.missed)logTaskVerdict(tr.t,true);}
  streak=independent&&!tr.missed?streak+1:0;
  CP.saveRec(rec=>{const x=CP.isObj(rec.train)?rec.train:{};
    rec.train=Object.assign({},x,{solved:CP.num(x.solved)+(clean?1:0),shown:CP.num(x.shown)+(clean?0:1),
      independent:CP.num(x.independent)+(independent?1:0),supported:CP.num(x.supported)+(clean&&!independent?1:0)});
    rec.lastPracticeOutcome={variantId:tr.t.variantId,kind:tr.shown?'shown':tr.hinted?'supported':tr.missed?'corrected':'independent',
      mode:tr.ladder?'steps':'direct',hints:CP.num(tr.hintCount),feedback:CP.num(tr.feedbackCount)};
  });''')
    edit(w,H,'function trFinish(){', '''function trHelp(kind){
  if(!tr||tr.done)return;
  tr.hinted=true;
  if(kind==='feedback')tr.feedbackCount=CP.num(tr.feedbackCount)+1;
  else tr.hintCount=CP.num(tr.hintCount)+1;
}
function trFinish(){''')
    edit(w,H,"${tr.missed?' Ошибку вы исправили сами — задача засчитана.':''}","${tr.hinted?' Решено с подсказкой — учебная задача засчитана.':tr.missed?' Ошибку вы исправили сами — задача засчитана.':''}")
    edit(w,H,'const d=matchDiag(v,t.diag);\n      fb.className',"const d=matchDiag(v,t.diag);\n      if(d)trHelp('feedback');\n      fb.className")
    edit(w,H,'mountLadder(lad,t,{onMiss:trMiss,onShow:', 'mountLadder(lad,t,{onMiss:trMiss,onHint:trHelp,onShow:')
    edit(w,H,':`Все шаги решены самостоятельно — задача засчитана. Ответ ${fmtNum(t.ans)}.`', ':tr.hinted?`Решено с подсказкой — учебная задача засчитана. Ответ ${fmtNum(t.ans)}.`\n        :`Все шаги решены самостоятельно — задача засчитана. Ответ ${fmtNum(t.ans)}.`')
    edit(w,H,"if(div.querySelector('.hintbox'))return;const x=", "if(div.querySelector('.hintbox'))return;if(h.onHint)h.onHint('hint');const x=")
    edit(w,H,'else{h.onMiss();const d=last?matchDiag(v,t.diag):null;', "else{h.onMiss();if(h.onHint)h.onHint('feedback');const d=last?matchDiag(v,t.diag):null;")
    # Only assertions for the explicitly changed help contract are updated.
    # Geometry, touch targets, bounds, counters, anti-double-tap and all other
    # existing checks are retained. More restrictive assertions are added.
    edit(w,B,".startsWith('Подсказки ничего не отнимают. «Показать шаг» открывает результат ступени')", ".startsWith('Подсказки помогают учиться: задача будет отмечена «с подсказкой»')")
    edit(w,B,'/исправили сами/', '/Решено с подсказкой/',3)
    edit(w,B,"ok(/Все шаги решены самостоятельно/.test(await page.locator('#after').innerText()) && await page.locator('#next2').count() === 1, 'D', 'итог и «Следующая →» под лестницей');", "ok(/Решено с подсказкой/.test(await page.locator('#after').innerText()) && await page.locator('#next2').count() === 1, 'D', 'честный итог и «Следующая →» под лестницей');\n    ok(r.train.supported === 2 && r.train.independent === 1 && r.lastPracticeOutcome.hints === 1, 'D', 'помощь отделена от самостоятельной работы');")
    edit(w,N,"ok(/Подсказки ничего не отнимают/.test(html), '13', '«Подсказки ничего не отнимают» сказано ученику');", "ok(/задача будет отмечена «с подсказкой», а не как самостоятельная/.test(html), '13', 'ученику объяснён честный статус помощи');")
    extra='''section('Owner remediation: help provenance and preservation', () => {
  const T=loadTrainer(FILE), get=code=>JSON.parse(T.run('JSON.stringify('+code+')'));
  T.run("tr={t:buildVariant('bisIso:B',true),missed:false,shown:false,done:false,ladder:true};trHelp('hint');trFinish();");
  const assisted=get("CP.readAll()[TID]");
  ok(assisted.train.supported===1 && assisted.train.independent===0,'help','assisted result is not independent');
  ok(assisted.lastPracticeOutcome.kind==='supported' && assisted.lastPracticeOutcome.hints===1,'help','persisted evidence');
  ok(T.run('streak')===0,'help','hint does not advance clean streak');
  T.run('trFinish()');
  ok(get('CP.readAll()[TID].train').supported===1,'help','repeated completion cannot mint credit');
  T.run("tr={t:buildVariant('bisIso:B',true),missed:false,shown:false,done:false,ladder:false};trFinish();");
  ok(get('CP.readAll()[TID].train').independent===1,'help','clean result remains independent');
  T.run("tr={t:buildVariant('bisIso:B',true),missed:false,shown:false,done:false,ladder:true};trHelp('feedback');tr.shown=true;trFinish();");
  const shown=get('CP.readAll()[TID]');
  ok(shown.train.shown===1 && shown.train.supported===1 && shown.train.independent===1,'help','reveal is not supported or independent credit');
  ok(shown.lastPracticeOutcome.kind==='shown','help','reveal has priority');
});
'''
    marker="console.log('\\nпроверок: ' + checks + ', провалов: ' + fails);"
    edit(w,N,marker,extra+'\n'+marker)
    with (w/SPEC).open('a',encoding='utf-8') as f:
        f.write('\n\n## Owner-requested learner audit remediation, 2026-10-09\n\n'
          'Owner: «исправь пожалуйста все что нашел»; then asked for additional learner profiles and repeated checks. '
          'This authorizes bounded corrections and current-main reconciliation of this task branch, not release. '
          'The prior help wording is superseded: educational completion may remain credited, but substantive hints and diagnostic explanations are persisted as supported work, never an independent streak or a clean mistake-review result. '
          'New independent/supported counters cover new attempts only; historical results are not guessed or rewritten. '
          'The trainer remains self-contained. Touch targets stay 44px; a four-column mobile tab layout and bounded diagram height keep the answer visible at 360x740. '
          'Product scope: trainer HTML, its existing math/browser gates, this task specification. Current PROJECT_STATUS comes from main rather than overwriting later work. '
          'Relevant tests and screenshots must be rerun on the composed tree. No merge into main, deployment, force push, or independent-review approval is authorized.\n')

def main():
    a=argparse.ArgumentParser();a.add_argument('--out',type=Path,required=True);args=a.parse_args()
    out=args.out.resolve();out.mkdir(parents=True,exist_ok=True)
    repo=Path.cwd();env=os.environ.copy()
    actual=git('ls-remote','origin','refs/heads/main').split()[0]
    assert actual==MAIN, 'Base drift: report and stop before changing any remote branch'
    git('fetch','origin','main','refs/pull/146/head')
    mr=command('git','merge-tree','--write-tree',MAIN,HEAD146,check=False)
    (out/'146-virtual-before.txt').write_text(mr.stdout+mr.stderr)
    tree=mr.stdout.splitlines()[0]
    assert len(tree)==40
    env.update(GIT_AUTHOR_NAME='MathExam remediation',GIT_AUTHOR_EMAIL='noreply@users.noreply.github.com',GIT_COMMITTER_NAME='MathExam remediation',GIT_COMMITTER_EMAIL='noreply@users.noreply.github.com')
    virtual=subprocess.check_output(['git','commit-tree',tree,'-p',HEAD146,'-p',MAIN,'-m','Temporary read-only composition for remediation'],env=env,text=True).strip()
    w=Path(os.environ.get('RUNNER_TEMP','/tmp'))/'remediated-task15'
    git('worktree','add','--detach',str(w),virtual)
    # Preserve the complete newer project status; the old PR's status is stale.
    (w/'docs/PROJECT_STATUS.md').write_bytes(subprocess.check_output(['git','show',MAIN+':docs/PROJECT_STATUS.md']))
    fix146(w)
    allowed={H,N,B,SPEC,'docs/PROJECT_STATUS.md'}
    changed=set(git('diff','--name-only',cwd=w).splitlines())
    assert changed<=allowed, f'Out-of-scope correction: {changed-allowed}'
    git('diff','--check',cwd=w)
    (out/'146-fix.diff').write_text(git('diff',cwd=w))
    results={}
    for name,script in [('math',N),('browser',B)]:
        r=command('node',script,cwd=w,check=False)
        (out/f'146-{name}.log').write_text(r.stdout+r.stderr)
        results[name]=r.returncode
    # Run the existing audit against main plus corrected triangle candidate.
    robots=repo/'tools/learner-robots/learner_robots.py'
    r=command('python',str(robots),'--root',str(repo),'--candidate',str(w),'--out',str(out/'journeys'),check=False)
    (out/'robots.log').write_text(r.stdout+r.stderr);results['robots']=r.returncode
    (out/'results.json').write_text(json.dumps({'base':MAIN,'candidate_old':HEAD146,'checks':results,'published':False},indent=2))
    if os.environ.get('GITHUB_ENV'):
        with open(os.environ['GITHUB_ENV'],'a') as f:f.write('REMEDIATED_TASK15='+str(w)+'\n')
    if any(results.values()):raise SystemExit(1)
if __name__=='__main__':main()
