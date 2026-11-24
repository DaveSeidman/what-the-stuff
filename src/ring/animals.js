import {model} from '../poster/sculpture';
import {turkey, duck, chicken} from '../poster/artwork';

export const recipes = [
  ['Turducken','Turkey','Duck','Chicken'], ['Turger','Turkey','Tiger'],
  ['Turkiraffe','Turkey','Giraffe'], ['Turklobster','Turkey','Lobster'],
  ['Turkrab','Turkey','Crab'], ['Turkguana','Turkey','Iguana'],
  ['Turkelmon','Turkey','Salmon'], ['Turkstrich','Turkey','Ostrich'],
  ['Turkoise','Turkey','Tortoise'], ['Turktopus','Turkey','Octopus'],
  ['Turkebra','Turkey','Zebra'], ['Turkenigator','Turkey','Chicken','Alligator'],
  ['Turkaroo','Turkey','Kangaroo'], ['Turkama','Turkey','Llama'],
  ['Turkgator','Turkey','Alligator'], ['Turkebab','Turkey','Turkey'],
  ['Turkguin','Turkey','Penguin'], ['Turkroc','Turkey','Crocodile']
];
export const animals = [...new Set(recipes.flatMap(r=>r.slice(1)))];
const colors = {Tiger:'orange',Giraffe:'gold',Zebra:'white',Llama:'cream',Kangaroo:'#cb8544',
  Alligator:'pine',Crocodile:'#84994c',Iguana:'green',Tortoise:'#738c50',Lobster:'red',
  Crab:'orange',Octopus:'#ac5676',Salmon:'#76a59b',Ostrich:'plum',Penguin:'dark'};

function sculpt(name,{egg}) {
  const c=colors[name];
  function oval(x,y,z,a,b,d,color=c,tilt=0){egg([x,y,z],[a,b,d],color,[0,0,tilt]);}
  function face(x,y,width){
    for(const sign of [-1,1]){
      oval(x-2,y,sign*width,2.3,2.5,1.4,'cream');
      oval(x-2.6,y+.2,sign*(width+.8),1.35,1.55,.8,'dark');
    }
  }
  if(['Lobster','Crab','Octopus'].includes(name)){
    const oct=name==='Octopus';
    oval(0,oct?15:9,0,oct?12:15,oct?14:8,12);
    for(const side of [-1,1]) for(let i=0;i<4;i++){
      const x=-11+i*7;
      egg([x,5,side*(12+2*Math.sin(i))],[3,3,11],c,[side*(i-1)*5,i*11-17,0]);
      oval(x-2,3,side*21,4,2.5,4);
    }
    if(!oct) for(const side of [-1,1]){
      oval(-14,9,side*14,12,4,4,c,-12);
      oval(-24,12,side*15,9,6,6);oval(-30,15,side*15,6,2,3,c,-12);
    }
    if(name==='Lobster') for(let i=0;i<4;i++) oval(12+i*5,7,0,7,5,9-i);
    face(-9,oct?17:13,6);return;
  }
  if(name==='Salmon'){
    oval(0,12,0,24,11,7);oval(-6,8,2,14,5,6,'#e4b394');
    for(const sign of [-1,1]) oval(24,12+sign*4,0,9,4,2,'pine',sign*36);
    oval(4,21,0,7,5,2,'pine',-20);face(-15,15,5);return;
  }
  const reptile=['Crocodile','Alligator','Iguana','Tortoise'].includes(name);
  if(reptile){
    oval(0,9,0,20,7,10);oval(-18,12,0,10,6,7);
    if(name==='Tortoise') oval(1,14,0,19,13,13,'#99683f');
    else {
      oval(22,8,0,19,4,5,c,8);oval(-26,11,0,name==='Crocodile'?12:8,3.3,5);
      for(let i=0;i<6;i++) oval(-7+i*5,16-i*.6,0,3, name==='Iguana'?5:2,2,'pine');
    }
    for(const x of [-11,12]) for(const z of [-8,8]) oval(x,4,z,6,3,5);
    face(-21,15,5);return;
  }
  if(name==='Ostrich'||name==='Penguin'){
    const tall=name==='Ostrich';oval(0,tall?21:16,0,tall?15:10,15,10);
    oval(-3,16,6,8,11,5,tall?'cream':'white');
    if(tall) oval(-10,36,0,4,16,4,'#e6bd92',-10);
    const y=tall?52:32,x=tall?-14:-3;oval(x,y,0,8,8,7);
    oval(x-8,y-1,0,7,3,4,'gold');face(x-2,y+2,5);
    for(const z of [-5,5]){oval(0,tall?8:3,z,2,8,2,'orange');oval(-3,2,z,6,2,3,'gold');}
    return;
  }
  const tall=name==='Giraffe', roo=name==='Kangaroo', llama=name==='Llama';
  const neck=tall?29:llama?15:roo?10:4, y=25+neck;
  oval(0,20,0,17,11,10);
  oval(-12,24+neck*.46,0,6,neck*.63+6,6,c,-13);
  oval(-17,y,0,10,7,7);oval(-24,y-2,0,6,4,5,llama?'white':c);
  for(const z of [-4,4]){
    oval(-14,y+7,z,3,roo||llama?7:4,2.5);
    if(tall) oval(-18,y+9,z,1.7,4,1.7,'#875734');
    for(const x of [-10,10]) oval(x,10,z*1.5,roo&&x>0?6:3,10,3);
  }
  oval(20,roo?12:22,0,roo?17:9,3,3,c,roo?-18:25);
  if(tall||name==='Tiger'||name==='Zebra') for(const z of [-1,1]) for(let i=0;i<5;i++){
    oval(-10+i*5,22+(i%2)*2,z*(8+Math.sin(i*.85)),tall?3:1.6,tall?3:6,1.6,tall?'#a56632':'dark',-18);
    if(tall) oval(-12-i*.7,30+i*4,z*4.5,2.2,2,1.4,'#a56632');
  }
  face(-19,y+1,5.7);
}

export function animalModel(name){
  const draw={Turkey:turkey,Duck:duck,Chicken:chicken}[name];
  const geometry=model(draw || (tools=>sculpt(name,tools)));
  geometry.computeBoundingBox();
  const {min,max}=geometry.boundingBox;
  const scale=32/Math.max(max.x-min.x,max.y-min.y,max.z-min.z);
  geometry.translate(-(min.x+max.x)/2,-min.y,-(min.z+max.z)/2);
  geometry.scale(scale,scale,scale);
  return geometry;
}
