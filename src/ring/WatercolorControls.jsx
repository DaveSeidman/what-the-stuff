import React,{useEffect,useState} from 'react';

export const watercolorDefaults={
  enabled:true,spill:14,strength:.62,pooling:.21,paperScale:1,wetness:1,depthProtection:1
};
const sliders=[
  ['spill','Edge spill',0,32,1],
  ['strength','Pigment strength',0,1,.01],
  ['pooling','Edge pooling',0,.7,.01],
  ['paperScale','Paper texture scale',.25,3,.05],
  ['wetness','Wetness',0,2,.05],
  ['depthProtection','Overlap protection',0,2,.05]
];
export default function WatercolorControls({settings,onChange}){
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    function key(event){
      if(event.key==='F1'){
        event.preventDefault();
        if(!event.repeat)setOpen(value=>!value);
      }
      if(event.key==='Escape')setOpen(false);
    }
    window.addEventListener('keydown',key);
    return ()=>window.removeEventListener('keydown',key);
  },[]);
  if(!open)return null;
  function update(key,value){onChange({...settings,[key]:value});}
  return <aside className="watercolor-controls" aria-label="Watercolor controls">
    <div><h2>Watercolor</h2><button aria-label="Close watercolor controls" onClick={()=>setOpen(false)}>×</button></div>
    <label className="watercolor-enabled"><input type="checkbox" checked={settings.enabled} onChange={e=>update('enabled',e.target.checked)}/> Enable effect</label>
    {sliders.map(([key,label,min,max,step])=><label key={key}>
      <span>{label}<output>{Number(settings[key]).toFixed(step===1?0:2)}</output></span>
      <input aria-label={label} type="range" min={min} max={max} step={step} value={settings[key]}
        disabled={!settings.enabled} onChange={e=>update(key,Number(e.target.value))}/>
    </label>)}
    <button onClick={()=>onChange({...watercolorDefaults})}>Reset to current look</button>
    <small>F1 to toggle · Esc to close</small>
  </aside>;
}
