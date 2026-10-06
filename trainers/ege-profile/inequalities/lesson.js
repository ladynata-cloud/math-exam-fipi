(function(){
'use strict';
const lessons=window.ProfileInequalityLessons.lessons;
const requested=new URLSearchParams(location.search).get('lesson');
const lesson=lessons.find(l=>l.id===requested)||lessons[0];
window.MathExamGuidedLesson=lesson;
document.title=lesson.title+' · пошаговый разбор · MathExam';
document.getElementById('lesson-name').textContent=lesson.title;
document.getElementById('lesson-variant').textContent='Пример '+lesson.id.split('-').at(-1)+' из 3 · '+lesson.steps.length+' коротких шагов';
const at=lessons.findIndex(l=>l.id===lesson.id),next=lessons[at+1];
const link=document.getElementById('next-variant');
if(next){link.href='lesson.html?lesson='+next.id;link.textContent=next.family===lesson.family?'Следующий пример →':'Следующая тема →';}
else link.textContent='Вернуться к выбору темы →';
})();
