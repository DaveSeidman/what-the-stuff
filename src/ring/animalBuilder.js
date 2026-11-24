import {model} from '../poster/sculpture';

export {animals} from './animals';
import {animals} from './animals';
const colors = {Turkey:'#b95d3b',Duck:'sun',Chicken:'cream',Tiger:'orange',Giraffe:'gold',Zebra:'white',Llama:'cream',Kangaroo:'#cb8544',
  Alligator:'pine',Crocodile:'#84994c',Chameleon:'#96b851',Iguana:'green',Tortoise:'#738c50',Lobster:'red',
  Crab:'orange',Octopus:'#ac5676',Salmon:'#76a59b',Ostrich:'plum',Penguin:'dark'};

const bellyRadius = 16;
const bellyY = 18;

function sculpt(name,{egg},features) {
  const fur=colors[name];
  function oval(x,y,z,rx,ry,rz,color=fur,tilt=0){
    // Pull high features toward the round torso while preserving the belly.
    if(y>28){
      const compact=name==='Ostrich'?.64:.80;
      y=28+(y-28)*compact;
      x=-8+(x+8)*compact;
      rx*=compact;ry*=compact;rz*=compact;
    }
    egg([x,y,z],[rx,ry,rz],color,[0,0,tilt]);
  }
  function eyes(x,y,z){
    const compact=y>28?(name==='Ostrich'?.64:.80):1;
    features.face={x:-8+(x+8)*compact,y:y>28?28+(y-28)*compact:y,z};
    for(const side of [-1,1]){
      oval(x,y,side*z,1.9,2.1,1.5,'dark');
      oval(x-.6,y+.65,side*(z+1.05),.6,.6,.5,'white');
    }
  }
  function paws(color=fur){
    for(const side of [-1,1]){
      oval(-6,4,side*8,5,4,4.6,color);
      oval(-7,18,side*13,4.4,6,3.6,fur,-20);
    }
  }
  oval(0,bellyY,0,bellyRadius,bellyRadius,bellyRadius);
  if(['Crab','Lobster','Octopus'].includes(name)){
    const octopus=name==='Octopus';
    for(let i=0;i<(octopus?8:6);i++){
      const angle=i*2*Math.PI/(octopus?8:6);
      oval(13*Math.cos(angle),6,13*Math.sin(angle),5,4,5);
    }
    if(!octopus) for(const side of [-1,1]){
      oval(-9,18,side*14,6,5,4);
      oval(-13,21,side*15,3,3,2.8);
    }
    if(name==='Lobster') oval(15,12,0,7,4,7,'flame');
    eyes(-12,25,8); return;
  }
  if(name==='Salmon'){
    for(const sign of [-1,1]) oval(16,18+sign*3,0,7,3.8,2.5,'pine',sign*30);
    for(const side of [-1,1]) oval(2,17,side*14,5,3,2.8,'#e8a182',18);
    oval(2,33,0,4,3,2.5,'pine'); eyes(-12,23,9); return;
  }
  if(['Turkey','Duck','Chicken','Penguin','Ostrich'].includes(name)){
    const headColor={Turkey:'flame',Duck:'green',Chicken:'white',Penguin:'dark',Ostrich:'#ebbe91'}[name];
    const y=name==='Ostrich'?35:32;
    if(name==='Ostrich') oval(-9,30,0,5,9,5,headColor,-10);
    const headX=name==='Penguin'?0:-10;
    oval(headX,y,0,9,9,8.5,headColor);
    oval(headX-8,y-1,0,name==='Duck'?7:4.6,3,name==='Duck'?5.7:3.6,'gold');
    eyes(headX-4.5,y+2,6.4);
    for(const side of [-1,1]){
      oval(-4,4,side*7,5.5,3.6,4,'gold');
      oval(1,20,side*14,7,5,3.5,name==='Penguin'?'dark':headColor,12);
    }
    if(name==='Turkey'){
      for(let i=-2;i<=2;i++) egg([13,25-Math.abs(i),i*4],[5,10,4.4],i%2?'orange':'gold',[i*18,0,-17],1);
      oval(-16,27,3,2.8,4.8,2.8,'red');
    }
    if(name==='Chicken') for(let i=-1;i<=1;i++) oval(-10+i*3.7,40-Math.abs(i),0,3,3.5,2.5,'red');
    if(name==='Penguin') oval(-10,18,0,7,11,10,'white');
    return;
  }
  if(name==='Chameleon'){
    paws();
    oval(-12,27,0,9,8,8);
    oval(-18,25,0,5,3.5,5,'#b5ce70');
    for(const side of [-1,1]){
      oval(-13,28,side*7,4.5,4.5,4.5,'#c9d88a');
    }
    eyes(-14,28,10);
    for(let i=0;i<4;i++) oval(-3+i*4,32,0,2.5,2.6,2.2,'#648e51');
    // A connected tapering coil remains part of the booleaned exterior.
    for(let i=0;i<=18;i++){
      const t=i/18,angle=-Math.PI*.65+t*Math.PI*2;
      const radius=7*(1-t*.68);
      oval(19+radius*Math.cos(angle),13+radius*Math.sin(angle),0,3-t*1.1,3-t*1.1,3-t*1.1);
    }
    return;
  }
  if(['Crocodile','Alligator','Iguana','Tortoise'].includes(name)){
    for(const x of [-8,8]) for(const z of [-9,9]) oval(x,5,z,4.8,3.7,4.8);
    oval(-13,21,0,8,7,7); eyes(-16,24,5.2);
    if(name==='Tortoise'){
      oval(2,24,0,14.6,11,14.5,'#98713e');
    } else {
      const croc=name==='Crocodile';
      oval(-20,19,0,croc?7:5,3.4,croc?4:5.6);
      if(['Alligator','Crocodile'].includes(name)){
        for(const side of [-1,1])for(let i=0;i<3;i++){
          oval(-23+i*3,17.8,side*(croc?3.5:5),.95,1.65,.9,'white',i%2?12:-12);
        }
      }
      oval(15,13,0,7,4,4,fur,12);
      for(let i=0;i<3;i++) oval(-3+i*5,33-i*.6,0,2.5,name==='Iguana'?4:2.2,2.3,'pine');
    }
    return;
  }
  const giraffe=name==='Giraffe',longEars=['Llama','Kangaroo'].includes(name);
  const y=giraffe?39:32;
  if(giraffe) oval(-9,31,0,5.7,9.5,5.7,fur,-12);
  oval(-10,y,0,10,9,9);
  oval(-17,y-2,0,5.5,4.5,6,name==='Zebra'?'dark':'cream');
  eyes(-14.6,y+1.7,7);
  paws();
  for(const side of [-1,1]){
    oval(-8,y+7,side*5,3.4,longEars?6.6:3.8,3.2);
    if(giraffe) oval(-12,y+9,side*3,2,3.2,2,'#986334');
    if(['Tiger','Giraffe'].includes(name)) for(let i=-1;i<=1;i++)
      oval(i*5,22+Math.abs(i),side*(15.3-Math.abs(i)*1.2),giraffe?3:1.6,giraffe?3:4.6,1.6,giraffe?'#a56632':'dark',-12);
  }
  oval(15,14,0,name==='Kangaroo'?8:5,4,4,fur,-12);
}

export function animalModel(name){
  const features={};
  const geometry=model(tools=>sculpt(name,tools,features),true);
  geometry.computeBoundingBox();
  const {min,max}=geometry.boundingBox;
  const scale=12/bellyRadius;
  geometry.userData.belly={x:-(min.x+max.x)*scale/2,y:(bellyY-min.y)*scale,radius:bellyRadius*scale};
  const face=features.face;
  geometry.userData.face={x:(face.x-(min.x+max.x)/2)*scale,y:(face.y-min.y)*scale,z:face.z*scale};
  geometry.translate(-(min.x+max.x)/2,-min.y,-(min.z+max.z)/2);
  geometry.scale(scale,scale,scale);
  return geometry;
}
