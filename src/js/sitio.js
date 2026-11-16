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
function tono() {
  const y = 40
  let t = 'oscuro'
  for (const s of tonos) {
    const r = s.getBoundingClientRect()
    if (r.top <= y && r.bottom > y) t = s.dataset.tonoCab ?? s.dataset.tono
  }
  // En el inicio, el tono puede cambiar a mitad del paso (la versión 1 parte clara y termina en el degradado).
  const ini = document.querySelector('.inicio')
  if (ini) {
    const r = ini.getBoundingClientRect()
    if (r.top <= y && r.bottom > y) { const pp = Number(ini.style.getPropertyValue('--p') || 0); t = document.body.dataset.r23f === 'f3' && pp > 0.5 ? 'claro' : pp > 0.3 ? 'oscuro' : (ini.dataset.tono ?? 'oscuro') }
  }
  if (cab) {
    cab.dataset.sobre = t
    cab.dataset.compacta = String(scrollY > 24) // la barra se achica (y en N3 aparece el vidrio) al empezar a bajar
  }
}

// Paso del inicio: --p de 0 a 1 mientras la foto queda fija.
const inicio = document.querySelector('.inicio')
const quieto = matchMedia('(prefers-reduced-motion: reduce)')
function paso() {
  if (inicio && !quieto.matches) {
    const r = inicio.getBoundingClientRect()
    const recorrido = inicio.offsetHeight - innerHeight
    // Ronda 23: con relato, el paso del inicio se alarga en --alto-relato (svh); --p cubre el tramo de siempre y --q el del relato
    const extra = (Number(getComputedStyle(inicio).getPropertyValue('--alto-relato')) || 0) * innerHeight / 100
    const base = recorrido - extra
    const p = base > 0 ? Math.min(1, Math.max(0, -r.top / base)) : 0
    inicio.style.setProperty('--p', p.toFixed(4))
    const escena = inicio.querySelector('.escena-app')
    if (escena) {
      const q = extra > 0 ? Math.min(1, Math.max(0, (-r.top - base) / extra)) : 0
      inicio.style.setProperty('--q', q.toFixed(4))
      escena.dataset.paso = String(q < 0.34 ? 0 : q < 0.67 ? 1 : 2)
      escena.classList.toggle('en-uso', p > 0.84)
    }
  }
  tono()
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
    const r = toques.querySelector('.toque-rotulo'); if (r.textContent !== rot && rot) r.textContent = rot; r.dataset.lado = x > 0.6 ? 'izq' : x < 0.4 ? 'der' : ''
  }

  // Líneas de las tarjetas (B2): de la tarjeta del paso activo a lo que señala en la pantalla
  function dibujarLineas() {
    if (cuerpo.r24b !== 'b2' || !svg || innerWidth <= 760) return
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
  function viaje() {
    if (cuerpo.r24e !== 'e2' || !viajero || innerWidth <= 760 || !/a3|a4/.test(cuerpo.r23a ?? '')) return
    const paso = num('--p') > 0.84 ? Number(escenaApp.dataset.paso || 0) : -1
    if (paso === pasoViaje) return
    pasoViaje = paso
    anim?.cancel(); escenaApp.classList.remove('viajando', 'llego')
    if (paso !== 2) return
    setTimeout(() => {
      if (pasoViaje !== 2) return
      const D = dispo.getBoundingClientRect(), S = pantallas.getBoundingClientRect(), E = escenaApp.querySelector('.llega').getBoundingClientRect()
      const sx = S.left + S.width * 0.62 - D.left, sy = S.top + S.height * 0.3 - D.top, ex = E.left + E.width / 2 - D.left, ey = E.top + E.height / 2 - D.top
      const d = `M${sx.toFixed(1)} ${sy.toFixed(1)} Q${((sx + ex) / 2).toFixed(1)} ${(Math.min(sy, ey) - 110).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`
      svg.querySelector('.ruta').setAttribute('d', d)
      viajero.style.offsetPath = `path('${d}')`
      escenaApp.classList.add('viajando')
      anim = viajero.animate([{ offsetDistance: '0%', opacity: 0, scale: 0.7 }, { offset: 0.12, opacity: 1, scale: 1 }, { offset: 0.85, opacity: 1, scale: 1 }, { offsetDistance: '100%', opacity: 0, scale: 0.55 }], { duration: 1500, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'both' })
      anim.onfinish = () => { escenaApp.classList.remove('viajando'); escenaApp.classList.add('llego') }
    }, 1000)
  }

  const cuadro = () => {
    const r = inicio.getBoundingClientRect()
    if (r.bottom > 0 && r.top < innerHeight) { sincronizar(); if (lista) dibujarToques(); dibujarLineas(); viaje() }
    requestAnimationFrame(cuadro)
  }
  requestAnimationFrame(cuadro)
}
