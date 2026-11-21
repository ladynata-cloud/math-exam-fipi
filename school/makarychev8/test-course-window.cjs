'use strict';
const fs=require('node:fs');
// A learner's answers, lesson state and DOM stay private to each window. The
// generated textbook bank is immutable and shared, as a browser cache would be.
const {Script,runInNewContext}=require('node:vm');
const bankWindow={};
runInNewContext(fs.readFileSync(__dirname+'/data.js','utf8'),{window:bankWindow});
function freezeBook(value){
 if(!value||typeof value!=='object'||Object.isFrozen(value))return;
 Object.freeze(value);for(const child of Object.values(value))freezeBook(child);
}
freezeBook(bankWindow.MakarychevCourse);
const runtimeFiles=['../peterson6/math.js','task-graphs.js','check.js','models.js','app.js'];
const scripts=runtimeFiles.map(file=>new Script(fs.readFileSync(__dirname+'/'+file,'utf8'),{filename:file}));

function loadCourseWindow(dom){
 dom.window.MakarychevCourse=bankWindow.MakarychevCourse;
 for(const script of scripts)script.runInContext(dom.getInternalVMContext());
}
module.exports=loadCourseWindow;
