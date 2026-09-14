(() => {
const source = document.querySelector('#match-map-data');
if (!source) return;
const data = JSON.parse(source.textContent);
const host = document.querySelector('[data-map-statistics]');
if (!host) return;
const count = data.score.reduce((sum, wins) => sum + wins, 0);
if (count === 0) return;
if (count > 3 || data.maps.length !== count) throw new Error('Map data must match the BO3 result');
const tabs = document.createElement('div'); tabs.className='map-tabs'; tabs.setAttribute('role','tablist'); tabs.setAttribute('aria-label','Карты игрового дня');
const status = document.createElement('p');status.className='map-status mono';status.setAttribute('aria-live','polite');
const result = document.createElement('div'); result.className='map-result'; result.setAttribute('aria-live','polite');
host.before(tabs,status,result); host.id='map-statistics-panel';host.setAttribute('role','tabpanel');
const format = value => new Intl.NumberFormat('ru-RU').format(value);
function show(index, focus=false){
 const map=data.maps[index];
 result.replaceChildren();
 const kills = map.teams.map(team => team.players.reduce((sum, player) => sum + Number(player.kda.split('/')[0]), 0));
 map.teams.forEach((team, teamIndex) => {
  if(teamIndex === 1){const score=document.createElement('div');score.className='map-kill-score';score.textContent=kills[0]+' : '+kills[1];const label=document.createElement('small');label.textContent='УБИЙСТВА';score.append(label);result.append(score);}
  const item=document.createElement('div');item.className='map-result-team'+(map.winnerTeamIndex===teamIndex?' is-winner':'');item.textContent=team.name;
  const outcome=document.createElement('small');outcome.textContent=Number.isInteger(map.winnerTeamIndex)?(map.winnerTeamIndex===teamIndex?'ПОБЕДА НА КАРТЕ':'ПОРАЖЕНИЕ'):'РЕЗУЛЬТАТ УТОЧНЯЕТСЯ';item.append(outcome);result.append(item);
 });

 tabs.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});
 host.setAttribute('aria-labelledby','map-tab-'+index);
 status.textContent='КАРТА '+map.number+' · '+map.duration+' · ДЕМО-ДАННЫЕ';
 host.querySelectorAll('.team-statistics-block').forEach((block,i)=>{
  block.querySelector('caption').textContent='КАРТА '+map.number+' · ДЕМО-ДАННЫЕ';
  const body=block.querySelector('tbody');body.replaceChildren();
  map.teams[i].players.forEach(player=>{
   const row=document.createElement('tr'),name=document.createElement('td'),link=document.createElement('a');
   link.className='player-name-link';link.href='../players/'+player.slug+'.html';link.textContent=player.nick;name.append(link);
   if(player.captain){const star=document.createElement('span');star.className='captain-marker';star.setAttribute('role','img');star.setAttribute('aria-label','Капитан');star.textContent='★';name.append(' ',star);}
   row.append(name);
   [player.hero,player.kda,format(player.networth),format(player.damage),format(player.received)].forEach((v,j)=>{const cell=document.createElement('td');cell.textContent=v;if(j===0)cell.className='hero-cell';row.append(cell);});body.append(row);
  });
 });
 const duration=document.querySelector('[data-map-duration]');if(duration){duration.previousElementSibling.textContent='ДЛИТЕЛЬНОСТЬ КАРТЫ №'+map.number;duration.textContent=map.duration;}
 if(focus)tabs.children[index].focus();
}
data.maps.forEach((map,i)=>{const button=document.createElement('button');button.type='button';button.className='map-tab';button.id='map-tab-'+i;button.setAttribute('role','tab');button.setAttribute('aria-controls',host.id);button.textContent='КАРТА '+map.number;button.addEventListener('click',()=>show(i));button.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%count;if(event.key==='ArrowLeft')next=(i+count-1)%count;if(event.key==='Home')next=0;if(event.key==='End')next=count-1;if(next!==undefined){event.preventDefault();show(next,true);}});tabs.append(button);});
show(0);
})();