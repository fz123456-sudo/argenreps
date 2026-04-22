'use client'

import { useState } from 'react'

function proxyImg(src: string): string {
  if (!src) return ''
  if (src.includes('yupoo.com')) return `/api/imagen?url=${encodeURIComponent(src)}`
  return src
}

export default function FotoCarrusel({ fotos, nombre }: { fotos: string[], nombre: string }) {
  const [current, setCurrent] = useState(0)

  if (!fotos || fotos.length === 0) return (
    <div className="card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 32, aspectRatio: '1' }}>🖼</div>
  )

  if (fotos.length === 1) return (
    <img src={proxyImg(fotos[0])} alt={nombre} className="card-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
  )

  const prev = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrent(i => (i - 1 + fotos.length) % fotos.length)
  }
  const next = (e: React.MouseEvent) => {
    e.preventDefault()
    setCurrent(i => (i + 1) % fotos.length)
  }

  // Precargar fotos adyacentes para navegacion instantanea
  const preload = [
    fotos[(current + 1) % fotos.length],
    fotos[(current + 2) % fotos.length],
    fotos[(current - 1 + fotos.length) % fotos.length],
  ].filter((f, i, arr) => f !== fotos[current] && arr.indexOf(f) === i)

  return (
    <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden' }}>
      {preload.map(f => (
        <img key={f} src={proxyImg(f)} alt="" style={{ display: 'none' }} />
      ))}
      <img
        src={proxyImg(fotos[current])}
        alt={`${nombre} ${current + 1}`}
        className="card-img"
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />

      {/* Botones prev/next */}
      <button onClick={prev} style={{
        position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
        width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>‹</button>
      <button onClick={next} style={{
        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
        width: 26, height: 26, cursor: 'pointer', color: '#fff', fontSize: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>›</button>

      {/* Indicador */}
      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 4
      }}>
        {fotos.map((_, i) => (
          <div key={i} onClick={(e) => { e.preventDefault(); setCurrent(i) }} style={{
            width: i === current ? 16 : 6, height: 6,
            borderRadius: 3, cursor: 'pointer',
            background: i === current ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
            transition: 'all 0.2s'
          }} />
        ))}
      </div>

      {/* Contador */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        background: 'rgba(0,0,0,0.6)', borderRadius: 4,
        padding: '2px 6px', fontSize: 10, color: '#fff'
      }}>
        {current + 1}/{fotos.length}
      </div>
    </div>
  )
}
