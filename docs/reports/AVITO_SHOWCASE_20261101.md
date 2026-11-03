# Public lesson showcase — verification record

Date: 2026-11-01 (Asia/Novosibirsk). Task:
[AVITO_SHOWCASE_20261101](../tasks/AVITO_SHOWCASE_20261101.md), MEDIUM.

Base: `37718f1c0138ba031314b8f4716b73c9d963bc81`.
Branch: `feat/avito-showcase-20261101`.
The final Draft PR identifies the exact published head, CI and focused review.
This document records preparation; it does not claim the new page is deployed.

## Result and presentation decisions

The existing `/lessons/` is the canonical advertising entry. Its first screen
names grades 5–11, OGE and EGE, and offers direct booking or a short example.
Three native anchors (`#school`, `#oge`, `#ege`) lead to the relevant teaching
offer and then to a selected example. School lessons and basic/profile EGE are
services offered by the teacher, not a claim of completed full-book coverage.

The page uses its own stylesheet, normal HTML links and native `details`.
It has no lead-collection form, cabinet link or unreviewed catalogue link.
The existing deferred funnel observer is retained byte-for-byte. No new
tracking, assistant, external font, image service or JavaScript is introduced.
The homepage metadata and hero now introduce the broader offer and the checked
route. Existing search-verification tags, canonicals, SEO topic links and
general-site content are retained.

Examples explicitly open in new tabs with `noopener noreferrer`; the landing
page and booking controls stay open. Existing personal Telegram and VK URLs
are preserved, with the already public email as an alternative. Channels are
not presented as private booking contacts. A visitor from Avito can also return
to the existing Avito conversation. No message was sent during this task.

## Selected examples and independent mathematics

| Public entry | Completed local learner path | Mathematical check |
| --- | --- | --- |
| `/trainers/long-division-stepwise.html#start` | 14 actions; wrong answer; hint; unfinished draft reload; completion; completed reload; next example | 4 tens / 2 = 2 tens, 8 units / 2 = 4 units, 48 / 2 = 24, inverse check 2 × 24 = 48 |
| `/trainers/oge-task11-graphs-trainer.html` | Enlarged graph; wrong matching; interactive hint; correction; completed reload | The actual plotted SVG shapes identify the straight line, parabola and two-branch hyperbola for y = x, y = x² and y = 1/x; no answer key is read |
| `/ege-profil/start/index.html#practice/geo-right/guided` | Wrong answer; hint; both entered steps; retained solution; draft and completed reload | 9² + 12² = 225; √225 = 15 |
| `/stereo-course/textbook/#ex-main-0346` | Rotate and expand model; keyboard close; three explanation/model steps; save and recover reasoning | A cone's height and base radius are perpendicular, so the generatrix is √(15² + 8²) = 17 cm |

The cone is a guided explanation with saved reasoning. It does **not**
automatically assess proof validity; the showcase states that limitation.
An existing browser may resume a visitor's saved example, so the page explicitly
describes this possibility. No real learner's progress was cleared.

## Local browser evidence

Chromium 140.0.7339.16, isolated synthetic contexts, normal certificate settings.
The executable is selected through `CHROMIUM_EXECUTABLE_PATH`; no machine path
is embedded in the reusable tests or this report.

### Demonstrations: 12/12 complete journeys PASS

`tools/avito-showcase-demos.browser.cjs` runs four full journeys at each of
320, 390 and 1280 CSS pixels. It uses actual UI input and independently derived
answers, never application APIs to set a correct/completed state.

- 12 complete journeys passed; no JavaScript exceptions, same-origin HTTP
  errors or horizontal overflow were observed.
- 24 settled initial/completed screenshots were captured. Independent visual
  inspection covered all four 320px initial states and all four 1280px completed
  states. Math conditions, drawings and controls were legible.
- The graph's short success fade-in is settled for capture using Playwright's
  screenshot animation option. Application code is unchanged.
- An initial harness expectation used the wrong wording for the division
  feedback. The actual explanation was correct; the expectation was corrected
  and the entire unchanged learner-flow suite rerun successfully.
- [Structured results and actual request inventory](avito-showcase-20261101/demo-results.json).

### Showcase: responsive and native-navigation checks PASS

`tools/avito-showcase.browser.cjs` verifies the actual page at 320, 390, 768 and
1280 CSS pixels. The 320/390 contexts include touch/mobile emulation.

- Four responsive cases, two keyboard/JavaScript-mode cases, and one short
  reflow case passed.
- 16 real demo popup launches reached their exact destinations and rendered the
  exercise; the original page and booking route remained available.
- All three incoming direction anchors and their example links passed.
- Booking is visible after its navigation link; FAQ and message template work
  with Enter and Space. The skip link and visible focus passed.
- The page and native links remain useful with JavaScript disabled. This does
  not claim that the JavaScript exercise engines work without JavaScript.
- At 640 × 450 CSS pixels the layout reflows without horizontal overflow and
  booking is reachable by scrolling. This is equivalent viewport reflow, not
  a physical browser-zoom or text-only-zoom test.
- Telegram/VK popup navigation was intercepted to verify exact destinations
  without opening messaging sessions. Live analytics were also intercepted.
- Zero page exceptions, failed local resources or unexpected external requests.
- [Structured landing results](avito-showcase-20261101/landing-results.json).

