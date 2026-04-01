# SAGE Auditório — Calendário de Reservas do Auditório

## Objetivo

Gerenciar reservas do auditório do Departamento de Computação. Área pública para visualização em calendário mensal e área administrativa para CRUD de reservas.

---

## Rota(s)

| Rota | Acesso | Descrição |
|---|---|---|
| `/#/auditorio` | Público | Calendário mensal + relatório de ocupação |

O modo admin é ativado automaticamente quando o usuário está autenticado — não há rota separada.

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `AuditorioPage.tsx` | Página principal: tabs Calendário / Relatório, controle de mês/ano, modais |
| `MonthCalendar.tsx` | Grade mensal customizada (Seg–Sáb, sem domingos), navegação por mês |
| `ReservaViewModal.tsx` | Modal de detalhes (público): responsável, data, horário |
| `ReservaForm.tsx` | Formulário de criação (admin): data, início, fim, responsável |
| `ReservaEditModal.tsx` | Editar/remover com confirmação em dois passos (admin) |
| `AuditorioReport.tsx` | Relatório de ocupação: gráfico de barras, tabela diária, resumo mensal |

---

## Hooks Utilizados

- `useReservas(ano, mes)` — carrega reservas do mês, CRUD + realtime, detecção de conflito
- `useAuth()` — determina se o usuário é admin

---

## Fonte de Dados

**Tabela Supabase:** `auditorio`

| Coluna | Tipo | Observação |
|---|---|---|
| id | integer (PK) | Auto-gerado |
| data | date | "YYYY-MM-DD" |
| inicio | time | "HH:MM:SS" — normalizar com `normalizeTime()` |
| fim | time | "HH:MM:SS" |
| responsavel | text \| null | Nome do responsável |

Não há coluna `periodo` — o escopo é controlado pela navegação mensal do calendário. O seletor de período do Header **não se aplica** a este módulo.

---

## Fluxos de Usuário

### Visualização pública
1. Usuário acessa `/#/auditorio`
2. Aviso exibido: "Para solicitar uma reserva, envie e-mail para diretoria.dc@ufrpe.br"
3. Calendário do mês atual é exibido (Seg–Sáb, sem domingos)
4. Clique em reserva → `ReservaViewModal` com responsável, data e horário
5. Botões `←` e `→` navegam entre meses
6. Aba "Relatório" exibe ocupação diária e mensal do mês em exibição

### Admin — Criar reserva
1. Admin logado clica em qualquer dia do calendário → `ReservaForm` com data pré-preenchida
2. Preenche responsável, horário de início e fim
3. Sistema verifica conflito via `hasConflict()`
4. Se livre → persiste; calendário atualiza via realtime
5. Se ocupado → mensagem de conflito, botão salvar desabilitado

### Admin — Editar reserva
1. Admin clica em reserva existente → `ReservaEditModal` com dados preenchidos
2. Edita campos desejados; conflito verificado excluindo a própria reserva
3. Salva → persiste atualização

### Admin — Remover reserva
1. No `ReservaEditModal`, admin clica em "Remover"
2. Modal de confirmação: "Confirmar remoção de [responsável] — [data] [horário]?"
3. Confirma → `remove(id)` → some do calendário
4. Cancela → nenhuma ação

---

## Tipos Relevantes

```typescript
export interface Reserva {
  id: number
  data: string          // "YYYY-MM-DD"
  inicio: string        // "HH:MM:SS" (Supabase time)
  fim: string           // "HH:MM:SS"
  responsavel: string | null
}

export type ReservaInput = Omit<Reserva, 'id'>
```

---

## Lógica do Calendário (MonthCalendar)

Grade de 6 colunas (Seg–Sáb), sem domingos:

```
1. Calcular o primeiro dia do mês
2. Calcular offset de preenchimento (dias do mês anterior)
   - Se primeiro dia é domingo → offset = 0 (começa na segunda)
   - Caso contrário → offset = diaSemanaIdx (0=Seg ... 5=Sáb)
3. Preencher semanas de 6 células
4. Completar última semana com dias do próximo mês se necessário
```

Conversão de `getDay()` (Dom=0) para índice Seg=0...Dom=6:
```
diaSemanaIdx(date) = date.getDay() === 0 ? 6 : date.getDay() - 1
```

---

## Lógica de Conflito (useReservas)

```
horariosConflitam(a, b):
  se a.data !== b.data → false
  aInicio = timeToMinutes(a.inicio)
  aFim = timeToMinutes(a.fim)
  bInicio = timeToMinutes(b.inicio)
  bFim = timeToMinutes(b.fim)
  → aInicio < bFim && aFim > bInicio
```

`normalizeTime("HH:MM:SS")` → `"HH:MM"` via `.substring(0, 5)`

---

## Relatório de Ocupação (AuditorioReport)

```
Ocupação diária (%) = (Σ horas do dia / 12) × 100
Ocupação mensal (%) = (Σ horas do mês / (diasUteis × 12)) × 100
  onde diasUteis = dias Seg–Sáb do mês
```

Sobreposição de intervalos tratada com merge antes do cálculo.

**Visualizações:**
- Cards de resumo: total de reservas, horas, % mensal, dias úteis
- `BarChart` (Recharts) — ocupação diária em amber
- Tabela: dia | reservas | horas | % com barra de progresso
- Lista completa de reservas do mês

---

## Decisões de Design

| Decisão | Escolha | Justificativa |
|---|---|---|
| Cor | Amber | Diferencia do Map (azul), Report (verde/violeta) |
| Calendário | Customizado com Tailwind | Sem nova dependência |
| Domingos | Omitidos | Auditório não funciona aos domingos |
| Seletor de período | Não utilizado | Tabela `auditorio` não tem coluna `periodo` |
| Solicitação de reserva | E-mail externo | Sistema não processa solicitações |

---

## Restrições e Regras de Negócio

- Apenas uma reserva por período no mesmo dia (sem sobreposição de horário)
- Remoção exige confirmação explícita
- Área pública: apenas visualização + aviso de contato por e-mail
- Usuários públicos não podem solicitar reservas pelo sistema
- Calendário inicia no mês/ano do acesso do usuário
- Tipo `time` do Postgres retorna "HH:MM:SS" — sempre normalizar antes de exibir

---

## Verificação (como testar)

1. `npm run dev` → acessar `/#/auditorio`
2. Calendário exibe mês atual, Seg–Sáb, sem domingos
3. Aviso de e-mail visível para usuários não logados
4. Navegar com `←` e `→` entre meses
5. Clicar em reserva existente → ViewModal com responsável, data e horário
6. Aba "Relatório" → gráfico e tabela de ocupação correta
7. Login como admin → badge "Modo Admin" aparece, aviso de e-mail some
8. Admin clica em dia vazio → ReservaForm com data pré-preenchida
9. Criar reserva → aparece no calendário
10. Tentar criar em horário já ocupado no mesmo dia → mensagem de conflito
11. Editar reserva → dados pré-preenchidos
12. Remover → confirmação → some do calendário
13. `npm run build` sem erros TypeScript
