# TODO — SAGE Mobile

## Pendente

- [x] **Filtro por período letivo nos módulos Map e Agenda**
  - Incluir caixa de seleção (Picker) com os valores distintos da coluna `periodo` da tabela `alocacao_2026.1`
  - O filtro deve estar visível nas telas **SAGE Map** e **SAGE Agenda**
  - Ao selecionar um período, os dados exibidos na grade semanal devem ser filtrados pelo período escolhido. O valor padrão do picker deve ser o atual período letivo, que pode ser obtido pelo ano atual e pelo mês atual. Caso o mês atual esteja no intervalor de 1 a 7, o semestre é 1 e caso esteja no intervalo de 8 a 12, o semestre é 2. Exemplo: se o mês atual for 7, o semestre é 1 e o ano é o atual, ou seja, 2026.1.
