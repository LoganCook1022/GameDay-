const firebase = require('firebase/compat/app');
require('firebase/compat/auth');
require('firebase/compat/firestore');

const config = {
  apiKey: 'AIzaSyCK7SSWZR9qovEPry2xYZ9MiRur7sS4Buw',
  authDomain: 'school-project-6dd54.firebaseapp.com',
  projectId: 'school-project-6dd54',
  storageBucket: 'school-project-6dd54.appspot.com',
  messagingSenderId: '1063355019441',
  appId: '1:1063355019441:web:bd1c06d722202e7d033290'
};

firebase.initializeApp(config);

(async () => {
  try {
    const cred = await firebase.auth().signInWithEmailAndPassword('cook.logan@sugarsalem.com', 'GameDaySuperAdmin!');
    console.log('✅ Signed in as', cred.user.email);
    const isAdmin = await (async () => {
      const email = cred.user.email.toLowerCase();
      if (email === 'cook.logan@sugarsalem.com') return true;
      const tokenResult = await cred.user.getIdTokenResult();
      if (tokenResult.claims && tokenResult.claims.admin) return true;
      return false;
    })();
    console.log('Is admin?', isAdmin);
  } catch (e) {
    console.error('❌ Sign‑in error:', e.code, e.message);
  }
})();
