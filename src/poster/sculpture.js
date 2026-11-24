import {
  BufferGeometry, Color, Euler, Float32BufferAttribute, Matrix4,
  Quaternion, SphereGeometry, Vector3, BoxGeometry, CylinderGeometry,
} from 'three';
import { Brush, Evaluator, ADDITION } from 'three-bvh-csg';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const palette = {
  sky:'#278e94', tide:'#176e73', mist:'#a6c7a1', cream:'#ffe7a4', white:'#fff2c9',
  sun:'#ffc347', gold:'#ffa929', orange:'#ed7b27', red:'#cf432b', flame:'#ed5931',
  wine:'#863634', plum:'#583138', dark:'#293f38', green:'#718348', pine:'#425f49', field:'#c1ad59',
};
const vec = a => new Vector3(...a);
const rad = Math.PI / 180;

// Sample a closed cross-section along a curved spine. Used for necks, wattles,
// tapered bills and shafts; every cross-section has genuine width and depth.
function loft(stations, axis) {
  const position=[], index=[];
  const sides=36;
  for (const [x,y,z,a,b] of stations) {
    for(let i=0;i<sides;i++){
      const t=i*2*Math.PI/sides, u=a*Math.cos(t), v=b*Math.sin(t);
      position.push(x+(axis==='y'?u:0),y+(axis==='x'?u:0),z+v);
    }
  }
  for(let j=1;j<stations.length;j++) for(let i=0;i<sides;i++){
    const a=(j-1)*sides+i,b=(j-1)*sides+(i+1)%sides;
    if(axis==='y') index.push(a,a+sides,b,b,a+sides,b+sides);
    else index.push(a,b,a+sides,b,b+sides,a+sides);
  }
  const g=new BufferGeometry();
  g.setAttribute('position',new Float32BufferAttribute(position,3));
  g.setIndex(index); g.computeVertexNormals(); return g;
}

export function model(draw, union=false) {
  const parts=[];
  function add(geometry,color,at=[0,0,0],scale=[1,1,1],rotation=[0,0,0],paint=0) {
    const g=geometry;
    g.deleteAttribute('uv');
    const pos=g.attributes.position, ink=[], local=[], kind=[];
    g.computeBoundingBox();
    const center=g.boundingBox.getCenter(new Vector3()), size=g.boundingBox.getSize(new Vector3());
    const c=new Color(palette[color] || color);
    for(let i=0;i<pos.count;i++){
      ink.push(c.r,c.g,c.b);
      local.push((pos.getX(i)-center.x)/Math.max(size.x*.5,.001),(pos.getY(i)-center.y)/Math.max(size.y*.5,.001),(pos.getZ(i)-center.z)/Math.max(size.z*.5,.001));
      kind.push(paint);
    }
    g.setAttribute('ink',new Float32BufferAttribute(ink,3));
    g.setAttribute('localPoint',new Float32BufferAttribute(local,3));
    g.setAttribute('paintType',new Float32BufferAttribute(kind,1));
    g.applyMatrix4(new Matrix4().compose(vec(at),new Quaternion().setFromEuler(new Euler(...rotation.map(a=>a*rad))),vec(scale)));
    parts.push(g);
  }
  const egg=(at,scale,color,rotation=[0,0,0],paint=0)=>add(new SphereGeometry(1,32,24),color,at,scale,rotation,paint);
  const box=(at,scale,color,rotation)=>add(new BoxGeometry(),color,at,scale,rotation);
  const cone=(at,top,bottom,height,color,sides=24,rotation)=>add(new CylinderGeometry(top,bottom,height,sides),color,at,[1,1,1],rotation);
  const tube=(stations,color,axis='y')=>add(loft(stations,axis),color);
  draw({egg,box,cone,tube,add});
  if(union){
    const evaluator=new Evaluator();
    evaluator.attributes=['position','normal','ink','localPoint','paintType'];
    evaluator.useGroups=false;
    let result=new Brush(parts[0]);
    result.updateMatrixWorld();
    for(const geometry of parts.slice(1)){
      const next=new Brush(geometry);
      next.updateMatrixWorld();
      const previous=result;
      result=evaluator.evaluate(previous,next,ADDITION);
      result.updateMatrixWorld();
      if(!parts.includes(previous.geometry))previous.geometry.dispose();
    }
    const geometry=result.geometry;
    parts.forEach(part=>{if(part!==geometry)part.dispose();});
    return geometry;
  }
  const merged=mergeGeometries(parts); parts.forEach(g=>g.dispose());return merged;
}
