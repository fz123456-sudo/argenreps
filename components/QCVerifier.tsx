'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

function getMallInfo(link: string): { mallType: string; itemId: string } | null {
  const m1688 = link.match(/item-1688-(\d+)/)
  if (m1688) return { mallType: '1688', itemId: m1688[1] }
  const mWeidian = link.match(/item-micro-(\d+)/)
  if (mWeidian) return { mallType: 'WD', itemId: mWeidian[1] }
  const mTaobao = link.match(/\/item-(\d+)\.html/)
  if (mTaobao) return { mallType: 'TB', itemId: mTaobao[1] }
  return null
}

async function checkQC(linkCssbuy: string): Promise<boolean> {
  const info = getMallInfo(linkCssbuy)
  if (!info) return false
  try {
    const res = await fetch(
      `https://findqc.com/api/goods/detail?mallType=${info.mallType}&itemId=${info.itemId}`
    )
    const data = await res.json()
    const goods = data?.data?.data
    return goods?.hasRegularQc === 'YES' || goods?.hasPremiumQc === 'YES'
  } catch {
    return false
  }
}

export default function QCVerifier() {
  const [running, setRunning]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const [total, setTotal]         = useState(0)
  const [conQc, setConQc]         = useState(0)
  const [sinQc, setSinQc]         = useState(0)
  const [log, setLog]             = useState<string[]>([])
  const [done, setDone]           = useState(false)
  const stopRef                   = useRef(false)

  const addLog = (msg: string) => setLog(l => [...l.slice(-50), msg])

  const start = async () => {
    setRunning(true)
    setDone(false)
    stopRef.current = false
    setProgress(0)
    setConQc(0)
    setSinQc(0)
    setLog([])

    // Obtener productos sin verificar
    // Obtener todos los productos sin verificar (paginando)
    let productos: any[] = []
    let offset = 0
    while (true) {
      const { data } = await supabase
        .from('productos')
        .select('id, nombre, link_cssbuy')
        .eq('link_activo', true)
        .is('tiene_qc', null)
        .range(offset, offset + 999)
      if (!data || data.length === 0) break
      productos = [...productos, ...data]
      if (data.length < 1000) break
      offset += 1000
    }
    setTotal(productos.length)
    addLog(`Verificando ${productos.length} productos...`)

    for (let i = 0; i < productos.length; i++) {
      if (stopRef.current) break

      const p = productos[i]
      const tiene = await checkQC(p.link_cssbuy)

      await supabase
        .from('productos')
        .update({ tiene_qc: tiene })
        .eq('id', p.id)

      setProgress(i + 1)
      if (tiene) {
        setConQc(c => c + 1)
        addLog(`✓ ${p.nombre.slice(0, 40)}`)
      } else {
        setSinQc(c => c + 1)
      }

      // Pausa para no saturar FindQC
      await new Promise(r => setTimeout(r, 800))
    }

    setRunning(false)
    setDone(true)
    addLog('✅ Verificación completada')
  }

  const stop = () => {
    stopRef.current = true
    setRunning(false)
  }

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Verificación de QC</h2>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          Verifica cuáles productos tienen fotos de QC en FindQC y guarda el resultado en Supabase.
          Solo hay que hacer esto una vez. Tarda unos minutos dependiendo de cuántos productos no estén verificados.
          <br /><br />
          <strong style={{ color: 'var(--white)' }}>Importante:</strong> No cerrés esta pestaña mientras corre.
        </p>

        {!running && !done && (
          <button className="btn-primary" onClick={start}>▶ Iniciar verificación</button>
        )}
        {running && (
          <button className="btn-danger" onClick={stop}>⏹ Detener</button>
        )}
        {done && (
          <button className="btn-secondary" onClick={start}>↺ Volver a verificar</button>
        )}
      </div>

      {(running || done || progress > 0) && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>PROGRESO</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--accent)' }}>{progress}/{total}</div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>CON QC</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--success)' }}>{conQc}</div>
            </div>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>SIN QC</div>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: 'var(--muted)' }}>{sinQc}</div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div style={{ background: 'var(--bg3)', borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: 'var(--accent)', height: '100%', width: `${pct}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>{pct}% completado</div>

          {/* Log */}
          <div style={{
            background: 'var(--bg)', borderRadius: 8, padding: 12,
            height: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11
          }}>
            {log.map((l, i) => (
              <div key={i} style={{ color: l.startsWith('✓') ? 'var(--success)' : l.startsWith('✅') ? 'var(--accent)' : 'var(--muted)', marginBottom: 2 }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
