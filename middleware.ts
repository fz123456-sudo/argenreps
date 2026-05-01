import { NextRequest, NextResponse } from 'next/server'

const store = new Map<string, { count: number; windowStart: number }>()

const WINDOW_MS = 60 * 1000
const LIMITS: Record<string, number> = {
  img: 30,   // /_next/image: 30 por minuto por IP
  api: 60,   // /api/*: 60 por minuto por IP
}

const BAD_BOTS = [
  /scrapy/i,
  /python-requests/i,
  /go-http-client/i,
  /java\//i,
  /libwww/i,
  /httpclient/i,
  /zgrab/i,
  /masscan/i,
  /nmap/i,
]

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now()
  const rec = store.get(key)

  if (!rec || now - rec.windowStart > WINDOW_MS) {
    store.set(key, { count: 1, windowStart: now })
    return false
  }

  rec.count++
  return rec.count > limit
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ua = req.headers.get('user-agent') || ''
  const ip = getIP(req)

  // Bloquear bots conocidos
  if (BAD_BOTS.some(p => p.test(ua))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Proteger el optimizador de imágenes de Next.js
  if (pathname.startsWith('/_next/image')) {
    // Solo permitir si viene de nuestro propio dominio
    const referer = req.headers.get('referer') || ''
    const host = req.headers.get('host') || ''
    if (referer && !referer.includes(host)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    if (isRateLimited(`${ip}:img`, LIMITS.img)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  // Rate limit en rutas API
  if (pathname.startsWith('/api/')) {
    if (isRateLimited(`${ip}:api`, LIMITS.api)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/_next/image', '/api/:path*'],
}
