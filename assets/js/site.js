
'use strict';

const $=s=>document.querySelector(s);
let embeddedData=null;
let textureData={};
let externalGroups=[];
const chapterData=[
{"id":"intro","short":"首頁","no":"00","en":"INTRODUCTION","title":"永安新村都更案\n基地環境互動分析","lead":"以 28 層住宅建築為中心，整合基地環境、交通動線、景觀視野、日照風場與周邊天際線。","facts":[["BUILDING","地上 28 層"],["STUDY","基地與街廓環境"],["VIEW","四向逐層景觀"]],"note":"滑鼠拖曳可旋轉模型；選擇章節可切換分析內容。"},
{"id":"overview","short":"基地概況","no":"01","en":"SITE / CONTEXT","title":"基地與周邊環境","lead":"基地位於台北市文山區，住宅配置與道路系統銜接周邊街廓、綠地及河濱生活環境。","facts":[["LOCATION","台北市文山區"],["SETTING","住宅街廓與綠地"],["MODEL","住宅與周邊建築"]],"note":"本頁著重辨識基地、住宅及環境相對位置。"},
{"id":"traffic","short":"交通","no":"02","en":"ACCESS / TRAFFIC","title":"交通系統與臨路動線","lead":"區分外部雙向與單向車流、基地出入車道及外部人行路徑，觀察車行與人行接近基地的方式。","facts":[["VEHICLE","外部雙向／單向、內部車道"],["PEDESTRIAN","外部人行"],["LEGEND","橙色車流・藍色步行"]],"note":"路徑動畫表示位置及行走／行車關係；未特別指定方向的線段以往復移動示意。"},
{"id":"view","short":"視野","no":"03","en":"VIEW / EYE LEVEL","title":"逐層景觀視野","lead":"依北、東、南、西四個觀察方向，檢視住宅不同樓層與周邊鄰房、河岸及天際線的相對視覺關係。","facts":[["FLOOR","1～28F"],["1F HEIGHT","6.0 m"],["2–28F","3.5 m／層"],["VIEWPOINTS","北／東／南／西"]],"note":"可切換人眼與鳥瞰視域；樓層高度以 17F 觀察點為基準換算。"},
{"id":"sun","short":"日照","no":"04","en":"SOLAR / SEASONS","title":"季節日照與建築受光","lead":"透過夏至、春秋分與冬至的太陽路徑，理解不同時節住宅量體的受照方向與陰影變化。","facts":[["SEASON","夏至／春秋分／冬至"],["TIME","07:00–17:00"],["MODE","日照軌跡圖解"]],"note":"日照路徑為概念示意，不代表所在地的實際日照時數。"},
{"id":"wind","short":"風場","no":"05","en":"WIND / SEASON","title":"風環境與迎風面下洗","lead":"從冬季東北季風、夏季西南風及颱風情境，觀察高層建築與街廓的來風方向及可能的下洗位置。","facts":[["WINTER","東北季風"],["SUMMER","西南季風"],["STORM","多方向颱風情境"]],"note":"流線為概念性氣流表現，非風洞或 CFD 模擬結果。"},
{"id":"massing","short":"建築量體","no":"06","en":"MASSING","title":"28F 住宅建築量體","lead":"檢視住宅塔樓、立面、玻璃帷幕與基座地景的配置關係，並觀察量體與周邊環境的尺度對比。","facts":[["STOREYS","地上 28 層"],["GROUND FLOOR","6.0 m"],["UPPER FLOORS","3.5 m／層"]],"note":"建築量體依 3D 模型呈現；屋突及設備突出物高度另依設計圖面檢討。"},
{"id":"garden","short":"綠化庭園","no":"07","en":"LANDSCAPE","title":"綠化、庭園與地景","lead":"觀察基地綠地、景觀鋪面與建築開放空間在街廓及住宅基座周邊的空間配置。","facts":[["LANDSCAPE","綠地、植栽與步行空間"],["RELATION","建築基座與地景銜接"]],"note":"植栽及景觀材質以建築模型呈現。"},
{"id":"circulation","short":"動線","no":"08","en":"CIRCULATION","title":"住戶、外送與物管動線","lead":"整合基地內部的住戶、外送、物業管理及車道進出路徑，辨識交會位置及管理動線分流。","facts":[["RESIDENT","住戶進出路徑"],["DELIVERY","外送進入與交付路徑"],["MANAGEMENT","物業管理路徑"],["VEHICLE","內部車行系統"]],"note":"可按路徑類型進行篩選，並以不同圖示區分人流、車流及後勤流線。"},
{"id":"neighbors","short":"鄰房高度","no":"09","en":"NEIGHBOR HEIGHTS","title":"周邊鄰房與天際線","lead":"比較周邊八處建築量體與住宅塔樓的高度關係，理解樓層視野與周邊街廓的遮擋層次。","facts":[["BUILDINGS","八處代表性鄰房"],["HEIGHT","模型相對高度"],["VIEW","塔樓與街廓天際線"]],"note":"點選鄰房項目，即可檢視其與基地住宅的高度和位置關係。"}
];
const state={mode:'intro',viewDir:'東',floor:17,fov:70,eyeMode:'human',lookYaw:0,lookPitch:0,hour:12,season:'春秋分',windMode:'NE',typhoonFrom:'E',windSpeed:1,filter:'all',layerView:'all',neighbor:-1};
const COL={vehicle:'#ffc28b',pedestrian:'#74bfff',management:'#e3b7ff',garden:'#a6d8b2',view:'#8de3e4',neighbor:'#ffab9d',sun:'#ee9a52',wind:'#79bde8',winter:'#79bde8',summer:'#eda871',storm:'#bfa7e9'};
const canvas=$('#scene'),mount=$('#stage'),overlay=$('#analysisOverlay'),loading=$('#loadflag');
const rail=$('#rail'),story=$('#story'),legend=$('#legendItems');
const chapters=chapterData.map(s=>s.id);
chapterData.forEach((s,i)=>{
 const b=document.createElement('button'); b.className='railbtn';b.dataset.id=s.id;
 b.innerHTML=`<span class="dot"></span><span class="count">${s.no}</span><span class="name">${s.short}</span>`;b.title=s.short;b.onclick=()=>setChapter(i);rail.append(b);
 const op=document.createElement('option');op.value=String(i);op.textContent=`${s.no}｜${s.short}`;$('#mobileChapter').append(op);
 const tick=document.createElement('span');$('#progressTicks').append(tick);
});
let roads=[],labels=[],points=[],routes=[],neighbors=[],bounds={};
let selectedPage=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));const rad=Math.PI/180;
const idMat=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
function perspective(out,fov,aspect,near,far){const f=1/Math.tan(fov*.5);out.fill(0);out[0]=f/aspect;out[5]=f;out[10]=(far+near)/(near-far);out[11]=-1;out[14]=2*far*near/(near-far);}
function lookAt(out,eye,tar){let zx=eye[0]-tar[0],zy=eye[1]-tar[1],zz=eye[2]-tar[2];let len=Math.hypot(zx,zy,zz)||1;zx/=len;zy/=len;zz/=len;let xx=zz,xy=0,xz=-zx;len=Math.hypot(xx,xy,xz)||1;xx/=len;xy/=len;xz/=len;const yx=zy*xz-zz*xy, yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;out.set([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-(xx*eye[0]+xy*eye[1]+xz*eye[2]),-(yx*eye[0]+yy*eye[1]+yz*eye[2]),-(zx*eye[0]+zy*eye[1]+zz*eye[2]),1]);}
function mult(out,a,b){const c=new Float32Array(16);for(let k=0;k<4;k++)for(let r=0;r<4;r++)c[k*4+r]=a[r]*b[k*4]+a[4+r]*b[k*4+1]+a[8+r]*b[k*4+2]+a[12+r]*b[k*4+3];out.set(c);}
const vp=idMat(),view=idMat(),proj=idMat(),lightVP=idMat(),lightView=idMat(),lightProj=idMat();
function ortho(out,left,right,bottom,top,near,far){out.fill(0);out[0]=2/(right-left);out[5]=2/(top-bottom);out[10]=-2/(far-near);out[12]=-(right+left)/(right-left);out[13]=-(top+bottom)/(top-bottom);out[14]=-(far+near)/(far-near);out[15]=1;}
function makeLightVP(dir){
 const c=bounds['04-住宅棟']?.center_web_xyz_m||[0,0,0],centre=[c[0],c[1],c[2]],d=Math.hypot(...dir),n=dir.map(v=>v/d);
 const e=centre.map((v,i)=>v+n[i]*580);
 lookAt(lightView,e,centre);ortho(lightProj,-315,315,-315,315,8,1180);mult(lightVP,lightProj,lightView);
}
let gl=null,shader=null,vao=null,groups=[],uniform={},ready=false,info=null,vertexNum=0,triangleNum=0;
let depthProgram=null,depthVP=null,shadowFBO=null,shadowTex=null,depthFBO=null,sceneDepth=null,hdrEnv=null;
let shadowSize=1536,depthWidth=0,depthHeight=0,shadowActive=false,aoActive=false,lastLightKey='',lastHDRKey='';
let shadowReady=false;let depthReady=false;let lastGPUError='';
let webTextures={},fallbackTex=null;
let decodedTextures={};
let orbit={yaw:-.73,pitch:.54,dist:280,target:[324.0193, 18.6039, -399.4448]},desired={yaw:-.73,pitch:.54,dist:280,target:[324.0193, 18.6039, -399.4448]};
let eye=[0,0,0],timeTick=0,lastOverlay=0;const placedLabels=[]; const touches=new Map();let pinch=0;
const VSH=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aN;
layout(location=2) in vec4 aColor;
layout(location=3) in vec2 aUV;
uniform mat4 uVP;
out vec3 vPos;out vec3 vN;out vec4 vColor;out vec2 vUV;
void main(){vPos=aPos;vN=aN.xyz;vColor=aColor;vUV=aUV;gl_Position=uVP*vec4(aPos,1.);}`;
const FSH=`#version 300 es
precision highp float;
precision highp sampler2DShadow;
in vec3 vPos;in vec3 vN;in vec4 vColor;in vec2 vUV;
out vec4 color;
uniform vec3 uSun,uEye;
uniform float uTime,uAmbient,uAlpha;
uniform sampler2D uTex;
uniform sampler2DShadow uShadowTex;
uniform sampler2D uCamDepth;
uniform sampler2D uHDREnv;
uniform mat4 uLightVP,uView;
uniform vec2 uDepthSize;
uniform float uNear,uAOIntensity,uTanHalfFov;
uniform int uShadowsOn,uAOOn,uAOSamples;
uniform int uKind,uUseTex,uNeighborMode,uFocusNeighbor,uTower;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
// RGBM environment map decodes genuinely greater-than-1 linear radiance (up to 12×).
vec3 sampleHDREnvironment(vec3 d,float lod){
 d=normalize(d);
 vec2 uv=vec2(fract(atan(d.z,d.x)/(6.28318530718)+.5),acos(clamp(d.y,-1.,1.))/3.14159265359);
 vec4 rgbm=textureLod(uHDREnv,uv,lod);
 return rgbm.rgb*rgbm.a*12.0;
}
float calcSoftShadow(vec3 n,vec3 l){
 if(uShadowsOn==0)return 1.;
 vec4 q=uLightVP*vec4(vPos,1.);
 vec3 ndc=q.xyz/max(q.w,.0001);
 vec3 s=ndc*.5+.5;
 if(s.x<=.001||s.x>=.999||s.y<=.001||s.y>=.999||s.z<=0.||s.z>=1.)return 1.;
 float bias=mix(.00018,.00068,1.-max(dot(n,l),0.));
 float angle=6.2831853*fract(sin(dot(vPos.xz,vec2(31.83,12.45)))*1581.7);
 mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
 vec2 taps[12]=vec2[12](vec2(-.86,.10),vec2(.49,.77),vec2(.83,-.48),vec2(-.45,-.72),vec2(-.24,.49),vec2(.22,-.15),vec2(.07,.94),vec2(-.96,-.51),vec2(.95,.37),vec2(-.70,.69),vec2(.45,-.93),vec2(.04,-.78));
 float lit=0.;
 for(int k=0;k<12;k++){
  vec2 uv=s.xy+rot*taps[k]*(2.9/float(textureSize(uShadowTex,0).x));
  lit+=texture(uShadowTex,vec3(uv,s.z-bias));
 }
 return clamp(lit/12.,.0,1.);
}
float calcAmbientOcclusion(vec3 n){
 if(uAOOn==0||uAOSamples==0)return 0.;
 vec2 uv=gl_FragCoord.xy/uDepthSize;
 vec3 viewP=(uView*vec4(vPos,1.)).xyz;
 float viewDist=-viewP.z;
 if(viewDist<=0.)return 0.;
 // Radius is 3.8 metres in view space; convert to screen pixels with each camera fov.
 float focus=.5*uDepthSize.y/max(uTanHalfFov,.01);
 float radiusPx=clamp(3.8*focus/viewDist,1.8,50.);
 vec2 offsets[12]=vec2[12](vec2(.18,.48),vec2(-.49,.12),vec2(.61,-.09),vec2(-.05,-.84),vec2(.69,.52),vec2(-.62,-.53),vec2(.94,-.37),vec2(-.96,.34),vec2(.37,.91),vec2(-.27,.95),vec2(.20,-.27),vec2(-.29,-.18));
 float ang=6.2831853*fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
 mat2 rotate=mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
 vec3 viewN=normalize(mat3(uView)*n);
 float occ=0.,weight=0.;
 float nf=uTanHalfFov;
 for(int k=0;k<12;k++){
  if(k>=uAOSamples)break;
  vec2 suv=uv+(rotate*offsets[k]*radiusPx)/uDepthSize;
  if(any(lessThan(suv,vec2(.005)))||any(greaterThan(suv,vec2(.995))))continue;
  float dep=texture(uCamDepth,suv).r;
  if(dep>.9999)continue;
  float zndc=dep*2.-1.;float far=3000.;
  float zz=-(2.*uNear*far)/(far+uNear-zndc*(far-uNear));
  vec3 q=vec3((suv.x*2.-1.)*(-zz)*nf*uDepthSize.x/uDepthSize.y,(suv.y*2.-1.)*(-zz)*nf,zz);
  vec3 diff=q-viewP;
  float dist=length(diff);
  if(dist>.12&&dist<5.0){
   float facing=dot(diff/dist,viewN);
   float falloff=1.-smoothstep(.3,5.,dist);
   occ+=smoothstep(.05,.58,facing)*falloff;
  }
  weight+=1.;
 }
 return clamp((occ/max(weight,1.))*uAOIntensity*1.7,0.,.70);
}
void main(){
 vec3 n=normalize(vN),l=normalize(uSun),v=normalize(uEye-vPos);
 float ndl=max(dot(n,l),0.),ndv=clamp(abs(dot(n,v)),0.,1.);
 float fres=pow(1.-ndv,5.),sunSpec=max(dot(reflect(-l,n),v),0.);
 vec3 rgb=pow(clamp(vColor.rgb,0.005,1.),vec3(2.2));
 if(uUseTex==1)rgb*=pow(max(texture(uTex,vec2(vUV.x,1.-vUV.y)).rgb,vec3(.015)),vec3(2.2));
 bool glass=(uKind==1||uKind==2);
 bool grass=(uKind==3||uKind==4||uKind==10);
 bool stone=(uKind==5||uKind==11);
 bool road=(uKind==6);
 bool water=(uKind==7||uKind==15);
 bool neigh=(uKind>=20&&uKind<30);
 bool surrounding=(neigh||uKind==8||uKind==9||uKind==12||uKind==13);
 float rough=stone?.67:(grass?.91:(road?.86:(water?.12:(glass?.07:.56))));
 float specular=pow(sunSpec,mix(152.,11.,rough)) * mix(.72,.10,rough);
 float shadow=calcSoftShadow(n,l);
 float ao=(!glass && !water)?calcAmbientOcclusion(n):0.;
 vec3 r=reflect(-v,n);
 vec3 sky=sampleHDREnvironment(r,glass?0.:3.);
 sky=sky/(1.+sky*.52);
 vec3 horizon=mix(vec3(.12,.17,.20),sky,.58);
 if(glass){
   // GLB source RGB and texture are the *only* base tint; reflection is a mild presentation overlay.
   // glass1 0.25 alpha, glass2 0.90 alpha come from vColor.a below.
   vec3 reflected=sampleHDREnvironment(r,uKind==2?1.0:0.0);
   reflected=reflected/(1.0+reflected*.72);
   float reflectMix=(uKind==1 ? .09+.27*fres : .045+.11*fres);
   rgb=mix(rgb,reflected,reflectMix);
   rgb+=vec3(1.,.97,.92)*specular*.17*shadow;
 }else if(water){
   float wave=noise(vPos.xz*.12+uTime*.05);
   rgb=mix(rgb,sky,.26+.32*fres)+vec3(.035,.075,.11)*wave+specular*vec3(.80,.91,1.);
 }else{
   float grain=noise(vPos.xz*(grass?.68:(stone?.14:.36))+vPos.y*.02);
   if(grass)rgb*=.88+.22*grain;
   if(stone)rgb*=.92+.13*grain;
   if(road)rgb*=.92+.1*grain;
   rgb*=uAmbient*(1.-.68*ao)+.69*ndl*mix(.27,1.,shadow);
   rgb+=sky*(.03+.25*fres)*(stone?.24:grass?.045:road?.06:.22);
   rgb+=vec3(1.,.97,.92)*specular*(stone?.26:.52)*shadow;
 }
 // Alpha belongs exclusively to the current GLB material (already packed in vColor.a).
 float alpha=clamp(vColor.a,0.,1.);
 // Preserve all source GLB materials and make only the residential tower lighter.
 // Tonal changes occur after lighting: opaque neighbors, roads, and landscaping stay unchanged.
 rgb=rgb/(rgb+vec3(.27));
 if(uTower==1){
   if(uKind==1){
     // Source blue glass1: soften its visible blue tint by exactly 20% toward white.
     // Keep the original 0.25 alpha, UV texture, and reflections untouched.
     rgb=mix(rgb,vec3(1.0),0.20);
   }else if(uKind==2){
     // Warm glass2 keeps its original color, with a subtle overall facade lift.
     rgb=mix(rgb,vec3(1.0),0.09);
   }else{
     // Make the 28F residential mass more luminous than its context.
     rgb=mix(rgb,vec3(1.0),0.17);
   }
 }
 color=vec4(pow(clamp(rgb,0.,1.),vec3(.89)),alpha);

}`;
function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('著色器錯誤：'+gl.getShaderInfoLog(s));return s}
const DEPTH_VSH=`#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
uniform mat4 uDepthVP;
void main(){gl_Position=uDepthVP*vec4(aPos,1.);}`;
const DEPTH_FSH=`#version 300 es
precision highp float;
void main(){}`;
function compileProgram(vs,fs){
 const p=gl.createProgram();gl.attachShader(p,compile(gl.VERTEX_SHADER,vs));gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);
 if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('渲染程序連結失敗：'+gl.getProgramInfoLog(p));
 return p;
}
function makeDepthTarget(w,h,asShadow){
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,w,h,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,asShadow?gl.LINEAR:gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,asShadow?gl.LINEAR:gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 if(asShadow){gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_MODE,gl.COMPARE_REF_TO_TEXTURE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_COMPARE_FUNC,gl.LEQUAL);}
 const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
 gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,tex,0);
 gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
 const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
 gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 if(!ok){gl.deleteFramebuffer(fbo);gl.deleteTexture(tex);return null;}
 return {tex,fbo,width:w,height:h};
}
function setupDepthResources(){
 depthProgram=compileProgram(DEPTH_VSH,DEPTH_FSH);depthVP=gl.getUniformLocation(depthProgram,'uDepthVP');
 shadowSize=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),innerWidth<760?1024:1536);
 const a=makeDepthTarget(shadowSize,shadowSize,true);
 shadowActive=!!a;if(a){shadowFBO=a.fbo;shadowTex=a.tex;}
 if(!shadowActive)console.warn('陰影貼圖不支援，保留原始光照');
 resizeAODepth();
}
function resizeAODepth(){
 if(!gl||!depthProgram)return;
 if(depthFBO){gl.deleteFramebuffer(depthFBO);gl.deleteTexture(sceneDepth);depthFBO=null;sceneDepth=null;}
 const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
 depthWidth=Math.min(canvas.width,max);depthHeight=Math.min(canvas.height,max);
 const a=makeDepthTarget(depthWidth,depthHeight,false);
 aoActive=!!a;if(a){depthFBO=a.fbo;sceneDepth=a.tex;}
 if(!aoActive)console.warn('AO 深度緩衝不支援，保留原始環境光照');
}
function drawDepth(fbo,w,h,mat,shadow){
 gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.viewport(0,0,w,h);
 gl.colorMask(false,false,false,false);gl.depthMask(true);gl.disable(gl.BLEND);
 gl.enable(gl.DEPTH_TEST);gl.clear(gl.DEPTH_BUFFER_BIT);
 gl.useProgram(depthProgram);gl.uniformMatrix4fv(depthVP,false,mat);
 gl.bindVertexArray(vao);
 if(shadow){gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.4,2.1);}
 for(const g of groups){if(g.id===1||g.id===2||g.id===15)continue;gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_INT,g.start*4);}
 if(shadow)gl.disable(gl.POLYGON_OFFSET_FILL);
 gl.colorMask(true,true,true,true);gl.bindFramebuffer(gl.FRAMEBUFFER,null);
}
// Environment texture is encoded as RGBM radiance (0..12), not an 8-bit LDR image.
// All sky values are generated locally: no external network dependency, no fake photo panorama.
function buildHDRSky(sun){
 const width=768,height=384,data=new Uint8Array(width*height*4);
 const length=Math.hypot(...sun);const L=sun.map(v=>v/length);
 const clamp01=x=>Math.max(0,Math.min(1,x));
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const lon=(x/width-.5)*Math.PI*2,lat=Math.PI*y/height;
  const d=[Math.sin(lat)*Math.cos(lon),Math.cos(lat),Math.sin(lat)*Math.sin(lon)];
  const yy=d[1];const horizon=Math.exp(-Math.pow(yy/.115,2));
  const sky=Math.max(0,yy);
  let R=.20+.28*sky+.32*horizon,G=.34+.38*sky+.24*horizon,B=.55+.53*sky+.14*horizon;
  if(yy<0){let a=clamp01(-yy*6);R=R*(1-a)+(.23+.08*Math.sin(lon*3))*a;G=G*(1-a)+.26*a;B=B*(1-a)+.23*a;}
  // soft white clouds and long bright sky reflections provide facade variation.
  const cloud=Math.pow(Math.max(0,Math.sin(lon*5.7+1.4*Math.sin(lat*4.5))*Math.cos(lat*6.9)),5)*Math.max(0,yy)*.50;
  R+=cloud;G+=cloud;B+=cloud;
  const s=Math.max(0,d[0]*L[0]+d[1]*L[1]+d[2]*L[2]);
  const disk=Math.pow(s,3000)*9.0,glow=Math.pow(s,120)*.70;
  R+=disk+glow;G+=disk*.87+glow*.91;B+=disk*.65+glow*.74;
  const m=Math.min(1,Math.ceil(Math.max(R,G,B)/12*255)/255)||1;
  const i=(y*width+x)*4;
  data[i]=Math.round(clamp01(R/(m*12))*255);data[i+1]=Math.round(clamp01(G/(m*12))*255);data[i+2]=Math.round(clamp01(B/(m*12))*255);data[i+3]=Math.round(m*255);
 }
 if(!hdrEnv)hdrEnv=gl.createTexture();
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,hdrEnv);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
 gl.generateMipmap(gl.TEXTURE_2D);
 gl.activeTexture(gl.TEXTURE0);
}
function makeTexture(img){
 const tx=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tx);
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
 gl.generateMipmap(gl.TEXTURE_2D);
 return tx;
}
function initRenderer(buffer){
 gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
 if(!gl)throw Error('此裝置無法建立 WebGL2 3D 畫面');
 const dv=new DataView(buffer);if(dv.getUint32(0,true)!==0x32443357)throw Error('V10.4 模型格式錯誤');
 const nv=dv.getUint32(4,true),ni=dv.getUint32(8,true),ng=dv.getUint32(12,true);vertexNum=nv;triangleNum=ni/3;
 const stride=28;
 let offset=16;groups=[];
 for(let i=0;i<ng;i++){groups.push({id:dv.getUint32(offset,true),start:dv.getUint32(offset+4,true),count:dv.getUint32(offset+8,true),...(externalGroups[i]||{})});offset+=12;}
 const vb=buffer.slice(offset,offset+nv*stride),ib=buffer.slice(offset+nv*stride,offset+nv*stride+ni*4);
 if(vb.byteLength!==nv*stride||ib.byteLength!==ni*4)throw Error('模型幾何資料截斷');
 shader=gl.createProgram();gl.attachShader(shader,compile(gl.VERTEX_SHADER,VSH));gl.attachShader(shader,compile(gl.FRAGMENT_SHADER,FSH));gl.linkProgram(shader);
 if(!gl.getProgramParameter(shader,gl.LINK_STATUS))throw Error('模型材質程式啟動失敗：'+gl.getProgramInfoLog(shader));
 gl.useProgram(shader);
 for(const n of ['uVP','uSun','uEye','uTime','uAmbient','uKind','uTower','uUseTex','uAlpha','uTex','uNeighborMode','uFocusNeighbor','uShadowTex','uCamDepth','uHDREnv','uLightVP','uView','uDepthSize','uNear','uTanHalfFov','uShadowsOn','uAOOn','uAOSamples','uAOIntensity'])uniform[n]=gl.getUniformLocation(shader,n);
 vao=gl.createVertexArray();gl.bindVertexArray(vao);
 const vbo=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vbo);gl.bufferData(gl.ARRAY_BUFFER,vb,gl.STATIC_DRAW);
 const ibo=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ibo);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ib,gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,stride,0);
 gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.BYTE,true,stride,12);
 gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.UNSIGNED_BYTE,true,stride,16);
 gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,2,gl.FLOAT,false,stride,20);
 gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.depthFunc(gl.LEQUAL);gl.clearColor(.970,.981,.988,1);
 // Build textures from source GLB's genuine SketchUp material images, embedded offline.
 for(const [name,img] of Object.entries(decodedTextures))webTextures[name]=makeTexture(img);
 fallbackTex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,fallbackTex);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 setupDepthResources();buildHDRSky([.5,.9,.38]);
 ready=true;
}
function resize(){let dpr=Math.min(devicePixelRatio||1,innerWidth<850?1.2:1.7);canvas.width=Math.max(1,Math.floor(mount.clientWidth*dpr));canvas.height=Math.max(1,Math.floor(mount.clientHeight*dpr));overlay.setAttribute('viewBox',`0 0 ${mount.clientWidth} ${mount.clientHeight}`);overlay.setAttribute('width',mount.clientWidth);overlay.setAttribute('height',mount.clientHeight);if(gl){gl.viewport(0,0,canvas.width,canvas.height);if(depthProgram)resizeAODepth();}}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,300));
function updateMatrices(){
 if(state.mode==='view'&&state.eyeMode==='human'){
  eye=getObserver();
  const heading={北:0,東:Math.PI/2,南:Math.PI,西:-Math.PI/2}[state.viewDir]+state.lookYaw;
  const pitch=state.lookPitch;
  const target=[eye[0]+Math.sin(heading)*160*Math.cos(pitch),eye[1]+Math.sin(pitch)*160,eye[2]-Math.cos(heading)*160*Math.cos(pitch)];
  perspective(proj,state.fov*rad,canvas.width/canvas.height,.08,3000);lookAt(view,eye,target);
 }else{
  const c=orbit,p=Math.cos(c.pitch);eye=[c.target[0]+Math.sin(c.yaw)*p*c.dist,c.target[1]+Math.sin(c.pitch)*c.dist,c.target[2]+Math.cos(c.yaw)*p*c.dist];
  perspective(proj,48*rad,canvas.width/canvas.height,.25,3000);lookAt(view,eye,c.target);
 }
 mult(vp,proj,view);
}
function project(p){const x=p[0],y=p[1],z=p[2];const w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];if(w<=.005)return null;const xx=(vp[0]*x+vp[4]*y+vp[8]*z+vp[12])/w;const yy=(vp[1]*x+vp[5]*y+vp[9]*z+vp[13])/w;const zz=(vp[2]*x+vp[6]*y+vp[10]*z+vp[14])/w;if(zz<-1||zz>1)return null;return {x:(xx*.5+.5)*mount.clientWidth,y:(1-yy)*.5*mount.clientHeight};}
function aim(from,tar){desired.target=tar.slice();const dx=from[0]-tar[0],dy=from[1]-tar[1],dz=from[2]-tar[2];desired.dist=Math.hypot(dx,dy,dz);desired.yaw=Math.atan2(dx,dz);desired.pitch=Math.asin(dy/Math.max(desired.dist,1));}
function wheel(e){e.preventDefault();if(state.mode==='view'&&state.eyeMode==='human'){state.fov=clamp(state.fov+Math.sign(e.deltaY)*4,30,110);return;}desired.dist=clamp(desired.dist*Math.exp(e.deltaY*.001),25,1400)}
canvas.addEventListener('wheel',wheel,{passive:false});
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);touches.set(e.pointerId,{x:e.clientX,y:e.clientY});});
canvas.addEventListener('pointermove',e=>{if(!touches.has(e.pointerId))return;const before=touches.get(e.pointerId);const dx=e.clientX-before.x,dy=e.clientY-before.y;touches.set(e.pointerId,{x:e.clientX,y:e.clientY});if(touches.size===1){if(state.mode==='view'&&state.eyeMode==='human'){state.lookYaw-=dx*.004;state.lookPitch=clamp(state.lookPitch-dy*.004,-.95,.95);}else{desired.yaw-=dx*.005;desired.pitch=clamp(desired.pitch+dy*.005,-.07,1.4)}}else{const pts=[...touches.values()];const d=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);if(pinch)desired.dist=clamp(desired.dist*pinch/d,25,1400);pinch=d;}});
function endPointer(e){touches.delete(e.pointerId);if(touches.size<2)pinch=0;try{canvas.releasePointerCapture(e.pointerId)}catch{}}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);
canvas.addEventListener('dblclick',()=>{if(state.mode==='view'&&state.eyeMode==='human'){state.lookYaw=0;state.lookPitch=0;}else setView();});

function esc(s){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function buttons(group,choices){return '<div class="control-bits">'+choices.map(([id,text])=>`<button class="choice ${state[group]===id?'active':''}" data-key="${group}" data-value="${esc(id)}">${esc(text)}</button>`).join('')+'</div>';}
function slider(id,min,max,step,value){return `<input class="range" id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}">`;}
function windRoseHTML(){
 const N=105;
 const ax=(bearing,r)=>[N+Math.sin(bearing*Math.PI/180)*r,N-Math.cos(bearing*Math.PI/180)*r];
 const line=(b,r1,r2,col,w=1,op=.55)=>{const a=ax(b,r1),c=ax(b,r2);return `<line x1="${a[0]}" y1="${a[1]}" x2="${c[0]}" y2="${c[1]}" stroke="${col}" stroke-opacity="${op}" stroke-width="${w}"/>`};
 const wedge=(b,col,selected)=>{const p=[ax(b-15,13),ax(b-10,selected?71:54),ax(b+10,selected?71:54),ax(b+15,13)];return `<polygon points="${p.map(x=>x.join(',')).join(' ')}" fill="${col}" fill-opacity="${selected?'.65':'.28'}" stroke="${col}" stroke-opacity=".75" stroke-width="1.1"/>`};
 const wActive=state.windMode==='NE',sActive=state.windMode==='SW';
 const stormBearing={E:90,SE:135,NW:315,N:0}[state.typhoonFrom]??90;
 const stormWedge=state.windMode==='STORM'?wedge(stormBearing,'#bfa7e9',true):'';
 return `<div class="windrose-card"><div class="windrose-head"><b>季風風向圖</b><span>方位示意</span></div><svg class="windrose" viewBox="0 0 210 210" aria-label="冬季東北風與夏季西南風方向示意">
  ${[24,48,73].map(r=>`<circle cx="105" cy="105" r="${r}" fill="none" stroke="#b3cad2" stroke-opacity=".23" stroke-width="1"/>`).join('')}
  ${Array.from({length:12},(_,i)=>line(i*30,0,76,'#a8bbc5',.7,.24)).join('')}
  ${wedge(45,'#79bde8',wActive)}${wedge(225,'#eda871',sActive)}${stormWedge}
  ${[45,225].map(b=>line(b,0,68,'#e1e8ed',1.25,.9)).join('')}
  <circle cx="105" cy="105" r="3.5" fill="#ebf2f5"/>
  <g font-size="12" fill="#e6f0f3" font-family="Microsoft JhengHei, sans-serif" text-anchor="middle"><text x="105" y="17">N</text><text x="105" y="201">S</text><text x="197" y="109">E</text><text x="13" y="109">W</text></g>
  <g font-size="11" font-weight="700" text-anchor="middle"><text fill="#93d1ef" x="171" y="34">NE</text><text fill="#f3bc87" x="39" y="183">SW</text></g>
 </svg><div class="windrose-keys"><span><i style="background:#79bde8"></i>冬季東北風</span><span><i style="background:#eda871"></i>夏季西南風</span><span><i style="background:#bfa7e9"></i>颱風來風情境</span></div><div class="mini-note">圖形僅表達風向情境，不代表風頻百分比。</div></div>`;
}
function controlsHTML(){const mode=state.mode;
 if(['traffic','circulation'].includes(mode))return `<div class="control-panel"><div class="label">ROUTE DISPLAY / 動線顯示</div>${buttons('filter',[['all','全部動線'],['veh','車行'],['ped','人行'],['mgmt','住戶／後勤']])}<div class="mini-note">${mode==='traffic'?'道路與基地出入交通系統':'社區住戶、外送與物管行走路徑'} · 彩色點虛線與動態圖示</div></div>`;
 if(mode==='view')return `<div class="control-panel"><div class="label">VIEW MODE / 觀看方式</div>${buttons('eyeMode',[['human','人眼模擬'],['aerial','鳥瞰視域']])}<div class="label" style="margin-top:13px">FLOOR / 視野樓層</div><div class="control-row"><b>觀察樓層</b><strong>${state.floor}F</strong></div>${slider('floorRange',1,28,1,state.floor)}<div class="label">DIRECTION / 觀察方向</div>${buttons('viewDir',['北','東','南','西'].map(v=>[v,v+'向']))}<div class="label" style="margin-top:15px">FIELD OF VIEW / 視角範圍</div><div class="control-row"><b>水平視角</b><strong>${state.fov}°</strong></div>${slider('fovRange',30,120,5,state.fov)}<div class="mini-readout"><div><span>基準高度</span><strong>${embeddedData?.reference_floor || 17}F 人眼</strong></div><div><span>現在高度</span><strong>${getObserver()[1].toFixed(2)}m（模型標高）</strong></div></div></div>`;
 if(mode==='sun')return `<div class="control-panel"><div class="label">SEASON / 分析季節</div>${buttons('season',['夏至','春秋分','冬至'].map(v=>[v,v]))}<div class="control-row"><span>日照時刻</span><strong>${String(Math.floor(state.hour)).padStart(2,'0')}:${state.hour%1?'30':'00'}</strong></div>${slider('timeRange',7,17,.5,state.hour)}<div class="mini-note">太陽路徑及陰影僅為概念圖解。</div></div>`;
 if(mode==='wind'){
 const isNE=state.windMode==='NE',isSW=state.windMode==='SW',isTyphoon=state.windMode==='STORM';
 const seasonTitle=isNE?'冬季｜東北季風':isSW?'夏季｜西南季風':'颱風期間｜可變風向';
 const month=isNE?'10月–翌年4月（12–2月較強）':isSW?'6月中–9月中（8月較明顯）':'7–9月較活躍，其他月份亦可能發生';
 const description=isNE?'東北側迎風，檢視住宅塔樓下洗及入口避風配置。':isSW?'西南側迎風，檢視沿街與公設間的通風關係。':'颱風風向非固定方位；以下提供東、東南、西北、北側來風的概念情境。';
 const stormOpts=isTyphoon?`<div class="label" style="margin-top:13px">TYPHOON APPROACH / 來風方向</div>${buttons('typhoonFrom',[['E','東側'],['SE','東南側'],['NW','西北側'],['N','北側']])}`:'';
 return `<div class="control-panel"><div class="label">SEASONAL WIND / 風場情境</div>${buttons('windMode',[['NE','東北季風'],['SW','西南季風'],['STORM','颱風']])}<div class="mini-readout wind-season-detail"><div><span>目前情境</span><strong>${seasonTitle}</strong></div><div><span>盛行／活躍月份</span><strong>${month}</strong></div></div><div class="mini-note">${description}</div>${stormOpts}<div class="control-row"><span>流線動畫速率</span><strong>${state.windSpeed.toFixed(1)}×</strong></div>${slider('windRange',.3,2.4,.1,state.windSpeed)}${windRoseHTML()}<div class="mini-note">資料：<a href="https://pweb.cwa.gov.tw/PopularScience/wt/wt_3.html" target="_blank" rel="noopener noreferrer" style="color:#b9e4ff">中央氣象署｜季風</a>、<a href="https://www.cwa.gov.tw/V8/C/K/Encyclopedia/typhoon/typhoon.pdf" target="_blank" rel="noopener noreferrer" style="color:#b9e4ff">颱風百問</a>。風場、下洗與颱風僅為概念性風向示意。</div></div>`;
 }
 if(mode==='massing')return `<div class="control-panel"><div class="label">MODEL FOCUS / 模型焦點</div>${buttons('layerView',[['all','全部'],['tower','住宅量體'],['site','模型地景']])}</div>`;
 if(mode==='neighbors')return `<div class="control-panel"><div class="label">NEIGHBOR / 鄰房定位</div><div class="neighbor-list">${neighbors.map((n,i)=>`<button class="neighbor-btn ${i===state.neighbor?'active':''}" data-neighbor="${i}"><span class="nh-number">${String(i+1).padStart(2,'0')}</span><span>${esc(n.name)}<span class="nh-area" style="display:block">模型高度</span></span><span class="nh-height">${(+n.model_relative_height_m).toFixed(1)} m</span></button>`).join('')}</div><div class="neighbor-footnote">點選建物可將鏡頭移至該鄰房；數字為模型量測值。</div></div>`;
 return '';
}
function bindStoryEvents(){story.querySelectorAll('[data-key]').forEach(b=>b.onclick=()=>{const k=b.dataset.key;state[k]=b.dataset.value;renderStory(false);if(k==='layerView'||k==='eyeMode')setView();if(k==='viewDir'){state.lookYaw=0;state.lookPitch=0;}});
 for(const [id,key] of [['floorRange','floor'],['fovRange','fov'],['timeRange','hour'],['windRange','windSpeed']]){const el=$('#'+id);if(el){el.oninput=()=>{state[key]=Number(el.value);const label=el.previousElementSibling?.querySelector('strong');if(label){label.textContent=key==='floor'?state.floor+'F':key==='fov'?state.fov+'°':key==='hour'?String(Math.floor(state.hour)).padStart(2,'0')+':' +(state.hour%1?'30':'00'):state.windSpeed.toFixed(1)+'×';}};el.onchange=()=>renderStory(false);}}
 story.querySelectorAll('[data-neighbor]').forEach(b=>b.onclick=()=>{state.neighbor=Number(b.dataset.neighbor);renderStory(false);focusNeighbor();});
}
function setLegend(rows){legend.innerHTML=rows.map(([color,text])=>`<div class="legend-row"><i class="legend-swatch" style="background:${color};color:${color}"></i><span>${esc(text)}</span></div>`).join('');}
function renderStory(animate=true){const s=chapterData[selectedPage];
 const extra=[];
 if(state.mode==='wind')extra.push(['SELECTED WIND',state.windMode==='NE'?'東北季風 / 10–4月':state.windMode==='SW'?'西南季風 / 6–9月':`颱風 / ${typhoonFromText()}來風`]);
 if(state.mode==='overview')extra.push(['VIEWPOINTS',`${points.length} 個景觀視點`]);
 if(state.mode==='traffic'||state.mode==='circulation')extra.push(['ROUTES',`${routes.length} 類動線`]);
 if(state.mode==='neighbors')extra.push(['MARKERS',`${neighbors.length}`],['MAX HEIGHT',`${Math.max(...neighbors.map(n=>n.model_relative_height_m),0).toFixed(1)}m`]);
 let facts=s.facts.concat(extra);
 story.innerHTML=`<div class="copy ${animate?'':'no-animate'}"><div class="chapter-no">${s.no} / ${s.en}<span>WENSHAN DISTRICT</span></div><h1 class="title">${s.title}</h1><p class="lead">${s.lead}</p><hr class="story-divider"><dl class="fact-grid">${facts.map(([k,v])=>`<div class="fact-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>${controlsHTML()}<div class="hint">${s.note}</div></div>`;
 bindStoryEvents();
 const legends={
 intro:[[COL.view,'28F 建築'],[COL.garden,'現有地景模型']],
 overview:[[COL.garden,'綠化地景'],[COL.view,'住宅量體']],
 traffic:[[COL.vehicle,'車行動線'],[COL.pedestrian,'外部人行動線']],
 view:[['#c9a6f2','固定主要方向視域'],[COL.view,'360°順時鐘掃描'],['#fff','觀察樓層與高度']],
 sun:[[COL.sun,'太陽軌跡'],['#a7b2c6','陰影方向示意']],
 wind:[[COL.winter,'冬季東北季風'],[COL.summer,'夏季西南季風'],[COL.storm,'颱風風向情境']],
 massing:[[COL.view,'住宅量體'],[COL.garden,'綠化地景']],
 garden:[[COL.garden,'綠化植栽'],['#184e86','景觀鋪面']],
 circulation:[[COL.vehicle,'車行'],[COL.pedestrian,'人行'],[COL.management,'住戶／外送／物管']],
 neighbors:[[COL.neighbor,'周邊鄰房量體'],[COL.view,'基地建築']]
 };
 setLegend(legends[state.mode]);$('#guideTitle').textContent=s.en;$('#guideSub').textContent=s.short+' / 基地分析';
}
function setChapter(i){selectedPage=(i+chapterData.length)%chapterData.length;state.mode=chapterData[selectedPage].id;
 document.querySelectorAll('.railbtn').forEach((b,j)=>b.classList.toggle('active',j===selectedPage));$('#mobileChapter').value=String(selectedPage);
 $('#pageNo').textContent=chapterData[selectedPage].no;$('#pageName').textContent=chapterData[selectedPage].en;
 $('#progress').style.width=`${(selectedPage+1)/chapterData.length*100}%`;
 renderStory();setView();
}
$('#prev').onclick=()=>setChapter(selectedPage-1);$('#next').onclick=()=>setChapter(selectedPage+1);
$('#mobileChapter').onchange=e=>setChapter(Number(e.target.value));
$('#resetView').onclick=()=>{state.lookYaw=0;state.lookPitch=0;setView();};
$('#toggleStory').onclick=()=>{
 const focus=document.body.classList.toggle('focus-model');
 const btn=$('#toggleStory');
 btn.setAttribute('aria-pressed',String(focus));
 btn.querySelector('span').textContent=focus?'顯示分析':'專注模型';
 btn.title=focus?'顯示分析說明面板':'收合分析說明面板';
 resize();
};
$('#modelInfo').onclick=()=>$('#modalWrap').classList.add('open');$('#modalClose').onclick=()=>$('#modalWrap').classList.remove('open');
$('#modalWrap').onclick=e=>{if(e.target===$('#modalWrap'))$('#modalWrap').classList.remove('open');};
$('#fullScreen').onclick=()=>{if(!document.fullscreenElement){document.documentElement.requestFullscreen?.().catch(()=>{});}else document.exitFullscreen?.();};
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName||''))return;
 if(e.key==='ArrowRight'||e.key===' '){e.preventDefault();setChapter(selectedPage+1)}
 if(e.key==='ArrowLeft'){e.preventDefault();setChapter(selectedPage-1)}
 if(e.key.toLowerCase()==='f')$('#fullScreen').click();
 if(e.key==='Escape')$('#modalWrap').classList.remove('open');});
