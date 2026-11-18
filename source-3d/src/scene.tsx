import {useEffect, useRef, useState} from 'react';
import * as T from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import {MagneticCluster} from './magnet.js';

type Settings = typeof import('../public/assets/football-3d-settings.json');
type Manifest = typeof import('../public/assets/football-latest/manifest.json');
const publicUrl=(url:string)=>import.meta.env.BASE_URL+url.replace(/^\//,'');
const loader = new GLTFLoader();
const assets = new Map<string, Promise<T.Group>>();
function asset(url: string) {
  if (!assets.has(url)) assets.set(url, loader.loadAsync(publicUrl(url)).then(g => g.scene).catch(e => {assets.delete(url); throw e;}));
  return assets.get(url)!;
}
async function json<T>(url: string): Promise<T> {
  const response = await fetch(publicUrl(url));
  if (!response.ok) throw new Error(`Cannot load ${url}: ${response.status}`);
  return response.json();
}
RectAreaLightUniformsLib.init();

export default function Scene({hero, step, onReady}: {hero: boolean; step: number; onReady?:()=>void}) {
  const host = useRef<HTMLDivElement>(null);
  const readyCallback=useRef(onReady);readyCallback.current=onReady;
  const [error, setError] = useState(false);
  useEffect(() => {
    const el = host.current!;
    let disposed = false, cleanup = () => {};
    setError(false);
    async function start() {
      const [settings, manifest] = await Promise.all([
        json<Settings>('/assets/football-3d-settings.json'),
        json<Manifest>('/assets/football-latest/manifest.json'),
      ]);
      if (disposed) return;
      const kind = (['ball', 'case', 'tickets'] as const)[step];
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const renderer = new T.WebGLRenderer({antialias: true, alpha: true, powerPreference: 'high-performance'});
      renderer.setPixelRatio(Math.min(devicePixelRatio, settings.renderer.pixelRatioCap, 1.5));
      renderer.toneMapping = T.ACESFilmicToneMapping;
      el.append(renderer.domElement);
      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(hero ? 36 : settings.camera.fov, 1, .1, 100);
      const materials = new Set<T.Material>(), geometries = new Set<T.BufferGeometry>(), textures = new Set<T.Texture>();
      const root = new T.Group(); scene.add(root);
      const pmrem = new T.PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      const environment = pmrem.fromScene(room, settings.environment.sigma);
      room.dispose(); pmrem.dispose(); scene.environment = environment.texture;
      function direction(color: string, intensity: number, position: number[], target = [0,0,0]) {
        const light = new T.DirectionalLight(color, intensity);
        light.position.fromArray(position); light.target.position.fromArray(target);
        scene.add(light, light.target);
      }
      function area(color: string, intensity: number, width: number, height: number, position: number[], target: number[]) {
        const light = new T.RectAreaLight(color, intensity, width, height);
        light.position.fromArray(position); light.lookAt(new T.Vector3().fromArray(target)); scene.add(light);
      }
      const floorMaterials: T.MeshBasicMaterial[] = [];
      function gradientPlane(stops: (string|number)[][], position: number[], order: number, scale: number[]) {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
        const ctx = canvas.getContext('2d')!;
        const gradient = ctx.createRadialGradient(128,128,0,128,128,128);
        stops.forEach(([offset,color]) => gradient.addColorStop(Number(offset), String(color)));
        ctx.fillStyle = gradient; ctx.fillRect(0,0,256,256);
        const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; textures.add(texture);
        const material = new T.MeshBasicMaterial({map:texture, transparent:true, depthWrite:false, toneMapped:false});
        const geometry = new T.PlaneGeometry(1,1); geometries.add(geometry); materials.add(material); floorMaterials.push(material);
        const mesh = new T.Mesh(geometry,material); mesh.rotation.x = -Math.PI/2; mesh.position.fromArray(position);
        mesh.scale.set(scale[0],scale[1],1); mesh.renderOrder = order; scene.add(mesh);
      }
      if (hero) {
        renderer.toneMappingExposure = manifest.lighting.exposure;
        scene.environmentIntensity = 0;
        const light = manifest.lighting.softbox;
        area(light.color,light.intensity,light.width,light.height,light.position,light.target);
        manifest.lighting.rims.forEach(l => direction(l.color,l.intensity,l.position));
      } else {
        const bg=settings.background;
        el.style.background=`radial-gradient(ellipse at center, ${bg.radialGradient.stops.map(([offset,color])=>`${color} ${Number(offset)*70}%`).join(', ')})`;
        const p = settings.lighting.profiles[kind], lights = settings.lighting;
        renderer.toneMappingExposure = p.exposure; scene.environmentIntensity = p.environmentIntensity;
        area(lights.key.color,p.key,lights.key.width,lights.key.height,p.keyPosition,lights.target);
        area(lights.fill.color,p.fill,lights.fill.width,lights.fill.height,lights.fill.position,lights.target);
        scene.add(new T.HemisphereLight(lights.ambient.sky,lights.ambient.ground,p.ambient));
        direction(lights.top.color,p.top,lights.top.position);
        direction(lights.rimLeft.color,p.rimLeft,p.rimLeftPosition,lights.rimLeft.target);
        direction(lights.rimRight.color,p.rimRight,p.rimRightPosition,lights.rimRight.target);
        const footprint = settings.floor.footprints[kind];
        gradientPlane(settings.floor.shadow.stops,[0,settings.floor.shadow.y,0],settings.floor.shadow.renderOrder,footprint);
        gradientPlane(settings.floor.reflectedLight.stops,settings.floor.reflectedLight.position,settings.floor.reflectedLight.renderOrder,footprint.map(x=>x*settings.floor.reflectedLight.sizeMultiplier));
      }
      const cluster = hero ? new MagneticCluster(Math.random,8) : null;
      if(cluster)cluster.targets=[[-1.25,.25,-1.5],[.2,-1.5,.25],[-1.55,-.92,.25],[-1.2,1.25,-.4],[-.15,.1,1.15],[.65,1.2,-.5],[1.2,-.8,-1.3],[1.65,-.25,.25]];
      if (cluster && reduced) for(let i=0;i<180;i++) cluster.step(1/60);
      // Start spread out, then let the existing attraction settle the cluster.
      if(cluster&&!reduced)cluster.burstAt=-.2;
      const balls: {holder:T.Group; face:T.Quaternion}[] = [];
      const rigs: {stub:T.Object3D; rest:T.Vector3; mesh:T.Mesh; progress:number}[] = [];
      let lid: T.Object3D | undefined; const latches: T.Object3D[] = [];
      let ready = false, hover = false, hoverTicket = -1, pinnedTicket = -1, open = true;
      let spin = -1, previousSpin = 0, focus = 0;
      const pointer = new T.Vector2(), ray = new T.Raycaster();
      let lastRay = 0, previousPointer:T.Vector2|null=null, lastPointerAt=0;
      const cursor={active:false,p:[0,0,0],normal:[0,0,1],velocity:[0,0,0]};
      const plane=new T.Plane(new T.Vector3(0,0,1),0),point=new T.Vector3();
      function hit(event: PointerEvent) {
        const rect = el.getBoundingClientRect();
        pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
        ray.setFromCamera(pointer,camera);
        return ray.intersectObject(root,true);
      }
      const move = (event: PointerEvent) => {
        if (!ready || performance.now()-lastRay<70) return;
        lastRay=performance.now(); const hits=hit(event), over=hits.length>0;
        if(hero&&cluster&&!reduced){
          const now=performance.now(),dt=Math.max(.016,(now-lastPointerAt)/1000);
          const previous=previousPointer;const current=new T.Vector2(event.clientX,event.clientY);
          const speed=previous?current.distanceTo(previous)/dt:0;
          if(ray.ray.intersectPlane(plane,point)){cursor.p=point.toArray();cursor.active=true;cursor.velocity=previous?[(current.x-previous.x)/dt*.012,-(current.y-previous.y)/dt*.012,0]:[0,0,0];}
          if(over&&(!hover||speed>850)&&cluster.time-cluster.lastBurst>1.25){cluster.scatter(cursor.velocity.map(v=>v*.12));el.dataset.bursts=String(Number(el.dataset.bursts||0)+1);}
          previousPointer=current;lastPointerAt=now;
        }
        if (!hero && step===0 && over && !hover && spin<0 && !reduced) {spin=0;previousSpin=0;}
        hover=over; hoverTicket=over ? (hits[0].object.userData.ticketIndex ?? -1) : -1;
      };
      const leave = () => {hover=false;hoverTicket=-1;pointer.set(0,0);cursor.active=false;previousPointer=null;lastPointerAt=0;};
      const click = (event: PointerEvent) => {
        if (!ready || hero) return;
        const hits=hit(event); if(!hits.length)return;
        if(step===1)open=!open;
        if(step===2){const index=hits[0].object.userData.ticketIndex;pinnedTicket=pinnedTicket===index?-1:index;}
      };
      el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);el.addEventListener('pointerdown',click);
      let active=true, frame=0, time=0, last=performance.now();
      function centerObject(){
        if(hero||!root.children.length)return;
        camera.clearViewOffset();camera.updateMatrixWorld(true);root.updateMatrixWorld(true);
        const bounds=new T.Box3().setFromObject(root,true);
        const projected=new T.Box2();
        for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
          const point=new T.Vector3(x,y,z).project(camera);projected.expandByPoint(new T.Vector2(point.x,point.y));
        }
        const center=projected.getCenter(new T.Vector2());
        const width=el.clientWidth,height=el.clientHeight;
        camera.setViewOffset(width,height,center.x*width/2,-center.y*height/2,width,height);
      }
      const resize=new ResizeObserver(()=>{
        const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;
        if(hero){camera.position.set(0,.2,9.6*h/Math.max(1,h-265));camera.lookAt(0,-.35,0);}
        else {const c=settings.camera[kind];camera.position.fromArray(c.position);const target=new T.Vector3().fromArray(c.target);
          if(camera.aspect<settings.camera.narrowAspectThreshold)camera.position.sub(target).multiplyScalar(settings.camera.narrowDistanceMultipliers[kind]).add(target);
          camera.lookAt(target);}
        camera.updateProjectionMatrix();centerObject();
      });resize.observe(el);
      const observer=new IntersectionObserver(([entry])=>active=entry.isIntersecting);observer.observe(el);
      const front=new T.Vector3(),right=new T.Vector3(),up=new T.Vector3(),basis=new T.Matrix4(),wobble=new T.Quaternion(),euler=new T.Euler();
      function tick(now:number) {
        frame=requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;
        if(!active || document.hidden || !ready)return;
        if(!reduced)time+=dt;
        if(cluster){
          if(!reduced)cluster.step(dt,cursor);
          balls.forEach(({holder,face},i)=>{
            const state=cluster.balls[i];
            // Keep a full ball radius inside the actual viewport during bursts.
            const halfHeight=Math.max(1.15,(camera.position.z-state.p[2])*Math.tan(T.MathUtils.degToRad(camera.fov/2)));
            const limits=[Math.max(.1,halfHeight*camera.aspect-1.08),Math.max(.1,halfHeight-1.08)];
            for(let axis=0;axis<2;axis++){const center=axis===1?-.35:0;const bounded=T.MathUtils.clamp(state.p[axis],center-limits[axis],center+limits[axis]);if(bounded!==state.p[axis]){state.p[axis]=bounded;state.v[axis]*=-.2;}}
            holder.position.fromArray(state.p);
            front.copy(camera.position).sub(holder.position).normalize();right.crossVectors(camera.up,front).normalize();up.crossVectors(front,right);
            basis.makeBasis(right,up,front);holder.quaternion.setFromRotationMatrix(basis);
            euler.set(.035*Math.sin(time*.63+state.seed),.035*Math.sin(time*.51+state.seed),.12*Math.sin(time*.37+state.seed));
            wobble.setFromEuler(euler);holder.quaternion.multiply(wobble).multiply(face);
          });
        } else {
          const interaction=settings.interaction,bob=reduced?0:Math.sin(time*interaction.floatFrequency)*interaction.floatAmplitude;
          root.position.y=(kind==='ball'?settings.placement.ball.position[1]:kind==='case'?settings.placement.case.position[1]:settings.placement.tickets.groupPosition[1])+bob;
          if(step===0&&!reduced){root.rotation.y+=dt*interaction.ball.baseRotationRadiansPerSecond;
            if(spin>=0){spin=Math.min(1,spin+dt/interaction.ball.hoverDurationSeconds);const t=spin,ease=t*t*t*(10+t*(-15+6*t));root.rotation.y+=Math.PI*2*(ease-previousSpin);previousSpin=ease;if(spin===1)spin=-1;}}
          if(step===1){focus=reduced?0:T.MathUtils.damp(focus,hover?1:0,interaction.case.damping,dt);
            root.rotation.x=focus*interaction.case.hoverTiltX;root.rotation.y=settings.placement.case.rotationY+focus*interaction.case.hoverYawDelta;
            if(lid)lid.rotation.x=T.MathUtils.damp(lid.rotation.x,-T.MathUtils.degToRad(interaction.case.lidOpenDegrees)*(open||hover?1:0),5,dt);
            latches.forEach(l=>l.rotation.x=-T.MathUtils.degToRad(interaction.case.latchOpenDegrees)*(open||hover?1:0));}
          if(step===2){const limits=interaction.tickets.pointerTiltLimits;
            root.rotation.x=T.MathUtils.damp(root.rotation.x,reduced?0:-pointer.y*limits[0],5,dt);
            root.rotation.y=T.MathUtils.damp(root.rotation.y,reduced?0:pointer.x*limits[1],5,dt);
            root.rotation.z=T.MathUtils.damp(root.rotation.z,reduced?0:-pointer.x*limits[2],5,dt);
            rigs.forEach((rig,i)=>{const target=(hoverTicket===i||pinnedTicket===i)?1:0;rig.progress=reduced?target:T.MathUtils.damp(rig.progress,target,5,dt);
              rig.stub.position.copy(rig.rest).addScaledVector(new T.Vector3().fromArray(interaction.tickets.tearTranslation),rig.progress);
              rig.stub.rotation.fromArray([...interaction.tickets.tearRotation.map(x=>x*rig.progress),'XYZ'] as [number,number,number,T.EulerOrder]);
              if(rig.mesh.morphTargetInfluences)rig.mesh.morphTargetInfluences[interaction.tickets.curlMorphIndex]=rig.progress;
            });}
          floorMaterials.forEach(m=>m.opacity=1-bob);
        }
        renderer.render(scene,camera);
      }
      frame=requestAnimationFrame(tick);
      cleanup=()=>{cancelAnimationFrame(frame);resize.disconnect();observer.disconnect();el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);el.removeEventListener('pointerdown',click);materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());environment.dispose();renderer.dispose();renderer.domElement.remove();};
      function clone(source:T.Group){const model=source.clone(true);model.traverse(o=>{if(!(o instanceof T.Mesh))return;
        if(o.morphTargetInfluences)o.morphTargetInfluences=[...o.morphTargetInfluences];
        const prepare=(m:T.Material)=>{const c=m.clone() as T.MeshStandardMaterial;materials.add(c);
          if(hero||step===0){c.roughness=Math.max(c.roughness,.56);c.emissiveIntensity=0;c.envMapIntensity=.48;}
          if(!hero&&step===1){c.side=T.FrontSide;c.envMapIntensity=.7;if(/leather|foam/i.test(c.name)){c.normalMap=null;c.roughness=.82;c.envMapIntensity=.18;}}
          if(!hero&&step===2){c.envMapIntensity=.18;c.emissiveIntensity=0;c.roughness=.86;c.color.multiplyScalar(.95);}return c;};
        o.material=Array.isArray(o.material)?o.material.map(prepare):prepare(o.material);});return model;}
      if(hero){await Promise.all(manifest.models.map(async(entry,i)=>{
        const source=await asset(entry.url);if(disposed)return;const model=clone(source);
        model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model,true),size=bounds.getSize(new T.Vector3());
        model.position.sub(bounds.getCenter(new T.Vector3()));const inner=new T.Group();inner.add(model);inner.scale.setScalar(1.88/Math.max(size.x,size.y,size.z));inner.rotation.z=entry.innerWrapRotationZ;
        const holder=new T.Group();holder.add(inner);root.add(holder);balls[i]={holder,face:new T.Quaternion().fromArray(entry.preferredFaceQuaternion)};
      }));}else{
        const source=await asset(settings.assets[kind].url);if(disposed)return;
        if(step===0){const model=clone(source),bounds=new T.Box3().setFromObject(model,true),size=bounds.getSize(new T.Vector3());model.position.sub(bounds.getCenter(new T.Vector3()));const inner=new T.Group();inner.add(model);inner.scale.setScalar(settings.placement.ball.normalizeMaxDimension/Math.max(size.x,size.y,size.z));inner.rotation.z=settings.placement.ball.innerRotationZ;root.add(inner);}
        if(step===1){const model=clone(source);root.add(model);lid=model.getObjectByName(settings.interaction.case.lidNode);settings.interaction.case.latchNodes.forEach(name=>{const node=model.getObjectByName(name);if(node)latches.push(node);});}
        if(step===2){settings.placement.tickets.sheets.forEach((sheetConfig,i)=>{
          const model=clone(source),sheet=new T.Group();model.rotation.x=settings.placement.tickets.modelRotationX;
          model.traverse(o=>o.userData.ticketIndex=i);sheet.add(model);sheet.scale.setScalar(settings.placement.tickets.uniformScale);sheet.position.fromArray(sheetConfig.position);sheet.rotation.z=sheetConfig.rotationZ;sheet.rotation.y=sheetConfig.rotationY;root.add(sheet);
          const stub=model.getObjectByName(settings.interaction.tickets.stubNode),mesh=model.getObjectByName(settings.interaction.tickets.tearoffNode) as T.Mesh;
          if(stub&&mesh)rigs.push({stub,rest:stub.position.clone(),mesh,progress:0});
        });}
      }
      if(!hero&&step!==1)root.scale.setScalar(1.2);
      if(!hero){
        root.position.y=kind==='ball'?settings.placement.ball.position[1]:kind==='case'?settings.placement.case.position[1]:settings.placement.tickets.groupPosition[1];
        if(lid)lid.rotation.x=-T.MathUtils.degToRad(settings.interaction.case.lidOpenDegrees);
        centerObject();
      }
      if(disposed)return;
      await renderer.compileAsync(scene,camera);if(!disposed){ready=true;el.dataset.ready='true';renderer.render(scene,camera);readyCallback.current?.();}
    }
    start().catch(e=>{if(!disposed){console.error(e);setError(true);disposed=true;cleanup();}});
    return()=>{disposed=true;cleanup();};
  },[hero,step]);
  return <div ref={host} className="webgl" aria-label={hero?'3D-композиция футбольных мячей':['3D футбольный мяч','3D кейс — нажми, чтобы открыть или закрыть','3D билеты — наведи на корешок'][step]}>{error&&<span className="loading">Не удалось загрузить 3D. Обнови страницу.</span>}</div>;
}
