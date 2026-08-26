# Pegue e Monte ClaraMel

Catálogo digital dos temas de Pegue e Monte da ClaraMel: vitrine pública e painel administrativo (Firebase Authentication + Cloud Firestore).

## Requisitos

- Node.js 20+
- Conta Firebase (projeto criado no Console)

## Configuração local

1. A config pública do Firebase já está em `src/config/firebase-public.ts` (essas chaves web não são secretas; a proteção é pelas regras do Firestore e pelos domínios autorizados).
2. O WhatsApp da ClaraMel já está em `src/config/app-config.ts`. Os botões **Faça seu orçamento** abrem o `wa.me` com mensagem pré-preenchida. `VITE_WHATSAPP_NUMBER` em `.env.local` só é necessário se quiser sobrescrever o número.

Não versione `.env` nem `.env.local`.

## Firebase Console

1. Crie o projeto e um app Web (chaves públicas em `src/config/firebase-public.ts`).
2. Ative **Authentication → E-mail/senha**. Não habilite cadastro público neste site — o usuário admin é criado só no Console (**Authentication → Users → Add user**).
3. Crie o banco **Cloud Firestore**.
4. Publique as regras do arquivo `firestore.rules` na raiz deste repositório (e os índices de `firestore.indexes.json`).
5. Confirme que as regras **não** usam `allow read, write: if true`.
6. Leitura pública: apenas temas com `active == true`. Escrita: somente usuário autenticado.

## Scripts

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Deploy na Vercel

1. `npm run build` deve concluir sem erro.
2. Importe o repositório na Vercel (framework: Vite).
3. Não é necessário plano Pro nem variáveis de ambiente na Vercel para o Firebase: a config web já vai no build.
4. O arquivo `vercel.json` faz rewrite SPA (`/(.*)` → `/index.html`) para rotas como `/tema/:slug` após refresh.
5. Publique `firestore.rules` e `firestore.indexes.json` no Firebase.
6. Crie o usuário admin no Console (e-mail/senha).
7. Em Authentication → Settings → Authorized domains, adicione o domínio da Vercel (e o domínio customizado da ClaraMel, quando houver).
8. Confirme HTTPS e o catálogo público sem login.
