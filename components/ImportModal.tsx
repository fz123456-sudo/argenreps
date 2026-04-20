'use client'

import { useState, useRef } from 'react'
import { supabase, CATEGORIAS, type Producto } from '@/lib/supabase'

type ParsedRow = {
  nombre: string
  precio: number
  categoria: string
  marca: string
  imagen: string
  link_cssbuy: string
  destacado: boolean
  _include: boolean
}

const KNOWN_CATEGORIES = [
  'SHOES', 'BOOT', 'SLIDE', 'SNEAKER', 'SANDAL',
  'SHIRT', 'TEE', 'REMERA', 'TOP',
  'PANTS', 'JEAN', 'PANT', 'TROUSER', 'SHORT',
  'HOODIE', 'JACKET', 'COAT', 'SWEATER', 'ABRIGO',
  'ACCESSORY', 'ACCESSORIES', 'BAG', 'BELT', 'HAT',
  'DRESS', 'SKIRT',
]

function detectCategory(text: string): string {
  const upper = text.toUpperCase()
  if (upper.includes('SHOE') || upper.includes('BOOT') || upper.includes('SLIDE') || upper.includes('SNEAKER')) return 'Zapatillas'
  if (upper.includes('SHIRT') || upper.includes('TEE') || upper.includes('REMERA') || upper.includes('TOP')) return 'Remeras'
  if (upper.includes('JEAN') || upper.includes('PANT') || upper.includes('TROUSER')) return 'Pantalones'
  if (upper.includes('SHORT') || upper.includes('BERMUDA')) return 'Shorts'
  if (upper.includes('HOODIE') || upper.includes('JACKET') || upper.includes('COAT') || upper.includes('SWEATER') || upper.includes('ABRIGO')) return 'Abrigos'
  if (upper.includes('ACCESSOR') || upper.includes('BAG') || upper.includes('BELT') || upper.includes('HAT') || upper.includes('WATCH')) return 'Accesorios'
  if (upper.includes('DRESS') || upper.includes('SKIRT') || upper.includes('GIRLS')) return 'Girls'
  if (upper.includes('SET') || upper.includes('CONJUNTO') || upper.includes('TRACKSUIT')) return 'Conjuntos'
  return 'Accesorios'
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split('\n')
  const rows: ParsedRow[] = []
  let currentCategory = 'Zapatillas'

  // Encontrar la fila de headers
  const headerIdx = lines.findIndex(l => l.toLowerCase().includes('name') || l.toLowerCase().includes('nombre'))

  for (let i = Math.max(headerIdx + 1, 0); i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parsear CSV respetando comillas
    const parts: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === ',' && !inQuotes) { parts.push(current.trim()); current = '' }
      else current += ch
    }
    parts.push(current.trim())

    const col0 = parts[0]?.replace(/^"|"$/g, '').trim() || ''
    const col1 = parts[1]?.trim() || ''
    const col2 = parts[2]?.replace(/^"|"$/g, '').trim() || ''
    const col3 = parts[3]?.trim() || ''
    const col4 = parts[4]?.trim() || ''

    if (!col0) continue

    // Detectar si es fila de categoría (no tiene precio)
    const hasPrice = col2.includes('$') || col2.includes('.') || (!isNaN(parseFloat(col2)) && col2 !== '')
    const isPriceInCol1 = col1.includes('$') || (!isNaN(parseFloat(col1)) && col1 !== '')

    if (!hasPrice && !isPriceInCol1) {
      // Es una fila de categoría
      const detected = detectCategory(col0)
      currentCategory = detected
      continue
    }

    // Es un producto
    let precio = 0
    if (hasPrice) {
      precio = parseFloat(col2.replace('$', '').replace(',', '.')) || 0
    } else if (isPriceInCol1) {
      precio = parseFloat(col1.replace('$', '').replace(',', '.')) || 0
    }

    if (!col0 || precio === 0) continue

    // Link: ignorar textos como "AGENT LINK", "RAW LINK"
    const agentLink = (col3 && col3 !== 'AGENT LINK' && col3.startsWith('http')) ? col3 : ''
    const rawLink   = (col4 && col4 !== 'RAW LINK'   && col4.startsWith('http')) ? col4 : ''

    rows.push({
      nombre: col0,
      precio,
      categoria: currentCategory,
      marca: '',
      imagen: '',
      link_cssbuy: agentLink || rawLink || '',
      destacado: false,
      _include: true,
    })
  }

  return rows
}

