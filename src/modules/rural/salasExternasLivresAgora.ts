import type { Alocacao } from '../../types'
import { timeToMinutes } from '../map/gridUtils'

const DIA_POR_INDICE_JS: Record<number, string> = {
  1: 'SEGUNDA',
  2: 'TERÇA',
  3: 'QUARTA',
  4: 'QUINTA',
  5: 'SEXTA',
  6: 'SÁBADO',
}

// Fim do expediente considerado quando não há mais nenhuma alocação hoje.
const FIM_EXPEDIENTE = '22:00'

export interface SalaExternaLivreAgora {
  sala: string
  livreAte: string
}

/**
 * As salas externas seguem o padrão "PREDIO - SALA XX". Extrai o nome do
 * prédio (tudo antes do primeiro " - "); se não houver separador, o nome
 * inteiro é tratado como prédio.
 */
export function getPredioDaSala(sala: string): string {
  const idx = sala.indexOf(' - ')
  return idx === -1 ? sala : sala.slice(0, idx)
}

/** Parte do nome da sala após o prédio (ex: "PREDIO - SALA 01" → "SALA 01"). */
export function getNomeSalaSemPredio(sala: string): string {
  const idx = sala.indexOf(' - ')
  return idx === -1 ? sala : sala.slice(idx + 3)
}

/** Lista de prédios únicos presentes em `salas`, em ordem alfabética. */
export function getPredios(salas: string[]): string[] {
  return Array.from(new Set(salas.map(getPredioDaSala))).sort()
}

/**
 * Versão específica do Sage Rural do cálculo de "salas livres agora" —
 * implementação própria, independente da usada no Home/Sage Map
 * (getSalasLivresAgora em modules/map/gridUtils.ts), já que as salas
 * externas não têm `tipo` (sala_aula/laboratório/inovação) e são uma lista
 * dinâmica (useSalasExternas), não a lista fixa SALAS.
 *
 * Para cada nome em `nomesSalas`, verifica se ela está livre neste exato
 * momento (nenhuma alocação de hoje cobre o horário atual) e, se estiver,
 * até que horário permanece livre — o início da próxima alocação de hoje, ou
 * o fim do expediente (22:00) caso não haja mais nenhuma. Salas ocupadas
 * agora não entram no resultado.
 */
export function getSalasExternasLivresAgora(
  nomesSalas: string[],
  alocacoes: Alocacao[],
  now: Date = new Date()
): SalaExternaLivreAgora[] {
  const diaAtual = DIA_POR_INDICE_JS[now.getDay()]
  if (!diaAtual) return []

  const minutosAgora = now.getHours() * 60 + now.getMinutes()
  const livres: SalaExternaLivreAgora[] = []

  for (const nome of nomesSalas) {
    const alocacoesHoje = alocacoes
      .filter((a) => a.sala === nome && a.dia_semana === diaAtual)
      .sort((a, b) => timeToMinutes(a.inicio) - timeToMinutes(b.inicio))

    const ocupadaAgora = alocacoesHoje.some(
      (a) => minutosAgora >= timeToMinutes(a.inicio) && minutosAgora < timeToMinutes(a.fim)
    )
    if (ocupadaAgora) continue

    const proxima = alocacoesHoje.find((a) => timeToMinutes(a.inicio) > minutosAgora)
    const livreAte =
      proxima && timeToMinutes(proxima.inicio) < timeToMinutes(FIM_EXPEDIENTE)
        ? proxima.inicio
        : FIM_EXPEDIENTE

    livres.push({ sala: nome, livreAte })
  }

  return livres
}
