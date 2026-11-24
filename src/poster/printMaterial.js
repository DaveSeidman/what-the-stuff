import { Color, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';
import { palette } from './sculpture';

export function printMaterial() {
  return new ShaderMaterial({
    lights: true,
    uniforms: {
      ...UniformsUtils.clone(UniformsLib.lights),
      maroon:{value:new Color(palette.wine)}, butter:{value:new Color(palette.cream)},
      tangerine:{value:new Color(palette.orange)},
    },
    vertexShader: `
      attribute vec3 ink, localPoint;
      attribute float paintType;
      varying vec3 vInk, vPoint, vLocal, vNormal;
      varying float vType;
      void main() {
        vInk=ink; vPoint=position; vLocal=localPoint; vType=paintType;
        vNormal=normalMatrix*normal;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `,
    fragmentShader: `
      #include <common>
      #include <lights_pars_begin>
      uniform vec3 maroon, butter, tangerine;
      varying vec3 vInk, vPoint, vLocal, vNormal;
      varying float vType;
      float hash(vec2 p) {
        vec3 q=fract(p.xyx*vec3(.1031,.1030,.0973));
        q+=dot(q,q.yzx+33.33);
        return fract((q.x+q.y)*q.z);
      }
      float noise(vec2 p) {
        vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),
                   mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);
      }
      void main() {
        vec3 n=normalize(vNormal);
        // Object-anchored marks follow the sculpture as the camera moves.
        vec2 p=vPoint.xy+vPoint.z*vec2(.31,.23);
        float grain=noise(1.55*p);
        float curl=vLocal.y+.25*vLocal.x*vLocal.x;
        float brush=noise(vec2(9.*curl+.24*vLocal.x,62.*vLocal.x+7.*vLocal.z));
        vec3 ink=vInk;
        if(vType>.5 && vType<1.5) {
          float band=vLocal.y-.10*vLocal.x*vLocal.x+.018*(brush-.5);
          ink=mix(ink,tangerine,smoothstep(.12,.14,band));
          ink=mix(ink,maroon,smoothstep(.51,.53,band));
          ink=mix(ink,butter,smoothstep(.78,.80,band));
          ink=mix(ink,butter,(1.-smoothstep(.015,.035,abs(vLocal.x+.04*vLocal.y)))*.28);
        }
        float light=.5;
        #if NUM_DIR_LIGHTS > 0
          light=dot(n,directionalLights[0].direction)*directionalLights[0].color.r;
        #endif
        light+=.055*(brush-.5)+.035*(grain-.5);
        float sunlit=smoothstep(.27,.32,light);
        float highlight=smoothstep(.77,.82,light);
        vec3 shaded=mix(ink*vec3(.60,.49,.60),maroon,.09);
        vec3 pigment=mix(shaded,ink,sunlit);
        pigment=mix(pigment,ink*1.12+vec3(.026,.013,0),highlight*.85);
        if(vType>2.5 && vType<3.5) {
          // Glazes follow the sun's curved surface as the key light moves.
          float glaze=light+.08*(noise(p*.095)-.5);
          pigment=mix(tangerine,ink,smoothstep(-.50,.55,glaze));
          pigment=mix(pigment,butter,.79*smoothstep(.43,.98,glaze));
        }
        if(vType>3.5) pigment=ink;
        float skip=smoothstep(.78,.96,grain)*.18;
        if(vType>.5 && vType<3.) skip+=smoothstep(.71,.9,brush)*.105;
        pigment=mix(pigment,butter,skip);
        pigment*=.96+.065*noise(.14*p);
        if(vType>4.5) {
          // Continuous world coordinates keep the paper grain fixed during orbit.
          float fiber=noise(vec2(p.x*.18+p.y*.05,p.y*.95));
          pigment=mix(ink,butter,.018*smoothstep(.70,.92,fiber));
        }
        gl_FragColor=vec4(pigment,1.);
        #include <colorspace_fragment>
      }
    `
  });
}
