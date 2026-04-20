import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url', { status: 400 })
  }

  // Solo permitir imágenes de dominios conocidos
  const allowed = ['yupoo.com', 'photo.yupoo.com', 'r2.dev', 'supabase']
  const isAllowed = allowed.some(d => url.includes(d))
  if (!isAllowed) {
    return new NextResponse('Domain not allowed', { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://yupoo.com',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      next: { revalidate: 3600 } // cache 1 hora
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
  } catch (e) {
    return new NextResponse('Error fetching image', { status: 500 })
  }
}
