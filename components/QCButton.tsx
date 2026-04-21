'use client'

import { useState, useEffect } from 'react'

type Props = {
  linkCssbuy: string
  onOpen: (fotos: string[]) => void
}

export default function QCButton({ linkCssbuy, onOpen }: Props) {
  const [fotos, setFotos] = useState<string[] | null>(null)

  useEffect(() => {
    if (!linkCssbuy) return
    fetch(`/api/qc?url=${encodeURIComponent(linkCssbuy)}`)
      .then(r => r.json())
      .then(d => {
        if (d.fotos?.length > 0) setFotos(d.fotos)
      })
      .catch(() => {})
  }, [linkCssbuy])

  if (!fotos) return null

  return (
    <button
      onClick={() => onOpen(fotos)}
      style={{
        display: 'block', width: '100%', textAlign: 'center',
        background: 'transparent',
        border: '1px solid var(--accent)',
        color: 'var(--accent)',
        borderRadius: 7, padding: '5px', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', marginTop: 5, fontFamily: 'DM Sans, sans-serif',
      }}
    >
      🔍 Ver QC
    </button>
  )
}
