'use client'

type Props = {
  fotosQc: string[]
  onOpen: (fotos: string[]) => void
}

export default function QCButton({ fotosQc, onOpen }: Props) {
  if (!fotosQc || fotosQc.length === 0) return null

  return (
    <button
      onClick={() => onOpen(fotosQc)}
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
