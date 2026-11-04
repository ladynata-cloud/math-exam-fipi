import fs from 'node:fs';
import { loadConfig } from './config.js';
import { AssistantStore } from './store.js';
import { AssistantError, requireValue } from './errors.js';
import { getBuiltinKnowledge, listTopics } from './tutor.js';

// Local operator-only CLI, not an HTTP endpoint. The caller must already have
// access to this isolated service's volume; it never reads cabinet databases.
let store;
try {
  const [command, ...args] = process.argv.slice(2);
  const config = loadConfig();
  store = new AssistantStore({ config, builtinCards: getBuiltinKnowledge(), topics: listTopics().map(topic => topic.id) });
  if (command === 'status' && args.length === 0) {
    console.log(JSON.stringify(store.summary(), null, 2));
  } else if (command === 'propose' && args.length === 1) {
    const info = fs.statSync(args[0]); requireValue(info.isFile() && info.size <= 16384, 'KNOWLEDGE_FILE_INVALID');
    const id = store.propose(JSON.parse(fs.readFileSync(args[0], 'utf8')));
    console.log(JSON.stringify({ candidateId: id, status: 'pending', availableToLearners: false }));
  } else if (['approve', 'reject'].includes(command) && args.length === 3 && args[2] === '--confirm-reviewed') {
    const card = store.review(args[0], command, args[1]);
    console.log(JSON.stringify({ id: card.id, version: card.version, verdict: command }));
  } else if (command === 'backup' && args.length === 1) {
    await store.backupTo(args[0]); console.log('ASSISTANT_BACKUP_CREATED');
  } else {
    console.error('Usage: npm run operator -- status | propose CARD.json | approve|reject CANDIDATE_ID REVIEWER_ROLE --confirm-reviewed | backup ABSOLUTE_NEW_FILE');
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof AssistantError ? error.code : 'OPERATOR_COMMAND_FAILED'); process.exitCode = 1;
} finally { store?.close(); }
