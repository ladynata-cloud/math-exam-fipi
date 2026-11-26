const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync(require('node:path').join(__dirname,'../../trainers/lesson-cycle/entry.js'),'utf8');
function setup(href,embedded=false){
 function el(tag){return {tag,dataset:{},children:[],append(...x){this.children.push(...x)},querySelector(selector){return this.children.find(x=>selector.includes('"'+x.dataset.mathexamLessonCycle+'"'))||null;}}}
 const window={location:new URL(href)};window.top=embedded?{}:window;const document={createElement:el};vm.runInNewContext(src,{window,document,URL,URLSearchParams,Set});return {api:window.MathExamLessonCycleEntry,anchor:el('section')};
}
for(const [topic,path] of [['area','oge-written-practice.html#area-workshop'],['prob','tyurin-statistics/?lab=condition#lesson/114-10'],['rate','college-functions/#rate-lab'],['motion','motion-grade6/#model']]){
 let {api,anchor}=setup('https://mathexam.space/trainers/'+path);let item=api.mount(anchor,topic);assert.equal(item.children[0].href,'https://mathexam.space/trainers/lesson-cycle/START.html?topic='+topic);assert.equal(item.children[0].target,'_blank');assert.equal(item.children[0].rel,'noopener noreferrer');assert.equal(api.mount(anchor,topic,{visible:false}),item);assert.equal(item.hidden,true);assert.equal(anchor.children.length,1);assert.equal(api.mount(anchor,'unknown'),null);}
for(const [url,embedded] of [['https://mathexam.space/trainers/college-functions/?board=1',false],['https://mathexam.space/trainers/motion-grade6/?learning=1',false],['https://mathexam.space/trainers/college-functions/',true],['file:///tmp/college-functions/index.html',false]]){let {api,anchor}=setup(url,embedded);assert.equal(api.mount(anchor,'rate'),null);assert.equal(anchor.children.length,0)}
console.log('PASS four canonical links, no duplicate entries, visibility toggle, board/learning/iframe/file exclusion (mock DOM).');