Actually viewed images include 320px first screen/examples/contact, 1280px
first screen/contact and 768px examples. The primary executor additionally
viewed the 390px first screen, 1280px first screen and 320px contact captures.
No blocking overlap, clipping or missing action was found.

Review previews: [desktop](avito-showcase-20261101/desktop.png) and
[phone width](avito-showcase-20261101/phone.png).

### Homepage entry: 2/2 cases PASS

At 390 and 1280px, the homepage hero visibly identifies grades 5–11, OGE and
basic/profile EGE. All three actual CTA clicks reach `/lessons/`, its examples
or its contact section, with the appropriate target visible. No horizontal
overflow, JavaScript exception or failed local resource was observed. Both
initial screenshots were actually inspected. Inherited Google Fonts is
intercepted only for the homepage, confirming the entry also works with system
fonts; no product font or analytics setting is changed.

The same reusable page script includes these two cases by default. The focused
`SHOWCASE_HOME_ONLY=1` run verifies the added cases without claiming another full
demo run. [Homepage results](avito-showcase-20261101/homepage-results.json).
The seven landing/keyboard/reflow cases plus these two homepage cases make
nine page-navigation cases. [Source bindings](avito-showcase-20261101/source-bindings.json)
record the product/test SHA256 values used for the final review.

## Production evidence for the selected existing examples

At 09:16 Novosibirsk time on 2026-11-01, all **64 actually requested** demo
resources returned HTTPS 200 and matched both tested local bytes and base Git
bytes by SHA256. The inventory includes the four entries, requested scripts,
styles/images and the 5,623,464-byte Atanasyan bundle. No external resource was
requested in the local demo journeys. Unused cards in that bundle are not
claimed as newly audited exercises.

The fetch uses Python's default SSL context, `CERT_REQUIRED` and hostname
verification. No certificate check is disabled or changed. Full evidence:
[production dependency parity](avito-showcase-20261101/demo-production-parity.json).

A direct live Chromium run stopped before the first exercise with
`ERR_CERT_AUTHORITY_INVALID`. That attempt remains failed at navigation; it
is not relabelled as a live browser pass. The connected Opera opened the same
public site normally with its existing certificate checks. Separate live
interaction observations are recorded in the Draft PR; they do not replace the
recorded local width matrix or imply a physical-phone test.

Separate connected Opera checks completed all four advertised examples on the
live origin. Existing local progress was retained: division continued with
84 / 2 = 42 through all 14 actions and recovered the completed answer; the
right-triangle task used the available 17/8 condition, found 225 then 15, and
recovered the completed solution. The graph task matched a line, downward
parabola and square-root graph as 312 and displayed the correct explanations.
After reload it offered the next graph task; result persistence is independently
covered by the local result-record assertion. The cone model rotated, all three
explanations opened, and the saved 17cm justification survived reload. These
are public exercise interactions, not authenticated pupil or cabinet trials.

The new landing page is intentionally still unpublished. Its final deployed
asset comparison and live landing navigation must follow separate release
authorization.

## Existing checks and compatibility

- `python tools/seo-sitemap.test.py`: 12 tests PASS.
- `python tools/build-sitemap.py --check`: 531 public canonical URLs PASS.
- `python tools/seo-check.py`: 30 distinct entrance titles/descriptions,
  six static topic pages, 191 local links, 846 canonical declarations and
  151 refresh destinations PASS.
- `node tools/lesson-funnel.test.cjs`: 6 tests PASS, including opt-out,
  query/referrer sanitization, no replay, contact/channel separation, keyboard
  clicks and safe failure when the counter is unavailable.
- JavaScript syntax and `git diff --check`: PASS.
- Both homepage search-verification meta tags retain their exact base bytes.

The historical `lesson-funnel-static.test.py` is a one-change preservation
test pinned to the old analytics insertion commit. Its byte-for-byte original
page assertion is not an acceptance condition for this explicitly requested
page redesign. It is unchanged. Similarly, SEO's optional metadata-only
`--base` preservation mode is not used to claim an unchanged homepage body.
The current SEO, navigation and funnel behavior gates are run as written.

## Risk, review and release boundary

This MEDIUM change adds no trainer pattern or learning-sequence change, so the
trainer design consultation workflow does not apply. Focused independent code
and product review is required; its exact reviewed tree/head is recorded in
the Draft PR. No external-provider verdict or copied approval is claimed.

Independent internal focused review found no blocking product/code issue.
Its small CI coverage recommendation was applied: the workflow path filters
now include every one of the 64 requested demo dependencies, as well as the
modified page styles. A separate filename-pattern comparison confirmed that
none of the observed dependencies is omitted. No existing gate was weakened.

Known limits: physical phones, Safari/Firefox, real-pupil usability trials,
actual messages, ad conversion and search ranking are not tested. The work
does not certify the rest of MathExam. No accounts or cabinets were accessed.

Before publication, close the Draft to abandon the change. A subsequent
authorized rollback restores this bounded presentation patch through a normal
revert PR; no storage or data migration is involved. Keep existing demo URLs
unchanged. The scoped CI rechecks the route when the relevant sources change.

After owner authorization, requery authoritative remote main and apply the
repository base-drift guard before merge. Then verify exact deployed assets,
the landing at phone/desktop widths, selected links and existing contacts.
Advertising links are **release candidates** until that deployment check passes:
`/lessons/`, `/lessons/#school`, `/lessons/#oge`, `/lessons/#ege`, and
`/lessons/#examples`.
