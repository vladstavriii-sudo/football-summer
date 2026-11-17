
(()=>{
const root=document.getElementById('stadium-live'),output=root.querySelector('canvas'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d'),button=root.querySelector('button'),image=new Image();
const mobileBanner=matchMedia('(max-width:600px)');
mobileBanner.addEventListener('change',()=>location.reload());
if(mobileBanner.matches){
 const portrait=document.createElement('img');portrait.className='mobile-banner-image';portrait.src='assets/stadium-mobile.png';portrait.alt='Футболист с мячом у ворот';portrait.width=1026;portrait.height=1503;portrait.fetchPriority='high';
 root.prepend(portrait);output.hidden=true;return;
}
const W=2720,H=754;canvas.width=W;canvas.height=H;output.width=W;output.height=H;ctx.imageSmoothingEnabled=false;
// Remove the black matte after compositing, including the reveal and moving boards.
const outputGL=output.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});
let present;
if(outputGL){
 const gl=outputGL;
 const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=vec2((p.x+1.)*.5,(1.-p.y)*.5);gl_Position=vec4(p,0.,1.);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D image;void main(){vec3 c=texture2D(image,uv).rgb;float a=max(c.r,max(c.g,c.b));gl_FragColor=a>0.001?vec4(c/a,a):vec4(0.);}'));
 gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.uniform1i(gl.getUniformLocation(program,'image'),0);gl.viewport(0,0,W,H);
 present=()=>{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);gl.drawArrays(gl.TRIANGLES,0,6);};
}else{
 const out=output.getContext('2d');
 present=()=>{const frame=ctx.getImageData(0,0,W,H),d=frame.data;for(let i=0;i<d.length;i+=4){const a=Math.max(d[i],d[i+1],d[i+2]);d[i+3]=a;if(a){d[i]=Math.round(d[i]*255/a);d[i+1]=Math.round(d[i+1]*255/a);d[i+2]=Math.round(d[i+2]*255/a);}}out.putImageData(frame,0,0);};
}

const state={moving:true,speed:46,flashes:true};
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;state.moving=!reduced;
let loaded=false,elapsed=0,last=0,raf=0,bannerOnscreen=true,lastPaint=0;
const introDuration=1.55;
const base=document.createElement('canvas');base.width=W;base.height=H;const bg=base.getContext('2d');
const strip=document.createElement('canvas');strip.width=500;strip.height=70;const sg=strip.getContext('2d');
const flashPoints=[[.12,.28],[.84,.26],[.065,.59],[.925,.45],[.235,.26],[.78,.15],[.90,.61],[.06,.15],[.30,.13],[.95,.30]];
function ad(x,width,shift){ctx.save();ctx.beginPath();ctx.rect(x,640,width,70);ctx.clip();ctx.fillStyle='#000';ctx.fillRect(x,640,width,70);const period=500;for(let xx=-period-shift;xx<x+width+period;xx+=period)ctx.drawImage(strip,Math.round(xx),640);ctx.restore()}
function flash(x,y,strength){const unit=4,cx=Math.round(x*W/unit)*unit,cy=Math.round(y*H/unit)*unit;ctx.fillStyle=`rgba(0,255,82,${strength})`;ctx.fillRect(cx-2*unit,cy,5*unit,unit);ctx.fillRect(cx,cy-2*unit,unit,5*unit);ctx.fillRect(cx-unit,cy-unit,3*unit,3*unit);ctx.fillStyle=`rgba(0,255,82,${strength*.22})`;for(const [a,b]of [[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,2]])ctx.fillRect(cx+a*unit,cy+b*unit,unit,unit)}
function wave(){const phase=(elapsed%12);if(phase>3.8)return;const center=-200+phase/3.8*(W+400),width=170;
ctx.save();ctx.beginPath();ctx.rect(0,0,W,615);
// Exclude the player and ball so the wave belongs only to the crowd.
ctx.moveTo(1190,0);ctx.lineTo(1500,0);ctx.lineTo(1515,415);ctx.lineTo(1775,570);ctx.lineTo(1820,754);ctx.lineTo(925,754);ctx.lineTo(930,610);ctx.lineTo(875,570);ctx.lineTo(875,365);ctx.lineTo(1040,285);ctx.lineTo(1190,350);ctx.closePath();ctx.clip('evenodd');
ctx.globalCompositeOperation='screen';
for(let i=-4;i<=4;i++){const x=center+i*width/4,alpha=Math.exp(-i*i/5)*.48;ctx.globalAlpha=alpha;ctx.drawImage(base,Math.max(0,x),0,width/4,615,Math.max(0,x),0,width/4,615)}ctx.restore();}
const netLayer=document.createElement('canvas');netLayer.width=W;netLayer.height=H;
const ng=netLayer.getContext('2d');
function buildNet(){
 ng.clearRect(0,0,W,H);
 if(!image.complete||!image.naturalWidth)return;
 const sampleCanvas=document.createElement('canvas');sampleCanvas.width=W;sampleCanvas.height=H;
 const sampleCtx=sampleCanvas.getContext('2d',{willReadFrequently:true});sampleCtx.drawImage(image,0,0,W,H);
 const pixels=sampleCtx.getImageData(0,0,W,H).data;
 // Find the weave's actual vertical repeat rather than pasting an arbitrary strip.
 function repeatFor(left,right){
  let best=64,bestError=Infinity;
  for(let period=28;period<=120;period+=4){
   let error=0,count=0;
   for(let y=604;y<636;y+=2)for(let x=left;x<right;x+=4){
    const a=(y*W+x)*4+1,b=((y-period)*W+x)*4+1;
    error+=Math.abs(pixels[a]-pixels[b]);count++;
   }
   error/=count;if(error<bestError){bestError=error;best=period}
  }
  return best;
 }
 for(const [left,right] of [[568,925],[1790,2125]]){
  const period=repeatFor(left+35,right-35);
  // Continue each pixel column without rescaling, preserving density and lattice phase.
  for(let y=636;y<714;y++){
   let sourceY=y;while(sourceY>=636)sourceY-=period;
   ng.drawImage(image,left,sourceY,right-left,1,left,y,right-left,1);
  }
 }
}

