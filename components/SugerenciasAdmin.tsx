'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, CATEGORIAS } from '@/lib/supabase'

type Sugerencia = {
  id: number
  url: string
  fuente: string
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  nota: string | null
  created_at: string
}

type ScrapedData = {
  fuente: string
  link_cssbuy: string
  nombre: string
  precio: number
  imagen: string
  fotos: string[]
}

const emptyForm = { nombre: '', precio: 0, categoria: 'Recomendados', marca: '', imagen: '', link_cssbuy: '' }

const FUENTE_LABEL: Record<string, string> = {
  '1688': '1688',
  taobao: 'Taobao',
  weidian: 'Weidian',
  yupoo: 'Yupoo',
  desconocido: '?',
}

function proxyImg(src: string) {
  if (!src) return ''
  if (src.includes('yupoo.com')) return `/api/imagen?url=${encodeURIComponent(src)}`
  return src
}

export default function SugerenciasAdmin() {
  const [lista, setLista] = useState<Sugerencia[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'pendiente' | 'aprobado' | 'rechazado'>('pendiente')
  const [aprobando, setAprobando] = useState<Sugerencia | null>(null)
  const [scraping, setScraping] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [fotosYupoo, setFotosYupoo] = useState<string[]>([])
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const cargar = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('sugerencias')
      .select('*')
      .order('created_at', { ascending: false })
    setLista(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const abrirAprobacion = async (s: Sugerencia) => {
    setAprobando(s)
    setFotosYupoo([])
    setForm({ ...emptyForm, link_cssbuy: s.url })
    setScraping(true)
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: s.url }),
      })
      if (res.ok) {
        const data: ScrapedData = await res.json()
        setFotosYupoo(data.fotos || [])
        setForm({
          nombre: data.nombre || '',
          precio: data.precio || 0,
          categoria: 'Remeras',
          marca: '',
          imagen: data.imagen || '',
          link_cssbuy: data.link_cssbuy || s.url,
        })
      }
    } catch {}
    setScraping(false)
  }

  const confirmarAprobacion = async () => {
    if (!aprobando || !form.nombre.trim()) return
    setGuardando(true)
    const { error: errProd } = await supabase.from('productos').insert([{
      nombre: form.nombre,
      precio: form.precio,
      categoria: form.categoria,
      marca: form.marca,
      imagen: form.imagen,
      link_cssbuy: form.link_cssbuy,
      destacado: false,
      estrella: false,
      link_activo: true,
    }])
    if (errProd) { showToast('Error al crear el producto', 'err'); setGuardando(false); return }

    await supabase.from('sugerencias').update({ estado: 'aprobado' }).eq('id', aprobando.id)
    showToast('Producto publicado ✓')
    setAprobando(null)
    cargar()
    setGuardando(false)
  }

  const rechazar = async (s: Sugerencia) => {
    if (!confirm('¿Rechazar esta sugerencia?')) return
    await supabase.from('sugerencias').update({ estado: 'rechazado' }).eq('id', s.id)
    showToast('Sugerencia rechazada')
    cargar()
  }

  const filtradas = lista.filter(s => s.estado === filtro)
  const pendientes = lista.filter(s => s.estado === 'pendiente').length

  return (
    <div className="admin-wrap">
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'ok' ? 'var(--accent)' : '#e53935',
          color: '#fff', padding: '10px 18px', borderRadius: 8, fontSize: 14,
        }}>
          {toast.msg}
        </div>
      )}

      <div className="admin-header">
        <h2>
          Sugerencias
          {pendientes > 0 && (
            <span style={{
              marginLeft: 10, background: '#e53935', color: '#fff',
              borderRadius: 12, padding: '2px 8px', fontSize: 12,
            }}>
              {pendientes}
            </span>
          )}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['pendiente', 'aprobado', 'rechazado'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={filtro === f ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: 12, textTransform: 'capitalize' }}
            >
              {f} ({lista.filter(s => s.estado === f).length})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Cargando...</div>
      ) : filtradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          No hay sugerencias {filtro === 'pendiente' ? 'pendientes' : filtro === 'aprobado' ? 'aprobadas' : 'rechazadas'}.
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fuente</th>
                <th>URL</th>
                <th>Fecha</th>
                {filtro === 'pendiente' && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filtradas.map(s => (
                <tr key={s.id}>
                  <td>
                    <span style={{
                      background: 'var(--bg3)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '2px 8px', fontSize: 11,
                    }}>
                      {FUENTE_LABEL[s.fuente] || s.fuente}
                    </span>
                  </td>
                  <td style={{ maxWidth: 360 }}>
                    <a
                      href={s.url} target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', fontSize: 12, wordBreak: 'break-all' }}
                    >
                      {s.url.length > 80 ? s.url.slice(0, 80) + '…' : s.url}
                    </a>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                    {new Date(s.created_at).toLocaleDateString('es-AR')}
                  </td>
                  {filtro === 'pendiente' && (
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-primary"
                          style={{ padding: '4px 12px', fontSize: 12 }}
                          onClick={() => abrirAprobacion(s)}
                        >
                          Aprobar
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 12px', fontSize: 12, color: '#e53935' }}
                          onClick={() => rechazar(s)}
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de aprobación */}
      {aprobando && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAprobando(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <h3 style={{ marginBottom: 6 }}>Aprobar sugerencia</h3>
            <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 16 }}>
              {scraping ? '⏳ Obteniendo datos del producto...' : 'Revisá los datos y completá lo que falte.'}
            </p>

            {[
              { label: 'Nombre', key: 'nombre', type: 'text', required: true },
              { label: 'Precio (USD)', key: 'precio', type: 'number', required: false },
              { label: 'Marca', key: 'marca', type: 'text', required: false },
              { label: 'Imagen (URL)', key: 'imagen', type: 'text', required: false },
              { label: 'Link CSSBuy', key: 'link_cssbuy', type: 'text', required: true },
            ].map(({ label, key, type, required }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}{required && ' *'}</label>
                <input
                  className="form-input"
                  type={type}
                  value={String(form[key as keyof typeof form])}
                  onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  disabled={scraping}
                />
              </div>
            ))}

            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select
                className="form-input"
                value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                disabled={scraping}
              >
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Galería de fotos Yupoo para elegir imagen principal */}
            {fotosYupoo.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Fotos del álbum — click para usar como imagen</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                  {fotosYupoo.map((f, i) => (
                    <img
                      key={i}
                      src={proxyImg(f)}
                      alt={`foto ${i + 1}`}
                      onClick={() => setForm(prev => ({ ...prev, imagen: f }))}
                      style={{
                        width: 64, height: 64, objectFit: 'cover', borderRadius: 6, cursor: 'pointer',
                        border: form.imagen === f ? '2px solid var(--accent)' : '2px solid var(--border)',
                        transition: 'border-color 0.15s',
                      }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {form.imagen && fotosYupoo.length === 0 && (
              <div style={{ marginBottom: 16 }}>
                <img
                  src={proxyImg(form.imagen)} alt=""
                  style={{ height: 80, width: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
            )}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setAprobando(null)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={confirmarAprobacion}
                disabled={scraping || guardando || !form.nombre.trim() || !form.link_cssbuy.trim()}
              >
                {guardando ? 'Publicando...' : 'Confirmar y publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
