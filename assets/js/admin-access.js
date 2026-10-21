/**
 * GameDay+ - Admin access resolution
 *
 * Pure decision logic shared by the browser client and the unit tests. It
 * mirrors the authorization model implemented in `firestore.rules`:
 *
 *   1. Custom claims (strongest): `admin == true` grants access to every
 *      school; `schools == [...]` (or a single `school` claim) grants access
 *      to the listed schools.
 *   2. The roster (`admins/{email}`): an entry with `approved == true`. An
 *      entry with `role == "super_admin"` grants global access; any other
 *      approved entry grants access to the `schoolId` stored on it.
 *
 * Keeping the decision in one place means the client and the rules cannot
 * drift apart, and the matrix can be unit tested without a browser.
 */

const GameDayAdminAccess = (function () {
  function isClaimForSchool(claims, schoolId) {
    if (!claims) return false;
    if (claims.admin === true) return true;
    const schools = claims.schools;
    if (Array.isArray(schools) && schoolId && schools.indexOf(schoolId) !== -1) return true;
    if (typeof claims.school === 'string' && schoolId && claims.school === schoolId) return true;
    return false;
  }

  function isApprovedRoster(roster) {
    return !!(roster && roster.approved === true);
  }

  /**
   * @param {object} options
   * @param {object} [options.claims]  ID token claims (admin, schools, school).
   * @param {object} [options.roster]  The account's own `admins/{email}` document.
   * @param {string} [options.schoolId] The school being checked.
   */
  function resolveAccess(options) {
    const opts = options || {};
    const claims = opts.claims || {};
    const roster = opts.roster || null;
    const schoolId = opts.schoolId || '';

    const claimGlobal = claims.admin === true;
    const claimSchool = isClaimForSchool(claims, schoolId);
    const rosterApproved = isApprovedRoster(roster);
    const rosterGlobal = rosterApproved && roster.role === 'super_admin';
    const rosterSchool = rosterApproved && !!roster.schoolId;

    const isGlobal = claimGlobal || rosterGlobal;
    const isAdmin = isGlobal
      || claimSchool
      || (rosterSchool && roster.schoolId === schoolId);

    return {
      isAdmin,
      isGlobal,
      // Only a global administrator may approve or reject other accounts.
      canApprove: isGlobal,
      role: rosterApproved ? (roster.role || 'admin') : '',
      schoolId: rosterApproved ? (roster.schoolId || '') : '',
      viaClaim: claimGlobal || claimSchool,
      viaRoster: rosterApproved && (rosterGlobal || roster.schoolId === schoolId)
    };
  }

  return {
    resolveAccess,
    isClaimForSchool,
    isApprovedRoster
  };
})();

if (typeof window !== 'undefined') window.GameDayAdminAccess = GameDayAdminAccess;
if (typeof module !== 'undefined' && module.exports) module.exports = GameDayAdminAccess;
