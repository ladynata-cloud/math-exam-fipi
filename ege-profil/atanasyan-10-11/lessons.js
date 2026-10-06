(function(root){'use strict';
const families=[
 {id:'section',title:'Сечение через середины рёбер',text:'Средняя линия треугольника. Параллельность плоскостей. Площадь сечения.'},
 {id:'line-plane',title:'Угол прямой с плоскостью',text:'Сначала найдём проекцию. Затем выделим прямоугольный треугольник.'},
 {id:'dihedral',title:'Двугранный угол пирамиды',text:'Построим два перпендикуляра к ребру. Именно они образуют нужный угол.'},
 {id:'distance-plane',title:'Расстояние от точки до плоскости',text:'Найдём основание перпендикуляра. Обоснуем построение и вычислим длину.'},
 {id:'volume',title:'Параллельность и объём',text:'Шестиугольная пирамида: середины рёбер, угол между плоскостями и объём части тела.'},
 {id:'skew-distance',title:'Скрещивающиеся прямые',text:'Первый разбор: общий перпендикуляр. Почему расстояние измеряется именно по нему.'}
];
const lessons=[...(root.AtanasyanLessonsA||[]),...(root.AtanasyanLessonsB||[])].map(l=>({...l,storageKey:'mathexam.atanasyan15.'+l.id+'.v1',trainerId:'profile-atanasyan-'+l.id,apiName:'__atanasyanLesson',reportName:'stereometry-'+l.id+'.txt',reportPath:'lesson.html?lesson='+l.id,domainStepIndex:-1,initialDomainStepIndex:-1,solvedDomainHtml:''}));
root.AtanasyanCourse={families,lessons};
})(typeof window!=='undefined'?window:globalThis);
