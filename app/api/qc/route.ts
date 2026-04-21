import { NextRequest, NextResponse } from 'next/server'

function getShopUrl(linkCssbuy: string): string | null {
  const mWeidian = linkCssbuy.match(/item-micro-(\d+)/)
  if (mWeidian) return `https://weidian.com/item.html?itemID=${mWeidian[1]}`

  const mTaobao = linkCssbuy.match(/\/item-(\d+)\.html/)
  if (mTaobao) return `https://item.taobao.com/item.htm?id=${mTaobao[1]}`

  const m1688 = linkCssbuy.match(/item-1688-(\d+)/)
  if (m1688) return `https://detail.1688.com/offer/${m1688[1]}.html`

  return null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ fotos: [] })

  const shopUrl = getShopUrl(url)
  if (!shopUrl) return NextResponse.json({ fotos: [] })

  try {
    const res = await fetch(
      `https://apiv2.ezfinds.xyz/reviews?qcLink=${encodeURIComponent(shopUrl)}&limit=20&offset=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Origin': 'https://ezfinds.xyz',
          'Referer': 'https://ezfinds.xyz/',
        },
        next: { revalidate: 3600 }
      }
    )

    if (!res.ok) return NextResponse.json({ fotos: [] })

    const data = await res.json()
    console.log('[QC API] raw response:', JSON.stringify(data).slice(0, 500))

    // Extraer fotos de todas las reviews
    const fotos: string[] = []
    const results = data?.results || data?.data || data || []
    for (const review of (Array.isArray(results) ? results : [])) {
      const images = review?.images || review?.photos || review?.imageList || []
      for (const img of images) {
        const src = typeof img === 'string' ? img : img?.url || img?.src || ''
        if (src) fotos.push(src)
      }
    }

    return NextResponse.json({ fotos }, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    })

  } catch (e) {
    console.error('[QC API] error:', e)
    return NextResponse.json({ fotos: [] })
  }
}
