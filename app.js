'use strict';
const groups=[['Компания','О нас','Правила','Партнерская программа','B2B','Стать агентом','Форум','Политика конфиденциальности','Политика Cookie','Контакты'],['Ставки','MultiLIVE','Live','Live-Казино','Тото'],['Игры','Казино','1xGames'],['Статистика','Статистика','Результаты'],['Полезное','Способы оплаты','Мобильная версия','Регистрация'],['Приложения','iOS','Android']];
const footer=document.getElementById('footer-columns');
for(const [title,...items] of groups){const group=document.createElement('section');group.className='footer-group';const heading=document.createElement('h3');heading.className='square-label';heading.textContent=title;group.append(heading);const list=document.createElement('ul');for(const name of items){const li=document.createElement('li');const button=document.createElement('button');button.textContent=name;button.dataset.dialog='unavailable';if(title==='Приложения'){button.className='app-link';const arrow=document.createElement('span');arrow.textContent='↗';button.append(arrow)}li.append(button);list.append(li)}group.append(list);footer.append(group)}
const dialog=document.getElementById('info-dialog');
const messages={join:['Принять участие','Страница акции пока не подключена. Для завершения регистрации нужна ссылка на сервис участия.'],terms:['Условия акции','Фрибет составляет 12,5% от общей суммы ставок, максимум 200 EUR. Например: 200 EUR ставок → 25 EUR фрибета. Полные условия участия будут добавлены отдельно.'],privacy:['Политика конфиденциальности','Документ будет подключён после предоставления финального текста.'],cookies:['Политика Cookie','Документ будет подключён после предоставления финального текста.'],responsible:['Ответственная игра','Участие предназначено для лиц старше 18 лет. Полный текст раздела будет добавлен после предоставления.'],unavailable:['Раздел готовится','Ссылка будет подключена после предоставления адреса страницы.']};
document.addEventListener('click',event=>{const trigger=event.target.closest('[data-dialog]');if(!trigger)return;const [title,copy]=messages[trigger.dataset.dialog]||messages.unavailable;document.getElementById('dialog-title').textContent=title;document.getElementById('dialog-copy').textContent=copy;dialog.showModal()});
document.getElementById('dialog-ok').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}});
const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.header nav');
// Equal-spaced labelled anchors, with continuous stake values between them.
const stakeAnchors=[10,50,100,200,500,1000,2000];
const range=document.getElementById('amount');
range.min='0';range.max='6000';range.step='1';range.value='3000';
let numberFrame=0,displayedStake=200,displayedBonus=25,targetStake=200,targetBonus=25;
const euroNumber=value=>new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(value);
function stakeAt(position){const index=Math.min(5,Math.floor(position));return Math.round(stakeAnchors[index]+(stakeAnchors[index+1]-stakeAnchors[index])*(position-index))}
function drawCalculatorNumbers(){
 numberFrame=0;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 displayedStake=reduced?targetStake:displayedStake+(targetStake-displayedStake)*.25;
 displayedBonus=reduced?targetBonus:displayedBonus+(targetBonus-displayedBonus)*.25;
 const finished=Math.abs(displayedStake-targetStake)<.4&&Math.abs(displayedBonus-targetBonus)<.015;
 if(finished){displayedStake=targetStake;displayedBonus=targetBonus}
 document.getElementById('amount-value').textContent=`${euroNumber(Math.round(displayedStake))} EUR`;
 document.getElementById('bonus').textContent=`${euroNumber(Math.round(displayedBonus*100)/100)} EUR`;
 if(!finished)numberFrame=requestAnimationFrame(drawCalculatorNumbers);
}
function updateCalculator(){
 const position=Number(range.value)/1000;
 targetStake=stakeAt(position);targetBonus=Math.min(200,Math.round(targetStake*.125*100)/100);
 range.style.setProperty('--progress',`${position/6*100}%`);
 range.setAttribute('aria-valuetext',`${targetStake} EUR, фрибет ${targetBonus} EUR`);
 document.querySelectorAll('.range-ticks button').forEach((tick,index)=>{
  const proximity=Math.max(0,1-Math.abs(position-index)/.65);
  tick.style.setProperty('--tick-scale',String(1+.22*proximity));
  tick.style.setProperty('--tick-lift',`${-4*proximity}px`);
  const nearest=Math.round(position)===index;
  tick.classList.toggle('tick-active',nearest);
  if(nearest)tick.setAttribute('aria-current','true');else tick.removeAttribute('aria-current');
 });
 if(!numberFrame)numberFrame=requestAnimationFrame(drawCalculatorNumbers);
}
range.addEventListener('input',updateCalculator);
const calcPanel=document.querySelector('.calculator-panel');
range.addEventListener('pointerdown',()=>calcPanel.classList.add('is-dragging'));
for(const event of ['pointerup','pointercancel','blur'])range.addEventListener(event,()=>calcPanel.classList.remove('is-dragging'));
document.querySelectorAll('.range-ticks span').forEach((tick,index)=>{
 const button=document.createElement('button');button.type='button';button.textContent=tick.textContent;button.setAttribute('aria-label',`Сумма ставок ${stakeAnchors[index]} EUR`);
 button.addEventListener('click',()=>{range.value=String(index*1000);updateCalculator()});tick.replaceWith(button);
});
document.querySelector('.range-ticks').removeAttribute('aria-hidden');
updateCalculator();
if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}},{threshold:.12});document.querySelectorAll('.card').forEach(card=>observer.observe(card))}

