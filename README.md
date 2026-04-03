# SAGE — Sistema de Alocação e Gestão de Espaços

[![Deploy to GitHub Pages](https://github.com/rafaelperazzo/sage/actions/workflows/deploy.yml/badge.svg)](https://github.com/rafaelperazzo/sage/actions/workflows/deploy.yml)

Sistema web do **Departamento de Computação** para visualização e gestão de alocações de salas no semestre 2026.1. Dados em tempo real via Supabase.

**Acesso:** [rafaelperazzo.github.io/sage](https://rafaelperazzo.github.io/sage/)

---

## Módulos

### SAGE Map
Visualização da agenda semanal de cada sala em formato de grade (segunda a sábado, 07:00–22:00).

- Grade interativa com slots de 1 hora e alocações em blocos de 2–4 horas
- Cores distintas por tipo de sala: salas de aula, salas de inovação e laboratórios
- Clique em uma célula ocupada para ver os detalhes da alocação
- Atualização automática em tempo real (Supabase Realtime)
- **Aba "Buscar Sala"**: localize disciplinas e professores por autocomplete, com lista de salas e horários

**Modo administrador** (requer login):
- Clique em célula vazia para criar uma nova alocação
- Clique em célula ocupada para editar ou remover
- Detecção automática de conflito de horário

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

**Modo administrador** (requer login):
- Botão "+ Nova RT" para cadastrar uma nova solicitação
- Clique em uma linha para editar dados ou remover (com confirmação)

### SAGE Auditório
Calendário mensal de reservas do auditório do Departamento de Computação.

- Calendário mensal interativo exibindo apenas segunda a sábado
- Navegação por mês/ano a partir do mês atual
- Clique em uma reserva para ver os detalhes (responsável, data e horário)
- Aba de relatório com ocupação diária e mensal (base: 12h/dia = 100%)
- Gráfico de barras e tabela detalhada de utilização do mês

**Modo administrador** (requer login):
- Clique em qualquer dia para cadastrar uma nova reserva
- Clique em uma reserva para editar ou remover (com confirmação)
- Detecção automática de conflito de horário no mesmo dia

> Para solicitar uma reserva, envie e-mail para **diretoria.dc@ufrpe.br**. As reservas são gerenciadas pela direção do Departamento.

---

## Salas

| Tipo | Salas |
|---|---|
| Salas de Aula | SALA 02, SALA 03, SALA 36, SALA 38 |
| Salas de Inovação | SALA 40, SALA 42 |
| Laboratórios | LAB 35, LAB 37, LAB 39, LAB 41, LAB 43, LAB CEAGRI I-10, LAB CEAGRI I-15 |

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
