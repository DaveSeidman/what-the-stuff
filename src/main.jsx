import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';

const posterRoute = window.location.pathname.replace(/\/$/, '') === '/poster';
const Page = posterRoute ? lazy(() => import('./poster/PosterPreview')) : lazy(() => import('./ring/RingGame'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={null}><Page /></Suspense>
  </React.StrictMode>
);