// Two concurrent badges, with a third arriving before the oldest exits.
const banner=document.querySelector('.banner');
for(const caption of ['Football Summer','Летняя футбольная акция']){
 const badge=document.createElement('span');badge.className='sticker';badge.textContent=caption;banner.append(badge);
}
const bannerLabels=[...banner.querySelectorAll('.sticker')];
const reducedLabels=matchMedia('(prefers-reduced-motion: reduce)');
let labelIndex=0,labelTimer=0,shownLabels=[];
const positions=[[5,18],[65,18],[12,72],[59,72],[5,44],[65,45]];
for(const label of bannerLabels){const text=document.createElement('span');text.className='sticker-text';text.textContent=label.textContent;label.replaceChildren(text)}
function animateNextLabel(){
 const next=bannerLabels[labelIndex%bannerLabels.length];
 const slot=(labelIndex+Math.floor(labelIndex/bannerLabels.length)*2)%positions.length;
 const [x,y]=positions[slot];labelIndex++;
 const maxLeft=Math.max(8,banner.clientWidth-next.offsetWidth-12);
 next.style.left=Math.min(banner.clientWidth*x/100,maxLeft)+'px';next.style.top=y+'%';next.style.right='auto';next.style.bottom='auto';
 next.style.opacity='1';
 const clipped=`inset(0 ${Math.max(0,next.offsetWidth-28)}px 0 0)`;
 next.animate([{clipPath:clipped,opacity:0,offset:0},{clipPath:clipped,opacity:1,offset:.3},{clipPath:'inset(0 0px 0 0)',opacity:1}],{duration:700,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
 next.querySelector('.sticker-text').animate([{opacity:0,transform:'translateX(-5px)'},{opacity:1,transform:'translateX(0)'}],{duration:300,delay:330,easing:'ease-out',fill:'forwards'});
 shownLabels.push(next);
 if(shownLabels.length>2){
  const oldest=shownLabels.shift();
  const closed=`inset(0 ${Math.max(0,oldest.offsetWidth-28)}px 0 0)`;
  oldest.querySelector('.sticker-text').animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(-5px)'}],{duration:300,delay:700,easing:'ease-in',fill:'forwards'});
  const exit=oldest.animate([
   {clipPath:'inset(0 0px 0 0)',opacity:1,offset:0},
   {clipPath:closed,opacity:1,offset:.7},
   {clipPath:closed,opacity:0,offset:1}
  ],{duration:700,delay:700,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
  exit.onfinish=()=>{oldest.style.opacity='0';oldest.getAnimations().forEach(a=>a.cancel());oldest.querySelector('.sticker-text').getAnimations().forEach(a=>a.cancel())};
 }
 labelTimer=setTimeout(animateNextLabel,labelIndex===1?650:1700);
}
function resetLabelTimeline(){
 clearTimeout(labelTimer);shownLabels=[];labelIndex=0;
 for(const label of bannerLabels){label.getAnimations().forEach(a=>a.cancel());label.querySelector('.sticker-text').getAnimations().forEach(a=>a.cancel());label.style.opacity='0'}
 if(reducedLabels.matches){bannerLabels.slice(0,2).forEach((label,i)=>{label.style.left=(i?60:5)+'%';label.style.top=(i?68:18)+'%';label.style.opacity='1'});return}
 if(!document.hidden)labelTimer=setTimeout(animateNextLabel,650);
}
resetLabelTimeline();document.addEventListener('visibilitychange',resetLabelTimeline);reducedLabels.addEventListener('change',resetLabelTimeline);

// A small canvas creates smooth round pixels with directional, staggered timing.
for(const button of document.querySelectorAll('.button, .app-link')){
 const label=document.createElement('span');label.className='button-label';while(button.firstChild)label.append(button.firstChild);
 const field=document.createElement('canvas');field.className='hover-pixels';field.setAttribute('aria-hidden','true');button.append(label,field);
 const ctx=field.getContext('2d');let frame=0;
 button.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch')return;
  cancelAnimationFrame(frame);const rect=button.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2);
  field.width=Math.round(w*dpr);field.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  const fillColor=button.classList.contains('outline')?'#ffffff':'#00f14b';
  const fromLeft=event.clientX-rect.left<w/2,gap=10,cols=Math.ceil(w/gap),rows=Math.ceil(h/gap),dots=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const x=(col+.5)*w/cols,y=(row+.5)*h/rows;
   const progress=fromLeft?x/w:1-x/w;
   dots.push({x,y,delay:progress*280+Math.random()*170});
  }
  field.style.opacity='1';const start=performance.now();
  function draw(now){
   const elapsed=now-start;ctx.clearRect(0,0,w,h);ctx.fillStyle=fillColor;
   for(const dot of dots){const t=reducedLabels.matches?1:Math.max(0,Math.min(1,(elapsed-dot.delay)/230));if(!t)continue;const ease=t*t*(3-2*t);ctx.beginPath();ctx.arc(dot.x,dot.y,ease*gap*.76,0,Math.PI*2);ctx.fill()}
   if(elapsed<700&&!reducedLabels.matches)frame=requestAnimationFrame(draw);else ctx.fillRect(0,0,w,h);
  }
  frame=requestAnimationFrame(draw);
 });
 button.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);field.style.opacity='0'});
}

