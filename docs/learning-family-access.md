# Pupil self-entry and parent progress

## Pupil entry

An existing pupil can choose their own password through a private invitation.
New entry codes contain exactly four decimal digits, including any leading
zeroes. Existing longer passwords remain valid on login. Both a first invitation and a newly
issued replacement pupil invitation last seven days. Opening the page does not
consume the invitation; successful activation does. Teacher-facing metadata
retains an unused invitation's exact expiry even after that time has passed, so
the cabinet can say **Приглашение истекло**. It does not reactivate or extend the
link. Consumed or revoked invitations have no pending expiry in metadata.

The teacher sends only that pupil's invitation. After activation, a separate
non-secret return link can prefill the existing login form. It still requires
the pupil's password and never switches an already authenticated account.
Activation keeps the pupil's identity and learning history, and invalidates
their previous sessions and QR grant.

## Parent entry

In **Мои ученики**, choose **Доступ родителю** beside the intended pupil.
The default form suggests a ready four-digit code; the teacher may keep it or
choose another, then issue the parent access. One parent account per pupil is
supported. The private completion card contains the permanent personal link, ready code
and a short copyable message. The parent opens that link and sees only **Код**
and **Войти**, without an editable login, role choices or setup instructions.
Submitting the code opens the parent cabinet immediately. Existing longer passwords still
work on ordinary login. The session lasts thirty days.

The ready card has an ordinary **Готово** button. Its code exists only in the
issuing page's memory and is cleared when the card closes or the page leaves;
it is not stored in browser storage or retrievable later. Opening existing
access shows metadata and the return link, and never changes a code. Replacing
it requires an explicit action. If acknowledgement is lost, show uncertainty
and refreshed metadata without claiming that the code is confirmed; do not
retry a credential mutation automatically.

Ready-code creation/replacement preserves the parent identity and login, and
revokes only that parent's old sessions and invitations. The server validates
Origin, CSRF, teacher role, ownership, exact four ASCII digits and expected
parent version, with a teacher rate limit before hashing. After asynchronous
hashing, its transaction rechecks the current teacher session/credential epoch,
child ownership and parent version. It stores only the password hash and does
not change the pupil's credentials or work.

The teacher's standard parent-access dialog issues ready codes only. Previously
issued invitation links and their API remain compatible, but invitation issuance
is no longer offered in this ordinary flow. Existing seven-day invitations still
let their recipient choose a code once; tokens are scrubbed from the URL.
Disabling parent access ends all of its sessions without affecting the pupil.
Changes to the pupil's password or QR do not change parent access.

Teacher, pupil and parent login display **Входим…** and three animated dots
immediately after submission, remaining busy through the first cabinet-data
request. Duplicate submissions are disabled. Reduced-motion preferences show
static dots; failures restore the usable form and explain the error.

The parent page is `/learning/parent.html`. It uses its own session cookie, so
visiting it does not turn a pupil's or teacher's browser session into a parent
session. The heading always identifies the parent role and the child whose progress is
shown. **Выйти** signs out only the parent session and returns to the code field
on the same permanent personal link; it never signs out a teacher or pupil.

A personal link contains the non-secret parent identifier in `#login=…`, never
the code. It remains usable after reload, logout, expiry or an explicit code
replacement. Only the code changes on replacement. Generic entry without a
personal link retains the old login fallback. Existing long passwords remain
accepted without adding extra instructions to the ordinary code-only screen.
Invalid or changed fragments cannot reuse a stale link identity or replace an
already signed-in parent; submitted requests use the captured intended login.

The parent page rechecks the session when it returns to the foreground. Its
reads and logout carry the expected parent login; if another tab changed the
parent cookie, the server refuses the stale page with
`LEARNING_PARENT_ACCOUNT_CHANGED` before returning child data or logging out the
new parent. The page clears the old heading and loads the current identity.

## What the parent can see

The parent sees the bound pupil's name, course/goal, eligible attempt counts,
recent outcomes and published homework status. Independently solved and helped
work are distinguished. Counts describe attempts, not mastered topics; recent
lists are bounded and labelled. Refreshing reads the latest saved server data. **Обновлено** displays the
server time of that projection; **Последнее действие** is the time of the most
recent eligible attempt. These are different facts. No pending browser-only or
free-trainer work is counted or claimed as synchronized.

Private teacher focus notes, plans, draft assignments, AI drafts, raw solutions,
answer keys, photo files/URLs, classroom activity and other pupils are excluded.
Archived work and unfinished exam attempts are excluded before aggregation.
The parent cannot solve tasks, submit homework, change results or control a board.

This view is not a screen recording. Public laboratory work that was never
saved to the pupil's managed account does not become tracked progress here.

## Deployment and rollback

When rolling back a code-entry UI change, retain server verification for both
four-digit codes and older long passwords. A pre-PIN input validator would
reject already-issued valid codes. Do not reset accounts or restore the database.

The parent module is part of the existing application image and uses the same
SQLite store through additive `learning_parents`,
`learning_parent_invitations` and `learning_parent_sessions` tables. It does
not rebuild or add a role to the original `accounts` table. Parent endpoints
terminate their namespace before generic learner middleware.

Before deploying an earlier version without parent support, stop/isolate the
application and retain the normal verified SQLite backup. In one transaction:

```sql
PRAGMA foreign_keys=ON;
BEGIN IMMEDIATE;
DELETE FROM learning_parent_sessions;
DELETE FROM learning_parent_invitations;
UPDATE learning_parents
  SET enabled=0, password_hash=NULL, epoch=epoch+1, version=version+1;
COMMIT;
```

Then start the previous compatible application. Keep all core accounts,
sessions, pupil QR data, attempts, homework, photographs and history. Do not
restore an older whole database over newer pupil work. The old application
ignores the additive parent tables and separate parent cookie. Re-enabling
parent access requires a fresh explicit invitation; old passwords or invitations
must not come back to life.

The seven-day lifetime applies only to newly issued pupil and parent invitations
after the updated backend is deployed. Existing invitations retain the expiry
saved in their row; explicitly replace a pending three-day invitation to obtain
a new seven-day link. Replacement invalidates the old invitation.

For a rollback of only the seven-day lifetime change, deploy the preceding
compatible application without modifying SQLite. Both versions check the stored
expiry, so already issued seven-day invitations remain valid until their saved
expiry; only newly issued invitations return to three days. No database migration
or whole-database restore is needed. Teacher bootstrap invitations remain three
days and session/QR lifetimes remain thirty days throughout.