buildNet();
// Continue the source texture instead of inventing a finer, denser point grid.
const boardRaster=document.createElement('canvas');boardRaster.width=W;boardRaster.height=70;
const br=boardRaster.getContext('2d');
function buildBoardRaster(){
 br.clearRect(0,0,W,70);
 // Outside the goal, copy the stadium's own dots directly from above the advertising.
 // Inside it, netLayer already continues the original net texture.
 br.drawImage(image,0,570,530,70,0,0,530,70);
 br.drawImage(image,2165,570,W-2165,70,2165,0,W-2165,70);
}
function netOverlay(){
 // Restore the foreground and upright surfaces over the scrolling advertising.
 ctx.drawImage(base,530,640,38,70,530,640,38,70);
 ctx.drawImage(base,2125,640,40,70,2125,640,40,70);
 ctx.drawImage(base,925,640,865,70,925,640,865,70);
 ctx.save();ctx.globalCompositeOperation='screen';ctx.drawImage(boardRaster,0,640);ctx.drawImage(netLayer,0,0);ctx.restore();
}
function stadiumReaction(){
// Brief clusters of camera flashes, like a crowd reacting to a moment on the pitch.
const cycle=Math.floor(elapsed/5.4),moment=elapsed%5.4;
for(let i=0;i<7;i++){
 const age=moment-(.55+i*.135);
 if(age<0||age>.19)continue;
 const point=flashPoints[(cycle*3+i*7)%flashPoints.length];
 flash(point[0],point[1],Math.sin(age/.19*Math.PI)*(.6+(i%3)*.12));
}
}
function ledAccents(){
const phase=elapsed%6.2;if(phase>1.25)return;
const progress=phase/1.25;
ctx.save();ctx.beginPath();ctx.rect(0,640,522,70);ctx.rect(2166,640,554,70);ctx.clip();
ctx.fillStyle='rgba(0,255,82,.46)';
for(const x of [progress*700-120,2720-progress*700]){
 for(let row=0;row<2;row++)for(let i=0;i<12;i++){
  ctx.globalAlpha=(1-i/12)*.65;
  ctx.fillRect(Math.round((x-i*8)/4)*4,646+row*56,4,3);
 }
}
ctx.restore();
}
// A soft diagonal light front reveals the original raster from top-left to bottom-right.
const reveal=document.createElement('canvas');
reveal.width=Math.ceil(W/4);reveal.height=Math.ceil(H/4);
const revealCtx=reveal.getContext('2d'),revealData=revealCtx.createImageData(reveal.width,reveal.height);
const glintMask=document.createElement('canvas');glintMask.width=reveal.width;glintMask.height=reveal.height;
const gm=glintMask.getContext('2d'),glintData=gm.createImageData(reveal.width,reveal.height);
const glint=document.createElement('canvas');glint.width=W;glint.height=H;
const gc=glint.getContext('2d');gc.imageSmoothingEnabled=false;
function intro(){
 const progress=Math.min(1,elapsed/introDuration);
 const front=-.25+1.50*(progress*.75+(progress*progress*(3-2*progress))*.25);
 for(let y=0;y<reveal.height;y++)for(let x=0;x<reveal.width;x++){
  const i=y*reveal.width+x;
  const diagonal=(x*4+y*4)/(W+H);
  const distance=front-diagonal;
  const t=Math.max(0,Math.min(1,(distance+.12)/.24));
  const exposure=t*t*(3-2*t);
  const dot=(x%3===0&&y%3===0);
  revealData.data[i*4]=0;
  revealData.data[i*4+1]=dot?63:0;
  revealData.data[i*4+2]=dot?21:0;
  revealData.data[i*4+3]=Math.round(255*(1-exposure));
  // Only existing raster marks catch the light; the black gaps remain black.
  const halo=Math.exp(-((distance/.115)**2))*.30;
  const edge=Math.exp(-(((distance-.012)/.022)**2))*.70;
  const grain=.90+.10*Math.sin(x*2.31+y*1.73);
  const strength=Math.min(1,(halo+edge)*grain);
  glintData.data[i*4+3]=Math.round(255*strength);
 }
 revealCtx.putImageData(revealData,0,0);gm.putImageData(glintData,0,0);
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(reveal,0,0,W,H);
 gc.clearRect(0,0,W,H);gc.globalCompositeOperation='source-over';gc.drawImage(base,0,0);
 gc.globalCompositeOperation='destination-in';gc.drawImage(glintMask,0,0,W,H);
 ctx.globalCompositeOperation='screen';ctx.drawImage(glint,0,0);ctx.restore();
}
const replay=document.createElement('button');replay.type='button';replay.textContent='↻';replay.setAttribute('aria-label','Replay entrance');replay.style.right='48px';root.appendChild(replay);
replay.onclick=()=>{elapsed=0;state.moving=true;sync()};
const hoverLight={x:0,y:0,targetX:0,targetY:0,alpha:0,targetAlpha:0};
const lightLayer=document.createElement('canvas');lightLayer.width=W;lightLayer.height=H;
const lightCtx=lightLayer.getContext('2d');
root.addEventListener('pointermove',event=>{
 if(event.pointerType==='touch')return;
 const rect=output.getBoundingClientRect();
 hoverLight.targetX=(event.clientX-rect.left)/rect.width*W;
 hoverLight.targetY=(event.clientY-rect.top)/rect.height*H;
 if(!hoverLight.targetAlpha){hoverLight.x=hoverLight.targetX;hoverLight.y=hoverLight.targetY}
 hoverLight.targetAlpha=1;
});
root.addEventListener('pointerleave',()=>{hoverLight.targetAlpha=0});
function drawHoverLight(){
 hoverLight.x+=(hoverLight.targetX-hoverLight.x)*.10;
 hoverLight.y+=(hoverLight.targetY-hoverLight.y)*.10;
 hoverLight.alpha+=(hoverLight.targetAlpha-hoverLight.alpha)*.065;
 if(hoverLight.alpha<.005)return;
 lightCtx.clearRect(0,0,W,H);
 lightCtx.globalCompositeOperation='source-over';lightCtx.drawImage(canvas,0,0);
 lightCtx.globalCompositeOperation='destination-in';
 const gradient=lightCtx.createRadialGradient(hoverLight.x,hoverLight.y,0,hoverLight.x,hoverLight.y,310);
 gradient.addColorStop(0,'rgba(255,255,255,.42)');gradient.addColorStop(.4,'rgba(255,255,255,.22)');gradient.addColorStop(1,'rgba(255,255,255,0)');
 lightCtx.fillStyle=gradient;lightCtx.fillRect(0,0,W,H);
 ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=hoverLight.alpha;ctx.drawImage(lightLayer,0,0);ctx.restore();
}
function render(){if(!loaded)return;



ctx.save();
// A very small stadium-camera push, preserving the exact raster and silhouette.
const zoom=1;
ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);ctx.translate(-W/2,-H/2);
ctx.drawImage(base,0,0);const offset=(elapsed*state.speed)%500;
ad(0,W,offset);ledAccents();netOverlay();
if(state.flashes){
 const slot=Math.floor(elapsed/.8),age=elapsed%.8;
 if(age>.10&&age<.29){const phase=(age-.1)/.19,point=flashPoints[(slot*7+3)%flashPoints.length];flash(point[0],point[1],Math.pow(Math.sin(phase*Math.PI),2)*.65)}
 stadiumReaction();
}
ctx.restore();
if(!reduced && elapsed<introDuration)intro();
drawHoverLight();
present();
}

