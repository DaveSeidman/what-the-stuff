import React,{useLayoutEffect,useRef} from 'react';

// Measure at the responsive CSS size, then shrink only when the name overflows.
export default function FittedName({children}){
  const heading=useRef(null);
  useLayoutEffect(()=>{
    const element=heading.current;
    let disposed=false;
    function fit(){
      if(disposed)return;
      element.style.removeProperty('font-size');
      const base=parseFloat(getComputedStyle(element).fontSize);
      const available=element.clientWidth;
      const width=element.firstElementChild.getBoundingClientRect().width;
      if(width>available&&available>0)element.style.fontSize=`${base*available/width}px`;
    }
    const observer=new ResizeObserver(fit);
    observer.observe(element.parentElement);
    fit();
    document.fonts?.ready.then(fit);
    return ()=>{disposed=true;observer.disconnect();};
  },[children]);
  return <h1 className="fitted-name" ref={heading}><span>{children}</span></h1>;
}
