import React,{Suspense,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useLoader,useThree} from '@react-three/fiber';
import {TOUCH,Vector3,Object3D,PCFShadowMap} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {AnimalLoader} from './AnimalLoader';
import {animals,recipes,combinationName} from './animals';
import Countryside from './Countryside';
import {Meadow,ground,summit} from './Meadow';
import {printMaterial} from '../poster/printMaterial';
import PigmentPass from '../poster/PigmentPass';
import {Doll,shellFor,nestingPlaces,explodedOffsets} from './Doll';
import './ring.css';

const ring=animals.map((_,i)=>{
  const angle=2*Math.PI*i/animals.length+.08;
  const x=120*Math.cos(angle),z=120*Math.sin(angle);
  return {x,z,y:ground(x,z),yaw:-angle};
});
function makeRounds(){
  const rest=recipes.slice(1).filter(recipe=>new Set(recipe.slice(1)).size===recipe.length-1);
  for(let i=rest.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]];}
  return [recipes[0],...rest.slice(0,6)];
}
// CSS cubic-bezier(.42, 0, .58, 1), evaluated against elapsed time.
function openingEase(progress){
  const x=Math.max(0,Math.min(1,progress));
  if(x===0||x===1)return x;
  let low=0,high=1;
  for(let iteration=0;iteration<14;iteration++){
    const t=(low+high)/2;
    const curveX=3*(1-t)*(1-t)*t*.42+3*(1-t)*t*t*.58+t*t*t;
    if(curveX<x)low=t;else high=t;
  }
  const t=(low+high)/2;
  return 3*(1-t)*t*t+t*t*t;
}
function World({free,stack,flight,onLand,onPick,onHover,sign,repeatTurkey,explode,dof}){
  const {camera,size,gl}=useThree();
  const controlsRef=useRef(null),fitZoom=useRef(null);
  const cameraGoal=useRef(null),wasExploded=useRef(false);
  const models=useLoader(AnimalLoader,animals.map(name=>'/animals/'+name.toLowerCase()+'.bin'));
  const shells=useMemo(()=>models.map(shellFor),[models]);
  const previousPlaces=nestingPlaces(stack,models,shells,animals);
  const places=nestingPlaces(flight?[...stack,flight]:stack,models,shells,animals);
  const spread=explodedOffsets(places,shells);
  const lids=useRef([]),centers=useRef([]);
  const sunTarget=useMemo(()=>new Object3D(),[]);
  const ink=useMemo(printMaterial,[]);
  const dancers=useRef([]),surprise=useRef();
  const flyer=useRef(),elapsed=useRef(0),landed=useRef(false);
  useLayoutEffect(()=>{
    camera.position.set(0,239,1500);
    const controls=new OrbitControls(camera,gl.domElement);
    controls.target.set(0,summit+18,0);
    controls.minPolarAngle=Math.PI*.36;
    controls.maxPolarAngle=Math.PI*.42;
    controls.enablePan=false;
    controls.rotateSpeed=.65;
    controls.enableDamping=true;
    controls.dampingFactor=.045;
    controls.zoomSpeed=.65;
    controls.touches.TWO=TOUCH.DOLLY_ROTATE;
    controls.update();
    controlsRef.current=controls;
    return ()=>controls.dispose();
  },[camera,gl]);
  useLayoutEffect(()=>{
    const controls=controlsRef.current;
    const fit=Math.min(size.width/390,size.height/285);
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
  useLayoutEffect(()=>{
    if(explode===0&&!wasExploded.current)return;
    wasExploded.current=explode>0;
    const height=spread.height;
    const fit=Math.min(size.width/390,size.height/(285+explode*height));
    cameraGoal.current={y:summit+18+explode*height*.40,zoom:fit};
    fitZoom.current=fit;
    controlsRef.current.minZoom=fit*.85;
    controlsRef.current.maxZoom=fit*1.3;
  },[explode,stack.length,size]);
  useLayoutEffect(()=>{elapsed.current=0;landed.current=false;},[flight]);
  useFrame(({clock},delta)=>{
    const controls=controlsRef.current;
    if(cameraGoal.current&&controls){
      const goal=cameraGoal.current,blend=1-Math.exp(-8*Math.min(delta,.1));
      const lift=(goal.y-controls.target.y)*blend;
      controls.target.y+=lift;camera.position.y+=lift;
      camera.zoom+=(goal.zoom-camera.zoom)*blend;
      camera.updateProjectionMatrix();
      if(Math.abs(goal.y-controls.target.y)<.01&&Math.abs(goal.zoom-camera.zoom)<.0001)cameraGoal.current=null;
    }
    controls?.update(delta);
    const danceTime=Math.floor(clock.elapsedTime*12)/12;
    dancers.current.forEach((dancer,i)=>{
      if(!dancer)return;
      const phase=danceTime*2.2+i*1.73;
      const hop=Math.pow(Math.max(0,Math.sin(phase)),5)*1.8;
      dancer.position.y=ring[i].y+hop;
      dancer.rotation.y=ring[i].yaw+.13*Math.sin(phase*.7);
      dancer.rotation.z=.055*Math.sin(phase);
      const squash=1-.035*Math.cos(phase*2);
      dancer.scale.set(1/Math.sqrt(squash),squash,1/Math.sqrt(squash));
    });
    const nesting=stack.length>0;
    if(flight) elapsed.current+=Math.min(delta,.12);
    const reactionTime=elapsed.current;
    const time=Math.max(0,reactionTime-.7);
    const smooth=t=>{const u=Math.max(0,Math.min(1,t));return u*u*(3-2*u);};
    const outerGrow=flight?openingEase(time/.8):1;
    const outerScale=stack.length
      ? previousPlaces[0].scale+(places[0].scale-previousPlaces[0].scale)*outerGrow
      : 1;
    const bellyCenter=places.length?shells[places[0].index].seam*outerScale:0;
    const lidHeights=[];
    let lidHeight=stack.reduce((height,_,i)=>Math.max(height,shells[places[i].index].height*places[i].scale),40)+22;
    for(let i=stack.length-1;i>=0;i--){
      lidHeights[i]=lidHeight;
      const shell=shells[places[i].index];
      lidHeight+=(shell.height-shell.seam)*places[i].scale+8;
    }
    for(let i=0;i<stack.length;i++){
      const lid=lids.current[i],center=centers.current[i];
      if(!lid||!center)continue;
      const delay=Math.min(i,2)*.18;
      const grow=flight?openingEase((time-delay)/.8):1;
      const opening=flight ? grow*(1-openingEase((time-2.15-Math.min(stack.length-1-i,2)*.18)/.75)) : 0;
      const size=previousPlaces[i].scale+(places[i].scale-previousPlaces[i].scale)*grow;
      center.scale.setScalar(size);
      const separation=explode;
      const shell=shells[places[i].index];
      center.visible=i===0||!!flight||separation>.001;
      center.position.set(-shell.x*size,summit+bellyCenter-shell.seam*size+spread.bottoms[i]*separation,0);
      lid.position.set(0,lidHeights[i]*opening/size+(spread.tops[i]-spread.bottoms[i])*explode/size,0);
      lid.rotation.set(0,0,0);
      const resting=!flight&&explode<.001;
      const phase=clock.elapsedTime*2.0;
      center.rotation.set(0,resting?.14*Math.sin(phase*.7):0,resting?.045*Math.sin(phase):0);
      if(resting)center.position.y+=Math.pow(Math.max(0,Math.sin(phase)),4)*1.5;

    }
    if(!flight||landed.current||!flyer.current)return;
    const dest=places[stack.length],p=ring[dest.index];
    const approach=openingEase((time-(nesting ? .42 : 0))/.98);
    const drop=nesting?openingEase((time-1.42)/.62):1;
    const lift=nesting?(1-drop)*32*approach:0;
    const y=bellyCenter-shells[dest.index].seam;
    flyer.current.position.set(p.x+(dest.x-p.x)*approach,
      p.y+(summit+y-p.y)*approach+lift+32*4*approach*(1-approach),p.z*(1-approach));
    flyer.current.scale.setScalar(1);
    flyer.current.rotation.y=p.yaw*(1-approach);
    if(surprise.current)surprise.current.visible=reactionTime<.85;
    if(reactionTime<.7){
      const t=reactionTime/.7,arc=Math.sin(t*Math.PI);
      flyer.current.position.set(p.x,p.y+11*arc,p.z);
      flyer.current.rotation.z=.07*Math.sin(t*Math.PI*4);
      flyer.current.scale.set(1-.07*arc,1+.13*arc,1-.07*arc);
    }else flyer.current.rotation.z=0;

    flyer.current.visible=true;
    if(time>=(nesting?3.05+Math.min(stack.length-1,2)*.18:1)){
      landed.current=true;onLand(flight);
    }
  });
  return <><Countryside/><primitive object={sunTarget} position={[0,summit,0]}/>
    <directionalLight castShadow target={sunTarget} position={[-125,summit+250,167]} intensity={1}
      shadow-mapSize-width={1024} shadow-mapSize-height={1024} shadow-radius={2}
      shadow-camera-left={-169} shadow-camera-right={169} shadow-camera-top={169} shadow-camera-bottom={-169}
      shadow-camera-near={50} shadow-camera-far={570} shadow-normalBias={.18} shadow-bias={-.0002}/>
    <Meadow material={ink}/>
    {animals.map((name,i)=>{
      const p=ring[i];if(name===flight || stack.includes(name))return null;
      return <group key={name} ref={el=>{dancers.current[i]=el;}} position={[p.x,p.y,p.z]} rotation={[0,p.yaw,0]}
        onClick={e=>{e.stopPropagation();if(e.delta<=5)onPick(name);}} onPointerOver={e=>{e.stopPropagation();onHover(name);}} onPointerOut={()=>onHover('')}>
        <Doll name={name} geometry={models[i]} shell={shells[i]}/>
        <mesh position={[0,11,0]}><boxGeometry args={[32,27,21]}/><meshBasicMaterial visible={false}/></mesh>
      </group>;
    })}
    {stack.map((name,i)=>{
      const {index,x,y,scale}=places[i];
      return <group key={i} ref={el=>{centers.current[i]=el;}} position={[x,summit+y,0]} scale={scale}>
        <Doll name={name} geometry={models[index]} shell={shells[index]} impact={stack.length} lidRef={el=>{lids.current[i]=el;}}/>
      </group>;
    })}
    {flight&&<group ref={flyer}><Doll name={flight} geometry={models[places[stack.length].index]} shell={shells[places[stack.length].index]}/>
      <group ref={surprise}>
        {[-1,1].map(side=>{
          const face=models[places[stack.length].index].userData.face;
          if(!face)return null;
          return <group key={side}>
            <mesh position={[face.x,face.y+3,side*(face.z+.6)]} rotation={[0,0,-.15]}>
              <sphereGeometry args={[1,12,8]}/><meshBasicMaterial color="#533a30"/>
            </mesh>
            <mesh position={[face.x+2.3,face.y-3,side*(face.z+1)]} scale={[1,1.35,1]}>
              <torusGeometry args={[1.1,.35,6,16]}/><meshBasicMaterial color="#533a30"/>
            </mesh>
          </group>;
        })}
      </group></group>}
    <PigmentPass dof={dof} finish={1} spill={Math.min(6,size.width/115)}/>
  </>;
}
export default function RingGame(){
  const [rounds,setRounds]=useState(makeRounds),[round,setRound]=useState(0),[stack,setStack]=useState([]);
  const [flight,setFlight]=useState(null),[hint,setHint]=useState(''),[hover,setHover]=useState('');
  const [missed,setMissed]=useState(false),[score,setScore]=useState(0),[over,setOver]=useState(false);
  const [free,setFree]=useState(true);
  const [nest,setNest]=useState({count:0,recent:[]});
  const [dof,setDof]=useState(false);
  const [explode,setExplode]=useState(0);
  const busy=useRef(false), sign=useRef();
  function toggleMode(){
    if(busy.current)return;
    setFree(value=>!value);setExplode(0);
    setHover('');
  }
  const [word,...order]=rounds[round],complete=stack.length===order.length;
  function pick(name){
    if(busy.current||(!free&&(complete||over))||(free?nest.recent:stack).includes(name))return;
    setHover('');
    if(!free&&name!==order[stack.length]){setMissed(true);setHint('Try the '+order[stack.length].toLowerCase()+' next.');return;}
    busy.current=true;setExplode(0);if(!free)setHint('');setFlight(name);
  }
  function land(name){
    setFlight(null);busy.current=false;
    if(free){
      setNest(prev=>({count:prev.count+1,recent:[...prev.recent,name]}));
      return;
    }
    setStack([...stack,name]);
    if(stack.length+1===order.length&&!missed)setScore(s=>s+1);
  }
  function next(){
    if(round===rounds.length-1){setOver(true);return;}
    setRound(r=>r+1);setStack([]);setHint('');setMissed(false);setHover('');
  }
  function restart(){setRounds(makeRounds());setRound(0);setScore(0);setStack([]);setMissed(false);setHint('');setOver(false);}
  // Frame the innermost receiver for each new hop so deep nests stay playable.
  const visibleStack=free?nest.recent:stack;
  const freeName=combinationName(nest.recent);
  const nestLabel=nest.count+' '+(nest.count===1?'animal':'animals')+' nested';
  return <main className="ring-game">
    <header><h1>What the Stuff?!</h1><label className="mode-toggle"><input type="checkbox" checked={free} disabled={!!flight} onChange={toggleMode}/> Free mode</label>
      <label className="mode-toggle"><input type="checkbox" checked={dof} onChange={e=>setDof(e.target.checked)}/> Depth of field</label>
      <span>{free?nestLabel:`Round ${round+1} / ${rounds.length}`}</span></header>
    <section className="pasture" aria-label={free?'Free nesting animal ring':'Animal ring. Build '+word}>
      <Canvas shadows={{type:PCFShadowMap}} orthographic flat dpr={[1,1.4]} camera={{near:1,far:9000}}>
        <Suspense fallback={null}><World dof={dof} explode={explode} free={free} sign={sign} repeatTurkey={order[stack.length]==="Turkey"} stack={visibleStack} flight={flight} onLand={land} onPick={pick} onHover={setHover}/></Suspense>
      </Canvas>
      <label className="explode-control">Explode
        <input aria-label="Explode animal nest" type="range" min="0" max="100" value={Math.round(explode*100)}
          disabled={!!flight||visibleStack.length<2} onChange={e=>setExplode(Number(e.target.value)/100)}/>
      </label>
      <strong className="hill-word" ref={sign}>{free?freeName:word}</strong>
      {hover&&!flight&&(free||!complete)&&<output className="animal-name">{hover}</output>}
    </section>
    <section className="play-bar"><div aria-live="polite"><h2>{free?(nest.count?freeName:'Free nesting'):over?'Roundup complete!':complete?word+'!':'Build '+word}</h2>
      <p>{free?(flight?flight+' is hopping in…':nest.count===animals.length?'Everyone is nested! Use Explode to explore.':nest.count?'Choose who nests inside '+nest.recent.at(-1)+'.':'Choose any animal to start your nest.'):over?score+' of 7 dolls on the first try.':complete?stack.join(' + '):hint|| (flight?flight+(stack.length?' is nesting inside…':' is hopping in…'):stack.length?stack.join(' + ')+' · Choose who nests inside.':'Pick the animals in word order, starting with Turkey.')}</p></div>
      {free&&nest.count>0&&<button disabled={!!flight} onClick={()=>{setNest({count:0,recent:[]});setExplode(0);setHover('');}}>New nest</button>}
      {!free&&over?<button onClick={restart}>Play again</button>:!free&&complete?<button onClick={next}>{round===6?'See score':'Next word'} →</button>:
      <details key={free?"free":round}><summary>Choose by name</summary><div>{animals.map(name=><button key={name} disabled={!!flight||visibleStack.includes(name)} onClick={e=>{pick(name);e.currentTarget.closest('details').open=false;}}>{name}</button>)}</div></details>}
    </section>
  </main>;
}
