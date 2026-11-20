import { riasecItems, sceneConfig, type SceneId } from './config';
export type Rating = 1 | 2 | 3 | 4 | 5;
export type RiasecAnswer = { questionId: string; round: number; dimension: 'R' | 'I' | 'A' | 'S' | 'E' | 'C'; value: Rating | null; status: 'answered' | 'unanswered_not_understood'; answeredAt: string };
export type Progress = { version: 1; scene: SceneId; dialogueIndex: number; answers: Record<string, RiasecAnswer> };
export const STORAGE_KEY = 'krake-mentor:prototype:v1';
export const initialProgress = (): Progress => ({ version: 1, scene: 'space_travel', dialogueIndex: 0, answers: {} });
export interface ProgressRepository { load(): Progress; save(progress: Progress): void }
export function validateProgress(data: unknown): Progress {
 if (!data || typeof data !== 'object') throw new Error('Formato inválido');
 const p = data as Progress;
 if (p.version !== 1 || !Object.hasOwn(sceneConfig, p.scene) || !Number.isInteger(p.dialogueIndex) || p.dialogueIndex < 0 || p.dialogueIndex > Math.max(0, sceneConfig[p.scene].dialogues.length - 1) || !p.answers || typeof p.answers !== 'object' || Array.isArray(p.answers)) throw new Error('Progreso inválido');
 for (const [id, a] of Object.entries(p.answers)) {
 const item = riasecItems.find(i => i.id === id);
 if (!item || !a || a.questionId !== id || a.round !== item.round || a.dimension !== item.dimension || !Number.isFinite(Date.parse(a.answeredAt)) || !(a.status === 'answered' ? Number.isInteger(a.value) && Number(a.value) >= 1 && Number(a.value) <= 5 : a.status === 'unanswered_not_understood' && a.value === null)) throw new Error('Respuesta inválida');
 }
 if (p.scene === 'first_answer_completed' && !p.answers[riasecItems[0].id]) throw new Error('Falta respuesta');
 return p;
}
export const progressStore: ProgressRepository = {
 load() { const raw = localStorage.getItem(STORAGE_KEY); return raw ? validateProgress(JSON.parse(raw)) : initialProgress(); },
 save(progress) { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); },
};
// Idempotent upsert: a confirmed response is never silently overwritten.
export function recordAnswer(progress: Progress, questionId: string, value: Rating | null): Progress {
 const item = riasecItems.find(i => i.id === questionId);
 if (!item || (value !== null && (![1,2,3,4,5].includes(value)))) return progress;
 const answer: RiasecAnswer = { questionId, round: item.round, dimension: item.dimension, value, status: value === null ? 'unanswered_not_understood' : 'answered', answeredAt: new Date().toISOString() };
 return { ...progress, scene: sceneConfig[progress.scene].next && sceneConfig[progress.scene].questionId ? sceneConfig[progress.scene].next! : 'first_answer_completed', dialogueIndex: 0, answers: { ...progress.answers, [questionId]: progress.answers[questionId] ?? answer } };
}

