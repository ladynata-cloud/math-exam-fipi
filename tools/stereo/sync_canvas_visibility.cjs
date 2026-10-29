'use strict';
// Keep offline canvas courses on exactly the same mathematical visibility core
// as the SVG renderer, without adding a network or script-loading dependency.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const sourcePath='stereo-course/assets/task-scene-viewer.js';
const targets=['stereo-course/assets/viewer.js','geometry-merzlyak/assets/viewer.js','geometry-pogorelov/assets/viewer.js'];
const start='  // BEGIN SHARED VISIBILITY CORE\n',end='  // END SHARED VISIBILITY CORE';
const targetStart='// BEGIN GENERATED VISIBILITY FALLBACK\n',targetEnd='// END GENERATED VISIBILITY FALLBACK';
function between(text,from,to){assert.equal(text.split(from).length,2,'one start marker');assert.equal(text.split(to).length,2,'one end marker');return text.split(from)[1].split(to)[0];}
function build(read=name=>fs.readFileSync(path.join(root,name),'utf8')){
 const core=between(read(sourcePath),start,end);assert.match(core,/^  function visibilityParts\(/);
 const canonical=read(targets[0]);between(canonical,targetStart,targetEnd);
 const output=canonical.replace(targetStart+between(canonical,targetStart,targetEnd)+targetEnd,targetStart+core+targetEnd);
 return {core,output};
}
function run(check=false){const {output}=build();for(const file of targets){if(check)assert.equal(fs.readFileSync(path.join(root,file),'utf8'),output,'exact shared core and identical canvas renderer: '+file);else fs.writeFileSync(path.join(root,file),output);}console.log('CANVAS_VISIBILITY_SYNC_OK: exact SVG core; three identical offline canvas renderers');}
if(require.main===module)run(process.argv.includes('--check'));
module.exports={build,between,sourcePath,targets,start,end,targetStart,targetEnd};
