import React,{useMemo} from 'react';
import {useFrame,useLoader} from '@react-three/fiber';
import {SRGBColorSpace,TextureLoader,ShaderMaterial,Vector2} from 'three';

export default function Countryside(){
  const texture=useLoader(TextureLoader,'/environment/harvest-panorama.png');
  const material=useMemo(()=>{
    texture.colorSpace=SRGBColorSpace;
    texture.needsUpdate=true;
    return new ShaderMaterial({
      depthTest:false,depthWrite:false,
      uniforms:{panorama:{value:texture},aspect:{value:1},heading:{value:0},texel:{value:new Vector2(1/1774,1/887)}},
      vertexShader:'varying vec2 screenUV;void main(){screenUV=uv;gl_Position=vec4(position.xy,1.,1.);}',
      fragmentShader:`
        uniform sampler2D panorama;
        uniform float aspect,heading;
        uniform vec2 texel;
        varying vec2 screenUV;
        void main(){
          vec2 screen=(screenUV-.5)*vec2(aspect,1.);
          vec3 ray=normalize(vec3(screen.x,screen.y+.03,-.83));
          vec2 uv=vec2(fract(atan(ray.z,ray.x)/6.283185+.85+heading/6.283185), .07+.90*pow(screenUV.y,1.6));
          vec3 color=texture2D(panorama,uv).rgb*.4;
          color+=texture2D(panorama,uv+texel*vec2(2.,1.)).rgb*.15;
          color+=texture2D(panorama,uv-texel*vec2(2.,1.)).rgb*.15;
          color+=texture2D(panorama,uv+texel*vec2(-1.,2.)).rgb*.15;
          color+=texture2D(panorama,uv-texel*vec2(-1.,2.)).rgb*.15;
          gl_FragColor=vec4(color,1.);
          #include <colorspace_fragment>
        }`
    });
  },[texture]);
  useFrame(({camera,size})=>{
    const e=camera.matrixWorld.elements;
    material.uniforms.heading.value=Math.atan2(e[8],e[10]);
    material.uniforms.aspect.value=size.width/size.height;
  });
  return <mesh renderOrder={-1000} frustumCulled={false} material={material}><planeGeometry args={[2,2]}/></mesh>;
}
