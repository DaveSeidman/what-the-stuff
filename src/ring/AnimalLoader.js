import {BufferAttribute,BufferGeometry,FileLoader,Loader} from 'three';
export class AnimalLoader extends Loader {
  load(url,onLoad,onProgress,onError){
    const loader=new FileLoader(this.manager);
    loader.setResponseType('arraybuffer');
    loader.load(url,buffer=>{
      try {
        const length=new DataView(buffer).getUint32(0,true);
        const header=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,4,length)));
        const geometry=new BufferGeometry();
        for(const attribute of header.attributes){
          const array=new Float32Array(buffer,attribute.offset,attribute.length);
          geometry.setAttribute(attribute.name,new BufferAttribute(array,attribute.itemSize));
        }
        if(header.index) geometry.setIndex(new BufferAttribute(new Uint32Array(buffer,header.index.offset,header.index.length),1));
        geometry.userData=header.userData;
        onLoad(geometry);
      }catch(error){onError?.(error);}
    },onProgress,onError);
  }
}
