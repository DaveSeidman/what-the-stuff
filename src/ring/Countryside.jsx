import React,{useLayoutEffect} from 'react';
import {useLoader} from '@react-three/fiber';
import {Environment} from '@react-three/drei';
import {EquirectangularReflectionMapping,SRGBColorSpace,TextureLoader} from 'three';

export default function Countryside(){
  const texture=useLoader(TextureLoader,'/environment/harvest-panorama.png');
  useLayoutEffect(()=>{
    texture.mapping=EquirectangularReflectionMapping;
    texture.colorSpace=SRGBColorSpace;
    texture.needsUpdate=true;
  },[texture]);
  return <Environment map={texture} background="only" backgroundBlurriness={.025} backgroundRotation={[0,Math.PI*.3,0]}/>;
}
