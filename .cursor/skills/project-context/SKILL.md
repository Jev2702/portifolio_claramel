---
name: project-context
description: "Scan a project and generate Claude Code context (CLAUDE.md, Claude memories, Mermaid dependency graph) so future sessions skip rediscovering structure. Multi-stack: C#, Python, TypeScript, ASP.NET WebForms. Triggers on: init project context, generate claude.md, scan project, context for this codebase, project-context."
user-invocable: true
---

# init-project-context

Bootstrap rich Claude Code context for an existing repository. Optimised for codebases too large to map by ad-hoc grepping (e.g. `Product-LegalControl-FCL` ≈ 850k LOC). Produces a short, durable `CLAUDE.md` plus auto-loaded memories plus a high-level dependency graph — with a confirmation step before anything is written.

---

## Pipeline position

- **Previous step:** none — this skill bootstraps context for a project that doesn't yet have a curated `CLAUDE.md`.
- **This step:** scan the target project, synthesise context artifacts, preview them, write on confirmation.
- **Adjacent skills:**
  - `/roslyn` (Sprint 3) for symbol-aware C# overview; falls back to `Grep` when the CLI is missing.
  - `/obsidian-cli` for opt-in archival of the generated `CLAUDE.md` + dependency graph into the user's Obsidian vault.
- **Next step:** none — the artifacts are consumed silently by every subsequent Claude Code session via auto-loaded memories and the project-root `CLAUDE.md`.

## Trigger conditions

Invoke this skill when the user:

- says "init project context", "generate claude.md", "scan project", or "context for this codebase".
- explicitly invokes `/init-project-context`.
- opens a fresh / unfamiliar repo and asks Claude Code to "get oriented" before substantive work.

Do **not** invoke when the user is asking a one-off "where is X?" question — answer that directly. This skill earns its cost only when the answers will be reused across sessions.

---

## The Job

This skill runs a **4-phase pipeline**: Discovery → Deep analysis → Synthesis → Review. Each phase produces a structured intermediate that the next phase consumes. The agent is responsible for orchestrating phases sequentially; do not interleave.

### Phase 1 — Discovery (CONTEXT-002)