// Keep the banner's lower edge just inside the viewport, cropping its bottom only.
const heroSection=document.querySelector('.hero');
const heroBanner=heroSection.querySelector('.banner');
function sizeHeroBanner(){
 const viewportHeight=window.innerHeight;
 const bannerTop=heroBanner.getBoundingClientRect().top+window.scrollY;
 const naturalHeight=heroBanner.clientWidth*(matchMedia('(max-width:600px)').matches?1503/1026:754/2720);
 const availableHeight=Math.max(120,viewportHeight-bannerTop-12);
 heroBanner.style.height=(matchMedia('(max-width:600px)').matches?naturalHeight:Math.min(naturalHeight,availableHeight))+'px';
}
sizeHeroBanner();window.addEventListener('resize',sizeHeroBanner,{passive:true});
document.fonts.ready.then(sizeHeroBanner);

// One entrance sequence after the real font is available; hover stays independent.
async function playHeroEntrance(){
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const hero=document.querySelector('.hero');
 const textTargets=[hero.querySelector('.eyebrow'),hero.querySelector('h1'),hero.querySelector('.hero-row>p')];
 const buttons=[...document.querySelectorAll('.header-actions>.button,.hero-buttons>.button')];
 const targets=[...textTargets,...buttons];
 targets.forEach(element=>element.style.opacity='0');
 try{
  await Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,1200))]);
  textTargets.forEach((element,index)=>{
   element.style.opacity='';
   element.animate([
    {opacity:0,transform:`translateY(${index===1?30:18}px)`,filter:'blur(9px)'},
    {opacity:1,transform:'translateY(0)',filter:'blur(0px)'}
   ],{duration:850,delay:100+index*140,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
  });
  buttons.forEach((button,index)=>{
   button.style.opacity='';
   if(button.classList.contains('outline')){
    const delay=300+index*140,w=button.offsetWidth,h=button.offsetHeight,r=3;
    const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('aria-hidden','true');svg.classList.add('entrance-stroke');
    const upper=`M .5 ${h/2} V ${r} Q .5 .5 ${r} .5 H ${w-r} Q ${w-.5} .5 ${w-.5} ${r} V ${h/2}`;
    const lower=`M .5 ${h/2} V ${h-r} Q .5 ${h-.5} ${r} ${h-.5} H ${w-r} Q ${w-.5} ${h-.5} ${w-.5} ${h-r} V ${h/2}`;
    button.classList.add('drawing-stroke');button.append(svg);
    let completion;
    for(const d of [upper,lower]){
     const path=document.createElementNS(ns,'path');path.setAttribute('d',d);svg.append(path);
     const length=path.getTotalLength();path.style.strokeDasharray=String(length);
     completion=path.animate([{strokeDashoffset:length},{strokeDashoffset:0}],{duration:850,delay,easing:'cubic-bezier(.45,0,.25,1)',fill:'backwards'});
    }
    completion.finished.then(()=>{button.classList.remove('drawing-stroke');svg.remove()});
    button.querySelector('.button-label')?.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,delay:delay+350,easing:'ease-out',fill:'backwards'});
    return;
   }
   const clipped=`inset(0 ${Math.max(0,button.offsetWidth-button.offsetHeight)}px 0 0)`;
   button.animate([
    {opacity:0,clipPath:clipped,offset:0},
    {opacity:1,clipPath:clipped,offset:.25},
    {opacity:1,clipPath:'inset(0 0px 0 0)',offset:1}
   ],{duration:700,delay:300+index*140,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
   button.querySelector('.button-label')?.animate([{opacity:0,transform:'translateX(-6px)'},{opacity:1,transform:'translateX(0)'}],{duration:300,delay:620+index*140,easing:'ease-out',fill:'backwards'});
  });
 }finally{targets.forEach(element=>element.style.opacity='')}
}
playHeroEntrance();

