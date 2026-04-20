'use client'

import { useState, useEffect, useMemo } from 'react'
import { supabase, getFindQCUrl } from '@/lib/supabase'
import QCModal from './QCModal'
import FotoCarrusel from './FotoCarrusel'

type Vendedor = {
  id: number
  nombre: string
  slug: string
  descripcion: string
  yupoo_url: string
  discord: string
  whatsapp: string
  imagen: string
}

type Album = {
  id: number
  nombre: string
  imagen: string
  fotos: string[]
  link: string
  link_cssbuy: string
  categoria: string
}

export default function VendedorPage({ slug }: { slug: string }) {
  const [vendedor, setVendedor] = useState<Vendedor | null>(null)
  const [albums, setAlbums]     = useState<Album[]>([])
  const [categoria, setCategoria] = useState('Todos')
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qcAlbum, setQcAlbum] = useState<Album | null>(null)

  useEffect(() => {
    supabase
      .from('vendedores')
      .select('*')
      .eq('slug', slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); setLoading(false); return }
        setVendedor(data)
        return supabase
          .from('vendedor_albums')
          .select('*')
          .eq('vendedor_id', data.id)
          .neq('link_cssbuy', '')
          .order('categoria')
      })
      .then(res => {
        if (res) {
          const data = (res.data || []).map((a: any) => ({
            ...a,
            fotos: (() => {
              try { return JSON.parse(a.fotos || '[]') } catch { return a.imagen ? [a.imagen] : [] }
            })()
          }))
          setAlbums(data)
        }
        setLoading(false)
      })
  }, [slug])

  const categorias = useMemo(() => {
    const cats = Array.from(new Set(albums.map(a => a.categoria))).sort()
    return ['Todos', ...cats]
  }, [albums])

  const filtered = useMemo(() => {
    return albums.filter(a => {
      if (!a.link_cssbuy) return false
      const matchCat = categoria === 'Todos' || a.categoria === categoria
      const q = search.toLowerCase()
      const matchSearch = !q || a.nombre.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [albums, categoria, search])

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
      Cargando...
    </div>
  )

  if (notFound || !vendedor) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'var(--muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
      <p>Vendedor no encontrado</p>
      <a href="/vendedores" className="btn-primary" style={{ marginTop: 16 }}>Ver todos los vendedores</a>
    </div>
  )

  return (
    <>
      <nav>
        <div className="nav-logo">ARGEN<span>REPS</span><span className="nav-badge">ARG</span></div>
        <div className="nav-links">
          <a href="/vendedores" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>← Vendedores</a>
          <a href="/" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>Catálogo</a>
        </div>
      </nav>

      {/* Header del vendedor */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '32px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {vendedor.imagen ? (
            <img src={vendedor.imagen} alt={vendedor.nombre} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontFamily: 'Bebas Neue, sans-serif', color: 'var(--bg)', flexShrink: 0 }}>
              {vendedor.nombre[0]}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 2 }}>{vendedor.nombre}</h1>
              <span style={{ fontSize: 11, background: 'rgba(117,170,219,0.15)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>VERIFICADO ✓</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>{vendedor.descripcion}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {vendedor.yupoo_url && (
                <a href={vendedor.yupoo_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>
                  🖼 Ver en Yupoo
                </a>
              )}
              {vendedor.discord && (
                <a href={vendedor.discord} target="_blank" rel="noopener noreferrer" style={{ background: '#5865F2', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  Discord
                </a>
              )}
              {vendedor.whatsapp && (
                <a href={`https://wa.me/${vendedor.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ background: '#25d366', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 36, color: 'var(--accent)' }}>{albums.length}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>álbumes</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters">
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <div className="search-wrap" style={{ flex: 1, margin: 0 }}>
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input" placeholder="Buscar álbum..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="cats">
          {categorias.map(cat => (
            <button key={cat} className={`cat${categoria === cat ? ' active' : ''}`} onClick={() => setCategoria(cat)}>
              {cat} <span style={{ opacity: 0.6 }}>
                {cat === 'Todos' ? albums.length : albums.filter(a => a.categoria === cat).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de álbumes */}
      <div className="grid-wrap">
        <div className="results-count">{filtered.length} álbumes{categoria !== 'Todos' && ` en ${categoria}`}</div>
        <div className="grid">
          {filtered.length === 0 ? (
            <div className="empty"><div style={{ fontSize: 40, marginBottom: 12 }}>📂</div><p>No hay álbumes</p></div>
          ) : filtered.map(a => {
            const href = a.link_cssbuy
            return (
            <div key={a.id} className="card">
              <div className="card-img-wrap">
                <FotoCarrusel fotos={a.fotos} nombre={a.nombre} />
              </div>
              <div className="card-body">
                <div className="card-cat">{a.categoria}</div>
                <div className="card-name" title={a.nombre}>{a.nombre}</div>
                <a href={href} target="_blank" rel="noopener noreferrer" className="card-btn" style={{ textAlign: 'center' }}>Comprar en CSSBuy →</a>
                {getFindQCUrl(href) && (
                  <a href={getFindQCUrl(href)} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', textAlign: 'center', background: 'transparent',
                    border: '1px solid rgba(117,170,219,0.3)', color: 'var(--muted)',
                    borderRadius: 7, padding: '5px', fontSize: 11, fontWeight: 600,
                    textDecoration: 'none', marginTop: 5
                  }}>🔍 Ver QC</a>
                )}
              </div>
            </div>
            )})}
        </div>
      </div>

      {qcAlbum && (
        <QCModal
          linkCssbuy={qcAlbum.link_cssbuy}
          nombre={qcAlbum.nombre}
          onClose={() => setQcAlbum(null)}
        />
      )}

      <footer>
        <p>© {new Date().getFullYear()} <strong>ArgenBuy</strong></p>
        <p style={{ marginTop: 6 }}><a href="/">Catálogo</a> · <a href="/vendedores">Vendedores</a></p>
      </footer>
    </>
  )
}
