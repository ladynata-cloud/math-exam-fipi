'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const slugs=['rounding-stepwise','teatr-formul-daily','ege-profile-vectors-trainer'];
const scripts=html=>[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))&&m[2].trim()).map(m=>m[2].replace(/\r\n/g,'\n'));
for(const slug of slugs)test(slug+': the download and ZIP retain every live inline engine',()=>{
 const live=fs.readFileSync(path.join(root,'trainers',slug+'.html'),'utf8');
 const folder=path.join(root,'downloads/trainers',slug),offline=fs.readFileSync(path.join(folder,slug+'.html'),'utf8');
 const downloaded=scripts(offline);for(const code of scripts(live))assert(downloaded.includes(code),'Exact inline engine is present in the downloadable HTML');
 assert.doesNotMatch(offline,/navigator-(data|widget)\.js/,'Online navigation is not an offline dependency');
 execFileSync('python3',['-c',
  'import sys,zipfile,pathlib\np=pathlib.Path(sys.argv[1]); slug=sys.argv[2]\nwith zipfile.ZipFile(p/(slug+"-package.zip")) as z:\n assert z.testzip() is None\n for name in [slug+".html",slug+"-deepseek-prompt.md"]:\n  assert z.read(name)==(p/name).read_bytes(),name\n',folder,slug],{cwd:root});
});
