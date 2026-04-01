# SAGE Report — Relatórios de Ocupação e Disponibilidade

## Objetivo

Exibir relatórios de ocupação geral e individual de cada sala, com gráficos e tabelas. Considera que 12 horas de uso por dia corresponde a 100% de ocupação.

---

## Rota(s)

| Rota | Acesso | Descrição |
|---|---|---|
| `/#/report` | Público | Relatório geral + detalhes por sala |

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `ReportPage.tsx` | Página principal com visão geral e navegação entre salas |
| `OccupancyBarChart.tsx` | Gráfico de barras horizontal: ocupação % por sala (Recharts) |
| `RoomDetail.tsx` | Detalhes de uma sala: tabela por dia + gráfico de pizza |

---

## Hooks Utilizados

- `useAlocacoes()` — todas as alocações do período
- `useOccupancy()` — hook derivado que calcula métricas (definido em `modules/report/`)

---

## Fluxos de Usuário

### Relatório geral
1. Usuário acessa `/#/report`
2. Visão geral exibe gráfico de barras com % de ocupação de todas as salas
3. Salas agrupadas por tipo: Salas de Aula / Inovação / Laboratórios
4. Tabela resumo abaixo do gráfico com: sala, horas ocupadas, horas livres, % ocupação

### Relatório por sala
1. Usuário clica em uma sala (no gráfico ou na tabela)
2. `RoomDetail` exibe:
   - Gráfico de pizza: ocupado vs. livre por semana
   - Tabela por dia: segunda a sábado, horas ocupadas por dia
   - Lista de alocações da sala

---

## Cálculo de Ocupação

```
Carga horária máxima = 12h por dia × 6 dias = 72h por semana (por sala)
Ocupação (%) = (total de horas alocadas / 72) × 100

Por dia:
  horas_dia = Σ (timeToMinutes(fim) - timeToMinutes(inicio)) / 60
  ocupacao_dia (%) = (horas_dia / 12) × 100
```

**Observação:** horas sobrepostas não são esperadas (banco deve garantir ausência de conflitos), mas o cálculo deve lidar com possíveis duplicatas somando apenas períodos únicos.

---

## Tipos Relevantes

```typescript
interface RoomOccupancy {
  sala: string;
  tipo: TipoSala;
  totalHoras: number;
  percentual: number;        // 0–100
  porDia: Record<string, number>; // dia → horas
}

interface ReportSummary {
  salas: RoomOccupancy[];
  totalGeralHoras: number;
  mediaOcupacao: number;
}
```

---

## Restrições e Regras de Negócio

- 12 horas = 100% de ocupação por sala/dia
- Máximo teórico: 72h por semana por sala (12h × 6 dias)
- SÁBADO conta como dia disponível mesmo sem alocações
- Módulo somente leitura
- Exibir salas sem nenhuma alocação como 0% (não omitir)
- Agrupar visualmente por tipo de sala

---

## Biblioteca de Gráficos

Usa **Recharts** exclusivamente:
- `BarChart` (horizontal) → ocupação geral por sala
- `PieChart` → ocupado vs. livre por sala individual
- `Tooltip` e `Legend` em português

---

## Verificação (como testar)

1. Acessar `/#/report`
2. Gráfico de barras deve exibir todas as 13 salas
3. Verificar manualmente: SALA 02 tem alocações segunda/quarta/sexta → calcular horas e comparar com %
4. Clicar em SALA 02 → RoomDetail exibe tabela por dia com horas corretas
5. Salas sem alocações (ex: SÁBADO) → exibem 0h / 0%
6. Soma geral no rodapé confere com soma individual das salas
