import React from 'react';
import {useProgress} from '@react-three/drei';
export default function Loader(){
  const {progress}=useProgress();
  return <div className="loading-screen" role="status">
    <div className="loading-turkey" aria-hidden="true">🦃</div>
    <p>Gathering the flock…</p>
    <div className="loading-track" role="progressbar" aria-label="Loading game" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
      <span style={{width:progress+'%'}}/>
    </div>
  </div>;
}
