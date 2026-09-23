(function initSignIn() {
  const GameDayFirebase = window.GameDayFirebase;
  if (!GameDayFirebase) return;

  const params = new URLSearchParams(window.location.search);
  const school = params.get('school');
  const schoolQS = school ? `?school=${encodeURIComponent(school)}` : '';
  const homeUrl = school ? `index.html?school=${encodeURIComponent(school)}` : 'index.html';
  const adminUrl = school ? `admin.html?school=${encodeURIComponent(school)}` : 'admin.html';

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

  let mode = 'signin';
  let routing = false;

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
        signedInRole.textContent = 'Regular account &bull; schedules are public for everyone.';
      }
    });
  }

  function showAuthForm() {
    authCard.hidden = false;
    signedInCard.hidden = true;
  }

  function routeAfterAuth() {
    routing = true;
    GameDayFirebase.isAdminUser().then(isAdmin => {
      window.location.href = isAdmin ? adminUrl : homeUrl;
    }).catch(() => {
      window.location.href = homeUrl;
    });
  }

  async function handleAuth(actionPromise) {
    setBusy(true);
    showError('');
    try {
      await actionPromise;
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

  modeButtons.forEach(button => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  authForm.addEventListener('submit', event => {
    event.preventDefault();
    if (mode === 'signin') {
      handleAuth(GameDayFirebase.signInWithEmail(emailInput.value, passwordInput.value));
    } else {
      handleAuth(GameDayFirebase.createAccount(emailInput.value, passwordInput.value));
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