# Lesson workspace v1 gate

This gate uses synthetic accounts and disposable SQLite databases. It never
connects to the deployed cabinet. Its two local hosts deliberately differ:
`127.0.0.1` for the authenticated cabinet and `localhost` for the credential-free
trainer. All browser requests outside those exact origins are blocked.

Run from the repository root with Node 24, the locked `board-server` dependencies,
Playwright 1.62.1, jsdom 26.1.0 and an installed Playwright Chromium:

```sh
node tools/lesson-workspace-v1/gate.cjs
```

`NODE_PATH` may point at separately installed test tools.
`CHROMIUM_EXECUTABLE_PATH` may identify an installed browser.
`LESSON_WORKSPACE_ARTIFACTS` selects a disposable output directory for synthetic
screenshots and `result.json`. There is intentionally no option for a production
server, a real account or skipping required browser checks.

## Coverage

- All backend tests, including the new exact-task/private-rehearsal and bounded
  per-seat queue contracts.
- Real picker interactions, no-write selection, order/removal, exact source/seed
  identity, the twelve-material bound and stale/disposed context guards.
- Actual cabinet application DOM integration (`dom.cjs`).
- Chromium teacher/pupil journey using the existing `ege-path` managed trainer:
  exact selected task in private preparation; real hints/answer/step controls;
  starting from the intended pupil card; pupil join; explicit handoff both ways;
  saved answers, completed steps and actual mouse handwriting; A → B → A;
  reload and a second-device late join; failed-save recovery.
- Failed material-selection saves and a genuine delayed selection response after
  the teacher has opened another pupil's card.
- Read/write denials for another pupil and a genuinely authenticated parent.
- Credential/header and semantic hydration audit across the two origins.
- 320 px and 1280 px layout assertions and screenshots, including the complete
  first condition in the initial viewport for preparation and both lesson roles.
- Existing eight-seat classroom and course-navigation browser regression gates.

The final `LESSON_WORKSPACE_V1_OK` is printed only after all of those processes
pass. `LESSON_WORKSPACE_V1_BROWSER_OK` covers only the new Chromium journey.
A local environment unable to bind sockets or launch Chromium can run syntax
and DOM checks separately, but cannot claim either browser or final gate success.
CI is the required browser execution path in that environment.
