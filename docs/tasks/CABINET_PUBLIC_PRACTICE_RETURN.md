# Return from public practice to the learner cabinet

- Date: 2026-11-05. Base: `a7078f136ec0a5725cabc872dcc03132f3df070d`.
- Branch: `fix/cabinet-practice-return-20261105`. Review: MEDIUM.
- Owner request: repair the dead end actually encountered when opening a public trainer from the existing learner cabinet. This direct request authorizes implementation; release follows OWNER_RELEASE_AUTHORIZATION.md.

## Scope and evidence

Public practice cards currently open external tabs without a return link. Keep the existing public exercise on its separate origin and use the already established cabinet iframe pattern, with a persistent green «← В кабинет» link. Return to the originating learner route or teacher card/preview. Support six OGE trainers, other public practice links emitted by the cabinet, and teacher board links. Do not change accounts, saved programs, managed attempts, mathematical engines, board synchronization or progress contracts.

The private return route remains in the cabinet document only. An allowlisted public path is loaded with no referrer and no credential/context messages. The frame cannot navigate the cabinet top level. Existing authentication and account-change guards remain in force. Public practice is still not managed homework; do not promise new result recording.

## Acceptance

- Six actual OGE pages open and return to the same route without reauthentication.
- Teacher preview/card returns preserve the teacher session.
- A shared-board launch also has an always-visible return control.
- Reload, Back/Forward, blocked destination and 320px width remain usable.
- No new attempts, plan/profile edits or credential disclosure.
- Existing school-course saved-work regression remains passing.

## Checks, review and rollback

Focused source/diff review, DOM origin/route guard tests, real local-browser tests with synthetic SQLite accounts, existing focus-link and course-navigation tests, syntax/diff checks and applicable CI. Gate: LEARNING_PUBLIC_RETURN_OK. External provider review not requested/performed. Rollback is a scoped revert through normal publication; no data migration or database restore.

Risk: embedded public practice may use browser-local storage differently when third-party storage is blocked. Saved managed work is untouched. An unfinished draft is preserved only where its existing trainer supports saving; navigation must not claim otherwise. Board rooms still do not survive server restarts. The deployment can restart the board service; post-release verification must distinguish this from ordinary reconnection.
