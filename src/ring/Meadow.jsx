import React,{useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,Float32BufferAttribute,DoubleSide} from 'three';
import {landscape} from '../poster/artwork';
import {model} from '../poster/sculpture';
import {printMaterial} from '../poster/printMaterial';

export const summit=-139;
export function ground(x,z){
  const r=Math.hypot(x,z);
  const roll=14*Math.sin(x*.009+z*.004)*Math.cos(z*.009)+9*Math.sin(z*.014+x*.003);
  const distance=Math.max(0,r-230);
  const distantRidges=(48*Math.sin(x*.004+z*.002)+36*Math.cos(z*.005-x*.002))*(1-Math.exp(-distance/170));
  return distantRidges-.24*distance*distance/(distance+80)+summit-36*(1-Math.exp(-Math.pow(r/175,2)))+roll*(1-Math.exp(-Math.pow(r/150,2)));
}
function grassPatch(){
  const positions=[];
  let seed=4817;
  function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
  for(let i=0;i<3700;i++){
    const angle=random()*Math.PI*2, r=Math.sqrt(random())*(i<1400?155:420);
    const x=r*Math.cos(angle), z=r*Math.sin(angle), y=ground(x,z)+.22;
    const bearing=random()*Math.PI*2, width=.18+random()*.55;
    const dx=Math.cos(bearing)*width,dz=Math.sin(bearing)*width;
    positions.push(x-dx,y,z-dz,x+dx,y,z+dz,x+random()*2.7-1,y+1.2+random()*3.9,z+random()*1.6-.8);
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.computeVertexNormals();return g;
}
function meadow(tools){
  const {add,egg}=tools;
  const vertices=[],indices=[];
  for(let r=0;r<=80;r++) for(let j=0;j<=96;j++){
    const radius=r<45?r*5.6:252+(r-45)*12;
    const a=j*Math.PI/48,x=Math.cos(a)*radius,z=Math.sin(a)*radius;
    vertices.push(x,ground(x,z),z);
    if(r&&j){const i=r*97+j;indices.push(i,i-1,i-98,i,i-98,i-97);}
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));
  g.setIndex(indices);g.computeVertexNormals();add(g,'#8ca65d');
  for(const [x,z,s] of [[-143,-81,1.05],[-164,-89,1.4],[173,-156,.8]]){
    for(let i=0;i<7;i++) egg([x+Math.sin(i*3)*6*s,ground(x,z)+(20+i%4*3)*s,z+(4+i%3)*s],[2*s,2.1*s,2*s],'red');
  }
}
export function Meadow({material}){
  const terrain=useMemo(()=>model(t=>{
    landscape(t,{ring:true, propHeight:(x,z)=>ground(x,z)});
    meadow(t);
  }),[]);
  const grass=useMemo(()=>model(({add})=>add(grassPatch(),'#b5bc72')),[]);
  const grassInk=useMemo(()=>{
    const ink=printMaterial();ink.side=DoubleSide;ink.uniforms.wind={value:0};
    ink.vertexShader='uniform float wind;\n'+ink.vertexShader.replace('vec4(position,1.)','vec4(position+vec3(float(gl_VertexID % 3 == 2)*1.5*sin(position.x*.027+position.z*.02+wind),0.,0.),1.)');
    return ink;
  },[]);
  const backdrop=useMemo(()=>{
    const ink=printMaterial();
    ink.uniforms.environment.value=1;
    ink.transparent=true;
    return ink;
  },[]);
  const leaf=useMemo(()=>model(({egg})=>egg([0,0,0],[2.3,.6,4],'orange')),[]);
  const leaves=useRef();
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    grassInk.uniforms.wind.value=t*1.8;
    leaves.current.children.forEach((obj,i)=>{
      const k=(t*.12+i*.129)%1;
      obj.position.set((i%2?115:-126)+18*Math.sin(t*.6+i)+k*19,-85-k*96,-70-i%4*18);
      obj.rotation.set(t*.9+i,t+i,t*.7+i);
    });
  });
  return <><mesh receiveShadow geometry={terrain} material={backdrop}/><mesh receiveShadow geometry={grass} material={grassInk}/>
    <group ref={leaves}>{Array.from({length:12},(_,i)=><mesh key={i} geometry={leaf} material={material}/>)}</group></>;
}
