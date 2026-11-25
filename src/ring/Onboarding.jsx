import React,{useEffect,useRef,useState} from 'react';
import {BasterIcon} from './BasterCursor';
import NestOpening from './NestOpening';

const example=['Turkey','Duck','Chicken'];
export default function Onboarding({ready,stack,flight,targets,handleRef,amount,onChange,onPick,onComplete,onUnpack,unpacking}){
  const [stage,setStage]=useState('combine'),[revealed,setRevealed]=useState(0),[pressed,setPressed]=useState(false);
  const cursor=useRef(null),lastPoint=useRef(null),pick=useRef(onPick);
  pick.current=onPick;
  useEffect(()=>{
    document.body.setAttribute('data-nest-demo','');
    return ()=>document.body.removeAttribute('data-nest-demo');
  },[]);
  useEffect(()=>{
    if(!ready||stage!=='combine'||flight)return;
    if(stack.length===3){
      const timer=setTimeout(()=>setStage('open'),550);
      return ()=>clearTimeout(timer);
    }
    const animal=example[stack.length];
    let frame,start=null;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function tick(now){
      const target=targets.current[animal];
      if(!target){frame=requestAnimationFrame(tick);return;}
      if(start===null)start=now;
      const t=(now-start)/1000,delay=stack.length? .15:.55;
      const progress=Math.max(0,Math.min(1,(t-delay)/.3));
      const eased=reduced?1:progress*progress*(3-2*progress);
      const from=lastPoint.current||{x:target.x+45,y:target.y+45};
      if(cursor.current)cursor.current.style.transform=`translate(${from.x+(target.x-from.x)*eased}px,${from.y+(target.y-from.y)*eased}px)`;
      setPressed(t>delay+.3&&t<delay+.5);
      if(t>=delay+.5){
        lastPoint.current={...target};setPressed(false);setRevealed(stack.length+1);pick.current(animal);return;
      }
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[ready,stage,stack.length,flight]);
  useEffect(()=>{if(stage==='returning'&&!unpacking&&stack.length===0)setStage('win');},[stage,unpacking,stack.length]);
  return <>
    <div className="onboarding-copy" aria-live="polite">
      <span>How to play · {stage==='combine'?'1':stage==='open'?'2':'3'} of 3</span>
      <h2>{stage==='combine'?'Combine animals to form the word':stage==='open'?'Pull up to open':'Match them all to win!'}</h2>
      {stage==='combine'?<p className="tutorial-equation"><strong>Turducken</strong><span> = </span>{example.map((animal,i)=><React.Fragment key={animal}>{i>0&&<span className={revealed>i?'revealed':''}> + </span>}<span className={revealed>i?'revealed':''}>{animal}</span></React.Fragment>)}</p>:<p>{stage==='open'?'Drag the animal upward to peek inside. Release to let the lids fall back down.':'Make all five combinations. Every animal has a part to play!'}</p>}
      {stage==='win'&&<div className="tutorial-actions"><button className="primary" onClick={onComplete}>Let’s Play</button></div>}
    </div>
    {stage==='combine'&&<div className="nest-opening-demo" aria-hidden="true"><div className="demo-baster" ref={cursor}><BasterIcon pressed={pressed}/></div></div>}
    {stage==='combine'&&stack.length===3&&!flight&&<div className="celebration-leaves tutorial-confetti" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--angle':i*20+'deg','--delay':i%4*.07+'s'}}/>)}</div>}
    {stage==='open'&&<NestOpening forceDemo demoSpeed={2} enabled={ready} handleRef={handleRef} amount={amount} onChange={onChange} onDemoComplete={()=>{setStage('returning');onUnpack();}}/>}
  </>;
}
