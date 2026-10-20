# TODO — Saborê

## Recomendações de receitas a partir da lista de compras

- [x] Na página autenticada da lista de compras, recomendar receitas com base somente nos ingredientes marcados como “Já tenho”/“já comprei”. Comparar contra os ingredientes do catálogo ignorando diferenças de acento, maiúsculas, quantidade, unidade de medida e formas de preparo; não tratar itens ainda desmarcados como disponíveis. Ordenar primeiro pelas receitas que aproveitam maior proporção dos ingredientes conhecidos e, em empate, pelo número de ingredientes disponíveis. Exibir a contagem/proporção usada em cada recomendação, limitar a lista para manter a página concisa, incluir acesso ao detalhe da receita e dar estados claros para lista sem ingredientes marcados, catálogo carregando/indisponível e nenhum resultado. As recomendações são derivadas dos dados já existentes no navegador; não alterar a lista, a autenticação, a persistência nem o esquema do banco. Implementado e validado em código.
