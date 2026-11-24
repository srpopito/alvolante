# Rendimiento y accesibilidad

Medición del 24 de noviembre de 2026 sobre `index.html?state=ny&lang=es` (Chrome headless, 390 × 844, sin caché).

## Lo medido

| Métrica | Resultado | Objetivo |
|---|---|---|
| Peso de la carga inicial | **523 KB** | menos de 1,5 MB ✅ |
| Errores de consola | **0** | 0 ✅ |
| Imágenes sin `alt` | **0** | 0 ✅ |
| Contraste del texto | **15,4:1** | AA 4,5:1 ✅ |
| Contraste del texto atenuado | **7,25:1** | AA 4,5:1 ✅ |
| `lang` en `<html>` | **es** (cambia con el idioma) | dinámico ✅ |
| Un solo `h1` | **1** | 1 ✅ |
| Nodos del DOM | **1 186** | menos de 1 500 ✅ |
| Fuentes | **propias, 5 archivos, 109 KB** | sin terceros ✅ |
| Vídeos | portada al primer toque; cultura al hacer clic | diferidos ✅ |

El peso bajó de **1,58 MB a 523 KB** al pasar las fuentes a locales y diferir los tres vídeos que se descargaban en la portada.

## Lighthouse

**No se pudo ejecutar**: este equipo no tiene `npm` ni `lighthouse` instalados. No he inventado las notas.

Comando exacto para Cristian (con Chrome ya presente):

```powershell
npm i -g lighthouse
lighthouse http://127.0.0.1:8765/index.html?state=ny&lang=en --only-categories=performance,accessibility,best-practices,seo --preset=desktop --output=html --output-path=docs/lighthouse/lighthouse.html --chrome-flags="--headless=new"
```

Con `--preset=desktop` y, aparte, sin él para móvil. Las capturas van a `docs/lighthouse/`.

## Service worker

- Versión **`alv-v17`**.
- Comprobado: sin conexión, tras recargar, la app abre y carga el kit del día (62 archivos en caché la versión anterior; con las fuentes son 67).
- Se actualiza sola al publicar (`skipWaiting` + `clients.claim`).