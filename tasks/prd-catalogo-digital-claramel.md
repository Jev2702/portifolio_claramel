# PRD: Catálogo Digital Pegue e Monte ClaraMel

## Introduction

A ClaraMel precisa de um catálogo digital próprio para apresentar os temas de Pegue e Monte. Hoje a divulgação depende de canais externos; a V1 centraliza a vitrine em um site responsivo, com área pública sem login e painel administrativo para cadastrar temas e imagens sem republicar o app.

A aplicação é um SPA (React + Vite + TypeScript + Tailwind) hospedado na Vercel, consumindo Firebase Authentication e Cloud Firestore diretamente pelo SDK. Não haverá API própria. As imagens serão comprimidas no navegador, convertidas para Base64 e gravadas no documento do tema, atrás de uma camada `ImageService` preparada para migrar depois para Firebase Storage.

Identidade visual: logo oficial em `assets/logo.png` (copiar para `src/assets/logo/` sem deformar) e paleta do app `gestaoClaramelApp` (`src/constants/claramel-theme.ts`). WhatsApp e Instagram ficam vazios nesta entrega; qualquer CTA desses canais permanece oculto enquanto o valor estiver vazio. Referência de UX (não copiar): https://le-doces.vercel.app.

Fonte de requisitos original: `docs/prd_init_portifolio_claramel.md`. Este PRD é o recorte executável da V1 completa.

## Goals

- Cliente acessa o catálogo no celular sem login e vê somente temas ativos, ordenados por `order` ASC e `createdAt` DESC
- Cliente pesquisa por nome/categoria, abre detalhes com galeria e, se houver número configurado, inicia conversa no WhatsApp com mensagem pré-preenchida
- Administrador autentica com e-mail/senha (Firebase Auth), cria/edita temas, define capa e ordem, e inativa temas (sem exclusão definitiva na UI)
- Imagens respeitam no máximo 8 por tema, largura máxima 1600px, alvo 100 KB cada, e o documento do Firestore permanece abaixo de ~900 KB
- Identidade ClaraMel aplicada via tokens (`src/styles/theme.ts` + Tailwind), sem hex espalhado nos componentes
- Projeto pronto para deploy na Vercel (SPA rewrite, `.env.example`, regras Firestore versionadas)

## User Stories

### US-001: Scaffold Vite React TypeScript Tailwind
**Description:** As a developer, I want the web app bootstrapped with Vite, React, TypeScript, Tailwind CSS and React Router so the rest of the V1 can be built on a standard SPA.

**Acceptance Criteria:**
- [ ] Projeto criado na raiz com Vite + React + TypeScript (strict)
- [ ] Tailwind CSS configurado e um utilitário de teste (ex.: `bg-primary`) aplicado em `App` para confirmar o pipeline
- [ ] React Router instalado; `npm run build` e `npm run dev` funcionam
- [ ] `.gitignore` ignora `node_modules`, `dist`, `.env`, `.env.local`
- [ ] Typecheck passes

### US-002: Estrutura modular e rotas esqueleto
**Description:** As a developer, I want folders and route placeholders matching the public/admin split so features land in the right place.

**Acceptance Criteria:**
- [ ] Pastas criadas: `src/assets/{images,logo}`, `src/components/{common,layout,public,admin}`, `src/pages/public/{Home,Themes,ThemeDetails}`, `src/pages/admin/{Login,Dashboard,Themes}`, `src/services/{firebase,auth,themes}`, `src/hooks`, `src/contexts`, `src/types`, `src/utils`, `src/routes`
- [ ] Rotas declaradas (páginas placeholder com título visível): `/`, `/temas`, `/tema/:slug`, `/admin`, `/admin/login`, `/admin/themes`, `/admin/themes/new`, `/admin/themes/:id/edit`
- [ ] Não existe API própria nem pasta de backend
- [ ] Typecheck passes
- [ ] Verify in browser

### US-003: Tokens de design, logo e tipografia ClaraMel
**Description:** As a visitor, I want the site to look like ClaraMel (logo, candy palette, rounded UI) so the catalog feels commercial and delicate, not generic.

