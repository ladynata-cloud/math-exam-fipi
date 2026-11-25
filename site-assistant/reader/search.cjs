/* Search the editorial first-reading cards already on this page. */
(function () {
  'use strict';

  const stopWords = new Set(('а и или в во на не но о об от за из по у к ко со с про без до для что где как ' +
    'кто это этот эта там тот его ее их он она они я мне у нас вы был была было были есть какой каком ' +
    'какую какого какойто какомто помню помните вспомнить найти ищу хочу помогите вроде кажется ' +
    'название названия книга книгу книге книги произведение произведении произведения рассказ рассказе ' +
    'рассказа рассказы повесть повести повестей роман романа романы стихотворение стихотворения ' +
    'автор автора герой героя герои историю человек человека который которая которым чем только ' +
    'какие пожалуйста подскажи подскажите покажи покажите назови назовите знаешь знаете ' +
    'расскажи расскажите вас подборке').split(' '));

  // Common endings in the short clue phrases. Strip at most one ending.
  const endings = [
    /(?:ившими|ывшими|авшими|ивший|ывший|авший|ившие|ывшие|авшие|ющего|ущего)$/u,
    /(?:иями|ьями|ами|ями|ими|ыми|ого|его|ому|ему|ая|яя|ое|ее|ые|ие|ый|ий|ой|ую|юю|ых|их|ою|ею)$/u,
    /(?:ала|яла|али|яли|или|ила|ило|ать|ять|ить|еть|ает|яет|ают|яют|ит|ил|ал)$/u,
    /(?:ов|ев|ей|ам|ям|ом|ем|ах|ях|ью|ия|ья|ию|ы|и|у|ю|а|я|е|о|ь)$/u,
  ];

  function terms(value) {
    const words = value.toLocaleLowerCase('ru').replace(/ё/g, 'е').match(/[а-яa-z0-9]+/gu) || [];
    const distinct = new Set();
    for (const word of words) {
      if (word.length < 2 || stopWords.has(word)) continue;
      let stem = word;
      // As in Russian stemming, preserve the prefix ending at the first vowel.
      const vowel = word.search(/[аеиоуыэюя]/u);
      if (vowel >= 0 && word.length >= 4) {
        const prefix = word.slice(0, vowel + 1);
        const suffix = word.slice(vowel + 1);
        for (const ending of endings) {
          const shorter = suffix.replace(ending, '');
          if (shorter !== suffix) {
            if ((prefix + shorter).length >= 3) stem = prefix + shorter;
            break;
          }
        }
      }
      distinct.add(stem);
    }
    return distinct;
  }

  function indexCard(card) {
    const weights = new Map();
    // The noun ending -ов is also part of many surnames («Чехов», «Чехова»).
    const surname = card.author.trim().split(/\s+/u).at(-1);
    const author = /(?:ов|ев|ёв|ин|ын)$/iu.test(surname)
      ? card.author + ' ' + surname + 'а'
      : card.author;
    const cues = Array.isArray(card.cues) ? card.cues.join(' ') : card.cues;
    // Keep identity separate: a matching surname cannot establish another title.
    weights.authorTerms = terms(author);
    weights.surnameTerms = terms(surname + ' ' + (/(?:ов|ев|ёв|ин|ын)$/iu.test(surname) ? surname + 'а' : surname));
    weights.contentTerms = terms([card.title, card.teaser, cues].join(' '));
    for (const [text, weight] of [[card.teaser, 1], [cues, 3], [author, 5], [card.title, 7]]) {
      for (const word of terms(text)) weights.set(word, Math.max(weight, weights.get(word) || 0));
    }
    return weights;
  }

  function search(indexes, query) {
    const words = terms(query);
    if (!words.size) return [];
    const authors = indexes.filter(index => [...words].some(word => index.surnameTerms.has(word)));
    const authorWords = new Set(authors.flatMap(index => [...index.authorTerms]));
    const details = [...words].filter(word => !authorWords.has(word));
    // A quoted title or remembered phrase must match in full, not by one word.
    const quoted = [...query.matchAll(/«([^»]+)»|“([^”]+)”|"([^"]+)"|‘([^’]+)’|'([^']+)'/gu)]
      .map(match => [...terms(match.slice(1).find(Boolean))]).filter(parts => parts.length);
    const eligible = indexes.map(index =>
      (!authors.length || (authors.includes(index) && (!details.length || details.some(word => index.contentTerms.has(word))))) &&
      quoted.every(parts => parts.every(word => index.contentTerms.has(word))));
    const hits = indexes.map(() => ({score: 0, count: 0}));
    for (const word of words) {
      const frequency = indexes.filter(index => index.has(word)).length;
      if (!frequency) continue;
      const rarity = 1 + Math.log((indexes.length + 1) / (frequency + 1));
      indexes.forEach((index, i) => {
        if (eligible[i] && index.has(word)) {
          hits[i].score += rarity * index.get(word);
          hits[i].count++;
        }
      });
    }
    const mostMatches = Math.max(0, ...hits.map(hit => hit.count));
    // Prefer agreement on several details when available. Single distinctive clues
    // remain useful when a reader supplies additional words absent from the catalogue.
    return hits.map((hit, i) => ({...hit, i}))
      .filter(hit => hit.count && (mostMatches <= 1 || hit.count >= Math.max(2, mostMatches - 1)))
      .sort((a, b) => b.count - a.count || b.score - a.score || a.i - b.i)
      .map(hit => hit.i);
  }

  function asksForSafeMode(query) {
    const text = query.toLowerCase().replace(/ё/g, 'е');
    return /без\s+спойлер|не\s+(?:(?:успел[аи]?|совсем)\s+)?(?:дочита|прочита)|не\s+(?:раскрывай|рассказывай|хочу знать).*?(?:финал|развязк)/u.test(text);
  }

  function firstReadingReply(cards, indexes, previousIndices, query) {
    // A correction starts a new search. An ordinary follow-up still narrows the
    // previous candidates (a shared detail may be ambiguous in the full catalogue).
    const replacement = query.match(/(?:^|\s)не\s+[^,;]+,\s*а\s+(.+)$/iu);
    const correction = replacement || /перепутал|ошиб(?:ся|лась)|друг(?:ая книга|ую книгу|ой рассказ|ое произведение)|имел[аи]? в виду|на самом деле ищу|теперь\s+(?:поищи|найди(?:те)?|ищу|хочу (?:найти|прочитать))/iu.test(query);
    const candidates = previousIndices.length && !correction ? previousIndices : indexes.map((_, i) => i);
    const matches = search(candidates.map(i => indexes[i]), replacement?.[1] || query).map(i => candidates[i]);
    if (!matches.length) {
      const text = previousIndices.length && !correction
        ? 'По этой детали уточнить пока не получается. Помните имя, место или вещь из эпизода? Для другой книги можно начать заново.'
        : 'Такой детали я пока не нашёл в подборке. Вспомните имя героя, место или предмет из эпизода.';
      return {indices: correction ? [] : previousIndices, matched: false, text, links: []};
    }
    const found = matches.map(i => cards[i]);
    const links = found.slice(0, 3).map(c => ({id: c.id, label: c.title, url: c.url}));
    let text;
    if (found.length === 1) {
      const c = found[0];
      const nameOnly = /названи[ея].{0,16}автор|автор.{0,16}названи[ея]/iu.test(query);
      text = 'Похоже, это «' + c.title + '». Автор — ' + c.author + '.' + (nameOnly ? '' : ' ' + c.teaser);
    } else {
      const titles = found.slice(0, 3).map(c => '«' + c.title + '»').join(', ');
      const pair = found.map(c => c.id).sort().join(' ');
      const hint = ['work-matrenin-dvor work-yushka', 'work-potaennyy-les work-student'].includes(pair) &&
        found.find(c => c.detail_hint);
      text = 'Подходят ' + titles + (found.length > 3 ? ' и ещё ' + (found.length - 3) : '') + '. ' +
        (hint ? hint.detail_hint : 'Помните ещё одну деталь — имя, занятие героя или место встречи?');
    }
    return {indices: matches, matched: true, text, links};
  }

  function afterReadingReply(record, query, previousParagraph = -1) {
    const q = query.toLowerCase().replace(/ё/g, 'е');
    const sourceLinks = (record.sources || []).slice(0, 3);
    const analysis = {label: 'Разбор мастерской', url: record.url};
    const links = [analysis, ...sourceLinks];
    if (record.source_status === 'blocked') {
      return {text: 'У мастерской есть только справочные сведения. ' + record.scope, paragraph: -1, links: sourceLinks};
    }
    if (record.source_status === 'limited') {
      const primary = sourceLinks.find(source => source.kind === 'primary_fragment');
      const pageReferences = [...q.matchAll(/(?:страниц[а-я]*|стр\.?|с\.)\s*[№#]?\s*(\d+(?:(?:\s*[–—,\-]\s*|\s+и\s+)\d+)*)|(\d+)(?:-[а-я]+)?\s+страниц[а-я]*/gu)]
        .flatMap(match => (match[1] || match[2]).match(/\d+/gu).map(Number));
      // Common ordinal page requests, including «прочитала девятую страницу».
      const ordinalStems = ['перв', 'втор', 'треть', 'четверт', 'пят', 'шест', 'седьм', 'восьм', 'девят', 'десят'];
      for (const match of q.matchAll(/(?:^|\s)([а-я]+?)(?:ую|юю|ой|ей|ая|яя)\s+страниц[а-я]*/gu)) {
        const ordinal = ordinalStems.indexOf(match[1]) + 1;
        if (ordinal && !/двадцать|тридцать|сорок|десят\s|сот\s|сто\s|тысяч/u.test(q)) pageReferences.push(ordinal);
      }
      // With incomplete evidence, an unclear page number cannot license a retelling.
      const unnamedPage = !pageReferences.length && /страниц|(?:^|\s)стр\.?(?:\s|$)/u.test(q) &&
        !/на (?:этой|проверенной|указанной) странице/u.test(q);
      if (unnamedPage || pageReferences.some(page => !primary?.pages?.includes(page))) {
        return {text: 'Эта страница выходит за пределы проверенного фрагмента. ' + record.scope +
          ' Для ответа нужен текст этой страницы или фотография разворота.', paragraph: previousParagraph, links: primary ? [primary] : sourceLinks};
      }
      if (primary && /источник|фотограф|где (?:сверить|посмотреть)|(?:увидеть|открыть) (?:тот )?(?:разворот|фрагмент)/u.test(q)) {
        return {text: primary.label + '. ' + record.scope, paragraph: previousParagraph, links: [primary]};
      }
    }
    if (/цитат|дослов|чьи (?:это )?слова|слова (?:автора|писателя|платонова)|слова ли|источник|где сверить/u.test(q)) {
      return {text: 'Здесь приведён комментарий мастерской. Точные слова автора можно сверить по указанному источнику. ' + record.scope,
        paragraph: previousParagraph, links};
    }
    if (record.source_status === 'limited' && /(?:развязк|кончил|заканчива|чем законч|финал|на самом деле|вся книг|всю книг)/u.test(q)) {
      return {text: 'В мастерской проверен только указанный фрагмент. По нему нельзя установить развязку или подтвердить предположение о том, что произошло дальше. ' + record.scope,
        paragraph: -1, links};
    }
    const paragraphs = record.commentary_paragraphs?.length
      ? record.commentary_paragraphs
      : (record.commentary || '').split(/\n\s*\n/u).filter(Boolean);
    const overview = /что разбирает мастерская|о чем поговорим|с чего нач|о чем (?:это|книга|рассказ)/u.test(q);
    const followUp = /дальше|подробнее|что еще|еще (?:одн|пример)|продолж/u.test(q);
    let position;
    if (overview) {
      position = 0;
    } else if (followUp) {
      position = previousParagraph + 1;
    } else {
      const content = q.replace(/почему|помогите|объясните|расскажите|понимать|понимаешь|пожалуйста/gu, ' ');
      const omit = terms(record.title + ' ' + record.author);
      const wanted = [...terms(content)].filter(t => !omit.has(t));
      let highest = 0;
      paragraphs.forEach((p, index) => {
        const words = terms(p);
        const score = wanted.filter(t => words.has(t)).length;
        if (score > highest) {position = index; highest = score;}
      });
    }
    if (position == null || !paragraphs[position]) {
      return {text: 'В карточке нет отдельного ответа на этот вопрос. ' + (record.reading_task || record.scope),
        paragraph: previousParagraph, links};
    }
    let passage = paragraphs[position];
    // The opening paragraph often sets up the detail discussed in a later one.
    if (previousParagraph < 0 && !overview && !followUp && position > 0 && paragraphs[0].length + passage.length <= 1600) {
      passage = paragraphs[0] + '\n\n' + passage;
    }
    if (record.source_status === 'limited') passage += '\n\nОбъём чтения. ' + record.scope;
    return {text: 'Комментарий мастерской. ' + passage, paragraph: position, links};
  }

  function trustedReplyLinks(links, cards, record) {
    const allowed = [];
    for (const link of links) {
      // Match stable identifiers across custom domains, GitHub Pages and local previews.
      let target;
      if (!record) {
        const card = cards.find(c => c.id === link.id);
        if (card) target = {label: card.title, url: card.url};
      } else {
        target = record.sources.find(s => s.url === link.url);
        if (!target && (link.id === record.id || link.id === record.card_id || link.url === record.url)) {
          target = {label: 'Разбор мастерской', url: record.url};
        }
      }
      if (target && !allowed.some(x => x.url === target.url)) allowed.push(target);
    }
    return allowed;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {indexCard, search, asksForSafeMode, firstReadingReply, afterReadingReply, trustedReplyLinks};
  }
  if (typeof document === 'undefined') return;

  const form = document.getElementById('memory-form');
  if (!form) return;
  const field = document.getElementById('memory-query');
  const label = document.getElementById('memory-label');
  const list = document.getElementById('memory-results');
  const status = document.getElementById('memory-status');
  const log = document.getElementById('memory-log');
  const mode = document.getElementById('memory-mode');
  const actions = document.getElementById('memory-actions');
  const send = document.getElementById('memory-send');
  const rows = Array.from(list.children);
  const cards = rows.map(row => ({
    id: row.id, url: new URL(location.pathname + '#' + row.id, location.origin).href,
    title: row.querySelector('h2').textContent,
    author: row.querySelector('.memory-author').textContent,
    teaser: row.querySelector('.memory-teaser').textContent,
    detail_hint: row.querySelector('.memory-hint')?.textContent,
    cues: row.dataset.cues,
  }));
  const indexes = cards.map(indexCard);
  const all = rows.map((_, i) => i);
  const packets = new Map();
  let candidates = [];
  let work = null;
  let record = null;
  let paragraph = -1;
  let revision = 0;
  let request;
  let serverState = null;
  let serverInSync = true;
  let timer;

  function show(visible) {
    const selected = new Set(visible);
    rows.forEach((row, i) => { row.hidden = !selected.has(i); });
    for (const i of visible) list.appendChild(rows[i]);
  }

  function message(speaker, text, links = []) {
    const row = document.createElement('div');
    row.className = 'memory-message';
    const name = document.createElement('strong');
    name.textContent = speaker;
    const body = document.createElement('p');
    body.textContent = text;
    row.append(name, body);
    for (const link of links) {
      const url = new URL(link.url, location.href);
      if (!['https:', 'http:'].includes(url.protocol)) continue;
      const a = document.createElement('a');
      a.href = url.href;
      a.textContent = link.label;
      row.appendChild(a);
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function cancelResponse() {
    clearTimeout(timer);
    revision++;
    if (request) request.abort();
    request = null;
  }

  function firstMode(keep = []) {
    cancelResponse();
    work = null;
    record = null;
    paragraph = -1;
    serverState = null;
    serverInSync = !keep.length;
    candidates = keep;
    log.replaceChildren();
    actions.hidden = true;
    mode.textContent = 'Поиск без спойлеров';
    label.textContent = 'Что вам запомнилось?';
    send.textContent = 'Найти';
    field.disabled = send.disabled = false;
    field.placeholder = 'Например, разбирали горницу';
    field.value = '';
    show(keep.length ? keep : all);
    status.textContent = keep.length ? 'Открыта карточка для первого чтения.' : 'Произведений в подборке: ' + cards.length + '.';
  }

  async function discuss(i) {
    if (work === i && record) { field.focus(); return; }
    cancelResponse();
    const token = revision;
    const card = cards[i];
    work = i;
    record = null;
    paragraph = -1;
    serverState = null;
    serverInSync = true;
    log.replaceChildren();
    field.value = '';
    actions.hidden = true;
    mode.textContent = 'После чтения · «' + card.title + '»';
    label.textContent = 'Что обсудим в этом произведении?';
    field.placeholder = 'Например, о чём говорит эта деталь?';
    send.textContent = 'Спросить';
    field.disabled = send.disabled = true;
    show([i]);
    status.textContent = 'Открываем материалы мастерской…';
    try {
      if (!packets.has(card.id)) {
        const url = new URL('../assistant/v1/after-reading/' + card.id + '.json', document.baseURI);
        const response = await fetch(url);
        if (!response.ok) throw new Error('record unavailable');
        const data = await response.json();
        if (data.version !== 1 || data.mode !== 'after_reading' || data.record?.card_id !== card.id) throw new Error('wrong record');
        packets.set(card.id, data.record);
      }
      if (token !== revision) return;
      record = packets.get(card.id);
      field.disabled = send.disabled = false;
      actions.hidden = false;
      status.textContent = '';
      message('Читательский помощник', record.scope);
      field.focus();
    } catch {
      if (token !== revision) return;
      firstMode([i]);
      status.textContent = 'Не удалось загрузить обсуждение. Можно попробовать ещё раз или открыть разбор по ссылке.';
    }
  }

  async function submit(query) {
    const q = query.trim();
    if (!q) return;
    if (work !== null && asksForSafeMode(q)) {
      firstMode([work]);
      field.focus();
      return;
    }
    // A faster second turn must not inherit a server state for an earlier turn.
    if (request) serverInSync = false;
    cancelResponse();
    const token = revision;
    const selected = work;
    let result;
    if (selected === null) {
      result = firstReadingReply(cards, indexes, candidates, q);
      candidates = result.indices;
      show(candidates);
      status.textContent = candidates.length ? 'Карточек ниже: ' + candidates.length + '.' : 'Совпадений пока нет.';
      label.textContent = 'Какую деталь вы ещё помните?';
      send.textContent = 'Уточнить';
      field.placeholder = 'Например, помню горницу';
    } else {
      if (!record) return;
      result = afterReadingReply(record, q, paragraph);
      paragraph = result.paragraph;
    }
    message('Вы', q);
    const local = message('Читательский помощник', result.text, result.links);
    field.value = '';
    field.focus();
    const client = window.SiteDialogueClient;
    if (!client?.ask || !serverInSync) {serverInSync = false; return;}
    const controller = new AbortController();
    request = controller;
    const context = selected === null ? {surface: 'reader', mode: 'before_reading'} :
      {surface: 'reader', mode: 'after_reading', workId: cards[selected].id};
    try {
      const reply = await client.ask({site: 'uzel', message: q, context, state: serverState || undefined}, {signal: controller.signal});
      if (token !== revision) return;
      if (!reply || reply.site !== 'uzel' || reply.version !== 1 || !reply.reply) {
        serverInSync = false;
        return;
      }
      serverState = reply.state;
      const links = trustedReplyLinks(reply.links || [], selected === null ? cards : [], record);
      local.remove();
      message('Читательский помощник', reply.reply, links);
    } catch {
      if (token === revision) serverInSync = false;
    } finally {
      if (token === revision) request = null;
    }
  }

  form.addEventListener('submit', event => {event.preventDefault(); submit(field.value);});
  form.addEventListener('reset', event => {event.preventDefault(); firstMode(); field.focus();});
  field.addEventListener('input', () => {
    clearTimeout(timer);
    if (work !== null || candidates.length) return;
    timer = setTimeout(() => {
      const q = field.value.trim();
      const visible = q ? search(indexes, q) : all;
      show(visible);
      status.textContent = !visible.length ? 'В подборке пока нет совпадений.' : 'Карточек: ' + visible.length + '.';
    }, 180);
  });
  actions.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'memory-safe') {firstMode([work]); field.focus();}
    else if (button.dataset.question) submit(button.dataset.question);
  });
  rows.forEach((row, i) => {
    const button = row.querySelector('.memory-discuss');
    button.hidden = false;
    button.addEventListener('click', () => discuss(i));
  });
  document.getElementById('memory-dialogue').hidden = false;
  document.getElementById('memory-transport').hidden = !document.querySelector('script[data-reader-transport]');
  form.hidden = false;
  firstMode();
})();
