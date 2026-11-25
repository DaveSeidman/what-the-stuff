import React,{useMemo} from 'react';
import {DoubleSide,FrontSide,BackSide,MeshDepthMaterial,Vector3,SphereGeometry,RingGeometry} from 'three';
import {useFrame} from '@react-three/fiber';
import {model} from '../poster/sculpture';
import {tuckUniforms,tuckVertex} from './tuck';
import {printMaterial} from '../poster/printMaterial';

export function shellFor(geometry){
  geometry.computeBoundingBox();
  const height=geometry.boundingBox.max.y;
  const {x,y:seam,radius}=geometry.userData.belly;
    const wall=.65;
  const lining=model(({add})=>add(new SphereGeometry(radius-wall,32,24),'#f4dfb2',[x,seam,0]));
  const rim=model(({add})=>add(new RingGeometry(radius-wall,radius,48),'#e6d2b0',[x,seam,0],[1,1,1],[-90,0,0]));
  return {seam,height,x,width:radius,depth:radius,lining,rim};
}
function slicedInk(shell,upper,surface=0){
  const ink=printMaterial();
  ink.vertexShader=tuckVertex(ink.vertexShader);
  Object.assign(ink.uniforms,tuckUniforms(shell));
  ink.side=FrontSide;
  ink.uniforms.surface.value=surface;
  ink.uniforms.bodyCenter={value:new Vector3(shell.x,shell.seam,0)};
  ink.uniforms.cutHeight={value:shell.seam};
  ink.fragmentShader='uniform float cutHeight;\n'+ink.fragmentShader.replace('vec3 n=normalize(vNormal);',
    'if (vPoint.y '+(upper?' < ':' >= ')+'cutHeight) discard;\nvec3 n=normalize(vNormal);')
    .replace('gl_FragColor=vec4(pigment,1.);',`
      if (!gl_FrontFacing) {
        float nap=noise(p*3.4);
        pigment=mix(ink,butter,.48+.22*nap)*(.66+.24*abs(n.z));
      }
      gl_FragColor=vec4(pigment,1.);
    `);
  return ink;
}
// The shadow pass must cut the same local-space seam as the painted surface.
function slicedDepth(shell,upper,tuck){
  const depth=new MeshDepthMaterial({side:DoubleSide});
  depth.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,tuck);
    shader.vertexShader=tuckVertex(shader.vertexShader);
    shader.uniforms.cutHeight={value:shell.seam};
    shader.vertexShader='varying float dollY;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n dollY=position.y;');
    shader.fragmentShader='varying float dollY; uniform float cutHeight;\n'+shader.fragmentShader.replace('void main() {',
      'void main() { if(dollY '+(upper?' < ':' >= ')+'cutHeight) discard;');
  };
  depth.customProgramCacheKey=()=>upper?'doll-lid':'doll-base';
  return depth;
}
function surfaceFor(name){
  if(['Turkey','Duck','Chicken','Ostrich','Penguin'].includes(name))return 1;
  if(name==='Chameleon')return 3;
  if(name==='Tortoise')return 6;
  if(name==='Zebra')return 7;
  if(['Alligator','Crocodile','Iguana','Salmon'].includes(name))return 2;
  if(name==='Lobster')return 8;
  if(name==='Crab')return 4;
  return 5;
}
export function Doll({geometry,shell,lidRef,impact=0,name,tuck}){
  const halves=useMemo(()=>[slicedInk(shell,false,surfaceFor(name)),slicedInk(shell,true,surfaceFor(name))],[shell,name]);
  const linings=useMemo(()=>[false,true].map(upper=>{
    const ink=slicedInk(shell,upper);ink.side=BackSide;return ink;
  }),[shell]);
  const rimInk=useMemo(()=>{const ink=printMaterial();ink.side=DoubleSide;return ink;},[]);
  const depths=useMemo(()=>[slicedDepth(shell,false,halves[0].uniforms),slicedDepth(shell,true,halves[1].uniforms)],[shell]);
  React.useEffect(()=>()=>{[...halves,...linings,...depths,rimInk].forEach(m=>m.dispose());},[halves,linings,depths,rimInk]);
  const body=React.useRef(), spring=React.useRef({compression:0,velocity:0});
  React.useLayoutEffect(()=>{
    if(impact) spring.current.velocity+=1.65;
  },[impact]);
  useFrame(({clock},delta)=>{
    halves.forEach(material=>{
      material.uniforms.clockTime.value=clock.elapsedTime;
      material.uniforms.tuckAmount.value=tuck?.amount||0;
      material.uniforms.tuckRadius.value=tuck?.radius||1000;
    });
    const state=spring.current;
    if(!body.current || Math.abs(state.velocity)+Math.abs(state.compression)<.0001)return;
    const dt=Math.min(delta,.06)/6;
    for(let step=0;step<6;step++){
      state.velocity+=(-145*state.compression-9*state.velocity)*dt;
      state.compression+=state.velocity*dt;
    }
    const height=1-state.compression;
    body.current.scale.set(1/Math.sqrt(height),height,1/Math.sqrt(height));
  });
  return <group ref={body}>
    <mesh castShadow receiveShadow customDepthMaterial={depths[0]} geometry={geometry} material={halves[0]}/>
    <mesh geometry={shell.lining} material={linings[0]}/>
    <mesh geometry={shell.rim} material={rimInk}/>
    <group name="doll-top" ref={lidRef}>
      <mesh geometry={shell.lining} material={linings[1]}/>
      <mesh geometry={shell.rim} material={rimInk}/>
      <mesh castShadow receiveShadow customDepthMaterial={depths[1]} geometry={geometry} material={halves[1]}/></group>
  </group>;
}

// Equal base bellies grow by a fixed amount for every layer they enclose.
export function nestingPlaces(stack,models,shells,animals){
  const radius=12;
  const outerScale=1+Math.max(0,stack.length-1)*.4;
  const centerY=stack.length?shells[animals.indexOf(stack[0])].seam*outerScale:0;
  return stack.map((name,i)=>{
    const index=animals.indexOf(name),shell=shells[index];
    const scale=(radius+(stack.length-1-i)*4.8)/radius;
    return {index,scale,x:-shell.x*scale,y:centerY-shell.seam*scale};
  });
}


// At full separation, bottoms rise outermost-to-innermost, then lids return
// innermost-to-outermost, leaving visible air between every pair.
export function explodedOffsets(places,shells){
  const bottoms=[],tops=[];
  let seam=0;
  for(let i=0;i<places.length;i++){
    const shell=shells[places[i].index],scale=places[i].scale;
    if(i)seam+=shell.seam*scale+6;
    bottoms[i]=seam;
  }
  seam+=8;
  for(let i=places.length-1;i>=0;i--){
    tops[i]=seam;
    seam+=(shells[places[i].index].height-shells[places[i].index].seam)*places[i].scale+6;
  }
  return {bottoms,tops,height:seam};
}
