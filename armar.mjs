// Arma el sitio en dist/: pega la cabecera y el pie comunes en cada página, pone los íconos Phosphor y el logo en línea
// y copia estilos, scripts e imágenes. Sin dependencias: node armar.mjs (Cloudflare Pages lo corre al publicar).
// Cada página empieza con un comentario JSON: <!--{"titulo":"…","descripcion":"…","actual":"inicio","css":["inicio"],"cuerpo":{…}}-->
import { readFile, writeFile, mkdir, readdir, cp, rm } from 'node:fs/promises'
import { readdirSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'

const RAIZ = import.meta.dirname
const SRC = join(RAIZ, 'src')
const DIST = join(RAIZ, 'dist')
const SITIO = 'https://mendsalud.cl'
const indexables = [] // Para el sitemap: las páginas sin noindex
const leer = (r) => readFile(join(SRC, r), 'utf8')
const limpiarSvg = (s) => s.replace(/<\?xml[^>]*>\s*/, '').replace(/<defs>[\s\S]*?<\/defs>/, '').replace(/ class="cls-1"/g, ' fill="currentColor"').replace(/ (id|data-name)="[^"]*"/g, '')
const logo = limpiarSvg(await leer('marca/logotipo-mend-salud.svg')).replace('<svg', '<svg aria-hidden="true" focusable="false"')
const logoCorto = limpiarSvg(await leer('marca/logotipo-mend.svg')).replace('<svg', '<svg aria-hidden="true" focusable="false"')
const isotipo = limpiarSvg(await leer('marca/isotipo-mend.svg')).replace('<svg', '<svg aria-hidden="true" focusable="false"')
const icono = async (n) => (await leer(`iconos/${n}.svg`)).trim()
const cabecera = await leer('parciales/cabecera.html')
const pie = await leer('parciales/pie.html').catch(() => '')
const tamanos = JSON.parse(await leer('fotos/tamanos.json').catch(() => '{}'))

// Cada foto con versiones WebP (herramientas/imagenes.py) lleva srcset y sizes medidos (herramientas/tamanos-img.mjs):
// así el celular baja la de 480 px y no la de 1600.
const variantes = (ruta) => {
  const dir = join(SRC, dirname(ruta)), nombre = ruta.split('/').pop()
  return readdirSync(dir).map((f) => f.startsWith(`${nombre}-`) && f.match(/-(\d+)\.webp$/)).filter((m) => m && m.input === `${nombre}-${m[1]}.webp`).map((m) => +m[1]).sort((x, y) => x - y)
}
function fotosLivianas(html) {
  return html.replace(/<img\b[^>]*?\ssrc="\{\{base\}\}\/(fotos\/[^"]+)\.jpg"[^>]*>/g, (tag, ruta) => {
    const anchos = /\ssrcset=/.test(tag) ? [] : variantes(ruta)
    if (!anchos.length) return tag
    const t = tamanos[`${ruta}.jpg`] ?? {}
    const sizes = t.cel && t.esc ? `(max-width: 760px) ${t.cel}px, ${t.esc}px` : '100vw'
    return tag.replace(/<img\b/, `<img srcset="${anchos.map((w) => `{{base}}/${ruta}-${w}.webp ${w}w`).join(', ')}" sizes="${sizes}"`)
  })
}

async function reemplazar(html, actual) {
  html = html.replaceAll('{{logo-corto}}', logoCorto).replaceAll('{{logo}}', logo).replaceAll('{{isotipo}}', isotipo)
  html = html.replace(/\{\{actual:(\w+)\}\}/g, (_, n) => (n === actual ? 'aria-current="page"' : ''))
  for (const m of [...new Set(html.match(/\{\{par:\w+\}\}/g) ?? [])]) {
    const n = m.slice(6, -2)
    html = html.replaceAll(m, `<span class="ic"><span class="linea">${await icono(n)}</span><span class="lleno">${await icono(`${n}-fill`)}</span></span>`)
  }
  for (const m of [...new Set(html.match(/\{\{i:\w+\}\}/g) ?? [])]) html = html.replaceAll(m, `<span class="ic">${await icono(m.slice(4, -2))}</span>`)
  // Los íconos dobles: cada svg se posiciona solo
  return html.replaceAll('<span class="linea"><svg', '<svg class="linea"').replaceAll('<span class="lleno"><svg', '<svg class="lleno"').replace(/(<svg class="(?:linea|lleno)"[\s\S]*?<\/svg>)<\/span>/g, '$1')
}

