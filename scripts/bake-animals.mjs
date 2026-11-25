import { createServer } from 'vite';
import { writeFile } from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'});
try {
  const {animals,animalModel}=await server.ssrLoadModule('/src/ring/animalBuilder.js');
  const requested=process.argv.slice(2);
  if(requested.some(name=>!animals.includes(name)))throw Error('Unknown animal requested');
  for(const name of requested.length?requested:animals){
    const geometry=animalModel(name);
    const attributes=Object.entries(geometry.attributes).map(([name,attr])=>({name,itemSize:attr.itemSize,array:new Float32Array(attr.array)}));
    const index=geometry.index ? new Uint32Array(geometry.index.array) : null;
    const header={userData:geometry.userData,attributes:attributes.map(a=>({name:a.name,itemSize:a.itemSize,length:a.array.length,offset:0})),index:index?{length:index.length,offset:0}:null};
    // A fixed aligned header keeps all typed-array offsets stable.
    let offset=4096;
    for(const attr of header.attributes){attr.offset=offset;offset+=attr.length*4;}
    if(index){header.index.offset=offset;offset+=index.length*4;}
    const bytes=Buffer.alloc(offset);
    const json=Buffer.from(JSON.stringify(header));
    if(json.length>4092)throw Error('Model header too large');
    bytes.writeUInt32LE(json.length,0);json.copy(bytes,4);
    attributes.forEach((a,i)=>Buffer.from(a.array.buffer).copy(bytes,header.attributes[i].offset));
    if(index)Buffer.from(index.buffer).copy(bytes,header.index.offset);
    await writeFile('public/animals/'+name.toLowerCase()+'.bin',bytes);
    geometry.dispose();
  }
} finally {await server.close();}