// Alternative only: a white badge inside the banner expands into the next screen.
const participationPanel=document.querySelector('.steps');
const heroForTransition=document.querySelector('.hero');
const headerForTransition=document.querySelector('.header');
const transitionStage=document.createElement('div');transitionStage.className='center-reveal-stage';
headerForTransition.before(transitionStage);
const pinnedHero=document.createElement('div');pinnedHero.className='center-reveal-pin';transitionStage.append(pinnedHero);
const heroLayer=document.createElement('div');heroLayer.className='center-reveal-hero';pinnedHero.append(heroLayer);
heroLayer.append(headerForTransition,heroForTransition);
const whiteSurface=document.createElement('div');whiteSurface.className='center-reveal-surface';pinnedHero.append(whiteSurface);
whiteSurface.append(participationPanel);
const revealLabel=document.createElement('span');revealLabel.className='center-reveal-label';revealLabel.textContent='FOOTBALL SUMMER';whiteSurface.append(revealLabel);
let panelFrame=0,revealTravel=0,panelOverflow=0,pinOverflow=0,seed={x:0,y:0,w:180,h:36};
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let stepsEntrancePlayed=false;
let stepsEntranceAnimations=[];
const stepsHeading=participationPanel.querySelector('h2');
const stepsBadge=participationPanel.querySelector('.eyebrow');
const stepCards=[...participationPanel.querySelectorAll('.card')];
function resetStepsEntrance(){
 stepsEntranceAnimations.forEach(animation=>animation.cancel());stepsEntranceAnimations=[];stepsEntrancePlayed=false;
 for(const element of [stepsBadge,stepsHeading,...stepCards])element.style.opacity='0';
}
function entrance(element,keyframes,delay,duration=650){
 const animation=element.animate(keyframes,{duration,delay,easing:'cubic-bezier(.16,1,.3,1)',fill:'both'});
 stepsEntranceAnimations.push(animation);
}
function playStepsEntrance(){
 stepsEntrancePlayed=true;
 entrance(stepsBadge,[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],0,500);
 entrance(stepsHeading,[{opacity:0,transform:'translateY(20px)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0px)'}],80,750);
 stepCards.forEach((card,index)=>{
  const delay=220+index*130;
  entrance(card,[{opacity:0,transform:'translateY(30px)'},{opacity:1,transform:'translateY(0)'}],delay,750);
  entrance(card.querySelector('img'),[{opacity:0,transform:'translateY(15px) scale(.96)'},{opacity:1,transform:'translateY(0) scale(1)'}],delay+120,850);
  entrance(card.querySelector('h3'),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],delay+70,550);
  entrance(card.querySelector('p'),[{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],delay+220,650);
  entrance(card.querySelector('.step-number'),[{opacity:0},{opacity:1}],delay+110,450);
 });
}
if(!motionPreference.matches)resetStepsEntrance();
function measureCenterReveal(){
 const vh=window.innerHeight,vw=document.documentElement.clientWidth;
 revealTravel=vh*1.15;
 panelOverflow=Math.max(0,participationPanel.scrollHeight-vh);
 pinOverflow=matchMedia('(max-width:600px)').matches?Math.max(0,heroLayer.scrollHeight-vh):0;
 pinnedHero.style.setProperty('--pin-overflow',pinOverflow+'px');
 pinnedHero.style.setProperty('--pin-height',(vh+pinOverflow)+'px');
 transitionStage.style.height=(vh+pinOverflow+revealTravel+panelOverflow)+'px';
 const rect=heroBanner.getBoundingClientRect(),pinRect=pinnedHero.getBoundingClientRect();
 const mobile=matchMedia('(max-width:600px)').matches;
 const sampleBadge=bannerLabels.find(label=>label.textContent.trim()==='Football Summer')||bannerLabels[0];
 const mobileHeight=sampleBadge.offsetHeight||24;
 const mobileWidth=sampleBadge.offsetWidth||120;
 seed={x:rect.left+rect.width/2,y:rect.top-pinRect.top-pinOverflow+rect.height*.5,w:mobile?mobileWidth:Math.min(190,rect.width*.6),h:mobile?mobileHeight:36};
 revealLabel.classList.toggle('mobile-reveal-label',mobile);
 updateCenterReveal();
}
function updateCenterReveal(){
 panelFrame=0;
 if(motionPreference.matches)return;
 const vh=window.innerHeight,vw=document.documentElement.clientWidth;
 const scrolled=Math.max(0,-transitionStage.getBoundingClientRect().top-pinOverflow);
 const progress=Math.max(0,Math.min(1,scrolled/revealTravel));
 // First the usual square-to-label entrance, then the immersive expansion.
 const badgeReveal=Math.max(0,Math.min(1,progress/.13));
 const badgeEase=badgeReveal*badgeReveal*(3-2*badgeReveal);
 const badgeStart=Math.min(28,seed.h);
 const badgeWidth=badgeStart+(seed.w-badgeStart)*badgeEase;
 const growth=Math.max(0,Math.min(1,(progress-.22)/.68));
 const eased=growth*growth*(3-2*growth);
 const top=(seed.y-seed.h/2)*(1-eased),bottom=(vh-seed.y-seed.h/2)*(1-eased);
 const left=(seed.x-seed.w/2)*(1-eased),right=(vw-seed.x+seed.w/2-badgeWidth)*(1-eased);
 const radius=4*(1-eased)+22*Math.sin(Math.PI*eased);
 whiteSurface.style.clipPath=`inset(${top}px ${right}px ${bottom}px ${left}px round ${radius}px)`;
 whiteSurface.style.opacity=String(Math.min(1,progress/.035));
 whiteSurface.style.pointerEvents=progress>.9?'auto':'none';
 revealLabel.style.left=seed.x+'px';revealLabel.style.top=seed.y+'px';
 revealLabel.style.opacity=String(Math.max(0,Math.min(1,(badgeReveal-.45)/.55)) * Math.max(0,1-growth*5));
 const content=Math.max(0,Math.min(1,(progress-.72)/.24));
 participationPanel.style.opacity=String(content);
 const shift=Math.min(panelOverflow,Math.max(0,scrolled-revealTravel));
 participationPanel.style.transform=`translateY(${(1-content)*24-shift}px)`;
 if(matchMedia('(max-width:600px)').matches){
  stepsBadge.style.translate=`0 ${shift}px`;
  stepsHeading.style.translate=`0 ${shift}px`;
  for(let index=0;index<stepCards.length;index++){
   const card=stepCards[index],baseTop=card.offsetTop+card.parentElement.offsetTop;
   const stackTop=card.parentElement.offsetTop;
   const lift=Math.max(0,shift-baseTop+stackTop);card.style.translate=`0 ${lift}px`;
   const next=stepCards[index+1];
   const nextTop=next?next.offsetTop+next.parentElement.offsetTop-shift:Infinity;
   // Fade the previous layer only after the next card fully covers it.
   const overlap=next?Math.max(0,Math.min(1,(stackTop-nextTop)/55)):0;
   card.style.setProperty('--stack-visibility',String(1-overlap));
   card.style.pointerEvents=overlap>.95?'none':'';
  }
 }else{stepsBadge.style.translate='';stepsHeading.style.translate='';stepCards.forEach(card=>{card.style.translate='';card.style.removeProperty('--stack-visibility');card.style.pointerEvents=''})}
 // Play the content entrance once the white surface has opened.
 if(progress>.85&&!stepsEntrancePlayed)playStepsEntrance();
 if(progress<.5&&stepsEntrancePlayed)resetStepsEntrance();
}
function queueCenterReveal(){if(!panelFrame)panelFrame=requestAnimationFrame(updateCenterReveal)}
window.addEventListener('scroll',queueCenterReveal,{passive:true});
window.addEventListener('resize',measureCenterReveal,{passive:true});
document.fonts.ready.then(measureCenterReveal);motionPreference.addEventListener('change',()=>location.reload());
measureCenterReveal();

