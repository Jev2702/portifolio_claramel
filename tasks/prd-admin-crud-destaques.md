# PRD: CRUD completo, contador de aluguel e destaques da semana

## Introduction

O painel admin da ClaraMel já cria temas e edita alguns campos, mas os 68 temas iniciais (`seed-*`) são só leitura, não há exclusão real e a home mostra os 9 primeiros da ordem — não uma vitrine curada. Esta entrega libera CRUD completo (incluindo seed), exclusão com confirmação, contador de aluguéis só no admin (+1/−1) e uma seleção híbrida de **Destaques da semana** que substitui o bloco de 9 temas da home, mantendo layout responsivo.

## Goals

- Permitir editar nome, imagens e descrição de qualquer tema (incluindo os iniciais)
- Permitir habilitar/desabilitar e excluir (apagar no Firestore) com confirmação
- Exibir e ajustar no admin um contador de aluguéis por tema (+1 / −1), invisível na vitrine pública
- Preencher a home com até 9 **Destaques da semana**: temas fixados pelo admin primeiro, depois os de maior contador
- Manter o layout público e admin usável em mobile e desktop (empilhar ações, toque ≥ 44px)

## User Stories

### US-001: Campos de aluguel, pin semanal e exclusão no modelo Theme
**Description:** As a developer, I need `rentalCount`, `weeklyPinned` and `deleted` on Theme/Firestore so later stories can persist admin actions.

**Acceptance Criteria:**
- [ ] `Theme` e `ThemeDocument` incluem `rentalCount: number` (default 0), `weeklyPinned: boolean` (default false) e `deleted: boolean` (default false)
- [ ] `mapTheme` e `initialThemes` (via default no mapper) expõem esses campos sem quebrar listagens atuais
- [ ] Typecheck passes

### US-002: Persistir tema seed no Firestore na primeira mutação
**Description:** As an admin, I want seed themes to become Firestore documents on first edit/toggle/delete so changes survive reload and do not reappear after delete.

**Acceptance Criteria:**
- [ ] Função `ensureThemeDocument(theme)` faz `setDoc` com id estável (`seed-N` ou id Firestore) incluindo campos novos
- [ ] `listActiveThemes` / `listAllThemes` / `getThemeBySlug` / `getThemeById` ignoram documentos com `deleted == true` e não recolocam o seed correspondente
- [ ] Typecheck passes

### US-003: Excluir tema de verdade com tombstone para seed
**Description:** As an admin, I want to permanently remove a theme from catalog and admin list so it does not come back from `initialThemes`.

**Acceptance Criteria:**
- [ ] `deleteTheme(id)` marca `deleted: true` (e `active: false`) no documento; se ainda for só seed, persiste antes via `ensureThemeDocument`
- [ ] Tema excluído não aparece em listagens admin nem na vitrine pública
- [ ] Typecheck passes

### US-004: Ajustar contador de aluguel no serviço
**Description:** As an admin, I want to increment or decrement a theme's rental count so the hybrid weekly ranking has data.

**Acceptance Criteria:**
- [ ] `adjustRentalCount(id, delta)` com delta `1` ou `-1`; resultado nunca menor que 0
- [ ] Persiste seed antes se necessário; atualiza `updatedAt`
- [ ] Typecheck passes

### US-005: Lista híbrida de destaques da semana
**Description:** As a customer, I want the home to show up to 9 weekly highlights chosen by admin pins then rental count so the portfolio feels curated.

**Acceptance Criteria:**
- [ ] `listWeeklyHighlights()` retorna até 9 temas **ativos** e não deletados
- [ ] Ordem: `weeklyPinned === true` primeiro (desempate: `rentalCount` desc, depois `order` asc); em seguida não-pinados pelo mesmo desempate; se ainda faltar, preenche pelos demais ativos por `order`
- [ ] Typecheck passes

### US-006: CRUD na lista admin para todos os temas
**Description:** As an admin, I want Edit, Enable/Disable and Delete on every theme (including seed) so I can fully manage the catalog.

**Acceptance Criteria:**
- [ ] Remover o bloqueio “Catálogo inicial” / `seed-*` sem ações
- [ ] Editar abre `/admin/themes/:id/edit` e salva nome, descrição e imagens (persistindo seed)
- [ ] Habilitar/Desabilitar altera `active` e some/volta na vitrine
- [ ] Excluir pede confirmação (`window.confirm` ou diálogo) com texto claro; confirmação chama `deleteTheme` e recarrega a lista
- [ ] Layout da lista empilha foto/ações no mobile (`flex-col` / wrap); botões `min-h-12`
- [ ] Typecheck passes
- [ ] Verify in browser

