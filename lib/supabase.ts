import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export type Producto = {
  id?: number
  nombre: string
  precio: number
  categoria: string
  marca: string
  imagen: string
  link_cssbuy: string
  destacado: boolean
  estrella?: boolean
  tiene_qc?: boolean
  voto_count?: number
  created_at?: string
}

export const CATEGORIAS = [
  'Recomendados', 'Remeras', 'Pantalones', 'Abrigos', 'Zapatillas',
  'Accesorios', 'Shorts', 'Conjuntos', 'Girls'
]

export function getFindQCUrl(linkCssbuy: string): string {
  if (!linkCssbuy) return ''
  
  // 1688: item-1688-ID
  const m1688 = linkCssbuy.match(/item-1688-(\d+)/)
  if (m1688) return `https://findqc.com/detail/T1688/${m1688[1]}`
  
  // Weidian: item-micro-ID
  const mWeidian = linkCssbuy.match(/item-micro-(\d+)/)
  if (mWeidian) return `https://findqc.com/detail/TWD/${mWeidian[1]}`
  
  // Taobao: item-ID
  const mTaobao = linkCssbuy.match(/\/item-(\d+)\.html/)
  if (mTaobao) return `https://findqc.com/detail/TTB/${mTaobao[1]}`
  
  return ''
}
