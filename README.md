# Volume Profile Lab

Charts para acciones argentinas (BYMA) con Volume Profile, Bollinger, Volumen, RSI y MACD. Datos gratis vía Yahoo Finance.

## Desarrollo

```bash
npm install
npm run dev
```

Abrí `http://127.0.0.1:5173`. En local, Vite proxea `/api/yahoo/*` hacia Yahoo Finance.

## Deploy en Vercel

1. Subí el repo a GitHub.
2. En [Vercel](https://vercel.com): **Add New Project** → importá este repo.
3. Framework preset: **Vite** (build `npm run build`, output `dist`).
4. Deploy. Las funciones en `/api/yahoo/*` cubren el proxy en producción.

## Stack

- React + TypeScript + Vite
- [Lightweight Charts](https://www.tradingview.com/lightweight-charts/) (TradingView)
- Yahoo Finance (datos con delay)
