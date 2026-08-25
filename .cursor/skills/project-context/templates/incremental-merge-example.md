# Incremental merge — worked example

This fixture demonstrates the CONTEXT-006 merge contract on a `CLAUDE.md` re-run. The same logic applies to `docs/architecture.md` and to memory body files. `MEMORY.md` uses the additive line-level merge documented separately in *Incremental re-invocation — MEMORY.md merge*.

## Inputs

### Existing `CLAUDE.md` on disk (after a human edited it post-init)

```markdown
# LegalControl

## Overview

<!-- auto-generated:phase3 start -->
This repository is a C# / ASP.NET WebForms project (Forms authentication). It is part of the AutoClone family — auth lives under `Interface/LC.AU.Interface/`. Roslyn CLI was not on PATH for this scan; the C# and WebForms maps were derived via the Grep fallback.
<!-- auto-generated:phase3 end -->

> Team note: read [docs/onboarding.md](docs/onboarding.md) before touching the auth path.

## Stack

<!-- auto-generated:phase3 start -->
- **C#** — 3 projects (analysed via Grep fallback; `roslyn` CLI not on PATH).
- **WebForms** — Forms authentication; 1 hosting project.
<!-- auto-generated:phase3 end -->

## Conventions

<!-- auto-generated:phase3 start -->
(no conventions discovered yet — add as you learn them)
<!-- auto-generated:phase3 end -->

- All migrations go through `LC.Infra.Migrations.Runner`. **Never** hand-edit existing migrations — append new ones.
- WebForms event handlers live next to their `.aspx`. Code-behind files end in `.aspx.cs`.

## Glossary

- **AU** — AutoClone (the user-facing brand for the underlying LegalControl engine).
- **FCL** — Family Concurrent License.
```

### Phase 3 payload (this run, after Roslyn was installed and a Python tooling subdir was added)

```markdown
## Overview

<!-- auto-generated:phase3 start -->
This repository is a C# / ASP.NET WebForms project (Forms authentication) plus a small Python tooling layer for ETL. It is part of the AutoClone family — auth lives under `Interface/LC.AU.Interface/`. Analysed via Roslyn (C# / WebForms) and Grep (Python).
<!-- auto-generated:phase3 end -->

## Stack

<!-- auto-generated:phase3 start -->
- **C#** — 4 projects.
- **Python** — 1 module (analysed via Grep fallback).
- **WebForms** — Forms authentication; 1 hosting project.
<!-- auto-generated:phase3 end -->

## Entry Points

<!-- auto-generated:phase3 start -->
- `Interface/LC.AU.Interface/LC.AU.Interface/Global.asax` (csharp)
- `tools/etl/cli.py` (python)
<!-- auto-generated:phase3 end -->

## Module Layout

<!-- auto-generated:phase3 start -->
- **LC.Domain** (csharp) — `Domain/LC.Domain`: AuthenticationDomain, PerfilDomain, UsuarioDomain
- **LC.Infra** (csharp) — `Infra/LC.Infra`: ConnectionFactory, UsuarioRepository
- **LC.AU.Interface** (csharp, webforms host) — `Interface/LC.AU.Interface/LC.AU.Interface`: Global, LoginPage, StateClass
- **etl** (python) — `tools/etl`: load_csv, normalise, run
<!-- auto-generated:phase3 end -->

## Conventions

<!-- auto-generated:phase3 start -->
(no conventions discovered yet — add as you learn them)
<!-- auto-generated:phase3 end -->

## Where to Find X

<!-- auto-generated:phase3 start -->
| What | Where |
|---|---|
| Auth / login page | `Interface/LC.AU.Interface/LC.AU.Interface/login.aspx` |
| Auth `Web.config` | `Interface/LC.AU.Interface/LC.AU.Interface/Web.config` |
| Domain models | `Domain/LC.Domain/` |
| Data access | `Infra/LC.Infra/` |
| ETL CLI | `tools/etl/cli.py` |
| Dependency graph | `docs/dep-graph.mmd` |
<!-- auto-generated:phase3 end -->
```

## Merged result on disk

