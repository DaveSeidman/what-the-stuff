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

const nameParts = {
  Turkey:'tur', Duck:'duck', Chicken:'cken', Tiger:'ger', Giraffe:'iraffe',
  Lobster:'lobster', Crab:'crab', Iguana:'guana', Salmon:'salmon',
  Ostrich:'strich', Tortoise:'toise', Octopus:'octopus', Zebra:'zebra',
  Alligator:'gator', Kangaroo:'karoo', Llama:'llama', Penguin:'guin',
  Crocodile:'croc', Chameleon:'ameleon'
};

export function combinationName(nest){
  if(!nest.length)return 'Pick an animal';
  if(nest.length===1)return nest[0];
  let name=nest[0].toLowerCase();
  let start=1;
  // Keep established recipe names as the beginning of a longer combination.
  for(let length=nest.length;length>=2;length--){
    const recipe=recipes.find(row=>row.length===length+1&&row.slice(1).every((animal,i)=>animal===nest[i]));
    if(recipe){name=recipe[0].toLowerCase();start=length;break;}
  }
  if(start===1)name=nameParts[nest[0]];
  name+=nest.slice(start).map(animal=>nameParts[animal]).join('');
  return name[0].toUpperCase()+name.slice(1);
}
