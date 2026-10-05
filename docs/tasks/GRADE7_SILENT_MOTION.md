# Grade 7: silent animated lessons and the opening algebra course

- Date: 2026-10-05, Asia/Novosibirsk.
- Base: `main` at `6d21ca0866733a85d69c9f6d7a82375c8f46b964`.
- Branch: `feat/grade7-silent-motion`; review level: HIGH.
- Owner requested implementation and retains explicit permission to publish
  without a separate external review. No additional approval round is needed.

## Goal and scope

The main product direction is now grade 7: Makarychev algebra and Atanasyan
geometry, with ongoing school-year support, optional earlier foundations and
summer consolidation. The current deliverable expands the opening algebra
block through equations and word problems. It does not claim completion of
either entire textbook or every numbered exercise.

Replace the seven current mathematics clips with genuine stepwise animation.
Add eight explanatory clips for the opening algebra sequence. The owner then
requested thirty videos: fifteen mathematical explanations plus fifteen short
walkthroughs recorded from the actual linked trainers, showing input, checking,
hints and new examples with large captions and highlighted controls. Remove all audio
tracks, including from the archived help clip. Animations show terms moving
across equality with sign changes, distribution to every term, number-line
movement and geometric strokes/angle highlighting. Previous correct solution
rows remain visible; a wrong example is not part of that record. Explain that
transfer abbreviates the same operation on both sides.

Expand the existing school workshop with eighteen authored focused lessons,
preserving six existing lessons: twenty-four lessons in a dedicated freely
navigable Makarychev route. Include explanations, interactive models, seeded
exercises, step hints, new analogues, independent checking and earlier-topic
return. Use the recorded basic 2024 edition as the topic-order reference;
unknown page numbers remain unspecified. Existing browser-local school progress
must remain honestly distinguished from managed cabinet attempts.

Link the course, videos, printable references and exact practice entries from
the cabinet and public pages. Preserve account, attempt, submission, group,
auth, persistence and assessment contracts. The owner subsequently explicitly
requested adapting the main entry to this new direction: add a grade-7 hub and
reorient the home-page introduction, retaining links to other courses. Do not
remove EGE material. No messages, actual account provisioning,
external voice synthesis, credentials or hosting-setting edits.

## Implementation boundaries

Extend the existing trusted school manifest with bounded `motion_ms` and a
deterministic `seekMotion(progress)` studio hook. The renderer samples actual
frames at twelve frames per second during motion and holds the final frame
for reading. Existing DVI voice/click/still rendering stays compatible.
School requests normalize to silent even if an old client requests sound.
Legacy uncertain client requests are never rewritten under an old idempotency
key or automatically resent as a different request.

## Acceptance and verification

- All thirty active videos (fifteen explanations and fifteen trainer walkthroughs)
  show meaningful motion or real UI actions and have zero
  audio streams; archived help also has zero audio streams.
- Three authored presets per topic have correct mathematics; final new tasks
  do not reveal their answers. Motion never changes valid mathematical signs
  merely because terms are rearranged on the same side.
- Reader and both export orientations fit at start, midpoint and end; correct
  history remains readable. Pause/replay/keyboard/reduced-motion are supported.
- Twenty-four algebra lessons accept actual answers, diagnose errors and
  preserve existing local work. New task generation and assistance are checked.
- Worker audio, resource limits, cancellation, trusted-origin and legacy DVI
  gates pass; meaningful course/math/browser tests and exact-head CI pass.
- Independent content and code review; whitespace and sanitized handoff checks.
- Verify fresh authoritative base/head immediately before merge; verify merged
  parent/tree, Pages deployment and exact public bytes after publication.
- Gate: `GRADE7_SILENT_MOTION_OK`.

## Implementation evidence and pending verification

- Implemented source: twenty-four Makarychev opening lessons, comprising six
  preserved lesson IDs and eighteen new lessons. The linked media set is thirty
  active videos: fifteen mathematical explanations plus fifteen real-trainer
  walkthroughs. All thirty are rendered and included in the repository media
  directory, together with the separately counted archived help clip.
- Independent local code review found no remaining blocker in motion sampling,
  silent-school normalization, legacy uncertain-request handling, preservation
  of old school state, public-only lesson guides or the fixed trainer-recording
  adapters. Existing DVI behavior, ownership checks, cancellation and working
  disk limits remain in the rendering path.
- The replay-pause issue is fixed and reviewed. Outdated duration/size labels
  were removed. Completed local checks include:
  - 44 worker tests and the legacy video-factory contract gate;
  - 2,208 course cases, 7,022 checked intermediate answers, 24 actual lesson
    flows at two widths (48 layouts), and restored prior browser progress;
  - 90 topic/preset/orientation motion journeys, 30 pixel comparisons,
    historical-prefix/sign checks, mobile navigation and export layouts;
  - 15 one-page A4 sheets and all 15 real-trainer walkthrough recordings;
  - all 31 encoded files at 1280 by 720 with H.264 video and zero audio streams,
    including decoded within-scene motion checks for all 15 mathematical clips;
  - actual playback of all 30 active videos, 30 public layouts, seven original
    practice flows and the grade-7 hub;
  - the real HTTP/SQLite cabinet regression with all 30 video sources,
    no attempt creation or MP4 fetch before explicit action, and isolation of
    managed progress from public school lessons.
- Independent mathematical review of the eight new topics covered all three
  presets each, 195 scenes and 30 motion descriptions. All 24 worked examples
  passed arithmetic, identity, root, linear-case and word-problem checks;
  no mathematical blocker remains.
- School progress remains browser-local and distinct from managed cabinet
  attempts. No production pupil account was created; no
  authentication, account or hosting settings were changed.
- Local combined gate: `GRADE7_SILENT_MOTION_OK`. Exact-head CI and publication
  verification remain outstanding. No merged PR, production deployment or live
  asset match is claimed by this snapshot.

## Risk and rollback

Main risks are incorrect animation correspondence, unreadable history at export
sizes, stale cached video URLs and accidental loss of prior local progress.
Use deterministic schemas, independent arithmetic checks, decoded-frame
inspection, new asset revisions and the existing stable state keys. Reverting
this scoped change restores previous course/media assets without deleting
student data. Live account activation remains a separate operator task.
