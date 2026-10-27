# Public navigation helper — preparation evidence

Date: 2026-10-27 (Asia/Novosibirsk).
Task: [MATHEXAM_PUBLIC_ASSISTANT_V1](../tasks/MATHEXAM_PUBLIC_ASSISTANT_V1.md).
Review: HIGH. Branch: `feat/public-assistant-20261027`.
Base: `1fcc4fa36267f5667c42409861ef0b92f97b333c`, Draft #360 dependency.
Final head and exact-head CI evidence belong in the Draft PR to avoid a
self-referential commit identifier in this file.

## Result and boundary

MaxExam 0.0 is prepared as a chat-style public navigator. It selects checked
learning materials and can suggest the existing tutor contact route after
repeated explicit difficulty or a direct request. It is closed by default and
labels itself as a navigator. It makes no live model call, invents no current
exercise solution and does not claim to train model weights.

The implementation and maintenance boundary are documented in the
[operator guide](../../assets/assistant/README.md). OpenAI, GigaChat and Qwen
remain proposed teaching-model candidates. Their adapters, credentials, terms,
evaluation evidence and spending decisions are separate work. The prior finite
DeepSeek synthetic-evaluation authorization does not cover these providers or
public/pupil traffic.

## Coverage

- 594 public HTML documents, comprising all 528 sitemap documents and 66 further
  verified public entries. The manifest includes 169 documents under trainers/,
  plus textbook/course pages, topics, articles and public entrances.
- Reconciled JavaScript-only entries include the public grade-nine exercise
  shell, spatial-geometry lessons, vector prerequisites, base-EGE data practice,
  arithmetic repair/diagnostic routes and the working multiplication elevator.
- Empty multiplication-table index/Pythagoras/times-nine placeholders are not
  treated as functioning trainers. In the helper's catalogue their three intents
  use working multiplication materials. The 51 live unique directions from the
  existing trainer catalogue and every course-catalogue direction are covered.
- Private/teacher/board/source/archive/export/redirect surfaces are excluded.
  Existing but unlisted and unreviewed pages are not silently published.
- All 828 existing HTML files match their base Git blobs after removing the exact
  helper block. Mathematical content, styles, scoring, canonical metadata,
  sitemap and original links are preserved.

## Validation

- Pure navigation tests: 15 groups, covering fixed destinations, nonempty HTML,
  PDF signatures, real hash routes, subject/exam priority, privacy handling,
  ambiguity, referral consent/frequency and absent hidden state.
- Coverage and SEO-boundary tests: seven cases. The static-explanation gate
  permits only the exact deferred data/widget pair and the pre-existing optional
  funnel observer. Inline scripts, foreign origins, changed attributes/versions,
  partial/reversed pairs and duplicates still fail.
- Existing sitemap tests: 12 cases. Sitemap check retains 528 canonical URLs.
  SEO check verifies 30 entrances/topics and 553 public canonical declarations;
  the optional base-preservation check also passes.
- Real browser suite: 11 groups passed after independent-review fixes. It covers
  actual home, decimal and Peterson routes,
  390px layout, safe rendering/links, in-memory clearing, bounded history, contact
  frequency, keyboard isolation, iframe/private suppression and retained trainer
  task/draft/progress. It uses no real visitor or pupil record.

An initial SEO run correctly rejected the new script pair because the older
policy allowed only the funnel observer. The exact reviewed pair is now an
explicit exception, with rejection tests for all broader script changes.
Mechanical insertion exposed existing inline whitespace as trailing whitespace;
moving the insertion boundary retained all original bytes and restored the gate.
These were resolved integration findings, not skipped checks.

## Review and rollout conditions

Internal agents independently reviewed data/navigation, safe links, privacy and
keyboard compatibility. Their findings are implementation evidence, not an
external exact-head approval. A concrete geometry-viewer capture-phase Escape
conflict and a normalized double-slash URL edge case were repaired and covered
by regression checks. Duplicate script attributes are rejected by the SEO parser,
and CI also watches the JavaScript sources that establish checked public routes.
Normal [desktop](assets/mathexam-public-assistant/desktop.png) and
[mobile](assets/mathexam-public-assistant/mobile.png) screenshots accompany the
browser evidence. The final Draft PR records exact-head CI results.

Remote main remained `92d733a49692744ce043503c57f29b77bfb09a24` during preparation.
Read-only production index/sitemap/robots evidence matched the existing released
state. No public launch, provider request, key purchase, infrastructure change or
real-account activation was performed.

HIGH external review and separate owner merge/deployment authorization remain
required. No account access or payment review is bypassed by presenting a static
chat interface. See the guide for analytics limits, precise rollback and future
resource separation.
