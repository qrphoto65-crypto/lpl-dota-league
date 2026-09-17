(() => {
 document.querySelectorAll('.fixture-completed').forEach(fixture=>{const teams=fixture.querySelectorAll('.fixture-team');const score=fixture.querySelector('.score-value')?.textContent.match(/(\d+)\s*:\s*(\d+)/);if(score&&teams.length===2&&score[1]!==score[2])teams[Number(score[1])>Number(score[2])?0:1].classList.add('event-winner');});
 const controls=document.querySelector('.career-controls'),menu=controls?.querySelector('.period-menu');
 if(menu){const pills=document.createElement('div');pills.className='period-pills';pills.setAttribute('role','tablist');pills.setAttribute('aria-label','Период статистики');const originals=[...menu.querySelectorAll('button')];originals.forEach(original=>{const b=document.createElement('button');b.type='button';b.textContent=original.textContent;b.setAttribute('role','tab');b.setAttribute('aria-selected',original.getAttribute('aria-selected'));b.addEventListener('click',()=>{original.click();b.focus();});pills.append(b);});controls.append(pills);controls.classList.add('has-period-pills');new MutationObserver(()=>{originals.forEach((b,i)=>pills.children[i].setAttribute('aria-selected',b.getAttribute('aria-selected')));}).observe(menu,{attributes:true,subtree:true,attributeFilter:['aria-selected']});}
 document.querySelectorAll('.map-tabs,.compact-tabs,.period-pills').forEach(group=>{
 group.classList.add('sliding-tabs');
 function position(){const active=group.querySelector('button[aria-selected="true"]');if(!active)return;group.style.setProperty('--pill-x',active.offsetLeft+'px');group.style.setProperty('--pill-width',active.offsetWidth+'px');}
 new MutationObserver(position).observe(group,{attributes:true,subtree:true,attributeFilter:['aria-selected']});new ResizeObserver(position).observe(group);document.fonts?.ready.then(position);position();
 });
})();
