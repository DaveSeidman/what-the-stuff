import React,{useEffect,useRef,useState} from 'react';
import {BasterIcon} from './BasterCursor';
import {dragOpening,stepOpeningFall} from './openingPhysics';

// The transparent handle tracks the outer doll; pointer capture keeps a drag
// independent of its changing screen position and of the camera orbit controls.
export default function NestOpening({enabled,amount,onChange,handleRef,forceDemo=false,onDemoComplete,demoSpeed=1}){
  const value=useRef(amount),frame=useRef(0),drag=useRef(null),fake=useRef(null);
  const [demo,setDemo]=useState(false),[pressed,setPressed]=useState(false);
  const [hint,setHint]=useState('Drag up to open');
  const demoShown=useRef(false),completion=useRef(onDemoComplete);
  completion.current=onDemoComplete;
  value.current=amount;
  const reduced=useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function cancel(){cancelAnimationFrame(frame.current);frame.current=0;}
  function update(next){value.current=next;onChange(next);}
  function finishDemo(){setDemo(false);document.body.removeAttribute('data-nest-demo');}
  function fall(){
    cancel();setPressed(false);
    if(reduced.current){update(0);finishDemo();return;}
    let state={height:value.current,velocity:0,bounces:0},last=performance.now();
    function tick(now){
      state=stepOpeningFall(state,(now-last)/1000);last=now;
      update(state.height);
      if(state.done){finishDemo();frame.current=0;if(forceDemo)completion.current?.();return;}
      frame.current=requestAnimationFrame(tick);
    }
    frame.current=requestAnimationFrame(tick);
  }
  useEffect(()=>{
    if(!enabled){cancel();drag.current=null;setPressed(false);finishDemo();return;}
    let seen=false;
    try{seen=sessionStorage.getItem('nest-opening-demo')==='seen';}catch{}
    if(forceDemo&&reduced.current){
      update(.45);
      const timer=setTimeout(()=>{update(0);completion.current?.();},1800/demoSpeed);
      return ()=>{clearTimeout(timer);finishDemo();};
    }
    if(!forceDemo&&(demoShown.current||seen||reduced.current))return;
    const timer=setTimeout(()=>{
      const rect=handleRef.current?.getBoundingClientRect();
      if(!rect||drag.current)return;
      demoShown.current=true;
      try{sessionStorage.setItem('nest-opening-demo','seen');}catch{}
      cancel();setDemo(true);setHint('Drag up to open');
      document.body.setAttribute('data-nest-demo','');
      const x=rect.left+rect.width*.52,y=rect.top+rect.height*.35;
      const distance=Math.min(150,window.innerHeight*.22);
      const start=performance.now();
      function tick(now){
        const t=(now-start)/1000*demoSpeed;
        const progress=Math.max(0,Math.min(1,(t-.45)/1.1));
        const eased=progress*progress*(3-2*progress);
        if(fake.current)fake.current.style.transform=`translate(${x}px,${y-distance*eased}px)`;
        setPressed(t>.45&&t<1.85);
        update(eased*.78);
        if(t<1.85)frame.current=requestAnimationFrame(tick);
        else{setHint('Release to close');fall();}
      }
      frame.current=requestAnimationFrame(tick);
    },650/demoSpeed);
    return ()=>{clearTimeout(timer);cancel();drag.current=null;finishDemo();};
  },[enabled,forceDemo,demoSpeed]);
  useEffect(()=>()=>{cancel();document.body.removeAttribute('data-nest-demo');},[]);
  function start(event){
    if(!enabled||forceDemo||event.button!==0)return;
    event.preventDefault();cancel();finishDemo();
    drag.current={id:event.pointerId,y:event.clientY,initial:value.current,
      distance:Math.max(100,Math.min(220,window.innerHeight*.28))};
    event.currentTarget.setPointerCapture(event.pointerId);
    setPressed(true);
  }
  function move(event){
    const active=drag.current;
    if(!active||active.id!==event.pointerId)return;
    event.preventDefault();
    update(dragOpening(active.initial,active.y,event.clientY,active.distance));
  }
  function release(event){
    if(!drag.current||drag.current.id!==event.pointerId)return;
    drag.current=null;fall();
  }
  function key(event){
    if(forceDemo)return;
    if(!['ArrowUp','ArrowDown',' ','Enter','Escape'].includes(event.key))return;
    event.preventDefault();cancel();finishDemo();
    if(event.key==='ArrowUp')update(Math.min(1,value.current+.15));
    else if(event.key==='ArrowDown')update(Math.max(0,value.current-.15));
    else if(event.key==='Escape')fall();
    else update(Math.max(.65,value.current));
  }
  return <>
    {enabled&&<button className="nest-open-handle" ref={handleRef} aria-label="Drag up to open nested animals; release to close" aria-pressed={amount>.01}
      onPointerDown={start} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
      onKeyDown={key} onKeyUp={event=>{if(['ArrowUp','ArrowDown',' ','Enter'].includes(event.key))fall();}}
      onBlur={()=>{if(!demo&&!drag.current&&value.current>0)fall();}}/>}
    {demo&&<div className="nest-opening-demo" aria-hidden="true"><div className="demo-baster" ref={fake}><BasterIcon pressed={pressed}/><span>{hint}</span></div></div>}
  </>;
}
