# AUDITORÍA — DriveReady (rama `minke-update`)

Fecha: 2026-11-23 · Auditor: Minke · Base: `main` @ `3fd9013` · Política: no push a `main`.

## Cómo se auditó (para que se pueda repetir)

| Qué | Cómo |
|---|---|
| Consola en 6 idiomas | Chrome headless por CDP (`Runtime.exceptionThrown` + `Log.entryAdded`), cargando `?lang=xx` |
| Todas las pestañas | Recorrido programático de las 10 vistas en cada idioma |
| Enlaces `.gov` | `fetch` real a las 10 URLs de `core.js`: estado HTTP + `<title>` |
| Contenido | 73 preguntas cotejadas contra el texto real de los capítulos del MV-21 descargados de `dmv.ny.gov` |
| Formato del examen | Capítulo 1 del manual: «at least 14 of the 20 questions… two of the four questions about road signs» |
| Pesos | `stat` de los 84 archivos del repo |
| Móvil | iframe de 360 px: `scrollWidth` vs `innerWidth` en las 10 vistas |
| Pruebas | `_t/test.html` (nueva) ejecutada en Chrome real |

**Resultado de la suite al cerrar la Fase 1: 98 / 98 comprobaciones, 0 errores de consola.**

---

## 1. Gravedad alta

### A1. No existía ninguna suite de pruebas (`_t/test.html` no estaba en el repo)
La orden daba por hecho que `http://localhost:8765/_t/test.html` pasaba 21/21. **La carpeta `_t/` no existía** y no había ni un solo test en el repositorio: no había forma de saber si un cambio rompía el examen, el juego o las traducciones.
**Hecho:** se creó `_t/test.html`, una suite real que carga la app en un iframe de 360 px y comprueba arranque, pestañas, avisos, enlaces, examen completo (20 preguntas), práctica, juego de señales, road test, autoescuelas, maniobras, manual, cultura y cambio de idioma. **98 comprobaciones, todas en verde.**

### A2. El selector de estado era un control muerto y engañoso
`index.html` mostraba un `<select id="estado">` con `NY` seleccionado y `NJ`, `FL`, `TX` **deshabilitados**. No tenía ningún manejador en `app.js`: el usuario veía un mando que parece funcionar y no hace nada, y que además sugiere estados que la app no tiene.
**Estado:** se sustituye por el selector real con registro de estados en la Fase 3 (no se parchea dos veces).

### A3. El aviso «no es una app del gobierno» no está donde la política lo exige
La orden pide que se *vea* en cada estado e idioma, con enlaces a las fuentes `.gov`. En la app solo aparece **en el pie** y dentro de la pestaña *Acerca*; en la pantalla de inicio no hay un bloque de aviso. Para una revisión de Google Play esto es justo lo que ya nos rechazó una vez.
**Estado:** se implementa como bloque `GOVN` por estado en la Fase 3 (con enlaces al manual del conductor y al manual CDL de cada estado).

---

## 2. Gravedad media

### M1. `sw.js` no precacheaba los idiomas y la versión no se había subido
`CORE` solo incluía los archivos base. Los `lang/*.js` se cacheaban *solo si* el usuario los había abierto alguna vez: sin conexión, cambiar a un idioma no visitado fallaba. Además `VERSION` seguía en `alv-v7` con archivos ya cambiados.
**Arreglado:** `alv-v8` y precarga de los 6 idiomas + los 3 iconos.

### M2. El resultado del examen llevaba el 20 escrito a mano
`examenResultado()` pintaba `num(20)` en vez del número real de preguntas. Hoy el examen siempre tiene 20, pero cualquier cambio futuro (o un examen a medias rehidratado) mostraba una cifra falsa.
**Arreglado:** `num(EX.qs.length)`.

### M3. Las capturas de tienda pesan 500–750 KB cada una
Las 30 capturas de `store/` suman ~17 de los 21,8 MB del repo y ninguna baja de 300 KB. No se cargan en la app (no afectan al usuario), pero incumplen el listón de peso que pide la orden para la ficha de Play.
**Pendiente:** ver `PENDIENTES.md` (recomprimir antes de volver a subir a Play Console).

### M4. Contenido desigual entre idiomas en «Aquí no es como allá»
`en` tiene 6 tarjetas y los otros cinco idiomas tienen 7. La orden pide experiencias adaptadas, no idénticas, así que no es un error de traducción, pero deja al usuario inglés con una tarjeta menos.
**Pendiente:** decidir si se añade la séptima en inglés.

---

## 3. Gravedad baja

