# shitbox

- A car-themed economic life simulation game (Electron desktop app).
- Stack: Electron + React + TypeScript (Vite + `vite-plugin-electron`) · Zustand · yarn · ESLint · Vitest
- GitHub user: `wpinrui`.

## MVP mode: ACTIVE until I say "MVP shipped"
Pre-MVP, shipping speed beats everything. Where this section disagrees with any rule below it, **this section wins**. Do not ask me to confirm any of it.

Suspended until MVP ships:
- The whole **engineering bar**, the one `/loc` measures. No design-principle passes, no splitting a file at 500 lines, no deduplication, no dead-code sweeps, no magic-number extraction, no nesting refactors. Ugly and shipped beats clean and pending.
- Tests, typecheck, and lint. Don't write them, don't run them, don't fix a red one, don't report on them. A failing gate is not a blocker.
- `/review`. Never run it, never offer it, never mention it.
- Merge authorization. `-m` is not required and not wanted. Finish a slice, land it, keep going. No pre-merge checklist, no waiting, no asking. **The branch and PR themselves are not suspended** (see below); only the gate in front of the merge is.
- Requirements rounds. Don't open with MCQs. Take the sensible reading, build it, then state the assumption in one line so I can veto it.
- Commit hygiene. Batch freely. Atomicity, "commit as you build", and amend-don't-stack are all off.
- Doc currency. README and design-doc drift is fine.
- The lettered handoff menu. One or two lines on what changed and what I can try instead.

Still on, because none of it is code quality:
- Conventional Commit subjects. Nothing enforces them mechanically in this repo, so they are on you.
- Confirm-first on anything that destroys work: force-push, history rewrite, deleting unmerged work.
- No secrets committed.
- Everything in **Working with me** about how you talk to me: no em-dashes, no unmeasured claims, no "did you refresh", report what you observed rather than what you intended.

**Branching and merging are NOT suspended.** Every change still goes on a `<type>/<kebab-summary>` branch, still gets a PR, and still lands by squash-merge with the branch deleted. Never commit straight to `main`. MVP mode removes the review and the wait, not the workflow: I still want every slice as a revertable unit with a PR behind it.

**Exit:** when I say MVP has shipped, delete this section. Everything below applies again in full, and the first task after that is paying down whatever this let through.

## Environment
- Use `python`, never `python3` — a `PreToolUse` hook blocks `python3` (it triggers the Windows Store alias).
- `electron/main.ts` is the Electron main process, `electron/preload.ts` the preload bridge, `src/` the React UI. Keep `contextIsolation` on and `nodeIntegration` off; expose only what the renderer needs through the preload `contextBridge`.
- Inside `src/`: `engine/` is pure game logic (no UI imports), `store/` is Zustand state, `ui/` is React components, `hooks/` is shared hooks. Keep the engine free of React.
- Game content is data-driven — JSON under `data/`, validated by `yarn validate-data`. Add content there, not as literals in code.
- `design/brand-guide.md` is the design system AND the UI house style — follow it for tokens, contrast, and copy. Tokens live in `src/tokens.css`; the mockups in `design/` are the visual source of truth.
- `Shitbox_GDD.md`, `Shitbox_Architecture.md`, and `Shitbox_Skills.md` (repo root) are the game design, architecture, and stat-progression specs.
- Never offer to launch, run, or screenshot the app for me — I can run it myself. Verify changes headlessly (tests, typecheck, lint, build); if something genuinely needs the GUI to verify, state plainly what's unverified.
- An `EPERM`/file-lock error during install or build usually means a running app instance holds the file — kill the instance and retry instead of fighting the lock.

## Memory — manual only
Auto-memory is on, but **never add, update, or delete memory on your own.** Touch memory only when I explicitly tell you to, or when I run:
- `/mem-add` — record a memory
- `/mem-view` — show all memory
- `/mem-update` — edit a memory
- `/mem-delete` — remove a memory

