# ADR 0006: source-mapped interactive geometry course

Status: Proposed

The owner's 2026-10-02 request authorizes a grades 7–9 extension, interactive geometry manipulation and progressively independent proofs. The read course constitution and existing single-file trainers are retained as the educational baseline.

Source is Atanasyan et al., Geometry 7–9, basic level, 14th revised edition, 2023. The visual contents audit found 15 chapters and 137 numbered points. The older 7th-grade site covers mainly chapters I–IV and does not establish coverage of this edition's chapter V.

New lessons have a semantic configuration, mathematical generators, proof dependencies and interactive construction goals. Build sources may be shared, but each generated lesson is an autonomous HTML file with embedded dependencies, preserving the established download/open workflow. A single manifest serves the source/topic and prerequisite map.

A point receives coverage only through actual lesson material or a relevant retained trainer, not by changing a status field. Source-defined topics, principal task types, advanced problems and supplements are separately described. Mathematical validation of a finite drawing is evidence for the drawing, never a universal proof.

Learners can manipulate controls by pointer and keyboard. A construction stores geometric relationships and recomputes dependants; an unqualified arbitrary line cannot pass a constrained construction goal. Proof support moves from object recognition and goals to construction choice, dependency-aware steps, grounds and a self-written solution. Free text is preserved for teacher review, not automatically certified.

No production rollout or server/board protocol changes are authorized by this ADR. Existing course identities and student data must remain compatible. Proposed status is not an external-review approval.
