import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Loader from './ring/Loader';
import BasterCursor from './ring/BasterCursor';
import './ring/ring.css';

const posterRoute = window.location.pathname.replace(/\/$/, '') === '/poster';
const Page = posterRoute ? lazy(() => import('./poster/PosterPreview')) : lazy(() => import('./ring/RingGame'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Loader/>}><Page /></Suspense>
    <BasterCursor/>
  </React.StrictMode>
);
