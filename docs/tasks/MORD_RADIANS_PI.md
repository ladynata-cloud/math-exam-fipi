# Radians input through π

Owner request: display the radians input as multiples of π, including after dragging.
Review: SMALL. Base d3df2d65e861ac6dc79cda9cb88853db92b2f6c8 (published PR #178).

Scope: circle model input only; exact rational multiples use π fractions, other
positions use a decimal coefficient with an explicit rounding note. Numeric
position is not rounded or snapped. Unicode π and existing pi syntax remain
accepted. Enter/apply normalize the input. Reapplying generated text must not
change the original angle. Zero remains 0. Existing reading/lesson math and
saved progress schemas are unchanged.

Validation: existing model math gate, focused real-browser input/drag/keyboard
checks, and required cloud gate. Standing owner publication authorization and
separate-review/final-acceptance exception apply; no external approval claimed.
Release identities and production evidence will be recorded in the PR.
Rollback: ordinary revert; no data migration.
