'use client'

import { useState, useEffect } from 'react'

const REGISTER_URL = 'https://www.cssbuy.com/toctoc'

export default function WelcomePopup() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('popup_seen')
    if (!seen) {
      setTimeout(() => setShow(true), 1500)
    }
  }, [])

  const cerrar = () => {
    localStorage.setItem('popup_seen', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 20, padding: '36px 32px', maxWidth: 480, width: '100%',
        position: 'relative', textAlign: 'center'
      }}>
        <button onClick={cerrar} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'var(--bg3)', border: 'none', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer', color: 'var(--muted)',
          fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>✕</button>
        <div style={{
          display: 'inline-block', background: 'rgba(117,170,219,0.15)',
          border: '1px solid var(--accent)', color: 'var(--accent)',
          padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700,
          letterSpacing: 1, marginBottom: 16, textTransform: 'uppercase'
        }}>
          🇦🇷 Bienvenido a ArgenBuy
        </div>
        <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, letterSpacing: 2, marginBottom: 12, lineHeight: 1.1 }}>
          ¿Primera vez en <span style={{ color: 'var(--accent)' }}>CSSBuy</span>?
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          Registrate con nuestro link y conseguí:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {[
            { icon: '💰', text: '40% de descuento en el service fee para siempre' },
            { icon: '🎁', text: 'Cupones de bienvenida exclusivos' },
            { icon: '📦', text: 'Acceso a miles de productos de reps al mejor precio' },
          ].map((b, i) => (
            <div key={i} style={{
              background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left'
            }}>
              <span style={{ fontSize: 20 }}>{b.icon}</span>
              <span style={{ fontSize: 13, color: 'var(--white)', fontWeight: 500 }}>{b.text}</span>
            </div>
          ))}
        </div>
        <a href={REGISTER_URL} target="_blank" rel="noopener noreferrer" onClick={cerrar} style={{
          display: 'block', background: 'var(--accent)', color: 'var(--bg)',
          padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 15,
          textDecoration: 'none', marginBottom: 12
        }}>
          Registrarme en CSSBuy con descuento →
        </a>
        <button onClick={cerrar} style={{
          background: 'none', border: 'none', color: 'var(--muted)',
          fontSize: 13, cursor: 'pointer', textDecoration: 'underline'
        }}>
          Ya tengo cuenta, ver el catálogo
        </button>
      </div>
    </div>
  )
}
