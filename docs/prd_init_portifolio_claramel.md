# PRD — Pegue e Monte ClaraMel

## Catálogo Digital de Temas — V1

**Projeto:** Pegue e Monte ClaraMel
**Versão:** 1.0
**Status:** Desenvolvimento
**Objetivo:** Criar um catálogo digital responsivo para apresentação dos temas de decoração/pegue e monte da ClaraMel, com área administrativa para gerenciamento dos temas.

---

# 1. Visão geral

O projeto consiste em uma aplicação web responsiva para o **Pegue e Monte ClaraMel**.

A aplicação terá duas áreas principais:

### Área pública

Destinada aos clientes da ClaraMel.

O cliente poderá:

* acessar o catálogo sem realizar login;
* visualizar os temas disponíveis;
* pesquisar/filtrar temas;
* abrir os detalhes de um tema;
* visualizar imagens;
* consultar informações do tema;
* entrar em contato com a ClaraMel pelo WhatsApp.

### Área administrativa

Destinada exclusivamente aos responsáveis pela ClaraMel.

O administrador poderá:

* realizar login;
* cadastrar temas;
* editar temas;
* excluir temas;
* ativar/inativar temas;
* definir ordem de exibição;
* cadastrar imagens;
* definir imagem de capa;
* organizar a galeria;
* visualizar os temas cadastrados.

---

# 2. Objetivo do produto

O objetivo da V1 é substituir/centralizar a apresentação dos temas da ClaraMel em um catálogo digital próprio.

O sistema deverá permitir que a ClaraMel cadastre novos temas sem precisar alterar código ou publicar uma nova versão da aplicação.

Fluxo principal:

```text
Administrador
      ↓
Login
      ↓
Cadastro do tema
      ↓
Upload das imagens
      ↓
Compressão das imagens
      ↓
Firebase / Firestore
      ↓
Tema publicado
      ↓
Cliente acessa o catálogo
      ↓
Visualiza o tema
      ↓
Contato via WhatsApp
```

---

# 3. Referência visual

Utilizar como referência de experiência e organização:

https://le-doces.vercel.app

A referência não deverá ser copiada.

A aplicação deverá possuir identidade visual própria da **ClaraMel**, utilizando:

* logo oficial da ClaraMel;
* paleta de cores da ClaraMel;
* tipografia compatível com a identidade visual;
* aparência delicada, elegante e comercial;
* foco em imagens;
* experiência mobile-first.

---

# 4. Stack obrigatória

Utilizar:

### Frontend

* React
* Vite
* TypeScript
* CSS moderno ou Tailwind CSS
* React Router

### Backend

Firebase.

Utilizar:

* Firebase Authentication
* Cloud Firestore

### Hospedagem

Prioridade:

**Vercel**

Não utilizar backend próprio na V1.

A aplicação deverá funcionar como frontend estático/SPA consumindo o Firebase.

---

# 5. Arquitetura

Arquitetura inicial:

```text
React / Vite
     │
     ├── Área Pública
     │
     └── Área Administrativa
             │
             ├── Firebase Authentication
             │
             └── Firestore
```

O frontend deverá acessar o Firebase diretamente através do SDK oficial.

Não criar API própria na V1.

---

# 6. Estrutura sugerida do projeto

Organizar o projeto de forma modular.

```text
src/
│
├── assets/
│   ├── images/
│   └── logo/
│
├── components/
│   ├── common/
│   ├── layout/
│   ├── public/
│   └── admin/
│
├── pages/
│   ├── public/
│   │   ├── Home/
│   │   ├── Themes/
│   │   └── ThemeDetails/
│   │
│   └── admin/
│       ├── Login/
│       ├── Dashboard/
│       └── Themes/
│
├── services/
│   ├── firebase/
│   ├── auth/
│   └── themes/
│
├── hooks/
│
├── contexts/
│
├── types/
│
├── utils/
│
├── routes/
│
└── App.tsx
```

O código deverá ser organizado por responsabilidade.

Evitar componentes gigantes.

---

# 7. Firebase

Criar projeto Firebase separado para a aplicação.

## Firebase Authentication

Utilizar inicialmente:

**Email + senha**

O login administrativo não deverá permitir cadastro público de usuários.

Os usuários administrativos deverão ser criados diretamente pelo Firebase Console ou posteriormente através de funcionalidade administrativa.

---

# 8. Firestore

Criar a coleção:

```text
themes
```

