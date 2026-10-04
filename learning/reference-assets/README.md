# Full reference sheet

The four PNG files are lossless page crops from the existing repository source
`ege-baza/sources/demo-2027.pdf`, **printed pages 4–7**. They preserve the original
formula notation, conditions, diagrams, table of squares, trigonometric table,
page headers and copyright attribution. This is the **project** of the 2027
demonstration paper, as labelled by FIPI; it is not represented as a final paper.

The source archive and SHA-256 digests are recorded in `source.json`. The FIPI
index was checked on 2026-10-04. No task or answer pages are included in these
images. The complete original PDF remains linked for provenance.

Reproduce from the repository root with Poppler:

```sh
pdftoppm -f 2 -l 2 -singlefile -r 144 -x 842 -y 0 -W 842 -H 1191 -png ege-baza/sources/demo-2027.pdf learning/reference-assets/fipi-2027-algebra
pdftoppm -f 3 -l 3 -singlefile -r 144 -x 0 -y 0 -W 842 -H 1191 -png ege-baza/sources/demo-2027.pdf learning/reference-assets/fipi-2027-powers-geometry
pdftoppm -f 3 -l 3 -singlefile -r 144 -x 842 -y 0 -W 842 -H 1191 -png ege-baza/sources/demo-2027.pdf learning/reference-assets/fipi-2027-areas-solids
pdftoppm -f 4 -l 4 -singlefile -r 144 -x 0 -y 0 -W 842 -H 1191 -png ege-baza/sources/demo-2027.pdf learning/reference-assets/fipi-2027-trig-functions
```

Opening the full sheet emits no assistance event. Contextual choice and
substitution explanations are separate MathExam teaching material. Their UI
awaits a successful hint record before showing the explanation; exam,
diagnostic and checkpoint modes expose only the unchanged full sheet.
