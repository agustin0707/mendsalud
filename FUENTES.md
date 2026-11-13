# Fuentes de la landing de Mend

Cada texto de salud del sitio, con su fuente. Lo que es criterio clínico o de diseño se marca como tal. Las referencias completas, en APA 7, están en la memoria (`Memoria/texto/11-referencias.md`) y al final de la página Evidencia. Sin nombres de personas ni de instituciones (regla N1 de la landing).

| Página | Texto | Fuente | Tipo |
|---|---|---|---|
| Inicio | 595 millones de personas tenían artrosis en el mundo en 2020 | GBD 2021 Osteoarthritis Collaborators (2023), *The Lancet Rheumatology* 5(9) | Estudio |
| Inicio | 14,4 % de las personas de 55 años y más en Chile tiene artrosis de rodilla y 9 % de cadera | Ministerio de Salud (s. f.), guía clínica GES, con datos de la Encuesta Nacional de Salud 2016-2017 | Dato oficial |
| Inicio, Evidencia | 62 % usaba a diario lo aprendido a los 3 meses y 37 % a los 12 (programa sueco BOA) | Thorstensson et al. (2015), *Musculoskeletal Care* 13(2) | Estudio |
| Inicio, Evidencia | El ejercicio y la educación son el tratamiento central | Bannuru et al. (2019, OARSI); Kolasinski et al. (2020, ACR); National Institute for Health and Care Excellence (2022, NG226) | Guías clínicas |
| Evidencia | OARSI: ejercicio estructurado y educación como tratamiento central para rodilla, cadera y varias articulaciones | Bannuru et al. (2019) | Guía |
| Evidencia | ACR: recomienda con fuerza el ejercicio y los programas de automanejo | Kolasinski et al. (2020) | Guía |
| Evidencia | NICE: ejercicio terapéutico adaptado, información y apoyo para el automanejo | NICE (2022) | Guía |
| Inicio, Evidencia | El efecto no se mantiene seis meses después sin sesiones de refuerzo | Pisters et al. (2007), *Arthritis & Rheumatism* 57(7) | Revisión sistemática |
| Evidencia | Las estrategias de seguimiento y refuerzo ayudan a sostener el ejercicio | Nicolson et al. (2017), *British Journal of Sports Medicine* 51(10) | Revisión sistemática |
| Inicio, Equipos, Evidencia | Escala de molestias: 0 a 3 sigue, 4 a 6 más fácil, 7 a 10 no hacer ese ejercicio; hablar de molestias y no de dolor | Criterio clínico de un kinesiólogo, por correo el 26 oct 2026 (R43 en `Codigos mend/docs/aprender/FUENTES.md`) | Criterio clínico experto |
| Inicio, Evidencia | Para y avisa si la molestia llega a 7, si aparece un dolor de golpe o si al día siguiente hay más molestias que de costumbre | Criterio clínico (R43) y revisión de la mañana siguiente del modelo de monitoreo del dolor (Thomeé, 1997; R8), tal como en la app (`src/mock/preguntasFrecuentes.js`) | Criterio clínico |
| Inicio, Evidencia | Centro de salud si la articulación se hincha mucho, se pone roja o caliente; urgencia si hay caída sin poder pisar o dolor en el pecho | Criterio clínico de una reumatóloga, por correo el 4 nov 2026 (R47) | Criterio clínico (validado) |
| Evidencia, pie | Llamar al 131 si alguien se desmaya o pierde el conocimiento | SAMU, 131 (R40); señal validada por la reumatóloga (R47) | Dato oficial |
| Inicio, Equipos | Aviso por correo al kinesiólogo cuando alguien marca una molestia de 7 o más | Funcionamiento de la app (servicio `mend-avisos`, desde el 26 oct 2026) | Producto |
| Inicio, Equipos | La rutina del día cambia si la persona marca que amaneció rígida o muy sensible | Funcionamiento de la app | Producto |
| Evidencia | Validación de ejercicios (rutinas base), escala, señales y Aprender por kinesiología y reumatología | `Codigos mend/docs/aprender/FUENTES.md` (R43, R47) y `docs/aprender/VALIDACION.md`. Las rutinas Elongación y Cadera nuevas (8 nov) no están revisadas por un kinesiólogo, por eso el texto dice «rutinas base» | Proceso |
| Inicio, Evidencia | WCAG 2.2 nivel AA | World Wide Web Consortium (2023) | Norma |
| Proyecto | 22 actores del sistema en 2025: pacientes, kinesiólogos, médicos y cuidadores | `Memoria/texto/02-contexto-y-usuarios.md` | Investigación propia |
| Evidencia, Equipos, Privacidad | Ley 19.628 sobre protección de la vida privada; Ley 21.719 de datos personales (publicada el 13 dic 2024) | Diario Oficial; ver «Ley de datos» en `PLAN-LANDING.md` | Ley |
| Equipos | El correo de aviso no trae nombres ni datos de salud; varios avisos juntos llegan en un solo correo | Funcionamiento de la app (`Codigos mend/avisos/src/kine.js`: `correoDeAlarma` y `correosQueTocan`, espera de 30 minutos por kine) | Producto |
| Inicio (Rutinas) | Ejercicios del riel: Sentarse y pararse, Paso adelante y atrás, Puente de glúteos, Caminar de lado, Elevación de talones, Subir un escalón, Mini sentadilla, Sentarse y pararse sin brazos | Ejercicios de las rutinas base validados por un kinesiólogo el 26 oct 2026 (R43); clips de la app (`src/assets/clips/`) | Criterio clínico experto |
| Inicio (Aprender) | Formato de cada pieza (podcast, video, charla, lectura) | `Codigos mend/src/mock/aprender.js` | Producto |
| Evidencia | Botón Aa para agrandar la letra en Aprender | Funcionamiento de la app (botón «Letra más grande») | Producto |
| Privacidad | Cloudflare Web Analytics sin cookies | Documentación de Cloudflare Web Analytics | Producto de terceros |
| Privacidad | Adobe Fonts recibe la IP y cuenta visitas para la licencia | Política de privacidad de Adobe Fonts | Producto de terceros |

## Criterios de redacción que no son evidencia clínica

- «Hecho para leerse a cualquier edad», «Letra grande y palabras de todos los días»: criterio de diseño del manual de marca (sección 09, voz) y de la app.
- «Cálida, pero seria»: principio 02 del manual de marca (V08).
- Retención de 12 meses de los mensajes del formulario (P12, confirmado por Agustín el 12 nov) y respuesta en 30 días.

## Imágenes (ronda 5, 12 nov)

- Capturas de la app con datos de ejemplo, hechas con `herramientas/captura-app.mjs` y `capturas-landing.mjs`, que cambian los nombres que coinciden con personas reales (la kine de ejemplo pasa a «Javiera Vidal»).
- Fotos y clips de personas: los de la app (generados con IA, como dice el pie del sitio). Sin fotos del testeo.
- El correo de aviso es el real (`mend-avisos`), con el nombre de ejemplo «Javiera».
