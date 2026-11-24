import React,{useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,Float32BufferAttribute,DoubleSide} from 'three';
import {landscape,hillHeight} from '../poster/artwork';
import {model} from '../poster/sculpture';
import {printMaterial} from '../poster/printMaterial';

export const summit=-139;
export function ground(x,z){return summit-.0018*(x*x+z*z);}
function grassPatch(){
  const positions=[];
  for(let i=0;i<780;i++){
    const angle=i*2.39996, r=158*Math.sqrt(i/780), x=r*Math.cos(angle),z=r*Math.sin(angle);
    const y=ground(x,z)+.65;
    for(let j=0;j<3;j++) positions.push(x+j-1,y,z,x+j+.25,y,z,x+j*1.7,y+2.2+(i%5)*.4,z+.2);
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.computeVertexNormals();return g;
}
function meadow(tools){
  const {add,egg}=tools;
  const vertices=[],indices=[];
  for(let r=0;r<=32;r++) for(let j=0;j<=96;j++){
    const a=j*Math.PI/48,x=Math.cos(a)*r*5.6,z=Math.sin(a)*r*5.6;
    vertices.push(x,ground(x,z),z);
    if(r&&j){const i=r*97+j;indices.push(i,i-1,i-98,i,i-98,i-97);}
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));
  g.setIndex(indices);g.computeVertexNormals();add(g,'#8ca65d');
  for(const [x,z,s] of [[-143,-81,1.05],[-164,-89,1.4],[173,-156,.8]]){
    for(let i=0;i<7;i++) egg([x+Math.sin(i*3)*6*s,hillHeight(x,z)+(20+i%4*3)*s,z+(4+i%3)*s],[2*s,2.1*s,2*s],'red');
  }
}
export function Meadow({material}){
  const terrain=useMemo(()=>model(t=>{
    landscape(t,{ring:true});
    meadow(t);
  }),[]);
  const grass=useMemo(()=>model(({add})=>add(grassPatch(),'#b5bc72')),[]);
  const grassInk=useMemo(()=>{
    const ink=printMaterial();ink.side=DoubleSide;ink.uniforms.wind={value:0};
    ink.vertexShader='uniform float wind;\n'+ink.vertexShader.replace('vec4(position,1.)','vec4(position+vec3(float(gl_VertexID % 3 == 2)*1.5*sin(position.x*.027+position.z*.02+wind),0.,0.),1.)');
    return ink;
  },[]);
  const cloud=useMemo(()=>model(({egg})=>{
    egg([0,0,0],[23,6,8],'cream',undefined,4);egg([-6,4,0],[10,7,8],'white',undefined,4);egg([5,5,0],[9,9,8],'cream',undefined,4);
  }),[]);
  const leaf=useMemo(()=>model(({egg})=>egg([0,0,0],[2.3,.6,4],'orange')),[]);
  const clouds=useRef(),leaves=useRef();
  useFrame(({clock})=>{
    const t=clock.elapsedTime;
    grassInk.uniforms.wind.value=t*1.8;
    clouds.current.children.forEach((obj,i)=>obj.position.set(((t*2+i*220)%440)-220,-100+i*9,-135-i*12));
    leaves.current.children.forEach((obj,i)=>{
      const k=(t*.12+i*.129)%1;
      obj.position.set((i%2?115:-126)+18*Math.sin(t*.6+i)+k*19,-85-k*96,-70-i%4*18);
      obj.rotation.set(t*.9+i,t+i,t*.7+i);
    });
  });
  return <><mesh geometry={terrain} material={material}/><mesh geometry={grass} material={grassInk}/>
    <group ref={clouds}>{[0,1].map(i=><mesh key={i} geometry={cloud} material={material}/>)}</group>
    <group ref={leaves}>{Array.from({length:12},(_,i)=><mesh key={i} geometry={leaf} material={material}/>)}</group></>;
}