function visibleRoutes(){return routes.filter(r=>state.filter==='all'||(state.filter==='veh'&&r.category==='vehicle')||(state.filter==='ped'&&r.category==='pedestrian')||(state.filter==='mgmt'&&r.category==='management'))}
// The first floor is 6m; upper floors each rise 3.5m.
function floorBaseHeight(floor){return floor<=1?0:6+(floor-2)*3.5;}
function getObserver(){
 const map={'北':'北向觀察點','東':'東向觀察點','南':'南向觀察點','西':'西向觀察點'};
 const p=points.find(p=>p.name===map[state.viewDir] || p.name.includes(state.viewDir+'向'));
 const refFloor=Number(embeddedData?.reference_floor??17);
 const site=bounds['03-基地地塊'];
 const ground=site?.min_skp_xyz_m?.[2] ?? 17.56;
 const tower=bounds['04-住宅棟']?.center_web_xyz_m || [313.8452, 73.411, -395.3275];
 const defaultAnchor=[tower[0],ground+floorBaseHeight(refFloor)+(embeddedData?.eye_offset_m??1.6),tower[2]];
 const a=(p?.position?.web_xyz_m||defaultAnchor).slice();
 a[1]+=floorBaseHeight(state.floor)-floorBaseHeight(refFloor);
 return a;
}
function setView(){const site=bounds['03-基地地塊']?.center_web_xyz_m||[324.0193, 18.6039, -399.4448],tower=bounds['04-住宅棟']?.center_web_xyz_m||[313.8452, 73.411, -395.3275],podium=(bounds['04-公設棟']||bounds['04-警衛室']||bounds['04-綠化庭園'])?.center_web_xyz_m||[324.0193, 18.6039, -399.4448];
 let target=site,offset=[-180,155,220];
 if(state.mode==='view'){target=tower;offset=[-95,95,145]}
 else if(state.mode==='sun'){target=tower;offset=[150,165,170]}
 else if(state.mode==='wind'){target=tower;offset=[-165,160,180]}
 else if(state.mode==='massing'){target=state.layerView==='podium'?podium:state.layerView==='site'?site:tower;offset=[-150,175,200]}
 else if(state.mode==='garden'){target=podium;offset=[-110,93,130]}
 else if(state.mode==='neighbors'){target=site;offset=[-205,185,250]}
 else if(['traffic','circulation'].includes(state.mode)){target=site;offset=[-118,103,158]}
 aim(target.map((v,i)=>v+offset[i]),target);
}
function focusNeighbor(){const n=neighbors[state.neighbor];if(!n)return;const c=n.bounds?.center_web_xyz_m;if(c)aim([c[0]-70,c[1]+85,c[2]+90],c);}

