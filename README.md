# mendsalud.cl

Sitio de Mend: HTML, CSS y JavaScript sin framework.

- `node armar.mjs` arma el sitio en `dist/`: pega la cabecera y el pie, pone los estilos en línea, el sitemap, `robots.txt` y `_headers`.
- Se publica a mano en Cloudflare Pages (proyecto `mendsalud`, dominios mendsalud.cl y www, que redirige al principal): `node armar.mjs` y luego `wrangler pages deploy dist --project-name mendsalud` desde esta carpeta, para que suba también `functions/`.
- La demo (demo.mendsalud.cl, proyecto `mend-demo`) se arma en la rama `demo-landing` de mend-app con `vite.demo.config.js` y solo usa datos de ejemplo.
- El formulario «Conversemos» es la función `functions/api/contacto.js`. Manda el mensaje por Resend con la clave `RESEND_API_KEY`, que se guarda solo como secreto de Cloudflare.
- Las fuentes de cada texto de salud están en `FUENTES.md`.

Las fotos de personas son imágenes generadas. Las capturas de la app usan datos de ejemplo.
