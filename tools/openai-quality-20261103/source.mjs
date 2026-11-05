import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
export const ROOT=path.dirname(fileURLToPath(import.meta.url));
export const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
export const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'sources.json'),'utf8'));
export const sourceRoots={
 current:path.resolve(process.env.MATHEXAM_EVAL_CURRENT_ROOT||path.join(ROOT,'../../sources/current')),
 pr399:path.resolve(process.env.MATHEXAM_EVAL_ADAPTER_ROOT||path.join(ROOT,'../../sources/pr399'))
};
export function verifySources(){
 for(const kind of ['current','pr399'])for(const [rel,expected] of Object.entries(manifest[kind])){
  if(hash(fs.readFileSync(path.join(sourceRoots[kind],rel)))!==expected)throw Error('EVAL_SOURCE_CHANGED');
 }
 return true;
}
verifySources();
const read=(kind,file)=>import(pathToFileURL(path.join(sourceRoots[kind],'assistant-service/src',file)).href);
export const current=await read('current','tutor.js');
export const privacy=await read('current','privacy.js');
export const cabinets=await read('current','cabinet-topics.js');
export const dialogue=await read('current','dialogue.js');
export const adapter=await read('pr399','provider.js');
const errors=await read('pr399','errors.js');
export const {AssistantError,requireValue,exactKeys}=errors;
export const {containsSensitiveText}=privacy;
export const {validateModelAnswer}=current;

export const {assessAnswer}=await import(pathToFileURL(path.join(sourceRoots.current,'assistant-service/evaluation/answer-assessment.js')).href);
