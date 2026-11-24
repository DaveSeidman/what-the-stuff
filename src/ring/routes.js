import {animals,combinationName} from './animals.js';

const slug=name=>name.toLowerCase();
function animalList(value){
  if(!value)return [];
  const names=value.split('/').map(part=>animals.find(name=>slug(name)===part));
  return names.length<=animals.length&&names.every(Boolean)&&new Set(names).size===names.length?names:null;
}
export function readRoute(hash){
  const [path,query='']=hash.replace(/^#/, '').split('?');
  const parts=path.split('/').filter(Boolean);
  if(parts[0]==='free')return {mode:'free',nest:animalList(parts.slice(1).join('/'))||[]};
  if(parts[0]!=='quiz')return {mode:'intro'};
  const params=new URLSearchParams(query);
  const rounds=params.get('rounds')?.split(',').map(row=>animalList(row));
  const round=Number(parts[1]||0),stack=animalList(parts.slice(2).join('/'));
  const results=(params.get('results')||'').split('').map(value=>value==='1');
  if(!rounds||rounds.length!==5||!rounds.every(row=>row&&row.length===3)||!Number.isInteger(round)||round<0||round>4||!stack||!stack.every((name,i)=>name===rounds[round][i])||results.length>5)return {mode:'quiz'};
  return {mode:'quiz',rounds:rounds.map(row=>[combinationName(row),...row]),round,stack,results,
    over:params.get('done')==='1'&&round===4&&stack.length===3,
    elapsed:Math.max(0,Number(params.get('elapsed'))||0),missed:params.get('missed')==='1'};
}
export function freeRoute(nest){return '#/free'+(nest.length?'/'+nest.map(slug).join('/'):'');}
export function quizRoute({rounds,round,stack,results,over,elapsed,missed}){
  const params=new URLSearchParams({rounds:rounds.map(row=>row.slice(1).map(slug).join('/')).join(','),results:results.map(Number).join(''),elapsed:String(Math.round(elapsed||0))});
  if(over)params.set('done','1');
  if(missed)params.set('missed','1');
  return `#/quiz/${round}${stack.length?'/'+stack.map(slug).join('/'):''}?${params}`;
}
export function shareUrl(route){return `https://what-the-stuff.com/${route}`;}