const ns='http://www.w3.org/2000/svg';
const svg=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,v);return el;};
function addPath(arr,color,width=2,dash='',opacity=.9){
 // A route may run outside the view; keep visible segments rather than dropping the entire line.
 const ps=arr.map(project);let chunk=[];
 const push=()=>{if(chunk.length>=2)overlay.append(svg('polyline',{
  points:chunk.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
  stroke:color,'stroke-width':width,'stroke-dasharray':dash,'stroke-opacity':opacity,
  fill:'none','stroke-linecap':'round','stroke-linejoin':'round'}));chunk=[];};
 for(const p of ps){if(p){chunk.push(p);}else{push();}}push();
}
function dot(p,color,r=4){const q=project(p);if(!q)return;overlay.append(svg('circle',{cx:q.x,cy:q.y,r,fill:color,stroke:'#061119','stroke-width':'1.4'}));}
// Three label categories: building charcoal, road navy, scenic landmark deep green.
// All label backgrounds use 90% opacity, regardless of the border accent color.
const LABEL_STYLE={
 building:{bg:'rgba(39,43,49,.90)',edge:'rgba(210,219,224,.68)'},
 road:{bg:'rgba(12,39,73,.90)',edge:'rgba(133,192,239,.68)'},
 landmark:{bg:'rgba(12,53,38,.90)',edge:'rgba(144,210,165,.70)'}
};
function drawPillAt(x,y,w,txt,color,kind='building'){
 const style=LABEL_STYLE[kind]||LABEL_STYLE.building;
 overlay.append(svg('rect',{x,y,width:w,height:27,rx:8,fill:style.bg,
  stroke:style.edge,'stroke-opacity':.86,'stroke-width':1}));
 const text=svg('text',{x:x+10,y:y+18,fill:'#f5f8f9',class:'overlay-pill'});
 text.textContent=txt;overlay.append(text);
}
function pill(p,text,color='#8de3e4',icon='',kind='building'){
 const q=project(p);if(!q||!text)return;
 const txt=(icon&&/^[A-Z0-9 ]+$/.test(icon)?icon+' / ':'')+text;
 const w=Math.min(235,Math.max(82,[...txt].length*8+25));
 // Prevent dense route labels from overlapping in plan views.
 let x=Math.min(mount.clientWidth-w-10,Math.max(10,q.x+7));
 let y=Math.max(30,Math.min(mount.clientHeight-32,q.y-24));
 let hit=true;
 for(let attempt=0;attempt<7;attempt++){
   hit=placedLabels.some(r=>x<r.x+r.w+6&&x+w+6>r.x&&y<r.y+29&&y+29>r.y);
   if(!hit)break;
   y=Math.max(35,Math.min(mount.clientHeight-32,y-(attempt+1)*25));
 }
 if(hit)return;
 placedLabels.push({x,y,w});
 overlay.append(svg('path',{d:`M${q.x.toFixed(1)} ${q.y.toFixed(1)} L${(x+8).toFixed(1)} ${(y+13).toFixed(1)}`,
  stroke:color,'stroke-width':'1','stroke-opacity':'.52',fill:'none'}));
 drawPillAt(x,y,w,txt,color,kind);
}

 // Neighbor callouts are anchored directly to each real SketchUp roof center.
 // Keep the tag immediately ABOVE the roof. A short downward leader connects
 // its bottom edge to the rooftop; no side columns, elbows, or orbit-triggered flips.
 function neighborPill(anchor,text,color,index){
  const q=project(anchor); if(!q)return;
  const vw=mount.clientWidth, vh=mount.clientHeight;
  const w=Math.min(vw<620?150:192,Math.max(112,[...text].length*8+24));
  const h=27;
  // Projected-roof-following coordinates: fixed visual relation on every frame.
  // A small, per-building vertical stagger reduces crowding without a dynamic
  // left/right selection or screen-edge columns.
  const rise=24+(index%3)*6;
  const idealX=q.x-w/2;
  const x=Math.max(8,Math.min(vw-w-8,idealX));
  const y=q.y-rise-h;
  // A tag should only appear while there is sufficient space ABOVE its rooftop.
  // Hiding at the top/bottom edge is preferable to reversing the leader line.
  if(y<27 || y+h>vh-32 || q.x<0 || q.x>vw)return;
  const midX=Math.max(x+10,Math.min(x+w-10,q.x));
  const leaderStart=y+h+2;
  const leaderEnd=q.y-2;
  overlay.append(svg('path',{
    d:`M ${midX.toFixed(1)} ${leaderStart.toFixed(1)} L ${q.x.toFixed(1)} ${leaderEnd.toFixed(1)}`,
    stroke:color,'stroke-width':'1.45','stroke-opacity':'.85',fill:'none',
    'stroke-linecap':'round'
  }));
  overlay.append(svg('circle',{
    cx:q.x,cy:q.y,r:2.8,fill:color,stroke:'#0b1218','stroke-width':'1'
  }));
  drawPillAt(x,y,w,text,color,'building');
 }
 // Reference layers are used for text anchors only. Never display their bounding-box geometry.