// Lenis follows wheel input softly while retaining native touch and reduced motion.
if(!motionPreference.matches&&typeof Lenis!=='undefined'){
 const smoothScroll=new Lenis({autoRaf:true,lerp:.085,smoothWheel:true,syncTouch:false,anchors:true,prevent:node=>node.tagName==='DIALOG'});
 smoothScroll.on('scroll',queueCenterReveal);
 document.fonts.ready.then(()=>smoothScroll.resize());
 const resizeWatch=new ResizeObserver(()=>smoothScroll.resize());resizeWatch.observe(document.body);
 window.addEventListener('pagehide',()=>{resizeWatch.disconnect();smoothScroll.destroy()},{once:true});
}

// Calculator reveals are tied to scroll distance, not a one-shot timer.
const calculatorEntrance=document.querySelector('.calculator-panel');
const footballScene=document.querySelector('.bottom-scene');
const calculatorSection=document.querySelector('.calculator');
const calcMotion=matchMedia('(prefers-reduced-motion: reduce)');
const calcRevealGroups=[
 [calculatorEntrance.querySelector('.eyebrow'),0,.35],
 [calculatorEntrance.querySelector('h2'),.06,.48],
 [calculatorEntrance.querySelector('.calc-description'),.14,.55],
 [calculatorEntrance.querySelector('.result'),.23,.65],
 [calculatorEntrance.querySelector('.range-label'),.3,.72],
 [range,.34,.77],
 [calculatorEntrance.querySelector('.range-ticks'),.36,.79],
 [calculatorEntrance.querySelector('.calc-buttons'),.44,.88],
 [calculatorEntrance.querySelector('.calc-note'),.48,.94]
];
// Each UI element completes its own entrance after becoming visible.
if(!calcMotion.matches&&'IntersectionObserver' in window){
 const uiObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(!entry.isIntersecting)continue;
   const element=entry.target;uiObserver.unobserve(element);element.style.opacity='';
   element.animate([{opacity:0,transform:'translateY(22px)',filter:'blur(7px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0px)'}],{duration:550,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
  }
 },{threshold:.1,rootMargin:'0px 0px -18px 0px'});
 for(const [element] of calcRevealGroups){element.style.opacity='0';uiObserver.observe(element)}
}
let calcRevealFrame=0;
const calcPreviousShift=new WeakMap();
const calcClamp=n=>Math.max(0,Math.min(1,n));
function updateCalculatorReveal(){
 calcRevealFrame=0;
 const vh=window.innerHeight,top=calculatorSection.getBoundingClientRect().top;
 const progress=calcClamp((vh*.9-top)/(vh*.9));

 const imageLinear=calcMotion.matches?1:calcClamp((progress-.04)/.94);
 const imageProgress=imageLinear*imageLinear*(3-2*imageLinear);
 footballScene.style.setProperty('--scene-reveal-opacity',String(imageProgress));
 footballScene.style.setProperty('--scene-reveal-y',`${(1-imageProgress)*55}px`);
 footballScene.style.setProperty('--scene-reveal-blur',`${(1-imageProgress)*4}px`);
}
function queueCalculatorReveal(){if(!calcRevealFrame)calcRevealFrame=requestAnimationFrame(updateCalculatorReveal)}
window.addEventListener('scroll',queueCalculatorReveal,{passive:true});
window.addEventListener('resize',queueCalculatorReveal,{passive:true});
calcMotion.addEventListener('change',queueCalculatorReveal);
document.fonts.ready.then(queueCalculatorReveal);queueCalculatorReveal();

