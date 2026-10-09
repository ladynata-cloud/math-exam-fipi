# Pupil entry by QR or personal link

## Teacher workflow

In **Мои ученики**, select **Вход по QR** for the intended pupil. The dialog
shows whether a personal entry card is enabled and when it expires. Issue a
card, copy its link or download its QR image, then explicitly acknowledge saving
it. Share that private card only with the pupil or their parent.

The QR and link are two representations of the same key. A phone can scan a QR
shown on another screen or paper. When viewing the card on the same phone or a
laptop, open the clickable link instead. A printable PDF can make its QR and
**Открыть мой кабинет** button clickable. Both devices reach one account and
server history, with separate browser sessions.

No pupil password is needed for this entry method. An existing password is not
changed. The card is valid for 30 days. Anyone with the private card can use
that pupil's account, so it must not be included in public pages or screenshots.

Replacement disables the previous card and its QR sessions. Disabling a card
has the same effect without issuing another one. Ordinary password sessions,
other pupils and the teacher's account are unaffected. Password recovery or
replacement invalidates the pupil's QR card as well.

An already signed-in account is not switched automatically. Sign out first,
then reopen the intended personal link or scan its QR again. A missing, expired
or disabled card shows a request to obtain a new one from the teacher.

## Lost or interrupted issuance

The secret is not recoverable from the server. If a network failure occurs after
issuance, reopen the dialog to see current metadata and explicitly create a
replacement if needed. A stale dialog cannot replace a newer card. A page
reload may discard the only displayed copy; the save/discard guard makes that
consequence visible. Credentials are never saved in browser local storage.

## Deployment and rollback

The cabinet contains its QR encoder under `learning/qr.js`; it needs no CDN or
additional deployment environment variable. It embeds the unmodified upstream
`qrcode-generator@1.4.4` source with a narrow wrapper. Its MIT license, source
and pinned package integrity are in
`learning/vendor/qrcode-generator.LICENSE.txt`. Independent `jsQR` checks decode
both the displayed SVG and downloaded PNG, including a production-length link.
New SQLite tables are additive.
The existing sessions table keeps its schema for compatibility with older
binaries. Database backups retain their existing private-file handling.

Before rollback, stop or isolate the serving application, take the normal
verified SQLite backup, then in one transaction delete sessions listed in
`learning_quick_sessions` and invalidate `learning_quick_access` grants by
clearing their hashes and incrementing their versions. The session foreign key
cascades binding cleanup. Do not delete learner accounts, attempts, homework or
normal password sessions. Run the rollback only through the authorized operator
workflow, never as a public HTTP endpoint or a source-code fixture.

With the application stopped and the verified backup retained, the database
transaction is:

```sql
PRAGMA foreign_keys=ON;
BEGIN IMMEDIATE;
DELETE FROM sessions
  WHERE hash IN (SELECT session_hash FROM learning_quick_sessions);
UPDATE learning_quick_access
  SET hash=NULL, expires_at=NULL, version=version+1;
COMMIT;
```

Then start the previous compatible application. Do not run a schema downgrade
or restore an old whole database over newer learner work.

The older binary ignores the additional tables. QR-only pupils then need a
normal private invitation or replacement password from their teacher; their
learning history remains intact. Re-enabling the feature requires issuing new
cards, not reviving expired or revoked keys.
