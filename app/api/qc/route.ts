import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url || !url.includes('cssbuy.com')) {
    return NextResponse.json({ fotos: [] })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.cssbuy.com',
      }
    })

    if (!res.ok) return NextResponse.json({ fotos: [] })

    const html = await res.text()

    // Extraer fotos WH — aparecen como ossimg URLs
    const fotos: string[] = []
    
    // Patrón 1: ossimg en el HTML
    const ossPattern = /https:\/\/www\.cssbuy\.com\/web\/ossimg\?id=[^"'\s]+/g
    const ossMatches = html.match(ossPattern) || []
    fotos.push(...ossMatches)

    // Patrón 2: fotos en JSON embebido
    const jsonPattern = /"warehouseImgList"\s*:\s*\[([^\]]+)\]/
    const jsonMatch = html.match(jsonPattern)
    if (jsonMatch) {
      const urls = jsonMatch[1].match(/"([^"]+)"/g)
      if (urls) {
        urls.forEach(u => {
          const clean = u.replace(/"/g, '')
          if (clean.startsWith('http')) fotos.push(clean)
        })
      }
    }

    // Patrón 3: data-src con ossimg
    const dataSrcPattern = /data-src="(https:\/\/www\.cssbuy\.com\/web\/ossimg[^"]+)"/g
    let m
    while ((m = dataSrcPattern.exec(html)) !== null) {
      fotos.push(m[1])
    }

    // Deduplicar
    const unique = [...new Set(fotos)]

    return NextResponse.json({ fotos: unique }, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    })

  } catch (e) {
    return NextResponse.json({ fotos: [] })
  }
}