function boxForRef(name,color,label){
 const b=bounds[name];
 if(b&&label) pill(b.center_web_xyz_m,label,color,'',name==='03-基地地塊'?'landmark':'building');
}
function massingPodiumLabel(){
 const podium=bounds['04-公設棟']||bounds['04-警衛室'];if(!podium)return;
 // Use the SAME route-derived anchors drawn for the two entrance markers.
 const lobby=bounds['04-社區出入門廳棟']||bounds['04-警衛室'];
 const driveway=bounds['04-出入車道'];
 const lobbyPoint=lobby?(entranceFromMarkedRoute(bounds['04-社區出入門廳棟']?'04-社區出入門廳棟':'04-警衛室','住戶動線')||lobby.center_web_xyz_m):null;
 const drivewayPoint=driveway?(entranceFromMarkedRoute('04-出入車道','內部車行動線')||driveway.center_web_xyz_m):null;
 // Place the podium title midway between the lobby and vehicle entrance in plan.
 // Keep the tag slightly above the podium roof so it stays readable.
 const pos=lobbyPoint&&drivewayPoint
   ?[(lobbyPoint[0]+drivewayPoint[0])/2,podium.max_skp_xyz_m[2]+3.2,(lobbyPoint[2]+drivewayPoint[2])/2]
   :podium.center_web_xyz_m.slice();
 pill(pos,bounds['04-公設棟']?'公設棟':'警衛室','#e3b7ff','PODIUM');
}
function closestSegmentPointXZ(pt,a,b){
 const dx=b[0]-a[0],dz=b[2]-a[2],den=dx*dx+dz*dz||1;
 const t=clamp(((pt[0]-a[0])*dx+(pt[2]-a[2])*dz)/den,0,1);
 return [a[0]+dx*t,a[1]+(b[1]-a[1])*t,a[2]+dz*t];
}
function entranceFromMarkedRoute(refName, routeName){
 const b=bounds[refName];if(!b)return null;
 // Find SKP marker route point nearest this entrance building's footprint.
 const center=b.center_web_xyz_m;
 const candidate=routes.find(r=>r.name===routeName);
 const routePoints=(candidate?.paths||[]).flatMap(path=>path.points_web_xyz_m||[]);
 if(routePoints.length<2)return center;
 const close=[];
 for(let i=1;i<routePoints.length;i++)close.push(closestSegmentPointXZ(center,routePoints[i-1],routePoints[i]));
 close.sort((a,b)=>Math.hypot(a[0]-center[0],a[2]-center[2])-Math.hypot(b[0]-center[0],b[2]-center[2]));
 return close[0]||center;
}
function massingEntranceMarkers(){
 const entries=[
   {layer:bounds['04-社區出入門廳棟']?'04-社區出入門廳棟':'04-警衛室',route:'住戶動線',label:bounds['04-社區出入門廳棟']?'待依 SKP 確認':'社區警衛室',color:COL.pedestrian},
   {layer:'04-出入車道',route:'內部車行動線',label:'車道坡道材質參考',color:COL.vehicle}
 ];
 for(const e of entries){
  if(!bounds[e.layer])continue;
  const loc=entranceFromMarkedRoute(e.layer,e.route);
  const at=loc?loc.slice():bounds[e.layer].center_web_xyz_m.slice();
  at[1]+=1.2;
  pill(at,e.label,e.color);
 }
}
function movingPath(p,t){if(p.length<2)return p[0]||null;const lens=[];let total=0;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];const n=Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);lens.push(n);total+=n;}
 let dist=clamp(t,0,1)*total;for(let i=0;i<lens.length;i++){if(dist<=lens[i]){const f=lens[i]?dist/lens[i]:0;return p[i].map((v,j)=>v+(p[i+1][j]-v)*f);}dist-=lens[i];}return p[p.length-1];}
