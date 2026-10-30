'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/stereo-three-visibility.js'));
const targets=['trainers/ege-profile-stereometry-3d/js/visibility.js','ege-profil/trainers/stereo/js/visibility.js'];
for(const target of targets){const file=path.join(root,target);if(process.argv.includes('--check'))assert(source.equals(fs.readFileSync(file)),target+' must match the shared visibility source');else fs.writeFileSync(file,source);}
console.log('STEREO_THREE_LOCAL_COPIES_OK',targets.length);
