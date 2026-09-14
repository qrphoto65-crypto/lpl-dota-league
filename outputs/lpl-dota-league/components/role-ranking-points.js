(() => {
 const bonuses = [625, 525, 425, 325, 275];
 const format = value => new Intl.NumberFormat('ru-RU').format(value);
 document.querySelectorAll('.role-statistics tbody').forEach(body => {
  function update() {
   [...body.rows].forEach((row, index) => {
    const cell = row.cells[row.cells.length - 1];
    // Base points travel with the player row; the bonus is recalculated by position.
    if (!row.hasAttribute('data-player-points')) {
     row.dataset.playerPoints = String(Number(cell.textContent.replace(/\s/g, '').split('+')[0]) || 0);
    }
    const points = Number(row.dataset.playerPoints) || 0;
    const bonus = row.dataset.roleEligible === "false" ? 0 : (bonuses[index] || 0);
    cell.replaceChildren();
    const base = document.createElement('span');
    base.className = 'ranking-base'; base.textContent = format(points); cell.append(base);
    if (bonus) {
     const extra = document.createElement('span');
     extra.className = 'ranking-bonus'; extra.textContent = ' + ' + format(bonus); cell.append(extra);
    }
    cell.setAttribute('aria-label', format(points) + ' очков игрока' + (bonus ? ' плюс ' + format(bonus) + ' возможных очков за место' : ''));
    const rank = row.querySelector('.role-rank');
    if (rank) { rank.textContent = String(index + 1).padStart(2, '0'); rank.className = 'role-rank rank-tone-' + (index + 1); }
   });
  }
  update();
  new MutationObserver(update).observe(body, {childList:true});
  new MutationObserver(update).observe(body, {attributes:true, subtree:true, attributeFilter:['data-player-points']});
 });
})();