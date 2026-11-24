export const recipes = [
  ['Turducken','Turkey','Duck','Chicken'], ['Turger','Turkey','Tiger'],
  ['Turkiraffe','Turkey','Giraffe'], ['Turklobster','Turkey','Lobster'],
  ['Turkrab','Turkey','Crab'], ['Turkguana','Turkey','Iguana'],
  ['Turkelmon','Turkey','Salmon'], ['Turkstrich','Turkey','Ostrich'],
  ['Turkoise','Turkey','Tortoise'], ['Turktopus','Turkey','Octopus'],
  ['Turkebra','Turkey','Zebra'], ['Turkenigator','Turkey','Chicken','Alligator'],
  ['Turkaroo','Turkey','Kangaroo'], ['Turkama','Turkey','Llama'],
  ['Turkgator','Turkey','Alligator'], ['Turkebab','Turkey','Turkey'],
  ['Turkameleon','Turkey','Chameleon'], ['Turkguin','Turkey','Penguin'], ['Turkroc','Turkey','Crocodile']
];
export const animals = [...new Set(recipes.flatMap(r=>r.slice(1)))];

const firstParts={
  Turkey:'tur',Duck:'duk',Chicken:'chik',Tiger:'tig',Giraffe:'gir',
  Lobster:'lob',Crab:'cra',Iguana:'igu',Salmon:'sal',Ostrich:'ost',
  Tortoise:'tor',Octopus:'oct',Zebra:'zeb',Alligator:'alli',
  Kangaroo:'kang',Llama:'lla',Penguin:'peng',Crocodile:'croc',Chameleon:'cham'
};
const lastParts={
  Turkey:'tur',Duck:'duk',Chicken:'ken',Tiger:'ger',Giraffe:'iraffe',
  Lobster:'lob',Crab:'krab',Iguana:'guana',Salmon:'sal',Ostrich:'strich',
  Tortoise:'toise',Octopus:'topus',Zebra:'ebra',Alligator:'gator',
  Kangaroo:'karoo',Llama:'ama',Penguin:'guin',Crocodile:'croc',Chameleon:'ameleon'
};
export function combinationName(nest){
  if(!nest.length)return 'Pick an animal';
  let prefix=firstParts[nest[0]],start=1;
  for(let count=nest.length;count>=2;count--){
    const known=recipes.find(row=>row.length===count+1&&row.slice(1).every((animal,i)=>animal===nest[i]));
    if(known&&!animals.some(animal=>known[0].toLowerCase().includes(animal.toLowerCase()))){
      prefix=known[0].toLowerCase();start=count;break;
    }
  }
  let name=prefix+nest.slice(start).map(animal=>lastParts[animal]).join('');
  // Joining innocent syllables can accidentally reveal a full animal name.
  for(const animal of animals){
    const full=animal.toLowerCase();
    while(name.includes(full)){
      const index=name.indexOf(full)+Math.floor(full.length/2);
      name=name.slice(0,index)+name.slice(index+1);
    }
  }
  return name[0].toUpperCase()+name.slice(1);
}
