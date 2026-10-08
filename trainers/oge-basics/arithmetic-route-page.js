(function () {
  'use strict';
  const A = window.PreOgeArithmetic;
  const $ = id => document.getElementById(id);
  const skill = new URLSearchParams(location.search).get('skill');
  const group = A.groups.find(g => g.id === skill);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function progress(s) {
    let text = 'Практика: самостоятельно ' + s.independent + ' (ориентир — 3)';
    if (s.solved > s.independent) text += ' · с помощью или исправлениями: ' + (s.solved - s.independent);
    if (s.viewed) text += ' · просмотрено решений: ' + s.viewed;
    if (s.guidedSolved) text += ' · подробный разбор: ' + s.guidedSolved + ' (без помощи: ' + s.guidedIndependent + ')';
    return text;
  }
  function report() {
    const sums = A.summaries();
    const lines = ['ПредОГЭ — арифметика', 'Результаты в этом браузере. Новые разные примеры; повторы не добавляют самостоятельных решений.'];
    for (const g of A.groups) for (const [id,title] of g.levels) {
      const s = sums[id];
      if (s.solved || s.viewed || s.guidedSolved) lines.push(title + ': ' + progress(s) + '.');
    }
    if (lines.length === 2) lines.push('Пока нет законченных примеров.');
    if (A.notice()) lines.push('Внимание: ' + A.notice());
    return lines.join('\n');
  }
  function render() {
    const sums = A.summaries();
    $('route-notice').hidden = !A.notice(); $('route-notice').textContent = A.notice();
    if (group) {
      $('route-overview').hidden = true; $('route-detail').hidden = false;
      $('route-title').textContent = group.title; $('route-lead').textContent = group.lead;
      document.title = group.title + ' — ПредОГЭ · MathExam';
      const next = group.levels.find(([id]) => sums[id].independent < 3);
      const selected = next || group.levels[group.levels.length - 1];
      $('start-title').textContent = next ? selected[1] : 'Пора проверить навык в заданиях';
      $('start-practice').href = next ? A.practiceURL(selected[0]) : group.checkpoint;
      $('start-practice').textContent = next ? 'Начать упражнение' : 'Открыть проверку';
      if (!next) $('start-note').textContent = 'В каждом упражнении уже есть 3 самостоятельных примера. Теперь попробуй применить навык в заданиях курса.';
      const guided = next && A.guidedURL(selected[0]);
      $('start-guided').hidden = !guided; if (guided) $('start-guided').href = guided;
      $('route-levels').innerHTML = group.levels.map(([id,title]) => '<li><div><a class="level-link" data-level="' + id + '" href="' + A.practiceURL(id) + '">' + esc(title) + '</a><span class="progress" data-progress="' + id + '">' + esc(progress(sums[id])) + '</span>' + (A.guidedURL(id) ? '<a class="level-detail" href="' + A.guidedURL(id) + '">Нужен более подробный разбор?</a>' : '') + '</div></li>').join('');
      $('route-checkpoint').href = group.checkpoint;
      const easier = A.groups.find(g => g.id === group.easier);
      $('route-easier').hidden = !easier;
      if (easier) { $('route-easier').href = '?skill=' + easier.id; $('route-easier').textContent = 'Вернуться к опоре: ' + easier.title.toLowerCase(); }
    } else {
      $('route-overview').innerHTML = A.groups.map(g => {
        const count = g.levels.filter(([id]) => sums[id].independent >= 3).length;
        return '<a class="skill-card" data-skill="' + g.id + '" href="?skill=' + g.id + '"><span class="skill-example">' + esc(g.example) + '</span><h2>' + esc(g.title) + '</h2><p>' + esc(g.lead) + '</p><span class="open">Выбрать упражнение →</span><span class="progress">' + (count ? 'По 3 самостоятельных примера: ' + count + ' из ' + g.levels.length + ' упражнений' : 'Можно начать с любого шага') + '</span></a>';
      }).join('');
    }
    const active = A.levels.filter(l => sums[l.id].solved || sums[l.id].viewed || sums[l.id].guidedSolved);
    $('route-summary').innerHTML = active.length ? active.map(l => '<p><b>' + esc(l.title) + '</b><br>' + esc(progress(sums[l.id])) + '</p>').join('') : '<p>Пока нет законченных примеров. Выбери упражнение выше.</p>';
  }
  $('route-report-copy').addEventListener('click', async () => {
    const text = report(); $('route-report-text').value = text;
    try { await navigator.clipboard.writeText(text); $('route-report-status').textContent = 'Скопировано. Теперь вставь текст в сообщение учителю.'; }
    catch (_) { $('route-report-text').hidden = false; $('route-report-text').focus(); $('route-report-text').select(); $('route-report-status').textContent = 'Выдели и скопируй текст ниже.'; }
  });
  window.addEventListener('storage', e => { if (e.key === null || e.key === A.guidedKey || e.key.startsWith(A.prefix)) render(); });
  window.addEventListener('pageshow', render);
  render();
})();
