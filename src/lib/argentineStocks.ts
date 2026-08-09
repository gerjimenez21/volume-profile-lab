export interface ArgentineStock {
  symbol: string
  name: string
  kind: 'local' | 'cedear'
}

/** Tickers frecuentes en BYMA (Yahoo usa sufijo .BA). */
export const ARGENTINE_STOCKS: ArgentineStock[] = [
  { symbol: 'GGAL.BA', name: 'Grupo Financiero Galicia', kind: 'local' },
  { symbol: 'YPFD.BA', name: 'YPF', kind: 'local' },
  { symbol: 'PAMP.BA', name: 'Pampa Energía', kind: 'local' },
  { symbol: 'TXAR.BA', name: 'Ternium Argentina', kind: 'local' },
  { symbol: 'ALUA.BA', name: 'Aluar', kind: 'local' },
  { symbol: 'BBAR.BA', name: 'BBVA Argentina', kind: 'local' },
  { symbol: 'BMA.BA', name: 'Banco Macro', kind: 'local' },
  { symbol: 'SUPV.BA', name: 'Grupo Supervielle', kind: 'local' },
  { symbol: 'TECO2.BA', name: 'Telecom Argentina', kind: 'local' },
  { symbol: 'CEPU.BA', name: 'Central Puerto', kind: 'local' },
  { symbol: 'TGSU2.BA', name: 'Transportadora Gas Sur', kind: 'local' },
  { symbol: 'TGNO4.BA', name: 'Transportadora Gas Norte', kind: 'local' },
  { symbol: 'TRAN.BA', name: 'Transener', kind: 'local' },
  { symbol: 'EDN.BA', name: 'Edenor', kind: 'local' },
  { symbol: 'LOMA.BA', name: 'Loma Negra', kind: 'local' },
  { symbol: 'CRES.BA', name: 'Cresud', kind: 'local' },
  { symbol: 'IRSA.BA', name: 'IRSA', kind: 'local' },
  { symbol: 'BYMA.BA', name: 'BYMA', kind: 'local' },
  { symbol: 'VALO.BA', name: 'Grupo Financiero Valores', kind: 'local' },
  { symbol: 'COME.BA', name: 'Sociedad Comercial del Plata', kind: 'local' },
  { symbol: 'MIRG.BA', name: 'Mirgor', kind: 'local' },
  { symbol: 'METR.BA', name: 'MetroGAS', kind: 'local' },
  { symbol: 'HARG.BA', name: 'Holcim Argentina', kind: 'local' },
  { symbol: 'AGRO.BA', name: 'Agrometal', kind: 'local' },
  { symbol: 'BHIP.BA', name: 'Banco Hipotecario', kind: 'local' },
  { symbol: 'CECO2.BA', name: 'Endesa Costanera', kind: 'local' },
  { symbol: 'CTIO.BA', name: 'Consultatio', kind: 'local' },
  { symbol: 'DGCU2.BA', name: 'Distribuidora Gas Cuyana', kind: 'local' },
  { symbol: 'AAPL.BA', name: 'Apple (CEDEAR)', kind: 'cedear' },
  { symbol: 'MSFT.BA', name: 'Microsoft (CEDEAR)', kind: 'cedear' },
  { symbol: 'GOOGL.BA', name: 'Alphabet (CEDEAR)', kind: 'cedear' },
  { symbol: 'AMZN.BA', name: 'Amazon (CEDEAR)', kind: 'cedear' },
  { symbol: 'TSLA.BA', name: 'Tesla (CEDEAR)', kind: 'cedear' },
  { symbol: 'NVDA.BA', name: 'NVIDIA (CEDEAR)', kind: 'cedear' },
  { symbol: 'MELI.BA', name: 'MercadoLibre (CEDEAR)', kind: 'cedear' },
  { symbol: 'KO.BA', name: 'Coca-Cola (CEDEAR)', kind: 'cedear' },
  { symbol: 'SPY.BA', name: 'SPDR S&P 500 (CEDEAR)', kind: 'cedear' },
  { symbol: 'QQQ.BA', name: 'Invesco QQQ (CEDEAR)', kind: 'cedear' },
]

export function filterArgentineStocks(query: string): ArgentineStock[] {
  const q = query.trim().toUpperCase().replace(/\.BA$/, '')
  if (!q) return ARGENTINE_STOCKS
  return ARGENTINE_STOCKS.filter(
    (s) =>
      s.symbol.replace(/\.BA$/, '').includes(q) ||
      s.name.toUpperCase().includes(q),
  )
}
