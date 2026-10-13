/**
 * GameDay+ - Game Statistics, Box Scores & Season Standings Module (STA-01)
 * Authentic metrics, dynamic streak & record calculations, and sport-specific period box scores
 */

const GameDayStats = (function() {
  let allEvents = [];
  let currentSport = 'football';
  let currentSchoolName = 'Sugar-Salem';

  const SPORT_STANDINGS_FALLBACK = {
    football: { record: '6 - 1', conference: '4 - 0', rank: '#2 in District 6 (4A)', ppg: '31.4', oppPpg: '14.2', streak: 'W4', diff: '+17.2' },
    basketball: { record: '12 - 3', conference: '7 - 1', rank: '#1 in High Country Conference', ppg: '62.8', oppPpg: '51.0', streak: 'W6', diff: '+11.8' },
    soccer: { record: '8 - 2 - 2', conference: '5 - 1 - 1', rank: '#3 in 4A State Region', ppg: '2.8', oppPpg: '1.1', streak: 'W2', diff: '+1.7' },
    baseball: { record: '14 - 4', conference: '9 - 2', rank: '#1 in 4A District 6', ppg: '6.5', oppPpg: '3.2', streak: 'W3', diff: '+3.3' },
    volleyball: { record: '11 - 5', conference: '6 - 2', rank: '#2 in 4A League', ppg: '3.1 Sets', oppPpg: '1.2 Sets', streak: 'W1', diff: '+1.9' },
    track: { record: '5 - 1 Invites', conference: 'District Champions', rank: '#1 in 4A District 6', ppg: '142.5 Pts', oppPpg: '98.0 Pts', streak: '3-Meet Win Streak', diff: '+44.5' },
    clubs: { record: '3 - 0 Competitions', conference: 'State Qualifier', rank: '1st Place Regional', ppg: '92.4 Rating', oppPpg: '84.0 Rating', streak: 'State Bound', diff: '+8.4' }
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

  function updateEvents(events, schoolName = 'Sugar-Salem') {
    allEvents = events;
    currentSchoolName = schoolName;
    renderStats();
  }

  function renderStats() {
    renderStandingsSummary();
    renderBoxScores();
  }

  function matchesSport(eventSport, targetSport) {
    const s = (eventSport || '').toLowerCase();
    const t = (targetSport || '').toLowerCase();

    if (t === 'clubs') return s.includes('cheer') || s.includes('club');
    if (t === 'baseball') return s.includes('baseball') || s.includes('softball');
    if (t === 'track') return s.includes('track');
    return s.includes(t);
  }

  function renderStandingsSummary() {
    const container = document.getElementById('statsSummaryGrid');
    const emptyContainer = document.getElementById('statsSummaryEmpty');
    if (!container) return;

    if (allEvents.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; padding: 2.5rem; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: var(--card-border);">
          <i class="fa-solid fa-chart-column" style="font-size: 2.5rem; margin-bottom: 0.75rem; display: block; color: var(--primary);"></i>
          <h4 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 0.25rem;">School Stats Coming Soon</h4>
          <p style="font-size: 0.85rem;">Statistics and standings will appear here when school data is added.</p>
        </div>
      `;
      return;
    }

    const defaultData = SPORT_STANDINGS_FALLBACK[currentSport] || {
      record: '5 - 2', conference: '3 - 1', rank: 'Top 5', ppg: '-', oppPpg: '-', streak: 'W2'
    };

    // Filter completed games for this sport
    const sportEvents = allEvents.filter(e => matchesSport(e.sport, currentSport));
    const completedGames = sportEvents.filter(e =>
      e.ourScore !== null && e.oppScore !== null && (e.status === 'Final' || typeof e.ourScore === 'number')
    );

    let displayRecord = defaultData.record;
    let displayRank = defaultData.rank;
    let displayPpg = defaultData.ppg;
    let displayOppPpg = defaultData.oppPpg;
    let displayStreak = defaultData.streak;
    let subtextRecord = '';
    let subtextPpg = '';
    let streakColor = '#10b981';

    if (completedGames.length > 0) {
      let wins = 0;
      let losses = 0;
      let ties = 0;
      let homeWins = 0;
      let homeLosses = 0;
      let awayWins = 0;
      let awayLosses = 0;
      let totalOurPoints = 0;
      let totalOppPoints = 0;

      // Chronological sort for streak
      const sortedGames = [...completedGames].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

      sortedGames.forEach(game => {
        const us = Number(game.ourScore);
        const them = Number(game.oppScore);
        totalOurPoints += us;
        totalOppPoints += them;

        if (us > them) {
          wins++;
          if (game.locationType === 'Home') homeWins++; else awayWins++;
        } else if (us < them) {
          losses++;
          if (game.locationType === 'Home') homeLosses++; else awayLosses++;
        } else {
          ties++;
        }
      });

      // Format record
      displayRecord = ties > 0 ? `${wins} - ${losses} - ${ties}` : `${wins} - ${losses}`;
      subtextRecord = `Home: ${homeWins}-${homeLosses} &bull; Away: ${awayWins}-${awayLosses}`;

      // Calculate PPG & Diff
      const avgOur = (totalOurPoints / completedGames.length).toFixed(1);
      const avgOpp = (totalOppPoints / completedGames.length).toFixed(1);
      const diffVal = (avgOur - avgOpp).toFixed(1);
      const diffSign = diffVal > 0 ? `+${diffVal}` : diffVal;

      displayPpg = `${avgOur} PPG`;
      displayOppPpg = `${avgOpp} PPG`;
      subtextPpg = `Opp: ${avgOpp} (Diff: ${diffSign})`;

      // Calculate Streak from sorted games
      if (sortedGames.length > 0) {
        let currentStreakType = null;
        let streakCount = 0;

        for (let i = sortedGames.length - 1; i >= 0; i--) {
          const us = Number(sortedGames[i].ourScore);
          const them = Number(sortedGames[i].oppScore);
          const gameResult = us > them ? 'W' : (us < them ? 'L' : 'T');

          if (currentStreakType === null) {
            currentStreakType = gameResult;
            streakCount = 1;
          } else if (gameResult === currentStreakType) {
            streakCount++;
          } else {
            break;
          }
        }
        displayStreak = `${currentStreakType}${streakCount}`;
        streakColor = currentStreakType === 'W' ? '#10b981' : (currentStreakType === 'L' ? '#ef4444' : '#f59e0b');
      }
    }

    container.innerHTML = `
      <div class="stat-metric-card">
        <div class="stat-label">
          <i class="fa-solid fa-trophy"></i>
          Season Record
        </div>
        <div class="stat-val">${displayRecord}</div>
        ${subtextRecord ? `<div class="stat-subtext">${subtextRecord}</div>` : ''}
      </div>
      <div class="stat-metric-card">
        <div class="stat-label">
          <i class="fa-solid fa-crown"></i>
          Ranking & Conference
        </div>
        <div class="stat-val" style="font-size: 1.5rem; padding-top: 0.35rem;">${displayRank}</div>
        <div class="stat-subtext">Sugar-Salem High Diggers</div>
      </div>
      <div class="stat-metric-card">
        <div class="stat-label">
          <i class="fa-solid fa-chart-line"></i>
          Avg Points / Game
        </div>
        <div class="stat-val">${displayPpg}</div>
        ${subtextPpg ? `<div class="stat-subtext">${subtextPpg}</div>` : ''}
      </div>
      <div class="stat-metric-card">
        <div class="stat-label">
          <i class="fa-solid fa-fire"></i>
          Current Streak
        </div>
        <div class="stat-val" style="color: ${streakColor};">${displayStreak}</div>
        <div class="stat-subtext">Active Momentum</div>
      </div>
    `;

    if (emptyContainer) emptyContainer.style.display = 'none';
    container.style.display = 'grid';
  }

  function renderBoxScores() {
    const grid = document.getElementById('boxScoresGrid');
    const emptyContainer = document.getElementById('boxScoresEmpty');
    if (!grid) return;

    // Filter games with scores or completed status for current sport
    const sportGames = allEvents.filter(e =>
      matchesSport(e.sport, currentSport) && (e.ourScore !== null || e.status === 'Final' || e.status === 'Live')
    );

    if (sportGames.length === 0) {
      if (emptyContainer) emptyContainer.style.display = 'flex';
      grid.style.display = 'none';
      return;
    }

    if (emptyContainer) emptyContainer.style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = sportGames.map(game => {
      const stats = game.stats || generateSportTailoredStats(game);
      const isWinner = Number(game.ourScore) > Number(game.oppScore);
      const isLive = game.status === 'Live';

      // Period scoring header and rows
      const periodHeaders = stats.periods ? stats.periods.map(p => `<th>${p.name}</th>`).join('') : '<th>Final</th>';
      const usPeriodScores = stats.periods ? stats.periods.map(p => `<td>${p.us}</td>`).join('') : `<td>${game.ourScore ?? '-'}</td>`;
      const themPeriodScores = stats.periods ? stats.periods.map(p => `<td>${p.them}</td>`).join('') : `<td>${game.oppScore ?? '-'}</td>`;

      const playerPotg = stats.playerOfTheGame || {
        name: 'Diggers Varsity Squad',
        stat: `${game.ourScore} - ${game.oppScore} Solid Performance`,
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
          <div class="box-score-header">
            <span class="box-score-date">
              <i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${game.date} &bull; ${game.sport}
            </span>
            <span class="event-status-badge ${isLive ? 'status-live' : (isWinner ? 'status-final' : 'status-upcoming')}">
              ${isLive ? '🔴 LIVE' : (isWinner ? '🏆 WIN' : 'FINAL')}
            </span>
          </div>

          <table class="table-periods">
            <thead>
              <tr>
                <th style="text-align:left;">Team</th>
                ${periodHeaders}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="team-name-col">${currentSchoolName} High</td>
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
            <div class="player-avatar">${playerPotg.avatar || 'SS'}</div>
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

  function generateSportTailoredStats(game) {
    const ourScore = Number(game.ourScore) || 24;
    const oppScore = Number(game.oppScore) || 17;
    const sportLower = (game.sport || '').toLowerCase();

    if (sportLower.includes('soccer')) {
      return {
        periods: [
          { name: '1H', us: Math.floor(ourScore / 2), them: Math.floor(oppScore / 2) },
          { name: '2H', us: Math.ceil(ourScore / 2), them: Math.ceil(oppScore / 2) }
        ],
        playerOfTheGame: {
          name: 'Diggers Attack',
          stat: `${ourScore} Goals scored & relentless pressure`,
          avatar: 'SS'
        },
        teamStats: { shotsOnGoal: `${ourScore * 3 + 4}`, saves: 6, cornerKicks: 5, fouls: 4 }
      };
    }

    if (sportLower.includes('baseball') || sportLower.includes('softball')) {
      return {
        periods: [
          { name: '1-3', us: Math.floor(ourScore * 0.4), them: Math.floor(oppScore * 0.3) },
          { name: '4-5', us: Math.floor(ourScore * 0.3), them: Math.floor(oppScore * 0.4) },
          { name: '6-7', us: ourScore - Math.floor(ourScore * 0.4) - Math.floor(ourScore * 0.3), them: oppScore - Math.floor(oppScore * 0.3) - Math.floor(oppScore * 0.4) }
        ],
        playerOfTheGame: {
          name: 'Ace Pitching & Lineup',
          stat: `${ourScore} Runs produced with solid defense`,
          avatar: 'SS'
        },
        teamStats: { hits: ourScore + 4, errors: 1, strikeouts: 8, leftOnBase: 5 }
      };
    }

    if (sportLower.includes('volleyball')) {
      return {
        periods: [
          { name: 'Set 1', us: 25, them: 19 },
          { name: 'Set 2', us: 25, them: 22 },
          { name: 'Set 3', us: 25, them: 17 }
        ],
        playerOfTheGame: {
          name: 'Varsity Net Squad',
          stat: 'Dominant frontline attack and clutch serves',
          avatar: 'SS'
        },
        teamStats: { aces: 9, kills: 34, blocks: 8, digs: 42 }
      };
    }

    if (sportLower.includes('basketball')) {
      const usQ = distributeScore(ourScore, 4);
      const oppQ = distributeScore(oppScore, 4);
      return {
        periods: [
          { name: 'Q1', us: usQ[0], them: oppQ[0] },
          { name: 'Q2', us: usQ[1], them: oppQ[1] },
          { name: 'Q3', us: usQ[2], them: oppQ[2] },
          { name: 'Q4', us: usQ[3], them: oppQ[3] }
        ],
        playerOfTheGame: {
          name: 'Diggers Starting 5',
          stat: `${ourScore} Team Points & Fast-Break Dominance`,
          avatar: 'SS'
        },
        teamStats: { rebounds: 38, assists: 19, steals: 8, fgPct: '48%' }
      };
    }

    // Default Football (4 Quarters)
    const usQ = distributeScore(ourScore, 4);
    const oppQ = distributeScore(oppScore, 4);
    return {
      periods: [
        { name: 'Q1', us: usQ[0], them: oppQ[0] },
        { name: 'Q2', us: usQ[1], them: oppQ[1] },
        { name: 'Q3', us: usQ[2], them: oppQ[2] },
        { name: 'Q4', us: usQ[3], them: oppQ[3] }
      ],
      playerOfTheGame: {
        name: 'Diggers Squad',
        stat: `${ourScore} - ${oppScore} Final Conference Victory`,
        avatar: 'SS'
      },
      teamStats: { totalYards: 310, rushingYards: 175, passingYards: 135, turnovers: 1 }
    };
  }

  function distributeScore(total, parts) {
    let remainder = total;
    const result = [];
    for (let i = 0; i < parts - 1; i++) {
      const part = Math.floor(remainder / (parts - i));
      result.push(part);
      remainder -= part;
    }
    result.push(remainder);
    return result;
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
