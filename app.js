/**
 * GameDay+ - Main Application Controller
 * High School Sports & Event Hub
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Application State
  const state = {
    events: [],
    selectedSport: 'all',
    timeFilter: 'all',
    awayOnly: false,
    searchQuery: '',
    currentTheme: 'spirit',
    activeTab: 'feed'
  };

  // 1. Initialize Theme Engine
  initThemes();

  // 2. Initialize Sub-modules
  GameDayMap.initMap();
  GameDayCalendar.initCalendar();
  GameDayStats.initStats();

  // 3. Load Event Data
  await loadAndDistributeData();

  // 4. Setup Event Listeners & UI Controls
  setupNavigationTabs();
  setupFiltersAndSearch();
  setupModals();
  startCountdownTimer();

  // --- Theme Management ---
  function initThemes() {
    const savedTheme = localStorage.getItem('gameday_theme') || 'spirit';
    setTheme(savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeDropdown = document.getElementById('themeDropdown');
    const themeSwitcher = document.querySelector('.theme-switcher');

    if (themeToggleBtn && themeSwitcher) {
      themeToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeSwitcher.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        themeSwitcher.classList.remove('open');
      });

      document.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', (e) => {
          e.stopPropagation();
          const chosenTheme = option.dataset.theme;
          setTheme(chosenTheme);
          themeSwitcher.classList.remove('open');
          showToast(`Switched to ${option.textContent.trim()} mode!`, 'info');
        });
      });
    }
  }

  function setTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gameday_theme', theme);

    const label = document.getElementById('currentThemeLabel');
    if (label) {
      if (theme === 'spirit') label.textContent = 'School Spirit';
      else if (theme === 'dark') label.textContent = 'Dark Mode';
      else if (theme === 'light') label.textContent = 'Light Mode';
    }
  }

  // --- Data Loading & Distribution ---
  async function loadAndDistributeData() {
    const { events, isLiveSheet } = await SheetsSync.loadEvents();
    state.events = events;

    // Update Status Indicator
    const dot = document.getElementById('sheetStatusDot');
    if (dot) {
      dot.style.background = isLiveSheet ? '#10b981' : '#f59e0b';
      dot.title = isLiveSheet ? 'Connected to Live Google Sheet' : 'Using Local/Sample Athletics Data';
    }

    // Refresh all modules
    renderHeroMatchup();
    renderFeed();
    GameDayMap.updateVenues(state.events);
    GameDayCalendar.updateEvents(state.events);
    GameDayStats.updateEvents(state.events);

    const timestampLabel = document.getElementById('lastUpdatedLabel');
    if (timestampLabel) {
      timestampLabel.textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${isLiveSheet ? '(Live Sheet)' : '(Sample Mode)'}`;
    }
  }

  // --- Hero Section & Countdown ---
  function renderHeroMatchup() {
    const heroMatchupEl = document.getElementById('heroMatchup');
    const heroActionsEl = document.getElementById('heroQuickActions');
    if (!heroMatchupEl || !heroActionsEl) return;

    // Find next upcoming match
    const todayStr = getTodayISO();
    const upcoming = state.events.filter(e => e.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
    const nextGame = upcoming[0] || state.events[0];

    if (!nextGame) return;

    heroMatchupEl.innerHTML = `
      <h2>${nextGame.sport}: Sugar-Salem vs ${nextGame.opponent}</h2>
      <p>
        <span><i class="fa-regular fa-calendar"></i> ${formatFriendlyDate(nextGame.date)}</span>
        <span><i class="fa-regular fa-clock"></i> ${nextGame.time}</span>
        <span><i class="fa-solid fa-location-dot"></i> ${nextGame.venueName} (${nextGame.locationType})</span>
      </p>
    `;

    heroActionsEl.innerHTML = `
      <button class="btn-hero-action btn-hero-primary" onclick="GameDayMap.openVenueByName('${escapeQuotes(nextGame.venueName)}')">
        <i class="fa-solid fa-diamond-turn-right"></i> Get Directions to Game
      </button>
      <button class="btn-hero-action btn-hero-secondary" onclick="openGameModalById('${nextGame.id}')">
        <i class="fa-solid fa-circle-info"></i> View Matchup Details
      </button>
    `;

    state.nextGameTarget = nextGame;
  }

  function startCountdownTimer() {
    function update() {
      if (!state.nextGameTarget) return;

      const [y, m, d] = state.nextGameTarget.date.split('-').map(Number);
      const targetTime = new Date(y, m - 1, d, 19, 0, 0).getTime();
      const now = new Date().getTime();
      const diff = targetTime - now;

      const cdDays = document.getElementById('cdDays');
      const cdHours = document.getElementById('cdHours');
      const cdMinutes = document.getElementById('cdMinutes');
      const cdSeconds = document.getElementById('cdSeconds');

      if (diff <= 0) {
        if (cdDays) cdDays.textContent = '00';
        if (cdHours) cdHours.textContent = '00';
        if (cdMinutes) cdMinutes.textContent = '00';
        if (cdSeconds) cdSeconds.textContent = '00';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (cdDays) cdDays.textContent = String(days).padStart(2, '0');
      if (cdHours) cdHours.textContent = String(hours).padStart(2, '0');
      if (cdMinutes) cdMinutes.textContent = String(minutes).padStart(2, '0');
      if (cdSeconds) cdSeconds.textContent = String(seconds).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
  }

  // --- Navigation Tabs ---
  function setupNavigationTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabKey = tab.dataset.tab;
        state.activeTab = tabKey;

        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.toggle('active', pane.id === `pane${capitalize(tabKey)}`);
        });

        if (tabKey === 'map') {
          GameDayMap.invalidateSize();
        }
      });
    });
  }

  // --- Sports Filter, Search & Time Windows ---
  function setupFiltersAndSearch() {
    // Sports Filter Pills
    const filterBar = document.getElementById('sportsFilterBar');
    if (filterBar) {
      filterBar.querySelectorAll('.sport-pill').forEach(pill => {
        pill.addEventListener('click', () => {
          filterBar.querySelectorAll('.sport-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          state.selectedSport = pill.dataset.sport;
          renderFeed();
        });
      });
    }

    // Search Input
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
        renderFeed();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.style.display = 'none';
        renderFeed();
      });
    }

    // Time window filters (All, Upcoming, Today, Past)
    document.querySelectorAll('.time-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.time-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.timeFilter = btn.dataset.time;
        renderFeed();
      });
    });

    // Away Only Toggle
    const awayToggle = document.getElementById('awayOnlyToggle');
    if (awayToggle) {
      awayToggle.addEventListener('change', (e) => {
        state.awayOnly = e.target.checked;
        renderFeed();
      });
    }

    // Reset Filters in empty state
    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        state.selectedSport = 'all';
        state.timeFilter = 'all';
        state.awayOnly = false;
        state.searchQuery = '';

        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        if (awayToggle) awayToggle.checked = false;

        document.querySelectorAll('.sport-pill').forEach(p => p.classList.toggle('active', p.dataset.sport === 'all'));
        document.querySelectorAll('.time-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.time === 'all'));

        renderFeed();
      });
    }
  }

  // --- Render Schedule Feed ---
  function renderFeed() {
    const grid = document.getElementById('eventsGrid');
    const emptyState = document.getElementById('emptyState');
    const countBadge = document.getElementById('eventCountBadge');
    if (!grid || !emptyState) return;

    const todayStr = getTodayISO();

    const filtered = state.events.filter(evt => {
      // 1. Sport filter
      if (state.selectedSport !== 'all') {
        const sportStr = evt.sport.toLowerCase();
        if (state.selectedSport === 'clubs') {
          if (!sportStr.includes('cheer') && !sportStr.includes('club')) return false;
        } else if (!sportStr.includes(state.selectedSport)) {
          return false;
        }
      }

      // 2. Away games only filter
      if (state.awayOnly && evt.locationType !== 'Away') {
        return false;
      }

      // 3. Time filter
      if (state.timeFilter === 'today' && evt.date !== todayStr) return false;
      if (state.timeFilter === 'upcoming' && (evt.date < todayStr && evt.status !== 'Live')) return false;
      if (state.timeFilter === 'past' && (evt.date >= todayStr && evt.status !== 'Final')) return false;

      // 4. Search query
      if (state.searchQuery) {
        const searchTarget = `${evt.sport} ${evt.opponent} ${evt.venueName} ${evt.venueAddress} ${evt.highlights} ${evt.date}`.toLowerCase();
        if (!searchTarget.includes(state.searchQuery)) return false;
      }

      return true;
    });

    countBadge.textContent = `${filtered.length} game${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(evt => {
      const isHome = evt.locationType === 'Home';
      const sportColor = getSportColor(evt.sport.toLowerCase());
      const hasScores = evt.ourScore !== null && evt.oppScore !== null;
      const isWin = hasScores && evt.ourScore > evt.oppScore;

      return `
        <div class="event-card">
          <div class="event-card-header">
            <span class="event-sport-tag" style="background: ${sportColor}22; color: ${sportColor};">
              <i class="fa-solid fa-trophy"></i> ${evt.sport} (${evt.gender || 'Varsity'})
            </span>
            <span class="event-status-badge status-${evt.status.toLowerCase()}">${evt.status}</span>
          </div>

          <div class="matchup-row">
            <div class="team-box">
              <span class="team-name">Sugar-Salem High</span>
              <span class="team-type">${isHome ? '🏠 Home' : '🚌 Away'}</span>
            </div>
            <div style="text-align: center;">
              ${hasScores ? `
                <span class="team-score" style="color: ${isWin ? '#10b981' : 'var(--primary)'};">${evt.ourScore} - ${evt.oppScore}</span>
                <div style="font-size:0.65rem; font-weight:800; color:var(--text-muted);">${isWin ? 'VICTORY' : 'FINAL'}</div>
              ` : `
                <span class="match-vs">VS</span>
              `}
            </div>
            <div class="team-box" style="text-align: right;">
              <span class="team-name">${evt.opponent}</span>
              <span class="team-type">${isHome ? 'Visitor' : 'Host'}</span>
            </div>
          </div>

          <div class="match-meta">
            <div class="meta-item">
              <i class="fa-regular fa-calendar"></i> <span><strong>${formatFriendlyDate(evt.date)}</strong> @ <strong>${evt.time}</strong></span>
            </div>
            <div class="meta-item">
              <i class="fa-solid fa-location-dot"></i> <span>${evt.venueName}</span>
              <span class="location-badge ${isHome ? 'badge-home' : 'badge-away'}">${evt.locationType}</span>
            </div>
            ${evt.highlights ? `
              <div class="meta-item" style="font-size: 0.78rem; color: var(--text-muted); margin-top: 0.2rem;">
                <i class="fa-solid fa-circle-info"></i> <span>${evt.highlights}</span>
              </div>
            ` : ''}
          </div>

          <div class="card-actions">
            <button class="btn-card btn-card-primary" onclick="GameDayMap.openVenueByName('${escapeQuotes(evt.venueName)}')">
              <i class="fa-solid fa-location-arrow"></i> Directions
            </button>
            <button class="btn-card btn-card-secondary" onclick="openGameModalById('${evt.id}')">
              <i class="fa-solid fa-chart-simple"></i> Details & Stats
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Modals Setup ---
  function setupModals() {
    // Sheet Sync Modal
    const sheetModal = document.getElementById('sheetModal');
    const openSheetBtn = document.getElementById('btnOpenSheetModal');
    const closeSheetBtn = document.getElementById('closeSheetModalBtn');
    const sheetUrlInput = document.getElementById('googleSheetUrlInput');
    const fetchSheetBtn = document.getElementById('btnFetchSheet');
    const loadDefaultBtn = document.getElementById('btnLoadDefaultData');

    if (openSheetBtn && sheetModal) {
      openSheetBtn.addEventListener('click', () => {
        sheetUrlInput.value = SheetsSync.getSavedSheetUrl();
        sheetModal.style.display = 'flex';
      });
    }

    if (closeSheetBtn && sheetModal) {
      closeSheetBtn.addEventListener('click', () => {
        sheetModal.style.display = 'none';
      });
    }

    if (fetchSheetBtn) {
      fetchSheetBtn.addEventListener('click', async () => {
        const url = sheetUrlInput.value;
        fetchSheetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';
        const res = await SheetsSync.syncCustomSheetUrl(url);
        fetchSheetBtn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Sync Live Sheet Now';

        if (res.success) {
          showToast(`Successfully synced ${res.count} events!`, 'success');
          sheetModal.style.display = 'none';
          await loadAndDistributeData();
        } else {
          showToast(`Sync error: ${res.error}`, 'error');
        }
      });
    }

    if (loadDefaultBtn) {
      loadDefaultBtn.addEventListener('click', async () => {
        SheetsSync.resetToSampleData();
        showToast('Reset to Sugar-Salem High Diggers schedule.', 'info');
        sheetModal.style.display = 'none';
        await loadAndDistributeData();
      });
    }

    // Game Details Modal
    const gameModal = document.getElementById('gameModal');
    const closeGameModalBtn = document.getElementById('closeGameModalBtn');
    if (closeGameModalBtn && gameModal) {
      closeGameModalBtn.addEventListener('click', () => {
        gameModal.style.display = 'none';
      });
    }

    // Global Modal Backdrop click to close
    window.addEventListener('click', (e) => {
      if (e.target === sheetModal) sheetModal.style.display = 'none';
      if (e.target === gameModal) gameModal.style.display = 'none';
    });
  }

  // Open Game Detail Modal
  window.openGameModalById = function(gameId) {
    const game = state.events.find(e => e.id === gameId);
    if (!game) return;

    const modalBody = document.getElementById('gameModalBody');
    const gameModal = document.getElementById('gameModal');
    if (!modalBody || !gameModal) return;

    const isHome = game.locationType === 'Home';
    const hasScores = game.ourScore !== null && game.oppScore !== null;
    const encodedAddr = encodeURIComponent(`${game.venueName}, ${game.venueAddress}`);

    modalBody.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem;">
        <span class="event-sport-tag" style="background: rgba(var(--primary-rgb),0.2); color: var(--primary);">
          ${game.sport} &bull; ${game.level} ${game.gender}
        </span>
        <span class="event-status-badge status-${game.status.toLowerCase()}">${game.status}</span>
      </div>

      <h2 style="font-size: 1.5rem; font-weight: 900; margin-bottom: 0.5rem;">
        Sugar-Salem High <span style="color:var(--primary);">vs</span> ${game.opponent}
      </h2>

      ${hasScores ? `
        <div style="background:var(--bg-input); padding: 1rem; border-radius:var(--radius-md); text-align:center; margin-bottom: 1.25rem;">
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--text-muted); margin-bottom:0.25rem;">Final Game Score</div>
          <div style="font-size: 2rem; font-weight: 900; font-family:'Outfit', sans-serif; color:var(--primary);">
            ${game.ourScore} &mdash; ${game.oppScore}
          </div>
        </div>
      ` : ''}

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.25rem;">
        <div style="background:var(--bg-input); padding: 0.75rem; border-radius:var(--radius-md);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Date & Kick-off</div>
          <div style="font-weight:800;">${formatFriendlyDate(game.date)}</div>
          <div style="font-size:0.85rem; color:var(--primary); font-weight:700;">${game.time}</div>
        </div>
        <div style="background:var(--bg-input); padding: 0.75rem; border-radius:var(--radius-md);">
          <div style="font-size:0.75rem; color:var(--text-muted); font-weight:700;">Venue & Location</div>
          <div style="font-weight:800;">${game.venueName}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${game.locationType} Matchup</div>
        </div>
      </div>

      <div style="background:var(--bg-input); padding: 0.85rem; border-radius:var(--radius-md); margin-bottom: 1.25rem; font-size:0.85rem;">
        <p style="margin-bottom:0.4rem;"><i class="fa-solid fa-square-parking" style="color:var(--primary);"></i> <strong>Parking & Arrival:</strong> ${game.parkingInfo}</p>
        <p><i class="fa-solid fa-bullhorn" style="color:var(--primary);"></i> <strong>Event Notes:</strong> ${game.highlights || 'Join the student section and wear school colors!'}</p>
      </div>

      <div class="directions-links-row" style="margin-top: 1rem;">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddr}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-google"></i> Google Maps
        </a>
        <a href="https://maps.apple.com/?daddr=${encodedAddr}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-apple"></i> Apple Maps
        </a>
        <button class="btn-primary" onclick="GameDayMap.openVenueByName('${escapeQuotes(game.venueName)}'); document.getElementById('gameModal').style.display='none';" style="margin-left:auto;">
          <i class="fa-solid fa-map-location-dot"></i> View on App Map
        </button>
      </div>
    `;

    gameModal.style.display = 'flex';
  };

  // --- Toast Notification System ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // --- Utility Functions ---
  function getTodayISO() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatFriendlyDate(isoDate) {
    if (!isoDate) return '';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function escapeQuotes(str) {
    return (str || '').replace(/'/g, "\\'");
  }
});