**Acceptance Criteria:**
- [ ] Copiar `assets/logo.png` para `src/assets/logo/claramel-logo.png` sem recortar, esticar ou recolorir
- [ ] Criar `src/styles/theme.ts` exportando exatamente estes tokens (origem: `gestaoClaramelApp/src/constants/claramel-theme.ts`): `primary #8B5CF6`, `secondary #FF5D8F`, `yellow #FFD86B`, `sky #57C7FF`, `orange #FFBE5C`, `background #FFF8F1`, `surface #FFFFFF`, `pinkLight #FFC7E8`, `lavender #EAD9FF`, `grayLight #F3F4F6`, `grayMedium #D9D9D9`, `text #4B4B4B`, `textSecondary #7B7B7B`, `textOnPrimary #FFFFFF`, `title #6B3CC9`, `success #54D38A`, `error #FF6B6B`, `warning #FFBE5C`, `info #57C7FF`, raios `button 16` / `card 24` / `input 12`, gradientes `gradientPrimary [#FFF8B8, #FFD8E8, #F3C7FF]` e `gradientCta [#FF5D8F, #8B5CF6]`
- [ ] `tailwind.config` estende cores/radius a partir desses tokens; componentes não usam hex solto
- [ ] Fontes: Poppins (títulos) e Nunito (corpo), via Google Fonts
- [ ] Logo aparece na página placeholder com proporção original
- [ ] Typecheck passes
- [ ] Verify in browser

### US-004: Configuração central e variáveis de ambiente
**Description:** As a developer, I want contact and Firebase settings in one place so values are not copied across components.

**Acceptance Criteria:**
- [ ] `src/config/app-config.ts` (ou equivalente) exporta `APP_CONFIG` com `name: "Pegue e Monte ClaraMel"`, `whatsapp: ""`, `instagram: ""`, `description` curta
- [ ] Número de WhatsApp lido de `VITE_WHATSAPP_NUMBER` (pode ficar vazio); não hardcodar telefone
- [ ] `.env.example` com `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_WHATSAPP_NUMBER` (valores vazios)
- [ ] README curto explica: copiar `.env.example` → `.env.local`, criar projeto Firebase no Console, colar as chaves públicas
- [ ] Typecheck passes

### US-005: Cliente Firebase e tipo Theme
**Description:** As a developer, I need the Firebase SDK initialized and a typed Theme model so public and admin features share one contract.

**Acceptance Criteria:**
- [ ] `src/services/firebase/firebase.ts` inicializa app, Auth e Firestore a partir de `import.meta.env` (não commitar secrets além das chaves públicas padrão do Firebase)
- [ ] Tipo `Theme` em `src/types` com: `id`, `name`, `slug`, `description`, `category?`, `coverImage` (string Base64 ou data URL), `images` (string[]), `active`, `order`, `createdAt`, `updatedAt`
- [ ] Nenhuma service account, senha ou chave privada no frontend
- [ ] Typecheck passes

### US-006: ImageService com compressão e limite de documento
**Description:** As an admin, I want selected photos compressed in the browser so Firestore documents stay under the 1 MiB limit.

**Acceptance Criteria:**
- [ ] `src/services/themes/image-service.ts` (ou `src/services/firebase/image-service.ts`) expõe `validateImage`, `compressImage`, `convertToBase64` e `estimatePayloadSize`
- [ ] Fluxo: validar tipo (jpeg/png/webp) → redimensionar max 1600px no maior lado → comprimir (WebP com fallback JPEG) → Base64; não guardar o arquivo original
- [ ] Máximo 8 imagens por tema; recusar o 9º com mensagem amigável
- [ ] Alvo ~100 KB por imagem; recusar se uma imagem comprimida passar de ~250 KB ou se o payload estimado do documento passar de 900 KB
- [ ] Mensagem de erro amigável quando o arquivo não puder ser processado (sem stack do Firebase)
- [ ] Preferir Canvas API; não instalar biblioteca pesada sem necessidade
- [ ] Typecheck passes

