# LegalControl

## Overview

<!-- auto-generated:phase3 start -->
This repository is a C# / ASP.NET WebForms project (Forms authentication). It is part of the AutoClone family — auth lives under `Interface/LC.AU.Interface/`. Roslyn CLI was not on PATH for this scan; the C# and WebForms maps were derived via the Grep fallback.
<!-- auto-generated:phase3 end -->

## Stack

<!-- auto-generated:phase3 start -->
- **C#** — 3 projects (analysed via Grep fallback; `roslyn` CLI not on PATH).
- **WebForms** — Forms authentication; 1 hosting project.
<!-- auto-generated:phase3 end -->

## Entry Points

<!-- auto-generated:phase3 start -->
- `Interface/LC.AU.Interface/LC.AU.Interface/Global.asax` (csharp)
<!-- auto-generated:phase3 end -->

## Module Layout

<!-- auto-generated:phase3 start -->
- **LC.Domain** (csharp) — `Domain/LC.Domain`: AuthenticationDomain, PerfilDomain, UsuarioDomain
- **LC.Infra** (csharp) — `Infra/LC.Infra`: ConnectionFactory, UsuarioRepository
- **LC.AU.Interface** (csharp, webforms host) — `Interface/LC.AU.Interface/LC.AU.Interface`: Global, LoginPage, StateClass
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
| Dependency graph | `docs/dep-graph.mmd` |
<!-- auto-generated:phase3 end -->