When I flag a mistake and the lesson is a generalizable process one (something we'd actually hit again), propose a `/mem-add` capturing it — proposing is welcome, writing without my go is not. Skip one-off trivia; a hyper-specific memory is noise.

## Branching & commits
- `main` is protected. Branch before any change.
- Branch names: `<type>/<kebab-summary>`, `<type>` ∈ {feat, fix, refactor, perf, docs, test, build, ci, chore}.
- One feature branch, one PR at a time — no branch gymnastics. Pile commits onto the active branch and fold small follow-ups into it; start a new branch only for a genuinely new track of work.
- Conventional Commits, single-line subject, no body or bullets. Small, atomic, one logical change. Fix an immediate mistake by amending, not by stacking an "oops" commit.
- Commit as you build, not in one batch at the end: finish a logical slice, commit it, then start the next. Splitting one big batch afterwards isn't truly atomic — each file already holds all its edits for every reason, so the small one-thing commits can't be reconstructed.
- Delete a feature branch once it has been squash-merged (local + remote); routine cleanup, not a confirm-first action.
- `--force-with-lease` only, never `--force`. Never force-push `main`/`master`.
- PR body: `Closes #N` on its own line per issue (a comma list closes only the first).

## Merge & PR workflow
- Open a PR as soon as a slice of work is ready — never ask "should I open the PR?" or wait for a go. Opening is safe and commits to nothing; merging is what's gated.
- Squash-merge only, deleting the merged branch: `gh pr merge --squash --delete-branch`.
- Run `/review` unprompted before every merge, for every PR — never ask whether to review; it's mandatory, not a per-PR decision.
- Pre-merge checks (all must hold): review approved; tests green and typecheck clean (verify directly, don't trust the PR description); working tree clean; no open findings.
- Merge/review triggers are explicit flags, not the ambiguous word "go": `-r` = run review now; `-m` = merge (this IS the merge authorization); `-rm` = review, then merge in the same turn if it passes — no pause for extra confirmation in between.
- `-m`/`-rm` are still gated on the pre-merge checks. If a check fails, name it and stop.
- Me saying "dependabot" = process and merge all open Dependabot PRs, majors included. Confirm each is a pure version bump; CI green is the gate (`/review` doesn't apply — no source changes). Merge sequentially; when the rest conflict on the lockfile, request a rebase and wait for fresh CI.
- After merge: confirm the merged branch is gone (local + remote), then `git checkout main && git pull`; confirm the landed commit hash to me.

## Working modes & flags
- Default: before building any feature, gather requirements first — ask multiple-choice questions (AskUserQuestion, lettered options) covering scope, layout, and behaviour. Never invent a spec or assume what I want. Bugfixes are exempt only when the bug is clearly defined.
- One round, then build: after I answer a requirements round, don't bounce back with more clarifying questions. Resolve leftover ambiguity by picking the sensible reading and stating it as a decision I can veto, not as a new question.
- `-afk` — finish the work fully autonomously: zero further questions, make every call yourself, run review, stop before merge (merge always needs `-m`).
- `-spec` — rigorous requirements phase first: as many MCQ rounds as it takes, recommend an option each time, flag caveats/traps I may have missed, then vet the drafted spec against the codebase and get my sign-off before building. Build autonomously after the ack (review yes, merge no). Once the spec is nailed, honour it.
- `-iter` — rapid iteration: build the thinnest slice I can actually try, then stop and hand it over; loop on my feedback. Zero housekeeping mid-loop — no commits, tests, typecheck, review, or PR, and subagents inherit the same rule. Batch all of it in one pass when I end the loop.
- Recognise iteration mode even without the flag: if I'm rapid-firing small change requests, stop committing/testing per tweak and defer housekeeping to the end of the loop.

## Working with me
- Restate non-trivial tasks in your own words before starting.
- Don't silently drop a requirement — surface it and ask.
- Flag pre-existing bugs in chat with `file:line`; don't fix silently or move past them.
- Run tests + typecheck before declaring done; report what you observed, not what you intended.
- Never assert a cause or cite a number you haven't measured. Mark measured vs assumed; "I don't know yet, let me measure" beats a confident guess. Don't rationalize a failed fix with invented facts.
- If I report something still broken after your fix, your fix was wrong or incomplete — re-read what I actually said and re-examine your change. Never suggest I didn't refresh/reload/pull or have a stale cache.
- Your workspace IS my local working copy — committed changes are already on my machine. Never tell me to pull, rebuild, or sync to see them.
- Judge every feature from the end user's seat — "does this make sense to use?", not just "is the code correct / do the tests pass".
- No em-dashes in your writing (chat, commits, PR bodies, comments, UI copy). The urge to type one is the signal the sentence is already complete: end it at the clause and cut the trailer — don't swap in a comma or hyphen. A lone "—" as an empty-cell placeholder glyph in UI is fine.
- Load-bearing info on a GitHub issue goes in the body (`gh issue edit`), never in comments — fold corrections and dependency notes into the body.
- Keep `README.md` current in the same PR when a change is reader-facing (capability, command, usage, status) — reasonably; not for internal refactors, test tweaks, or docs-only changes.
- Fix root causes, not symptoms; don't suppress errors or skip tests.
- List options with letters (A / B / C), not numbers.
- Clarifying questions aren't pushback; if I ask "why", hold your position and explain the tradeoff.
- Confirm risky actions (force-push, history rewrite, deleting an unmerged or shared branch, data loss) before executing.
- End every completed unit of work with a short grounded handoff and a lettered action menu of only the currently actionable options, each spelled out every time — e.g. **M** — merge the PR · **T** — a concrete, runnable way for me to verify it myself · **P** — how this work fits the bigger picture · **S** — suggest the next task. Omit any letter with nothing behind it, and never offer a "done"/"stop" opt-out.

## Code quality bar (enforced by `/review`, an Opus agent)
A PR cannot be approved if any of these fail:
- **SOLID**, **DRY**, **KISS**, **YAGNI**; consistent level of abstraction within a unit.
- No dead or commented-out code; no duplication.
- No god files; no god objects/classes.
- No long parameter lists, flag arguments, feature envy, primitive obsession, or magic numbers.
- No arrowhead code (deep nesting); use guard clauses / early returns.
- Size limits: file ≤ 500 lines (hard cap); function < 50 (flag > 75); nesting depth ≤ 3; parameters ≤ 3 (else pass an object).
- No doc drift — `README.md` reflects current reality; no stale placeholders once the project has substance.
- Tests reasonably in place: core logic and new behaviour ship with meaningful tests; no untested critical paths.
- Always blocking, never a "nit" or "non-blocking": correctness bugs (display-only included), missing tests on newly added logic, and near-verbatim duplication. Don't let "display-only" or "rule-of-three not tripped yet" downgrade them; fix before merge.

## Tooling
- Package manager: **yarn**.
- Build/dev: **Vite** + **vite-plugin-electron**. `yarn dev` for the renderer alone, `yarn electron:dev` for the full app, `yarn build` to package via electron-builder.
- Lint: **ESLint** (`yarn lint`). No formatter is configured — match the surrounding file.
- Tests: **Vitest** (`yarn test`).
- TypeScript **strict** (`yarn typecheck`).
- Data validation: `yarn validate-data`.

## Commands
- `/mem-add`, `/mem-view`, `/mem-update`, `/mem-delete` — manual memory.
- `/loc` — total code lines (excluding docs, comments, blanks) plus a longest-files audit flagging any file over 500.
- `/review` — run the Opus review against the bar above.
