import { useEffect, useLayoutEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DepthTexture, ShaderMaterial, Vector2, Vector3, WebGLRenderTarget } from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';

const fragmentShader = `
  uniform sampler2D painting, sceneDepth;
  uniform vec2 pixel;
  uniform float reach, density, focusDepth, depthScale, dof;
  uniform int finish;
  varying vec2 uvPaper;
  float hash(vec2 p) {
    vec3 q=fract(p.xyx*vec3(.1031,.1030,.0973));
    q+=dot(q,q.yzx+33.33);
    return fract((q.x+q.y)*q.z);
  }
  float paper(vec2 p) {
    vec2 i=floor(p), f=fract(p);
    f=f*f*(3.-2.*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
               mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
  }
  vec3 samplePaint(vec2 uv){
    vec3 paint=texture2D(painting,uv).rgb;
    if(dof<.5)return paint;
    float depth=texture2D(sceneDepth,uv).r;
    float blur=7.*smoothstep(.035,.16,abs(depth-focusDepth)*depthScale);
    if(blur<.1)return paint;
    float weight=1.;
    for(int i=0;i<6;i++){
      float angle=float(i)*1.0472;
      vec2 tap=uv+vec2(cos(angle),sin(angle))*pixel*blur;
      float neighbor=texture2D(sceneDepth,tap).r;
      // Background samples cannot wash over an in-focus silhouette.
      float w=1.-smoothstep(.008,.025,abs(neighbor-depth)*depthScale);
      paint+=texture2D(painting,tap).rgb*w;
      weight+=w;
    }
    return paint/weight;
  }
  void main() {
    vec3 base=samplePaint(uvPaper);
    float depth=texture2D(sceneDepth,uvPaper).r;
    vec2 sheet=gl_FragCoord.xy/density;
    float tooth=paper(sheet*.9);
    float wet=paper(sheet*.11)+.32*paper(sheet*.36);
    float radius=reach*(.28+wet)*(finish==2 ? 1.55 : 1.);
    vec3 deposit=base;
    float best=0.;
    // Choose one donor across an edge. Its depth and pigment concentration
    // determine where the wet front travels and which illustration sits on top.
    for(int i=0;i<12;i++) {
      float angle=float(i)*2.39996+wet*.75;
      vec2 direction=vec2(cos(angle),sin(angle));
      float ring=.28+.72*fract(float(i)*.618+.18);
      if(finish==3) direction=vec2(direction.x*1.5+.55,direction.y*.43);
      vec2 sampleUV=uvPaper+direction*radius*ring*pixel;
      vec3 donor=samplePaint(sampleUV);
      float dz=depth-texture2D(sceneDepth,sampleUV).r;
      float darker=dot(base-donor,vec3(.24,.60,.16));
      float boundary=smoothstep(.055,.22,length(base-donor));
      float flow=max(smoothstep(.0005,.007,dz),.62*smoothstep(.02,.22,darker));
      float score=boundary*flow*(1.-.43*ring)*(1.-smoothstep(.001,.007,-dz));
      if(score>best){best=score;deposit=donor;}
    }
    float strength=finish==1 ? .62 : .83;
    if(finish==3) strength*=smoothstep(.19,.69,tooth);
    // A broken, darker tide line precedes a more saturated interior wash.
    float rim=smoothstep(.22,.48,best)*(1.-smoothstep(.52,.74,best));
    vec3 pooled=deposit*(1.-rim*(finish==2 ? .44 : .21));
    vec3 color=mix(base,pooled,strength*smoothstep(.06,.85,best));
    gl_FragColor=vec4(color,1.);
    #include <colorspace_fragment>
  }
`;

export default function PigmentPass({finish, spill, dof=false}) {
  const invalidate=useThree(state=>state.invalidate);
  const pass=useMemo(()=>{
    const target=new WebGLRenderTarget(1,1);
    target.depthTexture=new DepthTexture(1,1);
    const material=new ShaderMaterial({
      depthTest:false, depthWrite:false,
      uniforms:{
        painting:{value:target.texture}, sceneDepth:{value:target.depthTexture},
        pixel:{value:new Vector2()}, density:{value:1}, dof:{value:0}, depthScale:{value:1}, focusDepth:{value:.3}, reach:{value:4}, finish:{value:1}
      },
      vertexShader:'varying vec2 uvPaper; void main(){ uvPaper=uv; gl_Position=vec4(position.xy,0.,1.); }',
      fragmentShader
    });
    return {target,material,quad:new FullScreenQuad(material),size:new Vector2(), focus:new Vector3()};
  },[]);
  useLayoutEffect(()=>{invalidate();},[finish,spill,dof,invalidate]);
  useEffect(()=>()=>{pass.target.dispose();pass.material.dispose();pass.quad.dispose();},[pass]);
  useFrame(({gl,scene,camera})=>{
    if (!finish || !spill) {gl.render(scene,camera);return;}
    gl.getDrawingBufferSize(pass.size);
    pass.target.setSize(pass.size.x,pass.size.y);
    const uniforms=pass.material.uniforms;
    uniforms.pixel.value.set(gl.getPixelRatio()/pass.size.x,gl.getPixelRatio()/pass.size.y);
    uniforms.density.value=gl.getPixelRatio();
    uniforms.reach.value=spill;
    uniforms.finish.value=finish;
    uniforms.dof.value=dof?1:0;
    uniforms.depthScale.value=(camera.far-camera.near)/2100;
    pass.focus.set(0,-121,0).project(camera);
    uniforms.focusDepth.value=pass.focus.z*.5+.5;
    gl.setRenderTarget(pass.target);
    gl.render(scene,camera);
    gl.setRenderTarget(null);
    pass.quad.render(gl);
  },1);
  return null;
}