| # | Hallazgo | Estado |
|---|---|---|
| B1 | El diálogo de idioma (`#langPick`) no atrapa el foco ni se cierra con Escape | pendiente |
| B2 | `privacy.html` y las páginas nuevas no declaran icono → 404 de `/favicon.ico` | arreglado en `_t/`; queda `privacy.html` |
| B3 | El vídeo de portada se reproduce aunque el usuario pida `prefers-reduced-motion` | pendiente (Fase 5) |
| B4 | `pintarTabs()` modifica el paquete de idioma (`P.ui.tabs.escuelas = ...`) en vez de usar una copia | pendiente |
| B5 | `hasVoice()` devuelve `true` si el navegador aún no ha cargado voces: puede mostrar «Escuchar» sin voz real | pendiente |

---

## 4. Contenido: lo que se comprobó y lo que se corrigió

### 4.1 Error factual corregido
La tarjeta inglesa *«Under 18? You're a DJ»* decía:

> «…a junior permit doesn't let you drive in New York City at all.»

El manual (capítulo 1, *Regional Restrictions for a Junior Permit*) dice lo contrario para el **permiso**: en los cinco condados se puede conducir **de 5:00 a 21:00**, solo bajo supervisión inmediata de padre, tutor, persona *in loco parentis*, profesor de educación vial o instructor de autoescuela, y en un coche con **doble mando**; de 21:00 a 5:00 no se conduce. Lo que **no permite conducir nunca** en los cinco condados es la **licencia júnior** (tabla *Regional Restrictions for a Junior License*: «You must NOT drive» en ambas franjas).
**Arreglado:** la tarjeta ahora distingue permiso y licencia y da las horas correctas.

### 4.2 Cifras verificadas contra el capítulo asignado
Se extrajeron las 18 preguntas con cifras y se buscó cada número en el texto de su capítulo. Todas coinciden, por ejemplo:

| Pregunta | Cifra | Texto del manual |
|---|---|---|
| q22 | 100 pies para señalizar | cap. 5 «at least 100 feet (30 m) ahead» |
| q26 | 500 pies para el U-turn | cap. 5 |
| q30 | 200 pies para volver al carril | cap. 6 «within 200 feet (60 m)» |
| q31 | 100 pies antes de un paso a nivel | cap. 6 «within 100 feet (30 m) of a railroad crossing on a two-way roadway» |
| q35 | 20 pies del autobús escolar | cap. 6 «stop at least 20 feet (6 m) away» |
| q38–q42 | 15 / 30 / 20 / 50 pies y 1 pie del bordillo | cap. 7 |
| q47 | suspensión de 120 días | cap. 8 «120-day suspension for a first conviction» |
| q48–q49 | 55 mph y 25 mph en NYC | cap. 8 |
| q52–q53 | .08 % DWI, .05 % DWAI, .02 % menores de 21 | cap. 9 |
| q58–q59 | visibilidad 1.000 pies, luces bajas a 500/200 pies | cap. 10 |
| q64 | 15 pies de las vías | cap. 10 «at least 15 feet (5 m)» |

También se verificaron: 14/20 y 2/4 señales (cap. 1), las 50 horas con 15 nocturnas y el formulario MV-262 (cap. 1), el curso de 5 horas (cap. 1), el «move over» y las luces azules/verdes (cap. 5), las líneas dobles amarillas (cap. 4) y la multa de 250 $ del autobús escolar (cap. 6).

### 4.3 Enlaces oficiales
Las 10 URLs de `core.js.fuentes` responden **200** y su `<title>` corresponde al capítulo que dicen ser:

```
ch4..ch11, chS, chR -> 200 OK, títulos «Chapter N: … | NY DMV»
```

> Nota de método: en una primera pasada anoté un fallo en el enlace del capítulo 11. Era **un error de mi propio script de auditoría** (había escrito la URL a mano sin `-and-`). El enlace del repo es correcto. Se comprobó leyendo el valor real de `CORE.fuentes`, no una copia.

---

## 5. Usabilidad y rendimiento

- **360 px:** ninguna de las 10 vistas provoca scroll horizontal (`scrollWidth ≤ innerWidth`) en los 6 idiomas.
- **Peso de la app (sin `store/`):** 3,81 MB en 54 archivos. Imágenes `.webp` de 9,8 a 87,4 KB (todas por debajo de 300 KB). Vídeos de 168 a 442 KB.
- **Peso total del repo:** 21,8 MB, de los cuales ~17 MB son capturas de tienda.
- **Sin conexión:** el service worker sirve la app y, desde este commit, los 6 paquetes de idioma.
- **Accesibilidad:** botones de 44–48 px, `:focus-visible` visible, `aria-pressed` en chips y `aria-current` en pestañas, lectura en voz alta con la voz del sistema, modo oscuro por `prefers-color-scheme` y `prefers-reduced-motion` en las transiciones del coche.

