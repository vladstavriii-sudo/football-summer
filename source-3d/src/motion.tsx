import {useEffect, useRef} from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function WordReveal({text}:{text:string}) {
  return <span className="text-reveal">{text}</span>;
}

const moneyFormat=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:1});
function RollingDigit({digit}:{digit:number}){
  const strip=useRef<HTMLSpanElement>(null),previous=useRef(digit);
  useEffect(()=>{
    const el=strip.current!;const from=previous.current;previous.current=digit;
    el.style.transform=`translateY(-${(10+digit)*1.12}em)`;
    if(from===digit||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const distance=(digit-from+10)%10;
    const animation=el.animate([{transform:`translateY(-${(10+from)*1.12}em)`},{transform:`translateY(-${(10+from+distance)*1.12}em)`}],{duration:480,easing:'cubic-bezier(.22,.75,.2,1)'});
    return()=>animation.cancel();
  },[digit]);
  return <span className="digit-window"><span ref={strip} className="digit-strip" style={{transform:`translateY(-${(10+digit)*1.12}em)`}}>{Array.from({length:30},(_,i)=><span key={i}>{i%10}</span>)}</span></span>;
}
export function AnimatedAmount({value}:{value:number}) {
  const chars=moneyFormat.format(value).padStart(3,' ').split('');
  return <output className="rolling-amount" aria-label={value+' евро'}><span aria-hidden="true" className="number-drums">{chars.map((char,i)=>/\d/.test(char)?<RollingDigit key={chars.length-i} digit={Number(char)}/>:<span key={chars.length-i} className={char===','?'digit-separator':'digit-space'}>{char}</span>)}<span className="money-currency">€</span></span></output>;
}
export function SmoothSlider({value,onChange}:{value:number;onChange:(value:number)=>void}){
 const input=useRef<HTMLInputElement>(null),visual=useRef<HTMLDivElement>(null),current=useRef(value),dragging=useRef(false);
 useEffect(()=>{
   let frame=0,last=performance.now();
   const tick=(now:number)=>{const dt=Math.min((now-last)/1000,.05);last=now;current.current=dragging.current?value:current.current+(value-current.current)*(1-Math.exp(-dt*15));if(Math.abs(value-current.current)<.05)current.current=value;
    visual.current?.style.setProperty('--slider-position',((current.current-10)/490*100)+'%');
    if(current.current!==value)frame=requestAnimationFrame(tick);
   };frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[value]);
 return <div className="smooth-slider" ref={visual} style={{'--slider-position':((current.current-10)/490*100)+'%'} as React.CSSProperties}><div className="slider-rail" aria-hidden="true"><span/><i/></div><input ref={input} aria-label="Сумма ставок" type="range" min="10" max="500" step="10" value={value} onPointerDown={()=>dragging.current=true} onPointerUp={()=>dragging.current=false} onPointerCancel={()=>dragging.current=false} onBlur={()=>dragging.current=false} onChange={event=>onChange(Number(event.target.value))}/></div>;
}

export function usePageMotion(setStep:(step:number)=>void) {
  const lenisRef=useRef<Lenis|null>(null);
  useEffect(()=>{
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis=new Lenis({autoRaf:true,anchors:true,lerp:reduced?1:.12,smoothWheel:!reduced});
    lenisRef.current=lenis;
    const sections=document.querySelectorAll<HTMLElement>('.hero,.participation,.calculator');
    const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-revealed');reveal.unobserve(entry.target);}
    }),{threshold:.28});
    sections.forEach(section=>reveal.observe(section));
    const footerItems=document.querySelectorAll<HTMLElement>('.footer-top,.sports,.footer-columns>div,.legal,footer>small');
    footerItems.forEach(item=>{item.classList.add('footer-item');reveal.observe(item);});
    const track=document.querySelector<HTMLElement>('.participation-track')!;
    let frame=0, previousStep=-1, top=0, distance=1, manualSelection=false, manualY=0;
    const measure=()=>{top=track.offsetTop;distance=Math.max(1,track.offsetHeight-innerHeight);};
    measure();
    const sizeObserver=new ResizeObserver(measure);sizeObserver.observe(track);
    const update=()=>{
      frame=0;
      const y=window.scrollY;
      if(manualSelection&&Math.abs(y-manualY)>24){manualSelection=false;previousStep=-1;}
      if(!manualSelection&&y>=top&&y<top+distance){
        // The first fifth of the sticky runway provides a quiet entry without locking scroll.
        const progress=Math.max(0,Math.min(1,((y-top)/distance-.2)/.8));
        const next=Math.min(2,Math.floor(progress*3));
        if(next!==previousStep){previousStep=next;setStep(next);}
      }
    };
    const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const manual=()=>{lenis.scrollTo(window.scrollY,{immediate:true});manualY=window.scrollY;manualSelection=true;};
    const resume=()=>{manualSelection=false;previousStep=-1;};
    const onKey=(event:KeyboardEvent)=>{const target=event.target as HTMLElement;if(target.closest('[role=tab],input,button'))return;if(['PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(event.key))resume();};
    const onPointer=(event:PointerEvent)=>{if(event.clientX>=document.documentElement.clientWidth)resume();};
    const onLink=(event:MouseEvent)=>{if((event.target as HTMLElement).closest('a[href^="#"]'))resume();};
    window.addEventListener('football:manual-step',manual);
    window.addEventListener('wheel',resume,{passive:true});
    window.addEventListener('touchmove',resume,{passive:true});
    window.addEventListener('keydown',onKey);
    window.addEventListener('pointerdown',onPointer);
    window.addEventListener('click',onLink);
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',measure);
    return()=>{window.removeEventListener('football:manual-step',manual);window.removeEventListener('wheel',resume);window.removeEventListener('touchmove',resume);window.removeEventListener('keydown',onKey);window.removeEventListener('pointerdown',onPointer);window.removeEventListener('click',onLink);cancelAnimationFrame(frame);sizeObserver.disconnect();lenis.destroy();lenisRef.current=null;reveal.disconnect();window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',measure);};
  },[setStep]);
  return lenisRef;
}

export function useActiveStepMotion(step:number){
 useEffect(()=>{const group=document.querySelector<HTMLElement>('.steps');if(!group)return;
  const update=()=>{const button=group.querySelectorAll<HTMLElement>('[role=tab]')[step];if(!button)return;group.style.setProperty('--active-top',button.offsetTop+'px');group.style.setProperty('--active-height',button.offsetHeight+'px');};
  update();const observer=new ResizeObserver(update);observer.observe(group);return()=>observer.disconnect();
 },[step]);
}
