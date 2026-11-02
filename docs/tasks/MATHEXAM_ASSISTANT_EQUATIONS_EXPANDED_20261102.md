# Equations and inequalities — 21–23, 53–60

Owner request: all 100 cloud improvements. Dependency: math foundations PR412
head 037cc4fe2ac0e172bc8ae1514b7824820617035b. Branch
feat/assistant-equations-expanded-20261102. HIGH, ADR0011; standing owner
publication authorization applies, no external provider audit performed.

Add bounded linear/quadratic inequalities, quadratic equations, two-variable
linear systems, rational/radical/absolute-value equations, rational sign charts,
common-base exponential and logarithmic equations, simple trigonometric root
selection in a stated interval. Keep exact rational/surd arithmetic and explicit
domains; never grade from a floating-point approximation. New topics are offline
only. Unrecognized syntax or cases outside bounds receive honest coverage help.

Learning design: identify domain before transforming; one optional hint; retain
learner work; full derivation only on request. Check candidate roots in the
original domain, reverse inequality under a negative divisor, distinguish no,
one and infinitely many solutions. Trigonometric input states radians and a
bounded interval; explain periodicity before selecting roots.

Acceptance: independent substitutions, sign/endpoint/domain counterexamples,
extraneous-root rejection, exact root-set equivalence, bounded parser/resource
checks, zero model calls, real HTTP/browser regression. No schema or identity
change. Rollback source only. No real-pupil effectiveness claim.