### US-007: Serviço Firestore de temas
**Description:** As a developer, I want a themes service that creates slugs, timestamps and ordered queries so pages never talk to Firestore directly.

**Acceptance Criteria:**
- [ ] `src/services/themes/themes-service.ts` com listar ativos (público), listar todos (admin), obter por slug, obter por id, criar, atualizar, inativar (`active = false`)
- [ ] Slug gerado do `name` (minúsculas, hífens); colisão resolve com sufixo `-2`, `-3`
- [ ] Público: query `active == true`, ordenar `order` ASC e empate `createdAt` DESC
- [ ] `createdAt`/`updatedAt` via `serverTimestamp()`
- [ ] Componentes não importam `firebase/firestore` diretamente; só o serviço
- [ ] Typecheck passes

### US-008: Regras de segurança do Firestore
**Description:** As a product owner, I want Firestore rules that let anyone read active themes and only signed-in users write, so the public site cannot create or edit data.

**Acceptance Criteria:**
- [ ] Arquivo `firestore.rules` na raiz (ou `firebase/firestore.rules`) versionado
- [ ] Leitura pública apenas de documentos `themes` com `active == true`; admin autenticado lê todos
- [ ] Create/update/delete somente se `request.auth != null`
- [ ] Proibido `allow read, write: if true`
- [ ] README documenta: criar projeto Firebase, habilitar Auth e-mail/senha, criar Firestore, publicar estas regras, criar o usuário admin no Console (sem cadastro público)
- [ ] Documentation complete

### US-009: Login administrativo com Firebase Auth
**Description:** As an admin, I want to sign in with email and password at `/admin/login` so only ClaraMel staff can manage themes.

**Acceptance Criteria:**
- [ ] Página `/admin/login` com campos E-mail, Senha e botão Entrar; logo ClaraMel visível
- [ ] Loading no submit; erros amigáveis (credencial inválida, rede) — nunca `FirebaseError: ...` na UI
- [ ] Não existe tela de cadastro público; não há link "criar conta"
- [ ] Sucesso redireciona para `/admin`
- [ ] Typecheck passes
- [ ] Verify in browser

### US-010: Rotas admin protegidas, layout e logout
**Description:** As an admin, I want `/admin/*` (exceto login) blocked when I am logged out, and a simple shell with logout, so the panel is not reachable anonymously.

**Acceptance Criteria:**
- [ ] Acesso a `/admin`, `/admin/themes`, `/admin/themes/new`, `/admin/themes/:id/edit` sem sessão redireciona para `/admin/login`
- [ ] Layout admin com logo, navegação (Dashboard, Temas) e botão Sair
- [ ] Logout limpa a sessão e volta para `/admin/login`
- [ ] Typecheck passes
- [ ] Verify in browser

### US-011: Dashboard com totais de temas
**Description:** As an admin, I want `/admin` to show total, active and inactive theme counts so I see catalog health at a glance.

**Acceptance Criteria:**
- [ ] Três cards: total, ativos, inativos (sem gráficos)
- [ ] Estados loading / erro amigável / zeros quando não há temas
- [ ] Typecheck passes
- [ ] Verify in browser

### US-012: Listagem admin e inativação de tema
**Description:** As an admin, I want `/admin/themes` to list every theme with edit and activate/deactivate actions so I can hide a theme from the public catalog without deleting it.

**Acceptance Criteria:**
- [ ] Tabela ou lista (mobile-first, sem scroll horizontal obrigatório) com capa, nome, categoria, status, ordem, ações
- [ ] Botão "+ Novo tema" vai para `/admin/themes/new`
- [ ] Ação Editar vai para `/admin/themes/:id/edit`
- [ ] Ação Ativar/Inativar persiste `active` e o tema inativo some do catálogo público
- [ ] Não existe botão Excluir nem exclusão definitiva nesta V1
- [ ] Typecheck passes
- [ ] Verify in browser

### US-013: Cadastro de tema com imagens e capa
**Description:** As an admin, I want to create a theme with compressed images, cover and order so it can appear in the public catalog when active.

