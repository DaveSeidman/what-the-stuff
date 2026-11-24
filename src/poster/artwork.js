import { BufferGeometry, Float32BufferAttribute, SphereGeometry } from 'three';

export function hillHeight(x,z) {
  return -180 + 11*Math.sin(x*.009+z*.009) + 6*Math.cos(x*.018-z*.013) - (z+180)*.07;
}

// Continuous rolling ground. Crop rows follow the height field, converging on
// the barn in world space, so the landscape also holds up during a camera turn.
function fieldStrip(left,right,near,far,row=false) {
  const p=[],idx=[],rows=40,cols=row?5:180;
  for(let j=0;j<=rows;j++) for(let i=0;i<=cols;i++){
    const t=j/rows,z=near+(far-near)*t;
    let x=left+(right-left)*i/cols;
    if(row) x=x*(1-.93*t)+120*.93*t+Math.sin(t*Math.PI)*27;
    p.push(x,hillHeight(x,z)+(row?1.5:0),z);
    if(i<cols && j<rows){const a=j*(cols+1)+i;idx.push(a,a+1,a+cols+1,a+1,a+cols+2,a+cols+1);}
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();return g;
}

export function landscape({egg,box,cone,add},{ring=false,propHeight=hillHeight}={}) {
  if(!ring){
  const sky = new SphereGeometry(ring?7000:1050,48,32);
  // The camera sees the printed inner surface of the sky dome.
  const indices = sky.index.array;
  for(let i=0;i<indices.length;i+=3) [indices[i],indices[i+1]]=[indices[i+1],indices[i]];
  add(sky,'sky',[0,0,0],[1,1,1],[0,0,0],5);
  }
  if(!ring){
  const sun=ring ? [250,-200,-740,38] : [74,118,-285,54];
  const [sx,sy,sz,radius]=sun;
  egg([sx,sy,sz],[radius,radius,radius],'sun',undefined,3);
  for(let i=0;i<10;i++){
    const a=i*Math.PI/5;
    egg([sx+radius*1.22*Math.sin(a),sy+radius*1.22*Math.cos(a),sz],[.85,(7+i%3)*radius/54,.9],'cream',[0,0,-a*180/Math.PI],4);
  }
  for(const [x,y,z,s] of [[-165,135,-260,1],[215,93,-270,.7],[-310,38,-240,.8]]){
    egg([x,y,z],[43*s,6*s,9*s],'cream',undefined,4);
    egg([x-9*s,y+5*s,z],[17*s,8*s,10*s],'cream',undefined,4);
    egg([x+7*s,y+6*s,z],[15*s,11*s,9*s],'cream',undefined,4);
  }
  }
  if(!ring){
  egg([-230,ring?-231:-189,ring?-208:-355],[360,79,101],'mist');
  egg([212,ring?-237:-181,ring?-212:-300],[223,74,98],'tide');
  egg([-131,ring?-223:-183,ring?-209:-270],[210,49,68],'green');
  add(fieldStrip(-900,900,430,-260),'field');
  for(let i=-14;i<15;i++){
    add(fieldStrip(i*53,i*53+22,430,-200,true),['pine','gold','cream','orange'][((i%4)+4)%4]);
  }
  }
  function tree(x,z,s,c){
    if(ring && s>=.8){x*=1.35;z*=1.35;}
    const y=propHeight(x,z);
    cone([x,y+10*s,z],1.2*s,2.2*s,22*s,'dark');
    egg([x,y+23*s,z],[8*s,14*s,7*s],c,[0,0,-5]);
    egg([x-5*s,y+17*s,z+1],[6*s,8*s,5*s],c,[0,0,19]);
  }
  for(let i=0;i<15;i++) tree(-86+i*12,-206+Math.sin(i)*12,.36+(i%4)*.12,'pine');
  tree(-143,-81,1.05,'orange');tree(-164,-89,1.4,'red');tree(-187,-92,.94,'gold');
  tree(173,-156,.8,'green');tree(183,-160,.65,'pine');
  const x=ring?492:123,z=ring?-616:-154,y=propHeight(x,z),size=ring?10:1;
  const barnBox=(offset,dimensions,color,rotation)=>box(
    [x+offset[0]*size,y+offset[1]*size,z+offset[2]*size],
    dimensions.map(value=>value*size),color,rotation);
  const barnCone=(offset,top,bottom,height,color)=>cone(
    [x+offset[0]*size,y+offset[1]*size,z+offset[2]*size],
    top*size,bottom*size,height*size,color);
  barnBox([0,8,0],[25,16,17],'red'); barnBox([-5,4,9],[6,8,1],'cream');
  barnBox([7,9,9],[4,4,1],'plum');
  barnBox([-6.5,19,0],[16,2,21],'wine',[0,0,30]);
  barnBox([6.5,19,0],[16,2,21],'plum',[0,0,-30]);
  barnCone([23,13,-4],4,4.5,26,'red');
  barnCone([23,29,-4],.2,5.2,7,'dark');
}

// Feet are modeled in pairs so the perches read from either side.
function perchFeet(egg, x, y, spread, size) {
  for (const side of [-1,1]) {
    const z=side*spread;
    egg([x,y+5*size,z],[2.5*size,7*size,2.5*size],'orange');
    egg([x-3*size,y,z],[8*size,2.5*size,4*size],'gold',[0,side*12,0]);
  }
}

function eyes(egg, x,y,z,r) {
  for (const side of [-1,1]) {
    egg([x,y,side*z],[r,r*1.13,r*.54],'white');
    egg([x-r*.24,y+r*.08,side*(z+r*.40)],[r*.56,r*.67,r*.29],'dark');
    egg([x-r*.38,y+r*.32,side*(z+r*.63)],[r*.17,r*.19,r*.1],'white');
  }
}

export function turkey({egg,tube}) {
  // Sweep the fan behind the rump, leaving the saddle of the back clear.
  for(let i=0;i<10;i++) {
    const angle=(12+i*7.6)*Math.PI/180;
    const length=94+12*Math.sin(i*Math.PI/9);
    egg([69+Math.sin(angle)*length*.48,-83+Math.cos(angle)*length*.48,-15-i*.5],
      [16,length*.59,7],'gold',[8,i-5,-angle*180/Math.PI],1);
  }
  egg([0,-77,0],[92,64,55],'red',[0,0,-4],2);
  tube([[-54,-97,0,18,20],[-62,-73,0,32,33],[-70,-47,0,27,26],
    [-78,-19,0,20,18],[-83,6,0,16,16],[-82,26,0,15,15]],'flame');
  egg([-84,29,0],[26,27,23],'flame',[0,0,-10],2);
  tube([[-127,22,0,.4,.8],[-121,26,0,4,6],[-109,29,0,7,10],[-99,29,0,8,11],[-95,27,0,4,7]],'gold','x');
  egg([-100,6,8],[8,20,8],'wine',[0,0,-17]);
  egg([-103,9,11],[6,17,6],'flame',[0,0,-16]);
  eyes(egg,-94,35,18,8);
  for(const side of [-1,1]){
    egg([6,-74,side*44],[52,27,14],'wine',[0,side*-8,9],2);
    for(let i=0;i<3;i++) egg([13+i*5,-87+i*10,side*(49+i*2)],
      [36-i*2,8,7],['red','flame','orange'][i],[0,side*-9,12+i*2],2);
  }
  for(const [x,z] of [[-34,13],[29,-10]]) {
    const y=hillHeight(x,z);
    egg([x,-131,z],[12,18,12],'wine');
    tube([[x-2,y+2,z,3,3],[x,y+15,z,3,3],[x,-141,z,4,4],[x,-128,z,5,5]],'orange');
    egg([x-5,y+2,z+4],[10,3,5],'gold',[0,18,0]);
    egg([x-2,y+2,z+7],[3,2.5,11],'orange',[0,-18,0]);
  }
}

export function duck({egg,tube}) {
  perchFeet(egg,3,0,15,1.05);
  egg([3,28,0],[56,28,28],'sun',[0,0,-3],2);
  for(let i=0;i<3;i++) egg([48+i*2,39+i*3,-5+i*4],[21,6.5,5],'cream',[0,0,23+i*7],2);
  egg([-30,47,0],[16,23,16],'green',[0,0,8]);
  egg([-32,37,0],[17,5.2,16.6],'cream',[0,0,8]);
  egg([-36,66,0],[23,22,21],'green',[0,0,-7],2);
  tube([[-78,57,0,1,3],[-74,59,0,3.8,9],[-60,60,0,5,12],[-50,62,0,6,12],[-47,62,0,3,7]],'gold','x');
  eyes(egg,-45,69,16,5.6);
  for(const side of [-1,1]){
    egg([10,28,side*22],[32,14,9],'orange',[0,0,10],2);
    egg([17,29,side*27],[21,7,5],'pine',[0,0,14],2);
    egg([23,31,side*29],[14,3.3,3],'cream',[0,0,16]);
  }
}

export function chicken({egg,tube}) {
  perchFeet(egg,1,0,9,.70);
  egg([3,23,0],[32,21,20],'cream',[0,0,-5],2);
  for(let i=0;i<3;i++) egg([27+i*3,33+i*2,-4+i*4],[7,17-i,5],'sun',[5,0,-35+i*9]);
  egg([-15,40,0],[12,18,13],'cream',[0,0,12]);
  egg([-20,51,0],[16,16,15],'white');
  for(let i=0;i<3;i++) egg([-28+i*7,64+(i===1?3:0),0],[5,7,4.5],'red',[0,0,-12+i*14]);
  egg([-29,40,5],[4,7,4],'red');
  tube([[-45,49,0,.4,.5],[-39,50,0,3,4],[-32,51,0,5,5],[-30,51,0,2,3]],'gold','x');
  eyes(egg,-26,54,12,3.8);
  for(const side of [-1,1]) egg([6,24,side*16],[17,10,5],'sun',[0,0,15],2);
}
