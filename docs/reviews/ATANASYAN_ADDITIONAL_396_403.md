# Additional cylinder exercises396–403: review and cloud evidence

## Source and authored result

Base: ea5b6cb9e931eee63224fbc4c13b2ac43326cc19, the published PR402 release.
The nine new cards use the existing course architecture:38 justified steps,
40 reachable model states, original exercise numbers and Cyrillic400а/б.
All653 published lessons and renderer/storage/schema bytes are frozen in
additional396-baseline.json, read from that exact base. The old9,871,616-byte
bundle reconstructs to git blob78a10871af90492b24c9e67ab126420801f3469c and SHA256
bfdde328f944da9bf268ee4c339ef742e82030c32dea5a28fcbfb2ec304d9b5b.

Printed112 / PDF114 was visually inspected in the owner-provided2024 textbook.
Answer material on printed265 / PDF267 was checked separately. No textbook
pages, extracts or private identifiers are committed.

| Exercise | Verified result | Important reasoning |
| --- | --- | --- |
|396|√3S/2|The cutting plane is parallel to the axis; half-radius offset gives chord√3r.|
|397|a√3/3|Orthogonal projection is an inscribed rectangle with sides a and a/√3.|
|398|Exactly one generator|The base trace is tangent to its circle; any second generator contradicts unique tangency.|
|399|√((S₁²+S₂²)/(2π(S₁+S₂)))|Rotation swaps radius/height; use the sum and sum of squared full areas.|
|400а|3/2|Axial square means h=2r.|
|400б|2 or5/4|The source does not specify which rectangle side is the height; both orientations are valid.|
|401|(2+√3)/2 or(2−√3)/2|Both roots of the area equation are positive and must be retained.|
|402|h=p/2, r=p/4|At fixed diameter-plus-height, the product is maximal when diameter equals height.|
|403|414π cm²|Outer wall192π, inner wall150π, outer floor36π, inner floor25π, rim11π.|

The explanations and drawings were reviewed by the author for source fidelity,
mathematical validity and the learning sequence. This is not an independent or
external provider review. Such an audit is not required under the active
[owner policy](../OWNER_RELEASE_AUTHORIZATION.md).

## Technical review and preservation

The source index changes only eight requiredParts contracts. Number400 retains
the original two Cyrillic sourceSubparts. New catalogue entries derive from the
new lesson files. Historical653 source bytes and2000 ordered browser cases are
frozen;64 new cases append, bringing the total to2064.

Historical640/594-card regression projections first validate the exact new
increment and restore the frozen653 boundary. Existing mathematical expectations
remain unchanged. The IV self-check browser now uses the actual bundle count
while retaining all13-card,31-step,45-state and fraction assertions.

No production engine, CSS, shared viewer, schema, identity, revision or browser
storage format changes. The403 mesh has an open top, annular rim and both inner
and outer surfaces. The399 drawing explicitly describes which rotation it
shows. The400б states show each permitted axis;401 explains both positive roots.

## Planned cloud evidence

- Reproducible course build and catalogue/schema checks.
- Full source/model/content/runtime/storage and shared-consumer regressions.
- 2400 positive mathematical parameter families and six deliberate corruptions.
- Exact raw653-card preservation and five negative integration controls.
- All nine production cards at320/390/1280, every40-state set, enlargement,
  rotation, stacked fractions and persistence across reload.
- Full662-card browser distribution, all historical cases retained.
- Actual screenshot artifacts reviewed after Actions complete.

At this commit these cloud checks are pending; no CI or publication PASS is
claimed. Exact head/run/artifact identifiers and ready-result visual findings
will be recorded in the PR after execution. Physical devices, a real-pupil
pilot and external provider audit are not run.

## First cloud pass and visual correction

Head d87aa8aab4bb784b41f1dab6813a080568160c8b passed focused
[run41513929840](https://github.com/ladynata-cloud/math-exam-fipi/actions/runs/41513929840):
source/build/schema/geometry,2400 mathematics families,6 mathematical negative
controls,653-card preservation,5 integration negative controls, runtime and
57 distribution controls;27 browser journeys,120 model states,162 stacked
fractions and174 screenshots at320/390/1280.

Artifact13173863281 has ZIP SHA256
51f419de6de04d8f2b5dd9ea6047b81e390f4d0d755799da709465644b80b333.
Its synthetic merge9697dc7649cc0b7e9cf94e9e53951a3cef719de8 has exactly the
candidate tree798e046d29f68e0bed165d269300c21a59c72f6d and the recorded base/head
parents. The complete bundle SHA256 is
38cf08070b70884539078a74742d6f1947c512f7ce56d6dc907a29abb44f45b8.

Visual inspection covered all40 narrow-screen model states, all nine initial
pages and final formula/answer areas of399,400б,401,402,403. Geometry, hollow
cup and stacked fractions were readable. Several long titles broke inside
words at320px. The titles are shortened in this follow-up while keeping
conditions, proofs and geometry unchanged. Updated content hashes and bundle
are deliberate. All applicable Actions must pass again on the new head;
the preceding pass does not constitute final release validation.

## Release and rollback

Publication requires successful applicable Actions, a clean scoped diff,
authoritative current main/head verification, an identical squash-merge tree
and successful Pages deployment followed by public route verification.

Standing authorization covers the requested continuation. Immediately before
merge record: authorized base, actual current main, drift, validity, virtual
composition (if needed), rerun gates and whether a new owner decision is needed.
Rollback is a normal revert plus checked Pages publication; learner storage
must not be deleted. No rollback has been performed.
