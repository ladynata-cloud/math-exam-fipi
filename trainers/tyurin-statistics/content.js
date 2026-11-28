/* Each form has a question, an exact numerical answer, the first operation and
   a diagnosis. The worked example uses a different instance from the check. */
(function () {
  'use strict';
  const lessons = new Map();
  function add(book, point, page, title, aim, rule, related, make) {
    const id = book + '-' + point;
    lessons.set(id, {id, book, point, page, title, aim, rule, related, make});
  }
  function choose(n, k) {
    let product = 1;
    for (let i = 1; i <= k; i++) product = product * (n - i + 1) / i;
    return Math.round(product);
  }
  function f(value) {
    const short = Math.round(value * 10000) / 10000;
    if (Math.abs(short - value) < 1e-10) return String(short).replace('.', ',');
    for (let d = 2; d <= 100000; d++) {
      const n = Math.round(value * d);
      if (Math.abs(n / d - value) < 1e-12) return n + '/' + d;
    }
    return String(value);
  }
  function example(caption, headers, rows, questions, chart) { return {caption, headers, rows, questions, chart}; }
  function task(prompt, answer, calculation, error) { return {prompt, answer, calculation, error}; }
  window.MathExamTopicPractice = window.TyurinStats = {lessons, add, choose, f, example, task};
})();
