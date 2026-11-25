# Krake Mentor · Prototipo del nivel 1

Experiencia narrativa local en español: viaje, señal desconocida, aterrizaje, dos diálogos del taller y primera valoración RIASEC. No incluye las cinco actividades siguientes, resultados, autenticación ni servicios externos.

## Ejecutar

Requiere Node.js 22 o posterior y npm.

```sh
npm install
npm run dev
```

Abrir la URL que imprime Vite (normalmente http://127.0.0.1:5173). Si ese puerto está ocupado, Vite asigna otro. Para reproducir exactamente las dependencias instaladas, usar `npm ci` con el lockfile.

```sh
npm test
npm run build
npm run preview
```

El build genera `dist/`. Las imágenes y fuentes se sirven desde el proyecto; una vez instaladas las dependencias, la aplicación no necesita APIs ni conexión externa para funcionar.

## Estructura

- `src/components/GameScreen.tsx`: pantalla, cabecera, fondos, diálogo reutilizable, escala nativa de radios, ayuda accesible Radix y cierre neutral.
- `src/game/config.ts`: escenas declarativas, diálogos, acciones, escala y banco provisional `riasecItems`.
- `src/game/useGame.ts`: navegación, diálogo activo, protección contra doble pulsación y confirmación.
- `src/game/progressStore.ts`: contrato intercambiable `ProgressRepository`, validación, guardado local y registro idempotente.
- `src/styles.css`: tokens, interfaz vertical, fondos, estados y movimiento reducido.
- `src/test/`: pruebas de componentes y persistencia.
- `public/assets/`: copias sin modificación de los fondos aprobados. Las cinco imágenes originales se conservan en la raíz. `ui-reference.png` es solo referencia, nunca una interfaz incrustada.

Dependencias: React 19, TypeScript, Vite 6, Tailwind CSS 4, Motion for React, Lucide, Radix Dialog (primitiva accesible utilizada también por shadcn/ui) y fuentes locales Inter/Rajdhani mediante Fontsource. Pruebas: Vitest, Testing Library, user-event y jsdom. Se usa CSS propio para la interfaz; no se añade un generador shadcn innecesario.

## Comportamiento y guardado

La selección vive únicamente en el componente hasta pulsar Continuar. La respuesta confirmada y la escena se guardan juntas bajo `krake-mentor:prototype:v1` en localStorage. La clave del ítem evita duplicados. Las respuestas confirmadas no se sobrescriben. Una omisión tras la explicación usa `value: null` y `status: unanswered_not_understood`; nunca una valoración 1. No se calcula ningún perfil.

El diálogo de ayuda retiene el foco y lo devuelve al control de apertura. Los radios admiten Tab, Espacio y flechas. Cada transición enfoca el título de escena. Las animaciones se reducen por `prefers-reduced-motion` o mediante el botón de la cabecera. No hay audio ni esperas automáticas. La navegación bloquea pulsaciones repetidas durante 300 ms sin esperar a las animaciones.

Los fallos de imágenes muestran una alternativa simple con aviso del archivo faltante. Los fallos de guardado mantienen el avance en memoria, muestran una advertencia y permiten reintentar. Los datos corruptos no se utilizan. El almacenamiento es provisional, local a este navegador y no contiene datos personales; borrar datos del sitio elimina el progreso. Para repetir la demo, pulsar «Volver a empezar» en la pantalla final. Reinicia el recorrido y borra la respuesta de este prototipo, sin afectar otros datos del navegador.

Para cambiar a una API, implementar `ProgressRepository` y adaptar su carga/guardado a operaciones asíncronas en `useGame`; los componentes visuales no necesitan conocer el almacenamiento.

## Añadir la siguiente pregunta en una entrega posterior

1. Añadir el ítem revisado a `riasecItems`, con identificador único, dimensión, ronda, texto y explicación.
2. Añadir su escena y `questionId` a `sceneConfig` y al tipo `SceneId`.
3. Encadenar las escenas con `next`; el registro de la respuesta usa ese destino declarativo.
4. Definir `ordinal` y `total` del nuevo ítem, conservando el significado de la escala.
5. Ampliar las pruebas y versionar/migrar el progreso si cambia el contrato.

No es necesario rehacer los diálogos, la escala, la ayuda ni el repositorio. Un futuro motor 2D puede consumir el estado y los eventos del módulo de juego, sin incorporar su lógica a los componentes RIASEC.

## Recursos y límites

Se revisaron los cinco PNG proporcionados. No se adjuntó otro documento funcional independiente del prompt. Las dos primeras escenas utilizan los fondos proporcionados `espacio1.png` y `espaciopeligro.png`, respectivamente; la composición CSS se conserva como alternativa si falla una imagen. Se mantienen los personajes integrados en los fondos; no se fabrican retratos a partir de recortes. La pregunta y el banco definitivo requieren revisión y validación antes de uso formal. El indicador de seis actividades describe el nivel previsto; esta entrega incluye solo la primera.

En móvil, la ilustración cede espacio para que el diálogo o la actividad quepan en el alto visible. Las cinco valoraciones se muestran en una fila. En teléfonos en horizontal, la ficha de actividad se sitúa a la derecha del escenario. En escritorio el contenedor mide como máximo 460 px.

## Fondos animados

Cada escenario combina una ilustración y un MP4 local en `src/game/config.ts`. El juego muestra la ilustración hasta que empieza el video. Con movimiento reducido utiliza la imagen fija. Los turnos del taller comparten la reproducción y el encuadre sigue al personaje que habla.

Al abrir la actividad, la escena pasa al explorador respondiendo en la tablet de Krake. Los cinco bucles silenciosos están en `public/assets/motion/`. Se pueden ajustar y volver a renderizar desde las ilustraciones originales con los scripts de `tools/motion/`. Python, NumPy, Pillow, OpenCV y FFmpeg se usan durante la edición de los clips. Para jugar basta con ejecutar el proyecto web.



