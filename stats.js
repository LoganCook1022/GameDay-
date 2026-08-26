/**
 * GameDay+ - Game Statistics, Box Scores & Season Standings Module
 */

const GameDayStats = (function() {
  let allEvents = [];
  let currentSport = 'football';

  const SPORT_STANDINGS = {
    football: { record: '6 - 1', conference: '4 - 0', rank: '#2 in District', ppg: '31.4', oppPpg: '14.2', streak: 'W4' },
    basketball: { record: '12 - 3', conference: '7 - 1', rank: '#1 in Conference', ppg: '62.8', oppPpg: '51.0', streak: 'W6' },
    soccer: { record: '8 - 2 - 2', conference: '5 - 1 - 1', rank: '#3 in Region', ppg: '2.8', oppPpg: '1.1', streak: 'W2' },
    baseball: { record: '14 - 4', conference: '9 - 2', rank: '#1 in Division', ppg: '6.5', oppPpg: '3.2', streak: 'W3' },
    volleyball: { record: '11 - 5', conference: '6 - 2', rank: '#2 in League', ppg: '3.1 Sets', oppPpg: '1.2 Sets', streak: 'W1' }
  };

  function initStats() {
    const bar = document.getElementById('statsSportBar');
    if (!bar) return;

    bar.querySelectorAll('.stats-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.stats-nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSport = btn.dataset.statSport;
        renderStats();
      });
    });
  }

  function updateEvents(events) {
    allEvents = events;
    renderStats();
  }

  function renderStats() {
    renderStandingsSummary();
    renderBoxScores();
  }

  function renderStandingsSummary() {
    const container = document.getElementById('statsSummaryGrid');
    if (!container) return;

    const defaultData = SPORT_STANDINGS[currentSport] || {
      record: '5 - 2', conference: '3 - 1', rank: 'Top 5', ppg: '-', oppPpg: '-', streak: 'W2'
    };
    const completedGames = allEvents.filter(event =>
      event.sport.toLowerCase().includes(currentSport) &&
      event.ourScore !== null && event.oppScore !== null
    );
    const wins = completedGames.filter(event => event.ourScore > event.oppScore).length;
    const losses = completedGames.filter(event => event.ourScore < event.oppScore).length;
    const data = completedGames.length > 0
      ? { ...defaultData, record: `${wins} - ${losses}` }
      : defaultData;

    container.innerHTML = `
      <div class="stat-metric-card">
        <div class="stat-label">Season Record</div>
        <div class="stat-val">${data.record}</div>
      </div>
      <div class="stat-metric-card">
        <div class="stat-label">Conference Standing</div>
        <div class="stat-val">${data.rank}</div>
      </div>
      <div class="stat-metric-card">
        <div class="stat-label">Avg Scoring / Game</div>
        <div class="stat-val">${data.ppg}</div>
      </div>
      <div class="stat-metric-card">
        <div class="stat-label">Current Streak</div>
        <div class="stat-val" style="color: #10b981;">${data.streak}</div>
      </div>
    `;
  }

  function renderBoxScores() {
    const grid = document.getElementById('boxScoresGrid');
    if (!grid) return;

    // Filter past games or games with scores for current sport
    const sportGames = allEvents.filter(e => 
      e.sport.toLowerCase().includes(currentSport) && (e.ourScore !== null || e.status === 'Final' || e.status === 'Live')
    );

    if (sportGames.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; padding: 2.5rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: var(--card-border);">
          <i class="fa-solid fa-chart-simple" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; color: var(--primary);"></i>
          <h4 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.25rem;">No Completed Box Scores Yet</h4>
          <p style="font-size: 0.85rem;">Upcoming games will automatically post detailed period scores and player stats here once finished.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = sportGames.map(game => {
      const stats = game.stats || generateFallbackStats(game);
      const isWinner = game.ourScore > game.oppScore;

      // Period scoring header and rows
      const periodHeaders = stats.periods ? stats.periods.map(p => `<th>${p.name}</th>`).join('') : '<th>Final</th>';
      const usPeriodScores = stats.periods ? stats.periods.map(p => `<td>${p.us}</td>`).join('') : `<td>${game.ourScore ?? '-'}</td>`;
      const themPeriodScores = stats.periods ? stats.periods.map(p => `<td>${p.them}</td>`).join('') : `<td>${game.oppScore ?? '-'}</td>`;

      const playerPotg = stats.playerOfTheGame || {
        name: 'Diggers Squad',
        stat: 'Balanced scoring & lockdown defense',
        avatar: 'SS'
      };
      const teamStats = stats.teamStats ? Object.entries(stats.teamStats) : [];
      const teamStatsHtml = teamStats.length > 0 ? `
        <div class="team-stats-row">
          ${teamStats.map(([label, value]) => `
            <div class="team-stat">
              <span>${formatStatLabel(label)}</span>
              <strong>${value}</strong>
            </div>
          `).join('')}
        </div>
      ` : '';

      return `
        <div class="box-score-card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <span class="event-sport-tag" style="background: rgba(var(--primary-rgb),0.15); color: var(--primary);">
                ${game.sport} &bull; ${game.date}
              </span>
            </div>
            <span class="event-status-badge ${game.status === 'Live' ? 'status-live' : 'status-final'}">
              ${game.status === 'Live' ? 'LIVE IN PROGRESS' : (isWinner ? '🏆 WIN' : 'FINAL')}
            </span>
          </div>

          <table class="table-periods">
            <thead>
              <tr>
                <th style="text-align:left;">Team</th>
                ${periodHeaders}
                <th>T</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="team-name-col">Sugar-Salem High</td>
                ${usPeriodScores}
                <td class="final-score-col">${game.ourScore ?? '-'}</td>
              </tr>
              <tr>
                <td class="team-name-col">${game.opponent}</td>
                ${themPeriodScores}
                <td class="final-score-col" style="color: var(--text-muted);">${game.oppScore ?? '-'}</td>
              </tr>
            </tbody>
          </table>

          <div class="player-highlight-box">
            <div class="player-avatar">${playerPotg.avatar}</div>
            <div class="player-info">
              <h5><i class="fa-solid fa-star" style="color: var(--primary);"></i> Player of the Game: ${playerPotg.name}</h5>
              <p>${playerPotg.stat}</p>
            </div>
          </div>

          ${teamStatsHtml}

          ${game.highlights ? `
            <div style="font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
              <i class="fa-solid fa-quote-left" style="color: var(--primary);"></i> ${game.highlights}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  function generateFallbackStats(game) {
    const ourScore = game.ourScore || 24;
    const oppScore = game.oppScore || 17;
    return {
      periods: [
        { name: '1H', us: Math.floor(ourScore / 2), them: Math.floor(oppScore / 2) },
        { name: '2H', us: Math.ceil(ourScore / 2), them: Math.ceil(oppScore / 2) }
      ],
      playerOfTheGame: {
        name: 'Diggers Squad',
        stat: `${ourScore} - ${oppScore} Final`,
        avatar: 'SS'
      }
    };
  }

  function formatStatLabel(label) {
    return label.replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
  }

  return {
    initStats,
    updateEvents
  };
})();

// Export globally
window.GameDayStats = GameDayStats;
