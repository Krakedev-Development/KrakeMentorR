import { useState } from 'react';
import type { SceneArtwork } from '../game/config';

function SceneLoop({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <video
      className={`scene-art scene-loop${playing ? ' playing' : ''}`}
      src={src}
      autoPlay muted loop playsInline
      aria-hidden="true"
      onPlaying={() => setPlaying(true)}
      onError={() => setFailed(true)}
    />
  );
}

export function SceneBackground({ artwork, reduceMotion }: {
  artwork: SceneArtwork;
  reduceMotion: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return <>
    {imageFailed ? <>
      <div className="space-art" aria-hidden="true">
        <div className="planet"/><div className="orbit orbit-one"/>
        <div className="orbit orbit-two"/><div className="stars"/>
      </div>
      <p className="asset-warning" role="status">Ilustración no disponible: {artwork.poster.split('/').pop()}. Puedes continuar.</p>
    </> : (
      <img className="scene-art" src={artwork.poster} alt={artwork.description} onError={() => setImageFailed(true)}/>
    )}
    {!reduceMotion && <SceneLoop src={artwork.video}/>}
  </>;
}
