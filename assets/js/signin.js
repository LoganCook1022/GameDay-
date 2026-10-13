(function initSignIn() {
  const GameDayFirebase = window.GameDayFirebase;
  if (!GameDayFirebase) return;

  const params = new URLSearchParams(window.location.search);
  const school = params.get('school');
  const homeUrl = school ? `index.html?school=${encodeURIComponent(school)}` : 'index.html';
  const adminUrl = school ? `admin.html?school=${encodeURIComponent(school)}` : 'admin.html';
  const adminSignInLink = document.getElementById('adminSignInLink');
  if (adminSignInLink) {
    adminSignInLink.addEventListener('click', () => {
      window.location.href = adminUrl;
    });
  }

  const authCard = document.getElementById('authCard');
  const signedInCard = document.getElementById('signedInCard');
  const authForm = document.getElementById('authForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const authError = document.getElementById('authError');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const googleBtn = document.getElementById('googleBtn');
  const signedInEmail = document.getElementById('signedInEmail');
  const signedInRole = document.getElementById('signedInRole');
  const userAvatar = document.getElementById('userAvatar');
  const continueBtn = document.getElementById('continueBtn');
  const adminDashboardLink = document.getElementById('adminDashboardLink');
  const requestAdminLink = document.getElementById('requestAdminLink');
  const signOutBtn = document.getElementById('signOutBtn');

  const rememberMeCheckbox = document.getElementById('rememberMeCheckbox');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');
  const savedAccountsBar = document.getElementById('savedAccountsBar');
  const savedAccountsList = document.getElementById('savedAccountsList');
  const savedEmailsList = document.getElementById('savedEmailsList');

  const credentials = window.GameDayCredentials;

  let routing = false;

  function rememberAccount(email) {
    if (!email) return;
    const shouldRemember = rememberMeCheckbox ? rememberMeCheckbox.checked : true;
    credentials.rememberEmail(email, shouldRemember);
  }

  function forgetAccount(email) {
    if (!email) return;
    credentials.forget(email);
    populateSavedCredentials();
  }

  function populateSavedCredentials() {
    const store = credentials.getStore();
    if (rememberMeCheckbox) {
      rememberMeCheckbox.checked = store.remember !== false;
    }

    const accountKeys = Object.keys(store.accounts || {});

    // Update datalist for autofill (email only)
    if (savedEmailsList) {
      savedEmailsList.innerHTML = '';
      accountKeys.forEach(k => {
        const acc = store.accounts[k];
        const opt = document.createElement('option');
        opt.value = acc.email;
        savedEmailsList.appendChild(opt);
      });
    }

    // Render chips
    renderSavedAccountsChips(store);

    // Pre-fill the remembered email only. Passwords are never stored.
    if (store.remember !== false && accountKeys.length > 0) {
      const active = credentials.getActiveAccount(store);
      if (active && !emailInput.value) emailInput.value = active.email;
    }
  }

  function renderSavedAccountsChips(store) {
    if (!savedAccountsBar || !savedAccountsList) return;
    const accountKeys = Object.keys(store.accounts || {});
    if (accountKeys.length === 0) {
      savedAccountsBar.hidden = true;
      savedAccountsList.innerHTML = '';
      return;
    }

    savedAccountsBar.hidden = false;
    savedAccountsList.innerHTML = '';
    const currentKey = emailInput.value.trim().toLowerCase();

    accountKeys.forEach(key => {
      const acc = store.accounts[key];
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'saved-account-chip' + (key === currentKey ? ' active' : '');
      chip.dataset.key = key;

      const label = document.createElement('span');
      label.textContent = acc.email;
      chip.appendChild(label);

      const removeBtn = document.createElement('span');
      removeBtn.className = 'saved-account-remove';
      removeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
      removeBtn.title = 'Remove saved account';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (emailInput.value.trim().toLowerCase() === key) {
          emailInput.value = '';
          passwordInput.value = '';
        }
        forgetAccount(acc.email);
      });
      chip.appendChild(removeBtn);

      chip.addEventListener('click', () => {
        emailInput.value = acc.email;
        passwordInput.value = '';
        passwordInput.focus();
        credentials.rememberEmail(acc.email, true);
        renderSavedAccountsChips(credentials.getStore());
      });

      savedAccountsList.appendChild(chip);
    });
  }

  function applyTheme() {
    const saved = localStorage.getItem('gameday_theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }

  function setBusy(busy) {
    authSubmitBtn.disabled = busy;
    googleBtn.disabled = busy;
  }

  function showError(message) {
    authError.textContent = message;
  }

  function showSignedIn(user) {
    authCard.hidden = true;
    signedInCard.hidden = false;
    signedInEmail.textContent = user.email || user.displayName || 'Signed in';
    const initials = (user.displayName || user.email || 'G')
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase();
    userAvatar.textContent = initials || 'G';
    signedInRole.textContent = '';
    adminDashboardLink.hidden = true;
    continueBtn.href = homeUrl;

    GameDayFirebase.isAdminUser(user).then(isAdmin => {
      if (isAdmin) {
        signedInRole.textContent = 'You have administrator access for your school.';
        adminDashboardLink.href = adminUrl;
        adminDashboardLink.hidden = false;
        if (requestAdminLink) requestAdminLink.hidden = true;
      } else {
        signedInRole.textContent = 'Regular account • schedules are public for everyone.';
        adminDashboardLink.hidden = true;
        if (requestAdminLink) {
          requestAdminLink.href = adminUrl;
          requestAdminLink.hidden = false;
        }
      }
    });
  }

  function showAuthForm() {
    authCard.hidden = false;
    signedInCard.hidden = true;
    populateSavedCredentials();
  }

  function routeAfterAuth() {
    routing = true;
    window.location.href = homeUrl;
  }

  async function handleAuth(actionPromise, emailToRemember) {
    setBusy(true);
    showError('');
    try {
      await actionPromise;
      if (emailToRemember) {
        rememberAccount(emailToRemember);
      }
      routeAfterAuth();
    } catch (error) {
      showError(friendlyAuthError(error));
      setBusy(false);
    }
  }

  function friendlyAuthError(error) {
    const code = error.code || '';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Incorrect email or password.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a moment and try again.';
    return error.message || 'Something went wrong. Please try again.';
  }

  if (!GameDayFirebase.isConfigured()) {
    showError('Firebase is not configured. Add your project settings to firebase-config.js.');
    authSubmitBtn.disabled = true;
    googleBtn.disabled = true;
  }

  applyTheme();

  // Populate remembered email on load
  populateSavedCredentials();

  // Refresh saved-account chips as the user types
  emailInput.addEventListener('input', () => {
    const store = credentials.getStore();
    renderSavedAccountsChips(store);
  });

  // Toggle password visibility
  if (togglePasswordBtn && togglePasswordIcon) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPass = passwordInput.type === 'password';
      passwordInput.type = isPass ? 'text' : 'password';
      togglePasswordIcon.className = isPass ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye';
      togglePasswordBtn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
    });
  }

  // Handle remember email toggle (email only — passwords are never stored)
  if (rememberMeCheckbox) {
    rememberMeCheckbox.addEventListener('change', () => {
      if (rememberMeCheckbox.checked) {
        const email = emailInput.value.trim();
        if (email) credentials.rememberEmail(email, true);
      } else {
        credentials.setRemember(false);
      }
      populateSavedCredentials();
    });
  }

  authForm.addEventListener('submit', event => {
    event.preventDefault();
    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value;
    handleAuth(GameDayFirebase.signInWithEmail(emailVal, passVal), emailVal);
  });

  googleBtn.addEventListener('click', () => {
    handleAuth(GameDayFirebase.signInWithGoogle());
  });

  signOutBtn.addEventListener('click', async () => {
    await GameDayFirebase.signOut();
    showAuthForm();
  });

  GameDayFirebase.onAuthStateChanged(user => {
    if (routing) return;
    if (user) {
      showSignedIn(user);
    } else {
      showAuthForm();
    }
  });
})();