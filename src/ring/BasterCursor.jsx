import React,{useEffect,useRef,useState} from 'react';

export default function BasterCursor(){
  const cursor=useRef();
  const [visible,setVisible]=useState(false),[pressed,setPressed]=useState(false),[squirts,setSquirts]=useState([]);
  useEffect(()=>{
    const media=window.matchMedia('(hover: hover) and (pointer: fine)');
    const timers=new Set();
    function move(event){
      if(!media.matches||event.pointerType!=='mouse'){setVisible(false);return;}
      setVisible(true);
      if(cursor.current)cursor.current.style.transform=`translate3d(${event.clientX-1}px,${event.clientY-1}px,0)`;
    }
    function press(event){
      move(event);
      if(!media.matches||event.pointerType!=='mouse')return;
      setPressed(true);
      const id=performance.now();
      setSquirts(old=>[...old.slice(-5),{id,x:event.clientX,y:event.clientY}]);
      const timer=setTimeout(()=>{setSquirts(old=>old.filter(s=>s.id!==id));timers.delete(timer);},650);
      timers.add(timer);
    }
    function release(){setPressed(false);}
    function leave(){setVisible(false);release();}
    window.addEventListener('pointermove',move,true);
    window.addEventListener('pointerdown',press,true);
    window.addEventListener('pointerup',release,true);
    window.addEventListener('blur',leave);
    document.addEventListener('pointerleave',leave);
    return ()=>{
      window.removeEventListener('pointermove',move,true);window.removeEventListener('pointerdown',press,true);
      window.removeEventListener('pointerup',release,true);window.removeEventListener('blur',leave);
      document.removeEventListener('pointerleave',leave);timers.forEach(clearTimeout);
    };
  },[]);
  return <div className="gravy-effects" aria-hidden="true">
    <div ref={cursor} className="baster-cursor" style={{visibility:visible?'visible':'hidden'}}>
      <BasterIcon pressed={pressed}/>
    </div>
    {squirts.map(s=><div className="gravy-squirt" key={s.id} style={{left:s.x,top:s.y}}>
      {[0,1,2,3].map(i=><i key={i} style={{'--dx':(-12-i*4)+'px','--dy':(-20-i*9)+'px','--delay':i*12+'ms'}}/>)}
    </div>)}
  </div>;
}

export function BasterIcon({pressed=false}){
  return (<svg width="22" height="30" viewBox="0 0 22 30">
        <g transform="translate(1 1) rotate(-25)" stroke="#533a29" strokeWidth="1" strokeLinejoin="round">
          <path d="M0 0 2 8 2.8 18-2.8 18-2 8Z" fill="#e6e1bf"/>
          <path d="M-.9 8-.9 16" fill="none" stroke="#fff6db"/>
          <path d="M-1.8 11 1.8 11 2 17-2 17Z" fill="#ac7037" stroke="none"/>
          <path d="M-3.3 17H3.3V19.2H-3.3Z" fill="#c0a775"/>
          <g transform={pressed?'translate(0 19) scale(1.13 .65) translate(0 -19)':undefined}>
            <path d="M-2.7 19C-6 20-6.2 25-3.6 27Q0 29 3.6 27C6.2 25 6 20 2.7 19Z" fill="#9f492b"/>
            <path d="M-3.2 21Q-4.2 23-2.6 25" stroke="#e39762" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
          </g>
        </g>
      </svg>);
}
