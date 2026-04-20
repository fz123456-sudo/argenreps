'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type Vendedor = {
  id: number
  nombre: string
  slug: string
  descripcion: string
  yupoo_url: string
  discord: string
  whatsapp: string
  imagen: string
  activo: boolean
}

export default function VendedoresList() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('vendedores')
      .select('*')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => {
        setVendedores(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <>
      <nav>
        <div className="nav-logo">ARGEN<span>REPS</span><span className="nav-badge">ARG</span></div>
        <div className="nav-links">
          <a href="/" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>← Catálogo</a>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 40, letterSpacing: 3, marginBottom: 8 }}>
            VENDEDORES <span style={{ color: 'var(--accent)' }}>VERIFICADOS</span>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>
            Sellers de confianza con catálogos completos en Yupoo
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Cargando...</div>
        ) : vendedores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
            <p>No hay vendedores disponibles</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {vendedores.map(v => (
              <a
                key={v.id}
                href={`/vendedores/${v.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="card" style={{ padding: 0, cursor: 'pointer' }}>
                  {/* Header */}
                  <div style={{ background: 'var(--bg3)', padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    {v.imagen ? (
                      <img src={v.imagen} alt={v.nombre} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontFamily: 'Bebas Neue, sans-serif', color: 'var(--bg)', fontWeight: 700 }}>
                        {v.nombre[0]}
                      </div>
                    )}
                    <div>
                      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, letterSpacing: 1, color: 'var(--white)' }}>{v.nombre}</div>
                      <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginTop: 2 }}>VERIFICADO ✓</div>
                    </div>
                  </div>

                  {/* Body */}
                  <div style={{ padding: '16px 20px' }}>
                    <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
                      {v.descripcion || 'Vendedor de reps de calidad'}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {v.discord && (
                        <span style={{ fontSize: 11, background: 'rgba(88,101,242,0.15)', color: '#7289da', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Discord</span>
                      )}
                      {v.whatsapp && (
                        <span style={{ fontSize: 11, background: 'rgba(37,211,102,0.15)', color: '#25d366', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>WhatsApp</span>
                      )}
                      {v.yupoo_url && (
                        <span style={{ fontSize: 11, background: 'rgba(117,170,219,0.15)', color: 'var(--accent)', padding: '3px 8px', borderRadius: 4, fontWeight: 600 }}>Yupoo</span>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>Ver catálogo completo</span>
                    <span style={{ color: 'var(--accent)', fontSize: 16 }}>→</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <footer>
        <p>© {new Date().getFullYear()} <strong>ArgenReps</strong></p>
        <p style={{ marginTop: 6 }}><a href="/">Catálogo</a> · <a href="/vendedores">Vendedores</a></p>
      </footer>
    </>
  )
}
