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
  setupDelegatedHandlers();
  initAuthButton();
  initPushButton();
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
      // Avoid duplicates - deduplicate by school id
      const uniqueSchools = [];
      const seenIds = new Set();
      schools.forEach(school => {
        if (school && school.id && !seenIds.has(school.id)) {
          seenIds.add(school.id);
          uniqueSchools.push(school);
        }
      });
      list.innerHTML = uniqueSchools.map(school => GameDayRender.schoolListItem(school)).join('');
    }

    function renderLists(query = '') {
      const normalizedQuery = query.toLowerCase().trim();
      const matches = school => `${school.name} ${school.mascot}`.toLowerCase().includes(normalizedQuery);
      const recentSchools = getRecentSchools().filter(matches);
      const recentIds = new Set(recentSchools.map(school => school.id));
      const allSchools = schoolsByName.filter(school => matches(school) && !recentIds.has(school.id));

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
    if (!school) {
      document.documentElement.removeAttribute('data-school');
      if (schoolNameTag) schoolNameTag.textContent = 'Select School';
      if (schoolSubtitle) schoolSubtitle.textContent = 'High School Athletics & Events Hub';
      return;
    }
    document.documentElement.setAttribute('data-school', school.id);
    if (schoolNameTag) {
      schoolNameTag.textContent = `${school.name.replace(' High School', '')} ${school.mascot}`;
    }
    if (schoolSubtitle) schoolSubtitle.textContent = `${school.name} Athletics & Events Hub`;
    const schoolPickerButton = document.getElementById('backToSchoolPickerBtn');
    if (schoolPickerButton) schoolPickerButton.hidden = false;
  }

  function getCurrentSchoolName() {
    const school = SCHOOL_OPTIONS.find(option => option.id === state.schoolId);
    return school ? school.name.replace(' High School', '') : 'School';
  }

  // --- Theme Management ---
  function initThemes() {
    const savedTheme = ['spirit', 'dark', 'light'].includes(localStorage.getItem('gameday_theme'))
      ? localStorage.getItem('gameday_theme')
      : 'spirit';
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
        showToast(`Switched to ${option.textContent.trim()}.`, 'info');
      });
    });
  }

  function setTheme(theme) {
    state.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('gameday_theme', theme);
    document.querySelectorAll('.theme-option').forEach(opt => {
      const selected = opt.dataset.theme === theme;
      opt.classList.toggle('active', selected);
      opt.setAttribute('aria-pressed', String(selected));
    });
  }

  // --- Account Sign In / Sign Out ---
  function initAuthButton() {
    const signInBtn = document.getElementById('signInBtn');
    if (!signInBtn || !GameDayFirebase.isConfigured() || !GameDayFirebase.auth) return;

    const schoolQS = state.schoolId ? `?school=${encodeURIComponent(state.schoolId)}` : '';

    function renderSignedOut() {
      signInBtn.title = 'Account';
      signInBtn.setAttribute('aria-label', 'Account');
      signInBtn.innerHTML = '<i class="fa-solid fa-user"></i><span class="btn-text">Account</span>';
    }

    function renderSignedIn(user) {
      const name = (user.displayName || user.email || 'Account').split(' ')[0];
      signInBtn.title = 'Account';
      signInBtn.setAttribute('aria-label', 'Account');
      signInBtn.innerHTML = '<i class="fa-solid fa-user"></i><span class="btn-text">Account</span><span class="sign-in-name">' + GameDayUtils.escapeHtml(name) + '</span>';
    }

    signInBtn.addEventListener('click', () => {
      window.location.href = `signin.html${schoolQS}`;
    });

    GameDayFirebase.onAuthStateChanged(user => {
      if (user) {
        renderSignedIn(user);
      } else {
        renderSignedOut();
      }
    });
  }

  // --- Push Notifications (Firebase Cloud Messaging) ---
  function initPushButton() {
    const pushBtn = document.getElementById('pushToggleBtn');
    if (!pushBtn || !window.GameDayNotifications) return;

    if (typeof GameDayNotifications.init === 'function') {
      GameDayNotifications.init();
    }

    if (!GameDayNotifications.messagingSupported() || !GameDayNotifications.isConfigured()) {
      pushBtn.hidden = true;
      return;
    }

    function renderState() {
      const on = GameDayNotifications.hasOptedIn();
      const denied = GameDayNotifications.permissionState() === 'denied';
      const label = GameDayNotifications.statusLabel();
      pushBtn.title = label;
      pushBtn.setAttribute('aria-label', label);
      const icon = on ? 'fa-solid fa-bell' : (denied ? 'fa-solid fa-bell-slash' : 'fa-regular fa-bell');
      pushBtn.innerHTML = `<i class="${icon}"></i>`;
      pushBtn.classList.toggle('active', on);
    }

    pushBtn.addEventListener('click', async () => {
      if (GameDayNotifications.permissionState() === 'denied') {
        showToast('Notifications are blocked in your browser settings.', 'info');
        return;
      }
      const wasOn = GameDayNotifications.hasOptedIn();
      const result = await GameDayNotifications.toggle();
      renderState();
      if (result.ok && !wasOn) {
        showToast('Game alerts on. You will be notified when games change.', 'success');
      } else if (result.ok && wasOn) {
        showToast('Game alerts turned off.', 'info');
      } else if (result.reason === 'denied') {
        showToast('Notification permission was not granted.', 'info');
      } else if (!result.ok) {
        showToast('Could not enable game alerts on this device.', 'info');
      }
    });

    renderState();
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
        if (settings.primaryColor) document.documentElement.style.setProperty('--school-primary-config', settings.primaryColor);
        if (settings.accentColor) document.documentElement.style.setProperty('--school-accent-config', settings.accentColor);
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
      console.error('Firestore event load failed; using fallback data source.', error);
      const fallback = await SheetsSync.loadEvents();
      events = fallback.events || [];
    }
    const hasSchoolData = events.length > 0;
    state.events = hasSchoolData ? events : [];

    // Update Status Indicator
    const dot = document.getElementById('sheetStatusDot');
    if (dot) {
      dot.style.display = 'none';
    }

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
        const dot = document.getElementById('sheetStatusDot');
        if (dot) {
          dot.style.display = 'none';
        }
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

    const isNonSport = ['drama', 'theater', 'theatre', 'music', 'band', 'choir', 'orchestra', 'debate', 'forensics', 'speech', 'art', 'club'].includes((nextGame.sport || '').toLowerCase()) || (!nextGame.opponent && nextGame.eventName);
    heroMatchupEl.innerHTML = GameDayRender.heroMatchup({
      teamLabel,
      schoolName,
      opponentLabel: isNonSport ? '' : opponentLabel,
      sportIcon,
      isHome: isNonSport ? false : isHome,
      schoolInitials: getSchoolInitials(schoolName),
      opponentInitials: getOpponentInitials(opponentLabel),
      friendlyDate: formatFriendlyDate(nextGame.date),
      time: nextGame.time,
      venueName: nextGame.venueName,
      locationType: nextGame.locationType
    });

    heroActionsEl.innerHTML = GameDayRender.heroActions({
      id: nextGame.id,
      venueName: nextGame.venueName
    });

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
    const feedEventsToggle = document.getElementById('feedEventsToggle');
    if (feedEventsToggle) {
      feedEventsToggle.addEventListener('click', () => {
        const expanded = feedEventsToggle.getAttribute('aria-expanded') === 'true';
        feedEventsToggle.setAttribute('aria-expanded', String(!expanded));
        renderFeed();
      });
    }

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
        if (feedEventsToggle) feedEventsToggle.setAttribute('aria-expanded', 'false');
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
    const expandButton = document.getElementById('feedEventsToggle');
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
      if (expandButton) expandButton.hidden = true;
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

    const expanded = expandButton && expandButton.getAttribute('aria-expanded') === 'true';
    const visibleEvents = expanded ? orderedEvents : orderedEvents.slice(0, 6);
    grid.innerHTML = visibleEvents.map(evt => {
      const isHome = evt.locationType === 'Home';
      const sport = evt.sport || '';
      const sportColor = getSportColor(sport.toLowerCase());
      const sportIcon = getSportIcon(sport);
      const hasScores = evt.ourScore !== null && evt.oppScore !== null;
      const isWin = hasScores && evt.ourScore > evt.oppScore;
      const eventTitle = getTeamLabel(evt);

      return GameDayRender.eventCard({
        id: evt.id,
        isHome,
        sportColor,
        sportIcon,
        hasScores,
        isWin,
        ourScore: evt.ourScore,
        oppScore: evt.oppScore,
        time: evt.time,
        status: evt.status,
        relativeDate: formatRelativeEventDate(evt.date, todayStr),
        eventTitle,
        schoolName: getCurrentSchoolName(),
        opponent: evt.opponent,
        locationType: evt.locationType,
        venueName: evt.venueName
      });
    }).join('');
    if (expandButton) {
      expandButton.hidden = orderedEvents.length <= 6;
      expandButton.textContent = expanded ? 'Show fewer events' : `Show all ${orderedEvents.length} events`;
      expandButton.setAttribute('aria-expanded', String(Boolean(expanded)));
    }
  }

  // Delegate interactions for dynamically-rendered cards (no inline handlers).
  function setupDelegatedHandlers() {
    const grid = document.getElementById('eventsGrid');
    if (grid) {
      const activate = (target) => {
        const card = target.closest('[data-game-id]');
        if (card) window.openGameModalById(card.dataset.gameId);
      };
      grid.addEventListener('click', event => activate(event.target));
      grid.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          const card = event.target.closest('[data-game-id]');
          if (card) { event.preventDefault(); activate(event.target); }
        }
      });
    }

    const heroActions = document.getElementById('heroQuickActions');
    if (heroActions) {
      heroActions.addEventListener('click', event => {
        const viewBtn = event.target.closest('[data-hero-game-id]');
        if (viewBtn) { window.openGameModalById(viewBtn.dataset.heroGameId); return; }
        const dirBtn = event.target.closest('[data-hero-venue]');
        if (dirBtn) { GameDayMap.openVenueByName(dirBtn.dataset.heroVenue); return; }
      });
    }

    const modalBody = document.getElementById('gameModalBody');
    if (modalBody) {
      modalBody.addEventListener('click', event => {
        const mapBtn = event.target.closest('[data-modal-venue]');
        if (mapBtn) {
          GameDayMap.openVenueByName(mapBtn.dataset.modalVenue);
          const gameModal = document.getElementById('gameModal');
          if (gameModal) gameModal.style.display = 'none';
        }
      });
    }
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

    const hasScores = game.ourScore !== null && game.oppScore !== null;

    modalBody.innerHTML = GameDayRender.gameModal({
      hasScores,
      sportIcon: getSportIcon(game.sport),
      sport: game.sport,
      status: game.status,
      teamLabel: getTeamLabel(game),
      schoolName: getCurrentSchoolName(),
      opponent: game.opponent,
      ourScore: game.ourScore,
      oppScore: game.oppScore,
      friendlyDate: formatFriendlyDate(game.date),
      time: game.time,
      locationType: game.locationType,
      venueName: game.venueName,
      venueAddress: game.venueAddress,
      parkingInfo: game.parkingInfo,
      highlights: game.highlights
    });

    gameModal.style.display = 'flex';
  };

  // --- Toast Notification System ---
  function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-info';
    toast.innerHTML = GameDayRender.toast(icon, message);

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
  window.showToast = showToast;
  window.GameDayApp = window.GameDayApp || {};
  window.GameDayApp.showToast = showToast;

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
    if (!event) return '';
    // Non-sport/club events should use their actual event or club name
    if (event.eventName && !event.opponent) {
      return event.eventName;
    }
    const sport = (event.sport || '').toLowerCase();
    if (['drama', 'theater', 'theatre', 'music', 'band', 'choir', 'orchestra', 'debate', 'forensics', 'speech', 'art', 'club', 'clubs'].includes(sport)) {
      if (event.eventName) return event.eventName;
    }
    if (!event.sport && event.eventName) {
      return event.eventName;
    }
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
      pill.innerHTML = GameDayRender.sportPill({ icon: getSportIcon(sport), sport });
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
});
