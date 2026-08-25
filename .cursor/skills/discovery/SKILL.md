---
name: discovery
description: "Convert PRDs to prd.json for the Cursor Discovery execute-prd loop. Use when you have an existing PRD and need to convert it to executable JSON. Triggers on: convert this prd, turn this into discovery format, create prd.json from this, discovery json, execute this PRD, implement via discovery."
---

# Discovery PRD Converter

Converts existing PRDs to the `prd.json` format that `execute-prd` uses for continuous execution by the **current Cursor agent**.

Do not start an external CLI or another agent. After conversion, `execute-prd` runs in this same session.

---

## Pipeline position

- **Previous step:** `prd` skill — generates `tasks/prd-NN-feature.md` (the markdown PRD this skill consumes).
- **This step:** convert markdown PRD → `prd.json` (machine-readable, executable by `execute-prd`).
- **Next step:** invoke `execute-prd` immediately (unless the user asked only to convert). After COMPLETE, optionally archive via `obsidian-cli`.

## Project layout (where Discovery looks)

When invoked from the project root:

| Path | Role |
|---|---|
| `tasks/prd-*.md` | input markdown PRDs (produced by `prd`) |
| `prd.json` | current converted PRD (this skill's output, in project root) |
| `completed-prds.txt` | list of finished PRD filenames (state) |
| `progress.txt` | chronological log appended by `execute-prd` each story |

When `prd.json` does not exist, pick the first `tasks/prd-*.md` not listed in `completed-prds.txt` (alphabetical order).

---

## Multi-repo workspace

Some workspaces contain several sibling sub-repos that each have their own `.git/`. PRDs live centralized in the workspace's `tasks/` directory, but each PRD targets a single sub-repo. `execute-prd` reads `target_repo` from the PRD frontmatter and runs edits there.

### Layout example

```
workspace/                  # workspace root
├── tasks/
│   ├── prd-01-feature.md   # targets frontend
│   └── prd-02-other.md     # targets backend
├── frontend/               # sub-repo (.git/)
├── backend/                # sub-repo (.git/)
└── shared/                 # sub-repo (.git/)
```

### Frontmatter

```yaml
---
target_repo: frontend
branch: discovery/05-feature-name
---

# PRD: <Title>
...
```

- `target_repo` — name of the sub-repo (folder directly under the workspace root).
- `branch` — branch to check out inside that sub-repo. Overrides auto-generated `discovery/<NN>-<slug>`.

Frontmatter is optional. PRDs without it run in the current directory (single-repo back-compat).

### How execute-prd resolves the workdir

1. `workspace_root` = directory that contains `tasks/prd-*.md` (usually project root).
2. Parse `target_repo` from the markdown frontmatter (if present).
3. Effective workdir = `workspace_root / target_repo` when set; otherwise workspace root.
4. If `target_repo` is set but `<workdir>/.git` is missing, fail fast.

Copy `target_repo` into `prd.json` as a top-level field when present so `execute-prd` does not need to re-parse the markdown.

---

## Trigger conditions

Invoke this skill when:
- A `tasks/prd-*.md` exists without a matching `prd.json` in the project root.
- User explicitly asks to convert a PRD or run via Discovery.
- User says "execute this PRD" / "implement via discovery" / "convert and run".

---

## The Job

Take a PRD (markdown file or text) and convert it to `prd.json` in the project root.

---

## Output Format

```json
{
  "project": "[Project Name]",
  "branchName": "discovery/[feature-name-kebab-case]",
  "description": "[Feature description from PRD title/intro]",
  "targetRepo": null,
  "sourcePrd": "tasks/prd-[feature].md",
  "userStories": [
    {
      "id": "US-001",
      "title": "[Story title]",
      "description": "As a [user], I want [feature] so that [benefit]",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    }
  ]
}
```

- `targetRepo`: string folder name when multi-repo; `null` or omit when single-repo.
- `sourcePrd`: path to the markdown PRD used as input (for `completed-prds.txt` later).

---

## Story Size: The Number One Rule

**Each story must be completable in ONE agent iteration (one focused implementation pass).**

If a story is too big, the agent runs out of context before finishing and produces broken code.

### Right-sized stories:
- Add a database column and migration
- Add a UI component to an existing page
- Update a server action with new logic
- Add a filter dropdown to a list

### Too big (split these):
- "Build the entire dashboard" — Split into: schema, queries, UI components, filters
- "Add authentication" — Split into: schema, middleware, login UI, session handling
- "Refactor the API" — Split into one story per endpoint or pattern

**Rule of thumb:** If you cannot describe the change in 2-3 sentences, it is too big.

---

## Story Ordering: Dependencies First

Stories execute in priority order. Earlier stories must not depend on later ones.

**Correct order:**
1. Schema/database changes (migrations)
2. Server actions / backend logic
3. UI components that use the backend
4. Dashboard/summary views that aggregate data

---

## Acceptance Criteria: Must Be Verifiable

Each criterion must be something the agent can CHECK, not something vague.

### Good criteria (verifiable):
- "Add `status` column to tasks table with default 'pending'"
- "Filter dropdown has options: All, Active, Completed"
- "Clicking delete shows confirmation dialog"
- "Typecheck passes"
- "Tests pass"

### Bad criteria (vague):
- "Works correctly"
- "User can do X easily"
- "Good UX"
- "Handles edge cases"

### Always include as final criterion:
```
"Typecheck passes"
```

For stories with testable logic, also include:
```
"Tests pass"
```

### For stories that change UI, also include:
```
"Verify in browser"
```

Frontend stories are NOT complete until visually verified when browser tools are available.

---

## Conversion Rules

1. **Each user story becomes one JSON entry**
2. **IDs**: Sequential (US-001, US-002, etc.)
3. **Priority**: Based on dependency order, then document order
4. **All stories**: `passes: false` and empty `notes`
5. **branchName**: Derive from feature name, kebab-case, prefixed with `discovery/`
6. **Always add**: "Typecheck passes" to every story's acceptance criteria (if missing)
7. Prefer frontmatter `branch` over auto-derived `branchName` when present

---

## Splitting Large PRDs

If a PRD has big features, split them into focused stories (schema → service → UI → filters), each independently verifiable.

---

## Example

**Output prd.json:**
```json
{
  "project": "TaskApp",
  "branchName": "discovery/task-status",
  "description": "Task Status Feature - Track task progress with status indicators",
  "targetRepo": null,
  "sourcePrd": "tasks/prd-task-status.md",
  "userStories": [
    {
      "id": "US-001",
      "title": "Add status field to tasks table",
      "description": "As a developer, I need to store task status in the database.",
      "acceptanceCriteria": [
        "Add status column: 'pending' | 'in_progress' | 'done' (default 'pending')",
        "Generate and run migration successfully",
        "Typecheck passes"
      ],
      "priority": 1,
      "passes": false,
      "notes": ""
    },
    {
      "id": "US-002",
      "title": "Display status badge on task cards",
      "description": "As a user, I want to see task status at a glance.",
      "acceptanceCriteria": [
        "Each task card shows colored status badge",
        "Badge colors: gray=pending, blue=in_progress, green=done",
        "Typecheck passes",
        "Verify in browser"
      ],
      "priority": 2,
      "passes": false,
      "notes": ""
    }
  ]
}
```

---

## Archiving Previous Runs

**Before writing a new prd.json, check if there is an existing one from a different feature:**

1. Read the current `prd.json` if it exists
2. Check if `branchName` differs from the new feature's branch name
3. If different AND `progress.txt` has content beyond a header:
   - Create archive folder: `archive/YYYY-MM-DD-feature-name/`
   - Copy current `prd.json` and `progress.txt` to archive
   - Reset `progress.txt` with a fresh header

---

## After saving prd.json

1. Ensure `progress.txt` exists (create with a short header if missing).
2. **Unless the user asked only to convert:** immediately read and follow the **`execute-prd`** skill and start the continuous loop in this Cursor agent session.
3. If the user asked only to convert: report the path and that they can say "execute prd" / "continue prd" later.

---

## Checklist Before Saving

Before writing prd.json, verify:

- [ ] **Previous run archived** (if prd.json exists with different branchName, archive it first)
- [ ] Each story is completable in one iteration (small enough)
- [ ] Stories are ordered by dependency (schema to backend to UI)
- [ ] Every story has "Typecheck passes" as criterion
- [ ] UI stories have "Verify in browser" as criterion
- [ ] Acceptance criteria are verifiable (not vague)
- [ ] No story depends on a later story
- [ ] `sourcePrd` and `branchName` (`discovery/...`) are set
