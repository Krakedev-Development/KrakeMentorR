import { act, fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { DialogueTransmission } from '../components/DialogueTransmission';
import { sceneConfig } from '../game/config';

it('revela palabras por turno y permite completar la llamada sin avanzar', () => {
  vi.useFakeTimers();
  try {
    const dialogue = sceneConfig.space_travel.dialogues[0];
    const advance = vi.fn();
    render(<DialogueTransmission dialogue={dialogue} reduceMotion={false} advance={advance}/>);
    const reveal = screen.getByRole('button', { name: 'Mostrar mensaje completo' });
    const pending = document.querySelector('.call-pending')!;
    expect(pending.textContent?.trimStart()).toMatch(/^explorador!/);
    act(() => { vi.advanceTimersToNextTimer(); });
    expect(pending.textContent?.trimStart()).toMatch(/^Estamos/);
    fireEvent.click(reveal);
    expect(screen.getByText(dialogue.text)).toBeVisible();
    expect(reveal).not.toBeInTheDocument();
    expect(advance).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: dialogue.action }));
    expect(advance).toHaveBeenCalledOnce();
  } finally {
    vi.useRealTimers();
  }
});

it('muestra el mensaje completo al reducir el movimiento durante una llamada', () => {
  const dialogue = sceneConfig.emergency_landing.dialogues[0];
  const props = { dialogue, advance: vi.fn() };
  const view = render(<DialogueTransmission {...props} reduceMotion={false}/>);
  view.rerender(<DialogueTransmission {...props} reduceMotion/>);
  expect(screen.queryByRole('button', { name: 'Mostrar mensaje completo' })).toBeNull();
  expect(screen.getByText(dialogue.text)).toBeVisible();
});
