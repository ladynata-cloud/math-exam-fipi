# Task 19: current official sources and supplied question sets — 21 October 2026

The source record now contains **467 mappings to 234 distinct cards**. All 452
previous mappings are retained unchanged. The additions are three assertions from
the independently downloaded official FIPI draft demo for 2027 and twelve
assertions from four distinct supplied question sets. Overlapping sources are not
counted as distinct trainer cards.

## Current official FIPI check

The [official open-bank index](https://fipi.ru/oge/otkrytyy-bank-zadaniy-oge)
was retrieved on 21 October 2026. Its current bank entry links to
`https://oge.fipi.ru/bank/index.php?crproj=BD98FF424631BFE24D6010A4B1266CA8`.
The official mathematics navigator continues to identify the mathematics bank as
`https://oge.fipi.ru/bank/index.php?proj=DE0E276E497AB3784C3FC4CC20248DC0`.

The current mathematics bank could not be enumerated. Public HTTP returned 503,
web retrieval timed out, and the cloud browser displayed an upstream connection
timeout. No CAPTCHA or bot-detection message was observed. **Zero live-bank
question bodies were downloaded; full current FIPI coverage is not certified.**
The source JSON retains `officialBank.complete: false` and an unknown current
bank count, with the checked URLs and access results.

The [official demo index](https://fipi.ru/oge/demoversii-specifikacii-kodifikatory)
currently labels the 2027 materials as drafts. Its linked
[mathematics archive](https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2027/ma_9_2027.zip)
was downloaded completely. The source is the actual archive member
`МА-9 ОГЭ 2027_ДЕМО.pdf`, not a secondary reconstruction. Task 19 is on physical
PDF page 7, printed page 13; its official answer, **1**, is on physical page 8,
printed page 15. The extracted text was checked against a rendered PDF page.

| Official demo assertion | Truth | Canonical card |
| --- | --- | --- |
| Three equal corresponding angles imply similar triangles | True | `tri_aaa_similarity` |
| The diagonals of a rhombus are equal | False | `rhombus_diagonals_equal` |
| The tangent of every acute angle is less than one | False | `tan_acute_less_than_1` |

The first assertion receives its own exact-wording card. The existing two-angle
similarity criterion remains separate. The other two statements map to existing
cards with explicit notes about equivalent wording. Source IDs such as `q19-1`
are local identifiers within this demo source, not official open-bank IDs.

## Navigator recommendations

The current circle and quadrilateral navigator PDFs were downloaded completely.
Their task 19 rows give 34 distinct recommended IDs, unchanged from the preceding
audit. The triangle navigator was successfully read through the official web PDF
view, but two direct file transfers were incomplete; no complete local triangle
PDF is claimed. Its recommended row matches the independently downloaded circle
row.

- [Circle navigator](https://doc.fipi.ru/navigator-podgotovki/navigator-oge/Ma-9_4_krug.pdf): 21 row entries, 20 distinct IDs.
- [Quadrilateral navigator](https://doc.fipi.ru/navigator-podgotovki/navigator-oge/Ma-9_6_4ugolniki.pdf): 17 distinct IDs.
- [Triangle navigator](https://doc.fipi.ru/navigator-podgotovki/navigator-oge/Ma-9_3_3ugolniki.pdf): same task 19 row as the circle navigator.

These are preparation recommendations, not a complete bank inventory. The IDs
alone do not establish current task wording. Raw per-source ID arrays, the
deduplicated list, retrieval times and complete-download hashes are retained in
`trainers/task19-source-coverage.json`.

## Supplied question sets

Five supplied images contain four distinct task 19 sets. The images ending
`235741` and `235839` repeat the same three statements and are counted once.
The four unique sets contribute twelve source mappings, with reviewed answers
**1**, **23**, **1** and **13** in their supplied order.

Eleven statements were already represented by equivalent or exact cards. The
remaining statement is the three-angle similarity assertion also verified in the
official 2027 demo. All twelve map to active cards with their original conditions
and truth values preserved.

The user identifies the supplied group as demo and StatGrad questions. The crops
do not establish a StatGrad issue date, variant code or edition. Four show a
`math100.ru` watermark, which does not prove the original publisher. The source
record therefore labels these as user-supplied crops with unverified editions.
The first set's wording is independently confirmed in the official 2027 demo;
that textual match does not establish the cropped image's provenance.

Only assertion text, input filenames, checksums and source metadata are included
in the repository. Private annotation documents, screenshots and rasterizations
are not copied into public assets.

## Retrieval integrity

The official demo archive was retrieved at `2026-10-21T00:03:00.848243+00:00`,
HTTP 200, 1,434,097 bytes, SHA-256
`9ae4b400e5c6858b7988be583849499b3cd392c789e1e8599698f08c1795c238`.

The complete circle navigator is 529,652 bytes, SHA-256
`7bfdb8859cbba8eff962202f8bd6f85690281cc1e75ddab93da2e65309168621`.
The complete quadrilateral navigator is 530,697 bytes, SHA-256
`f9d9a0e6e59df1822ea44d62e9d17b28be032c148669231350ed3d23288e07ad`.

The machine-readable record also stores the extracted demo PDF's SHA-256, the
official index snapshot hash, successful retrieval times and the supplied image
checksums. No total for the inaccessible current bank is inferred from these
downloads or from the historical 452 mappings.

## Validation scope

The source comparison checks that the previous 452 entries are unchanged, all
467 mappings have a valid canonical card, exact mappings preserve normalized
wording, nonliteral mappings have a review note, and truth labels agree. These
checks validate the recorded sources; they do not certify inaccessible material.

## Textbook passages and new owner annotations

Every one of the234 active cards maps to verified passages in both author lines,
across54 topical groups. The reference records identify the exact editions:
Atanasyan et al., Geometry7–9,20th edition,2010; Merzlyak, Polonsky and Yakir,
Geometry7(2015), Geometry8(2013), and Geometry9,7th edition(2022). Printed page
numbers and physical PDF page anchors are recorded separately. The external
educational archives are explicitly identified as archives, not publishers.
The book-file hashes and crop provenance are in
`trainers/task19-textbook/source.json`; passage and card mappings are in
`trainers/task19-textbook-data.js`.

The same-page disclosure is labelled «Для ценителей строгости и точности».
Explanations are original trainer notes, not attributed quotations. References
may supply a definition, theorem, worked proof or exercise supporting a derived
consequence; a false task sentence is never presented as a textbook quotation.
Only the two short parallel-to-third theorem sentences are reproduced as small
verified image excerpts and readable quotations, nine words from each book. No full textbook page or
proof is republished. External textbook links require an internet connection;
the trainer and the two short excerpts also remain in the offline package.

The newly annotated line model snaps to the second point on approach, allows a
keyboard step to leave it, keeps P visible and has a reset that preserves the
learner's answer. The distance model highlights AB and displays its actual
length and absolute-difference calculation, including reversed and coincident
points. Related line models and the midpoint model retain their constraints.
The existing source-audit regression gate passed against all 467 mappings, and
the diff whitespace check passed.
