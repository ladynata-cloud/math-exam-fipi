(function (root) {
  'use strict';
  var count = 0;

  function create(options) {
    options = options || {};
    var id = 'multiplication-refresh-' + (++count);
    var dialog = document.createElement('dialog');
    dialog.className = 'multiplication-refresh';
    dialog.setAttribute('aria-labelledby', id + '-title');
    dialog.setAttribute('aria-describedby', id + '-intro');
    dialog.setAttribute('aria-modal', 'true');
    dialog.innerHTML = '<div class="mr-content">' +
      '<div class="mr-heading"><h2 id="' + id + '-title">Вспомним таблицу умножения</h2><button type="button" class="mr-close" aria-label="Закрыть и вернуться к делению">×</button></div>' +
      '<p id="' + id + '-intro">После повторения вернёшься к тому же шагу деления.</p>' +
      '<label class="mr-factor-label" for="' + id + '-factor">Какую таблицу повторим?</label>' +
      '<select id="' + id + '-factor" class="mr-factor"><option value="0">Вперемешку</option></select>' +
      '<form class="mr-form" novalidate><label class="mr-question" for="' + id + '-answer"></label>' +
      '<div class="mr-answer-row"><input id="' + id + '-answer" class="mr-answer" type="text" inputmode="numeric" autocomplete="off"><button type="submit" class="mr-check">Проверить</button></div></form>' +
      '<p class="mr-feedback" role="status" aria-live="polite"></p>' +
      '<button type="button" class="mr-help">Покажи рядами точек</button>' +
      '<div class="mr-visual" hidden><div class="mr-dots" aria-hidden="true"></div><p class="mr-explanation"></p></div>' +
      '<div class="mr-actions"><button type="button" class="mr-next" disabled>Ещё пример</button><button type="button" class="mr-return">Вернуться к делению</button></div>' +
      '</div>';
    document.body.appendChild(dialog);
    var factor = dialog.querySelector('.mr-factor');
    var answer = dialog.querySelector('.mr-answer');
    var checkButton = dialog.querySelector('.mr-check');
    var nextButton = dialog.querySelector('.mr-next');
    var feedback = dialog.querySelector('.mr-feedback');
    var visual = dialog.querySelector('.mr-visual');
    var a = 2, b = 2, solved = false, isOpen = false, destroyed = false;
    var returnFocus = null, oldOverflow = '', inertSiblings = [];
    for (var n = 2; n <= 9; n++) {
      var option = document.createElement('option');
      option.value = String(n); option.textContent = 'На ' + n;
      factor.appendChild(option);
    }
    function setFeedback(text, correct) {
      feedback.textContent = text;
      feedback.className = 'mr-feedback' + (correct ? ' mr-correct' : '');
    }
    function next() {
      var previous = a + ':' + b;
      var chosen = Number(factor.value);
      a = chosen || (2 + Math.floor(Math.random() * 8));
      b = 1 + Math.floor(Math.random() * 10);
      if (a + ':' + b === previous) b = b % 10 + 1;
      solved = false;
      dialog.querySelector('.mr-question').textContent = a + ' × ' + b + ' = ?';
      answer.value = ''; answer.readOnly = false; checkButton.disabled = false;
      nextButton.disabled = true; visual.hidden = true;
      setFeedback('', false);
      if (isOpen) answer.focus();
    }
    function check(event) {
      if (event) event.preventDefault();
      if (solved) return;
      var text = answer.value.trim();
      if (!/^\d+$/.test(text)) { setFeedback('Введи ответ числом.', false); answer.focus(); return; }
      if (Number(text) !== a * b) {
        setFeedback('Пока не получилось. Попробуй ещё раз или посмотри на точки.', false);
        answer.select(); return;
      }
      solved = true;
      setFeedback('Верно: ' + a + ' × ' + b + ' = ' + (a * b) + '.', true);
      answer.readOnly = true; checkButton.disabled = true; nextButton.disabled = false;
      nextButton.focus();
    }
    function showHelp() {
      var dots = dialog.querySelector('.mr-dots'); dots.textContent = '';
      var sums = [];
      for (var row = 0; row < b; row++) {
        var line = document.createElement('div'); line.className = 'mr-dot-row';
        for (var col = 0; col < a; col++) { var dot = document.createElement('span'); dot.className = 'mr-dot'; line.appendChild(dot); }
        dots.appendChild(line); sums.push(a * (row + 1));
      }
      dialog.querySelector('.mr-explanation').textContent = 'В каждом ряду ' + a + ' точек. Рядов: ' + b + '. Прибавляй каждый раз ' + a + ': ' + sums.join(', ') + '.';
      visual.hidden = false;
    }
    function cleanup() {
      if (!isOpen) return;
      isOpen = false;
      dialog.classList.remove('mr-fallback');
      document.body.style.overflow = oldOverflow;
      inertSiblings.forEach(function (item) { item.node.inert = item.value; }); inertSiblings = [];
      if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') returnFocus.focus();
    }
    function close() {
      if (!isOpen) return;
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      cleanup();
    }
    function open(preferredFactor) {
      if (destroyed || isOpen) return;
      returnFocus = document.activeElement;
      var preferred = Number(preferredFactor);
      factor.value = Number.isInteger(preferred) && preferred >= 2 && preferred <= 9 ? String(preferred) : '0';
      next();
      oldOverflow = document.body.style.overflow;
      isOpen = true;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else {
        dialog.setAttribute('open', ''); dialog.classList.add('mr-fallback');
        Array.prototype.forEach.call(document.body.children, function (node) {
          if (node !== dialog) { inertSiblings.push({ node: node, value: node.inert }); node.inert = true; }
        });
      }
      document.body.style.overflow = 'hidden';
      if (typeof options.onHelp === 'function') options.onHelp();
      answer.focus();
    }
    dialog.querySelector('.mr-form').addEventListener('submit', check);
    factor.addEventListener('change', next);
    nextButton.addEventListener('click', next);
    dialog.querySelector('.mr-help').addEventListener('click', showHelp);
    dialog.querySelector('.mr-close').addEventListener('click', close);
    dialog.querySelector('.mr-return').addEventListener('click', close);
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
    dialog.addEventListener('close', cleanup);
    dialog.addEventListener('keydown', function (event) {
      // The parent trainer also uses arrows and Enter. Practice never advances it.
      event.stopPropagation();
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key === 'Tab') {
        var focusable = Array.prototype.filter.call(dialog.querySelectorAll('button,select,input'), function (node) { return !node.disabled && !node.hidden; });
        var first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    return { open: open, close: close, destroy: function () { close(); destroyed = true; dialog.remove(); } };
  }
  root.MultiplicationRefresh = { create: create };
})(window);
