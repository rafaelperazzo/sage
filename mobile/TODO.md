# TODO — SAGE Mobile

## Pendente

## Concluído

- [x] **SAGE Auditório — Exibir todas as reservas do dia ao clicar no calendário**
  - Clicar em qualquer dia abre um bottom sheet (Modal) com todas as reservas daquele dia
  - Qualquer usuário (admin ou não) pode visualizar as reservas do dia clicado
  - Admin pode tocar em uma reserva no modal para editar; não-admin para visualizar
  - Criação de nova reserva acessível somente pelo botão "+" (FAB, admin)

- [x] **Filtro por período letivo nos módulos Map e Agenda**
  - Incluir caixa de seleção (Picker) com os valores distintos da coluna `periodo` da tabela `alocacao_2026.1`
  - O filtro deve estar visível nas telas **SAGE Map** e **SAGE Agenda**
  - Ao selecionar um período, os dados exibidos na grade semanal devem ser filtrados pelo período escolhido. O valor padrão do picker deve ser o atual período letivo, que pode ser obtido pelo ano atual e pelo mês atual. Caso o mês atual esteja no intervalor de 1 a 7, o semestre é 1 e caso esteja no intervalo de 8 a 12, o semestre é 2. Exemplo: se o mês atual for 7, o semestre é 1 e o ano é o atual, ou seja, 2026.1.

- [x] **Expo Updates (OTA)**
  - Instalado `expo-updates` e configurado `runtimeVersion`, `updates.url` no `app.json`
  - Adicionado `channel` nos perfis `preview` e `production` do `eas.json`
  - Para publicar atualização OTA: `eas update --branch production --message "descrição"`
  - Requer novo build nativo na Play Store para ativar (binário sem expo-updates não recebe OTA)
