'use client'

import { useState, useEffect } from 'react'

type Props = {
  linkCssbuy: string
  onOpen: (fotos: string[]) => void
}

function getMallInfo(link: string): { mallType: string; itemId: string } | null {
  const m1688 = link.match(/item-1688-(\d+)/)
  if (m1688) return { mallType: '1688', itemId: m1688[1] }
  const mWeidian = link.match(/item-micro-(\d+)/)
  if (mWeidian) return { mallType: 'WD', itemId: mWeidian[1] }
  const mTaobao = link.match(/\/item-(\d+)\.html/)
  if (mTaobao) return { mallType: 'TB', itemId: mTaobao[1] }
  return null
}

export default function QCButton({ linkCssbuy, onOpen }: Props) {
  const [fotos, setFotos] = useState<string[] | null>(null)

  useEffect(() => {
    const info = getMallInfo(linkCssbuy)
    if (!info) return

    fetch(`https://findqc.com/api/goods/detail?mallType=${info.mallType}&itemId=${info.itemId}`)
      .then(r => r.json())
      .then(d => {
        const goods = d?.data?.data
        const hasQc = goods?.hasRegularQc === 'YES' || goods?.hasPremiumQc === 'YES'
        if (!hasQc) return
        const lista = (goods?.qcList || []).map((q: any) => q.url).filter(Boolean)
        if (lista.length > 0) setFotos(lista)
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
