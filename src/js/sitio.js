// Mend · sitio. Cápsula de la barra, tono de la cabecera según lo que pasa debajo, menú del celular y paso del inicio.
const cab = document.querySelector('.cab-sitio')
const nav = cab?.querySelector('.nav-vidrio')
const capsula = nav?.querySelector('.nav-capsula')
const actualDom = nav?.querySelector('[aria-current="page"]')
// Si el enlace de la página está escondido (ronda 16: sin Inicio en la barra), la cápsula no se queda en ninguno
const visible = (a) => (a && a.offsetWidth ? a : null)

// La cápsula se desliza bajo el ítem que se apunta y vuelve al de la página al salir.
// Ronda 15 (16 nov), nota de Agustín: «que el movimiento se sienta muy fluido, no brusco». La mueve un resorte sin rebote
// (amortiguación crítica) en vez de una transición CSS: si cambias de ítem a mitad de camino, sigue con la velocidad que llevaba
// en vez de partir de cero. El borde que va adelante es un poco más rápido que el de atrás, así la cápsula se estira al moverse.
// Ronda 16: Agustín eligió F3 (el resorte lento), «muy levemente más rápido»: k 230 y 150 (F3 era 200 y 130).
const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)")
const borde = { izq: { p: 0, v: 0, m: 0 }, der: { p: 0, v: 0, m: 0 } }
let cuadro = 0, antes = 0, volver = 0
function pintar() {
  capsula.style.setProperty('--x', `${borde.izq.p}px`)
  capsula.style.setProperty('--w', `${Math.max(0, borde.der.p - borde.izq.p)}px`)
}
function pasoCapsula(t) {
  const dt = Math.min((t - antes) / 1000, 1 / 30); antes = t
  const haciaDer = borde.izq.m + borde.der.m > borde.izq.p + borde.der.p
  let sigue = false
  for (const [e, adelante] of [[borde.izq, !haciaDer], [borde.der, haciaDer]]) {
    const k = adelante ? 230 : 150, c = 2 * Math.sqrt(k)
    e.v += (k * (e.m - e.p) - c * e.v) * dt
    e.p += e.v * dt
    if (Math.abs(e.m - e.p) > 0.3 || Math.abs(e.v) > 2) sigue = true; else { e.p = e.m; e.v = 0 }
  }
  pintar()
  cuadro = sigue ? requestAnimationFrame(pasoCapsula) : 0
}
function moverCapsula(a, sinAnimar) {
  if (!capsula) return
  clearTimeout(volver)
  if (!a) { capsula.style.opacity = '0'; nav.querySelectorAll('a').forEach((x) => x.classList.remove('bajo', 'fuera')); return }
  // Si estaba escondida (página sin enlace en la barra), aparece ya en su lugar en vez de viajar desde el borde
  if (capsula.style.opacity === '0') sinAnimar = true
  capsula.style.transition = 'opacity 0.3s var(--ease-calma), background-color 0.4s var(--ease-calma)'
  capsula.style.opacity = '1'
  borde.izq.m = a.offsetLeft; borde.der.m = a.offsetLeft + a.offsetWidth
  if (sinAnimar || sinMovimiento.matches) {
    for (const e of [borde.izq, borde.der]) { e.p = e.m; e.v = 0 }
    cancelAnimationFrame(cuadro); cuadro = 0; pintar()
  } else if (!cuadro) { antes = performance.now(); cuadro = requestAnimationFrame(pasoCapsula) }
  nav.querySelectorAll('a').forEach((x) => x.classList.toggle('bajo', x === a))
  nav.querySelectorAll('a').forEach((x) => x.classList.toggle('fuera', x !== a))
}
if (nav) {
  const ubicar = () => moverCapsula(visible(actualDom), true)
  document.fonts?.ready.then(ubicar)
  addEventListener('resize', ubicar)
  ubicar()
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('pointerenter', () => moverCapsula(a))
    a.addEventListener('focus', () => moverCapsula(a))
  })
  // Al salir espera un instante: si el puntero vuelve enseguida, la cápsula no hace el viaje de ida y vuelta
  nav.addEventListener('pointerleave', () => { clearTimeout(volver); volver = setTimeout(() => moverCapsula(visible(actualDom)), 140) })
  nav.addEventListener('focusout', (e) => { if (!nav.contains(e.relatedTarget)) moverCapsula(visible(actualDom)) })
}

