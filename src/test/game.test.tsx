import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameScreen } from '../components/GameScreen';
import { initialProgress, recordAnswer, progressStore, STORAGE_KEY, validateProgress } from '../game/progressStore';
import { riasecItems } from '../game/config';
const id = riasecItems[0].id;
function question() { progressStore.save({ ...initialProgress(), scene: 'riasec_realista_01' }); return render(<GameScreen/>); }
describe('flujo y respuestas', () => {
 it('reinicia desde el cierre, persiste el inicio y permite responder otra vez', () => {
 let time = 1000; vi.spyOn(performance, 'now').mockImplementation(() => time);
 localStorage.setItem('other-app', 'keep');
 progressStore.save(recordAnswer(initialProgress(), id, 5));
 const view = render(<GameScreen/>);
 fireEvent.click(screen.getByRole('button', { name: 'Volver a empezar' }));
 expect(progressStore.load()).toEqual(initialProgress());
 expect(localStorage.getItem('other-app')).toBe('keep');
 expect(screen.getByText('Rumbo a la Tierra')).toHaveFocus();
 view.unmount(); render(<GameScreen/>);
 expect(screen.getByText('Rumbo a la Tierra')).toBeVisible();
 for (const name of ['Continuar', 'Aterrizar', 'Buscar ayuda', 'Continuar', 'Ver actividad']) {
 time += 400; fireEvent.click(screen.getByRole('button', { name }));
 }
 expect(screen.getAllByRole('radio').every(radio => !(radio as HTMLInputElement).checked)).toBe(true);
 fireEvent.click(screen.getAllByRole('radio')[0]);
 fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
 expect(progressStore.load().answers[id].value).toBe(1);
 });
 it('navega todo el guion y bloquea doble pulsación', () => {
 let time = 1000; vi.spyOn(performance, 'now').mockImplementation(() => time);
 render(<GameScreen/>);
 fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
 expect(screen.getByText('Fallo en los motores')).toBeVisible();
 fireEvent.click(screen.getByRole('button', { name: 'Aterrizar' }));
 expect(screen.queryByText('Un mundo desconocido')).not.toBeInTheDocument();
 time += 400; fireEvent.click(screen.getByRole('button', { name: 'Aterrizar' }));
 expect(screen.getByText('Un mundo desconocido')).toHaveFocus();
 time += 400; fireEvent.click(screen.getByRole('button', { name: 'Buscar ayuda' }));
 expect(screen.getByText('Mecánico')).toBeVisible();
 time += 400; fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
 expect(screen.getByText(/¡Eso mismo nos ocurrió!/)).toBeVisible();
 time += 400; fireEvent.click(screen.getByRole('button', { name: 'Ver actividad' }));
 expect(screen.getAllByRole('radio')).toHaveLength(5);
 });
 it('permite las cinco opciones y cambiar antes de confirmar; persiste una sola', async () => {
 const user = userEvent.setup(); const view = question();
 expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
 for (const radio of screen.getAllByRole('radio')) { await user.click(radio); expect(radio).toBeChecked(); expect(progressStore.load().answers).toEqual({}); }
 await user.click(screen.getAllByRole('radio')[1]);
 await user.click(screen.getByRole('button', { name: 'Continuar' }));
 expect(progressStore.load().answers[id].value).toBe(2);
 expect(Object.keys(progressStore.load().answers)).toHaveLength(1);
 view.unmount(); render(<GameScreen/>);
 expect(screen.getByText('Respuesta registrada')).toBeVisible();
 });
 it('ayuda neutral, retorno de foco y omisión sin puntuación', async () => {
 const user = userEvent.setup(); question();
 const help = screen.getByRole('button', { name: 'No entiendo la actividad' });
 await user.click(help);
 expect(screen.getByRole('dialog')).toHaveTextContent(riasecItems[0].explanation);
 expect(progressStore.load().answers).toEqual({});
 await user.click(screen.getByRole('button', { name: 'Volver a responder' }));
 expect(help).toHaveFocus();
 await user.click(screen.getByRole('button', { name: /Aún no entiendo/ }));
 expect(progressStore.load().answers[id]).toMatchObject({ value: null, status: 'unanswered_not_understood' });
 });
 it('responde con teclado', async () => {
 const user = userEvent.setup(); question();
 screen.getAllByRole('radio')[0].focus(); await user.keyboard('[Space][ArrowRight]');
 expect(screen.getAllByRole('radio')[1]).toBeChecked();
 });
 it('conserva diálogo al recargar', () => {
 progressStore.save({ ...initialProgress(), scene: 'workshop_dialogue', dialogueIndex: 1 });
 render(<GameScreen/>); expect(screen.getByText(/¡Eso mismo nos ocurrió!/)).toBeVisible();
 });
 it('recupera datos corruptos sin romper la aplicación', () => {
 localStorage.setItem(STORAGE_KEY, 'invalid'); render(<GameScreen/>);
 expect(screen.getByRole('alert')).toHaveTextContent('No pudimos recuperar');
 expect(screen.getByText('Rumbo a la Tierra')).toBeVisible();
 });
 it('informa fallo de almacenamiento y permite reintentar', () => {
 question(); const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
 fireEvent.click(screen.getAllByRole('radio')[0]); fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
 expect(screen.getByRole('alert')).toHaveTextContent('solo está en esta sesión');
 save.mockRestore(); fireEvent.click(screen.getByRole('button', { name: 'Reintentar guardado' }));
 expect(progressStore.load().answers[id].value).toBe(1);
 });
 it('muestra alternativa cuando falta una imagen', () => {
 question(); fireEvent.error(screen.getByRole('img'));
 expect(screen.getByRole('status')).toHaveTextContent('workshop-tablet.webp');
 expect(screen.getAllByRole('radio')).toHaveLength(5);
 });
 it('activa reducción manual y respeta la preferencia del sistema', () => {
 vi.mocked(window.matchMedia).mockImplementation(query => ({ matches: query.includes('reduced-motion'), media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }));
 render(<GameScreen/>); fireEvent.click(screen.getByRole('button', { name: 'Reducir animaciones' }));
 expect(screen.getByRole('main')).toHaveClass('reduce-motion');
 });
});
describe('repositorio', () => {
 it('es idempotente sin sobrescribir respuestas confirmadas', () => {
 const first = recordAnswer(initialProgress(), id, 3); const repeated = recordAnswer(first, id, 5);
 expect(repeated.answers).toEqual(first.answers); expect(repeated.answers[id].value).toBe(3);
 });
 it('rechaza progreso y puntuaciones inconsistentes', () => {
 expect(() => validateProgress({ ...initialProgress(), scene: 'first_answer_completed' })).toThrow();
 const invalid = recordAnswer(initialProgress(), id, null); invalid.answers[id].value = 1;
 expect(() => validateProgress(invalid)).toThrow();
 });
});

