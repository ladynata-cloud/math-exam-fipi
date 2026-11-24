#!/usr/bin/env node
'use strict';
/* Read-only audit of a pinned Git snapshot. Does not fetch URLs or change the site. */
function inventory(sitemap,entries,commit) {
  const ORIGIN='https://mathexam.space';
  const SHA=/^[0-9a-f]{40}$/;
  if(!SHA.test(commit))throw Error('Expected an exact Git commit');
  const by=new Map();
  for(const e of entries){if(by.has(e.path))throw Error('Duplicate Git tree entry: '+e.path);by.set(e.path,e);}
  const xml=sitemap.trim();
  // This reads the repository's generated URL-set format, not arbitrary XML.
  if(!/<urlset\b[^>]*xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9"[^>]*>/.test(xml)||!/<\/urlset>$/.test(xml))throw Error('Unsupported sitemap format');
  const blocks=[...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
  if(!blocks.length||blocks.length!==[...xml.matchAll(/<loc>/g)].length)throw Error('Missing or repeated loc');
  const urls=blocks.map(m=>{const matches=[...m[1].matchAll(/<loc>([^<]+)<\/loc>/g)];if(matches.length!==1)throw Error('Each url must contain one loc');return matches[0][1];});
  if(new Set(urls).size!==urls.length)throw Error('Duplicate sitemap URL');
  const rows=[];
  for(const url of urls.sort()){
    if(!url.startsWith(ORIGIN+'/')||/[?#\\\s\x00-\x1f&]/.test(url))throw Error('Unsupported sitemap URL: '+url);
    const encoded=url.slice(ORIGIN.length+1),relative=decodeURIComponent(encoded);
    if(relative!==encoded||relative.includes('//')||relative.split('/').some(x=>x==='.'||x==='..')||relative.includes('\\'))throw Error('Unsafe or encoded sitemap path: '+url);
    const initial=relative===''||relative.endsWith('/')?relative+'index.html':relative;
    const path=!by.has(initial)&&by.has(initial+'/index.html')?initial+'/index.html':initial;
    const entry=by.get(path);
    const problems=[];
    if(!entry)problems.push('missing-git-file');
    else if(entry.type!=='blob'||!['100644','100755'].includes(entry.mode))problems.push('not-regular-file');
    if(!path.endsWith('.html'))problems.push('not-html');
    if(entry&&(!SHA.test(entry.sha)||!Number.isSafeInteger(entry.size)||entry.size<0))problems.push('invalid-blob-metadata');
    rows.push({url,path,blob:entry?.sha??null,bytes:entry?.size??null,problems});
  }
  const groups={};
  for(const row of rows){const group=row.url.slice(ORIGIN.length+1).split('/')[0]||'(home)';groups[group]=(groups[group]||0)+1;}
  const sitemapEntry=by.get('sitemap.xml');
  if(!sitemapEntry||sitemapEntry.type!=='blob'||!SHA.test(sitemapEntry.sha))throw Error('Missing sitemap blob');
  return {schemaVersion:1,kind:'git-source-inventory-not-live-crawl',commit,sitemapBlob:sitemapEntry.sha,summary:{urls:rows.length,regularHtml:rows.filter(r=>!r.problems.length).length,problemUrls:rows.filter(r=>r.problems.length).length,groups},limits:{httpStatus:null,searchIndexStatus:null,canonicalFromLive:null,pedagogicalReview:null},rows};
}
module.exports={inventory};
if(require.main===module){
  const {execFileSync}=require('node:child_process');
  try{
    const argv=process.argv.slice(2);
    if(argv.length>1||argv.some(x=>x.startsWith('-')))throw Error('Usage: node tools/school-journey-inventory.cjs [commit-or-ref]');
    const git=(args)=>execFileSync('git',args,{encoding:'utf8',cwd:require('node:path').resolve(__dirname,'..'),maxBuffer:40*1024*1024});
    const commit=git(['rev-parse','--verify','--end-of-options',(argv[0]||'HEAD')+'^{commit}']).trim();
    if(!/^[0-9a-f]{40}$/.test(commit))throw Error('Unexpected commit SHA');
    const entries=git(['ls-tree','-r','-z','--long',commit]).split('\0').filter(Boolean).map(line=>{
      const tab=line.indexOf('\t');
      if(tab<0)throw Error('Malformed ls-tree entry');
      const [mode,type,sha,size]=line.slice(0,tab).trim().split(/\s+/);
      return {mode,type,sha,size:size==='-'?null:Number(size),path:line.slice(tab+1)};
    });
    const snapshot=inventory(git(['show',commit+':sitemap.xml']),entries,commit);
    process.stdout.write(JSON.stringify(snapshot,null,2)+'\n');
    if(snapshot.summary.problemUrls)process.exitCode=1;
  }catch(error){process.stderr.write('Inventory: '+error.message+'\n');process.exitCode=1;}
}
