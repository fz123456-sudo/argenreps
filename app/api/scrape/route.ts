import { NextRequest, NextResponse } from 'next/server'

type ParsedUrl = {
  fuente: 'taobao' | '1688' | 'weidian' | 'yupoo' | 'desconocido'
  id: string
  link_cssbuy: string
  source_url: string
}

const PROMO = '2c0a7f5feff33147'

function parseProductUrl(raw: string): ParsedUrl | null {
  const url = raw.trim()

  // Yupoo — álbum o foto
  const mYupoo = url.match(/^https?:\/\/([^.]+)\.x\.yupoo\.com\/(albums|photos)\/(\d+)/)
  if (mYupoo) return {
    fuente: 'yupoo', id: mYupoo[3],
    link_cssbuy: '',         // se intenta extraer de la página (Weidian)
    source_url: url,
  }

  // 1688
  const m1688 = url.match(/1688\.com\/offer\/(\d+)/)
  if (m1688) return {
    fuente: '1688', id: m1688[1],
    link_cssbuy: `https://www.cssbuy.com/item-1688-${m1688[1]}.html`,
    source_url: `https://detail.1688.com/offer/${m1688[1]}.html`,
  }

  // Taobao / Tmall
  const mTaobao = url.match(/[?&]id=(\d+)/)
  if (mTaobao && (url.includes('taobao.com') || url.includes('tmall.com'))) return {
    fuente: 'taobao', id: mTaobao[1],
    link_cssbuy: `https://www.cssbuy.com/item-${mTaobao[1]}.html`,
    source_url: `https://item.taobao.com/item.htm?id=${mTaobao[1]}`,
  }

  // Weidian
  const mWeidian = url.match(/itemID=(\d+)/)
  if (mWeidian && url.includes('weidian.com')) return {
    fuente: 'weidian', id: mWeidian[1],
    link_cssbuy: `https://www.cssbuy.com/item-micro-${mWeidian[1]}.html?promotionCode=${PROMO}`,
    source_url: `https://weidian.com/item.html?itemID=${mWeidian[1]}`,
  }

  // Ya es link CSSBuy — 1688
  const mCss1688 = url.match(/cssbuy\.com\/item-1688-(\d+)/)
  if (mCss1688) return {
    fuente: '1688', id: mCss1688[1],
    link_cssbuy: url,
    source_url: `https://detail.1688.com/offer/${mCss1688[1]}.html`,
  }

  // Ya es link CSSBuy — weidian
  const mCssWd = url.match(/cssbuy\.com\/item-micro-(\d+)/)
  if (mCssWd) return {
    fuente: 'weidian', id: mCssWd[1],
    link_cssbuy: url,
    source_url: `https://weidian.com/item.html?itemID=${mCssWd[1]}`,
  }

  // Ya es link CSSBuy — taobao
  const mCssTb = url.match(/cssbuy\.com\/item-(\d+)\.html/)
  if (mCssTb) return {
    fuente: 'taobao', id: mCssTb[1],
    link_cssbuy: url,
    source_url: `https://item.taobao.com/item.htm?id=${mCssTb[1]}`,
  }

  return null
}

async function fetchYupoo(url: string) {
  const result = { nombre: '', imagen: '', link_cssbuy: '', fotos: [] as string[] }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.yupoo.com/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return result
    const html = await res.text()

    // Título del álbum
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
                 || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)
    if (ogTitle) result.nombre = ogTitle[1].trim()
    else {
      const t = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (t) result.nombre = t[1].replace(/\s*[-|].*$/, '').trim()
    }

    // Imagen cover (og:image)
    const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
               || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
    if (ogImg) {
      result.imagen = ogImg[1].replace(/^\/\//, 'https://')
    }

    // Extraer fotos del álbum (data-src de imágenes Yupoo)
    const photoMatches = html.matchAll(/data-src="(https?:\/\/[^"]*(?:photo\.yupoo\.com|r2\.dev)[^"]*(?:\.jpg|\.jpeg|\.png|\.webp)[^"]*)"/gi)
    const fotos: string[] = []
    for (const m of photoMatches) {
      if (!fotos.includes(m[1])) fotos.push(m[1])
      if (fotos.length >= 10) break
    }
    if (fotos.length > 0) {
      result.fotos = fotos
      result.imagen = fotos[0]
    }

    // Buscar link de Weidian en el texto de la página (aparece como texto plano)
    const weidianMatch = html.match(/weidian\.com\/item\.html\?itemID=(\d+)/i)
                      || html.match(/weidian\.com\/item\?itemID=(\d+)/i)
    if (weidianMatch) {
      result.link_cssbuy = `https://www.cssbuy.com/item-micro-${weidianMatch[1]}.html?promotionCode=${PROMO}`
    }

    // Buscar link de Taobao si no hay Weidian
    if (!result.link_cssbuy) {
      const taobaoMatch = html.match(/item\.taobao\.com\/item\.htm\?[^"'\s]*id=(\d+)/i)
      if (taobaoMatch) {
        result.link_cssbuy = `https://www.cssbuy.com/item-${taobaoMatch[1]}.html`
      }
    }

    // Buscar link de 1688 si no hay nada
    if (!result.link_cssbuy) {
      const m1688 = html.match(/1688\.com\/offer\/(\d+)/i)
      if (m1688) {
        result.link_cssbuy = `https://www.cssbuy.com/item-1688-${m1688[1]}.html`
      }
    }
  } catch {
    // best-effort
  }
  return result
}

async function fetchMeta(url: string) {
  const result = { nombre: '', imagen: '', precio: 0 }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return result
    const html = await res.text()

    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)
                 || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)
    if (ogTitle) result.nombre = ogTitle[1].trim()
    else {
      const t = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (t) result.nombre = t[1].trim()
    }

    const ogImg = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
               || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
    if (ogImg) result.imagen = ogImg[1].replace(/^\/\//, 'https://')

    const priceMatch = html.match(/"price":\s*"?(\d+\.?\d*)"?/)
                    || html.match(/data-price="(\d+\.?\d*)"/)
                    || html.match(/[¥￥]\s*(\d+\.?\d*)/)
    if (priceMatch) result.precio = parseFloat(priceMatch[1])
  } catch {
    // best-effort
  }
  return result
}

export async function POST(req: NextRequest) {
  let body: { url?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'invalid' }, { status: 400 }) }

  const url = typeof body.url === 'string' ? body.url.trim() : ''
  if (!url) return NextResponse.json({ error: 'URL requerida' }, { status: 400 })

  const parsed = parseProductUrl(url)
  if (!parsed) return NextResponse.json(
    { error: 'URL no reconocida. Soportamos Yupoo, 1688, Taobao, Weidian y links de CSSBuy.' },
    { status: 422 }
  )

  if (parsed.fuente === 'yupoo') {
    const data = await fetchYupoo(parsed.source_url)
    return NextResponse.json({
      fuente: 'yupoo',
      link_cssbuy: data.link_cssbuy,
      nombre: data.nombre,
      precio: 0,
      imagen: data.imagen,
      fotos: data.fotos,
    })
  }

  const meta = await fetchMeta(parsed.source_url)
  return NextResponse.json({
    fuente: parsed.fuente,
    link_cssbuy: parsed.link_cssbuy,
    nombre: meta.nombre,
    precio: meta.precio,
    imagen: meta.imagen,
    fotos: [],
  })
}