Cada documento representa um tema.

Estrutura sugerida:

```typescript
interface Theme {
  id: string;
  name: string;
  slug: string;
  description: string;
  category?: string;
  coverImage: string;
  images: string[];
  active: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

# 9. Campos do tema

## ID

Gerado automaticamente pelo Firestore.

## Nome

Obrigatório.

Exemplo:

```text
Jardim Encantado
```

## Slug

Gerado automaticamente a partir do nome.

Exemplo:

```text
jardim-encantado
```

O slug deverá ser utilizado para URLs amigáveis quando possível.

Exemplo:

```text
/tema/jardim-encantado
```

## Descrição

Campo de texto para explicar o tema.

Exemplo:

```text
Tema delicado e encantador para festas infantis,
com elementos florais e decoração personalizada.
```

## Categoria

Opcional na V1, mas já deixar o campo preparado.

Exemplos:

```text
Infantil
Feminino
Masculino
Neutro
Adulto
```

## Imagem de capa

Obrigatória.

Será a imagem exibida no card do catálogo.

## Galeria

Lista de imagens adicionais.

## Ativo

Booleano.

```text
true
false
```

Somente temas ativos aparecem no catálogo público.

## Ordem

Número inteiro.

Exemplo:

```text
1
2
3
4
```

Quanto menor o número, maior a prioridade de exibição.

## Datas

Registrar:

```text
createdAt
updatedAt
```

---

# 10. Imagens

## Estratégia V1

Não utilizar Firebase Storage inicialmente.

As imagens serão:

1. selecionadas pelo navegador;
2. redimensionadas;
3. comprimidas;
4. convertidas para formato adequado;
5. transformadas em Base64;
6. armazenadas no Firestore.

---

# 11. Compressão de imagens

A aplicação deverá possuir uma função centralizada para tratamento das imagens.

Fluxo:

```text
Imagem original
      ↓
Verificação do arquivo
      ↓
Redimensionamento
      ↓
Compressão
      ↓
Conversão para WebP/JPEG
      ↓
Base64
      ↓
Firestore
```

Não armazenar a imagem original.

---

# 12. Limites das imagens

Implementar limites para evitar documentos grandes.

Configuração inicial:

```text
Quantidade máxima de imagens por tema: 8

Largura máxima: 1600px

Tamanho recomendado após compressão:
100 KB ~ 300 KB por imagem
```

O sistema deverá exibir aviso quando uma imagem não puder ser processada adequadamente.

Evitar que o documento do Firestore ultrapasse o limite permitido.

---

# 13. Importante sobre o Firestore

O desenvolvimento deverá considerar o limite de tamanho dos documentos do Firestore.

Não implementar uma estrutura que simplesmente acumule imagens indefinidamente em um único documento.

A camada de serviço deverá possuir uma função de validação aproximada do tamanho final dos dados antes do salvamento.

Caso a V1 evolua para grande quantidade de imagens, a arquitetura deverá poder migrar posteriormente para:

```text
Firebase Storage
```

sem necessidade de reconstruir toda a aplicação.

---

# 14. Área pública

## Rota

```text
/
```

Página inicial.

---

# 15. Header público

O header deverá conter:

* logo ClaraMel;
* nome/marca;
* navegação;
* botão de contato.

No celular:

* utilizar menu compacto;
* evitar ocupar muito espaço vertical.

---

# 16. Home

A página inicial deverá possuir:

### Hero

Apresentação da ClaraMel.

Exemplo:

```text
Pegue e Monte ClaraMel

Encontre o tema perfeito para a sua festa.

[ VER NOSSOS TEMAS ]
```

O texto poderá ser alterado posteriormente.

---

# 17. Catálogo

Exibir os temas ativos.

Layout:

Desktop:

```text
┌─────────┐ ┌─────────┐ ┌─────────┐
│ imagem  │ │ imagem  │ │ imagem  │
│         │ │         │ │         │
│ Tema 01 │ │ Tema 02 │ │ Tema 03 │
└─────────┘ └─────────┘ └─────────┘
```

Tablet:

```text
┌─────────┐ ┌─────────┐
│ imagem  │ │ imagem  │
│ Tema 01 │ │ Tema 02 │
└─────────┘ └─────────┘
```

Mobile:

```text
┌───────────────────┐
│      imagem       │
│                   │
│      Tema 01      │
└───────────────────┘

