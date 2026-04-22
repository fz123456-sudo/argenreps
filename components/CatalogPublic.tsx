'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { supabase, type Producto, getFindQCUrl } from '@/lib/supabase'
import { getConfig, type Config, defaultConfig } from '@/lib/config'
import WelcomePopup from './WelcomePopup'
import QCModal from './QCModal'
import QCButton from './QCButton'

const REGISTER_URL = 'https://www.cssbuy.com/toctoc'

function proxyImg(src: string): string {
  if (!src) return ''
  if (src.includes('yupoo.com')) return `/api/imagen?url=${encodeURIComponent(src)}`
  return src
}

type SortOption = 'nuevos' | 'precio_asc' | 'precio_desc'

function getFavs(): number[] {
  try { return JSON.parse(localStorage.getItem('favs') || '[]') } catch { return [] }
}
function toggleFav(id: number): number[] {
  const favs = getFavs()
  const next = favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
  localStorage.setItem('favs', JSON.stringify(next))
  return next
}

export default function CatalogPublic() {
  const [productos, setProductos]   = useState<Producto[]>([])
  const [config, setConfigState]    = useState<Config>(defaultConfig)
  const [categoria, setCategoria]   = useState('Todos')
  const [search, setSearch]         = useState('')
  const [sort, setSort]             = useState<SortOption>('nuevos')
  const [minPrecio, setMinPrecio]   = useState('')
  const [maxPrecio, setMaxPrecio]   = useState('')
  const [showFavs, setShowFavs]     = useState(false)
  const [favs, setFavs]             = useState<number[]>([])
  const [loading, setLoading]       = useState(true)
  const [qcProducto, setQcProducto] = useState<{ producto: Producto; fotos: string[] } | null>(null)
  const [banner, setBanner]         = useState('')

  useEffect(() => {
    setFavs(getFavs())
    async function fetchAll() {
      const PAGE = 1000
      let all: Producto[] = []
      let from = 0
      while (true) {
        const { data } = await supabase
          .from('productos')
          .select('*')
          .eq('link_activo', true)
          .range(from, from + PAGE - 1)
        if (!data || data.length === 0) break
        all = all.concat(data)
        if (data.length < PAGE) break
        from += PAGE
      }
      return all
    }
    Promise.all([fetchAll(), getConfig()]).then(([all, cfg]) => {
      setProductos(all)
      setConfigState(cfg)
      setBanner(cfg.banner || '')
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

  const categorias = useMemo(() => {
    const cats = Array.from(new Set(productos.map(p => p.categoria).filter(Boolean))).sort()
    return ['Todos', 'Favoritos', ...cats]
  }, [productos])

  const countFor = (cat: string) => {
    if (cat === 'Todos') return productos.length
    if (cat === 'Favoritos') return favs.length
    return productos.filter(p => p.categoria === cat).length
  }

  const filtered = useMemo(() => {
    let list = [...productos]

    if (categoria === 'Favoritos') {
      list = list.filter(p => favs.includes(p.id!))
    } else if (categoria !== 'Todos') {
      list = list.filter(p => p.categoria === categoria)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.nombre.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q))
    }

    if (minPrecio) list = list.filter(p => p.precio >= parseFloat(minPrecio))
    if (maxPrecio) list = list.filter(p => p.precio <= parseFloat(maxPrecio))

    if (sort === 'precio_asc')  list.sort((a, b) => a.precio - b.precio)
    if (sort === 'precio_desc') list.sort((a, b) => b.precio - a.precio)

    return list
  }, [productos, categoria, search, sort, minPrecio, maxPrecio, favs])

  return (
    <>
      <WelcomePopup />

      <nav style={{ flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ textDecoration: 'none' }} className="nav-logo">
            {config.site_name}<span className="nav-badge">ARG</span>
          </a>
          {!loading && (
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{productos.length} productos</span>
          )}
        </div>
        <div className="nav-links">
          <a href="/vendedores" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>Vendedores</a>
          <button
            onClick={() => { setCategoria('Favoritos'); setShowFavs(true) }}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: 12, position: 'relative' }}
          >
            ♥ Favs {favs.length > 0 && <span style={{ background: 'var(--accent)', color: 'var(--bg)', borderRadius: 10, padding: '0 5px', fontSize: 10, marginLeft: 4 }}>{favs.length}</span>}
          </button>
          <a href={config.agent_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>{config.agent_name}</a>
          <a href={config.discord_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }}>{config.btn_discord_text}</a>
        </div>
      </nav>

      {/* Banner de registro — siempre visible */}
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

      {/* Banner editable desde admin */}
      {banner && (
        <div style={{ background: 'var(--accent)', color: 'var(--bg)', textAlign: 'center', padding: '10px 20px', fontSize: 13, fontWeight: 600 }}>
          {banner}
        </div>
      )}

      <div className="filters">
        {/* Búsqueda */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ flex: 1, minWidth: 200, margin: 0 }}>
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input" placeholder="Buscar por nombre o marca..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {/* Precio min/max */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input type="number" className="search-input" placeholder="$ Min" value={minPrecio} onChange={e => setMinPrecio(e.target.value)} style={{ width: 80, paddingLeft: 12 }} />
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>—</span>
            <input type="number" className="search-input" placeholder="$ Max" value={maxPrecio} onChange={e => setMaxPrecio(e.target.value)} style={{ width: 80, paddingLeft: 12 }} />
          </div>

          {/* Ordenar */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortOption)}
            style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', color: 'var(--white)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', outline: 'none' }}
          >
            <option value="nuevos">Más nuevos</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
          </select>
        </div>

        {/* Categorías */}
        <div className="cats">
          {categorias.map(cat => (
            <button key={cat} className={`cat${categoria === cat ? ' active' : ''}`} onClick={() => setCategoria(cat)}>
              {cat === 'Favoritos' ? '♥ ' : ''}{cat} <span style={{ opacity: 0.6 }}>{countFor(cat)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-wrap">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Cargando productos...</div>
        ) : (
          <>
            <div className="results-count">
              {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              {search && ` para "${search}"`}
              {categoria !== 'Todos' && ` en ${categoria}`}
              {(minPrecio || maxPrecio) && ` · $${minPrecio || '0'} — $${maxPrecio || '∞'}`}
            </div>
            <div className="grid">
              {filtered.length === 0 ? (
                <div className="empty"><div style={{ fontSize: 40, marginBottom: 12 }}>📦</div><p>No hay productos</p></div>
              ) : filtered.map(p => {
                const isFav = favs.includes(p.id!)
                return (
                  <div className="card" key={p.id}>
                    <div className="card-img-wrap">
                      {p.imagen
                        ? <img src={proxyImg(p.imagen)} alt={p.nombre} className="card-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        : <div className="card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Sin imagen</div>
                      }
                      {p.destacado && <div className="featured-badge">★ DESTACADO</div>}
                      {/* Botón favorito */}
                      <button
                        onClick={() => handleFav(p.id!)}
                        style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isFav ? '#ff6b6b' : '#fff', transition: 'all 0.2s' }}
                      >
                        {isFav ? '♥' : '♡'}
                      </button>
                    </div>
                    <div className="card-body">
                      <div className="card-cat">{p.categoria}</div>
                      <div className="card-name" title={p.nombre}>{p.nombre}</div>
                      <div className="card-price">¥{p.precio.toFixed(2)}</div>
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
                        linkCssbuy={p.link_cssbuy}
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
