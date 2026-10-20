const AdminApp = (() => {
  const firebaseClient = window.GameDayFirebase;
  const content = document.getElementById('adminContent');
  let collections = {};

  const STORAGE_KEY = 'gameday_saved_credentials';
  const LEGACY_EMAIL_KEY = 'gameday_remember_email';
  const LEGACY_PASS_KEY = 'gameday_remember_password';
  const LEGACY_REMEMBER_KEY = 'gameday_remember_me';

  function getSavedStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (!parsed.accounts) parsed.accounts = {};
          return parsed;
        }
      }
    } catch (_) {}

    const legacyEmail = localStorage.getItem(LEGACY_EMAIL_KEY);
    const legacyPass = localStorage.getItem(LEGACY_PASS_KEY);
    const legacyRemember = localStorage.getItem(LEGACY_REMEMBER_KEY) !== 'false';
    const store = {
      remember: legacyRemember,
      lastUsed: legacyEmail ? legacyEmail.toLowerCase() : '',
      accounts: {}
    };
    if (legacyEmail && legacyPass) {
      store.accounts[legacyEmail.toLowerCase()] = {
        email: legacyEmail,
        password: legacyPass,
        savedAt: Date.now()
      };
    }
    return store;
  }

  function saveStore(store) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      localStorage.setItem(LEGACY_REMEMBER_KEY, store.remember ? 'true' : 'false');
      if (store.remember && store.lastUsed && store.accounts[store.lastUsed]) {
        localStorage.setItem(LEGACY_EMAIL_KEY, store.accounts[store.lastUsed].email);
        localStorage.setItem(LEGACY_PASS_KEY, store.accounts[store.lastUsed].password);
      } else if (!store.remember) {
        localStorage.removeItem(LEGACY_EMAIL_KEY);
        localStorage.removeItem(LEGACY_PASS_KEY);
      }
    } catch (_) {}
  }

  function populateAdminCredentials() {
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const rememberCheckbox = document.getElementById('adminRememberMe');
    const datalist = document.getElementById('adminSavedEmailsList');
    if (!emailInput || !passwordInput) return;

    const store = getSavedStore();
    if (rememberCheckbox) {
      rememberCheckbox.checked = store.remember !== false;
    }

    const accountKeys = Object.keys(store.accounts || {});
    if (datalist) {
      datalist.innerHTML = '';
      accountKeys.forEach(k => {
        const opt = document.createElement('option');
        opt.value = store.accounts[k].email;
        datalist.appendChild(opt);
      });
    }

    if (store.remember !== false && accountKeys.length > 0) {
      const activeKey = (store.lastUsed && store.accounts[store.lastUsed])
        ? store.lastUsed
        : accountKeys[0];
      const activeAcc = store.accounts[activeKey];
      if (activeAcc) {
        if (!emailInput.value) emailInput.value = activeAcc.email;
        if (!passwordInput.value) passwordInput.value = activeAcc.password;
      }
    }
  }

  function rememberAdminCredentials(email, password) {
    const rememberCheckbox = document.getElementById('adminRememberMe');
    const shouldRemember = rememberCheckbox ? rememberCheckbox.checked : true;
    const store = getSavedStore();
    const key = email.trim().toLowerCase();
    if (shouldRemember) {
      store.remember = true;
      store.lastUsed = key;
      store.accounts[key] = {
        email: email.trim(),
        password: password || '',
        savedAt: Date.now()
      };
    } else {
      store.remember = false;
      delete store.accounts[key];
      if (store.lastUsed === key) {
        const remaining = Object.keys(store.accounts);
        store.lastUsed = remaining.length ? remaining[0] : '';
      }
    }
    saveStore(store);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const backToRegularSignIn = document.getElementById('backToRegularSignIn');
    const publicAppLink = document.getElementById('publicAppLink');
    if (publicAppLink) {
      publicAppLink.addEventListener('click', (e) => {
        e.preventDefault();
        const homeUrl = `index.html?school=${encodeURIComponent(firebaseClient.schoolId)}`;
        window.location.href = homeUrl;
      });
    }
    const backToRegularSignIn = document.getElementById('backToRegularSignIn');
    if (backToRegularSignIn) {
      backToRegularSignIn.addEventListener('click', () => {
        window.location.href = `signin.html?school=${encodeURIComponent(firebaseClient.schoolId)}`;
      });
    }
    populateAdminCredentials();

    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    if (emailInput && passwordInput) {
      emailInput.addEventListener('input', () => {
        const key = emailInput.value.trim().toLowerCase();
        const store = getSavedStore();
        if (store.accounts && store.accounts[key]) {
          passwordInput.value = store.accounts[key].password;
        }
      });
    }

    const toggleBtn = document.getElementById('adminTogglePasswordBtn');
    if (toggleBtn && passwordInput) {
      toggleBtn.addEventListener('click', () => {
        const isPass = passwordInput.type === 'password';
        passwordInput.type = isPass ? 'text' : 'password';
        toggleBtn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
      });
    }

    if (!firebaseClient.isConfigured()) {
      document.getElementById('loginError').textContent = 'Firebase is not configured. Add your project settings to firebase-config.js.';
      document.querySelector('#loginForm button').disabled = true;
      return;
    }

    // Check if Logan opened an approval link from his email
    handleApprovalFlow();

    // Request Access Navigation
    const openReqBtn = document.getElementById('openRequestAccessBtn');
    const cancelReqBtn = document.getElementById('cancelRequestBtn');
    const reqForm = document.getElementById('requestAccessForm');
    const reqStatus = document.getElementById('requestStatus');

    if (openReqBtn) {
      openReqBtn.addEventListener('click', () => {
        document.getElementById('loginView').hidden = true;
        document.getElementById('requestAccessView').hidden = false;
      });
    }
    if (cancelReqBtn) {
      cancelReqBtn.addEventListener('click', () => {
        document.getElementById('requestAccessView').hidden = true;
        document.getElementById('loginView').hidden = false;
      });
    }
    if (reqForm) {
      reqForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reqEmailInput').value.trim();
        const school = document.getElementById('reqSchoolSelect').value;
        const role = document.getElementById('reqRoleInput').value.trim();

        if (!email) return;
        reqStatus.textContent = 'Recording request and preparing email to cook.logan@sugarsalem.com...';

        await firebaseClient.recordAdminRequest(email, school, role);
        const mailtoUrl = buildAdminRequestMailto(email, school, role);
        window.location.href = mailtoUrl;

        reqStatus.innerHTML = 'Email client opened addressed to <strong>cook.logan@sugarsalem.com</strong> with a 1-click button for Logan to approve your access.';
      });
    }

    firebaseClient.auth().onAuthStateChanged(user => {
      // If approval view is active, don't override it
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('action') === 'approve') return;

      if (!user) {
        document.getElementById('loginView').hidden = false;
        document.getElementById('accessDeniedView').hidden = true;
        document.getElementById('dashboardView').hidden = true;
        if (document.getElementById('requestAccessView')) document.getElementById('requestAccessView').hidden = true;
        if (document.getElementById('approvalView')) document.getElementById('approvalView').hidden = true;
        populateAdminCredentials();
        return;
      }
      authorizeAndRender(user);
    });
    document.getElementById('loginForm').addEventListener('submit', signIn);
    document.getElementById('googleSignInBtn').addEventListener('click', async () => {
      const error = document.getElementById('loginError');
      error.textContent = '';
      try {
        await firebaseClient.signInWithGoogle();
      } catch (googleError) { error.textContent = googleError.message; }
    });
    document.getElementById('signOutBtn').addEventListener('click', () => firebaseClient.auth().signOut());
    document.getElementById('deniedSignOutBtn').addEventListener('click', () => firebaseClient.auth().signOut());
    document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab === button));
      renderSection(button.dataset.section);
    }));
  });

  function buildAdminRequestMailto(applicantEmail, school, role = '') {
    const targetEmail = 'cook.logan@sugarsalem.com';
    const host = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://school-project-6dd54.web.app';
    const path = window.location.pathname ? window.location.pathname.replace(/\/[^/]*$/, '/admin.html') : '/admin.html';
    const approveUrl = `${host}${path}?action=approve&email=${encodeURIComponent(applicantEmail)}&school=${encodeURIComponent(school)}`;

    const subject = `[GameDay+ Admin Request] Approve access for ${applicantEmail}`;
    const body = `GameDay+ Administrator Access Request
==================================================

Hello Logan,

An administrator access request has been submitted for GameDay+:

• Requesting Account: ${applicantEmail}
• Requested School: ${school}
${role ? '• Position / Role: ' + role + '\n' : ''}• Date & Time: ${new Date().toLocaleString()}

==================================================
ONE-CLICK APPROVAL FOR LOGAN COOK:
Press the link below to approve administrator access:

👉 APPROVE ADMIN ACCESS:
${approveUrl}

(Clicking this link opens GameDay+ and allows you to confirm approval with one click)
==================================================

Thank you,
GameDay+ System`;

    return `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function handleApprovalFlow() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const approveEmail = (urlParams.get('email') || '').trim();
    const approveSchool = urlParams.get('school') || firebaseClient.schoolId;

    if (action === 'approve' && approveEmail) {
      document.getElementById('loginView').hidden = true;
      document.getElementById('accessDeniedView').hidden = true;
      document.getElementById('dashboardView').hidden = true;
      if (document.getElementById('requestAccessView')) document.getElementById('requestAccessView').hidden = true;

      const approvalView = document.getElementById('approvalView');
      if (approvalView) {
        approvalView.hidden = false;
        document.getElementById('approvalAccountEmail').textContent = approveEmail;
        document.getElementById('approvalSchoolName').textContent = `${approveSchool.toUpperCase()} (${approveSchool})`;

        const confirmBtn = document.getElementById('confirmApproveBtn');
        const denyBtn = document.getElementById('denyApproveBtn');
        const successBox = document.getElementById('approvalSuccessBox');
        const actionsDiv = document.getElementById('approvalActions');
        const notifyBtn = document.getElementById('sendApprovalNotificationBtn');

        confirmBtn.onclick = async () => {
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Approving access...';
          try {
            await firebaseClient.approveAdminUser(approveEmail, approveSchool);
            actionsDiv.hidden = true;
            successBox.hidden = false;

            const notifySubject = `GameDay+ Admin Access Approved for ${approveSchool}`;
            const host = window.location.origin && window.location.origin !== 'null' ? window.location.origin : 'https://school-project-6dd54.web.app';
            const notifyBody = `Hello,\n\nYour request for administrator access to GameDay+ for ${approveSchool} has been approved by Logan Cook.\n\nYou can now sign in at:\n${host}/admin.html\n\nWelcome to GameDay+!`;
            notifyBtn.href = `mailto:${encodeURIComponent(approveEmail)}?subject=${encodeURIComponent(notifySubject)}&body=${encodeURIComponent(notifyBody)}`;
          } catch (err) {
            alert('Approval error: ' + err.message);
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Approve Admin Access';
          }
        };

        denyBtn.onclick = () => {
          if (confirm(`Deny admin access request for ${approveEmail}?`)) {
            window.location.href = 'admin.html';
          }
        };

        return true;
      }
    }
    return false;
  }

  window.approveReqDirectly = async (email, school) => {
    try {
      await firebaseClient.approveAdminUser(email, school);
      alert(`Admin access approved for ${email}!`);
      renderSection('overview');
    } catch (err) {
      alert('Could not approve: ' + err.message);
    }
  };

  async function signIn(event) {
    event.preventDefault();
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const error = document.getElementById('loginError');
    error.textContent = '';
    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value;
    // Super admin bypass: if email matches, skip Firebase auth
    if (emailVal.toLowerCase() === 'cook.logan@sugarsalem.com') {
      // Directly render admin dashboard without Firebase auth
      const fakeUser = { email: emailVal };
      await authorizeAndRender(fakeUser);
      return;
    }
    try {
      await firebaseClient.signInWithEmail(emailVal, passVal);
      rememberAdminCredentials(emailVal, passVal);
    } catch (authError) { error.textContent = authError.message; }
  }

  async function authorizeAndRender(user) {
    if (handleApprovalFlow()) return;

    const isAdmin = await firebaseClient.isAdminUser(user);
    if (!isAdmin) {
      document.getElementById('deniedAccountEmail').textContent = user.email || 'Unknown account';
      const school = firebaseClient.schoolId;
      const appUrl = `index.html?school=${encodeURIComponent(school)}`;
      const mailtoUrl = buildAdminRequestMailto(user.email || 'unknown', school);

      const reqBtn = document.getElementById('requestAdminAccessBtn');
      reqBtn.href = mailtoUrl;
      reqBtn.onclick = () => {
        firebaseClient.recordAdminRequest(user.email, school, 'Denied account screen');
      };

      document.getElementById('deniedPublicAppLink').href = appUrl;
      document.getElementById('loginView').hidden = true;
      document.getElementById('accessDeniedView').hidden = false;
      document.getElementById('dashboardView').hidden = true;
      if (document.getElementById('requestAccessView')) document.getElementById('requestAccessView').hidden = true;
      if (document.getElementById('approvalView')) document.getElementById('approvalView').hidden = true;
      return;
    }
    document.getElementById('loginView').hidden = true;
    document.getElementById('accessDeniedView').hidden = true;
    if (document.getElementById('requestAccessView')) document.getElementById('requestAccessView').hidden = true;
    if (document.getElementById('approvalView')) document.getElementById('approvalView').hidden = true;
    document.getElementById('dashboardView').hidden = false;
    document.getElementById('publicAppLink').href = `index.html?school=${encodeURIComponent(firebaseClient.schoolId)}`;
    renderSection('overview');
  }

  async function renderSection(section) {
    content.innerHTML = '<p class="muted">Loading...</p>';
    if (section === 'overview') return renderOverview();
    if (section === 'events') return renderEvents();
    if (section === 'settings') return renderSettings();
    return renderResources(section);
  }

  async function renderOverview() {
    try {
      const currentUser = firebaseClient.auth().currentUser;
      const userEmail = (currentUser && currentUser.email ? currentUser.email : '').toLowerCase();
      const isSuper = userEmail === 'cook.logan@sugarsalem.com';

      const [events, sports, clubs, teams] = await Promise.all(['events', 'sports', 'clubs', 'teams'].map(loadCollection));

      let superAdminHtml = '';
      if (isSuper) {
        const [approvedAdmins, pendingReqs] = await Promise.all([
          firebaseClient.getApprovedAdmins(),
          firebaseClient.getAdminRequests()
        ]);
        const pendingList = pendingReqs.filter(r => r.status === 'pending');

        superAdminHtml = `
          <div style="margin-top:28px;border-top:1px solid #d8e0ea;padding-top:20px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
              <h3 style="margin:0;">Super Administrator Management</h3>
              <span class="muted" style="font-size:0.85rem;font-weight:600;">cook.logan@sugarsalem.com</span>
            </div>
            <div class="summary-grid" style="margin-bottom:16px;">
              <div class="summary-card"><span class="muted">Pending Requests</span><strong>${pendingList.length}</strong></div>
              <div class="summary-card"><span class="muted">Approved Admins</span><strong>${approvedAdmins.length}</strong></div>
            </div>
            ${pendingList.length > 0 ? `
              <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:16px;margin-bottom:16px;">
                <h4 style="margin:0 0 10px;color:#92400e;">Pending Admin Access Requests (${pendingList.length})</h4>
                <div style="display:grid;gap:8px;">
                  ${pendingList.map(req => `
                    <div style="display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid #fef3c7;border-radius:6px;padding:10px 14px;flex-wrap:wrap;gap:8px;">
                      <div>
                        <strong>${req.email}</strong> &bull; <span class="muted">${req.schoolId || 'sugar-salem'}</span>
                        ${req.note ? `<div class="muted" style="font-size:0.8rem;">${req.note}</div>` : ''}
                      </div>
                      <button class="primary" style="background:#16a34a;border-color:#16a34a;padding:6px 14px;font-size:0.85rem;width:auto;" onclick="window.approveReqDirectly('${req.email}', '${req.schoolId || firebaseClient.schoolId}')">
                        Approve
                      </button>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : '<p class="muted" style="font-size:0.9rem;margin-bottom:16px;">No pending admin requests at this time.</p>'}
          </div>
        `;
      }

      content.innerHTML = `
        <h2>Dashboard</h2>
        <p class="muted">School: ${firebaseClient.schoolId}</p>
        <div class="summary-grid">
          ${summaryCard('Upcoming events', events.filter(event => event.date >= new Date().toISOString().slice(0, 10)).length)}
          ${summaryCard('Sports', sports.length)}
          ${summaryCard('Clubs', clubs.length)}
          ${summaryCard('Teams', teams.length)}
        </div>
        ${superAdminHtml}
      `;
    } catch (error) { showError(error); }
  }

  function summaryCard(label, value) { return `<div class="summary-card"><span class="muted">${label}</span><strong>${value}</strong></div>`; }

  async function renderEvents() {
    let events = [];
    try {
      events = await loadCollection('events');
    } catch (err) {
      console.warn('loadCollection events failed:', err);
      events = [];
    }
    const hasEvents = events.length > 0;

    content.innerHTML = `
      <div class="section-heading" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
        <div>
          <h2 style="margin:0;">Events &amp; Games (${events.length})</h2>
          <p class="muted" style="margin:4px 0 0;font-size:0.85rem;">Live Firestore collection for school: <strong>${firebaseClient.schoolId}</strong></p>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <button class="secondary" id="syncEventsBtn" title="Sync / Upload built-in schedule into Firestore">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Sync to Firestore
          </button>
          <button class="primary" id="newEventBtn">+ Add event</button>
        </div>
      </div>
      <p id="eventFeedback" class="muted" style="margin:0 0 14px;"></p>
      ${!hasEvents ? `
        <div class="panel" style="padding:24px;border:1px dashed #cbd5e1;text-align:center;margin-top:10px;">
          <h3 style="margin-top:0;">No events currently stored in Firestore</h3>
          <p class="muted" style="max-width:540px;margin:8px auto 16px;">The public app is currently using built-in fallback events. You can upload the complete schedule directly to Firestore in one click, or add events manually.</p>
          <button class="primary" id="emptySeedEventsBtn" style="width:auto;display:inline-block;padding:10px 24px;">Upload Schedule to Firestore</button>
        </div>
      ` : `
        <div class="resource-list">
          ${events.map(event => resourceRow(
            event.id,
            event.eventName || (event.sport ? `${event.sport} vs ${event.opponent || 'Opponent'}` : event.opponent),
            `${event.sport || 'Event'} · ${event.date || 'No date'} ${event.time ? 'at ' + event.time : ''} · ${event.locationType || 'Home'} · ${event.status || 'Scheduled'}`
          )).join('')}
        </div>
      `}
      <div id="eventFormSlot"></div>
    `;

    document.getElementById('newEventBtn').addEventListener('click', () => renderEventForm());

    async function triggerSync(btnEl) {
      if (!confirm('This will upload and sync all school events and games from the schedule into Firestore. Continue?')) return;
      const originalText = btnEl.innerHTML;
      btnEl.disabled = true;
      btnEl.textContent = 'Syncing to Firestore...';
      const feedback = document.getElementById('eventFeedback');
      if (feedback) feedback.textContent = 'Uploading events to Firestore, please wait...';
      try {
        const count = await firebaseClient.seedEventsToFirestore();
        if (feedback) feedback.textContent = `Successfully synced ${count} events to Firestore!`;
        await renderEvents();
      } catch (err) {
        if (feedback) feedback.textContent = `Sync failed: ${err.message}`;
        btnEl.disabled = false;
        btnEl.innerHTML = originalText;
      }
    }

    const syncBtn = document.getElementById('syncEventsBtn');
    if (syncBtn) syncBtn.addEventListener('click', () => triggerSync(syncBtn));

    const emptySeedBtn = document.getElementById('emptySeedEventsBtn');
    if (emptySeedBtn) emptySeedBtn.addEventListener('click', () => triggerSync(emptySeedBtn));

    content.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => renderEventForm(button.dataset.edit)));
    content.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteDocument('events', button.dataset.delete, 'event')));
  }

  function resourceRow(id, title, detail) { return `<div class="resource-row"><div><strong>${escapeHtml(title)}</strong><div class="muted">${escapeHtml(detail)}</div></div><div class="resource-actions"><button class="secondary" data-edit="${id}">Edit</button><button class="danger" data-delete="${id}">Delete</button></div></div>`; }

  function renderEventForm(id = '') {
    const existing = (collections.events || []).find(event => event.id === id) || {};
    document.getElementById('eventFormSlot').innerHTML = `
      <form id="eventForm" class="panel" style="padding:24px;margin-top:20px">
        <h3>${id ? 'Edit' : 'Add'} event</h3>
        <div class="form-grid">
          <label>Event name<input name="eventName" required value="${escapeAttr(existing.eventName || '')}"></label>
          <label>Sport<input name="sport" required value="${escapeAttr(existing.sport || '')}"></label>
          <label>Date<input name="date" type="date" required value="${escapeAttr(existing.date || '')}"></label>
          <label>Start time<input name="startTime" type="text" placeholder="e.g. 7:00 PM" value="${escapeAttr(existing.startTime || existing.time || '')}"></label>
          <label>End time<input name="endTime" type="text" placeholder="e.g. 9:00 PM" value="${escapeAttr(existing.endTime || '')}"></label>
          <label>Event type<select name="eventType"><option>Game</option><option>Practice</option><option>Club Meeting</option><option>Competition</option><option>Tournament</option><option>Other</option></select></label>
          <label>Status<select name="status"><option>Scheduled</option><option>Upcoming</option><option>In Progress</option><option>Final</option><option>Completed</option><option>Canceled</option><option>Postponed</option></select></label>
          <label>Level<select name="level"><option>Varsity</option><option>JV</option><option>Freshman</option><option>Club</option></select></label>
          <label>Opponent<input name="opponent" value="${escapeAttr(existing.opponent || '')}"></label>
          <label>Opponent Mascot<input name="opponentMascot" placeholder="e.g. Panthers" value="${escapeAttr(existing.opponentMascot || '')}"></label>
          <label>Home/Away<select name="locationType"><option>Home</option><option>Away</option><option>Neutral</option></select></label>
          <label>Location / Venue<input name="location" placeholder="e.g. Sugar-Salem High School" value="${escapeAttr(existing.location || existing.venueName || '')}"></label>
          <label>Address<input name="address" placeholder="e.g. #1 Digger Dr, Sugar City, ID 83448" value="${escapeAttr(existing.address || existing.venueAddress || '')}"></label>
          <label>Home / Our score<input name="homeScore" type="number" min="0" value="${escapeAttr(existing.homeScore ?? existing.ourScore ?? '')}"></label>
          <label>Away / Opponent score<input name="awayScore" type="number" min="0" value="${escapeAttr(existing.awayScore ?? existing.oppScore ?? '')}"></label>
          <label class="wide">Description<textarea name="description">${escapeHtml(existing.description || '')}</textarea></label>
        </div>
        <div class="form-actions">
          <button class="primary" type="submit">Save event to Firestore</button>
          <button type="button" class="secondary" id="cancelForm">Cancel</button>
        </div>
        <p id="formError" class="error"></p>
      </form>
    `;
    document.querySelector('[name=status]').value = existing.status || 'Scheduled';
    document.querySelector('[name=eventType]').value = existing.eventType || 'Game';
    document.querySelector('[name=locationType]').value = existing.locationType || 'Home';
    if (existing.level) document.querySelector('[name=level]').value = existing.level;
    document.getElementById('cancelForm').addEventListener('click', () => document.getElementById('eventFormSlot').replaceChildren());
    document.getElementById('eventForm').addEventListener('submit', async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.target));
      if (values.homeScore !== '') values.homeScore = Number(values.homeScore); else values.homeScore = null;
      if (values.awayScore !== '') values.awayScore = Number(values.awayScore); else values.awayScore = null;
      try {
        await saveDocument('events', id, values);
        await renderEvents();
      } catch (error) {
        document.getElementById('formError').textContent = error.message;
      }
    });
  }

  async function renderResources(section) {
    const items = await loadCollection(section);
    content.innerHTML = `<div class="section-heading"><h2>${section[0].toUpperCase() + section.slice(1)}</h2><button class="primary" id="newResourceBtn">Add ${section.slice(0, -1)}</button></div><div class="resource-list">${items.length ? items.map(item => resourceRow(item.id, item.name || item.title || item.sport, item.enabled === false ? 'Disabled' : 'Enabled')).join('') : '<p class="muted">No records yet.</p>'}</div><div id="resourceFormSlot"></div>`;
    document.getElementById('newResourceBtn').addEventListener('click', () => resourceForm(section));
    content.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => resourceForm(section, button.dataset.edit)));
    content.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteDocument(section, button.dataset.delete, section.slice(0, -1))));
  }

  function resourceForm(section, id = '') {
    const existing = (collections[section] || []).find(item => item.id === id) || {};
    document.getElementById('resourceFormSlot').innerHTML = `<form id="resourceForm" class="panel" style="padding:20px;margin-top:20px"><h3>${id ? 'Edit' : 'Add'} ${section.slice(0, -1)}</h3><label>Name<input name="name" required value="${escapeAttr(existing.name)}"></label><label><input name="enabled" type="checkbox" ${existing.enabled !== false ? 'checked' : ''}> Enabled</label><div class="form-actions"><button class="primary">Save</button><button type="button" class="secondary" id="cancelResource">Cancel</button></div></form>`;
    document.getElementById('cancelResource').addEventListener('click', () => document.getElementById('resourceFormSlot').replaceChildren());
    document.getElementById('resourceForm').addEventListener('submit', async event => { event.preventDefault(); const form = new FormData(event.target); await saveDocument(section, id, { name: form.get('name'), enabled: form.get('enabled') === 'on' }); await renderResources(section); });
  }

  async function renderSettings() {
    const snapshot = await firebaseClient.settings().get(); const settings = snapshot.exists ? snapshot.data() : {};
    content.innerHTML = `<h2>School Settings</h2><form id="settingsForm" class="form-grid"><label>School name<input name="schoolName" required value="${escapeAttr(settings.schoolName)}"></label><label>Logo URL<input name="logoUrl" type="url" value="${escapeAttr(settings.logoUrl)}"></label><label>Primary color<input name="primaryColor" type="color" value="${settings.primaryColor || '#1769aa'}"></label><label>Accent color<input name="accentColor" type="color" value="${settings.accentColor || '#f2b134'}"></label><label class="wide">Description<textarea name="description">${escapeHtml(settings.description)}</textarea></label><div class="form-actions wide"><button class="primary">Save settings</button></div><p id="settingsMessage" class="muted"></p></form>`;
    document.getElementById('settingsForm').addEventListener('submit', async event => { event.preventDefault(); await firebaseClient.settings().set(Object.fromEntries(new FormData(event.target)), { merge: true }); document.getElementById('settingsMessage').textContent = 'Settings saved.'; });
  }

  async function loadCollection(name) {
    if (name === 'events') {
      const res = await firebaseClient.loadEvents();
      collections.events = res.events;
      return res.events;
    }
    const snapshot = await firebaseClient.resources(name).get();
    collections[name] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return collections[name];
  }

  async function saveDocument(name, id, data) {
    if (name === 'events') {
      return firebaseClient.saveEvent(id, data);
    }
    const reference = id ? firebaseClient.resources(name).doc(id) : firebaseClient.resources(name).doc();
    await reference.set({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  async function deleteDocument(name, id, label) {
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
    if (name === 'events') {
      await firebaseClient.deleteEvent(id);
    } else {
      await firebaseClient.resources(name).doc(id).delete();
    }
    renderSection(name === 'events' ? 'events' : name);
  }

  function showError(error) { content.innerHTML = `<p class="error">Unable to load this section: ${escapeHtml(error.message)}</p>`; }
  function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  const escapeAttr = escapeHtml;
})();
