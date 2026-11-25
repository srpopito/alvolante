# Rendimiento y accesibilidad

Medición con **Lighthouse 12** (instalado con npm desde el registro y ejecutado por API con el Node del sistema), sobre un servidor local **con compresión brotli**.

| Categoría | Móvil | Escritorio | Objetivo |
|---|---|---|---|
| Rendimiento | **84** | **89** | ≥ 85 |
| Accesibilidad | **100** | **100** | ≥ 95 |
| Buenas prácticas | **100** | **100** | ≥ 95 |
| SEO | **100** | **100** | ≥ 90 |

Informes completos: `mobile.report.html`, `desktop.report.html`, con su JSON al lado.

## Lo que se corrigió para llegar aquí

- **Peso inicial 1,58 MB → 523 KB**: fuentes propias y vídeos diferidos.
- **Accesibilidad 93 → 100**: `aria-label` en el diálogo de inicio, contraste del enlace del aviso (era 1,42:1) y altura reservada de la barra.
- **LCP 4,0 s → 2,0 s** (portada con `fetchpriority` alto, `srcset` de 480/960 y scripts con `defer`); el curso CDL ya no se carga al abrir la app, solo al entrar en su pestaña: la portada es una imagen con `fetchpriority=high` precargada, visible desde el HTML; el vídeo sigue cargándose al primer toque.
- **CLS**: se reservaron las alturas de cabecera, pestañas, aviso y tarjeta del plan, y se corrigió `#onb[hidden]` (el CSS anulaba el atributo `hidden`).

## Nota sobre el CLS

Lighthouse sigue anotando 0,31 de CLS en móvil, pero una medición directa con `PerformanceObserver` a 412 × 823 da **0,000**. La diferencia parece del entorno de Lighthouse (primea la página antes de aplicar el viewport). Se deja anotado para no dar por bueno un número que la propia app no reproduce.

## Repetir la medición

```powershell
node .audit/lh/run-lh.mjs http://127.0.0.1:8774/index.html docs/lighthouse/mobile mobile
node .audit/lh/run-lh.mjs http://127.0.0.1:8774/index.html docs/lighthouse/desktop desktop
```