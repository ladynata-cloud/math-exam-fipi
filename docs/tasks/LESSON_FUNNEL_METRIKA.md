# Lesson funnel measurement

- Date: 2026-10-26, Asia/Novosibirsk.
- Base: `1aa517ed819d09ff18649b0855319ecccaee5bc0`, main.
- Branch: `feat/lesson-funnel-metrika`.
- Review: MEDIUM, bounded integration on 11 public entrances; focused code review
  and regression/browser gates. No trainer design or learning change.
- Owner asked to track contact buttons as a funnel and supplied a screenshot of
  the created MathExam counter **113810914**. This authorizes implementation and
  a Draft PR. The earlier publication approval covered PR342, not this release.
- Merge/deploy require separate authorization; no auto-merge.

## Scope

Load a single deferred script on the 11 pages from LESSON_CONTACTS_CHANNELS.
Track page visits, lesson-page visits, details clicks, personal contact clicks,
channel clicks and actual visible invitation cards. Capture page, placement and
destination separately; no claim that a click is a message, subscription or sale.
Existing VK group and Dzen links are distinguished from personal contacts.

No tracker on pupil cabinets, board, individual trainers, previews or iframes.
No backend, account, authentication, curriculum or stored-progress changes.
Respect browser Do Not Track / Global Privacy Control. No session replay, click
map, ecommerce, tag manager, hash tracking or automatic external-link tracking.
Explicit page hits drop query/hash; referrer is limited to origin. Goal payloads
are restricted to fixed page and placement/service identifiers. Standard Metrika
visitor/network processing still applies; this is not anonymous zero-data tracking.
No no-JS pixel: requests without JS and opted-out browsers are not measured.

## Goals to create in counter 113810914

Type: target event (JavaScript event), exact identifier match.

| Identifier | Meaning |
| --- | --- |
| `lesson_page_view` | Opened lesson information |
| `lesson_details_click` | Clicked lesson link or contact-section anchor |
| `lesson_invitation_view` | At least 25% of lesson invitation visible in active tab |
| `channel_invitation_view` | At least 25% of channel invitation visible in active tab |
| `lesson_contact_click` | Personal Telegram/VK link clicked |
| `channel_click` | Telegram/MAX/VK group/Dzen link clicked |

Goals use params `page`, `placement`, `destination`. Views are deduplicated per
invitation type and page load, not across visits. Use consistent visitor/session
denominators in reports; never divide total repeated clicks by unique visitors
and label the result a visitor conversion rate. Direct contact clicks need not
pass through /lessons/. Confirmed messages/bookings require separate evidence.

## Gate and rollout

- `node --test tools/lesson-funnel.test.cjs`: guard, identity, privacy, classification,
  view threshold/deduplication, opt-out and blocked-library behavior.
- Browser: all 11 routes at mobile/desktop widths; mock the external tag so test
  traffic never reaches the live counter. Validate real link/keyboard behavior,
  counter failure fallback and no-JS contacts.
- SEO checks, unchanged existing markup/scripts except the one script include,
  and `git diff --check`.
- Gate: `LESSON_FUNNEL_LOCAL_OK` only after these checks pass.
- Not run locally: real Yandex delivery/report ingestion, goal configuration in
  owner's account, confirmed external message/subscription/booking attribution.
- The connected MathExam Yandex tool is Webmaster-only, not Metrika reporting.
  Weekly monitoring currently checks coverage; it cannot claim click totals.
- Rollback: revert this scoped release or remove the 11 script includes. No
  migration or pupil-data recovery required. Previously collected analytics are
  not erased by code rollback.

## Sources

- https://yandex.ru/support/metrica/ru/code/counter-initialize
- https://yandex.ru/support/metrica/ru/objects/reachgoal

## Execution

Implementation, tests and focused review recorded in the PR. No production
analytics collection is claimed until deployment and real counter verification.

## Validation evidence

- PASS: 6 Node regression tests; 2 static/SEO exception tests; 12 existing
  sitemap tests; sitemap check (529 URLs); SEO and exact-base preservation.
- PASS: 22 real Chromium responsive routes/contact clicks, keyboard contact
  anchor, duplicate initialization, throwing counter and no-JS contact fallback.
  All external requests were intercepted: no test traffic entered the counter.
- Initial environment failure: npm Chromium extraction attempted unsupported
  archive ownership restoration; unpacked the same verified package locally
  without restoring archive ownership. Browser assertions were not relaxed.
- Initial SEO gate prohibited every executable script on static topic pages.
  It now permits only the exact deferred observer with no inline content and
  retains the prohibition for all other scripts. Adversarial attribute/inline
  tests and exact unchanged original HTML establish that explanations remain
  fully static. No unrelated gate was disabled.
- Focused MEDIUM review: host/path/frame/privacy boundaries, event payloads,
  queueing, failure isolation, duplicate events and preservation reviewed;
  no remaining blocking issue identified. External reviewer not claimed.
- Local gate: LESSON_FUNNEL_LOCAL_OK. Goal creation and real report ingestion
  remain explicitly unverified, as does production deployment of this task.
