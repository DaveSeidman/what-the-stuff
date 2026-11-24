import React,{Suspense,useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame,useLoader,useThree} from '@react-three/fiber';
import {TOUCH,Object3D,PCFShadowMap} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {AnimalLoader} from './AnimalLoader';
import {animals,combinationName} from './animals';
import Countryside from './Countryside';
import {Meadow,ground,summit} from './Meadow';
import {printMaterial} from '../poster/printMaterial';
import PigmentPass from '../poster/PigmentPass';
import {Doll,shellFor,nestingPlaces,explodedOffsets} from './Doll';
import Loader from './Loader';
import WatercolorControls,{watercolorDefaults} from './WatercolorControls';
import './ring.css';

const ring=animals.map((_,i)=>{
  const angle=2*Math.PI*i/animals.length+.08;
  const x=120*Math.cos(angle),z=120*Math.sin(angle);
  return {x,z,y:ground(x,z),yaw:-angle};
});
function makeRounds(){
  const choices=animals.filter(name=>name!=='Turkey');
  const pool=[];
  for(let i=0;i<choices.length;i++)for(let j=i+1;j<choices.length;j++){
    const trio=['Turkey',choices[i],choices[j]];
    pool.push([combinationName(trio),...trio]);
  }
  for(let i=pool.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  return pool.slice(0,5);
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
function World({stack,flight,onLand,onPick,onHover,explode,closing,closeProgress,closeFrom,onReady,watercolor}){
  const {camera,size,gl}=useThree();
  const controlsRef=useRef(null),fitZoom=useRef(null);
  const cameraGoal=useRef(null),wasExploded=useRef(false);
  const models=useLoader(AnimalLoader,animals.map(name=>'/animals/'+name.toLowerCase()+'.bin'));
  useEffect(()=>{onReady();},[onReady]);
  const shells=useMemo(()=>models.map(shellFor),[models]);
  const previousPlaces=nestingPlaces(stack,models,shells,animals);
  const places=nestingPlaces(flight?[...stack,flight]:stack,models,shells,animals);
  const spread=explodedOffsets(places,shells);
  const oldSpread=explodedOffsets(previousPlaces,shells);
  const tucks=useRef([]),flyerTuck=useRef({amount:0,radius:1000}),flyerLid=useRef();
  stack.forEach((_,i)=>{tucks.current[i] ||= {amount:0,radius:1000};});
  const lids=useRef([]),centers=useRef([]);
  const sunTarget=useMemo(()=>new Object3D(),[]);
  const ink=useMemo(printMaterial,[]);
  const dancers=useRef([]),surprise=useRef();
  const flyer=useRef(),elapsed=useRef(0),landed=useRef(false);
  useLayoutEffect(()=>{
    camera.up.set(0,1,0);
    camera.position.set(0,-28,365);
    const controls=new OrbitControls(camera,gl.domElement);
    controls.target.set(0,summit+18,0);
    controls.minPolarAngle=Math.PI*.36;
    controls.maxPolarAngle=Math.PI*.42;
    const distance=camera.position.distanceTo(controls.target);
    controls.minDistance=distance*.85;
    controls.maxDistance=distance*1.28;
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
    const distance=camera.position.distanceTo(controls.target);
    const pixelsPerUnit=size.height/(2*distance*Math.tan(camera.fov*Math.PI/360));
    const fit=Math.min(size.width/390,size.height/285)/pixelsPerUnit;
    const ratio=fitZoom.current ? camera.zoom/fitZoom.current : 1;
    fitZoom.current=fit;
    controls.minZoom=fit*.85;
    controls.maxZoom=fit*1.3;
    camera.zoom=Math.max(controls.minZoom,Math.min(controls.maxZoom,fit*ratio));
    camera.updateProjectionMatrix();
  },[camera,size]);
  useLayoutEffect(()=>{
    if(explode===0&&!wasExploded.current)return;
    wasExploded.current=explode>0;
    const height=spread.height;
    const distance=camera.position.distanceTo(controlsRef.current.target);
    const pixelsPerUnit=size.height/(2*distance*Math.tan(camera.fov*Math.PI/360));
    const fit=Math.min(size.width/390,size.height/(285+explode*height))/pixelsPerUnit;
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
    let lidHeight=flight?shells[animals.indexOf(flight)].height-shells[animals.indexOf(flight)].seam+24:36;
    const approachStart=.50+Math.max(0,stack.length-3)*.10;
    const dropStart=approachStart+1;
    const closeStart=dropStart+.74;
    for(let i=stack.length-1;i>=0;i--){
      lidHeights[i]=lidHeight;
      const shell=shells[places[i].index];
      lidHeight+=(shell.height-shell.seam)*places[i].scale+8;
    }
    for(let i=0;i<stack.length;i++){
      const lid=lids.current[i],center=centers.current[i];
      if(!lid||!center)continue;
      const delay=i*.10;
      const grow=flight?openingEase((time-delay)/.8):1;
      const opening=flight ? grow*(1-openingEase((time-closeStart-(stack.length-1-i)*.17)/.75)) : 0;
      const size=previousPlaces[i].scale+(places[i].scale-previousPlaces[i].scale)*grow;
      center.scale.setScalar(size);
      const separation=explode;
      const bottomOffset=(oldSpread.bottoms[i]||0)+((spread.bottoms[i]||0)-(oldSpread.bottoms[i]||0))*grow;
      const topOffset=(oldSpread.tops[i]||0)+((spread.tops[i]||0)-(oldSpread.tops[i]||0))*grow;
      tucks.current[i].amount=i?(1-explode):0;
      tucks.current[i].radius=i?(shells[places[i-1].index].width-.65)*places[i-1].scale/size-.3:1000;
      const shell=shells[places[i].index];
      center.visible=i===0||!!flight||separation>.001;
      center.position.set(-shell.x*size,summit+bellyCenter-shell.seam*size+bottomOffset*separation,0);
      const localExplode=closing
        ? closeFrom*(1-openingEase((closeProgress*(.85+stack.length*.13)-(stack.length-1-i)*.13)/.85))
        : explode;
      lid.position.set(0,lidHeights[i]*opening*(1-explode)/size+(topOffset*localExplode-bottomOffset*explode)/size,0);
      lid.rotation.set(0,0,0);
      const resting=!flight&&explode<.001;
      const phase=clock.elapsedTime*2.0;
      center.rotation.set(0,resting?.14*Math.sin(phase*.7):0,resting?.045*Math.sin(phase):0);
      if(resting)center.position.y+=Math.pow(Math.max(0,Math.sin(phase)),4)*1.5;

    }
    if(!flight||landed.current||!flyer.current)return;
    const dest=places[stack.length],p=ring[dest.index];
    const approach=openingEase((time-(nesting ? approachStart : 0))/.98);
    const drop=nesting?openingEase((time-dropStart)/.62):1;
    const lift=nesting?(1-drop)*18*approach:0;
    const y=bellyCenter-shells[dest.index].seam+spread.bottoms[stack.length]*explode;
    flyerTuck.current.amount=nesting?(1-explode)*openingEase((time-dropStart)/.6):0;
    flyerTuck.current.radius=nesting?(shells[places[stack.length-1].index].width-.65)*places[stack.length-1].scale-.3:1000;
    if(flyerLid.current)flyerLid.current.position.y=(spread.tops[stack.length]-spread.bottoms[stack.length])*explode*drop;
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
    if(time>=(nesting?closeStart+(stack.length-1)*.17+.80:1)){
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
      return <group name={"animal-"+name} key={name} ref={el=>{dancers.current[i]=el;}} position={[p.x,p.y,p.z]} rotation={[0,p.yaw,0]}
        onClick={e=>{e.stopPropagation();if(e.delta<=5)onPick(name);}} onPointerOver={e=>{e.stopPropagation();onHover(name);}} onPointerOut={()=>onHover('')}>
        <Doll name={name} geometry={models[i]} shell={shells[i]}/>
        <mesh position={[0,11,0]}><boxGeometry args={[32,27,21]}/><meshBasicMaterial visible={false}/></mesh>
      </group>;
    })}
    {stack.map((name,i)=>{
      const {index,x,y,scale}=places[i];
      return <group name={"nested-"+i} key={i} ref={el=>{centers.current[i]=el;}} position={[x,summit+y,0]} scale={scale}>
        <Doll name={name} geometry={models[index]} shell={shells[index]} impact={stack.length} tuck={tucks.current[i]} lidRef={el=>{lids.current[i]=el;}}/>
      </group>;
    })}
    {flight&&<group name="arriving-animal" ref={flyer}><Doll name={flight} tuck={flyerTuck.current} lidRef={flyerLid} geometry={models[places[stack.length].index]} shell={shells[places[stack.length].index]}/>
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
    <PigmentPass finish={1} spill={watercolor.spill} settings={watercolor}/>
  </>;
}
export default function RingGame(){
  const [rounds,setRounds]=useState(makeRounds),[round,setRound]=useState(0),[stack,setStack]=useState([]);
  const [flight,setFlight]=useState(null),[hint,setHint]=useState(''),[hover,setHover]=useState('');
  const [missed,setMissed]=useState(false),[score,setScore]=useState(0),[over,setOver]=useState(false);
  const [watercolor,setWatercolor]=useState(()=>({...watercolorDefaults}));
  const [intro,setIntro]=useState(true);
  const [leaving,setLeaving]=useState('');
  const modalAction=useRef();
  useEffect(()=>{
    if(!leaving)return;
    const timer=setTimeout(()=>{
      modalAction.current?.();
      setLeaving('');
    },window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:280);
    return ()=>clearTimeout(timer);
  },[leaving]);
  function leaveModal(which,action){
    if(leaving)return;
    modalAction.current=action;
    setLeaving(which);
  }
  function chooseMode(nextFree){
    leaveModal('intro',()=>{
      if(free!==nextFree){
        setExplode(0);setFlight(null);busy.current=false;
      }
      setFree(nextFree);setIntro(false);
    });
  }
  const [results,setResults]=useState([]);
  const [loaded,setLoaded]=useState(false);
  const [free,setFree]=useState(true);
  const [nest,setNest]=useState({count:0,recent:[]});
  const [explode,setExplode]=useState(0);
  const [closing,setClosing]=useState(false);
  const [closeProgress,setCloseProgress]=useState(0);
  const closeFrom=useRef(0);
  const busy=useRef(false);
  useEffect(()=>{
    if(!closing)return;
    let frame;
    const start=performance.now();
    function tick(now){
      const t=Math.min(1,(now-start)/(850+(free?nest.count:stack.length)*130));
      setCloseProgress(t);
      setExplode(closeFrom.current*(1-openingEase(t)));
      if(t<1)frame=requestAnimationFrame(tick);
      else {busy.current=false;setClosing(false);}
    }
    frame=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[closing]);
  const [word,...order]=rounds[round],complete=stack.length===order.length;
  function pick(name){
    if(intro||busy.current||(!free&&(complete||over))||(free?nest.recent:stack).includes(name))return;
    setHover('');
    if(!free&&name!==order[stack.length]){setMissed(true);setHint('Try the '+order[stack.length].toLowerCase()+' next.');return;}
    busy.current=true;if(!free)setHint('');setFlight(name);
  }
  function land(name){
    setFlight(null);
    closeFrom.current=explode;
    busy.current=explode>.001;
    setCloseProgress(0);
    setClosing(explode>.001);
    if(free){
      setNest(prev=>({count:prev.count+1,recent:[...prev.recent,name]}));
      return;
    }
    setStack([...stack,name]);
    if(stack.length+1===order.length){
      setResults(old=>[...old,!missed]);
      if(!missed)setScore(s=>s+1);
    }
  }
  function next(){
    if(round===rounds.length-1){setOver(true);return;}
    setRound(r=>r+1);setStack([]);setHint('');setMissed(false);setHover('');
  }
  function restart(){setRounds(makeRounds());setResults([]);setRound(0);setScore(0);setStack([]);setMissed(false);setHint('');setOver(false);}
  // Frame the innermost receiver for each new hop so deep nests stay playable.
  const visibleStack=free?nest.recent:stack;
  const freeName=combinationName(nest.recent);
  const nestLabel=nest.count+' '+(nest.count===1?'animal':'animals')+' nested';
  const ready=useCallback(()=>setLoaded(true),[]);
  return <main className="ring-game">
    <section className="pasture" aria-label={free?'Free nesting animal ring':'Animal ring. Build '+word}>
      <Canvas shadows={{type:PCFShadowMap}} flat dpr={[1,1.4]} camera={{fov:50,near:1,far:9000}}>
        <Suspense fallback={null}><World watercolor={watercolor} closing={closing} closeProgress={closeProgress} closeFrom={closeFrom.current} explode={explode} stack={visibleStack} flight={flight} onLand={land} onPick={pick} onHover={setHover} onReady={ready}/></Suspense>
      </Canvas>
    </section>
    <div className="game-brand">What the STUFF!?</div>
    <button className="help-button" aria-label="Help" disabled={!!flight||closing} onClick={()=>setIntro(true)}>?</button>
    {!intro&&<div className="score-tracker" aria-label={free?nestLabel:`Score ${score} of 5`}>
      {free?nestLabel:<><span>Score {score} / 5</span><div className="score-dots">{rounds.map((_,i)=><i key={i} aria-label={results[i]===undefined?'Round '+(i+1):results[i]?'Correct':'Completed with help'} className={results[i]===undefined?(i===round?'current':''):results[i]?'won':'helped'}/>)}</div></>}
    </div>}
    {!intro&&!over&&!(complete&&!free)&&<div className="build-prompt" aria-live="polite">
      <span>{free?'Let’s get stuffed!':`Combination ${round+1} of 5 · build the`}</span>
      <h1>{free?(nest.count?freeName:'Pick an animal'):word}</h1>
      <p>{flight?flight+' is hopping in…':hint|| (free?'Pick anyone. Keep nesting.':stack.length?stack.join(' + ')+' · Who goes next?':'Choose three animals, starting with Turkey.')}</p>
    </div>}
    {!intro&&<label className="explode-control">Explode
      <input aria-label="Explode animal nest" type="range" min="0" max="100" value={Math.round(explode*100)}
        disabled={!!flight||closing||visibleStack.length<2} onChange={e=>setExplode(Number(e.target.value)/100)}/>
    </label>}
    {hover&&!intro&&!flight&&<output className="animal-name">{hover}</output>}
    {!intro&&!over&&<div className="animal-picker">
      {free&&nest.count>0&&<button disabled={!!flight||closing} onClick={()=>{setNest({count:0,recent:[]});setExplode(0);setHover('');}}>New nest</button>}
    </div>}
    {!intro&&!free&&(complete||over)&&<div className={"celebration-backdrop "+(leaving==='celebration'?'modal-leaving':'')}>
      <div className="celebration" role="dialog" aria-modal="true" aria-labelledby="celebration-title">
        <div className="celebration-leaves" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--angle':i*20+'deg','--delay':i%4*.07+'s'}}/>)}</div>
        <p>{over?'The flock is stuffed!':'Beautifully stuffed!'}</p>
        <h2 id="celebration-title">{over?'What a feast!':word}</h2>
        <p>{over?`You made all five combinations. ${score} on the first try!`:stack.join(' + ')}</p>
        <strong>Score {score} / 5</strong>
        <button autoFocus disabled={closing} onClick={()=>leaveModal('celebration',over?restart:next)}>{over?'Play again':round===4?'See my score':'Next combination'} →</button>
      </div>
    </div>}
    {intro&&loaded&&<div className={"intro-stage "+(leaving==='intro'?'modal-leaving':'')}>
      <div className="intro-card" role="dialog" aria-modal="true" aria-labelledby="intro-title">
        <span className="intro-turkey" aria-hidden="true">🦃</span>
        <h1 id="intro-title">What the<br/>STUFF!?</h1>
        <h2>Stuffing's the Best Part of Thanksgiving!</h2>
        <p>Meet the world’s most enthusiastic stuffed animals. Everyone wants to be the stuffing.</p>
        <p>Pick a silly combination. Help three animals hop inside each other. Five rounds, one very full flock.</p>
        <div className="intro-actions">
          <button autoFocus disabled={!!leaving} onClick={()=>chooseMode(false)}>Let’s get stuffing!</button>
          <button className="secondary" disabled={!!leaving} onClick={()=>chooseMode(true)}>Just let me play</button>
        </div>
        <p className="intro-history">Inspired by engastration, the real tradition of nesting one animal inside another. <a href="https://en.wikipedia.org/wiki/Engastration" target="_blank" rel="noreferrer">Read its history ↗</a></p>
        <small>Drag to orbit · scroll or pinch to peek closer</small>
      </div>
    </div>}
    {!loaded&&<Loader/>}
    <WatercolorControls settings={watercolor} onChange={setWatercolor}/>
  </main>;
}
