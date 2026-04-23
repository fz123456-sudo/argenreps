'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, type Producto } from '@/lib/supabase'
import { getConfig, type Config, defaultConfig } from '@/lib/config'
import WelcomePopup from './WelcomePopup'
import QCModal from './QCModal'
import QCButton from './QCButton'
import FotoCarrusel from './FotoCarrusel'

const REGISTER_URL = 'https://www.cssbuy.com/toctoc'

function proxyImg(src: string): string {
  if (!src) return ''
  if (src.includes('yupoo.com')) return `/api/imagen?url=${encodeURIComponent(src)}`
  return src
}

function getFavs(): number[] {
  try { return JSON.parse(localStorage.getItem('favs') || '[]') } catch { return [] }
}
function toggleFav(id: number): number[] {
  const favs = getFavs()
  const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
  localStorage.setItem('favs', JSON.stringify(next))
  return next
}

export default function ProductosEstrella() {
  const [productos, setProductos]   = useState<Producto[]>([])
  const [config, setConfig]         = useState<Config>(defaultConfig)
  const [loading, setLoading]       = useState(true)
  const [favs, setFavs]             = useState<number[]>([])
  const [qcProducto, setQcProducto] = useState<{ producto: Producto; fotos: string[] } | null>(null)

  useEffect(() => {
    setFavs(getFavs())
    async function fetchAll() {
      const { data } = await supabase
        .from('productos')
        .select('*')
        .eq('estrella', true)
        .eq('link_activo', true)
        .order('id', { ascending: false })
      return data || []
    }
    Promise.all([fetchAll(), getConfig()]).then(([all, cfg]) => {
      setProductos(all)
      setConfig(cfg)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--bg', config.color_bg)
    document.documentElement.style.setProperty('--bg2', config.color_bg)
    document.documentElement.style.setProperty('--accent', config.color_accent)
    document.documentElement.style.setProperty('--accent2', config.color_accent)
    document.documentElement.style.setProperty('--card', config.color_card)
    document.documentElement.style.setProperty('--muted', config.color_muted)
  }, [config])

  const handleFav = (id: number) => setFavs(toggleFav(id))

  const handleClick = useCallback(async (productoId: number) => {
    await supabase.from('clicks').insert([{ producto_id: productoId }])
  }, [])

  return (
    <>
      <WelcomePopup />

      <nav style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ textDecoration: 'none' }} className="nav-logo">
            {config.site_name}<span className="nav-badge">ARG</span>
          </a>
        </div>
        <div className="nav-links">
          <a href="/estrella" className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>⭐ Productos Estrella</a>
          <a href="/vendedores" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>Vendedores</a>
          <a href={config.agent_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>{config.agent_name}</a>
          <a href={config.discord_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>{config.btn_discord_text}</a>
        </div>
      </nav>

      <div style={{
        background: 'linear-gradient(90deg, #1a3a5c, #0d1b2a)',
        borderBottom: '1px solid var(--accent)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 16, flexWrap: 'wrap', textAlign: 'center'
      }}>
        <span style={{ fontSize: 13, color: 'var(--white)' }}>
          🎁 <strong>40% OFF en service fee para siempre</strong> — Registrate en CSSBuy con nuestro link
        </span>
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: 'var(--accent)', color: 'var(--bg)',
            padding: '5px 14px', borderRadius: 6,
            fontSize: 12, fontWeight: 700, textDecoration: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          Registrarme →
        </a>
      </div>

      <div style={{ padding: '24px 20px 0', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>⭐ Productos Estrella</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
          Selección curada por el equipo de ArgenBuy — los mejores productos que recomendamos.
        </p>
      </div>

      <div className="grid-wrap">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Cargando...</div>
        ) : productos.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
            <p>Todavía no hay productos estrella.</p>
          </div>
        ) : (
          <>
            <div className="results-count">{productos.length} producto{productos.length !== 1 ? 's' : ''} recomendados</div>
            <div className="grid">
              {productos.map(p => {
                const isFav = favs.includes(p.id!)
                const fotos: string[] = (() => {
                  try { const arr = JSON.parse(p.fotos || '[]'); return arr.length > 0 ? arr : [p.imagen].filter(Boolean) } catch { return [p.imagen].filter(Boolean) }
                })()
                return (
                  <div className="card" key={p.id}>
                    <div className="card-img-wrap">
                      <FotoCarrusel fotos={fotos} nombre={p.nombre} />
                      <div className="featured-badge">⭐ ESTRELLA</div>
                      <button
                        onClick={() => handleFav(p.id!)}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFav ? '#ff6b6b' : '#fff', transition: 'all 0.2s', zIndex: 2 }}
                      >
                        {isFav ? '♥' : '♡'}
                      </button>
                    </div>
                    <div className="card-body">
                      <div className="card-cat">{p.categoria}</div>
                      <div className="card-name" title={p.nombre}>{p.nombre}</div>
                      <div className="card-price">${p.precio.toFixed(2)}</div>
                      <a
                        href={p.link_cssbuy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-btn"
                        onClick={() => handleClick(p.id!)}
                      >
                        {config.btn_buy_text}
                      </a>
                      <QCButton
                        fotosQc={[]}
                        onOpen={(fotos) => setQcProducto({ producto: p, fotos })}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {qcProducto && (
        <QCModal
          fotos={qcProducto.fotos}
          nombre={qcProducto.producto.nombre}
          onClose={() => setQcProducto(null)}
        />
      )}

      <footer>
        <p>{config.footer_text}</p>
        <p style={{ marginTop: 6 }}>
          <a href={config.discord_url}>{config.btn_discord_text}</a> · <a href={config.agent_url}>{config.agent_name}</a>
        </p>
      </footer>
    </>
  )
}
