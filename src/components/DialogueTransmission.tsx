import { useEffect, useState } from 'react';
import { ArrowRight, ChevronsRight, Radio, Wrench } from 'lucide-react';
import type { Dialogue } from '../game/config';

export function DialogueTransmission({ dialogue, reduceMotion, advance }: {
  dialogue: Dialogue;
  reduceMotion: boolean;
  advance: () => void;
}) {
  const isMechanic = dialogue.speaker === 'Mecánico';
  const SpeakerIcon = isMechanic ? Wrench : Radio;
  const words = dialogue.text.split(' ');
  const [visibleCount, setVisibleCount] = useState(reduceMotion ? words.length : 1);
  const typing = !reduceMotion && visibleCount < words.length;
  const lastWord = words[visibleCount - 1];

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(words.length);
      return;
    }
    if (!typing) return;
    const pause = /[.!?…]$/.test(lastWord) ? 310 : /[,]$/.test(lastWord) ? 210 : 125;
    const timer = window.setTimeout(() => setVisibleCount(count => count + 1), pause);
    return () => window.clearTimeout(timer);
  }, [lastWord, visibleCount, words.length, typing, reduceMotion]);

  return (
    <section className="dialogue-call" aria-label={`Transmisión de ${dialogue.speaker}`}>
      <div className="call-frame">
        <div className={isMechanic ? 'call-portrait call-portrait--mechanic' : 'call-portrait'} aria-hidden="true">
          {!isMechanic && <img src="/assets/krake-mentor.png" alt=""/>}
        </div>
        <span className="call-sign"><SpeakerIcon size={14} aria-hidden="true"/>{dialogue.speaker}</span>
        <p className="call-message">
          {typing ? <>
            <span className="sr-only">{dialogue.text}</span>
            <span aria-hidden="true">
              {words.slice(0, visibleCount).join(' ')}
              <span className="call-pending">{' ' + words.slice(visibleCount).join(' ')}</span>
            </span>
          </> : dialogue.text}
        </p>
        {typing && <button type="button" className="call-reveal"
          aria-label="Mostrar mensaje completo" title="Mostrar mensaje completo"
          onClick={() => setVisibleCount(words.length)}>
          <ChevronsRight size={18} aria-hidden="true"/>
        </button>}
      </div>
      <button type="button" className="call-action" onClick={advance}>
        {dialogue.action}<ArrowRight size={16} aria-hidden="true"/>
      </button>
    </section>
  );
}
