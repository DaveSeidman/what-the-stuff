import {animals,combinationName} from './animals.js';

// Append new species here; existing codes must stay stable for shared links.
const routeAnimals=['Turkey','Duck','Chicken','Tiger','Giraffe','Lobster','Crab','Iguana','Salmon','Ostrich','Tortoise','Octopus','Zebra','Alligator','Kangaroo','Llama','Chameleon','Penguin','Crocodile','Pig'];
const slug=name=>name.toLowerCase();
const number=value=>/^[0-9a-z]+$/.test(value||'')?parseInt(value,36):NaN;
function compactQuiz(parts){
  const species=parts[1].split('').map(code=>routeAnimals[number(code)]);
  const rounds=Array.from({length:5},(_,i)=>species.slice(i*3,i*3+3));
  const fields=(parts[2]||'').split('.');
  const [progress,encodedResults,flags,elapsed]=fields.map(number);
  const round=Math.floor(progress/4),length=progress%4;
  if(parts.length!==3||fields.length!==4||species.length!==15||!species.every(Boolean)||!rounds.every(row=>new Set(row).size===3)||!Number.isInteger(progress)||progress<0||progress>19||encodedResults<1||encodedResults>63||!Number.isInteger(encodedResults)||!Number.isInteger(flags)||flags>3||!Number.isSafeInteger(elapsed)||elapsed<0)return {mode:'quiz'};
  const results=encodedResults.toString(2).slice(1).split('').map(value=>value==='1');
  return {mode:'quiz',rounds:rounds.map(row=>[combinationName(row),...row]),round,
    stack:rounds[round].slice(0,length),results,elapsed,missed:!!(flags&1),
    over:!!(flags&2)&&round===4&&length===3};
}
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
  if(parts[1]?.length===15&&!query)return compactQuiz(parts);
  const params=new URLSearchParams(query);
  const rounds=params.get('rounds')?.split(',').map(row=>animalList(row));
  const round=Number(parts[1]||0),stack=animalList(parts.slice(2).join('/'));
  const results=(params.get('results')||'').split('').map(value=>value==='1');
  if(!rounds||rounds.length!==5||!rounds.every(row=>row&&row.length===3)||!Number.isInteger(round)||round<0||round>4||!stack||!stack.every((name,i)=>name===rounds[round][i])||results.length>5)return {mode:'quiz'};
  return {mode:'quiz',legacy:true,rounds:rounds.map(row=>[combinationName(row),...row]),round,stack,results,
    over:params.get('done')==='1'&&round===4&&stack.length===3,
    elapsed:Math.max(0,Number(params.get('elapsed'))||0),missed:params.get('missed')==='1'};
}
export function freeRoute(nest){return '#/free'+(nest.length?'/'+nest.map(slug).join('/'):'');}
export function quizRoute({rounds,round,stack,results,over,elapsed,missed}){
  const code=rounds.flatMap(row=>row.slice(1)).map(name=>routeAnimals.indexOf(name).toString(36)).join('');
  const progress=(round*4+stack.length).toString(36);
  const resultCode=results.reduce((bits,correct)=>(bits<<1)|Number(correct),1).toString(36);
  const flags=(Number(!!missed)|Number(!!over)*2).toString(36);
  const seconds=Math.max(0,Math.round(elapsed||0)).toString(36);
  return `#/quiz/${code}/${progress}.${resultCode}.${flags}.${seconds}`;
}
export function shareUrl(route){return `https://what-the-stuff.com/${route}`;}
