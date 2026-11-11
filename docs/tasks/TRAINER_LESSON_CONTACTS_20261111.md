# Lesson contacts and worked GIF examples inside ten trainers

## Identity
- Owner: Наталья, direct request in the current task on 2026-11-11.
- Base branch: `main`; base SHA: `2312d1363e804ec307fd2b19e352cfebd31a1291`.
- Branch: `feat/trainer-lesson-contacts-20261111`.
- Review level: `MEDIUM` (bounded presentation across shared renderers).
- Related ADR: none; no new trainer architecture.

## Goal and evidence
Offer a worked GIF example and a real online lesson with Наталья Михайловна
beside existing independent practice and help choices. The owner's screenshot identifies the division
prerequisite panel. Existing `/lessons/#contact` contains her Telegram, VK and
email; the homepage already uses this destination.

## Approved scope
Ten placements: long division, negative numbers, OGE 6, 9, 11, 13 and 21,
EGE base contextual remediation, profile first-part geometry (cards 1–3 in
the same skill map placement), and the trigonometry trainer skill map.
Each uses one short topic-specific paragraph and a normal contact link opening
in another tab. A shared small stylesheet provides contrast, focus and touch
sizing. No overlays, automatic contact messages, price claims or new tracking.
Mathematics, answers, hints, success accounting, saved state and board protocols
remain outside scope. Generic renderers must limit the invitation to the selected
public trainer entrances. Existing free practice choices remain available.
Mount the small presentation block through the existing public navigation
script. Trainer HTML and the standalone division download remain byte-identical.

The owner requested GIFs in the same places. Include twelve worked examples,
with separate visuals for profile geometry №1, №2 and №3. The basic EGE help
panel selects a matching GIF for percentages, fractions, signed numbers or
equations. Open each example on demand, with static frames, a play/stop
control and a text version. Use examples separate from the current task.
The checked-in media is built by `python tools/build_trainer_skill_gifs.py`.

The owner then asked for tutoring offers on the trainers found through public
entrances, after improving the entries and navigation. Add direct practice
links to the five topic cards on the homepage, practical shortcuts on the five
topic pages, and clearer return links in the showcase. On the selected trainer
pages, offer a route back to the relevant explanation and to related practice.
New offers point to `/lessons/#contact` and open in a separate tab. Keep the
existing offer in the original ten placements. Put links in the OGE diagnostic
and percent-table results, and scope the cone offer to its showcase exercise.

Scope evidence: links from the homepage, its five topics and the four showcase
examples, plus previously identified rounding and five public trainer pages
with impressions in Google Search Console. Impressions establish search
visibility. No claims about confirmed visits are made. Refresh the exact source
bindings for the five modified topic pages through the existing tool.

## Acceptance criteria
- [ ] All ten selected places offer a contextual lesson link.
- [ ] Contact target is the existing `/lessons/#contact`, in a new tab with noopener.
- [ ] Opening contacts leaves the task, input and stored learning state intact.
- [ ] No lesson link goes through prerequisite return/assistance handlers.
- [ ] All twelve GIFs play from their intended help panel and offer static frames.
- [ ] Viewing the example leaves the learner's task and attempt state intact.
- [ ] Homepage, topic and showcase links reach the stated exercises and anchors.
- [ ] Trainer navigation and the optional lesson link work in the intended public mode.
- [ ] Relevant regressions, syntax and diff checks pass.
- [ ] Release and live verification are recorded in the PR.

## Checks and review
Targeted existing division/skill-support, OGE and EGE tests; inline JS syntax;
focused navigation/state checks; `git diff --check`; applicable GitHub checks.
Review topic wording, placement, ordinary navigation and unchanged calculation
logic. No new trainer or substantial learning sequence; external design/audit
not performed under the standing owner policy. Report browser and real-pupil
checks separately and truthfully.
Final gate: `TRAINER_LESSON_CONTACTS_OK` after applicable checks.

## Risk and rollback
A misplaced invitation or stylesheet could distract or overflow. Keep it inside
help/options, use existing contact details, verify phone widths and unchanged
answers. Roll back the scoped commit with a normal revert; no data migration.

## Permissions
Owner's direct request supplies START for this bounded change. Branch, local
commits, push and Draft PR are allowed. Release authorization:
[standing owner policy](../OWNER_RELEASE_AUTHORIZATION.md), after successful
checks and fresh base/head verification. No new publication permission needed.

## Execution record
Initial clone was clean and matched authoritative main. Existing project status
is historical; this task does not claim prior packages are live. Exact head,
PR, checks, reviewed base, deployment and public results belong in the PR record.
