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

const emptyForm = {
  nombre: '', slug: '', descripcion: '',
  yupoo_url: '', discord: '', whatsapp: '', imagen: '', activo: true
}

export default function VendedoresAdmin() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [loading, setLoading]       = useState(true)
  const [modal, setModal]           = useState<'add' | 'edit' | null>(null)
  const [form, setForm]             = useState(emptyForm)
  const [editId, setEditId]         = useState<number | null>(null)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const cargar = async () => {
    setLoading(true)
    const { data } = await supabase.from('vendedores').select('*').order('nombre')
    setVendedores(data || [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setModal('add') }
  const openEdit = (v: Vendedor) => {
    setForm({ nombre: v.nombre, slug: v.slug, descripcion: v.descripcion || '', yupoo_url: v.yupoo_url || '', discord: v.discord || '', whatsapp: v.whatsapp || '', imagen: v.imagen || '', activo: v.activo })
    setEditId(v.id)
    setModal('edit')
  }

  const guardar = async () => {
    setSaving(true)
    if (modal === 'add') {
      const { error } = await supabase.from('vendedores').insert([form])
      if (error) showToast('Error al agregar: ' + error.message, 'err')
      else { showToast('Vendedor agregado ✓'); setModal(null); cargar() }
    } else {
      const { error } = await supabase.from('vendedores').update(form).eq('id', editId)
      if (error) showToast('Error al guardar', 'err')
      else { showToast('Vendedor actualizado ✓'); setModal(null); cargar() }
    }
    setSaving(false)
  }

  const toggleActivo = async (v: Vendedor) => {
    await supabase.from('vendedores').update({ activo: !v.activo }).eq('id', v.id)
    cargar()
  }

  const eliminar = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}" y todos sus álbumes?`)) return
    const { error } = await supabase.from('vendedores').delete().eq('id', id)
    if (error) showToast('Error al eliminar', 'err')
    else { showToast('Vendedor eliminado'); cargar() }
  }

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Vendedores ({vendedores.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/vendedores" target="_blank" className="btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>Ver página →</a>
          <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={openAdd}>+ Agregar</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Cargando...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {vendedores.map(v => (
            <div key={v.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              {v.imagen ? (
                <img src={v.imagen} alt={v.nombre} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: 'var(--bg)', flexShrink: 0 }}>
                  {v.nombre[0]}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{v.nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>/vendedores/{v.slug}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 600, background: v.activo ? 'rgba(76,175,125,0.15)' : 'rgba(224,85,85,0.15)', color: v.activo ? 'var(--success)' : 'var(--danger)' }}>
                  {v.activo ? '✓ Activo' : '✗ Oculto'}
                </span>
                <button className="btn-edit" onClick={() => toggleActivo(v)} style={{ fontSize: 11 }}>
                  {v.activo ? 'Ocultar' : 'Activar'}
                </button>
                <button className="btn-edit" onClick={() => openEdit(v)}>Editar</button>
                <button className="btn-danger" onClick={() => eliminar(v.id, v.nombre)}>Borrar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h3>{modal === 'add' ? 'Agregar Vendedor' : 'Editar Vendedor'}</h3>
            <div className="form-group"><label>Nombre</label><input className="form-input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} /></div>
            <div className="form-group"><label>Slug (URL) ej: goat</label><input className="form-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/\s/g, '-') }))} /></div>
            <div className="form-group"><label>Descripción</label><input className="form-input" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} /></div>
            <div className="form-group"><label>URL Yupoo</label><input className="form-input" value={form.yupoo_url} onChange={e => setForm(f => ({ ...f, yupoo_url: e.target.value }))} /></div>
            <div className="form-group"><label>Discord</label><input className="form-input" value={form.discord} onChange={e => setForm(f => ({ ...f, discord: e.target.value }))} /></div>
            <div className="form-group"><label>WhatsApp</label><input className="form-input" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
            <div className="form-group"><label>URL Imagen/Logo</label><input className="form-input" value={form.imagen} onChange={e => setForm(f => ({ ...f, imagen: e.target.value }))} /></div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast${toast.type === 'err' ? ' error' : ''}`}>{toast.msg}</div>}
    </div>
  )
}
