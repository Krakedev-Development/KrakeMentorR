# Validación ejecutada · 19 de noviembre de 2026

- `npm test`: 11 pruebas aprobadas. Recorrido completo y doble pulsación, selección 1–5 y cambio previo a confirmar, idempotencia, recarga de diálogo y cierre, explicación neutral y omisión null, foco del modal, selección por teclado, datos corruptos, fallo de guardado y reintento, imagen ausente y movimiento reducido.
- `npm run build`: TypeScript y build de producción correctos.
- Navegador integrado, servidor Vite local: recorrido desde viaje hasta cierre; imágenes originales cargadas; ayuda abierta y cerrada; cambio de respuesta con flecha derecha; confirmación y recarga con cierre conservado.
- Móvil 390 × 844: inspección visual del aterrizaje y pregunta. Capturas JPEG completas en `docs/screenshots/`.
- Móvil 320 × 568: opciones en filas de 48 px; ancho de documento y ancho disponible coinciden (305 px, excluida barra de desplazamiento); sin desbordamiento horizontal.
- Escritorio 1280 × 1000: contenedor de 460 px centrado; teclado y mouse funcionales.
- Consola del navegador tras el recorrido: sin entradas de error o advertencia.

La primera revisión visual detectó que un alto mínimo del fondo recortaba personajes en móvil. Se eliminó para mantener la proporción y el ancho completo del arte original.

Las comprobaciones de almacenamiento fallido, imagen ausente y preferencia del sistema se ejecutaron en jsdom. No se probó en un teléfono físico ni con un lector de pantalla real. La emulación de tamaño valida distribución; no sustituye esas comprobaciones. Motion informa en las pruebas que el movimiento reducido está habilitado; es un mensaje esperado de desarrollo.
