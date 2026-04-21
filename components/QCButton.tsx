'use client'

import { useState, useEffect } from 'react'

type Props = {
  linkCssbuy: string
  onOpen: (fotos: string[]) => void
}

function getShopUrl(link: string): string | null {
  const mWeidian = link.match(/item-micro-(\d+)/)
  if (mWeidian) return `https://weidian.com/item.html?itemID=${mWeidian[1]}`
  const mTaobao = link.match(/\/item-(\d+)\.html/)
  if (mTaobao) return `https://item.taobao.com/item.htm?id=${mTaobao[1]}`
  const m1688 = link.match(/item-1688-(\d+)/)
  if (m1688) return `https://detail.1688.com/offer/${m1688[1]}.html`
  return null
}

async function fetchQcFotos(linkCssbuy: string): Promise<string[]> {
  const shopUrl = getShopUrl(linkCssbuy)
  if (!shopUrl) return []

  // Llamada directa desde el browser — usa cookies propias de Cloudflare
  try {
    const res = await fetch(
      `https://apiv2.ezfinds.xyz/reviews?qcLink=${encodeURIComponent(shopUrl)}&limit=20&offset=0`,
      { credentials: 'include' }
    )
    if (!res.ok) return []
    const data = await res.json()
    const fotos: string[] = []
    for (const review of (data?.results || [])) {
      for (const img of (review?.images || [])) {
        const src = typeof img === 'string' ? img : img?.url || ''
        if (src) fotos.push(src)
      }
    }
    return fotos
  } catch {
    return []
  }
}

export default function QCButton({ linkCssbuy, onOpen }: Props) {
  const [fotos, setFotos] = useState<string[] | null>(null)

  useEffect(() => {
    if (!linkCssbuy) return
    fetchQcFotos(linkCssbuy).then(f => {
      if (f.length > 0) setFotos(f)
    })
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