```markdown
# LegalControl

## Overview

<!-- auto-generated:phase3 start -->
This repository is a C# / ASP.NET WebForms project (Forms authentication) plus a small Python tooling layer for ETL. It is part of the AutoClone family — auth lives under `Interface/LC.AU.Interface/`. Analysed via Roslyn (C# / WebForms) and Grep (Python).
<!-- auto-generated:phase3 end -->

> Team note: read [docs/onboarding.md](docs/onboarding.md) before touching the auth path.

## Stack

<!-- auto-generated:phase3 start -->
- **C#** — 4 projects.
- **Python** — 1 module (analysed via Grep fallback).
- **WebForms** — Forms authentication; 1 hosting project.
<!-- auto-generated:phase3 end -->

## Conventions

<!-- auto-generated:phase3 start -->
(no conventions discovered yet — add as you learn them)
<!-- auto-generated:phase3 end -->

- All migrations go through `LC.Infra.Migrations.Runner`. **Never** hand-edit existing migrations — append new ones.
- WebForms event handlers live next to their `.aspx`. Code-behind files end in `.aspx.cs`.

## Glossary

- **AU** — AutoClone (the user-facing brand for the underlying LegalControl engine).
- **FCL** — Family Concurrent License.

## Entry Points

<!-- auto-generated:phase3 start -->
- `Interface/LC.AU.Interface/LC.AU.Interface/Global.asax` (csharp)
- `tools/etl/cli.py` (python)
<!-- auto-generated:phase3 end -->

## Module Layout

<!-- auto-generated:phase3 start -->
- **LC.Domain** (csharp) — `Domain/LC.Domain`: AuthenticationDomain, PerfilDomain, UsuarioDomain
- **LC.Infra** (csharp) — `Infra/LC.Infra`: ConnectionFactory, UsuarioRepository
- **LC.AU.Interface** (csharp, webforms host) — `Interface/LC.AU.Interface/LC.AU.Interface`: Global, LoginPage, StateClass
- **etl** (python) — `tools/etl`: load_csv, normalise, run
<!-- auto-generated:phase3 end -->

## Where to Find X

<!-- auto-generated:phase3 start -->
| What | Where |
|---|---|
| Auth / login page | `Interface/LC.AU.Interface/LC.AU.Interface/login.aspx` |
| Auth `Web.config` | `Interface/LC.AU.Interface/LC.AU.Interface/Web.config` |
| Domain models | `Domain/LC.Domain/` |
| Data access | `Infra/LC.Infra/` |
| ETL CLI | `tools/etl/cli.py` |
| Dependency graph | `docs/dep-graph.mmd` |
<!-- auto-generated:phase3 end -->
```

Phase 4 reports this run as:

```
merged CLAUDE.md (2147 bytes, 5 sections updated)
```

## What changed and why

1. **`## Overview`** — auto block rewritten (Roslyn now analysed the C# stack; Python tooling appeared). The team note below the end marker is preserved verbatim — the parser only touches bytes between matching markers.
2. **`## Stack`** — auto block rewritten with the new module counts and the added Python entry.
3. **`## Conventions`** — payload marker-content was byte-identical to existing (still the placeholder seed). Rule *No-op detection* applies to this section: marker-content untouched. The two human bullets below the end marker are not inside the marker pair, so they are not candidates for rewrite either; they survive every re-run.
4. **`## Glossary`** — heading absent from payload, no markers anywhere → fully preserved as a *human* section.
5. **`## Entry Points`**, **`## Module Layout`**, **`## Where to Find X`** — headings absent from existing → appended at end of file with their marker pairs, in Phase 3's canonical order. They sit *after* the trailing `## Glossary` because the rule preserves trailing human-only sections in place; new auto sections are appended below them.

## What does NOT happen

- The team note under `## Overview` is never moved or removed.
- The two `## Conventions` bullets are not inside any marker pair → never rewritten.
- `## Glossary` has no markers and no payload counterpart → fully preserved.
- If the user had stripped the markers from `## Stack`, the merge would emit a `manualised: Stack` warning and leave that section alone. The new module counts would be lost until the user re-introduces the markers (or deletes the section so the next run appends a fresh one).
- Whole-file no-op: had every payload section's marker-content matched its existing counterpart byte-for-byte, the merge would not have rewritten the file at all and Phase 4 would have printed `unchanged CLAUDE.md`.
