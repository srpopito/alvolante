# Cómo publicar DriveReady

Guía para Cristian y Claude. Nada de esto se ha ejecutado: la rama `minke-update` está lista y publicada como web de prueba, `main` sigue intacta.

## 1. Revisar y aprobar (Claude)

1. Abrir el PR: https://github.com/srpopito/alvolante/compare/main...minke-update
2. Revisar el diff y leer `INFORME_MINKE.md`, `PLAY_CHECKLIST.md`, `PENDIENTES.md` y `DUDAS.md`.
3. Probar la web publicada desde la rama: https://srpopito.github.io/alvolante/ (6 estados, 6 idiomas).
4. Comprobar las pruebas: `_t/test.html` debe dar **212/212**.
5. Ejecutar `node _t/validate.mjs .` → **0 errores**. También corre solo en GitHub Actions.

## 2. Publicar la web (GitHub Pages)

**Opción A (la que está activa ahora):** Pages publica desde `minke-update`. La web ya muestra la versión nueva.

**Opción B (recomendada al integrar):**
1. Merge del PR a `main` (lo hace Cristian o Claude, nunca automático).
2. Settings → Pages → Source: rama `main` / root.
3. Esperar el deploy y comprobar que la web carga el selector con los seis estados.

### Comprobar que quedó bien

- Abrir https://srpopito.github.io/alvolante/?lang=es y ver el selector con NY, NJ, PA, CT, MA y FL.
- Entrar en CDL y ver «Seguir mi plan» (no «undefined»).
- Si sale la versión vieja: Ctrl + F5; el service worker actual es `alv-v26`.

## 3. Publicar en Google Play (TWA)

El paquete es `com.srpopito.driveready` y el AAB está en `DriveReady_android/DriveReady.aab`. **El AAB no se toca sin pedir permiso**: incluye la firma.

1. **Dominio y assetlinks**: el TWA carga la web publicada. El archivo `DriveReady_android/assetlinks.json` tiene que estar en `https://<dominio>/.well-known/assetlinks.json` (raíz del dominio, no dentro de `/alvolante/`).
   - Verificar con: https://developers.google.com/digital-asset-links/tools/generator
2. **Si el dominio no cambia**, no hace falta recompilar: la TWA abre la web en vivo y ya muestra la versión nueva.
3. **Si hay que recompilar**, usar PWABuilder con la URL publicada y volver a firmar con el keystore existente (no crear uno nuevo).
4. En Play Console:
   - Subir el AAB (nueva versión, mismo paquete).
   - **Capturas**: `store/nuevas/` (54 imágenes, 9 por idioma, 1080×1920).
   - **Ficha**: `store/ficha_google_play.md` (6 idiomas).
   - **Data safety**: sin cuentas, sin ubicación, todo en el teléfono.
   - **Anuncios**: `adsenseClient` está vacío, así que «sin anuncios». Los patrocinios propios van marcados «Patrocinado».
   - **Privacidad**: `privacy.html` describe exactamente eso.

## 4. Antes de dar el botón

- [ ] `_t/test.html` en 212/212.
- [ ] La web publicada muestra los 6 estados.
- [ ] `assetlinks.json` responde en la raíz del dominio del TWA.
- [ ] Capturas de `store/nuevas/` subidas.
- [ ] Fotos de `img/` con licencia confirmada (`img/CREDITS.md`).
- [ ] Lighthouse móvil aceptado (84) o subido a 85.

## 5. Revertir

- Web: Settings → Pages → `main` (vuelve a la versión anterior al instante).
- Rama: `git push origin --delete minke-update` solo si se descarta; `main` nunca se toca sin revisión.

## 6. Lo que no se debe tocar

- `DriveReady_android/signing.keystore` y `signing-key-info.txt`.
- La carpeta `AlVolanteNY_verificacion`.
- `Desktop\API KEYS.txt` y cualquier `.env`.
- El Python de ComfyUI, PyTorch, CUDA y sus custom nodes.