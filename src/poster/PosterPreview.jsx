import React, { Component, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { model } from './sculpture';
import { landscape, turkey, duck, chicken, hillHeight } from './artwork';
import { printMaterial } from './printMaterial';
import PigmentPass from './PigmentPass';
import './poster.css';

const duckGround = [100, hillHeight(100,85), 85];
const henGround = [-102, hillHeight(-102,70), 70];
const duckPerch = [23,-17,0];
const henPerch = [35,37,0];

function animateHop(bird, from, to, time, duration, height, turn = 0) {
  const t = Math.max(0, Math.min(1, time / duration));
  // Rise on the camera side of the carrier before gliding onto its back.
  const approach = Math.max(0, Math.min(1, (t - .25) / .75));
  const slide = approach * approach * (3 - 2 * approach);
  const arc = 4 * t * (1 - t);
  bird.position.set(
    from[0] + (to[0] - from[0]) * slide,
    from[1] + (to[1] - from[1]) * t + height * arc,
    from[2] + (to[2] - from[2]) * slide
  );
  bird.rotation.y = turn * (1 - slide);
  bird.rotation.z = .10 * Math.sin(t * Math.PI * 2);
  const compression = (phase, length) =>
    phase > 0 && phase < length ? Math.sin(Math.PI * phase / length) : 0;
  const squash = compression(time + .19, .19) + compression(time - duration, .18);
  bird.scale.set(1 + .07*squash, 1 - .14*squash, 1 + .07*squash);
}

const finishes = ["Harvest print", "Watercolor", "Wet-on-wet", "Dry brush"];

function Scene({ angle, reset, hop }) {
  const { camera, gl, size, invalidate } = useThree();
  const shapes = useMemo(() => [landscape, turkey, duck, chicken].map(model), []);
  const material = useMemo(printMaterial, []);
  const duckRider = useRef();
  const henRider = useRef();
  const hopStart = useRef(null);

  useLayoutEffect(() => {
    if (hop === 0 && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    hopStart.current = performance.now();
    invalidate();
  }, [hop, invalidate]);

  useFrame(() => {
    if (hopStart.current === null) return;
    const elapsed = (performance.now() - hopStart.current) / 1000;
    const poseTime = Math.floor(elapsed * 12) / 12;
    animateHop(duckRider.current, duckGround, duckPerch, poseTime - .48, .93, 108);
    animateHop(henRider.current, henGround, henPerch, poseTime - 1.82, 1.04, 128, Math.PI);
    if (poseTime < 3.05) invalidate();
    else hopStart.current = null;
  });

  useLayoutEffect(() => {
    camera.zoom = Math.min(size.width / 356, size.height / 456);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, size, invalidate]);
  useEffect(() => {
    camera.position.set(24,135,700);
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = .48;
    controls.minAzimuthAngle = -.64;
    controls.maxAzimuthAngle = .64;
    controls.minPolarAngle = Math.PI / 2 - .34;
    controls.maxPolarAngle = Math.PI / 2 - .04;
    controls.addEventListener('change', invalidate);
    controls.update();
    invalidate();
    return () => controls.dispose();
  }, [camera, gl, invalidate, reset]);

  const radians = angle * Math.PI / 180;
  return <>
    <color attach="background" args={['#238d94']} />
    <directionalLight position={[Math.sin(radians),.6,Math.cos(radians)]} intensity={1}/>
    <mesh geometry={shapes[0]} material={material} />
    <mesh geometry={shapes[1]} material={material} />
    <mesh ref={duckRider} position={duckPerch} geometry={shapes[2]} material={material} />
    <mesh ref={henRider} position={henPerch} geometry={shapes[3]} material={material} />
  </>;
}

class RenderBoundary extends Component {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  render() { return this.state.failed ? <p className="poster-error">Enable WebGL to view the interactive poster.</p> : this.props.children; }
}

export default function PosterPreview() {
  const [angle,setAngle] = useState(-43);
  const [reset,setReset] = useState(0);
  const [finish,setFinish] = useState(1);
  const [hop,setHop] = useState(0);
  const [spill,setSpill] = useState(14);
  return <main className="poster-page">
    <div className="poster-studio">
      <header className="poster-nav"><a href="/">← Back to quiz</a><span>What the Stuff?!</span></header>
      <figure className="poster-print">
        <div className="poster-stage" role="group" aria-label="A chicken rides on a duck riding on a turkey in a harvest landscape">
          <RenderBoundary><Canvas orthographic flat frameloop="demand" camera={{position:[0,0,700],near:1,far:2000}} dpr={[1,1.75]}>
            <Scene angle={angle} reset={reset} hop={hop}/>
            <PigmentPass finish={finish} spill={spill}/>
          </Canvas></RenderBoundary>
        </div>
        <figcaption><h1>Turducken</h1><span>{finishes[finish]}</span></figcaption>
      </figure>
      <div className="poster-finishes" role="group" aria-label="Poster finish">
        {finishes.map((name, index) => <button key={name} aria-pressed={finish === index}
          onClick={() => setFinish(index)}>{name}</button>)}
      </div>
      <div className="poster-controls">
        <span>Drag to orbit</span>
        <label>Sun angle <input type="range" min="-78" max="78" value={angle} onChange={e=>setAngle(Number(e.target.value))}/></label>
        {finish > 0 && <label>Edge spill <input type="range" min="0" max="14" value={spill} onChange={e=>setSpill(Number(e.target.value))}/></label>}
        <div className="poster-actions">
          <button onClick={()=>setHop(count=>count+1)}>Hop!</button>
          <button onClick={()=>{setReset(r=>r+1); setAngle(-43);}}>Reset view</button>
        </div>
      </div>
    </div>
  </main>;
}
