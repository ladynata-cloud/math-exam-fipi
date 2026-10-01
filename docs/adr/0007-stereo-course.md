# ADR 0007: dynamic spatial geometry course

Status: Proposed

Original course content is mapped to the supplied Atanasyan et al. 10–11 textbook, 12th edition, 2024 (basic and advanced levels). All geometry is computed in 3D coordinates. Canvas is a camera projection of those coordinates; section vertices are plane/edge intersections, not hand-drawn polygons. Camera movement never changes geometry or task answers.

A small dependency-free engine supports semantic edge points, plane sections, point-plane distance and vector angle computations. Curved surfaces are tessellated for display; analytical measurements use exact formulas. Finite models do not replace general proofs. Construction, guided reasoning and independent numerical success are recorded separately from ungraded written explanations.

The course is self-contained for offline opening. It does not integrate server accounts or alter the production homepage. The current request authorizes implementation and Draft PR, not rollout or acceptance of this proposed ADR.
