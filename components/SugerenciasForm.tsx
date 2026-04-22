'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SugerenciasForm({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const enviar = async () => {
    const raw = url.trim()
    if (!raw) return
    setEstado('loading')
    setErrorMsg('')

    // Validar que sea URL reconocida
    const esValida = /1688\.com|taobao\.com|tmall\.com|weidian\.com|cssbuy\.com/.test(raw)
    if (!esValida) {
      setErrorMsg('Solo aceptamos links de 1688, Taobao, Weidian o CSSBuy.')
      setEstado('error')
      return
    }

    let fuente = 'desconocido'
    if (raw.includes('1688.com') || raw.includes('item-1688')) fuente = '1688'
    else if (raw.includes('taobao.com') || raw.includes('tmall.com')) fuente = 'taobao'
    else if (raw.includes('weidian.com') || raw.includes('item-micro')) fuente = 'weidian'
    else if (raw.includes('cssbuy.com')) {
      if (raw.includes('item-1688')) fuente = '1688'
      else if (raw.includes('item-micro')) fuente = 'weidian'
      else fuente = 'taobao'
    }

    const { error } = await supabase.from('sugerencias').insert({ url: raw, fuente })
    if (error) {
      setErrorMsg('Error al enviar. Intentá de nuevo.')
      setEstado('error')
    } else {
      setEstado('ok')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        {estado === 'ok' ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ marginBottom: 8 }}>¡Sugerencia enviada!</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
              La revisamos y si la aprobamos aparece en el catálogo.
            </p>
            <button className="btn-primary" onClick={onClose}>Cerrar</button>
          </div>
        ) : (
          <>
            <h3 style={{ marginBottom: 6 }}>Sugerir un producto</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
              Pegá el link del producto de 1688, Taobao, Weidian o CSSBuy y lo revisamos.
            </p>

            <div className="form-group">
              <label className="form-label">Link del producto</label>
              <input
                className="form-input"
                placeholder="https://detail.1688.com/offer/..."
                value={url}
                onChange={e => { setUrl(e.target.value); setErrorMsg('') }}
                onKeyDown={e => e.key === 'Enter' && enviar()}
                disabled={estado === 'loading'}
              />
            </div>

            {errorMsg && (
              <p style={{ color: 'var(--danger)', fontSize: 13, marginTop: -8, marginBottom: 12 }}>{errorMsg}</p>
            )}

            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button className="btn-primary" onClick={enviar} disabled={!url.trim() || estado === 'loading'}>
                {estado === 'loading' ? 'Enviando...' : 'Enviar sugerencia'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
