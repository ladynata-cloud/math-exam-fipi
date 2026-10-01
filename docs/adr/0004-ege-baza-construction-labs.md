# ADR 0004: interactive construction lessons for base EGE

Status: Proposed
Date: 2026-10-02

## Problem

A collection of answer fields does not teach a learner to build an auxiliary
segment, distinguish a forbidden boundary from a zero, or understand how a
three-dimensional change affects volume. Existing MathExam trainers contain
useful models but their progress conventions and level of guidance differ.

## Proposed approach and prototype

Prototype four isolated lessons at `ege-baza/labs/index.html`. Use the existing
local Three.js r128 asset for solids and SVG for exact planar constructions.
The learner chooses tools and points, gives a mathematical justification, then
calculates. Solid parameters and analytical quantities share one mathematical
model. Algebra moves from domain to boundaries to a learner-built solution set.

Use buttons as alternatives to selecting points or rotating by pointer. Show a
short task above the model on narrow screens. Animation starts only on request,
stops when leaving the lesson, and pauses when the document becomes hidden.
Keep practice and independent checks separate. Mark help during a check and
repeat attempts. Export an explicit report; do not infer durable mastery.

This prototype intentionally has no storage writes, bridge contract, server
integration or registry changes. Existing course state remains authoritative.
The prototype is not an accepted platform primitive or a course-wide rollout.

## Reuse and boundaries

- Reuse `ege-profil/trainers/stereo/js/three.min.js` unchanged.
- Adapt the existing stereo interaction approach, local exact geometry and
  point-selection teaching pattern without editing its generated bank.
- Reuse pedagogical mechanisms from trigonometry and inequality trainers,
  but do not import their potentially assisted success statistics as mastery.
- Keep profile-only and advanced exercises outside the required basic route.

## Evidence and decisions still required

Mathematical tests cover volume conservation, similarity, actual constructed
lengths, trigonometric identities, domains and all interval boundaries. Real
Chromium/WebGL tests exercise all lessons, 18 check answers, help/repeat states,
report download, keyboard controls, touch taps and three viewport widths.

Before broad rollout: independent review, explicit owner acceptance of this
archetype, subtype coverage review, novice pilot and a separate decision about
progress integration. The current task author does not claim independent or
external review. No release authorization is included.

## Alternatives

An iframe-only catalogue would preserve trainers but would not enforce the new
teaching sequence. A new general geometry engine would increase scope and risk;
the prototype uses constrained, exact constructions instead. It is not a full
GeoGebra replacement.

## 2026-10-02 prototype extension (still Proposed)

The follow-up prototype adds prerequisite detours with restoration of the exact
problem step, graphical algebra and percentage models, and basic-operation
practice. Existing navigator links are added, but registry completion and module
state contracts are not changed. Assessment exposure is tracked within each open
page, including overlapping transfer practice. The geometry prototype now asks
for a construction idea before selecting points and offers a perpendicular tool.
This evidence does not itself accept the archetype or authorize rollout.
