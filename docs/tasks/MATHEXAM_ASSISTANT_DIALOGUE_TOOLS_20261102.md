# Assistant dialogue and input tools — 6–14 and 86–95

Owner request: implement all 100 cloud improvements. Base PR409 head
`e63b56f3506bf2ef6661021eaf5662e1d9c03721`; branch
`feat/assistant-dialogue-tools-20261102`. Review HIGH: deterministic response
metadata and learning interactions. ADR0011 accepted. Publication authorization:
`docs/OWNER_RELEASE_AUTHORIZATION.md`; no external consultation/audit performed.

Task-first design: keep the condition and original numbers visible, suggest a
recognized topic with a manual override, show the interpreted expression for
explicit confirmation, then one optional hint. Preserve earlier cards when the
learner edits their work. A misconception check is optional; two independently
submitted wrong attempts offer help without opening a solution. Check up to six
linear equalities as equivalent solution sets; do not claim proof of an unstated
operation. Unsupported lines remain explicitly unchecked.

Add mathematical input keys, safe MathML fractions/powers/roots, bounded term
explanations, answer-format guidance, copy/print selection, tab-only bookmarks,
font/contrast controls, keyboard navigation and mobile section jumps. No raw
text is persisted, no external service or inference call is added. Accessibility
preferences also stay within the tab. Do not modify cabinet authorization.

Acceptance: reject unsupported/ambiguous syntax, preserve attempts/cards and
consent boundaries; wrong-attempt status derives from exact checking, not text
sentiment. Unit/property checks for grammar/equivalence, HTTP contracts and real
mobile/desktop browser scenarios including XSS, keyboard, copying and printing.
Rollback: scoped source revert, no schema change. Real pupil validation and
assistive-technology pilot are not claimed by synthetic checks.