// Footer rules draw across the page; chips reveal using the hero button pattern.
const footerSports=document.querySelector('.footer .sports');
const footerBottom=document.querySelector('.footer-bottom');
const footerRules=[];
for(const [element,side] of [[footerSports,'before'],[footerSports,'after'],[footerBottom,'before']]){
 const rule=document.createElement('div');rule.className='footer-rule';rule.setAttribute('aria-hidden','true');
 if(side==='before')element.before(rule);else element.after(rule);
 footerRules.push(rule);
}
const footerChips=[...document.querySelectorAll('.footer-brand .sticker,.footer-group h3,.footer .app-link,.legal button,.socials button')];
if(!calcMotion.matches&&'IntersectionObserver' in window){
 footerRules.forEach(rule=>rule.style.transform='scaleX(0)');
 footerChips.forEach(chip=>chip.style.opacity='0');
 const footerObserver=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   const element=entry.target;footerObserver.unobserve(element);
   if(element.classList.contains('footer-rule')){
    element.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:1000,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
   }else{
    element.style.opacity='';
    if(element.matches('.legal button,.socials button')){drawFooterOutline(element);return}
    const width=element.getBoundingClientRect().width,height=element.getBoundingClientRect().height;
    const index=footerChips.indexOf(element);
    element.animate([{opacity:0,clipPath:`inset(0 ${Math.max(0,width-height)}px 0 0)`,offset:0},{opacity:1,clipPath:`inset(0 ${Math.max(0,width-height)}px 0 0)`,offset:.25},{opacity:1,clipPath:'inset(0 0px 0 0)'}],{duration:700,delay:(index%3)*80,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'});
   }
  });
 },{threshold:.25,rootMargin:'0px 0px -35px 0px'});
 [...footerRules,...footerChips].forEach(element=>footerObserver.observe(element));
}