### US-007: Botões +1 e −1 do contador na lista admin
**Description:** As an admin, I want +1/−1 on each theme row so I can record rentals without typing.

**Acceptance Criteria:**
- [ ] Cada item da lista admin mostra o número atual (rótulo visível só no admin, ex. “Aluguéis: N”) e botões +1 e −1
- [ ] −1 desabilitado quando contador é 0; +1/−1 persistem e atualizam a linha
- [ ] Typecheck passes
- [ ] Verify in browser

### US-008: Fixar tema como destaque da semana no admin
**Description:** As an admin, I want to pin/unpin a theme as weekly highlight so I can override the automatic ranking.

**Acceptance Criteria:**
- [ ] Ação na lista admin “Destacar” / “Remover destaque” altera `weeklyPinned`
- [ ] Estado visível na linha (ex. selo “Destaque”)
- [ ] Typecheck passes
- [ ] Verify in browser

### US-009: Home com Destaques da semana no lugar dos 9 primeiros
**Description:** As a customer, I want the home catalog block to show weekly highlights (not the first 9 by order) on a responsive layout.

**Acceptance Criteria:**
- [ ] A seção da home que hoje usa `FEATURED_COUNT = 9` passa a usar `listWeeklyHighlights()` e o título **Destaques da semana**
- [ ] Link “Ver todos” continua indo para `/temas`; `/temas` lista todos os ativos (não só destaques)
- [ ] Grid e hero permanecem responsivos (1 coluna no mobile, grid no desktop); CTAs `min-h-12`
- [ ] Contador de aluguel e controles de pin **não** aparecem na vitrine pública
- [ ] Typecheck passes
- [ ] Verify in browser

## Functional Requirements

- FR-1: Todo tema (seed ou Firestore) pode ser editado (nome, descrição, imagens/capa), habilitado/desabilitado e excluído no admin autenticado.
- FR-2: Exclusão é permanente para o catálogo: documento com `deleted: true`; seeds excluídos não voltam pelo merge de `initialThemes`. Confirmação obrigatória antes de excluir.
- FR-3: `rentalCount` inicia em 0; admin ajusta só com +1 e −1; mínimo 0; o número não é exibido nas páginas públicas.
- FR-4: `weeklyPinned` permite ao admin forçar um tema nos destaques; a home mostra até 9 temas via regra híbrida (pins, depois maior `rentalCount`, depois `order`).
- FR-5: A home substitui o bloco atual de 9 temas por “Destaques da semana”. A página `/temas` permanece o catálogo completo de ativos.
- FR-6: Mutações em seed usam `setDoc` com o id `seed-N` para estabilidade.
- FR-7: Layout novo/alterado é responsivo: lista admin e home empilham no viewport estreito; alvos de toque ≥ 44px (`min-h-12`).
- FR-8: Regras Firestore continuam: escrita só autenticado; leitura pública só `active == true` e não deletado (filtrar `deleted` no cliente e, se a regra permitir, no documento).

## Non-Goals

- Agenda, contrato, pagamento ou ERP de aluguel
- Contador automático a partir de WhatsApp ou de outro sistema
- Destaques na página `/temas` (só a home muda o bloco principal)
- Cadastro público de admin
- Exclusão em lote
- Relatórios além do número na linha do tema

## Technical Considerations

- Reutilizar `ThemeForm`, `ImageUploader`, `AdminThemesPage` e tokens ClaraMel.
- Constante `WEEKLY_HIGHLIGHT_COUNT = 9` no serviço ou `app-config`.
- Documentos `deleted: true` não devem ser enviados à UI; `mergeThemes` deve pular seed cujo id/slug já existe no remoto (inclusive deletado).
- Imagens seed em `/themes/tema-N.jpg` podem permanecer no `public/`; exclusão não precisa apagar o arquivo estático.
- Browser MCP pode estar indisponível: verificar typecheck e, se possível, o dev server; anotar a limitação nas notes.

## Success Metrics

- Admin edita e exclui um tema seed sem ele reaparecer após F5
- +1/−1 atualiza o número na lista sem ir à página de edição
- Home mostra até 9 destaques na ordem híbrida e o restante do catálogo segue em `/temas`
- Layout não quebra em viewport ~375px nem desktop

## Open Questions

- Publicar `firestore.rules` atualizadas no Console se o filtro `deleted` precisar ser server-side (V1 pode filtrar no cliente).
- Quantos pins simultâneos o admin deve usar na prática (o algoritmo aceita mais que 9; a home corta em 9).
