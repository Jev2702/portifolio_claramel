## Project context

ASP.NET WebForms (Forms authentication) modular monolith, ~3 C# projects on
.NET Framework. Auth lives in `Interface/LC.AU.Interface/`. Login URL: `/login.aspx`.

| Stack | Modules | Notes |
|---|---|---|
| C# | 3 | analysed via Grep fallback |
| WebForms | 1 host | Forms auth |

## Module Layout

- **LC.Domain** (csharp) — `Domain/LC.Domain`: AuthenticationDomain, UsuarioDomain
- **LC.Infra** (csharp) — `Infra/LC.Infra`: AuthRepository, UsuarioRepository
- **LC.AU.Interface** (csharp, webforms host) — `Interface/LC.AU.Interface/LC.AU.Interface`

## Dependency graph

```mermaid
graph LR
  csharp_Domain_LC_Domain["LC.Domain"]
  csharp_Infra_LC_Infra["LC.Infra"]
  csharp_Interface_LC_AU_Interface_LC_AU_Interface[["LC.AU.Interface (WebForms host)"]]
  csharp_Infra_LC_Infra --> csharp_Domain_LC_Domain
  csharp_Interface_LC_AU_Interface_LC_AU_Interface --> csharp_Domain_LC_Domain
  csharp_Interface_LC_AU_Interface_LC_AU_Interface --> csharp_Infra_LC_Infra
```
