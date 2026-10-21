# Alterações — 19/10/2026

Prompts enviados nesta sessão de trabalho no SAGE, na ordem em que foram feitos.

## 1. Saudação

> boa tarde

## 2. Botão "Nova Alocação" no SAGE Map e no SAGE Rural

> Vamos trabalhar hoje no SAGE Map e Sage Rural: Em ambas as telas, gostaria da funcionalidade para adicionar uma nova alocação, sem a necessidade de escolher previamente uma sala e um slot livre. Seria um botão "Nova Alocação", que abriria o modal já existente de adicionar nova alocação. Qualquer dúvida me pergunte.

## 3. Prédio e Sala separados no modal de nova alocação do Rural

> Separe em Prédio e Sala, como na tela.

## 4. Inclusão de salas sem alocação no prédio DEFIS

> Agora, no Sage Rural, eu preciso incluir algumas salas no prédio DEFIS, salas que não possuem nenhuma alocação. Qual seria  a melhor forma de fazer essa inclusão ? Seriam as salas 02, 03, 05 e 07.

## 5. Confirmação da tabela de salas e botão "Cadastrar Sala"

> 1. Sim.
> 2. Prefiro um botão "Cadastrar Sala" para o admin no SAGE Rural.

## 6. Edição e remoção das salas cadastradas

> Adicione as opções de remoção e edição das novas salas.

## 7. Correção do erro nos testes

> tente corrigir este erro: The "event" argument must be an instance of Event

## 8. Mensagem de commit

> sugestão de mensagem de commit.

## 9. Sugerir sempre mensagem de commit

> guarde na memória para sempre sugerir uma mensagem de commit ao final de uma tarefa.

## 10. Infraestrutura das salas externas (SAGE Rural)

> Implementar tela de inclusão de dados iniciais de infraestrutura das salas externas (Sage Rural), na tabela infra_salas. Se tiver dúvidas, me pergunte.

Respostas às perguntas feitas durante a tarefa:

- Formato da tela: **Só o modal por sala**
- Salas com campos em branco: **Gravar com zero** (não se aplicou, pois a tabela por prédio não foi escolhida)

## 11. Padrão do nome no cadastro de nova sala

> Agora vamos fazer um pequeno ajuste no modal para cadastro de uma nova sala: O app deve verificar se o nome da sala segue o padrão: SALA XX, ou LAB XX. Caso o padrão não seja seguido, não fazer o cadastro e informar ao usuário como ele deve nomear a sala. O nome da sala deve ser sempre em uppercase.

## 12. Registro dos prompts

> Agora salve um arquivo com o nome alteracoes-19-10-2026.md, com os prompts que eu solicitei nesta seção.

---

## Prompt para o SAGE Mobile

Prompt para pedir as mesmas funcionalidades na versão mobile do SAGE (copiar o bloco abaixo inteiro):

```text
Vamos trabalhar no SAGE Rural deste app (versão mobile do SAGE). Quero trazer para cá funcionalidades que já foram implementadas na versão web. O banco Supabase é o mesmo da versão web: as tabelas citadas abaixo já existem e NÃO devem ser criadas nem alteradas. Antes de começar, analise como o app está organizado (telas, hooks/serviços de acesso ao Supabase, formulários e verificação de admin) e reaproveite o que já existir. Se alguma tela ou funcionalidade de base citada aqui não existir no app, ou se tiver qualquer dúvida, me pergunte antes de implementar.

Todas as ações abaixo são exclusivas de administrador (usuário comum não vê os botões). Mantenha o layout adequado para celular (botões com área de toque confortável, formulários em tela cheia ou bottom sheet, conforme o padrão já usado no app).

1. Cadastro de salas sem alocação (SAGE Rural)
   - As salas do Rural têm nome completo no formato "PREDIO - SALA XX"; o prédio é o texto antes do primeiro " - ".
   - Tabela `salas_externas` (colunas `id`, `sala`), que guarda salas do Rural que ainda não têm alocação. A lista de salas do Rural passa a ser a união das salas distintas da tabela `externas` (alocações) com as da tabela `salas_externas`, ordenada.
   - Botão "Cadastrar Sala" (admin) abrindo um formulário com os campos Prédio (escolher um existente ou digitar um novo; vem preenchido com o prédio selecionado) e Sala. Mostrar uma prévia "Será cadastrada como PREDIO - SALA XX". O nome é gravado como "PREDIO - SALA" em maiúsculas, sem espaços duplicados.
   - Após cadastrar, selecionar a nova sala na grade (que aparece vazia).
   - Validações (mensagem exibida no formulário, sem gravar):
     - Prédio e Sala obrigatórios;
     - o prédio não pode conter " - ";
     - a sala deve seguir o padrão "SALA XX" ou "LAB XX", com dois dígitos (regex ^(SALA|LAB) \d{2}$). Mensagem: 'O nome da sala deve seguir o padrão "SALA XX" ou "LAB XX", com dois dígitos (ex: SALA 02, LAB 15).' Mostrar essa orientação também como texto de ajuda abaixo do campo;
     - os campos convertem o texto para maiúsculas enquanto o usuário digita;
     - não permitir cadastrar sala que já existe (comparação sem diferenciar maiúsculas/minúsculas): "A sala X já existe."
   - Atualizar a lista em tempo real (realtime do Supabase) quando `externas` ou `salas_externas` mudarem, se o app já usar realtime.

2. Edição e remoção das salas cadastradas (SAGE Rural)
   - Quando a sala selecionada estiver na tabela `salas_externas`, mostrar ao admin o botão "Editar Sala" (salas que vêm só da tabela `externas` não são editáveis).
   - O formulário de edição reaproveita o de cadastro (mesmas validações; a própria sala não conta como repetida) e tem o botão "Remover", com tela de confirmação ("Tem certeza que deseja remover a sala: X").
   - Só é permitido renomear ou remover se a sala não estiver em uso. Antes de editar/remover, contar registros com aquele nome em: `externas` (coluna `sala`, alocações de qualquer período), `reservas_pontuais` (coluna `sala`), `infra_salas` (coluna `sala`) e `manutencao` (coluna `sala_local`). Se houver uso, bloquear com a mensagem "A sala X está em uso (alocações, reservas pontuais e ...) e não pode ser renomeada/removida."
   - Após renomear, manter a sala renomeada selecionada; após remover, selecionar outra sala do mesmo prédio (ou a primeira da lista).

3. Infraestrutura inicial das salas (SAGE Rural)
   - Tabela `infra_salas` (colunas `id`, `sala` única, `cadeiras`, `computadores`, `projetor`, `tv`, `hdmi`, `arcondicionado`; os quatro últimos são 0/1). Gravar com upsert por `sala`.
   - A área de infraestrutura da sala selecionada deve aparecer sempre. Se a sala não tiver registro em `infra_salas`, mostrar "Infraestrutura da sala não cadastrada."; para o admin, tocar nesse aviso abre o formulário de infraestrutura (o mesmo usado para editar, título "Infraestrutura — NOME DA SALA") com Cadeiras, Computadores, Projetor, TV, HDMI e Ar-condicionado. Usuário comum só vê o aviso.
   - Quando houver registro, exibir os dados (ex: "40 cadeiras", "2 computadores" e os itens disponíveis), como já é feito nas salas que têm infraestrutura.

Adicione testes para as novas regras (validação do nome da sala, bloqueio de edição/remoção de sala em uso e visibilidade dos botões só para admin), sem acessar o banco de produção (use mocks). Ao final, sugira uma mensagem de commit no formato "feat: Descrição", sem fazer o commit.
```
