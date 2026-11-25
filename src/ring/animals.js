export const recipes = [
  ['Turducken','Turkey','Duck','Chicken'], ['Turger','Turkey','Tiger'],
  ['Turkiraffe','Turkey','Giraffe'], ['Turklobster','Turkey','Lobster'],
  ['Turkrab','Turkey','Crab'], ['Turkguana','Turkey','Iguana'],
  ['Turkelmon','Turkey','Salmon'], ['Turkstrich','Turkey','Ostrich'],
  ['Turkoise','Turkey','Tortoise'], ['Turktopus','Turkey','Octopus'],
  ['Turkebra','Turkey','Zebra'], ['Turkenigator','Turkey','Chicken','Alligator'],
  ['Turkaroo','Turkey','Kangaroo'], ['Turkama','Turkey','Llama'],
  ['Turkgator','Turkey','Alligator'], ['Turkebab','Turkey','Turkey'],
  ['Turkameleon','Turkey','Chameleon'], ['Turkguin','Turkey','Penguin'], ['Turkroc','Turkey','Crocodile'],
  ['Turporken','Turkey','Pig','Chicken'], ['Porkdukken','Pig','Duck','Chicken'],
  ['Girkrabacon','Giraffe','Crab','Pig']
];
export const animals = [...new Set(recipes.flatMap(r=>r.slice(1)))];

const firstParts={
  Turkey:'tur',Duck:'duk',Chicken:'chik',Tiger:'tig',Giraffe:'gir',
  Lobster:'lob',Crab:'cra',Iguana:'igu',Salmon:'sal',Ostrich:'ost',
  Tortoise:'tor',Octopus:'oct',Zebra:'zeb',Alligator:'alli',
  Kangaroo:'kang',Llama:'lla',Penguin:'peng',Crocodile:'croc',Chameleon:'cham',Pig:['pig','pork']
};
const lastParts={
  Turkey:'tur',Duck:'duk',Chicken:'ken',Tiger:'ger',Giraffe:'iraffe',
  Lobster:'lob',Crab:'krab',Iguana:'guana',Salmon:'sal',Ostrich:'strich',
  Tortoise:'toise',Octopus:'topus',Zebra:'ebra',Alligator:'gator',
  Kangaroo:'karoo',Llama:'ama',Penguin:'guin',Crocodile:'croc',Chameleon:'ameleon',Pig:['pig','pork','ham','bacon']
};
const middleParts={
  Pig:['pork','porc','ham'],Turkey:['tur','turk'],Chicken:['chik','ken'],
  Duck:['duk','du'],Lobster:['lob','lobst'],Crab:['kra','krab']
};
function syllable(parts,nest,index){
  if(!Array.isArray(parts))return parts;
  // Stable choices keep quiz clues, restored routes, and shared names identical.
  const context=`${nest[index-1]||''}:${nest[index+1]||''}:${index}`;
  let seed=0;
  for(const letter of context)seed=(Math.imul(seed,31)+letter.charCodeAt(0))>>>0;
  return parts[seed%parts.length];
}
export function combinationName(nest){
  if(!nest.length)return 'Pick an animal';
  if(nest.length===1)return nest[0];
  let prefix=syllable(firstParts[nest[0]],nest,0),start=1;
  const givesAwayAnimal=name=>animals.some(animal=>animal!=='Pig'&&name.toLowerCase().includes(animal.toLowerCase()));
  for(let count=nest.length;count>=2;count--){
    const known=recipes.find(row=>row.length===count+1&&row.slice(1).every((animal,i)=>animal===nest[i]));
    if(known&&!givesAwayAnimal(known[0])){
      prefix=known[0].toLowerCase();start=count;break;
    }
  }
  let name=prefix+nest.slice(start).map((animal,offset)=>{
    const index=start+offset;
    const parts=index===nest.length-1?lastParts[animal]:(middleParts[animal]||lastParts[animal]);
    return syllable(parts,nest,index);
  }).join('');
  // Keep quiz names playful without spelling out another entire animal.
  // Pig is intentionally allowed: it is also one of the new pork syllables.
  for(const animal of animals.filter(animal=>animal!=='Pig')){
    const full=animal.toLowerCase();
    while(name.includes(full)){
      const index=name.indexOf(full)+Math.floor(full.length/2);
      name=name.slice(0,index)+name.slice(index+1);
    }
  }
  return name[0].toUpperCase()+name.slice(1);
}