function routeColor(r){return r.category==='vehicle'?COL.vehicle:r.category==='pedestrian'?COL.pedestrian:COL.management;}
function routeType(r){if(r.category==='vehicle')return 'car';if(r.category==='pedestrian'||r.name.includes('住戶'))return 'person';if(r.name.includes('外送'))return 'delivery';return 'service';}
function vectorMarker(pos,color,type,dir=0){
 const q=project(pos);if(!q)return;
 const g=svg('g',{transform:`translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) scale(.78)`});
 const halo=svg('circle',{cx:0,cy:0,r:15,fill:'#0b1c27','fill-opacity':'.32',stroke:color,'stroke-width':'1.25'});g.append(halo);
 const h=svg('circle',{cx:0,cy:0,r:13,fill:color,'fill-opacity':'.08'});g.append(h);
 function linePath(d,w=1.8,fill='none'){g.append(svg('path',{d,fill,stroke:'#eef9ff','stroke-width':w,'stroke-linecap':'round','stroke-linejoin':'round'}));}
 if(type==='car'){
   linePath('M-12 3 L-10 -5 Q-9 -8 -6 -8 L7 -8 Q10 -8 11 -4 L13 3 L13 8 L-12 8 Z');
   linePath('M-8 -3 L8 -3 M-7 8 L-7 11 M8 8 L8 11');
 }else if(type==='person'){
   g.append(svg('circle',{cx:0,cy:-8,r:3.5,fill:'#eef9ff'}));
   linePath('M0 -3 L0 5 M-7 0 L0 1 L7 0 M0 5 L-6 12 M0 5 L6 12');
 }else if(type==='delivery'){
   linePath('M-10 -6 L2 -10 L13 -5 L1 -1 Z M-10 -6 L-10 8 L1 13 L1 -1 M13 -5 L13 9 L1 13 M1 -1 L1 13');
 }else{
   g.append(svg('circle',{cx:0,cy:-9,r:3,fill:'#eef9ff'}));
   linePath('M-8 11 L-6 0 L6 0 L8 11 M-4 6 L4 6 M0 0 L0 11');
 }
 overlay.append(g);
}
function drawRoutes(ts,trafficOnly){visibleRoutes().forEach((r,i)=>{
 if(trafficOnly&&!['vehicle','pedestrian'].includes(r.category))return;
 const col=routeColor(r),kind=routeType(r);
 (r.paths||[]).forEach((path,j)=>{
  const pts=path.points_web_xyz_m;if(!pts||pts.length<2)return;
  // Twin dotted strokes: 2x line width, stronger opacity, rounded ends.
  addPath(pts,col,5,'1 12',.76);
  const ps=pts.map(project);
  if(ps.every(Boolean))overlay.append(svg('polyline',{
   points:ps.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
   stroke:col,'stroke-width':'4','stroke-dasharray':'1 18',
   'stroke-dashoffset':String(-((ts*.018+i*21+j*14)%19)),
   'stroke-opacity':'.90',fill:'none','stroke-linecap':'round','stroke-linejoin':'round'
  }));
  const phase=path.direction_confirmed?((ts*.00007+i*.15+j*.19)%1):(.5+.5*Math.sin(ts*.00029+i*.85+j*1.3));
  const p=movingPath(pts,phase);if(p)vectorMarker(p,col,kind);
 });
 const p=r.paths?.[0]?.points_web_xyz_m?.[0];if(p)pill(p,r.name,col,'','road');
});}
function drawRoads(){roads.forEach(r=>{if(r.anchor?.web_xyz_m)pill(r.anchor.web_xyz_m,r.text.replace(/[<>]/g,''),'#9bd8e9','','road');});
 labels.forEach(r=>{if(r.anchor?.web_xyz_m)pill(r.anchor.web_xyz_m,r.text,COL.garden,'','landmark');});}
