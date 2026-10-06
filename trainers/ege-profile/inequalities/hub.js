(function(){
'use strict';
const {lessons,families}=window.ProfileInequalityLessons;
const host=document.getElementById('lesson-topics');
families.forEach((family,index)=>{
 const card=document.createElement('article');card.className='topic-card';
 const number=document.createElement('p');number.className='eyebrow';number.textContent='Тема '+(index+1)+' из '+families.length;
 const h=document.createElement('h3');h.textContent=family.title;
 const p=document.createElement('p');p.textContent=family.description;
 card.append(number,h,p);
 const links=document.createElement('div');links.className='variant-links';
 lessons.filter(l=>l.family===family.id).forEach((lesson,i)=>{
  const link=document.createElement('a');link.href='lesson.html?lesson='+lesson.id;link.dataset.lesson=lesson.id;
  let status='';try{const work=JSON.parse(localStorage.getItem(lesson.storageKey));if(work?.schema===1&&Array.isArray(work.solved)&&work.solved.length<=lesson.steps.length){status=work.solved.length===lesson.steps.length?' · пройден':work.solved.length?' · продолжить':'';}}catch(_){}
  link.textContent='Пример '+(i+1)+status;link.setAttribute('aria-label',family.title+': '+link.textContent);links.append(link);
 });
 card.append(links);host.append(card);
});
})();
