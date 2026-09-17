(() => {
 const track=document.querySelector('.players-carousel');if(!track)return;
 const originalCards=[...track.querySelectorAll('.player-mini')];if(!originalCards.length)return;
 let cards=originalCards,mobileCards=null;
 track.setAttribute('role','region');track.setAttribute('aria-label','Игроки: листайте свайпом или клавишами влево и вправо');track.setAttribute('aria-roledescription','карусель');track.tabIndex=0;
 let current=0,gesture=null,suppressClick=false,animations=[];
 const mobile=matchMedia('(max-width:768px)');
 cards.forEach((card,i)=>{card.dataset.rosterNumber=String(i+1).padStart(2,'0');card.style.setProperty('--roster-order',i);});
 const dots=document.createElement('div');dots.className='carousel-dots';dots.setAttribute('role','img');
 const markers=originalCards.map(()=>{const dot=document.createElement('span');dot.setAttribute('aria-hidden','true');dots.append(dot);return dot;});track.after(dots);
 function shuffledCards(){
  const result=[...originalCards];
  for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  try{const key='lpl-mobile-first-player',previous=sessionStorage.getItem(key);if(result.length>1&&result[0].getAttribute('href')===previous){const j=1+Math.floor(Math.random()*(result.length-1));[result[0],result[j]]=[result[j],result[0]];}sessionStorage.setItem(key,result[0].getAttribute('href'));}catch{}
  return result;
 }
 const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
 function settle(){markers.forEach((dot,i)=>dot.classList.toggle('is-active',i===current));dots.setAttribute('aria-label',`Игрок ${current+1} из ${cards.length}`);animations.forEach(a=>a.cancel());animations=[];cards.forEach((card,i)=>{card.classList.toggle('is-current',i===current);card.inert=mobile.matches&&i!==current;if(mobile.matches)card.setAttribute('aria-hidden',String(i!==current));else card.removeAttribute('aria-hidden');card.style.removeProperty('translate');});}
 function show(index){
  if(!mobile.matches)return;
  const direction=index>current?1:-1;index=((index%cards.length)+cards.length)%cards.length;if(index===current){settle();return;}
  const old=current;current=index;settle();
  if(reduced())return;
  const options={duration:380,easing:'cubic-bezier(.22,.61,.36,1)'};
  const outgoing=cards[old].animate([{translate:'0 0',opacity:1,visibility:'visible'},{translate:`${-direction*100}% 0`,opacity:1,visibility:'visible'}],options);
  const incoming=cards[current].animate([{translate:`${direction*100}% 0`,opacity:1},{translate:'0 0',opacity:1}],options);
  animations=[outgoing,incoming];
 }
 track.addEventListener('keydown',e=>{if(mobile.matches&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){e.preventDefault();show(current+(e.key==='ArrowRight'?1:-1));track.focus({preventScroll:true});}});
 track.addEventListener('dragstart',e=>{if(mobile.matches)e.preventDefault();});
 track.addEventListener('pointerdown',e=>{if(!mobile.matches||!e.isPrimary||e.button!==0)return;suppressClick=false;gesture={id:e.pointerId,x:e.clientX,y:e.clientY};});
 track.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3){suppressClick=true;track.setPointerCapture(e.pointerId);}});
 function finish(e){if(!gesture||gesture.id!==e.pointerId)return;const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;gesture=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.3){suppressClick=true;show(current+(dx<0?1:-1));}if(track.hasPointerCapture(e.pointerId))track.releasePointerCapture(e.pointerId);}
 track.addEventListener('pointerup',finish);track.addEventListener('pointercancel',()=>{gesture=null;});
 track.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopPropagation();suppressClick=false;}},true);
 function mode(){gesture=null;suppressClick=false;const selected=cards[current];if(mobile.matches){if(!mobileCards){mobileCards=shuffledCards();cards=mobileCards;current=0;}else{cards=mobileCards;current=Math.max(0,cards.indexOf(selected));}}else{cards=originalCards;current=Math.max(0,cards.indexOf(selected));}settle();track.tabIndex=mobile.matches?0:-1;track.setAttribute('aria-label',mobile.matches?'Игроки: листайте свайпом или клавишами влево и вправо':'Состав лиги: 10 игроков');if(mobile.matches)track.setAttribute('aria-roledescription','карусель');else track.removeAttribute('aria-roledescription');}
 mobile.addEventListener('change',mode);mode();
})();
