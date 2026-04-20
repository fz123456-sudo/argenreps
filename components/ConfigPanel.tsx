'use client'

import { useState, useEffect } from 'react'
import { getConfig, setConfig, defaultConfig, type Config } from '@/lib/config'

type Section = {
  title: string
  fields: { key: string; label: string; type: 'text' | 'color' | 'url' | 'textarea' }[]
}

const SECTIONS: Section[] = [
  {
    title: '📢 Banner',
    fields: [
      { key: 'banner', label: 'Texto del banner (vacío = oculto)', type: 'text' },
    ]
  },
  {
    title: '🏷️ Identidad',
    fields: [
      { key: 'site_name',    label: 'Nombre del sitio',  type: 'text' },
      { key: 'site_slogan',  label: 'Slogan',             type: 'text' },
      { key: 'site_description', label: 'Descripción',   type: 'textarea' },
      { key: 'footer_text',  label: 'Texto del footer',   type: 'text' },
    ]
  },
  {
    title: '🔗 Links',
    fields: [
      { key: 'agent_name',   label: 'Nombre del agente (ej: CSBuy)', type: 'text' },
      { key: 'agent_url',    label: 'URL del agente',     type: 'url' },
      { key: 'discord_url',  label: 'URL de Discord',     type: 'url' },
    ]
  },
  {
    title: '🦸 Hero',
    fields: [
      { key: 'hero_title_1', label: 'Título línea 1',     type: 'text' },
      { key: 'hero_title_2', label: 'Título línea 2 (color acento)', type: 'text' },
    ]
  },
  {
    title: '🔘 Botones',
    fields: [
      { key: 'btn_agent_text',   label: 'Botón principal (hero)',    type: 'text' },
      { key: 'btn_discord_text', label: 'Botón Discord (hero)',      type: 'text' },
      { key: 'btn_buy_text',     label: 'Botón comprar (productos)', type: 'text' },
    ]
  },
  {
    title: '🎨 Colores',
    fields: [
      { key: 'color_bg',     label: 'Fondo principal',    type: 'color' },
      { key: 'color_accent', label: 'Color de acento',    type: 'color' },
      { key: 'color_card',   label: 'Fondo de cards',     type: 'color' },
      { key: 'color_muted',  label: 'Texto secundario',   type: 'color' },
    ]
  },
]

export default function ConfigPanel() {
  const [config, setConfigState] = useState<Config>(defaultConfig)
  const [loading, setLoading]    = useState(true)
  const [saving, setSaving]      = useState<string | null>(null)
  const [saved, setSaved]        = useState<string | null>(null)

  useEffect(() => {
    getConfig().then(c => { setConfigState(c); setLoading(false) })
  }, [])

  const handleSave = async (key: string) => {
    setSaving(key)
    await setConfig(key, config[key])
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  const handleChange = (key: string, val: string) => {
    setConfigState(c => ({ ...c, [key]: val }))
  }

  const saveAll = async () => {
    setSaving('all')
    for (const [key, val] of Object.entries(config)) {
      await setConfig(key, val)
    }
    setSaving(null)
    setSaved('all')
    setTimeout(() => setSaved(null), 2000)
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Cargando configuración...</div>
  )

  return (
    <div className="admin-wrap">
      <div className="admin-header">
        <h2>Configuración del sitio</h2>
        <button className="btn-primary" onClick={saveAll} disabled={saving === 'all'}>
          {saving === 'all' ? 'Guardando...' : saved === 'all' ? '✓ Guardado' : 'Guardar todo'}
        </button>
      </div>

      {/* Preview en tiempo real */}
      <div style={{ background: config.color_bg, border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Preview</p>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, letterSpacing: 2, color: config.color_accent, marginBottom: 4 }}>
          {config.site_name}
        </div>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: '#fff', marginBottom: 8 }}>
          {config.hero_title_1} <span style={{ color: config.color_accent }}>{config.hero_title_2}</span>
        </div>
        <p style={{ fontSize: 13, color: config.color_muted, marginBottom: 14 }}>{config.site_description}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ background: config.color_accent, color: config.color_bg, padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600 }}>
            {config.btn_agent_text}
          </span>
          <span style={{ border: `1px solid ${config.color_accent}`, color: config.color_accent, padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600 }}>
            {config.btn_discord_text}
          </span>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <div style={{ background: config.color_card, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
            <div style={{ color: config.color_accent, fontSize: 10, marginBottom: 4 }}>ZAPATILLAS</div>
            <div style={{ color: '#fff', marginBottom: 4 }}>Nike Mind 001</div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: '#fff', marginBottom: 8 }}>$20.34</div>
            <span style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: config.color_accent, padding: '5px 10px', borderRadius: 6, fontSize: 11 }}>
              {config.btn_buy_text}
            </span>
          </div>
        </div>
      </div>

      {/* Secciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {SECTIONS.map(section => (
          <div key={section.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{section.title}</span>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {section.fields.map(field => (
                <div key={field.key} style={{ display: 'flex', alignItems: field.type === 'textarea' ? 'flex-start' : 'center', gap: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', minWidth: 200, fontWeight: 500, paddingTop: field.type === 'textarea' ? 8 : 0 }}>
                    {field.label}
                  </label>
                  <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {field.type === 'color' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="color"
                          value={config[field.key] || '#000000'}
                          onChange={e => handleChange(field.key, e.target.value)}
                          style={{ width: 40, height: 36, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 2 }}
                        />
                        <input
                          type="text"
                          className="form-input"
                          value={config[field.key] || ''}
                          onChange={e => handleChange(field.key, e.target.value)}
                          style={{ width: 120 }}
                        />
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="form-input"
                        value={config[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                        rows={3}
                        style={{ resize: 'vertical' }}
                      />
                    ) : (
                      <input
                        type={field.type === 'url' ? 'url' : 'text'}
                        className="form-input"
                        value={config[field.key] || ''}
                        onChange={e => handleChange(field.key, e.target.value)}
                      />
                    )}
                    <button
                      className="btn-edit"
                      onClick={() => handleSave(field.key)}
                      disabled={saving === field.key}
                      style={{ whiteSpace: 'nowrap', minWidth: 70 }}
                    >
                      {saving === field.key ? '...' : saved === field.key ? '✓' : 'Guardar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
