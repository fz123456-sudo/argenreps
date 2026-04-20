import { NextRequest, NextResponse } from 'next/server'

function getMallType(linkCssbuy: string): { mallType: string; itemId: string } | null {
  // 1688: item-1688-ID
  const m1688 = linkCssbuy.match(/item-1688-(\d+)/)
  if (m1688) return { mallType: '1688', itemId: m1688[1] }

  // Weidian: item-micro-ID
  const mWeidian = linkCssbuy.match(/item-micro-(\d+)/)
  if (mWeidian) return { mallType: 'WD', itemId: mWeidian[1] }

  // Taobao: item-ID
  const mTaobao = linkCssbuy.match(/\/item-(\d+)\.html/)
  if (mTaobao) return { mallType: 'TB', itemId: mTaobao[1] }

  return null
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ fotos: [], hasQc: false })

  const parsed = getMallType(url)
  if (!parsed) return NextResponse.json({ fotos: [], hasQc: false })

  const { mallType, itemId } = parsed

  try {
    const res = await fetch(
      `https://findqc.com/api/goods/detail?mallType=${mallType}&itemId=${itemId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://findqc.com/',
          'Origin': 'https://findqc.com',
        },
        next: { revalidate: 3600 }
      }
    )

    if (!res.ok) return NextResponse.json({ fotos: [], hasQc: false })

    const data = await res.json()
    const goodsData = data?.data?.data

    if (!goodsData) return NextResponse.json({ fotos: [], hasQc: false })

    const hasQc = goodsData.hasRegularQc === 'YES' || goodsData.hasPremiumQc === 'YES'
    const qcList = goodsData.qcList || []
    const fotos = qcList.map((q: any) => q.url).filter(Boolean)

    return NextResponse.json({ fotos, hasQc }, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    })

  } catch {
    return NextResponse.json({ fotos: [], hasQc: false })
  }
}
