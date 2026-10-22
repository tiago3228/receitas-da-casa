# Auditoria técnica do Saborê

**Escopo:** auditoria e evolução do repositório `tiago3228/receitas-da-casa`, preservando a arquitetura TanStack Start/React/Supabase. A validação do banco remoto e do deploy Lovable não foi simulada. A extensão posterior do catálogo, de 530 para 536 receitas, está registrada ao final.

## A. Problemas encontrados

| Gravidade                          | Área                   | Problema e consequência                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Observação de configuração pública | Configuração Git       | `.env` aparece no histórico do repositório público. A inspeção desta versão confirmou seis variáveis contendo somente URL, id do projeto e chave publishable do Supabase, em pares iguais server/Vite; não foram encontrados segredos ou credenciais privilegiadas. O proprietário confirmou manter esse arquivo para publicação Lovable. |
| Alta, depende do ambiente remoto   | Supabase/RLS           | As migrations versionadas definem isolamento por `auth.uid()`, mas não houve conexão ao banco remoto nesta sessão. Não é possível afirmar que as migrations foram aplicadas ou que as políticas estão ativas no projeto do Lovable.                                                                                                       |
| Média                              | Catálogo               | Havia nove classificações culinárias incompatíveis com o conteúdo e quatro registros confirmados como cópias consolidadas com sufixos/variações de ids. Paella vegetariana, por exemplo, estava em doces.                                                                                                                                 |
| Média                              | Busca                  | A busca tratava várias palavras como uma única frase contígua; termos presentes em partes diferentes do título/texto podiam não encontrar a receita.                                                                                                                                                                                      |
| Média                              | Receitas pessoais      | Existiam operações para criar, listar e remover, mas faltava editar uma receita própria. O delete já pedia confirmação; foram reforçados os bloqueios a clique repetido.                                                                                                                                                                  |
| Média                              | Acessibilidade/preparo | O leitor lia apenas o preparo, não título e ingredientes. O temporizador não tinha pausa/retomada/reinício. O catálogo não oferecia ajuste de porções conservador.                                                                                                                                                                        |
| Baixa                              | Imagens                | 397 das 530 receitas permanecem sem imagem. Associar imagens sem evidência poderia vincular uma foto à receita errada.                                                                                                                                                                                                                    |
| Baixa                              | Qualidade global       | `pnpm lint` do repositório inteiro encontra problemas preexistentes em arquivos não alterados e gerados; por isso o resultado global é diferente do lint direcionado aos arquivos desta entrega.                                                                                                                                          |

## B. Correções realizadas

- **Ambiente e segurança:** um commit anterior retirou `.env` do índice; posteriormente, commits remotos do Lovable o reintroduziram. Após confirmação do proprietário, os seis nomes/valores foram comparados localmente sem revelar valores: são apenas o identificador, URL HTTPS e chave publishable públicos, duplicados em variantes server/Vite. O arquivo é mantido versionado para a publicação conectada. `.env.example` contém placeholders. Não incluir chaves administrativas, senhas ou segredos.
- **Catálogo e busca:** `src/lib/catalogo.ts` centraliza o schema, as categorias permitidas, a busca normalizada por todos os termos, o filtro de categoria e a resolução de aliases. `src/lib/receitas.ts` e as rotas usam esses helpers. Foram adicionados testes de integridade, aliases, URLs de imagem e busca.
- **Receitas pessoais:** `src/lib/validacao-receitas.ts` valida criação/edição/remoção. `src/lib/receitas-autorais.functions.ts` adiciona atualização server-side com sessão validada, filtro por `user_id`, RLS e atualização de timestamp. `src/routes/_authenticated/nova-receita.tsx` reutiliza o formulário existente para criar ou editar; `minhas-receitas.tsx` oferece edição e mantém confirmação ao excluir.
- **IA:** schemas estritos e tratamento de saída/erros ficam em `src/lib/validacao-ia.ts`; limites de requisição ficam em `src/lib/limite-requisicoes.ts`; as funções validam a entrada, preservam o texto original e evitam expor detalhes internos.
- **Imagens e acessibilidade:** `src/components/ImagemReceita.tsx` mantém proporção e fallback com rótulo acessível. Botões, estados vazios, erros, instruções e controles de teclado foram revisados nas rotas modificadas.
- **Documentação:** README e roadmap foram substituídos por instruções compatíveis com o projeto real e com as pendências externas.

