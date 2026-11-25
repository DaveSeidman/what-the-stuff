import React,{useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import {BufferGeometry,Float32BufferAttribute,DoubleSide,Shape,ShapeGeometry,Vector3,CatmullRomCurve3,TubeGeometry} from 'three';
import {landscape} from '../poster/artwork';
import {model} from '../poster/sculpture';
import {animals} from './animals';
import {printMaterial} from '../poster/printMaterial';

export const summit=-139;
export function ground(x,z){
  const r=Math.hypot(x,z);
  const t=Math.max(0,Math.min(1,(r-145)/100));
  const blend=t*t*(3-2*t);
  const roll=14*Math.sin(x*.009+z*.004)*Math.cos(z*.009)+9*Math.sin(z*.014+x*.003);
  return summit+blend*(-25+roll);

}
function grassPatch(){
  const positions=[];
  let seed=4817;
  function random(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;}
  for(let i=0;i<3700;i++){
    const angle=random()*Math.PI*2, r=Math.sqrt(random())*(i<1400?155:420);
    const x=r*Math.cos(angle), z=r*Math.sin(angle), y=ground(x,z)+.22;
    let bare=false;
    for(let j=0;j<animals.length;j++){
      const a=j*2*Math.PI/animals.length+.08;
      if(Math.hypot(x-120*Math.cos(a),z-120*Math.sin(a))<13){bare=true;break;}
    }
    if(bare)continue;
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
    const radius=r<45?r*5.6:252+(r-45)*46;
    const a=j*Math.PI/48,x=Math.cos(a)*radius,z=Math.sin(a)*radius;
    vertices.push(x,ground(x,z),z);
    if(r&&j){const i=r*97+j;indices.push(i,i-1,i-98,i,i-98,i-97);}
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(vertices,3));
  g.setIndex(indices);g.computeVertexNormals();add(g,'#8ca65d');
  for(let spot=0;spot<animals.length;spot++){
    const a=spot*2*Math.PI/animals.length+.08,x=120*Math.cos(a),z=120*Math.sin(a);
    const points=[x,ground(x,z)+.08,z],triangles=[];
    for(let j=0;j<=40;j++){
      const angle=j*Math.PI/20,r=12.3+.8*Math.sin(j*2.1+spot);
      points.push(x+r*Math.cos(angle),ground(x,z)+.08,z+r*Math.sin(angle));
      if(j)triangles.push(0,j+1,j);
    }
    const patch=new BufferGeometry();
    patch.setAttribute('position',new Float32BufferAttribute(points,3));patch.setIndex(triangles);patch.computeVertexNormals();
    add(patch,spot%2?'#ac9871':'#a28d68');
  }
  for(const [x,z,s] of [[-143,-81,1.05],[-164,-89,1.4],[173,-156,.8]]){
    for(let i=0;i<7;i++) egg([x*1.35+Math.sin(i*3)*6*s,ground(x*1.35,z*1.35)+(20+i%4*3)*s,z*1.35+(4+i%3)*s],[2*s,2.1*s,2*s],'red');
  }
}
function autumnLeaf(color){
  return model(({add})=>{
    const outline=[[0,-4],[.4,-2.8],[1.4,-3.1],[1.3,-1.7],[3,-2],[2.2,-.6],[3.6,.1],[2,1],[2.2,2.6],[.8,2],[0,4],[-.8,2],[-2.2,2.6],[-2,1],[-3.6,.1],[-2.2,-.6],[-3,-2],[-1.3,-1.7],[-1.4,-3.1],[-.4,-2.8]];
    const curve=(x,z)=>.12*x*x+.65*Math.sin(z*.6);
    const shape=new Shape();outline.forEach(([x,z],i)=>i?shape.lineTo(x,z):shape.moveTo(x,z));shape.closePath();
    const g=new ShapeGeometry(shape),positions=g.attributes.position;
    for(let i=0;i<positions.count;i++){
      const x=positions.getX(i),z=positions.getY(i);
      positions.setXYZ(i,x,curve(x,z),z);
    }
    g.computeVertexNormals();add(g,color);
    function vein(points,radius){
      const path=new CatmullRomCurve3(points.map(([x,z])=>new Vector3(x,curve(x,z)+.035,z)));
      add(new TubeGeometry(path,12,radius,4,false),'#92582d');
    }
    vein([[0,-4.7],[0,-2],[0,0],[0,2],[0,3.7]],.045);
    for(const side of [-1,1])for(const [x,z] of [[2.7,-1.8],[3.1,.2],[1.9,2.2]])vein([[0,z-1.4],[side*x*.5,z-.5],[side*x,z]],.025);
  });
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
  const leaf=useMemo(()=>['orange','gold','red'].map(autumnLeaf),[]);
  const leafInk=useMemo(()=>{const ink=printMaterial();ink.side=DoubleSide;return ink;},[]);
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
    <group ref={leaves}>{Array.from({length:12},(_,i)=><mesh key={i} geometry={leaf[i%leaf.length]} material={leafInk}/>)}</group></>;
}
