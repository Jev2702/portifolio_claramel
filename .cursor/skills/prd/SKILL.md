---
name: prd
description: "Generate a Product Requirements Document (PRD) for a new feature. Use when planning a feature, starting a new project, or when asked to create a PRD. Triggers on: create a prd, write prd for, plan this feature, requirements for, spec out."
---

# PRD Generator

Create detailed Product Requirements Documents that are clear, actionable, and suitable for implementation by the Cursor agent via the Discovery kit (`discovery` → `execute-prd`).

---

## The Job

1. Receive a feature description from the user
2. Detect whether the workspace is multi-repo (see "Multi-repo detection" below)
3. Ask 3-5 essential clarifying questions (with lettered options) — include the `target_repo` question if multi-repo
4. Generate a structured PRD based on answers, with YAML frontmatter when multi-repo
5. Save to `tasks/prd-[feature-name].md`

**Important:** Do NOT start implementing. Just create the PRD.

---

## Multi-repo detection

Some workspaces contain several sibling sub-repos (each with its own `.git/`) rather than a single repository. The `execute-prd` skill routes work to the correct sub-repo via a `target_repo` field in YAML frontmatter. This skill is responsible for *writing* that frontmatter.

### How to detect

Before asking clarifying questions, inspect the directory where the PRD will live (the workspace root that contains `tasks/`):

- List immediate sub-folders that contain a `.git/` entry.
- **Heuristic:** if **two or more** sub-folders match, treat the workspace as multi-repo.
- If **zero or one** match, the workspace is single-repo — skip the rest of this section.

### What to ask

When multi-repo is detected, add this question to Step 1 alongside the other clarifying questions:

```
Which sub-repo is this PRD targeting?
   A. frontend
   B. backend
   C. shared
   D. Other: [folder name]
```

Populate the options from the detected sub-folders (the example above is illustrative; use whatever the workspace actually contains). If the user is unsure, propose the sub-repo whose name best matches the feature description and let them confirm.

### Frontmatter to emit

When multi-repo, prepend a YAML frontmatter block to the PRD file (above the `# PRD:` heading):

```yaml
---
target_repo: <chosen-sub-repo>
branch: discovery/<NN>-<slug>
---
```

- `target_repo` — bare folder name of the chosen sub-repo (no path, no leading `./`).
- `branch` — same `discovery/<NN>-<slug>` you would have generated anyway; emitting it explicitly lets `execute-prd` honour it without re-deriving.
- `<NN>` — zero-padded ordinal matching the PRD filename (e.g. `prd-07-foo.md` → `discovery/07-foo`).

When the workspace is single-repo, **omit the frontmatter entirely** — the validator and `execute-prd` both treat its absence as the legacy single-repo case (back-compat).

### Cross-references

- `execute-prd` reads `target_repo` from the frontmatter and works inside `<workspace_root>/<target_repo>/`.
- The PRD validator hook accepts frontmatter but does not require it.

---

## Step 1: Clarifying Questions

Ask only critical questions where the initial prompt is ambiguous. Focus on:

- **Problem/Goal:** What problem does this solve?
- **Core Functionality:** What are the key actions?
- **Scope/Boundaries:** What should it NOT do?
- **Success Criteria:** How do we know it's done?

### Format Questions Like This:

```
1. What is the primary goal of this feature?
   A. Improve user onboarding experience
   B. Increase user retention
   C. Reduce support burden
   D. Other: [please specify]

2. Who is the target user?
   A. New users only
   B. Existing users only
   C. All users
   D. Admin users only

3. What is the scope?
   A. Minimal viable version
   B. Full-featured implementation
   C. Just the backend/API
   D. Just the UI
```

This lets users respond with "1A, 2C, 3B" for quick iteration. Remember to indent the options.

---

## Step 2: PRD Structure

Generate the PRD with these sections:

### 1. Introduction/Overview
Brief description of the feature and the problem it solves.

### 2. Goals
Specific, measurable objectives (bullet list).

### 3. User Stories
Each story needs:
- **Title:** Short descriptive name
- **Description:** "As a [user], I want [feature] so that [benefit]"
- **Acceptance Criteria:** Verifiable checklist of what "done" means

Each story should be small enough to implement in one focused session.

**Format:**
```markdown
### US-001: [Title]
**Description:** As a [user], I want [feature] so that [benefit].

**Acceptance Criteria:**
- [ ] Specific verifiable criterion
- [ ] Another criterion
- [ ] Typecheck/lint passes
- [ ] **[UI stories only]** Verify in browser
```

**Important:**
- Acceptance criteria must be verifiable, not vague. "Works correctly" is bad. "Button shows confirmation dialog before deleting" is good.
- **For any story with UI changes:** Always include `Verify in browser` as acceptance criteria. During `execute-prd`, verify via Cursor browser tools / MCP when available.

### 4. Functional Requirements
Numbered list of specific functionalities:
- "FR-1: The system must allow users to..."
- "FR-2: When a user clicks X, the system must..."

Be explicit and unambiguous.

### 5. Non-Goals (Out of Scope)
What this feature will NOT include. Critical for managing scope.

### 6. Design Considerations (Optional)
- UI/UX requirements
- Link to mockups if available
- Relevant existing components to reuse

### 7. Technical Considerations (Optional)
- Known constraints or dependencies
- Integration points with existing systems
- Performance requirements

