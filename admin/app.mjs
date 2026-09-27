import {config} from './config.mjs';
import {LeagueApi, avatarUrl, playerValues, newsValues} from './api.mjs';

const api = new LeagueApi(config);
const $ = id => document.getElementById(id);
const state = {section: 'players', selected: null, records: {}, dirty: false, busy: false, me: null};
const names = {players: 'Игроки', news: 'Новости', matches: 'Матчи', members: 'Участники и доступ'};
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined && text !== null) el.textContent = text;
  if (className) el.className = className;
  return el;
}
function message(text = '', error = false, id = 'status') {
  $(id).textContent = text;
  $(id).className = error ? 'status-error' : 'status-success';
}
function busy(value) {
  state.busy = value;
  for (const el of document.querySelectorAll('button, #editor input, #editor textarea, #editor select')) el.disabled = value;
  $('workspace').setAttribute('aria-busy', String(value));
}
function mayLeave() {
  return !state.dirty || window.confirm('Есть несохранённые изменения. Оставить их без сохранения?');
}
window.addEventListener('beforeunload', event => {
  if (state.dirty || state.busy) { event.preventDefault(); event.returnValue = ''; }
});

$('login-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (state.busy) return;
  busy(true);
  message('Проверяем доступ…', false, 'login-message');
  const fields = new FormData(event.currentTarget);
  try {
    const email = await api.signIn(String(fields.get('email')).trim(), fields.get('password'));
    await loadData();
    $('account').textContent = email;
    $('login').hidden = true;
    $('workspace').hidden = false;
    $('logout').hidden = false;
    state.dirty = false;
    state.selected = null;
    state.section = 'players';
    showSection();
    message('');
  } catch (error) {
    await api.signOut();
    message(error.message, true, 'login-message');
  } finally {
    event.target.elements.password.value = '';
    busy(false);
  }
});
$('logout').addEventListener('click', async () => {
  if (state.busy || !mayLeave()) return;
  busy(true);
  await api.signOut();
  state.records = {};
  state.dirty = false;
  state.selected = null;
  $('editor').replaceChildren();
  $('records').replaceChildren();
  $('account').textContent = '';
  $('workspace').hidden = true;
  $('logout').hidden = true;
  $('login').hidden = false;
  message('Вы вышли из пульта.', false, 'login-message');
  busy(false);
  $('login-form').elements.email.focus();
});
async function loadData() {
  const tables = ['players', 'news', 'matches', 'seasons', 'league_settings'];
  const values = await Promise.all(tables.map(t => api.list(t)));
  state.records = Object.fromEntries(tables.map((t,i) => [t,values[i]]));
  state.me = await api.rpc('member_me');
  $('members-tab').hidden = state.me.role !== 'owner';
  if (state.me.role === 'owner') state.records.members = await api.rpc('owner_members');
}
$('reload').addEventListener('click', async () => {
  if (state.busy || !mayLeave()) return;
  busy(true);
  message('Обновляем данные…');
  try {
    await loadData();
    state.dirty = false;
    renderList();
    renderEditor();
    message('Данные загружены из базы.');
  } catch(error) { message(error.message, true); }
  finally { busy(false); }
});
$('sections').addEventListener('click', event => {
  const button = event.target.closest('[data-section]');
  if (!button || state.busy || button.dataset.section === state.section || !mayLeave()) return;
  state.section = button.dataset.section;
  state.selected = null;
  state.dirty = false;
  $('search').value = '';
  message('');
  showSection();
});
$('search').addEventListener('input', renderList);
function showSection() {
  for (const button of $('sections').querySelectorAll('button')) button.setAttribute('aria-pressed', String(button.dataset.section === state.section));
  $('list-title').textContent = names[state.section];
  renderList();
  renderEditor();
}
function recordTitle(record) {
  return record.nickname || record.display_name || record.title || `Игровой день ${String(record.day).padStart(2,'0')}`;
}
function renderList() {
  $('records').replaceChildren();
  const search = $('search').value.trim().toLocaleLowerCase('ru');
  const records = state.records[state.section] || [];
  for (const record of records.filter(r => recordTitle(r).toLocaleLowerCase('ru').includes(search))) {
    const button = node('button', null, 'record');
    button.type = 'button';
    button.setAttribute('aria-current', String(record.id === state.selected));
    if (record.avatar) {
      const src = avatarUrl(record.avatar, location.href);
      if (src) { const img = node('img'); img.src = src; img.alt = ''; img.referrerPolicy = 'no-referrer'; button.append(img); }
    }
    const text = node('span');
    text.append(node('strong', recordTitle(record)));
    text.append(node('small', state.section === 'members' ? `${record.email} · ${record.status} · ${record.role}` : state.section === 'players' ? 'Профиль · ' + record.id : record.publication_status === 'published' ? 'Опубликовано в базе' : 'Черновик'));
    button.append(text);
    button.addEventListener('click', () => {
      if (state.busy || !mayLeave()) return;
      state.selected = record.id;
      state.dirty = false;
      message('');
      renderList();
      renderEditor();
      const heading = $('editor').querySelector('h2');
      heading?.focus({preventScroll: true});
      if (matchMedia('(max-width:768px)').matches) $('editor').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block:'start'});
    });
    $('records').append(button);
  }
  if (!$('records').children.length) $('records').append(node('p', 'Ничего не найдено.', 'empty'));
}
function field(form, label, name, value, {type = 'text', full = false, required = false, hint = '', options, readonly = false} = {}) {
  const wrap = node('label', label, full ? 'full' : '');
  const control = node(options ? 'select' : type === 'textarea' ? 'textarea' : 'input');
  control.name = name;
  if (options) for (const [v,t] of options) { const option = node('option',t); option.value=v; control.append(option); }
  else if (type === 'textarea') control.rows = name === 'paragraphs' ? 10 : 3;
  else { control.type = type; if (type === 'number') { control.min='0'; control.step='1'; } }
  control.value = value ?? '';
  control.required = required;
  control.readOnly = readonly;
  if (name === 'nickname') control.maxLength = 80;
  wrap.append(control);
  if (hint) wrap.append(node('small', hint));
  form.append(wrap);
  return control;
}
function renderEditor() {
  const editor = $('editor');
  editor.replaceChildren();
  const record = (state.records[state.section] || []).find(r => r.id === state.selected);
  if (!record) { editor.append(node('p','Выберите запись для просмотра или редактирования.','empty')); return; }
  const title = node('h2',recordTitle(record)); title.tabIndex=-1;
  editor.append(title, node('span',`${names[state.section]} / ${record.id}`,'badge'));
  if (state.section === 'matches') { renderMatch(record); return; }
  if (state.section === 'members') { renderMember(record); return; }
  const section = state.section;
  const form = node('form');
  const grid = node('div',null,'form-grid');
  if (section === 'players') {
    const img = node('img', null, 'portrait');
    img.alt = record.nickname; img.referrerPolicy='no-referrer';
    const src = avatarUrl(record.avatar,location.href); if (src) img.src=src; else img.hidden=true;
    editor.append(img);
    field(grid,'Ник','nickname',record.nickname,{required:true});
    field(grid,'Порядок в составе','display_order',record.display_order,{type:'number',required:true,hint:'От 0. Меньшее число — раньше в списке.'});
    field(grid,'Фотография','avatar',record.avatar,{full:true,required:true,hint:'Путь assets/имя.jpg или HTTPS-ссылка. Загрузка файлов будет отдельным шагом.'});
    field(grid,'Цитата игрока','quote',record.quote,{type:'textarea',full:true});
  } else {
    field(grid,'Заголовок','title',record.title,{full:true,required:true});
    field(grid,'Краткий заголовок','short_title',record.short_title,{full:true,hint:'Для компактной карточки на мобильном.'});
    field(grid,'Подпись','label',record.label);
    field(grid,'Порядок в ленте','display_order',record.display_order,{type:'number',required:true});
    field(grid,'Краткое описание','excerpt',record.excerpt,{type:'textarea',full:true});
    field(grid,'Текст новости','paragraphs',record.paragraphs.join('\n\n'),{type:'textarea',full:true,required:true,hint:'Разделяйте абзацы пустой строкой. Обычный текст, без HTML.'});
    field(grid,'Цитата игрока','quote_player_id',record.quote_player_id,{options:[['','Без цитаты'],...state.records.players.map(p => [p.id,p.nickname])]});
    field(grid,'Статус в базе','publication_status',record.publication_status,{options:[['draft','Черновик'],['published','Опубликовано']],hint:'Публичный сайт пока не подключён к базе.'});
  }
  const actions = node('div',null,'actions');
  const save = node('button','Сохранить в базе →','primary'); save.type='submit';
  const reset = node('button','Отменить правки','quiet'); reset.type='button';
  reset.addEventListener('click', () => { if (mayLeave()) {state.dirty=false; renderEditor(); message('');} });
  actions.append(save,reset);
  form.append(grid,actions);
  form.addEventListener('input', () => {state.dirty=true; message('Есть несохранённые изменения.');});
  form.addEventListener('change', () => {state.dirty=true;});
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (state.busy) return;
    let values;
    try {
      const fields = Object.fromEntries(new FormData(form));
      values = section === 'players' ? playerValues(fields,location.href) : newsValues(fields);
    } catch(error) {message(error.message,true); return;}
    busy(true); message('Сохраняем…');
    try {
      const saved = await api.update(section,record,values);
      state.records[section] = state.records[section].map(r => r.id === record.id ? saved : r).sort((a,b) => a.display_order-b.display_order || a.id.localeCompare(b.id));
      state.dirty=false;
      renderList(); renderEditor();
      message(section === 'players' ? 'Профиль сохранён. Обновите страницу сайта, чтобы увидеть изменения.' : 'Новость сохранена в базе. Публичная лента пока не подключена.');
    } catch(error) {message(error.message,true);}
    finally {busy(false);}
  });
  editor.append(form);
}
function renderMatch(record) {
  const season=state.records.seasons.find(s => s.id === record.season_id);
  const player=state.records.players.find(p => p.id === record.mvp_player_id);
  const facts=node('dl',null,'match-facts');
  const date=record.match_date ? record.match_date.split('-').reverse().join('.') : 'Не назначена';
  for (const [label,value] of [['Сезон',season?.label || record.season_id],['Дата',date],['Статус',record.status==='completed'?'Завершён':'Запланирован'],['MVP',player?.nickname || 'Не выбран']]) {
    const box=node('div'); box.append(node('dt',label),node('dd',value)); facts.append(box);
  }
  $('editor').append(facts,node('p','Здесь можно открыть и закрыть голосование. Итогового MVP подтверждает главный администратор. Редактор составов и карт пока не подключён.','notice'));
  renderBallotControls(record);
}
// Enable only after all handlers are registered. Classic bundle also loads from local files.
$('login-form').querySelector('button[type=submit]').disabled = false;
message('', false, 'login-message');

