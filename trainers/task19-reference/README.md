# Official OGE reference screenshots

These are **unchanged screenshots of the FIPI draft OGE 2027 mathematics
reference materials**, checked on 2026-10-20. They are not redrawn teaching
diagrams. The original `ПРОЕКТ ОГЭ 2027` watermark remains intact.

Source: the Mathematics download on
<https://fipi.ru/oge/demoversii-specifikacii-kodifikatory>:
<https://doc.fipi.ru/oge/demoversii-specifikacii-kodifikatory/2027/ma_9_2027.zip>.
The preserved `source-demo-2027.pdf` is the byte-for-byte archive member
`МА-9 ОГЭ 2027_ДЕМО.pdf`. Source and output SHA-256 digests are in `source.json`.
No content has been added to the screenshots or removed from their crop bounds.
Copyright attribution is preserved on all four complete reference pages.

## What is on the sheet

| Printed page | Actual content used here |
| --- | --- |
| 5 | Sum of the interior angles of a convex polygon; triangle and trapezoid midlines; equilateral triangle; sine and cosine theorems; circumference and circle area |
| 6 | Parallelogram and triangle areas, both base-height and sine formulas; trapezoid area; rhombus area via diagonals; right triangle with trigonometric ratios; Pythagorean theorem; trigonometric values |

The polygon formula gives the triangle angle sum when `n = 3`; the sheet does
not print that special case separately. The converse of the Pythagorean theorem
is not explicitly stated. Explain either inference separately as teaching text;
do not attribute invented wording to FIPI. Likewise, the screenshot of the rhombus
formula is not a printed theorem about every quadrilateral with perpendicular
diagonals. The existing `learning/reference-assets` files are for **EGE basic**,
not OGE, and should not be substituted here.

## Integration and later zoom

`source.json` is the single crop map. `crops[id]` contains `file`, `title`, `alt`,
`printedPage`, `fullPageFile`, `width`, `height`, and the exact `rectPixels` within
the full-page image. Public paths are `/trainers/task19-reference/<file>`.
Use `width` and `height` on images to reserve layout space, preserve aspect ratio,
and limit CSS width to the available panel width. Short crops retain readable
formula notation and real fraction bars.

| Crop ID | Intended context |
| --- | --- |
| `triangle-area` | Height to the chosen base; two sides and the included angle; why the product of two sides alone is insufficient |
| `parallelogram-area` | Base times height, or two sides and their included angle |
| `trapezoid-area` | Both bases and perpendicular height |
| `rhombus-area` | Half the product of the two diagonals |
| `polygon-angles` | Triangle, quadrilateral, pentagon, or general convex polygon angle sums |
| `pythagoras` | Right triangle with labelled legs and hypotenuse; converse explained separately |
| `circle` | Radius, circumference and circle area |
| `midlines` | Triangle and trapezoid midlines |
| `equilateral-triangle` | Equilateral triangle height, area and associated circles |
| `sine-cosine` | Sine and cosine theorems |
| `trig-values` | Special-angle sine/cosine/tangent table |
| `areas` | The original four-figure area panel as a whole |

For a later video, begin with `fullPageFile`, then use `rectPixels` for the zoom
target. Coordinates are `[left, top, right, bottom]` in the saved full-page image.
`rectOnSheetPoints` uses the same origin before 3x raster scaling. This task
creates no video. Do not crop out watermarks or typeset an extra formula into
the image.

The complete sheet consists of the four `fipi-oge-2027-page-03.png` through
`fipi-oge-2027-page-06.png` images. The downloadable original demo also contains
exam questions and solutions; use the PNG pages for an in-trainer reference view.

## Reproduction

Dependencies: PyMuPDF and Pillow. Run from this directory with Python:

```python
import hashlib
import json
from pathlib import Path

import fitz
from PIL import Image

root = Path('.')
meta = json.loads((root / 'source.json').read_text())
source = root / meta['sourceFile']
assert hashlib.sha256(source.read_bytes()).hexdigest() == meta['sourceSha256']
doc = fitz.open(source)
rendered = {}
for entry in meta['pages'].values():
    physical = entry['physicalPage']
    if physical not in rendered:
        pix = doc[physical - 1].get_pixmap(
            matrix=fitz.Matrix(3, 3), colorspace=fitz.csGRAY, alpha=False
        )
        rendered[physical] = Image.frombytes(
            'L', (pix.width, pix.height), pix.samples
        )
    rendered[physical].crop(entry['sourceDisplayedRectPixels']).save(
        root / entry['file'], optimize=True
    )
for entry in meta['crops'].values():
    with Image.open(root / entry['fullPageFile']) as sheet:
        sheet.crop(entry['rectPixels']).save(root / entry['file'], optimize=True)
```

PDF rotation is applied by the renderer before the physical two-page spreads
are split. Each saved full page is 1263 × 1786 pixels (216 dpi). PNG encoding is
lossless grayscale. A different renderer version may produce a different PNG
hash; compare decoded pixels when validating an existing crop against its page.

Validated: all screenshots were visually inspected; each crop was compared
pixel-for-pixel with its recorded rectangle in its full-page image. The original
PDF plus all images and metadata occupies about 1.3 MB; the images alone occupy
about 591 kB. Do not preload every crop for a single question.