### 8. Success Metrics
How will success be measured?
- "Reduce time to complete X by 50%"
- "Increase conversion rate by 10%"

### 9. Open Questions
Remaining questions or areas needing clarification.

---

## Writing for Junior Developers

The PRD reader may be a junior developer or AI agent. Therefore:

- Be explicit and unambiguous
- Avoid jargon or explain it
- Provide enough detail to understand purpose and core logic
- Number requirements for easy reference
- Use concrete examples where helpful

---

## Output

- **Format:** Markdown (`.md`), optionally prefixed with YAML frontmatter (see "Multi-repo detection" above).
- **Location:** `tasks/` (at the workspace root; in multi-repo workspaces, this lives next to the sub-repos, not inside any one of them).
- **Filename:** `prd-[feature-name].md` (kebab-case).
- **Frontmatter:** include only when the workspace is multi-repo. Single-repo PRDs start directly with `# PRD: ...`.

---

## Self-validation (required before save)

Before writing the PRD file, verify the output has ALL of these (the `.cursor/hooks/validate_prd.py` hook enforces this):

1. Top-level heading starts with `# PRD:` (e.g. `# PRD: Task Priority System`). If frontmatter is present, this heading appears immediately after the closing `---`.
2. H2 sections present: `## Introduction`, `## Goals`, `## User Stories`, `## Functional Requirements`, `## Non-Goals`, `## Open Questions`.
3. At least one user story heading: `### US-NNN: <title>` (3-digit ID).
4. Each user story has a `**Acceptance Criteria:**` block.
5. Each user story's last criterion is one of: `Typecheck passes`, `Tests pass`, `Documentation complete`, `Verify in browser`.
6. **If multi-repo:** frontmatter block at the very top — opens with `---` on line 1, closes with `---`, and contains `target_repo: <name>` (and optionally `branch: discovery/<NN>-<slug>`). If single-repo: no frontmatter.

If any check fails, fix the PRD before invoking Write.

---

## Next step

After saving the PRD:

1. Invoke the **`discovery`** skill to convert `tasks/prd-[feature].md` → `prd.json`.
2. Unless the user asked only for the document, invoke **`execute-prd`** to implement all stories in a continuous loop until COMPLETE. The current Cursor agent implements the stories; do not start an external CLI.

Archiving to Obsidian (`obsidian-cli`) is opt-in after COMPLETE.

---

## Example PRD

```markdown
# PRD: Task Priority System

## Introduction

Add priority levels to tasks so users can focus on what matters most. Tasks can be marked as high, medium, or low priority, with visual indicators and filtering to help users manage their workload effectively.

## Goals

- Allow assigning priority (high/medium/low) to any task
- Provide clear visual differentiation between priority levels
- Enable filtering and sorting by priority
- Default new tasks to medium priority

## User Stories

### US-001: Add priority field to database
**Description:** As a developer, I need to store task priority so it persists across sessions.

**Acceptance Criteria:**
- [ ] Add priority column to tasks table: 'high' | 'medium' | 'low' (default 'medium')
- [ ] Generate and run migration successfully
- [ ] Typecheck passes

### US-002: Display priority indicator on task cards
**Description:** As a user, I want to see task priority at a glance so I know what needs attention first.

**Acceptance Criteria:**
- [ ] Each task card shows colored priority badge (red=high, yellow=medium, gray=low)
- [ ] Priority visible without hovering or clicking
- [ ] Typecheck passes
- [ ] Verify in browser

### US-003: Add priority selector to task edit
**Description:** As a user, I want to change a task's priority when editing it.

**Acceptance Criteria:**
- [ ] Priority dropdown in task edit modal
- [ ] Shows current priority as selected
- [ ] Saves immediately on selection change
- [ ] Typecheck passes
- [ ] Verify in browser

### US-004: Filter tasks by priority
**Description:** As a user, I want to filter the task list to see only high-priority items when I'm focused.

**Acceptance Criteria:**
- [ ] Filter dropdown with options: All | High | Medium | Low
- [ ] Filter persists in URL params
- [ ] Empty state message when no tasks match filter
- [ ] Typecheck passes
- [ ] Verify in browser

## Functional Requirements

- FR-1: Add `priority` field to tasks table ('high' | 'medium' | 'low', default 'medium')
- FR-2: Display colored priority badge on each task card
- FR-3: Include priority selector in task edit modal
- FR-4: Add priority filter dropdown to task list header
- FR-5: Sort by priority within each status column (high to medium to low)

## Non-Goals

- No priority-based notifications or reminders
- No automatic priority assignment based on due date
- No priority inheritance for subtasks

## Technical Considerations

- Reuse existing badge component with color variants
- Filter state managed via URL search params
- Priority stored in database, not computed

## Success Metrics

- Users can change priority in under 2 clicks
- High-priority tasks immediately visible at top of lists
- No regression in task list performance

## Open Questions

- Should priority affect task ordering within a column?
- Should we add keyboard shortcuts for priority changes?
```

---

## Checklist

Before saving the PRD:

- [ ] Detected whether workspace is multi-repo and asked for `target_repo` if so
- [ ] Asked clarifying questions with lettered options
- [ ] Incorporated user's answers
- [ ] User stories are small and specific
- [ ] Functional requirements are numbered and unambiguous
- [ ] Non-goals section defines clear boundaries
- [ ] Frontmatter present (multi-repo) or omitted (single-repo)
- [ ] Saved to `tasks/prd-[feature-name].md`
