/* Виленкин и соавторы, 5 класс, часть 2, §26, печатная страница 18. */
(function (root) {
  'use strict';
  const lessonRows = [
    [86, 'На какой отметке тропы Савкина горка?', 'Отсчитывай путь от Тригорского. Раздели всю тропу на равные участки и дойди до нужной отметки.', 'На тропе длиной 2 км четверть пути от старта находится в 500 м от старта.', 'Расстояние, которое осталось пройти до финиша, совпадает с пройденным.'],
    [87, 'Сколько атласа осталось у костюмеров?', 'Обе труппы берут ткань из одного рулона. Измерь каждый отрез от исходной длины, затем вычти оба.', 'Из 120 м взяли четверть и треть всей ткани. Отрезали 30 м и 40 м. В рулоне осталось 50 м.', 'Вторую долю нужно вычислить от длины после первого отреза.'],
    [88, 'Сколько длился концерт?', 'Переведи известное время в минуты. Узнай длительность одной равной части концерта и восстанови полную длительность.', 'Половина концерта длилась 50 минут. Полный концерт занял 100 минут, или 1 ч 40 мин.', 'Известное время до антракта — это время всего концерта.'],
    [89, 'Сколько зерна было до отгрузки?', 'Грузовик забрал несколько равных по массе долей. Найди массу одной доли, затем собери из долей весь запас.', 'Если три четверти запаса весят 21 т, одна четверть весит 7 т. Первоначально было 28 т.', 'При делении известной массы на знаменатель всегда получается масса одной доли.']
  ];
  const lessons = lessonRows.map(([n, title, explanation, example, misconception]) => ({
    number: '5.' + n, key: 'printed-5-' + n, part: 2, point: 26, page: 18, title,
    requires: ['v5f-printed-5-46'], related: ['v5f-printed-5-85'], explanation,
    worked: [example], misconception, reflect: 'Покажи на рисунке ту величину, которая известна из условия.'
  }));
  const error = (value, text) => ({value, text});
  function route(seed, random, step) {
    const km = seed ? random(1, 9) : 3, metres = km * 1000;
    const fifth = metres / 5, count = seed ? random(2, 4) : 4;
    const intro = 'Тропа между Тригорским и Михайловским имеет длину ' + km + ' км. От Тригорского до Савкиной горки — ' + count + '/5 всей тропы.';
    return {
      steps: [step(intro + ' Сколько метров между усадьбами?', metres, 'В каждом километре 1000 м.', [error(km, 'Это километры. Переведи их в метры.')]),
        step('Тропу разделили на пять равных участков. Какова длина одного участка в метрах?', fifth, 'Раздели расстояние между усадьбами на пять.', [])],
      prompt: intro + ' Сколько метров от Тригорского до горки?', answer: fifth * count, inputPrompt: 'Расстояние в метрах',
      why: 'Пройди по рисунку от старта до отметки горки и сложи длины пройденных участков.',
      errors: [error((5-count)*fifth, 'Ты измерил от другого конца тропы. Начни отсчёт от Тригорского.')],
      data: {storyStrip: {n:86, metres, count}}, conditionKey: 'estate/' + km + '/' + count
    };
  }
  function cloth(seed, random, step) {
    const total = seed ? random(3, 17) * 40 : 400, stage = total*3/8, dance = total*2/5;
    const intro = 'Для театра привезли ' + total + ' м атласа. На сценические костюмы ушло 3/8 всего рулона, на танцевальные — 2/5 всего рулона.';
    return {
      steps: [step(intro + ' Сколько метров взяли на сценические костюмы?', stage, 'Одна восьмая — это вся длина, делённая на восемь. Возьми три таких доли.', []),
        step('Сколько метров отрезали танцорам?', dance, 'Каждая пятая берётся от первоначальной длины рулона.', [
          error((total-stage)*2/5, 'Ты взял две пятых от остатка. Обе доли в условии относятся к полному рулону.')])],
      prompt: intro + ' Сколько метров ткани ещё в рулоне?', answer: total-stage-dance, inputPrompt: 'Остаток, м',
      why: 'Сложи два отреза и вычти их длину из первоначальной длины.',
      errors: [error(stage+dance, 'Это два использованных отреза вместе. На рисунке остаток — светлая часть.')],
      data: {storyStrip: {n:87, total}}, conditionKey: 'satin/' + total
    };
  }
  function concert(seed, random, step) {
    const hours = seed ? random(1, 4) : 2, before = hours * 60, one = before / 3;
    const intro = 'До антракта оркестр играл ' + hours + ' ч. Это три пятых времени всего концерта.';
    return {
      steps: [step(intro + ' Сколько минут оркестр играл до антракта?', before, 'Переведи часы в минуты.', []),
        step('Три равные части длились ' + before + ' мин. Сколько минут длилась одна такая часть?', one, 'Раздели известное время на число уже сыгранных частей.', [
          error(before/5, 'Известна длительность трёх частей. Чтобы получить одну, раздели минуты на три.')])],
      prompt: intro + ' Сколько минут длился весь концерт?', answer: one * 5, inputPrompt: 'Время в минутах',
      why: 'Каждая пятая длилась ' + one + ' мин. Все пять частей заняли ' + one*5 + ' мин, или ' + Math.floor(one*5/60) + ' ч ' + one*5%60 + ' мин.',
      errors: [error(before, 'Это только музыка до антракта. Нужны все пять частей.')],
      data: {storyStrip: {n:88, before}}, conditionKey: 'concert/' + before
    };
  }
  function grain(seed, random, step) {
    const one = seed ? random(3, 14) : 6, taken = 8*one;
    const intro = 'Со склада увезли ' + taken + ' т зерна. Это восемь одиннадцатых первоначального запаса.';
    return {
      steps: [step(intro + ' Сколько тонн весила одна одиннадцатая?', one, 'В отправленной партии восемь одинаковых долей.', [
        error(taken, 'Это вес всей отправленной партии. Раздели его между восемью долями.')])],
      prompt: intro + ' Сколько тонн зерна было на складе сначала?', answer: 11*one, inputPrompt:'Запас в тоннах',
      why: 'Восстанови исходный запас из одиннадцати равных долей.',
      errors: [error(3*one, 'Это три доли, оставшиеся после отгрузки. Сколько весят все одиннадцать?')],
      data:{storyStrip:{n:89, taken}}, conditionKey:'grain/' + taken
    };
  }
  function plot(p, selected) {
    const svg = (content, caption) => '<figure style="margin:.5em 0"><svg viewBox="0 0 296 85" style="display:block;width:100%;max-width:440px" role="img" aria-label="'+caption+'">'+content+'</svg><figcaption>'+caption+'</figcaption></figure>';
    if (p.n === 86) {
      let trail = '<path d="M14 45H282" stroke="#71888a" stroke-width="4"/><path d="M14 45H'+(14+selected*53.6)+'" stroke="#236947" stroke-width="6"/>';
      for(let i=0;i<=5;i++) trail += '<circle cx="'+(14+i*53.6)+'" cy="45" r="4.5" fill="#fff" stroke="#2d5753" stroke-width="2"/>';
      trail += '<path d="M'+(14+p.count*53.6)+' 37v-18l12 5-12 5" fill="#ba5c3d" stroke="#903e25" stroke-width="2"/>';
      return svg(trail, 'Слева Тригорское, справа Михайловское. Флажок — горка. Зелёным пройдено '+selected+' из 5 участков.');
    }
    const d = p.n===87 ? 40 : p.n===88 ? 5 : 11;
    const count = p.n === 87 ? [0,15,31][selected] : selected;
    const caption = p.n===87 ? ['Целый рулон. Каждая клетка — одна сороковая.','Первый отрез отмечен зелёным.','Зелёный и синий отрезы взяли из одного рулона. Светлая часть осталась.'][selected] : p.n===88 ? 'Каждая клетка — пятая часть времени. До антракта сыграны первые три. Выбрано частей: '+selected+'.' : 'Одиннадцать равных по массе частей. Первые восемь отправили. Выбрано частей: '+selected+'.';
    let bars='';
    for(let i=0;i<d;i++) {
      const half=p.n===87, col=half?i%20:i, row=half?Math.floor(i/20):0, w=268/(half?20:d);
      const color=i>=count?'#f0f2ed':half&&i>=15?'#79accb':'#82b89b';
      bars+='<rect x="'+(14+col*w)+'" y="'+(half?13+row*30:24)+'" width="'+(w-1)+'" height="'+(half?28:36)+'" fill="'+color+'" stroke="#506568" stroke-width=".8"/>';
      if(!half && i=== (p.n===88?2:7)) bars+='<path d="M'+(14+(col+1)*w)+' 17v49" stroke="#99422f" stroke-width="2"/>';
    }
    return svg(bars, caption);
  }
  const generators = {'5.86':route,'5.87':cloth,'5.88':concert,'5.89':grain};
  const bounds = {'5.86':{mark:[0,5,0]},'5.87':{cut:[0,2,0]},'5.88':{mark:[0,5,3]},'5.89':{mark:[0,11,8]}};
  function draw(t,s) {
    const p=t.data.storyStrip, i=s?.mode==='learn'?s.step:t.steps.length;
    return plot(p,p.n===86?p.count:p.n===87?Math.min(i+1,2):p.n===88?3:8);
  }
  function explore(t,s) {
    const p=t.data.storyStrip, clothMode=p.n===87, top=p.n===89?11:5, k=clothMode?s.cut:s.mark;
    const values=clothMode?[[0,'До раскроя'],[1,'Один отрез'],[2,'Оба отреза']]:Array.from({length:top+1},(_,i)=>[i,String(i)]);
    const answer = clothMode ? p.total*[40,25,9][k]/40 : p.n===86?p.metres*k/5 : p.n===88?p.before*k/3:p.taken*k/8;
    const title=({86:'Пройди по тропе от Тригорского',87:'Отрежь ткань от рулона',88:'Восстанови время по сыгранным частям',89:'Отмерь несколько долей зерна'})[p.n];
    const question=({86:'Сколько метров ты прошёл от старта?',87:'Сколько метров остаётся в рулоне?',88:'Сколько минут длятся выбранные части?',89:'Сколько тонн в выбранных долях?'})[p.n];
    return {title,controls:[{key:clothMode?'cut':'mark',title:clothMode?'Какие отрезы взять':'Сколько частей выбрать',values}],visual:plot(p,k),question,answer,why:clothMode?'Из полной длины вычти только отмеченные отрезы.':'Умножь размер одной части на число выбранных частей.'};
  }
  const api={lessons,generators,bounds,draw,explore};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Vilenkin5RouteClothConcert=api;
})(typeof window!=='undefined'?window:globalThis);
