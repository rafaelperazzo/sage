# SAGE Map — Visualização da Agenda Semanal das Salas

## Objetivo

Exibir a ocupação semanal de cada sala em formato de grade (segunda a sábado, 07:00–22:00, slots de 1h). Permite consulta pública dos detalhes e, para administradores autenticados, inclusão, alteração e remoção de alocações.

---

## Rota(s)

| Rota | Acesso | Descrição |
|---|---|---|
| `/#/map` | Público | Grade com visualização e detalhes |
| `/#/login` | Público | Login do administrador |

O modo admin é ativado automaticamente quando o usuário está autenticado — não há rota separada.

---

## Componentes

| Componente | Responsabilidade |
|---|---|
| `MapPage.tsx` | Página principal: seletor de sala, instancia WeekGrid |
| `WeekGrid.tsx` | Tabela 15 linhas × 6 colunas com lógica de rowSpan |
| `AllocationCell.tsx` | Célula ocupada: exibe disciplina, professor, cor por tipo |
| `ViewModal.tsx` | Modal de detalhes (público): todos os campos da alocação |
| `EditModal.tsx` | Modal de edição (admin): formulário pré-preenchido |
| `AllocationForm.tsx` | Formulário de criação (admin): slot/sala já preenchidos |

---

## Hooks Utilizados

- `useAlocacoes(sala)` — carrega alocações da sala selecionada, subscribe ao realtime
- `useAuth()` — determina se o usuário é admin

---

## Fluxos de Usuário

### Visualização pública
1. Usuário acessa `/#/map`
2. Seleciona uma sala no seletor (padrão: SALA 02)
3. Grade semanal é exibida com alocações coloridas por tipo
4. Clica em célula ocupada → `ViewModal` com detalhes
5. Clica em célula vazia → nenhuma ação

### Admin — Criar alocação
1. Admin está autenticado e na tela do mapa
2. Clica em célula vazia → `AllocationForm` com dia/hora/sala preenchidos
3. Preenche disciplina, professor e horário de fim
4. Sistema verifica conflito via `hasConflict()`
5. Se livre → persiste e grade atualiza via realtime
6. Se ocupado → exibe mensagem de erro

### Admin — Editar alocação
1. Admin clica em célula ocupada → `EditModal` (em vez de ViewModal)
2. Edita campos desejados
3. Sistema verifica conflito (excluindo o próprio `id`)
4. Se livre → persiste atualização
5. Se ocupado → exibe mensagem de erro

### Admin — Remover alocação
1. No `EditModal`, admin clica em "Remover"
2. Dialog de confirmação: "Confirmar remoção de [disciplina]?"
3. Confirma → `remove(id)` é chamado → grade atualiza
4. Cancela → nenhuma ação

---

## Tipos Relevantes

```typescript
interface Alocacao {
  id: number;
  disciplina: string;
  inicio: string;     // "HH:MM"
  fim: string;        // "HH:MM"
  sala: string;
  dia_semana: string;
  professor: string | null;
  periodo: string;
}

type AlocacaoInput = Omit<Alocacao, 'id' | 'periodo'>;
```

---

## Lógica Crítica: buildGridMatrix

Os dados têm blocos de 2–4 horas. A grade exibe slots de 1h com `rowSpan`:

```
matriz[hora][dia] = {
  type: 'allocation',  // renderizar célula com rowSpan
  type: 'skip',        // célula suprimida por rowSpan acima
  type: 'empty',       // célula livre
}
```

Cálculo de rowSpan:
```
rowSpan = (timeToMinutes(fim) - timeToMinutes(inicio)) / 60
```

---

## Restrições e Regras de Negócio

- Apenas uma alocação por sala/dia/slot de tempo
- Ao editar, o novo slot deve estar livre (exceto para a própria alocação)
- Remoção exige confirmação explícita
- `periodo` é sempre `"2026.1"` ao criar
- Grade exibe SÁBADO mesmo sem alocações
- Salas coloridas por tipo: aula (azul), inovação (roxo), laboratório (verde)

---

## Verificação (como testar)

1. `npm run dev` → acessar `/#/map` sem login
2. Selecionar "SALA 02" → grade deve exibir alocações de segunda a sábado
3. Clicar em célula com disciplina → ViewModal com todos os campos
4. Login como admin → acessar `/#/login`
5. Após login, clicar em célula vazia → AllocationForm deve abrir
6. Criar alocação → deve aparecer na grade em tempo real
7. Clicar em alocação existente → EditModal abre com dados preenchidos
8. Tentar alterar para slot ocupado → mensagem de conflito
9. Remover alocação → confirmar dialog → some da grade
