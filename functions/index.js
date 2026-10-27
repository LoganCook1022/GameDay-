// Firebase Functions entry point for setting admin custom claims
// Deploy with: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Callable HTTPS function to grant or revoke admin rights.
 * Expects data: { email: string, grant: boolean }
 * Caller must be an existing admin (has custom claim admin:true).
 */
exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Verify caller authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Request not authenticated');
  }
  const callerClaims = context.auth.token;
  if (!callerClaims.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can set admin claims');
  }

  const email = data.email;
  const grant = !!data.grant;
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required');
  }

  try {
    const user = await admin.auth().getUserByEmail(email);
    const newClaims = { ...(user.customClaims || {}), admin: grant };
    if (!grant) delete newClaims.admin;
    await admin.auth().setCustomUserClaims(user.uid, newClaims);
    return { result: grant ? 'admin granted' : 'admin revoked', uid: user.uid };
  } catch (error) {
    throw new functions.https.HttpsError('unknown', error.message, error);
  }
});
