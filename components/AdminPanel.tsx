'use client'

import { useState, useEffect } from 'react'
import { supabase, type Producto, CATEGORIAS } from '@/lib/supabase'
import ImportModal from './ImportModal'
import ConfigPanel from './ConfigPanel'
import StatsPanel from './StatsPanel'
import VendedoresAdmin from './VendedoresAdmin'
import QCVerifier from './QCVerifier'

const emptyForm: Omit<Producto, 'id' | 'created_at'> = {
  nombre: '', precio: 0, categoria: 'Remeras',
  marca: '', imagen: '', link_cssbuy: '', destacado: false, estrella: false
}

export default function AdminPanel() {
  const [authed, setAuthed]         = useState<boolean | null>(null)
  const [password, setPassword]     = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [tab, setTab] = useState<'productos' | 'vendedores' | 'stats' | 'qc' | 'config'>('productos')
  const [productos, setProductos]   = useState<Producto[]>([])
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [form, setForm]             = useState<Omit<Producto, 'id' | 'created_at'>>(emptyForm)
  const [editId, setEditId]         = useState<number | null>(null)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    fetch('/api/login').then(r => r.json()).then(d => setAuthed(d.authed)).catch(() => setAuthed(false))
  }, [])

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('productos').select('*').order('id', { ascending: false })
    setProductos(data || [])
    setLoading(false)
  }

  useEffect(() => { if (authed) cargar() }, [authed])

  const login = async () => {
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (res.ok) setAuthed(true)
      else setLoginError(data.error || 'Error al iniciar sesión')
    } catch { setLoginError('Error de conexión') }
    setLoginLoading(false)
  }

  const logout = async () => {
    await fetch('/api/login', { method: 'DELETE' })
    setAuthed(false)
    setPassword('')
  }

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('add') }
  const openEdit = (p: Producto) => {
    setForm({ nombre: p.nombre, precio: p.precio, categoria: p.categoria, marca: p.marca, imagen: p.imagen, link_cssbuy: p.link_cssbuy, destacado: p.destacado, estrella: p.estrella ?? false })
    setEditId(p.id!)
    setModal('edit')
  }

  const guardar = async () => {
    setSaving(true)
    if (modal === 'add') {
      const { error } = await supabase.from('productos').insert([form])
      if (error) showToast('Error al agregar', 'err')
      else { showToast('Producto agregado ✓'); setModal(null); cargar() }
    } else {
      const { error } = await supabase.from('productos').update(form).eq('id', editId)
      if (error) showToast('Error al guardar', 'err')
      else { showToast('Producto actualizado ✓'); setModal(null); cargar() }
    }
    setSaving(false)
  }

  const eliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    const { error } = await supabase.from('productos').delete().eq('id', id)
    if (error) showToast('Error al eliminar', 'err')
    else { showToast('Producto eliminado'); cargar() }
  }

  const filtrados = productos.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) || p.marca.toLowerCase().includes(search.toLowerCase())
  )

  if (authed === null) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
      Verificando sesión...
    </div>
  )

  if (!authed) return (
    <div className="login-wrap">
      <div className="login-box">
        <h2>ARGEN<span style={{ color: 'var(--white)' }}>REPS</span></h2>
        <p>Panel de administración</p>
        <div className="form-group">
          <input type="password" className="form-input" placeholder="Contraseña" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
        </div>
        <button className="btn-primary" style={{ width: '100%' }} onClick={login} disabled={loginLoading}>
          {loginLoading ? 'Verificando...' : 'Entrar'}
        </button>
        {loginError && <p className="login-error">{loginError}</p>}
      </div>
    </div>
  )

  return (
    <>
      <nav>
        <div className="nav-logo">ARGEN<span>REPS</span><span className="nav-badge">ADMIN</span></div>
        <div className="nav-links">
          <button className={tab === 'productos' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setTab('productos')}>Productos</button>
          <button className={tab === 'vendedores' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setTab('vendedores')}>🏪 Vendedores</button>
          <button className={tab === 'stats' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setTab('stats')}>📊 Stats</button>
          <button className={tab === 'qc' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setTab('qc')}>🔍 QC</button>
          <button className={tab === 'config' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setTab('config')}>⚙️ Config</button>
          <a href="/" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>Ver sitio</a>
          {tab === 'productos' && <>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setShowImport(true)}>↑ Importar CSV</button>
            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={openAdd}>+ Agregar</button>
          </>}          <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={logout}>Salir</button>
        </div>
      </nav>

      {tab === 'config' && <ConfigPanel />}
      {tab === 'stats' && <StatsPanel />}
      {tab === 'vendedores' && <VendedoresAdmin />}
      {tab === 'qc' && <QCVerifier />}

      {tab === 'productos' && (
        <div className="admin-wrap">
          <div className="admin-header">
            <h2>Productos ({productos.length})</h2>
            <div className="search-wrap" style={{ maxWidth: 300, margin: 0 }}>
              <span className="search-icon">🔍</span>
              <input type="text" className="search-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Cargando...</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Categoría</th>
                    <th>Marca</th>
                    <th>Link</th>
                    <th>Destacado</th>
                    <th>Estrella</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(p => (
                    <tr key={p.id}>
                      <td>{p.imagen ? <img src={p.imagen} alt={p.nombre} /> : '—'}</td>
                      <td style={{ maxWidth: 200 }}>{p.nombre}</td>
                      <td>${p.precio}</td>
                      <td>{p.categoria}</td>
                      <td>{p.marca}</td>
                      <td>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 600, background: (p as any).link_activo === false ? 'rgba(224,85,85,0.15)' : 'rgba(76,175,125,0.15)', color: (p as any).link_activo === false ? 'var(--danger)' : 'var(--success)' }}>
                          {(p as any).link_activo === false ? '✗ Caído' : '✓ Activo'}
                        </span>
                      </td>
                      <td>{p.destacado ? '⭐' : '—'}</td>
                      <td>
                        <button
                          onClick={async () => {
                            await supabase.from('productos').update({ estrella: !p.estrella }).eq('id', p.id)
                            cargar()
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, opacity: p.estrella ? 1 : 0.25 }}
                          title={p.estrella ? 'Quitar de estrella' : 'Marcar como estrella'}
                        >
                          ⭐
                        </button>
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button className="btn-edit" onClick={() => openEdit(p)}>Editar</button>
                          <button className="btn-danger" onClick={() => eliminar(p.id!, p.nombre)}>Borrar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h3>{modal === 'add' ? 'Agregar Producto' : 'Editar Producto'}</h3>
            <div className="form-group"><label>Nombre</label><input className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
            <div className="form-group"><label>Precio (USD)</label><input type="number" className="form-input" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: parseFloat(e.target.value) || 0 }))} /></div>
            <div className="form-group"><label>Categoría</label>
              <select className="form-select" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Marca</label><input className="form-input" value={form.marca} onChange={e => setForm(f => ({ ...f, marca: e.target.value }))} /></div>
            <div className="form-group"><label>URL Imagen</label><input className="form-input" value={form.imagen} onChange={e => setForm(f => ({ ...f, imagen: e.target.value }))} /></div>
            <div className="form-group"><label>Link CSBuy</label><input className="form-input" value={form.link_cssbuy} onChange={e => setForm(f => ({ ...f, link_cssbuy: e.target.value }))} /></div>
            <div className="form-group">
              <label className="form-checkbox">
                <input type="checkbox" checked={form.destacado} onChange={e => setForm(f => ({ ...f, destacado: e.target.checked }))} />
                Producto destacado
              </label>
            </div>
            <div className="form-group">
              <label className="form-checkbox">
                <input type="checkbox" checked={form.estrella ?? false} onChange={e => setForm(f => ({ ...f, estrella: e.target.checked }))} />
                ⭐ Producto estrella
              </label>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {showImport && <ImportModal onClose={() => setShowImport(false)} onDone={cargar} />}
      {toast && <div className={`toast${toast.type === 'err' ? ' error' : ''}`}>{toast.msg}</div>}
    </>
  )
}
