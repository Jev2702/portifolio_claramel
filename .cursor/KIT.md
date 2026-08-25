# Kit Discovery para Cursor

Kit copiável: gera PRD → converte para `prd.json` → executa stories em loop contínuo com o **agente Cursor**.

## Pipeline

```
prd  →  tasks/prd-*.md
discovery  →  prd.json
execute-prd  →  stories até COMPLETE
```

A execução das stories é sempre deste agente (a sessão atual), via `execute-prd`. Não há CLI externa no loop.

## O que copiar para outro projeto

Copie estes caminhos para a raiz do projeto destino:

```
.cursor/skills/prd/
.cursor/skills/discovery/
.cursor/skills/execute-prd/
.cursor/hooks.json
.cursor/hooks/validate_prd.py
```

Opcional (não faz parte do pipeline PRD):

```
.cursor/skills/project-context/
.cursor/skills/obsidian-*/
.cursor/skills/defuddle/
.cursor/skills/json-canvas/
.cursor/scripts/          # wrapper CLI do validador + legado
```

No PowerShell, a partir deste repo:

```powershell
$src = "C:\caminho\para\este-projeto\.cursor"
$dst = "C:\caminho\para\outro-projeto\.cursor"
New-Item -ItemType Directory -Force -Path "$dst\skills","$dst\hooks" | Out-Null
Copy-Item -Recurse "$src\skills\prd" "$dst\skills\prd"
Copy-Item -Recurse "$src\skills\discovery" "$dst\skills\discovery"
Copy-Item -Recurse "$src\skills\execute-prd" "$dst\skills\execute-prd"
Copy-Item "$src\hooks.json" "$dst\hooks.json"
Copy-Item "$src\hooks\validate_prd.py" "$dst\hooks\validate_prd.py"
```

## Artefatos de runtime (criados no projeto)

Na **raiz do projeto** (não dentro de `.cursor/`):

| Path | Função |
|---|---|
| `tasks/prd-*.md` | PRDs markdown |
| `prd.json` | PRD executável (stories + `passes`) |
| `progress.txt` | log por story |
| `completed-prds.txt` | PRDs concluídos |
| `archive/YYYY-MM-DD-feature/` | runs anteriores |

Crie `tasks/` na primeira vez se não existir.

## Como usar no chat do Cursor

1. **Gerar PRD:** `crie um PRD para …` / `spec out …`  
   → skill `prd` → `tasks/prd-<feature>.md`

2. **Converter:** `converta o PRD com discovery` / `create prd.json`  
   → skill `discovery` → `prd.json`

3. **Executar (loop contínuo):** `execute o prd` / `implemente via discovery` / `continue prd`  
   → skill `execute-prd` implementa cada story com `passes: false` até `COMPLETE`

Atalho: `implemente via discovery` (com descrição da feature) — o agente pode rodar `prd` → `discovery` → `execute-prd` em sequência, desde que você confirme o escopo nas perguntas do PRD.

## Checklist pós-cópia

- [ ] Pasta `.cursor/skills/{prd,discovery,execute-prd}` presente
- [ ] `.cursor/hooks.json` aponta para `python .cursor/hooks/validate_prd.py`
- [ ] `python` no PATH (teste: `python .cursor/hooks/validate_prd.py` sem args / com path de um PRD)
- [ ] Workspace **Trusted** no Cursor (hooks de projeto só rodam em workspaces confiáveis)
- [ ] Hooks habilitados nas settings do Cursor (aba Hooks / output channel para debug)

Validar um PRD manualmente:

```powershell
python .cursor/hooks/validate_prd.py tasks\prd-minha-feature.md
```

## Multi-repo

Se a raiz do workspace tiver **2+** pastas com `.git/`, a skill `prd` pergunta o `target_repo` e grava frontmatter. `execute-prd` trabalha dentro desse sub-repo e usa branch `discovery/<feature>`.

## Notas

- Prefixo de branch: `discovery/<feature-kebab>`.
- Critério de UI nos PRDs: `Verify in browser`.
- Commits: só quando você pedir explicitamente.
- PRDs informais em `.cursor/prd/` **não** entram no pipeline — use `tasks/prd-*.md`.
- `.cursor/settings.json` legado (Claude Code) está marcado deprecated; o runtime oficial é `hooks.json`.
