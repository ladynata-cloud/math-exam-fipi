'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {restorePublicNavigator,snippet,rollout}=require('./public-navigator-preservation.cjs');
const root=path.resolve(__dirname,'..'),pages=require('../assets/assistant/pages.json');
const hash=raw=>crypto.createHash('sha256').update(raw).digest('hex');
test('every inventoried public page has one exact existing navigator pair; all added pages recover original bytes',()=>{
  assert.deepEqual(pages,[...new Set(pages)].sort());
  assert.deepEqual([...rollout.existingPages,...Object.keys(rollout.addedPages)].sort(),pages);
  assert.deepEqual(Object.keys(rollout.provenance).sort(),pages,'Every public document has recorded discovery provenance');
  assert.deepEqual(pages.filter(name=>Object.hasOwn(rollout.excluded,name)),[],'Covered and excluded documents must be disjoint');
  const tag1=snippet.trim().split('\n')[0],tag2=snippet.trim().split('\n')[1];
  for(const name of pages){
    assert(!/^(?:book|b|learning|downloads|docs|tools)\//.test(name),name);
    const raw=fs.readFileSync(path.join(root,name)),text=raw.toString('utf8');
    assert.equal(text.split(tag1).length,2,name+' data include');
    assert.equal(text.split(tag2).length,2,name+' widget include');
    assert.equal((text.match(/navigator-data\.js/g)||[]).length,1,name+' no competing data tag');
    assert.equal((text.match(/navigator-widget\.js/g)||[]).length,1,name+' no competing widget tag');
    if(!rollout.addedPages[name])continue;
    const row=rollout.addedPages[name],original=restorePublicNavigator(name,raw);
    assert.equal(hash(raw),row.afterSha256,name+' current exact payload');
    assert.equal(hash(original),row.beforeSha256,name+' complete original payload');
    const sourceSha=row.sourceSha||rollout.baseSha;
    const committed=execFileSync('git',['show',sourceSha+':'+name],{cwd:root,maxBuffer:16e6});
    // A later explicitly reviewed source commit may already include this same
    // exact pair. Its complete payload must still match the current binding.
    const source=restorePublicNavigator(name,committed);
    assert.deepEqual(original,source,name+' unchanged teaching, math, controls, stores, inline scripts, styles and links relative to the explicit source commit');
    assert.deepEqual(restorePublicNavigator(name,original),original,name+' original identity');
  }
});
test('normalization cannot hide altered tags, missing or duplicate scripts, extra code, math or source edits',()=>{
  for(const name of ['trainers/oge-task6-fractions.html','geometry-course/textbook/index.html','stereo-course/textbook/index.html','ege-profil/trainers/stereo-t14.html','courses/vilenkin-6-part-1/textbook.html','soviet-math/arithmetic-practice.html']){
    const raw=fs.readFileSync(path.join(root,name)),text=raw.toString('utf8'),row=rollout.addedPages[name];
    for(const changed of [text.replace('defer src="/assets/assistant/navigator-data','async src="/assets/assistant/navigator-data'),text.replace(snippet,''),text.replace(snippet,snippet+snippet),text.replace('navigator-widget.js?v=20261105-site1','navigator-widget.js?v=other'),text.replace(snippet,snippet.replace('</script>','void "changed";</script>')),text+'\n<!-- changed teaching or runtime -->',text.replace('<title>','<title>Changed source '),text.replace(snippet,snippet.replace(' defer ',' onclick="changed()" defer '))]){
      assert.notEqual(changed,text,name+' effective negative probe');
      const result=restorePublicNavigator(name,Buffer.from(changed));
      // Removing both includes legitimately recovers the exact old file;
      // the current-page gate above still rejects that missing-feature probe.
      if(changed===text.replace(snippet,''))assert.equal(hash(result),row.beforeSha256);
      else assert.notEqual(hash(result),row.beforeSha256,name+' unknown change must fail historical identity');
      assert.notEqual(hash(Buffer.from(changed)),row.afterSha256,name+' current payload gate rejects every mutation');
    }
    assert.deepEqual(restorePublicNavigator('unrelated.html',raw),raw,'wrong route cannot normalize');
  }
});
test('sitemap coverage is complete with two dedicated learning interfaces',()=>{
  const xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>new URL(x[1]).pathname);
  assert.ok(urls.length>0,'public sitemap is not empty');
  assert.equal(new Set(urls).size,urls.length,'public sitemap paths are unique');
  assert.deepEqual(Object.keys(rollout.sitemap.excluded).sort(),['/oge/skills/','/school/peterson6/']);
  const offline=fs.readFileSync(path.join(root,'oge/skills/index.html'),'utf8');
  assert.doesNotMatch(offline,/<script\b[^>]*\bsrc\s*=/i,'The standalone skills course must run offline');
  for(const action of ['course','trainer','cabinet'])assert.ok(offline.includes('data-skill-link="'+action+'"'),'Built-in skills navigation: '+action);
  assert.ok(offline.includes('data-mathexam-home-link'),'The offline course keeps its home link');
  // The rollout receipt is historical; the live sitemap grows. Preserve all
  // historical hash/provenance checks above and validate every new public page.
  const exclusions=Object.keys(rollout.sitemap.excluded);
  for(const url of exclusions) assert.ok(urls.includes(url),'Dedicated route remains public: '+url);
  const [tag1,tag2]=snippet.trim().split('\n');
  let covered=0;
  for(const url of urls){
    if(exclusions.includes(url)){
      assert.equal(rollout.sitemap.excluded[url],'Existing dedicated task-aware helper; no competing launcher.',url);
      continue;
    }
    const file=url.slice(1)+(url.endsWith('/')?'index.html':'');
    assert(!/^(?:book|b|learning|downloads|docs|tools)\//.test(file),file);
    assert(!Object.hasOwn(rollout.excluded,file),'Previously excluded route requires review: '+file);
    const text=fs.readFileSync(path.join(root,file),'utf8');
    assert.equal(text.split(tag1).length,2,file+' exact data include');
    assert.equal(text.split(tag2).length,2,file+' exact widget include');
    assert.equal((text.match(/navigator-data\.js/g)||[]).length,1,file+' no competing data tag');
    assert.equal((text.match(/navigator-widget\.js/g)||[]).length,1,file+' no competing widget tag');
    covered++;
  }
  assert.equal(covered,urls.length-exclusions.length);
});

test('course DOM mirrors resolve public and page-relative scripts only inside the repository', t => {
  const os=require('node:os'),vm=require('node:vm');
  const {resolvePublicScript,loadSchoolModels}=require('./public-page-script.cjs');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'public-script-'));
  t.after(()=>fs.rmSync(temp,{recursive:true,force:true}));
  const site=path.join(temp,'site'),school=path.join(site,'school'),assets=path.join(site,'assets');
  fs.mkdirSync(school,{recursive:true});fs.mkdirSync(assets);
  fs.writeFileSync(path.join(assets,'shared.js'),'window.fixture=true;');
  fs.writeFileSync(path.join(school,'lesson.js'),'window.lesson=true;');
  fs.writeFileSync(path.join(temp,'outside.js'),'outside');
  fs.symlinkSync(path.join(temp,'outside.js'),path.join(school,'linked.js'));
  assert.equal(resolvePublicScript(site,school,'lesson.js?v=1'),path.join(school,'lesson.js'));
  assert.equal(resolvePublicScript(site,school,'/assets/shared.js?v=1'),path.join(assets,'shared.js'));
  assert.equal(resolvePublicScript(site,school,'../assets/shared.js'),path.join(assets,'shared.js'));
  for(const src of ['../../outside.js','/../outside.js','linked.js','//example.test/x.js','https://example.test/x.js',
    '/assets/%2e%2e/x.js','data:text/javascript,1','bad\\file.js','/assets/shared.js#altered']){
    assert.throws(()=>resolvePublicScript(site,school,src),src);
  }
  const world=vm.createContext({window:{}});
  loadSchoolModels(site,'<script defer src="lesson.js?v=1"></script>',world);
  assert.equal(world.window.lesson,true);
  assert.throws(()=>loadSchoolModels(site,'<script defer src="/assets/shared.js"></script>',world),/Unreviewed/);
});
