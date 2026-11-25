import { Color, Vector3, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';
import { palette } from './sculpture';

export function printMaterial() {
  return new ShaderMaterial({
    lights: true,
    uniforms: {
      ...UniformsUtils.clone(UniformsLib.lights),
      bodyCenter:{value:new Vector3()},
      environment:{value:0}, surface:{value:0}, clockTime:{value:0},
      maroon:{value:new Color(palette.wine)}, butter:{value:new Color(palette.cream)},
      tangerine:{value:new Color(palette.orange)},
    },
    vertexShader: `
      #include <common>
      #include <shadowmap_pars_vertex>
      attribute vec3 ink, localPoint;
      attribute float paintType;
      varying vec3 vInk, vPoint, vLocal, vNormal, vWorld, vViewPosition, vObjectNormal;
      varying float vType;
      void main() {
        vInk=ink; vPoint=position; vLocal=localPoint; vType=paintType;
        vNormal=normalMatrix*normal;vObjectNormal=normal;
        vec3 transformedNormal=vNormal;
        vec4 worldPosition=modelMatrix*vec4(position,1.);
        vViewPosition=(modelViewMatrix*vec4(position,1.)).xyz;
        vWorld=worldPosition.xyz;
        #include <shadowmap_vertex>
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
      }
    `,
    fragmentShader: `
      #include <common>
      #include <lights_pars_begin>
      #include <shadowmap_pars_fragment>
      #include <shadowmask_pars_fragment>
      uniform float surface, clockTime, environment;
      uniform vec3 maroon, butter, tangerine, bodyCenter;
      varying vec3 vInk, vPoint, vLocal, vNormal, vWorld, vViewPosition, vObjectNormal;
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
      float scaleHeight(vec2 p){
        vec2 tiles=p*.52;
        tiles.x+=mod(floor(tiles.y),2.)*.5;
        vec2 cell=fract(tiles)-.5;
        return .13*(1.-smoothstep(.24,.48,length(cell*vec2(1.,.82))));
      }
      float hexEdge(vec2 p){
        vec2 grid=vec2(1.,1.73205);
        vec2 a=mod(p,grid)-grid*.5,b=mod(p-grid*.5,grid)-grid*.5;
        vec2 cell=abs(dot(a,a)<dot(b,b)?a:b);
        return .5-max(cell.x,dot(cell,vec2(.5,.866025)));
      }
      float shellEdge(vec3 p){
        vec3 w=pow(abs(normalize(vObjectNormal)),vec3(5.));w/=w.x+w.y+w.z;
        return hexEdge(p.yz/6.)*w.x+hexEdge(p.xz/6.)*w.y+hexEdge(p.xy/6.)*w.z;
      }
      float fishHeight(vec3 point){
        vec2 p=point.xy*1.15;
        p.x+=mod(floor(p.y),2.)*.5;
        vec2 cell=fract(p)-.5;
        float arc=abs(length(vec2(cell.x,cell.y+.45))-.5);
        return .035*(1.-smoothstep(.025,.1,arc));
      }
      // Delayed color fronts expand from fixed points on the skin.
      vec3 skinBloom(float distanceFromSource,float offset){
        float beat=clockTime/4.8-distanceFromSource*.028+offset;
        float tick=floor(beat);
        vec3 a=.52+.38*cos(6.283*(hash(vec2(tick,17.+offset))+vec3(0.,.33,.67)));
        vec3 b=.52+.38*cos(6.283*(hash(vec2(tick+1.,17.+offset))+vec3(0.,.33,.67)));
        return mix(a,b,smoothstep(.12,.74,fract(beat)));
      }
      void main() {
        vec3 n=normalize(vNormal);
        vec3 body=vPoint-bodyCenter;
        float shellMask=smoothstep(.025,.12,vInk.r-vInk.g)*smoothstep(-2.,2.,body.y);
        float relief=0.;
        if((surface>1.5 && surface<3.5)||surface>12.5)relief=scaleHeight(vPoint.xy+vPoint.z*vec2(.31,.23));
        if(surface>3.5 && surface<4.5)relief=.035*noise((vPoint.xy+vPoint.z*.3)*4.);
        if(surface>5.5 && surface<6.5)relief=.24*smoothstep(.015,.13,shellEdge(body))*shellMask;
        if(surface>8.5 && surface<9.5)relief=fishHeight(vPoint);
        if(surface>9.5 && surface<10.5)relief=.19*scaleHeight((vPoint.xy+vPoint.z*vec2(.23,.41))*.7);
        if(surface>10.5 && surface<11.5)relief=.018*noise(vec2(body.x*4.,body.y*.6+body.z*.9));
        if(surface>11.5 && surface<12.5)relief=.012*noise(vec2(body.x*.7+body.z,body.y*5.));
        if(surface>1.5){
          vec3 dx=dFdx(vViewPosition),dy=dFdy(vViewPosition);
          vec3 r1=cross(dy,n),r2=cross(n,dx);
          float det=dot(dx,r1);
          vec3 gradient=sign(det)*(dFdx(relief)*r1+dFdy(relief)*r2);
          n=normalize(abs(det)*n-gradient);
        }
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
        if(surface>6.5 && surface<7.5){
          vec3 body=vPoint-bodyCenter;
          float stripes=sin(body.x*.95+sin(body.y*.22)*.8+body.z*.15);
          float whiteFur=smoothstep(.025,.20,min(ink.r,min(ink.g,ink.b)));
          ink=mix(ink,mix(vec3(.021,.032,.029),ink,smoothstep(-.10,.12,stripes)),whiteFur*.93);
        }
        float coloredSkin=smoothstep(.04,.16,max(ink.r,max(ink.g,ink.b)));
        if(surface>5.5 && surface<6.5){
          float edge=shellEdge(body);
          vec3 scute=mix(vec3(.09,.065,.025),ink,smoothstep(.015,.08,edge));
          scute*=.9+.2*smoothstep(.07,.25,edge);
          ink=mix(ink,scute,shellMask);
        }
        if(surface>8.5 && surface<9.5){
          float fishSkin=smoothstep(.015,.09,ink.b-ink.r);
          vec3 silver=mix(ink,vec3(.5,.65,.64),.35);
          float lateral=exp(-pow((body.y-1.)*.6,2.));
          ink=mix(ink,silver*(1.-.22*lateral),fishSkin);
        }
        if(surface>9.5 && surface<10.5){
          float speckle=noise((body.xy+body.z*.3)*.8);
          ink*=1.-.14*smoothstep(.65,.84,speckle)*coloredSkin;
        }
        if(surface>10.5 && surface<11.5){
          float stripes=sin(body.x*1.15+sin(body.y*.37+body.z*.2)*1.4);
          float orangeFur=smoothstep(.025,.16,ink.r-ink.g)*smoothstep(.03,.14,ink.r-ink.b);
          float faceFade=smoothstep(-16.,-9.,body.x);
          ink=mix(ink,vec3(.035,.026,.018),smoothstep(.45,.62,stripes)*orangeFur*faceFade*.9);
        }
        if(surface>11.5 && surface<12.5){
          float patches=smoothstep(.05,.12,hexEdge((body.xy+body.z*vec2(.3,.2))/5.5));
          ink=mix(ink,mix(vec3(.88,.67,.29),vec3(.35,.15,.055),patches),coloredSkin*.8);
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
        if(surface>0.5){
          // Species finishes share the same painted lighting and paper grain.
          pigment=mix(shaded,ink,sunlit)*(.97+.04*grain);
          float feature=1.-smoothstep(.045,.15,max(ink.r,max(ink.g,ink.b)));
          if(surface<1.5){
            vec2 feather=p*vec2(.38,.29);
            feather.x+=mod(floor(feather.y),2.)*.5;
            vec2 cell=fract(feather)-.5;
            float scallop=abs(length(vec2(cell.x,cell.y+.48))- .51);
            float edge=1.-smoothstep(.035,.10,scallop);
            float shaft=1.-smoothstep(.018,.05,abs(cell.x));
            pigment*=1.-.18*edge-.06*shaft;
          }else if(surface<3.5){
            // Raised scales affect the lighting while preserving the base dye.
            pigment=mix(shaded,ink,.35+.65*smoothstep(-.15,.85,light));
            if(surface>2.5){
              vec3 skin=vPoint-bodyCenter;
              float d0=length(skin-vec3(-10.,7.,7.));
              float d1=length(skin-vec3(3.,1.,-10.));
              float d2=length(skin-vec3(20.,-2.,3.));
              vec3 weights=1./(vec3(3.)+vec3(d0*d0,d1*d1,d2*d2)*.025);
              vec3 dye=(skinBloom(d0,0.)*weights.x+skinBloom(d1,.37)*weights.y+skinBloom(d2,.71)*weights.z)/(weights.x+weights.y+weights.z);
              pigment=mix(pigment,pigment*dye*2.0,.78*(1.-feature));
            }
          }else if(surface<4.5 || (surface>5.5 && surface<6.5)){
            vec3 lamp=normalize(vec3(-.4,.7,.6));
            #if NUM_DIR_LIGHTS > 0
              lamp=directionalLights[0].direction;
            #endif
            vec3 halfVector=normalize(lamp+vec3(0.,0.,1.));
            float shine=pow(max(0.,dot(n,halfVector)),42.);
            pigment+=vec3(.95,.79,.49)*shine*.85;
            pigment+=ink*.16*pow(1.-abs(n.z),3.);
          }
        }
        if(vType>2.5 && vType<3.5) {
          // Glazes follow the sun's curved surface as the key light moves.
          float glaze=light+.08*(noise(p*.095)-.5);
          pigment=mix(tangerine,ink,smoothstep(-.50,.55,glaze));
          pigment=mix(pigment,butter,.79*smoothstep(.43,.98,glaze));
        }
        if(vType>3.5) pigment=ink;
        if(surface>7.5 && surface<8.5){
          // Lobster carapace: smooth red shell, fine mottling and tail segments.
          vec3 shellPoint=vPoint-bodyCenter;
          float flecks=smoothstep(.62,.84,noise(p*2.7));
          pigment*=.92+.12*noise(p*.6);
          pigment=mix(pigment,pigment*vec3(1.15,.78,.59),flecks*.2);
          float tail=smoothstep(5.,11.,shellPoint.x);
          float seam=1.-smoothstep(.045,.15,abs(sin(shellPoint.x*1.6)));
          pigment*=1.-.23*tail*seam;
          vec3 lamp=normalize(vec3(-.4,.7,.6));
          #if NUM_DIR_LIGHTS > 0
            lamp=directionalLights[0].direction;
          #endif
          float sheen=pow(max(0.,dot(n,normalize(lamp+vec3(0.,0.,1.)))),55.);
          pigment+=vec3(1.,.82,.68)*sheen*.6;
        }
        if(surface>8.5 && surface<9.5){
          vec3 lamp=normalize(vec3(-.4,.7,.6));
          #if NUM_DIR_LIGHTS > 0
            lamp=directionalLights[0].direction;
          #endif
          float shine=pow(max(0.,dot(n,normalize(lamp+vec3(0.,0.,1.)))),72.);
          pigment+=vec3(.7,.85,1.)*shine*.65;
        }
        if(surface>12.5){
          vec3 lamp=normalize(vec3(-.4,.7,.6));
          #if NUM_DIR_LIGHTS > 0
            lamp=directionalLights[0].direction;
          #endif
          float shine=pow(max(0.,dot(n,normalize(lamp+vec3(0.,0.,1.)))),35.);
          pigment+=vec3(.65,.8,.51)*shine*.8;
        }
        float skip=smoothstep(.78,.96,grain)*.18;
        if(surface<.5 && vType>.5 && vType<3.) skip+=smoothstep(.71,.9,brush)*.105;
        pigment=mix(pigment,butter,skip);
        pigment*=surface>.5 ? .98+.04*grain : .96+.065*noise(.14*p);
        if(vType>4.5) {
          // Continuous world coordinates keep the paper grain fixed during orbit.
          float fiber=noise(vec2(p.x*.18+p.y*.05,p.y*.95));
          pigment=mix(ink,butter,.018*smoothstep(.70,.92,fiber));
        }
        if(vType<3.5) pigment*=mix(vec3(.57,.62,.72),vec3(1.),getShadowMask());
        if(environment>.5 && vType<3.5){
          float distance=length(vWorld.xz);
          vec3 mist=vec3(.38,.52,.37);
          pigment=mix(pigment,mist,.78*smoothstep(180.,1900.,distance));
        }
        float opacity=environment>.5 ? 1.-smoothstep(1500.,1800.,length(vWorld.xz)) : 1.;
        if(opacity<.01)discard;
        gl_FragColor=vec4(pigment,opacity);
        #include <colorspace_fragment>
      }
    `
  });
}
