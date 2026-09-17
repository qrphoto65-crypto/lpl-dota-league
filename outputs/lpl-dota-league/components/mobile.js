(() => {
 const media=matchMedia('(max-width:768px)');
 const top=document.querySelector('body > header .top');
 const source=top?.querySelector('nav');
 if(source){
  const button=document.createElement('button');button.type='button';button.className='mobile-menu-toggle';button.setAttribute('aria-label','Открыть меню');button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls','mobile-menu');button.innerHTML='<span></span><span></span><span></span>';
  const overlay=document.createElement('div');overlay.id='mobile-menu';overlay.className='mobile-menu';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Навигация');overlay.inert=true;
  const nav=source.cloneNode(true);nav.setAttribute('aria-label','Мобильная навигация');nav.querySelectorAll('a').forEach((a,i)=>a.style.setProperty('--menu-index',i));overlay.append(nav);document.body.append(overlay);top.append(button);
  let opened=false,previousOverflow='',previousFocus;
  function setOpen(value){
   if(value===opened)return;opened=value;
   if(value){previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';overlay.append(button);}
   else {document.body.style.overflow=previousOverflow;top.append(button);}
   overlay.classList.toggle('is-open',value);overlay.inert=!value;button.setAttribute('aria-expanded',String(value));button.setAttribute('aria-label',value?'Закрыть меню':'Открыть меню');
   if(value)nav.querySelector('a')?.focus();else previousFocus?.focus();
  }
  button.addEventListener('click',()=>setOpen(!opened));overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('a'))setOpen(false);});
  document.addEventListener('keydown',e=>{if(!opened)return;if(e.key==='Escape'){e.preventDefault();setOpen(false);}if(e.key==='Tab'){const items=[button,...nav.querySelectorAll('a')],i=items.indexOf(document.activeElement);e.preventDefault();items[(i+(e.shiftKey?-1:1)+items.length)%items.length].focus();}});
  media.addEventListener('change',()=>{if(!media.matches)setOpen(false);});window.addEventListener('pagehide',()=>setOpen(false));
 }
 function labelTables(){
  document.querySelectorAll('main table').forEach(table=>{
   const headers=[...table.querySelectorAll('thead th')];if(headers.length<5)return;
   table.classList.add('mobile-card-table');
   table.querySelectorAll('tbody tr').forEach(row=>[...row.cells].forEach((cell,i)=>{const label=headers[i]?.innerText.replace(/\s+/g,' ').trim()||'';if(cell.dataset.mobileLabel!==label)cell.dataset.mobileLabel=label;}));
  });
 }
 labelTables();const main=document.querySelector('main');if(main)new MutationObserver(labelTables).observe(main,{childList:true,subtree:true});
})();
