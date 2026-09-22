const AdminApp = (() => {
  const firebaseClient = window.GameDayFirebase;
  const content = document.getElementById('adminContent');
  let collections = {};

  document.addEventListener('DOMContentLoaded', () => {
    if (!firebaseClient.isConfigured()) {
      document.getElementById('loginError').textContent = 'Firebase is not configured. Add your project settings to firebase-config.js.';
      document.querySelector('#loginForm button').disabled = true;
      return;
    }
    firebaseClient.auth().onAuthStateChanged(user => {
      document.getElementById('loginView').hidden = Boolean(user);
      document.getElementById('dashboardView').hidden = !user;
      if (user) renderSection('overview');
    });
    document.getElementById('loginForm').addEventListener('submit', signIn);
    document.getElementById('signOutBtn').addEventListener('click', () => firebaseClient.auth().signOut());
    document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.toggle('active', tab === button));
      renderSection(button.dataset.section);
    }));
  });

  async function signIn(event) {
    event.preventDefault();
    const error = document.getElementById('loginError');
    error.textContent = '';
    try {
      await firebaseClient.auth().signInWithEmailAndPassword(emailInput.value, passwordInput.value);
    } catch (authError) { error.textContent = authError.message; }
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
      const [events, sports, clubs, teams] = await Promise.all(['events', 'sports', 'clubs', 'teams'].map(loadCollection));
      content.innerHTML = `<h2>Dashboard</h2><p class="muted">School: ${firebaseClient.schoolId}</p><div class="summary-grid">${summaryCard('Upcoming events', events.filter(event => event.date >= new Date().toISOString().slice(0, 10)).length)}${summaryCard('Sports', sports.length)}${summaryCard('Clubs', clubs.length)}${summaryCard('Teams', teams.length)}</div>`;
    } catch (error) { showError(error); }
  }

  function summaryCard(label, value) { return `<div class="summary-card"><span class="muted">${label}</span><strong>${value}</strong></div>`; }

  async function renderEvents() {
    const events = await loadCollection('events');
    content.innerHTML = `<div class="section-heading"><h2>Events</h2><button class="primary" id="newEventBtn">Add event</button></div><div class="resource-list">${events.length ? events.map(event => resourceRow(event.id, event.eventName || event.opponent || event.sport, `${event.date || 'No date'} · ${event.status || 'Scheduled'}`)).join('') : '<p class="muted">No events yet.</p>'}</div><div id="eventFormSlot"></div>`;
    document.getElementById('newEventBtn').addEventListener('click', () => renderEventForm());
    content.querySelectorAll('[data-edit]').forEach(button => button.addEventListener('click', () => renderEventForm(button.dataset.edit)));
    content.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', () => deleteDocument('events', button.dataset.delete, 'event')));
  }

  function resourceRow(id, title, detail) { return `<div class="resource-row"><div><strong>${escapeHtml(title)}</strong><div class="muted">${escapeHtml(detail)}</div></div><div class="resource-actions"><button class="secondary" data-edit="${id}">Edit</button><button class="danger" data-delete="${id}">Delete</button></div></div>`; }

  function renderEventForm(id = '') {
    const existing = (collections.events || []).find(event => event.id === id) || {};
    document.getElementById('eventFormSlot').innerHTML = `<form id="eventForm" class="panel" style="padding:20px;margin-top:20px"><h3>${id ? 'Edit' : 'Add'} event</h3><div class="form-grid"><label>Event name<input name="eventName" required value="${escapeAttr(existing.eventName)}"></label><label>Sport<input name="sport" required value="${escapeAttr(existing.sport)}"></label><label>Date<input name="date" type="date" required value="${escapeAttr(existing.date)}"></label><label>Start time<input name="startTime" type="time" value="${escapeAttr(existing.startTime || existing.time)}"></label><label>Event type<select name="eventType"><option>Game</option><option>Practice</option><option>Club Meeting</option><option>Competition</option><option>Tournament</option><option>Other</option></select></label><label>Status<select name="status"><option>Scheduled</option><option>Completed</option><option>Canceled</option><option>Postponed</option></select></label><label>Home team<input name="homeTeam" value="${escapeAttr(existing.homeTeam)}"></label><label>Away team<input name="awayTeam" value="${escapeAttr(existing.awayTeam)}"></label><label>Opponent<input name="opponent" value="${escapeAttr(existing.opponent)}"></label><label>Home/Away<select name="locationType"><option>Home</option><option>Away</option></select></label><label>Location<input name="location" value="${escapeAttr(existing.location || existing.venueName)}"></label><label>Address<input name="address" value="${escapeAttr(existing.address || existing.venueAddress)}"></label><label>Home score<input name="homeScore" type="number" min="0" value="${escapeAttr(existing.homeScore ?? existing.ourScore)}"></label><label>Away score<input name="awayScore" type="number" min="0" value="${escapeAttr(existing.awayScore ?? existing.oppScore)}"></label><label class="wide">Description<textarea name="description">${escapeHtml(existing.description)}</textarea></label></div><div class="form-actions"><button class="primary" type="submit">Save event</button><button type="button" class="secondary" id="cancelForm">Cancel</button></div><p id="formError" class="error"></p></form>`;
    document.querySelector('[name=status]').value = existing.status || 'Scheduled';
    document.querySelector('[name=eventType]').value = existing.eventType || 'Game';
    document.querySelector('[name=locationType]').value = existing.locationType || 'Home';
    document.getElementById('cancelForm').addEventListener('click', () => document.getElementById('eventFormSlot').replaceChildren());
    document.getElementById('eventForm').addEventListener('submit', async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(event.target));
      if (values.homeScore !== '') values.homeScore = Number(values.homeScore);
      if (values.awayScore !== '') values.awayScore = Number(values.awayScore);
      try { await saveDocument('events', id, values); await renderEvents(); } catch (error) { document.getElementById('formError').textContent = error.message; }
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

  async function loadCollection(name) { const snapshot = await firebaseClient.resources(name).get(); collections[name] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); return collections[name]; }
  async function saveDocument(name, id, data) { const reference = id ? firebaseClient.resources(name).doc(id) : firebaseClient.resources(name).doc(); await reference.set({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); }
  async function deleteDocument(name, id, label) { if (!confirm(`Delete this ${label}? This cannot be undone.`)) return; await firebaseClient.resources(name).doc(id).delete(); renderSection(name === 'events' ? 'events' : name); }
  function showError(error) { content.innerHTML = `<p class="error">Unable to load this section: ${escapeHtml(error.message)}</p>`; }
  function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  const escapeAttr = escapeHtml;
})();
