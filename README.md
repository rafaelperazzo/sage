# SAGE — Sistema de Alocação e Gestão de Espaços

[![Deploy to GitHub Pages](https://github.com/rafaelperazzo/sage/actions/workflows/deploy.yml/badge.svg)](https://github.com/rafaelperazzo/sage/actions/workflows/deploy.yml)

Sistema web do **Departamento de Computação** para visualização e gestão de alocações de salas. Dados em tempo real via Supabase.

**Acesso:** [rafaelperazzo.github.io/sage](https://rafaelperazzo.github.io/sage/)

---

## Página Inicial

Logo abaixo do cabeçalho, dois cards mostram em tempo real quais **laboratórios** e **salas** estão livres no momento, indicando até que horário (ex: `LAB 43 - Livre até as 16:00`). Visível apenas de segunda a sexta, entre 08:00 e 22:00 — fora desse horário os cards não são exibidos. Quando não há nenhum ambiente livre no momento, é exibida a mensagem "Nenhum laboratório/sala disponível no momento."

---

## Módulos

### SAGE Map
Visualização da agenda semanal de cada sala em formato de grade (segunda a sábado, 07:00–22:00).

- Grade interativa com slots de 1 hora e alocações em blocos de 2–4 horas
- Cores distintas por tipo de sala: salas de aula, salas de inovação e laboratórios
- Slots livres destacados em ciano com a legenda "LIVRE" e o intervalo (ex: `14:00-16:00`), agrupados em blocos de 2 horas quando possível — os horários 07:00–08:00, 12:00–13:00 e 13:00–14:00 nunca são destacados como livres
- Aula em andamento destacada em amarelo no momento da visualização (compara dia da semana e horário atual do dispositivo)
- Clique em uma célula ocupada para ver os detalhes da alocação
- Atualização automática em tempo real (Supabase Realtime)
- Barra de infraestrutura da sala selecionada: cadeiras, computadores, projetor, TV, cabo HDMI e ar-condicionado
- **Aba "Buscar Sala"**: localize disciplinas e professores por autocomplete, com lista de salas e horários
- **Aba "Lista de Disciplinas"**: listagem única de todas as disciplinas do período letivo selecionado (exceto cursos BSI e DCC), em ordem alfabética, com curso, semestre, professor e horários/salas; sessões da mesma disciplina com o mesmo professor e curso são agrupadas em uma linha, com filtro por disciplina ou professor. Suporte a link direto: `/#/map?tab=lista`

**Modo administrador** (requer login como administrador geral — veja [Autenticação e Permissões](#autenticação-e-permissões)):
- Clique em célula vazia para criar uma nova alocação
- Clique em célula ocupada para editar ou remover
- Detecção automática de conflito de horário
- Clique na barra de infraestrutura para cadastrar ou editar os dados da sala

### SAGE Rural
Idêntico ao SAGE Map, mas para salas de unidades externas ao Departamento de Computação — mesma grade semanal, busca por sala e lista de disciplinas, porém os dados vêm da tabela `externas` (não de `alocacao_2026.1`).

- Seletor de sala em caixa de seleção, populado dinamicamente com os valores distintos da coluna `sala` da tabela `externas` (não é uma lista fixa como no SAGE Map)
- Mesma grade semanal, aba "Buscar Sala" e aba "Lista de Disciplinas" do SAGE Map
- Barra de infraestrutura da sala selecionada aparece **somente** se já existir um registro para aquela sala na tabela `infra_salas`; caso contrário, nada é exibido

**Modo administrador** (requer login como administrador geral ou como administrador do SAGE Rural — veja [Autenticação e Permissões](#autenticação-e-permissões)):
- Clique em célula vazia para criar uma nova alocação
- Clique em célula ocupada para editar ou remover
- Detecção automática de conflito de horário
- Clique na barra de infraestrutura para editar os dados da sala (apenas se já houver registro)

### SAGE Agenda
Grade de horários de um professor específico.

- Busca com autocomplete pelo nome do professor
- Grade semanal com disciplinas e salas alocadas
- Suporte a link direto: `/#/agenda?professor=NOME`

### SAGE Report
Relatórios de ocupação e disponibilidade das salas.

- Gráfico de barras com percentual de ocupação de todas as salas
- Detalhamento por sala: gráfico de pizza (ocupado vs. livre) e tabela por dia
- Base de cálculo: 12 horas/dia × 6 dias = 72h/semana = 100% de ocupação
- Salas agrupadas por tipo: salas de aula, inovação e laboratórios

### SAGE Manutenção
Lista pública das solicitações de manutenção (RTs) do Departamento de Computação.

- Lista completa com número da RT, local, descrição, status e data de abertura
- Filtros simultâneos por RT, local e descrição com busca em tempo real
- Badge de status colorido: Aberto (vermelho), Em andamento (amarelo), Concluído (verde)
- Clique em qualquer linha para ver os detalhes completos da solicitação
- Atualização automática em tempo real (Supabase Realtime)

**Modo administrador** (requer login como administrador geral — veja [Autenticação e Permissões](#autenticação-e-permissões)):
- Botão "+ Nova RT" para cadastrar uma nova solicitação
- Clique em uma linha para editar dados ou remover (com confirmação)

### SAGE Auditório
Calendário mensal de reservas do auditório do Departamento de Computação.

- Calendário mensal interativo exibindo apenas segunda a sábado
- Navegação por mês/ano a partir do mês atual
- Clique em uma reserva para ver os detalhes (responsável, data e horário)
- Barra de infraestrutura do auditório (cadeiras, computadores, projetor, TV, cabo HDMI e ar-condicionado), com os dados armazenados sob a sala **SALA 07** na tabela `infra_salas`
- Aba de relatório com ocupação diária e mensal (base: 12h/dia = 100%)
- Gráfico de barras e tabela detalhada de utilização do mês

**Modo administrador** (requer login como administrador geral — veja [Autenticação e Permissões](#autenticação-e-permissões)):
- Clique em qualquer dia para cadastrar uma nova reserva
- Clique em uma reserva para editar ou remover (com confirmação)
- Detecção automática de conflito de horário no mesmo dia
- Clique na barra de infraestrutura para cadastrar ou editar os dados do auditório

> Para solicitar uma reserva, envie e-mail para **diretoria.dc@ufrpe.br**. As reservas são gerenciadas pela direção do Departamento.

---

## Salas

| Tipo | Salas |
|---|---|
| Salas de Aula | SALA 02, SALA 03, SALA 36, SALA 38 |
| Salas de Inovação | SALA 40, SALA 42 |
| Laboratórios | LAB 35, LAB 37, LAB 39, LAB 41, LAB 43, LAB CEAGRI I-10, LAB CEAGRI I-15 |

Dados de infraestrutura (cadeiras, computadores, projetor, TV, cabo HDMI, ar-condicionado) ficam na tabela `infra_salas`, uma linha por sala (chave `sala`). O auditório usa a chave **SALA 07** nessa mesma tabela.

---

## Autenticação e Permissões

O login (`/#/login`) usa Supabase Auth (e-mail/senha) e é o mesmo formulário para todas as contas — o que muda é o que cada conta pode administrar depois de logada:

- **Administrador geral**: acesso de administrador em todos os módulos (SAGE Map, SAGE Auditório, SAGE Manutenção e SAGE Rural).
- **Administrador restrito ao SAGE Rural**: vê os controles de administrador apenas no SAGE Rural; nos demais módulos, navega como um visitante comum (sem os botões de criar/editar/remover).
- Qualquer outra conta autenticada não tem controles de administrador em nenhum módulo.

Esses papéis ficam na tabela `admin_roles` do Supabase (`user_id`, `module`), onde `module = 'all'` concede acesso geral e um valor específico (ex: `rural`) restringe o acesso àquele módulo. Não há UI neste projeto para gerenciar essa tabela — novas contas de administrador são cadastradas diretamente no painel do Supabase.

> Essa restrição é aplicada na interface (o que cada perfil vê e consegue clicar). As políticas de RLS do banco continuam liberando escrita para qualquer usuário autenticado, mesmo perfis sem acesso de admin em um módulo — o mesmo modelo de confiança que o projeto já usava antes dessa mudança.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS |
| Backend | Supabase (PostgreSQL + Realtime + Auth) |
| Gráficos | Recharts |
| Roteamento | React Router v6 (HashRouter) |
| Deploy | GitHub Pages via GitHub Actions |

---

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.example .env
# Editar .env com as credenciais do Supabase

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse em `http://localhost:5173/sage/`

---

## Deploy

O deploy é feito automaticamente via GitHub Actions a cada push na branch `master`. As variáveis de ambiente devem estar configuradas como **secrets** no repositório:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
