(function (root) {
  'use strict';
  // The first three tasks are guided; the last three are unseen independent checks.
  // Metadata contains givens, not an answer cache: mathematical tests solve from them.
  const S = (prompt, answer, hint, why) => ({ prompt, answer, hint, why });
  const fmt = n => String(n).replace('-', '−');
  const signed = n => n < 0 ? ` − ${-n}` : ` + ${n}`;
  const frac = (a, b) => `${fmt(a)}/${b}`;
  const prereq = (title, text, id) => ({ title, text, href: '#lesson/' + id });
  const base = { group: 'foundations', position: 'Основа для профиля' };
  const lessons = [];

  lessons.push({ ...base, id: 'bridge-fractions', title: 'Дроби: делить и сокращать',
    summary: 'Короткая подготовка к отношениям, тангенсу и алгебраическим выражениям.',
    intro: '<p>При делении на дробь умножаем на обратную: <b>a/b : c/d = a/b · d/c</b>. Делитель не должен быть нулём. Переворачиваем только вторую дробь.</p><p><b>Пример:</b> 3/8 : 9/4 = 3/8 · 4/9 = 12/72 = 1/6. Можно сократить множители заранее: 3 и 9 на 3, 4 и 8 на 4. В ответ разрешается ввести <b>1/6</b>; округлять не нужно.</p>',
    why: 'Отношение sin α / cos α — это такое же деление дробей.',
    prereq: prereq('Числитель и знаменатель', '<p>В записи 3/8 число 3 — числитель, 8 — знаменатель. Сокращаем оба на один ненулевой множитель. Сокращать отдельные слагаемые суммы нельзя.</p>', 'bridge-fractions'),
    tasks: [[3,10,9,5],[7,12,14,9],[5,18,10,3],[4,15,8,5],[9,14,3,7],[11,24,22,9]].map(([a,b,c,d], i) => ({
      id: `bridge-fractions-${i+1}`, prompt: `Вычислите <b>${frac(a,b)} : ${frac(c,d)}</b>. Ответ можно ввести обыкновенной дробью.`,
      steps: [
        S(`На какую дробь нужно умножить ${frac(a,b)} вместо деления на ${frac(c,d)}?`, d/c, 'Поменяйте местами числитель и знаменатель только у делителя.', `Деление на ${frac(c,d)} заменяем умножением на ${frac(d,c)}.`),
        S(`Запишем произведение как одну дробь. Чему равен её числитель ${a} · ${d}?`, a*d, 'Умножьте числители двух множителей.', 'Общий числитель найден; теперь вычислим знаменатель.'),
        S(`Чему равен знаменатель ${b} · ${c}?`, b*c, 'Умножьте знаменатели; знак деления уже заменён умножением.', 'Числитель и знаменатель можно сократить на общий делитель.'),
        S('Чему равно всё выражение? Введите точный ответ дробью или конечной десятичной дробью.', a*d/(b*c), `Сократите дробь ${a*d}/${b*c}.`, 'Это итоговый ответ исходного примера, а не промежуточное число.')
      ], answer: a*d/(b*c), explanation: `${frac(a,b)} : ${frac(c,d)} = ${frac(a,b)} · ${frac(d,c)} = ${a*d}/${b*c}. Дробь можно сократить.`, meta: { kind: 'bridge-fractions', a,b,c,d }
    }))
  });

  lessons.push({ ...base, id: 'bridge-signs', title: 'Знаки: минус и квадрат',
    summary: 'Различаем −a² и (−a)², чтобы не терять знак в тригонометрии.',
    intro: '<p>Сначала выполняем возведение в степень. Поэтому <b>−3² = −(3 · 3) = −9</b>, а <b>(−3)² = (−3) · (−3) = 9</b>.</p><p><b>Пример:</b> −2² + (−5)² = −4 + 25 = 21. Минус перед степенью относится к уже вычисленному квадрату. В скобках отрицательное число целиком возводится в квадрат.</p>',
    why: 'Квадрат синуса положителен или равен нулю, даже если сам синус отрицателен.',
    prereq: prereq('Два разных действия со знаком', '<p>При умножении двух отрицательных чисел получается положительное. При сложении отрицательного и положительного сравниваем их модули: −9 + 4 = −5.</p>', 'bridge-signs'),
    tasks: [[3,5],[6,2],[4,7],[8,3],[2,9],[7,4]].map(([a,b], i) => ({
      id: `bridge-signs-${i+1}`, prompt: `Вычислите <b>−${a}<sup>2</sup> + (−${b})<sup>2</sup></b>.`,
      steps: [
        S(`Чему равен ${a}² без минуса перед ним?`, a*a, 'Умножьте положительное число само на себя.', 'Сначала выполняется степень, затем минус перед ней.'),
        S(`Теперь чему равно −${a}²?`, -a*a, 'Поставьте минус перед найденным квадратом.', `Получили отрицательное число ${fmt(-a*a)}.`),
        S(`Чему равно (−${b})²?`, b*b, `Умножьте (−${b}) на (−${b}).`, 'Два отрицательных множителя дают положительное произведение.'),
        S('Сложите два полученных числа. Чему равно исходное выражение?', b*b-a*a, `Вычислите ${fmt(-a*a)} + ${b*b}.`, 'Скобки определили, к чему относится квадрат; теперь выполнено сложение.')
      ], answer: b*b-a*a, explanation: `−${a}² + (−${b})² = ${fmt(-a*a)} + ${b*b} = ${fmt(b*b-a*a)}.`, meta: { kind: 'bridge-signs', a,b }
    }))
  });

  lessons.push({ ...base, id: 'bridge-roots', title: 'Корни: не потерять модуль',
    summary: 'Корень из квадрата неотрицателен; отрицательным может быть результат вычитания.',
    intro: '<p><b>√a² = |a|</b>. Знак √ означает именно неотрицательный квадратный корень. Поэтому √((−4)²) = √16 = 4.</p><p><b>Пример:</b> √((−4)²) − √81 = 4 − 9 = −5. Оба корня неотрицательны, но их разность может быть отрицательной. Не путайте вычисление √16 = 4 с решением уравнения x² = 16: у уравнения два корня, 4 и −4.</p><p>Для дроби при a ≥ 0 и b &gt; 0: <b>√(a/b) = √a/√b</b>. Например, √(25/36) = √25/√36 = 5/6. Корень извлекаем отдельно из числителя и знаменателя; дробь не округляем.</p>',
    why: 'Когда из sin² α находим sin α, одного извлечения корня мало: знак синуса выбираем по углу.',
    prereq: prereq('Повторить квадрат отрицательного числа', '<p>(−4)² = 16. Затем √16 = 4. Минус у числа под квадратом не становится минусом перед корнем.</p>', 'bridge-signs'),
    tasks: [[-5,49],[-9,16],[-3,64],[-6,121],[-8,25],[-4,100]].map(([a,n], i) => {
      if(i===2 || i===5) {
        const numerator=i===2?49:121,denominator=i===2?64:144;
        const answer=Math.sqrt(numerator/denominator);
        return {id:`bridge-roots-${i+1}`,prompt:`Вычислите <b>√(${numerator}/${denominator})</b>. Введите точный ответ дробью.`,
          steps:[
            S(`Чему равен √${numerator} — корень из числителя?`,Math.sqrt(numerator),'Выберите неотрицательное число, квадрат которого равен числителю.','Корень из положительной дроби неотрицателен.'),
            S(`Чему равен √${denominator} — корень из знаменателя?`,Math.sqrt(denominator),'Найдите положительное число, квадрат которого равен знаменателю.','Корень из дроби равен отношению корней; знаменатель положителен.'),
            S('Найдите корень из исходной дроби.',answer,`Разделите ${Math.sqrt(numerator)} на ${Math.sqrt(denominator)} и введите дробь.`, 'Получено неотрицательное значение; при возведении в квадрат вернётся исходная дробь.')
          ],answer,explanation:`√(${numerator}/${denominator}) = √${numerator}/√${denominator} = ${Math.sqrt(numerator)}/${Math.sqrt(denominator)}.`,meta:{kind:'bridge-root-fraction',numerator,denominator}};
      }
      return ({
      id: `bridge-roots-${i+1}`, prompt: `Вычислите <b>√((${fmt(a)})<sup>2</sup>) − √${n}</b>.`,
      steps: [
        S(`Чему равно (${fmt(a)})² под первым корнем?`, a*a, 'Квадрат отрицательного числа положителен.', 'Теперь под первым корнем стоит положительное число.'),
        S(`Чему равен √${a*a}?`, Math.abs(a), 'Выберите неотрицательное число, квадрат которого равен подкоренному.', '√a² = |a|; у знака квадратного корня одно неотрицательное значение.'),
        S(`Чему равен √${n}?`, Math.sqrt(n), 'Найдите неотрицательное число, которое при умножении само на себя даёт подкоренное.', 'Вычитать будем значения двух корней.'),
        S('Вычтите второй корень из первого. Чему равно исходное выражение?', Math.abs(a)-Math.sqrt(n), `Вычислите ${Math.abs(a)} − ${Math.sqrt(n)}.`, 'Разность двух неотрицательных чисел может иметь любой знак.')
      ], answer: Math.abs(a)-Math.sqrt(n), explanation: `√((${fmt(a)})²) − √${n} = ${Math.abs(a)} − ${Math.sqrt(n)} = ${fmt(Math.abs(a)-Math.sqrt(n))}.`, meta: { kind: 'bridge-roots', a,n }
    });})
  });

  lessons.push({ ...base, id: 'bridge-equations', title: 'Уравнения: раскрыть скобки и собрать x',
    summary: 'Возвращаем уверенность в линейном уравнении, к которому сводятся степени и логарифмы.',
    intro: '<p>Работаем с обеими частями равенства одинаково. Раскрываем скобки, собираем слагаемые с x слева и числа справа, затем делим на коэффициент при x.</p><p><b>Пример:</b> 2(x − 3) = x + 5 → 2x − 6 = x + 5 → x − 6 = 5 → x = 11. Здесь вычли x из обеих частей, затем прибавили 6. Проверка: 2(11 − 3) = 16 и 11 + 5 = 16.</p>',
    why: 'После перехода от показательного или логарифмического уравнения часто остаётся именно такое равенство.',
    prereq: prereq('Если ошибка в знаке', '<p>При раскрытии k(x − a) получаем kx − ka. Если a отрицательно, x − (−a) превращается в сумму. Каждое действие выполняем с обеими частями уравнения.</p>', 'bridge-signs'),
    tasks: [[3,2,1,8],[4,-1,2,10],[2,5,-1,-4],[5,2,3,6],[3,-2,1,12],[4,3,1,-3]].map(([k,a,b,c], i) => {
      const bracket = a < 0 ? `x + ${-a}` : `x − ${a}`;
      const rhs = `${b===1?'':b===-1?'−':b}x${signed(c)}`;
      const coefficient = k-b, constant=c+k*a, answer=constant/coefficient;
      return { id: `bridge-equations-${i+1}`, prompt: `Решите уравнение <b>${k}(${bracket}) = ${rhs}</b>.`,
        steps: [
          S(`Раскройте скобки слева. Какое число стоит после ${k}x? Введите его со знаком.`, -k*a, `Умножьте ${k} на ${fmt(-a)}.`, `Слева получилось ${k}x${signed(-k*a)}.`),
          S(`Вычтем ${b===-1?'−x':b===1?'x':b+'x'} из обеих частей. Какой коэффициент останется при x слева?`, coefficient, `Вычислите ${k} − (${fmt(b)}).`, 'Теперь все слагаемые с x собраны слева.'),
          S(`Уберём число ${fmt(-k*a)} из левой части одинаковым действием с обеими частями. Какое число получится справа?`, constant, `Справа вычислите ${fmt(c)} − (${fmt(-k*a)}).`, `Получено ${coefficient}x = ${fmt(constant)}.`),
          S('Найдите x — это ответ исходного уравнения.', answer, `Разделите обе части на ${coefficient}.`, 'Проверить ответ можно подстановкой в исходное уравнение.')
        ], answer, explanation: `${k}(${bracket}) = ${rhs} → ${coefficient}x = ${fmt(constant)} → x = ${fmt(answer)}. При подстановке левая и правая части равны ${fmt(k*(answer-a))}.`, meta: { kind: 'bridge-equations', k,a,b,c } };
    })
  });

  lessons.push({ ...base, id: 'bridge-coordinates', title: 'Координаты: от точки к длине',
    summary: 'Читаем x и y, вычитаем координаты и применяем теорему Пифагора.',
    intro: '<p>В записи A(x; y) первая координата — движение вправо или влево, вторая — вверх или вниз. Для перемещения из A в B вычитаем <b>координаты начала из координат конца</b>.</p><p><b>Пример:</b> A(−2; 1), B(1; 5). По горизонтали: 1 − (−2) = 3; по вертикали: 5 − 1 = 4. Эти перемещения образуют катеты. Расстояние AB = √(3² + 4²) = √25 = 5.</p>',
    why: 'Координаты понадобятся и для векторов, и для чтения синуса и косинуса на окружности.',
    prereq: prereq('Вычитание отрицательного и квадратный корень', '<p>1 − (−2) = 3. Квадраты смещений складываем, затем извлекаем неотрицательный корень: расстояние не может быть отрицательным.</p>', 'bridge-roots'),
    tasks: [[-3,2,0,6],[2,-5,-3,7],[-4,-3,4,3],[1,-2,-5,6],[-7,4,8,-4],[5,6,-4,-6]].map(([x1,y1,x2,y2], i) => {
      const dx=x2-x1,dy=y2-y1,square=dx*dx+dy*dy,answer=Math.sqrt(square);
      return { id: `bridge-coordinates-${i+1}`, prompt: `Даны точки <b>A(${fmt(x1)}; ${fmt(y1)})</b> и <b>B(${fmt(x2)}; ${fmt(y2)})</b>. Найдите расстояние AB.`,
        steps: [
          S('Найдите горизонтальное перемещение xB − xA.', dx, `Вычислите ${fmt(x2)} − (${fmt(x1)}).`, 'Знак указывает направление по горизонтали.'),
          S('Найдите вертикальное перемещение yB − yA.', dy, `Вычислите ${fmt(y2)} − (${fmt(y1)}).`, 'Знак указывает направление по вертикали.'),
          S('Найдите сумму квадратов двух перемещений.', square, `Сложите (${fmt(dx)})² и (${fmt(dy)})².`, 'По теореме Пифагора это квадрат расстояния AB.'),
          S('Чему равно расстояние AB?', answer, `Извлеките неотрицательный корень из ${square}.`, 'Длина неотрицательна; направление перемещения её знак не меняет.')
        ], answer, explanation: `AB = √((${fmt(x2)} − (${fmt(x1)}))² + (${fmt(y2)} − (${fmt(y1)}))²) = √(${dx*dx} + ${dy*dy}) = ${answer}.`, meta: { kind: 'bridge-coordinates', x1,y1,x2,y2 } };
    })
  });

  function triangle(adjacent, opposite, hypotenuse) {
    // Coordinates use a single scale, so the diagram preserves the given side ratio.
    const scale = 190 / Math.max(adjacent, opposite);
    const cx=48,cy=240, ax=cx+adjacent*scale, by=cy-opposite*scale;
    const radius=Math.min(28,adjacent*scale*.3,opposite*scale*.3);
    const startX=ax-radius, endX=ax-radius*adjacent/hypotenuse, endY=cy-radius*opposite/hypotenuse;
    // Keep α next to vertex A, outside narrow triangles, clear of the right-angle mark.
    const alphaX=ax+10,alphaY=cy-18;
    return `<figure class="bridge-diagram" style="margin:1rem 0"><svg viewBox="0 0 300 280" style="width:100%;max-width:330px;height:auto" role="img" aria-label="Прямоугольный треугольник ABC: прямой угол C, угол альфа при A. AC равно ${adjacent}, BC равно ${opposite}, AB равно ${hypotenuse}."><path d="M ${cx} ${cy} L ${ax} ${cy} L ${cx} ${by} Z" fill="#eef6ff" stroke="#244869" stroke-width="2"/><path d="M ${cx} ${cy-10} h 10 v 10" fill="none" stroke="#244869" stroke-width="1.5"/><path d="M ${startX} ${cy} A ${radius} ${radius} 0 0 1 ${endX} ${endY}" fill="none" stroke="#a34e00" stroke-width="2"/><g fill="#182b3d" font-size="15" font-family="Arial,sans-serif"><text x="${cx-18}" y="${cy+18}">C</text><text x="${ax+8}" y="${cy+5}">A</text><text x="${cx-5}" y="${by-12}">B</text><text x="${(cx+ax)/2}" y="${cy+25}" text-anchor="middle">${adjacent}</text><text x="${cx-12}" y="${(cy+by)/2}" text-anchor="end">${opposite}</text><text x="${(cx+ax)/2+10}" y="${(cy+by)/2-8}">${hypotenuse}</text><text x="${alphaX}" y="${alphaY}" fill="#a34e00">α</text></g></svg><figcaption>∠C = 90°, α = ∠A. Длины указаны у сторон.</figcaption></figure>`;
  }
  lessons.push({ ...base, id: 'bridge-triangle', title: 'Синус и косинус: начать с треугольника',
    summary: 'Выбираем катет относительно отмеченного угла и делим на гипотенузу.',
    intro: '<p>В прямоугольном треугольнике гипотенуза лежит напротив прямого угла. Для выбранного острого угла <b>sin α = <span class="profile-solution-fraction" role="math" aria-label="Дробь: числитель катет, противолежащий углу α, знаменатель гипотенуза"><span class="profile-solution-numerator" aria-hidden="true">катет, противолежащий углу α</span><span class="profile-solution-denominator" aria-hidden="true">гипотенуза</span></span></b>, <b>cos α = <span class="profile-solution-fraction" role="math" aria-label="Дробь: числитель катет, прилежащий к углу α, знаменатель гипотенуза"><span class="profile-solution-numerator" aria-hidden="true">катет, прилежащий к углу α</span><span class="profile-solution-denominator" aria-hidden="true">гипотенуза</span></span></b>. Катет, расположенный напротив угла α, — противолежащий; второй катет — прилежащий к углу α.</p><p><b>Пример:</b> при ∠C = 90° и α = ∠A сторона BC противолежит углу α, AC прилежит к нему, AB — гипотенуза. Если BC = 6, AC = 8, AB = 10, то sin α = <span class="profile-solution-fraction" role="math" aria-label="Дробь: числитель 6, знаменатель 10"><span class="profile-solution-numerator" aria-hidden="true">6</span><span class="profile-solution-denominator" aria-hidden="true">10</span></span> = <span class="profile-solution-fraction" role="math" aria-label="Дробь: числитель 3, знаменатель 5"><span class="profile-solution-numerator" aria-hidden="true">3</span><span class="profile-solution-denominator" aria-hidden="true">5</span></span>, cos α = <span class="profile-solution-fraction" role="math" aria-label="Дробь: числитель 8, знаменатель 10"><span class="profile-solution-numerator" aria-hidden="true">8</span><span class="profile-solution-denominator" aria-hidden="true">10</span></span> = <span class="profile-solution-fraction" role="math" aria-label="Дробь: числитель 4, знаменатель 5"><span class="profile-solution-numerator" aria-hidden="true">4</span><span class="profile-solution-denominator" aria-hidden="true">5</span></span>. Если выбрать угол B, катеты поменяются ролями.</p>'+triangle(8,6,10),
    why: 'На единичной окружности гипотенуза станет радиусом 1; те же отношения превратятся в координаты.',
    prereq: prereq('Если трудно записать отношение', '<p>Числитель — нужный катет, знаменатель — гипотенуза. Ответ разрешается писать обычной дробью, например 3/5. Гипотенуза больше любого катета, поэтому синус и косинус острого угла находятся между 0 и 1.</p>', 'bridge-fractions'),
    tasks: [[4,3,5,'sin'],[5,12,13,'cos'],[15,8,17,'sin'],[24,7,25,'cos'],[20,21,29,'sin'],[9,40,41,'cos']].map(([adjacent,opposite,hypotenuse,fn], i) => {
      const side=fn==='sin'?opposite:adjacent,sideName=fn==='sin'?'BC':'AC',role=fn==='sin'?'противолежащего':'прилежащего';
      return { id: `bridge-triangle-${i+1}`, prompt: `В прямоугольном треугольнике ABC <b>∠C = 90°, α = ∠A</b>. AC = ${adjacent}, BC = ${opposite}, AB = ${hypotenuse}. Найдите <b>${fn} α</b>. Ответ можно ввести дробью.`+triangle(adjacent,opposite,hypotenuse),
        steps: [
          S('Чему равна гипотенуза AB — сторона напротив прямого угла C?', hypotenuse, 'Найдите сторону, расположенную напротив прямого угла C.', 'Гипотенуза будет знаменателем и у синуса, и у косинуса.'),
          S(`Для ${fn} α нужна длина ${role} катета. Чему она равна?`, side, fn==='sin'?'Катет BC — противолежащий углу α.':'Катет AC — прилежащий к углу α; AB — гипотенуза.', `${sideName} = ${side}; именно этот катет ставим в числитель.`),
          S(`Найдите ${fn} α: разделите выбранный катет на гипотенузу.`, side/hypotenuse, `Введите отношение ${side}/${hypotenuse}; округлять не нужно.`, 'Отношение меньше 1: катет короче гипотенузы.')
        ], answer: side/hypotenuse, explanation: `${fn} α = ${sideName}/AB = ${side}/${hypotenuse}. Угол выбран при A; относительно него BC — противолежащий, AC — прилежащий катет.`, meta: { kind: 'bridge-triangle', adjacent,opposite,hypotenuse,fn,angle:'A' } };
    })
  });

  root.ProfileLessons = (root.ProfileLessons || []).concat(lessons);
  if (typeof module !== 'undefined' && module.exports) module.exports = lessons;
})(typeof globalThis !== 'undefined' ? globalThis : window);
