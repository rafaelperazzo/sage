# SAGE — Plano Técnico de Desenvolvimento

## Visão Geral

**SAGE** (Sistema de Alocação e Gestão de Espaços) é uma aplicação web para o Departamento de Computação que permite visualizar, gerenciar e reportar a ocupação de salas e laboratórios no semestre 2026.1.

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Supabase (projeto `departamento_computacao`)
- **Tabela principal:** `alocacao_2026.1` (215 registros)
- **Deploy:** GitHub Pages via `gh-pages`

---

## Stack e Dependências

| Categoria | Biblioteca | Versão |
|---|---|---|
| Framework | react + react-dom | ^18.3.1 |
| Roteamento | react-router-dom | ^6.26.1 |
| Backend | @supabase/supabase-js | ^2.45.4 |
| Gráficos | recharts | ^2.12.7 |
| Ícones | lucide-react | ^0.446.0 |
| CSS | tailwindcss | ^3.4.13 |
| Build | vite + @vitejs/plugin-react | ^5.4.8 |
| Deploy | gh-pages | ^6.2.0 |

**Regra:** uma única versão de cada biblioteca. Sem `@supabase/auth-ui-react`.

---

## Estrutura de Pastas

```
sage/
├── public/
├── src/
│   ├── components/
│   │   ├── Layout/         # Header, Nav, PageShell
│   │   ├── Modal/          # BaseModal reutilizável
│   │   └── ProtectedRoute.tsx
│   ├── lib/
│   │   └── supabase.ts     # Cliente Supabase (singleton)
│   ├── hooks/
│   │   ├── useAlocacoes.ts # CRUD + realtime
│   │   └── useAuth.ts      # Estado de autenticação
│   ├── types/
│   │   └── index.ts        # Interfaces TypeScript
│   ├── constants/
│   │   └── salas.ts        # Salas, dias, horas
│   ├── modules/
│   │   ├── map/            # SAGE Map
│   │   ├── agenda/         # SAGE Agenda
│   │   └── report/         # SAGE Report
│   ├── App.tsx
│   └── main.tsx
└── plans/
    ├── sage-map.md
    ├── sage-agenda.md
    └── sage-report.md
```

---

## Decisões Arquiteturais

| Decisão | Escolha | Justificativa |
|---|---|---|
| Build tool | Vite + TypeScript | Rápido, padrão atual |
| CSS | Tailwind CSS v3 | Único framework CSS |
| Roteamento | HashRouter (v6) | Evita 404 no GitHub Pages |
| Gráficos | Recharts | Único, nativo React |
| Auth UI | Formulário customizado | Sem `@supabase/auth-ui-react` |
| Auth backend | `supabase.auth` | Parte do cliente JS padrão |
| Estado | Hooks locais | Sem Redux/Zustand |
| Realtime | Supabase Realtime Channels | Grade atualiza sem refresh |

---

## Modelo de Dados (tabela `alocacao_2026.1`)

| Coluna | Tipo | Exemplo |
|---|---|---|
| id | integer (PK) | 16 |
| disciplina | text | "MATEMATICA DISCRETA I" |
| inicio | varchar | "18:00" |
| fim | varchar | "20:00" |
| sala | text | "SALA 02" \| "LAB 35" |
| dia_semana | text | "SEGUNDA" \| "TERÇA" \| ... |
| professor | text \| null | "NOME COMPLETO" |
| periodo | text | "2026.1" |

**Horários:** blocos de 2–4 horas (não slots de 1h). A grade exibe slots de 1h com `rowSpan`.

---

## Salas por Categoria

| Tipo | Salas |
|---|---|
| Salas de Aula | SALA 02, SALA 03, SALA 36, SALA 38 |
| Salas de Inovação | SALA 40, SALA 42 |
| Laboratórios | LAB 35, LAB 37, LAB 39, LAB 41, LAB 43, LAB CEAGRI I - 10, LAB CEAGRI I - 15 |

---

## Ordem de Implementação

| Fase | Escopo | Justificativa |
|---|---|---|
| 1 | Fundação (config, tipos, Supabase, layout) | Pré-requisito de tudo |
| 2 | SAGE Map público | Módulo central; valida lógica do grid |
| 3 | Autenticação | Necessário antes das funções admin |
| 4 | SAGE Map admin (CRUD) | Depende de Auth |
| 5 | SAGE Agenda | Reusa WeekGrid do Map |
| 6 | SAGE Report | Dados agregados, sem dependência de UI complexa |
| 7 | Deploy GitHub Pages | Ao final, com tudo validado |

---

## Riscos Técnicos

| Risco | Severidade | Mitigação |
|---|---|---|
| Nome de tabela com ponto (`alocacao_2026.1`) no PostgREST | Alta | Testar na Fase 1; criar view como alias se necessário |
| RLS policies bloqueando leitura pública | Alta | Verificar/criar policy SELECT para role `anon` |
| Renderização de rowSpan para blocos multi-hora | Média | Função `buildGridMatrix` em WeekGrid.tsx |
| Alocações com inicio/fim fora da grade (ex: 07:00–10:00) | Média | rowSpan calculado em minutos |
| SÁBADO sem dados (presente na spec) | Baixa | Coluna incluída; dados inseríveis futuramente |

---

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://rdabtknlinheqfoaikod.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

---

## Scripts

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de produção
npm run preview   # Preview do build
npm run deploy    # Deploy para GitHub Pages
```
