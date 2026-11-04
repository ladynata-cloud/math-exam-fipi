'use strict';
/* The original presentation/engine contracts are retained verbatim as a
 * comparison harness. Only the new outer adapter is omitted in this fixture.
 * Production HTML is tested separately, without transformation, by every
 * oge-practical-variant suite. No production legacy switch is introduced. */
module.exports=function retainedEngine(source){
 const text=Buffer.isBuffer(source)?source.toString('utf8'):String(source);
 if(!text.includes('data-practical-variant="1"'))return source;
 return text.replace(/ data-practical-variant="1"/g,'')
  .replace(/<script src="practical-variant(?:-[\w-]+)?\.js"><\/script>\s*/g,'')
  .replace(/<link rel="stylesheet" href="practical-variant\.css">\s*/g,'');
};