---

## 6. Lo que estaba bien y no se tocó

- Las 73 preguntas de NY son coherentes en los 6 idiomas: mismo número, 4 opciones siempre, sin opciones duplicadas, sin huecos (comprobado por script).
- Ningún texto en inglés colado en `zh`, `ru`, `ko` ni `bn` (búsqueda por script de cadenas largas sin escritura nativa).
- Los 10 `fuentes` y los recursos (`img/`, `clips/`) referenciados existen todos.
- Consola limpia en los 6 idiomas y en las 10 pestañas, antes y después de los arreglos.

---

## 7. Opiniones de la competencia (1–2 estrellas)

Lo que más se repite en las reseñas malas de apps de examen del DMV en Google Play, y cómo lo trata esta app:

| Queja habitual | Cómo queda en DriveReady |
|---|---|
| Anuncios que tapan la pregunta o saltan ventanas | Nunca hay anuncio dentro de una pregunta; el espacio es uno solo, fuera del examen |
| Muro de pago a mitad del estudio | 100 % gratis, sin cuentas ni compras |
| Preguntas desactualizadas o inventadas | Cada pregunta enlaza su capítulo oficial; lo que no se puede confirmar va a `PENDIENTES.md` |
| Traducciones automáticas incomprensibles | 6 paquetes escritos y adaptados, con guía cultural propio por idioma |
| No funciona sin internet | Service worker con precarga |

> Las reseñas concretas no se citan aquí porque no se ha podido verificar su texto exacto; las categorías salen de la orden y del patrón conocido del mercado.

---

## 8. Pendientes que salen de esta auditoría

Ver `PENDIENTES.md` (se mantiene al día con cada fase).
---

## 9. Estado al cerrar la entrega

| # | Hallazgo | Estado |
|---|---|---|
| A1 | No existía suite de pruebas | ✅ Resuelto: `_t/test.html` con 99 comprobaciones |
| A2 | Selector de estado muerto | ✅ Resuelto: registro de estados real y `?state=` |
| A3 | Aviso de gobierno solo en el pie | ✅ Resuelto: barra fija visible, por estado y con enlaces `.gov` |
| M1 | `sw.js` sin precachear idiomas | ✅ Resuelto: `alv-v9`, 43 archivos, verificado sin conexión |
| M2 | 20 fijo en el resultado | ✅ Resuelto: usa el número real y el formato del estado |
| M3 | Capturas de tienda pesadas | ✅ Resuelto: cuantizadas a PNG de 256 colores, 17,4 MB → 5,8 MB; la mayor queda en 239 KB |
| M4 | Tarjetas culturales desiguales | ✅ Resuelto: inglés tiene ya las 7 tarjetas |
| B1 | Sin trampa de foco en el diálogo de idioma | ✅ Resuelto: foco atrapado, Escape cierra y devuelve el foco |
| B2 | Favicon 404 en `privacy.html` | ✅ Resuelto |
| B3 | Vídeo de portada sin `prefers-reduced-motion` | ✅ Resuelto |
| B4 | `pintarTabs()` mutaba el paquete de idioma | ✅ Resuelto: usa una copia |
| B5 | `hasVoice()` con lista vacía | ✅ Resuelto: devuelve `false` hasta que haya voz, y se repinta cuando llega |

También se corrigió, ya fuera de la auditoría inicial, un error de contenido en el inicio: los textos compartidos decían «Nueva York» y «20 preguntas» también en New Jersey. Ahora se generan con el estado y el formato reales.
---

## 10. Orden maestra — Fase 1 (QA a fondo)

| Comprobación | Resultado |
|---|---|
| Consola, 6 idiomas × 3 estados × 3 anchos × claro/oscuro | 0 errores |
| Desbordes horizontales a 360, 768 y 1280 px | 0 |
| Imágenes rotas | 0 |
| Enlaces oficiales (core de NY, NJ y PA + registro + FMCSA + ELDT + médico) | **37 de 37 responden** |
| Controles de menos de 44 px | Encontrados y corregidos: `#langBtn` 39 px, `.chip` 41 px, contadores del road test 40 px y `.linkbtn` 28 px. Hay prueba nueva |
| Foco de teclado | `:focus-visible` con anillo visible; sin `tabindex` positivos |
| Lectura en voz alta | Usa la voz del sistema por idioma; en el navegador sin voces el botón no se muestra (corregido antes) |

Pruebas: **158/158** (se añadieron «todos los controles ≥44 px» y «idioma y estado no se mezclan»).