// UTF-8 limits complement (never replace) the existing per-field character caps.
// The dialogue/board contract remains 3500 bytes. Never truncate mathematics.
export const ANSWER_BYTES = 3500;
export const DIALOGUE_BYTES = 3500;
// A well-formed 400 UTF-16-unit follow-up needs at most 1200 JSON UTF-8 bytes.
export const FOLLOW_UP_BYTES = 1200;
export const jsonBytes = value => Buffer.byteLength(JSON.stringify(value), 'utf8');

export function answerFitsDialogue(answer, question) {
  if (typeof question !== 'string' || !question.isWellFormed()) return false;
  const fits = (q, a) => jsonBytes({ question: '', turns: [{ question: q, answer: a }] }) + FOLLOW_UP_BYTES <= DIALOGUE_BYTES;
  // prepareDialogue normalizes history. Reserve for both representations,
  // including compatibility characters that expand under NFKC.
  const normalized = { title: answer.title.normalize('NFKC'), text: answer.text.normalize('NFKC'),
    steps: answer.steps.map(s => s.normalize('NFKC')), check: answer.check.normalize('NFKC') };
  return normalized.title.length <= 160 && normalized.text.length <= 1800
    && normalized.check.length <= 600 && normalized.steps.every(s => s.length <= 600)
    && fits(question, answer) && fits(question.normalize('NFKC'), normalized);
}
