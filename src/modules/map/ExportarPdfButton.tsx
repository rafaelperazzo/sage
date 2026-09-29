import { useState } from 'react'
import { FileDown, RefreshCw } from 'lucide-react'

interface ExportarPdfButtonProps {
  onExport: () => Promise<void>
  disabled?: boolean
}

export function ExportarPdfButton({ onExport, disabled }: ExportarPdfButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setExporting(true)
    setError(null)
    try {
      await onExport()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar o PDF.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {exporting ? <RefreshCw size={13} className="animate-spin" /> : <FileDown size={13} />}
        {exporting ? 'Gerando...' : 'Exportar PDF'}
      </button>
    </div>
  )
}
