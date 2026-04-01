# SAGE Agenda — Grade de Horários por Professor

## Objetivo

Permitir que qualquer usuário visualize a grade semanal de disciplinas e salas de um professor específico, no formato de tabela (segunda a sábado, 07:00–22:00).

---

## Rota(s)

| Rota | Acesso | Descrição |
|---|---|---|
| `/#/agenda` | Público | Seletor de professor + grade |
| `/#/agenda?professor=NOME` | Público | Grade pré-filtrada por professor |

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `AgendaPage.tsx` | Página com campo de busca/autocomplete de professor |
| `TeacherGrid.tsx` | Grade semanal filtrada — variação do WeekGrid do Map |

---

## Hooks Utilizados

- `useAlocacoes()` — carrega todas as alocações (sem filtro de sala)
- `useProfessores()` — lista distinta de professores para autocomplete (derivado de `useAlocacoes`)

---

## Fluxos de Usuário

### Visualizar agenda de professor
1. Usuário acessa `/#/agenda`
2. Campo de busca exibe placeholder "Digite o nome do professor..."
3. Ao digitar, lista filtrada de professores é exibida (case-insensitive)
4. Usuário seleciona professor → grade semanal é renderizada
5. Cada célula exibe: disciplina + sala
6. Clicar em célula → ViewModal com detalhes completos
7. Se professor sem alocações → mensagem "Nenhuma alocação encontrada"

### Filtro por URL
1. URL `/#/agenda?professor=NOME` carrega automaticamente a grade do professor
2. Útil para links diretos / compartilhamento

---

## Tipos Relevantes

```typescript
// Reutiliza Alocacao de types/index.ts

// Grade do professor: todas as salas em um único grid
interface AgendaCell {
  alocacao: Alocacao | null;
  rowSpan?: number;
  skip?: boolean;
}

// Estrutura: dia → hora → AgendaCell
type AgendaMatrix = Record<string, Record<string, AgendaCell>>;
```

---

## Diferenças em relação ao WeekGrid do Map

| Aspecto | WeekGrid (Map) | TeacherGrid (Agenda) |
|---|---|---|
| Filtro | Por sala | Por professor |
| Colunas | Dias da semana | Dias da semana |
| Linhas | Slots de hora | Slots de hora |
| Conteúdo da célula | Disciplina + professor | Disciplina + **sala** |
| Multi-sala | Não (uma sala por vez) | Sim (todas as salas do professor) |

A lógica de `buildGridMatrix` é reutilizada com adaptação para múltiplas salas.

---

## Restrições e Regras de Negócio

- Módulo somente leitura — sem operações CRUD
- Um professor pode ter aulas em salas diferentes no mesmo horário (caso excepcional); exibir ambas
- Busca case-insensitive e com acentos normalizados
- Se o nome do professor estiver em branco, mostrar instrução de busca

---

## Verificação (como testar)

1. Acessar `/#/agenda`
2. Digitar "RUAN" → autocomplete sugere "RUAN VASCONCELOS BEZERRA CARVALHO"
3. Selecionar → grade exibe MATEMATICA DISCRETA I nas sextas e quartas
4. Confirmar que sala aparece em cada célula
5. Testar `/#/agenda?professor=RUAN VASCONCELOS BEZERRA CARVALHO` diretamente
6. Digitar professor inexistente → mensagem "Nenhuma alocação encontrada"