Detect language(s) and framework markers fast, by file presence only — no parsing yet. A repo can match multiple stacks (WebForms + C# is the common case); carry every match forward.

#### Detection rules

| Stack | Signal (`detected: true` iff at least one match) |
|---|---|
| **C#** | any `*.csproj` or `*.sln` anywhere in the tree |
| **Python** | `pyproject.toml`, `setup.py`, or `requirements.txt` at the root or one level deep |
| **TypeScript** | `package.json` AND `tsconfig.json`, both at the root |
| **WebForms** | at least one `Web.config` AND at least one `*.aspx` AND `<authentication mode="Forms">` (case-insensitive) inside some `Web.config` |

For WebForms, also capture the literal `mode` value in `stacks.webforms.authMode` (`"Forms"` for AutoClone-family repos, `null` if no `<authentication>` element is present anywhere).

#### Entry-point heuristics

Enumerate so Phase 2 knows where to start. Search the whole tree (skipping the exclusions below) — these filenames are rare enough that false positives are unlikely.

| Stack | Filenames |
|---|---|
| .NET | `Program.cs`, `Global.asax` |
| Python | `__main__.py`, `cli.py` |
| TypeScript | `index.ts`, `main.ts` |

Each hit is recorded as a repo-relative forward-slash path under `entryPoints.<stack>[]`.

#### Discovery algorithm

1. Resolve `rootPath = str(Path.cwd())` (absolute). All output paths are repo-relative with `/` separators (cross-platform-stable).
2. Walk the tree breadth-first, **excluding** these directories at any depth: `.git/`, `node_modules/`, `bin/`, `obj/`, `.venv/`, `venv/`, `__pycache__/`, `dist/`, `build/`, `.next/`, `.nuxt/`, `out/`, `target/`, `.vs/`, `.idea/`, `.tox/`, `coverage/`. Hidden directories beyond `.github/` and `.gitlab/` are skipped too.
3. For each match against the detection / entry-point tables above, record the repo-relative path under the matching stack's `evidence` (or `entryPoints`) list. Stop after the third evidence path per stack — the rest are noise; the goal is to *prove* the stack, not enumerate every project.
4. WebForms requires a second pass over collected `Web.config` files: read each (UTF-8, BOM-tolerant) and grep for `<authentication\s+mode="([^"]+)"`. The first match wins for `authMode`. Detection still requires the `*.aspx` evidence — `Web.config` alone does not imply WebForms (it is also used by ASP.NET MVC).
5. Cap total runtime at ~30 s for repos up to 1M LOC (PRD goal of < 60 s for the whole pipeline). If a single subtree dominates, skip it after a soft deadline and note it in `notes` (free-form, optional).

The skill is **read-only** during discovery — no writes, no `git` mutations.

#### Output: discovery JSON

The phase emits a single JSON object that Phase 2 consumes. The schema is shipped alongside this skill at [`templates/discovery-schema.json`](./templates/discovery-schema.json) (JSON Schema 2020-12), and a worked example for an AutoClone-family repo lives at [`templates/discovery-example.json`](./templates/discovery-example.json). Shape at a glance:

```json
{
  "rootPath": "/abs/path/to/project",
  "scannedAt": "2026-05-06T18:30:00-03:00",
  "stacks": {
    "csharp":     { "detected": true,  "evidence": ["LegalControl.sln", "..."] },
    "python":     { "detected": false, "evidence": [] },
    "typescript": { "detected": false, "evidence": [] },
    "webforms":   { "detected": true,  "evidence": ["...Web.config", "...login.aspx"], "authMode": "Forms" }
  },
  "entryPoints": {
    "csharp":     ["Interface/LC.AU.Interface/LC.AU.Interface/Global.asax"],
    "python":     [],
    "typescript": []
  }
}
```

Rules every Phase-1 implementation must hold:

- The four `stacks.*` keys (`csharp`, `python`, `typescript`, `webforms`) are **always present**, even when `detected: false`. Phase 2 does a key lookup, not an existence check.
- The three `entryPoints.*` keys are always present too (empty list when nothing was found).
- Paths use `/` separators and are repo-relative.
- Evidence lists are deduplicated and sorted lexicographically — re-runs over the same tree must produce byte-identical JSON.

If `discovery.stacks` has no `detected: true` entry, Phase 2 does not run; the skill prints the JSON and asks the user to confirm the stack manually (see *Failure modes — No stack detected*).

### Phase 2 — Deep analysis (CONTEXT-003)

For each stack with `discovery.stacks.<stack>.detected == true`, extract a high-level module + dependency map. The output is shaped per [`templates/deep-analysis-schema.json`](./templates/deep-analysis-schema.json) (JSON Schema 2020-12); a worked example for an AutoClone-family WebForms + C# repo lives at [`templates/deep-analysis-example.json`](./templates/deep-analysis-example.json).

#### Inputs

The phase consumes Phase 1's discovery JSON. It iterates `discovery.stacks.<stack>.detected == true`, dispatches the per-stack analyser below, and merges the per-stack results into a single output. The skill is **read-only** with respect to source code — it never edits the target project's source, and never runs the project's tests.

#### Per-stack analysers

| Stack | Preferred analyser | Fallback (when preferred is unavailable) | `fallback.<stack>` is true when |
|---|---|---|---|
| **C#** | `roslyn overview --solution <X> --format json` (Sprint 3 CLI) | `Grep` over `*.csproj` for `<ProjectReference>` edges; `Grep` over `*.cs` for top-level `public class` / `public interface` / `public record` declarations | `roslyn` not on `PATH` |
| **Python** | (none yet) | `Grep` for top-level `class` / `def` and `import` / `from … import …`; module = directory containing `__init__.py` (or root of a `src/` layout) | always `false` (Grep is the primary path) |
| **TypeScript** | (none yet) | `Grep` for top-level `export class` / `export function` / `export const` / `export default` / `export interface` / `export type`; `Grep` for `import … from "…"`; module = directory under `src/` (or sibling of `tsconfig.json`) | always `false` (Grep is the primary path) |
| **WebForms** | `roslyn overview --solution <X> --format json` (resolves `*.aspx` → code-behind class via the same Roslyn pass as C#) | `Grep` over `*.aspx` for `<%@ Page … Inherits="…" CodeBehind="…" %>`. Mark each C# project that owns at least one `*.aspx` with `webformsHost: true` on its module entry | `roslyn` not on `PATH` |

Notes:

- **Picking a solution for the Roslyn invocation.** Use the first `*.sln` in `discovery.stacks.csharp.evidence`. If none, pick the parent directory of the first `*.csproj` and pass `--solution <dir>` (the CLI walks the directory). A solution that fails to load (e.g. corrupted) flips `fallback.csharp = true` with a `notes` entry; do not crash.
- **C# fallback `<ProjectReference Include="…">` resolution.** The `Include` is relative to the `.csproj` file's directory, with backslashes; normalise to forward slashes and resolve against the `.csproj`'s parent. If the resolved path doesn't match any module in the run, drop the edge (don't invent a placeholder module).
- **Python module roots.** Prefer top-level packages (a directory containing `__init__.py` directly under `rootPath` or under `src/`). Skip nested packages — a package whose parent already has `__init__.py` is a sub-package and folds into the top-level entry. Single-file scripts at the root (e.g. `cli.py`) are NOT modules; they're entry points (already captured by Phase 1).
- **TypeScript module roots.** Prefer the directories listed in `tsconfig.json`'s `compilerOptions.paths` / `references`. Without those, fall back to: each top-level subdir of `src/`, or each sibling directory of `package.json` that contains `index.ts` / `main.ts`. Don't recurse — modules are top-level only, same rationale as Python.
- **Import edge resolution (Python + TS).** Only emit an `import` edge when the import target resolves to another module already in `modules[]`. Imports of stdlib / third-party packages are NOT edges; they would dwarf the high-level graph. Relative imports (`from .foo import …`, `import "./foo"`) resolve against the importing file's directory; absolute imports resolve against `rootPath` (or `src/` for `src/`-layout repos).
- **Exports cap.** Each module's `exports` list is **at most 10 symbols**, sorted lexicographically. The list is a sample for orientation, not an enumeration; Phase 3's `## Module Layout` shows it as a parenthetical hint. If a module has more than 10 exports, drop the rest silently — the count is not surfaced. Empty `exports` is valid and common (e.g. a freshly-scaffolded `.csproj` with no public classes yet).
- **Module IDs.** `<stack>:<repo-relative-path>` (forward slashes). The colon prefix keeps stacks distinct when paths collide (`csharp:src/foo` vs `python:src/foo` is legal, even if rare).
- **Cross-stack edges.** Not emitted in this phase. A C# project that hosts WebForms aspx pages is one module with `webformsHost: true`; the aspx-to-codebehind link is encoded by that flag, not by an edge.

#### Output: deep-analysis JSON

A single JSON object matching the schema. Required top-level keys: `rootPath`, `fallback`, `modules`, `edges`. Optional: `analysedAt`, `notes`.

Invariants (the implementation MUST hold these — Phase 3 and CONTEXT-006's incremental comparator depend on them):

- `fallback` always has all four boolean keys (`csharp`, `python`, `typescript`, `webforms`); `python` and `typescript` are always `false` until those stacks gain a preferred analyser.
- `modules` is sorted lexicographically by `id`; module `id`s are unique within the run.
- `edges` is sorted lexicographically by the tuple `(from, to, kind)`; duplicates are suppressed.
- Every edge's `from` and `to` reference a module present in `modules[]`. Dangling edges are filtered out (don't emit a placeholder module to satisfy them).
- `exports` lists are sorted, deduplicated, and capped at 10 entries per module.
- All paths use forward slashes and are repo-relative (mirrors the Phase 1 invariants).
- Re-runs over the same tree must produce byte-identical JSON.

If `discovery.stacks` had no `detected: true` entries, Phase 2 doesn't run at all (Phase 1 already handed control back to the user — see *Failure modes — No stack detected*); there is no Phase 2 output in that case.

### Phase 3 — Synthesis (CONTEXT-004)

Reads the deep-analysis JSON shaped per [`templates/deep-analysis-schema.json`](./templates/deep-analysis-schema.json) and renders four artifacts in memory: a short `CLAUDE.md`, an optional `docs/architecture.md` overflow, a `docs/dep-graph.mmd` Mermaid module graph, and a per-repo memory tree at `~/.claude/projects/<repo-hash>/memory/`. Phase 3 **does not write to disk** — it produces text. Phase 4 reviews the proposal and writes on confirmation, so any "write" verb below is short-hand for "include in the proposed payload".

#### Inputs

The phase consumes Phase 2's deep-analysis JSON plus the discovery JSON's `entryPoints` (carried through unchanged). It also computes `Path.cwd()` once — the directory the skill was invoked in, equal to `analysis.rootPath`.

#### Outputs at a glance

| Artifact | Path | Size cap | Owner |
|---|---|---|---|
| `CLAUDE.md` | `<rootPath>/CLAUDE.md` | **5120 bytes hard** | mixed (auto blocks + human prose) |
| Architecture overflow | `<rootPath>/docs/architecture.md` | none | mixed (auto blocks + human prose) |
| Mermaid graph | `<rootPath>/docs/dep-graph.mmd` | none | auto-only (full rewrite per run) |
| Memory body files | `~/.claude/projects/<repo-hash>/memory/<topic>.md` | one file per topic | mixed (auto blocks + human prose) |
| Memory index | `~/.claude/projects/<repo-hash>/memory/MEMORY.md` | none | auto-only (merge — never deletes human entries) |

`<repo-hash> = hashlib.sha256(str(Path.cwd()).encode("utf-8")).hexdigest()[:8]`. The hash is over the absolute path string — case-preserving on Windows, byte-exact elsewhere. Two clones of the same repo at different paths produce different hashes; this is intentional (per-checkout state, so two worktrees on the same repo can carry different memories).

#### `CLAUDE.md` structure

Six sections, in order. Auto-generated bodies are wrapped in `<!-- auto-generated:phase3 start -->` … `<!-- auto-generated:phase3 end -->` HTML-comment markers — the same convention CONTEXT-006's incremental comparator uses to distinguish auto from human content (only content **between** matching markers is rewritten on re-run).

| Section | Source | Auto-generated body? |
|---|---|---|
| `## Overview` | one paragraph synthesised from rootPath name + detected stacks (e.g. "This repository is a C# / ASP.NET WebForms project (Forms authentication) …") | full body |
| `## Stack` | `analysis.fallback` + per-stack module count; flag fallback explicitly when `fallback.<stack> == true` ("analysed via Grep fallback") | full body |
| `## Entry Points` | `discovery.entryPoints.*` (carried through Phase 2) — bullet list of repo-relative paths annotated with stack | full body |
| `## Module Layout` | `analysis.modules[]` — one bullet per module: `- **<name>** (<stack>[, webforms host]) — <path>: <≤ 5 exports>` | body bullets only |
| `## Conventions` | empty seed on first run ("(no conventions discovered yet — add as you learn them)") | body placeholder; humans append below the marker |
| `## Where to Find X` | seed table for known anchors (auth path, login URL, Web.config, build, tests) populated from Phase 1 evidence + Phase 2 module paths | body table only |

The last three sections (`## Module Layout`, `## Conventions`, `## Where to Find X`) are explicitly **incremental-friendly**: humans can add bullets, paragraphs, or whole subsections **outside** the marker pair and CONTEXT-006 preserves them across re-runs. Inside the marker pair, content is owned by Phase 3 and replaced wholesale.

A worked example mirroring `deep-analysis-example.json` lives at [`templates/synthesis-claude-md-example.md`](./templates/synthesis-claude-md-example.md).

#### 5 KB cap algorithm

Encode the proposed `CLAUDE.md` as UTF-8 (no BOM) and measure byte length. If > 5120 bytes, prune in this strict order, re-measuring after each step:

1. Trim each module's `exports` parenthetical from ≤ 5 to ≤ 3 symbols.
2. Replace the `## Where to Find X` table body with a single line: `See [`docs/architecture.md`](./docs/architecture.md#where-to-find-x).` Move the original table into `docs/architecture.md`.
3. Replace the `## Module Layout` body with a single line: `See [`docs/architecture.md`](./docs/architecture.md#module-layout).` Move the original bullets into `docs/architecture.md`.

Stop pruning the moment the file is ≤ 5120 bytes. If pruning reaches the end of step 3 and the file still exceeds the cap, the inputs are pathological (typically 200+ modules) — fail loudly and ask the user to narrow the scan or split the repo. Do not silently truncate; do not drop sections; do not rewrap prose to save bytes.

The cap is **non-negotiable**: Claude Code re-reads `CLAUDE.md` every session, so size is a tax on every interaction. The 5120-byte limit (5 KiB exactly) is a budget, not a target — most repos fit comfortably under 3 KB.

#### `docs/architecture.md`

Created on demand: only when the cap algorithm spilled content, OR when the user explicitly asks to keep a long narrative. Sections mirror whichever `CLAUDE.md` sections were spilled; the auto-generated header at the top includes a back-link:

```markdown
<!-- auto-generated:phase3 start -->
> Generated by `/init-project-context`. See [`CLAUDE.md`](../CLAUDE.md) for the at-a-glance summary.
<!-- auto-generated:phase3 end -->
```

#### Mermaid dependency graph

File: `<rootPath>/docs/dep-graph.mmd`. One node per `analysis.modules[]` entry, one edge per `analysis.edges[]` entry. Direction `graph LR` (left-to-right reads more naturally for dependency layers).

**Mermaid ID transform.** Mermaid node IDs cannot contain `:`, `/`, `.` or other punctuation. Derive each node's ID by replacing every non-`[A-Za-z0-9]` character in `module.id` with `_`. The colon-prefix from `<stack>:<path>` already disambiguates stacks, so collisions after the transform are vanishingly rare; if one occurs, append `_<index>` deterministically.

**Node shapes.**

| Module property | Mermaid syntax | Visual |
|---|---|---|
| `webformsHost: true` | `id[["LC.AU.Interface (WebForms host)"]]` | double rectangle |
| anything else | `id["LC.Domain"]` | plain rectangle |

**Edge styles.**

| `edge.kind` | Mermaid syntax | Visual |
|---|---|---|
| `ProjectReference` | `from --> to` | solid arrow |
| `import` | `from -.-> to` | dotted arrow |

**Subgraphs.** When `len(modules) > 30`, group nodes into `subgraph` blocks keyed by the first segment of `module.path` (e.g. `Domain/`, `Infra/`, `Interface/`). Edges that cross subgraphs are drawn at the top level. Below the threshold, emit a flat graph — subgraphs add visual noise on small graphs.

**Rendering compatibility floor.** GitHub renders Mermaid via `mermaid@^11` today; Obsidian 1.5+ ships Mermaid 10+. Stay on the intersection — `graph` / `flowchart` syntax with `subgraph`, plain rectangles, double rectangles, solid/dotted edges. Forbid: `mindmap`, `quadrantChart`, `c4Context`, `block-beta`, `architecture-beta`, `packet-beta`, `sankey-beta`, ELK layout directives. These either don't render in Obsidian or break older GitHub fences.

A worked example mirroring `deep-analysis-example.json` lives at [`templates/synthesis-dep-graph-example.mmd`](./templates/synthesis-dep-graph-example.mmd).

#### Memories

Per-repo memories live at `~/.claude/projects/<repo-hash>/memory/`. The skill produces a flat tree of one body file per topic plus an index `MEMORY.md`.

| Topic file | Memory `type` | Emit when | Body |
|---|---|---|---|
| `overview.md` | `project` | always | one paragraph mirroring the `CLAUDE.md` `## Overview` body. Useful for sessions that ask "what is this repo?" before reading `CLAUDE.md`. |
| `modules.md` | `project` | `len(modules) > 0` | bullet list of modules — same content as the `CLAUDE.md` `## Module Layout` body. |
| `entry-points.md` | `reference` | any `discovery.entryPoints.*` non-empty | "Application starts at `<path>` (`<stack>`)." One bullet per entry point. |
| `conventions.md` | `project` | always | placeholder on first run; subsequent runs preserve human additions outside the marker pair. |
| `webforms.md` | `reference` | `discovery.stacks.webforms.detected == true` | pointer: "WebForms auth is configured under `<auth Web.config path>` with `mode=<authMode>`. Login URL: `<resolved login.aspx>`." Sourced from Phase 1 + Phase 2 evidence. |

Each body file uses the standard Claude memory frontmatter (`name`, `description`, `type`) and wraps its auto-generated body in the same `<!-- auto-generated:phase3 -->` marker pair as `CLAUDE.md`. Future iterations (CONTEXT-006) replace only the in-marker content; human prose outside the markers survives.

`MEMORY.md` is a **plain index** (no frontmatter), one line per topic file. Format:

```markdown
- [Overview](overview.md) — what this repo is and why
- [Modules](modules.md) — top-level project / package map
- [Entry Points](entry-points.md) — where execution starts
- [Conventions](conventions.md) — discovered patterns and gotchas
- [WebForms](webforms.md) — auth + login URL pointer
```

**Existing `MEMORY.md` handling.** If the file already exists, MERGE — add missing topic lines, never delete. Human memory entries (saved out-of-band by other tooling or by the user directly) stay intact.

A worked example for `modules.md` lives at [`templates/synthesis-memory-example.md`](./templates/synthesis-memory-example.md).

#### Determinism

Re-runs over the same deep-analysis JSON must produce **byte-identical** `CLAUDE.md`, `dep-graph.mmd`, and memory body files. Modules and edges are already sorted by Phase 2's invariants; render exports lexicographically; emit memory files in alphabetical filename order; use `\n` line endings (no `\r\n`); UTF-8 without BOM. CONTEXT-006's incremental comparator relies on this — a re-run with no upstream change must produce a no-op diff.

### Phase 4 — Review + Obsidian opt-in (CONTEXT-005)

Don't write artifacts blind. The review phase is **interactive**: the user sees the full proposal, confirms (or partials, or aborts), then is offered an opt-in Obsidian export. The skill never writes to disk before explicit confirmation.

#### Inputs

The phase consumes Phase 3's in-memory payload — a single dict with the four keys below — plus the repo-hash already computed in Phase 3:

```python
{
  "claude_md":       str,               # always present
  "architecture_md": Optional[str],     # present iff the cap algorithm spilled
  "dep_graph":       str,               # always present (full Mermaid file)
  "memories":        Dict[str, str],    # filename -> body, including MEMORY.md
}
```

Phase 4 does not re-read source code, does not re-parse JSON, and does not regenerate any artifact. If something looks wrong in the preview, the user aborts and Phase 3 is re-run from scratch — `Review` is a gate, not a fix-up stage.

#### Step 1 — Preview

Print artifacts in the chat in this **fixed order** so users learn to scan for them in the same place every run:

1. **`CLAUDE.md`** — fenced ` ```markdown ` block, full text. Header line above the fence: `**CLAUDE.md** (`<N>` bytes / 5120 cap)`.
2. **`docs/architecture.md`** — same format, only when present in the payload. Header notes the spill reason: `**docs/architecture.md** (overflow from <list of spilled sections>)`.
3. **`docs/dep-graph.mmd`** — fenced ` ```mermaid ` block (renders inline in Claude Code chat — confirms AC #6 of CONTEXT-004 by inspection at preview time). Header line: `**docs/dep-graph.mmd** (<N> nodes, <M> edges)`.
4. **Memory files** — bullet list, one per file: `- `~/.claude/projects/<repo-hash>/memory/<filename>` — <one-line description from frontmatter>`. `MEMORY.md` is listed first; the body files follow in alphabetical filename order. Do not dump body content into the preview — the bodies are typically a paragraph each and would drown the chat. Body content is reachable via the topic table in Phase 3.

Below the artifact list, print a one-paragraph **summary header** stating: target rootPath, computed `<repo-hash>`, total artifact count, total bytes, and any warnings from Phase 3 (`fallback.<stack>: true` flags become "C# analysed via Grep fallback" sentences here).

A worked example of the preview block — including the exact prompt strings and a sample partial-write response — lives at [`templates/phase4-preview-example.md`](./templates/phase4-preview-example.md).

#### Step 2 — Confirm

After the preview, print exactly:

> Write these artifacts? Reply **yes** to write all, **no** to abort, or list the artifacts to skip (e.g. "skip dep-graph, skip memories"). Default is **no**.

Parse the user's reply with case-insensitive matching, in this priority order:

| Reply pattern | Action |
|---|---|
| empty / `no` / `n` / `cancel` / `abort` / `quit` | Abort. Print "no artifacts written" and stop. |
| `yes` / `y` / `confirm` / `write` / `write all` | Write every artifact in the payload. |
| any reply containing one or more `skip <name>` clauses | Write everything **except** the named artifacts. Names: `claude.md`, `architecture` (alias `architecture.md`), `dep-graph` (alias `dep-graph.mmd`, `mermaid`, `graph`), `memories` (alias `memory`). Unknown names abort with "unknown artifact name: <X>; valid names: claude.md, architecture, dep-graph, memories". |
| anything else | Print the prompt again. Re-prompt at most twice; after that, abort with "no clear response — aborting". |

`skip claude.md` while the payload contains an `architecture_md` overflow is rejected — the architecture file is meaningless without `CLAUDE.md` linking to it. Print "cannot skip CLAUDE.md when architecture overflow is present — abort or skip both" and re-prompt.

The default is **no**. A user who hits Enter on an empty line aborts, by design — the cost of a re-run is small; the cost of an unwanted overwrite of a hand-curated `CLAUDE.md` is high.

#### Step 3 — Write

For each artifact NOT in the skip set:

1. **Apply incremental merge** (CONTEXT-006) for `CLAUDE.md`, `docs/architecture.md`, and the memory body files: only the content **between** matching `<!-- auto-generated:phase3 start -->` … `<!-- auto-generated:phase3 end -->` markers is rewritten. Content outside the markers is preserved verbatim. `MEMORY.md` is special-cased: line-level merge (add missing topic lines, never delete).
2. **Create directories on demand**: `<rootPath>/docs/` and `~/.claude/projects/<repo-hash>/memory/`. Use `Path.mkdir(parents=True, exist_ok=True)`.
3. **Write order**: memories first (bodies, then `MEMORY.md` last so the index references files that already exist) → `docs/dep-graph.mmd` → `docs/architecture.md` (if any) → `CLAUDE.md` last (so its forward links to `docs/architecture.md` and `docs/dep-graph.mmd` resolve at the moment it is first read).
4. **Encoding**: UTF-8 without BOM, `\n` line endings. Same invariants as Phase 3 — Phase 4 must not silently re-encode.
5. **Per-file confirmation**: after each successful write, print `wrote <relative-path> (<N> bytes)`. After the last write, print a blank line, then move to step 4.

Do not git-commit. This skill never touches `git` — that's the user's call.

#### Step 4 — Obsidian opt-in

After writing, ask:

> Archive this context to an Obsidian vault? Reply with the vault name (e.g. `Personal`), or **no** to skip.

If the reply is `no` / empty / `n` / `skip`: print `obsidian export skipped` and proceed to step 5. **Do not** persist the decline — the next run asks again, by design (the user might have set up a vault since).

Otherwise, treat the reply as the vault name and invoke `/obsidian-cli`:

1. **Preflight**: check `obsidian` is on `PATH` (`shutil.which("obsidian")`). If absent, print `obsidian CLI not found on PATH — skipping vault export. On-disk artifacts remain.` and proceed to step 5. Do not abort the whole run; the on-disk write already succeeded.
2. **Compose the note body** — a self-contained markdown document with three sections:
   - `## Project context` — first paragraph of `CLAUDE.md` (the `## Overview` body, marker-content only) plus the `## Stack` table.
   - `## Module Layout` — the `## Module Layout` body from `CLAUDE.md` (the auto bullets only — human additions outside the markers are local to the project, not shareable).
   - `## Dependency graph` — the full `dep_graph` Mermaid source as a fenced ` ```mermaid ` block. Obsidian 1.5+ renders Mermaid inline.
3. **Note name**: `Project Context — <basename(rootPath)> — <YYYY-MM-DD>`. Date is local time. The `<basename>` is the last segment of `rootPath` (e.g. `LegalControl` for `/d/Codes/LegalControl/AutoClone/LegalControl`). Re-runs on the same day with the same project produce the same note name and `overwrite` replaces the prior note's body.
4. **Invocation**:
   ```bash
   obsidian vault="<vault>" create name="<note-name>" content="<body>" silent overwrite
   ```
   Pass `silent` so Obsidian does not steal focus to the new note. Pass `overwrite` so re-runs idempotently update the same note. Use `--copy` is **not** added — the user did not ask for clipboard noise.
5. **On success**, print `archived to Obsidian vault "<vault>" as note "<note-name>"`. **On failure** (non-zero exit, or `obsidian` reports "vault not found"), print stderr verbatim and append `obsidian export failed — on-disk artifacts remain. Re-run with a different vault name or open Obsidian and try again.` Do not roll back the on-disk write.

A worked example of the composed note body — using the same AutoClone-family fixtures Phase 3 ships — lives at [`templates/phase4-obsidian-note-example.md`](./templates/phase4-obsidian-note-example.md).

#### Step 5 — Summary

End every run (whether full-write, partial, abort, or Obsidian-opted-in) with a structured summary block. Format:

```
init-project-context complete:
  rootPath:    <abs path>
  repo-hash:   <8-char hex>
  artifacts written:
    - CLAUDE.md (<N> bytes)
    - docs/dep-graph.mmd (<N> bytes)
    - <N> memory files at ~/.claude/projects/<repo-hash>/memory/
  obsidian:    <"archived to <vault>:<note>" | "skipped" | "not available">
  next steps:  open a fresh Claude Code session — the new memories auto-load.
```

On abort, the `artifacts written` section is replaced with `  artifacts written: none — user aborted at step <N>`. Always include the `next steps` line — even on abort, "re-run when ready" is a useful nudge.

#### Determinism (Phase 4 vs Phase 3)

Phase 3's payload is byte-deterministic (CONTEXT-004 invariants). Phase 4 adds three sources of variation that are **expected** and out of scope for the determinism contract:

- The current date (note name on the Obsidian export).
- The user's confirmation reply (governs which artifacts are written).
- The `<repo-hash>` — already deterministic per cwd, but different across cloned worktrees of the same repo.

Two runs of Phase 4 with the same payload, same user reply, same cwd, on the same date produce identical disk + Obsidian state. That's the strongest reproducibility statement Phase 4 can make.

---

## Incremental re-invocation (CONTEXT-006)

Re-runs of `/init-project-context` on a project that already has Phase 3 artifacts MUST preserve every byte of human content. The skill achieves this with **marker-anchored merging**: the HTML-comment pair `<!-- auto-generated:phase3 start --> … <!-- auto-generated:phase3 end -->` defines the only region of each file the skill is allowed to rewrite. Everything outside a marker pair is human territory, copied through verbatim.

This section is the merge contract that Phase 4's *Step 3 — Write* invokes when an artifact already exists on disk. A worked example — existing file, payload, merged result — lives at [`templates/incremental-merge-example.md`](./templates/incremental-merge-example.md) and doubles as a regression fixture.

### Per-artifact existing-file action

For each artifact about to be written, check `Path.exists()` first:

| Artifact | If present on disk |
|---|---|
| `<rootPath>/CLAUDE.md` | Marker-anchored merge per *Section-level merge* below |
| `<rootPath>/docs/architecture.md` | Same as `CLAUDE.md` |
| `<rootPath>/docs/dep-graph.mmd` | **Full rewrite** — file is auto-only by spec, no markers |
| `~/.claude/projects/<repo-hash>/memory/<topic>.md` | Marker-anchored merge per body file |
| `~/.claude/projects/<repo-hash>/memory/MEMORY.md` | Line-level additive merge per *MEMORY.md merge* |

If a file does not exist, write the proposed payload as-is — there is no human content to preserve.

### Marker contract

- The pair is exactly `<!-- auto-generated:phase3 start -->` and `<!-- auto-generated:phase3 end -->`. Both must occupy their own line, no leading or trailing whitespace, case-sensitive.
- `start` must precede its matching `end`. Unbalanced markers, `end` before `start`, or nested pairs are parse errors (see *Failure modes — Marker mismatch*).
- A file may contain multiple marker pairs (one per `CLAUDE.md` section). Pairs must be non-overlapping.
- Future phases may use distinct tags (e.g. `phase5`); the parser MUST match `phase3` literally. A foreign tag is treated as opaque human content (preserved, not rewritten).

### Section-level merge (CLAUDE.md, architecture.md, memory bodies)

The merge anchors on H2 headings (`## <heading>`):

1. Parse the **existing** file into H2 sections. Each section is one of:
   - **auto** — contains exactly one `phase3` marker pair → eligible for replacement.
   - **manualised auto** — heading the payload also has, but no marker pair → the human stripped the markers. Skip rewrite, emit `manualised: <heading>` warning, keep existing content.
   - **human** — no markers, heading not in payload → preserved verbatim.
2. Parse the **payload** the same way. Every payload section that owns a marker pair (per Phase 3's *`CLAUDE.md` structure*) is a candidate replacement.
3. For each payload candidate:
   - **Heading present + existing is auto** → replace marker-content only. Heading line, prose above the start marker, and prose below the end marker stay untouched.
   - **Heading present + existing is manualised auto** → skip silently (warning was already emitted in step 1).
   - **Heading present + existing is human** → skip; the user has fully claimed this heading.
   - **Heading absent in existing** → append the full section (heading + marker pair + body) at end of file, in the canonical order from Phase 3's six-section table. Trailing human-only sections (e.g. a `## Glossary` the user added) stay last.
4. Sections in existing but absent from payload → preserved verbatim. Phase 3's section list is open-ended at the bottom; users are encouraged to add their own H2s.

#### No-op detection

If, after step 3, every payload candidate's marker-content is byte-identical to the existing marker-content (including trailing newline), do NOT rewrite the file. Phase 4 prints `unchanged <relative-path>` instead of `wrote <relative-path>`. This is the determinism guarantee CONTEXT-004 promises: a re-run with no upstream change produces a no-op diff.

### MEMORY.md merge

`MEMORY.md` is a plain index — no frontmatter, one bullet per topic. The merge is **line-level**, additive only:

1. Parse existing as a list of bullets matching `- [<title>](<file>) — <one-line>`. Anything else (blank lines, headings, free prose) is "other", left in place.
2. For each topic in the payload not already present in existing (compared by `<file>` filename, case-sensitive), append it after the last topic entry.
3. Topic entries already present are left untouched (the user may have edited the description; do NOT overwrite).
4. Topics in existing but not in payload remain — never delete.

A user who hand-curated `- [Glossary](glossary.md) — domain vocab` keeps that line forever, even though the skill never proposes a `Glossary` topic.

### Failure modes

- **Marker mismatch.** Unbalanced `start`/`end`, nested pairs, or `end` before `start` → abort the per-file merge for that section, classify it as *manualised auto* (skip rewrite, warn). Do not silently truncate the file or attempt to "fix" the markers.
- **Markers outside any H2 section** (e.g. before the first heading) → treat the orphan marker block as anchored to a synthetic `## (preamble)` section; merge replaces it as if it were a normal section. Handles future spec drift gracefully.
- **File unreadable** (encoding error, permission denied) → skip the file, surface in *Phase 4 — Step 5 — Summary* as `skipped <path>: <reason>`. Do not delete or replace.
- **Existing CLAUDE.md exceeds 5 KB after merge.** Human content alone may already breach the cap. Do NOT prune human prose. Emit `merged CLAUDE.md is <N> bytes (over 5120 cap — human content)` and write anyway; the cap is a target for auto content, not a guillotine for humans.

### Reporting

Phase 4's per-file write line is extended for merged files:

| Outcome | Format |
|---|---|
| File didn't exist, written fresh | `wrote <path> (<N> bytes)` |
| File existed, marker-content changed | `merged <path> (<N> bytes, <K> sections updated)` |
| File existed, marker-content identical | `unchanged <path>` |
| File existed but parser bailed | `skipped <path>: <reason>` |

The summary block at *Step 5* aggregates `merged` / `unchanged` / `skipped` counts so a re-run can be audited at a glance.

---

## Outputs at a glance

| Artifact | Path | Size cap | Lifecycle |
|---|---|---|---|
| `CLAUDE.md` | `<target>/CLAUDE.md` | ≤ 5 KB | incremental — re-runs preserve human edits (CONTEXT-006). |
| Architecture overflow | `<target>/docs/architecture.md` | none | full rewrite of auto-generated sections; human sections preserved. |
| Memories | `~/.claude/projects/<repo-hash>/memory/*.md` | one file per topic | rewritten per run; user can delete files they don't want. |
| Dependency graph | `<target>/docs/dep-graph.mmd` | none | full rewrite each run. |

`<repo-hash>` is `sha256(str(Path.cwd()))[:8]`. The hash is deterministic — the same path always maps to the same memory directory, so re-runs land in the right slot.

---

## Failure modes

- **No stack detected.** Print the discovery JSON, ask the user to confirm "this is a project of stack X" or to run again from a deeper subdir. Do not synthesise.
- **Roslyn CLI absent.** Phase 2 falls back to `Grep`. Note the degradation explicitly in the summary so the user knows the C# map is approximate.
- **`CLAUDE.md` exceeds 5 KB after pruning.** Move the lowest-priority sections to `docs/architecture.md` and link from `CLAUDE.md`. Hard 5 KB cap is non-negotiable — Claude Code re-reads CLAUDE.md every session, so size is a tax on every interaction.
- **Mermaid graph > ~100 nodes.** Auto-group by top-level subdir using `subgraph`. If still too dense, emit one Mermaid file per subgraph and link them from `docs/architecture.md`.
- **User declines write at phase 4.** Print "no artifacts written" and stop. Re-running is cheap.
- **Re-run on a project with manual CLAUDE.md edits.** CONTEXT-006 governs the merge: only sections marked `<!-- auto-generated:<phase> -->` are rewritten; everything else stays intact.

---

## Non-goals

- **No code-quality analysis.** Cyclomatic complexity, dead code, etc. are owned by `roslyn` (Sprint 3), not this skill.
- **No test generation.** That is `/e2e-webforms` (Sprint 1).
- **No linting / security scanning.**
- **No Java / Go / Rust support** in this version. Add them when LegalControl needs them.

---

## Layout (after init has been run on a target)

In the **target project** (whatever cwd was when the skill ran):

```
<target>/
├── CLAUDE.md              # ≤ 5 KB, sections per the synthesis spec
└── docs/
    ├── architecture.md    # overflow narrative (only if needed)
    └── dep-graph.mmd      # Mermaid module graph
```

In the **user's Claude config dir** (independent of target):

```
~/.claude/projects/<repo-hash>/
└── memory/
    ├── overview.md
    ├── modules.md
    ├── entry-points.md
    └── conventions.md
```

---

## Templates

This skill is largely read-and-synthesise; the runtime outputs (`CLAUDE.md`, memories, Mermaid graph) are generated per-run from the discovery / analysis JSON, not stamped from fixed text. The `templates/` directory ships only the **schema + worked example** for the Phase 1 intermediate so implementations have an unambiguous contract:

| File | Role |
|---|---|
| `templates/discovery-schema.json` | JSON Schema (2020-12) for the Phase 1 output. Phase 2 reads this shape. |
| `templates/discovery-example.json` | Worked example for an AutoClone-family WebForms + C# repo. Doubles as a regression fixture: any change to the schema must keep this example valid. |
| `templates/deep-analysis-schema.json` | JSON Schema (2020-12) for the Phase 2 output. Phase 3 reads this shape. |
| `templates/deep-analysis-example.json` | Worked example matching `discovery-example.json` (same AutoClone-family repo, same `rootPath`). Regression fixture for the Phase 2 schema. |
| `templates/synthesis-claude-md-example.md` | Worked `CLAUDE.md` rendered from `deep-analysis-example.json`. Demonstrates the six sections, the `<!-- auto-generated:phase3 -->` marker convention, and a budget well under the 5 KB cap. |
| `templates/synthesis-dep-graph-example.mmd` | Worked Mermaid graph for the same example — `graph LR`, plain + double rectangles, solid `ProjectReference` edges. Renders unchanged in GitHub and Obsidian. |
| `templates/synthesis-memory-example.md` | Worked memory body file (`modules.md` topic) showing the standard Claude frontmatter (`name`, `description`, `type: project`) plus the marker-wrapped auto body. |
| `templates/phase4-preview-example.md` | Worked Phase 4 preview output for the AutoClone-family fixtures: artifact ordering, the confirmation prompt, a sample `skip <name>` reply, and the final summary block. The chat-side contract that CONTEXT-005 implementations target. |
| `templates/phase4-obsidian-note-example.md` | Worked Obsidian note body produced by the opt-in export: three-section markdown (`## Project context`, `## Module Layout`, `## Dependency graph`) with the Mermaid graph fenced for Obsidian 1.5+ inline rendering. |
| `templates/incremental-merge-example.md` | Worked re-run merge for `CLAUDE.md`: existing file (with human additions), Phase 3 payload, merged result. Demonstrates marker-anchored replacement, the no-op rule, manualised-auto handling, and trailing-human-section preservation. The on-disk contract that CONTEXT-006 implementations target. |

Future iterations may add per-stack synthesis fixtures (e.g. a Python-only example) — keep additions incremental and only ship a template when the same text fragment is identical across runs.
