// Mend · sitio. Cápsula de la barra, tono de la cabecera según lo que pasa debajo, menú del celular y paso del inicio.
const cab = document.querySelector('.cab-sitio')
const nav = cab?.querySelector('.nav-vidrio')
const capsula = nav?.querySelector('.nav-capsula')
const actual = nav?.querySelector('[aria-current="page"]')

// La cápsula de vidrio claro se desliza bajo el ítem que se apunta y vuelve al de la página al salir.
function moverCapsula(a, sinAnimar) {
  if (!capsula) return
  if (!a) { capsula.style.opacity = '0'; return }
  if (sinAnimar) capsula.style.transition = 'none'
  capsula.style.opacity = '1'
  capsula.style.setProperty('--x', `${a.offsetLeft}px`)
  capsula.style.setProperty('--w', `${a.offsetWidth}px`)
  nav.querySelectorAll('a').forEach((x) => x.classList.toggle('bajo', x === a))
  nav.querySelectorAll('a').forEach((x) => x.classList.toggle('fuera', x !== a))
  if (sinAnimar) requestAnimationFrame(() => { capsula.style.transition = '' })
}
if (nav) {
  const ubicar = () => moverCapsula(actual, true)
  document.fonts?.ready.then(ubicar)
  addEventListener('resize', ubicar)
  ubicar()
  nav.querySelectorAll('a').forEach((a) => {
    a.addEventListener('pointerenter', () => moverCapsula(a))
    a.addEventListener('focus', () => moverCapsula(a))
  })
  nav.addEventListener('pointerleave', () => moverCapsula(actual))
  nav.addEventListener('focusout', (e) => { if (!nav.contains(e.relatedTarget)) moverCapsula(actual) })
}

// Menú del celular
const menu = cab?.querySelector('.menu-boton')
menu?.addEventListener('click', () => {
  const abierto = cab.classList.toggle('abierta')
  menu.setAttribute('aria-expanded', String(abierto))
  menu.querySelector('.nombre').textContent = abierto ? 'Cerrar' : 'Menú'
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
