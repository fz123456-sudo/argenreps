import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const rateMap = new Map<string, { count: number; resetAt: number }>()
const MAX_VOTES = 15
const WINDOW_MS = 10 * 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(ip)
  }
}, 5 * 60 * 1000)

function checkRate(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  if (entry.count >= MAX_VOTES) return false
  entry.count++
  return true
}

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export async function POST(req: NextRequest) {
  const ip = getIP(req)

  if (!checkRate(ip)) {
    return NextResponse.json(
      { error: 'Demasiados votos. Intentá en unos minutos.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const { producto_id, voter_id } = body as { producto_id: unknown; voter_id: unknown }

  if (!Number.isInteger(producto_id) || (producto_id as number) <= 0) {
    return NextResponse.json({ error: 'Producto inválido' }, { status: 400 })
  }

  if (typeof voter_id !== 'string' || !UUID_RE.test(voter_id)) {
    return NextResponse.json({ error: 'Identificador inválido' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('votos')
    .insert({ producto_id, voter_id })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'already_voted' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