**Acceptance Criteria:**
- [ ] Formulário em `/admin/themes/new`: Nome *, Descrição *, Categoria (select opcional: Infantil, Feminino, Masculino, Neutro, Adulto, ou vazio), Ativo, Ordem (número; menor = primeiro)
- [ ] Upload: desktop com dropzone "Arraste as imagens aqui" + "Selecionar imagens"; mobile usa input file nativo; preview com remover e indicador de capa
- [ ] Primeira imagem vira capa automaticamente; admin pode marcar outra como capa
- [ ] Salvar chama ImageService + themes-service; slug gerado; redirect para `/admin/themes` em sucesso
- [ ] Validação: nome e descrição obrigatórios; pelo menos 1 imagem; máximo 8; recusar payload > 900 KB
- [ ] Typecheck passes
- [ ] Verify in browser

### US-014: Edição de tema existente
**Description:** As an admin, I want to edit a theme at `/admin/themes/:id/edit` so I can change copy, cover, gallery and order without recreating it.

**Acceptance Criteria:**
- [ ] Formulário pré-preenchido; imagens existentes preservadas até o admin remover
- [ ] Permite adicionar imagens, remover, trocar capa e alterar ordem/status/categoria
- [ ] `updatedAt` atualiza; slug só regenera se o nome mudar e o novo slug estiver livre (senão mantém o atual)
- [ ] Typecheck passes
- [ ] Verify in browser

### US-015: Layout público, header, footer e Home
**Description:** As a customer, I want a branded home page with header, hero and footer so I understand ClaraMel and can reach the catalog.

**Acceptance Criteria:**
- [ ] Header público: logo (proporção original), nome/marca, nav (Início, Temas); no mobile menu compacto (hamburger ou equivalente) sem ocupar a dobra
- [ ] Botão de WhatsApp no header somente se `APP_CONFIG.whatsapp` / `VITE_WHATSAPP_NUMBER` não estiver vazio
- [ ] Home `/` com hero: título "Pegue e Monte ClaraMel", subtítulo "Encontre o tema perfeito para a sua festa.", CTA "Ver nossos temas" → `/temas`; fundo/gradiente usando tokens ClaraMel
- [ ] Footer: logo, "Pegue e Monte ClaraMel", "© ClaraMel"; Instagram só se configurado; não inventar telefone, endereço ou @
- [ ] Typecheck passes
- [ ] Verify in browser

### US-016: Catálogo público com cards, busca e ordenação
**Description:** As a customer, I want `/temas` to show active theme cards I can search so I can find a party theme quickly on my phone.

**Acceptance Criteria:**
- [ ] Grid: 1 coluna mobile, 2 tablet, 3 desktop; card com capa, nome, categoria (se houver), link "Ver tema"
- [ ] Campo "Buscar tema..." filtra no frontend por nome e categoria (case-insensitive)
- [ ] Somente `active === true`; ordem `order` ASC, empate `createdAt` DESC
- [ ] Capa com lazy loading; não carregar galeria completa na listagem
- [ ] Estados: "Carregando temas...", "Nenhum tema encontrado.", "Não foi possível carregar os temas. Tente novamente."
- [ ] Typecheck passes
- [ ] Verify in browser

### US-017: Detalhes do tema e galeria
**Description:** As a customer, I want `/tema/:slug` with a gallery so I can inspect the decoration before contacting ClaraMel.

**Acceptance Criteria:**
- [ ] Exibe nome, descrição, categoria (se houver), imagem principal, galeria, botão voltar para `/temas`
- [ ] Trocar imagem principal ao clicar/tocar um thumb; lightbox/ampliar; setas ou swipe no mobile
- [ ] `alt` descritivo em cada imagem (pelo menos o nome do tema)
- [ ] Tema inativo ou slug inexistente: mensagem amigável + link para o catálogo (não tela branca)
- [ ] Title da página: `{nome} | Pegue e Monte ClaraMel`
- [ ] Typecheck passes
- [ ] Verify in browser

