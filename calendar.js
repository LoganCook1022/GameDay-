/**
 * GameDay+ - Interactive Sports & Events Calendar Module (CAL-01)
 * Month & Week navigation, sport color-coding, event drawers, and .ics / Google Calendar exports
 */

const GameDayCalendar = (function() {
  let currentDate = new Date();
  let selectedDateString = null;
  let allEvents = [];
  let viewMode = 'month'; // 'month' | 'week'

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  function initCalendar() {
    const prevBtn = document.getElementById('calPrevBtn');
    const nextBtn = document.getElementById('calNextBtn');
    const todayBtn = document.getElementById('calTodayBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (viewMode === 'month') {
          currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
          currentDate.setDate(currentDate.getDate() - 7);
        }
        renderCalendar();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (viewMode === 'month') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setDate(currentDate.getDate() + 7);
        }
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

    // View Mode Switcher: Month / Week
    const monthBtn = document.getElementById('calViewMonthBtn');
    const weekBtn = document.getElementById('calViewWeekBtn');

    if (monthBtn) {
      monthBtn.addEventListener('click', () => {
        viewMode = 'month';
        monthBtn.classList.add('active');
        if (weekBtn) weekBtn.classList.remove('active');
        renderCalendar();
      });
    }

    if (weekBtn) {
      weekBtn.addEventListener('click', () => {
        viewMode = 'week';
        weekBtn.classList.add('active');
        if (monthBtn) monthBtn.classList.remove('active');
        renderCalendar();
      });
    }

    // Export Schedule Dropdown & Actions
    const exportBtn = document.getElementById('exportScheduleBtn');
    const exportMenu = document.getElementById('calExportMenu');
    const exportMonthBtn = document.getElementById('exportMonthIcsBtn');
    const exportSeasonBtn = document.getElementById('exportSeasonIcsBtn');

    if (exportBtn && exportMenu) {
      exportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = exportMenu.style.display === 'flex';
        exportMenu.style.display = isOpen ? 'none' : 'flex';
      });

      document.addEventListener('click', () => {
        exportMenu.style.display = 'none';
      });
    }

    if (exportMonthBtn) {
      exportMonthBtn.addEventListener('click', () => {
        downloadMonthICS();
        if (exportMenu) exportMenu.style.display = 'none';
      });
    }

    if (exportSeasonBtn) {
      exportSeasonBtn.addEventListener('click', () => {
        downloadSeasonICS();
        if (exportMenu) exportMenu.style.display = 'none';
      });
    }

    // Legend Toggle
    const legendBtn = document.getElementById('legendToggleBtn');
    const legendEl = document.getElementById('calLegend');
    if (legendBtn && legendEl) {
      legendBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = legendEl.style.display !== 'none';
        legendEl.style.display = isVisible ? 'none' : 'flex';
        legendBtn.classList.toggle('active', !isVisible);
      });
    }

    // Default select today
    selectedDateString = formatDateToISO(new Date());
  }

  function updateEvents(events) {
    allEvents = events || [];
    renderCalendar();
    renderSelectedDateEvents();
  }

  function renderCalendar() {
    if (viewMode === 'week') {
      renderWeekView();
    } else {
      renderMonthView();
    }
  }

  // --- Month View Rendering ---
  function renderMonthView() {
    const label = document.getElementById('calMonthYearLabel');
    const grid = document.getElementById('calendarDaysGrid');
    const weekdays = document.querySelector('.calendar-weekdays');
    if (!label || !grid) return;

    if (weekdays) weekdays.style.display = 'grid';
    grid.className = 'calendar-grid';

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

    // Next month filler days to complete grid (35 or 42 cells)
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
    const hasEvents = dayEvents.length > 0;

    const classes = [
      'cal-day-cell',
      isOtherMonth ? 'other-month' : '',
      isToday ? 'today' : '',
      isSelected ? 'selected' : '',
      hasEvents ? 'has-events' : ''
    ].filter(Boolean).join(' ');

    const maxChips = 2;
    const visibleEvents = dayEvents.slice(0, maxChips);
    const overflowCount = dayEvents.length - maxChips;

    const chipsHtml = visibleEvents.map(evt => {
      const sportLower = (evt.sport || '').toLowerCase();
      const color = getSportColor(sportLower);
      return `
        <div class="cal-chip" style="background-color: ${color};" title="${evt.sport} vs ${evt.opponent} at ${evt.time}">
          ${evt.locationType === 'Home' ? '🏠' : '🚌'} ${evt.time || 'TBD'}
        </div>
      `;
    }).join('');

    const moreHtml = overflowCount > 0 ? `
      <div class="cal-chip-more" title="${overflowCount} more events scheduled">
        +${overflowCount} more
      </div>
    ` : '';

    return `
      <div class="${classes}" data-date="${isoDate}">
        <div class="cal-day-number">${dayNum}</div>
        <div class="cal-event-chips">
          ${chipsHtml}
          ${moreHtml}
        </div>
      </div>
    `;
  }

  // --- Week View Rendering ---
  function renderWeekView() {
    const label = document.getElementById('calMonthYearLabel');
    const grid = document.getElementById('calendarDaysGrid');
    const weekdays = document.querySelector('.calendar-weekdays');
    if (!label || !grid) return;

    if (weekdays) weekdays.style.display = 'none';
    grid.className = 'cal-week-grid';

    // Calculate start of current week (Sunday)
    const currentCopy = new Date(currentDate);
    const dayOfWeek = currentCopy.getDay();
    const startOfWeek = new Date(currentCopy);
    startOfWeek.setDate(currentCopy.getDate() - dayOfWeek);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startMonth = MONTH_NAMES[startOfWeek.getMonth()].substring(0, 3);
    const endMonth = MONTH_NAMES[endOfWeek.getMonth()].substring(0, 3);
    const yearLabel = startOfWeek.getFullYear() === endOfWeek.getFullYear() 
      ? startOfWeek.getFullYear() 
      : `${startOfWeek.getFullYear()}/${endOfWeek.getFullYear()}`;

    label.textContent = `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${yearLabel}`;

    const todayStr = formatDateToISO(new Date());
    let html = '';

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const isoStr = formatDateToISO(dayDate);
      const isToday = isoStr === todayStr;
      const isSelected = isoStr === selectedDateString;
      const dayEvents = allEvents.filter(e => e.date === isoStr);

      const eventsHtml = dayEvents.length > 0 ? dayEvents.map(evt => {
        const sportColor = getSportColor(evt.sport.toLowerCase());
        const isHome = evt.locationType === 'Home';
        return `
          <div class="cal-week-event-card" style="border-left-color: ${sportColor};">
            <div>
              <strong>${evt.sport}</strong> vs ${evt.opponent}
              <span style="color: var(--text-muted); margin-left: 4px;">(${isHome ? '🏠 Home' : '🚌 Away'})</span>
            </div>
            <div style="font-weight: 700; color: ${sportColor};">
              ${evt.time || 'TBD'}
            </div>
          </div>
        `;
      }).join('') : `<div class="cal-week-empty-day">No games scheduled</div>`;

      html += `
        <div class="cal-week-day-card ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}" data-date="${isoStr}">
          <div class="cal-week-day-head">
            <span class="cal-week-day-name">${DAY_NAMES[dayDate.getDay()]}</span>
            <span class="cal-week-day-date">${MONTH_NAMES[dayDate.getMonth()].substring(0, 3)} ${dayDate.getDate()}</span>
          </div>
          <div class="cal-week-events-list">
            ${eventsHtml}
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;

    // Attach click handlers to week day cards
    grid.querySelectorAll('.cal-week-day-card').forEach(card => {
      card.addEventListener('click', () => {
        const dateStr = card.dataset.date;
        selectedDateString = dateStr;
        grid.querySelectorAll('.cal-week-day-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        renderSelectedDateEvents();
      });
    });
  }

  // --- Selected Date Detail Drawer ---
  function renderSelectedDateEvents() {
    const listEl = document.getElementById('selectedEventsList');
    const titleEl = document.getElementById('selectedDateTitle');
    const countEl = document.getElementById('selectedDateCount');
    if (!listEl || !titleEl) return;

    if (!selectedDateString) return;

    const dateObj = parseISODate(selectedDateString);
    const friendlyDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    titleEl.textContent = `Games on ${friendlyDate}`;

    const matchingEvents = allEvents.filter(e => e.date === selectedDateString);
    countEl.textContent = `${matchingEvents.length} event${matchingEvents.length === 1 ? '' : 's'}`;

    if (matchingEvents.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state-container">
          <div class="empty-state-icon"><i class="fa-regular fa-calendar-xmark"></i></div>
          <p>No games scheduled for this day.</p>
        </div>
      `;
      return;
    }

    // Sort events chronologically
    const sortedEvents = matchingEvents.sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });

    listEl.innerHTML = sortedEvents.map(evt => {
      const sportColor = getSportColor(evt.sport.toLowerCase());
      const gcalLink = generateGoogleCalendarUrl(evt);
      const isHome = evt.locationType === 'Home';
      const timeStr = evt.time || 'TBD';
      const opponentStr = evt.opponent || 'TBA';

      return `
        <div class="selected-event-item">
          <div style="display: flex; gap: var(--space-md); align-items: flex-start; margin-bottom: var(--space-md);">
            <div style="background: ${sportColor}18; color: ${sportColor}; padding: var(--space-md); border-radius: var(--radius-md); flex-shrink: 0; text-align: center; min-width: 54px; border: 1px solid ${sportColor}40;">
              <div style="font-size: 1.15rem; font-weight: 800;">${evt.sport.substring(0, 3).toUpperCase()}</div>
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 800; font-size: var(--text-lg); margin-bottom: var(--space-xs);">
                ${evt.sport} ${evt.gender || 'Varsity'} ${evt.level ? '(' + evt.level + ')' : ''}
              </div>
              <div class="event-time-badge">
                <i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${timeStr}
              </div>
            </div>
            <span class="event-status-badge status-${(evt.status || 'upcoming').toLowerCase()}">${evt.status || 'Scheduled'}</span>
          </div>

          <div style="display: flex; align-items: center; gap: var(--space-lg); padding: var(--space-md); background: var(--bg-input); border-radius: var(--radius-md); margin-bottom: var(--space-lg); border: 1px solid var(--border-subtle);">
            <div style="flex: 1; text-align: center;">
              <div style="font-weight: 700; font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase;">Home</div>
              <div style="font-weight: 800; font-size: var(--text-lg); color: var(--primary);">Sugar-Salem High</div>
            </div>
            <div style="font-weight: 800; font-size: var(--text-lg); color: var(--text-muted); text-align: center; padding: 0 4px;">
              ${evt.status === 'Final' ? '<span style="color:var(--text-main); font-size: 1.2rem;">' + (evt.ourScore ?? '-') + ' - ' + (evt.oppScore ?? '-') + '</span>' : 'VS'}
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="font-weight: 700; font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase;">${isHome ? 'Visitor' : 'Opponent'}</div>
              <div style="font-weight: 800; font-size: var(--text-lg); color: var(--text-main);">${opponentStr}</div>
            </div>
          </div>

          <div style="margin-bottom: var(--space-lg);">
            <div style="font-size: var(--text-xs); font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: var(--space-xs);">
              <i class="fa-solid fa-map-pin"></i> Venue & Location
            </div>
            <div style="font-weight: 700; color: var(--text-main);">${evt.venueName}</div>
            <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">
              ${evt.venueAddress || ''} &bull; ${isHome ? '🏠 Home Game' : '🚌 Away Game'}
            </div>
          </div>

          ${evt.highlights ? `
            <div style="font-size: var(--text-xs); color: var(--text-muted); background: var(--bg-card); padding: var(--space-sm) var(--space-md); border-radius: var(--radius-sm); margin-bottom: var(--space-lg); border-left: 3px solid var(--primary);">
              <i class="fa-solid fa-circle-info" style="color: var(--primary); margin-right: 4px;"></i> ${evt.highlights}
            </div>
          ` : ''}

          <div style="display: flex; gap: var(--space-sm); flex-wrap: wrap;">
            <button class="btn-primary" onclick="GameDayCalendar.handleDirectionsClick('${escapeQuotes(evt.venueName)}')">
              <i class="fa-solid fa-location-arrow"></i> Directions
            </button>
            <a href="${gcalLink}" target="_blank" rel="noopener" class="btn-secondary" style="text-decoration: none;">
              <i class="fa-solid fa-calendar-plus"></i> Google Cal
            </a>
            <button class="btn-ics-export" onclick="GameDayCalendar.downloadICS('${evt.id}')" title="Download iCalendar file (.ics)">
              <i class="fa-solid fa-download"></i> .ics (iCal)
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function handleDirectionsClick(venueName) {
    if (window.GameDayMap && typeof window.GameDayMap.openVenueByName === 'function') {
      const mapTab = document.getElementById('tabMap');
      if (mapTab) {
        mapTab.click();
      }
      setTimeout(() => {
        window.GameDayMap.openVenueByName(venueName);
      }, 150);
    }
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
    const [y, m, d] = (isoStr || '').split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }

  function generateGoogleCalendarUrl(evt) {
    const title = encodeURIComponent(`Sugar-Salem vs ${evt.opponent} (${evt.sport})`);
    const details = encodeURIComponent(`${evt.sport} Game - ${evt.highlights || 'Sugar-Salem High School Athletics'}\nVenue: ${evt.venueName}\nParking: ${evt.parkingInfo || ''}`);
    const location = encodeURIComponent(`${evt.venueName}, ${evt.venueAddress || ''}`);
    
    const dateFormatted = (evt.date || '').replace(/-/g, '');
    const startTime = `${dateFormatted}T${formatTimeForCalendar(evt.time)}Z`;
    const endTime = `${dateFormatted}T${formatTimeForCalendar(evt.time, 120)}Z`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  }

  function formatTimeForCalendar(timeText, durationMinutes = 0) {
    const match = (timeText || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '180000'.slice(0, 6);

    let hours = Number(match[1]) % 12;
    const minutes = Number(match[2]);
    if (match[3].toUpperCase() === 'PM') hours += 12;
    const date = new Date(2000, 0, 1, hours, minutes + durationMinutes);
    return `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}00`;
  }

  // --- .ics Export Generators ---
  function downloadICS(eventId) {
    const evt = allEvents.find(event => event.id === eventId);
    if (!evt) return;

    const icsContent = buildICSContent([evt]);
    saveICSFile(icsContent, `${evt.date}-${evt.sport.toLowerCase()}-sugar-salem.ics`);
  }

  function downloadMonthICS() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    const monthEvents = allEvents.filter(e => e.date && e.date.startsWith(monthPrefix));
    if (monthEvents.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('No events found for this month to export.', 'info');
      }
      return;
    }

    const icsContent = buildICSContent(monthEvents, `Sugar-Salem Athletics - ${MONTH_NAMES[month]} ${year}`);
    saveICSFile(icsContent, `Sugar-Salem-Athletics-${MONTH_NAMES[month]}-${year}.ics`);
    if (typeof window.showToast === 'function') {
      window.showToast(`Exported ${monthEvents.length} events for ${MONTH_NAMES[month]} ${year}!`, 'success');
    }
  }

  function downloadSeasonICS() {
    if (allEvents.length === 0) {
      if (typeof window.showToast === 'function') {
        window.showToast('No events loaded to export.', 'info');
      }
      return;
    }

    const icsContent = buildICSContent(allEvents, 'Sugar-Salem High Athletics - Full Season Schedule');
    saveICSFile(icsContent, 'Sugar-Salem-Athletics-Full-Season.ics');
    if (typeof window.showToast === 'function') {
      window.showToast(`Exported all ${allEvents.length} season events to .ics!`, 'success');
    }
  }

  function buildICSContent(events, calendarName = 'Sugar-Salem High Athletics') {
    const header = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GameDay+//Sugar-Salem Athletics//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${escapeICS(calendarName)}`,
      'X-WR-TIMEZONE:America/Boise'
    ];

    const eventBlocks = events.map(evt => {
      const cleanDate = (evt.date || '').replace(/-/g, '');
      const startTime = `${cleanDate}T${formatTimeForCalendar(evt.time)}`;
      const endTime = `${cleanDate}T${formatTimeForCalendar(evt.time, 120)}`;
      const summary = `Sugar-Salem vs ${evt.opponent} (${evt.sport})`;
      const desc = `${evt.sport} Game - ${evt.highlights || 'Sugar-Salem High Athletics'}\nLocation: ${evt.venueName}\nStatus: ${evt.status || 'Scheduled'}`;

      return [
        'BEGIN:VEVENT',
        `UID:${evt.id || Math.random().toString(36).substr(2, 9)}@gameday-plus`,
        `DTSTAMP:${formatDateToISO(new Date()).replace(/-/g, '')}T120000Z`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `SUMMARY:${escapeICS(summary)}`,
        `LOCATION:${escapeICS(`${evt.venueName}, ${evt.venueAddress || ''}`)}`,
        `DESCRIPTION:${escapeICS(desc)}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      ].join('\r\n');
    });

    return [...header, ...eventBlocks, 'END:VCALENDAR'].join('\r\n');
  }

  function saveICSFile(content, filename) {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    if (document.body) {
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      link.click();
    }
    URL.revokeObjectURL(link.href);
  }

  function escapeICS(value) {
    return String(value || '').replace(/[\\;,\n]/g, match => match === '\n' ? '\\n' : `\\${match}`);
  }

  function escapeQuotes(str) {
    return (str || '').replace(/'/g, "\\'");
  }

  return {
    initCalendar,
    updateEvents,
    downloadICS,
    downloadMonthICS,
    downloadSeasonICS,
    handleDirectionsClick
  };
})();

// Export globally
window.GameDayCalendar = GameDayCalendar;