## C. Funcionalidades implementadas

- **Favoritos:** alternar, consultar e remover favoritos em páginas autenticadas, com estado otimista/rollback, ids estáveis e aliases legados. Persistência depende da migration Supabase correspondente estar aplicada.
- **Lista de compras:** adicionar itens manualmente ou a partir da receita, marcar o que já está em casa, evitar duplicatas no fluxo da aplicação, remover itens e manter operações limitadas ao usuário autenticado.
- **Leitura em voz:** título, ingredientes e modo de preparo, com tentativa de voz `pt-BR`, controles de velocidade/volume, pausa/retomada e interrupção quando suportadas pelo navegador.
- **Preparo passo a passo:** avanço/retorno, progresso e marcação de etapas concluídas; o texto completo permanece consultável.
- **Temporizador:** disponibilizado somente quando há duração explícita no texto; permite iniciar, pausar, retomar e reiniciar, e avisa que o navegador pode suspender a contagem em segundo plano.
- **Ajuste de porções:** mostra o rendimento original e escala apenas quantidades numéricas inequívocas para um rendimento inteiro. Faixas, itens “a gosto” e valores não convertíveis permanecem intactos; aproximações são indicadas. O texto armazenado não é alterado e a lista de compras preserva as quantidades originais.
- **Receitas pessoais:** criar, visualizar, editar e excluir com confirmação, validação de campos e operações autorizadas pelo servidor.
- **Recomendações:** receitas ordenadas pela cobertura dos ingredientes marcados como disponíveis na lista; filtros combináveis para categorias do catálogo, vegetariana, sobremesa e tempo máximo (30 min, 1 h, 1 h 30 min ou 2 h). A normalização ignora acentos, medidas e preparo; a classificação vegetariana é heurística e filtros de tempo excluem durações sem teto verificável. O cálculo é derivado no cliente e não exige alteração de esquema ou escrita no banco.

## D. Catálogo de receitas

- **Quantidade inicial:** 534 registros.
- **Quantidade após consolidação inicial:** 530 registros.
- **Categorias corrigidas (9):** Arroz Crocante (Carnes → Arroz/feijão/acompanhamentos); Batida de café, Detox suco rosa e Sucos pós ressaca (categorias diversas → Bebidas); Macarrão ao camarão com laranja, Pão de alho, Pão de queijo e Panetone tradicional (Doces ou Arroz → Pães/massas/panificação); Paella vegetariana (Doces → Arroz/feijão/acompanhamentos).
- **Cópias consolidadas (4):** Berinjela à parmegiana II → Berinjela à parmegiana; Bolo de cenoura com ganache meio amargo II → versão sem sufixo; Mousse royal de chocolate → Musse royal de chocolate; Pudim de pão da vó Luiza → Pudim de pão da vó Luisa. Os ids removidos foram mantidos como aliases dos registros canônicos.
- **Títulos parecidos remanescentes:** cinco grupos de mesmo título normalizado foram mantidos; não foram removidos automaticamente porque as entradas não foram consideradas cópias seguras.
- **Imagens após consolidação inicial:** 133 receitas tinham imagem; 397 não tinham. O fallback é aplicado quando a imagem está ausente ou falha.
- **Validações iniciais:** o schema Zod verificou os 530 registros, ids, categorias, campos exigidos, aliases e esquema de imagem. Nenhum registro ficou sem nome ou texto. Também foram executados testes de busca multi-termo sem acentos, filtros e estado sem resultados.

## E. Segurança

