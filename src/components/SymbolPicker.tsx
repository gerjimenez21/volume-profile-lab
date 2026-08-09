import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ARGENTINE_STOCKS,
  filterArgentineStocks,
  type ArgentineStock,
} from '../lib/argentineStocks'
import { normalizeSymbol } from '../lib/symbols'
import { searchSymbols, type SymbolSuggestion } from '../lib/yahooSearch'

interface Props {
  value: string
  loading?: boolean
  onSelect: (symbol: string) => void
}

export function SymbolPicker({ value, loading, onSelect }: Props) {
  const [input, setInput] = useState(value)
  const [open, setOpen] = useState(false)
  const [remote, setRemote] = useState<SymbolSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setInput(value)
  }, [value])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const localMatches = useMemo(
    () => filterArgentineStocks(input).slice(0, 10),
    [input],
  )

  useEffect(() => {
    if (!open || input.trim().length < 1) {
      setRemote([])
      return
    }

    const handle = window.setTimeout(() => {
      setSearching(true)
      void searchSymbols(input, { bymaOnly: true })
        .then((rows) => setRemote(rows))
        .finally(() => setSearching(false))
    }, 280)

    return () => window.clearTimeout(handle)
  }, [input, open])

  const submit = (raw: string) => {
    const symbol = normalizeSymbol(raw, true)
    if (!symbol) return
    setInput(symbol)
    setOpen(false)
    onSelect(symbol)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit(input)
  }

  const showLocal = localMatches.length > 0
  const remoteFiltered = remote.filter(
    (r) => !localMatches.some((l) => l.symbol === r.symbol),
  )

  return (
    <div className="symbol-picker" ref={wrapRef}>
      <form className="search" onSubmit={onSubmit}>
        <div className="search-field">
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase())
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar acción AR (GGAL, YPFD…)"
            spellCheck={false}
            aria-label="Símbolo argentino"
            autoComplete="off"
          />
          <span className="market-tag">BYMA · .BA</span>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Cargando…' : 'Cargar'}
        </button>
      </form>

      {open && (
        <div className="symbol-menu" role="listbox">
          <div className="symbol-menu-head">
            Acciones argentinas
            {searching && <em>buscando…</em>}
          </div>

          {showLocal && (
            <ul>
              {localMatches.map((s) => (
                <StockRow
                  key={s.symbol}
                  stock={s}
                  active={s.symbol === value}
                  onPick={() => submit(s.symbol)}
                />
              ))}
            </ul>
          )}

          {remoteFiltered.length > 0 && (
            <>
              <div className="symbol-menu-head">Yahoo Finance</div>
              <ul>
                {remoteFiltered.map((s) => (
                  <li key={s.symbol}>
                    <button type="button" onClick={() => submit(s.symbol)}>
                      <strong>{s.symbol}</strong>
                      <span>{s.shortname ?? s.exchDisp ?? ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {!showLocal && remoteFiltered.length === 0 && (
            <p className="symbol-empty">
              Sin coincidencias. Probá el ticker y Enter — se agrega `.BA`
              automáticamente.
            </p>
          )}
        </div>
      )}

      <div className="presets">
        {ARGENTINE_STOCKS.filter((s) => s.kind === 'local')
          .slice(0, 8)
          .map((s) => (
            <button
              key={s.symbol}
              type="button"
              className={s.symbol === value ? 'active' : undefined}
              onClick={() => submit(s.symbol)}
              title={s.name}
            >
              {s.symbol.replace('.BA', '')}
            </button>
          ))}
      </div>
    </div>
  )
}

function StockRow({
  stock,
  active,
  onPick,
}: {
  stock: ArgentineStock
  active: boolean
  onPick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        className={active ? 'active' : undefined}
        onClick={onPick}
      >
        <strong>{stock.symbol}</strong>
        <span>
          {stock.name}
          {stock.kind === 'cedear' ? ' · CEDEAR' : ''}
        </span>
      </button>
    </li>
  )
}
