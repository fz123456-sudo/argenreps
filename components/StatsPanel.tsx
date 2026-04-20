'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type StatRow = {
  id: number
  nombre: string
  categoria: string
  imagen: string
  clicks: number
}

export default function StatsPanel() {
  const [stats, setStats]     = useState<StatRow[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState<'7' | '30' | 'todo'>('30')

  useEffect(() => {
    cargar()
  }, [periodo])

  const cargar = async () => {
    setLoading(true)

    let query = supabase
      .from('clicks')
      .select('producto_id, productos(id, nombre, categoria, imagen)')

    if (periodo !== 'todo') {
      const desde = new Date()
      desde.setDate(desde.getDate() - parseInt(periodo))
      query = query.gte('created_at', desde.toISOString())
    }

    const { data } = await query

    if (!data) { setLoading(false); return }

    // Agrupar por producto
    const map: Record<number, StatRow> = {}
    data.forEach((row: any) => {
      const p = row.productos
      if (!p) return
      if (!map[p.id]) map[p.id] = { id: p.id, nombre: p.nombre, categoria: p.categoria, imagen: p.imagen, clicks: 0 }
      map[p.id].clicks++
    })

    const sorted = Object.values(map).sort((a, b) => b.clicks - a.clicks)
    setStats(sorted)
    setTotal(data.length)
    setLoading(false)
  }

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Estadísticas</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['7', '30', 'todo'] as const).map(p => (
            <button
              key={p}
              className={periodo === p ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={() => setPeriodo(p)}
            >
              {p === '7' ? 'Últimos 7 días' : p === '30' ? 'Últimos 30 días' : 'Todo'}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>CLICKS TOTALES</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: 'var(--accent)' }}>{total}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>PRODUCTOS CON CLICKS</div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: 'var(--accent)' }}>{stats.length}</div>
        </div>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>MÁS CLICKEADO</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginTop: 4 }}>{stats[0]?.nombre || '—'}</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Cargando...</div>
      ) : stats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <p>Aún no hay clicks registrados</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Imagen</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Clicks</th>
                <th>Popularidad</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr key={s.id}>
                  <td style={{ color: i < 3 ? 'var(--accent)' : 'var(--muted)', fontWeight: 700, fontSize: 14 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </td>
                  <td>{s.imagen ? <img src={s.imagen} alt={s.nombre} /> : '—'}</td>
                  <td style={{ maxWidth: 220 }}>{s.nombre}</td>
                  <td>{s.categoria}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.clicks}</td>
                  <td style={{ minWidth: 120 }}>
                    <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                      <div style={{ background: 'var(--accent)', height: '100%', width: `${Math.round((s.clicks / (stats[0]?.clicks || 1)) * 100)}%`, transition: 'width 0.3s' }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
