(() => {
 const mq=matchMedia('(max-width:768px)'), records=new Map();let serial=0;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const clean=n=>n.textContent.replace(/\s+/g,' ').trim();
 const avatar=link=>{const slug=link?.getAttribute('href')?.match(/players\/([^/#]+)\.html/)?.[1];return slug?new URL('../assets/'+slug+'.jpg',new URL('components/mobile-compact.js',document.querySelector('script[src$="mobile-compact.js"]').src)).href:null;};
 function item(name,img,primary,fields,href,rank){
  const root=el('div','compact-item'),button=el('button','compact-summary');button.type='button';button.setAttribute('aria-expanded','false');
  const panel=el('div','compact-reveal'),inner=el('div','compact-inner');panel.id='compact-details-'+(++serial);button.setAttribute('aria-controls',panel.id);panel.inert=true;
  if(rank)button.append(el('span','compact-rank',rank));
  if(img){const image=el('img','compact-avatar');image.src=img;image.alt='';image.loading='lazy';image.addEventListener('error',()=>image.remove(),{once:true});button.append(image);}
  button.append(el('span','compact-name',name));const metrics=el('span','compact-primary');primary.forEach(([label,value])=>{const m=el('span','compact-metric');m.append(el('small','',label),el('b','',value));metrics.append(m);});button.append(metrics,el('span','compact-chevron','⌄'));
  const dl=el('dl','compact-values');fields.forEach(([label,value,kind])=>{const row=el('div',kind||'');row.append(el('dt','',label),el('dd','',value));dl.append(row);});inner.append(dl);
  if(href){const a=el('a','compact-profile-link',href.includes('matches/')?'Открыть карту →':'Профиль игрока →');a.href=href;inner.append(a);}
  panel.append(inner);root.append(button,panel);root.addEventListener('click',e=>e.stopPropagation());button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));panel.inert=!open;root.classList.toggle('is-expanded',open);});return root;
 }
 function renderTable(table){
  const headers=[...table.querySelectorAll('thead th')].map(n=>{const c=n.cloneNode(true);c.querySelectorAll('br').forEach(b=>b.replaceWith(' '));return clean(c);});if(headers.length<5)return;
  let record=records.get(table);const signature=table.innerHTML;if(record?.signature===signature)return;
  const list=el('div','compact-list');
  [...table.querySelectorAll('tbody tr')].forEach((row,index)=>{
   const cells=[...row.cells];const playerIndex=headers.findIndex(h=>h.includes('ИГРОК'));const player=cells[playerIndex<0?0:playerIndex];if(!player)return;
   const link=player.querySelector('a'),nameNode=(link||player).cloneNode(true);nameNode.querySelectorAll('img,.role-rank,.rank,.captain-marker').forEach(n=>n.remove());
   const name=clean(nameNode)+(player.querySelector('.captain-marker')?' ★':'');
   const fields=cells.map((c,i)=>[headers[i],clean(c)]).filter((_,i)=>i!==playerIndex&&headers[i]!=='#');
   if(table.closest('.role-statistics')){
    const totalCell=cells.find(c=>c.querySelector('.ranking-base'));
    if(totalCell){
     const number=n=>Number((n?.textContent||'0').replace(/[^0-9.-]/g,''))||0;
     const base=number(totalCell.querySelector('.ranking-base')),bonus=number(totalCell.querySelector('.ranking-bonus'));
     const format=n=>new Intl.NumberFormat('ru-RU').format(n);
     const index=fields.findIndex(([label])=>label==='ИТОГОВЫЕ ОЧКИ');if(index>=0)fields.splice(index,1);
     fields.unshift(['ТЕКУЩИЕ ОЧКИ',format(base),'compact-points-current'],['С БОНУСОМ ЗА МЕСТО',format(base+bonus),'compact-points-potential']);
    }
   }
   const key=headers.findIndex(h=>/SCORE/.test(h));const points=headers.findIndex(h=>/ОЧКИ/.test(h));const kda=headers.findIndex(h=>/KDA|КДА/.test(h));const chosen=key>=0?key:points>=0?points:kda;
   const primary=chosen>=0?[[key>=0?'SCORE':points>=0?'ОЧКИ':'KDA',clean(cells[chosen])]]:[];
   const hero=headers.findIndex(h=>h==='ГЕРОЙ');if(hero>=0)primary.unshift(['ГЕРОЙ',clean(cells[hero])]);
   list.append(item(name,player.querySelector('img')?.src||avatar(link),primary,fields,link?.href,headers.includes('#')||player.querySelector('.role-rank')?String(index+1).padStart(2,'0'):null));
  });
  if(record){record.list.replaceWith(list);}else{table.after(list);table.classList.add('compact-source');}
  records.set(table,{signature,list});
 }
 function tabs(blocks,labels){
  if(blocks.length!==2)return;const group=el('div','compact-tabs');group.setAttribute('role','tablist');group.setAttribute('aria-label','Категория статистики');const indicator=el('span','compact-tab-indicator');group.append(indicator);
  const buttons=blocks.map((block,i)=>{const b=el('button','',labels[i]);b.type='button';b.id='compact-tab-'+(++serial);b.setAttribute('role','tab');if(!block.id)block.id='compact-panel-'+serial;b.setAttribute('aria-controls',block.id);block.classList.add('compact-tab-panel');group.append(b);return b;});
  function select(i){group.style.setProperty('--selected',i);blocks.forEach((block,j)=>{block.classList.toggle('compact-tab-inactive',i!==j);buttons[j].setAttribute('aria-selected',String(i===j));buttons[j].tabIndex=i===j?0:-1;});}
  buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(i));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();select(1-i);buttons[1-i].focus();}});});blocks[0].before(group);select(location.hash.includes('support')?1:0);
 }
 document.querySelectorAll('.tables').forEach(g=>tabs([...g.querySelectorAll('.stats-preview')],['SUPPORTS','CORES']));tabs([...document.querySelectorAll('.role-statistics')],['CORE','SUPPORT']);
 document.querySelectorAll('.career-map').forEach(link=>{const parts=[...link.children];const fields=parts.map(p=>{const c=p.cloneNode(true),small=c.querySelector('small');const label=small?.textContent||'КАРТА / РЕЗУЛЬТАТ';small?.remove();return [label,clean(c)];});const row=item(clean(parts[0]),null,[['ГЕРОЙ',clean(parts[1].querySelector('strong')||parts[1])],['KDA',clean(parts[4]).replace('K / D / A','').trim()]],fields,link.href);link.classList.add('compact-source');link.after(row);});
 document.querySelectorAll('.players-grid:not(.players-carousel) .player-mini').forEach(link=>{const fields=[...link.querySelectorAll('dl>div')].map(n=>[clean(n.querySelector('dt')),clean(n.querySelector('dd'))]);link.after(item(clean(link.querySelector('h2')),link.querySelector('img')?.src,fields.slice(0,2),fields,link.href));link.classList.add('compact-source');});
 const rules=document.querySelector('.statistics-page .rules-topbar,.leaderboard-page .rules-topbar');
 if(rules){
  const home=document.createComment('desktop regulation position');rules.before(home);
  function placeRules(){if(mq.matches){document.querySelector('main').append(rules);rules.classList.add('mobile-rules-bottom');}else{home.after(rules);rules.classList.remove('mobile-rules-bottom');}}
  mq.addEventListener('change',placeRules);placeRules();
 }
 function update(){if(!mq.matches)return;document.querySelectorAll('main table').forEach(renderTable);}
 update();mq.addEventListener('change',update);
 const observer=new MutationObserver(changes=>{if(changes.some(c=>c.target.closest?.('table')))update();});observer.observe(document.querySelector('main'),{childList:true,characterData:true,subtree:true});
})();
