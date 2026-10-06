# Variable-base logarithmic inequalities

- Date: 2026-10-06 (Asia/Novosibirsk)
- Base: `main`, `433af336add696b5a00f53da8b6514d8be8c68f1`
- Branch: `feature/profile-log-inequalities`
- Review: MEDIUM; bounded author content and trainer UI using existing local
  progress and BoardBridge patterns, with no new server protocol or account API.

## Owner request and source

Create an interactive profile-EGE trainer from the mathematical themes at
https://math-ege.sdamgia.ru/test?theme=313&print=true with changed numerical
conditions. The page is about variable-base logarithmic inequalities and
rationalization, rather than elementary logarithm evaluation.

The source contains 39 entries, including one duplicate. Original HTML/SVG
inspection identified logarithmic domains, reciprocal logs, preliminary
simplification, absolute values, powers, nested logs and exponential
denominators. Mathematical methods guide twelve author-written families with
four new numerical variants each. This is not a verbatim reproduction or a
claim that every one of the source's 38 unique subtypes is reproduced.
Source solution text and images are not republished.

## Scope and learning route

- Canonical public URL: `trainers/ege-profile/log-inequalities/index.html`.
- Worked example, guided practice and independent answer construction.
- Original domain, preparatory transformation, rationalization, critical points,
  interval signs and final intersection. Accepted steps remain visible.
- Exact deterministic tasks and full current-work restoration. Independent
  results distinguish hints, mistakes, worked examples and familiar repetition.
- Accessible keyboard controls, native mathematical formulas, mobile layout,
  locally saved work, and a report the learner can send manually.
- Existing ordinary mirrored board registration and links in the profile hub.
  Group-cabinet allowlists, account assignment and durable server assessment are
  outside this task; ordinary board integration is not labelled as those features.
- No sounds, external formula CDN, account changes or production learner writes.

## Required verification

1. Independently compare all authored original expressions, original domains,
   reduced signs and solutions on every interval and boundary; check isolated
   answers, cancelled holes, logarithmic denominators and nested domains.
2. Confirm all 48 conditions are distinct and numerical variants are new.
3. Test actual learner input, errors, hints, explicit continuation, retained work,
   reload, duplicate results, changed browser storage and corrupt data.
4. Test 320/390/1280-pixel layouts, keyboard controls, report fallback and
   two-frame BoardBridge hydration, edit, restoration and silent remote apply.
5. Run existing registry, profile and relevant learning gates. Keep their original
   assertions; update only exact catalogue expectations for the new entry.
6. Gate: `PROFILE_LOG_INEQUALITIES_BROWSER_OK`; compare production assets with
   the reviewed bytes after publishing.

## Review, release and rollback

Independent source/mathematics review and separate UI/bridge verification.
Primary risks are missing original exclusions, false sign equivalence, numerical
boundary errors, misleading independent progress, and incomplete restored state.
Rollback is reverting this bounded addition; its local-storage key is isolated.

The current request authorizes implementation. The owner's standing session
authorization covers publication without a separate external review; internal
mathematical and browser gates remain required. Follow exact-head, current-main,
tree-identity and production-asset checks. No force or admin operations.

## Execution

Implementation and verification in progress. Release evidence is recorded in
the task PR; repository status is reconciled at the next approved task.
