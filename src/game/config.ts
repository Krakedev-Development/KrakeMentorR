export const riasecItems = [{ id: 'RIASEC_R1_R_01', round: 1, ordinal: 1, total: 6, dimension: 'R' as const, dimensionLabel: 'Realista', text: '¿Cuánto te gustaría reparar las piezas de una máquina averiada para que vuelva a funcionar?', explanation: 'Reparar una máquina significa revisar sus componentes y ajustar o cambiar las piezas necesarias para que vuelva a funcionar' }];
export const ratings = ['No me gusta', 'Me gusta poco', 'Me es indiferente', 'Me gusta', 'Me encanta'];
export type SceneId = 'space_travel' | 'unknown_signal' | 'emergency_landing' | 'workshop_dialogue' | 'riasec_realista_01' | 'first_answer_completed';
export type Dialogue = { speaker: string; text: string; action: string; narrationId?: string };
export type SceneArtwork = { poster: string; video: string; description: string };
export type SceneDefinition = { title: string; location: string; artwork: SceneArtwork; dialogues: Dialogue[]; next?: SceneId; questionId?: string };
const travel: SceneArtwork = {
 poster: '/assets/espacio1.png',
 video: '/assets/motion/travel.mp4',
 description: 'Vista de la Tierra desde el espacio, enmarcada por la cabina de la nave.',
};
const alert: SceneArtwork = {
 poster: '/assets/espaciopeligro.png',
 video: '/assets/motion/alert.mp4',
 description: 'Cabina de la nave con iluminación roja de emergencia y un planeta al fondo.',
};
const landing: SceneArtwork = {
 poster: '/assets/scene-crash.png',
 video: '/assets/motion/landing.mp4',
 description: 'El explorador y Krake junto a su nave dañada; un pueblo se ve a lo lejos.',
};
const workshop: SceneArtwork = {
 poster: '/assets/scene-workshop.png',
 video: '/assets/motion/workshop.mp4',
 description: 'El explorador, Krake y el mecánico frente a una máquina averiada en el taller.',
};
export const sceneConfig: Record<SceneId, SceneDefinition> = {
 space_travel: { title: 'Rumbo a la Tierra', location: 'EN TRÁNSITO', artwork: travel, dialogues: [{ speaker: 'Krake Mentor', text: '¡Hola, explorador! Estamos por llegar a la Tierra, pero... ¿qué es esa señal?', action: 'Continuar' }], next: 'unknown_signal' },
 unknown_signal: { title: 'Fallo en los motores', location: 'ALERTA DE NAVEGACIÓN', artwork: alert, dialogues: [{ speaker: 'Krake Mentor', text: '¡Oh, no! ¡Los motores están fallando! ¡Prepárate para aterrizar!', action: 'Aterrizar' }], next: 'emergency_landing' },
 emergency_landing: { title: 'Un mundo desconocido', location: 'ATERRIZAJE DE EMERGENCIA', artwork: landing, dialogues: [{ speaker: 'Krake Mentor', text: '¡Uf! Eso estuvo cerca. Nuestra nave necesita un nuevo módulo de activación. ¡Vamos a buscar ayuda!', action: 'Buscar ayuda' }], next: 'workshop_dialogue' },
 workshop_dialogue: { title: 'El taller del pueblo', location: 'PRIMER CONTACTO', artwork: workshop, dialogues: [{ speaker: 'Mecánico', text: '¡Hola, viajeros! Parece que también tienen problemas. Una extraña señal ha dañado nuestras máquinas', action: 'Continuar' }, { speaker: 'Krake Mentor', text: '¡Eso mismo nos ocurrió! Veamos qué actividades están realizando aquí', action: 'Ver actividad' }], next: 'riasec_realista_01' },
 riasec_realista_01: { title: 'El taller del pueblo', location: 'EXPLORA TUS INTERESES', artwork: workshop, dialogues: [], questionId: riasecItems[0].id, next: 'first_answer_completed' },
 first_answer_completed: { title: 'El taller del pueblo', location: 'EXPLORACIÓN GUARDADA', artwork: workshop, dialogues: [] },
};