┌───────────────────┐
│      imagem       │
│                   │
│      Tema 02      │
└───────────────────┘
```

---

# 18. Busca

Adicionar campo de pesquisa:

```text
🔎 Buscar tema...
```

A busca deverá considerar pelo menos:

* nome;
* categoria.

A filtragem deverá ocorrer no frontend na V1.

---

# 19. Ordenação

Os temas deverão ser apresentados por:

```text
order ASC
```

Em caso de empate:

```text
createdAt DESC
```

---

# 20. Card do tema

Cada card deverá apresentar:

* imagem de capa;
* nome;
* categoria, caso cadastrada;
* botão/link para detalhes.

Exemplo:

```text
┌───────────────────────┐
│                       │
│        IMAGEM         │
│                       │
├───────────────────────┤
│ Jardim Encantado      │
│ Infantil              │
│                       │
│       Ver tema →      │
└───────────────────────┘
```

---

# 21. Página de detalhes

Rota:

```text
/tema/:slug
```

Exibir:

* nome;
* descrição;
* categoria;
* imagem principal;
* galeria;
* botão de contato;
* botão para voltar.

---

# 22. Galeria

A galeria deverá permitir:

* visualizar imagens;
* trocar imagem principal;
* abrir imagem em tamanho maior;
* navegar entre imagens.

No celular:

* permitir navegação por toque/swipe quando possível;
* utilizar imagens responsivas.

---

# 23. WhatsApp

Adicionar CTA:

```text
QUERO SABER MAIS
```

ou

```text
TENHO INTERESSE
```

Ao clicar, abrir o WhatsApp da ClaraMel.

A mensagem deverá ser gerada automaticamente.

Exemplo:

```text
Olá! Gostaria de saber mais sobre o tema "Jardim Encantado".
```

O número do WhatsApp não deverá ficar espalhado pelo código.

Criar configuração centralizada:

```typescript
const CONTACT_CONFIG = {
  whatsapp: "NUMERO_DA_CLARAMEL"
};
```

---

# 24. Área administrativa

Todas as rotas administrativas deverão utilizar:

```text
/admin
```

---

# 25. Login

Rota:

```text
/admin/login
```

Campos:

```text
E-mail
Senha
```

Botão:

```text
Entrar
```

Implementar:

* Firebase Authentication;
* tratamento de erro;
* loading;
* logout;
* proteção das rotas.

---

# 26. Proteção de rotas

Nenhuma tela administrativa poderá ser acessada sem autenticação.

Se o usuário tentar:

```text
/admin/themes
```

sem estar autenticado:

```text
redirect → /admin/login
```

---

# 27. Dashboard

Rota:

```text
/admin
```

Dashboard simples.

Exibir:

```text
Temas ativos
Temas inativos
Total de temas
```

Exemplo:

```text
┌──────────────┐
│ 24           │
│ TEMAS        │
└──────────────┘

┌──────────────┐
│ 20           │
│ ATIVOS       │
└──────────────┘

┌──────────────┐
│ 4            │
│ INATIVOS     │
└──────────────┘
```

Não exagerar na criação de gráficos na V1.

---

# 28. Gerenciamento de temas

Rota:

```text
/admin/themes
```

Listar:

* imagem;
* nome;
* categoria;
* status;
* ordem;
* ações.

Ações:

```text
Editar
Ativar/Inativar
Excluir
```

Adicionar:

```text
+ Novo tema
```

---

# 29. Cadastro de tema

Rota:

```text
/admin/themes/new
```

Campos:

```text
Nome *
Descrição *
Categoria
Imagens *
Ativo
Ordem
```

---

# 30. Upload

Permitir:

* selecionar imagens;
* visualizar preview;
* remover imagem;
* definir capa;
* ordenar imagens.

A primeira imagem poderá ser automaticamente definida como capa.

O administrador deverá poder alterar a imagem de capa.

---

# 31. Drag and drop

No desktop, permitir:

```text
Arraste as imagens aqui
```

Além do botão:

```text
Selecionar imagens
```

No celular, utilizar o seletor nativo de arquivos/fotos.

---

# 32. Preview

Antes de salvar, mostrar:

```text
┌────────────┐
│            │
│   FOTO     │
│            │
├────────────┤
│ ★ CAPA     │
│ Remover    │
└────────────┘
```

O administrador deverá saber claramente qual imagem será a capa.

---

# 33. Edição

Rota:

```text
/admin/themes/:id/edit
```

Permitir alterar todos os dados do tema.

Ao editar:

* preservar imagens existentes;
* permitir remover imagens;
* adicionar novas;
* alterar capa;
* alterar ordem.

---

# 34. Exclusão

Antes de excluir:

```text
Deseja realmente excluir este tema?