function tick(now){raf=0;if(!state.moving||!bannerOnscreen||document.hidden)return;if(last)elapsed+=Math.min((now-last)/1000,.1);last=now;if(now-lastPaint>=32){render();lastPaint=now}raf=requestAnimationFrame(tick)}
function sync(){button.textContent=state.moving?'Ⅱ':'▶';button.setAttribute('aria-label',state.moving?'Pause animation':'Play animation');button.setAttribute('aria-pressed',String(!state.moving));last=0;if(raf)cancelAnimationFrame(raf);raf=0;if(state.moving&&loaded&&bannerOnscreen&&!document.hidden)raf=requestAnimationFrame(tick);else render()}
button.onclick=()=>{state.moving=!state.moving;sync()};
const brand=new Image();let sourceReady=false,brandReady=false;
function prepareBanner(){
 if(!sourceReady||!brandReady)return;
 // Rasterize the supplied logo, preserving its proportions and letterforms.
 const logoCanvas=document.createElement('canvas');logoCanvas.width=500;logoCanvas.height=70;
 const lc=logoCanvas.getContext('2d');lc.drawImage(brand,40,11,420,420*brand.height/brand.width);
 const pixels=lc.getImageData(0,0,500,70).data;
 sg.fillStyle='#000';sg.fillRect(0,0,500,70);
 for(let y=0;y<70;y+=4)for(let x=0;x<500;x+=4){
  let light=0;
  for(let yy=0;yy<4&&y+yy<70;yy++)for(let xx=0;xx<4&&x+xx<500;xx++){
   const i=((y+yy)*500+x+xx)*4;
   light+=Math.max(pixels[i],pixels[i+1],pixels[i+2])*pixels[i+3]/65025;
  }
  light/=16;if(light<.05)continue;
  sg.fillStyle=`rgba(0,205,66,${light})`;sg.fillRect(x,y,3,3);
 }
 bg.drawImage(image,0,0,W,H);
 bg.fillStyle='#000';bg.fillRect(0,640,W,70);
 for(let x=0;x<W;x+=500)bg.drawImage(strip,x,640);
 // Restore the foreground and goalposts from the source, in front of the new board.
 bg.drawImage(image,925,640,865,70,925,640,865,70);
 bg.drawImage(image,530,640,38,70,530,640,38,70);
 bg.drawImage(image,2125,640,40,70,2125,640,40,70);
 buildNet();buildBoardRaster();loaded=true;render();sync();
}
image.onload=()=>{sourceReady=true;prepareBanner()};
brand.onload=()=>{brandReady=true;prepareBanner()};
brand.src='assets/banner-source-1.png';
image.src='assets/banner-source-2.png';
document.addEventListener('visibilitychange',()=>{last=0;sync()});
if('IntersectionObserver' in window){const visibilityObserver=new IntersectionObserver(entries=>{bannerOnscreen=entries[0].isIntersecting;sync()});visibilityObserver.observe(root)}
if(globalThis.Tweak){const t=new Tweak({container:root,onChange:()=>{render();sync()}});t.addSlider(state,'speed',{label:'Advertising speed',min:15,max:65,step:5});t.addToggle(state,'flashes',{label:'Camera flashes'});}
})();
