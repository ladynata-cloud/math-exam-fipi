'use strict';
const {pages}=require('./fixtures/oge-source-alignment-20-22.json');

function restoreSourceAlignment(file, source) {
  const fragments = pages[file];
  if (!fragments || !fragments.every(({after})=>source.split(after).length===2)) return source;
  return fragments.reduce((text,{before,after})=>text.replace(after,()=>before), source);
}

module.exports = {restoreSourceAlignment};
