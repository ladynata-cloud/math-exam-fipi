// Every displayed digit follows a checked step in the shared trainer state.
(function () {
  'use strict';

  function ratioTable(step, complete) {
    return `<figure class="rd-model">
      <table class="rd-table"><caption>Тетради одной цены</caption>
        <thead><tr><th scope="col">Число тетрадей</th><th scope="col">Стоимость, ₽</th></tr></thead>
        <tbody>
          <tr><td>3</td><td>72</td></tr>
          ${step >= 1 ? '<tr class="rd-operation"><td>↓ × 2</td><td>↓ × 2</td></tr>' : ''}
          <tr><td>6</td><td>${complete ? '144' : '?'}</td></tr>
        </tbody>
      </table></figure>`;
  }

  // Each CSS grid column holds one place. A comma sits between places.
  function columnDivision(decimal, step) {
    const tensSolved = step >= (decimal ? 4 : 1);
    const remainderSolved = step >= (decimal ? 4 : 2);
    const commaSolved = decimal && step >= 5;
    const broughtDown = step >= (decimal ? 6 : 3);
    const unitsSolved = step >= (decimal ? 7 : 4);
    const checked = step >= (decimal ? 8 : 5);
    const num = decimal ? '7,2' : '72';
    const first = decimal ? 'единицы' : 'десятка';
    const second = decimal ? 'десятых' : 'единицы';
    const firstQuotient = tensSolved ? '2' : '';
    const spoken = [`Деление ${num} на 3 уголком.`];
    if (tensSolved) spoken.push(`В частном записаны 2 ${first}.`);
    if (remainderSolved) spoken.push(decimal ? 'Осталась одна единица.' : 'Остался один десяток.');
    if (commaSolved) spoken.push('После двух единиц в частном стоит запятая.');
    if (broughtDown) spoken.push(decimal ? 'После сноса цифры 2 получилось 12 десятых.' : 'После сноса цифры 2 получилось 12 единиц.');
    if (unitsSolved) spoken.push(`Следующая цифра частного означает 4 ${second}. Остаток равен нулю.`);

    const comma = '<span class="rd-comma">,</span>';
    const cells = [];
    function digit(row, col, contents, cls = '') {
      cells.push(`<span class="rd-cell ${cls}" style="grid-area:${row}/${col}">${contents}</span>`);
    }
    digit(1, 2, '7' + (decimal ? comma : '')); digit(1, 3, '2');
    cells.push('<span class="rd-corner" style="grid-area:1/4/3/6"></span>');
    cells.push('<span class="rd-divisor" style="grid-area:1/4/2/6">3</span>');
    digit(2, 4, firstQuotient + (commaSolved ? comma : ''), 'rd-result');
    if (tensSolved) { digit(2, 1, '−'); digit(2, 2, '6', 'rd-line'); }
    if (remainderSolved) digit(3, 2, '1');
    if (broughtDown) digit(3, 3, '2', 'rd-result');
    if (unitsSolved) {
      digit(2, 5, '4', 'rd-result');
      digit(4, 1, '−'); digit(4, 2, '1', 'rd-line'); digit(4, 3, '2', 'rd-line'); digit(5, 3, '0');
    }
    return `<figure class="rd-model">
      <figcaption>Запись уголком</figcaption>
      <div class="rd-column" role="img" aria-label="${spoken.join(' ')}">
        ${cells.join('')}
      </div>
      ${checked ? `<p class="rd-check">Проверка: ${decimal ? '2,4' : '24'} · 3 = ${num}.</p>` : ''}
    </figure>`;
  }

  function decimalDivisor(step) {
    const scaleKnown = step >= 3;
    const transformed = step >= 4;
    const solved = step >= 5;
    return `<figure class="rd-model">
      <figcaption>Как получить целый делитель?</figcaption>
      <table class="rd-table"><thead><tr><th scope="col">Делимое</th><th scope="col">Делитель</th></tr></thead><tbody>
        <tr><td>7,2</td><td>0,3</td></tr>
        ${scaleKnown ? '<tr class="rd-operation"><td>↓ × 10</td><td>↓ × 10</td></tr>' : ''}
        ${transformed ? '<tr><td>72</td><td>3</td></tr>' : ''}
      </tbody></table>
      ${solved ? '<p class="rd-check">7,2 : 0,3 = 72 : 3 = 24</p>' : ''}
    </figure>`;
  }

  function corridor(step, dividingByDecimal) {
    const lo = dividingByDecimal ? 20 : 2;
    const hi = dividingByDecimal ? 30 : 3;
    const value = dividingByDecimal ? 24 : 2.4;
    const loEntered = step >= 1;
    const hiEntered = step >= (dividingByDecimal ? 1 : 2);
    const solved = step >= (dividingByDecimal ? 5 : 7);
    const formatted = String(value).replace('.', ',');
    const labels = `Левая граница: ${loEntered ? lo : 'пока не задана'}. Правая граница: ${hiEntered ? hi : 'пока не задана'}.`;
    const relative = Math.round(100 * (value - lo) / (hi - lo));
    return `<figure class="rd-model rd-corridor"><figcaption>Мой коридор</figcaption>
      <div class="rd-axis" role="img" aria-label="${labels}${solved ? ' Частное ' + formatted + ' внутри коридора.' : ''}">
        <span class="rd-segment${hiEntered ? ' rd-defined' : ''}" aria-hidden="true"></span>
        <span class="rd-bound rd-low" aria-hidden="true">${loEntered ? lo : '?'}</span>
        <span class="rd-bound rd-high" aria-hidden="true">${hiEntered ? hi : '?'}</span>
        ${solved ? `<span class="rd-point" style="left:${relative}%" aria-hidden="true">${formatted}</span>` : ''}
      </div></figure>`;
  }

  const models = {
    'ratio-division-start': ratioTable,
    'ratio-equation-build': step => `<figure class="rd-model"><table class="rd-table">
      <caption>Альбомы одной цены</caption>
      <thead><tr><th scope="col">Число альбомов</th><th scope="col">Стоимость, ₽</th></tr></thead>
      <tbody><tr><td>4</td><td>80</td></tr><tr><td>7</td><td>${step>=2?'140':'x'}</td></tr></tbody>
      </table></figure>`,
    'ratio-division-whole': step => columnDivision(false, step),
    'ratio-division-tenths': step => corridor(step, false) + columnDivision(true, step),
    'ratio-division-shift': step => corridor(step, true) + decimalDivisor(step)
  };
  window.renderRatioDivisionModel = function (host, taskId, step, complete = false) {
    const draw = Object.hasOwn(models, taskId) ? models[taskId] : null;
    host.hidden = !draw;
    host.innerHTML = draw ? draw(step, complete) : '';
  };
})();
