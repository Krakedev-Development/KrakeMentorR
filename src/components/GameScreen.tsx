import { useEffect, useRef, useState, type ReactNode } from 'react';
import { preload } from 'react-dom';
import { motion, MotionConfig, useReducedMotion } from 'motion/react';
import { RiasecQuestion } from './RiasecQuestion';
import { Rocket, MapPin, Check, ShieldCheck, Sparkles, Orbit } from 'lucide-react';
import { sceneConfig, riasecItems } from '../game/config';
import { SceneBackground } from './SceneBackground';
import { EngineComic } from './EngineComic';
import { DialogueTransmission } from './DialogueTransmission';
import { useGame } from '../game/useGame';

const tabletPass = '/assets/tablet-pass.webp';


function PrimaryGameButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
 return <button className="primary" onClick={onClick} disabled={disabled}>{children}</button>;
}
export function GameScreen() {
 const { progress, error, advance, confirm, restart, retrySave } = useGame();
 const [quiet, setQuiet] = useState(false);
 const [tabletEntry, setTabletEntry] = useState(false);
 const reduced = useReducedMotion();
 const reduceMotion = quiet || !!reduced;
 const scene = sceneConfig[progress.scene];
 const inWorkshop = progress.scene === 'workshop_dialogue';
 if (inWorkshop && !reduceMotion) {
  preload(tabletPass, { as: 'image' });
  preload(sceneConfig.riasec_realista_01.artwork.poster, { as: 'image' });
 }
 const showTabletPass = Boolean(scene.questionId && tabletEntry && !reduceMotion);
 useEffect(() => {
  if (reduceMotion || !scene.questionId) setTabletEntry(false);
 }, [reduceMotion, scene.questionId]);
 function advanceDialogue() {
  if (inWorkshop && progress.dialogueIndex === scene.dialogues.length - 1 && !reduceMotion) {
   setTabletEntry(true);
  }
  advance();
 }
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [progress.scene, progress.dialogueIndex]);
 const isSpace = progress.scene === 'space_travel' || progress.scene === 'unknown_signal';
 const isAlert = progress.scene === 'unknown_signal';
 const workshopSpeaker = progress.scene === 'workshop_dialogue' ? scene.dialogues[progress.dialogueIndex]?.speaker : undefined;
 const completed = progress.scene === 'first_answer_completed';
 return <MotionConfig reducedMotion={reduceMotion ? 'always' : 'never'}><div className="desktop-brand"><img className="brand-logo" src="/assets/krake-mentor.png" alt="" width="48" height="48"/><span>KRAKE<span className="brand-light"> MENTOR</span></span></div><main data-tablet-entry={showTabletPass || undefined} data-engine-failure={isAlert || undefined} data-workshop-speaker={workshopSpeaker} className={`game-screen ${isSpace ? 'space-scene' : ''} ${reduceMotion ? 'reduce-motion' : ''}`}><SceneBackground key={scene.artwork.video} artwork={scene.artwork} reduceMotion={reduceMotion}/>{showTabletPass && <>
  <img className="tablet-departure" src={sceneConfig.workshop_dialogue.artwork.poster} alt="" aria-hidden="true"/>
  <div className="scene-art tablet-pass" aria-hidden="true"
    onAnimationEnd={event => { if (event.animationName === 'tablet-handoff') setTabletEntry(false); }}>
   <img src={tabletPass} alt=""/>
  </div>
 </>}<div className="scene-shade"/><header className="game-header"><div className="level-badge"><Rocket size={23}/></div><div><span className="eyebrow">EXPLORACIÓN RIASEC</span><h1>Nivel 1</h1><p>El aterrizaje inesperado</p></div><button className="motion-toggle" aria-label="Reducir animaciones" aria-pressed={quiet} onClick={() => setQuiet(!quiet)} title="Reducir animaciones"><Sparkles size={18}/>{quiet && <Check size={11}/>}</button></header><div className="scene-heading"><div className="location"><MapPin size={12}/>{scene.location}</div><h2 tabIndex={-1} ref={heading}>{scene.title}</h2></div>{progress.scene === 'space_travel' && (
  <div className="flight-display">
   <div className="flight-symbol"><Orbit size={64} strokeWidth={1}/></div>
   <span className="eyebrow">DESTINO · TIERRA</span>
   <h2>{'Cada viaje empieza\ncon una pregunta.'}</h2>
   <div className="telemetry"><span>NAVEGACIÓN</span><strong>EN CURSO</strong></div>
   <div className="signal-line"/><p>Tu próxima exploración está por comenzar</p>
  </div>
 )}
 {isAlert ? <EngineComic reduceMotion={reduceMotion}/> : <div className="scene-spacer"/>}
 <motion.div className="context-content" key={`${progress.scene}-${progress.dialogueIndex}`} initial={reduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .18 }}>{scene.dialogues[progress.dialogueIndex] && <DialogueTransmission dialogue={scene.dialogues[progress.dialogueIndex]} reduceMotion={reduceMotion} advance={advanceDialogue}/>} {scene.questionId && <RiasecQuestion questionId={scene.questionId} confirm={confirm}/>} {completed && <section className="panel completed"><span className="completion-icon"><Check size={26}/></span><span className="eyebrow">ACTIVIDAD FINALIZADA</span><h2>Respuesta registrada</h2><p>{progress.answers[riasecItems[0].id]?.status === 'unanswered_not_understood' ? 'La actividad quedó registrada sin valoración.' : 'Continuaremos con otra actividad.'}</p><div className="end-note">Has llegado al final de este prototipo. La próxima actividad estará disponible en una siguiente entrega.</div><p className="save-note"><ShieldCheck size={14}/>{error ? 'Conservada en esta sesión' : 'Progreso guardado en este navegador'}</p><div className="restart-action"><PrimaryGameButton onClick={restart}>Volver a empezar</PrimaryGameButton><p className="save-note">Reinicia el recorrido y borra esta respuesta.</p></div></section>}</motion.div>{error && <div role="alert" className="storage-warning">{error}<button onClick={retrySave}>Reintentar guardado</button></div>}<footer className="game-footer"><span>KRAKE MENTOR</span><span>NIVEL 01 <span className="footer-divider">/</span> {completed ? 'CIERRE' : 'EXPLORACIÓN'}</span></footer></main><p className="desktop-caption">Una aventura para descubrir lo que te mueve.</p></MotionConfig>;
}




