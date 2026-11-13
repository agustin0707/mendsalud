// Formulario «Conversemos» (F1): Cloudflare Pages Function que manda el mensaje por Resend a contacto@mendsalud.cl.
// La clave vive solo como secreto de Cloudflare (RESEND_API_KEY), nunca en este repo público.
const LIMITES = { nombre: 120, centro: 160, rol: 60, correo: 160, mensaje: 4000 }
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const responder = (status, cuerpo) => new Response(JSON.stringify(cuerpo), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })

export async function onRequestPost({ request, env }) {
  let datos
  try { datos = await request.json() } catch { return responder(400, { ok: false }) }
  // Campo trampa: si un robot lo llena, se responde bien y no se manda nada
  if (datos.sitio) return responder(200, { ok: true })
  const d = {}
  for (const [k, max] of Object.entries(LIMITES)) {
    const v = String(datos[k] ?? '').trim()
    if (!v || v.length > max) return responder(400, { ok: false, campo: k })
    d[k] = v
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) return responder(400, { ok: false, campo: 'correo' })
  if (!env.RESEND_API_KEY) return responder(503, { ok: false })

  const html = `<p><b>Nombre:</b> ${escapar(d.nombre)}<br><b>Centro:</b> ${escapar(d.centro)}<br><b>Rol:</b> ${escapar(d.rol)}<br><b>Correo:</b> ${escapar(d.correo)}</p><p>${escapar(d.mensaje).replace(/\n/g, '<br>')}</p>`
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: 'Mend salud <contacto@mendsalud.cl>',
      to: ['contacto@mendsalud.cl'],
      reply_to: d.correo,
      subject: `Conversemos: ${d.nombre.slice(0, 60)} · ${d.centro.slice(0, 60)}`,
      html,
      text: `Nombre: ${d.nombre}\nCentro: ${d.centro}\nRol: ${d.rol}\nCorreo: ${d.correo}\n\n${d.mensaje}`,
    }),
  })
  return r.ok ? responder(200, { ok: true }) : responder(502, { ok: false })
}

export const onRequest = () => responder(405, { ok: false })
