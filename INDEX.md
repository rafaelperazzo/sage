# SAGE — Sistema de Alocação e Gestão de Espaços

> Aplicação web do Departamento de Computação para visualização e gestão de alocações de salas no semestre 2026.1.

## Módulos

| Módulo | Rota | Descrição | Status |
|---|---|---|---|
| [SAGE Map](plans/sage-map.md) | `/#/map` | Grade semanal de salas em tempo real | Implementado |
| [SAGE Map — Buscar Sala](plans/sage-map-busca-sala.md) | `/#/map` (tab) | Busca por disciplina ou professor com autocomplete | Implementado |
| [SAGE Agenda](plans/sage-agenda.md) | `/#/agenda` | Grade de horários por professor | Implementado |
| [SAGE Report](plans/sage-report.md) | `/#/report` | Relatórios de ocupação e disponibilidade | Implementado |
| [SAGE Auditório](plans/sage-auditorio.md) | `/#/auditorio` | Calendário de reservas do auditório | Implementado |

## Ordem de Implementação

1. **Fase 1 — Fundação** — configuração do projeto, tipos, Supabase, layout
2. **Fase 2 — SAGE Map (público)** — grade semanal com leitura de dados
3. **Fase 3 — Autenticação** — login/logout para administradores
4. **Fase 4 — SAGE Map (admin)** — CRUD de alocações
5. **Fase 5 — SAGE Agenda** — grade por professor
6. **Fase 6 — SAGE Report** — relatórios e gráficos
7. **Fase 7 — SAGE Auditório** — calendário mensal de reservas do auditório
8. **Fase 8 — Deploy** — publicação no GitHub Pages

## Links

- [Plano Técnico Completo](PLAN.md)
- [Supabase — departamento_computacao](https://supabase.com/dashboard/project/rdabtknlinheqfoaikod)
- Tabela principal: `alocacao_2026.1`

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · Supabase · Recharts · GitHub Pages
