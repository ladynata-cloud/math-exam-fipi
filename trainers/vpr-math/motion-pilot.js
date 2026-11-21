(function (root) {
  'use strict';

  const predictions = [
    { id: 'lower', label: 'Уменьшится', feedback: 'Прогноз подтвердился. Тот же путь занял больше времени.' },
    { id: 'same', label: 'Останется прежней', feedback: 'Путь в обоих случаях равен 12 км. Для средней скорости нужно учесть всё время, включая остановку.' },
    { id: 'higher', label: 'Увеличится', feedback: 'В формуле средней скорости время стоит в знаменателе. При том же пути больший знаменатель даёт меньшую скорость.' },
  ];
  const travelHours = 4;
  const distanceFromHome = 6;
  const path = 2 * distanceFromHome;
  const hours = [0, 1, 2, 3, 4, 5, 6];
  const distances = [0, 2, 4, 6];
  const x = hour => 35 + hour * 48;
  const y = distance => 132 - distance * 16;

  function diagram(points) {
    return `<svg viewBox="0 0 342 177" aria-hidden="true" focusable="false" class="motion-graph">
      <text x="35" y="15">Расстояние от дома, км</text>
      ${hours.map(hour => `<path class="motion-gridline" d="M${x(hour)} 36V132"/><text x="${x(hour)}" y="151" text-anchor="middle">${hour}</text>`).join('')}
      ${distances.map(distance => `<path class="motion-gridline" d="M35 ${y(distance)}H323"/><text x="25" y="${y(distance) + 4}" text-anchor="end">${distance}</text>`).join('')}
      <path class="motion-axis" d="M35 30V132H329"/>
      <polyline class="motion-trace" points="${points.map(([hour, distance]) => `${x(hour)},${y(distance)}`).join(' ')}"/>
      ${points.map(([hour, distance]) => `<circle class="motion-point" cx="${x(hour)}" cy="${y(distance)}" r="3.5"/>`).join('')}
      <text x="323" y="170" text-anchor="end">Время, ч</text>
    </svg>`;
  }

  function render(state) {
    const prediction = predictions.find(option => option.id === state?.prediction);
    const stop = prediction && state.stop === 2 ? 2 : 1;
    const points = [[0, 0], [2, distanceFromHome], [2 + stop, distanceFromHome], [travelHours + stop, 0]];
    return `<details class="motion-pilot"${prediction ? ' open' : ''}>
      <summary>Мини-опыт с графиком движения</summary>
      <div class="motion-content">
        <p>Турист идёт от дома и возвращается по той же дороге. Что произойдёт со средней скоростью за всю прогулку, если продлить остановку с 1 до 2 часов? Расстояния и скорости на участках движения те же.</p>
        ${prediction ? `<p><strong>Твой прогноз — ${prediction.label.toLowerCase()}.</strong></p>
          <div class="motion-controls" role="group" aria-label="Длительность остановки">
            <span>Остановка</span>
            ${[1, 2].map(duration => `<button type="button" class="btn secondary" data-action="motion-stop" data-stop="${duration}" aria-pressed="${duration === stop}"${duration === 2 && stop === 2 ? ' aria-describedby="motion-feedback"' : ''}>${duration} ч</button>`).join('')}
          </div>` : `<div class="motion-controls" role="group" aria-label="Твой прогноз">
            ${predictions.map(option => `<button type="button" class="btn secondary" data-action="motion-predict" data-prediction="${option.id}">${option.label}</button>`).join('')}
          </div>`}
        <div class="motion-layout">
          ${diagram(points)}
          <table class="motion-table" aria-label="Ключевые точки графика">
            <tbody>
              <tr><th scope="row">Время, ч</th>${points.map(point => `<td>${point[0]}</td>`).join('')}</tr>
              <tr><th scope="row">Расстояние от дома, км</th>${points.map(point => `<td>${point[1]}</td>`).join('')}</tr>
            </tbody>
          </table>
        </div>
        ${stop === 2 ? `<div id="motion-feedback" class="motion-feedback" role="status">
          <p><strong>${prediction.feedback}</strong></p>
          <p>Путь туда и обратно — 6 + 6 = ${path} км. Время с остановкой выросло с 5 до 6 ч. Средняя скорость уменьшилась с 12 ÷ 5 = 2,4 км/ч до 12 ÷ 6 = 2 км/ч.</p>
        </div>` : ''}
      </div>
    </details>`;
  }

  const reviewTask = {
    id: 'g7-process-graphs-review',
    level: 'exam',
    skill: 'mean-speed',
    prompt: 'Турист шёл по прямой дороге от дома. После остановки он повернул обратно и закончил прогулку в 2 км от дома. По таблице найди среднюю скорость за всю прогулку, включая остановку.\n\nВремя от выхода, ч: 0 | 1 | 2 | 4\nРасстояние от дома, км: 0 | 6 | 6 | 2',
    steps: [{
      prompt: 'Чему равна средняя скорость в км/ч?',
      answer: { kind: 'number', value: 2.5 },
      solution: 'Турист прошёл 6 км от дома и 6 − 2 = 4 км обратно. Весь путь — 10 км, время — 4 ч. Средняя скорость равна 10 ÷ 4 = 2,5 км/ч.',
    }],
    finalExplanation: 'На обратном пути турист прошёл только 4 км. Для средней скорости весь путь делим на всё время от выхода до окончания прогулки.',
  };

  root.VPRMotionPilot = { render, reviewTask };
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined') module.exports = globalThis.VPRMotionPilot;
