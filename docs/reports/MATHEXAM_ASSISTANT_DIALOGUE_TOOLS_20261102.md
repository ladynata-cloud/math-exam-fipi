# Dialogue/input validation — 6–14 and 86–95

Source base PR409 (merged as 6ee806594493320738ffc6761e079fd686374990).
Standing owner authorization applies. No external provider review was performed.

177 service tests passed. New checks cover bounded Russian phrasings, ambiguity
spans, exact attempted-answer status and linear solution sequences. An
independent affine construction checks 240 correct and 240 altered transitions.
The first unrecognized or non-equivalent line stops checking later lines.

11 browser scenarios passed (9 top-level plus 2 subtests), including real local
service on desktop/mobile, MathML preview, manual topic override, preservation
of previous attempts, two-error optional hint without a full-solution leak,
editing a saved attempt, bookmark focus, print selection, clipboard text,
mathematical keypad, font/contrast and widths 320/390/1280. XSS, provider consent,
no browser storage, session deletion and previous topic flows still pass.

The first browser run exposed five outdated selectors/assertions: they expected
replacement of prior cards, one summary control per card, or plain slash text
inside MathML. Updated checks inspect the latest response, explicitly verify
retention, address controls by their names and inspect mathematical source text.
No product gate was disabled. The complete rerun passed without skipped tests.
Both source-course gates and git diff --check passed.

Limits: sequence checking is for supported linear equations only; equation
solution equivalence is not a proof of an unstated manipulation. Unsupported
attempts do not count as errors. Understanding questions are brief checks, not a
mastery score. Topic inference is a suggestion and can be overridden. Bookmarks
and accessibility controls are tab-only. Actual screen-reader/user learning
validation, production deployment and exact-head cloud CI are not claimed here.

Prior package reconciliation: PR409 cloud CI 41361562970 passed, including the
Docker durable restart. Merge parent 4410695 and tree d1e4acc were verified.
The preview image and browser evidence are retained by CI; no Amvera deployment
was performed. Cloud hosting credentials remain the production blocker.
