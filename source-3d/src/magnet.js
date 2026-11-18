const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l)};
export class MagneticCluster {
 constructor(random=Math.random,count=6){this.random=random;this.time=0;this.burstAt=-100;this.lastBurst=-100;this.phase='Притяжение к центру';/** @type {number[][]|null} */ this.targets=null;
 this.balls=Array.from({length:count},(_,i)=>{const a=i*Math.PI*2/count;return {p:[Math.cos(a)*4.5,Math.sin(a)*4.5,(random()-.5)*3],v:[0,0,0],r:[random()*6,random()*6,random()*6],w:[random()-.5,random()-.5,random()-.5],seed:random()*100}});}
 scatter(direction=[0,0,0]){this.burstAt=this.time;this.lastBurst=this.time;this.balls.forEach(b=>{const n=norm(b.p.map(x=>x+(this.random()-.5)*1.8));b.v=n.map((x,k)=>x*(12+this.random()*5)+direction[k]*2.5);b.w=b.w.map(()=> (this.random()-.5)*8)});}
 /** @param {number} dt @param {{active:boolean,p:number[],normal:number[],velocity:number[]}|null} cursor */
 step(dt,cursor=null){dt=clamp(dt,0,.05);const steps=Math.max(1,Math.ceil(dt/(1/120))),h=dt/steps;
 for(let n=0;n<steps;n++)this.integrate(h,cursor);return this.balls;}
 integrate(h,cursor){this.time+=h;const age=this.time-this.burstAt,returning=age>.16&&age<1.6,launch=age>=0&&age<=.16;
 const strength=launch?2:returning?65:22,damping=launch?.8:returning?11:6.8;
 this.phase=launch?'Импульс':returning?'Возврат к центру':'Притяжение к центру';
 for(let i=0;i<this.balls.length;i++){const b=this.balls[i],t=this.time,s=b.seed;
 const target=this.targets?.[i]||[0,0,0];
 const force=b.p.map((x,k)=>-strength*(x-target[k]) + (this.targets?.18:(returning?1:6))*Math.sin(t*(.9+k*.21)+s+k*2));
 // Slowly changing swirl and unequal spin keep the cluster rearranging without a fixed loop.
 if(!this.targets){force[0]+=b.p[2]*3;force[2]-=b.p[0]*3;}
 if(cursor?.active&&!launch){const d=b.p.map((x,k)=>x-cursor.p[k]);const along=d.reduce((v,x,k)=>v+x*cursor.normal[k],0);for(let k=0;k<3;k++)d[k]-=along*cursor.normal[k];const dist=Math.hypot(...d);
 if(dist<2.15){const fall=Math.pow(1-dist/2.15,2),nn=dist>.01?d.map(x=>x/dist):[1,0,0];for(let k=0;k<3;k++)force[k]+=nn[k]*75*fall;b.w[0]+=cursor.velocity[1]*h*.7*fall;b.w[1]+=cursor.velocity[0]*h*.7*fall;this.phase='Реакция на курсор';}}
 for(let k=0;k<3;k++){b.v[k]=(b.v[k]+force[k]*h)*Math.exp(-damping*h);b.p[k]+=b.v[k]*h;b.w[k]+=(.48*Math.sin(t*(1.1+k*.13)+s+k)-b.w[k]*.7)*h;b.r[k]+=b.w[k]*h;}
 // Keep extreme input bounded while preserving the burst.
 const len=Math.hypot(...b.p);if(len>7.5){for(let k=0;k<3;k++){b.p[k]*=7.5/len;b.v[k]*=.5;}}
 }
 // Non-penetration and normal impulses; tangential spin continues through contacts.
 for(let pass=0;pass<7;pass++)for(let i=0;i<this.balls.length;i++)for(let j=i+1;j<this.balls.length;j++){
 const a=this.balls[i],b=this.balls[j],d=b.p.map((x,k)=>x-a.p[k]),len=Math.hypot(...d),gap=1.91-len;
 if(gap>0){const nn=len>.0001?d.map(x=>x/len):[1,0,0];for(let k=0;k<3;k++){a.p[k]-=nn[k]*gap*.5;b.p[k]+=nn[k]*gap*.5;}
 const relative=b.v.reduce((sum,x,k)=>sum+(x-a.v[k])*nn[k],0);if(relative<0)for(let k=0;k<3;k++){a.v[k]+=relative*nn[k]*.52;b.v[k]-=relative*nn[k]*.52;}}
 }
 }
}
