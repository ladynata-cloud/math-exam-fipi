'use strict';
// Route integrity, not mastery: every authored school activity remains reachable
// and only the same pupil's saved work can appear on a cabinet card.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const catalog=require('../learning/catalog'),guides=require('../learning/topic-guides'),map=require('../learning/grade7-route-map'),route=require('../learning/route');
const school=catalog.items.filter(item=>item.grade7),ids=map.stages.flatMap(stage=>stage.items);
assert.equal(school.length,62);assert.equal(ids.length,62);assert.equal(new Set(ids).size,62);
assert.deepEqual([...ids].sort(),school.map(item=>item.id).sort(),'The primary route covers every managed school activity once');
assert.equal(map.courses.find(c=>c.id==='algebra').stages.length,9);
const local=map.courses.find(c=>c.id==='algebra').stages.flatMap(stage=>stage.local);
assert.equal(local.length,24);assert.equal(new Set(local.map(item=>item.id)).size,24);
for(const lesson of local){assert.equal(lesson.url,'/school/index.html?course=makarychev7-start#lesson/'+lesson.id);}
const geo=map.courses.find(c=>c.id==='geometry');assert.equal(geo.stages.at(-1).id,'geometry-isosceles');
assert(!geo.stages.flatMap(stage=>stage.local).some(item=>['parallels','triangle-angles','right-triangle'].includes(item.id)),'Later geometry is optional after the requested scope');
assert(geo.more.some(item=>item.id==='triangle-angles'));
for(const course of map.courses)for(const lesson of [...course.stages.flatMap(stage=>stage.local),...(course.more||[])])assert(fs.existsSync(path.join(__dirname,'..',lesson.url.split('?')[0])),'Local destination exists: '+lesson.url);
const videoIds=new Set(map.stages.flatMap(stage=>map.videoIds(stage,guides)));
assert.equal(videoIds.size,68);assert.deepEqual([...videoIds].sort(),guides.items.map(item=>item.id).sort(),'Every actual paired topic is reachable from an ordered stage');
for(const item of school){assert(map.stageFor(item.id));for(const basis of route.prerequisites(item,catalog))assert(catalog.get(basis.id),'A prerequisite resolves to a real managed identity');}
for(const item of school.filter(item=>item.pre7||/^grade7-g-(core|practice)-/.test(item.contentId))){const guide=guides.forItem(item.id);assert(guide);assert.equal(guide.id,item.contentId);assert.equal(guide.catalogId,item.id);assert.equal(guide.publicUrl,'https://mathexam.space/ege-baza/path/index.html?practice=1#lesson='+item.contentId);}
const publicHtml=map.render({catalog,guides});assert.equal((publicHtml.match(/data-study-content=/g)||[]).length,62);assert(!publicHtml.includes('data-study-item='),'Public card uses explicit cabinet entry, no implicit attempt creation');assert.match(publicHtml,/текущем браузере/);assert.equal((publicHtml.match(/data-study-mode="ordered"/g)||[]).length,2);assert.equal((publicHtml.match(/data-study-mode="targeted"/g)||[]).length,2);assert.equal((publicHtml.match(/data-study-mode="check"/g)||[]).length,2);
const fixture=catalog.get('path:pre7-add-carry');const cabinet=map.render({catalog,guides,mode:'cabinet',learnerId:'fixture-one',labels:{started:'Продолжить эту работу',independent:'Другой ученик — скрыто'},attempts:[{learnerId:'fixture-one',trainerId:fixture.trainerId,contentId:fixture.contentId,outcome:'started',updatedAt:'2026-10-06T10:00:00Z'},{learnerId:'fixture-other',trainerId:fixture.trainerId,contentId:fixture.contentId,outcome:'independent',updatedAt:'2026-10-06T11:00:00Z'}]});assert(cabinet.includes('Продолжить эту работу'));assert(!cabinet.includes('Другой ученик'));assert.equal((cabinet.match(/data-study-item=/g)||[]).length,62);
console.log('GRADE7_ROUTE_MAP_OK: 62 distinct managed activities, 24 local algebra lessons, 68 paired video topics, geometry through isosceles, optional later materials, private per-task status.');
