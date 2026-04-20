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
  created_at?: string
}

export const CATEGORIAS = [
  'Remeras', 'Pantalones', 'Abrigos', 'Zapatillas',
  'Accesorios', 'Shorts', 'Conjuntos', 'Girls'
]
