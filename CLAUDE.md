# ArgenBuy — Contexto del proyecto

## Stack
- **Frontend**: Next.js 14, TypeScript
- **Base de datos**: Supabase (https://qwbmrpxcnrydxgilzxiz.supabase.co)
- **Deploy**: Vercel → repo https://github.com/fz123456-sudo/argenreps
- **Local**: C:\Users\walle\Downloads\argenreps-v3\argenreps3

## Variables de entorno
```
NEXT_PUBLIC_SUPABASE_URL=https://qwbmrpxcnrydxgilzxiz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_X7R7U4WEXVBo4bgLl901Lg_CDlt3Ocz
ADMIN_PASSWORD=agustinacano123456789
```

## Estructura
```
app/
  page.tsx              → Catálogo público
  admin/page.tsx        → Panel admin
  api/login/route.ts    → Auth server-side con rate limiting
  api/imagen/route.ts   → Proxy de imágenes (Yupoo)
  api/qc/route.ts       → QC via FindQC
components/
  CatalogPublic.tsx     → Catálogo con filtros, favoritos, búsqueda
  AdminPanel.tsx        → Panel admin (tabs: Productos/Vendedores/Stats/QC/Config)
  ImportModal.tsx       → Importar productos desde CSV
  ConfigPanel.tsx       → Configuración del sitio
  StatsPanel.tsx        → Estadísticas de clicks
  VendedoresList.tsx    → Lista de vendedores
  VendedorPage.tsx      → Página individual de vendedor con álbumes
  VendedoresAdmin.tsx   → Gestión de vendedores en admin
  WelcomePopup.tsx      → Popup de bienvenida (registro CSSBuy)
  FotoCarrusel.tsx      → Carrusel de fotos para álbumes de Yupoo
  QCModal.tsx           → Modal con fotos de QC de FindQC
  QCButton.tsx          → Botón que verifica QC on-click
  QCVerifier.tsx        → Verificador masivo de QC desde admin
lib/
  supabase.ts           → Cliente Supabase + tipos + getFindQCUrl helper
  config.ts             → Configuración del sitio desde Supabase
```

## Tablas Supabase
- **productos**: nombre, precio, categoria, marca, imagen, link_cssbuy, destacado, link_activo, tiene_qc
- **configuracion**: clave/valor (nombre sitio, colores, textos, banner, links)
- **clicks**: producto_id, created_at
- **vendedores**: nombre, slug, descripcion, yupoo_url, discord, whatsapp, imagen, activo
- **vendedor_albums**: vendedor_id, nombre, imagen, fotos (JSON), link, link_cssbuy, categoria

## Detalles importantes
- El sitio se llama **ArgenBuy**
- El agente de compras es **CSSBuy** (no CSBuy ni CSSbuy)
- Link de registro CSSBuy: https://www.cssbuy.com/toctoc
- Promo code CSSBuy: 2c0a7f5feff33147
- Las imágenes de Yupoo se sirven via proxy en /api/imagen para evitar CORS
- FindQC solo funciona desde el navegador (CORS bloquea desde servidor)
- El verificador de QC debe correrse desde localhost, no desde Vercel
- Auth del admin: server-side con cookie httpOnly, rate limiting 5 intentos/15min
- RLS de Supabase habilitado con políticas de lectura/escritura pública

## Flujo de trabajo
1. Editar archivos en C:\Users\walle\Downloads\argenreps-v3\argenreps3
2. git add . && git commit -m "descripcion" && git push
3. Vercel redeploya automáticamente
