'use client'

import { useState } from 'react'

type Props = {
  fotos: string[]
  nombre: string
  onClose: () => void
}

export default function QCModal({ fotos, nombre, onClose }: Props) {
  const [current, setCurrent] = useState(0)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20, backdropFilter: 'blur(4px)'
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{
          padding: '14px 18px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 2 }}>FOTOS DE CALIDAD</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--white)' }}>{nombre}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg3)', border: 'none', borderRadius: '50%',
            width: 32, height: 32, cursor: 'pointer', color: 'var(--muted)',
            fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div>
            <div style={{ position: 'relative', background: '#000' }}>
              <img
                src={fotos[current]}
                alt={`QC ${current + 1}`}
                style={{ width: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }}
              />
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.7)', borderRadius: 6,
                padding: '3px 8px', fontSize: 11, color: '#fff'
              }}>
                {current + 1} / {fotos.length}
              </div>
              {fotos.length > 1 && <>
                <button onClick={() => setCurrent(i => (i - 1 + fotos.length) % fotos.length)} style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18
                }}>‹</button>
                <button onClick={() => setCurrent(i => (i + 1) % fotos.length)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%',
                  width: 36, height: 36, cursor: 'pointer', color: '#fff', fontSize: 18
                }}>›</button>
              </>}
            </div>
            {fotos.length > 1 && (
              <div style={{
                display: 'flex', gap: 6, padding: '10px 14px',
                overflowX: 'auto', background: 'var(--bg3)'
              }}>
                {fotos.map((f, i) => (
                  <img key={i} src={f} alt={`thumb ${i + 1}`} onClick={() => setCurrent(i)}
                    style={{
                      width: 56, height: 56, objectFit: 'cover', borderRadius: 6,
                      cursor: 'pointer', flexShrink: 0,
                      border: i === current ? '2px solid var(--accent)' : '2px solid transparent',
                      opacity: i === current ? 1 : 0.6, transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
