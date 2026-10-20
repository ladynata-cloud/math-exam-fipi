# Basic OGE contextual-help evidence

## Design consultation

- Provider/model requested:Anthropic / claude-opus-4-7.
- PR278; base59ca8d215312831a21494e3b67099b30b1e6013d;
  preparation heade34c1599230d4407d9162f5474b61a1d17db294f.
- GitHub Actions run39462468886, consultation job118765193110.
- Provider request at2026-10-20T17:01:32Z returned HTTP400:
  `invalid_request_error: Your credit balance is too low to access the Anthropic API.`
- Status:unavailable. No advice, response identity or approval was obtained.
  The bounded artifact was uploaded; the user was informed. Do not retry this
  unchanged balance failure automatically. The final external review remains
  pending; prior release exceptions are not applied to this task.

## Design decisions awaiting implementation evidence

- Keep the parent task mounted. Nested help is an optional presentation stack;
  it does not replace the parent generator or write new progress schemas.
- Current-task hint at the root; deeper exercises clearly use a simpler example.
- Preserve each child input/model state on back and reopen; reset only for a
  genuinely new parent task/step. Guard cycles, not arbitrary shallow depth.
- Each help opening marks existing assistance before showing content. Child
  completion never sends a parent check or independent-success event.
- Preserve diagnostic/checkpoint modes and read-only observers.

These decisions are internal design proposals based on the owner's request and
source inspection, not recommendations attributed to Claude.

## Technical verification

-15 mocked consultation/review boundary tests passed on preparation commit.
- Runtime, browser, independent review and production verification:pending.

## Historical percentage verification

The old `oge-basics-percentages-v2.test.mjs` is an unchanged release snapshot for
publication c1217cda05725b0ba8bfde327c76281d7917853f (#97), not a current broad CI
gate. All seven historical fixture hashes match that publication. Later reviewed
changes added course links, managed loading, two hint corrections, and SEO.
Against the untouched current parent it reports 4 passes and 5 failures:
historical index hash, historical trainer hashes, its ban on the current SEO
canonical URL, historical catalog count, and no server changes since its old
base. These pre-existing failures are not described as passing or suppressed in
the historical test.

The new workflow instead checks the current task boundary: all six percentage
sources are byte-identical to the named current base, the old fixture itself is
unchanged, and removing exactly the marked external navigation injection restores
the current-base index byte for byte. The teaching-bank extraction and current
arithmetic/learning contract gates cover the active runtime. No claim is made
that a historical fixture's 288,000 examples validate newly changed code.

## Internal implementation review

Independent internal review found one reproducible percentage keyboard defect:
after opening a lesson and returning, Enter was handled by the hidden lesson.
The adapter now routes the visible practice input to its original checker; a
regression test exercises the keyboard path. A separate integration inspection
corrected helper selection for multiplication write/carry events and decimal
place tasks. Chosen rightmost digits are written immediately in the microtask.
No unresolved blocking internal finding remains before cloud browser review.
This is not an external model approval.

Local evidence: 26 prerequisite microtasks, a six-level journey, 34 unchanged
standalone sources, 26 public managed wrappers and four special practice pages.
Focused DOM suites cover exact draft/model retention, assisted-credit integrity,
accepted arithmetic steps, read-only controls, percentage keyboard/feedback and
late optional loading. Current bank:35 sources /396075 bytes. Existing current
contracts pass for2000 division tasks /5142 steps,198 legacy envelopes,22 robot
scenarios /470 verified steps,17 division stages /226 actions /180 old tasks.
Browser/mobile checks and publication remain pending at this preparation point.

First cloud head2ab2a0f90d90e58850f3e5d8f65c133fe6f502f4: current math and34
contextual DOM tests passed; all70 routes opened and the six-level320px helper
journey passed. Screenshots were inspected. The new browser scenario incorrectly
expected a numeric input before the legacy quotient-choice step; it now selects
the real visible digit and verifies immediate writing first. Two older browser
suites now open the new visible help control and retain their original arithmetic,
storage and assisted/independent assertions. The read-only renderer preserves a
static fallback when optional help is unavailable; the two existing persisted
server-envelope tests and full division DOM suite pass. These fixes require a
new exact-head cloud run; the first run is not reported as a passing final gate.
