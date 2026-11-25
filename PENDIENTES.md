# PENDIENTES

Lo que **no** está en la app porque no se ha podido confirmar en una fuente oficial `.gov`, o que queda para después. Nada de esto se inventa.

## Hecho en esta entrega

- ✅ **New Jersey completo** (78 preguntas, 6 idiomas, fuentes en `states/nj/FUENTES.md`).
- ✅ **Pennsylvania completo** (72 preguntas, 6 idiomas, fuentes en `states/pa/FUENTES.md`).
- ✅ **CDL** en 6 idiomas con FMCSA y el manual CDL del estado.
- ✅ **4 juegos** y modo «solo mis errores».
- ✅ **Aviso «no es una app del gobierno»** visible en todas las pantallas, por estado.
- ✅ **Tests**: `_t/test.html` con 109 comprobaciones.

## Contenido y fuentes

- [ ] **6 estados más**: Connecticut (CT DMV), Massachusetts (RMV), Florida (FLHSMV), California (CA DMV), Texas (DPS), Illinois (SOS). Cada uno necesita su manual, formato de examen, requisitos de permiso y road test antes de escribir una sola pregunta.
- [ ] **Listas oficiales de autoescuelas** de los estados nuevos: si el estado no publica una lista descargable, se enlaza su buscador oficial (como ya se hace con NJ).
- [ ] **Revisión humana de las 78 preguntas de NJ y las 72 de PA** antes de publicar. Están contrastadas con el manual página a página, pero la lectura de Cristian vale más.
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
## CDL — pendiente

- [ ] **Número de preguntas del examen de conocimientos** (general, frenos de aire, combinados y endosos) en NY y NJ: no está publicado en las páginas oficiales consultadas. Por eso el simulacro es modo práctica con el 80 % federal. Si Cristian consigue el dato oficial, se pone.
- [ ] **Idiomas en que cada estado ofrece el examen de conocimientos CDL**: no confirmado. La app solo afirma el requisito federal de inglés.
- [ ] **Juego de control básico del vehículo** (animaciones cenitales de marcha atrás recta, desplazada y en ángulo): no hecho en esta entrega.
- [ ] **Calculadora de horas de servicio (HOS)**: no hecha; requiere confirmar todas las reglas de 49 CFR 395 y explicarlas sin errores.
- [ ] Lecciones para los endosos P, S, N, T, H y X: hoy la app explica cuándo se necesitan y enlaza el manual, pero el curso solo tiene los tres exámenes base (general, frenos, combinados).

## Play

- [ ] Comprobar que `/.well-known/assetlinks.json` responde en el dominio real (no hay dominio en el repo; el archivo vive en otro repositorio).
- [ ] Subir `store/nuevas/` a Play Console y marcar Data safety y Ads.
- [ ] Las fuentes de Google (Google Fonts) se sustituyen por tipografía propia en la fase 7.
- [ ] Subir rendimiento móvil de 84 a 85 (Lighthouse); el informe está en `docs/lighthouse/`.

- [ ] Connecticut: catálogo completo de señales (están las 34), las 4 maniobras y ampliar la hoja del road test a todas las categorías (el banco de 76 preguntas en 6 idiomas y el kit del día ya están).
