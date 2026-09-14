(() => {
const historySection=document.querySelector('.career-history');
if(historySection){[...historySection.querySelectorAll('.career-series')].sort((a,b)=>b.dataset.playedAt.localeCompare(a.dataset.playedAt)||Number(b.dataset.day)-Number(a.dataset.day)).forEach(series=>historySection.append(series));}
const data=JSON.parse(document.querySelector('#career-data').textContent);
const toggle=document.querySelector('.period-toggle'),menu=document.querySelector('.period-menu'),groups=document.querySelector('.career-groups');
let period='all';
function close(){menu.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');}
function render(){
 const selected=period==='all'?data.seasons:data.seasons.filter(s=>s.id===period);
 const total=selected.reduce((a,s)=>{for(const key of ['kills','deaths','assists','matches','wins','mvp','points'])a[key]+=s[key];return a;},{kills:0,deaths:0,assists:0,matches:0,wins:0,mvp:0,points:0});
 const avg=total.deaths?(total.kills+total.assists)/total.deaths:total.kills+total.assists;
 const sections=period==='all'?[['СУММАРНЫЙ KDA',[['УБИЙСТВА',total.kills],['СМЕРТИ',total.deaths],['АССИСТЫ',total.assists]]],['РЕЗУЛЬТАТЫ СЕРИЙ',[['СЫГРАНО МАТЧЕЙ',total.matches],['ВЫИГРАНО МАТЧЕЙ',total.wins],['MVP',total.mvp]]]]:[['KDA ЗА СЕЗОН',[['K / D / A',total.kills+'/'+total.deaths+'/'+total.assists],['СРЕДНИЙ KDA',new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(avg)]]],['ОЧКИ СЕЗОНА',[['ОЧКИ',total.points],['MVP',total.mvp]]]];
 groups.replaceChildren();
 sections.forEach(([title,values])=>{const section=document.createElement('section');section.className='card career-group';const h=document.createElement('h2'),bar=document.createElement('span');bar.className='redbar';h.append(bar,title);section.append(h);const dl=document.createElement('dl');dl.className='career-values';values.forEach(([label,value])=>{const div=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;div.append(dt,dd);dl.append(div);});section.append(dl);groups.append(section);});
 toggle.querySelector('span').textContent=period==='all'?'ALL TIME':data.seasons.find(s=>s.id===period).label;
 menu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.period===period)));
}
[{id:'all',label:'ALL TIME'},...data.seasons].forEach(item=>{const b=document.createElement('button');b.type='button';b.className='period-option';b.dataset.period=item.id;b.setAttribute('role','option');b.textContent=item.label;b.addEventListener('click',()=>{period=item.id;render();close();toggle.focus();});b.addEventListener('keydown',e=>{const buttons=[...menu.children],i=buttons.indexOf(b);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();buttons[(i+(e.key==='ArrowDown'?1:buttons.length-1))%buttons.length].focus();}if(e.key==='Escape'){close();toggle.focus();}});menu.append(b);});
toggle.addEventListener('click',()=>{const open=!menu.classList.contains('is-open');menu.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));if(open)menu.querySelector('[aria-selected="true"]').focus();});
document.addEventListener('click',e=>{if(!e.target.closest('.career-controls'))close();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('is-open')){close();toggle.focus();}});render();
})();