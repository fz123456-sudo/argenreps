import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// Rate limiting en memoria (se resetea al reiniciar el servidor)
const attempts: Record<string, { count: number; lastAttempt: number }> = {}

const MAX_ATTEMPTS = 5
const BLOCK_DURATION = 15 * 60 * 1000 // 15 minutos
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 horas

// Tokens válidos en memoria
const validTokens = new Set<string>()

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
}

function isBlocked(ip: string): boolean {
  const a = attempts[ip]
  if (!a) return false
  if (a.count >= MAX_ATTEMPTS) {
    if (Date.now() - a.lastAttempt < BLOCK_DURATION) return true
    // Pasaron los 15 min, resetear
    delete attempts[ip]
  }
  return false
}

function registerAttempt(ip: string) {
  if (!attempts[ip]) attempts[ip] = { count: 0, lastAttempt: 0 }
  attempts[ip].count++
  attempts[ip].lastAttempt = Date.now()
}

function resetAttempts(ip: string) {
  delete attempts[ip]
}

// POST /api/login — autenticar
export async function POST(req: NextRequest) {
  const ip = getIP(req)

  if (isBlocked(ip)) {
    return NextResponse.json(
      { error: 'Demasiados intentos. Bloqueado por 15 minutos.' },
      { status: 429 }
    )
  }

  const { password } = await req.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json({ error: 'Servidor mal configurado' }, { status: 500 })
  }

  if (password !== adminPassword) {
    registerAttempt(ip)
    const remaining = MAX_ATTEMPTS - (attempts[ip]?.count || 0)
    return NextResponse.json(
      { error: `Contraseña incorrecta. ${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.` },
      { status: 401 }
    )
  }

  // Login correcto
  resetAttempts(ip)
  const token = randomBytes(32).toString('hex')
  validTokens.add(token)

  // Limpiar token después de 24hs
  setTimeout(() => validTokens.delete(token), SESSION_DURATION)

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24hs
    path: '/',
  })
  return res
}

// GET /api/login — verificar sesión
export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (!token || !validTokens.has(token)) {
    return NextResponse.json({ authed: false }, { status: 401 })
  }
  return NextResponse.json({ authed: true })
}

// DELETE /api/login — cerrar sesión
export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('admin_token')?.value
  if (token) validTokens.delete(token)
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_token')
  return res
}