### US-018: CTA WhatsApp condicional e estados globais
**Description:** As a customer, I want a "Quero saber mais" button that opens WhatsApp with the theme name when a number is configured, and I want that button hidden while the number is empty.

**Acceptance Criteria:**
- [ ] Helper único gera `https://wa.me/{numero}?text=` com texto `Olá! Gostaria de saber mais sobre o tema "{nome}".`
- [ ] CTA "Quero saber mais" na página de detalhes somente se o número não for string vazia
- [ ] Header/footer também ocultam WhatsApp/Instagram quando vazios
- [ ] Erros técnicos do Firebase nunca aparecem na UI (apenas mensagem amigável; detalhe no console em dev)
- [ ] Typecheck passes
- [ ] Verify in browser

### US-019: SEO básico, acessibilidade e deploy Vercel
**Description:** As ClaraMel, I want the SPA deployable on Vercel with basic SEO and accessible controls so the catalog can go live on a custom domain later.

**Acceptance Criteria:**
- [ ] `index.html`: title, meta description, favicon a partir da logo, Open Graph básico (title, description, image da logo)
- [ ] Formulários com `label` associado; botões nativos ou `role="button"`; foco visível; área de toque adequada no mobile
- [ ] `vercel.json` com rewrite SPA `/(.*) → /index.html`
- [ ] README: checklist de deploy (build, env na Vercel, regras Firestore, usuário admin no Console, Auth autorizado para o domínio)
- [ ] `npm run build` conclui sem erro
- [ ] Typecheck passes
- [ ] Verify in browser

## Functional Requirements

- FR-1: A área pública não exige autenticação. Rotas: `/`, `/temas`, `/tema/:slug`.
- FR-2: O catálogo público lista apenas temas com `active === true`, ordenados por `order` crescente e `createdAt` decrescente em empate.
- FR-3: A busca pública filtra no cliente por `name` e `category` (case-insensitive), sem query composta extra no Firestore na V1.
- FR-4: O card do tema exibe capa, nome, categoria (se preenchida) e atalho para `/tema/:slug`.
- FR-5: A página de detalhes exibe nome, descrição, categoria, galeria interativa e botão voltar.
- FR-6: O CTA WhatsApp usa número centralizado (`VITE_WHATSAPP_NUMBER` / `APP_CONFIG.whatsapp`). Se vazio, nenhum botão/link de WhatsApp é renderizado. O mesmo vale para Instagram.
- FR-7: Mensagem padrão do WhatsApp: `Olá! Gostaria de saber mais sobre o tema "{nome}".`
- FR-8: Rotas `/admin` (exceto `/admin/login`) exigem Firebase Auth (e-mail/senha). Visitante anônimo é redirecionado para `/admin/login`.
- FR-9: Não existe auto-cadastro. Usuários admin são criados no Firebase Console.
- FR-10: O administrador pode criar e editar: nome, descrição, categoria opcional, imagens, capa, `active`, `order`.
- FR-11: Slug é gerado do nome e usado em `/tema/:slug`. Colisões recebem sufixo numérico.
- FR-12: Máximo 8 imagens por tema. Capa obrigatória (primeira por padrão, alterável).
- FR-13: ImageService comprime no browser (max 1600px, alvo ~100 KB, teto ~250 KB/imagem) e grava Base64 no documento. Payload estimado > 900 KB bloqueia o save.
- FR-14: Inativar define `active = false`. A V1 não oferece exclusão definitiva na interface.
- FR-15: Dashboard admin mostra totais: temas, ativos, inativos.
- FR-16: Regras Firestore: leitura pública só de temas ativos; escrita só autenticada. Nunca `allow read, write: if true`.
- FR-17: Tokens visuais em `src/styles/theme.ts` + Tailwind; logo oficial sem distorção; mobile-first (360, 390, 414, 768, 1024, 1280, 1440).
- FR-18: Toda listagem tem loading, empty e error com copy em português, sem códigos técnicos.
- FR-19: SEO: title, description, favicon, OG básico; detalhe do tema com title `{nome} | Pegue e Monte ClaraMel`.
- FR-20: Hospedagem Vercel; Firebase via SDK no cliente; `.env.example` versionado; `.env.local` não versionado.
- FR-21: `vercel.json` garante deep links do SPA após refresh.
- FR-22: Acessibilidade mínima: `alt` nas imagens, labels, contraste dos tokens ClaraMel, navegação por teclado, foco visível.