// Ronda 16, hover H5: la luz de los botones sigue al puntero
document.querySelectorAll('.inicio .boton, .cab-sitio .boton-cab').forEach((el) => {
  const pos = (e) => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`) }
  el.addEventListener('pointerenter', pos); el.addEventListener('pointermove', pos)
})

// Menú del celular
const menu = cab?.querySelector('.menu-boton')
menu?.addEventListener('click', () => {
  const abierto = cab.classList.toggle('abierta')
  menu.setAttribute('aria-expanded', String(abierto))
  // Ronda 19: con las líneas que se vuelven X, la palabra visible no cambia (así no parpadea «Cerrar» al irse);
  // el nombre para lectores de pantalla lo da aria-label, que incluye la palabra visible «menú»
  if (document.body.dataset.r19b) menu.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú')
  else menu.querySelector('.nombre').textContent = abierto ? 'Cerrar' : 'Menú'
})

// Tono de la cabecera: mira qué sección pasa bajo la barra (data-tono="claro" u "oscuro").
const tonos = [...document.querySelectorAll('[data-tono]')]
// Fluidez (16 nov): tono() recibe las medidas leídas al comienzo del cuadro, antes de escribir nada, para no forzar otro cálculo de estilos
let sxActual = 0
function tono(medidas = tonos.map((s) => s.getBoundingClientRect()), rIni = document.querySelector('.inicio')?.getBoundingClientRect()) {
  const y = 40
  let t = 'oscuro'
  tonos.forEach((s, i) => {
    const r = medidas[i]
    if (r.top <= y && r.bottom > y) t = s.dataset.tonoCab ?? s.dataset.tono
  })
  // En el inicio, el tono puede cambiar a mitad del paso (la versión 1 parte clara y termina en el degradado).
  const ini = document.querySelector('.inicio')
  if (ini && rIni) {
    const r = rIni
    if (r.top <= y && r.bottom > y) { const pp = Number(ini.style.getPropertyValue('--p') || ini.style.getPropertyValue('--pr') || 0); t = document.body.dataset.r23f === 'f3' && pp > 0.5 ? 'claro' : pp > 0.3 ? 'oscuro' : (ini.dataset.tono ?? 'oscuro'); if (sxActual > 0.42) t = 'claro' }
  }
  if (cab) {
    if (cab.dataset.sobre !== t) cab.dataset.sobre = t
    const c = String(scrollY > 24); if (cab.dataset.compacta !== c) cab.dataset.compacta = c // la barra se achica (y en N3 aparece el vidrio) al empezar a bajar
  }
}

// Paso del inicio: --p de 0 a 1 mientras la foto queda fija.
const inicio = document.querySelector('.inicio')
const quieto = matchMedia('(prefers-reduced-motion: reduce)')
// Ronda 31 · R4: seis capas de desenfoque y un velo hacia el crema, que suben desde abajo en la salida
document.querySelector('.inicio-pin')?.insertAdjacentHTML('beforeend', '<div class="salida-velo" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><b></b></div>')
// Fluidez (16 nov): en cada cuadro se lee todo primero y se escribe después, y solo lo que cambió.
// Las alturas en svh del inicio se leen una vez (cambian solo al cambiar el tamaño o una variante).
const escritos = new WeakMap()
function pon(el, k, v) { let m = escritos.get(el); if (!m) escritos.set(el, (m = {})); if (m[k] === v) return; m[k] = v; el.style.setProperty(k, v) }
let altos = null
const leerAltos = () => { const cs = getComputedStyle(inicio); altos = { relato: Number(cs.getPropertyValue('--alto-relato')) || 0, salida: Number(cs.getPropertyValue('--alto-salida')) || 0 } }
addEventListener('resize', () => { altos = null })
new MutationObserver(() => { altos = null }).observe(document.body, { attributes: true })
const velo = document.querySelector('.salida-velo')
function paso() {
  // Ronda 25 · R1: con «reducir movimiento» la escena se ve igual, pero de golpe (--pr vale 0 o 1, sin pasos intermedios)
  const porPasos = quieto.matches && document.body.dataset.r25r === 'r1'
  const cuerpo = document.body.dataset
  // 1 · Lecturas
  const medidas = tonos.map((s) => s.getBoundingClientRect())
  if (!inicio || (quieto.matches && !porPasos)) { tono(medidas); return }
  const r = inicio.getBoundingClientRect()
  const recorrido = inicio.offsetHeight - innerHeight
  if (!altos) leerAltos()
  // Ronda 23: con relato, el paso del inicio se alarga en --alto-relato (svh); --p cubre el tramo de siempre y --q el del relato
  const extra = altos.relato * innerHeight / 100
  // Ronda 29: al final, el inicio sigue fijo --alto-salida (svh)
  const salida = altos.salida * innerHeight / 100
  const base = recorrido - extra - salida
  const conHoja = salida > 0 && /^p[23]$/.test(cuerpo.r29p ?? '')
  const rHoja = conHoja ? document.querySelector('.seccion.hoja')?.getBoundingClientRect() : null
  const esc = inicio.querySelector('.escena-app'), ven = inicio.querySelector('.ventana-kine')
  const q2 = cuerpo.r30p === 'q2', r31 = cuerpo.r31s ?? ''
  const sx = salida > 0 ? Math.min(1, Math.max(0, (-r.top - (recorrido - salida)) / salida)) : 0
  // Q2 y R2 miden su origen antes de que empiece la salida
  const medirOrigen = sx < 0.001 && ven && ((q2 && esc) || r31 === 'r2')
  const E = medirOrigen && q2 ? esc.getBoundingClientRect() : null, K = medirOrigen ? ven.getBoundingClientRect() : null

  // 2 · Escrituras
  sxActual = salida > 0 && /^q[12]$/.test(cuerpo.r30p ?? '') ? sx : 0
  if (salida > 0) {
    if (/^q[12]$/.test(cuerpo.r30p ?? '')) {
      // Ronda 30 · Q1/Q2: --sx va de 0 a 1 por el tramo fijo del final. Con R4 nadie lo usa en el CSS y no se escribe (se ahorra recalcular la escena entera)
      if (r31 !== 'r4') pon(inicio, '--sx', sx.toFixed(4))
      if (q2 && esc && ven) {
        // Q2: la cámara entra al panel del kine
        if (E && E.width) esc.dataset.origen = `${(((K.left + K.width / 2) - E.left) / E.width * 100).toFixed(2)}% ${(((K.top + K.height / 2) - E.top) / E.height * 100).toFixed(2)}%`
        const k = Math.min(1, sx / 0.5), z = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
        if (esc.style.transformOrigin !== (esc.dataset.origen ?? '50% 50%')) esc.style.transformOrigin = esc.dataset.origen ?? '50% 50%'
        pon(inicio, '--zk', z.toFixed(4))
      }
      // Ronda 31 · R1 a R6 sobre Q1; --ke es el avance con easing (de --sx 0,04 a 0,6). R4 lo escribe solo en sus capas
      if (r31) {
        const k = Math.min(1, Math.max(0, (sx - 0.04) / 0.56)), ke = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2
        pon(r31 === 'r4' && velo ? velo : inicio, '--ke', ke.toFixed(4))
        if (r31 === 'r2' && K && K.width) inicio.dataset.iris = `${Math.round(K.left + K.width / 2)}px ${Math.round(K.top + K.height / 2)}px`
        if (inicio.dataset.iris) pon(inicio, '--iris', inicio.dataset.iris)
        if (r31 === 'r6') pon(inicio, '--iso', `${Math.round(k * k * k * 12 * Math.max(innerWidth, innerHeight))}px`)
      }
    }
    // Ronda 29 · P2/P3: --s va de 0 a 1 con la hoja (solo con esas variantes: escribirla en la raíz recalcula toda la página)
    if (rHoja) pon(document.documentElement, '--s', Math.min(1, Math.max(0, 1 - rHoja.top / innerHeight)).toFixed(4))
  }
  const p = base > 0 ? Math.min(1, Math.max(0, -r.top / base)) : 0
  if (porPasos) pon(inicio, '--pr', p > 0.3 ? '1' : '0')
  else pon(inicio, '--p', p.toFixed(4))
  if (esc) {
    const q = extra > 0 ? Math.min(1, Math.max(0, (-r.top - base) / extra)) : 0
    pon(inicio, '--q', q.toFixed(4))
    // Ronda 30: S1 con más tiempo, el paso 3 se queda con la mitad del relato
    const [u1, u2] = /^s[12]$/.test(cuerpo.r29s ?? '') ? [0.25, 0.5] : [0.34, 0.67]
    const n = String(q < u1 ? 0 : q < u2 ? 1 : 2)
    if (esc.dataset.paso !== n) esc.dataset.paso = n
    esc.classList.toggle('en-uso', porPasos ? p > 0.3 : p > 0.84)
    if (porPasos && /^e[4-8]$/.test(cuerpo.r26e ?? '')) esc.classList.toggle('cambio', esc.dataset.paso === '2')
  }
  tono(medidas, r)
}
let pendiente = false
addEventListener('scroll', () => {
  if (pendiente) return
  pendiente = true
  requestAnimationFrame(() => { pendiente = false; paso() })
}, { passive: true })
addEventListener('resize', paso)
paso()

// En la versión de prueba se puede cambiar el titular con ?t=a|b|c
const t = new URLSearchParams(location.search).get('t')
if (t) document.querySelectorAll('[data-titular]').forEach((h) => { h.hidden = h.dataset.titular !== t })

// Aparecer al entrar en pantalla (.revela). Con movimiento reducido el CSS ya lo muestra todo.
const revelas = document.querySelectorAll('.revela')
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -10% 0px' })
  revelas.forEach((el) => io.observe(el))
} else revelas.forEach((el) => el.classList.add('visible'))

// Pestañas (patrón de ARIA: flechas, Inicio y Fin; la cápsula se desliza bajo la elegida)
document.querySelectorAll('[data-pestanas]').forEach((caja) => {
  const lista = caja.querySelector('[role="tablist"]')
  const botones = [...lista.querySelectorAll('[role="tab"]')]
  const cap = lista.querySelector('.pestanas-capsula')
  const ubicar = (b, sinAnimar) => {
    if (!cap) return
    if (sinAnimar) cap.style.transition = 'none'
    cap.style.setProperty('--x', `${b.offsetLeft}px`)
    cap.style.setProperty('--w', `${b.offsetWidth}px`)
    if (sinAnimar) requestAnimationFrame(() => { cap.style.transition = '' })
  }
  const elegir = (b, foco) => {
    botones.forEach((x) => {
      const si = x === b
      x.setAttribute('aria-selected', String(si))
      x.tabIndex = si ? 0 : -1
      document.getElementById(x.getAttribute('aria-controls')).hidden = !si
    })
    ubicar(b)
    if (foco) b.focus()
  }
  botones.forEach((b, i) => {
    b.addEventListener('click', () => elegir(b))
    b.addEventListener('keydown', (e) => {
      const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: botones.length - 1 }[e.key]
      if (n === undefined) return
      e.preventDefault()
      elegir(botones[(n + botones.length) % botones.length], true)
    })
  })
  const inicial = () => ubicar(botones.find((b) => b.getAttribute('aria-selected') === 'true') ?? botones[0], true)
  document.fonts?.ready.then(inicial)
  addEventListener('resize', inicial)
  inicial()
})

// Año del pie
document.querySelectorAll('[data-anio]').forEach((el) => { el.textContent = new Date().getFullYear() })

// Formulario «Conversemos»: valida en la página, manda a /api/contacto y deja las gracias en el mismo lugar.
document.querySelectorAll('[data-formulario]').forEach((f) => {
  const estado = f.querySelector('.estado-form')
  const boton = f.querySelector('[type="submit"]')
  const MENSAJES = { valueMissing: 'Falta completar este campo.', typeMismatch: 'Revisa el correo: parece incompleto.' }
  const marcar = (c) => {
    const mal = !c.validity.valid
    c.setAttribute('aria-invalid', String(mal))
    let e = c.parentElement.querySelector('.error')
    if (mal) {
      if (!e) { e = document.createElement('p'); e.className = 'error'; e.id = `${c.id}-error`; c.parentElement.append(e); c.setAttribute('aria-describedby', e.id) }
      e.textContent = c.validity.typeMismatch ? MENSAJES.typeMismatch : MENSAJES.valueMissing
    } else if (e) { e.remove(); c.removeAttribute('aria-describedby') }
    return !mal
  }
  const campos = [...f.querySelectorAll('input:not([name="sitio"]), select, textarea')]
  campos.forEach((c) => {
    c.addEventListener('blur', () => { if (c.value) marcar(c) })
    for (const ev of ['input', 'change']) c.addEventListener(ev, () => { if (c.getAttribute('aria-invalid') === 'true') marcar(c) })
  })
  f.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    const malos = campos.filter((c) => !marcar(c))
    if (malos.length) { malos[0].focus(); estado.className = 'estado-form mal'; estado.textContent = 'Revisa los campos marcados.'; return }
    boton.disabled = true; estado.className = 'estado-form'; estado.textContent = 'Enviando…'
    try {
      const r = await fetch(f.action, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(f))) })
      if (!r.ok) throw new Error(String(r.status))
      f.classList.add('enviado')
      f.innerHTML = `<div class="gracias" tabindex="-1">${f.querySelector('.icono-gracias')?.innerHTML ?? ''}<h3>Gracias, te escribimos pronto.</h3><p>Te respondemos al correo que dejaste. Si es urgente, escríbenos a contacto@mendsalud.cl.</p></div>`
      f.querySelector('.gracias').focus()
    } catch {
      boton.disabled = false; estado.className = 'estado-form mal'
      estado.innerHTML = 'No se pudo enviar. Prueba de nuevo o escríbenos a <a href="mailto:contacto@mendsalud.cl">contacto@mendsalud.cl</a>.'
    }
  })
})

// Clips de ejercicios: cargan y suenan (sin audio) solo mientras se ven; con movimiento reducido queda la foto.
const clips = document.querySelectorAll('.clip video[data-src]')
if (clips.length && 'IntersectionObserver' in window) {
  const ioClip = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target
    if (e.isIntersecting && !quieto.matches) {
      if (!v.src) v.src = v.dataset.src
      v.play().then(() => v.parentElement.classList.add('sonando')).catch(() => {})
    } else if (!v.paused) v.pause()
  }), { threshold: 0.35 })
  clips.forEach((v) => ioClip.observe(v))
}

// Riel: flechas que avanzan una tarjeta y se apagan en los bordes.
document.querySelectorAll('[data-riel]').forEach((riel) => {
  const flechas = riel.closest('section')?.querySelectorAll('[data-riel-flechas] button')
  if (!flechas || flechas.length < 2) return
  const paso = () => (riel.firstElementChild?.getBoundingClientRect().width ?? 280) + 18
  flechas[0].addEventListener('click', () => riel.scrollBy({ left: -paso(), behavior: quieto.matches ? 'auto' : 'smooth' }))
  flechas[1].addEventListener('click', () => riel.scrollBy({ left: paso(), behavior: quieto.matches ? 'auto' : 'smooth' }))
  const bordes = () => { flechas[0].disabled = riel.scrollLeft < 4; flechas[1].disabled = riel.scrollLeft + riel.clientWidth > riel.scrollWidth - 4 }
  riel.addEventListener('scroll', bordes, { passive: true }); addEventListener('resize', bordes); bordes()
})

// Fondos (ronda 7): ?fondos=paneles,aurora para probar estilos combinados en local
const pedidos = new URLSearchParams(location.search).get('fondos')
if (pedidos) document.body.dataset.fondos = pedidos.split(/[,\s]+/).filter(Boolean).join(' ')
const conFondo = (t) => (document.body.dataset.fondos ?? '').split(' ').includes(t)
const seccionesFondo = [...document.querySelectorAll('.seccion[data-fondo]')]

// PE: el panel se abre a todo el ancho al llegar al centro y se cierra al salir
if (conFondo('abre') && !quieto.matches) {
  document.body.dataset.abreActivo = ''
  let pendiente = false
  const abrir = () => {
    pendiente = false
    const vh = innerHeight
    for (const s of seccionesFondo) {
      const r = s.getBoundingClientRect()
      const entra = Math.min(Math.max((vh - r.top) / (vh * 0.55), 0), 1)
      const sale = Math.min(Math.max(r.bottom / (vh * 0.55), 0), 1)
      s.style.setProperty('--abre', Math.min(entra, sale).toFixed(3))
    }
  }
  addEventListener('scroll', () => { if (!pendiente) { pendiente = true; requestAnimationFrame(abrir) } }, { passive: true })
  addEventListener('resize', abrir); abrir()
}

// CS: el fondo de la página toma el tono de la sección que cruza el centro de la pantalla
if (conFondo('sigue')) {
  const capa = document.createElement('div'); capa.className = 'fondo-vivo'; capa.setAttribute('aria-hidden', 'true')
  document.body.prepend(capa)
  const claras = [...document.querySelectorAll('.seccion')].filter((s) => s.dataset.fondo !== 'oscuro')
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) document.body.dataset.vivo = e.target.dataset.fondo ?? 'hueso' }), { rootMargin: '-50% 0px -50% 0px' })
  claras.forEach((s) => io.observe(s))
}

// LU: un halo sigue al cursor sobre los fondos de color (solo con mouse)
if (conFondo('luz') && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  for (const s of seccionesFondo) {
    s.addEventListener('pointermove', (e) => { const r = s.getBoundingClientRect(); s.style.setProperty('--mx', `${e.clientX - r.left}px`); s.style.setProperty('--my', `${e.clientY - r.top}px`) })
    s.addEventListener('pointerleave', () => s.style.setProperty('--my', '-600px'))
  }
}

// IS: el isotipo de vidrio gira un poco según cuánto se ha bajado por su sección
const isos = [...document.querySelectorAll('.iso-vidrio')]
if (isos.length && !quieto.matches) {
  let espera = false
  const girar = () => {
    espera = false
    for (const iso of isos) {
      const r = iso.parentElement.getBoundingClientRect()
      const t = Math.min(Math.max((innerHeight - r.top) / (innerHeight + r.height), 0), 1)
      iso.style.setProperty('--giro', ((t - 0.5) * 36).toFixed(1))
    }
  }
  addEventListener('scroll', () => { if (!espera) { espera = true; requestAnimationFrame(girar) } }, { passive: true })
  girar()
}

// Titular del inicio: entrada W3 «Trazo y tinta» y hover H2 «Luz que acompaña» (ronda 22). Los estilos y el porqué están en inicio.css.
const titular = document.querySelector('.inicio h1#titular')
const acento = titular?.querySelector('.acento')
if (titular && acento && !sinMovimiento.matches) {
  const NS = 'http://www.w3.org/2000/svg'
  // La Larken llega desde Adobe Fonts sin bloquear (media=print): se espera la hoja y después la cursiva misma, como mucho 1,6 s
  const hoja = document.querySelector('link[rel="stylesheet"][href*="typekit"]')
  const conHoja = !hoja || hoja.sheet ? Promise.resolve() : new Promise((r) => hoja.addEventListener('load', r, { once: true }))
  const larken = conHoja.then(() => document.fonts?.load(`italic 300 40px ${getComputedStyle(acento).fontFamily}`))
  const listo = () => requestAnimationFrame(() => document.documentElement.classList.add('fuentes'))
  Promise.race([larken, new Promise((r) => setTimeout(r, 1600))]).then(listo, listo)
  // El contorno: un <text> de svg con la misma letra encima de «acompaña», una letra por tspan para escalonar.
  // Va al principio de «acompaña»: al final, Chrome rehace el equilibrio de líneas (text-wrap: balance) y el titular suma una línea falsa.
  const texto = [...acento.childNodes].find((n) => n.nodeType === 3)
  const svg = document.createElementNS(NS, 'svg'), tx = document.createElementNS(NS, 'text')
  svg.setAttribute('class', 'trazo'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false')
  ;[...texto.nodeValue].forEach((c, i) => { const s = document.createElementNS(NS, 'tspan'); s.textContent = c; s.style.setProperty('--i', i); tx.append(s) })
  svg.append(tx); acento.prepend(svg)
  // La línea de base sale de las medidas de la letra (agregar una marca al texto cambiaría el equilibrio de líneas)
  const lienzo = document.createElement('canvas').getContext('2d')
  const medir = () => {
    const cs = getComputedStyle(acento), ra = acento.getBoundingClientRect()
    lienzo.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    tx.setAttribute('x', parseFloat(cs.paddingLeft)); tx.setAttribute('y', parseFloat(cs.paddingTop) + lienzo.measureText(texto.nodeValue).fontBoundingBoxAscent)
    tx.style.font = lienzo.font; tx.style.letterSpacing = cs.letterSpacing
    svg.setAttribute('width', ra.width); svg.setAttribute('height', ra.height)
  }
  medir(); larken.then(medir, () => {}); addEventListener('resize', medir)
  // Terminada la tinta, el svg se va y empieza la luz del hover
  const escrito = () => { titular.classList.add('escrito'); svg.remove() }
  acento.addEventListener('animationend', (e) => { if (e.target === acento && e.animationName === 'tinta-real') escrito() })
  setTimeout(escrito, 6000)
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const luz = (e) => {
      const r = titular.getBoundingClientRect(), a = acento.getBoundingClientRect()
      titular.style.setProperty('--mx', `${e.clientX - r.left}px`); titular.style.setProperty('--my', `${e.clientY - r.top}px`)
      acento.style.setProperty('--mx', `${e.clientX - a.left}px`); acento.style.setProperty('--my', `${e.clientY - a.top}px`)
    }
    titular.addEventListener('pointerenter', luz); titular.addEventListener('pointermove', luz)
  }
}

// Ronda 23 · T3: al llegar, el teléfono se inclina un poco hacia el puntero (solo con mouse y sin «reducir movimiento»)
const dispositivos = document.querySelector('.escena-app .dispositivos')
if (dispositivos && matchMedia('(hover: hover) and (pointer: fine)').matches && !quieto.matches) {
  const escena = dispositivos.closest('.escena-app')
  addEventListener('pointermove', (e) => {
    if (document.body.dataset.r23t !== 't3' || !escena.classList.contains('en-uso')) return
    const r = escena.getBoundingClientRect()
    dispositivos.style.setProperty('--tx', `${((e.clientX - r.left) / r.width - 0.5) * 12}deg`)
    dispositivos.style.setProperty('--ty', `${-((e.clientY - r.top) / r.height - 0.5) * 9}deg`)
  })
  document.addEventListener('pointerleave', () => { dispositivos.style.setProperty('--tx', '0deg'); dispositivos.style.setProperty('--ty', '0deg') })
}

// Ronda 29 · S2: imán suave al comienzo de cada paso del relato (scroll-snap de proximidad, solo con movimiento)
if (inicio && document.body.dataset.r29s === 's2' && !quieto.matches) {
  const imanes = [0, 1, 2].map(() => { const m = document.createElement('span'); m.className = 'iman'; m.setAttribute('aria-hidden', 'true'); inicio.append(m); return m })
  const ubicar = () => {
    const extra = (Number(getComputedStyle(inicio).getPropertyValue('--alto-relato')) || 0) * innerHeight / 100
    const salida = (Number(getComputedStyle(inicio).getPropertyValue('--alto-salida')) || 0) * innerHeight / 100
    const base = inicio.offsetHeight - innerHeight - extra - salida
    ;[0.03, 0.28, 0.53].forEach((u, i) => { imanes[i].style.top = Math.round(base + extra * u) + 'px' })
  }
  ubicar(); addEventListener('resize', ubicar)
  document.documentElement.classList.add('con-iman')
}
// Ronda 25: si se llega al botón de pausa con Tab antes de que la escena esté armada, la página baja hasta ella para que el foco se vea (WCAG 2.4.11)
document.querySelector('.telefono .pausa')?.addEventListener('focus', () => {
  if (!inicio || quieto.matches || Number(inicio.style.getPropertyValue('--p') || 0) > 0.9) return
  const extra = (Number(getComputedStyle(inicio).getPropertyValue('--alto-relato')) || 0) * innerHeight / 100
  const salida = (Number(getComputedStyle(inicio).getPropertyValue('--alto-salida')) || 0) * innerHeight / 100
  scrollTo({ top: inicio.offsetTop + inicio.offsetHeight - innerHeight - extra - salida, behavior: 'instant' })
})
// Ronda 25 · C2: la ficha del panel es la de Carmen, con la semana de hoy; el check-in llega a su fila «hoy»
if (document.body.dataset.r25c === 'c2') { const f = document.querySelector('.ventana-cuerpo-kine img'); if (f) { f.srcset = f.srcset.replaceAll('kine-ficha-', 'kine-ficha-carmen-'); f.src = f.src.replace('kine-ficha.jpg', 'kine-ficha-carmen.jpg') } }
// Ronda 23 · P3: botón para pausar la demostración del teléfono
document.querySelector('.telefono .pausa')?.addEventListener('click', (e) => {
  const b = e.currentTarget, escena = b.closest('.escena-app'), pausa = !escena.classList.contains('pausado')
  escena.classList.toggle('pausado', pausa); b.setAttribute('aria-pressed', String(pausa)); b.setAttribute('aria-label', pausa ? 'Seguir la demostración' : 'Pausar la demostración')
})

// ───────── Ronda 24 · el flujo real de la app en la pantalla del teléfono (video grabado en local con datos de ejemplo) ─────────
// Cada paso del relato reproduce su tramo (A marcar «Bien», B abrir la rutina y empezar, C ir al calendario) y se detiene al final.
// Con data-r24v="v2" el video avanza con el scroll. Encima se dibujan los toques (data-r24q), las líneas de las tarjetas (r24b="b2")
// y el check-in que viaja al panel del kine (r24e="e2"). Con «reducir movimiento» la escena no se arma, así que nada de esto corre.
const escenaApp = document.querySelector('.escena-app')
const video = escenaApp?.querySelector('.pant-video')
if (escenaApp && video && inicio && !quieto.matches && document.body.dataset.r23p === 'p2') {
  const cuerpo = document.body.dataset
  const pantallas = escenaApp.querySelector('.pantallas'), toques = escenaApp.querySelector('.toques'), dispo = escenaApp.querySelector('.dispositivos')
  const svg = escenaApp.querySelector('.conectores'), viajero = escenaApp.querySelector('.viajero'), boton = escenaApp.querySelector('.telefono .pausa')
  const tarjetas = [...escenaApp.querySelectorAll('.flota-escena')]
  // Ronda 25: con T2 (tablet vertical) y L2 (acostado) la escena se arma sin líneas ni viaje, como en el celular
  const apilado = () => innerWidth <= 760 || (cuerpo.r25t === 't2' && matchMedia('(min-width: 761px) and (max-width: 1180px) and (orientation: portrait)').matches) || (cuerpo.r25l === 'l2' && matchMedia('(max-height: 520px) and (orientation: landscape)').matches)
  const ROTULOS = { Bien: 'Marca cómo amaneces', 'Ver rutina': 'Abre tu rutina', 'Desliza para empezar': 'Desliza para empezar', Empezar: 'Empieza', Calendario: 'Mira tu semana' }
  // A qué apunta cada tarjeta en la pantalla (fracción del ancho y del alto): rutina, «Bien» y la tarjeta de la kine en el calendario
  const APUNTA = [[0.5, 0.42], [0.735, 0.589], [0.24, 0.76]]
  const PASO_DE_TARJETA = [1, 0, 2]
  let datos = null, cargando = false, lista = false, pasoVideo = -1, meta = null, pasoViaje = -1, anim = null
  const num = (v) => Number(inicio.style.getPropertyValue(v) || 0)
  const cl = (v) => Math.min(1, Math.max(0, v))
  function cargar() {
    if (cargando) return; cargando = true
    fetch(video.dataset.src.replace(/\.mp4$/, '.json')).then((r) => r.json()).then((d) => { datos = d; video.src = video.dataset.src; video.preload = 'auto'; video.load() }).catch(() => {})
  }
  video.addEventListener('loadeddata', () => { lista = true; video.classList.add('lista'); escenaApp.classList.add('con-video') }, { once: true })
  const tramo = (k) => [datos.tramos.A, datos.tramos.B, datos.tramos.C][k]
  // Ronda 29 · S1/S2: el tramo del calendario corre a 1,4x para que el paso 3 termine antes
  const rapido = () => /^s[12]$/.test(cuerpo.r29s ?? '')
  const velocidad = (k) => (k === 2 && rapido() ? 1.4 : 1)
  // Ronda 29 · C1/C2: del ejercicio al inicio sin corte. Se congela el último cuadro en un canvas encima del video,
  // el video salta al tramo siguiente debajo y el cuadro congelado se va: C1 baja como una hoja que se cierra (iOS), C2 se funde.
  let foto = null
  function transicion(desde, hasta) {
    meta = hasta
    if (!foto) { foto = document.createElement('canvas'); foto.className = 'pant-foto'; foto.setAttribute('aria-hidden', 'true'); video.after(foto) }
    try { foto.width = video.videoWidth; foto.height = video.videoHeight; foto.getContext('2d').drawImage(video, 0, 0) } catch { reproducir(desde, hasta, true); return }
    foto.getAnimations().forEach((x) => x.cancel()); foto.style.opacity = '1'; video.pause()
    const seguir = () => {
      if (pasoVideo !== 2) { foto.style.opacity = '0'; return }
      video.playbackRate = velocidad(2)
      if (!escenaApp.classList.contains('pausado')) video.play().catch(() => {})
      const c1 = cuerpo.r29c === 'c1', dur = c1 ? 950 : 750
      const sale = foto.animate(c1 ? [{ translate: '0 0', scale: '1', borderRadius: '0px' }, { translate: '0 106%', scale: '0.94', borderRadius: '26px' }] : [{ opacity: 1, scale: '1', filter: 'blur(0px)' }, { opacity: 0, scale: '1.05', filter: 'blur(8px)' }], { duration: dur, easing: c1 ? 'cubic-bezier(0.6, 0, 0.25, 1)' : 'cubic-bezier(0.45, 0, 0.3, 1)', fill: 'forwards' })
      video.animate(c1 ? [{ scale: '0.93', filter: 'brightness(0.62)' }, { scale: '1', filter: 'brightness(1)' }] : [{ scale: '0.975' }, { scale: '1' }], { duration: dur, easing: 'cubic-bezier(0.45, 0, 0.25, 1)' })
      sale.onfinish = () => { foto.style.opacity = '0'; sale.cancel() }
    }
    video.addEventListener('seeked', seguir, { once: true }); video.currentTime = desde
  }
  function reproducir(desde, hasta, corte) {
    meta = hasta
    const ir = () => { if (desde !== null) video.currentTime = desde; if (!escenaApp.classList.contains('pausado')) video.play().catch(() => {}) }
    if (corte) { video.classList.add('corte'); setTimeout(() => { ir(); setTimeout(() => video.classList.remove('corte'), 60) }, 130) } else ir()
  }
  function sincronizar() {
    const p = num('--p'), k = p > 0.84 ? Number(escenaApp.dataset.paso || 0) : -1
    if (p > 0.25) cargar()
    if (!lista || !datos) return
    if (cuerpo.r24v === 'v2') {
      // Con el scroll: cada paso recorre su tramo en el primer 85 % de su parte del relato
      let t = 0
      if (k >= 0) { const [a, b] = tramo(k); t = a + (b - a) * cl((num('--q') - k / 3) / (0.85 / 3)) }
      if (!video.seeking && Math.abs(video.currentTime - t) > 0.035) video.currentTime = t
      return
    }
    if (k === pasoVideo) {
      if (meta !== null && video.currentTime >= meta - 0.03) { video.pause(); meta = null }
      return
    }
    if (k === -1) { video.pause(); meta = null; video.currentTime = 0 }
    else if (k > pasoVideo) {
      const [a, b] = tramo(k)
      // Si viene del final del paso anterior, sigue sin saltar; si no, parte desde el comienzo de su tramo
      const seguido = k === pasoVideo + 1 && Math.abs(video.currentTime - a) < 0.25
      video.playbackRate = velocidad(k)
      if (k === 2 && /^c[12]$/.test(cuerpo.r29c ?? '') && video.readyState >= 2) { pasoVideo = k; transicion(a, b); return }
      reproducir(seguido ? null : a, b, k === 2)
    } else { const [, b] = tramo(k); video.pause(); meta = null; video.classList.add('corte'); setTimeout(() => { video.currentTime = b - 0.04; video.classList.remove('corte') }, 130) }
    pasoVideo = k
  }
  boton?.addEventListener('click', () => { if (escenaApp.classList.contains('pausado')) video.pause(); else if (meta !== null) video.play().catch(() => {}) })

  // Toques: aparecen, presionan, se abre la onda y se van; el rótulo dice la acción. Q4: el punto viaja entre toques.
  function dibujarToques() {
    if (!cuerpo.r24q || !datos) return
    const t = video.currentTime, L = datos.toques
    let x = 0.5, y = 0.5, ap = 0, pr = 0, on = 0, onv = 0, ra = 0, rot = ''
    for (const q of L) {
      const a = q.t - 0.35, z = q.fin + 0.6
      if (t < a || t > z) continue
      ap = t < q.t ? (t - a) / 0.35 : t > q.fin + 0.25 ? 1 - (t - q.fin - 0.25) / 0.35 : 1
      pr = t >= q.t && t <= q.fin ? 1 : t > q.fin && t < q.fin + 0.15 ? 1 - (t - q.fin) / 0.15 : t > q.t - 0.1 && t < q.t ? (t - q.t + 0.1) / 0.1 : 0
      on = t >= q.t ? cl((t - q.t) / 0.6) : 0; onv = t >= q.t && t < q.t + 0.6 ? 1 : 0
      const u = q.tipo === 'arrastre' ? cl((t - q.t) / (q.fin - q.t)) : 0
      x = q.x + ((q.x2 ?? q.x) - q.x) * u; y = q.y + ((q.y2 ?? q.y) - q.y) * u
      ra = cl(Math.min((t - a) / 0.3, (q.fin + 0.9 - t) / 0.3)); rot = ROTULOS[q.nombre] ?? q.nombre
      break
    }
    if (cuerpo.r24q === 'q4' && ap === 0) {
      // Entre dos toques del mismo tramo, el punto se desliza del primero al siguiente
      for (let i = 0; i < L.length - 1; i++) {
        const A = L[i], B = L[i + 1], s = A.fin + 0.25, e = B.t - 0.35
        if (t > s && t < e && B.t - A.fin < 2.6) { const u = cl((t - s) / (e - s)), k = u * u * (3 - 2 * u); x = (A.x2 ?? A.x) + (B.x - (A.x2 ?? A.x)) * k; y = (A.y2 ?? A.y) + (B.y - (A.y2 ?? A.y)) * k; ap = 0.9; break }
      }
    }
    const st = toques.style
    st.setProperty('--x', `${(x * 100).toFixed(2)}%`); st.setProperty('--y', `${(y * 100).toFixed(2)}%`)
    st.setProperty('--ap', cl(ap).toFixed(3)); st.setProperty('--pr', cl(pr).toFixed(3)); st.setProperty('--on', on.toFixed(3)); st.setProperty('--onv', String(onv)); st.setProperty('--ra', ra.toFixed(3))
    const r = toques.querySelector('.toque-rotulo'); if (r.textContent !== rot && rot) r.textContent = rot; const lado = x > 0.6 ? 'izq' : x < 0.4 ? 'der' : ''; if (r.dataset.lado !== lado) r.dataset.lado = lado
  }

  // Líneas de las tarjetas (B2): de la tarjeta del paso activo a lo que señala en la pantalla
  function dibujarLineas() {
    if (cuerpo.r24b !== 'b2' || !svg || apilado()) return
    const D = dispo.getBoundingClientRect(), S = pantallas.getBoundingClientRect(), paso = num('--p') > 0.84 ? Number(escenaApp.dataset.paso || 0) : -1
    tarjetas.forEach((c, i) => {
      const linea = svg.querySelector(`.con[data-c="${i + 1}"]`), punto = svg.querySelector(`.con-punto[data-c="${i + 1}"]`)
      const activa = PASO_DE_TARJETA[i] === paso
      linea.classList.toggle('ve', activa); punto.classList.toggle('ve', activa)
      if (!activa) return
      const R = c.getBoundingClientRect(), izq = R.left + R.width / 2 < S.left + S.width / 2
      const ax = (izq ? R.right : R.left) - D.left, ay = R.top + R.height / 2 - D.top
      const tx = S.left + S.width * APUNTA[i][0] - D.left, ty = S.top + S.height * APUNTA[i][1] - D.top, dx = tx - ax
      linea.setAttribute('d', `M${ax.toFixed(1)} ${ay.toFixed(1)} C${(ax + dx * 0.55).toFixed(1)} ${ay.toFixed(1)} ${(tx - dx * 0.25).toFixed(1)} ${ty.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)}`)
      linea.setAttribute('pathLength', '1'); punto.setAttribute('cx', tx.toFixed(1)); punto.setAttribute('cy', ty.toFixed(1))
    })
  }

  // E2: al llegar al paso 3, el check-in viaja del teléfono a la fila de hoy en la ficha del kine
  // Ronda 27 (E6): el cambio sin cruzarse. Primero se separan hasta no tocarse (el teléfono hacia la izquierda sin pisar el relato,
  // el panel hacia la derecha y algo más chico si no cabe), en ese momento se cambia el orden, y se vuelven a juntar con el panel adelante.
  // Se mide en cada vez, así sirve en cualquier ancho; el estado final es el mismo de E4 (lo da el CSS con .cambio).
  let cambios = []
  function deshacerCambio() {
    cambios.forEach((x) => x.cancel()); cambios = []
    escenaApp.querySelectorAll('.telefono, .ventana-kine').forEach((e) => { e.style.transition = '' })
  }
  function cambiar() {
    const tel = escenaApp.querySelector('.telefono'), ven = escenaApp.querySelector('.ventana-kine')
    if (!/^e[678]$/.test(cuerpo.r26e ?? '') || quieto.matches || !ven.animate) { escenaApp.classList.add('cambio'); return }
    deshacerCambio()
    // Se mide cada aparato ya puesto en su pose del medio (sin desplazar) y se vuelve atrás sin transición
    const medir = (el, st) => { el.style.transition = 'none'; Object.assign(el.style, st); const r = el.getBoundingClientRect(); for (const k in st) el.style[k] = ''; el.getBoundingClientRect(); return r }
    let tope = 0
    for (const li of escenaApp.querySelectorAll('.relato li')) { const r = document.createRange(); r.selectNodeContents(li); const b = r.getBoundingClientRect(); if (b.width) tope = Math.max(tope, b.right) }
    // Ronda 28 (E7 y E8): además, el que se va atrás se achica y el que viene adelante se agranda, con un leve rebote al llegar
    const V = { e6: { sT: 0.9, kP: 1, rebote: 0, dur: 2000 }, e7: { sT: 0.84, kP: 0.86, rebote: 1.07, dur: 2200 }, e8: { sT: 0.78, kP: 0.76, rebote: 1.1, dur: 2200 } }[cuerpo.r26e]
    const sT = V.sT, sep = 40, poseK = (f) => ({ translate: '10% -51%', transform: `perspective(1400px) rotateY(-9deg) scale(${(0.88 * V.kP * f).toFixed(3)})` })
    const Pm = medir(tel, { translate: '-4vw 1.5%', scale: String(sT) })
    const a = Math.max(0, Math.min(Pm.width * 0.5, Pm.left - (tope + 28)))
    const derT = Pm.right - a
    let Km = medir(ven, poseK(1))
    const f = Math.max(0.5, Math.min(1, (innerWidth - 20 - derT - sep) / Km.width))
    if (f < 1) Km = medir(ven, poseK(f))
    const b = derT + sep - Km.left
    tel.style.transition = 'none'; ven.style.transition = 'filter 1.6s var(--ease-calma), box-shadow 1.6s var(--ease-calma)'
    escenaApp.classList.add('cambio')
    const e = 'cubic-bezier(0.55, 0, 0.3, 1)', o = { duration: V.dur, easing: 'linear' }, sK = 0.88 * V.kP * f
    const tm = `calc(-4vw - ${a.toFixed(1)}px) 1.5%`, tm2 = `calc(-4vw - ${(a + 8).toFixed(1)}px) 2%`
    cambios = [
      tel.animate([
        { translate: '-4vw 0', scale: '1', filter: 'brightness(1) saturate(1)', easing: e },
        { offset: 0.42, translate: tm, scale: String(sT), filter: 'brightness(0.82) saturate(0.95)', easing: 'linear' },
        { offset: 0.56, translate: tm2, scale: String(sT - 0.01), filter: 'brightness(0.78) saturate(0.92)', easing: e },
        { translate: '-12vw 3%', scale: '0.86', filter: 'brightness(0.62) saturate(0.85)' },
      ], o),
      ven.animate([
        { translate: '10% -50%', transform: 'perspective(1400px) rotateY(-16deg) scale(0.88)', easing: e },
        { offset: 0.42, translate: `calc(10% + ${b.toFixed(1)}px) -51%`, transform: `perspective(1400px) rotateY(-9deg) scale(${sK.toFixed(3)})`, easing: 'linear' },
        { offset: 0.56, translate: `calc(10% + ${(b - 10).toFixed(1)}px) -51.5%`, transform: `perspective(1400px) rotateY(-8deg) scale(${(sK + 0.01).toFixed(3)})`, easing: V.rebote ? 'cubic-bezier(0.4, 0, 0.2, 1)' : e },
        ...(V.rebote ? [{ offset: 0.84, transform: `perspective(1400px) rotateY(-2deg) scale(${V.rebote})`, easing: 'cubic-bezier(0.3, 0, 0.3, 1)' }] : []),
        { translate: '-2% -50%', transform: 'perspective(1400px) rotateY(-3deg) scale(1.04)' },
      ], o),
      // El orden cambia de golpe en el momento de mayor separación (z-index se interpolaría como número)
      tel.animate([{ zIndex: 4 }, { offset: 0.49, zIndex: 4 }, { offset: 0.4901, zIndex: 1 }, { zIndex: 1 }], o),
      ven.animate([{ zIndex: 1 }, { offset: 0.49, zIndex: 1 }, { offset: 0.4901, zIndex: 6 }, { zIndex: 6 }], o),
    ]
    cambios[0].onfinish = () => { tel.style.transition = ''; ven.style.transition = ''; cambios = [] }
  }
  function viaje() {
    if (cuerpo.r24e !== 'e2' || !viajero || apilado() || !/a3|a4/.test(cuerpo.r23a ?? '')) return
    const paso = num('--p') > 0.84 ? Number(escenaApp.dataset.paso || 0) : -1
    if (paso === pasoViaje) return
    pasoViaje = paso
    anim?.cancel(); escenaApp.classList.remove('viajando', 'llego')
    // Ronda 26 (E4 y E5): el teléfono parte adelante y muestra el calendario (el tramo C dura 3,2 s); a los 3,3 s el panel pasa al frente y, cuando termina el cambio, viaja el check-in
    const cambia = /^e[4-8]$/.test(cuerpo.r26e ?? '')
    clearTimeout(viaje.t); if (cambia && paso !== 2) { escenaApp.classList.remove('cambio'); deshacerCambio() }
    if (paso !== 2) return
    // Ronda 29: el cambio parte cuando termina el tramo del calendario (más corto con S1/S2) y el check-in, cuando termina el cambio
    const tC = datos ? (datos.tramos.C[1] - datos.tramos.C[0]) * 1000 / velocidad(2) + 100 : 3300
    const dCambio = { e6: 2000, e7: 2200, e8: 2200 }[cuerpo.r26e] ?? 1150
    if (cambia) viaje.t = setTimeout(() => { if (pasoViaje === 2) cambiar() }, tC)
    setTimeout(() => {
      if (pasoViaje !== 2) return
      const D = dispo.getBoundingClientRect(), S = pantallas.getBoundingClientRect(), E = escenaApp.querySelector('.llega').getBoundingClientRect()
      const sx = S.left + S.width * 0.62 - D.left, sy = S.top + S.height * 0.3 - D.top, ex = E.left + E.width / 2 - D.left, ey = E.top + E.height / 2 - D.top
      const d = `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${((sx + ex) / 2).toFixed(1)} ${(Math.min(sy, ey) - 110).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
      svg.querySelector('.ruta').setAttribute('d', d)
      escenaApp.classList.add('viajando')
      // Ronda 33 (V1 y V2): la escala animada con offset-path también escalaba la posición (la pill aceleraba y frenaba a saltos y no llegaba a la etiqueta).
      // Ahora la curva se recorre en JS por largo de arco y se anima solo con transform y opacity, que corren en el compositor.
      if (/^v[12]$/.test(cuerpo.r33v ?? '')) {
        viajero.style.offsetPath = 'none'
        const cx = (sx + ex) / 2, cy = Math.min(sy, ey) - 110, w = viajero.offsetWidth, h = viajero.offsetHeight
        const P = (t) => [(1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t * t * ex, (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t * t * ey]
        const N = 120, tabla = [[0, 0]]; let L = 0, ant = P(0)
        for (let i = 1; i <= N; i++) { const q = P(i / N); L += Math.hypot(q[0] - ant[0], q[1] - ant[1]); tabla.push([i / N, L]); ant = q }
        const enArco = (f) => { const obj = f * L; let i = tabla.findIndex((x) => x[1] >= obj); if (i <= 0) return 0; const [t0, l0] = tabla[i - 1], [t1, l1] = tabla[i]; return t0 + (t1 - t0) * (obj - l0) / (l1 - l0 || 1) }
        const tramo = (f, pts) => { for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) { const [a0, v0] = pts[i - 1], [a1, v1] = pts[i]; return v0 + (v1 - v0) * (f - a0) / (a1 - a0) } return pts.at(-1)[1] }
        const v2 = cuerpo.r33v === 'v2', fin = v2 ? 0.45 : 0.55
        const K = 40, cuadros = []
        for (let k = 0; k <= K; k++) {
          const f = k / K, [x, y] = P(enArco(f)), sc = tramo(f, [[0, 0.7], [0.12, 1], [0.85, 1], [1, fin]]), op = tramo(f, [[0, 0], [0.12, 1], [0.85, 1], [1, 0]])
          cuadros.push({ offset: f, transform: `translate(${(x - w / 2).toFixed(2)}px, ${(y - h / 2).toFixed(2)}px) scale(${sc.toFixed(3)})`, opacity: +op.toFixed(3) })
        }
        anim = viajero.animate(cuadros, { duration: 1500, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'both' })
        // V2: la etiqueta del panel aparece debajo de la pill en el último tramo, como si la pill se convirtiera en ella
        if (v2) setTimeout(() => { if (pasoViaje === 2) escenaApp.classList.add('llego') }, 1500 * 0.78)
        anim.onfinish = () => { escenaApp.classList.remove('viajando'); escenaApp.classList.add('llego') }
        return
      }
      viajero.style.offsetPath = `path('${d}')`
      anim = viajero.animate([{ offsetDistance: '0%', opacity: 0, scale: 0.7 }, { offset: 0.12, opacity: 1, scale: 1 }, { offset: 0.85, opacity: 1, scale: 1 }, { offsetDistance: '100%', opacity: 0, scale: 0.55 }], { duration: 1500, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'both' })
      anim.onfinish = () => { escenaApp.classList.remove('viajando'); escenaApp.classList.add('llego') }
    }, cambia ? tC + dCambio + 150 : 1000)
  }

  // Ronda 32 · P1: cada tarjeta queda anclada a lo que explica y lo sigue cuadro a cuadro (también durante el cambio de equipo).
  // En escritorio, al costado del teléfono a la altura de la fila que explica (o sobre el panel, el aviso); en el celular y la tableta, como notificación arriba del teléfono.
  // Solo se mueve con translate y transform (sin top ni left), y nunca se sale de la ventana ni pisa el relato.
  const tel = escenaApp.querySelector('.telefono'), panel = escenaApp.querySelector('.ventana-kine'), relato = escenaApp.querySelector('.relato'), barra = document.querySelector('.cab-sitio')
  const ANCLA = [{ en: 'tel', y: 0.39 }, { en: 'tel', y: 0.27 }, { en: 'panel' }] // Rutina de hoy (paso 2), Tu rutina se ajusta (paso 1), Aviso (paso 3)
  let tamanos = null
  addEventListener('resize', () => { tamanos = null })
  function anclar() {
    if (!/^p1$/.test(cuerpo.r32p ?? '')) { if (tarjetas[0]?.classList.contains('anclada')) tarjetas.forEach((c) => c.classList.remove('anclada', 'activa', 'izq', 'arriba')); return }
    // Tamaño normal y compacto (solo el título), medidos una vez por tamaño de ventana
    if (!tamanos) tamanos = tarjetas.map((c) => { c.classList.add('anclada'); const t = c.classList.contains('compacta'); c.classList.remove('compacta'); const n = [c.offsetWidth, c.offsetHeight]; c.classList.add('compacta'); const k = [c.offsetWidth, c.offsetHeight]; c.classList.toggle('compacta', t); return { n, k } })
    const pasoAct = num('--p') > 0.84 ? Number(escenaApp.dataset.paso || 0) : -1
    const banner = apilado(), M = 10, borde = 22
    const D = dispo.getBoundingClientRect(), T = tel.getBoundingClientRect()
    const techo = (barra?.getBoundingClientRect().bottom ?? 60) + 10
    tarjetas.forEach((c, i) => {
      const activa = PASO_DE_TARJETA[i] === pasoAct
      if (!c.classList.contains('anclada')) c.classList.add('anclada')
      if (c.classList.contains('activa') !== activa) c.classList.toggle('activa', activa)
      if (!activa && !c.dataset.puesta) return // la que no está a la vista solo se ubica una vez; después se queda donde se fue
      let [w, h] = tamanos[i].n, compacta = false
      const A = ANCLA[i]
      let x, y, lado = ''
      if (banner) {
        // Notificación: centrada sobre el borde de arriba del teléfono, sin tapar su contenido
        x = T.left + T.width / 2 - w / 2; y = T.top - h * 0.42; lado = 'arriba'
        // Si así pisa el relato (la tableta en el paso 3, con el teléfono arriba), el aviso se apoya sobre el panel; si no, baja hasta debajo del relato
        const R = relato?.getBoundingClientRect()
        if (R && R.width && y < R.bottom + 8) {
          const K = A.en === 'panel' && panel && getComputedStyle(panel).display !== 'none' ? panel.getBoundingClientRect() : null
          if (K && K.width) { x = K.left + K.width / 2 - w / 2; y = K.top - h + 12 } else y = R.bottom + 8
        }
      } else if (A.en === 'panel' && panel && getComputedStyle(panel).display !== 'none') {
        // El aviso llega al panel: se apoya sobre su borde de arriba (12 px encima) y no se mete en el teléfono
        const K = panel.getBoundingClientRect()
        x = K.left + K.width / 2 - w / 2; y = K.top - h + 12; lado = 'arriba'
        x = Math.max(x, T.right - borde) // continuo: antes y después del cambio vale la misma regla, así no salta
      } else {
        y = T.top + T.height * A.y - h / 2
        x = T.right - borde; lado = ''
        // Si le faltan pocos píxeles, se mete un poco más sobre el borde del teléfono (hasta 44 px) antes de cambiar de lado
        if (x + w > innerWidth - M && T.right - (innerWidth - M - w) <= 44) x = innerWidth - M - w
        else if (x + w > innerWidth - M) { x = T.left + borde - w; lado = 'izq' }
        const R = relato?.getBoundingClientRect()
        if (lado === 'izq' && R && R.width && x < R.right + 12) {
          // No cabe a ningún lado: pasa a compacta (solo el título) a la derecha, para no tapar el teléfono
          compacta = true; [w, h] = tamanos[i].k; y = T.top + T.height * A.y - h / 2; x = T.right - borde; lado = ''
        }
      }
      x = Math.min(Math.max(x, M), innerWidth - M - w)
      // El aviso sobre el panel: si al no salirse de la ventana termina sobre el teléfono, también pasa a compacta
      if (!banner && A.en === 'panel' && !compacta && x < T.right - borde - 1) { compacta = true; [w, h] = tamanos[i].k; x = Math.min(Math.max(x + (tamanos[i].n[0] - w) / 2, T.right - borde), innerWidth - M - w) }
      y = Math.min(Math.max(y, techo), innerHeight - M - h)
      const tx = `${(x - D.left).toFixed(1)}px`, ty = `${(y - D.top).toFixed(1)}px`
      if (c.style.getPropertyValue('--ax') !== tx) c.style.setProperty('--ax', tx)
      if (c.style.getPropertyValue('--ay') !== ty) c.style.setProperty('--ay', ty)
      for (const k of ['izq', 'arriba']) if (c.classList.contains(k) !== (lado === k)) c.classList.toggle(k, lado === k)
      if (c.classList.contains('compacta') !== compacta) c.classList.toggle('compacta', compacta)
      if (activa) c.dataset.puesta = '1'
    })
  }

  // Fluidez (16 nov): si el inicio está a la vista lo dice un IntersectionObserver (leer su posición en cada cuadro forzaba un cálculo de estilos),
  // y cuando la salida ya tapó la escena (--sx > 0,65) no se dibuja nada
  let aLaVista = true
  new IntersectionObserver(([e]) => { aLaVista = e.isIntersecting }).observe(inicio)
  const cuadro = () => {
    if (aLaVista && sxActual < 0.65) { anclar(); sincronizar(); if (lista) dibujarToques(); dibujarLineas(); viaje() }
    requestAnimationFrame(cuadro)
  }
  requestAnimationFrame(cuadro)
}

