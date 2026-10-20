# Saborê

Aplicativo de receitas em React, TypeScript, TanStack Start e Supabase. O repositório contém um catálogo público validado em `public/receitas.json` e recursos privados vinculados à conta autenticada.

## Desenvolvimento local

Requisitos: Node.js e pnpm.

```sh
git clone https://github.com/tiago3228/receitas-da-casa.git
cd receitas-da-casa
pnpm install
pnpm dev
```

O `.env` já é versionado com URL, id do projeto e chave **publishable** do Supabase, todos valores públicos e sem privilégios administrativos. O arquivo `.env.example` contém placeholders para referência; não o copie sobre o `.env` conectado. Nunca adicione `service_role`, `sb_secret_*`, senha de banco ou outro segredo ao `.env` nem a variáveis `VITE_*`. Para usar outro projeto Supabase, substitua os valores localmente com os correspondentes públicos e configure as variáveis de publicação no projeto Lovable.

## Banco de dados e SQL

As tabelas de receitas pessoais e perfis estão descritas em `drizzle/migrations/0000_create_profiles_and_receitas_autorais.sql`. Favoritos e lista de compras usam a migration `supabase/migrations/20261019000000_favoritos_lista_compras.sql`, que pode ser revisada e aplicada no SQL Editor do Lovable/Supabase. A migration cria tabelas, índices, grants e políticas RLS limitadas ao usuário autenticado. A aplicação não executa essa alteração automaticamente; valide-a no projeto Supabase antes de usar os recursos persistidos.

## Recursos

- Catálogo de receitas com busca por nome e texto, filtros de categorias, paginação e tela de detalhe.
- Favoritos e lista de compras persistidos por usuário no Supabase.
- Ingredientes interativos para marcar o que já existe em casa.
- Recomendações de receitas ordenadas pelos ingredientes disponíveis já marcados, com indicação de cobertura e ligação direta para o detalhe.
- Leitura em voz alta em português brasileiro, com pausa/retomada, interrupção e controles de velocidade e volume nos navegadores compatíveis.
- Preparo por etapas e temporizador para durações explícitas do texto.
- Ajuste derivado de porções quando o rendimento e as quantidades forem inequívocos; o texto original permanece intacto.
- Receitas pessoais com criação, edição e exclusão confirmada.
- Imagens com fallback acessível quando ausentes ou indisponíveis.
- Seis receitas regionais novas com origem editorial indicada e imagens ilustrativas próprias geradas por IA.

As rotas privadas exigem autenticação. Se o usuário não estiver conectado, os controles de favoritos/lista encaminham para login. O detalhe público de uma receita abre em `/receitas/$id`; a edição de receita pessoal é iniciada pela ação “Editar” em “Minhas receitas”.

## Catálogo

O catálogo atual contém 536 receitas. A validação de `src/lib/catalogo.ts` confere campos, categorias, ids, aliases, fontes e URLs de imagem. As imagens geradas para as seis receitas novas são identificadas como ilustrativas na listagem e no detalhe; a página de cada receita também apresenta um link para a fonte culinária. As demais receitas sem imagem usam o componente `ImagemReceita` como fallback.

## Verificações

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

`pnpm lint` aplica ESLint ao repositório inteiro, inclusive arquivos gerados e preexistentes. Consulte o relatório de auditoria para o resultado e limitações do lint global na entrega atual.
