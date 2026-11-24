import {animals,combinationName} from './animals.js';

function shuffled(values){
  const result=[...values];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
export function makeRounds(){
  const rounds=[],seen=new Set();
  while(rounds.length<5){
    const outer=rounds.length<2?'Turkey':shuffled(animals.filter(name=>name!=='Turkey'))[0];
    const trio=[outer,...shuffled(animals.filter(name=>name!==outer)).slice(0,2)];
    const key=trio.join('/');
    if(seen.has(key))continue;
    seen.add(key);
    rounds.push([combinationName(trio),...trio]);
  }
  return rounds;
}