// Ronda 34 · G2: cien personas. Se encienden 62 (a los 3 meses) y después 25 quedan punteadas (37 al año). Sin movimiento, el estado final.
const panelBr = document.querySelector('[data-br-panel]')
if (panelBr) {
  const pts = [...panelBr.querySelectorAll('.br-puntos i')], num = panelBr.querySelector('[data-br-num]'), cuando = panelBr.querySelector('[data-br-cuando]')
  const estado = (on, perdidos) => pts.forEach((p, i) => { p.className = i < on ? 'on' : i < on + perdidos ? 'perdido' : '' })
  estado(37, 25)
  const correr = () => {
    estado(0, 0); num.textContent = '0'; cuando.textContent = 'a los 3 meses'
    let k = 0
    const subir = () => { pts[k].className = 'on'; num.textContent = String(++k); if (k < 62) setTimeout(subir, 20); else setTimeout(bajar, 1500) }
    const bajar = () => { cuando.textContent = 'a los 12 meses'; let m = 61; const paso = () => { pts[m].className = 'perdido'; num.textContent = String(m); m--; if (m >= 37) setTimeout(paso, 55) }; paso() }
    setTimeout(subir, 350)
  }
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window && document.body.dataset.r34g === 'g2' && !['a1', 'a3'].includes(document.body.dataset.r38p)) {
    estado(0, 0); num.textContent = '0'; cuando.textContent = 'a los 3 meses'
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && document.body.dataset.r34g === 'g2') { io.disconnect(); correr() } }, { threshold: 0.5 })
    io.observe(panelBr)
  }
}

// Ronda 35 · P1, P2 y P3 del problema
const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
const r35 = () => document.body.dataset.r35p
// P1: escena pegada. Lee una sola medida por cuadro y solo escribe lo que cambia.
const pr1 = document.querySelector('[data-pr1]')
if (pr1) {
  const ts = [...pr1.querySelectorAll('.pr1-t')], av = [...pr1.querySelectorAll('.pr1-avance i')], pts = [...pr1.querySelectorAll('.pr1-puntos i')], est = pts.map(() => '')
  const poner = (on, per) => pts.forEach((p, i) => { const c = i < on - per ? 'on' : i < on ? 'perdido' : ''; if (est[i] !== c) { est[i] = c; p.className = c } })
  let pasoAct = -1, pend = false
  const cuadro = () => {
    pend = false; if (r35() !== 'p1') return
    const R = pr1.getBoundingClientRect(), p = Math.min(1, Math.max(0, -R.top / (R.height - innerHeight)))
    const paso = p < 0.16 ? 0 : p < 0.5 ? 1 : p < 0.78 ? 2 : 3
    const on = Math.round(62 * Math.min(1, Math.max(0, (p - 0.16) / 0.26))), per = Math.round(25 * Math.min(1, Math.max(0, (p - 0.52) / 0.2)))
    poner(on, per)
    if (paso !== pasoAct) { pasoAct = paso; ts.forEach((t, i) => t.classList.toggle('activo', i === paso)); av.forEach((a, i) => a.classList.toggle('activo', i <= paso)) }
  }
  if (reducir) poner(62, 25)
  else { addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(cuadro) } }, { passive: true }); addEventListener('resize', cuadro); cuadro() }
}
// P2: la cifra rueda de 62 a 37 cuando pasa la mitad de la pantalla
const pr2 = document.querySelector('[data-pr2]')
if (pr2) {
  if (reducir) pr2.classList.add('doce')
  else { let pend = false; const f = () => { pend = false; if (r35() !== 'p2') return; const R = pr2.getBoundingClientRect(); pr2.classList.toggle('doce', R.top + R.height * 0.5 < innerHeight * 0.55) }; addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(f) } }, { passive: true }); f() }
}
// P3: líneas que fluyen de izquierda a derecha; 25 se apagan entre los 3 y los 12 meses. Solo corre a la vista.
const lienzo = document.querySelector('[data-pr3-lienzo]')
if (lienzo) {
  const cx = lienzo.getContext('2d'); let W = 0, H = 0, dpr = 1, carriles = [], corre = false, t0 = performance.now()
  const azar = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  const medir = () => {
    dpr = Math.min(2, devicePixelRatio || 1); W = lienzo.clientWidth; H = lienzo.clientHeight; lienzo.width = W * dpr; lienzo.height = H * dpr
    const x3 = W * 0.1, x12 = W * 0.9, arriba = H * 0.3, abajo = H * (W < 760 ? 0.66 : 0.8) // en el celular, las líneas no pasan bajo el rótulo
    // Los que se apagan quedan repartidos entre las 37 que siguen, para que se vea el raleo en toda la banda
    const orden = [...Array(62).keys()].sort((a, b) => azar(a + 3) - azar(b + 3)), sigue = new Set(orden.slice(0, 37))
    let k = 0
    carriles = [...Array(62).keys()].map((i) => ({ y: arriba + (abajo - arriba) * (i + 0.5) / 62, fin: sigue.has(i) ? W + 40 : x3 + (x12 - x3) * (0.08 + 0.84 * (k++ + azar(i)) / 25), fase: azar(i + 9) * 1000, vel: 34 + azar(i + 21) * 34, onda: azar(i + 40) * 6.28 }))
    return { x3, x12 }
  }
  let marcas = medir()
  const dibujar = (ahora) => {
    const t = (ahora - t0) / 1000
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, H)
    // Marcas de 3 y 12 meses
    cx.strokeStyle = 'rgba(201,233,232,0.28)'; cx.lineWidth = 1; cx.setLineDash([3, 5])
    for (const x of [marcas.x3, marcas.x12]) { cx.beginPath(); cx.moveTo(x, H * 0.28); cx.lineTo(x, H * 0.8); cx.stroke() }
    cx.setLineDash([])
    for (const c of carriles) {
      const y = (x) => c.y + Math.sin(x / 140 + c.onda + t * 0.6) * 3
      // El hilo: tenue y se desvanece donde se corta
      const g = cx.createLinearGradient(0, 0, Math.min(c.fin, W), 0); g.addColorStop(0, 'rgba(201,233,232,0.05)'); g.addColorStop(0.15, 'rgba(201,233,232,0.2)'); g.addColorStop(c.fin > W ? 1 : 0.7, 'rgba(201,233,232,0.2)'); g.addColorStop(1, c.fin > W ? 'rgba(201,233,232,0.24)' : 'rgba(201,233,232,0)')
      cx.strokeStyle = g; cx.lineWidth = 1; cx.beginPath()
      for (let x = 0; x <= Math.min(c.fin, W); x += 12) x === 0 ? cx.moveTo(x, y(x)) : cx.lineTo(x, y(x))
      cx.stroke()
      // Las partículas que viajan por el hilo
      for (let n = 0; n < 3; n++) {
        const tramo = Math.min(c.fin, W + 30) + 30, x = ((c.fase + n * tramo / 3 + t * c.vel) % tramo) - 30
        const a = c.fin > W ? 1 : Math.max(0, Math.min(1, (c.fin - x) / 90))
        if (a <= 0) continue
        const cola = cx.createLinearGradient(x - 26, 0, x, 0); cola.addColorStop(0, 'rgba(201,233,232,0)'); cola.addColorStop(1, `rgba(201,233,232,${0.55 * a})`)
        cx.strokeStyle = cola; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(x - 26, y(x - 26)); cx.lineTo(x, y(x)); cx.stroke()
        cx.fillStyle = `rgba(222,244,243,${a})`; cx.beginPath(); cx.arc(x, y(x), 2.1, 0, 6.283); cx.fill()
      }
    }
  }
  const bucle = (ahora) => { if (!corre) return; dibujar(ahora); requestAnimationFrame(bucle) }
  addEventListener('resize', () => { marcas = medir(); if (!corre) dibujar(performance.now()) })
  if (reducir) dibujar(t0 + 4000)
  else if ('IntersectionObserver' in window) new IntersectionObserver((es) => { const v = es[0].isIntersecting && r35() === 'p3'; if (v && !corre) { corre = true; marcas = medir(); requestAnimationFrame(bucle) } else if (!v) corre = false }).observe(lienzo)
}

// Ronda 38 · el problema con más nivel gráfico (A1 océano, A2 titular y dos cifras, A3 editorial con fotos)
const r38 = () => document.body.dataset.r38p
if (r38() === 'a1') document.querySelector('#problema')?.setAttribute('data-tono', 'oscuro')
const r38f = (f) => { let pend = false; const g = () => { pend = false; f() }; addEventListener('scroll', () => { if (!pend) { pend = true; requestAnimationFrame(g) } }, { passive: true }); addEventListener('resize', g); g() }
const lim = (v) => Math.min(1, Math.max(0, v))
const suave = (v) => v * v * (3 - 2 * v)

// A1 y A3 · cien partículas que flotan sueltas, se ordenan en una grilla al bajar, se encienden 62 y después 25 se van.
// Va con el scroll (y vuelve al subir); el polvo de fondo solo se mueve mientras el panel está a la vista.
const lienzo38 = document.querySelector('[data-r38-lienzo]')
if (lienzo38 && ['a1', 'a3'].includes(r38())) {
  const panel = lienzo38.closest('[data-br-panel]'), num = panel.querySelector('[data-br-num]'), cuando = panel.querySelector('[data-br-cuando]')
  const cx = lienzo38.getContext('2d'), azar = (k) => { const x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
  let W = 0, dpr = 1, celda = 0, x0 = 0, y0 = 0, prog = 0, corre = false, visto = -1
  const gente = [...Array(100).keys()].map((i) => ({ sx: 0.04 + 0.92 * azar(i + 1), sy: 0.04 + 0.92 * azar(i + 101), demora: azar(i + 201) * 0.45, fase: azar(i + 301) * 6.28, va: azar(i + 401) }))
  const polvo = [...Array(90).keys()].map((i) => ({ x: azar(i + 501), y: azar(i + 601), r: 0.5 + azar(i + 701) * 1.1, a: 0.08 + azar(i + 801) * 0.22, v: 0.004 + azar(i + 901) * 0.01 }))
  const medir = () => { dpr = Math.min(2, devicePixelRatio || 1); W = lienzo38.clientWidth; lienzo38.width = lienzo38.height = Math.round(W * dpr); celda = W * 0.8 / 10; x0 = W * 0.1 + celda / 2; y0 = W * 0.1 + celda / 2 }
  const dibujar = (t) => {
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, W)
    const p = prog, junta = lim(p / 0.32), on = Math.round(62 * lim((p - 0.34) / 0.24)), per = Math.round(25 * lim((p - 0.64) / 0.22))
    for (const d of polvo) { const y = ((d.y - t * d.v) % 1 + 1) % 1; cx.fillStyle = `rgba(201,233,232,${d.a})`; cx.beginPath(); cx.arc(d.x * W, y * W, d.r, 0, 6.283); cx.fill() }
    const r = celda * 0.31
    gente.forEach((g, i) => {
      const k = suave(lim((junta - g.demora) / (1 - g.demora)))
      const flota = 1 - k, dx = Math.sin(t * 0.7 + g.fase) * celda * 0.5 * flota, dy = Math.cos(t * 0.6 + g.fase) * celda * 0.5 * flota
      let x = g.sx * W + dx + (x0 + (i % 10) * celda - g.sx * W - dx) * k, y = g.sy * W + dy + (y0 + Math.floor(i / 10) * celda - g.sy * W - dy) * k
      const perdido = i >= 62 - per && i < 62, encendido = i < on && !perdido
      if (perdido) { // se va: vuelve a soltarse y se apaga
        const q = suave(lim((p - 0.64 - (61 - i) * 0.006) / 0.16))
        x += (g.sx * W + Math.sin(t * 0.7 + g.fase) * celda * 0.5 - x) * q * 0.8; y += (g.sy * W + Math.cos(t * 0.6 + g.fase) * celda * 0.5 - y) * q * 0.8
        cx.strokeStyle = `rgba(201,233,232,${0.75 - 0.4 * q})`; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(x, y, r * (1 - 0.25 * q), 0, 6.283); cx.stroke()
      } else if (encendido) { cx.fillStyle = '#c9e9e8'; cx.beginPath(); cx.arc(x, y, r * 1.04, 0, 6.283); cx.fill() }
      else { cx.strokeStyle = `rgba(201,233,232,${0.18 + 0.14 * k})`; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(x, y, r, 0, 6.283); cx.stroke() }
    })
    const n = on - per
    if (n !== visto) { visto = n; num.textContent = String(n); cuando.textContent = per > 0 ? 'a los 12 meses' : 'a los 3 meses' }
  }
  const medirProg = () => { const R = panel.getBoundingClientRect(); prog = reducir ? 1 : lim((innerHeight * 0.92 - R.top) / (innerHeight * 0.8)) }
  medir(); medirProg()
  const bucle = (ahora) => { if (!corre) return; dibujar(ahora / 1000); requestAnimationFrame(bucle) }
  addEventListener('resize', () => { medir(); if (!corre) dibujar(performance.now() / 1000) })
  if (reducir) dibujar(0)
  else {
    r38f(medirProg)
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !corre) { corre = true; requestAnimationFrame(bucle) } else if (!v) corre = false }).observe(lienzo38)
    dibujar(0)
  }
}

// A3 · las fotos se mueven a distinto ritmo (solo transform)
const fotos38 = document.querySelector('[data-r38-fotos]')
if (fotos38 && r38() === 'a3' && !reducir) {
  const imgs = [...fotos38.querySelectorAll('img')], vel = imgs.map((i) => Number(i.dataset.vel))
  r38f(() => { const R = fotos38.getBoundingClientRect(), d = R.top + R.height / 2 - innerHeight / 2; imgs.forEach((im, i) => { im.style.transform = `translate3d(0, ${(d * vel[i]).toFixed(1)}px, 0)` }) })
}

