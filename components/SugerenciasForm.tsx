'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const ES_VALIDA = /yupoo\.com|1688\.com|taobao\.com|tmall\.com|weidian\.com|cssbuy\.com/

function detectarFuente(url: string): string {
  if (url.includes('yupoo.com'))   return 'yupoo'
  if (url.includes('1688.com') || url.includes('item-1688')) return '1688'
  if (url.includes('taobao.com') || url.includes('tmall.com')) return 'taobao'
  if (url.includes('weidian.com') || url.includes('item-micro')) return 'weidian'
  if (url.includes('cssbuy.com')) return 'taobao'
  return 'desconocido'
}

export default function SugerenciasForm({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const enviar = async () => {
    const raw = url.trim()
    if (!raw) return
    setEstado('loading')
    setErrorMsg('')

    if (!ES_VALIDA.test(raw)) {
      setErrorMsg('Pegá un link de Yupoo, 1688, Taobao, Weidian o CSSBuy.')
      setEstado('error')
      return
    }

    const { error } = await supabase.from('sugerencias').insert({ url: raw, fuente: detectarFuente(raw) })
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
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
              Pegá el link del artículo. Preferentemente de <strong style={{ color: 'var(--white)' }}>Yupoo</strong> para que tengamos fotos y título automáticamente.
              También aceptamos 1688, Taobao, Weidian y CSSBuy.
            </p>

            <div style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12,
              color: 'var(--muted)', lineHeight: 1.7,
            }}>
              <strong style={{ color: 'var(--white)' }}>Ejemplos de links válidos:</strong><br />
              • <code style={{ fontSize: 11 }}>https://TIENDA.x.yupoo.com/albums/12345678</code><br />
              • <code style={{ fontSize: 11 }}>https://detail.1688.com/offer/123456.html</code><br />
              • <code style={{ fontSize: 11 }}>https://item.taobao.com/item.htm?id=123456</code>
            </div>

            <div className="form-group">
              <label className="form-label">Link del producto</label>
              <input
                className="form-input"
                placeholder="https://tienda.x.yupoo.com/albums/..."
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
