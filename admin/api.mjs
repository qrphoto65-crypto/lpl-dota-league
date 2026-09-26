export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

// Deliberately memory-only sessions: reloading this first version requires login.
// Neither passwords nor access/refresh tokens are written to browser storage.
export class LeagueApi {
  constructor(config, fetcher = globalThis.fetch.bind(globalThis)) {
    this.config = config;
    this.fetcher = fetcher;
    this.token = null;
    this.expiresAt = 0;
  }
  clearSession() { this.token = null; this.expiresAt = 0; }
  async request(path, {method = 'GET', body, authorized = true, headers = {}} = {}) {
    if (authorized && (!this.token || Date.now() >= this.expiresAt)) {
      throw new ApiError('Сессия закончилась. Войдите снова.', 401);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    let response;
    let data;
    try {
      response = await this.fetcher(this.config.url + path, {
        method, signal: controller.signal, credentials: 'omit', cache: 'no-store',
        headers: {
          apikey: this.config.publishableKey,
          ...(authorized ? {Authorization: `Bearer ${this.token}`} : {}),
          ...(body !== undefined ? {'Content-Type': 'application/json'} : {}), ...headers,
        },
        ...(body !== undefined ? {body: JSON.stringify(body)} : {}),
      });
      data = await response.json().catch(() => null);
    } catch {
      throw new ApiError('Нет ответа от сервера. Проверьте соединение. Если вы сохраняли изменения, загрузите запись заново, прежде чем повторять сохранение.');
    } finally { clearTimeout(timer); }
    if (!response.ok) {
      let message = 'Не удалось выполнить запрос. Попробуйте ещё раз.';
      if (response.status === 401) message = 'Сессия закончилась или вход не подтверждён. Войдите снова.';
      if (response.status === 403 || data?.code === '42501') message = 'Нет прав для этой операции. Проверьте права администратора.';
      if (response.status === 409) message = 'Запись с таким идентификатором уже существует или связана с другими данными.';
      if (response.status === 429) message = 'Слишком много попыток. Подождите немного.';
      if (data?.code === 'invalid_credentials') message = 'Неверная почта или пароль.';
      if (data?.code === 'email_address_not_authorized' || data?.msg === 'Email address not authorized') message = 'Отправка писем участникам ещё не настроена. Организатору нужно подключить SMTP в Supabase.';
      if (data?.code === 'over_email_send_rate_limit') message = 'Достигнут лимит писем. Подождите и попробуйте позже.';
      if (data?.code === 'weak_password') message = 'Пароль не соответствует настройкам проекта. Используйте более длинный пароль с буквами и цифрами.';
      if (data?.code === 'email_not_confirmed') message = 'Почта не подтверждена. Проверьте аккаунт в Supabase Authentication.';
      if (data?.code === '23514' || data?.code === '22P02') message = 'Проверьте значения полей: база отклонила некорректные данные.';
      if (data?.code === 'PGRST202') message = 'Новая функция ещё не установлена. Выполните миграцию участников и голосования в Supabase.';
      if (data?.code === '23505') message = 'Этот игрок уже привязан к другому аккаунту.';
      const explanations = {
        owner_required: 'Эта операция доступна только главному администратору.',
        owner_protected: 'Нельзя изменить права главного администратора.',
        approved_member_required: 'Для голосования нужно подтверждение владельца и привязка к игроку.',
        player_binding_required: 'Выберите игрока для подтверждённого участника.',
        player_binding_locked: 'Привязка игрока уже закреплена. Её нельзя менять из пульта.',
        email_confirmation_required: 'Сначала подтвердите почту аккаунта.',
        ballot_not_open: 'Голосование уже закрыто или ещё не открыто.',
        ballot_not_closed: 'Сначала закройте голосование.',
        ballot_already_exists: 'Голосование по этому матчу уже создано.',
        candidate_not_in_match: 'Этот игрок не участвовал в матче.',
        completed_match_required: 'Нужен завершённый опубликованный матч.',
        complete_roster_required: 'Состав матча должен содержать 10 игроков.',
        choose_leading_candidate: 'Выберите одного из игроков с наибольшим числом голосов.',
        no_votes: 'Нет голосов. Подтвердить результат нельзя.',
        admin_must_be_approved: 'Для выдачи админки сначала подтвердите участника.',
      };
      if (explanations[data?.message]) message = explanations[data.message];
      throw new ApiError(message, response.status);
    }
    return data;
  }
  async signIn(email, password, requireAdmin = true) {
    this.clearSession();
    const session = await this.request('/auth/v1/token?grant_type=password', {
      method: 'POST', body: {email, password}, authorized: false,
    });
    if (!session?.access_token || !session.expires_in) throw new ApiError('Сервер не вернул сессию.');
    this.token = session.access_token;
    this.expiresAt = Date.now() + session.expires_in * 1000 - 5000;
    try { if (requireAdmin) {
      const isAdmin = await this.request('/rest/v1/rpc/is_league_admin', {method: 'POST', body: {}});
      if (isAdmin !== true) throw new ApiError('Этот аккаунт не назначен администратором.', 403);
    } } catch (error) { await this.signOut(); throw error; }
    return session.user?.email || email;
  }
  async signUp(email, password, displayName, redirectUrl) {
    if (password.length < 10) throw new ApiError('Пароль должен содержать не менее 10 символов.');
    const name = displayName.trim();
    if (!name || name.length > 80) throw new ApiError('Укажите имя или ник: от 1 до 80 символов.');
    const query = redirectUrl && /^https?:\/\//.test(redirectUrl) ? '?redirect_to=' + encodeURIComponent(redirectUrl) : '';
    await this.request('/auth/v1/signup' + query, {method:'POST', authorized:false, body:{email,password,data:{display_name:name}}});
    // Always use the explicit login flow, including when confirmations are disabled.
  }
  rpc(name, body = {}, authorized = true) {
    if (!['member_me','owner_members','owner_update_member','manage_mvp_ballot','cast_mvp_vote','mvp_ballot','mvp_match_list','member_points'].includes(name)) throw new ApiError('Неизвестная операция.');
    return this.request('/rest/v1/rpc/' + name, {method:'POST',body,authorized});
  }
  async signOut() {
    try {
      if (this.token && this.expiresAt > Date.now()) await this.request('/auth/v1/logout?scope=local', {method: 'POST'});
    } catch { /* Local credentials must be cleared even if the server is unreachable. */ }
    finally { this.clearSession(); }
  }
  async list(table) {
    const sorts = {players: 'display_order.asc,id.asc', news: 'display_order.asc,id.asc', matches: 'day.asc,id.asc', seasons: 'id.asc', league_settings: 'singleton.asc'};
    if (!sorts[table]) throw new ApiError('Неизвестный раздел.');
    return this.request(`/rest/v1/${table}?select=*&order=${sorts[table]}`);
  }
  async update(table, original, values) {
    if (!['players', 'news'].includes(table)) throw new ApiError('Редактирование раздела пока не подключено.');
    // Compare all editable fields in the same PATCH: don't silently overwrite another editor.
    const query = new URLSearchParams({id: `eq.${original.id}`, select: '*'});
    for (const key of Object.keys(values)) {
      const value = original[key];
      if (value === null) query.set(key, 'is.null');
      else {
        const raw = typeof value === 'object' ? JSON.stringify(value) : String(value);
        // A standalone eq filter takes the raw value, not a quoted list item.
        // URLSearchParams handles URL escaping (including &, + and newlines).
        query.set(key, `eq.${raw}`);
      }
    }
    const result = await this.request(`/rest/v1/${table}?${query}`, {
      method: 'PATCH', body: values, headers: {Prefer: 'return=representation'},
    });
    if (!Array.isArray(result) || result.length !== 1) {
      throw new ApiError('Запись изменилась в другой вкладке или доступ отозван. Скопируйте свой текст и откройте запись заново.', 409);
    }
    return result[0];
  }
}

export function avatarUrl(value, base) {
  if (/^assets\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return new URL('../' + value, base).href;
  try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch {}
  return null;
}

export function playerValues(form, base) {
  const nickname = String(form.nickname || '').trim();
  const avatar = String(form.avatar || '').trim();
  const quote = String(form.quote || '').trim();
  const display_order = Number(form.display_order);
  if (!nickname || nickname.length > 80) throw new ApiError('Ник должен содержать от 1 до 80 символов.');
  if (!avatarUrl(avatar, base)) throw new ApiError('Фото: укажите путь assets/имя.jpg или полный HTTPS-адрес.');
  if (!Number.isInteger(display_order) || display_order < 0) throw new ApiError('Порядок должен быть целым числом от 0.');
  return {nickname, avatar, quote, display_order};
}
export function newsValues(form) {
  const title = String(form.title || '').trim();
  const paragraphs = String(form.paragraphs || '').trim().split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const display_order = Number(form.display_order);
  if (!title || !paragraphs.length) throw new ApiError('Заполните заголовок и текст новости.');
  if (!Number.isInteger(display_order) || display_order < 0) throw new ApiError('Порядок должен быть целым числом от 0.');
  if (!['draft', 'published'].includes(form.publication_status)) throw new ApiError('Выберите статус новости.');
  return {
    title, paragraphs, display_order, label: String(form.label || '').trim(),
    short_title: String(form.short_title || '').trim() || null,
    excerpt: String(form.excerpt || '').trim() || null,
    quote_player_id: form.quote_player_id || null, publication_status: form.publication_status,
  };
}
