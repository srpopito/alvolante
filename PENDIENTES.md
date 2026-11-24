# PENDIENTES

Cosas que **no** están en la app porque no se han podido confirmar en una fuente oficial `.gov`, o que quedan para después. Nada de esto se inventa: si no hay fuente, aquí se queda.

## Contenido y fuentes

- [ ] **Estados**: NJ, PA, CT, MA, FL, CA, TX, IL. Solo NY está verificado hoy. Cada uno necesita su manual oficial, formato de examen, requisitos de permiso y road test antes de escribir una sola pregunta.
- [ ] **CDL por estado**: enlace al manual CDL oficial de cada estado (en NY, CDL-10) y dónde se hace el trámite.
- [ ] **Listas oficiales de autoescuelas** de los estados nuevos: si el estado no publica una lista descargable, se enlaza su buscador oficial (no se inventa una lista).
- [ ] Séptima tarjeta cultural en inglés (los otros 5 idiomas tienen 7) — decidir si se añade, y con qué fuente.
- [ ] Revisar las preguntas de NY con una segunda pasada humana antes de publicar: están cotejadas contra el manual, pero una lectura de Cristian vale más que diez scripts.

## Técnico

- [ ] Capturas de tienda (`store/*.png`): están entre 500 y 750 KB. Recomprimir antes de volver a subir a Play Console.
- [ ] `privacy.html`: añadir `<link rel="icon">` (hoy provoca un 404 de favicon).
- [ ] Diálogo de idioma: trampa de foco + cerrar con Escape.
- [ ] `prefers-reduced-motion`: parar también el vídeo de portada, no solo las transiciones.
- [ ] `hasVoice()`: no devolver `true` cuando la lista de voces aún está vacía.
- [ ] `store/ficha_google_play.md`: existe `DriveReady_android/ficha_google_play.md` fuera del repo; si cambian textos de tienda (estados nuevos, CDL) hay que regenerarla dentro del repo. **No se sube a Play Console**: eso lo hace Cristian.

## Verificación pendiente

- [ ] Probar la app instalada en un Android antiguo real (fuentes bengalí y china).
- [ ] Probar el modo sin conexión en producción (`https://srpopito.github.io/alvolante/`) después de publicar: en local el service worker no se registra porque el registro exige `https:`.