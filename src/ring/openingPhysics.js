export function dragOpening(initial,startY,currentY,distance){
  return Math.max(0,Math.min(1,initial+(startY-currentY)/distance));
}
export function stepOpeningFall(state,seconds){
  const dt=Math.min(seconds,.032);
  let velocity=state.velocity-4.8*dt;
  let height=state.height+velocity*dt;
  let bounces=state.bounces;
  if(height<=0){
    height=0;velocity=-velocity*.24;bounces++;
    if(bounces>=3||velocity<.12)return {height:0,velocity:0,bounces,done:true};
  }
  return {height,velocity,bounces,done:false};
}
