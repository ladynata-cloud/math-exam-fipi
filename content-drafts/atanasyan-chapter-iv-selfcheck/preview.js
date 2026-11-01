'use strict';
// Editorial reader only. No review promotion, production bundle or persistent writes.
const byId = id => document.getElementById(id);
const drafts = new Map();
let cards = [], current = null, mount = null, index = 0;
function text(node, value) { node.replaceChildren(); StereoMath.appendText(node, value); }
function element(tag, value) { const node = document.createElement(tag); text(node, value); return node; }
function theoryLinks(ids) {
  const p = document.createElement('p'); p.className = 'theory-links';
  for (const id of new Set(ids)) {
    const a = element('a', 'Теория ' + Number(id.slice(7)));
    a.href = '../../stereo-course/textbook/#' + id; a.target = '_blank'; a.rel = 'noopener';
    p.append(a);
  }
  return p;
}
function open(i) {
  if (current) drafts.set(current.id, byId('work').value);
  current = cards[i]; index = 0; mount?.destroy();
  text(byId('title'), current.title); text(byId('condition'), current.statement.text); text(byId('goal'), current.statement.goal);
  text(byId('source'), 'Вопрос ' + current.source.exercise + (current.source.subpart || '') + ' · Атанасян 10–11, 2024 · стр. ' + current.source.printedPages.join(', '));
  byId('work').value = drafts.get(current.id) || '';
  byId('steps').replaceChildren(); byId('hints').replaceChildren(); byId('help').open = false;
  byId('next').disabled = false; byId('next').textContent = 'Разобрать по шагам';
  mount = TaskSceneViewer.mount(byId('model'), current.visualization.model);
  for (const h of current.help) {
    const d = document.createElement('details'); d.dataset.help = h.id;
    d.append(element('summary', h.question), element('p', h.text), theoryLinks(h.theoryIds || []));
    d.addEventListener('toggle', () => { if (d.open && h.view) mount.setView(h.view); });
    byId('hints').append(d);
  }
}
byId('next').addEventListener('click', () => {
  if (!current || index >= current.steps.length) return;
  const s = current.steps[index++], article = document.createElement('article'); article.dataset.step = s.id;
  const explanation = document.createElement('details'); explanation.dataset.explanation = s.id;
  explanation.append(element('summary', 'Показать объяснение'), element('p', s.explanation));
  const why = document.createElement('details'); why.append(element('summary', 'Почему этот переход верен?'));
  for (const j of s.justifications) why.append(element('p', j.text));
  why.append(theoryLinks(s.justifications.map(j => j.theoryId).filter(Boolean)));
  explanation.append(why); article.append(element('h2', s.title), element('p', s.prompt), explanation);
  byId('steps').append(article); mount.setView(s.view || 'neutral');
  byId('next').disabled = index === current.steps.length;
  byId('next').textContent = index === current.steps.length ? 'Все шаги открыты' : 'Следующий шаг';
});
byId('lesson').addEventListener('change', () => open(Number(byId('lesson').value)));
Promise.all([fetch('manifest.json').then(r => { if (!r.ok) throw Error('manifest'); return r.json(); })])
  .then(([m]) => Promise.all(m.cards.map(id => fetch(id + '.json').then(r => { if (!r.ok) throw Error(id); return r.json(); }))))
  .then(data => {
    cards = data;
    cards.forEach((c, i) => { const option = element('option', 'Вопрос ' + c.source.exercise + (c.source.subpart || '') + ' · ' + c.title); option.value = i; byId('lesson').append(option); });
    open(0);
    window.selfcheckPreview = { cards, open, get mount() { return mount; } };
  }).catch(error => { text(byId('title'), 'Не удалось загрузить карточки'); console.error(error); });
