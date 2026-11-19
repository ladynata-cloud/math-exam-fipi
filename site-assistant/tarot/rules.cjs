/* Public editorial records only. This module does not access the reader's notebook. */
(function () {
  'use strict';
  const aspects = ['observation', 'commentary', 'source', 'practice', 'tradition'];
  const normal = s => String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]+/gu, ' ').trim();
  const filler = new Set('таро книга книги книге карта карты карте колода колоды курсе курсу для или это что как меня они этой эти почему'.split(' '));
  function words(s) {
    return normal(s).split(' ').filter(w => w.length > 1 && !filler.has(w)).map(w =>
      w.length < 4 ? w : w.replace(/(?:ями|ами|ого|его|ыми|ими|ой|ей|ам|ям|ах|ях|ом|ем|ов|ев|ки|а|я|ы|и|у|ю|е|ь)$/u, ''));
  }
  function matching(records, q) {
    const text = ' ' + normal(q) + ' ';
    const query = new Set(words(q));
    const scored = records.map(r => {
      let score = 0;
      for (const term of r.terms) {
        const key = normal(term);
        if (key.length > 2 && text.includes(' ' + key + ' ')) score = Math.max(score, 5 + key.split(' ').length);
        const terms = words(term);
        if (terms.length && terms.every(w => query.has(w))) score = Math.max(score, 3 + terms.length);
      }
      return {r,score};
    });
    const max = Math.max(0,...scored.map(x=>x.score));
    return max ? scored.filter(x=>x.score===max).map(x=>x.r) : [];
  }
  function intent(q) {
    if (/источник|цитат|чьи.{0,8}слова|слова.{0,20}(?:уэйт|кроули|автор)|писал|дослов|первоисточник|где (?:прочита|сверить)/u.test(q)) return 'source';
    if (/что видно|что видн|наблюд|изображен|изображено|детал|рисунк|что замеч|что можно заметить/u.test(q)) return 'observation';
    if (/для себя|практик|задать|упражнен|примен|попробовать|саморефлекс/u.test(q)) return 'practice';
    if (/традици|чья школ|какая школ|разных (?:колод|школ)|происхожд/u.test(q)) return 'tradition';
    if (/толкова|значен|значит|объясн|поясн|смысл|как (?:прочитать|читать)|подробнее/u.test(q)) return 'commentary';
    return '';
  }
  const link = r => ({id:r.id,label:r.title,url:r.url});
  function respond(records, message, context = {}, state = {}) {
    const byId = id => records.find(r => r.id === id);
    const previous = byId(context.entityId) || byId(state.entityId);
    const q = normal(message);
    const aspect = aspects.includes(context.aspect) ? context.aspect : intent(q);
    const matches = matching(records, q);
    let topic = previous;
    // An author in an attribution question is not a request to change books.
    // A uniquely named new card, however, identifies what the source is for.
    const namedCard = matches.length === 1 && matches[0].kind === 'card';
    if (!previous || (matches.length === 1 && ((!context.entityId && aspect !== 'source') ||
        (namedCard && !context.aspect)))) topic = matches[0] || previous;
    const reply = (text, links = [], used = topic, chosen = aspect || 'observation') => ({
      reply:text, links, state:used ? {entityId:used.id,aspect:chosen} : {}
    });
    const notebook = /тетрад|дневник|личн[а-я]* запис|мои запис|моих запис/u.test(q);
    if (notebook && /прочит|достан|покаж|заглян|посмотр|извлек|открой|мо[ияеих]+ |записал|найди|напомни|возьми|что в|что у меня|по записям/u.test(q)) {
      return reply('Личные записи остаются в тетради Вашего браузера. У помощника нет доступа к её содержимому. Если хотите обсудить запись, вставьте выбранный Вами фрагмент и назовите карту или тему.', [], previous || null);
    }
    const crowley = /кроули|колод[а-я ]{0,8}тота|книга тота|книг[еу] тота/u.test(q);
    const waite = /уэйт|райдер|смит/u.test(q);
    const marseille = /марсель/u.test(q);
    if (marseille || (crowley && (waite || topic?.kind === 'card' || matches.some(r=>r.kind==='card'))) ||
        (waite && previous?.id === 'study-book-of-thoth' && aspect === 'tradition')) {
      const waiteBook = byId('study-pictorial-key'), thoth = byId('study-book-of-thoth');
      return reply(marseille
        ? 'Сцены 78 карт в подборке описаны по Уэйту–Смит. Проверенных описаний изображений Марсельского Таро в этой подборке пока нет. Назовите издание Вашей колоды или покажите её карту, чтобы не переносить на неё детали другого рисунка.'
        : 'Галерея показывает рисунки Памелы Колман Смит. Для системы Кроули в курсе есть отдельный разбор «Книги Тота». Какую из двух книг Вы хотите открыть?',
      (marseille ? [topic?.kind === 'card' ? topic : waiteBook] : [waiteBook,thoth]).filter(Boolean).map(link), topic || previous || null, 'tradition');
    }
    if (/сбудется|предска[жз]|точно (?:будет|случится)|что (?:со мной )?(?:случится|произойдет)|что меня ждет|буду ли|любит ли|вернется ли|(?:умру|заболею) ли|когда (?:выйду замуж|умру|женюсь)|(?:на будущее|будет ли|выиграю ли)|что (?:он|она) чувствует/u.test(q)) {
      return reply('По карте нельзя установить будущие события или чувства другого человека. ' +
        (topic ? 'Для самостоятельной записи. '+topic.question : 'Запишите, что Вам уже известно и какое действие зависит от Вас.'),
        topic ? [link(topic)] : [], topic, 'practice');
    }
    if (!context.entityId && matches.length > 1 && !(previous && aspect)) {
      return reply('Нашлось несколько материалов: ' + matches.slice(0,3).map(r => '«'+r.title+'»').join(', ') +
        '. Уточните название или выберите тему в списке.',matches.slice(0,3).map(link),null);
    }
    if (!topic || (!matches.length && !aspect && !context.aspect && !/а дальше|что дальше|дальше|еще|и что/u.test(q))) {
      return reply('Уточните название карты, книги или практики. Например, можно ввести «Отшельник», «Книга Тота» или «перевёрнутые карты».', [], previous || null);
    }
    const chosen = aspect || (/дальше|еще/u.test(q) ? 'practice' : topic.kind === 'card' ? 'observation' : 'commentary');
    let text, links = [link(topic)];
    if (chosen === 'source') {
      text = topic.kind === 'card'
        ? 'Описание изображения и учебное прочтение сформулированы в курсе. Это пересказ, а не дословная цитата Уэйта. Рисунок и текст можно сверить отдельно.'
        : 'Пояснение принадлежит курсу. Текст или издание для сверки указаны ниже. Объём разбора: ' + topic.scope;
      links = [link(topic), ...topic.sources.map((s,i)=>({id:topic.id+'-source-'+i,label:s.label,url:s.url}))];
    } else if (chosen === 'observation') {
      text = topic.kind==='card' ? 'На рисунке Уэйта–Смит. '+topic.observation :
        'В этом материале. '+topic.observation;
      if (/ссылк/u.test(q) && /изображен|рисунк|картин/u.test(q)) {
        links.push(...topic.sources.flatMap((source,index) => source.role==='image'
          ? [{id:topic.id+'-source-'+index,label:source.label,url:source.url}] : []));
      }
    } else if (chosen === 'practice') {
      text = 'Вопрос для собственной записи. '+topic.question;
    } else if (chosen === 'tradition') {
      text = topic.tradition+' '+topic.scope;
    } else {
      text = 'Учебное прочтение курса. '+topic.commentary;
    }
    return reply('«'+topic.title+'». '+text, links, topic, chosen);
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = {respond};
  if (typeof document === 'undefined') return;
  const form = document.getElementById('symbols-form');
  if (!form) return;
  const field = document.getElementById('symbols-query');
  const select = document.getElementById('symbols-topic');
  const log = document.getElementById('symbols-log');
  const buttons = document.getElementById('symbols-aspects');
  const status = document.getElementById('symbols-status');
  const consent = document.getElementById('symbols-server');
  let records = [], state = {}, remoteState = null, revision = 0, pending = null;
  function cancel() {
    revision++;
    if (pending) pending.abort();
    pending = null;
  }
  function display(label, text, links=[]) {
    const el=document.createElement('div'), name=document.createElement('strong'), line=document.createElement('p');
    name.textContent=label; line.textContent=text; el.append(name,line);
    for (const item of links) {
      const a=document.createElement('a'); a.href=item.url; a.textContent=item.label;
      el.append(a,document.createTextNode(' · '));
    }
    if (links.length) el.lastChild.remove();
    log.append(el);
    return el;
  }
  function reset() {
    cancel(); state={};remoteState=null; log.replaceChildren();buttons.hidden=true;
    status.textContent='';field.value='';field.focus();
  }
  async function ask(question, requested, transport) {
    if (!question.trim()) return;
    cancel();
    const turn=revision, localState=state, id=state.entityId || select.value;
    const context={surface:'symbols'};
    if (select.value || (requested && id)) context.entityId=id;
    if (requested) context.aspect=requested;
    const answer=respond(records,question,context,localState);
    state=answer.state;
    if (select.value && state.entityId) select.value=state.entityId;
    buttons.hidden=!state.entityId;
    display('Вы',question);
    const row=display('Помощник',answer.reply,answer.links);
    field.value='';field.focus();
    if (!transport || !consent?.checked || !window.SiteDialogueClient?.ask) return;
    const controller=new AbortController();pending=controller;
    try {
      const value=await window.SiteDialogueClient.ask({site:'tarot',message:question,context,state:remoteState || undefined},{signal:controller.signal});
      if (turn!==revision || !value || value.site!=='tarot' || value.version!==1 || !value.reply) return;
      if (state.entityId !== value.state?.entityId) {remoteState=null;return;}
      remoteState=value.state;
      const allowed=new Map(answer.links.map(l=>[l.url,l]));
      const links=(value.links || []).map(l=>allowed.get(l.url)).filter(Boolean);
      row.remove();display('Помощник',value.reply,links);
    } catch {if(turn===revision) remoteState=null;}
    finally {if(turn===revision)pending=null;}
  }
  form.addEventListener('submit',e=>{e.preventDefault();ask(field.value,undefined,true);});
  form.addEventListener('reset',e=>{e.preventDefault();select.value='';reset();});
  select.addEventListener('change',()=>{reset();const r=records.find(x=>x.id===select.value);if(r)ask(r.title,undefined,false);});
  buttons.addEventListener('click',e=>{const b=e.target.closest('button[data-aspect]');if(b)ask(b.textContent,b.dataset.aspect,true);});
  consent?.addEventListener('change',()=>{cancel();remoteState=null;});
  async function load() {
    try {
      const res=await fetch('../../assistant/v1/symbols.json');
      if(!res.ok)throw Error('catalogue');
      const data=await res.json();
      if(data.site!=='tarot'||data.version!==1||!Array.isArray(data.records))throw Error('catalogue');
      records=data.records;status.textContent='';form.hidden=false;
      if (document.querySelector('script[data-symbols-transport]')) document.getElementById('symbols-server-choice').hidden=false;
    } catch {status.textContent='Подборка для диалога не загрузилась. Откройте одно из занятий по ссылкам выше.';}
  }
  load();
})();
