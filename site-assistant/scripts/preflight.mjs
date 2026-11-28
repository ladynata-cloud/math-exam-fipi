import { readFile } from 'node:fs/promises';
import navigator from '../../assets/assistant/navigator-data.js';
import { respond } from '../dialogue.mjs';
import readerRules from '../reader/search.cjs';

const training = new URL('../training/', import.meta.url);
const role = {
  math: 'Ты помощник MathExam. Помоги найти материал или сделать один следующий шаг в решении. Учитывай предыдущую попытку. Бери ссылки из переданного каталога. У тебя нет доступа к кабинету ученика.',
  reader: 'Ты читательский помощник «Узла тоски по миру». До чтения используй безопасные карточки и при неоднозначности уточни деталь. После чтения учитывай границы доступного источника, различай слова автора и разбор мастерской.',
};
const siteId = {math: 'mathexam', reader: 'uzel'};

async function readRows(filename) {
  const data = await readFile(new URL(filename, training), 'utf8');
  return data.trimEnd().split('\n').map(line => JSON.parse(line));
}

function offlineResult(item) {
  let state;
  const turns = item.turns.map(({user}) => {
    const {reply, links, state: nextState} = respond({
      site: siteId[item.site], context: item.context, message: user, state,
    });
    state = nextState;
    return {user, reply, links};
  });
  return {id: item.id, site: item.site, backend: 'offline-rules', turns};
}

// Give both model runs the same public evidence before either answers.
// Searching starts with all eligible records. A known work is selected only in after-reading mode.
function questionPacket(item, reader, routes, index) {
  const {context, site} = item;
  let evidence;
  if (context.surface === 'navigator') evidence = routes;
  const safeReading = context.mode === 'before_reading' || item.turns.some(turn => readerRules.asksForSafeMode(turn.user));
  if (site === 'reader' && safeReading) {
    evidence = context.workId ? reader.before.filter(card => card.id === context.workId) : reader.before;
    if (!evidence.length) throw new Error('Unknown first-reading work in ' + item.id);
  } else if (context.mode === 'after_reading') {
    evidence = reader.after.find(work => work.card_id === context.workId);
    if (!evidence) throw new Error('Unknown selected work in ' + item.id);
  }
  return {
    caseNumber: index + 1, site,
    system: role[site], context, ...(evidence && {evidence}),
    turns: item.turns.map(({user}) => user),
  };
}

async function run(mode) {
  if (mode === 'train') {
    const math = await readRows('train-math.jsonl');
    const reader = await readRows('train-reader.jsonl');
    return math.concat(reader);
  }
  if (mode !== 'questions' && mode !== 'offline') {
    throw new Error('Usage: node site-assistant/scripts/preflight.mjs train|questions|offline');
  }
  const cases = await readRows('eval.jsonl');
  if (mode === 'offline') return cases.map(offlineResult);
  const reader = JSON.parse(await readFile(new URL('../reader/pilot.json', import.meta.url), 'utf8'));
  const routes = navigator.catalogue.map(({title, url}) => ({
    title, url: new URL(url, 'https://mathexam.space').href,
  }));
  return cases.map((item, i) => questionPacket(item, reader, routes, i));
}

for (const row of await run(process.argv[2])) {
  process.stdout.write(JSON.stringify(row) + '\n');
}