function drawEyeReticle(){
 const w=mount.clientWidth,h=mount.clientHeight,cx=w*.5,cy=h*.51;
 const col='#bcefe6';
 overlay.append(svg('circle',{cx,cy,r:28,stroke:col,'stroke-opacity':'.72','stroke-width':'1.1',fill:'none'}));
 overlay.append(svg('path',{d:`M${cx-55} ${cy} h23 M${cx+32} ${cy} h23 M${cx} ${cy-53} v23 M${cx} ${cy+30} v23`,stroke:col,'stroke-width':'1.3','stroke-opacity':'.70',fill:'none'}));
 const t=svg('text',{x:cx+40,y:cy-34,fill:'#dcf8f1','font-size':'12'});t.textContent=`${state.floor}F • ${state.viewDir}向人眼視角`;overlay.append(t);
 const bot=svg('text',{x:cx,y:h-112,'text-anchor':'middle',fill:'#d6eff1','font-size':'12','letter-spacing':'1'});
 bot.textContent='拖曳環顧 · 滾輪調整視角 · 雙擊回正';overlay.append(bot);
}
function drawView(ts){
 if(state.eyeMode==='human'){
  drawEyeReticle();
  return;
 }

 const origin=getObserver();
 // Clockwise azimuth in the SketchUp web plane: +X east, -Z north.
 // Positive angle runs east -> south when seen from above.
 const scan=((ts||0)*.00045)%(Math.PI*2);
 const radius=78*1.5; // 117 metres: 1.5x the prior aerial display radius.
 const span=state.fov*rad; // Keep the panel's horizontal view angle functional.
 const center=project(origin);
 if(!center)return;

 // A full, very faint disk gives spatial context without an outlined ring,
 // radial guide line, glowing endpoint, or dot marker.
 const disk=[];
 for(let i=0;i<=120;i++){
  const a=2*Math.PI*i/120;
  const p=project([origin[0]+Math.cos(a)*radius,origin[1],origin[2]+Math.sin(a)*radius]);
  if(!p){disk.length=0;break;}
  disk.push(p);
 }
 if(disk.length>2){
  overlay.append(svg('polygon',{
   points:disk.map(p=>`${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
   fill:COL.view,'fill-opacity':'.025',stroke:'none'
  }));
 }

 // Main-direction sight sector: a persistent pale-lavender fan anchored to
 // the selected north/east/south/west observation point and current floor.
 // World azimuths: east=0, south=PI/2, west=PI, north=-PI/2.
 // This is stationary in world coordinates; only the cyan sector rotates.
 const mainAzimuth={'東':0,'南':Math.PI/2,'西':Math.PI,'北':-Math.PI/2}[state.viewDir] ?? 0;
 const fixedSegments=48;
 const fixedFrom=mainAzimuth-span/2;
 for(let i=0;i<fixedSegments;i++){
  const a1=fixedFrom+span*i/fixedSegments;
  const a2=fixedFrom+span*(i+1)/fixedSegments;
  const p1=project([origin[0]+Math.cos(a1)*radius,origin[1],origin[2]+Math.sin(a1)*radius]);
  const p2=project([origin[0]+Math.cos(a2)*radius,origin[1],origin[2]+Math.sin(a2)*radius]);
  if(!p1||!p2)continue;
  // A quiet violet background field: no radial lines or point markers.
  const opacity=(.205+.045*(1-Math.abs((i+.5)/fixedSegments-.5)*2)).toFixed(3);
  overlay.append(svg('polygon',{
   points:`${center.x.toFixed(1)},${center.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`,
   fill:'#c9a6f2','fill-opacity':opacity,stroke:'none',
   'data-sector':'fixed-main-direction'
  }));
 }

 // Render a filled, translucent fan, following the viewpoint in model space.
 // It rotates continuously clockwise and replaces the former thin beam and dots.
 // Split into small projected triangles so the view remains visible even if
 // a far portion of the enlarged fan moves behind the camera near-plane.
 const segments=40;
 const leading=scan+span/2;
 const trailing=scan-span/2;
 for(let i=0;i<segments;i++){
  const a1=trailing+span*i/segments;
  const a2=trailing+span*(i+1)/segments;
  const p1=project([origin[0]+Math.cos(a1)*radius,origin[1],origin[2]+Math.sin(a1)*radius]);
  const p2=project([origin[0]+Math.cos(a2)*radius,origin[1],origin[2]+Math.sin(a2)*radius]);
  if(!p1||!p2)continue;
  // Subtle gradient across the sector, without outline strokes.
  const blend=i/segments;
  const opacity=(.18+.15*blend).toFixed(3);
  overlay.append(svg('polygon',{
   points:`${center.x.toFixed(1)},${center.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`,
   fill:COL.view,'fill-opacity':opacity,stroke:'none'
  }));
 }
 // Keep the observation point annotation anchored to the model's true
 // viewpoint. Its floor-derived elevation updates when the floor changes.
 // Draw the label after the fan so it remains legible during rotation.
 pill(origin,`${state.floor}F 觀察點｜${state.viewDir}向｜高度 ${origin[1].toFixed(2)} m`,COL.view,'VIEW');
}
function drawSunIcon(pos){
 const p=project(pos);if(!p)return;
 const g=svg('g',{transform:`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`});
 g.append(svg('circle',{cx:0,cy:0,r:23,fill:'#ffbf65','fill-opacity':'.12'}));
 for(let i=0;i<12;i++){const a=i*Math.PI/6;
  g.append(svg('line',{x1:(Math.sin(a)*16).toFixed(2),y1:(-Math.cos(a)*16).toFixed(2),
   x2:(Math.sin(a)*22).toFixed(2),y2:(-Math.cos(a)*22).toFixed(2),
   stroke:'#ffcc77','stroke-width':'2.8','stroke-opacity':'.95','stroke-linecap':'round'}));
 }
 g.append(svg('circle',{cx:0,cy:0,r:12,fill:'#ffd27f',stroke:'#fff0be','stroke-width':'2'}));
 g.append(svg('circle',{cx:-3.4,cy:-3.5,r:4.1,fill:'#fff5d4','fill-opacity':'.6'}));
 overlay.append(g);
}
function drawSun(){
 const tower=bounds['04-住宅棟']?.center_web_xyz_m||[0,0,0];
 const ss=[['夏至',1.00],['春秋分',.64],['冬至',.28]];
 const getP=(hour,season)=>{const a=(hour-7)/10*Math.PI;return [tower[0]+155*Math.cos(a),tower[1]+20+175*season*Math.sin(a),tower[2]-75+80*Math.sin(a)];};
 // Always show three solid black seasonal trajectories. Pale hairline is only a legibility underlay against night sky.
 for(const [name,height] of ss){
   const arc=[];for(let h=7;h<=17.001;h+=.20)arc.push(getP(h,height));
   addPath(arc,'#e7edf0',4.8,'',.33);
   addPath(arc,'#04090d',2.65,'',.98);
 }
 const selected=ss.find(([name])=>name===state.season)||ss[1],height=selected[1];
 const chosen=[];for(let h=7;h<=17.001;h+=.20)chosen.push(getP(h,height));
 addPath(chosen,'#f49a3d',8.5,'',.52);
 addPath(chosen,'#f6b269',3.1,'',.82);
 for(const [name,h] of ss){const at=getP(15.8,h);pill(at,`${name}`,name===state.season?'#f3aa65':'#bdc9ce');}
 const p=getP(state.hour,height);drawSunIcon(p);
 pill(p,`${String(Math.floor(state.hour)).padStart(2,'0')}:${state.hour%1?'30':'00'}`,'#f7b36a');
 const ground=bounds['04-住宅棟']?.min_skp_xyz_m?.[2]??tower[1];const roof=[tower[0],bounds['04-住宅棟']?.max_skp_xyz_m?.[2]??tower[1],tower[2]],dz=[roof[0]-(p[0]-roof[0])*.7,ground,roof[2]-(p[2]-roof[2])*.7];
 addPath([roof,dz],'#93a8b6',1.6,'5 7',.55);
}
function typhoonFromText(){return {E:'東側',SE:'東南側',NW:'西北側',N:'北側'}[state.typhoonFrom]||'東側';}
function windVectorIcon(pos,tail,tip,color,size=1){
 const a=project(tail),b=project(tip),p=project(pos);if(!a||!b||!p)return;
 const ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
 const g=svg('g',{transform:`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${ang.toFixed(2)}) scale(${(size*.5).toFixed(3)})`});
 // A hollow, clean wind arrow/icon; 2x the former small dot for readability.
 g.append(svg('circle',{cx:0,cy:0,r:15,fill:'#07131c','fill-opacity':'.72',stroke:color,'stroke-opacity':'.77','stroke-width':1.2}));
 g.append(svg('path',{d:'M-9 -4 L-2 -4 M-10 2 L2 2 M-9 8 L-2 8 M-1 -7 L9 0 L-1 7',
   fill:'none',stroke:'#f7fbff','stroke-width':2.0,'stroke-linecap':'round','stroke-linejoin':'round'}));
 overlay.append(g);
}
function windMoveOnPath(pts,phase,color,size=1){
 const p=movingPath(pts,phase);if(!p)return;
 const behind=movingPath(pts,Math.max(0,phase-.017));
 const front=movingPath(pts,Math.min(1,phase+.017));
 windVectorIcon(p,behind,front,color,size);
}
function drawWind(ts){
 const tower=bounds['04-住宅棟']?.center_web_xyz_m||[313.8452, 73.411, -395.3275];
 const b=bounds['04-住宅棟'];
 const floor=b?.min_skp_xyz_m?.[2]||19;
 const roof=b?.max_skp_xyz_m?.[2]||130;
 // Flow points from the windward NE/SW to the opposite lee side.
 // Typhoon winds depend on storm track and local topography; selectable approach scenarios.
 const stormVectors={E:[-1,0],SE:[-.707,-.707],NW:[+.707,+.707],N:[0,+1]};
 const dirs={NE:[-.707,+.707],SW:[+.707,-.707],STORM:stormVectors[state.typhoonFrom]||stormVectors.E};
 const vec=dirs[state.windMode],perp=[-vec[1],vec[0]];
 const col=state.windMode==='NE'?COL.winter:state.windMode==='SW'?COL.summer:COL.storm;
 // Spread streams across the full local street block, but avoid needlessly distant points.
 for(let j=-3;j<=3;j++){
  const lateral=j*25,pts=[];
  for(let i=0;i<=44;i++){
   const t=-150+i/44*300;
   const near=Math.exp(-Math.pow(t/64,2));
   const bend=Math.sign(j||1)*near*28/(Math.abs(j)+1.2);
   const cross=lateral+bend;
   const y=floor+12+(j+3)*5+near*(17+Math.max(0,3-Math.abs(j))*3);
   pts.push([tower[0]+vec[0]*t+perp[0]*cross,y,tower[2]+vec[1]*t+perp[1]*cross]);
  }
  addPath(pts,col,j===0?3.8:2.9,'2 10',j===0?.72:.58);
  for(let k=0;k<1;k++){
   const phase=(ts*.00010*state.windSpeed+k*.53+j*.069+1)%1;
   windMoveOnPath(pts,phase,col,1.04);
  }
 }
 // The high-level airflow strikes the windward elevation and turns downward.
 // This is a conceptual section trace, not a CFD-calculated velocity field.
 for(let k=-1;k<=1;k++){
  const lateral=k*15;
  const at=(downwind,y)=>[tower[0]+vec[0]*downwind+perp[0]*lateral,y,tower[2]+vec[1]*downwind+perp[1]*lateral];
  const descending=[
    at(-110,roof+19),at(-78,roof+14),at(-52,roof+5),
    at(-37,roof-8),at(-34,roof-32),at(-35,roof-59),
    at(-33,roof-88),at(-20,floor+6),at(0,floor+5),at(36,floor+7)
  ];
  addPath(descending,col,k===0?5.2:3.8,'3 8',k===0?.86:.66);
  for(let h=0;h<1;h++){
   const t=(ts*.000088*state.windSpeed+h*.54+k*.13+2)%1;
   windMoveOnPath(descending,t,col,1.28);
  }
 }
 // Leader arrows mark the seasonal source and the windward facade, with consistent scale.
 const up=[tower[0]-vec[0]*105,roof+14,tower[2]-vec[1]*105];
 const d0=[tower[0]-vec[0]*65,roof+14,tower[2]-vec[1]*65];
 const d1=[tower[0]-vec[0]*48,roof+14,tower[2]-vec[1]*48];
 windVectorIcon(d0,up,d1,col,1.45);
 pill(up,state.windMode==='NE'?'東北季風 · 10–4月':state.windMode==='SW'?'西南季風 · 6–9月':`颱風情境 · ${typhoonFromText()}來風`,col);
 const downSpot=[tower[0]-vec[0]*35,roof-64,tower[2]-vec[1]*35];
 pill(downSpot,'迎風面下洗氣流',col);
}
// Render the *actual* neighboring model meshes; the overlay supplies text labels only.
// Never generate extra translucent blue bounding-box faces or outline edges.
function ghostNeighbor(n,focus=false){
 const b=n.bounds;
 if(!b||!b.center_web_xyz_m)return;
 const center=b.center_web_xyz_m;
 const roofHeight=b.max_skp_xyz_m?.[2] ?? center[1];
 const point=[center[0],roofHeight+1.5,center[2]];
 // Short vertical leader from the tag above each actual building rooftop.
 neighborPill(point,`${n.name} · ${n.model_relative_height_m.toFixed(1)}m`,focus?'#ffe4aa':COL.neighbor,neighbors.indexOf(n));
}
function drawNeighbors(){
 neighbors.forEach((n,i)=>ghostNeighbor(n,state.neighbor===i));
}
function drawGarden(){
 const b=bounds['04-綠化庭園']||bounds['05-plant']||bounds['04-公設棟'];
 if(b){const c=b.center_web_xyz_m;dot(c,COL.garden,6);pill(c,'綠化庭園',COL.garden,'','landmark');}
 for(const p of embeddedData?.open_spaces||[]){if(p.bounds?.center_web_xyz_m){
   dot(p.bounds.center_web_xyz_m,'#184e86',5);
   pill(p.bounds.center_web_xyz_m,p.name||'開放空間','#184e86','OPEN SPACE','landmark');
 }}
}
function drawCompass(){const dx=(state.mode==='view'&&state.eyeMode==='human')?Math.sin(({北:0,東:Math.PI/2,南:Math.PI,西:-Math.PI/2}[state.viewDir]+state.lookYaw)):(orbit.target[0]-eye[0]);const dz=(state.mode==='view'&&state.eyeMode==='human')?-Math.cos(({北:0,東:Math.PI/2,南:Math.PI,西:-Math.PI/2}[state.viewDir]+state.lookYaw)):(orbit.target[2]-eye[2]);const az=Math.atan2(dx,-dz)/rad;$('#compassRose').style.transform=`rotate(${-az}deg)`;}
function renderOverlay(ts){overlay.replaceChildren();placedLabels.length=0;if(!ready)return;
 const m=state.mode;
 if(['intro','overview','traffic'].includes(m))drawRoads();
 if(m==='intro'||m==='overview'){const c=bounds['04-住宅棟']?.center_web_xyz_m;if(c)pill(c,'28F 住宅量體',COL.view);}
 if(m==='traffic'||m==='circulation')drawRoutes(ts,m==='traffic');
 if(m==='view')drawView(ts);
 if(m==='sun')drawSun();
 if(m==='wind')drawWind(ts);
 if(m==='massing'){if(['all','tower'].includes(state.layerView))boxForRef('04-住宅棟',COL.view,'住宅棟');if(['all','site'].includes(state.layerView))boxForRef('03-基地地塊',COL.garden,'基地地景');}
 if(m==='garden')drawGarden();if(m==='neighbors')drawNeighbors();
 drawCompass();
}
function sunDir(){const hour=state.hour;const t=(hour-12)*15*rad;return [-Math.sin(t),.8,-Math.cos(t)*.4]}
const kindTexture={1:'glass1',2:'glass2',3:'grass1',4:'grass2',10:'Gravel_01_1K1',15:'water2'};
function frame(ts){
 requestAnimationFrame(frame);if(!ready)return;
 orbit.yaw+=(desired.yaw-orbit.yaw)*.14;orbit.pitch+=(desired.pitch-orbit.pitch)*.14;
 orbit.dist+=(desired.dist-orbit.dist)*.14;
 for(let i=0;i<3;i++)orbit.target[i]+=(desired.target[i]-orbit.target[i])*.14;
 updateMatrices();
 const light=state.mode==='sun'?sunDir():[.5,.9,.38];
 const lightKey=light.map(x=>x.toFixed(4)).join('/');
 if(lightKey!==lastLightKey){
  makeLightVP(light);
  if(shadowActive){drawDepth(shadowFBO,shadowSize,shadowSize,lightVP,true);shadowReady=true;}
  // sky follows demonstration light, while analytical sun paths remain unmodified.
  buildHDRSky(light);lastHDRKey=lightKey;lastLightKey=lightKey;
 }
 if(aoActive){drawDepth(depthFBO,depthWidth,depthHeight,vp,false);depthReady=true;}
 gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.useProgram(shader);gl.bindVertexArray(vao);gl.uniformMatrix4fv(uniform.uVP,false,vp);
 gl.uniform3fv(uniform.uEye,eye);gl.uniform3fv(uniform.uSun,light);
 gl.uniform1f(uniform.uAmbient,state.mode==='sun'?.33:.61);gl.uniform1f(uniform.uTime,ts*.001);
 gl.uniform1i(uniform.uNeighborMode,state.mode==='neighbors'?1:0);
 gl.uniform1i(uniform.uFocusNeighbor,state.neighbor);
 gl.uniform1i(uniform.uTex,0);
 gl.uniformMatrix4fv(uniform.uLightVP,false,lightVP);
 gl.uniformMatrix4fv(uniform.uView,false,view);
 gl.uniform2f(uniform.uDepthSize,depthWidth||canvas.width,depthHeight||canvas.height);
 gl.uniform1f(uniform.uNear,state.mode==='view'&&state.eyeMode==='human'?.08:.25);
 gl.uniform1f(uniform.uTanHalfFov,Math.tan((state.mode==='view'&&state.eyeMode==='human'?state.fov:48)*rad*.5));
 gl.uniform1f(uniform.uAOIntensity,1.15);
 gl.uniform1i(uniform.uShadowsOn,shadowReady?1:0);
 gl.uniform1i(uniform.uAOOn,depthReady?1:0);
 gl.uniform1i(uniform.uAOSamples,innerWidth<760?6:12);
 gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,shadowTex);gl.uniform1i(uniform.uShadowTex,1);
 gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,sceneDepth);gl.uniform1i(uniform.uCamDepth,2);
 gl.activeTexture(gl.TEXTURE3);gl.bindTexture(gl.TEXTURE_2D,hdrEnv);gl.uniform1i(uniform.uHDREnv,3);
 gl.activeTexture(gl.TEXTURE0);
 const orderedGroups=[...groups].sort((a,b)=>{
   const ta=(a.id===1||a.id===2||a.alpha<.995),tb=(b.id===1||b.id===2||b.alpha<.995);
   return Number(ta)-Number(tb);
 });
 for(const g of orderedGroups){
  const glass=(g.id===1||g.id===2);
  // Neighbor meshes (20–27) and surroundings (8/9/12/13) are solid, depth-writing geometry.
  const solidNeighbor=(g.id>=20&&g.id<30)||g.id===8||g.id===9;
  const transparent=!solidNeighbor&&(glass||(g.alpha!==undefined&&g.alpha<.995));
  if(transparent){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);}
  else{gl.disable(gl.BLEND);gl.depthMask(true);}
  gl.uniform1i(uniform.uKind,g.id);gl.uniform1i(uniform.uTower,g.tower?1:0);gl.uniform1f(uniform.uAlpha,1.0);
  const texture=webTextures[g.textureKey]||fallbackTex;
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.uniform1i(uniform.uUseTex,g.textureKey&&webTextures[g.textureKey]?1:0);
  gl.drawElements(gl.TRIANGLES,g.count,gl.UNSIGNED_INT,g.start*4);
 }
 gl.disable(gl.BLEND);gl.depthMask(true);
 if(ts-lastOverlay>50){lastOverlay=ts;renderOverlay(ts);}
}
// No old embedded meshes. Failure to load new GLB is explicit and blocks the scene.
async function load(){try{
 loading.textContent='準備基地環境場景…';
 const analysisResponse=await fetch('./assets/analysis_28f.json', {cache:'no-cache'});
 if(!analysisResponse.ok)throw new Error('分析資料載入失敗 (HTTP '+analysisResponse.status+')');
 embeddedData=await analysisResponse.json();
 if(Number(embeddedData.floor_count)!==28)throw new Error('內嵌資料不是 28F');
 roads=embeddedData.roads?.loose_road_labels||[];labels=embeddedData.points?.loose_labels||[];
 points=embeddedData.points?.points||[];routes=embeddedData.routes?.routes||[];
 neighbors=embeddedData.buildings?.neighbors||[];bounds=embeddedData.reference_layers?.reference_bounds||{};
 $('#layerList').innerHTML=(embeddedData.layers||[]).map(s=>`<span class="layeritem">${esc(s)}</span>`).join('');
 update28FChapters();
 loading.textContent='載入 3D 建築場景…';
 const r=await decodeSketchUpGLB('./assets/yongan_28f.glb?v=20261110-white-colg1-core1',neighbors,bounds['04-住宅棟']);
 externalGroups=r.groups;decodedTextures=r.images;
 if(r.stats.max[1]-r.stats.min[1]<50)console.warn('請檢查GLB建築量體高度；目前高度差：',r.stats.max[1]-r.stats.min[1]);
 loading.textContent='建立環境光影效果…';
 initRenderer(r.buffer);resize();setChapter(selectedPage);
 if(points.length!==4){console.warn('本次 GLB 觀察點數量不是四處：',points.length);}
 loading.classList.add('done');setTimeout(()=>loading.style.display='none',500);
 console.info('Yongan 28F loaded:',r.stats,'observer points',points.length,'routes',routes.length);
}catch(err){console.error(err);
  if(String(err.message||err).includes('WebGL2')){
   $('#modelFallback').setAttribute('aria-hidden','false');
   setChapter(selectedPage);
   loading.textContent='此瀏覽器目前無法啟用 3D 即時顯示';
   loading.style.display='block';
  }else{
   loading.classList.remove('done');loading.style.display='block';loading.textContent='3D 場景載入失敗：'+String(err.message||err);
  }
 }
}
function update28FChapters(){}

resize();requestAnimationFrame(frame);load();
