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
    if (r.top <= y && r.bottom > y) t = Number(ini.style.getPropertyValue('--p') || 0) > 0.3 ? 'oscuro' : (ini.dataset.tono ?? 'oscuro')
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
    const p = recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 0
    inicio.style.setProperty('--p', p.toFixed(4))
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