Essa ação não poderá ser desfeita.

[Cancelar] [Excluir]
```

Preferencialmente utilizar exclusão lógica na V1:

```text
active = false
```

Porém, disponibilizar uma opção administrativa de exclusão definitiva somente se houver necessidade.

A implementação inicial deverá priorizar segurança contra exclusão acidental.

---

# 35. Ativar/Inativar

O administrador poderá alternar:

```text
ATIVO
INATIVO
```

Tema inativo:

* aparece no painel administrativo;
* não aparece no catálogo público.

---

# 36. Ordenação

No painel administrativo permitir editar o campo:

```text
Ordem
```

Exemplo:

```text
Tema A → 1
Tema B → 2
Tema C → 3
```

Não é obrigatório implementar drag-and-drop de ordenação na V1.

Um campo numérico é suficiente.

---

# 37. Regras de segurança Firestore

A coleção `themes` deverá:

### Leitura pública

Permitir leitura apenas dos temas ativos.

### Escrita

Somente usuários autenticados poderão:

* criar;
* editar;
* alterar;
* excluir.

O cliente público não poderá escrever no Firestore.

Conceitualmente:

```text
READ:
public → temas ativos

WRITE:
authenticated admin → permitido

anonymous:
write → negado
```

As regras deverão ser implementadas de forma segura.

Não utilizar:

```text
allow read, write: if true;
```

---

# 38. Segurança do Firebase

Nunca colocar:

* senha;
* chave privada;
* credencial administrativa;
* service account

no frontend.

A configuração pública do Firebase poderá estar no frontend, conforme o funcionamento padrão do Firebase, desde que as regras do Firestore estejam corretamente configuradas.

---

# 39. Responsividade

O projeto deverá ser **mobile-first**.

Prioridade:

1. Smartphone
2. Tablet
3. Desktop

Testar pelo menos:

```text
360px
390px
414px
768px
1024px
1280px
1440px
```

---

# 40. Regras de UI

Evitar:

* textos pequenos;
* botões muito próximos;
* cards apertados;
* menus difíceis de tocar;
* tabelas horizontais desnecessárias;
* elementos que dependam de hover para funcionar.

No celular:

* botões devem possuir área de toque adequada;
* imagens devem ocupar boa parte da tela;
* formulários devem utilizar uma coluna;
* cards devem ser adaptados automaticamente.

---

# 41. Identidade visual

Utilizar a identidade visual da ClaraMel.

Criar um arquivo central para tokens:

```text
src/styles/theme.ts
```

ou equivalente.

Centralizar:

* cores;
* fontes;
* espaçamentos;
* bordas;
* sombras;
* tamanhos.

Não espalhar códigos de cores diretamente pelos componentes.

---

# 42. Logo

A logo da ClaraMel deverá ser utilizada:

* header;
* login administrativo;
* footer;
* favicon, se disponível.

Não modificar ou deformar a logo.

Manter proporção original.

---

# 43. Footer

Criar footer simples contendo:

```text
Logo ClaraMel

Pegue e Monte ClaraMel

© ClaraMel
```

Adicionar WhatsApp/Instagram caso as informações oficiais sejam fornecidas.

Não inventar contatos.

---

# 44. Estados da aplicação

Todas as consultas deverão possuir estados:

### Loading

Exemplo:

```text
Carregando temas...
```

### Empty

Exemplo:

```text
Nenhum tema encontrado.
```

### Error

Exemplo:

```text
Não foi possível carregar os temas.

Tente novamente.
```

---

# 45. Tratamento de erros

Não exibir erros técnicos do Firebase diretamente para o usuário.

Errado:

```text
FirebaseError: PERMISSION_DENIED...
```

Correto:

```text
Não foi possível salvar o tema.
Verifique os dados e tente novamente.
```

Os erros técnicos podem ser enviados ao console durante desenvolvimento.

---

# 46. Performance

O site deverá priorizar carregamento rápido.

Implementar:

* lazy loading de imagens;
* carregamento sob demanda quando possível;
* imagens comprimidas;
* evitar bibliotecas desnecessárias;
* componentes reutilizáveis.

A Home não deverá carregar imagens de todos os temas em tamanho original.

---

# 47. SEO básico

Implementar:

* title;
* meta description;
* favicon;
* Open Graph básico;
* URLs amigáveis.

Para página de tema:

```text
<title>Jardim Encantado | Pegue e Monte ClaraMel</title>
```

---

# 48. URLs

Estrutura sugerida:

```text
/
 /temas
 /tema/:slug

 /admin
 /admin/login
 /admin/themes
 /admin/themes/new
 /admin/themes/:id/edit
