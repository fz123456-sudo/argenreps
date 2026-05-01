import { NextRequest, NextResponse } from 'next/server'

const store = new Map<string, { count: number; windowStart: number }>()
const WINDOW_MS = 60 * 1000
const MAX_PER_MINUTE = 20

const ALLOWED_DOMAINS = ['yupoo.com', 'photo.yupoo.com', 'r2.dev', 'supabase']

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const rec = store.get(ip)
  if (!rec || now - rec.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now })
    return false
  }
  rec.count++
  return rec.count > MAX_PER_MINUTE
}

export async function GET(req: NextRequest) {
  const ip = getIP(req)

  if (isRateLimited(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  // Solo permitir requests desde nuestro propio dominio
  const referer = req.headers.get('referer') || ''
  const host = req.headers.get('host') || ''
  if (referer && !referer.includes(host)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return new NextResponse('Missing url', { status: 400 })
  }

  const isAllowed = ALLOWED_DOMAINS.some(d => url.includes(d))
  if (!isAllowed) {
    return new NextResponse('Domain not allowed', { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.yupoo.com/',
        'Origin': 'https://www.yupoo.com',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'sec-fetch-dest': 'image',
        'sec-fetch-mode': 'no-cors',
        'sec-fetch-site': 'cross-site',
      },
      next: { revalidate: 3600 }
    })

    if (!res.ok) {
      return new NextResponse('Image not found', { status: 404 })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch {
    return new NextResponse('Error fetching image', { status: 500 })
  }
}
