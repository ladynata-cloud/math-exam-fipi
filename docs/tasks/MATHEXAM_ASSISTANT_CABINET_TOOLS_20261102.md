# Cabinet progress and teacher tools — items15,46–50,96–100

Owner instruction: implement all100 cloud changes, with standing publication
permission. Package8, HIGH. Base PR416 headcd9b19b21f58ef6b56fa45c7b751bd95715ac071.
This approved scope extends ADR0011 with opt-in structured practice retention;
it does not authorize raw pupil transcript retention, provider activation or
new enabled accounts. External audit not requested/performed.

Implement in the existing authenticated cabinet: resume generated practice,
revisit latest difficult skills, independent/helped/session summary and private
owned-teacher category aggregates; preview3–5 tasks before explicit assignment;
server-enforced per-assignment solution/method policy; teacher sandbox with no
pupil progress writes; teacher-owned explanation draft/revision/explicit approval;
minimal generated-task dispute queue; exact public coverage map.

Persist only generated descriptors, bounded categorical outcomes and help state
when learner explicitly opts in; explain teacher visibility and deletion. Default
memory state expires and never writes learning progress. Erasure deletes only
new practice data; existing attempts, budgets and request ledgers remain intact.
No pupil free-text answers/questions persist. Disputes contain engine/version,
descriptor and reason enum, with teacher routing but no pupil identity/text.
Teacher authored notes remain separate from deterministic mathematical truth.
No automatic approval or model training. Keep at most three enabled assistants.

Reuse cabinet session, account fence, exact-origin/CSRF/mutation limits and
teacher ownership. Every mutation rechecks settings/active assessment after
async module load, checks current version/task and prevents duplicate credit.
Preserve public standalone assistant independence. Shared pure practice module
is explicitly copied into board image; inference remains independent. Native
cabinet deploy and helper deploy are separate and require unavailable hosting
identity; do not claim either live from GitHub merge alone.

Required evidence: restart/resume/erase, opt-out no persistence, cross-account and
CSRF rejection, disabled/exam blocks, stale/duplicate submissions, enforced
methods/full solution, draft isolation/approval/version, preview idempotency,
sandbox unchanged real tables, bounded deidentified dispute payloads, public
coverage equality, desktop/mobile/keyboard browser flows, relevant existing
cabinet and assistant regression checks. Synthetic accounts only.
Rollback ordinary scoped source revert, leaving additive tables and all ledgers
intact; disable gateway if needed. No migration drops or forced git operations.
