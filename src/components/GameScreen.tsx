import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import * as Dialog from '@radix-ui/react-dialog';
import { Rocket, Radio, MapPin, Wrench, CircleHelp, Check, ShieldCheck, X, Sparkles, TriangleAlert, Orbit } from 'lucide-react';
import { sceneConfig, riasecItems, ratings, type Dialogue } from '../game/config';
import { useGame } from '../game/useGame';
import type { Rating } from '../game/progressStore';

function PrimaryGameButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
 return <button className="primary" onClick={onClick} disabled={disabled}>{children}</button>;
}
function CharacterLabel({ speaker }: { speaker: string }) { return <div className="character-label"><span className="character-icon">{speaker === 'Mecánico' ? <Wrench size={18}/> : <Radio size={18}/>}</span><span>{speaker}</span><span className="channel">COMUNICACIÓN</span></div>; }
function DialogueBox({ dialogue, advance }: { dialogue: Dialogue; advance: () => void }) {
 return <section className="panel dialogue"><CharacterLabel speaker={dialogue.speaker}/><p>{dialogue.text}</p><PrimaryGameButton onClick={advance}>{dialogue.action}</PrimaryGameButton></section>;
}
function SceneBackground({ background, title }: { background?: string; title: string }) {
 const [failed, setFailed] = useState(false);
 return <>{background && !failed ? <img className="scene-art" src={background} alt={title === 'Rumbo a la Tierra' ? 'Vista de la Tierra desde el espacio, enmarcada por la cabina de la nave.' : title === 'Señal desconocida' ? 'Cabina de la nave con iluminación roja de emergencia y un planeta al fondo.' : title === 'Un mundo desconocido' ? 'El explorador y Krake junto a su nave dañada; un pueblo se ve a lo lejos.' : 'El explorador, Krake y el mecánico frente a una máquina averiada en el taller.'} onError={() => setFailed(true)}/> : <div className="space-art" aria-hidden="true"><div className="planet"/><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="stars"/></div>}{failed && <p className="asset-warning" role="status">Ilustración no disponible: {background?.split('/').pop()}. Puedes continuar.</p>}</>;
}
function HelpDialog({ explanation, onExplained }: { explanation: string; onExplained: () => void }) {
 return <Dialog.Root onOpenChange={open => { if (open) onExplained(); }}><Dialog.Trigger asChild><button className="help"><CircleHelp size={18}/>No entiendo la actividad</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="modal panel"><Dialog.Title className="modal-title">Krake te explica</Dialog.Title><Dialog.Description>{explanation}</Dialog.Description><Dialog.Close asChild><button className="primary">Volver a responder</button></Dialog.Close><Dialog.Close asChild><button className="close" aria-label="Cerrar explicación"><X size={20}/></button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
function RiasecQuestion({ questionId, confirm }: { questionId: string; confirm: (id: string, value: Rating | null) => void }) {
 const item = riasecItems.find(i => i.id === questionId)!;
 const [selected, setSelected] = useState<Rating | null>(null);
 const [explained, setExplained] = useState(false);
 return <section className="panel question"><div className="question-meta"><span className="activity-icon"><Wrench size={19}/></span><span>Actividad {item.ordinal} de {item.total}</span></div><h2 id="question-label">{item.text}</h2><p className="instruction">Elige lo que sientes. No hay respuestas correctas o incorrectas.</p><fieldset className="rating-scale" aria-labelledby="question-label"><legend className="sr-only">Tu nivel de interés</legend>{ratings.map((label, index) => <label key={label} className={`rating ${selected === index + 1 ? 'selected' : ''}`}><input type="radio" name="interest" value={index + 1} checked={selected === index + 1} onChange={() => setSelected(index + 1 as Rating)}/><span className="rating-number">{index + 1}</span><span className="rating-text">{label}</span>{selected === index + 1 && <Check className="selection-check" size={13} aria-hidden="true"/>}</label>)}</fieldset><HelpDialog explanation={item.explanation} onExplained={() => setExplained(true)}/>{explained && <button className="skip" onClick={() => confirm(item.id, null)}>Aún no entiendo · Continuar sin valoración</button>}<PrimaryGameButton disabled={selected === null} onClick={() => { if (selected !== null) confirm(item.id, selected); }}>Continuar</PrimaryGameButton><p className="save-note"><ShieldCheck size={13}/>Tu respuesta se guarda al continuar</p></section>;
}
export function GameScreen() {
 const { progress, error, advance, confirm, restart, retrySave } = useGame();
 const [quiet, setQuiet] = useState(false);
 const reduced = useReducedMotion();
 const reduceMotion = quiet || !!reduced;
 const scene = sceneConfig[progress.scene];
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [progress.scene, progress.dialogueIndex]);
 const isSpace = progress.scene === 'space_travel' || progress.scene === 'unknown_signal';
 const isAlert = progress.scene === 'unknown_signal';
 const completed = progress.scene === 'first_answer_completed';
 return <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}><div className="desktop-brand"><img className="brand-logo" src="/assets/krake-mentor.png" alt="" width="48" height="48"/><span>KRAKE<span className="brand-light"> MENTOR</span></span></div><main className={`game-screen ${isSpace ? 'space-scene' : ''} ${reduceMotion ? 'reduce-motion' : ''}`}><SceneBackground key={scene.background ?? 'space'} background={scene.background} title={scene.title}/><div className="scene-shade"/><header className="game-header"><div className="level-badge"><Rocket size={23}/></div><div><span className="eyebrow">EXPLORACIÓN RIASEC</span><h1>Nivel 1</h1><p>El aterrizaje inesperado</p></div><button className="motion-toggle" aria-label="Reducir animaciones" aria-pressed={quiet} onClick={() => setQuiet(!quiet)} title="Reducir animaciones"><Sparkles size={18}/>{quiet && <Check size={11}/>}</button></header><div className="scene-heading"><div className="location"><MapPin size={12}/>{scene.location}</div><h2 tabIndex={-1} ref={heading}>{scene.title}</h2></div>{isSpace && <motion.div className={`flight-display ${isAlert ? 'alert' : ''}`} animate={!reduceMotion && isAlert ? { x: [0, -2, 2, 0] } : { x: 0 }} transition={{ duration: .3 }}><div className="flight-symbol">{isAlert ? <TriangleAlert size={48}/> : <Orbit size={64} strokeWidth={1}/>}</div><span className="eyebrow">{isAlert ? 'SEÑAL DESCONOCIDA' : 'DESTINO · TIERRA'}</span><h2>{isAlert ? 'Fallo en los motores' : 'Cada viaje empieza\ncon una pregunta.'}</h2><div className="telemetry"><span>{isAlert ? 'PROPULSIÓN' : 'NAVEGACIÓN'}</span><strong>{isAlert ? 'INTERRUMPIDA' : 'EN CURSO'}</strong></div><div className="signal-line"/><p>{isAlert ? 'Aterrizaje de emergencia preparado' : 'Tu próxima exploración está por comenzar'}</p></motion.div>}<div className="scene-spacer"/><motion.div className="context-content" key={`${progress.scene}-${progress.dialogueIndex}`} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18 }}>{scene.dialogues[progress.dialogueIndex] && <DialogueBox dialogue={scene.dialogues[progress.dialogueIndex]} advance={advance}/>} {scene.questionId && <RiasecQuestion questionId={scene.questionId} confirm={confirm}/>} {completed && <section className="panel completed"><span className="completion-icon"><Check size={26}/></span><span className="eyebrow">ACTIVIDAD FINALIZADA</span><h2>Respuesta registrada</h2><p>{progress.answers[riasecItems[0].id]?.status === 'unanswered_not_understood' ? 'La actividad quedó registrada sin valoración.' : 'Continuaremos con otra actividad.'}</p><div className="end-note">Has llegado al final de este prototipo. La próxima actividad estará disponible en una siguiente entrega.</div><p className="save-note"><ShieldCheck size={14}/>{error ? 'Conservada en esta sesión' : 'Progreso guardado en este navegador'}</p><div className="restart-action"><PrimaryGameButton onClick={restart}>Volver a empezar</PrimaryGameButton><p className="save-note">Reinicia el recorrido y borra esta respuesta.</p></div></section>}</motion.div>{error && <div role="alert" className="storage-warning">{error}<button onClick={retrySave}>Reintentar guardado</button></div>}<footer className="game-footer"><span>KRAKE MENTOR</span><span>NIVEL 01 <span className="footer-divider">/</span> {completed ? 'CIERRE' : 'EXPLORACIÓN'}</span></footer></main><p className="desktop-caption">Una aventura para descubrir lo que te mueve.</p></MotionConfig>;
}