function drawFooterOutline(button){
 const label=document.createElement('span');label.className='outline-entrance-label';while(button.firstChild)label.append(button.firstChild);button.append(label);
 const w=button.offsetWidth,h=button.offsetHeight,r=2,ns='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.setAttribute('aria-hidden','true');svg.classList.add('entrance-stroke');button.append(svg);button.classList.add('drawing-stroke');
 const paths=[`M .5 ${h/2} V ${r} Q .5 .5 ${r} .5 H ${w-r} Q ${w-.5} .5 ${w-.5} ${r} V ${h/2}`,`M .5 ${h/2} V ${h-r} Q .5 ${h-.5} ${r} ${h-.5} H ${w-r} Q ${w-.5} ${h-.5} ${w-.5} ${h-r} V ${h/2}`];
 let last;
 for(const d of paths){const path=document.createElementNS(ns,'path');path.setAttribute('d',d);svg.append(path);const length=path.getTotalLength();path.style.strokeDasharray=String(length);last=path.animate([{strokeDashoffset:length},{strokeDashoffset:0}],{duration:700,easing:'cubic-bezier(.45,0,.25,1)',fill:'backwards'})}
 label.animate([{opacity:0},{opacity:1}],{duration:350,delay:160,easing:'ease-out',fill:'backwards'});
 last.finished.then(()=>{button.classList.remove('drawing-stroke');svg.remove()});
}

function measureMobileCalculator(){
 if(!matchMedia('(max-width:600px)').matches)return;
 const sceneTop=calculatorEntrance.offsetHeight+72;
 footballScene.style.setProperty('--mobile-scene-top',sceneTop+'px');
 calculatorSection.style.setProperty('--mobile-calc-height',(sceneTop+document.documentElement.clientWidth*3894/4320+24)+'px');
}
document.fonts.ready.then(()=>{measureMobileCalculator();measureCenterReveal()});
window.addEventListener('resize',measureMobileCalculator,{passive:true});
measureMobileCalculator();

