(function initSignIn() {
  const GameDayFirebase = window.GameDayFirebase;
  if (!GameDayFirebase) return;

  const params = new URLSearchParams(window.location.search);
  const school = params.get('school');
  const homeUrl = school ? `index.html?school=${encodeURIComponent(school)}` : 'index.html';
  const adminUrl = school ? `admin.html?school=${encodeURIComponent(school)}` : 'admin.html';
  const adminSignInLink = document.getElementById('adminSignInLink');
  if (adminSignInLink) adminSignInLink.href = adminUrl;

  const authCard = document.getElementById('authCard');
  const signedInCard = document.getElementById('signedInCard');
  const authForm = document.getElementById('authForm');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const authError = document.getElementById('authError');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const googleBtn = document.getElementById('googleBtn');
  const modeButtons = document.querySelectorAll('.auth-mode-btn');
  const signedInEmail = document.getElementById('signedInEmail');
  const signedInRole = document.getElementById('signedInRole');
  const userAvatar = document.getElementById('userAvatar');
  const continueBtn = document.getElementById('continueBtn');
  const adminDashboardLink = document.getElementById('adminDashboardLink');
  const signOutBtn = document.getElementById('signOutBtn');

  const rememberMeCheckbox = document.getElementById('rememberMeCheckbox');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const togglePasswordIcon = document.getElementById('togglePasswordIcon');
  const savedAccountsBar = document.getElementById('savedAccountsBar');
  const savedAccountsList = document.getElementById('savedAccountsList');
  const savedEmailsList = document.getElementById('savedEmailsList');

  const STORAGE_KEY = 'gameday_saved_credentials';
  const LEGACY_EMAIL_KEY = 'gameday_remember_email';
  const LEGACY_PASS_KEY = 'gameday_remember_password';
  const LEGACY_REMEMBER_KEY = 'gameday_remember_me';

  let mode = 'signin';
  let routing = false;

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

  function rememberAccount(email, password) {
    if (!email) return;
    const key = email.trim().toLowerCase();
    const store = getSavedStore();
    if (rememberMeCheckbox ? rememberMeCheckbox.checked : true) {
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

  function forgetAccount(email) {
    if (!email) return;
    const key = email.trim().toLowerCase();
    const store = getSavedStore();
    delete store.accounts[key];
    if (store.lastUsed === key) {
      const remaining = Object.keys(store.accounts);
      store.lastUsed = remaining.length ? remaining[0] : '';
    }
    saveStore(store);
    populateSavedCredentials();
  }

  function populateSavedCredentials() {
    const store = getSavedStore();
    if (rememberMeCheckbox) {
      rememberMeCheckbox.checked = store.remember !== false;
    }

    const accountKeys = Object.keys(store.accounts || {});

    // Update datalist for autofill
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

    // Pre-fill active account if in signin mode and inputs are blank
    if (mode === 'signin' && store.remember !== false && accountKeys.length > 0) {
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

  function renderSavedAccountsChips(store) {
    if (!savedAccountsBar || !savedAccountsList) return;
    const accountKeys = Object.keys(store.accounts || {});
    if (accountKeys.length === 0 || mode === 'create') {
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
        passwordInput.value = acc.password;
        store.lastUsed = key;
        saveStore(store);
        renderSavedAccountsChips(store);
      });

      savedAccountsList.appendChild(chip);
    });
  }

  function applyTheme() {
    const saved = localStorage.getItem('gameday_theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }

  function setMode(nextMode) {
    mode = nextMode;
    modeButtons.forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
    authSubmitBtn.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
    passwordInput.autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
    authError.textContent = '';

    if (mode === 'create') {
      passwordInput.value = '';
      if (savedAccountsBar) savedAccountsBar.hidden = true;
    } else {
      populateSavedCredentials();
    }
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
      } else {
        signedInRole.textContent = 'Regular account • schedules are public for everyone.';
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

  async function handleAuth(actionPromise, emailToRemember, passwordToRemember) {
    setBusy(true);
    showError('');
    try {
      await actionPromise;
      if (emailToRemember) {
        rememberAccount(emailToRemember, passwordToRemember);
      }
      routeAfterAuth();
    } catch (error) {
      showError(friendlyAuthError(error));
      setBusy(false);
    }
  }

  function friendlyAuthError(error) {
    const code = error.code || '';
    if (code === 'auth/email-already-in-use') return 'An account already exists for this email. Try signing in instead.';
    if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
    if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
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

  // Populate remembered email/password on load
  populateSavedCredentials();

  // Sync password when email input matches a saved account
  emailInput.addEventListener('input', () => {
    const key = emailInput.value.trim().toLowerCase();
    const store = getSavedStore();
    if (store.accounts && store.accounts[key]) {
      passwordInput.value = store.accounts[key].password;
    }
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

  // Handle remember me toggle
  if (rememberMeCheckbox) {
    rememberMeCheckbox.addEventListener('change', () => {
      const store = getSavedStore();
      store.remember = rememberMeCheckbox.checked;
      if (!store.remember) {
        const key = emailInput.value.trim().toLowerCase();
        if (key && store.accounts[key]) {
          delete store.accounts[key];
        }
      } else if (emailInput.value.trim() && passwordInput.value) {
        const key = emailInput.value.trim().toLowerCase();
        store.lastUsed = key;
        store.accounts[key] = {
          email: emailInput.value.trim(),
          password: passwordInput.value,
          savedAt: Date.now()
        };
      }
      saveStore(store);
    });
  }

  modeButtons.forEach(button => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  authForm.addEventListener('submit', event => {
    event.preventDefault();
    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value;
    if (mode === 'signin') {
      handleAuth(GameDayFirebase.signInWithEmail(emailVal, passVal), emailVal, passVal);
    } else {
      handleAuth(GameDayFirebase.createAccount(emailVal, passVal), emailVal, passVal);
    }
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