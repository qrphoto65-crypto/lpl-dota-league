import {config} from '../admin/config.mjs';
import {LeagueApi, avatarUrl} from '../admin/api.mjs';
const api=new LeagueApi(config);
const $=id=>document.getElementById(id);
let mode='login',pending=false,me=null;
const targetMatch=new URLSearchParams(location.search).get('match');
// Email confirmation may return tokens in the fragment. Don't store or forward them.
if (location.hash) history.replaceState(null,'',location.pathname+location.search);
function el(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
function say(text,error=false,id='feedback'){$(id).textContent=text;$(id).className=error?'status-error':'status-success';}
function busy(on){pending=on;for(const b of document.querySelectorAll('button'))b.disabled=on;}
function switchMode(next){if(pending)return;mode=next;$('name-label').hidden=next!=='signup';$('auth-form').elements.display_name.required=next==='signup';$('auth-form').elements.password.autocomplete=next==='signup'?'new-password':'current-password';$('auth-form').elements.password.minLength=next==='signup'?10:1;$('auth-form').querySelector('button').textContent=next==='signup'?'Создать аккаунт →':'Войти →';$('login-tab').setAttribute('aria-pressed',String(next==='login'));$('signup-tab').setAttribute('aria-pressed',String(next==='signup'));say('',false,'login-message');}
$('login-tab').onclick=()=>switchMode('login');$('signup-tab').onclick=()=>switchMode('signup');
$('auth-form').onsubmit=async event=>{
 event.preventDefault();if(pending)return;const form=event.currentTarget;const data=new FormData(form);busy(true);say(mode==='signup'?'Создаём аккаунт…':'Проверяем вход…',false,'login-message');
 try{
  if(mode==='signup'){
   const redirect=/^https?:$/.test(location.protocol)?location.origin+location.pathname:undefined;
   await api.signUp(String(data.get('email')).trim(),String(data.get('password')),String(data.get('display_name')),redirect);
   busy(false);switchMode('login');say('Если адрес доступен для регистрации, на почту придёт письмо. Подтвердите адрес, затем войдите. Если почта уже подтверждена, можно войти сразу.',false,'login-message');
  }else{
   await api.signIn(String(data.get('email')).trim(),String(data.get('password')),false);
   await refresh();$('auth').hidden=true;$('member').hidden=false;$('logout').hidden=false;
  }
 }catch(error){if(mode==='login')await api.signOut();say(error.message,true,'login-message');}
 finally{form.elements.password.value='';busy(false);applyEligibility();}
};
$('logout').onclick=async()=>{if(pending)return;busy(true);await api.signOut();me=null;$('ballots').replaceChildren();$('points').replaceChildren();$('member').hidden=true;$('auth').hidden=false;$('logout').hidden=true;say('Вы вышли.',false,'login-message');busy(false);};
$('refresh').onclick=async()=>{if(pending)return;busy(true);try{await refresh();say('Обновлено.');}catch(e){say(e.message,true);}finally{busy(false);applyEligibility();}};
function eligible(){return me?.status==='approved'&&Boolean(me.player_id);}
function applyEligibility(){for(const b of document.querySelectorAll('[data-vote]'))b.disabled=pending||!eligible();}
async function refresh(){
 me=await api.rpc('member_me');
 $('member-name').textContent=me.display_name;
 $('admin-link').hidden=!(me.role==='owner'||(me.role==='admin'&&me.status==='approved'));
 $('membership').textContent=me.status==='blocked'?'Доступ к голосованию приостановлен владельцем.':me.status==='pending'?'Заявка отправлена. Владелец подтвердит участие и привяжет аккаунт к игроку.':!me.player_id?'Доступ подтверждён. Для голосования нужна привязка к игроку в разделе «Участники и доступ».':'Участие подтверждено. Можно менять голос до закрытия голосования. Результаты появятся после закрытия.';
 const [matches,points]=await Promise.all([api.rpc('mvp_match_list'),api.rpc('member_points')]);
 $('points').replaceChildren();if(me.player_id)for(const p of points)$('points').append(el('span',`${p.season} · ${p.points} очков`));
 const ballots=await Promise.all(matches.map(m=>api.rpc('mvp_ballot',{p_match_id:m.id})));
 $('ballots').replaceChildren();
 if(!matches.length)$('ballots').append(el('p','Завершённых матчей пока нет.','empty'));
 matches.forEach((m,i)=>renderBallot(m,ballots[i]));
 if(targetMatch){const box=document.getElementById('ballot-'+targetMatch);box?.scrollIntoView({block:'start'});}
}
function renderBallot(match,ballot){
 const box=el('section',undefined,'ballot');box.id='ballot-'+match.id;
 box.append(el('h3',`Игровой день ${String(match.day).padStart(2,'0')}`),el('span',match.season,'eyebrow'));
 const link=el('a','Подробности матча ↗');link.href='../matches/'+encodeURIComponent(match.id)+'.html';box.append(link);
 const labels={not_open:'Голосование ещё не открыто',open:'Голосование открыто · результаты скрыты',closed:'Голосование закрыто · ждём подтверждения MVP',finalized:'MVP подтверждён'};
 box.append(el('p',labels[ballot.status],'ballot-status'));
 if(ballot.status==='open'){
  const grid=el('div',undefined,'candidate-grid');
  for(const c of ballot.candidates){
   const b=el('button');b.type='button';b.className='candidate';b.dataset.vote='true';b.disabled=!eligible();b.setAttribute('aria-pressed',String(ballot.my_vote===c.id));b.setAttribute('aria-label','Голосовать за '+c.nickname);
   const src=avatarUrl(c.avatar,location.href);if(src){const img=el('img');img.src=src;img.alt='';img.referrerPolicy='no-referrer';b.append(img);}b.append(el('strong',c.nickname));if(ballot.my_vote===c.id)b.append(el('small','✓ Ваш голос'));
   b.onclick=async()=>{if(pending||!eligible())return;busy(true);try{await api.rpc('cast_mvp_vote',{p_match_id:match.id,p_candidate_id:c.id});await refresh();say('Голос сохранён. До закрытия можно выбрать другого игрока.');}catch(e){say(e.message,true);}finally{busy(false);applyEligibility();}};
   grid.append(b);
  }
  box.append(grid);
 }else if(ballot.results){
  for(const r of ballot.results){const c=ballot.candidates.find(c=>c.id===r.player_id);const row=el('div',undefined,'result-row');row.append(el('span',(r.player_id===ballot.winner_player_id?'★ ':'')+(c?.nickname||r.player_id)),el('strong',String(r.votes)));box.append(row);}
 }
 $('ballots').append(box);
}
$('auth-form').querySelector('button').disabled=false;say('',false,'login-message');
