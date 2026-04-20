import { supabase } from './supabase'

export type Config = Record<string, string>

export const defaultConfig: Config = {
  site_name: 'ArgenReps',
  site_slogan: 'El catálogo argentino de reps',
  site_description: 'Más de 900 productos seleccionados con links directos a CSBuy.',
  discord_url: 'https://discord.gg/argenreps',
  agent_url: 'https://www.cssbuy.com',
  agent_name: 'CSBuy',
  hero_title_1: 'El catálogo',
  hero_title_2: 'argentino de reps',
  btn_buy_text: 'Comprar en CSBuy',
  btn_agent_text: 'Ir a CSBuy →',
  btn_discord_text: 'Discord',
  color_bg: '#0d1b2a',
  color_accent: '#75aadb',
  color_card: '#122233',
  color_muted: '#8aaabf',
  footer_text: '© 2025 ArgenReps. Todos los derechos reservados.',
  banner: '',
}

export async function getConfig(): Promise<Config> {
  const { data } = await supabase.from('configuracion').select('clave, valor')
  if (!data) return defaultConfig
  const config = { ...defaultConfig }
  data.forEach(({ clave, valor }) => { config[clave] = valor })
  return config
}

export async function setConfig(clave: string, valor: string) {
  return supabase
    .from('configuracion')
    .upsert({ clave, valor }, { onConflict: 'clave' })
}
