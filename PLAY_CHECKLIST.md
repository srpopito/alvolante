# PLAY_CHECKLIST — revisión de Google Play

Motivo del rechazo anterior: **Misleading Claims** (información de gobierno sin fuentes). Esto es lo que hay comprobado, con su evidencia.

## 1. Aviso y fuentes

- [x] Aviso visible en el inicio de la app: «No es una app del gobierno. DriveReady es independiente y no está afiliada, avalada ni representa al DMV…». Prueba: `CDL notice is visible` y el aviso del inicio en las 18 combinaciones de estado e idioma.
- [x] Enlace al manual oficial en cada estado: NY (MV-21 y capítulos), NJ (MVC), PA (PUB 95), y el manual CDL.
- [x] En la ficha de la tienda, en los 6 idiomas: «…no está afiliada al DMV, al MVC ni a ninguna agencia del gobierno. Es material de estudio: los manuales oficiales siempre mandan.» (4 apariciones verificadas en `store/ficha_google_play.md`).

## 2. Nada que parezca oficial

- [x] Sin sellos, escudos ni logos del DMV ni del estado. Los iconos son `icons/icon-192.png`, `icon-512.png` y `icon-maskable-512.png`, propios.
- [x] La palabra «oficial» solo describe **los manuales**, nunca la app. Comprobado: las 13 apariciones en la ficha son «manual oficial», «página oficial» o «fuentes oficiales».
- [x] Paleta propia (verde #0b6e4f, dorado #f5b301) y tipografía propia; no se copian colores ni tipos del DMV.
- [x] El nombre es DriveReady, sin banderas ni sellos estatales.

## 3. Las preguntas no dicen ser las del examen real

- [x] El texto del simulacro ya no compara con el examen real. NY: «Simulacro: 20 preguntas, 14 correctas para aprobar…». NJ: «El examen de Nueva Jersey tiene 50 preguntas…». PA: «El examen de Pensilvania tiene 18 preguntas…».
- [x] Pruebas nuevas: `NJ exam intro does not compare with the real test` y `PA exam intro does not compare with the real exam`.
- [x] Todas las preguntas son originales, escritas desde el manual; la ficha lo dice: «preguntas de práctica basadas en el manual oficial».

## 4. Descripción de la tienda honesta

- [x] Sin «el #1», «garantizado aprobar» ni «100 % de aprobados» (búsqueda en la ficha: 0 resultados).
- [x] Solo funciones que existen: simulacro, práctica por capítulo, señales, road test, CDL, autoescuelas y 6 idiomas.
- [x] Sin nombres de otras apps ni palabras clave de relleno.

## 5. Coherencia con las declaraciones

- [x] **Data safety:** la app no pide registro, nombre, correo ni ubicación. Todo el progreso queda en `localStorage`. No hay `fetch()` en `app.js` (0 llamadas) ni envío de datos.
- [x] **Anuncios:** `adsenseClient` está vacío y `showAdDemo` es `false`, así que no se carga ningún anuncio (`pagead2` solo se inserta si hay cliente). Los patrocinios propios van marcados «Patrocinado».
- [x] **Privacidad:** `privacy.html` describe exactamente eso (sin registro, datos solo en el teléfono).
- [ ] **Fuentes externas:** `index.html` carga Google Fonts. No recoge datos personales, pero es una petición a un tercero; se pasa a tipografía propia en la fase 7.

## 6. Capturas para la tienda

- [x] **36 capturas** en `store/nuevas/`: 6 por idioma (en, es, zh, ru, ko, bn) a **1080 × 1920**, todas de la app real.
- [x] Incluyen NJ (inicio en Nueva Jersey) y la sección CDL, además de inicio, simulacro, road test y autoescuelas.
- [x] Sin pantallas inventadas y sin texto superpuesto, para no prometer nada que la app no haga.
- [ ] No se han subido a Play; eso lo hace Cristian.

## 7. TWA

- [ ] `/.well-known/assetlinks.json` está en el repo aparte y no se toca. **No se pudo comprobar que responde** porque no hay dominio configurado en el repositorio. Queda en `PENDIENTES.md`.

## Pendiente antes de publicar

1. Decidir las declaraciones de Data safety y Ads con lo de arriba.
2. Comprobar `assetlinks.json` en el dominio real.
3. Subir las capturas de `store/nuevas/`.