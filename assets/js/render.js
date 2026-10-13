/**
 * GameDay+ - Safe HTML renderers
 *
 * All functions are pure (string in -> string out) so they can be unit-tested
 * under jsdom/Node. Every value derived from Firestore, Google Sheets, or the
 * `?school=` query parameter is escaped before it reaches innerHTML.
 *
 * Loaded after utils.js and before app.js/calendar.js/map.js/stats.js.
 */

const GameDayRender = (function () {
  const U = (typeof window !== 'undefined' && window.GameDayUtils) ? window.GameDayUtils
    : (typeof require === 'function' ? require('./utils.js') : {});
  const escapeHtml = U.escapeHtml;
  const escapeAttr = U.escapeAttr;

  const SAFE_ICON = /^fa-[a-z0-9-]+$/;
  function safeIcon(iconClass, fallback) {
    const value = String(iconClass || '');
    return SAFE_ICON.test(value) ? value : (fallback || 'fa-trophy');
  }

  // Only allow the theme colour tokens / hex colours we control to reach the
  // style attribute, so an injected "colour" cannot break out of the attribute.
  const SAFE_COLOR = /^(var\(--[a-z0-9-]+\)|#[0-9a-fA-F]{3,8}|[a-z]+)$/;
  function safeColor(color, fallback) {
    const value = String(color || '');
    return SAFE_COLOR.test(value) ? value : (fallback || 'var(--sport-clubs)');
  }

  function schoolListItem(school) {
    return `
        <li>
          <button type="button" data-school-id="${escapeAttr(school.id)}">
            <span>
              <span class="school-name">${escapeHtml(school.name)}</span>
              <span class="school-mascot">${escapeHtml(school.mascot)}</span>
            </span>
          </button>
        </li>
      `;
  }

  function heroMatchup(d) {
    const isHome = d.isHome;
    const sportIcon = safeIcon(d.sportIcon);
    return `
      <div class="hero-game-kicker"><span class="hero-sport-icon"><i class="fa-solid ${sportIcon}"></i></span> ${escapeHtml(d.teamLabel)}</div>
      <div class="hero-teams" aria-label="${escapeAttr(d.schoolName + ' versus ' + d.opponentLabel)}">
        <div class="hero-team"><div class="team-crest crest-school">${escapeHtml(d.schoolInitials)}</div><strong>${escapeHtml(d.schoolName)}</strong><small>${isHome ? 'Home' : 'Away'}</small></div>
        <span class="hero-vs">VS</span>
        <div class="hero-team"><div class="team-crest crest-opponent">${escapeHtml(d.opponentInitials)}</div><strong>${escapeHtml(d.opponentLabel)}</strong><small>${isHome ? 'Visitor' : 'Host'}</small></div>
      </div>
      <div class="hero-details">
        <span><i class="fa-regular fa-calendar"></i><b>${escapeHtml(d.friendlyDate)}</b><small>${escapeHtml(d.time)}</small></span>
        <span><i class="fa-solid fa-location-dot"></i><b>${escapeHtml(d.venueName)}</b><small>${escapeHtml(d.locationType)} venue</small></span>
      </div>
    `;
  }

  function heroActions(d) {
    return `
      <button class="btn-hero-action btn-hero-primary" data-hero-game-id="${escapeAttr(d.id)}">
        <i class="fa-solid fa-eye"></i> View Game
      </button>
      <button class="btn-hero-action btn-hero-secondary" data-hero-venue="${escapeAttr(d.venueName)}">
        <i class="fa-solid fa-location-arrow"></i> Directions
      </button>
    `;
  }

  function eventCard(d) {
    const isHome = d.isHome;
    const sportColor = safeColor(d.sportColor);
    const sportIcon = safeIcon(d.sportIcon);
    const resultLabel = d.hasScores
      ? `${escapeHtml(d.ourScore)}&ndash;${escapeHtml(d.oppScore)}`
      : escapeHtml(d.time);
    const resultContext = d.hasScores ? (d.isWin ? 'Win' : 'Final') : escapeHtml(d.status);
    const statusClass = escapeAttr(String(d.status || '').toLowerCase().replace(/[^a-z0-9-]/g, ''));
    return `
        <article class="event-card event-card--agenda" tabindex="0" role="button" aria-label="View details for ${escapeAttr(d.eventTitle)} versus ${escapeAttr(d.opponent)}" data-game-id="${escapeAttr(d.id)}">
          <div class="event-sport-mark" style="--event-color: ${sportColor};"><i class="fa-solid ${sportIcon}" aria-hidden="true"></i></div>
          <div class="event-card-content">
            <p class="event-date-label">${escapeHtml(d.relativeDate)}</p>
            <h3 class="event-title">${escapeHtml(d.eventTitle)}</h3>
            <p class="event-opponent">${escapeHtml(d.schoolName)} <span>vs.</span> ${escapeHtml(d.opponent)}</p>
            <p class="event-location"><i class="fa-solid ${isHome ? 'fa-house' : 'fa-location-dot'}" aria-hidden="true"></i>${escapeHtml(d.locationType)} &middot; ${escapeHtml(d.venueName)}</p>
          </div>
          <div class="event-card-side">
            <strong class="event-time ${d.isWin ? 'event-result-win' : ''}">${resultLabel}</strong>
            <span class="event-status-badge status-${statusClass}">${resultContext}</span>
            <i class="fa-solid fa-chevron-right event-card-chevron" aria-hidden="true"></i>
          </div>
        </article>
      `;
  }

  function gameModal(d) {
    const hasScores = d.hasScores;
    const encodedAddr = encodeURIComponent(`${d.venueName}, ${d.venueAddress || ''}`);
    return `
      <section class="game-detail">
        <div class="game-detail-topline">
          <span class="event-sport-tag"><i class="fa-solid ${safeIcon(d.sportIcon)}"></i>${escapeHtml(d.sport)}</span>
          <span class="event-status-badge status-${escapeAttr(String(d.status || '').toLowerCase().replace(/[^a-z0-9-]/g, ''))}">${escapeHtml(d.status)}</span>
        </div>
        <p class="game-detail-kicker">${escapeHtml(d.teamLabel)}</p>
        <h2>${escapeHtml(d.schoolName)} <span>vs.</span> ${escapeHtml(d.opponent)}</h2>

        ${hasScores ? `
          <div class="game-detail-score">
            <span>Final score</span>
            <strong>${escapeHtml(d.ourScore)} <em>&ndash;</em> ${escapeHtml(d.oppScore)}</strong>
          </div>
        ` : ''}

        <div class="game-detail-facts">
          <div class="game-detail-fact">
            <i class="fa-regular fa-calendar"></i>
            <span>Date & time</span>
            <strong>${escapeHtml(d.friendlyDate)}<small>${escapeHtml(d.time)}</small></strong>
          </div>
          <div class="game-detail-fact">
            <i class="fa-solid fa-location-dot"></i>
            <span>${escapeHtml(d.locationType)} venue</span>
            <strong>${escapeHtml(d.venueName)}<small>${escapeHtml(d.venueAddress || 'Address not listed')}</small></strong>
          </div>
        </div>

        <div class="game-detail-notes">
          <p><i class="fa-solid fa-square-parking"></i><span><strong>Parking & arrival</strong>${escapeHtml(d.parkingInfo || 'Venue details will be posted before the event.')}</span></p>
          <p><i class="fa-solid fa-bullhorn"></i><span><strong>Event notes</strong>${escapeHtml(d.highlights || 'Join the student section and wear school colors!')}</span></p>
        </div>

        <div class="directions-links-row game-detail-actions">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddr}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-google"></i> Google Maps
        </a>
        <a href="https://maps.apple.com/?daddr=${encodedAddr}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-apple"></i> Apple Maps
        </a>
        <button class="btn-primary" data-modal-venue="${escapeAttr(d.venueName)}">
          <i class="fa-solid fa-map-location-dot"></i> View on App Map
        </button>
        </div>
      </section>
    `;
  }

  function calendarChip(d) {
    const color = safeColor(d.color);
    const label = `${d.sport} vs ${d.opponent} at ${d.time}`;
    return `
        <div class="cal-chip" style="background-color: ${color};" title="${escapeAttr(label)}">
          ${d.isHome ? '🏠' : '🚌'} ${escapeHtml(d.time || 'TBD')}
        </div>
      `;
  }

  function weekEventCard(d) {
    const color = safeColor(d.color);
    return `
          <div class="cal-week-event-card" style="border-left-color: ${color};">
            <div>
              <strong>${escapeHtml(d.sport)}</strong> vs ${escapeHtml(d.opponent)}
              <span style="color: var(--text-muted); margin-left: 4px;">(${d.isHome ? '🏠 Home' : '🚌 Away'})</span>
            </div>
            <div style="font-weight: 700; color: ${color};">
              ${escapeHtml(d.time || 'TBD')}
            </div>
          </div>
        `;
  }

  function selectedEvent(d) {
    const sportColor = safeColor(d.sportColor);
    const isFinal = d.status === 'Final';
    return `
        <div class="selected-event-item">
          <div style="display: flex; gap: var(--space-md); align-items: flex-start; margin-bottom: var(--space-md);">
            <div style="background: ${sportColor}18; color: ${sportColor}; padding: var(--space-md); border-radius: var(--radius-md); flex-shrink: 0; text-align: center; min-width: 54px; border: 1px solid ${sportColor}40;">
              <div style="font-size: 1.15rem; font-weight: 800;">${escapeHtml((d.sport || '').substring(0, 3).toUpperCase())}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 800; font-size: var(--text-lg); margin-bottom: var(--space-xs);">
                ${escapeHtml(d.sport)} ${escapeHtml(d.gender || 'Varsity')} ${d.level ? '(' + escapeHtml(d.level) + ')' : ''}
              </div>
              <div class="event-time-badge">
                <i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${escapeHtml(d.timeStr)}
              </div>
            </div>
            <span class="event-status-badge status-${escapeAttr(String(d.status || 'upcoming').toLowerCase().replace(/[^a-z0-9-]/g, ''))}">${escapeHtml(d.status || 'Scheduled')}</span>
          </div>

          <div class="matchup-row">
            <div class="team-box">
              <span class="team-name">${escapeHtml(d.currentSchoolName)} High</span>
              <span class="team-type">${d.isHome ? 'Host' : 'Visitor'}</span>
            </div>
            <div style="font-weight: 800; font-size: var(--text-lg); color: var(--text-muted); text-align: center; padding: 0 4px;">
              ${isFinal ? '<span style="color:var(--text-main); font-size: 1.2rem;">' + escapeHtml(d.ourScore) + ' - ' + escapeHtml(d.oppScore) + '</span>' : 'VS'}
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="font-weight: 700; font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase;">${d.isHome ? 'Visitor' : 'Opponent'}</div>
              <div style="font-weight: 800; font-size: var(--text-lg); color: var(--text-main);">${escapeHtml(d.opponentStr)}</div>
            </div>
          </div>

          <div style="margin-bottom: var(--space-lg);">
            <div style="font-size: var(--text-xs); font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-xs);">
              <i class="fa-solid fa-map-pin"></i> Venue & Location
            </div>
            <div style="font-weight: 700; color: var(--text-main);">${escapeHtml(d.venueName)}</div>
            <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
              ${escapeHtml(d.venueAddress || '')} &bull; ${d.isHome ? '🏠 Home Game' : '🚌 Away Game'}
            </div>
          </div>

          ${d.highlights ? `
            <div style="font-size: var(--text-xs); color: var(--text-muted); background: var(--bg-card); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-sm); margin-bottom: var(--space-lg); border-left: 3px solid var(--primary);">
              <i class="fa-solid fa-circle-info" style="color: var(--primary); margin-right: 4px;"></i> ${escapeHtml(d.highlights)}
            </div>
          ` : ''}

          <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
            <button class="btn-primary" data-cal-venue="${escapeAttr(d.venueName)}">
              <i class="fa-solid fa-location-arrow"></i> Directions
            </button>
            <a href="${escapeAttr(d.gcalLink)}" target="_blank" rel="noopener" class="btn-secondary" style="text-decoration: none;">
              <i class="fa-solid fa-calendar-plus"></i> Google Cal
            </a>
            <button class="btn-ics-export" data-cal-ics="${escapeAttr(d.id)}" title="Download iCalendar file (.ics)">
              <i class="fa-solid fa-download"></i> .ics (iCal)
            </button>
          </div>
        </div>
      `;
  }

  function venueListItem(d) {
    return `
        <div class="venue-item-card" data-venue-id="${escapeAttr(d.id)}">
          <h4>${escapeHtml(d.name)}</h4>
          <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(d.address)}</p>
          <span class="venue-tag ${d.isHome ? 'badge-home' : 'badge-away'}">
            ${d.isHome ? '🏠 HOME' : '🚌 AWAY'} &bull; ${escapeHtml(d.distanceLabel)}
          </span>
        </div>
      `;
  }

  function venueOption(d) {
    return `<option value="${escapeAttr(d.id)}">${d.isHome ? '🏠' : '🚌'} ${escapeHtml(d.name)}</option>`;
  }

  function venueDetail(venue) {
    const encodedAddr = encodeURIComponent(`${venue.name}, ${venue.address}`);
    const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddr}`;
    const appleMapsUrl = `https://maps.apple.com/?daddr=${encodedAddr}`;
    const wazeUrl = `https://waze.com/ul?q=${encodedAddr}&navigate=yes`;

    const upcomingMatch = venue.games && venue.games[0];
    const matchInfo = upcomingMatch
      ? `<strong>Next Event:</strong> ${escapeHtml(upcomingMatch.sport)} vs ${escapeHtml(upcomingMatch.opponent)} (${escapeHtml(upcomingMatch.date)} @ ${escapeHtml(upcomingMatch.time)})`
      : '';

    return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
        <div>
          <h3 style="font-size: 1.25rem; font-weight: 800;">${escapeHtml(venue.name)}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);"><i class="fa-solid fa-location-pin"></i> ${escapeHtml(venue.address)}</p>
        </div>
        <span class="location-badge ${venue.isHome ? 'badge-home' : 'badge-away'}">
          ${venue.isHome ? 'Home Venue' : 'Away Venue'}
        </span>
      </div>

      <div style="font-size: 0.82rem; margin: 0.5rem 0; color: var(--text-main); background: var(--bg-input); padding: 0.6rem; border-radius: var(--radius-sm);">
        <p><i class="fa-solid fa-square-parking" style="color: var(--primary);"></i> <strong>Parking & Entry:</strong> ${escapeHtml(venue.parking)}</p>
        ${matchInfo ? `<p style="margin-top: 0.35rem;"><i class="fa-solid fa-trophy" style="color: var(--primary);"></i> ${matchInfo}</p>` : ''}
      </div>

      <div class="directions-links-row">
        <a href="${gmapsUrl}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-google"></i> Google Maps
        </a>
        <a href="${appleMapsUrl}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-apple"></i> Apple Maps
        </a>
        <a href="${wazeUrl}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-waze"></i> Waze Navigation
        </a>
      </div>
    `;
  }

  function boxScoreCard(game, stats, currentSchoolName) {
    const isWinner = Number(game.ourScore) > Number(game.oppScore);
    const isLive = game.status === 'Live';

    const periodHeaders = stats.periods ? stats.periods.map(p => `<th>${escapeHtml(p.name)}</th>`).join('') : '<th>Final</th>';
    const usPeriodScores = stats.periods ? stats.periods.map(p => `<td>${escapeHtml(p.us)}</td>`).join('') : `<td>${escapeHtml(game.ourScore ?? '-')}</td>`;
    const themPeriodScores = stats.periods ? stats.periods.map(p => `<td>${escapeHtml(p.them)}</td>`).join('') : `<td>${escapeHtml(game.oppScore ?? '-')}</td>`;

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
              <span>${escapeHtml(formatStatLabel(label))}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>
          `).join('')}
        </div>
      ` : '';

    return `
        <div class="box-score-card">
          <div class="box-score-header">
            <span class="box-score-date">
              <i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${escapeHtml(game.date)} &bull; ${escapeHtml(game.sport)}
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
                <td class="team-name-col">${escapeHtml(currentSchoolName)} High</td>
                ${usPeriodScores}
                <td class="final-score-col">${escapeHtml(game.ourScore ?? '-')}</td>
              </tr>
              <tr>
                <td class="team-name-col">${escapeHtml(game.opponent)}</td>
                ${themPeriodScores}
                <td class="final-score-col" style="color: var(--text-muted);">${escapeHtml(game.oppScore ?? '-')}</td>
              </tr>
            </tbody>
          </table>

          <div class="player-highlight-box">
            <div class="player-avatar">${escapeHtml(playerPotg.avatar || 'SS')}</div>
            <div class="player-info">
              <h5><i class="fa-solid fa-star" style="color: var(--primary);"></i> Player of the Game: ${escapeHtml(playerPotg.name)}</h5>
              <p>${escapeHtml(playerPotg.stat)}</p>
            </div>
          </div>

          ${teamStatsHtml}

          ${game.highlights ? `
            <div style="font-size: 0.8rem; color: var(--text-muted); border-top: 1px solid var(--border-subtle); padding-top: 0.5rem;">
              <i class="fa-solid fa-quote-left" style="color: var(--primary);"></i> ${escapeHtml(game.highlights)}
            </div>
          ` : ''}
        </div>
      `;
  }

  function sportPill(d) {
    return `<i class="fa-solid ${safeIcon(d.icon)}"></i><span>${escapeHtml(d.sport)}</span>`;
  }

  function toast(icon, message) {
    return `<i class="fa-solid ${safeIcon(icon)}"></i> <span>${escapeHtml(message)}</span>`;
  }

  function formatStatLabel(label) {
    return String(label || '').replace(/([A-Z])/g, ' $1').replace(/^./, character => character.toUpperCase());
  }

  return {
    safeIcon,
    safeColor,
    schoolListItem,
    heroMatchup,
    heroActions,
    eventCard,
    gameModal,
    calendarChip,
    weekEventCard,
    selectedEvent,
    venueListItem,
    venueOption,
    venueDetail,
    boxScoreCard,
    sportPill,
    toast,
    formatStatLabel
  };
})();

if (typeof window !== 'undefined') window.GameDayRender = GameDayRender;
if (typeof module !== 'undefined' && module.exports) module.exports = GameDayRender;
