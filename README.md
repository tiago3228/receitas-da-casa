# Saborê

Aplicativo de receitas em React, TypeScript, TanStack Start e Supabase. O repositório contém um catálogo público validado em `public/receitas.json` e recursos privados vinculados à conta autenticada.

## Desenvolvimento local

Requisitos: Node.js e pnpm.

```sh
git clone https://github.com/tiago3228/receitas-da-casa.git
cd receitas-da-casa
pnpm install
cp .env.example .env
pnpm dev
```

Preencha `.env` com os valores do projeto Supabase conectado. O navegador usa apenas URL e chave **publishable**. Nunca adicione `service_role`, `sb_secret_*`, senha de banco ou outro segredo a `.env`. O `.env` fica versionado de propósito: a publicação precisa das variáveis `VITE_*` dele; sem elas o app abre em branco com "Missing Supabase environment variable(s)".

## Banco de dados e SQL

As tabelas de receitas pessoais e perfis estão descritas em `drizzle/migrations/0000_create_profiles_and_receitas_autorais.sql`. Favoritos e lista de compras usam a migration `supabase/migrations/20261019000000_favoritos_lista_compras.sql`, que pode ser revisada e aplicada no SQL Editor do Lovable/Supabase. A migration cria tabelas, índices, grants e políticas RLS limitadas ao usuário autenticado. A aplicação não executa essa alteração automaticamente; valide-a no projeto Supabase antes de usar os recursos persistidos.

## Recursos

- Catálogo de receitas com busca por nome e texto, filtros de categorias, paginação e tela de detalhe.
- Favoritos e lista de compras persistidos por usuário no Supabase.
- Ingredientes interativos para marcar o que já existe em casa.
- Leitura em voz alta em português brasileiro, com pausa/retomada, interrupção e controles de velocidade e volume nos navegadores compatíveis.
- Preparo por etapas e temporizador para durações explícitas do texto.
- Ajuste derivado de porções quando o rendimento e as quantidades forem inequívocos; o texto original permanece intacto.
- Receitas pessoais com criação, edição e exclusão confirmada.
- Imagens com fallback acessível quando ausentes ou indisponíveis.

As rotas privadas exigem autenticação. Se o usuário não estiver conectado, os controles de favoritos/lista encaminham para login. O detalhe público de uma receita abre em `/receitas/$id`; a edição de receita pessoal é iniciada pela ação “Editar” em “Minhas receitas”.

## Catálogo

O catálogo atual contém 530 receitas. A validação de `src/lib/catalogo.ts` confere campos, categorias, ids, aliases e URLs de imagem. Receitas sem imagem permanecem sem associação inventada e usam o componente `ImagemReceita` como fallback.

## Verificações

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

`pnpm lint` aplica ESLint ao repositório inteiro, inclusive arquivos gerados e preexistentes. Consulte o relatório de auditoria para o resultado e limitações do lint global na entrega atual.
