import React,{useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {TOUCH,Vector3} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {animals,animalModel,recipes} from './animals';
import {Meadow,ground,summit} from './Meadow';
import {printMaterial} from '../poster/printMaterial';
import PigmentPass from '../poster/PigmentPass';
import './ring.css';

const ring=animals.map((_,i)=>{
  const angle=2*Math.PI*i/animals.length+.08;
  const x=120*Math.cos(angle),z=120*Math.sin(angle);
  return {x,z,y:ground(x,z),yaw:-angle};
});
function makeRounds(){
  const rest=recipes.slice(1);
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  return [recipes[0],...rest.slice(0,6)];
}
function stackHeight(stack){
  return stack.reduce((height,name)=>height+({Turkey:25,Chicken:19,Duck:16}[name] || 16),0);
}
function World({stack,flight,onLand,onPick,onHover,sign,repeatTurkey}){
  const {camera,size,gl}=useThree();
  const controlsRef=useRef(null),fitZoom=useRef(null);
  const models=useMemo(()=>animals.map(animalModel),[]);
  const ink=useMemo(printMaterial,[]);
  const flyer=useRef(),elapsed=useRef(0),landed=useRef(false);
  useLayoutEffect(()=>{
    camera.position.set(0,105,405);
    const controls=new OrbitControls(camera,gl.domElement);
    controls.target.set(0,summit+18,0);
    controls.minPolarAngle=Math.PI*.25;
    controls.maxPolarAngle=Math.PI*.39;
    controls.enablePan=false;
    controls.rotateSpeed=.65;
    controls.zoomSpeed=.65;
    controls.touches.TWO=TOUCH.DOLLY_ROTATE;
    controls.update();
    controlsRef.current=controls;
    return ()=>controls.dispose();
  },[camera,gl]);
  useLayoutEffect(()=>{
    const controls=controlsRef.current;
    const fit=Math.min(size.width/322,size.height/242);
    const ratio=fitZoom.current ? camera.zoom/fitZoom.current : 1;
    fitZoom.current=fit;
    controls.minZoom=fit*.85;
    controls.maxZoom=fit*1.3;
    camera.zoom=Math.max(controls.minZoom,Math.min(controls.maxZoom,fit*ratio));
    camera.updateProjectionMatrix();
    const point=new Vector3();
    function placeWord(){
      const yaw=controls.getAzimuthalAngle();
      point.set(34*Math.sin(yaw),summit+2,34*Math.cos(yaw)).project(camera);
      if(sign.current) sign.current.style.top=((1-point.y)*50)+'%';
    }
    placeWord();
    controls.addEventListener('change',placeWord);
    return ()=>controls.removeEventListener('change',placeWord);
  },[camera,size,sign]);
  useLayoutEffect(()=>{elapsed.current=0;landed.current=false;},[flight]);
  useFrame((_,delta)=>{
    if(!flight||landed.current||!flyer.current)return;
    elapsed.current+=Math.min(delta,.1);
    const t=Math.min(1,Math.floor(elapsed.current*12)/10);
    const p=ring[animals.indexOf(flight)],ease=t*t*(3-2*t);
    flyer.current.position.set(p.x*(1-ease),p.y+(summit+stackHeight(stack)-p.y)*ease+38*4*t*(1-t),p.z*(1-ease));
    flyer.current.rotation.y=p.yaw*(1-ease);
    const s=1+.35*ease;flyer.current.scale.setScalar(s);
    if(t===1){landed.current=true;onLand(flight);}
  });
  return <><color attach="background" args={['#278e94']}/><directionalLight position={[-3,6,4]} intensity={1}/>
    <Meadow material={ink}/>
    {animals.map((name,i)=>{
      const p=ring[i];if(name===flight || (stack.includes(name) && !(repeatTurkey && name==="Turkey")))return null;
      return <group key={name} position={[p.x,p.y,p.z]} rotation={[0,p.yaw,0]}
        onClick={e=>{e.stopPropagation();if(e.delta<=5)onPick(name);}} onPointerOver={e=>{e.stopPropagation();onHover(name);}} onPointerOut={()=>onHover('')}>
        <mesh geometry={models[i]} material={ink}/>
        <mesh position={[0,11,0]}><boxGeometry args={[32,27,21]}/><meshBasicMaterial visible={false}/></mesh>
      </group>;
    })}
    {stack.map((name,i)=><mesh key={i} position={[0,summit+stackHeight(stack.slice(0,i)),0]} scale={1.35} geometry={models[animals.indexOf(name)]} material={ink}/>)}
    {flight&&<mesh ref={flyer} geometry={models[animals.indexOf(flight)]} material={ink}/>}
    <PigmentPass finish={1} spill={Math.min(6,size.width/115)}/>
  </>;
}
export default function RingGame(){
  const [rounds,setRounds]=useState(makeRounds),[round,setRound]=useState(0),[stack,setStack]=useState([]);
  const [flight,setFlight]=useState(null),[hint,setHint]=useState(''),[hover,setHover]=useState('');
  const [missed,setMissed]=useState(false),[score,setScore]=useState(0),[over,setOver]=useState(false);
  const busy=useRef(false), sign=useRef();
  const [word,...order]=rounds[round],complete=stack.length===order.length;
  function pick(name){
    if(busy.current||complete||over)return;
    setHover('');
    if(name!==order[stack.length]){setMissed(true);setHint('Try the '+order[stack.length].toLowerCase()+' next.');return;}
    busy.current=true;setHint('');setFlight(name);
  }
  function land(name){
    setStack([...stack,name]);setFlight(null);busy.current=false;
    if(stack.length+1===order.length&&!missed)setScore(s=>s+1);
  }
  function next(){
    if(round===rounds.length-1){setOver(true);return;}
    setRound(r=>r+1);setStack([]);setHint('');setMissed(false);setHover('');
  }
  function restart(){setRounds(makeRounds());setRound(0);setScore(0);setStack([]);setMissed(false);setHint('');setOver(false);}
  return <main className="ring-game">
    <header><h1>What the Stuff?!</h1><span>Round {round+1} / {rounds.length}</span></header>
    <section className="pasture" aria-label={'Animal ring. Build '+word}>
      <Canvas orthographic flat dpr={[1,1.4]} camera={{near:1,far:2100}}>
        <World sign={sign} repeatTurkey={order[stack.length]==="Turkey"} stack={stack} flight={flight} onLand={land} onPick={pick} onHover={setHover}/>
      </Canvas>
      <strong className="hill-word" ref={sign}>{word}</strong>
      {hover&&!flight&&!complete&&<output className="animal-name">{hover}</output>}
    </section>
    <section className="play-bar"><div aria-live="polite"><h2>{over?'Roundup complete!':complete?word+'!':'Build '+word}</h2>
      <p>{over?score+' of 7 stacks on the first try.':complete?stack.join(' + '):hint|| (flight?flight+' is hopping in…':stack.length?stack.join(' + ')+' · Pick the next rider.':'Pick the animals in word order, starting with Turkey.')}</p></div>
      {over?<button onClick={restart}>Play again</button>:complete?<button onClick={next}>{round===6?'See score':'Next word'} →</button>:
      <details key={round}><summary>Choose by name</summary><div>{animals.map(name=><button key={name} disabled={!!flight} onClick={e=>{pick(name);e.currentTarget.closest('details').open=false;}}>{name}</button>)}</div></details>}
    </section>
  </main>;
}
