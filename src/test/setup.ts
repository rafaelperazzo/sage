import '@testing-library/jest-dom'

// Recharts usa ResizeObserver, que não existe no jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Testes não acessam a rede: o client real do Supabase (criado com as variáveis
// do .env) consultaria o banco de produção e abriria o realtime. Hooks e
// lib/supabase devem ser mockados; se algum escapar, a conexão é bloqueada
// aqui e avisada no stderr (uma vez por endereço) — console.warn não serve,
// pois é descartado em alguns arquivos de teste.
const avisados = new Set<string>()
function avisarBloqueio(tipo: string, url: string) {
  const endereco = url.split('?')[0]!
  if (avisados.has(endereco)) return
  avisados.add(endereco)
  process.stderr.write(`[setup] ${tipo} bloqueado nos testes (falta mock?): ${endereco}\n`)
}

globalThis.fetch = (input: RequestInfo | URL) => {
  const url = input instanceof Request ? input.url : String(input)
  avisarBloqueio('fetch', url)
  return Promise.reject(new Error(`Rede bloqueada nos testes: ${url}`))
}

// WebSocket que nunca conecta (o realtime fica em CONNECTING, sem erro).
class WebSocketBloqueado extends EventTarget {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static readonly CLOSING = 2
  static readonly CLOSED = 3
  readonly readyState = WebSocketBloqueado.CONNECTING
  binaryType = 'blob'
  onopen = null
  onclose = null
  onerror = null
  onmessage = null
  constructor(readonly url: string | URL) {
    super()
    avisarBloqueio('WebSocket', String(url))
  }
  send() {}
  close() {}
}
globalThis.WebSocket = WebSocketBloqueado as unknown as typeof WebSocket