function renderMember(record) {
 const form=node('form'),grid=node('div',null,'form-grid');
 const isOwner=record.role==='owner';
 $('editor').append(node('p',record.email,'muted'));
 if(isOwner) $('editor').append(node('p','Главный администратор. Ваши права защищены; здесь можно привязать свой игровой профиль для голосования.','notice'));
 else {
  field(grid,'Статус участия','status',record.status,{options:[['pending','Ожидает подтверждения'],['approved','Подтверждён'],['blocked','Заблокирован']]});
  field(grid,'Права','role',record.role,{options:[['participant','Участник'],['admin','Администратор']]});
 }
 field(grid,'Игровой профиль','player_id',record.player_id,{full:true,options:[['','Не привязан'],...state.records.players.map(p=>[p.id,p.nickname])],hint:'Один игрок — один аккаунт. После назначения привязка закрепляется. Админ без привязки управляет сайтом, но не голосует.'});
 const save=node('button',isOwner?'Привязать мой профиль':'Сохранить доступ','primary');save.type='submit';
 form.append(grid,save);form.oninput=()=>{state.dirty=true;};
 form.onsubmit=async event=>{
  event.preventDefault();if(state.busy)return;const data=Object.fromEntries(new FormData(form));busy(true);
  try{await api.rpc('owner_update_member',{p_user_id:record.id,p_status:isOwner?'approved':data.status,p_role:isOwner?'admin':data.role,p_player_id:data.player_id||null});state.dirty=false;await loadData();renderList();renderEditor();message('Права сохранены. Они применяются на сервере сразу.');}
  catch(error){message(error.message,true);}finally{busy(false);}
 };
 $('editor').append(form);
}
async function renderBallotControls(record) {
 const box=node('section',null,'ballot-controls');box.append(node('h3','Голосование за MVP'));$('editor').append(box);
 if(record.status!=='completed'||record.publication_status!=='published'){box.append(node('p','Голосование доступно для завершённого опубликованного матча.','muted'));return;}
 try{
  const ballot=await api.rpc('mvp_ballot',{p_match_id:record.id});if(!box.isConnected)return;
  const labels={not_open:'Ещё не открыто',open:'Идёт голосование. Результаты скрыты.',closed:'Голосование закрыто',finalized:'MVP подтверждён'};
  box.append(node('p',labels[ballot.status],'badge'));
  async function action(kind,winner=null){
   if(state.busy)return;busy(true);message('Сохраняем…');
   try{await api.rpc('manage_mvp_ballot',{p_match_id:record.id,p_action:kind,p_winner_id:winner});await loadData();renderList();renderEditor();message(kind==='finalize'?'MVP подтверждён. Очки пересчитаны в базе; старые статические таблицы сайта пока не синхронизированы.':'Состояние голосования обновлено.');}
   catch(error){message(error.message,true);}finally{busy(false);}
  }
  if(ballot.status==='not_open'){const b=node('button','Открыть голосование','primary');b.onclick=()=>action('open');box.append(b);}
  if(ballot.status==='open'){const b=node('button','Закрыть и подсчитать голоса','primary');b.onclick=()=>action('close');box.append(b);box.append(node('p','После закрытия голоса изменить нельзя. Результаты фиксируются.','muted'));}
  if(ballot.results){
   for(const r of ballot.results){const c=ballot.candidates.find(p=>p.id===r.player_id);box.append(node('p',`${r.player_id===ballot.winner_player_id?'★ ':''}${c?.nickname||r.player_id} — ${r.votes}`));}
  }
  if(ballot.status==='closed'&&state.me.role==='owner'){
   const best=Math.max(0,...ballot.results.map(r=>r.votes));
   if(best>0){const form=node('form');const leaders=ballot.results.filter(r=>r.votes===best).map(r=>[r.player_id,ballot.candidates.find(c=>c.id===r.player_id)?.nickname||r.player_id]);field(form,'Подтвердить MVP','winner',leaders[0][0],{options:leaders,hint:'Выберите лидера. При равенстве голосов решение за вами. Повторное начисление исключено.'});const b=node('button','Подтвердить MVP и начисление','primary');b.type='submit';form.append(b);form.onsubmit=event=>{event.preventDefault();action('finalize',new FormData(form).get('winner'));};box.append(form);}
   else box.append(node('p','Нет действительных голосов. Награда не начисляется.','muted'));
  }
 }catch(error){if(box.isConnected)box.append(node('p',error.message,'status-error'));}
}
