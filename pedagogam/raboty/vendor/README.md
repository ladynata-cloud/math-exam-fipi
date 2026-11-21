# Numbered worksheet download dependencies

These assets are served from MathExam and loaded only after a visitor requests
a numbered PDF, Word file or archive. No CDN or external service receives the
worksheet contents or selection.

## Pinned upstream distributions

- `pdf-lib-1.17.1.min.js`: unmodified `dist/pdf-lib.min.js` from `pdf-lib@1.17.1`,
  MIT. Source: https://www.npmjs.com/package/pdf-lib/v/1.17.1 and
  https://github.com/Hopding/pdf-lib. See `pdf-lib-LICENSE.txt`.
- `fontkit-1.1.1.min.js`: unmodified `dist/fontkit.umd.min.js` from
  `@pdf-lib/fontkit@1.1.1`, MIT. Source:
  https://registry.npmjs.org/@pdf-lib/fontkit/-/fontkit-1.1.1.tgz and
  https://github.com/Hopding/fontkit. npm tarball integrity:
  `sha512-KjMd7grNapIWS/Dm0gvfHEilSyAmeLvrEGVcqLGi0VYebuqqzTbgF29efCx7tvx+IEbG3zQciRSWl3GkUSvjZg==`.
  The fork does not ship a separate license file; its MIT declaration is in
  package metadata and README. The original fontkit MIT license is preserved
  from https://github.com/foliojs/fontkit/blob/master/LICENSE. See
  `fontkit-LICENSE.txt`, `fontkit-NOTICES.txt` and `Apache-2.0.txt` for bundled
  dependency notices.
- `jszip-3.10.1.min.js`: unmodified `dist/jszip.min.js` from `jszip@3.10.1`,
  used under its MIT license. Source:
  https://www.npmjs.com/package/jszip/v/3.10.1 and
  https://github.com/Stuk/jszip. The complete upstream dual-license notice is
  retained in `jszip-LICENSE.txt`.

The pdf-lib and JSZip distributions were copied from the installed runtime
packages at the versions above. Fontkit was obtained with `npm pack` without
running package scripts. `manifest.json` records every shipped asset hash.

## Fonts

`MathExamSans.ttf` and `MathExamSans-Bold.ttf` are subsets of DejaVu Sans 2.37
from https://dejavu-fonts.github.io/. They retain the copyright/license naming
records and are renamed MathExam Sans. Retained characters: U+0020–00FF,
U+0400–052F, U+2000–206F, U+2116 and U+20BD. The subset operation uses FontTools
and preserves hinting and TrueType outlines. See `DejaVu-LICENSE.txt`.

The browser embeds only the glyphs used by a requested heading. Worksheet
questions, diagrams and solutions retain their original selectable text,
fonts, equations and vectors.
