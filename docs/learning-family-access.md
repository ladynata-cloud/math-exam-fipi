# Pupil self-entry and parent progress

## Pupil entry

An existing pupil can choose their own password through a private invitation.
The password may contain 8–128 characters; digits alone are allowed. Teacher
password requirements remain unchanged. Both a first invitation and a newly
issued replacement pupil invitation last seven days. Opening the page does not
consume the invitation; successful activation does.

The teacher sends only that pupil's invitation. After activation, a separate
non-secret return link can prefill the existing login form. It still requires
the pupil's password and never switches an already authenticated account.
Activation keeps the pupil's identity and learning history, and invalidates
their previous sessions and QR grant.

## Parent entry

In **Мои ученики**, choose **Доступ родителю** beside the intended pupil. Enter
the parent's display name and issue a private invitation. One parent account
per pupil is supported in this version. The parent receives a separate login,
opens the invitation and sets their own password of 12–128 characters. The
invitation lasts seven days; an authenticated session lasts thirty days.

Copy and save the invitation before closing its guarded card. A non-secret
return link and login remain available from the teacher's parent-access dialog;
the invitation secret cannot be retrieved again. If the issuing response is
lost, refresh the metadata and explicitly issue a replacement. Do not create a
second pupil account or reuse the pupil's password for the parent.

Issuing a replacement immediately disables the old parent's password and
sessions, then lets the parent choose a new password through the new invitation.
Disabling parent access ends all of its sessions without affecting the pupil.
Changes to the pupil's password or QR do not change parent access.

The parent page is `/learning/parent.html`. It uses its own session cookie, so
visiting it does not turn a pupil's or teacher's browser session into a parent
session. Sign out of the parent page before entering a different parent account.

## What the parent can see

The parent sees the bound pupil's name, course/goal, eligible attempt counts,
recent outcomes and published homework status. Independently solved and helped
work are distinguished. Counts describe attempts, not mastered topics; recent
lists are bounded and labelled. Refreshing reads the latest saved server data.

Private teacher focus notes, plans, draft assignments, AI drafts, raw solutions,
answer keys, photo files/URLs, classroom activity and other pupils are excluded.
Archived work and unfinished exam attempts are excluded before aggregation.
The parent cannot solve tasks, submit homework, change results or control a board.

This view is not a screen recording. Public laboratory work that was never
saved to the pupil's managed account does not become tracked progress here.

## Deployment and rollback

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