// Native modal keeps the mobile navigation above the pinned animation layers.
const mobileMenu=document.createElement('dialog');mobileMenu.className='mobile-menu';mobileMenu.setAttribute('aria-label','Меню сайта');
mobileMenu.innerHTML=`<div class="mobile-menu-content"><div class="mobile-menu-header"><a href="#" aria-label="CreativeByte — главная"><img src="assets/logo.png" width="157" height="18" alt="CreativeByte"></a><button type="button" class="mobile-menu-close" aria-label="Закрыть меню"><i></i><i></i><i></i><i></i><i></i></button></div><nav class="mobile-menu-links" aria-label="Мобильная навигация"><a href="#calculator">Размер фрибета <span>+</span></a><button type="button" data-menu-terms>Условия акции <span>+</span></button><a href="#steps">Как участвовать</a></nav><button type="button" class="button mobile-menu-join">Принять участие</button></div>`;
document.body.append(mobileMenu);
menu.setAttribute('aria-controls','mobile-navigation');mobileMenu.id='mobile-navigation';
let menuClosing=false,menuAnimations=[];
const menuRows=[...mobileMenu.querySelectorAll('.mobile-menu-links>*')];
const menuJoin=mobileMenu.querySelector('.mobile-menu-join');
function openMobileMenu(){
 if(mobileMenu.open||!matchMedia('(max-width:600px)').matches)return;
 menuAnimations.forEach(animation=>animation.cancel());menuAnimations=[];
 const bannerTop=heroBanner.getBoundingClientRect().top;
 mobileMenu.style.setProperty('--mobile-menu-height',`${Math.max(0,bannerTop-10)}px`);
 mobileMenu.showModal();menu.setAttribute('aria-expanded','true');document.documentElement.classList.add('mobile-menu-open');
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 menuAnimations.push(mobileMenu.animate([{opacity:0},{opacity:1}],{duration:350,easing:'ease-out',fill:'backwards'}));
 menuRows.forEach((row,index)=>menuAnimations.push(row.animate([{opacity:0,transform:'translateY(-12px)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0)',filter:'blur(0)'}],{duration:550,delay:140+index*100,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})));
 const width=menuJoin.offsetWidth,height=menuJoin.offsetHeight;
 menuAnimations.push(menuJoin.animate([{opacity:0,clipPath:`inset(0 ${width-height}px 0 0)`,offset:0},{opacity:1,clipPath:`inset(0 ${width-height}px 0 0)`,offset:.25},{opacity:1,clipPath:'inset(0 0px 0 0)'}],{duration:650,delay:350,easing:'cubic-bezier(.22,.61,.36,1)',fill:'backwards'}));
}
async function closeMobileMenu(){
 if(!mobileMenu.open||menuClosing)return;menuClosing=true;
 menuAnimations.forEach(animation=>animation.cancel());menuAnimations=[];
 if(!matchMedia('(prefers-reduced-motion: reduce)').matches){await mobileMenu.animate([{opacity:1},{opacity:0}],{duration:250,easing:'ease-in',fill:'forwards'}).finished}
 mobileMenu.close();mobileMenu.getAnimations().forEach(animation=>animation.cancel());
 menu.setAttribute('aria-expanded','false');document.documentElement.classList.remove('mobile-menu-open');menuClosing=false;
}
menu.addEventListener('click',openMobileMenu);
mobileMenu.querySelector('.mobile-menu-close').addEventListener('click',()=>closeMobileMenu());
mobileMenu.addEventListener('cancel',event=>{event.preventDefault();closeMobileMenu()});
mobileMenu.querySelector('.mobile-menu-header a').addEventListener('click',async event=>{event.preventDefault();await closeMobileMenu();window.scrollTo({top:0,behavior:'smooth'})});
mobileMenu.querySelectorAll('.mobile-menu-links a').forEach(link=>link.addEventListener('click',async event=>{
 event.preventDefault();const target=link.getAttribute('href');await closeMobileMenu();
 if(target==='#steps'){
  const top=transitionStage.offsetTop+pinOverflow+revealTravel;
  window.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }else document.querySelector(target)?.scrollIntoView({behavior:'smooth',block:'start'});
}));
mobileMenu.querySelector('[data-menu-terms]').addEventListener('click',async()=>{await closeMobileMenu();document.getElementById('dialog-title').textContent=messages.terms[0];document.getElementById('dialog-copy').textContent=messages.terms[1];dialog.showModal()});
menuJoin.addEventListener('click',async()=>{await closeMobileMenu();document.getElementById('dialog-title').textContent=messages.join[0];document.getElementById('dialog-copy').textContent=messages.join[1];dialog.showModal()});
window.addEventListener('resize',()=>{if(!matchMedia('(max-width:600px)').matches&&mobileMenu.open)closeMobileMenu()},{passive:true});
