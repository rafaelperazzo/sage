import { useEffect, useState } from 'react'
import { useSalasManutencao } from '../../hooks/useSalasManutencao'

const OUTRO = '__outro__'

interface Props {
  value: string
  onChange: (value: string) => void
  inputClassName: string
}

export function LocalField({ value, onChange, inputClassName }: Props) {
  const { salas, loading } = useSalasManutencao()
  const [isOutro, setIsOutro] = useState(false)
  const [outroValue, setOutroValue] = useState('')
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized || loading) return
    if (value && !salas.includes(value)) {
      setIsOutro(true)
      setOutroValue(value)
    }
    setInitialized(true)
  }, [initialized, loading, salas, value])

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value
    if (v === OUTRO) {
      setIsOutro(true)
      onChange(outroValue)
    } else {
      setIsOutro(false)
      onChange(v)
    }
  }

  function handleOutroChange(e: React.ChangeEvent<HTMLInputElement>) {
    setOutroValue(e.target.value)
    onChange(e.target.value)
  }

  return (
    <div className="space-y-2">
      <select
        value={isOutro ? OUTRO : value}
        onChange={handleSelectChange}
        className={inputClassName}
        required
      >
        <option value="" disabled>{loading ? 'Carregando salas...' : 'Selecione um local...'}</option>
        {salas.map((s) => <option key={s} value={s}>{s}</option>)}
        <option value={OUTRO}>Outro...</option>
      </select>
      {isOutro && (
        <input
          value={outroValue}
          onChange={handleOutroChange}
          className={inputClassName}
          placeholder="Digite o local"
          required
        />
      )}
    </div>
  )
}