```

---

# 49. Configurações

Criar arquivo de configuração para dados que poderão mudar.

Exemplo:

```typescript
export const APP_CONFIG = {
  name: "Pegue e Monte ClaraMel",
  whatsapp: "",
  instagram: "",
  description: ""
};
```

Não espalhar essas informações pelos componentes.

---

# 50. Variáveis de ambiente

Utilizar `.env`.

Exemplo:

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_WHATSAPP_NUMBER=
```

Criar:

```text
.env.example
```

sem informações reais.

---

# 51. Git

Criar `.gitignore` adequado.

Nunca versionar:

```text
.env
.env.local
```

Versionar:

```text
.env.example
```

---

# 52. Seed inicial

Criar possibilidade de cadastrar manualmente os primeiros temas através do painel.

Não criar dados falsos no ambiente de produção.

Durante desenvolvimento, poderá existir uma pequena massa de dados de teste.

---

# 53. Acessibilidade

Implementar:

* `alt` nas imagens;
* labels nos inputs;
* contraste adequado;
* navegação por teclado;
* botões semanticamente corretos;
* foco visível.

---

# 54. Arquitetura preparada para evolução

Embora a V1 seja simples, não criar código que dificulte futuras funcionalidades.

A estrutura deverá permitir posteriormente:

```text
Clientes
Itens
Locações
Agenda
Orçamentos
Pedidos
Pagamentos
Contratos
```

Não implementar essas funcionalidades agora.

Apenas manter arquitetura organizada para futura expansão.

---

# 55. Possível evolução das imagens

A V1 utilizará Base64 no Firestore.

Porém, criar uma camada:

```text
ImageService
```

com métodos como:

```typescript
compressImage()
validateImage()
convertToBase64()
```

Assim, futuramente poderemos substituir:

```text
Base64 → Firestore
```

por:

```text
Imagem → Firebase Storage
```

sem alterar toda a aplicação.

---

# 56. Critérios de aceite — Área pública

A funcionalidade será considerada concluída quando:

* [ ] O cliente conseguir acessar o site sem login.
* [ ] O site funcionar corretamente em smartphone.
* [ ] O cliente visualizar os temas ativos.
* [ ] Temas inativos não aparecerem publicamente.
* [ ] O cliente conseguir pesquisar temas.
* [ ] O cliente conseguir abrir um tema.
* [ ] O cliente conseguir visualizar a galeria.
* [ ] O cliente conseguir entrar em contato via WhatsApp.
* [ ] O layout funcionar em desktop.
* [ ] O carregamento possuir estados de loading/erro/empty.

---

# 57. Critérios de aceite — Administração

* [ ] Administrador consegue realizar login.
* [ ] Usuário não autenticado não consegue acessar `/admin`.
* [ ] Administrador consegue criar tema.
* [ ] Administrador consegue editar tema.
* [ ] Administrador consegue ativar/inativar tema.
* [ ] Administrador consegue excluir/desativar tema.
* [ ] Administrador consegue adicionar imagens.
* [ ] Administrador consegue remover imagens.
* [ ] Administrador consegue definir capa.
* [ ] Administrador consegue definir ordem.
* [ ] Administrador consegue visualizar todos os temas.
* [ ] Erros são tratados adequadamente.

---

# 58. Critérios de aceite — Firebase

* [ ] Authentication configurado.
* [ ] Firestore configurado.
* [ ] Regras de segurança configuradas.
* [ ] Usuário público não consegue gravar dados.
* [ ] Usuário não autenticado não consegue alterar temas.
* [ ] Imagens respeitam limite definido.
* [ ] Aplicação não cria documentos maiores que o limite do Firestore.

---

# 59. Critérios de aceite — Deploy

A aplicação deverá funcionar na Vercel.

Checklist:

