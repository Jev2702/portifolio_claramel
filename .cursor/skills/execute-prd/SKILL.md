---
name: execute-prd
description: "Execute prd.json stories in a continuous loop until all pass (COMPLETE). The current Cursor agent implements each story. Triggers on: execute prd, continue prd, run discovery loop, implement via discovery, execute-prd, resume prd."
---

# Execute PRD — continuous Discovery loop (Cursor)

Implements user stories from `prd.json` one at a time, without waiting for user confirmation between stories, until every story has `passes: true`.

---

## Pipeline position

- **Previous:** `discovery` skill wrote `prd.json`.
- **This:** implement stories continuously.
- **Done:** emit `COMPLETE`, append `sourcePrd` to `completed-prds.txt`.

## Required files

| Path | Role |
|---|---|
| `prd.json` | source of truth for stories and `passes` flags |
| `progress.txt` | append-only log per completed story |
| `completed-prds.txt` | finished markdown PRD filenames |
| `archive/` | previous runs (managed by `discovery`) |

If `prd.json` is missing, stop and tell the user to run the `discovery` skill first (or `prd` then `discovery`).

---

## Hard rules

1. **One story at a time** — never implement multiple stories in parallel in one pass.
2. **Do not mark `passes: true` without evidence** that acceptance criteria were met.
3. **Do not ask for confirmation** between stories — continue immediately to the next `passes: false`.
4. **Commits only if the user asked** — follow the project's git commit rules; never commit secrets.
5. **Respect workdir** — if `targetRepo` is set, all edits/shell/git run inside that sub-repo (relative to workspace root that holds `tasks/` / `prd.json`).
6. **This Cursor agent implements the stories** — do not start an external CLI or hand the loop to another agent.

---

## Loop algorithm

Copy this checklist and keep it updated mentally:

```
Execute-prd progress:
- [ ] Load state
- [ ] Resolve workdir + branch
- [ ] Pick next story
- [ ] Implement + verify
- [ ] Persist passes=true + progress.txt
- [ ] Next story OR COMPLETE
```

### 1. Load state

1. Read `prd.json`.
2. Read `progress.txt` if it exists (context only).
3. If the user said "continue prd", resume from the first story with `passes: false` (lowest `priority`).

### 2. Resolve workdir and branch

1. `workspace_root` = directory containing `prd.json`.
2. If `targetRepo` is a non-null string: `workdir = workspace_root / targetRepo`. Verify `.git` exists there; otherwise fail with a clear error.
3. Else: `workdir = workspace_root`.
4. Ensure branch `branchName` exists and is checked out in `workdir`:
   - If already on that branch, continue.
   - Else create from current default branch if missing, then checkout.
   - Do not force-push or hard-reset.

### 3. Pick next story

Select the user story with `passes: false` and the lowest `priority` (then lowest id).

If none remain → go to **COMPLETE**.

Announce briefly (one line): which story id/title you are implementing, then proceed.

### 4. Implement + verify

1. Implement **only** that story.
2. Walk every acceptance criterion and verify it.
3. For "Typecheck passes" / "Tests pass": run the project's usual commands in `workdir`.
4. For "Verify in browser": use Cursor browser tools / MCP when available; if unavailable, verify what you can in code and note the limitation in `notes` — still only mark pass if criteria are honestly satisfied or browser verification is impossible in this environment and the code change is complete (prefer failing closed if UI is the core of the story and cannot be verified).

### 5. Persist

1. Set that story's `passes` to `true`.
2. Optionally set `notes` with a short factual summary.
3. Write `prd.json` (keep formatting readable).
4. Append to `progress.txt`:

```
## [US-NNN] <title> — DONE
- <one or two bullets of what changed>
```

### 6. Continue or complete

- **More stories with `passes: false`:** immediately start step 3 again. Do not stop for user approval.
- **All passed:** go to COMPLETE.

---

## COMPLETE

When every story has `passes: true`:

1. Append `sourcePrd` (basename or path from `prd.json`) to `completed-prds.txt` if not already listed.
2. Append a final block to `progress.txt` noting COMPLETE and timestamp/date if known.
3. Reply to the user with:
   - The marker: `COMPLETE`
   - Branch name
   - Short list of completed story ids/titles
4. Stop the loop. Do not start a new PRD unless asked.

---

## Context pressure (long PRDs)

If the conversation is too large to safely continue (many files, huge diffs, repeated failures):

1. Ensure `prd.json` and `progress.txt` are up to date for finished stories.
2. Tell the user to open a **new chat** and say `continue prd`.
3. Do **not** mark unfinished stories as passed.

On `continue prd`, this skill resumes at the next `passes: false` story.

---

## Failure handling

- If a story cannot be completed after a reasonable focused attempt:
  - Leave `passes: false`.
  - Write the blocker into that story's `notes`.
  - Append a `## [US-NNN] BLOCKED` section to `progress.txt`.
  - Stop the loop and report the blocker to the user (do not skip ahead to later stories that depend on it).
- Independent later stories may continue only if the user explicitly allows skipping the blocked one.

---

## Triggers

Start this skill when:

- User says: execute prd, continue prd, run discovery loop, implement via discovery, execute-prd
- `discovery` skill just wrote `prd.json` and user did not ask for convert-only
- `prd.json` exists with remaining `passes: false` and user asks to resume

---

## Checklist before COMPLETE

- [ ] Every story `passes: true`
- [ ] `progress.txt` has an entry per completed story
- [ ] `sourcePrd` listed in `completed-prds.txt`
- [ ] User-facing reply includes `COMPLETE`