- O repositório é público. A inspeção histórica local encontrou versões com nomes `SUPABASE_PROJECT_ID`, `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` (variantes Vite e server), sem identificar padrões de chave service-role, token privado, chave de API ou senha de banco nos padrões verificados. O `.env` atual foi validado, sem imprimir valores: contém apenas os seis campos públicos previstos, em pares iguais; URL HTTPS corresponde ao projeto e chave está no formato publishable público. O arquivo permanece versionado por decisão confirmada do proprietário. O histórico remoto não foi reescrito.
- `src/integrations/supabase/client.ts` usa somente URL e chave publishable; `src/integrations/supabase/auth-middleware.ts` valida o token com `auth.getClaims` antes de criar contexto de servidor.
- A migration base de perfis/receitas e a migration de favoritos/compras foram auditadas no código. As policies verificam `auth.uid() = user_id` para operações permitidas. As funções de receitas próprias também adicionam filtro pelo id autenticado.
- `src/test/rls-contract.test.ts` verifica estaticamente que os contratos de RLS e sessão não sejam removidos. Isso não equivale a um teste de autorização executado no banco remoto.
- **Pendente:** aplicar/revisar a migration de favoritos/compras no SQL Editor do Lovable e testar com pelo menos duas contas para confirmar o isolamento efetivo no Supabase conectado.

## F. Testes e verificações

| Comando                                                                             | Resultado observado                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                                                         | Passou: 12 arquivos de teste, 56 testes, incluindo casos extremos de matching, filtros e parsing de tempo.                                                                                                                                                                        |
| `pnpm exec tsc --noEmit`                                                            | Passou sem erros.                                                                                                                                                                                                                                                                 |
| ESLint direcionado aos arquivos TypeScript alterados                                | Passou nos cinco arquivos TypeScript novos/alterados desta etapa.                                                                                                                                                                                                                 |
| `pnpm run build`                                                                    | Build de produção concluído; a árvore de rotas foi regenerada sem a rota temporária de teste.                                                                                                                                                                                     |
| Verificação no navegador                                                           | Passaram a exibição das recomendações, filtros combinados de categoria/tempo e a navegação de um cartão ao detalhe, com dados isolados e sem escrita no banco compartilhado.                                                                                                       |
| `git diff --check`                                                                  | Passou sem whitespace inválido.                                                                                                                                                                                                                                                   |
| `pnpm lint`                                                                         | **Falhou no lint global:** 293 problemas (287 erros e 6 avisos) em módulos preexistentes/gerados e arquivos não alterados, incluindo regras Prettier em código legado e avisos de Fast Refresh em componentes UI. Nenhum dos arquivos alterados desta etapa foi apontado; todos passaram no lint direcionado. |

Os testes exibem avisos de depreciação Node (`punycode`) durante a execução; eles não causaram falha.

## G. Pendências

1. Revisar e executar `supabase/migrations/20261019000000_favoritos_lista_compras.sql` no SQL Editor do Lovable/Supabase.
2. Verificar policies e RLS no banco remoto e testar operações com duas contas diferentes. Sem acesso remoto, não foi possível confirmar a aplicação da migration.
3. Fazer smoke test autenticado no deploy conectado: cadastro/login, recuperação de senha, gateway de IA, favoritos, lista de compras e edição/exclusão de receitas.
4. Testar voz, controles de volume/velocidade e temporizadores nos navegadores/dispositivos alvo; a disponibilidade de vozes depende do sistema.
5. Avaliar imagens para as receitas restantes somente quando for possível provar que cada foto corresponde à receita e respeita direitos/licenças.
6. O lint global continua com problemas legados; a correção integral exigiria alterações fora do escopo desta entrega e reformataria arquivos gerados/UI não relacionados.

## H. Próximos passos necessários

- Validar e aplicar o SQL no projeto Lovable/Supabase.
- Depois da aplicação, confirmar a persistência usando duas contas distintas e realizar smoke test no app publicado.
- Tratar separadamente os problemas preexistentes de `pnpm lint` global, se o objetivo for exigir lint limpo para todo o repositório.

## Atualização — seis novas receitas

O catálogo foi ampliado para **536 receitas** com moqueca baiana, baião de dois, cuscuz paulista, bolo de fubá cremoso, barreado e quentão. As entradas têm campos de origem (`fonte`) e textos reescritos com quantidades e rendimentos conferidos nas fontes. As fontes e imagens de cada item estão relacionadas em [receitas-adicionadas.md](receitas-adicionadas.md), e a página de detalhe oferece o link à publicação original.

Cada item usa uma imagem ilustrativa original gerada por IA, em JPEG local. A interface identifica essas imagens como ilustrativas. Nenhuma foto de terceiros sem licença de reutilização verificada foi incluída. Para adicionar fotos reais, será necessária licença compatível e atribuição confirmada.
