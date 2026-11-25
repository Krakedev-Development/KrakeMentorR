import { useEffect, useId, useState } from 'react';
import './engine-comic.css';

const description = 'En la cabina, el explorador se aferra a los mandos junto a Krake. El motor se rompe y suelta chispas. La nave cae hacia las montañas dejando un rastro de humo.';
const artwork = '/assets/engine-failure.webp';

export function EngineComic({ reduceMotion }: { reduceMotion: boolean }) {
  const id = useId();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) setFinished(true);
  }, [reduceMotion]);

  return (
    <figure className="engine-comic">
      {failed ? <figcaption>{description}</figcaption> : <>
        <img src={artwork} alt={description} data-pending={!reduceMotion && !finished ? '' : undefined}
          onLoad={() => setLoaded(true)} onError={() => setFailed(true)}/>
        {!reduceMotion && (
          <svg className="comic-cutscene" viewBox="0 0 1254 1254" aria-hidden="true" focusable="false"
            data-ready={loaded} data-revealing={loaded && !finished ? '' : undefined}>
            <defs>
              <image id={id + '-art'} href={artwork} width="1254" height="1254"/>
              {/* Clip each camera to its printed panel, including the diagonal gutters. */}
              <clipPath id={id + '-cockpit'}><polygon points="0,0 1254,0 1254,564 0,627"/></clipPath>
              <clipPath id={id + '-engine'}><polygon points="0,626 466,602 328,1254 0,1254"/></clipPath>
              <clipPath id={id + '-descent'}><polygon points="465,602 1254,563 1254,1254 327,1254"/></clipPath>
              <radialGradient id={id + '-feather'}>
                <stop offset="55%" stopColor="white"/><stop offset="100%" stopColor="black"/>
              </radialGradient>
              <mask id={id + '-smoke'} maskUnits="userSpaceOnUse" x="420" y="598" width="380" height="249">
                <g fill={`url(#${id}-feather)`}>
                  <ellipse cx="601" cy="704" rx="168" ry="92" transform="rotate(24 601 704)"/>
                  <ellipse cx="706" cy="787" rx="78" ry="42" transform="rotate(30 706 787)"/>
                </g>
              </mask>
            </defs>
            <g clipPath={`url(#${id}-cockpit)`}>
              <g className="comic-shot cockpit-aperture">
                <use href={'#' + id + '-art'}/>
                <g className="cockpit-lamps" fill="#3b0b1c">
                  <path d="M281 23 443 64 433 86 273 43Z M309 16 445 53 449 43 327 11Z"/>
                  <path d="M426 186 440 191 429 244 420 245Z"/>
                </g>
                <path className="console-lamps" fill="#500e22" d="M891 571 916 540 937 539 914 571Z M930 570 954 540 975 539 951 570Z M968 569 990 540 1005 539 983 569Z"/>
              </g>
            </g>
            <g clipPath={`url(#${id}-engine)`}>
              <g className="comic-shot engine-aperture">
                <g className="engine-camera">
                  <use href={'#' + id + '-art'}/>
                  <g fill="none" strokeLinecap="round">
                    <path className="engine-arc" stroke="#fff3bc" strokeWidth="4" d="m245 1003 19 -10 17 13 13 -2 5 25 14 -9 12 10 19 -15"/>
                    <g className="engine-sparks" stroke="#ffc16c" strokeWidth="4">
                      <path d="m319 1029 13 -8 m4 -3 3 -2 m-18 15 16 3 m-20 0 9 11"/>
                    </g>
                    <g className="engine-embers" stroke="#ffe6a9" strokeWidth="3">
                      <path d="m290 1041 -12 14 m7 -12 -15 5 m24 -3 -2 12"/>
                    </g>
                  </g>
                </g>
              </g>
            </g>
            <g clipPath={`url(#${id}-descent)`}>
              <g className="comic-shot descent-aperture">
                <g className="descent-camera" onAnimationEnd={event => {
                  if (event.animationName === 'follow-ship') setFinished(true);
                }}>
                  <use href={'#' + id + '-art'}/>
                  <g mask={`url(#${id}-smoke)`}>
                    <use href={'#' + id + '-art'} className="drifting-smoke"/>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        )}
      </>}
    </figure>
  );
}
