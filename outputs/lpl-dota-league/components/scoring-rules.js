(() => {
  const dialog = document.createElement('dialog');
  dialog.className = 'rules-dialog';
  dialog.id = 'scoring-rules';
  dialog.setAttribute('aria-labelledby', 'rules-title');
  dialog.innerHTML = `
    <header class="rules-header"><div><div class="mono">LPL DOTA LEAGUE</div><h2 id="rules-title">РЕГЛАМЕНТ НАЧИСЛЕНИЯ ОЧКОВ</h2></div><button type="button" class="outline rules-close" aria-label="Закрыть регламент" autofocus>ЗАКРЫТЬ ×</button></header>
    <div class="rules-content">
      <section><h3>Победы на картах</h3><p>За каждую выигранную карту игрок получает <strong>+150 очков</strong>. За поражение очки не начисляются.</p><p>Результаты серии BO3:</p><ul><li>Победа 2:0 — <strong>300 очков</strong>.</li><li>Победа 2:1 — <strong>300 очков</strong>.</li><li>Поражение 1:2 — <strong>150 очков</strong>.</li><li>Поражение 0:2 — <strong>0 очков</strong>.</li></ul><p>Очки начисляются за выигранные карты. Отдельного бонуса за победу в серии нет.</p></section>
      <section><h3>MVP игрового дня</h3><p>После завершения игрового дня все 10 участников голосуют за одного лучшего игрока. Победитель голосования получает <strong>+225 очков</strong>.</p><ul><li>Голосовать за себя нельзя.</li><li>Второго и третьего места нет.</li><li>За сезон можно получить максимум <strong>5 MVP</strong>.</li></ul></section>
      <section><h3>Сезонные номинации</h3><p>Для участия в номинациях определённой роли игрок должен провести минимум <strong>3 карты на этой роли за сезон</strong>.</p><p>Игрок может участвовать одновременно в core- и support-номинациях, если выполнил минимальное требование по обеим ролям.</p><div class="rules-roles"><div><h4>Core-номинации</h4><ul><li>Лучший средний KDA.</li><li>Лучший средний GPM.</li><li>Лучший средний урон за карту.</li></ul></div><div><h4>Support-номинации</h4><ul><li>Лучший средний KDA.</li><li>Лучший расход ресурсов на поддержку.</li><li>Лучший охотник за вардами.</li></ul></div></div><p>Средние показатели рассчитываются на основе сыгранных карт. Средний KDA = (сумма убийств + сумма ассистов) / сумма смертей. Средний GPM — среднее значение GPM по сыгранным картам. Средний урон определяется как общий нанесённый урон, разделённый на количество сыгранных карт, без нормализации по продолжительности игры.</p></section>
      <section><h3>Расчёт рейтинга игроков по позициям</h3><p>Для определения лучших игроков в сезонных номинациях используются два отдельных рейтинговых показателя: Core-Score для игроков кор-позиции и Support-Score для игроков саппорт-позиции.</p><p>Рейтинг рассчитывается на основании средних статистических показателей игрока за карты, сыгранные на соответствующей позиции. Чем выше итоговое значение рейтинга, тем выше позиция игрока в соответствующей номинации.</p><h4>Core-Score</h4><p>Для игроков кор-позиции используется следующая формула:</p><div class="rules-formula">Core-Score = КДА × 150 + GPM × 1,2 + средний урон × 0,01</div><p>Где:</p><ul><li>КДА — среднее значение KDA за карты, сыгранные на кор-позиции;</li><li>GPM — среднее количество золота в минуту;</li><li>средний урон — средний нанесённый урон за одну карту.</li></ul><h4>Support-Score</h4><p>Для игроков саппорт-позиции используется следующая формула:</p><div class="rules-formula">Support-Score = КДА × 150 + золото на поддержку × 0,8 + уничтоженные варды × 80</div><p>Где:</p><ul><li>КДА — среднее значение KDA за карты, сыгранные на саппорт-позиции;</li><li>золото на поддержку — среднее количество золота, потраченного на утверждённые предметы и ресурсы поддержки за карту;</li><li>уничтоженные варды — среднее количество вражеских вардов, уничтоженных за одну карту.</li></ul><p>Все статистические показатели рассчитываются на основании карт, сыгранных игроком на соответствующей позиции в течение сезона. Для участия в соответствующей номинации игрок должен соответствовать установленному минимальному количеству сыгранных карт на данной позиции.</p></section>
      <section><h3>Очки за места в номинациях</h3><table class="rules-points"><thead><tr><th scope="col">Место</th><th scope="col">Очки</th></tr></thead><tbody><tr><td>1-е</td><td><strong>+650</strong></td></tr><tr><td>2-е</td><td><strong>+525</strong></td></tr><tr><td>3-е</td><td><strong>+425</strong></td></tr><tr><td>4-е</td><td><strong>+325</strong></td></tr><tr><td>5-е</td><td><strong>+275</strong></td></tr><tr><td>6–10-е</td><td>0</td></tr></tbody></table><p>Очки получают игроки, занявшие места с первого по пятое.</p></section>
      <section><h3>Правило уникальности наград</h3><p>Один игрок не может получить две сезонные награды.</p><p>Если игрок одновременно попал в топ-5 двух номинаций, ему засчитывается только лучший результат — тот, который приносит больше очков.</p><p>В другой номинации игрок исключается из итогового топ-5, а остальные участники поднимаются на одну позицию.</p><p class="rules-example">Пример: игрок занял 2-е место в одной номинации и 4-е место в другой. Он получает только <strong>+525 очков</strong> за 2-е место. Во второй номинации он исключается, а игроки ниже него поднимаются на одну позицию.</p></section>
      <section><h3>Формула итогового рейтинга</h3><div class="rules-formula"><b>Итоговые очки =</b><span>победы на картах × <strong>150</strong></span><span>+ количество MVP × <strong>225</strong></span><span>+ очки сезонных номинаций</span></div><p>Система учитывает командные результаты, личное влияние игрока в течение сезона и стабильность индивидуальной статистики.</p></section>
    </div>`;
  document.body.append(dialog);
  let opener;
  let previousOverflow;
  document.querySelectorAll('[data-open-rules]').forEach(button => {
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', dialog.id);
    button.addEventListener('click', () => {
      if (dialog.open) return;
      opener = button;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      dialog.querySelector('.rules-content').scrollTop = 0;
      document.body.style.overflow = 'hidden';
    });
  });
  dialog.querySelector('.rules-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener?.focus();
  });
})();