// A2 · el halo crece al llegar al título; las cifras y la tira se cuentan una vez (62 se encienden y luego 25 se apagan)
const dos38 = document.querySelector('[data-r38-dos]')
if (dos38 && r38() === 'a2') {
  const cab = document.querySelector('#problema .r38-cab')
  if (!reducir) r38f(() => { const R = cab.getBoundingClientRect(); cab.style.setProperty('--h', suave(lim((innerHeight - R.top) / (innerHeight * 0.75))).toFixed(3)) })
  const pts = [...dos38.querySelectorAll('.r38-tira i')], n62 = dos38.querySelector('[data-r38-n="62"]'), n37 = dos38.querySelector('[data-r38-n="37"]')
  const estado = (on, per) => pts.forEach((p, i) => { p.className = i < on - per ? 'on' : i < on ? 'perdido' : '' })
  estado(62, 25)
  if (!reducir && 'IntersectionObserver' in window) {
    estado(0, 0); n62.textContent = '0'; n37.textContent = (document.body.dataset.r39 || '').split(' ').includes('mov') ? '0' : '62'
    const io = new IntersectionObserver((es) => {
      if (!es[0].isIntersecting) return; io.disconnect()
      // Ronda 39 · M8: conteo con frenado suave, por tiempo (no a pasos fijos), y la pérdida se desliza hacia atrás
      if ((document.body.dataset.r39 || '').split(' ').includes('mov')) {
        const tramo = (dura, f, fin) => { const t0 = performance.now(); const c = (t) => { const k = Math.min(1, (t - t0) / dura); f(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(c); else fin?.() }; requestAnimationFrame(c) }
        setTimeout(() => tramo(1500, (q) => { const v = Math.round(62 * q); n62.textContent = String(v); n37.textContent = String(v); estado(v, 0) }, () => setTimeout(() => tramo(1400, (q) => { const per = Math.round(25 * q); n37.textContent = String(62 - per); estado(62, per) }), 700)), 250)
        return
      }
      let k = 0
      const subir = () => { pts[k].className = 'on'; n62.textContent = String(++k); if (k < 62) setTimeout(subir, 18); else setTimeout(bajar, 900) }
      const bajar = () => { let m = 61; const paso = () => { pts[m].className = 'perdido'; n37.textContent = String(m); m--; if (m >= 37) setTimeout(paso, 50) }; paso() }
      setTimeout(subir, 300)
    }, (document.body.dataset.r39 || '').split(' ').includes('mov') ? { threshold: 0.9, rootMargin: '0px 0px -28% 0px' } : { threshold: 0.45 })
    io.observe(dos38.querySelector('.r38-cifras') || dos38)
  }
}

// Ronda 40 · siete títulos para el problema (data-r40t), con entrada al llegar y respuesta al mouse
const t40 = document.body.dataset.r40t
const tit40 = document.querySelector('#t-problema .r34-c1')
if (t40 && tit40 && r38() === 'a2') {
  const sec = document.querySelector('#problema')
  const E = '<span class="r38-ac">ejercicio.</span>', C = '<span class="acento">casa.</span>'
  const raya = '<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M3 13 C 45 5, 110 4, 197 9"/></svg>'
  const lineas = (ls) => ls.map((l, i) => `<span class="r40-l"><span class="r40-li" style="--i:${i}">${l}</span></span>`).join('')
  const letras = (t, k0) => { let k = k0; return t.split(' ').filter(Boolean).map((w) => `<span class="r40-p">${[...w].map((c) => { const i = k++, r = Math.sin(i * 12.9898) * 43758.5453, f = r - Math.floor(r); return `<span class="r40-c" style="--i:${i};--dx:${(f * 2 - 1).toFixed(2)};--dy:${(Math.cos(i * 3.1) * 0.5 + 0.5).toFixed(2)};--g:${(Math.sin(i * 7.3)).toFixed(2)}">${c}</span>` }).join('')}</span>`).join(' ') }
  const base = (document.querySelector('[data-r38-fotos] img')?.getAttribute('src') || '/fotos/personas/x').replace(/[^/]+$/, '')
  const foto2 = (f, o, z, i) => `<span class="r40-foto" style="--i:${i};--o:${o};--z:${z}" aria-hidden="true"><img src="${base}${f}-480.webp" alt="" loading="lazy" decoding="async"></span>`
  const foto = (f, i) => `<span class="r40-foto" style="--i:${i}" aria-hidden="true"><img src="${base}${f}" alt="" loading="lazy" decoding="async"></span>`
  const H = {
    t1: lineas(['La artrosis se', `trata con <span class="r40-sub">${E}${raya}</span>`, 'Lo difícil es', `sostenerlo en <span class="r40-sub casa">${C}${raya}</span>`]),
    t3: `La artrosis se trata con ${E} Lo difícil es ${letras('sostenerlo en', 0)} <span class="acento">${letras('casa.', 12)}</span>`,
    t5: `<span class="r40-fila r40-f1"><span class="r40-tag" aria-hidden="true">En la consulta</span><span>La artrosis se trata con ${E}</span></span><span class="r40-via" aria-hidden="true"><i></i></span><span class="r40-fila r40-f2"><span class="r40-tag" aria-hidden="true">En la casa</span><span>Lo difícil es sostenerlo en ${C}</span></span>`,
    t6: (() => {
      // Ronda 41 · fotos y lugar de las píldoras (data-r41p: antes, despues, ritmo; data-r41f: juego de fotos)
      const J = { e: ['movilidad-completa', '55% 27%', 1.4, 'despertar-articular', '58% 36%', 1.2], a: ['fuerza-piernas-silla-muy-bien', '58% 66%', 1.75, 'despertar-articular', '60% 58%', 1.6], b: ['fuerza-piernas-silla', '50% 50%', 1, 'despertar-articular', '50% 50%', 1], c: ['fuerza-piernas-silla-muy-bien', '58% 66%', 1.75, 'salir-del-circulo-del-miedo', '52% 62%', 1.45] }[document.body.dataset.r41f || 'e']
      const f1 = foto2(J[0], J[1], J[2], 0), f2 = foto2(J[3], J[4], J[5], 1)
      // Ronda 42: sin punto final visible (el punto queda para lectores de pantalla, así la pausa se mantiene)
      const E = '<span class="r38-ac">ejercicio</span><span class="solo-lector">.</span>', C = '<span class="acento">casa</span><span class="solo-lector">.</span>'
      const L = { antes: ['La artrosis se trata', `con ${f1} ${E}`, 'Lo difícil es sostenerlo', `en ${f2} ${C}`], despues: ['La artrosis se trata', `con ${E} ${f1}`, 'Lo difícil es sostenerlo', `en ${C} ${f2}`], ritmo: [`La artrosis ${f1} se trata`, `con ${E}`, `Lo difícil es ${f2}`, `sostenerlo en ${C}`] }[document.body.dataset.r41p || 'despues']
      return L.map((l) => `<span class="r40-l">${l}</span>`).join('')
    })(),
    t7: ['La artrosis se', `trata con ${E}`, 'Lo difícil es', `sostenerlo en ${C}`].map((l) => `<span class="r40-l">${l}</span>`).join(''),
  }
  if (H[t40]) { tit40.innerHTML = H[t40]; if (t40 === 't3') document.querySelector('#t-problema').setAttribute('aria-label', 'La artrosis se trata con ejercicio. Lo difícil es sostenerlo en casa.') }
  const cab = sec.querySelector('.r38-cab')
  if (reducir || !('IntersectionObserver' in window)) sec.classList.add('r40-on')
  else { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { sec.classList.add('r40-on'); io.disconnect() } }, { threshold: 0.4 }); io.observe(cab) }
  if (t40 === 't2' && matchMedia('(hover: hover)').matches) tit40.addEventListener('pointermove', (e) => { const R = tit40.getBoundingClientRect(); tit40.style.setProperty('--x', `${e.clientX - R.left}px`); tit40.style.setProperty('--y', `${e.clientY - R.top}px`) })
  if (t40 === 't4' && matchMedia('(hover: hover)').matches && !reducir) {
    const card = sec.querySelector('.cabeza-sec')
    card.addEventListener('pointermove', (e) => { const R = card.getBoundingClientRect(), u = (e.clientX - R.left) / R.width, v = (e.clientY - R.top) / R.height; card.style.setProperty('--x', `${(u * 100).toFixed(1)}%`); card.style.setProperty('--y', `${(v * 100).toFixed(1)}%`); card.style.setProperty('--ry', `${((u - 0.5) * 3).toFixed(2)}deg`); card.style.setProperty('--rx', `${((0.5 - v) * 3).toFixed(2)}deg`) })
    card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg') })
  }
}

// Ronda 41 · fondos del problema (data-r41b)
const f41 = document.body.dataset.r41b
const sec41 = document.querySelector('#problema')
if (f41 && sec41) {
  // F3: trama de puntos; cerca del mouse los puntos crecen y pasan a Mar
  const cv = sec41.querySelector('[data-r41-puntos]')
  if (f41 === 'f3' && cv) {
    const g = cv.getContext('2d'); let W = 0, H = 0, dpr = 1, mx = -999, my = -999, k = 0, on = false, pend = false
    const PASO = 26
    const pintar = () => { pend = false; g.clearRect(0, 0, W, H); for (let y = PASO / 2; y < H; y += PASO) for (let x = PASO / 2; x < W; x += PASO) { const d = Math.hypot(x - mx, y - my), q = Math.max(0, 1 - d / 150) * k; g.fillStyle = q > 0.02 ? `rgb(${36 + 41 * q},${74 + 79 * q},${83 + 70 * q},${0.16 + 0.6 * q})` : 'rgb(36 74 83 / 0.16)'; g.beginPath(); g.arc(x, y, 1.3 + 2.2 * q, 0, 7); g.fill() } }
    const medir = () => { const R = sec41.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); W = R.width; H = R.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); pintar() }
    medir(); addEventListener('resize', medir); new ResizeObserver(medir).observe(sec41)
    if (matchMedia('(hover: hover)').matches && !reducir) {
      sec41.addEventListener('pointermove', (e) => { const R = sec41.getBoundingClientRect(); mx = e.clientX - R.left; my = e.clientY - R.top; k = 1; if (!pend) { pend = true; requestAnimationFrame(pintar) } })
      sec41.addEventListener('pointerleave', () => { k = 0; requestAnimationFrame(pintar) })
    }
  }
  // F4: el hilo se dibuja a medida que la sección pasa por la pantalla
  const hilo = sec41.querySelector('[data-r41-hilo]')
  if (f41 === 'f4' && hilo) {
    const path = hilo.querySelector('path')
    const trazar = () => {
      const R = sec41.getBoundingClientRect(), W = R.width, H = R.height; hilo.setAttribute('viewBox', `0 0 ${W} ${H}`)
      const y = (s, f = 0.5) => { const e = sec41.querySelector(s); if (!e) return H * f; const r = e.getBoundingClientRect(); return r.top - R.top + r.height * f }
      const t = y('.titulo-sec', 0.5), b = y('.br-tiempos', 0.6), c = y('.r39-tercero', 0.4), d = y('.r38-cifras', 0.5), z = y('.br-cierre', 0.5)
      path.setAttribute('d', `M -20 ${t - 120} C ${W * 0.12} ${t - 140}, ${W * 0.06} ${t + 40}, ${W * 0.08} ${t + 120} S ${W * 0.3} ${b + 20}, ${W * 0.5} ${b - 30} S ${W * 0.96} ${b + 60}, ${W * 0.93} ${c} S ${W * 0.62} ${d - 40}, ${W * 0.5} ${(d + c) / 2 + 30} S ${W * 0.05} ${d + 60}, ${W * 0.07} ${z - 60} S ${W * 0.4} ${z + 30}, ${W * 0.5} ${z + 70}`)
    }
    trazar(); addEventListener('resize', trazar); new ResizeObserver(trazar).observe(sec41)
    if (reducir) sec41.style.setProperty('--hilo', '0')
    else r38f(() => { const R = sec41.getBoundingClientRect(); sec41.style.setProperty('--hilo', (1 - lim((innerHeight * 0.85 - R.top) / (R.height + innerHeight * 0.1))).toFixed(4)) })
  }
  // F5 y F7: leve desfase con el scroll
  if ((f41 === 'f5' || f41 === 'f7') && !reducir) {
    r38f(() => { const R = sec41.getBoundingClientRect(), q = lim((innerHeight - R.top) / (R.height + innerHeight)); if (f41 === 'f5') sec41.style.setProperty('--luz-x', `${((q - 0.5) * 18).toFixed(2)}vw`); else sec41.style.setProperty('--pal-d', `${((0.5 - q) * 160).toFixed(1)}px`) })
  }
  if (f41 === 'f7') { const c = sec41.querySelector('.r39-tercero'); const pon = () => { if (!c) return; const R = sec41.getBoundingClientRect(), r = c.getBoundingClientRect(); sec41.style.setProperty('--pal-y', `${(((r.top + r.height / 2) - R.top) / R.height * 100).toFixed(1)}%`) }; pon(); addEventListener('load', pon); if ('ResizeObserver' in window) new ResizeObserver(pon).observe(sec41); else addEventListener('resize', pon) }
}

// Ronda 42 · F4 y F6 juntos (data-r42): tinte leve en el tramo de la casa y una línea con sentido
const l42 = document.body.dataset.r42
const s42 = document.querySelector('#problema')
const svg42 = s42?.querySelector('[data-r42-svg]')
if (l42 && s42 && svg42) {
  const NS = 'http://www.w3.org/2000/svg', fondo = svg42.parentElement
  const el = (t, a, c) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (c) e.setAttribute('class', c); return e }
  // se dibuja una sola vez al bajar (no se borra al subir)
  let piezas = [], curva = null, cy0 = 0, cy1 = 1, dMin = 1
  const dibujar = () => {
    const R = s42.getBoundingClientRect(), W = R.width, H = R.height, cel = W < 760
    const y = (s, f = 0.5) => { const e = s42.querySelector(s); if (!e) return H * f; const r = e.getBoundingClientRect(); return r.top - R.top + r.height * f }
    const yt = y('.titulo-sec'), ya = y('.br-tiempos', 1), yb = y('.r39-tercero', 0), yl = y('.r38-ley', 1), yc = y('.br-cierre', 0), yz = y('.br-cierre')
    // tinte: de «Se pierde en casa» hasta la leyenda de los puntos, con bordes largos
    const pc = (v) => `${(v / H * 100).toFixed(2)}%`
    s42.style.setProperty('--t0a', pc(yb - (cel ? 160 : 220))); s42.style.setProperty('--t0b', pc(yb - 20)); s42.style.setProperty('--t1a', pc(yl + 10)); s42.style.setProperty('--t1b', pc(yl + (cel ? 110 : 170)))
    svg42.setAttribute('viewBox', `0 0 ${W} ${H}`); svg42.replaceChildren(); fondo.querySelectorAll('.r42-et').forEach((e) => e.remove()); piezas = []; curva = null
    if (l42 === 'l1') {
      const y0 = yb - 30, y1 = yl + 10, base = y0 + (y1 - y0) * 0.08, N = 80, k = 1.7
      const b = el('path', { d: `M 0 ${base} H ${W}` }, 'r42-base'); b.dataset.y = base; svg42.append(b); piezas.push(b)
      let d = ''; for (let i = 0; i <= N; i++) { const u = i / N, v = (1 - Math.exp(-k * u)) / (1 - Math.exp(-k)); d += `${i ? 'L' : 'M'} ${(W * u).toFixed(1)} ${(base + (y1 - base) * 0.92 * v).toFixed(1)} ` }
      curva = el('path', { d, pathLength: 1 }, 'r42-curva'); svg42.append(curva); cy0 = base; cy1 = y1
    }
    if (l42 === 'l2') {
      const x = cel ? 7 : Math.max(14, (y('.envoltura') && s42.querySelector('.envoltura').getBoundingClientRect().left - R.left) * 0.45), y0 = yt, y1 = yz, paso = cel ? 14 : 16
      const casa = (v) => { const m0 = yb - 80, m1 = yl + 40; if (v < m0 || v > m1) return 0; return Math.sin(Math.PI * (v - m0) / (m1 - m0)) }
      for (let v = y0, i = 0; v <= y1; v += paso, i++) { const lar = i % 4 === 0 ? (cel ? 6 : 10) : (cel ? 3 : 5), t = el('line', { x1: x, x2: x + lar, y1: v, y2: v }, 'r42-t'); t.style.setProperty('--a', (0.85 - 0.65 * casa(v)).toFixed(2)); t.dataset.y = v; svg42.append(t); piezas.push(t) }
      const hitos = [[y0, 'Consulta'], [(yb + yl) / 2, 'En casa'], [y1, 'Próximo control']]
      for (const [v, n] of hitos) {
        const c = el('circle', { cx: x, cy: v, r: cel ? 3 : 4 }, 'r42-hito'); c.dataset.y = v; svg42.append(c); piezas.push(c)
        if (W >= 1200) { const e = document.createElement('span'); e.className = 'r42-et'; e.textContent = n; e.style.left = `${x + 16}px`; e.style.top = `${v}px`; e.dataset.y = v; fondo.append(e); piezas.push(e) }
      }
    }
    if (l42 === 'l3') {
      const xl = cel ? 8 : Math.max(18, W * 0.035), xr = W - xl, g1 = (ya + yb) / 2, g2 = (yl + yc) / 2, cv = cel ? 40 : 90
      const d = `M ${xl} ${yt - 60} V ${g1 - cv} Q ${xl} ${g1} ${xl + cv} ${g1} H ${xr - cv} Q ${xr} ${g1} ${xr} ${g1 + cv} V ${g2 - cv} Q ${xr} ${g2} ${xr - cv} ${g2} H ${W / 2 + cv} Q ${W / 2} ${g2} ${W / 2} ${g2 + Math.min(cv, (yc - g2) * 0.7)}`
      const p = el('path', { d, fill: 'none' }); svg42.append(p); const L = p.getTotalLength(); p.remove()
      const tb = (s) => { const pb = p.getPointAtLength(L * s); return pb }
      // posición en el recorrido donde empieza y termina el tramo de la casa
      const sCasa0 = 0.42, sCasa1 = 0.86
      const bump = (s) => s < sCasa0 || s > sCasa1 ? 0 : Math.sin(Math.PI * (s - sCasa0) / (sCasa1 - sCasa0))
      svg42.append(p)
      const r = cel ? 2.2 : 3
      for (let l = 0; l <= L;) {
        const s = l / L, q = bump(s), pt = tb(s), mend = s > 0.9
        const c = el('circle', { cx: pt.x.toFixed(1), cy: pt.y.toFixed(1), r: (r * (1 - 0.25 * q)).toFixed(2) }, 'r42-p' + (q > 0.45 ? ' hueco' : '') + (mend ? ' mend' : ''))
        c.style.setProperty('--a', (mend ? 0.75 : 0.42 - 0.12 * q).toFixed(2)); c.dataset.y = pt.y; svg42.append(c); piezas.push(c)
        l += (cel ? 11 : 15) * (1 + 2.6 * q)
      }
      p.remove()
    }
    mover()
  }
  const mover = () => {
    const R = s42.getBoundingClientRect(), yv = reducir ? Infinity : innerHeight * 0.82 - R.top
    for (const e of piezas) if (+e.dataset.y < yv) e.classList.add('on')
    if (curva) { dMin = Math.min(dMin, reducir ? 0 : 1 - lim((yv - cy0) / (cy1 - cy0))); curva.style.setProperty('--d', dMin.toFixed(4)) }
  }
  dibujar(); addEventListener('load', dibujar); if ('ResizeObserver' in window) new ResizeObserver(dibujar).observe(s42)
  r38f(mover)
}

// Ronda 43 · seis propuestas para «Qué es Mend» (data-r43)
const q43 = document.body.dataset.r43
const v43 = q43 && document.querySelector(`.r43-${q43}`)
if (v43) {
  const enVista = (el, cb, th = 0.3) => { if (reducir || !('IntersectionObserver' in window)) return cb(); const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { cb(); io.disconnect() } }, { threshold: th }); io.observe(el) }
  enVista(v43, () => v43.classList.add('r43-on'), 0.25)
  // Q1: el check-in viaja persona → kinesiólogo → médico, con pausa en cada parada
  if (q43 === 'q1') {
    const via = v43.querySelector('.q1-via'), par = via.querySelectorAll('.q1-parada'), X = [16.66, 50, 83.33], nod = v43.querySelectorAll('.q1-cols:first-child .q1-nodo')
    // ronda 44: cada parte se entera cuando llega el check-in (.q1-llega) y la app lo marca antes de salir (.q1-marca); .llega ya existe en el inicio
    const pon = (k, marca = true) => { via.style.setProperty('--vx', `${k}%`); via.style.setProperty('--via', `${((k - 16.66) / 66.67 * 100).toFixed(1)}%`); par.forEach((p, i) => p.classList.toggle('on', k >= X[i] - 0.5)); nod.forEach((n, i) => n.classList.toggle('q1-llega', k >= X[i] - 0.5 && (i > 0 || marca))); nod[0]?.classList.toggle('q1-marca', marca) }
    if (reducir) pon(83.33)
    else enVista(v43, () => {
      const D = 1600, P = 1100; let t0 = performance.now()
      const f = (t) => { const T = (t - t0) % (2 * (D + P) + 1800); let k
        if (T < P) k = X[0]; else if (T < P + D) { const u = (T - P) / D; k = X[0] + (X[1] - X[0]) * (u * u * (3 - 2 * u)) } else if (T < 2 * P + D) k = X[1]; else if (T < 2 * (P + D)) { const u = (T - 2 * P - D) / D; k = X[1] + (X[2] - X[1]) * (u * u * (3 - 2 * u)) } else k = X[2]
        pon(k, T > P * 0.45); requestAnimationFrame(f) }
      requestAnimationFrame(f)
    }, 0.4)
  }
  // Q2: el paso que está al centro de la pantalla manda qué capa se ve
  if (q43 === 'q2') {
    const pasos = v43.querySelectorAll('.q2-paso'), capas = v43.querySelectorAll('.q2-capa'), pts = v43.querySelectorAll('.q2-puntos i')
    const activa = (i) => { pasos.forEach((p, k) => p.classList.toggle('on', k === i)); capas.forEach((c, k) => c.classList.toggle('on', k === i)); pts.forEach((c, k) => c.classList.toggle('on', k === i)) }
    activa(0)
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) activa(+e.target.dataset.i) }), { rootMargin: '-45% 0px -45% 0px' }); pasos.forEach((p) => io.observe(p)) }
  }
  // Q4: la lista cambia la imagen; avanza sola cada 6 s salvo con el mouse encima, el foco o movimiento reducido
  if (q43 === 'q4') {
    const its = v43.querySelectorAll('.q4-item'), ms = v43.querySelectorAll('.q4-m'); let i = 0, tm = null
    const ir = (k) => { i = k; its.forEach((b, j) => { b.setAttribute('aria-pressed', String(j === k)); const bi = b.querySelector('.q4-barra i'); bi.style.animation = 'none'; void bi.offsetWidth; bi.style.animation = '' }); ms.forEach((m, j) => m.classList.toggle('on', j === k)) }
    const ciclo = () => { clearInterval(tm); if (!reducir) tm = setInterval(() => { if (!v43.classList.contains('pausa')) ir((i + 1) % its.length) }, 6000) }
    its.forEach((b, k) => { b.addEventListener('click', () => { ir(k); ciclo() }); if (matchMedia('(hover: hover)').matches) b.addEventListener('pointerenter', () => ir(k)) })
    v43.addEventListener('pointerenter', () => v43.classList.add('pausa')); v43.addEventListener('pointerleave', () => v43.classList.remove('pausa'))
    v43.addEventListener('focusin', () => v43.classList.add('pausa')); v43.addEventListener('focusout', () => v43.classList.remove('pausa'))
    ir(0); enVista(v43, ciclo)
  }
  // Q6: la regla se llena con el scroll (una sola vez); los días y las semanas se tiñen con ella
  if (q43 === 'q6') {
    const tr = v43.querySelector('.q6-tramo'), dias = v43.querySelector('.q6-dias'); let max = 0
    const medir = () => { if (dias) tr.style.setProperty('--q6w', `${dias.getBoundingClientRect().width}px`) }
    medir(); addEventListener('resize', medir)
    const mover = () => { const R = tr.getBoundingClientRect(), q = reducir ? 1 : lim((innerHeight * 0.7 - R.top) / (R.height * 0.85)); if (q > max) { max = q; tr.style.setProperty('--q6', `${(q * 100).toFixed(1)}%`); tr.classList.toggle('lleno', q > 0.98) } }
    r38f(mover)
  }
}

// Ronda 44 · M2: los dispositivos se inclinan hacia el mouse
if (document.body.dataset.r44 === 'm2' && matchMedia('(hover: hover)').matches && !reducir) {
  document.querySelectorAll('.r43-q1 .q1-cols:first-child .q1-nodo').forEach((n) => {
    const d = n.querySelector('.m2 > div'); if (!d) return
    n.addEventListener('pointermove', (e) => { const R = n.getBoundingClientRect(), u = (e.clientX - R.left) / R.width - 0.5, v = (e.clientY - R.top) / R.height - 0.5; d.style.setProperty('--ry', `${(u * 10).toFixed(2)}deg`); d.style.setProperty('--rx', `${(-v * 8).toFixed(2)}deg`) })
    n.addEventListener('pointerleave', () => { d.style.setProperty('--ry', '0deg'); d.style.setProperty('--rx', '0deg') })
  })
}

// Ronda 47: en C3, la raya avanza de 01 a 03 al bajar, cada número se llena al llegar y aparece la vuelta al control
if (document.body.dataset.r47 && document.body.dataset.r46 === 'c3') {
  const ol = document.querySelector('#como-funciona .pasos'), li = ol ? [...ol.children] : [], vu = document.querySelector('#como-funciona .r46-vuelta')
  if (ol) {
    const pon = (k) => { ol.style.setProperty('--r47l', k.toFixed(3)); li.forEach((e, i) => e.classList.toggle('r47-on', k >= i / (li.length - 1) - 0.001)); vu?.classList.toggle('r47-on', k >= 0.999) }
    if (reducir) pon(1)
    else {
      let k0 = 0
      pon(0)
      r38f(() => { const r = ol.getBoundingClientRect(), vh = innerHeight; const k = lim((vh * 0.78 - r.top) / (vh * 0.42)); if (k > k0) { k0 = k; pon(k) } })
    }
  }
}

// Ronda 48 · seis propuestas para «Pasos» (data-r48)
{
  const v = document.body.dataset.r48, raiz = v && document.querySelector('#como-funciona .r48-' + v)
  const vh = () => innerHeight
  if (raiz && v === 'p1') {
    const li = [...raiz.querySelectorAll('.p1-pasos > li')]
    const pon = () => {
      const c = vh() * 0.5; let a = 0
      li.forEach((e, i) => { const r = e.getBoundingClientRect(); if (r.top < c) a = i })
      const o = raiz.querySelector('.p1-pasos').getBoundingClientRect(); raiz.querySelector('.p1-pasos').style.setProperty('--f', reducir ? 1 : lim((c - o.top - vh() * 0.3) / Math.max(1, o.height - vh() * 0.6)).toFixed(3))
      raiz.dataset.paso = a
      li.forEach((e, i) => { e.classList.toggle('r48-on', i === a); e.classList.toggle('r48-hecho', i < a) })
    }
    r38f(pon)
  }
  if (raiz && v === 'p2') {
    const pista = raiz.querySelector('.p2-pista'), fijo = raiz.querySelector('.p2-fijo'), tren = raiz.querySelector('.p2-tren'), est = [...raiz.querySelectorAll('.p2-est')]
    const plano = matchMedia('(max-width: 899px)')
    let largo = 0
    const medir = () => { if (plano.matches || reducir) { pista.style.height = ''; tren.style.setProperty('--x', 0); return } largo = Math.max(0, tren.scrollWidth - fijo.clientWidth); pista.style.height = (largo + vh()) + 'px' }
    medir(); addEventListener('resize', medir); addEventListener('load', medir)
    r38f(() => {
      if (plano.matches || reducir) { est.forEach((e) => e.classList.add('r48-on')); return }
      const r = pista.getBoundingClientRect(), k = lim(-r.top / Math.max(1, r.height - vh()))
      tren.style.setProperty('--x', (k * largo).toFixed(1)); tren.style.setProperty('--k', k.toFixed(3))
      est.forEach((e) => { const b = e.getBoundingClientRect(); e.classList.toggle('r48-on', b.left < innerWidth * 0.6) })
    })
  }
  if (raiz && v === 'p3') {
    const c = [...raiz.querySelectorAll('.p3-carta')]
    r38f(() => c.forEach((e) => {
      const r = e.getBoundingClientRect(), m = (r.top + r.height / 2 - vh() / 2) / vh()
      if (!reducir) e.querySelector('.p3-foto').style.setProperty('--py', (m * -40).toFixed(1))
      if (r.top < vh() * 0.8) e.classList.add('r48-on')
    }))
  }
  if (raiz && v === 'p4') {
    raiz.querySelectorAll('.p4-escala li').forEach((e, i) => e.style.setProperty('--n4', i))
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { raiz.classList.add('r48-vivo'); io.disconnect() } }), { threshold: 0.25 })
    io.observe(raiz.querySelector('.p4-grid'))
    if (reducir) raiz.classList.add('r48-vivo')
    else {
      // El check-in cambia de respuesta cada tanto, como si alguien lo marcara
      const ch = [...raiz.querySelectorAll('.p4-b .r48-check span')]; let n = 1
      setInterval(() => { if (document.hidden) return; n = (n + 1) % ch.length; ch.forEach((s, i) => s.classList.toggle('si', i === n)) }, 1800)
    }
  }
  if (raiz && v === 'p5') {
    const f = [...raiz.querySelectorAll('.p5-fila')]
    r38f(() => f.forEach((e) => { const r = e.getBoundingClientRect(); e.classList.toggle('r48-on', r.top < vh() * 0.55 && r.bottom > vh() * 0.35); if (r.top < vh() * 0.75) e.classList.add('r48-visto') }))
  }
  if (raiz && v === 'p6') {
    const esc = raiz.querySelector('.p6-escena'), est = [...raiz.querySelectorAll('.p6-est')], punto = raiz.querySelector('.p6-punto')
    const ruta = () => raiz.querySelector(getComputedStyle(raiz.querySelector('.p6-ancho')).display === 'none' ? '.p6-alto .p6-ruta' : '.p6-ancho .p6-ruta')
    const vb = (p) => p.ownerSVGElement.viewBox.baseVal
    const ubicar = () => { const p = ruta(), L = p.getTotalLength(), b = vb(p); est.forEach((e, i) => { const q = p.getPointAtLength(L * i / 3); e.style.setProperty('--px', (q.x / b.width).toFixed(4)); e.style.setProperty('--py', (q.y / b.height).toFixed(4)) }) }
    ubicar(); addEventListener('resize', ubicar)
    r38f(() => {
      const r = esc.getBoundingClientRect(), k = reducir ? 1 : lim((vh() * 0.85 - r.top) / (r.height + vh() * 0.25))
      const p = ruta(), L = p.getTotalLength(), b = vb(p), q = p.getPointAtLength(L * (k >= 1 ? 0 : k))
      esc.style.setProperty('--k6', k.toFixed(3)); punto.style.setProperty('--dx', (q.x / b.width).toFixed(4)); punto.style.setProperty('--dy', (q.y / b.height).toFixed(4))
      est.forEach((e, i) => e.classList.toggle('r48-on', k >= i / 3 - 0.001))
      raiz.classList.toggle('r48-cierra', k >= 0.999)
    })
  }
}