export default function ImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [step, setStep]       = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
  const [rows, setRows]       = useState<ParsedRow[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError]     = useState('')
  const fileRef               = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      const parsed = parseCSV(text)
      if (parsed.length === 0) {
        setError('No se encontraron productos en el archivo.')
        return
      }
      setRows(parsed)
      setStep('preview')
    }
    reader.readAsText(file, 'utf-8')
  }

  const toggleRow = (i: number) => {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, _include: !row._include } : row))
  }

  const updateCat = (i: number, cat: string) => {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, categoria: cat } : row))
  }

  const importar = async () => {
    setStep('importing')
    const toImport = rows.filter(r => r._include).map(({ _include, ...rest }) => rest)
    const CHUNK = 50
    for (let i = 0; i < toImport.length; i += CHUNK) {
      const chunk = toImport.slice(i, i + CHUNK)
      await supabase.from('productos').insert(chunk)
      setProgress(Math.round(((i + CHUNK) / toImport.length) * 100))
    }
    setStep('done')
    setTimeout(() => { onDone(); onClose() }, 1500)
  }

  const included = rows.filter(r => r._include).length

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>

        {step === 'upload' && (
          <>
            <h3>Importar productos desde CSV</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Exportá el Google Sheet como CSV (Archivo → Descargar → CSV) y subilo acá.
              El importador detecta automáticamente nombres, precios y categorías.
            </p>
            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div
              style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) { const dt = new DataTransfer(); dt.items.add(f); if (fileRef.current) { fileRef.current.files = dt.files; handleFile({ target: fileRef.current } as any) } } }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Arrastrá el CSV acá o hacé click para seleccionarlo</p>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFile} />
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <h3>Previsualización — {included} de {rows.length} productos</h3>
            <p style={{ color: 'var(--muted)', fontSize: 12, marginBottom: 12 }}>
              Destildá los que no querés importar. Podés cambiar la categoría de cada uno.
            </p>
            <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg3)' }}>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--muted)' }}>✓</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--muted)' }}>Nombre</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--muted)' }}>Precio</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--muted)' }}>Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid var(--border)', opacity: r._include ? 1 : 0.35 }}>
                      <td style={{ padding: '6px 10px' }}>
                        <input type="checkbox" checked={r._include} onChange={() => toggleRow(i)} />
                      </td>
                      <td style={{ padding: '6px 10px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre}</td>
                      <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>${r.precio.toFixed(2)}</td>
                      <td style={{ padding: '6px 10px' }}>
                        <select
                          className="form-select"
                          style={{ padding: '3px 6px', fontSize: 11 }}
                          value={r.categoria}
                          onChange={e => updateCat(i, e.target.value)}
                        >
                          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setStep('upload')}>← Volver</button>
              <button className="btn-primary" onClick={importar} disabled={included === 0}>
                Importar {included} productos
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
            <h3 style={{ marginBottom: 12 }}>Importando...</h3>
            <div style={{ background: 'var(--bg3)', borderRadius: 8, height: 8, overflow: 'hidden' }}>
              <div style={{ background: 'var(--accent)', height: '100%', width: `${Math.min(progress, 100)}%`, transition: 'width 0.3s' }} />
            </div>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 10 }}>{Math.min(progress, 100)}%</p>
          </div>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3>Importación completada</h3>
          </div>
        )}

      </div>
    </div>
  )
}
