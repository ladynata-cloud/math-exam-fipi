'use strict';

const { requireValue } = require('./learning-auth');

const TTL = 15 * 60 * 1000, MAX_ENTRIES = 60, MAX_BYTES = 3500;
const copy = value => JSON.parse(JSON.stringify(value));
const bytes = value => Buffer.byteLength(JSON.stringify(value), 'utf8');

// Process-local continuation state. It deliberately has no persistence hook:
// restarting the cabinet forgets conversations, but not usage/replay ledgers.
function createDialogueCache(clock = Date.now) {
  const entries = new Map();
  function remove(id) {
    const entry = entries.get(id);
    if (entry) clearTimeout(entry.timer);
    entries.delete(id);
  }
  function prune() {
    for (const [id, entry] of entries) if (clock() >= entry.expiresAt) remove(id);
  }
  function prepare(answerId, binding, question) {
    prune();
    const entry = entries.get(answerId);
    requireValue(entry, 'LEARNING_ASSISTANT_DIALOGUE_EXPIRED', 409);
    requireValue(entry.binding === binding, 'LEARNING_ASSISTANT_DIALOGUE_CONTEXT', 409);
    const turns = copy(entry.turns);
    while (turns.length > 1 && bytes({ question, turns }) > MAX_BYTES) turns.shift();
    requireValue(bytes({ question, turns }) <= MAX_BYTES, 'LEARNING_ASSISTANT_DIALOGUE_CONTEXT', 409);
    return { question, turns };
  }
  function remember(answerId, binding, question, answer, parentId) {
    prune();
    const parent = parentId ? entries.get(parentId) : null;
    // A parent can expire while its request is running. The answer still gets
    // delivered, but must not revive the expired conversation.
    if (parentId && (!parent || parent.binding !== binding)) return false;
    const { title, text, steps, check } = answer;
    const turns = [...(parent?.turns || []), { question, answer: { title, text, steps, check } }].slice(-3);
    while (turns.length > 1 && bytes({ question: '', turns }) > MAX_BYTES) turns.shift();
    // The conversation has a fixed lifetime from its first answer. Continuing
    // it must never renew retention of earlier mathematical text.
    const expiresAt = parent?.expiresAt ?? clock() + TTL;
    if (parentId) remove(parentId); // Only the latest successful answer continues this chain.
    if (bytes({ question: '', turns }) > MAX_BYTES) return false;
    const remainingMs = expiresAt - clock();
    if (remainingMs <= 0) return false;
    while (entries.size >= MAX_ENTRIES) remove(entries.keys().next().value);
    remove(answerId);
    const timer = setTimeout(() => remove(answerId), remainingMs);
    timer.unref?.();
    entries.set(answerId, { binding, turns: copy(turns), expiresAt, timer });
    return true;
  }
  return { prepare, remember };
}

module.exports = { createDialogueCache };
