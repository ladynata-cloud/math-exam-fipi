# Authoring contract for this task

Files: courses/vilenkin-6-part-1/textbook-data/units-A.json through units-D.json.
Each file is a JSON array. Each unit:

```json
{"id":1,"title":"...","page":14,"endPage":18,"prereq":[0],
 "goal":"...","rules":[{"title":"...","text":"..."}],
 "pitfalls":["..."],"tasks":[{
 "id":"v6-book-1-1-a","role":"learn",
 "source":{"number":"1.1","part":"а","page":15,"kind":"exercise"},
 "prompt":"Exact mathematical condition; typography may be normalized.",
 "answer":"...","answerType":"number","unit":"",
 "hint":"An actionable clue, not the final answer.",
 "steps":[{"prompt":"What to find now and what to enter?","answer":"...",
 "answerType":"number","hint":"Specific helpful calculation.",
 "explain":"Visible complete equation after completing this step."}],
 "solution":["Complete equation/explanation 1","Complete equation/explanation 2"]
 }]}
```

Use 8 tasks per unit when source permits: 2 role learn, 4 role practice,
2 role check. Each from a distinct actual source subpart. All tasks have steps,
so optional guided recovery is available for practice. For broad units choose
different central subtypes; never include review tasks from unrelated topics
solely to fill counts. Intro unit 0 may use exact unnumbered worked examples
from the introductory pages, kind example, number null, label in source.part.

Allowed answerType: number (equivalent exact rational values), integer, decimal (decimal separator and fractional digits required),
fraction (integer numerator/positive integer denominator), reduced-fraction,
improper-fraction (integer numerator >= denominator, positive denominator),
mixed (explicit whole plus proper fraction), reduced-mixed (same, with coprime fractional numerator/denominator), prime-factors (product of primes,
allow *, ×, · separators or powers), number-list (unordered exact rational
list separated by ;), ordered-pair (two ordered values separated by ;), text.
Also allowed: fixed-denominator-pair (two fractions separated by ;, each raw
numerator and denominator must match the specified form), and self-check
(answer is empty, selfCheck is a nonempty array of concrete construction
criteria; completion is explicitly manual, never automatic correctness).
Answer is a string or array of equivalent accepted strings. Options, if needed,
is a string array. Ordinary fractions in prose use [[numerator/denominator]];
mixed numbers use `2 [[1/3]]`. No HTML in content.

Optional visual: {type:"table",headers:["..."],rows:[["..."]]} for exact task
data or {type:"image",src:"textbook-data/figures/task-id.png",alt:"..."} for a
cropped source figure where needed. Prefer a simple table/equation when it
fully describes the task; do not invent decorations. Crop only a figure from
the supplied PDF, not arbitrary outside images. Each task-specific picture
must remain visible beside all its steps. A page screenshot for internal QA
is not a task asset.

For every selected source page visually inspect its rendered PDF image.
OCR alone is not enough for fractions, exponents, tables or figures. Record
page and exact source numbers in the block's review JSON outside production
data. Explain any paraphrase without changing condition or mathematical action.
Keep final arithmetic independently checkable. No new quantities/contexts.
