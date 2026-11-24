'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{execFileSync}=require('node:child_process');
const {inventory}=require('./school-journey-inventory.cjs');
const sha='a'.repeat(40),origin='https://mathexam.space/';
const blob=(path,mode='100644',size=1)=>({path,type:'blob',mode,sha,size});
const xml=urls=>'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.map(u=>'<url><loc>'+u+'</loc></url>').join('')+'</urlset>';
test('exact source map, missing file, alias and symlink are distinct',()=>{
 const s=inventory(xml([origin,origin+'course/',origin+'legacy',origin+'missing.html',origin+'symlink.html']),[blob('sitemap.xml'),blob('index.html'),blob('course/index.html'),blob('legacy/index.html'),blob('symlink.html','120000')],sha);
 assert.equal(s.summary.urls,5);assert.equal(s.summary.regularHtml,3);assert.equal(s.summary.problemUrls,2);
 assert.equal(s.rows.find(r=>r.url===origin+'legacy').path,'legacy/index.html');
 assert.deepEqual(s.rows.find(r=>r.url.endsWith('missing.html')).problems,['missing-git-file']);
 assert.deepEqual(s.rows.find(r=>r.url.endsWith('symlink.html')).problems,['not-regular-file']);
 assert(Object.values(s.limits).every(v=>v===null));
});
test('reject foreign, repeated, query, fragment, unsafe or encoded paths',()=>{
 for(const urls of [[origin,origin],['https://elsewhere.test/a.html'],[origin+'../a.html'],[origin+'%2e%2e/a.html'],[origin+'a.html#x'],[origin+'a.html?q=1'],[origin+'a//b.html']])
   assert.throws(()=>inventory(xml(urls),[blob('sitemap.xml')],sha),undefined,urls.join(','));
 assert.throws(()=>inventory('<urlset><url><loc>'+origin+'</loc></url></urlset>',[blob('sitemap.xml')],sha));
 assert.throws(()=>inventory(xml([origin]),[blob('sitemap.xml'),blob('sitemap.xml')],sha));
});
test('committed baseline reproduces exactly from its original Git commit',()=>{
 const root=path.resolve(__dirname,'..');
 const saved=JSON.parse(fs.readFileSync(path.join(root,'docs/reports/school-journey-sitemap-20261124.json'),'utf8'));
 const actual=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'school-journey-inventory.cjs'),saved.commit],{cwd:root,encoding:'utf8',maxBuffer:5*1024*1024}));
 assert.deepEqual(actual,saved);assert.equal(actual.summary.urls,632);assert.equal(actual.summary.problemUrls,0);
});
