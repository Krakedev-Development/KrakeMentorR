import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Wrench, Check, ChevronRight, CircleHelp, X } from 'lucide-react';
import { riasecItems, ratings } from '../game/config';
import type { Rating } from '../game/progressStore';
import './question.css';

export function RiasecQuestion({ questionId, confirm }: {
  questionId: string;
  confirm: (id: string, value: Rating | null) => void;
}) {
  const item = riasecItems.find(i => i.id === questionId)!;
  const [selected, setSelected] = useState<Rating | null>(null);
  const [explained, setExplained] = useState(false);

  return (
    <section className="question" aria-labelledby="question-label">
      <div className="quest-card">
        <header className="quest-prompt">
          <span className="quest-emblem" aria-hidden="true"><Wrench size={23}/></span>
          <div className="quest-meta">
            <span className="quest-type">{item.dimensionLabel} ({item.dimension})</span>
            <span className="quest-progress">Actividad {item.ordinal} de {item.total}</span>
          </div>
          <h2 id="question-label">{item.text}</h2>
        </header>
        <fieldset className="rating-scale" aria-labelledby="question-label">
          <legend className="sr-only">Tu nivel de interés</legend>
          {ratings.map((label, index) => {
            const value = (index + 1) as Rating;
            const checked = selected === value;
            return (
              <label key={label} className={checked ? 'rating selected' : 'rating'}>
                <input type="radio" name="interest" value={value} checked={checked} onChange={() => setSelected(value)}/>
                <span className="rating-number">{value}</span>
                <span className="rating-text">{label}</span>
                {checked && <Check className="selection-check" size={12} aria-hidden="true"/>}
              </label>
            );
          })}
        </fieldset>
      </div>
      <div className="quest-actions">
        <Dialog.Root onOpenChange={open => { if (open) setExplained(true); }}>
          <Dialog.Trigger asChild>
            <button className="quest-help"><CircleHelp size={17}/>No entiendo la actividad</button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="modal-overlay"/>
            <Dialog.Content className="modal panel">
              <Dialog.Title className="modal-title">Krake te explica</Dialog.Title>
              <Dialog.Description>{item.explanation}.</Dialog.Description>
              <p>Elige lo que sientes. No hay respuestas correctas o incorrectas. Tu respuesta se guarda al continuar.</p>
              <Dialog.Close asChild><button className="primary">Volver a responder</button></Dialog.Close>
              <Dialog.Close asChild><button className="close" aria-label="Cerrar explicación"><X size={20}/></button></Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <button className="quest-continue" disabled={selected === null}
          onClick={() => { if (selected !== null) confirm(item.id, selected); }}>
          Continuar <ChevronRight size={21} aria-hidden="true"/>
        </button>
      </div>
      {explained && <button className="quest-skip" onClick={() => confirm(item.id, null)}>Aún no entiendo · Continuar sin valoración</button>}
    </section>
  );
}
