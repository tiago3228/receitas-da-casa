# Roteiro — Saborê

## Concluído no código

- [x] Catálogo validado e padronizado: 536 registros, 10 categorias permitidas, aliases legados e ids únicos.
- [x] Adicionadas seis receitas ausentes — moqueca baiana, baião de dois, cuscuz paulista, bolo de fubá cremoso, barreado e quentão — com fontes linkadas e textos reescritos em formato conciso.
- [x] Criadas imagens ilustrativas próprias para as seis receitas; cada uma é identificada como gerada por IA, sem reutilizar fotos de terceiros sem licença confirmada.
- [x] Corrigidas nove classificações, incluindo Paella vegetariana, bebidas, pães e acompanhamentos.
- [x] Consolidadas quatro cópias confirmadas, preservando os ids antigos como aliases para links e favoritos existentes.
- [x] Busca normalizada por acentos/maiúsculas, filtros e estados vazios/erro.
- [x] Imagens com carregamento consistente e fallback acessível; as seis ilustrações geradas são diferenciadas de fotografias de origem externa.
- [x] Favoritos e lista de compras por usuário; favoritos usam atualização otimista com rollback, e as operações privadas são filtradas pelo id do usuário.
- [x] Leitura em voz do título, ingredientes e preparo, com velocidade, volume, pausa/retomada e interrupção quando suportados.
- [x] Preparo por etapas; temporizador apenas para duração explícita, com iniciar, pausar, retomar e reiniciar.
- [x] Ajuste de porções somente quando o rendimento é inteiro e explícito; conversões incertas, faixas e quantidades qualitativas permanecem sem alteração. O texto original não é modificado.
- [x] Receitas pessoais com criação, listagem, edição e remoção com confirmação, validação, autenticação server-side e escopo do proprietário.
- [x] `.env` remoto conferido sem revelar valores: contém somente URL, id do projeto e chave publishable públicos do Supabase, duplicados em nomes server/Vite; mantido versionado por decisão confirmada do proprietário. `.env.example` usa placeholders.
- [x] README atualizado com configuração, SQL e comandos de desenvolvimento.

## Pendências de validação externa/manual

- [ ] Revisar e aplicar `supabase/migrations/20261019000000_favoritos_lista_compras.sql` no SQL Editor do projeto Lovable/Supabase.
- [ ] Confirmar no projeto remoto que RLS está habilitado nas tabelas e testar leitura/escrita com duas contas distintas; esta sessão não acessou o banco remoto.
- [ ] Fazer smoke test autenticado no deploy conectado, especialmente cadastro/recuperação de senha, IA gateway, favoritos, lista de compras e edição de receita.
- [ ] Testar leitura em voz e temporizador nos navegadores/dispositivos alvo; suporte depende do navegador e das vozes instaladas.
- [ ] Avaliar imagens para as receitas restantes sem imagem somente quando houver fonte e correspondência comprováveis.

## Comandos recomendados

```sh
pnpm test
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```
