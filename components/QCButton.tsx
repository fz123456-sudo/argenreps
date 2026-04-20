'use client'

import { useState } from 'react'

type Props = {
  linkCssbuy: string
  onOpen: () => void
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
  const [state, setState] = useState<'idle' | 'checking' | 'yes' | 'no'>('idle')

  const handleHover = async () => {
    if (state !== 'idle') return
    setState('checking')

    const info = getMallInfo(linkCssbuy)
    if (!info) { setState('no'); return }

    try {
      const res = await fetch(
        `https://findqc.com/api/goods/detail?mallType=${info.mallType}&itemId=${info.itemId}`
      )
      const data = await res.json()
      const goods = data?.data?.data
      const hasQc = goods?.hasRegularQc === 'YES' || goods?.hasPremiumQc === 'YES'
      setState(hasQc ? 'yes' : 'no')
    } catch {
      setState('no')
    }
  }

  if (state === 'no') return null

  return (
    <button
      onMouseEnter={handleHover}
      onClick={state === 'yes' ? onOpen : undefined}
      style={{
        display: 'block', width: '100%', textAlign: 'center',
        background: 'transparent',
        border: `1px solid ${state === 'yes' ? 'var(--accent)' : 'rgba(117,170,219,0.3)'}`,
        color: state === 'yes' ? 'var(--accent)' : 'var(--muted)',
        borderRadius: 7, padding: '5px', fontSize: 11, fontWeight: 600,
        cursor: state === 'yes' ? 'pointer' : 'default',
        marginTop: 5, fontFamily: 'DM Sans, sans-serif',
        transition: 'all 0.3s'
      }}
    >
      {state === 'checking' ? '⏳ Verificando...' : '🔍 Ver QC'}
    </button>
  )
}
