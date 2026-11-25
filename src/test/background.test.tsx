import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { SceneBackground } from '../components/SceneBackground';
import { sceneConfig } from '../game/config';

it('mantiene la ilustración si el clip falla antes de reproducirse', () => {
  const { artwork } = sceneConfig.space_travel;
  const { container } = render(<SceneBackground artwork={artwork} reduceMotion={false}/>);
  const video = container.querySelector('video')!;
  expect(video).toHaveAttribute('src', artwork.video);
  expect(video).not.toHaveClass('playing');
  fireEvent.error(video);
  expect(container.querySelector('video')).toBeNull();
  expect(screen.getByAltText(artwork.description)).toHaveAttribute('src', artwork.poster);
});

it('carga el clip al permitir movimiento y lo retira al volver a reducirlo', () => {
  const { artwork } = sceneConfig.workshop_dialogue;
  const view = render(<SceneBackground artwork={artwork} reduceMotion/>);
  expect(view.container.querySelector('video')).toBeNull();
  view.rerender(<SceneBackground artwork={artwork} reduceMotion={false}/>);
  const video = view.container.querySelector('video')!;
  fireEvent.playing(video);
  expect(video).toHaveClass('playing');
  view.rerender(<SceneBackground artwork={artwork} reduceMotion/>);
  expect(video).not.toBeInTheDocument();
  expect(screen.getByAltText(artwork.description)).toBeVisible();
});
