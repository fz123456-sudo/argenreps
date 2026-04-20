import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Argen Reps — Catálogo',
  description: 'El mejor catálogo de reps para Argentina.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
