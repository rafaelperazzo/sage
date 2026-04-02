# Plano — SAGE Map: Funcionalidade "Buscar Sala"

## Contexto

O SAGE Map exibe a grade semanal de uma sala de cada vez. O usuário que precisa saber **onde** uma disciplina acontece ou **onde** um professor leciona precisa navegar sala a sala — não há busca direta. Esta funcionalidade adiciona um painel de busca ao Map que responde "em qual sala / horário está esta disciplina?" e "em quais salas / horários está este professor?".

---

## Arquivos Modificados

- `src/modules/map/MapPage.tsx` — adicionar tabs "Grade Semanal" / "Buscar Sala"
- `src/modules/map/BuscaSala.tsx` — novo componente (criado)

Nenhum outro arquivo precisa ser alterado.

---

## Abordagem

### Tabs em MapPage

Adicionar dois tabs acima do conteúdo atual:

```
[ Grade Semanal ]  [ Buscar Sala ]
```

- **Grade Semanal** → comportamento atual (sem nenhuma alteração)
- **Buscar Sala** → renderiza `<BuscaSala alocacoes={...} />`

Estado do tab em `MapPage`: `useState<'grade' | 'busca'>('grade')`.

### Componente BuscaSala (src/modules/map/BuscaSala.tsx)

Dois blocos de busca independentes na mesma página:

```
┌─────────────────────────────────────┐
│  🔍  Buscar por Disciplina           │
│  [input autocomplete]               │
│  Resultados: cards com              │
│    Sala · Professor · Dia · Horário  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🔍  Buscar por Professor           │
│  [input autocomplete]               │
│  Resultados: cards com              │
│    Disciplina · Sala · Dia · Horário│
└─────────────────────────────────────┘
```

### Fonte de dados

Reutilizar `useAlocacoes()` (já existe em `src/hooks/useAlocacoes.ts`) — carrega todas as alocações do período selecionado com realtime. Nenhuma nova query ao Supabase é necessária.

`MapPage` adiciona o hook e passa os dados via prop para `BuscaSala`.

### Autocomplete

Reutiliza o padrão de `src/modules/agenda/AgendaPage.tsx`:
- Estados: `query` + `selectedValue` + `showSuggestions` por campo
- Normalização de acentos: `.normalize('NFD').replace(/[\u0300-\u036f]/g, '')`
- `onBlur` com `setTimeout(..., 150)` para permitir clique na sugestão
- `onMouseDown` no item da lista (evita blur antes do clique)
- Limite de 8 sugestões por campo

### Listas derivadas (useMemo dentro de BuscaSala)

```typescript
// Disciplinas únicas ordenadas
const disciplinas = useMemo(() =>
  Array.from(new Set(alocacoes.map(a => a.disciplina))).sort()
, [alocacoes])

// Professores únicos ordenados (sem null)
const professores = useMemo(() =>
  Array.from(new Set(
    alocacoes.filter(a => a.professor).map(a => a.professor!)
  )).sort()
, [alocacoes])
```

### Resultados — busca por disciplina

```typescript
const resultadosDisciplina = useMemo(() =>
  !selectedDisciplina ? [] :
  alocacoes
    .filter(a => a.disciplina === selectedDisciplina)
    .sort((a, b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana))
, [alocacoes, selectedDisciplina])
```

Cada resultado exibe: **Sala** (badge colorido por tipo) · **Professor** · **Dia** · **Horário**

### Resultados — busca por professor

```typescript
const resultadosProfessor = useMemo(() =>
  !selectedProfessor ? [] :
  alocacoes
    .filter(a => a.professor === selectedProfessor)
    .sort((a, b) => DIAS.indexOf(a.dia_semana) - DIAS.indexOf(b.dia_semana))
, [alocacoes, selectedProfessor])
```

Cada resultado exibe: **Disciplina** · **Sala** (badge colorido por tipo) · **Dia** · **Horário**

### Interface do componente

```typescript
interface BuscaSalaProps {
  alocacoes: Alocacao[]
  loading: boolean
}
```

---

## Integração em MapPage

Adicionar `useAlocacoes()` (hook já existente) ao `MapPage` para alimentar `BuscaSala`. Os dois hooks (`useAlocacoesPorSala` para a grade e `useAlocacoes` para a busca) operam de forma independente e ambos já filtram pelo período do contexto.

---

## Utilitários reutilizáveis

| Origem | O que reutilizar |
|---|---|
| `src/modules/agenda/AgendaPage.tsx` | Lógica completa de autocomplete (query, sugestões, blur/mousedown) |
| `src/hooks/useAlocacoes.ts` | `useAlocacoes()` — sem alteração |
| `src/constants/salas.ts` | `getSalaInfo()`, `TIPO_COLOR`, `TIPO_LABEL`, `DIAS` |
| `src/types/index.ts` | `Alocacao` |

---

## Verificação

1. `npm run dev` → `/#/map`
2. Tab "Buscar Sala" aparece ao lado de "Grade Semanal"
3. Campo Disciplina: digitar "CALCULO" → autocomplete sugere com/sem acento
4. Selecionar disciplina → lista de cards com sala, professor e horários corretos
5. Campo Professor: digitar "RUAN" → sugere "RUAN VASCONCELOS BEZERRA CARVALHO"
6. Selecionar → lista de disciplinas, salas e horários do professor
7. Trocar período no Header → resultados atualizam automaticamente
8. Tab "Grade Semanal" → comportamento original inalterado
9. `npm run build` sem erros TypeScript
