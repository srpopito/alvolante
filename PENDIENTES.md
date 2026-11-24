# PENDIENTES

Lo que **no** está en la app porque no se ha podido confirmar en una fuente oficial `.gov`, o que queda para después. Nada de esto se inventa.

## Hecho en esta entrega

- ✅ **New Jersey completo** (78 preguntas, 6 idiomas, fuentes en `states/nj/FUENTES.md`).
- ✅ **CDL** en 6 idiomas con FMCSA y el manual CDL del estado.
- ✅ **4 juegos** y modo «solo mis errores».
- ✅ **Aviso «no es una app del gobierno»** visible en todas las pantallas, por estado.
- ✅ **Tests**: `_t/test.html` con 109 comprobaciones.

## Contenido y fuentes

- [ ] **7 estados más**: Pennsylvania (PennDOT), Connecticut (CT DMV), Massachusetts (RMV), Florida (FLHSMV), California (CA DMV), Texas (DPS), Illinois (SOS). Cada uno necesita su manual, formato de examen, requisitos de permiso y road test antes de escribir una sola pregunta.
- [ ] **Listas oficiales de autoescuelas** de los estados nuevos: si el estado no publica una lista descargable, se enlaza su buscador oficial (como ya se hace con NJ).
- [ ] **Revisión humana de las 78 preguntas de NJ** antes de publicar. Están contrastadas con el manual página a página, pero la lectura de Cristian vale más.
- [x] Séptima tarjeta cultural en inglés.

## Técnico

- [x] Capturas de tienda: recomprimidas (17,4 MB → 5,8 MB, ninguna pasa de 300 KB).
- [ ] Las capturas actuales solo muestran Nueva York. Hay que componer capturas nuevas con NJ, juegos y CDL antes del próximo envío a Play.
- [x] `privacy.html`: icono declarado.
- [x] Diálogo de idioma: trampa de foco y Escape.
- [x] `hasVoice()`: corregido.
- [ ] Revisar gramática rusa con `{state}` en frases que pidan caso prepositivo si se añaden estados con nombre declinable.

## Verificación pendiente

- [ ] Probar la app instalada en un Android antiguo real (fuentes bengalí y china).
- [ ] Probar el modo sin conexión **en producción** después de publicar. En local ya se verifica con Chrome sin red (43 archivos en caché), pero la prueba definitiva es en `https://srpopito.github.io/alvolante/`.
- [ ] Revisar que la app de Android (TWA) sigue abriendo la web nueva sin regenerar el paquete.

## Publicación (lo hace Cristian)

- [ ] Revisar la rama `minke-update` y hacer merge a `main` cuando todo esté conforme.
- [ ] Subir la ficha nueva de `store/ficha_google_play.md` a Play Console (no se ha subido).
- [ ] Añadir las capturas nuevas de NJ y CDL a la ficha de Play.