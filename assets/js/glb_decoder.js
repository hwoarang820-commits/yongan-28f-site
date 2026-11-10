
// Native SketchUp 2026 GLB -> original V1.1 W3D2 GPU-layout adapter.
// Runs entirely in a modern browser, without a CDN or external Javascript library.
// All vertices are read from the freshly exported yongan_28f.glb. No old model fallback.
async function decodeSketchUpGLB(url, neighbors, towerBounds) {
  let file;
  if(url instanceof ArrayBuffer){file=url;}else{
    const response = await fetch(url, {cache:'no-cache'});
    if (!response.ok) throw new Error(`無法取得新 GLB（HTTP ${response.status}）。請檢查 GLB 是否在正確目錄。`);
    file=await response.arrayBuffer();}

  const dv = new DataView(file);
  if (file.byteLength<20 || dv.getUint32(0,true)!==0x46546c67 || dv.getUint32(4,true)!==2)
    throw new Error('yongan_28f.glb 不是有效的 GLB 2.0 檔案');
  let loc=12, gltf=null, bin=null;
  while(loc+8<=file.byteLength){
    const len=dv.getUint32(loc,true), type=dv.getUint32(loc+4,true);loc+=8;
    if(loc+len>file.byteLength)throw new Error('GLB 結構資料不完整');
    if(type===0x4e4f534a)gltf=JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(file,loc,len)));
    if(type===0x004e4942)bin=new Uint8Array(file,loc,len);
    loc+=len;
  }
  if(!gltf || !bin)throw new Error('GLB 缺少 JSON 或 BIN 資料');
  if((gltf.extensionsRequired||[]).some(x => /draco|meshopt/i.test(x)))
    throw new Error('此 GLB 使用特殊壓縮，網站不支援；請改用 SketchUp 2026 原生、未經 Draco/meshopt 壓縮的 GLB。');
  const mapType={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
  const comps={5120:{b:1,read:'getInt8',min:-128,max:127},5121:{b:1,read:'getUint8',min:0,max:255},
    5122:{b:2,read:'getInt16',min:-32768,max:32767},5123:{b:2,read:'getUint16',min:0,max:65535},
    5125:{b:4,read:'getUint32',min:0,max:4294967295},5126:{b:4,read:'getFloat32',min:0,max:1}};
  const cached=new Map();
  function accessor(id){
    if(id===undefined || id===null)return null;
    if(cached.has(id))return cached.get(id);
    const a=gltf.accessors[id], v=gltf.bufferViews[a.bufferView], spec=comps[a.componentType];
    if(!v || !spec || a.sparse) throw new Error('GLB 使用網站尚未支援的 accessor（sparse 或未知格式）');
    const size=mapType[a.type]; if(!size) throw new Error('GLB accessor type 不支援');
    const offset=(v.byteOffset||0)+(a.byteOffset||0),stride=v.byteStride||size*spec.b;
    const dd=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
    const out=new Float32Array(a.count*size);
    for(let i=0;i<a.count;i++)for(let j=0;j<size;j++){
      let value=dd[spec.read](offset+i*stride+j*spec.b,true);
      if(a.normalized&&a.componentType!==5126)value=spec.min<0?Math.max(-1,value/spec.max):value/spec.max;
      out[i*size+j]=value;
    }
    const value={data:out,count:a.count,stride:size}; cached.set(id,value);return value;
  }
  function id4(){return [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}
  function multiply(a,b){const c=new Array(16).fill(0);for(let k=0;k<4;k++)for(let r=0;r<4;r++)
    for(let j=0;j<4;j++)c[k*4+r]+=a[j*4+r]*b[k*4+j];return c;}
  function nodeMatrix(n){
    if(n.matrix)return n.matrix;
    const [x,y,z,w]=n.rotation||[0,0,0,1],[sx,sy,sz]=n.scale||[1,1,1],[tx,ty,tz]=n.translation||[0,0,0];
    return [(1-2*(y*y+z*z))*sx,(2*(x*y+z*w))*sx,(2*(x*z-y*w))*sx,0,
      (2*(x*y-z*w))*sy,(1-2*(x*x+z*z))*sy,(2*(y*z+x*w))*sy,0,
      (2*(x*z+y*w))*sz,(2*(y*z-x*w))*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1];
  }
  const point=(mat,p)=>[mat[0]*p[0]+mat[4]*p[1]+mat[8]*p[2]+mat[12],
    mat[1]*p[0]+mat[5]*p[1]+mat[9]*p[2]+mat[13],mat[2]*p[0]+mat[6]*p[1]+mat[10]*p[2]+mat[14]];
  const normal=(mat,p)=>{
    let x=mat[0]*p[0]+mat[4]*p[1]+mat[8]*p[2],
      y=mat[1]*p[0]+mat[5]*p[1]+mat[9]*p[2],
      z=mat[2]*p[0]+mat[6]*p[1]+mat[10]*p[2];
    const m=Math.hypot(x,y,z)||1;return [x/m,y/m,z/m];
  };
  const clamp255=v=>Math.max(0,Math.min(255,Math.round(v*255)));
  const str=(v)=>(v||'').toString().toLowerCase();
  function materialClass(name,nodeName,center){
    const s=str(name),n=str(nodeName);
    // Neighbor bounds are obtained from the same 28F SketchUp model, not hardcoded.
    for(let i=0;i<Math.min(10,neighbors.length);i++){
      const bb=neighbors[i].bounds;if(!bb)continue;
      const mi=bb.min_skp_xyz_m,ma=bb.max_skp_xyz_m;
      if(center && center[0]>=mi[0]-2 && center[0]<=ma[0]+2 &&
         center[2]>=-ma[1]-2 && center[2]<=-mi[1]+2 &&
         center[1]>=mi[2]-4 && center[1]<=ma[2]+4)return 20+i;
    }
    if(s.includes('glass1'))return 1;
    if(s.includes('glass2'))return 2;
    if(s.includes('grass1'))return 3;
    if(s.includes('grass2'))return 4;
    if(s.includes('stone1'))return 5;
    if(s.includes('road1'))return 6;
    if(s.includes('water2'))return 15;
    if(s.includes('water'))return 7;
    if(s.includes('gravel'))return 10;
    if(s.includes('col_g1')||s.includes('core1'))return 16;
    if(s.includes('core'))return 11;
    if(s.includes('temporary'))return 9;
    if(s.includes('building1') || s.includes('v6_block') || n.includes('鄰房'))return 8;
    return 12;
  }
  const entries=[], textureImages={}, seenNodes=new Set();let allMin=[Infinity,Infinity,Infinity],allMax=[-Infinity,-Infinity,-Infinity];
  function addMesh(meshId,mat,names){
    const mesh=gltf.meshes[meshId];if(!mesh)return;
    for(const prim of mesh.primitives||[]){
      if(prim.mode!==undefined && prim.mode!==4)continue;
      const pos=accessor(prim.attributes?.POSITION);if(!pos)continue;
      const nm=accessor(prim.attributes.NORMAL),uv=accessor(prim.attributes.TEXCOORD_0),vc=accessor(prim.attributes.COLOR_0);
      const idx=prim.indices!==undefined?accessor(prim.indices).data:Float32Array.from({length:pos.count},(_,i)=>i);
      if(idx.length%3!==0)continue;
      const material=gltf.materials?.[prim.material]||{},fac=material.pbrMetallicRoughness?.baseColorFactor||material.extensions?.KHR_materials_pbrSpecularGlossiness?.diffuseFactor||[1,1,1,1];
      const textureIndex=material.pbrMetallicRoughness?.baseColorTexture?.index;
      const tex=gltf.textures?.[textureIndex],textureSource=tex?.source ?? tex?.extensions?.EXT_texture_webp?.source;
      const textureKey=textureSource!==undefined?'glb_image_'+textureSource:null;
      const vb=new ArrayBuffer(pos.count*28),out=new DataView(vb);
      let cMin=[Infinity,Infinity,Infinity],cMax=[-Infinity,-Infinity,-Infinity];
      for(let i=0;i<pos.count;i++){
        const off=i*28,p=point(mat,pos.data.subarray(i*3,i*3+3));
        cMin=cMin.map((x,j)=>Math.min(x,p[j]));cMax=cMax.map((x,j)=>Math.max(x,p[j]));
        allMin=allMin.map((x,j)=>Math.min(x,p[j]));allMax=allMax.map((x,j)=>Math.max(x,p[j]));
        for(let j=0;j<3;j++)out.setFloat32(off+j*4,p[j],true);
        const nn=nm?normal(mat,nm.data.subarray(i*3,i*3+3)):[0,1,0];
        for(let j=0;j<3;j++)out.setInt8(off+12+j,Math.max(-127,Math.min(127,Math.round(nn[j]*127))));out.setInt8(off+15,127);
        for(let j=0;j<4;j++)out.setUint8(off+16+j,clamp255(fac[j]*(vc?.data[i*vc.stride+j]??1)));
        out.setFloat32(off+20,uv?.data[i*2]??0,true);out.setFloat32(off+24,uv?.data[i*2+1]??0,true);
      }
      const center=cMin.map((x,j)=>(x+cMax[j])/2);
      const kind=materialClass(material.name||'',names+' '+(mesh.name||''),center);
      const solidNeighbor=(kind>=20&&kind<30)||kind===8||kind===9;
      // Select only meshes within the current 28F SKP's residential-tower bounds.
      // No neighbor geometry, landscape, roads or water is recolored.
      const tb=towerBounds, lo=tb?.min_skp_xyz_m, hi=tb?.max_skp_xyz_m;
      const in28FTower=!!(center&&lo&&hi&&
        center[0]>=lo[0]-.35&&center[0]<=hi[0]+.35&&
        center[1]>=lo[2]-.35&&center[1]<=hi[2]+.35&&
        center[2]>=-hi[1]-.35&&center[2]<=-lo[1]+.35);
      const tower=in28FTower&&!solidNeighbor&&![3,4,6,7,10,15].includes(kind);

      if(solidNeighbor)for(let k=0;k<pos.count;k++)out.setUint8(k*28+19,255);
      entries.push({kind,tower,textureKey,alpha:solidNeighbor?1:(fac[3]??1), vb:new Uint8Array(vb),nv:pos.count,idx:Uint32Array.from(idx)});
    }
  }
  const sceneRoots=gltf.scenes?.[gltf.scene??0]?.nodes || gltf.nodes.map((_,i)=>i).filter(i=>!gltf.nodes.some(n=>(n.children||[]).includes(i)));
  function visit(index,parent,names,depth=0){
    if(depth>100)throw new Error('GLB scene graph 包含過深的巢狀節點');
    const n=gltf.nodes[index];if(!n)return;
    const m=multiply(parent,nodeMatrix(n));const label=names+'/'+(n.name||'');
    if(n.mesh!==undefined)addMesh(n.mesh,m,label);
    (n.children||[]).forEach(k=>visit(k,m,label,depth+1));
  }
  sceneRoots.forEach(i=>visit(i,id4(),''));
  if(!entries.length)throw new Error('新 GLB 中找不到可顯示的三角網格；請在 SketchUp 確保模型圖層可見並重新匯出');
  // Merge primitives sharing material into one GPU draw call. Native SketchUp
  // GLBs may contain thousands of individual component meshes; without this,
  // iPhone/desktop rendering would suffer from excessive WebGL draw calls.
  const materialBuckets=new Map();
  for(const e of entries){
    const key=JSON.stringify([e.kind,e.tower,e.textureKey,Math.round(e.alpha*1000)]);
    let bucket=materialBuckets.get(key);
    if(!bucket){bucket={kind:e.kind,tower:e.tower,textureKey:e.textureKey,alpha:e.alpha,parts:[],nv:0,ni:0};materialBuckets.set(key,bucket);}
    bucket.parts.push(e);bucket.nv+=e.nv;bucket.ni+=e.idx.length;
  }
  const groups=[...materialBuckets.values()].sort((a,b)=>a.kind-b.kind || String(a.textureKey).localeCompare(String(b.textureKey)));
  const nverts=groups.reduce((a,e)=>a+e.nv,0),nindices=groups.reduce((a,e)=>a+e.ni,0);
  const groupCount=groups.length,header=16+groupCount*12;
  const packed=new ArrayBuffer(header+nverts*28+nindices*4),hd=new DataView(packed);
  hd.setUint32(0,0x32443357,true);hd.setUint32(4,nverts,true);hd.setUint32(8,nindices,true);hd.setUint32(12,groupCount,true);
  let vi=0,ii=0,meta=[];const dst=new Uint8Array(packed);
  groups.forEach((g,i)=>{
    const off=16+i*12;hd.setUint32(off,g.kind,true);hd.setUint32(off+4,ii,true);hd.setUint32(off+8,g.ni,true);
    for(const e of g.parts){
      dst.set(e.vb,header+vi*28);
      for(let j=0;j<e.idx.length;j++)hd.setUint32(header+nverts*28+(ii+j)*4,vi+e.idx[j],true);
      vi+=e.nv;ii+=e.idx.length;
    }
    meta.push({textureKey:g.textureKey,alpha:g.alpha,tower:g.tower});
  });
  // Images are read from the current GLB, never the prior 29F HTML.
  await Promise.all((gltf.images||[]).map(async (im,i)=>{
    try{
      let bytes,mime=im.mimeType||'image/png';
      if(im.bufferView!==undefined){const v=gltf.bufferViews[im.bufferView];bytes=new Uint8Array(bin.buffer,bin.byteOffset+(v.byteOffset||0),v.byteLength);}
      else if(im.uri){if(im.uri.startsWith('data:')){const img=new Image();img.src=im.uri;await img.decode();textureImages['glb_image_'+i]=img;return;}
        const imageURL=new URL(im.uri,document.baseURI).href;const res=await fetch(imageURL);if(!res.ok)throw new Error('missing image');bytes=new Uint8Array(await res.arrayBuffer());}
      else return;
      const objectURL=URL.createObjectURL(new Blob([bytes],{type:mime}));const img=new Image();img.src=objectURL;
      await img.decode();URL.revokeObjectURL(objectURL);textureImages['glb_image_'+i]=img;
    }catch(e){console.warn('GLB 貼圖無法解碼，將採材質顏色',i,e);}
  }));
  return {buffer:packed, groups:meta, images:textureImages,
    stats:{vertices:nverts,triangles:nindices/3,groups:groupCount,towerGroups:meta.filter(g=>g.tower).length,min:allMin,max:allMax}};
}

