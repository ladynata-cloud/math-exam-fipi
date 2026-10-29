(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VilenkinSourceLabels = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  // Points and paragraphs are different levels in the 2024 two-part edition.
  // Independently checked against the supplied printed contents (pp.160/144).
  const paragraphs = [
    {id:1, from:1, to:5, bookPart:1, chapter:'I', chapterTitle:'Смешанные числа', title:'Вычисления и построения'},
    {id:2, from:6, to:17, bookPart:1, chapter:'I', chapterTitle:'Смешанные числа', title:'Действия со смешанными числами'},
    {id:3, from:18, to:23, bookPart:1, chapter:'I', chapterTitle:'Смешанные числа', title:'Отношения и пропорции'},
    {id:4, from:24, to:36, bookPart:2, chapter:'II', chapterTitle:'Рациональные числа', title:'Действия с рациональными числами'},
    {id:5, from:37, to:40, bookPart:2, chapter:'II', chapterTitle:'Рациональные числа', title:'Решение уравнений'},
    {id:6, from:41, to:44, bookPart:2, chapter:'II', chapterTitle:'Рациональные числа', title:'Координаты на плоскости'}
  ].map(Object.freeze);
  function hierarchyForPoint(point) {
    if (!Number.isInteger(point)) return null;
    return paragraphs.find(p => point >= p.from && point <= p.to) || null;
  }
  function pointLabel(point) { return point === 0 ? 'Повторение за 5 класс' : `Пункт ${point}`; }
  function sectionLabel(point) {
    const p = hierarchyForPoint(point);
    return p ? `${pointLabel(point)} · § ${p.id} «${p.title}» · глава ${p.chapter} «${p.chapterTitle}» · часть ${p.bookPart}` : pointLabel(point);
  }
  function taskLabel(task) {
    const s = task.source;
    const title = s.kind === 'example' ? 'Разбор примера из учебника' : s.kind === 'question' ? 'Тренажёр к вопросу из учебника' : s.kind === 'check' ? 'Тренажёр к проверочной работе' : `Тренажёр к задаче № ${s.number}`;
    return title + (s.part ? ` · ${s.part}` : '');
  }
  return Object.freeze({paragraphs:Object.freeze(paragraphs), hierarchyForPoint, pointLabel, sectionLabel, taskLabel});
});
