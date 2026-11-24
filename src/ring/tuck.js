import {Vector3} from 'three';

const deformation = `
uniform float tuckAmount, tuckRadius;
uniform vec3 tuckCenter;
vec3 tuckedPosition(vec3 point){
  vec3 offset=point-tuckCenter;
  float radius=length(offset),start=tuckRadius*.84;
  float band=max(.01,tuckRadius-start);
  float fitted=radius>start ? start+band*(1.-exp(-(radius-start)/band)) : radius;
  return tuckCenter+offset*mix(1.,fitted/max(radius,.001),tuckAmount);
}
`;
export function tuckUniforms(shell){
  return {tuckAmount:{value:0},tuckRadius:{value:1000},tuckCenter:{value:new Vector3(shell.x,shell.seam,0)}};
}
export function tuckVertex(shader){
  return deformation+shader.replace('void main() {','void main() {\n vec3 stuffed=tuckedPosition(position);')
    .replaceAll('vec4(position,1.)','vec4(stuffed,1.)')
    .replace('#include <begin_vertex>','#include <begin_vertex>\n transformed=tuckedPosition(transformed);');
}
