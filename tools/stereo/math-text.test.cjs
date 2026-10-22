'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../..'),d=new JSDOM('<main id="root"></main>',{runScripts:'outside-only'}),w=d.window,el=w.document.getElementById('root');
w.eval(fs.readFileSync(root+'/stereo-course/assets/math-text.js','utf8'));
const samples=[['1/3',1,'1','3'],['4π/3',1,'4π','3'],['(x² − 36)/(x + 6)',1,'(x² − 36)','(x + 6)'],['r/√(a²+b²)',1,'r','√(a²+b²)'],['12/3.',1,'12','3'],['6 м/с',0],['a/b/c',0],['sin(x)/2',0],['1/x²',1,'1','x²'],['1/(x)^2',0],['https://example.com/a',0],['текст/пример',0],['PA/PB',1,'PA','PB'],['BD/DC',1,'BD','DC'],['AF/FB',1,'AF','FB'],['km/h',0]];
function originalText(node){const copy=node.cloneNode(true);Array.from(copy.querySelectorAll('.stereo-fraction')).reverse().forEach(f=>f.replaceWith(f.querySelector('.stereo-numerator').textContent+'/'+f.querySelector('.stereo-denominator').textContent));return copy.textContent;}
for(const [text,count,numerator,denominator]of samples){el.textContent=text;w.StereoMath.formatFractions(el);assert.equal(el.querySelectorAll('.stereo-fraction').length,count,text);if(count){const f=el.querySelector('.stereo-fraction');assert.equal(f.children[0].textContent,numerator);assert.equal(f.children[1].textContent,denominator);assert.equal(f.getAttribute('role'),'math');}else assert.equal(el.textContent,text);assert.equal(originalText(el),text);}
// Render the complete authored denominator, while preserving unsupported
// function-numerator scope instead of guessing whether it means sin(x/2).
for(const [text,numerator,denominator]of [
 ['AB=d/cos φ.','d','cos φ'],['r=d/sinφ','d','sinφ'],['d/sin90°=d','d','sin90°'],
 ['KH/sin45°=9√2','KH','sin45°'],['S/cosα','S','cosα'],['d/cos(φ)','d','cos(φ)'],
 ['d/sin(180°−φ)','d','sin(180°−φ)'],['a/tg θ','a','tg θ'],['a/cos x','a','cos x'],
 ['6/√13','6','√13'],['a√2/2','a√2','2'],['n√(m²−n²)/m','n√(m²−n²)','m']
]){el.textContent=text;w.StereoMath.formatFractions(el);const f=el.querySelector('.stereo-fraction');assert.ok(f,text);assert.equal(f.children[0].textContent,numerator,text);assert.equal(f.children[1].textContent,denominator,text);assert.equal(originalText(el),text);}
for(const text of ['sin x/2','sin(x)/2','a/sinh','a/cos φx','a/cos(φ)^2','1/(x)^2','https://example.com/12/34']){el.textContent=text;w.StereoMath.formatFractions(el);assert.equal(el.querySelectorAll('.stereo-fraction').length,0,text);assert.equal(originalText(el),text);}
for(const text of ['48/16=3','49/13','12,5 см','54,25=217/4','16√3 см','5√11','√((10√3)² − 5²)','√((25/2)²+(25√3/2)²)','√(1+ctg²φ/4)']){
 el.textContent=text;w.StereoMath.formatFractions(el);assert.ok(el.querySelector('.stereo-math-atom'),text);assert.equal(originalText(el),text);const html=el.innerHTML;w.StereoMath.formatFractions(el);assert.equal(el.innerHTML,html,'idempotent '+text);
}
for(const text of ['8 2/3 см','−8 2/3 см','8\u00a02/3 см']){el.textContent=text;w.StereoMath.formatFractions(el);assert.equal(el.querySelectorAll('.stereo-mixed-number').length,1,text);assert.equal(originalText(el),text);}
el.textContent='x8 2/3';w.StereoMath.formatFractions(el);assert.equal(el.querySelectorAll('.stereo-mixed-number').length,0,'not a whole-number prefix');
// Every current textbook display string survives the renderer byte for byte
// after fraction markup is expanded. Source lessons and answer parsers remain
// unmodified, including nested radicals and decimal commas.
const course=JSON.parse(fs.readFileSync(root+'/stereo-course/textbook/data/course.json','utf8'));let checked=0;
function checkStrings(value){if(typeof value==='string'){el.replaceChildren();w.StereoMath.appendText(el,value);assert.equal(originalText(el),value,'authored text '+value);checked++;}else if(Array.isArray(value))value.forEach(checkStrings);else if(value&&typeof value==='object')for(const [key,child]of Object.entries(value))if(!['model','source','review'].includes(key))checkStrings(child);}
course.lessons.forEach(checkStrings);
el.innerHTML='<p>1/2 + 1/4</p><input value="1/2"><textarea>1/3</textarea><code>1/3</code><button>1/4</button><svg><text>1/2</text></svg><p>1/x<sup>2</sup></p>';const input=el.querySelector('input'),button=el.querySelector('button');let clicks=0;button.onclick=()=>clicks++;
w.StereoMath.formatFractions(el);w.StereoMath.formatFractions(el);assert.equal(el.querySelectorAll('.stereo-fraction').length,2);assert.strictEqual(el.querySelector('input'),input);assert.equal(input.value,'1/2');assert.strictEqual(el.querySelector('button'),button);button.click();assert.equal(clicks,1);assert.equal(el.querySelector('code').textContent,'1/3');assert.equal(el.querySelector('svg text').textContent,'1/2');assert.equal(el.querySelector('sup').previousSibling.textContent,'1/x');d.window.close();console.log('STEREO_MATH_TEXT_OK: fractions, indivisible atoms/mixed numbers, explicit trigonometric denominators, live controls; '+checked+' authored strings preserved');
