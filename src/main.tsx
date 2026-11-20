import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import './styles.css';
import { GameScreen } from './components/GameScreen';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><GameScreen /></React.StrictMode>);