// Ronda 49 · el bento (P4): el check-in que cambia la rutina (C1, C2) y la escala que sube hasta el aviso (E1, E2)
{
  const raiz = document.querySelector('#como-funciona .r48-p4'), d = document.body.dataset
  if (raiz && document.body.dataset.r48 === 'p4') {
    raiz.querySelectorAll('.m2-sem li').forEach((e, i) => e.style.setProperty('--i', i))
    const tb = raiz.querySelector('.p4-b')
    if (d.r49c) { let k = 0; tb.dataset.k = reducir ? 1 : 0; if (!reducir) setInterval(() => { if (document.hidden) return; k = (k + 1) % 3; tb.dataset.k = k }, 2600) }
    const esc = raiz.querySelector(d.r49e === 'e2' ? '.r49-e2' : '.r49-e1')
    if (d.r49e && esc) {
      const segs = [...raiz.querySelectorAll('.r49-e1 .e1-barra i')], pal = (n) => (n === 0 ? 'Nada' : n <= 3 ? 'Leve' : n <= 6 ? 'Moderada' : 'Severa')
      const pon = (v) => { const n = Math.round(v); esc.style.setProperty('--v', v.toFixed(2)); esc.querySelector('.e1-num').textContent = n; esc.querySelector('.e1-pal').textContent = pal(n); segs.forEach((s, i) => s.classList.toggle('on', i <= n)); esc.classList.toggle('e-alto', n >= 7) }
      if (reducir) pon(7)
      else {
        pon(2)
        const subir = () => { const t0 = performance.now(); const f = (t) => { const q = Math.min(1, (t - t0) / 1800), e = 1 - (1 - q) ** 3; pon(2 + 5 * e); if (q < 1) requestAnimationFrame(f) }; requestAnimationFrame(f) }
        let on = false
        new IntersectionObserver((es) => { if (es[0].isIntersecting && !on) { on = true; subir(); setInterval(() => { if (document.hidden) return; pon(2); setTimeout(subir, 500) }, 6500) } }, { threshold: 0.5 }).observe(esc)
      }
    }
  }
}

// Ronda 50 · el mazo de rutinas sigue al check-in (CA) y la tarjeta se inclina con el mouse (CB)
{
  const tb = document.querySelector('#como-funciona .p4-b'), d = document.body.dataset
  if (tb && d.r50c) {
    const mazo = [...tb.querySelectorAll('.ca-carta')]
    const pos = () => { const k = +(tb.dataset.k || 0); mazo.forEach((c) => { c.dataset.pos = (+c.dataset.k - k + 3) % 3 }) }
    pos(); new MutationObserver(pos).observe(tb, { attributes: true, attributeFilter: ['data-k'] })
    const giro = tb.querySelector('.cb-giro')
    if (giro && !reducir && matchMedia('(hover: hover)').matches) {
      tb.addEventListener('pointermove', (e) => { const r = tb.getBoundingClientRect(); giro.style.setProperty('--mx', ((e.clientY - r.top) / r.height - 0.5).toFixed(3)); giro.style.setProperty('--my', ((e.clientX - r.left) / r.width - 0.5).toFixed(3)) })
      tb.addEventListener('pointerleave', () => { giro.style.setProperty('--mx', 0); giro.style.setProperty('--my', 0) })
    }
  }
}

// Ronda 56 · Rutinas: seis propuestas (data-r56r). Los clips cargan solo cuando se ven y su variante está elegida; con
// movimiento reducido no avanza nada solo y quedan las fotos.
{
  const r56 = () => document.body.dataset.r56r
  const reducir56 = matchMedia('(prefers-reduced-motion: reduce)').matches
  const tocar = (v, si) => {
    if (!v) return
    if (si && !reducir56) { if (!v.src) v.src = v.dataset.src56; v.play().then(() => v.parentElement.classList.add('sonando')).catch(() => {}) } else if (!v.paused) v.pause()
  }
  const enVista56 = new Map()
  const io56 = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { enVista56.set(e.target, e.isIntersecting); e.target.dispatchEvent(new CustomEvent('vista56', { detail: e.isIntersecting })) }), { threshold: 0.2 }) : null
  const mira = (el, cb) => { if (!io56) return cb(true); el.addEventListener('vista56', (e) => cb(e.detail)); io56.observe(el) }
  const visible = (el) => el.offsetParent !== null

  // GA: avanza sola cada 6 s, con la barra del punto actual llenándose; se detiene con el botón o al tocar un punto
  const ga = document.querySelector('[data-r56-ga]')
  if (ga) {
    const pista = ga.querySelector('.ga-pista'), ds = [...ga.querySelectorAll('.ga-d')], ps = [...ga.querySelectorAll('.ga-puntos button')], boton = ga.querySelector('.ga-pausa')
    let i = 0, t0 = performance.now(), parado = reducir56, vista = false, raf = 0
    const DUR = 6000
    const ir = (n, suave = true) => { i = (n + ds.length) % ds.length; t0 = performance.now(); const d = ds[i]; pista.scrollTo({ left: d.offsetLeft - (pista.clientWidth - d.offsetWidth) / 2, behavior: suave && !reducir56 ? 'smooth' : 'auto' }); marca() }
    const marca = () => { ds.forEach((d, k) => { d.classList.toggle('activa', k === i); tocar(d.querySelector('video'), k === i && vista && visible(ga)) }); ps.forEach((p, k) => { p.classList.toggle('actual', k === i); p.setAttribute('aria-current', k === i ? 'true' : 'false'); p.querySelector('i').style.setProperty('--p', 0) }) }
    const bucle = (t) => { if (!vista) return (raf = 0); const p = Math.min(1, (t - t0) / DUR); ps[i].querySelector('i').style.setProperty('--p', parado ? 0 : p); if (parado) t0 = t; else if (p >= 1) ir(i + 1); raf = requestAnimationFrame(bucle) }
    ps.forEach((p, k) => p.addEventListener('click', () => { parado = true; boton.classList.add('parado'); boton.setAttribute('aria-label', 'Seguir'); ir(k) }))
    boton.addEventListener('click', () => { parado = !parado; t0 = performance.now(); boton.classList.toggle('parado', parado); boton.setAttribute('aria-label', parado ? 'Seguir' : 'Pausar') })
    if (reducir56) { boton.classList.add('parado'); boton.setAttribute('aria-label', 'Seguir') }
    let fin; pista.addEventListener('scroll', () => { clearTimeout(fin); fin = setTimeout(() => { const c = pista.scrollLeft + pista.clientWidth / 2; const k = ds.reduce((m, d, n) => Math.abs(d.offsetLeft + d.offsetWidth / 2 - c) < Math.abs(ds[m].offsetLeft + ds[m].offsetWidth / 2 - c) ? n : m, 0); if (k !== i) { i = k; t0 = performance.now(); marca() } }, 120) }, { passive: true })
    mira(ga, (v) => { vista = v; marca(); if (v && !raf) { ir(i, false); raf = requestAnimationFrame(bucle) } })
    addEventListener('resize', () => ir(i, false))
  }

  // EL: pestañas por tema con el indicador que se desliza; en cada tema, la lista elige la ficha grande
  const el = document.querySelector('[data-r56-el]')
  if (el) {
    const tabs = [...el.querySelectorAll('[role="tab"]')], ind = el.querySelector('.el-ind'), panels = [...el.querySelectorAll('[role="tabpanel"]')]
    let vista = false, quieto = reducir56, auto = 0
    const mide = () => { const t = tabs.find((b) => b.getAttribute('aria-selected') === 'true'); ind.style.setProperty('--x', t.offsetLeft + 'px'); ind.style.setProperty('--w', t.offsetWidth + 'px') }
    const ficha = (p, j) => { p.querySelectorAll('.el-ficha').forEach((f) => { const on = +f.dataset.j === j; f.classList.toggle('activa', on); tocar(f.querySelector('video'), on && vista && visible(el)) }); p.querySelectorAll('.el-lista button').forEach((b) => b.setAttribute('aria-current', +b.dataset.j === j ? 'true' : 'false')) }
    const actual = () => panels.find((p) => !p.hidden)
    const tema = (k) => { tabs.forEach((t, n) => { t.setAttribute('aria-selected', n === k ? 'true' : 'false'); t.tabIndex = n === k ? 0 : -1 }); panels.forEach((p, n) => { p.hidden = n !== k }); ficha(panels[k], 0); mide() }
    tabs.forEach((t, k) => { t.addEventListener('click', () => { quieto = true; tema(k) }); t.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); const n = (k + d + tabs.length) % tabs.length; quieto = true; tema(n); tabs[n].focus() } }) })
    panels.forEach((p) => p.querySelectorAll('.el-lista button').forEach((b) => b.addEventListener('click', () => { quieto = true; ficha(p, +b.dataset.j) })))
    // Sin tocar nada, recorre las rutinas del tema y luego pasa al siguiente (una vuelta cada 5,5 s)
    const paso = () => { if (quieto || !vista) return; const p = actual(), n = p.querySelectorAll('.el-ficha').length, j = +p.querySelector('.el-ficha.activa').dataset.j; if (j + 1 < n) ficha(p, j + 1); else tema((panels.indexOf(p) + 1) % panels.length) }
    tema(0)
    mira(el, (v) => { vista = v; ficha(actual(), +actual().querySelector('.el-ficha.activa').dataset.j); mide(); clearInterval(auto); if (v) auto = setInterval(paso, 5500) })
    addEventListener('resize', mide); document.fonts?.ready.then(mide)
  }

  // CA: al pasar o enfocar una tarjeta, su clip toma la portada; en pantallas táctiles la grande corre sola a la vista
  const ca = document.querySelector('.r56-ca')
  if (ca) {
    const ts = [...ca.querySelectorAll('.ca-t')]
    ts.forEach((t) => { const v = t.querySelector('video'); const on = () => tocar(v, true), off = () => { tocar(v, false); t.querySelector('.c56').classList.remove('sonando') }; t.addEventListener('mouseenter', on); t.addEventListener('focus', on); t.addEventListener('mouseleave', off); t.addEventListener('blur', off) })
    if (matchMedia('(hover: none)').matches) mira(ts[0], (v) => tocar(ts[0].querySelector('video'), v && r56() === 'ca'))
  }

  // MU: cada clip del muro corre solo mientras se ve
  document.querySelectorAll('.mu-clip').forEach((c) => mira(c, (v) => tocar(c.querySelector('video'), v && r56() === 'mu')))

  // LI: recorre la rutina, 3,6 s por ejercicio; Listo pasa a Hecho y se marca la serie, como en la rutina guiada
  const li = document.querySelector('[data-r56-li]')
  if (li) {
    const pasos = [...li.querySelectorAll('.li-pasos li')], clips = [...li.querySelectorAll('.li-clip')], segs = [...li.querySelectorAll('.li-seg i')], cab = li.querySelector('.li-cabezal')
    const bloque = li.querySelector('.li-bloque'), num = li.querySelector('.li-paso b'), puntos = li.querySelector('.li-puntos'), btn = li.querySelector('.li-btn'), acc = li.querySelector('.li-a')
    const DUR = 3600, N = pasos.length, CAL = 3, PESO = [3, 16]
    let i = 0, t0 = performance.now(), vista = false, raf = 0, serie = -1
    const pon = (n) => {
      i = n % N; t0 = performance.now(); serie = -1
      pasos.forEach((p, k) => { p.classList.toggle('activo', k === i); p.classList.toggle('listo', k < i); p.querySelector('.li-prog').style.setProperty('--p', 0) })
      clips.forEach((c, k) => { c.classList.toggle('activo', k === i); tocar(c.querySelector('video'), k === i && vista && visible(li)) })
      bloque.textContent = pasos[i].dataset.bloque; num.textContent = i + 1; acc.textContent = pasos[i].dataset.accion
      puntos.innerHTML = '<i></i>'.repeat(+pasos[i].dataset.series); btn.classList.remove('hecho')
    }
    const bucle = (t) => {
      if (!vista) return (raf = 0)
      const p = Math.min(1, (t - t0) / DUR), s = +pasos[i].dataset.series
      pasos[i].querySelector('.li-prog').style.setProperty('--p', p)
      const k = Math.min(s - 1, Math.floor(p * s * 0.999)); const fase = p * s - k
      if (fase > 0.62 && serie < k) { serie = k; btn.classList.add('hecho'); puntos.children[k]?.classList.add('hecho') } else if (fase < 0.62 && serie === k - 1 && btn.classList.contains('hecho')) btn.classList.remove('hecho')
      // Posición en la línea: los 3 primeros pasos llenan el calentamiento y los otros 5 la fuerza
      const enCal = i < CAL, f = enCal ? (i + p) / CAL : (i - CAL + p) / (N - CAL)
      segs[0].style.setProperty('--f', enCal ? f : 1); segs[1].style.setProperty('--f', enCal ? 0 : f)
      const tot = PESO[0] + PESO[1], x = enCal ? f * PESO[0] / tot : (PESO[0] + f * PESO[1]) / tot
      cab.style.setProperty('--t', `calc(${(x * 100).toFixed(2)}% + ${(enCal ? 0 : 6 * (1 - x)).toFixed(1)}px)`)
      if (p >= 1) pon(i + 1)
      raf = requestAnimationFrame(bucle)
    }
    pasos.forEach((p, k) => { p.addEventListener('click', () => pon(k)) })
    pon(0)
    mira(li, (v) => { vista = v; if (reducir56) return; pon(i); if (v && !raf) raf = requestAnimationFrame(bucle) })
  }

  // UT: los paneles se abren al pasar, al tocar o con el teclado; solos avanzan cada 5 s hasta que alguien los toca
  const ut = document.querySelector('[data-r56-ut]')
  if (ut) {
    const ps = [...ut.querySelectorAll('.ut-p')]
    let k = 0, vista = false, quieto = reducir56, auto = 0
    const abre = (n) => { k = n; ps.forEach((p, j) => { const on = j === n; p.classList.toggle('activo', on); p.querySelector('.ut-boton').setAttribute('aria-expanded', on); tocar(p.querySelector('video'), on && vista && visible(ut)) }) }
    ps.forEach((p, j) => { const b = p.querySelector('.ut-boton'); b.addEventListener('click', () => { quieto = true; abre(j) }); if (matchMedia('(hover: hover)').matches) p.addEventListener('mouseenter', () => { quieto = true; abre(j) }) })
    mira(ut, (v) => { vista = v; abre(k); clearInterval(auto); if (v) auto = setInterval(() => { if (!quieto) abre((k + 1) % ps.length) }, 5000) })
  }
}

// Ronda 57 · Rutinas: GA, EL y UT mejoradas y tres nuevas (CI, DO, TE), con data-r57r. Todo avanza solo mientras se ve,
// con una barra que avisa cuánto falta; al tocar, se queda donde la persona eligió. Con movimiento reducido no avanza nada.
{
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const tocar = (v, si) => {
    if (!v) return
    if (si && !reducir) { if (!v.src) v.src = v.dataset.src56; v.play().then(() => v.parentElement.classList.add('sonando')).catch(() => {}) } else if (!v.paused) v.pause()
  }
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => e.target.dispatchEvent(new CustomEvent('vista57', { detail: e.isIntersecting }))), { threshold: 0.25 }) : null
  const mira = (el, cb) => { if (!io) return cb(true); el.addEventListener('vista57', (e) => cb(e.detail)); io.observe(el) }
  // Un ciclo: n pasos de dur ms; pon(i, vista) dibuja el paso, prog(i, p) la barra
  const ciclo = (el, n, dur, pon, prog) => {
    let i = 0, t0 = performance.now(), vista = false, raf = 0, quieto = reducir
    const ir = (k) => { prog(i, 0); i = (k + n) % n; t0 = performance.now(); pon(i, vista) }
    const bucle = (t) => { if (!vista) return (raf = 0); const p = Math.min(1, (t - t0) / dur); prog(i, quieto ? 0 : p); if (quieto) t0 = t; else if (p >= 1) ir(i + 1); raf = requestAnimationFrame(bucle) }
    mira(el, (v) => { vista = v; pon(i, v); if (v && !raf) { t0 = performance.now(); raf = requestAnimationFrame(bucle) } })
    return { ir, elige: (k) => { quieto = true; ir(k) }, get i() { return i }, get quieto() { return quieto }, set quieto(q) { quieto = q; t0 = performance.now() } }
  }
  const barra = (el, p) => el && el.style.setProperty('--p', p)

  // GA2: la galería avanza cada 6,5 s; flechas, puntos y pausa
  const ga = document.querySelector('[data-r57-ga]')
  if (ga) {
    const pista = ga.querySelector('.g2-pista'), ds = [...ga.querySelectorAll('.g2-d')], ps = [...ga.querySelectorAll('.g2-puntos button')], pausa = ga.querySelector('.g2-pausa')
    let mover = true
    const c = ciclo(ga, ds.length, 6500, (i, vista) => {
      if (mover) pista.scrollTo({ left: ds[i].offsetLeft - ds[0].offsetLeft, behavior: reducir ? 'auto' : 'smooth' })
      ds.forEach((d, k) => { d.classList.toggle('activa', k === i); tocar(d.querySelector('video'), k === i && vista) })
      ps.forEach((p, k) => { p.classList.toggle('actual', k === i); p.setAttribute('aria-current', k === i ? 'true' : 'false') })
    }, (i, p) => barra(ds[i].querySelector('.g2-prog'), p))
    const marcaPausa = () => { pausa.classList.toggle('parado', c.quieto); pausa.setAttribute('aria-label', c.quieto ? 'Seguir' : 'Pausar') }
    const elige = (k) => { c.elige(k); marcaPausa() }
    ps.forEach((p, k) => p.addEventListener('click', () => elige(k)))
    ga.querySelector('.g2-ant').addEventListener('click', () => elige(c.i - 1))
    ga.querySelector('.g2-sig').addEventListener('click', () => elige(c.i + 1))
    pausa.addEventListener('click', () => { c.quieto = !c.quieto; marcaPausa() })
    marcaPausa()
    // Si la persona desliza la pista, la diapositiva que queda al inicio pasa a ser la activa
    let fin; pista.addEventListener('scroll', () => { clearTimeout(fin); fin = setTimeout(() => { const x = pista.scrollLeft + ds[0].offsetLeft; const k = ds.reduce((m, d, n) => Math.abs(d.offsetLeft - x) < Math.abs(ds[m].offsetLeft - x) ? n : m, 0); if (k !== c.i) { mover = false; c.ir(k); mover = true } }, 140) }, { passive: true })
    addEventListener('resize', () => pista.scrollTo({ left: ds[c.i].offsetLeft - ds[0].offsetLeft }))
  }

  // EL2: pestañas por tema; sin tocar, recorre cada rutina del tema (6 s) y pasa al siguiente
  const el = document.querySelector('[data-r57-el]')
  if (el) {
    const tabs = [...el.querySelectorAll('[role="tab"]')], ind = el.querySelector('.e2-ind'), panels = [...el.querySelectorAll('[role="tabpanel"]')]
    const pasos = panels.flatMap((p, t) => [...p.querySelectorAll('.e2-ficha')].map((f, j) => [t, j]))
    const mide = () => { const t = tabs.find((b) => b.getAttribute('aria-selected') === 'true'); ind.style.setProperty('--x', t.offsetLeft + 'px'); ind.style.setProperty('--w', t.offsetWidth + 'px') }
    const boton = (t, j) => panels[t].querySelector(`.e2-lista [data-j="${j}"]`)
    const c = ciclo(el, pasos.length, 6000, (k, vista) => {
      const [t, j] = pasos[k]
      tabs.forEach((b, n) => { b.setAttribute('aria-selected', n === t ? 'true' : 'false'); b.tabIndex = n === t ? 0 : -1 })
      panels.forEach((p, n) => { p.hidden = n !== t })
      panels[t].querySelectorAll('.e2-ficha').forEach((f) => { const on = +f.dataset.j === j; f.classList.toggle('activa', on); tocar(f.querySelector('video'), on && vista) })
      panels[t].querySelectorAll('.e2-lista button').forEach((b) => b.setAttribute('aria-current', +b.dataset.j === j ? 'true' : 'false'))
      const b = boton(t, j); if (b && vista) { const l = b.closest('.e2-lista'); if (l.scrollWidth > l.clientWidth) l.scrollTo({ left: b.parentElement.offsetLeft - l.firstElementChild.offsetLeft, behavior: reducir ? 'auto' : 'smooth' }) }
      mide()
    }, (k, p) => barra(boton(...pasos[k])?.querySelector('.e2-t'), p))
    const a = (t, j = 0) => pasos.findIndex(([x, y]) => x === t && y === j)
    tabs.forEach((b, t) => {
      b.addEventListener('click', () => c.elige(a(t)))
      b.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); const n = (t + d + tabs.length) % tabs.length; c.elige(a(n)); tabs[n].focus() } })
    })
    panels.forEach((p, t) => p.querySelectorAll('.e2-lista button').forEach((b) => b.addEventListener('click', () => c.elige(a(t, +b.dataset.j)))))
    addEventListener('resize', mide); document.fonts?.ready.then(mide); mide()
  }

  // UT2: los paneles se abren por turno cada 5 s; al tocar uno, se queda abierto
  const ut = document.querySelector('[data-r57-ut]')
  if (ut) {
    const ps = [...ut.querySelectorAll('.u2-p')]
    const c = ciclo(ut, ps.length, 5000, (i, vista) => ps.forEach((p, k) => { const on = k === i; p.classList.toggle('activo', on); p.querySelector('.u2-boton').setAttribute('aria-expanded', on ? 'true' : 'false'); tocar(p.querySelector('video'), on && vista) }),
      (i, p) => barra(ps[i].querySelector('.u2-prog'), p))
    // 18 nov: al pasar el mouse se abre ese panel (con un respiro de 140 ms para que no parpadee mientras los paneles se mueven);
    // al salir vuelve al que se tocó, y si no se tocó ninguno sigue avanzando solo. El clic lo deja fijo.
    let fijo = null, espera = 0
    ps.forEach((p, k) => p.addEventListener('click', () => { fijo = k; c.elige(k) })) // todo el panel: con el hover ya está abierto cuando llega el clic
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      ps.forEach((p, k) => {
        p.addEventListener('pointerenter', () => { clearTimeout(espera); espera = setTimeout(() => { c.quieto = true; if (c.i !== k) c.ir(k) }, 140) })
      })
      ut.querySelector('.u2-p')?.parentElement.addEventListener('pointerleave', () => {
        clearTimeout(espera)
        if (fijo !== null) { if (c.i !== fijo) c.ir(fijo) } else c.quieto = reducir
      })
    }
  }

  // CI: el check-in real; recorre las cinco respuestas (4,5 s) y muestra lo que Mend sugiere para cada una
  const ci = document.querySelector('[data-r57-ci]')
  if (ci) {
    const ops = [...ci.querySelectorAll('[role="radio"]')], fs = [...ci.querySelectorAll('.c2-ficha')]
    const c = ciclo(ci, ops.length, 4500, (i, vista) => {
      ops.forEach((o, k) => { o.setAttribute('aria-checked', k === i ? 'true' : 'false'); o.tabIndex = k === i ? 0 : -1 })
      fs.forEach((f) => { const on = +f.dataset.k === i; f.classList.toggle('activa', on); tocar(f.querySelector('video'), on && vista) })
    }, (i, p) => barra(ops[i].querySelector('.c2-t'), p))
    ops.forEach((o, k) => {
      o.addEventListener('click', () => c.elige(k))
      o.addEventListener('keydown', (e) => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); const n = (k + d + ops.length) % ops.length; c.elige(n); ops[n].focus() } })
    })
  }

  // DO: los puntos de la foto (cadera, rodilla, tobillo) se encienden por turno; al tocar uno, queda elegido
  const dn = document.querySelector('[data-r57-do]')
  if (dn) {
    const pts = [...dn.querySelectorAll('.d2-punto')], zs = [...dn.querySelectorAll('.d2-zona')]
    const c = ciclo(dn, pts.length, 5000, (i) => { pts.forEach((p, k) => { p.classList.toggle('activo', k === i); p.setAttribute('aria-pressed', k === i ? 'true' : 'false') }); zs.forEach((z) => z.classList.toggle('activa', +z.dataset.k === i)) }, () => {})
    pts.forEach((p, k) => p.addEventListener('click', () => c.elige(k)))
  }

  // TE: las capturas reales de la app pasan como en el teléfono (empujando hacia la izquierda), cada 4 s
  const te = document.querySelector('[data-r57-te]')
  if (te) {
    const caps = [...te.querySelectorAll('.t2-cap')], lis = [...te.querySelectorAll('.t2-pasos li')]
    const c = ciclo(te, lis.length, 4000, (i) => {
      caps.forEach((f, k) => { f.classList.toggle('activa', k === i); f.classList.toggle('antes', k < i) })
      lis.forEach((l, k) => { l.classList.toggle('activo', k === i); l.querySelector('button').setAttribute('aria-current', k === i ? 'step' : 'false') })
    }, (i, p) => barra(lis[i].querySelector('.t2-t'), p))
    lis.forEach((l, k) => l.querySelector('button').addEventListener('click', () => c.elige(k)))
  }
}