## Non-Goals

- Cadastro público de usuários ou auto-serviço de conta admin
- Firebase Storage nesta V1 (apenas a interface ImageService para migração futura)
- Backend/API própria, Next.js SSR ou CMS headless
- Exclusão definitiva de tema na UI
- Drag-and-drop para reordenar a lista de temas (campo numérico `order` basta)
- Cadastro de clientes, itens, estoque, agenda, reserva, orçamento, pagamento, contrato, financeiro, ERP
- App mobile nativo, PWA avançado, i18n, dark mode
- Copiar o layout do le-doces; inventar WhatsApp, Instagram, endereço ou CNPJ
- Gráficos no dashboard; notificações push/e-mail
- Seed automático de temas falsos em produção

## Design Considerations

- Identidade: festiva, delicada, comercial, foco em foto. Fundo cream `#FFF8F1`, primário roxo `#8B5CF6`, CTA rosa `#FF5D8F`, título `#6B3CC9`.
- Logo: balões + placa "Claramel"; não recolorir; fundo da logo é transparente/escuro — no header usar a logo em tamanho que o texto "Claramel" permaneça legível.
- Tipografia: Poppins para headings, Nunito para corpo (mesmo par do `gestaoClaramelApp`).
- Cards com `border-radius` 24, botões 16, inputs 12; sombras suaves.
- Mobile-first: botões com área de toque confortável; não depender de hover; formulários em uma coluna no telefone.
- Referência de organização: https://le-doces.vercel.app — inspirar hierarquia (hero, grade de cards, detalhe), não clonar marca nem CSS.

## Technical Considerations

- Stack obrigatória: React, Vite, TypeScript, Tailwind CSS, React Router, Firebase Auth, Cloud Firestore, deploy Vercel.
- Sem backend próprio. Regras de negócio (slug, compressão, payload) nos serviços, não nos componentes.
- Coleção `themes`. Documento único por tema; não acumular imagens sem teto.
- Limite Firestore = 1 MiB/documento. Validar tamanho aproximado do Base64 antes de `set`/`update`.
- Auth: e-mail/senha. Domínio da Vercel precisa estar em Authorized domains no Firebase.
- Quem cria o projeto Firebase e o usuário admin: a ClaraMel / o operador no Console. O código entrega SDK, `.env.example`, `firestore.rules` e o checklist.
- Evolução futura (não implementar): Storage no lugar de Base64; módulos Clientes/Itens/Locações. Manter pastas `services/` isoladas para isso.
- Dependências: evitar libs extras. Compressão via Canvas. Router e Firebase SDK são obrigatórios.

## Success Metrics

- Cliente encontra um tema e abre o detalhe em menos de 3 toques a partir da Home
- Tema inativado some do catálogo público na próxima carga, sem deploy
- Admin cadastra um tema com imagens sem mensagem de documento excedido (payload < 900 KB)
- Lighthouse-like: site usável em 360px; imagens da Home/catálogo não disparam download da galeria completa
- `npm run build` verde; refresh em `/tema/:slug` na Vercel não dá 404

## Open Questions

- Número de WhatsApp e @ do Instagram oficiais ainda não foram fornecidos; CTAs ficam ocultos até `VITE_WHATSAPP_NUMBER` / `APP_CONFIG.instagram` serem preenchidos
- Domínio customizado da ClaraMel na Vercel será configurado no deploy, fora do código
- Categoria permanece opcional; se a ClaraMel quiser filtro por chips além da busca, isso fica para um PRD seguinte
- Qualidade WebP vs JPEG em Safari antigo: ImageService deve fazer fallback JPEG se `canvas.toBlob('image/webp')` falhar
