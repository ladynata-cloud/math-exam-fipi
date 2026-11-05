'use strict';
// Targeted regressions discovered independently while consolidating the files.
// These are illustrative cases, not an estimate of real-user accuracy.
const fs = require('fs'), path = require('path');
const api = require(path.resolve(process.argv[2] || 'assets/assistant/navigator-data.js'));
const cabinet = 'https://mathexam-board-ladynata.msk1.amvera.tech/learning/#route';
const cases = [
 {id:'exam-bare-number', turns:['ЕГЭ база','11'], goal:'ege-base', first:'/ege-baza/path/index.html#map'},
 {id:'oge-bare-number', turns:['Готовлюсь к ОГЭ','11'], goal:'oge', first:'/trainers/oge-task11-graphs-trainer.html'},
 {id:'no-exam-bare-grade', turns:['6'], goal:'school', kind:'clarify'},
 {id:'explicit-grade-over-exam', turns:['Готовлюсь к ОГЭ','Я в 6 классе','Номер 11'], goal:'school', kind:'clarify', text:/учебник/i},
 {id:'switch-to-base', turns:['Нужен ЕГЭ профиль','А теперь база','Задание 3'], goal:'ege-base', first:'/ege-baza/path/index.html#map'},
 {id:'switch-to-profile', turns:['ЕГЭ база','Теперь профиль','Задание 2'], goal:'ege-profile', first:'/trainers/ege-profile-vectors-trainer.html'},
 {id:'explicit-school-skill', turns:['ЕГЭ база номер 11','Я в 6 классе, надо делить уголком'], goal:'school', first:'/trainers/long-division-stepwise.html', count:1},
 {id:'free-fractions-topic', turns:['Хочу бесплатный тренажёр по дробям'], kind:'clarify', first:'/topics/obyknovennye-drobi/'},
 {id:'free-percent-topic', turns:['Нужен бесплатный тренажёр по процентам'], first:'/trainers/oge-basics/percentages/'},
 {id:'free-generic', turns:['Как мне учиться бесплатно?'], text:/бесплат/i, first:'/trainers/'},
 {id:'no-registration', turns:['Можно учиться без регистрации?'], first:'/trainers/'},
 {id:'price-lesson', turns:['Хочу посмотреть стоимость уроков'], first:'/lessons/#contact'},
 {id:'group-grade', turns:['У вас есть занятия в группе для 8 класса?'], first:'/lessons/#contact'},
 {id:'individual', turns:['Хочу индивидуальные занятия 55 минут'], first:'/lessons/#contact'},
 {id:'trial', turns:['Есть пробный урок?'], first:'/lessons/#contact'},
 {id:'book-child', turns:['Запишите дочь на занятия'], first:'/lessons/#contact'},
 {id:'teacher-role-not-booking', turns:['Я репетитор, нужен рабочий лист по процентам'], first:'/pedagogam/materialy/procenty/'},
 {id:'no-tutor-fractions', turns:['Не хочу платных занятий, нужны дроби'], first:'/topics/obyknovennye-drobi/'},
 {id:'parent-progress', turns:['Как посмотреть успехи моего ребёнка?'], first:cabinet},
 {id:'parent-explicit', turns:['Я мама шестиклассника, как посмотреть, что он решил?'], first:cabinet},
 {id:'square-equations', turns:['Нужен тренажер по решению квадратных уравнений, 8 класс'], first:'/equations/'},
 {id:'simple-equation', turns:['Я в 6 классе, реши 2x+5=11'], first:'/equations/'},
 {id:'divide-fractions', turns:['Делить дроби на дроби'], first:'/topics/obyknovennye-drobi/', count:1},
 {id:'generic-division', turns:['Как их делить?'], first:'/trainers/long-division-stepwise.html', count:1},
 {id:'no-pdf-vectors', turns:['Нужны интерактивные векторы, не пдф'], first:'/trainers/ege-profile-vectors-trainer.html'},
 {id:'no-pdf-percent', turns:['Я учитель, нужна работа на проценты, не PDF'], first:'/trainers/oge-basics/percentages/'},
 {id:'no-print-fractions', turns:['Нужна проверочная по дробям для 6 класса без распечатки'], first:'/topics/obyknovennye-drobi/'},
 {id:'privacy-dash', turns:['мой PIN — 1234'], kind:'privacy'},
 {id:'privacy-hyphen', turns:['пин-код - 4567'], kind:'privacy'},
 {id:'privacy-colon', turns:['Мой пин код: 1234'], kind:'privacy'},
 {id:'ordinary-number', turns:['задача 1234'], notKind:'privacy'},
 {id:'ordinary-answer', turns:['ответ 1234'], notKind:'privacy'},
 {id:'lost-pin', turns:['забыл пароль'], kind:'cabinet'},
 {id:'free-cabinet-priority', turns:['У меня бесплатный доступ, не могу войти в кабинет'], kind:'cabinet', first:cabinet},
 {id:'oge-practical-range', turns:['Задачи 1–5 ОГЭ'], first:'/trainers/oge-1-5-trainers/'},
 {id:'oge-practical-range-singular', turns:['ОГЭ задания 1-5'], first:'/trainers/oge-1-5-trainers/'},
 {id:'multiple-task-list', turns:['ОГЭ №6,13,19'], kind:'clarify'},
 {id:'grade-not-task', turns:['Нужны задачи 6 класс по дробям'], first:'/topics/obyknovennye-drobi/'},
 {id:'grade-not-task-division', turns:['Решаю задачи 6 класса, деление уголком'], first:'/trainers/long-division-stepwise.html'},
 {id:'explicit-number-remains-task', turns:['Я в 6 классе','номер 11'], kind:'clarify', text:/учебник/i},
 {id:'oge-course-entry', turns:['ОГЭ'], first:'/trainers/oge-course/'},
 {id:'choice-followup', turns:['Покажи графики для ОГЭ','Подобрать формулу'], first:'/trainers/oge-task11-graphs-trainer.html'},
 {id:'textbook', turns:['Макарычев 8 класс упражнение 53'], first:'/school/makarychev8/'},
];
const results = cases.map(c => {
 let state={}, r; const transcript=[];
 for(const q of c.turns) {r=api.respond({...state,text:q,pathname:'/'}); transcript.push({q,response:r});state={dialog:r.dialog,difficultyCount:r.difficultyCount,referralShown:r.referralShown};}
 const failures=[];
 if(c.first && r.links[0]?.url!==c.first) failures.push('first route');
 if(c.kind && r.kind!==c.kind) failures.push('kind');
 if(c.notKind && r.kind===c.notKind) failures.push('forbidden kind');
 if(c.goal && r.dialog?.goal!==c.goal) failures.push('goal');
 if(c.count && r.links.length!==c.count) failures.push('link count');
 if(c.text && !c.text.test(r.text)) failures.push('response text');
 return {id:c.id,ok:!failures.length,failures,transcript};
});
const report={total:results.length,passed:results.filter(x=>x.ok).length,failed:results.filter(x=>!x.ok).length,results};
fs.writeFileSync(process.argv[3]||'qa-independent/consolidation-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:results.filter(x=>!x.ok)},null,2));
process.exitCode=report.failed?1:0;
