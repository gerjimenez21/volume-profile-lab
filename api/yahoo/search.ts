import type { VercelRequest, VercelResponse } from '@vercel/node'

const YAHOO_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (compatible; VolumeProfileLab/1.0; +https://vercel.app)',
  Accept: 'application/json',
}

/** Proxies Yahoo Finance symbol search for production (Vercel). */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(req.query)) {
    if (value == null) continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item)
    } else {
      params.set(key, value)
    }
  }

  const url = `https://query1.finance.yahoo.com/v1/finance/search?${params}`

  try {
    const upstream = await fetch(url, { headers: YAHOO_HEADERS })
    const body = await upstream.text()
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return res.status(upstream.status).send(body)
  } catch {
    return res.status(502).json({ error: 'Yahoo Finance unavailable' })
  }
}
