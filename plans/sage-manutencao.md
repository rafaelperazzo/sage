# Plano — SAGE Manutenção

## Contexto

O Departamento de Computação precisa acompanhar pedidos de manutenção (RTs — Requisições de Trabalho) de forma centralizada. Atualmente não existe nenhum módulo para isso no SAGE. O novo módulo SAGE Manutenção oferece uma área pública para consulta dos pedidos e uma área administrativa (login Supabase) para inclusão, alteração e remoção de registros da tabela `manutencao`.

---

## Tabela Supabase

**Nome:** `manutencao` — projeto `departamento_computacao`

| Coluna | Tipo | Observação |
|---|---|---|
| id | integer | PK, gerado automaticamente |
| numero_rt | text | Número da RT |
| local | text | Local/sala onde ocorreu o problema |
| descricao | text | Descrição do problema |
| status | text | Ex: "Aberto", "Em andamento", "Concluído" |
| data_abertura | date | Data de abertura (nullable) |
| data_conclusao | date | Data de conclusão (nullable) |
| observacao | text | Observações adicionais (nullable) |

---

## Arquivos a criar

```
src/modules/manutencao/
  ManutencaoPage.tsx       — página principal (lista + filtros + modais)
  ManutencaoViewModal.tsx  — modal de visualização (público)
  ManutencaoEditModal.tsx  — modal de edição/remoção (admin)
  ManutencaoForm.tsx       — formulário de criação (admin)
```

## Arquivos a modificar

| Arquivo | Alteração |
|---|---|
| `src/types/index.ts` | Adicionar `Manutencao` e `ManutencaoInput` |
| `src/lib/supabase.ts` | Adicionar `MANUTENCAO_TABLE` + fetch/insert/update/delete |
| `src/hooks/useManutencao.ts` | Novo hook (criar) |
| `src/App.tsx` | Adicionar rota `/manutencao` |
| `src/components/Layout/Header.tsx` | Adicionar item de nav |
| `src/modules/sobre/SobrePage.tsx` | Adicionar card do módulo |
| `INDEX.md` | Novo módulo documentado |
| `README.md` | Seção SAGE Manutenção |

---

## Tipos (src/types/index.ts)

```typescript
export interface Manutencao {
  id: number
  numero_rt: string
  local: string
  descricao: string
  status: string
  data_abertura: string | null   // "YYYY-MM-DD"
  data_conclusao: string | null  // "YYYY-MM-DD"
  observacao: string | null
}
export type ManutencaoInput = Omit<Manutencao, 'id'>
```

---

## Supabase (src/lib/supabase.ts)

```typescript
const MANUTENCAO_TABLE = 'manutencao'

export async function fetchManutencoes(): Promise<Manutencao[]>
export async function insertManutencao(input: ManutencaoInput): Promise<Manutencao>
export async function updateManutencao(id: number, input: ManutencaoInput): Promise<Manutencao>
export async function deleteManutencao(id: number): Promise<void>
```

Fetch ordenado por `data_abertura` desc (mais recentes primeiro).

---

## Hook (src/hooks/useManutencao.ts)

Segue o padrão de `useReservas.ts`:
- Estado: `manutencoes`, `loading`, `error`
- Realtime via canal Supabase (`INSERT | UPDATE | DELETE`)
- Funções: `create(data)`, `update(id, data)`, `remove(id)`
- Cada operação chama `load()` após concluir

---

## ManutencaoPage

### Área pública

```
┌──────────────────────────────────────────────────────────┐
│  Filtrar:  [RT...]   [Local...]   [Descrição...]          │
├────────┬────────────┬────────────────┬──────────┬─────────┤
│  RT    │  Local     │  Descrição     │  Status  │ Abertura│
├────────┼────────────┼────────────────┼──────────┼─────────┤
│ RT-001 │ LAB 35     │ Ar-condicionad │ Aberto   │ 01/04   │
│ ...    │            │                │          │         │
└────────┴────────────┴────────────────┴──────────┴─────────┘
```

- Três inputs de texto para filtro simultâneo (RT, local, descrição) — filtragem client-side com `useMemo`
- Filtro case-insensitive com normalização de acentos (mesmo padrão de BuscaSala)
- Clique em qualquer linha → `ManutencaoViewModal` com todos os detalhes
- Badge colorido por status: Aberto → vermelho, Em andamento → amarelo, Concluído → verde

### Área admin (isAdmin)

- Botão "+ Nova RT" → `ManutencaoForm`
- Clique na linha → `ManutencaoEditModal` (com botão Remover + confirmação)
- Badge "Modo Admin" (Shield) no header da página

---

## Modais

### ManutencaoViewModal (público)
- Exibe todos os campos em formato read-only
- Usa `BaseModal` (padrão existente em `src/components/Modal/BaseModal.tsx`)

### ManutencaoEditModal (admin)
- Formulário com todos os campos editáveis
- Botão "Salvar" + "Remover" (com confirmação inline)
- Segue padrão de `ReservaEditModal.tsx`

### ManutencaoForm (admin)
- Formulário em branco para nova RT
- Campos obrigatórios: numero_rt, local, descricao, status
- Segue padrão de `ReservaForm.tsx`

---

## Navegação

**Header.tsx** — novo item:
```typescript
{ to: '/manutencao', label: 'SAGE Manutenção', icon: Wrench }
```
Ícone `Wrench` do `lucide-react`.

**App.tsx** — nova rota:
```typescript
<Route path="/manutencao" element={<ManutencaoPage />} />
```

---

## Esquema de cores

Laranja (`orange-*`) — diferencia visualmente dos demais módulos (blue=Map, amber=Auditório).

---

## Verificação

1. `npm run dev` → `/#/manutencao` — lista carrega da tabela Supabase
2. Digitar nos filtros → lista reduz em tempo real
3. Clicar em linha → modal abre com todos os campos preenchidos
4. Login admin → botão "+ Nova RT" aparece
5. Criar RT → aparece na lista (realtime)
6. Editar RT → alterações refletem imediatamente
7. Remover RT → some da lista
8. `npm run build` sem erros TypeScript
