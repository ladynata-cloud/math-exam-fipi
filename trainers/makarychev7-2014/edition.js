(function () {
  'use strict';
  function tiles(values, centers) {
    const width = 38;
    const cells = values.map((value, index) => {
      const x = 12 + index * width;
      const marked = centers.includes(index);
      const outline = marked ? '#6f3c10' : '#376b72';
      return '<g><rect x="' + x + '" y="12" width="32" height="33" rx="4" stroke="' + outline +
        '" stroke-width="' + (marked ? 3 : 1) + '" fill="' + (marked ? '#fff1da' : '#eff9f8') + '"/>' +
        '<text x="' + (x+16) + '" y="34" text-anchor="middle" fill="#18343c" font-size="16">' + value + '</text>' +
        (marked ? '<path d="M' + (x+12) + ' 51l4 -4 4 4" fill="none" stroke="' + outline + '" stroke-width="2"/>' : '') + '</g>';
    }).join('');
    return '<svg viewBox="0 0 ' + (20+width*values.length) + ' 57" role="img" aria-label="Ряд по возрастанию. Средние места отмечены стрелками">' + cells + '</svg>';
  }
  function dots(values) {
    const unique = [...new Set(values)].sort((a,b)=>a-b);
    const left=25, scale=220/(unique.at(-1)-unique[0]);
    const marks=unique.map(value=>{
      const x=left+(value-unique[0])*scale, count=values.filter(n=>n===value).length;
      return '<g><text x="'+x+'" y="88" font-size="14" text-anchor="middle" fill="#18343c">'+value+'</text>'+
        Array.from({length:count},(_,i)=>'<circle cx="'+x+'" cy="'+(61-i*15)+'" r="5.5" fill="#267773"/>').join('')+'</g>';
    }).join('');
    return '<svg viewBox="0 0 273 96" role="img" aria-label="Каждая точка изображает одну попытку. Высота столбика показывает, сколько раз повторился результат"><path d="M15 71H258" fill="none" stroke="#47606b"/>'+marks+'</svg>';
  }
  function grouped(count, amount, loose) {
    const tiles = Array.from({length:count},(_,i) => {
      const x=8+i*45;
      return '<rect x="'+x+'" y="11" width="39" height="34" rx="4" fill="#e3f3ee" stroke="#276358"/>'+
        '<text x="'+(x+19.5)+'" y="33" text-anchor="middle">'+amount+'</text>';
    }).join('');
    return '<svg viewBox="0 0 280 83" role="img" aria-label="В каждой коробке одинаковое число деталей. Одиночные детали лежат отдельно."><g fill="#203840" font-size="16">'+tiles+
      '<text x="10" y="70">Отдельно:</text><text x="95" y="70" font-weight="bold">'+loose+'</text></g></svg>';
  }
  function stations(total, stopped) {
    const stations=Array.from({length:total},(_,i)=>{
      const x=10+(i%7)*35,y=13+Math.floor(i/7)*33,closed=i>=total-stopped;
      return '<rect x="'+x+'" y="'+y+'" width="26" height="23" rx="3" fill="'+(closed?'#f9eddf':'#dbefea')+'" stroke="#49625a"/>'+
        (closed?'<path d="M'+(x+4)+' '+(y+4)+'l18 15m0 -15l-18 15" stroke="#82420f" stroke-width="2"/>':'');
    }).join('');
    return '<svg viewBox="0 0 264 111" role="img" aria-label="Схема рабочих мест. На зачёркнутые места материалы не выдаются.">'+stations+
      '<text x="10" y="101" font-size="13" fill="#203840">Зачёркнуты закрытые места</text></svg>';
  }
  function batches(first,second) {
    const row=(name,data,y)=>{
      const size=14,x=53;
      const marks=Array.from({length:data[0]},(_,i)=>'<rect x="'+(x+i*(size+3))+'" y="'+(y-13)+'" width="'+size+'" height="14" fill="#d5ebe7" stroke="#39756a"/>').join('');
      return '<text x="8" y="'+y+'">'+name+'</text>'+marks+'<text x="8" y="'+(y+19)+'">'+data[1]+' м на все катушки</text>';
    };
    return '<svg viewBox="0 0 284 119" role="img" aria-label="У каждой мастерской свой запас нити и количество одинаково заполненных катушек"><g fill="#203840" font-size="14">'+row('А',first,21)+row('Б',second,78)+'</g></svg>';
  }
  window.MathExamTopicEdition = {
    trainerId:'makarychev7-2014', storePrefix:'math:makarychev7-2014:v1:', authors:'Макарычев и др. · издание 2014 года',
    grade:()=>'7 класс', unit:'пункт', nextId:lesson=>lesson.book+'-'+(lesson.point+1),
    source:(_book,page)=>'https://pdf.my-uchebnik.ru/pdf/algebra/00000074.pdf#page='+page,
    figure(data) {
      switch(data.chart) {
        case 'boxes': return grouped(...data.parameters);
        case 'stations': return stations(...data.parameters);
        case 'spools': return batches(...data.parameters);
        case 'dots': return dots(data.measurements);
        case 'ordered': return tiles(data.sorted,data.centers);
        default: return '';
      }
    }
  };
})();
