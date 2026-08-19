---
description: Opus review of the current branch against the engineering bar (CLAUDE.md). Blocks merge on any blocker.
argument-hint: "[optional focus or PR number]"
---

Review the pending changes on the current branch against the project's engineering bar.

1. Gather the change under review:
   - `git diff main...HEAD` — the branch's committed changes.
   - `git diff HEAD` — any uncommitted working-tree changes.
   Exclude generated files (`dist/`, `dist-electron/`, `release/`, `node_modules/`, lockfiles).
2. Delegate the review to the **code-reviewer** subagent (Opus), passing the diff and letting it Read full files for context.
3. Relay its findings and final verdict. Do not approve while any blocker stands; if approved, report that the merge gate is clear.

$ARGUMENTS
