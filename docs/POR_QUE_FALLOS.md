# Por qué se generaron tantos errores y cómo se evitan

Análisis honesto de los fallos de esta sesión, sacado de lo que pasó de verdad, no de suposiciones.

## Los fallos

1. **Dos esquemas de pregunta.** NY, NJ y PA guardan `[pregunta, opciones, explicación]` y la respuesta correcta en `core.rules[i].a`. CT, MA y FL se escribieron con `[pregunta, opciones, índice, explicación]`. La app lee siempre `rules.a`, así que en esos tres estados **la respuesta marcada era la del índice de turno y la explicación mostraba un número**. Lo destapó el validador, no una prueba manual.
2. **Claves de idioma incompletas.** `resume`, `change` y `tapPart` se usaron en la interfaz antes de existir en los paquetes: salió un botón «undefined» y frases en inglés dentro del español.
3. **Suposiciones al añadir un estado.** Al registrar CT la app reventó porque `C.signs` no era array, `P.man` no era objeto y `fuentes.R` no existía. Eran contratos no escritos.
4. **Insignia fija.** El estado se pintaba con «NY» escrito a mano: NJ, PA, CT y MA salían con la insignia de Nueva York en las capturas.
5. **Contraste roto al arreglar otro.** Los enlaces del aviso quedaron casi blancos sobre fondo claro tras cambiar el color para Lighthouse.
6. **Duplicados.** Dos preguntas iguales en FL y en MA; nadie las buscaba.
7. **Enlaces muertos.** La página de autoescuelas de FL daba 404; `assetlinks` no se pudo verificar.
8. **Verificación tardía.** Casi todos los fallos visuales se vieron en capturas, no en pruebas.

## Por qué

- **No había contrato de datos.** El contenido se generó con scripts que mapeaban arrays; nadie comprobaba el formato contra el lector (`preparar`).
- **No había comprobación de i18n.** Cada función añadía claves y se confiaba en que estaban en los seis idiomas.
- **No había prueba de conformidad por estado.** Cada estado nuevo repetía los mismos tropiezos.
- **Las pruebas solo cubrían lo que se recordaba**; nada recorría los datos completos.
- **Sin integración continua.** Todo dependía de que alguien mirara.

## Lo que se ha hecho

1. **`_t/validate.mjs`**: valida los seis estados, sus seis idiomas, la interfaz, el curso CDL y los kits.
   - 3 campos por pregunta, 4 opciones, `rules.a` 0–3, explicación no vacía, sin duplicados.
   - `exam` coherente, capítulos existentes, `fuentes` por capítulo y `R`.
   - Señales: array y significado en los seis idiomas.
   - Claves de idioma iguales a inglés; curso CDL con las mismas respuestas; kits con los mismos estados e ítems.
   - **Resultado actual: 0 errores** (1 aviso: NY usa la plantilla genérica de introducción).
2. **CT, MA y FL normalizados** al esquema real de la app.
3. **Duplicados eliminados** (FL y MA).
4. **`fuentes.R` añadido** a NJ, PA, MA y FL: el enlace del road test ya no sale vacío.
5. **«80 percent» localizado** en los paquetes que lo tenían en inglés.
6. **GitHub Actions** (`.github/workflows/validate.yml`): el validador corre en cada push y en cada PR.

## Cómo se usa

```powershell
node _t/validate.mjs .
```

Si sale `ERRORS 0`, se puede commitear. Está en la lista de `PUBLICAR.md`.

## Lo que aún no está automatizado

- Errores visuales (contraste, recortes): se detectan con la matriz y las capturas, no con el validador.
- Texto en inglés dentro de otro idioma: solo hay revisiones manuales y búsquedas puntuales.
- Enlaces externos: se comprueban a mano; convendría un chequeo programado de URLs.