# Restore the task19 previous-modes link

- Date: 2026-10-20.
- Base: main `83c06b3bd0d0ea050080c4fef0dc911c1222c309` (PR271).
- Branch: `fix/task19-archive-link`.
- Review: SMALL, isolated navigation repair with no runtime or storage change.

## Problem and scope

The corpus release changed both entry pages' previous-modes link to
`task19-before-corpus-20261020.html`, which does not exist. Restore the link to
the preserved `task19-before-visual-hints-20261020.html` snapshot. Rebuild only
the task19 download, whose archive link must remain an absolute website URL
when the HTML is opened from disk.

Keep lesson data, archives, progress keys, application logic and unrelated
downloads unchanged. Add a focused regression that resolves the archive link
from both public entry pages and the standalone HTML, checks its local target
exists, and confirms all three links reach the same archive.

## Acceptance and checks

- Both entry pages link to the existing preserved snapshot.
- Standalone HTML keeps a working absolute HTTPS link to that same archive.
- The focused regression fails on the published broken link and passes after
  correction; the full task19 Node gate and `git diff --check` pass.
- The generated ZIP contains the updated standalone HTML and prompt.
- Gate: `TASK19_ARCHIVE_LINK_OK`.

Risk is limited to navigation and generated download freshness. Roll back the
scoped commit normally if needed; no learner data migration is involved.
Self-review and focused local checks satisfy SMALL. Browser checks are not
rerun locally for this href-only repair; publication checks remain with root.

## Execution boundary

The assigned task authorizes the isolated branch, local edits, checks and one
local commit. Stop before push, PR creation, merge or deployment; root handles
publication. No unrelated work is included.

## Local result

The new link regression failed against the original missing target, then all
15 task19 Node contracts passed after the href repair and scoped regeneration.
ZIP contents match the generated HTML and existing prompt byte for byte.
`git diff --check` passed. Local gate: `TASK19_ARCHIVE_LINK_OK`.