async function pagina(origen, destino) {
  const texto = await readFile(origen, 'utf8')
  const m = texto.match(/^<!--(\{[\s\S]*?\})-->\s*/)
  const meta = m ? JSON.parse(m[1]) : {}
  const cuerpo = texto.slice(m ? m[0].length : 0)
  const base = relative(dirname(destino), DIST) || '.'
  // La dirección pública de la página y su imagen para compartir (1200 × 630, en src/compartir, la arma herramientas/compartir.mjs)
  const ruta = '/' + relative(DIST, destino).replace(/index\.html$/, '').replace(/\.html$/, '')
  const clave = ruta.split('/')[1] || 'inicio'
  const propuesta = ruta.startsWith('/propuestas/')
  const noindex = meta.noindex || propuesta
  const imagen = `${SITIO}/compartir/${['equipos', 'evidencia', 'proyecto', 'privacidad'].includes(clave) ? clave : 'inicio'}.jpg`
  if (!noindex) indexables.push(ruta)
  const compartir = noindex ? '' : `<link rel="canonical" href="${SITIO}${ruta}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Mend salud">
<meta property="og:locale" content="es_CL">
<meta property="og:url" content="${SITIO}${ruta}">
<meta property="og:title" content="${meta.titulo ?? 'Mend salud'}">
<meta property="og:description" content="${meta.descripcion ?? ''}">
<meta property="og:image" content="${imagen}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${meta.titulo ?? 'Mend salud'}">
<meta name="twitter:card" content="summary_large_image">
`
  // Los estilos van en línea en un solo bloque: cada archivo aparte era un pedido que frenaba el primer pintado (Lighthouse).
  // Las rutas relativas de los estilos (../fotos, ../marca) pasan a la base de la página.
  const hojas = ['base', 'cabecera', 'barra', ...(meta.css ?? []), ...(meta.css?.includes('paginas') ? ['fondos', 'fondos-variantes'] : [])]
  const css = `<style>\n${(await Promise.all(hojas.map((c) => leer(`estilos/${c}.css`)))).join('\n').replace(/url\((["']?)\.\.\//g, 'url($1{{base}}/')}\n</style>`
  // La barra elegida es N1 (ronda 3, 12 nov); una propuesta puede pedir otra con data-nav
  const attrs = Object.entries({ 'data-nav': 'n1', 'data-fondos': 'paneles abre marca aurora gp gr gc ge vi', ...(meta.cuerpo ?? {}) }).map(([k, v]) => ` ${k}="${v}"`).join('')
  let html = `<!doctype html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${meta.titulo ?? 'Mend salud'}</title>
<meta name="description" content="${meta.descripcion ?? ''}">
<meta name="theme-color" content="#244a53">
${noindex ? '<meta name="robots" content="noindex">\n' : compartir}<script>document.documentElement.classList.add('js')</script>
<link rel="icon" href="${base}/marca/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://use.typekit.net" crossorigin>
<link rel="preconnect" href="https://p.typekit.net" crossorigin>
<link rel="preload" as="style" href="https://use.typekit.net/tbh0wdy.css">
<link rel="stylesheet" href="https://use.typekit.net/tbh0wdy.css" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="https://use.typekit.net/tbh0wdy.css"></noscript>
${css}
</head>
<body${attrs}>
${cabecera}
<main id="contenido">
${cuerpo}
</main>
${pie}
<script src="${base}/js/sitio.js" defer></script>
</body>
</html>
`
  html = fotosLivianas(await reemplazar(html, meta.actual)).replaceAll('{{base}}', base)
  await mkdir(dirname(destino), { recursive: true })
  await writeFile(destino, html)
}

async function* recorrer(dir) {
  for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const r = join(dir, e.name)
    if (e.isDirectory()) yield* recorrer(r)
    else if (e.name.endsWith('.html')) yield r
  }
}

await rm(DIST, { recursive: true, force: true })
for (const c of ['estilos', 'js', 'marca', 'fotos', 'medios', 'compartir']) await cp(join(SRC, c), join(DIST, c), { recursive: true }).catch(() => {})
for await (const f of recorrer(join(SRC, 'paginas'))) await pagina(f, join(DIST, relative(join(SRC, 'paginas'), f)))
for await (const f of recorrer(join(RAIZ, 'propuestas'))) await pagina(f, join(DIST, 'propuestas', relative(join(RAIZ, 'propuestas'), f)))
// Sitemap y robots: solo las páginas públicas; las propuestas y la 404 quedan fuera
const hoy = new Date().toISOString().slice(0, 10)
await writeFile(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexables.sort().map((r) => `  <url><loc>${SITIO}${r}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}
</urlset>
`)
// Caché para Cloudflare Pages: fotos, marca e imágenes para compartir una semana; el JavaScript un día (los nombres no cambian)
await writeFile(join(DIST, '_headers'), ['/fotos/*', '/marca/*', '/compartir/*', '/medios/*'].map((r) => `${r}\n  Cache-Control: public, max-age=604800`).join('\n') + '\n/js/*\n  Cache-Control: public, max-age=86400\n')
await writeFile(join(DIST, 'robots.txt'), `User-agent: *
Disallow: /propuestas/

Sitemap: ${SITIO}/sitemap.xml
`)
console.log('dist listo')
