# TODO — Saborê

## Recomendações de receitas a partir da lista de compras

- [x] Na página autenticada da lista de compras, recomendar receitas com base somente nos ingredientes marcados como “Já tenho”/“já comprei”. Comparar contra os ingredientes do catálogo ignorando diferenças de acento, maiúsculas, quantidade, unidade de medida e formas de preparo; não tratar itens ainda desmarcados como disponíveis. Ordenar primeiro pelas receitas que aproveitam maior proporção dos ingredientes conhecidos e, em empate, pelo número de ingredientes disponíveis. Exibir a contagem/proporção usada em cada recomendação, limitar a lista para manter a página concisa, incluir acesso ao detalhe da receita e dar estados claros para lista sem ingredientes marcados, catálogo carregando/indisponível e nenhum resultado. As recomendações são derivadas dos dados já existentes no navegador; não alterar a lista, a autenticação, a persistência nem o esquema do banco. Implementado e validado em código.

## Filtros e validação das recomendações

- [x] Adicionar filtros combináveis de tempo de preparo e tipo/categoria, incluindo vegetariana, sobremesa e as categorias do catálogo; receitas sem tempo verificável não devem aparecer como se estivessem dentro de um limite selecionado. Implementado; o limite de tempo só admite receitas com teto explícito.
- [x] Ampliar testes automatizados do matching para casos extremos de quantidades/frações, ingredientes compostos ou repetidos, entradas vazias/inválidas, falsos positivos por prefixo e valores de limite; cobrir também classificação vegetariana, categoria e parsing de tempos/ranges. Cobertura adicionada à suíte automatizada.
- [x] Verificar no navegador a interface de recomendações e a interação real dos filtros, usando dados de teste isolados sem gravar ou apagar registros no banco compartilhado. Testada a seleção de vegetariana, sobremesa e até 30 min; a navegação para uma receita recomendada também foi confirmada usando uma rota temporária removida após a validação.
