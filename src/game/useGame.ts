import { useRef, useState } from 'react';
import { sceneConfig } from './config';
import { initialProgress, progressStore, recordAnswer, type Progress, type ProgressRepository, type Rating } from './progressStore';
export function useGame(repository: ProgressRepository = progressStore) {
 const [loaded] = useState(() => { try { return { progress: repository.load(), error: '' }; } catch { return { progress: initialProgress(), error: 'No pudimos recuperar el progreso. Puedes comenzar de nuevo; el guardado se intentará al avanzar.' }; } });
 const [progress, setProgress] = useState(loaded.progress);
 const [error, setError] = useState(loaded.error);
 const current = useRef(progress);
 const lastAction = useRef(-Infinity);
 const commit = (next: Progress) => { try { repository.save(next); setError(''); } catch { setError('El progreso solo está en esta sesión. El navegador no permitió guardarlo.'); } current.current = next; setProgress(next); };
 const advance = () => {
 const now = performance.now(); if (now - lastAction.current < 300) return; lastAction.current = now;
 const p = current.current; const scene = sceneConfig[p.scene];
 if (p.dialogueIndex + 1 < scene.dialogues.length) commit({ ...p, dialogueIndex: p.dialogueIndex + 1 });
 else if (scene.next) commit({ ...p, scene: scene.next, dialogueIndex: 0 });
 };
 const confirm = (id: string, value: Rating | null) => { const p = current.current; if (sceneConfig[p.scene].questionId === id) commit(recordAnswer(p, id, value)); };
 const restart = () => { lastAction.current = -Infinity; commit(initialProgress()); };
 return { progress, error, advance, confirm, restart, retrySave: () => commit(current.current) };
}
