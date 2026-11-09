/**
 * GameDay+ - Main Application Controller
 * High School Sports & Event Hub
 */

const SCHOOL_OPTIONS = [
  { id: 'sugar-salem', name: 'Sugar-Salem High School', mascot: 'Diggers' },
  { id: 'south-fremont', name: 'South Fremont High School', mascot: 'Cougars' },
  { id: 'teton', name: 'Teton High School', mascot: 'Timberwolves' },
  { id: 'snake-river', name: 'Snake River High School', mascot: 'Panthers' },
  { id: 'madison', name: 'Madison High School', mascot: 'Bobcats' },
  { id: 'rigby', name: 'Rigby High School', mascot: 'Trojans' }
];

document.addEventListener('DOMContentLoaded', async () => {
  // Application State
  const schoolParam = new URLSearchParams(window.location.search).get('school');
  const initialSchool = SCHOOL_OPTIONS.find(school => school.id === schoolParam);

  const state = {
    schoolId: initialSchool ? initialSchool.id : null,
    events: [],
    selectedSport: 'all',
    timeFilter: 'upcoming',
    awayOnly: false,
    searchQuery: '',
    currentTheme: 'spirit',
    activeTab: 'feed'
  };

  // 1. Initialize the school context before loading the app data.
  initSchoolPicker();

  // 2. Initialize Theme Engine
  initThemes();

  // 3. Initialize Sub-modules
  GameDayMap.initMap();
  GameDayCalendar.initCalendar();
  GameDayStats.initStats();

  // 4. Load Event Data
  await loadAndDistributeData();

  // 5. Setup Event Listeners & UI Controls
  setupNavigationTabs();
  setupFiltersAndSearch();
  setupModals();
  initAuthButton();
  setupEventForm();
  startCountdownTimer();

  // --- School Picker ---
  function initSchoolPicker() {
    const overlay = document.getElementById('schoolPickerOverlay');
    const searchInput = document.getElementById('schoolPickerSearch');
    const allSchoolsList = document.getElementById('allSchoolsList');
    const recentSchoolsList = document.getElementById('recentSchoolsList');
    const recentSchoolsSection = document.getElementById('recentSchoolsSection');
    const backButton = document.getElementById('backToSchoolPickerBtn');
    const closeButton = document.getElementById('closeSchoolPickerBtn');
    const schoolNameTag = document.getElementById('schoolNameTag');
    if (!overlay || !searchInput || !allSchoolsList || !recentSchoolsList || !recentSchoolsSection) return;

    const schoolsByName = [...SCHOOL_OPTIONS].sort((a, b) => a.name.localeCompare(b.name));
    const selectedSchool = SCHOOL_OPTIONS.find(school => school.id === state.schoolId);

    function openPicker() {
      overlay.hidden = false;
      searchInput.value = '';
      renderLists();
      if (closeButton) {
        closeButton.hidden = !state.schoolId;
      }
      setTimeout(() => searchInput.focus(), 50);
    }

    function closePicker() {
      if (state.schoolId) {
        overlay.hidden = true;
      }
    }

    if (selectedSchool) {
      overlay.hidden = true;
      updateSchoolNameTag(selectedSchool);
      if (backButton) backButton.hidden = false;
    } else {
      openPicker();
      if (backButton) backButton.hidden = true;
    }

    if (backButton) {
      backButton.addEventListener('click', (e) => {
        e.preventDefault();
        openPicker();
      });
    }

    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        closePicker();
      });
    }

    if (schoolNameTag) {
      schoolNameTag.style.cursor = 'pointer';
      schoolNameTag.title = 'Click to change school';
      schoolNameTag.addEventListener('click', () => {
        openPicker();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden && state.schoolId) {
        closePicker();
      }
    });

    function getRecentSchools() {
      try {
        const storedIds = JSON.parse(localStorage.getItem('gameday_recent_schools') || '[]');
        return Array.isArray(storedIds)
          ? storedIds.map(id => SCHOOL_OPTIONS.find(school => school.id === id)).filter(Boolean)
          : [];
      } catch (error) {
        return [];
      }
    }

    function renderSchoolList(list, schools) {
      list.innerHTML = schools.map(school => `
        <li>
          <button type="button" data-school-id="${school.id}">
            <span>
              <span class="school-name">${school.name}</span>
              <span class="school-mascot">${school.mascot}</span>
            </span>
          </button>
        </li>
      `).join('');
    }

    function renderLists(query = '') {
      const normalizedQuery = query.toLowerCase().trim();
      const matches = school => `${school.name} ${school.mascot}`.toLowerCase().includes(normalizedQuery);
      const recentSchools = getRecentSchools().filter(matches);
      const allSchools = schoolsByName.filter(matches);

      recentSchoolsSection.hidden = recentSchools.length === 0;
      renderSchoolList(recentSchoolsList, recentSchools);
      renderSchoolList(allSchoolsList, allSchools);
    }

    function selectSchool(schoolId) {
      const recentIds = getRecentSchools().map(school => school.id);
      const updatedIds = [schoolId, ...recentIds.filter(id => id !== schoolId)].slice(0, 3);
      localStorage.setItem('gameday_recent_schools', JSON.stringify(updatedIds));
      const destination = new URL(window.location.href);
      destination.searchParams.set('school', schoolId);
      window.location.href = destination.toString();
    }

    overlay.addEventListener('click', event => {
      const schoolButton = event.target.closest('[data-school-id]');
      if (schoolButton) selectSchool(schoolButton.dataset.schoolId);
    });

    searchInput.addEventListener('input', event => renderLists(event.target.value));
    renderLists();
  }

  function updateSchoolNameTag(school) {
    const schoolNameTag = document.getElementById('schoolNameTag');
    const schoolSubtitle = document.querySelector('.brand-subtitle');
    const schoolPickerButton = document.getElementById('backToSchoolPickerBtn');
    if (!school) {
      document.documentElement.removeAttribute('data-school');
      if (schoolNameTag) schoolNameTag.textContent = 'Select School';
      if (schoolSubtitle) schoolSubtitle.textContent = 'High School Athletics & Events Hub';
      if (schoolPickerButton) schoolPickerButton.hidden = true;
      return;
    }
    document.documentElement.setAttribute('data-school', school.id);
    if (schoolNameTag) schoolNameTag.textContent = `${school.name.replace(' High School', '')} ${school.mascot}`;
    if (schoolSubtitle) schoolSubtitle.textContent = `${school.name} Athletics & Events Hub`;
    if (schoolPickerButton) {
      schoolPickerButton.hidden = false;
      schoolPickerButton.innerHTML = `<i class="fa-solid fa-school"></i><span class="btn-text">${school.name.replace(' High School', '')}</span><i class="fa-solid fa-chevron-down school-picker-chevron"></i>`;
    }
  }

  function getCurrentSchoolName() {
    const school = SCHOOL_OPTIONS.find(option => option.id === state.schoolId);
    return school ? school.name.replace(' High School', '') : 'School';
  }

  // --- Theme Management ---
  function initThemes() {
    const savedTheme = localStorage.getItem('gameday_theme') || 'spirit';
    setTheme(savedTheme);

    // Initialize More Menu (3-dots)
    const moreMenuBtn = document.getElementById('moreMenuBtn');
    const moreMenu = document.querySelector('.more-menu');

    if (moreMenuBtn && moreMenu) {
      moreMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreMenu.classList.toggle('open');
      });

      document.addEventListener('click', () => {
        moreMenu.classList.remove('open');
      });
    }

    // Theme options in the new menu structure
    document.querySelectorAll('.theme-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const chosenTheme = option.dataset.theme;
        setTheme(chosenTheme);
        if (moreMenu) moreMenu.classList.remove('open');
        showToast(`Switched to ${option.textContent.trim()} mode!`, 'info');
      });
    });
  }

  function setTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gameday_theme', theme);
  }

  // --- Account Sign In / Sign Out ---
  function initAuthButton() {
    const signInBtn = document.getElementById('signInBtn');
    if (!signInBtn || !GameDayFirebase.isConfigured() || !GameDayFirebase.auth) return;

    const schoolQS = state.schoolId ? `?school=${encodeURIComponent(state.schoolId)}` : '';

    function renderSignedOut() {
      signInBtn.title = 'Sign in';
      signInBtn.setAttribute('aria-label', 'Sign in');
      signInBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i><span class="btn-text">Sign In</span>';
    }

    function renderSignedIn(user) {
      const name = (user.displayName || user.email || 'Signed In').split(' ')[0];
      signInBtn.title = 'Sign out';
      signInBtn.setAttribute('aria-label', 'Sign out');
      signInBtn.innerHTML = '<i class="fa-solid fa-user-check"></i><span class="btn-text">Sign Out</span><span class="sign-in-name">' + name.replace(/</g, '&lt;') + '</span>';
    }

    signInBtn.addEventListener('click', () => {
      const user = GameDayFirebase.auth().currentUser;
      if (user) {
        GameDayFirebase.signOut();
      } else {
        window.location.href = `signin.html${schoolQS}`;
      }
    });
    async function updateAdminStatus(user) {
      if (user && GameDayFirebase.isAdminUser) {
        try {
          const isAdmin = await GameDayFirebase.isAdminUser(user);
          if (isAdmin) {
            document.body.classList.add('is-admin');
            state.isAdmin = true;
          } else {
            document.body.classList.remove('is-admin');
            state.isAdmin = false;
          }
        } catch (_) {
          document.body.classList.remove('is-admin');
          state.isAdmin = false;
        }
      } else {
        document.body.classList.remove('is-admin');
        state.isAdmin = false;
      }
      renderFeed();
    }

    GameDayFirebase.onAuthStateChanged(user => {
      if (user) {
        renderSignedIn(user);
      } else {
        renderSignedOut();
      }
      updateAdminStatus(user);
    });
  }

  // --- Data Loading & Distribution ---
  async function loadAndDistributeData() {
    if (GameDayFirebase.isConfigured()) {
      try {
        const settings = await GameDayFirebase.loadSettings();
        if (settings.schoolName) {
          document.title = `GameDay+ | ${settings.schoolName}`;
          document.querySelector('.brand-subtitle').textContent = `${settings.schoolName} Athletics & Events Hub`;
        }
        if (settings.primaryColor) document.documentElement.style.setProperty('--primary', settings.primaryColor);
        if (settings.accentColor) document.documentElement.style.setProperty('--accent', settings.accentColor);
      } catch (error) {
        console.warn('Could not load school settings.', error);
      }
    }
    let events = [];
    let isLiveFirestore = false;
    try {
      const result = await GameDayFirebase.loadEvents();
      events = result.events || [];
      isLiveFirestore = Boolean(result.isLiveFirestore);
    } catch (error) {
      console.error('Event load failed.', error);
    }
    const hasSchoolData = events.length > 0;
    state.events = hasSchoolData ? events : [];

    // Refresh all modules
    syncSportFilterAvailability();
    renderHeroMatchup();
    renderFeed();
    GameDayMap.updateVenues(state.events);
    const school = SCHOOL_OPTIONS.find(option => option.id === state.schoolId);
    const schoolName = school ? school.name.replace(' High School', '') : 'School';
    GameDayCalendar.updateEvents(state.events, schoolName);
    GameDayStats.updateEvents(state.events, schoolName);

    const timestampLabel = document.getElementById('lastUpdatedLabel');
    if (timestampLabel) {
      timestampLabel.textContent = hasSchoolData
        ? `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ${isLiveFirestore ? '(Firestore Live)' : '(Schedule Mode)'}`
        : 'School data coming soon';
    }
  }

  // Subscribe to real-time events from Firestore
  if (GameDayFirebase && typeof GameDayFirebase.onEventsSnapshot === 'function') {
    GameDayFirebase.onEventsSnapshot(liveEvents => {
      if (liveEvents && liveEvents.length > 0) {
        state.events = liveEvents;
        syncSportFilterAvailability();
        renderHeroMatchup();
        renderFeed();
        GameDayMap.updateVenues(state.events);
        const school = SCHOOL_OPTIONS.find(option => option.id === state.schoolId);
        const schoolName = school ? school.name.replace(' High School', '') : 'School';
        GameDayCalendar.updateEvents(state.events, schoolName);
        GameDayStats.updateEvents(state.events, schoolName);
        const timestampLabel = document.getElementById('lastUpdatedLabel');
        if (timestampLabel) {
          timestampLabel.textContent = `Updated: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Firestore Live)`;
        }
      }
    });
  }

  // --- Hero Section & Countdown ---
  function renderHeroMatchup() {
    const heroMatchupEl = document.getElementById('heroMatchup');
    const heroActionsEl = document.getElementById('heroQuickActions');
    if (!heroMatchupEl || !heroActionsEl) return;

    // Find next upcoming match
    const todayStr = getTodayISO();
    const sportScopedEvents = state.selectedSport === 'all'
      ? state.events
      : state.events.filter(event => matchesSportFilter(event, state.selectedSport));
    const upcoming = sportScopedEvents
      .filter(event => event.date >= todayStr && !['final', 'cancelled', 'canceled'].includes((event.status || '').toLowerCase()))
      .sort((a, b) => a.date.localeCompare(b.date));
    const nextGame = upcoming[0] || sportScopedEvents[0] || state.events[0];

    if (!nextGame) {
      heroMatchupEl.innerHTML = '';
      heroActionsEl.innerHTML = '';
      state.nextGameTarget = null;
      return;
    }

    const isHome = nextGame.locationType === 'Home';
    const schoolName = getCurrentSchoolName();
    const teamLabel = getTeamLabel(nextGame);
    const opponentLabel = nextGame.opponent.replace(/\s+(High School|HS)$/i, '');
    const sportIcon = getSportIcon(nextGame.sport);

    heroMatchupEl.innerHTML = `
      <div class="hero-game-kicker"><span class="hero-sport-icon"><i class="fa-solid ${sportIcon}"></i></span> ${teamLabel}</div>
      <div class="hero-teams" aria-label="${schoolName} versus ${opponentLabel}">
        <div class="hero-team"><div class="team-crest crest-school">${getSchoolInitials(schoolName)}</div><strong>${schoolName}</strong><small>${isHome ? 'Home' : 'Away'}</small></div>
        <span class="hero-vs">VS</span>
        <div class="hero-team"><div class="team-crest crest-opponent">${getOpponentInitials(opponentLabel)}</div><strong>${opponentLabel}</strong><small>${isHome ? 'Visitor' : 'Host'}</small></div>
      </div>
      <div class="hero-details">
        <span><i class="fa-regular fa-calendar"></i><b>${formatFriendlyDate(nextGame.date)}</b><small>${nextGame.time}</small></span>
        <span><i class="fa-solid fa-location-dot"></i><b>${nextGame.venueName}</b><small>${nextGame.locationType} venue</small></span>
      </div>
    `;

    heroActionsEl.innerHTML = `
      <button class="btn-hero-action btn-hero-primary" onclick="openGameModalById('${nextGame.id}')">
        <i class="fa-solid fa-eye"></i> View Game
      </button>
      <button class="btn-hero-action btn-hero-secondary" onclick="GameDayMap.openVenueByName('${escapeQuotes(nextGame.venueName)}')">
        <i class="fa-solid fa-location-arrow"></i> Directions
      </button>
    `;

    state.nextGameTarget = nextGame;
  }

  function startCountdownTimer() {
    function update() {
      if (!state.nextGameTarget) return;

      const targetTime = getEventStartTimestamp(state.nextGameTarget);
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
    const switchToTab = (tabKey) => {
      const target = document.querySelector(`.tab-btn[data-tab="${tabKey}"]`);
      if (target) target.click();
      document.querySelectorAll('.mobile-nav-btn').forEach(button => {
        button.classList.toggle('active', button.dataset.tabTarget === tabKey);
      });
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabKey = tab.dataset.tab;
        state.activeTab = tabKey;
        const appMain = document.querySelector('.main-container');
        if (appMain) appMain.dataset.activeView = tabKey;

        document.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.toggle('active', pane.id === `pane${capitalize(tabKey)}`);
        });

        if (tabKey === 'map') {
          GameDayMap.invalidateSize();
        }
        document.querySelectorAll('.mobile-nav-btn').forEach(button => {
          button.classList.toggle('active', button.dataset.tabTarget === tabKey);
        });
      });
    });

    const appMain = document.querySelector('.main-container');
    if (appMain) appMain.dataset.activeView = state.activeTab;

    document.querySelectorAll('[data-tab-target], [data-action]').forEach(button => {
      button.addEventListener('click', () => {
        if (button.dataset.action === 'search') {
          const searchToggle = document.getElementById('searchToggleBtn');
          if (searchToggle) searchToggle.click();
          return;
        }
        const tabKey = button.dataset.tabTarget;
        if (tabKey === 'moreMenu') {
          const moreMenu = document.querySelector('.more-menu');
          if (moreMenu) moreMenu.classList.toggle('open');
          return;
        }
        switchToTab(tabKey);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  }

  // --- Sports Filter, Search & Time Windows ---
  function setupFiltersAndSearch() {
    // Sports Filter Pills
    const filterBar = document.getElementById('sportsFilterBar');
    if (filterBar) {
      filterBar.addEventListener('click', event => {
        const pill = event.target.closest('.sport-pill');
        if (!pill || pill.hidden) return;
        filterBar.querySelectorAll('.sport-pill').forEach(item => item.classList.remove('active'));
        pill.classList.add('active');
        state.selectedSport = pill.dataset.sport;
        renderHeroMatchup();
        renderFeed();
      });
    }

    // Search Modal Toggle
    const searchModal = document.getElementById('searchModal');
    const searchToggleBtn = document.getElementById('searchToggleBtn');
    const searchModalClose = document.getElementById('searchModalClose');

    if (searchToggleBtn) {
      searchToggleBtn.addEventListener('click', () => {
        searchModal.style.display = 'flex';
        document.getElementById('searchInput').focus();
      });
    }

    if (searchModalClose) {
      searchModalClose.addEventListener('click', () => {
        searchModal.style.display = 'none';
      });
    }

    // Close modal when clicking outside the content
    if (searchModal) {
      searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
          searchModal.style.display = 'none';
        }
      });
    }

    // Close search modal on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && searchModal && searchModal.style.display === 'flex') {
        searchModal.style.display = 'none';
      }
    });

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
    document.querySelectorAll('.time-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.time === state.timeFilter));
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

        renderHeroMatchup();
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
      if (state.selectedSport !== 'all' && !matchesSportFilter(evt, state.selectedSport)) return false;

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
      if (state.events.length === 0) {
        const emptyHeading = emptyState.querySelector('h3');
        const emptyMessage = emptyState.querySelector('p');
        if (emptyHeading) emptyHeading.textContent = 'School Data Coming Soon';
        if (emptyMessage) emptyMessage.textContent = 'Schedules, scores, and events will appear here when this school data is added.';
      }
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    const orderedEvents = [...filtered].sort((a, b) => {
      const aPast = a.status === 'Final' || a.date < todayStr;
      const bPast = b.status === 'Final' || b.date < todayStr;
      if (aPast !== bPast) return aPast ? 1 : -1;
      return (a.date || '').localeCompare(b.date || '');
    });

    grid.innerHTML = orderedEvents.map(evt => {
      const isHome = evt.locationType === 'Home';
      const sportColor = getSportColor(evt.sport.toLowerCase());
      const sportIcon = getSportIcon(evt.sport);
      const hasScores = evt.ourScore !== null && evt.oppScore !== null;
      const isWin = hasScores && evt.ourScore > evt.oppScore;
      const eventTitle = getTeamLabel(evt);
      const resultLabel = hasScores ? `${evt.ourScore}&ndash;${evt.oppScore}` : evt.time;
      const resultContext = hasScores ? (isWin ? 'Win' : 'Final') : evt.status;

      return `
        <article class="event-card event-card--agenda" tabindex="0" role="button" aria-label="View details for ${eventTitle} versus ${evt.opponent}" onclick="openGameModalById('${evt.id}')" onkeydown="if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openGameModalById('${evt.id}'); }">
          <div class="admin-card-actions" onclick="event.stopPropagation()">
            <button type="button" class="admin-edit-btn" title="Edit Event" aria-label="Edit Event" onclick="event.stopPropagation(); openEventForm('${evt.id}');">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button type="button" class="admin-delete-btn" title="Delete Event" aria-label="Delete Event" onclick="event.stopPropagation(); confirmDeleteEvent('${evt.id}');">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
          <div class="event-sport-mark" style="--event-color: ${sportColor};"><i class="fa-solid ${sportIcon}" aria-hidden="true"></i></div>
          <div class="event-card-content">
            <p class="event-date-label">${formatRelativeEventDate(evt.date, todayStr)}</p>
            <h3 class="event-title">${eventTitle}</h3>
            <p class="event-opponent">${getCurrentSchoolName()} <span>vs.</span> ${evt.opponent}</p>
            <p class="event-location"><i class="fa-solid ${isHome ? 'fa-house' : 'fa-location-dot'}" aria-hidden="true"></i>${evt.locationType} &middot; ${evt.venueName}</p>
          </div>
          <div class="event-card-side">
            <strong class="event-time ${hasScores && isWin ? 'event-result-win' : ''}">${resultLabel}</strong>
            <span class="event-status-badge status-${evt.status.toLowerCase()}">${resultContext}</span>
            <i class="fa-solid fa-chevron-right event-card-chevron" aria-hidden="true"></i>
          </div>
        </article>
      `;
    }).join('');
  }

  // --- Modals Setup ---
  function setupModals() {
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

    const hasScores = game.ourScore !== null && game.oppScore !== null;
    const encodedAddr = encodeURIComponent(`${game.venueName}, ${game.venueAddress}`);

    modalBody.innerHTML = `
      <section class="game-detail">
        <div class="game-detail-topline">
          <span class="event-sport-tag"><i class="fa-solid ${getSportIcon(game.sport)}"></i>${game.sport}</span>
          <span class="event-status-badge status-${game.status.toLowerCase()}">${game.status}</span>
        </div>
        <p class="game-detail-kicker">${getTeamLabel(game)}</p>
        <h2>${getCurrentSchoolName()} <span>vs.</span> ${game.opponent}</h2>

        ${hasScores ? `
          <div class="game-detail-score">
            <span>Final score</span>
            <strong>${game.ourScore} <em>&ndash;</em> ${game.oppScore}</strong>
          </div>
        ` : ''}

        <div class="game-detail-facts">
          <div class="game-detail-fact">
            <i class="fa-regular fa-calendar"></i>
            <span>Date & time</span>
            <strong>${formatFriendlyDate(game.date)}<small>${game.time}</small></strong>
          </div>
          <div class="game-detail-fact">
            <i class="fa-solid fa-location-dot"></i>
            <span>${game.locationType} venue</span>
            <strong>${game.venueName}<small>${game.venueAddress || 'Address not listed'}</small></strong>
          </div>
        </div>

        <div class="game-detail-notes">
          <p><i class="fa-solid fa-square-parking"></i><span><strong>Parking & arrival</strong>${game.parkingInfo || 'Venue details will be posted before the event.'}</span></p>
          <p><i class="fa-solid fa-bullhorn"></i><span><strong>Event notes</strong>${game.highlights || 'Join the student section and wear school colors!'}</span></p>
        </div>

        <div class="directions-links-row game-detail-actions">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${encodedAddr}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-google"></i> Google Maps
        </a>
        <a href="https://maps.apple.com/?daddr=${encodedAddr}" target="_blank" rel="noopener" class="btn-nav-app">
          <i class="fa-brands fa-apple"></i> Apple Maps
        </a>
        <button class="btn-primary" onclick="GameDayMap.openVenueByName('${escapeQuotes(game.venueName)}'); document.getElementById('gameModal').style.display='none';">
          <i class="fa-solid fa-map-location-dot"></i> View on App Map
        </button>
        ${state.isAdmin ? `
          <button type="button" class="btn-hero-action" style="grid-column: 1 / -1; margin-top: 8px; background: rgba(11, 49, 93, 0.08); color: var(--app-blue); border: 1px solid var(--app-blue); font-weight: 700; border-radius: 12px; padding: 10px; cursor: pointer;" onclick="document.getElementById('gameModal').style.display='none'; openEventForm('${game.id}');">
            <i class="fa-solid fa-pen-to-square"></i> Edit Event (Admin)
          </button>
        ` : ''}
        </div>
      </section>
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
  window.showToast = showToast;

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

  function getEventStartTimestamp(event) {
    const [year, month, day] = (event.date || '').split('-').map(Number);
    const timeMatch = String(event.time || '').match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    let hour = Number(timeMatch?.[1] || 19);
    const minute = Number(timeMatch?.[2] || 0);
    const period = timeMatch?.[3]?.toUpperCase();
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    return new Date(year, month - 1, day, hour, minute, 0).getTime();
  }

  function formatRelativeEventDate(isoDate, todayStr) {
    if (isoDate === todayStr) return 'TODAY';
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    if (isoDate === tomorrowStr) return 'TOMORROW';
    return formatFriendlyDate(isoDate).toUpperCase();
  }

  function getSportIcon(sport) {
    const value = (sport || '').toLowerCase();
    if (value.includes('football')) return 'fa-football';
    if (value.includes('basketball')) return 'fa-basketball';
    if (value.includes('soccer')) return 'fa-futbol';
    if (value.includes('baseball') || value.includes('softball')) return 'fa-baseball-bat-ball';
    if (value.includes('volleyball')) return 'fa-volleyball';
    if (value.includes('track') || value.includes('cross country')) return 'fa-person-running';
    return 'fa-trophy';
  }

  function getTeamLabel(event) {
    const level = (event.level || 'Varsity')
      .replace(/\b(Boys|Girls)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    return `${event.gender ? `${event.gender} ` : ''}${level} ${event.sport}`.replace(/\s+/g, ' ').trim();
  }

  function matchesSportFilter(event, filter) {
    const sport = (event.sport || '').toLowerCase();
    if (filter === 'clubs') return sport.includes('cheer') || sport.includes('club');
    if (filter === 'baseball') return sport.includes('baseball') || sport.includes('softball');
    if (filter === 'track') return sport.includes('track') || sport.includes('cross country');
    if (filter.startsWith('sport:')) return sport === filter.slice(6);
    return sport.includes(filter);
  }

  function syncSportFilterAvailability() {
    const filterBar = document.getElementById('sportsFilterBar');
    if (!filterBar) return;

    const representedSports = event => ['football', 'basketball', 'soccer', 'baseball', 'volleyball', 'track', 'clubs']
      .some(filter => matchesSportFilter(event, filter));
    const extraSports = [...new Set(state.events
      .filter(event => event.sport && !representedSports(event))
      .map(event => event.sport.trim()))]
      .sort((a, b) => a.localeCompare(b));

    extraSports.forEach(sport => {
      const filterValue = `sport:${sport.toLowerCase()}`;
      if ([...filterBar.querySelectorAll('.sport-pill')].some(pill => pill.dataset.sport === filterValue)) return;
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'sport-pill';
      pill.dataset.sport = filterValue;
      pill.title = sport;
      pill.innerHTML = `<i class="fa-solid ${getSportIcon(sport)}"></i><span>${sport}</span>`;
      filterBar.appendChild(pill);
    });

    const pills = filterBar.querySelectorAll('.sport-pill');
    pills.forEach(pill => {
      const filter = pill.dataset.sport;
      const isAvailable = filter === 'all' || state.events.some(event => matchesSportFilter(event, filter));
      pill.hidden = !isAvailable;
      if (!isAvailable && pill.classList.contains('active')) state.selectedSport = 'all';
    });
    pills.forEach(pill => pill.classList.toggle('active', pill.dataset.sport === state.selectedSport));
  }

  function getSchoolInitials(name) {
    return (name || 'School').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  }

  function getOpponentInitials(name) {
    return (name || 'Opponent').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
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

  // --- Inline Admin Samsung Calendar Event Form ---
  function setupEventForm() {
    const overlay = document.getElementById('eventFormOverlay');
    const form = document.getElementById('eventForm');
    const backBtn = document.getElementById('efBackBtn');
    const saveBtn = document.getElementById('efSaveBtn');
    const deleteBtn = document.getElementById('efDeleteEventBtn');
    const btnAdminAddEvent = document.getElementById('btnAdminAddEvent');
    const confirmOverlay = document.getElementById('efConfirmOverlay');
    const confirmCancelBtn = document.getElementById('efConfirmCancelBtn');
    const confirmDeleteBtn = document.getElementById('efConfirmDeleteBtn');
    const locationToggle = document.getElementById('efLocationToggle');
    const locationTypeInput = document.getElementById('efLocationType');

    if (!overlay || !form) return;

    let pendingDeleteId = null;

    // 3-dots Menu "Add Event" button
    if (btnAdminAddEvent) {
      btnAdminAddEvent.addEventListener('click', (e) => {
        e.stopPropagation();
        const moreMenu = document.querySelector('.more-menu');
        if (moreMenu) moreMenu.classList.remove('open');
        openEventForm();
      });
    }

    // Cancel / Back Button
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        closeEventForm();
      });
    }

    // Save Button in Topbar
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        if (form.requestSubmit) {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      });
    }

    // Location Toggle (Home / Away / Neutral)
    if (locationToggle) {
      locationToggle.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          locationToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const val = btn.dataset.val || 'Home';
          if (locationTypeInput) locationTypeInput.value = val;

          // Auto-fill venue if switching to Home
          const venueInput = document.getElementById('efVenueName');
          const addressInput = document.getElementById('efVenueAddress');
          const school = SCHOOL_OPTIONS.find(s => s.id === state.schoolId) || SCHOOL_OPTIONS[0];
          if (val === 'Home' && venueInput && (!venueInput.value || venueInput.value.includes('Away'))) {
            venueInput.value = `${school.name} Stadium`;
            if (addressInput && !addressInput.value) {
              addressInput.value = school.id === 'sugar-salem' ? '#1 Digger Dr, Sugar City, ID 83448' : '';
            }
          }
        });
      });
    }

    // Delete Button in Form
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const id = document.getElementById('efEventId').value;
        if (id) confirmDeleteEvent(id);
      });
    }

    // Confirmation Modal buttons
    if (confirmCancelBtn && confirmOverlay) {
      confirmCancelBtn.addEventListener('click', () => {
        confirmOverlay.classList.remove('open');
        pendingDeleteId = null;
      });
    }

    if (confirmDeleteBtn && confirmOverlay) {
      confirmDeleteBtn.addEventListener('click', async () => {
        if (!pendingDeleteId) return;
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.textContent = 'Deleting...';
        try {
          await GameDayFirebase.deleteEvent(pendingDeleteId);
          // Remove from local state
          state.events = state.events.filter(e => e.id !== pendingDeleteId);
          renderHeroMatchup();
          renderFeed();
          GameDayMap.updateVenues(state.events);
          const school = SCHOOL_OPTIONS.find(option => option.id === state.schoolId);
          const schoolName = school ? school.name.replace(' High School', '') : 'School';
          GameDayCalendar.updateEvents(state.events, schoolName);
          GameDayStats.updateEvents(state.events, schoolName);

          showToast('Event deleted from schedule.', 'info');
          confirmOverlay.classList.remove('open');
          closeEventForm();
        } catch (err) {
          alert('Could not delete event: ' + err.message);
        } finally {
          confirmDeleteBtn.disabled = false;
          confirmDeleteBtn.textContent = 'Delete';
          pendingDeleteId = null;
        }
      });
    }

    // Form Submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const titleInput = document.getElementById('efEventName');
      const dateInput = document.getElementById('efDate');
      if (!titleInput.value.trim()) {
        titleInput.focus();
        showToast('Please enter an event title.', 'error');
        return;
      }
      if (!dateInput.value) {
        dateInput.focus();
        showToast('Please select an event date.', 'error');
        return;
      }

      const id = document.getElementById('efEventId').value || '';
      const formData = new FormData(form);
      const values = Object.fromEntries(formData.entries());

      const ourScoreVal = values.ourScore !== '' && values.ourScore !== undefined && values.ourScore !== null
        ? Number(values.ourScore) : null;
      const oppScoreVal = values.oppScore !== '' && values.oppScore !== undefined && values.oppScore !== null
        ? Number(values.oppScore) : null;

      const eventPayload = {
        eventName: values.eventName.trim(),
        name: values.eventName.trim(),
        sport: values.sport || 'Football',
        level: values.level || 'Varsity',
        gender: values.gender || 'Boys',
        eventType: 'Game',
        date: values.date,
        time: values.startTime || 'TBA',
        startTime: values.startTime || 'TBA',
        endTime: values.endTime || '',
        opponent: values.opponent ? values.opponent.trim() : '',
        opponentMascot: values.opponentMascot ? values.opponentMascot.trim() : '',
        locationType: values.locationType || 'Home',
        venueName: values.venueName ? values.venueName.trim() : '',
        venueAddress: values.venueAddress ? values.venueAddress.trim() : '',
        status: values.status || 'Scheduled',
        ourScore: ourScoreVal,
        oppScore: oppScoreVal,
        homeScore: ourScoreVal,
        awayScore: oppScoreVal,
        parkingInfo: values.parkingInfo ? values.parkingInfo.trim() : '',
        highlights: values.highlights ? values.highlights.trim() : '',
        schoolId: state.schoolId || 'sugar-salem'
      };

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
      }

      try {
        const saved = await GameDayFirebase.saveEvent(id, eventPayload);
        // Update local state immediately
        const idx = state.events.findIndex(ev => ev.id === saved.id);
        if (idx !== -1) {
          state.events[idx] = saved;
        } else {
          state.events.push(saved);
        }

        renderHeroMatchup();
        renderFeed();
        GameDayMap.updateVenues(state.events);
        const school = SCHOOL_OPTIONS.find(option => option.id === state.schoolId);
        const schoolName = school ? school.name.replace(' High School', '') : 'School';
        GameDayCalendar.updateEvents(state.events, schoolName);
        GameDayStats.updateEvents(state.events, schoolName);

        showToast(id ? 'Event updated successfully!' : 'Event created successfully!', 'success');
        closeEventForm();
      } catch (err) {
        showToast('Error saving event: ' + err.message, 'error');
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = 'Save';
        }
      }
    });

    window.openEventForm = function(eventId = null) {
      form.reset();
      const formTitle = document.getElementById('efFormTitle');
      const eventIdInput = document.getElementById('efEventId');
      const deleteBtn = document.getElementById('efDeleteEventBtn');
      const school = SCHOOL_OPTIONS.find(s => s.id === state.schoolId) || SCHOOL_OPTIONS[0];

      if (eventId) {
        // Edit Mode
        const ev = state.events.find(e => e.id === eventId);
        if (!ev) return;
        if (formTitle) formTitle.textContent = 'Edit Event';
        if (eventIdInput) eventIdInput.value = ev.id;
        if (deleteBtn) deleteBtn.style.display = 'flex';

        document.getElementById('efEventName').value = ev.eventName || ev.name || '';
        document.getElementById('efSport').value = ev.sport || 'Football';
        document.getElementById('efLevel').value = ev.level || 'Varsity';
        document.getElementById('efGender').value = ev.gender || 'Boys';
        document.getElementById('efDate').value = ev.date || '';
        document.getElementById('efStartTime').value = ev.startTime || ev.time || '';
        document.getElementById('efEndTime').value = ev.endTime || '';
        document.getElementById('efOpponent').value = ev.opponent || '';
        document.getElementById('efOpponentMascot').value = ev.opponentMascot || '';
        document.getElementById('efVenueName').value = ev.venueName || ev.location || '';
        document.getElementById('efVenueAddress').value = ev.venueAddress || ev.address || '';
        document.getElementById('efStatus').value = ev.status || 'Scheduled';
        document.getElementById('efOurScore').value = ev.ourScore !== null && ev.ourScore !== undefined ? ev.ourScore : '';
        document.getElementById('efOppScore').value = ev.oppScore !== null && ev.oppScore !== undefined ? ev.oppScore : '';
        document.getElementById('efParkingInfo').value = ev.parkingInfo || '';
        document.getElementById('efHighlights').value = ev.highlights || '';

        // Set location type toggle
        const loc = ev.locationType || 'Home';
        if (locationTypeInput) locationTypeInput.value = loc;
        if (locationToggle) {
          locationToggle.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', (b.dataset.val || '').toLowerCase() === loc.toLowerCase());
          });
        }
      } else {
        // Add Mode
        if (formTitle) formTitle.textContent = 'Add Event';
        if (eventIdInput) eventIdInput.value = '';
        if (deleteBtn) deleteBtn.style.display = 'none';

        document.getElementById('efDate').value = getTodayISO();
        document.getElementById('efSport').value = state.selectedSport !== 'all' ? capitalize(state.selectedSport) : 'Football';
        document.getElementById('efLevel').value = 'Varsity';
        document.getElementById('efGender').value = 'Boys';
        document.getElementById('efStatus').value = 'Scheduled';
        document.getElementById('efStartTime').value = '7:00 PM';
        document.getElementById('efEndTime').value = '9:00 PM';
        document.getElementById('efVenueName').value = `${school.name} Stadium`;
        document.getElementById('efVenueAddress').value = school.id === 'sugar-salem' ? '#1 Digger Dr, Sugar City, ID 83448' : '';

        if (locationTypeInput) locationTypeInput.value = 'Home';
        if (locationToggle) {
          locationToggle.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', b.dataset.val === 'Home');
          });
        }
      }

      overlay.classList.add('open');
      setTimeout(() => {
        const titleInput = document.getElementById('efEventName');
        if (titleInput) titleInput.focus();
      }, 100);
    };

    window.closeEventForm = function() {
      overlay.classList.remove('open');
    };

    window.confirmDeleteEvent = function(eventId) {
      pendingDeleteId = eventId;
      const ev = state.events.find(e => e.id === eventId);
      const confirmText = document.getElementById('efConfirmText');
      if (confirmText) {
        confirmText.textContent = ev
          ? `Are you sure you want to delete "${ev.eventName || ev.opponent || 'this event'}"? This cannot be undone.`
          : 'Are you sure you want to delete this event? This cannot be undone.';
      }
      if (confirmOverlay) confirmOverlay.classList.add('open');
    };
  }

});