// Ronda 58 · Aprender: seis propuestas (data-r58a). Los audios y el video son los de la app y cargan solo al tocar (el video,
// sin sonido, también cuando se ve su pestaña). Los subtítulos y la letra salen de los tiempos de la voz de la app. Suena uno a la vez.
{
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => e.target.dispatchEvent(new CustomEvent('vista58', { detail: e.isIntersecting }))), { threshold: 0.25 }) : null
  const mira = (el, cb) => { if (!io) return cb(true); el.addEventListener('vista58', (e) => cb(e.detail)); io.observe(el) }
  const barra = (el, p) => el && el.style.setProperty('--p', p)
  const ciclo = (el, n, dur, pon, prog) => {
    let i = 0, t0 = performance.now(), vista = false, raf = 0, quieto = reducir
    const durDe = (k) => (typeof dur === 'function' ? dur(k) : dur)
    const ir = (k) => { prog(i, 0); i = (k + n) % n; t0 = performance.now(); pon(i, vista) }
    const bucle = (t) => { if (!vista) return (raf = 0); const p = Math.min(1, (t - t0) / durDe(i)); prog(i, quieto ? 0 : p); if (quieto) t0 = t; else if (p >= 1) ir(i + 1); raf = requestAnimationFrame(bucle) }
    mira(el, (v) => { vista = v; pon(i, v); if (v && !raf) { t0 = performance.now(); raf = requestAnimationFrame(bucle) } })
    return { ir, elige: (k) => { quieto = true; ir(k) }, get i() { return i }, get quieto() { return quieto }, set quieto(q) { quieto = q; t0 = performance.now() } }
  }
  const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`
  const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])
  const todos = new Set()

  // Un reproductor: el medio, sus tiempos (frases por lámina) y lo que se dibuja con ellos
  const reproductor = (caja) => {
    const m = caja.querySelector('.a8-medio'), tr = JSON.parse(caja.querySelector('.a8-tr').textContent)
    const frases = tr.l.flatMap((l, k) => l.f.map((f) => ({ i: f[0], f: f[1], t: f[2], h: f[3], lam: k })))
    const sub = caja.querySelector('.a8-sub'), lam = caja.querySelector('.a8-lam'), quien = caja.querySelector('.a8-quien')
    const bs = [...caja.querySelectorAll('.a8-barra')], va = caja.querySelector('.a8-va'), play = caja.querySelector('.a8-play:not([data-sonido])')
    const letra = [...caja.querySelectorAll('.es-letra button')], lista = caja.querySelector('.es-letra')
    const esVideo = m.tagName === 'VIDEO'
    let ultima = -1, raf = 0
    const carga = () => { if (!m.src) m.src = m.dataset.src }
    const dibuja = () => {
      const t = m.currentTime || 0
      bs.forEach((b) => barra(b.firstElementChild, Math.min(1, t / tr.dur)))
      if (va) va.textContent = mmss(t)
      let k = frases.findIndex((f) => t < f.f); if (k < 0) k = frases.length - 1
      const f = frases[k]
      if (k !== ultima) {
        ultima = k
        if (sub) sub.innerHTML = esVideo ? `<span>${esc(f.t)}</span>` : f.t.split(' ').map((w) => `<span>${esc(w)}</span>`).join(' ')
        if (lam && tr.l[f.lam].cap) lam.innerHTML = esc(tr.l[f.lam].cap).replace(/\*(.+?)\*/g, '<span class="acento">$1</span>')
        if (quien) quien.textContent = f.h === 'A' ? 'Pregunta' : 'Responde'
        letra.forEach((b, n) => b.classList.toggle('ahora', n === k))
        if (lista && letra[k]) lista.scrollTo({ top: letra[k].offsetTop - lista.offsetTop - lista.clientHeight * 0.3, behavior: reducir ? 'auto' : 'smooth' })
      }
      if (sub && !esVideo) { const ws = sub.children, p = (t - f.i) / Math.max(0.1, f.f - f.i); for (let n = 0; n < ws.length; n++) ws[n].classList.toggle('dicho', t >= f.i && n < Math.ceil(p * ws.length)) }
    }
    const bucle = () => { dibuja(); if (!m.paused) raf = requestAnimationFrame(bucle); else raf = 0 }
    const etq = play?.querySelector('span'), txt0 = etq?.textContent
    const rotula = (si) => { if (!play) return; if (etq) etq.textContent = si ? 'Pausar' : txt0; else play.setAttribute('aria-label', si ? 'Pausar' : 'Escuchar') }
    m.addEventListener('play', () => { caja.classList.add('suena'); if (!m.muted) todos.forEach((o) => o !== api && o.pausa()); if (!raf) raf = requestAnimationFrame(bucle); rotula(true) })
    m.addEventListener('pause', () => { caja.classList.remove('suena'); rotula(false) })
    m.addEventListener('ended', () => { if (esVideo && m.muted) { m.currentTime = 0; m.play().catch(() => {}) } })
    const api = {
      caja, conSonido: () => !m.paused && !m.muted,
      toca: () => { carga(); if (m.paused) m.play().catch(() => {}); else m.pause() },
      ve: (si) => { if (!esVideo || reducir) return; if (si) { carga(); m.muted = true; m.loop = false; m.play().catch(() => {}) } else if (!m.paused) m.pause() },
      sonido: () => { carga(); m.muted = false; m.currentTime = 0; m.play().catch(() => {}) },
      va: (t) => { carga(); m.currentTime = t; ultima = -1; dibuja(); if (m.paused) m.play().catch(() => {}) },
      lento: (si) => { m.playbackRate = si ? 0.85 : 1 },
      pausa: () => { if (!m.paused) m.pause() },
    }
    if (play) play.addEventListener('click', api.toca)
    caja.querySelector('[data-sonido]')?.addEventListener('click', api.sonido)
    letra.forEach((b) => b.addEventListener('click', () => api.va(+b.dataset.t)))
    caja.querySelector('.es-lento')?.addEventListener('click', (e) => { const b = e.currentTarget, si = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', si); api.lento(si) })
    bs.forEach((b) => { b.style.cursor = 'pointer'; b.addEventListener('click', (e) => { const r = b.getBoundingClientRect(); api.va(((e.clientX - r.left) / r.width) * tr.dur) }) })
    dibuja()
    mira(caja, (v) => { if (!v) api.pausa() })
    todos.add(api)
    return api
  }

  // RU: la ruta avanza pieza por pieza (2,4 s) y cambia de etapa cuando corresponde
  const ru = document.querySelector('[data-r58-ru]')
  if (ru) {
    const bs = [...ru.querySelectorAll('.ru-lista button')].sort((a, b) => a.dataset.k - b.dataset.k), cols = [...ru.querySelectorAll('.ru-col')], tabs = [...ru.querySelectorAll('.ru-tabs button')]
    const etapa = (b) => +b.closest('.ru-col').dataset.e
    const c = ciclo(ru, bs.length, 2400, (i) => {
      bs.forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'))
      const e = etapa(bs[i]); cols.forEach((x, n) => x.classList.toggle('activa', n === e)); tabs.forEach((t, n) => t.setAttribute('aria-selected', n === e ? 'true' : 'false'))
    }, (i, p) => barra(bs[i].querySelector('.ru-t'), p))
    bs.forEach((b, k) => b.addEventListener('click', () => c.elige(k)))
    tabs.forEach((t, n) => t.addEventListener('click', () => c.elige(bs.findIndex((b) => etapa(b) === n))))
  }

  // FO: una pestaña por formato (8 s cada una) hasta que alguien toque; si algo suena con sonido, no cambia sola
  const fo = document.querySelector('[data-r58-fo]')
  if (fo) {
    const tabs = [...fo.querySelectorAll('[role="tab"]')], ps = tabs.map((t) => fo.querySelector('#' + t.getAttribute('aria-controls')))
    const rs = ps.map((p) => (p.hasAttribute('data-medio') ? reproductor(p) : null))
    const c = ciclo(fo, tabs.length, 8000, (i, vista) => {
      tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1 })
      ps.forEach((p, k) => { p.hidden = k !== i; if (k !== i) rs[k]?.pausa() })
      rs[i]?.ve(vista)
    }, (i, p) => { if (rs.some((r) => r?.conSonido())) c.quieto = true; barra(tabs[i].querySelector('.fo-t'), p) })
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => c.elige(k))
      t.addEventListener('keydown', (e) => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); const n = (k + d + tabs.length) % tabs.length; c.elige(n); tabs[n].focus() } })
    })
  }

  // ES: el episodio entero, con la letra que sigue la voz
  const es = document.querySelector('[data-r58-es]')
  if (es) reproductor(es)

  // CK: recorre las cinco respuestas del check-in (4,5 s) y muestra lo que Aprender sugiere
  const ck = document.querySelector('[data-r58-ck]')
  if (ck) {
    const ops = [...ck.querySelectorAll('[role="radio"]')], rs = [...ck.querySelectorAll('.ck-res')]
    const c = ciclo(ck, ops.length, 4500, (i) => { ops.forEach((o, k) => { o.setAttribute('aria-checked', k === i ? 'true' : 'false'); o.tabIndex = k === i ? 0 : -1 }); rs.forEach((r) => r.classList.toggle('activa', +r.dataset.k === i)) },
      (i, p) => barra(ops[i].querySelector('.ck-t'), p))
    ops.forEach((o, k) => {
      o.addEventListener('click', () => c.elige(k))
      o.addEventListener('keydown', (e) => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); const n = (k + d + ops.length) % ops.length; c.elige(n); ops[n].focus() } })
    })
  }

  // ED: la portada cambia entre cinco destacadas (6 s); el índice abre cualquiera de las 16
  const ed = document.querySelector('[data-r58-ed]')
  if (ed) {
    const ds = [...ed.querySelectorAll('.ed-d')], bs = [...ed.querySelectorAll('.ed-ind button')], dest = bs.filter((b) => b.hasAttribute('data-dest'))
    const muestra = (id) => { ds.forEach((d) => d.classList.toggle('activa', d.dataset.id === id)); bs.forEach((b) => b.setAttribute('aria-current', b.dataset.id === id ? 'true' : 'false')) }
    const orden = ['salir-del-circulo-del-miedo', 'el-ejercicio-es-tratamiento', 'caminar-paso-a-paso', 'un-dia-dificil', 'tu-regla-de-dolor'].filter((id) => dest.some((b) => b.dataset.id === id))
    const c = ciclo(ed, orden.length, 6000, (i) => muestra(orden[i]), () => {})
    bs.forEach((b) => b.addEventListener('click', () => { c.quieto = true; muestra(b.dataset.id) }))
  }

  // ID: la idea de cada pieza se enciende palabra por palabra y pasa a la siguiente
  const id = document.querySelector('[data-r58-id]')
  if (id) {
    const is = [...id.querySelectorAll('.id-i')], ps = [...id.querySelectorAll('.id-puntos button')], cuenta = id.querySelector('.id-cuenta b'), pausa = id.querySelector('.id-pausa')
    const largo = (k) => 1800 + is[k].querySelectorAll('p span').length * 260
    const c = ciclo(id, is.length, largo, (i) => {
      is.forEach((x, k) => { x.classList.toggle('activa', k === i); if (k !== i) x.querySelectorAll('p span').forEach((s) => s.classList.remove('lit')) })
      ps.forEach((p, k) => p.setAttribute('aria-current', k === i ? 'true' : 'false')); cuenta.textContent = String(i + 1).padStart(2, '0')
    }, (i, p) => { const ws = is[i].querySelectorAll('p span'), n = Math.ceil(Math.min(1, (p * largo(i)) / (ws.length * 260 + 1)) * ws.length); ws.forEach((s, k) => s.classList.toggle('lit', c?.quieto || k < n)) })
    const marca = () => { pausa.classList.toggle('parado', c.quieto); pausa.setAttribute('aria-label', c.quieto ? 'Seguir' : 'Pausar') }
    ps.forEach((p, k) => p.addEventListener('click', () => { c.elige(k); marca() }))
    pausa.addEventListener('click', () => { c.quieto = !c.quieto; marca() }); marca()
  }
}

// Ronda 59 · FO auditada (data-r59f): los cuatro formatos con lo que tiene la app. Las 10 lecturas, los 2 videos, la
// charla con sus 8 láminas (lo que la voz nombra aparece en ese momento, con los tiempos de cada palabra de la app) y los
// 3 podcasts con la conversación que sigue la voz. Al verse, el video, la charla y el podcast corren sin sonido; con un
// toque suenan desde el comienzo. El recorrido se puede pausar y se detiene al tocar cualquier cosa. Suena uno a la vez.
{
  const raiz = document.querySelector('[data-r59]')
  if (raiz) {
    const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
    const BASE = raiz.dataset.base || '.'
    const mmss = (x) => `${Math.floor(Math.max(0, x) / 60)}:${String(Math.floor(Math.max(0, x) % 60)).padStart(2, '0')}`
    const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
    const acentua = (t) => esc(t).replace(/\*(.+?)\*/g, '<span class="acento">$1</span>')
    const barra = (el, p) => el && el.style.setProperty('--p', Math.max(0, Math.min(1, p)))
    const cache = {}
    const pide = (url) => (cache[url] ??= fetch(url).then((r) => r.json()))
    const tabs = [...raiz.querySelectorAll('[role="tab"]')]
    const ps = tabs.map((t) => raiz.querySelector('#' + t.getAttribute('aria-controls')))
    const rec = raiz.querySelector('.f9-recorrido'), recTx = rec.querySelector('span')
    const IC = JSON.parse(raiz.querySelector('.f9-iconos').textContent)
    // Ronda 62 · A1 (data-r62a="a1"): el recorrido también cambia de pieza dentro de cada formato (3 lecturas, los 2 videos,
    // 2 episodios); tocar una pestaña o una pieza deja fijo lo elegido, y «Seguir el recorrido» lo retoma
    const A1 = document.body.dataset.r62a === 'a1'
    // 19 nov (ronda 63): A1 a un ritmo que se alcance a leer. Cada lectura dura lo que toma leer su título, la bajada y
    // «La idea» a 218 palabras por minuto (lectura en voz baja en español, Trauzettel-Klosinski y cols., 2012) más 4 s para
    // mirar la foto, entre 10 y 16 s; cada video 16 s (dos o tres frases con subtítulos), la charla 24 s (tres o cuatro
    // láminas) y cada episodio 16 s. Con el mouse encima de Aprender el recorrido espera.
    const LD = JSON.parse(ps[0].querySelector('.f9-datos')?.textContent || '[]')
    const palabras = (x) => [x.t, x.s, x.i].join(' ').replace(/<[^>]+>|\*/g, ' ').split(/\s+/).filter(Boolean).length
    const lect = (n) => (LD.length ? Math.min(16000, Math.max(10000, (palabras(LD[n % LD.length]) / 218) * 60000 + 4000)) : 12000)
    let PD = A1 ? [[12000, 12000, 12000], [16000, 16000], [24000], [16000, 16000]] : [[8000], [11000], [13000], [11000]]
    const planLect = () => { if (!A1) return; const k0 = +(ps[0].querySelector('.f9-riel [aria-current]')?.dataset.i ?? 0); PD[0] = [0, 1, 2].map((j) => lect(k0 + j)) }
    planLect()
    let vista = false, i = 0, t0 = performance.now(), quieto = reducir, raf = 0, auto = false, pieza = 0, sobre = false, tSobre = 0
    if (A1 && matchMedia('(hover: hover) and (pointer: fine)').matches) {
      raiz.addEventListener('pointerenter', () => { if (!sobre) { sobre = true; tSobre = performance.now() } })
      raiz.addEventListener('pointerleave', () => { if (sobre) { sobre = false; t0 += performance.now() - tSobre } })
    }
    const siguientePieza = (k) => {
      const panel = ps[k]; const bs = [...panel.querySelectorAll(k === 0 ? '.f9-riel button' : k === 1 ? '.f9-lista button' : '.f9-eps button')]
      if (!bs.length) return
      const actual = bs.findIndex((b) => b.hasAttribute('aria-current') || b.getAttribute('aria-pressed') === 'true')
      auto = true; bs[(Math.max(0, actual) + 1) % bs.length].click(); auto = false
    }
    const todos = []

    const marcaRec = () => { rec.setAttribute('aria-pressed', quieto ? 'true' : 'false'); recTx.textContent = quieto ? 'Seguir el recorrido' : 'Pausar el recorrido' }
    const detiene = () => { if (auto) return; if (!quieto) { quieto = true; marcaRec() } }
    const muestra = (k) => {
      i = k; t0 = sobre ? (tSobre = performance.now()) : performance.now(); pieza = 0; if (k === 0) planLect()
      tabs.forEach((t, n) => { t.setAttribute('aria-selected', n === k ? 'true' : 'false'); t.tabIndex = n === k ? 0 : -1; barra(t.querySelector('.f9-t'), 0) })
      ps.forEach((p, n) => { p.classList.toggle('activo', n === k); p.inert = n !== k })
      todos.forEach((m) => (m.panel === ps[k] ? m.ve(vista) : m.fuera()))
    }
    const bucle = (t) => {
      if (!vista) return (raf = 0)
      if (todos.some((m) => m.conSonido())) detiene()
      const dur = PD[i].reduce((a, b) => a + b, 0), pasado = (sobre ? tSobre : t) - t0
      const p = quieto ? 0 : pasado / dur
      barra(tabs[i].querySelector('.f9-t'), p)
      if (!quieto && PD[i].length > 1) { let n = 0, acc = PD[i][0]; while (n < PD[i].length - 1 && pasado >= acc) acc += PD[i][++n]; if (n > pieza) { pieza = n; siguientePieza(i) } }
      if (!quieto && p >= 1) muestra((i + 1) % tabs.length)
      raf = requestAnimationFrame(bucle)
    }

    // Un reproductor (video, charla o podcast): el medio, sus tiempos y lo que se dibuja con ellos
    const reproductor = (panel, tipo, dibujaTipo, alCargar) => {
      const m = panel.querySelector('.f9-medio')
      const bs = [...panel.querySelectorAll('.f9-barra')], play = panel.querySelector('.f9-play'), etq = play.querySelector('span'), txt0 = etq.textContent
      let d = null, raf2 = 0, conSonido = false
      const carga = async () => { if (!m.src) m.src = m.dataset.src; if (!d) { d = await pide(m.dataset.json); alCargar?.(d); dibuja() } return d }
      const rotula = () => { etq.textContent = !conSonido ? txt0 : m.paused ? 'Seguir' : 'Pausar' }
      const dibuja = () => {
        if (!d) return
        const t = m.currentTime || 0
        bs.forEach((b) => barra(b.firstElementChild, t / d.dur))
        dibujaTipo(d, t, !m.paused || t > 0.05)
      }
      const bucle2 = () => { dibuja(); raf2 = m.paused ? 0 : requestAnimationFrame(bucle2) }
      m.addEventListener('play', () => { panel.classList.add('suena'); if (!m.muted) todos.forEach((o) => o !== api && o.pausa()); if (!raf2) raf2 = requestAnimationFrame(bucle2); rotula() })
      m.addEventListener('pause', () => { panel.classList.remove('suena'); rotula(); dibuja() })
      m.addEventListener('ended', () => { if (!conSonido) { m.currentTime = 0; m.play().catch(() => {}) } })
      m.addEventListener('seeked', dibuja)
      const api = {
        panel, conSonido: () => conSonido && !m.paused,
        ve: async (si) => { if (!si) return api.pausa(); await carga(); if (!conSonido && !reducir) { m.muted = true; m.play().catch(() => {}) } },
        fuera: () => api.pausa(),
        pausa: () => { if (!m.paused) m.pause() },
        va: async (t) => { await carga(); m.currentTime = Math.max(0, Math.min(d.dur - 0.1, t)); dibuja(); if (m.paused) m.play().catch(() => {}) },
        toca: async () => {
          detiene(); await carga()
          if (!conSonido) { conSonido = true; panel.classList.add('con-sonido'); m.muted = false; m.currentTime = 0; m.play().catch(() => {}) }
          else if (m.paused) m.play().catch(() => {}); else m.pause()
          rotula()
        },
        cambia: (src, json) => { m.pause(); m.removeAttribute('src'); m.dataset.src = src; m.dataset.json = json; d = null; conSonido = false; panel.classList.remove('con-sonido', 'suena'); rotula(); m.load(); if (panel.classList.contains('activo') && vista) api.ve(true); else carga() },
        oye: (t) => { detiene(); conSonido = true; panel.classList.add('con-sonido'); m.muted = false; api.va(t).then(rotula) },
        get d() { return d }, m,
      }
      play.addEventListener('click', api.toca)
      bs.forEach((b) => b.addEventListener('click', (e) => { if (!d) return; const r = b.getBoundingClientRect(); api.oye(((e.clientX - r.left) / r.width) * d.dur) }))
      todos.push(api)
      return api
    }
    const cortes = (panel, d) => panel.querySelectorAll('.f9-cortes').forEach((b) => { b.querySelectorAll('b').forEach((x) => x.remove()); d.l.slice(1).forEach((l) => { const x = document.createElement('b'); x.style.left = `${(l.i / d.dur) * 100}%`; b.append(x) }) })
    const fraseEn = (d, t) => { let k = -1; for (let n = 0; n < d.fr.length; n++) if (d.fr[n][0] <= t + 0.05) k = n; return k }

    // Lecturas: el riel abre cualquiera de las 10; «Entendido» la marca como leída, como en la app
    {
      const p = ps[0], L = JSON.parse(p.querySelector('.f9-datos').textContent), leidas = new Set()
      const foto = p.querySelector('.f9-lec-foto img'), cuerpo = p.querySelector('.f9-cuerpo'), ent = p.querySelector('.f9-entendido'), entTx = ent.querySelector('span')
      const riel = [...p.querySelectorAll('.f9-riel button')]
      let k = +(p.querySelector('.f9-riel [aria-current]')?.dataset.i ?? 0)
      const fin = () => cuerpo.classList.toggle('fin', cuerpo.scrollTop + cuerpo.clientHeight >= cuerpo.scrollHeight - 4)
      const marca = () => { const si = leidas.has(L[k].id); ent.setAttribute('aria-pressed', si ? 'true' : 'false'); entTx.textContent = si ? 'Leída' : 'Entendido' }
      const abre = (n) => {
        k = n; const x = L[n]
        foto.style.opacity = 0
        setTimeout(() => { foto.src = `${BASE}/fotos/aprender/${x.id}-640.webp`; foto.onload = () => (foto.style.opacity = 1) }, 180)
        p.querySelector('.f9-meta').textContent = x.m; p.querySelector('.f9-tit').innerHTML = x.t; p.querySelector('.f9-lead').textContent = x.s
        cuerpo.innerHTML = x.p.map((t) => `<p>${esc(t)}</p>`).join(''); cuerpo.scrollTop = 0; p.querySelector('.f9-idea-tx').textContent = x.i
        riel.forEach((b, j) => (j === n ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')))
        marca(); fin()
      }
      riel.forEach((b, j) => b.addEventListener('click', () => { detiene(); abre(j) }))
      ent.addEventListener('click', () => { detiene(); const id = L[k].id; leidas.has(id) ? leidas.delete(id) : leidas.add(id); riel[k].classList.toggle('leida', leidas.has(id)); marca() })
      cuerpo.addEventListener('scroll', fin, { passive: true }); cuerpo.addEventListener('pointerdown', detiene); cuerpo.addEventListener('wheel', detiene, { passive: true })
      fin()
    }

    // Video: subtítulos de la voz de la app; los 2 videos se pueden elegir
    {
      const p = ps[1], V = JSON.parse(p.querySelector('.f9-datos').textContent), sub = p.querySelector('.f9-vsub')
      // 18 nov: como en la app (VideoPage): la frase en tramos de ~60 letras, caja Petróleo al 85 % y cada palabra se aclara al decirse
      const tramos = (ws) => { const total = ws.reduce((n, w) => n + w.t.length + 1, 0), meta = total / Math.ceil(total / 60), out = [[]]; let largo = 0; for (const w of ws) { if (largo + w.t.length / 2 > meta && out.at(-1).length) { out.push([]); largo = 0 } out.at(-1).push(w); largo += w.t.length + 1 } return out }
      let ult = ''
      const r = reproductor(p, 'video', (d, t) => {
        const k = fraseEn(d, t), f = d.fr[k]
        if (!f || t > f[1] + 0.35) { if (ult) { sub.innerHTML = ''; ult = '' } return }
        const ws = f[2].split(' ').map((w, n) => ({ t: w, i: (f[5] || [])[n] ?? f[0] })), pp = tramos(ws)
        const pa = pp.find((x) => x.some((w) => w.i > t)) ?? pp.at(-1), clave = k + ':' + pp.indexOf(pa)
        if (clave !== ult) { ult = clave; sub.innerHTML = `<span class="f9-vtramo">${pa.map((w) => `<span>${esc(w.t)}</span>`).join(' ')}</span>` }
        const sp = sub.firstElementChild?.children ?? []
        pa.forEach((w, n) => sp[n]?.classList.toggle('dicho', t >= w.i))
      }, () => (ult = ''))
      const lista = [...p.querySelectorAll('.f9-lista button')]
      lista.forEach((b, j) => b.addEventListener('click', () => {
        detiene(); if (b.hasAttribute('aria-current')) return
        lista.forEach((x) => x.removeAttribute('aria-current')); b.setAttribute('aria-current', 'true')
        const x = V[j]; p.querySelector('.f9-meta').textContent = x.m; p.querySelector('.f9-tit').innerHTML = x.t; p.querySelector('.f9-lead').textContent = x.s
        r.m.poster = `${BASE}/medios/aprender/${x.id}.webp`; r.m.setAttribute('aria-label', 'Video: ' + p.querySelector('.f9-tit').textContent); sub.innerHTML = ''; ult = ''
        r.cambia(`${BASE}/medios/aprender/${x.id}.mp4`, `${BASE}/medios/aprender/${x.id}.json`)
      }))
    }

    // Charla: cada lámina como en la app (CharlaPage); lo que tiene «clave» aparece cuando la voz lo dice
    {
      const p = ps[2], lam = p.querySelector('.f9-lam'), subs = p.querySelector('.f9-subs'), portada = lam.innerHTML, va = p.querySelector('.f9-tiempo')
      const filas = [...p.querySelectorAll('.f9-lams button')]
      const cap = (it, icono) => `<li class="f9-cap" data-clave="${esc(it.clave)}" data-cap>${icono}${esc(it.texto)}</li>`
      const zona = (n) => (n <= 3 ? 0 : n <= 6 ? 1 : 2)
      const html = (l) => {
        const tit = `<p class="f9-lh">${acentua(l.titulo)}</p>`, nota = typeof l.nota === 'string' ? `<p class="f9-ln">${esc(l.nota)}</p>` : ''
        switch (l.tipo) {
          case 'portada': return portada
          case 'icono': return `<div class="f9-l"><div class="f9-circ">${l.iconos.map((n) => `<span>${IC[n] ?? ''}</span>`).join('')}</div>${tit}${nota}</div>`
          case 'regla': {
            const c = (n) => `<span class="z${zona(n)}" data-z="${zona(n)}">${n}</span>`
            return `<div class="f9-l">${tit}<div class="f9-esc10" aria-hidden="true"><div>${[0, 1, 2, 3, 4, 5].map(c).join('')}</div><div>${[6, 7, 8, 9, 10].map(c).join('')}</div></div>`
              + `<ul class="f9-zonas">${l.zonas.map((z) => `<li data-clave="${esc(z.clave)}"><b>${esc(z.rango)}</b><span>${esc(z.texto)}</span></li>`).join('')}</ul>`
              + (l.nota ? `<p class="f9-ln" data-clave="${esc(l.nota.clave)}">${esc(l.nota.texto)}</p>` : '') + '</div>'
          }
          case 'lista': return `<div class="f9-l">${tit}<ul class="f9-cl">${l.items.map((it) => cap(it, IC[it.icono] ?? '')).join('')}</ul></div>`
          case 'ejemplo': return `<div class="f9-l f9-l-ejemplo"><div class="f9-foto"><img src="${BASE}/fotos/rutinas/${l.foto}-ficha-720.webp" alt=""><i class="f9-velo"></i><div><p class="f9-lh" style="font-size:1.375rem">${acentua(l.titulo)}</p><span class="f9-lm">${esc(l.rotulo)}</span></div></div><ul class="f9-cl">${l.items.map((it) => cap(it, `<span class="f9-chk">${IC.Check}</span>`)).join('')}</ul></div>`
          case 'senales': return `<div class="f9-l"><span class="f9-info">${IC.Info}</span>${tit}${Object.entries(l.grupos ?? { todos: 'Para y consulta si tienes' }).map(([g, h]) => `<section class="f9-grupo"><h5>${esc(h)}</h5><ul>${l.items.filter((it) => !l.grupos || it.grupo === g).map((it) => `<li data-clave="${esc(it.clave)}">${IC[it.icono] ?? ''}${esc(it.texto)}</li>`).join('')}</ul></section>`).join('')}</div>`
          case 'cierre': return `<div class="f9-l"><span class="f9-isotipo">${IC.Isotipo}</span>${tit}</div>`
          default: return `<div class="f9-l">${tit}</div>`
        }
      }
      // Subtítulos en partes de hasta dos líneas (unos 60 caracteres), como partesDe de la app
      const partes = (ws) => { const total = ws.reduce((n, w) => n + w.t.length + 1, 0), meta = total / Math.ceil(total / 60), out = [[]]; let largo = 0; for (const w of ws) { if (largo + w.t.length / 2 > meta && out.at(-1).length) { out.push([]); largo = 0 } out.at(-1).push(w); largo += w.t.length + 1 } return out }
      let ultL = -1, ultP = '', els = []
      const r = reproductor(p, 'charla', (d, t, empezado) => {
        let k = 0; d.l.forEach((l, n) => { if (l.i <= t + 0.05) k = n })
        const l = d.l[k]
        if (k !== ultL) { ultL = k; lam.innerHTML = html(l); els = [...lam.querySelectorAll('[data-clave]')] }
        els.forEach((el) => { const c = l.claves[el.dataset.clave]; const ya = empezado && c !== undefined && t >= c; el.classList.toggle('ya', ya); if (el.hasAttribute('data-cap')) el.classList.toggle('reciente', ya && t - c < 2.2) })
        if (l.tipo === 'regla') lam.querySelectorAll('.f9-esc10 span').forEach((s) => { const z = l.zonas[+s.dataset.z]; s.classList.toggle('apagado', empezado && !(t >= (l.claves[z.clave] ?? Infinity))) })
        filas.forEach((b, n) => { if (n === k) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); barra(b.querySelector('.f9-lp i'), n === k ? (t - l.i) / (l.f - l.i) : 0) })
        va.textContent = empezado ? mmss(t) : mmss(d.dur)
        const fk = fraseEn(d, t), f = d.fr[fk]
        if (!empezado || !f || t > f[1] + 0.35) { if (ultP) { subs.innerHTML = ''; ultP = '' } return }
        const ws = f[2].split(' ').map((w, n) => ({ t: w, i: f[5][n] ?? f[0] })), pp = partes(ws)
        const pa = pp.find((x) => x.some((w) => w.i > t)) ?? pp.at(-1), clave = fk + ':' + pp.indexOf(pa)
        if (clave !== ultP) { ultP = clave; subs.innerHTML = pa.map((w) => `<span>${esc(w.t)}</span>`).join(' ') }
        pa.forEach((w, n) => subs.children[n]?.classList.toggle('dicho', t >= w.i))
      }, (d) => { cortes(p, d); ultL = -1 })
      filas.forEach((b) => b.addEventListener('click', () => r.oye(+b.dataset.t + 0.01)))
    }

    // Podcast: al centro la frase y quién la dice; al lado, la conversación que sigue la voz (se toca para ir ahí)
    {
      const p = ps[3], E = JSON.parse(p.querySelector('.f9-datos').textContent)
      const quien = p.querySelector('.f9-quien span'), frase = p.querySelector('.f9-frase'), letra = p.querySelector('.f9-letra'), vaEl = p.querySelector('.f9-va'), resta = p.querySelector('.f9-resta'), lento = p.querySelector('.f9-lento')
      let ult = -1, bs = []
      const cabeza = (l) => (l.tipo === 'mito' ? `Mito ${l.numero}` : l.tipo === 'portada' ? '' : (l.titulo || '').replace(/\*/g, ''))
      const arma = (d) => {
        let lam = -1, h = null
        letra.innerHTML = d.fr.map((f, n) => {
          let s = ''
          if (f[4] !== lam) { lam = f[4]; const c = cabeza(d.l[lam]); if (c) s += `<h5>${esc(c)}</h5>`; h = null }
          if (f[3] !== h) { h = f[3]; s += `<span class="q">${esc(d.hablantes?.[h] ?? '')}</span>` }
          return `<li>${s}<button type="button" data-n="${n}">${esc(f[2])}</button></li>`
        }).join('')
        bs = [...letra.querySelectorAll('button')]
        bs.forEach((b) => b.addEventListener('click', () => r.oye(d.fr[+b.dataset.n][0] + 0.01)))
        cortes(p, d); ult = -1
      }
      const r = reproductor(p, 'podcast', (d, t) => {
        const k = Math.max(0, fraseEn(d, t)), f = d.fr[k]
        vaEl.textContent = mmss(t); resta.textContent = '-' + mmss(d.dur - t)
        if (k === ult) return
        ult = k; quien.textContent = d.hablantes?.[f[3]] ?? ''
        frase.textContent = f[2]; frase.classList.remove('entra'); void frase.offsetWidth; frase.classList.add('entra')
        bs.forEach((b, n) => b.classList.toggle('ahora', n === k))
        const b = bs[k]; if (b) letra.scrollTo({ top: b.offsetTop - letra.clientHeight * 0.35, behavior: reducir ? 'auto' : 'smooth' })
      }, arma)
      p.querySelectorAll('.f9-salto').forEach((b) => b.addEventListener('click', () => r.oye((r.m.currentTime || 0) + +b.dataset.s)))
      lento.addEventListener('click', () => { detiene(); const si = lento.getAttribute('aria-pressed') !== 'true'; lento.setAttribute('aria-pressed', si ? 'true' : 'false'); r.m.playbackRate = si ? 0.85 : 1 })
      r.m.addEventListener('play', () => { r.m.playbackRate = lento.getAttribute('aria-pressed') === 'true' ? 0.85 : 1 })
      const eps = [...p.querySelectorAll('.f9-eps button')]
      eps.forEach((b, j) => b.addEventListener('click', () => {
        detiene(); if (b.hasAttribute('aria-current')) return
        eps.forEach((x) => x.removeAttribute('aria-current')); b.setAttribute('aria-current', 'true')
        const x = E[j]; p.querySelector('.f9-meta').textContent = x.m; p.querySelector('.f9-tit').innerHTML = x.t; p.querySelector('.f9-pod-cab img').src = `${BASE}/fotos/aprender/${x.id}-cuadrada.webp`
        letra.innerHTML = ''; frase.textContent = ''; resta.textContent = '-' + mmss(x.dur); vaEl.textContent = '0:00'
        r.cambia(`${BASE}/medios/aprender/${x.id}.m4a`, `${BASE}/medios/aprender/${x.id}.json`)
      }))
    }

    tabs.forEach((t, k) => {
      t.addEventListener('click', () => { detiene(); if (k !== i) muestra(k) })
      t.addEventListener('keydown', (e) => { const dd = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (dd) { e.preventDefault(); detiene(); const n = (k + dd + tabs.length) % tabs.length; muestra(n); tabs[n].focus() } })
    })
    rec.addEventListener('click', () => { quieto = !quieto; t0 = performance.now(); marcaRec() })
    marcaRec(); muestra(0)
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { vista = e.isIntersecting; if (vista) { t0 = performance.now(); todos.forEach((m) => m.panel === ps[i] && m.ve(true)); if (!raf) raf = requestAnimationFrame(bucle) } else todos.forEach((m) => m.pausa()) }, { threshold: 0.25 }) : null
    io ? io.observe(raiz) : (vista = true)
  }
}

// Ronda 60 · «Para cada uno» (data-r60p): seis propuestas. Cada una tiene pasos ([data-ir] elige, [data-en] dice en qué
// pasos se ve algo). Las que tienen tiempos (data-durs) avanzan solas mientras se ven, se pueden pausar y se detienen al
// tocar cualquier paso. PA mueve el punto del hilo hacia quien actúa; PC acerca la captura al punto elegido; PD cambia la
// imagen de cada paso; PE desliza las capturas al verse.
{
  const reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  document.querySelectorAll('.r6-v[data-v]').forEach((v) => {
    const n = +(v.dataset.pasos || 0)
    const durs = (v.dataset.durs || '').split(',').filter(Boolean).map(Number)
    const focos = (v.dataset.focos || '').split(',').filter(Boolean)
    const auto = durs.length > 0 && !reducir
    const botones = [...v.querySelectorAll('[data-ir]')]
    const pausa = v.querySelector('.r6-pausa')
    const punto = v.querySelector('.pa-punto')
    let paso = 0, t = null, enVista = false, pausado = false, tocado = false, visto = false
    const corre = () => auto && enVista && !pausado && !tocado
    const mueveHilo = () => {
      const esc = v.querySelector('.pa-esc'), c = v.querySelector('[data-col].foco')
      if (!punto || !esc || !c || !esc.offsetWidth) return
      const r = esc.getBoundingClientRect(), q = c.getBoundingClientRect()
      punto.style.setProperty('--px', `${((q.left + q.width / 2 - r.left) / r.width) * 100}%`)
    }
    const pinta = (k) => {
      paso = k
      v.dataset.paso = k
      v.querySelectorAll('[data-en]').forEach((el) => el.classList.toggle('ve', el.dataset.en.split(' ').includes(String(k))))
      botones.forEach((b) => {
        const si = +b.dataset.ir === k
        b.classList.toggle('activo', si)
        if (b.getAttribute('role') === 'tab') { b.setAttribute('aria-selected', String(si)); b.tabIndex = si ? 0 : -1 }
        else if (b.classList.contains('pd-card')) b.setAttribute('aria-expanded', String(si))
        else if (si) b.setAttribute('aria-current', 'step')
        else b.removeAttribute('aria-current')
      })
      if (focos.length) v.querySelectorAll('[data-col]').forEach((c) => c.classList.toggle('foco', c.dataset.col === focos[k]))
      mueveHilo()
      v.style.setProperty('--dur', `${durs[k] || 8000}ms`)
      v.classList.remove('corre', 'fluye')
      void v.offsetWidth
      if (corre()) v.classList.add('corre')
      v.classList.add('fluye')
      v.querySelectorAll('.pc-p').forEach((p) => p.r6Suelta?.())
    }
    const programa = () => {
      clearTimeout(t)
      if (corre()) t = setTimeout(() => { pinta((paso + 1) % n); programa() }, durs[paso] || 8000)
    }
    // Para que las animaciones de adentro corran de nuevo, se quita «ve» a todo antes de pintar.
    const reinicia = () => { v.querySelectorAll('[data-en].ve').forEach((el) => el.classList.remove('ve')); void v.offsetWidth; pinta(paso); programa() }
    const marcaPausa = () => pausa?.setAttribute('aria-pressed', String(pausado || tocado))
    botones.forEach((b) => b.addEventListener('click', () => {
      if (auto) { tocado = true; marcaPausa() }
      if (+b.dataset.ir !== paso) pinta(+b.dataset.ir)
      programa()
    }))
    pausa?.addEventListener('click', () => {
      if (pausado || tocado) { pausado = false; tocado = false } else pausado = true
      marcaPausa()
      if (corre()) reinicia(); else { clearTimeout(t); v.classList.remove('corre') }
    })
    v.querySelectorAll('[role="tablist"]').forEach((tl) => tl.addEventListener('keydown', (e) => {
      const tabs = [...tl.querySelectorAll('[role="tab"]')], i = tabs.indexOf(document.activeElement)
      if (i < 0) return
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
      const j = d ? (i + d + tabs.length) % tabs.length : e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : -1
      if (j < 0) return
      e.preventDefault(); tabs[j].focus(); tabs[j].click()
    }))
    if (pausa && !auto) pausa.hidden = true
    pinta(0)
    new IntersectionObserver((es) => es.forEach((e) => {
      const antes = enVista
      enVista = e.isIntersecting
      if (enVista && !visto) { visto = true; reinicia() }
      else if (enVista !== antes) { if (corre()) reinicia(); else { clearTimeout(t); v.classList.remove('corre') } }
    }), { threshold: 0.3 }).observe(v)
    addEventListener('resize', mueveHilo)

    // PC: acercar la captura al punto elegido (el número queda donde estaba y crece lo de alrededor).
    v.querySelectorAll('.pc-p').forEach((p) => {
      const zoom = p.querySelector('.pc-zoom'), hs = [...p.querySelectorAll('.pc-hs')], items = [...p.querySelectorAll('.pc-lista button')]
      let actual = null
      const elige = (j) => {
        actual = j
        hs.concat(items).forEach((x) => x.classList.toggle('activo', +x.dataset.pt === j))
        items.forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.pt === j)))
        const h = hs.find((x) => +x.dataset.pt === j)
        if (j === null || !h) { zoom.style.setProperty('--zs', 1); p.classList.remove('zoom'); return }
        const fig = h.parentElement
        const x = fig.offsetLeft + h.offsetLeft, y = fig.offsetTop + h.offsetTop
        zoom.style.setProperty('--zx', `${(x / zoom.offsetWidth) * 100}%`)
        zoom.style.setProperty('--zy', `${(y / zoom.offsetHeight) * 100}%`)
        zoom.style.setProperty('--zs', p.querySelector('.pc-tels') ? 1.75 : 2.1)
        p.classList.add('zoom')
      }
      p.r6Suelta = () => elige(null)
      hs.concat(items).forEach((b) => b.addEventListener('click', () => elige(+b.dataset.pt === actual ? null : +b.dataset.pt)))
      p.querySelector('.pc-todo')?.addEventListener('click', () => elige(null))
      items.forEach((x) => x.setAttribute('aria-pressed', 'false'))
    })

    // PD: cada paso muestra su captura.
    v.querySelectorAll('.pd-p').forEach((p) => {
      const bs = [...p.querySelectorAll('.pd-pasos button[data-paso]')], fs = [...p.querySelectorAll('.pd-f')]
      bs.forEach((b) => b.addEventListener('click', () => {
        const j = +b.dataset.paso
        bs.forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.paso === j)))
        fs.forEach((f) => f.classList.toggle('ve', +f.dataset.paso === j))
      }))
    })
  })
  // PE: al verse, las capturas se deslizan una vez hacia lo importante.
  const pe = document.querySelectorAll('.pe-card')
  if (pe.length && !reducir) {
    const o = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visto'); o.unobserve(e.target) } }), { threshold: 0.55 })
    pe.forEach((c) => o.observe(c))
  }
}
// fin ronda 60

// Ronda 62 · pasos entre secciones. E1: el contenido de «Rutinas» llega una vez al verse. Telón (E2, R2, P2): la sección de
// arriba se queda quieta (sticky, alineada abajo) y la siguiente sube encima; --cubre (0 a 1) aleja y apaga la de abajo.
{
  const d = document.body.dataset, reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const rut = document.querySelector('#rutinas')
  if (d.r62e === 'e1' && rut && !reducir && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { rut.classList.add('r62-llego'); setTimeout(() => rut.classList.add('r62-listo'), 1800); io.disconnect() } }, { threshold: 0.18 })
    io.observe(rut)
  } else rut?.classList.add('r62-llego', 'r62-listo')
  const pares = [[d.r62e === 'e2', '#rutinas'], [d.r62r === 'r2' && !(d.r65r && d.r65r !== 'hoy') && (!(d.r63r && d.r63r !== 'hoy') || d.r63r === 'r7'), '#aprender'], [d.r62p === 'p2' && !(d.r65p && d.r65p !== 'hoy') && (!(d.r63p && d.r63p !== 'hoy') || d.r63p === 'p7'), '#para-cada-uno']].filter(([si]) => si).map(([, b]) => document.querySelector(b)).filter(Boolean)
    .map((b) => { let a = b.previousElementSibling; while (a && (a.tagName !== 'SECTION' || getComputedStyle(a).display === 'none')) a = a.previousElementSibling; return a && [a, b] }).filter(Boolean)
  if (pares.length && !reducir) {
    pares.forEach(([a, b]) => { a.classList.add('r62-telon-a'); b.classList.add('r62-telon-b') })
    const mide = () => pares.forEach(([a]) => a.style.setProperty('--alto-a', a.offsetHeight + 'px'))
    let raf = 0
    // 19 nov: la de abajo, tapada del todo, se esconde; si no, la sticky seguía visible detrás de las secciones siguientes
    const paso = () => { raf = 0; const h = innerHeight; pares.forEach(([a, b]) => { const t = b.getBoundingClientRect().top; const c = Math.min(1, Math.max(0, (h - t) / h)); a.style.setProperty('--cubre', c.toFixed(3)); a.classList.toggle('r62-tapada', t <= 0) }) }
    mide(); paso()
    addEventListener('resize', () => { mide(); paso() })
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paso) }, { passive: true })
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(mide); pares.forEach(([a]) => ro.observe(a)) }
  }
}

// Ronda 63 · puentes entre secciones (r63r: R4 la frase, R5 del ejercicio a las piezas, R6 el isotipo; r63p: P4 en el
// teléfono de Rosa, P5 el hilo, P6 tres frases) y el final más corto (r63l: C2 mueve los dos caminos a Preguntas; C3 suma
// la línea de las guías). Cada puente es un tramo con escena fija; --p va de 0 a 1 mientras se baja por él.
{
  const d = document.body.dataset, reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const BASE = document.querySelector('[data-r59]')?.dataset.base || '.'
  const rut = document.querySelector('#rutinas'), apr = document.querySelector('#aprender'), pcu = document.querySelector('#para-cada-uno')
  // ronda 65: si hay un paso nuevo (r65r, r65p), ese paso no lleva puente
  const R = d.r63r && d.r63r !== 'hoy' && !(d.r65r && d.r65r !== 'hoy') ? d.r63r : '', P = d.r63p && d.r63p !== 'hoy' && !(d.r65p && d.r65p !== 'hoy') ? d.r63p : ''
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const CHECK = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/></svg>'
  const AVISO = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"/></svg>'
  const puentes = []
  const crea = (clase, antesDe, alto, html, etiqueta) => {
    const el = document.createElement('div'); el.className = `r63-puente r63-${clase}`; el.style.setProperty('--alto', alto)
    el.innerHTML = `<div class="r63-esc">${html}</div>`
    if (etiqueta) { el.setAttribute('role', 'group'); el.setAttribute('aria-label', etiqueta) } else el.setAttribute('aria-hidden', 'true')
    // reparte cada escena en todo su tramo
    el.dataset.k = { r4: 0.72, r5: 0.8, r6: 0.74, p4: 0.95, p5: 0.9, p6: 1 }[clase] ?? 1
    antesDe.before(el); puentes.push(el); return el
  }
  // Ronda 64 (R7, P7): el mismo puente, corto. La escena es una franja al final de la sección de arriba (Rutinas o
  // Aprender) que se arma mientras entra; al llegar abajo, la siguiente sección la tapa con el telón de la ronda 62
  const enHoja = (clase, sec, alto, html, etiqueta) => {
    const el = crea(clase, sec, alto, html, etiqueta); el.classList.add('r64-hoja'); el.dataset.hoja = '1'
    el.dataset.k = { r5: 0.62, p5: 0.56 }[clase] ?? 1; sec.append(el); return el
  }
  // Avance de una franja: 0 cuando su borde de arriba pasa el 80 % de la pantalla, 1 cuando ya se ve entera
  // (se mide con la caja sin transformar: el telón achica la sección tapada y movería la franja hacia atrás)
  const hojaP = (el, r, h) => { const t = el.offsetParent ? el.offsetParent.getBoundingClientRect().top + el.offsetTop : r.top; return Math.min(1, Math.max(0, (0.8 * h - t) / Math.max(1, el.offsetHeight - 0.17 * h))) }
  // Palabras con su orden (--i) para que se enciendan una tras otra; *x* va en Larken
  const palabras = (lineas) => { let i = 0; return lineas.map((l) => `<span class="r63-l">${l.split(' ').map((w) => { const ac = /^\*.*\*[.,]?$/.test(w); const t = esc(w.replace(/\*/g, '')); return `<span style="--i:${i++}"${ac ? ' class="acento"' : ''}>${t}</span>` }).join(' ')}</span>`).join('') }
  if (!reducir) {
    if (R && rut && apr) {
      if (R === 'r4') crea('r4', apr, 265, `<p class="r63-frase">${palabras(['Moverse es parte del tratamiento.', 'Entender la artrosis, *también.*'])}</p><p class="r63-cita">Ejercicio y educación: el tratamiento central según OARSI 2019, ACR 2020 y NICE 2022.</p>`, 'Moverse es parte del tratamiento. Entender la artrosis, también.')
      if (R === 'r5' || R === 'r7') {
        const LD = JSON.parse(document.querySelector('[data-r59] .f9-datos')?.textContent || '[]')
        const centro = rut.querySelector('.u2-p .u2-img')?.getAttribute('src') || `${BASE}/fotos/rutinas/despertar-articular-960.webp`
        const otras = [...LD.map((x) => `${BASE}/fotos/aprender/${x.id}-cuadrada.webp`), `${BASE}/medios/aprender/el-ejercicio-es-tratamiento.webp`, `${BASE}/fotos/rutinas/elongacion-piernas-ficha-720.webp`, `${BASE}/fotos/rutinas/equilibrio-con-apoyo-480.webp`, `${BASE}/fotos/rutinas/despertar-articular-ficha-720.webp`]
        const C = 7, cols = 5; let k = 0
        const tiles = Array.from({ length: 15 }, (_, n) => {
          const dist = Math.hypot((n % cols) - (C % cols), Math.floor(n / cols) - Math.floor(C / cols))
          const src = n === C ? centro : otras[k++ % otras.length]
          return `<i class="${n === C ? 'r63-centro' : ''}" style="--dist:${dist.toFixed(2)}"><img src="${src}" alt="" loading="lazy" decoding="async"></i>`
        }).join('')
        ;(R === 'r7' ? (...a) => enHoja('r5', rut, 50, ...a.slice(3)) : crea)('r5', apr, 285, `<div class="r63-mos">${tiles}</div><p class="r63-pie">Y para entender lo que haces: lecturas, videos, charlas y <span class="acento">podcasts.</span></p>`, 'Y para entender lo que haces: lecturas, videos, charlas y podcasts.')
      }
      if (R === 'r6') crea('r6', apr, 265, `<div class="r63-iso"><img src="${BASE}/fotos/aprender/salir-del-circulo-del-miedo-1290.webp" alt="" loading="lazy" decoding="async"></div><p class="r63-ceja"><b>Aprender</b>Entender también es parte del tratamiento</p>`)
    }
    if (P && apr && pcu) {
      if (P === 'p4') {
        const LD = JSON.parse(document.querySelector('[data-r59] .f9-datos')?.textContent || '[]'), x = LD.find((l) => l.id === 'salir-del-circulo-del-miedo') || LD[0]
        const tit = x ? String(x.t).replace(/\*(.+?)\*/g, '<span class="acento">$1</span>') : ''
        crea('p4', pcu, 285, `<div class="r63-tel"><div class="r63-tel-p"><img src="${BASE}/fotos/aprender/${x?.id}-640.webp" alt="" loading="lazy" decoding="async"><div class="tx"><small>${esc(x?.m ?? '')}</small><h4>${tit}</h4><p>${esc(x?.s ?? '')}</p><p class="idea"><b>La idea</b>${esc(x?.i ?? '')}</p></div></div></div>
          <ol class="r63-tres"><li style="--k:0"><span class="r63-av">RD</span><span><b>Rosa lee en su teléfono.</b><span>Y anota cada día cómo amaneció.</span></span></li><li style="--k:1"><span class="r63-av k">JV</span><span><b>Javiera, su kine, ve cómo va.</b><span>En su panel, con un aviso si algo molesta mucho.</span></span></li><li style="--k:2"><span class="r63-av m">TB</span><span><b>Tomás, su médico, lo conversa.</b><span>Con el resumen de sus semanas en el control.</span></span></li></ol>`, 'Rosa lee en su teléfono y anota cada día cómo amaneció. Javiera, su kine, ve cómo va. Tomás, su médico, lo conversa en el control.')
      }
      if (P === 'p5' || P === 'p7') (P === 'p7' ? (...a) => enHoja('p5', apr, 56, ...a.slice(3)) : crea)('p5', pcu, 265, `<svg class="r63-hilo" aria-hidden="true"><path pathLength="1"/><path pathLength="1"/><path pathLength="1"/></svg>
          <p class="r63-ti">Lo que Rosa anota no se queda en su <span class="acento">teléfono.</span></p>
          <div class="r63-nodos"><div style="--k:0"><span class="r63-av">RD</span><span><b>Rosa</b><small>La persona, en su casa</small></span></div><div style="--k:1"><span class="r63-av k">JV</span><span><b>Javiera</b><small>Su kinesióloga</small></span></div><div style="--k:2"><span class="r63-av m">TB</span><span><b>Tomás</b><small>Su médico</small></span></div></div>`, 'Lo que Rosa anota no se queda en su teléfono: lo ven Javiera, su kinesióloga, y Tomás, su médico.')
      if (P === 'p6') crea('p6', pcu, 270, `
          <div class="r63-dicho" style="--k:0"><span class="r63-quien"><span class="r63-av">RD</span>Rosa, en su casa</span><p>Rosa anota <span class="acento">Muy sensible.</span></p><span class="r63-chip"><span class="n">7</span>de 10 · rodilla derecha</span></div>
          <div class="r63-dicho" style="--k:1"><span class="r63-quien"><span class="r63-av k">JV</span>Javiera, su kinesióloga</span><p>Javiera recibe <span class="acento">un aviso.</span></p><span class="r63-chip alarma">${AVISO}Señal de alarma · Rosa Díaz</span></div>
          <div class="r63-dicho" style="--k:2"><span class="r63-quien"><span class="r63-av m">TB</span>Tomás, su médico</span><p>Tomás lo conversa en el <span class="acento">control.</span></p><span class="r63-chip ok">${CHECK}Conversada</span></div>`, 'Rosa anota Muy sensible, 7 de 10. Javiera recibe un aviso. Tomás lo conversa en el control.')
    }
    // Avance de cada puente; R5 calcula cuánto agrandar la foto del centro y R6 el giro y el tamaño del isotipo
    if (puentes.length) {
      let raf = 0
      const ajusta = () => puentes.forEach((el) => {
        const m = el.querySelector('.r63-mos'); if (m) { const t = m.querySelector('.r63-centro'); const w = t?.offsetWidth || 1; el.style.setProperty('--s0', Math.max(2, Math.max(innerWidth / w, innerHeight / w) * 1.02).toFixed(3)) }
        // P5: la línea sale bajo la frase y llega justo sobre cada avatar
        const hilo = el.querySelector('.r63-hilo'); if (hilo) {
          const e = el.querySelector('.r63-esc').getBoundingClientRect(), ti = el.querySelector('.r63-ti').getBoundingClientRect()
          const W = e.width, H = e.height, cx = W / 2, y0 = ti.bottom - e.top + 18
          hilo.setAttribute('viewBox', `0 0 ${W} ${H}`)
          const avs = [...el.querySelectorAll('.r63-nodos .r63-av')].map((a) => { const r = a.getBoundingClientRect(); return [r.left + r.width / 2 - e.left, r.top - e.top - 8] })
          hilo.querySelectorAll('path').forEach((pa, n) => { const [x, y] = avs[n] || [cx, H * 0.6]; const ym = y0 + (y - y0) * 0.42; pa.setAttribute('d', `M${cx},${y0} L${cx},${ym} C${cx},${ym + (y - ym) * 0.62} ${x},${ym + (y - ym) * 0.3} ${x},${y}`) })
        }
        const tel = el.querySelector('.r63-tel'); if (tel) el.style.setProperty('--s4', Math.max(1.6, Math.min(innerWidth * 0.92 / tel.offsetWidth, innerHeight * 1.9 / tel.offsetHeight)).toFixed(3))
      })
      const paso = () => {
        raf = 0; const h = innerHeight
        // --p va de 0 (la sección anterior ya se fue a medias) a 1 (la siguiente asoma abajo)
        puentes.forEach((el) => {
          const r = el.getBoundingClientRect(); if (r.bottom < -h || r.top > 2 * h) return
          const p = el.dataset.hoja ? hojaP(el, r, h) : Math.min(1, Math.max(0, (-r.top - 0.5 * h) / Math.max(1, r.height - 1.95 * h))); el.style.setProperty('--p', Math.min(1, p * (+el.dataset.k || 1)).toFixed(4))
          if (el.classList.contains('r63-r6')) { const z = Math.min(1, Math.max(0, (p * 0.74 - 0.08) / 0.62)); el.style.setProperty('--z6', z.toFixed(4)); el.style.setProperty('--s6', (0.6 * Math.pow(70, z)).toFixed(3)) }
        })
      }
      ajusta(); paso()
      addEventListener('resize', () => { ajusta(); paso() })
      addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paso) }, { passive: true })
    }
  }
  // C2: los dos caminos del cierre pasan dentro de Preguntas. C3: la franja de Evidencia nombra las guías
  if (d.r63l === 'c2') { const c = document.querySelector('.cierre .dos-caminos'), q = document.querySelector('#preguntas .envoltura'); if (c && q) { const w = document.createElement('div'); w.className = 'envoltura'; c.classList.add('r63-caminos'); w.append(c); q.after(w) } }
  if (d.r63l === 'c3') { const t = document.querySelector('#evidencia .titulo-sec'); if (t && !t.nextElementSibling?.classList.contains('r63-guias')) t.insertAdjacentHTML('afterend', '<p class="r63-guias">Ejercicio y educación, tratamiento central de la artrosis de rodilla y de cadera: OARSI 2019 · ACR 2020 · NICE 2022.</p>') }
}
// ===== ronda 65 · pasos nuevos desde referentes (19 nov) =====
// r65r (Rutinas → Aprender): R8 un solo color que cambia (Apple Vision Pro, Stripe); R9 piezas que cosen el borde
// (Headspace); R10 la foto entra a su lugar (Apple, AirPods). r65p (Aprender → Para cada uno): P8 el titular se adelanta
// (Hinge, Apple); P9 Rosa, Javiera y Tomás cosen el borde (Headspace); P10 el teléfono de Rosa entra a su lugar (Apple).
{
  const d = document.body.dataset, reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const BASE = document.querySelector('[data-r59]')?.dataset.base || '.'
  const rut = document.querySelector('#rutinas'), apr = document.querySelector('#aprender'), pcu = document.querySelector('#para-cada-uno')
  const R = d.r65r && d.r65r !== 'hoy' ? d.r65r : '', P = d.r65p && d.r65p !== 'hoy' ? d.r65p : ''
  const cl = (x) => Math.min(1, Math.max(0, x)), suave = (t) => t * t * (3 - 2 * t), mezcla = (a, b, t) => a + (b - a) * t
  const tareas = []
  // R9 y P9 se ven también con «reducir movimiento» (quedan quietas, ya abiertas)
  if (R === 'r9' && apr) {
    const LD = JSON.parse(document.querySelector('[data-r59] .f9-datos')?.textContent || '[]')
    const fotos = [...LD.slice(0, 2).map((x) => `${BASE}/fotos/aprender/${x.id}-cuadrada.webp`), `${BASE}/medios/aprender/el-ejercicio-es-tratamiento.webp`, ...LD.slice(2, 4).map((x) => `${BASE}/fotos/aprender/${x.id}-cuadrada.webp`)]
    const c = document.createElement('div'); c.className = 'r65-costura'; c.setAttribute('aria-hidden', 'true')
    c.innerHTML = fotos.map((f, n) => `<i style="--n:${n - 2}"><img src="${f}" alt="" loading="lazy" decoding="async"></i>`).join('')
    apr.prepend(c)
    if (!reducir) tareas.push((h) => { const t = apr.getBoundingClientRect().top; c.style.setProperty('--u', suave(cl((h * 0.98 - t) / (h * 0.62))).toFixed(4)) })
    else c.style.setProperty('--u', 1)
  }
  if (P === 'p9' && pcu) {
    const c = document.createElement('div'); c.className = 'r65-costura r65-tres'; c.setAttribute('aria-hidden', 'true')
    c.innerHTML = '<b class="r65-linea"></b>' + [['RD', 'Rosa', ''], ['JV', 'Javiera', 'k'], ['TB', 'Tomás', 'm']].map(([a, n, k], i) => `<span style="--n:${i - 1}"><span class="r63-av ${k}">${a}</span><small>${n}</small></span>`).join('')
    pcu.prepend(c)
    if (!reducir) tareas.push((h) => { const t = pcu.getBoundingClientRect().top; c.style.setProperty('--u', suave(cl((h * 0.95 - t) / (h * 0.55))).toFixed(4)) })
    else c.style.setProperty('--u', 1)
  }
  if (!reducir) {
    // R8: Rutinas y Aprender comparten un solo fondo que pasa de Petróleo a hueso mientras Aprender sube
    if (R === 'r8' && rut && apr) tareas.push((h) => { const q = cl((h * 0.72 - apr.getBoundingClientRect().top) / (h * 0.36)).toFixed(4); rut.style.setProperty('--q65', q); apr.style.setProperty('--q65', q) })
    // R10 y P10: una copia fija viaja desde la pantalla completa (o el centro) hasta el lugar del original
    const viaje = (sec, buscar, armar, inicio) => {
      let copia = null
      tareas.push((h) => {
        const og = buscar(); if (!og) return
        const st = sec.getBoundingClientRect().top, t = cl((h * 0.92 - st) / (h * 0.86)), r = og.getBoundingClientRect()
        const activo = st < h && t < 1 && r.width > 0
        og.style.visibility = activo ? 'hidden' : ''
        if (!activo) { if (copia) copia.style.display = 'none'; return }
        if (!copia) { copia = armar(og); document.body.append(copia) }
        copia.style.display = ''
        inicio(copia, og, r, st, h, suave(t))
      })
    }
    if (R === 'r10' && apr) viaje(apr, () => apr.querySelector('#f9-p-lectura.activo .f9-lec-foto img'),
      (og) => { const c = document.createElement('div'); c.className = 'r65-viaje'; c.setAttribute('aria-hidden', 'true'); c.innerHTML = '<img alt="">'; return c },
      (c, og, r, st, h, e) => {
        const im = c.firstChild; if (im.getAttribute('src') !== (og.currentSrc || og.src)) im.src = og.currentSrc || og.src
        const W = innerWidth, top = mezcla(st, r.top, e), left = mezcla(0, r.left, e), w = mezcla(W, r.width, e), ht = mezcla(h, r.height, e)
        Object.assign(c.style, { top: top + 'px', left: left + 'px', width: w + 'px', height: ht + 'px', borderRadius: mezcla(0, parseFloat(getComputedStyle(og.parentElement).borderTopLeftRadius) || 14, e) + 'px' })
      })
    // P10: el teléfono real de Rosa (no una copia, para que conserve sus estilos) sube grande con la sección y se acomoda
    if (P === 'p10' && pcu) {
      const vis = (sel) => [...pcu.querySelectorAll(sel)].find((x) => x.getClientRects().length)
      let tel = null
      tareas.push((h) => {
        tel = tel?.getClientRects().length ? tel : vis('.pa-col.foco .pa-dev') || vis('.pa-col .pa-dev')
        if (!tel) return
        const st = pcu.getBoundingClientRect().top, e = suave(cl((h * 0.92 - st) / (h * 0.86)))
        tel.style.translate = ''; tel.style.scale = ''
        if (e >= 1 || st > h) { tel.classList.remove('r65-viajando'); return }
        const r = tel.getBoundingClientRect(), s0 = Math.min(1.35, (h * 0.8) / r.height)
        const cx = innerWidth / 2 - (r.left + r.width / 2), cy = st + h * 0.56 - (r.top + r.height / 2)
        tel.classList.add('r65-viajando')
        tel.style.translate = `${(cx * (1 - e)).toFixed(1)}px ${(cy * (1 - e)).toFixed(1)}px`; tel.style.scale = mezcla(s0, 1, e).toFixed(4)
      })
    }
    // P8: el titular de «Para cada uno» llega grande al centro y se acomoda en su lugar; el fondo pasa de hueso a arena
    if (P === 'p8' && pcu && apr) {
      let ti = null
      tareas.push((h) => {
        const st = pcu.getBoundingClientRect().top, q = cl((h * 0.95 - st) / (h * 0.55)).toFixed(4), e = suave(cl((h * 0.9 - st) / (h * 0.82)))
        apr.style.setProperty('--q65', q); pcu.style.setProperty('--q65', q); pcu.style.setProperty('--e65', e.toFixed(4))
        ti = ti?.getClientRects().length ? ti : [...pcu.querySelectorAll('.r6-cab .titulo-sec')].find((x) => x.getClientRects().length)
        if (!ti) return
        if (st < h) ti.closest('.revela')?.classList.add('visible')
        ti.style.translate = ''; ti.style.scale = ''
        const rg = document.createRange(); rg.selectNodeContents(ti)
        const r = rg.getBoundingClientRect(), s = Math.min(1.9, (innerWidth * 0.86) / Math.max(1, r.width))
        const dx = innerWidth / 2 - (r.left + r.width / 2), dy = h * 0.42 - (r.top + r.height / 2)
        if (e < 1) { ti.style.translate = `${(dx * (1 - e)).toFixed(1)}px ${(dy * (1 - e)).toFixed(1)}px`; ti.style.scale = mezcla(s, 1, e).toFixed(4) }
      })
    }
  }
  if (tareas.length) {
    let raf = 0
    const paso = () => { raf = 0; const h = innerHeight; tareas.forEach((f) => f(h)) }
    paso()
    addEventListener('resize', paso)
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paso) }, { passive: true })
  }
}
// ===== fin ronda 65 =====
// ===== ronda 66 · R9 y P8 auditados y mejorados (19 nov) =====
// R11: los cuatro formatos reales de Aprender, más grandes, cosen el borde con su ícono, nombre y duración.
// R12: lo mismo con jerarquía: el video al centro y cinco piezas de tamaños distintos. P11 y P12: el titular de
// «Para cada uno» se adelanta sin apagar Aprender y sin dejar un momento vacío (P11 crece desde su lugar; P12 llega al centro).
{
  const d = document.body.dataset, reducir = matchMedia('(prefers-reduced-motion: reduce)').matches
  const BASE = document.querySelector('[data-r59]')?.dataset.base || '.'
  const apr = document.querySelector('#aprender'), pcu = document.querySelector('#para-cada-uno')
  const R = d.r65r, P = d.r65p
  const cl = (x) => Math.min(1, Math.max(0, x)), suave = (t) => t * t * (3 - 2 * t), mezcla = (a, b, t) => a + (b - a) * t
  const tareas = []
  if ((R === 'r11' || R === 'r12') && apr) {
    const listas = [...document.querySelectorAll('[data-r59] .f9-datos')].map((x) => { try { return JSON.parse(x.textContent) } catch (e) { return [] } })
    const todas = listas.flat(), dato = (id) => todas.find((x) => x.id === id) || {}
    const min = (txt) => (String(txt || '').match(/(\d+) min/) || [])[1]
    const tabs = [...document.querySelectorAll('[data-r59] .f9-tabs [role="tab"]')], ic = (n) => tabs[n]?.querySelector('.f9-ic')?.innerHTML || ''
    const charla = min((document.querySelector('#f9-p-charla')?.textContent.match(/Charla de \d+ min/) || [])[0])
    const foto = (id) => `${BASE}/fotos/aprender/${id}-4x3-800.webp`
    const pz = {
      lectura: { src: foto('para-que-sirve-cada-ejercicio'), ic: ic(0), n: 'Lectura', m: min(dato('para-que-sirve-cada-ejercicio').m), op: '50% 40%' },
      video: { src: `${BASE}/medios/aprender/el-ejercicio-es-tratamiento.webp`, ic: ic(1), n: 'Video', m: min(dato('el-ejercicio-es-tratamiento').m), op: '50% 34%', play: 1 },
      charla: { src: foto('lo-que-sientes-cuenta'), ic: ic(2), n: 'Charla', m: charla, op: '38% 50%' },
      podcast: { src: foto('caminar-paso-a-paso'), ic: ic(3), n: 'Podcast', m: min(dato('caminar-paso-a-paso').m), op: '50% 50%' },
      lectura2: { src: foto('dormir-mejor'), ic: ic(0), n: 'Lectura', m: min(dato('dormir-mejor').m), op: '58% 50%' }
    }
    const lista = R === 'r11'
      ? [['lectura', -1.5], ['video', -0.5], ['charla', 0.5], ['podcast', 1.5]].map(([k, x]) => ({ k, x }))
      : [{ k: 'charla', x: -2, s: 0.72, y: 34, cls: 'r66-fuera r66-solo' }, { k: 'lectura', x: -1.13, y: -16 }, { k: 'video', x: 0, s: 1.3 }, { k: 'podcast', x: 1.13, y: -16 }, { k: 'lectura2', x: 2, s: 0.72, y: 34, cls: 'r66-fuera r66-solo' }]
    const play = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z"/></svg>'
    const c = document.createElement('div'); c.className = 'r66-costura r66-' + R; c.setAttribute('aria-hidden', 'true')
    c.innerHTML = lista.map(({ k, x, s = 1, y = 0, cls = '' }) => {
      const p = pz[k]
      return `<i class="${cls}" style="--x:${x};--s:${s};--y:${y}px;--op:${p.op};z-index:${10 - Math.round(Math.abs(x) * 2)}"><img src="${p.src}" alt="" loading="lazy" decoding="async">` +
        (p.play ? `<span class="r66-play">${play}</span>` : '') +
        `<span class="r66-et">${p.ic}<b>${p.n}</b>${p.m ? `<em>· ${p.m} min</em>` : ''}</span></i>`
    }).join('')
    apr.querySelector(':scope > .r65-costura')?.remove()
    apr.prepend(c)
    if (!reducir) tareas.push((h) => { const t = apr.getBoundingClientRect().top; c.style.setProperty('--u', suave(cl((h * 0.98 - t) / (h * 0.62))).toFixed(4)) })
    else c.style.setProperty('--u', 1)
  }
  if ((P === 'p11' || P === 'p12') && pcu && apr && !reducir) {
    const vis = (sel) => [...pcu.querySelectorAll(sel)].find((x) => x.getClientRects().length)
    const partes = [['.r6-cab .ceja-sec', 0.5], ['.pa-arriba', 0.28], ['.pa-caps', 0.36], ['.pa-esc', 0.44]]
    let ti = null
    tareas.push((h) => {
      const st = pcu.getBoundingClientRect().top
      const q = cl((h * 0.95 - st) / (h * 0.5)).toFixed(4), e = suave(cl((h * 0.95 - st) / (h * 0.72)))
      apr.style.setProperty('--q66', q); pcu.style.setProperty('--q66', q)
      partes.forEach(([sel, a]) => {
        const el = vis(sel); if (!el) return
        if (e >= 1) { el.style.opacity = ''; el.style.translate = ''; return }
        const p = suave(cl((e - a) / 0.42)); el.style.opacity = p.toFixed(3); el.style.translate = `0 ${((1 - p) * 44).toFixed(1)}px`
      })
      ti = ti?.getClientRects().length ? ti : vis('.r6-cab .titulo-sec')
      if (!ti) return
      if (st < h) ti.closest('.revela')?.classList.add('visible')
      ti.style.translate = ''; ti.style.scale = ''; ti.style.transformOrigin = ''
      if (e >= 1 || st > h) return
      const rg = document.createRange(); rg.selectNodeContents(ti)
      const r = rg.getBoundingClientRect(), b = ti.getBoundingClientRect(), W = innerWidth
      if (P === 'p11') {
        const s = Math.max(1, Math.min(1.55, (W - r.left - Math.max(16, r.left)) / Math.max(1, r.width)))
        ti.style.transformOrigin = `${(r.left - b.left).toFixed(1)}px ${(r.bottom - b.top).toFixed(1)}px`
        ti.style.translate = `0 ${((1 - e) * h * 0.05).toFixed(1)}px`; ti.style.scale = mezcla(s, 1, e).toFixed(4)
      } else {
        const s = Math.max(1, Math.min(1.6, (W * 0.84) / Math.max(1, r.width)))
        ti.style.transformOrigin = `${(r.left + r.width / 2 - b.left).toFixed(1)}px ${(r.top + r.height / 2 - b.top).toFixed(1)}px`
        const dx = W / 2 - (r.left + r.width / 2)
        ti.style.translate = `${(dx * (1 - e)).toFixed(1)}px ${((1 - e) * h * 0.15).toFixed(1)}px`; ti.style.scale = mezcla(s, 1, e).toFixed(4)
      }
    })
  }
  if (tareas.length) {
    let raf = 0
    const paso = () => { raf = 0; const h = innerHeight; tareas.forEach((f) => f(h)) }
    paso()
    addEventListener('resize', paso)
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(paso) }, { passive: true })
  }
}
// ===== fin ronda 66 =====
