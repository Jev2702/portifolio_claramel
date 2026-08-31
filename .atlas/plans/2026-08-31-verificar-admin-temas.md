---
title: Verificar admin de temas com login e senha
created: 2026-08-31
status: active
tags: [admin, firebase, verificacao]
related: ["tasks/prd-catalogo-digital-claramel.md"]
---

# Plano: Verificar admin de temas com login e senha

## Objetivo
Confirmar, no navegador, que o painel administrativo funciona de ponta a ponta: login com e-mail/senha, listagem/criação/edição/inativação de temas, proteção das rotas e logout. Pronto = checklist abaixo executado em local (e, se o site já estiver no ar, também em produção) com evidência do que passou e do que falhou.

## Contexto
O admin **já está implementado** neste repo (PRD US-009 a US-014). Não é um feature novo; é uma verificação operacional.

Rotas:
- Login: `/admin/login` (`src/pages/admin/Login/LoginPage.tsx`)
- Dashboard: `/admin` (totais: temas / ativos / inativos)
- Lista: `/admin/themes` (botão **+ Novo tema**, Editar, Inativar/Ativar)
- Novo: `/admin/themes/new`
- Editar: `/admin/themes/:id/edit`
- Sem sessão, qualquer `/admin/*` (exceto login) redireciona para `/admin/login` (`ProtectedRoute`)

Auth: Firebase Authentication **e-mail/senha**. Não existe cadastro no site. O usuário admin precisa existir no Console (Authentication → Users → Add user).

Restrição conhecida: temas do catálogo inicial (`id` começando com `seed-`) **não** têm Editar/Inativar na UI; só temas gravados no Firestore. Para testar CRUD, criar um tema novo.

Firestore: leitura pública só de `active == true`; create/update exige `request.auth != null` (`firestore.rules`). Se as regras não estiverem publicadas no Console, o admin autenticado ainda pode falhar ao salvar.

Ambientes:
- Local: `npm run dev` → tipicamente `http://localhost:5173/` (ou 5174/5175 se a porta estiver ocupada)
- Produção: `main` no GitHub; Vercel se o repo já estiver importado

## Abordagem
Verificar primeiro o **pré-requisito Firebase** (usuário admin + regras), depois o fluxo feliz no **local**, depois os **erros e a proteção de rota**, e só então o **mesmo fluxo em produção** se houver URL. Alternativa “só olhar o código” descartada: o pedido é ver a tela com login real.

## Passos
- [x] No Firebase Console do projeto `portifolio-claramel`, confirmar Authentication → Sign-in method → **E-mail/senha** ativo
- [x] Confirmar que existe um usuário admin (Authentication → Users). Se não existir, criar um (e-mail + senha); não commitar a senha
- [ ] Publicar `firestore.rules` deste repositório no Firestore (se ainda não estiver live)
- [ ] Em Authentication → Settings → Authorized domains, incluir `localhost` (já costuma vir) e o domínio da Vercel, se houver
- [x] Subir o app local (`npm run dev`) e abrir `/admin/login` — 2026-08-31, `http://localhost:5173/admin/login`
- [ ] Tentar login com senha errada: deve aparecer mensagem amigável, sem stack, e permanecer na tela de login
- [ ] Login com e-mail e senha corretos: deve ir para `/admin` (Dashboard) com os três totais
- [ ] Abrir `/admin/themes`: listar temas (seed + Firestore); seed deve mostrar “Catálogo inicial” sem Editar/Inativar
- [ ] Criar um tema de teste em `/admin/themes/new` (nome, descrição, 1–2 fotos, ativo, ordem) e salvar
- [ ] Confirmar o tema na lista admin e na vitrine pública (`/` ou `/temas` e `/tema/:slug`)
- [ ] Editar o mesmo tema (texto e/ou capa) e confirmar a alteração no público
- [ ] Inativar o tema no admin: some da vitrine pública; no admin permanece como Inativo; Ativar devolve à vitrine
- [ ] Sem estar logado (aba anônima ou após Sair), acessar `/admin`, `/admin/themes` e `/admin/themes/new`: redirecionar para `/admin/login`
- [ ] Clicar **Sair** no header admin: sessão some e volta para `/admin/login`
- [ ] Se houver URL da Vercel, repetir login + criar/inativar um tema de teste em produção
- [ ] Registrar o resultado (passou / falhou / print ou nota) neste plano: marcar os passos e, se algo quebrar, abrir correção (PRD Discovery ou ajuste pontual)

## Riscos & Mitigações
- Usuário admin ainda não criado no Console → login “válido” falha; criar o user antes de julgar o código.
- Regras do Firestore não publicadas → lista/save quebra mesmo autenticado; publicar `firestore.rules`.
- Temas `seed-*` não editáveis → esperado; o CRUD se valida só em tema criado no admin.
- Domínio da Vercel não autorizado no Auth → login em produção falha; adicionar o host em Authorized domains.
- Senha/e-mail vazam no chat ou no Git → usar só no Console; nunca commitar `.env.local` nem credenciais.

## Questões em aberto
- ~~Já existe usuário admin no Firebase Console?~~ Sim — acesso criado pelo operador em 2026-08-31.
- Qual URL de produção usar (projeto Vercel), se o deploy já estiver no ar?
- Depois da verificação: apagar o tema de teste do Firestore ou apenas inativá-lo?
- Credenciais não estão no repo (correto). Login real no navegador fica com o operador; sessão de agente sem MCP de browser.
