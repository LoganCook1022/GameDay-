/**
 * GameDay+ - Interactive Sports & Events Calendar Module
 * Month & Week navigation, sport color-coding, event drawers, and .ics / Google Calendar exports
 */

const GameDayCalendar = (function() {
  let currentDate = new Date();
  let selectedDateString = null;
  let allEvents = [];

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function initCalendar() {
    const prevBtn = document.getElementById('calPrevBtn');
    const nextBtn = document.getElementById('calNextBtn');
    const todayBtn = document.getElementById('calTodayBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        selectedDateString = formatDateToISO(currentDate);
        renderCalendar();
        renderSelectedDateEvents();
      });
    }

    // Default select today
    selectedDateString = formatDateToISO(new Date());
  }

  function updateEvents(events) {
    allEvents = events;
    renderCalendar();
    renderSelectedDateEvents();
  }

  function renderCalendar() {
    const label = document.getElementById('calMonthYearLabel');
    const grid = document.getElementById('calendarDaysGrid');
    if (!label || !grid) return;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    label.textContent = `${MONTH_NAMES[month]} ${year}`;

    // First day of current month & total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = formatDateToISO(new Date());

    let html = '';

    // Previous month filler days
    for (let i = firstDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, dayNum);
      const isoStr = formatDateToISO(prevDate);
      html += renderDayCell(dayNum, isoStr, true, false, false);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const thisDate = new Date(year, month, day);
      const isoStr = formatDateToISO(thisDate);
      const isToday = isoStr === todayStr;
      const isSelected = isoStr === selectedDateString;
      html += renderDayCell(day, isoStr, false, isToday, isSelected);
    }

    // Next month filler days to complete grid (42 cells = 6 weeks)
    const totalCells = (firstDay + daysInMonth);
    const remainingCells = (totalCells > 35 ? 42 : 35) - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(year, month + 1, day);
      const isoStr = formatDateToISO(nextDate);
      html += renderDayCell(day, isoStr, true, false, false);
    }

    grid.innerHTML = html;

    // Attach click handlers to all cells
    grid.querySelectorAll('.cal-day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.dataset.date;
        selectedDateString = dateStr;
        
        // Update selection UI
        grid.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');

        renderSelectedDateEvents();
      });
    });
  }

  function renderDayCell(dayNum, isoDate, isOtherMonth, isToday, isSelected) {
    const dayEvents = allEvents.filter(e => e.date === isoDate);
    const classes = [
      'cal-day-cell',
      isOtherMonth ? 'other-month' : '',
      isToday ? 'today' : '',
      isSelected ? 'selected' : ''
    ].filter(Boolean).join(' ');

    const chipsHtml = dayEvents.slice(0, 3).map(evt => {
      const sportLower = evt.sport.toLowerCase();
      const color = getSportColor(sportLower);
      return `
        <div class="cal-chip" style="background-color: ${color};" title="${evt.sport} vs ${evt.opponent} (${evt.time})">
          ${evt.locationType === 'Home' ? '🏠' : '🚌'} ${evt.sport.substring(0, 4)}: ${evt.opponent}
        </div>
      `;
    }).join('');

    const moreCount = dayEvents.length > 3 ? `<span style="font-size:0.65rem; color:var(--text-muted); font-weight:700;">+${dayEvents.length - 3} more</span>` : '';

    return `
      <div class="${classes}" data-date="${isoDate}">
        <div class="cal-day-number">${dayNum}</div>
        <div class="cal-event-chips">
          ${chipsHtml}
          ${moreCount}
        </div>
      </div>
    `;
  }

  function renderSelectedDateEvents() {
    const listEl = document.getElementById('selectedEventsList');
    const titleEl = document.getElementById('selectedDateTitle');
    const countEl = document.getElementById('selectedDateCount');
    if (!listEl || !titleEl) return;

    if (!selectedDateString) return;

    const dateObj = parseISODate(selectedDateString);
    const friendlyDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    titleEl.textContent = `Schedule for ${friendlyDate}`;

    const matchingEvents = allEvents.filter(e => e.date === selectedDateString);
    countEl.textContent = `${matchingEvents.length} event${matchingEvents.length === 1 ? '' : 's'}`;

    if (matchingEvents.length === 0) {
      listEl.innerHTML = `
        <div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--text-muted);">
          <i class="fa-regular fa-calendar-xmark" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
          <p>No games or club events scheduled for this day.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = matchingEvents.map(evt => {
      const sportColor = getSportColor(evt.sport.toLowerCase());
      const gcalLink = generateGoogleCalendarUrl(evt);
      const isHome = evt.locationType === 'Home';

      return `
        <div class="event-card">
          <div class="event-card-header">
            <span class="event-sport-tag" style="background: ${sportColor}22; color: ${sportColor};">
              <i class="fa-solid fa-medal"></i> ${evt.sport} (${evt.gender || 'Varsity'})
            </span>
            <span class="event-status-badge status-${evt.status.toLowerCase()}">${evt.status}</span>
          </div>

          <div class="matchup-row">
            <div class="team-box">
              <span class="team-name">Westfield High</span>
              <span class="team-type">${isHome ? 'Host' : 'Visitor'}</span>
            </div>
            <span class="match-vs">${evt.status === 'Final' ? `${evt.ourScore ?? '-'} : ${evt.oppScore ?? '-'}` : 'VS'}</span>
            <div class="team-box" style="text-align: right;">
              <span class="team-name">${evt.opponent}</span>
              <span class="team-type">${isHome ? 'Visitor' : 'Host'}</span>
            </div>
          </div>

          <div class="match-meta">
            <div class="meta-item">
              <i class="fa-regular fa-clock"></i> <span><strong>${evt.time}</strong></span>
            </div>
            <div class="meta-item">
              <i class="fa-solid fa-map-pin"></i> <span>${evt.venueName}</span>
              <span class="location-badge ${isHome ? 'badge-home' : 'badge-away'}">${isHome ? 'Home' : 'Away'}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-card btn-card-primary" onclick="GameDayMap.openVenueByName('${escapeQuotes(evt.venueName)}')">
              <i class="fa-solid fa-location-arrow"></i> Directions
            </button>
            <a href="${gcalLink}" target="_blank" rel="noopener" class="btn-card btn-card-secondary" title="Add to Google Calendar">
              <i class="fa-solid fa-calendar-plus"></i> Add to Cal
            </a>
          </div>
        </div>
      `;
    }).join('');
  }

  function getSportColor(sport) {
    switch (sport) {
      case 'football': return 'var(--sport-football)';
      case 'basketball': return 'var(--sport-basketball)';
      case 'soccer': return 'var(--sport-soccer)';
      case 'baseball':
      case 'softball': return 'var(--sport-baseball)';
      case 'volleyball': return 'var(--sport-volleyball)';
      case 'track':
      case 'track & field': return 'var(--sport-track)';
      default: return 'var(--sport-clubs)';
    }
  }

  function formatDateToISO(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseISODate(isoStr) {
    const [y, m, d] = isoStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function generateGoogleCalendarUrl(evt) {
    const title = encodeURIComponent(`Westfield vs ${evt.opponent} (${evt.sport})`);
    const details = encodeURIComponent(`${evt.sport} Match - ${evt.highlights || 'High School Athletics'}\nVenue: ${evt.venueName}\nParking: ${evt.parkingInfo || ''}`);
    const location = encodeURIComponent(`${evt.venueName}, ${evt.venueAddress}`);
    
    // Construct approximate ISO timestamps for Google Cal
    const dateFormatted = evt.date.replace(/-/g, '');
    const startTime = `${dateFormatted}T180000Z`;
    const endTime = `${dateFormatted}T203000Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  }

  function escapeQuotes(str) {
    return (str || '').replace(/'/g, "\\'");
  }

  return {
    initCalendar,
    updateEvents
  };
})();

// Export globally
window.GameDayCalendar = GameDayCalendar;
