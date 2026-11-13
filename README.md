# mendsalud.cl

Sitio de Mend: HTML, CSS y JavaScript sin framework.

- `node armar.mjs` arma el sitio en `dist/`: pega la cabecera y el pie, pone los estilos en línea, el sitemap, `robots.txt` y `_headers`.
- Cloudflare Pages lo publica solo con cada cambio en `main` (comando `node armar.mjs`, carpeta `dist`).
- El formulario «Conversemos» es la función `functions/api/contacto.js`. Manda el mensaje por Resend con la clave `RESEND_API_KEY`, que se guarda solo como secreto de Cloudflare.
- Las fuentes de cada texto de salud están en `FUENTES.md`.

Las fotos de personas son imágenes generadas. Las capturas de la app usan datos de ejemplo.
