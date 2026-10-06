(function (root) {
  'use strict';
  // Original examples. Tasks 1–3 are guided; 4–6 are reserved for independent work.
  const lessons = [];
  const n = value => {
    if (Number.isInteger(value)) return String(value).replace('-', '−');
    if (Math.abs(value * 100 - Math.round(value * 100)) < 1e-9) return String(Math.round(value * 100) / 100).replace('.', ',').replace('-', '−');
    for (let d = 2; d <= 1000; d++) if (Math.abs(value * d - Math.round(value * d)) < 1e-9) return String(Math.round(value * d)).replace('-', '−') + '/' + d;
    return String(value).replace('.', ',').replace('-', '−');
  };
  const sub = value => String(value).replace(/[0-9]/g, digit => '₀₁₂₃₄₅₆₇₈₉'[Number(digit)]);
  const powerText = (base, exponent) => String(base) + String(exponent).replace(/[-0-9]/g, digit => digit === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(digit)]);
  const sign = value => value < 0 ? ' − ' + n(-value) : ' + ' + n(value);
  const lin = (a, b) => (a === 1 ? 'x' : a === -1 ? '−x' : n(a) + 'x') + (b ? sign(b) : '');
  const S = (prompt, answer, hint, why, choices) => Object.assign({ prompt, answer, hint, why }, choices ? { choices } : {});
  const basic = '/equations/';
  const lesson = (id, position, title, summary, intro, why, prereq, tasks) => ({
    id, group: 'algebra', position, title, summary, intro, why, model: id,
    prereq: { title: 'Вспомнить основу', text: prereq, href: basic },
    links: [{ title: 'Линейные уравнения: ещё практика', href: basic }], tasks
  });
  const diagram = (left, right, stages, parts, domains = []) => ({ left, right, stages, parts, domains });

  lessons.push(lesson('eq-linear', 7, 'Линейное уравнение: x в обеих частях',
    'Собираем слагаемые с x слева, числа справа.',
    '<p>Из обеих частей равенства можно вычесть одно и то же число или выражение. Поэтому при переносе слагаемого через знак равенства его знак меняется.</p><p>В уравнении <b>5x + 2 = 3x + 10</b> вычтем 3x из обеих частей: <b>2x + 2 = 10</b>. Затем вычтем 2: <b>2x = 8</b>. Разделим обе части на 2: <b>x = 4</b>.</p>',
    'Каждое действие выполняем с обеими частями равенства.',
    '<p>5x − 3x = 2x. Чтобы найти неизвестный множитель в 2x = 8, делим 8 на 2.</p>',
    [[5, 2, 2, 4], [7, -3, 3, 5], [2, 6, 5, -3], [9, 4, 5, 2], [3, -7, 7, -2], [6, 5, 2, 1.5]].map(([a, b, c, x], i) => {
      const d = (a - c) * x + b, k = a - c, rhs = d - b;
      return { id: 'eq-linear-' + (i + 1), prompt: `Решите уравнение <b>${lin(a,b)} = ${lin(c,d)}</b>.`,
        steps: [
          S(`Вычтем ${n(c)}x из обеих частей. Найдите коэффициент при x слева: ${n(a)} − ${n(c)}.`, k,
            'Вычитаем только коэффициенты. Буква x сохраняется.', `Получилось ${lin(k,b)} = ${n(d)}.`),
          S(`Вычтем число ${n(b)} из обеих частей. Чему теперь равна правая часть: ${n(d)} − (${n(b)})?`, rhs,
            'Если вычитаем отрицательное число, получается сложение.', `${n(k)}x = ${n(rhs)}.`),
          S(`Разделите обе части на ${n(k)}. Найдите x.`, x,
            `Вычислите ${n(rhs)} : (${n(k)}).`, `x = ${n(x)}. Подстановка даёт ${n(a*x+b)} = ${n(c*x+d)}.`)
        ], answer: x, explanation: `${lin(a,b)} = ${lin(c,d)}. Вычитаем ${n(c)}x и ${n(b)} из обеих частей: ${n(k)}x = ${n(rhs)}. x = ${n(x)}. Проверка: обе части равны ${n(a*x+b)}.`,
        meta: { kind: 'linear-equation', a, b, c, d },
        diagram: diagram(lin(a,b), lin(c,d), [[lin(k,b),n(d)], [lin(k,0),n(rhs)], ['x',n(x)]], ['Слагаемые с x: '+lin(a,0)+' и '+lin(c,0), 'Числа без x: '+n(b)+' и '+n(d)]) };
    })));

  lessons.push(lesson('eq-rational', 7, 'Дробное уравнение: сначала знаменатель',
    'Исключаем деление на ноль, затем находим x.',
    '<p>Знаменатель дроби не может равняться нулю. Это ограничение нужно записать до преобразований.</p><p>Например, <b>12/(x − 1) = 3</b>. Сначала <b>x − 1 ≠ 0</b>, то есть <b>x ≠ 1</b>. Умножаем обе части на x − 1: <b>12 = 3(x − 1)</b>. Делим на 3: <b>x − 1 = 4</b>. Значит, <b>x = 5</b>; это разрешённое значение.</p>',
    'После умножения на знаменатель ограничение не исчезает.',
    '<p>В записи 12 : 4 = 3 число 4 — делитель. Чтобы найти делитель, делим 12 на 3.</p>',
    [[1,-2,24,6], [2,1,30,5], [-1,7,18,3], [3,-4,28,7], [2,-5,42,6], [-2,9,35,5]].map(([a,b,numerator,rhs],i) => {
      const pole=-b/a, den=numerator/rhs, ax=den-b, answer=ax/a;
      return { id:'eq-rational-'+(i+1), prompt:`Решите уравнение <b>${numerator}/(${lin(a,b)}) = ${rhs}</b>.`,
        steps:[
          S(`Знаменатель ${lin(a,b)} не должен равняться нулю. Какое значение x нужно исключить?`,pole,
            `Решите ${lin(a,b)} = 0: сначала вычтите ${n(b)}, затем разделите на ${n(a)}.`, `ОДЗ: x ≠ ${n(pole)}. При этом x дробь не определена.`),
          S(`Умножим обе части на ${lin(a,b)}. Получим ${numerator} = ${rhs} · (${lin(a,b)}). Чему равен знаменатель ${lin(a,b)}?`,den,
            `Разделите ${numerator} на ${rhs}.`, `${lin(a,b)} = ${n(den)}.`),
          S(`Вычтем ${n(b)} из обеих частей. Чему равно ${n(a)}x?`,ax,
            `Вычислите ${n(den)} − (${n(b)}).`, `${n(a)}x = ${n(ax)}.`),
          S(`Разделите обе части на ${n(a)}. Найдите x.`,answer,
            `Вычислите ${n(ax)} : (${n(a)}).`, `x = ${n(answer)}. Он не равен ${n(pole)}; знаменатель равен ${n(den)}, а ${numerator} : ${n(den)} = ${rhs}.`)
        ],answer,explanation:`ОДЗ: ${lin(a,b)} ≠ 0, то есть x ≠ ${n(pole)}. Умножаем на знаменатель: ${numerator} = ${rhs}(${lin(a,b)}). Тогда ${lin(a,b)} = ${n(den)}, ${n(a)}x = ${n(ax)}, x = ${n(answer)}. Знаменатель равен ${n(den)} ≠ 0: корень подходит.`,
        meta:{kind:'rational-equation',a,b,numerator,rhs},
        diagram:diagram(`${numerator}/(${lin(a,b)})`,String(rhs), [[`${numerator}/(${lin(a,b)})`,String(rhs)], [lin(a,b),n(den)], [lin(a,0),n(ax)], ['x',n(answer)]], ['Числитель: '+numerator,'Знаменатель: '+lin(a,b)], [{after:1,boundary:pole,relation:'≠'}]) };
    })));

  lessons.push(lesson('eq-quadratic',7,'Квадратное уравнение: два корня',
    'Находим дискриминант и выбираем корень, указанный в условии.',
    '<p>Для <b>x² + bx + c = 0</b> сначала находим <b>D = b² − 4c</b>. Если D &gt; 0, есть два корня: <b>x = (−b ± √D)/2</b>.</p><p>В этих задачах коэффициент при x² равен 1. Поэтому больший корень получается со знаком «+» перед √D, меньший — со знаком «−». Внимательно прочитайте, какой из них нужен.</p>',
    'Знак коэффициента b учитываем вместе с числом: например, (−7)² = 49, а −(−7) = 7.',
    '<p>√49 = 7. Деление относится ко всему числителю: (7 + 3)/2 = 5.</p>',
    [[2,5,'larger'],[-3,4,'smaller'],[-6,-2,'larger'],[1,7,'smaller'],[-5,3,'larger'],[-7,-4,'smaller']].map(([r1,r2,which],i)=>{
      const b=-(r1+r2),c=r1*r2,D=b*b-4*c,rad=Math.sqrt(D),selected=which==='larger'?'+':'−',numerator=-b+(which==='larger'?rad:-rad),answer=numerator/2;
      const poly='x²'+(b ? (b < 0 ? ' − ' : ' + ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x' : '')+sign(c);
      return {id:'eq-quadratic-'+(i+1),prompt:`Решите уравнение <b>${poly} = 0</b>. В ответ запишите <b>${which==='larger'?'больший':'меньший'} корень</b>.`,
        steps:[
          S(`Здесь b = ${n(b)}, c = ${n(c)}. Вычислите D = (${n(b)})² − 4 · (${n(c)}).`,D,
            'Сначала возведите b в квадрат. Отдельно вычислите 4c. Затем вычтите.',`D = ${D} > 0: корней два.`),
          S(`Найдите √${D}.`,rad,'Нужно неотрицательное число, квадрат которого равен D.',`√D = ${rad}.`),
          S(`Для ${which==='larger'?'большего':'меньшего'} корня берём знак «${selected}». Вычислите числитель: ${n(-b)} ${selected} ${rad}.`,numerator,
            'Пока не делите на 2. Найдите только числитель.',`Числитель равен ${n(numerator)}.`),
          S(`Теперь разделите ${n(numerator)} на 2. Запишите нужный корень.`,answer,
            'У всего числителя один знаменатель — 2.',`Нужный корень: ${n(answer)}. Оба корня: ${n(r1)} и ${n(r2)}.`)
        ],answer,explanation:`D = (${n(b)})² − 4 · (${n(c)}) = ${D}. √D = ${rad}. Корни: (${n(-b)} − ${rad})/2 = ${n(r1)} и (${n(-b)} + ${rad})/2 = ${n(r2)}. Требуется ${which==='larger'?'больший':'меньший'}: ${n(answer)}.`,
        meta:{kind:'quadratic-equation',b,c,which},
        diagram:diagram(poly,'0', [['D',String(D)], ['√D',String(rad)], ['Числитель',n(numerator)], ['x',n(answer)]], ['Коэффициент b: '+n(b),'Свободное слагаемое c: '+n(c)]) };
    })));

  lessons.push(lesson('eq-root',7,'Уравнение с квадратным корнем',
    'Записываем ограничение и убираем корень возведением в квадрат.',
    '<p>В действительных числах выражение под квадратным корнем должно быть <b>не меньше нуля</b>. Сам квадратный корень тоже неотрицателен.</p><p>Например, <b>√(2x + 1) = 3</b>. ОДЗ: <b>2x + 1 ≥ 0</b>, то есть <b>x ≥ −0,5</b>. Возводим обе части в квадрат: <b>2x + 1 = 9</b>. Отсюда x = 4. Проверка: √9 = 3.</p>',
    'Возведение в квадрат требует проверки в исходном уравнении. Здесь справа заранее дано неотрицательное число.',
    '<p>√25 = 5. При делении неравенства на отрицательное число его знак меняется.</p>',
    [[2,1,3], [3,-2,4], [-2,13,3], [4,-7,5], [-3,19,2], [5,-6,0]].map(([a,b,rhs],i)=>{
      const boundary=-b/a,relation=a>0?'≥':'≤',square=rhs*rhs,ax=square-b,answer=ax/a;
      return {id:'eq-root-'+(i+1),prompt:`Решите уравнение <b>√(${lin(a,b)}) = ${rhs}</b>.`,
        steps:[
          S(`Для корня нужно ${lin(a,b)} ≥ 0. При каком x выражение ${lin(a,b)} равно нулю?`,boundary,
            `Решите ${lin(a,b)} = 0. Найдите сначала ${n(a)}x, затем x.`,`Граница ОДЗ: ${n(boundary)}. Ноль под корнем разрешён, поэтому граница входит в ОДЗ.`),
          S(`Какой знак нужен: x … ${n(boundary)}?`,relation,
            a>0?'Делим на положительное число: знак сохраняется.':'Делим на отрицательное число: знак меняется на противоположный.',`ОДЗ: x ${relation} ${n(boundary)}.`,['≥','≤']),
          S(`Возведём обе части в квадрат. Вычислите ${rhs}².`,square,
            `Умножьте ${rhs} на ${rhs}.`,`${lin(a,b)} = ${square}.`),
          S(`Вычтем ${n(b)} из обеих частей. Чему равно ${n(a)}x?`,ax,
            `Вычислите ${square} − (${n(b)}).`,`${n(a)}x = ${n(ax)}.`),
          S(`Разделите ${n(ax)} на ${n(a)}. Найдите x.`,answer,
            'После вычисления подставьте x в исходное уравнение.',`x = ${n(answer)}. При подстановке под корнем ${square}, а √${square} = ${rhs}. ОДЗ выполнено.`)
        ],answer,explanation:`ОДЗ: ${lin(a,b)} ≥ 0, поэтому x ${relation} ${n(boundary)}. Обе части уравнения неотрицательны. После возведения в квадрат: ${lin(a,b)} = ${square}. Получаем x = ${n(answer)}. Проверка: √${square} = ${rhs}; корень подходит.`,
        meta:{kind:'root-equation',a,b,rhs},
        diagram:diagram('√('+lin(a,b)+')',String(rhs), [['√('+lin(a,b)+')',String(rhs)], ['√('+lin(a,b)+')',String(rhs)], [lin(a,b),String(square)], [lin(a,0),n(ax)], ['x',n(answer)]], ['Выражение под корнем: '+lin(a,b),'Правая часть: '+rhs], [{after:2,boundary,relation}]) };
    })));

  lessons.push(lesson('expr-powers',8,'Степени: одно основание',
    'При умножении складываем показатели, при делении вычитаем.',
    '<p>Для положительного a: <b>aᵐ · aⁿ = aᵐ⁺ⁿ</b> и <b>aᵐ/aⁿ = aᵐ⁻ⁿ</b>. Основание не меняется.</p><p>Например, (3⁴ · 3²)/3⁵ = 3⁴⁺²⁻⁵ = 3. Нулевая степень ненулевого числа равна 1. Отрицательная степень означает обратное число: <b>2⁻³ = 1/8</b>.</p>',
    'Не вычисляем большие степени по отдельности: сначала работаем с показателями.',
    '<p>В 2³ основание — 2, показатель — 3. Это 2 · 2 · 2.</p>',
    [[2,4,3,5],[3,5,2,7],[5,2,3,6],[4,3,2,3],[2,6,-2,5],[3,-1,4,2]].map(([base,p,q,r],i)=>{
      const combined=p+q,exponent=combined-r,answer=base**exponent;
      return {id:'expr-powers-'+(i+1),prompt:`Найдите значение <b>(${base}<sup>${n(p)}</sup> · ${base}<sup>${n(q)}</sup>)/${base}<sup>${n(r)}</sup></b>.`,
        steps:[
          S(`В числителе степени перемножаются. Сложите показатели: ${n(p)} + (${n(q)}).`,combined,
            'При одинаковом основании складываем показатели, а основание оставляем прежним.',`В числителе получилось ${base}^(${n(combined)}).`),
          S(`Теперь делим на ${base}<sup>${n(r)}</sup>. Найдите показатель: ${n(combined)} − (${n(r)}).`,exponent,
            'При делении степеней с одинаковым ненулевым основанием показатели вычитаются.',`Всё выражение равно ${base}^(${n(exponent)}).`),
          S(`Вычислите ${base}<sup>${n(exponent)}</sup>.`,answer,
            exponent===0?'Ненулевое число в нулевой степени равно 1.':exponent<0?`Это 1/${base}^${-exponent}. Ответ можно ввести дробью.`:'Возведите основание в найденную степень.',`Значение выражения: ${n(answer)}.`)
        ],answer,explanation:`(${base}^(${n(p)}) · ${base}^(${n(q)}))/${base}^(${n(r)}) = ${base}^(${n(p)} + (${n(q)}) − (${n(r)})) = ${base}^(${n(exponent)}) = ${n(answer)}.`,
        meta:{kind:'power-expression',base,p,q,r},
        diagram:diagram(`(${powerText(base,p)} · ${powerText(base,q)}) / ${powerText(base,r)}`,null, [[`${powerText(base,combined)} / ${powerText(base,r)}`,null], [powerText(base,exponent),null], [n(answer),null]], ['Общее основание: '+base,'Показатели: '+[p,q,r].map(n).join('; ')]) };
    })));

  lessons.push(lesson('expr-roots',8,'Квадратные корни: произведение, дробь, квадрат',
    'Объединяем корни и следим за знаком.',
    '<p>При a ≥ 0 и b ≥ 0: <b>√a · √b = √(ab)</b>. При a ≥ 0 и b &gt; 0: <b>√a/√b = √(a/b)</b>.</p><p>Квадратный корень не бывает отрицательным: <b>√(a²) = |a|</b>. Например, при a = −6 получим √(a²) = 6.</p>',
    'Перед объединением корней проверяем: выражения под корнями неотрицательны, знаменатель ненулевой.',
    '<p>√36 = 6, потому что 6 ≥ 0 и 6² = 36. Извлечение квадратного корня возвращает неотрицательное число.</p>',
    [['product',18,8],['quotient',72,2],['square',-7,0],['product',12,27],['quotient',175,7],['square',-9,0]].map(([kind,a,b],i)=>{
      let prompt,steps,answer,stages,parts;
      if(kind==='square'){
        answer=Math.abs(a)-a;prompt=`Найдите значение <b>√(a²) − a</b> при <b>a = ${n(a)}</b>.`;
        steps=[S(`Подставим a = ${n(a)}. Вычислите (${n(a)})².`,a*a,'Квадрат отрицательного числа положителен.',`Выражение под корнем равно ${a*a}.`),S(`Найдите √${a*a}.`,Math.abs(a),'Квадратный корень — неотрицательное число.',`√(a²) = ${Math.abs(a)}, а не ${n(a)}.`),S(`Вычислите ${Math.abs(a)} − (${n(a)}).`,answer,'При вычитании отрицательного числа получается сложение.',`Значение выражения: ${answer}.`)];
        stages=[['√'+a*a+' − ('+n(a)+')',null],[Math.abs(a)+' − ('+n(a)+')',null],[n(answer),null]];parts=['Дано: a = '+n(a),'Квадратный корень: √(a²)'];
      }else{
        const inner=kind==='product'?a*b:a/b;answer=Math.sqrt(inner);const op=kind==='product'?' · ':' / ';
        prompt=`Найдите значение <b>√${a}${op}√${b}</b>.`;
        steps=[S(`Объединим под одним корнем. Вычислите ${a}${op}${b}.`,inner,kind==='product'?'Оба числа под корнями положительны: их произведение можно поместить под один корень.':'Числитель неотрицателен, знаменатель положителен: частное можно поместить под один корень.',`Получилось √${inner}.`),S(`Найдите √${inner}.`,answer,'Нужно неотрицательное число, квадрат которого равен выражению под корнем.',`${answer}² = ${inner}, поэтому ответ ${answer}.`)];
        stages=[['√'+inner,null],[n(answer),null]];parts=['Первое число под корнем: '+a,'Второе число под корнем: '+b];
      }
      return{id:'expr-roots-'+(i+1),prompt,steps,answer,explanation:kind==='square'?`При a = ${n(a)} имеем √(a²) = √${a*a} = ${Math.abs(a)}. Поэтому √(a²) − a = ${Math.abs(a)} − (${n(a)}) = ${answer}.`:`${kind==='product'?'√'+a+' · √'+b+' = √('+a+' · '+b+')':'√'+a+'/√'+b+' = √('+a+'/'+b+')'} = √${kind==='product'?a*b:a/b} = ${answer}.`,meta:{kind:'root-expression',operation:kind,a,b},diagram:diagram(kind==='square'?'√(('+n(a)+')²) − ('+n(a)+')':'√'+a+(kind==='product'?' · ':' / ')+'√'+b,null,stages,parts)};
    })));

  lessons.push(lesson('expr-fractions',8,'Алгебраическая дробь: сократить множитель',
    'Разлагаем разность квадратов и помним запрещённое значение.',
    '<p><b>x² − k² = (x − k)(x + k)</b>. Поэтому дробь (x² − k²)/(x − k) можно сократить на общий множитель x − k, если <b>x ≠ k</b>.</p><p>В результате останется x + k. Сокращаем именно множитель, а не отдельное слагаемое. Ограничение x ≠ k сохраняется.</p>',
    'Сначала исключаем нулевой знаменатель. После сокращения подставляем данное число.',
    '<p>(x − 3)(x + 3) = x² − 9. Знаменатель дроби не может равняться нулю.</p>',
    [[3,-1,8],[4,1,7],[5,-1,-2],[6,1,10],[7,-1,11],[2,1,-5]].map(([k,denSign,x],i)=>{
      const denom=lin(1,denSign*k),other=lin(1,-denSign*k),pole=-denSign*k,answer=x-denSign*k;
      return {id:'expr-fractions-'+(i+1),prompt:`Найдите значение <b>(x² − ${k*k})/(${denom})</b> при <b>x = ${n(x)}</b>.`,
        steps:[
          S(`Знаменатель ${denom} не должен равняться нулю. Какое значение x запрещено?`,pole,
            `Решите ${denom} = 0.`,`ОДЗ: x ≠ ${n(pole)}. Данное x = ${n(x)} подходит.`),
          S(`Числитель равен (${lin(1,-k)})(${lin(1,k)}). Сократим общий множитель ${denom}. Что останется?`,other,
            'В числителе два множителя. Уберите тот, который совпадает со знаменателем.',`Получилось ${other}; при этом x ≠ ${n(pole)} по-прежнему.`,[lin(1,-k),lin(1,k),'1']),
          S(`Подставьте x = ${n(x)} в ${other}. Найдите значение.`,answer,
            `Вычислите ${n(x)} ${denSign===-1?'+':'−'} ${k}.`,`Значение дроби: ${n(answer)}.`)
        ],answer,explanation:`ОДЗ: ${denom} ≠ 0, то есть x ≠ ${n(pole)}. Числитель: x² − ${k*k} = (${lin(1,-k)})(${lin(1,k)}). Сокращаем ненулевой множитель ${denom}: остаётся ${other}. При x = ${n(x)} ответ ${n(answer)}.`,meta:{kind:'fraction-expression',k,denSign,x},
        diagram:diagram(`(x² − ${k*k})/(${denom})`,null, [[`(x² − ${k*k})/(${denom})`,null],[other,null],[n(answer),null]], ['Числитель: x² − '+k*k,'Знаменатель: '+denom], [{after:1,boundary:pole,relation:'≠'}]) };
    })));

  lessons.push(lesson('expr-logarithms',8,'Логарифмы: вычислить по определению',
    'Находим каждый показатель степени и выполняем действие.',
    '<p><b>log<sub>a</sub>b</b> — показатель степени, в которую нужно возвести a, чтобы получить b. Например, 2³ = 8, поэтому <b>log<sub>2</sub>8 = 3</b>.</p><p>Основание должно быть положительным и не равным 1. Число, от которого берут логарифм, должно быть положительным. При делении на логарифм его значение не должно быть нулём.</p>',
    'Сначала вычисляем каждый логарифм, затем складываем, вычитаем или делим полученные числа.',
    '<p>3⁴ = 81, поэтому log₃81 = 4. 5⁰ = 1, поэтому log₅1 = 0.</p>',
    [[2,5,3,'sum'],[3,4,2,'difference'],[5,3,2,'quotient'],[3,3,2,'sum'],[2,6,4,'difference'],[2,5,2,'quotient']].map(([base,p,q,operation],i)=>{
      const a=base**p,b=base**q,symbol=operation==='sum'?'+':operation==='difference'?'−':'/',answer=operation==='sum'?p+q:operation==='difference'?p-q:p/q;
      return {id:'expr-logarithms-'+(i+1),prompt:`Найдите значение <b>log<sub>${base}</sub>${a} ${symbol} log<sub>${base}</sub>${b}</b>.`,
        steps:[
          S(`В какую степень нужно возвести ${base}, чтобы получить ${a}?`,p,
            `Проверьте степени числа ${base}. Искомый показатель равен первому логарифму.`,`${base}^${p} = ${a}, поэтому первый логарифм равен ${p}.`),
          S(`В какую степень нужно возвести ${base}, чтобы получить ${b}?`,q,
            'Точно так же найдите второй логарифм.',`${base}^${q} = ${b}, поэтому второй логарифм равен ${q}.`),
          S(`Вычислите ${p} ${symbol} ${q}.`,answer,
            operation==='quotient'?'Разделите первое значение на второе. Второе значение не равно нулю.':'Теперь выполните действие, указанное между логарифмами.',`Значение выражения: ${n(answer)}.`)
        ],answer,explanation:`${base}^${p} = ${a}, значит log${sub(base)}${a} = ${p}. ${base}^${q} = ${b}, значит log${sub(base)}${b} = ${q}. Поэтому ответ ${p} ${symbol} ${q} = ${n(answer)}. Основание ${base} > 0 и не равно 1; оба аргумента положительны.${operation==='quotient'?' Знаменатель равен '+q+' ≠ 0.':''}`,meta:{kind:'log-expression',base,a,b,operation},
        diagram:diagram(`log${sub(base)}${a} ${symbol} log${sub(base)}${b}`,null, [[`${p} ${symbol} log${sub(base)}${b}`,null],[`${p} ${symbol} ${q}`,null],[n(answer),null]], ['Основание обоих логарифмов: '+base,'Аргументы: '+a+' и '+b]) };
    })));
  root.ProfileLessons = (root.ProfileLessons || []).concat(lessons);
  if (typeof module !== 'undefined' && module.exports) module.exports = lessons;
})(typeof globalThis !== 'undefined' ? globalThis : window);