* [ ] Build executando sem erros.
* [ ] Variáveis de ambiente configuradas.
* [ ] Firebase conectado.
* [ ] Rotas SPA funcionando corretamente.
* [ ] HTTPS funcionando.
* [ ] Site acessível pelo domínio da ClaraMel.
* [ ] Firebase funcionando em produção.
* [ ] Login administrativo funcionando em produção.
* [ ] Catálogo funcionando em produção.

---

# 60. Fases de desenvolvimento

## Fase 1 — Inicialização

* [ ] Criar projeto React + Vite + TypeScript.
* [ ] Configurar estrutura.
* [ ] Configurar Git.
* [ ] Configurar Firebase.
* [ ] Configurar variáveis de ambiente.

## Fase 2 — Identidade visual

* [ ] Inserir logo ClaraMel.
* [ ] Inserir paleta.
* [ ] Criar tokens de design.
* [ ] Configurar tipografia.
* [ ] Criar componentes base.

## Fase 3 — Firebase

* [ ] Firebase Authentication.
* [ ] Firestore.
* [ ] Regras de segurança.
* [ ] Serviços de acesso aos temas.

## Fase 4 — Administração

* [ ] Login.
* [ ] Dashboard.
* [ ] Listagem.
* [ ] Cadastro.
* [ ] Edição.
* [ ] Ativação/inativação.
* [ ] Exclusão.
* [ ] Upload/compressão.
* [ ] Galeria.
* [ ] Capa.

## Fase 5 — Catálogo público

* [ ] Home.
* [ ] Catálogo.
* [ ] Busca.
* [ ] Cards.
* [ ] Página de detalhes.
* [ ] Galeria.
* [ ] WhatsApp.

## Fase 6 — Responsividade

* [ ] Smartphone.
* [ ] Tablet.
* [ ] Desktop.
* [ ] Testes de navegação.

## Fase 7 — Qualidade

* [ ] Tratamento de erros.
* [ ] Loading.
* [ ] Empty states.
* [ ] SEO.
* [ ] Performance.
* [ ] Acessibilidade.

## Fase 8 — Deploy

* [ ] Build.
* [ ] Vercel.
* [ ] Variáveis de ambiente.
* [ ] Firebase produção.
* [ ] Testes finais.

---

# 61. Fora do escopo da V1

Não implementar neste momento:

* cadastro de clientes;
* cadastro de itens;
* controle de estoque;
* disponibilidade de itens;
* agenda;
* reserva;
* orçamento;
* pagamento;
* contrato;
* financeiro;
* integração com ERP;
* notificações;
* painel financeiro;
* aplicativo mobile nativo.

Esses recursos poderão fazer parte das próximas versões.

---

# 62. Diretriz para o Cursor

O Cursor deverá seguir este PRD como fonte principal de requisitos.

Antes de implementar uma funcionalidade:

1. verificar a estrutura existente;
2. reutilizar componentes;
3. evitar duplicação;
4. respeitar TypeScript;
5. manter separação entre público e administração;
6. manter Firebase isolado em serviços;
7. não colocar regras de negócio diretamente nos componentes;
8. não criar credenciais no código;
9. não instalar dependências desnecessárias;
10. não alterar requisitos definidos neste documento sem sinalizar.

Quando houver dúvida entre duas implementações, priorizar:

```text
simplicidade
↓
manutenibilidade
↓
performance
↓
escalabilidade
```

Não transformar a V1 em um sistema excessivamente complexo.

---

# 63. Regra importante sobre requisitos

O Cursor não deverá assumir novas funcionalidades.

Se uma funcionalidade não estiver especificada neste PRD, deverá:

* utilizar a solução mais simples compatível com o objetivo;
* ou sinalizar a necessidade antes de implementar uma mudança estrutural.

Não implementar funcionalidades futuras apenas por "precaução".

---

# 64. Resultado esperado

Ao final da V1 teremos:

```text
              PEGUE E MONTE CLARAMEL
                       │
          ┌────────────┴────────────┐
          │                         │
       CLIENTE                  ADMINISTRADOR
          │                         │
          ▼                         ▼
       Catálogo                    Login
          │                         │
          ▼                         ▼
        Temas                    Dashboard
          │                         │
          ▼                         ▼
       Galeria                 Gerenciar temas
          │                         │
          ▼                         ▼
       Detalhes              Imagens / Capa
          │
          ▼
       WhatsApp
```

O produto deverá ser **simples, bonito, rápido, responsivo e fácil de administrar**, funcionando como o primeiro módulo digital do Pegue e Monte ClaraMel e permitindo evolução futura para um sistema completo de gestão.
