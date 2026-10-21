'use strict';

/**
 * GameDay+ - Firestore access layer for the background services.
 *
 * Two transports, one interface:
 *   - firebase-admin  (when a service account key is available)
 *   - Firestore REST  (using the Firebase CLI OAuth token, so the CLI login
 *                      is enough to run a sync)
 *
 * Every write is a *merge* of the supplied top-level fields, which is what
 * keeps admin-owned data (scores, stats, manual overrides) intact when a feed
 * or a seed touches a document.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const FIREBASE_TOOLS_CLIENT_ID = process.env.FIREBASE_CLIENT_ID
  || '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_TOOLS_CLIENT_SECRET = process.env.FIREBASE_CLIENT_SECRET
  || 'j9iVZfS8kkCEFUPaAeJV0sAi';

function requestJson(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        let parsed = {};
        try {
          parsed = body ? JSON.parse(body) : {};
        } catch (_) {
          parsed = { error: { message: body.slice(0, 400) } };
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
        } else {
          const message = (parsed.error && parsed.error.message) || `HTTP ${res.statusCode}`;
          const error = new Error(message);
          error.statusCode = res.statusCode;
          error.body = body;
          reject(error);
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function readCliTokens() {
  const configPath = path.join(process.env.USERPROFILE || '', '.config', 'configstore', 'firebase-tools.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI configuration not found. Run "firebase login" first.');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.tokens || {};
}

function refreshAccessToken(refreshToken) {
  const body = JSON.stringify({
    client_id: FIREBASE_TOOLS_CLIENT_ID,
    client_secret: FIREBASE_TOOLS_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  });

  return requestJson('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    },
    body
  }).then(result => result.access_token);
}

function tokenIsFresh(tokens) {
  if (!tokens.access_token) return false;
  if (!tokens.expires_at) return true;
  return new Date(tokens.expires_at).getTime() > Date.now() + 60000;
}

/** Returns a usable OAuth access token, refreshing it when it has expired. */
async function getAccessToken() {
  const tokens = readCliTokens();
  if (tokenIsFresh(tokens)) return tokens.access_token;
  if (!tokens.refresh_token) {
    throw new Error('Firebase CLI token is expired. Run "firebase login" to refresh it.');
  }
  const refreshed = await refreshAccessToken(tokens.refresh_token);
  tokens.access_token = refreshed;
  tokens.expires_at = Date.now() + 3600000;
  const configPath = path.join(process.env.USERPROFILE || '', '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config.tokens = tokens;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return refreshed;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === 'string') return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  if (typeof value === 'object') {
    const fields = {};
    Object.entries(value).forEach(([key, item]) => {
      if (item !== undefined) fields[key] = toFirestoreValue(item);
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function toFirestoreFields(obj) {
  const fields = {};
  Object.entries(obj || {}).forEach(([key, value]) => {
    if (value !== undefined) fields[key] = toFirestoreValue(value);
  });
  return fields;
}

function fromFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) {
    return ((value.arrayValue && value.arrayValue.values) || []).map(fromFirestoreValue);
  }
  if ('mapValue' in value) {
    return fromFirestoreFields((value.mapValue && value.mapValue.fields) || {});
  }
  return null;
}

function fromFirestoreFields(fields) {
  const output = {};
  Object.entries(fields || {}).forEach(([key, value]) => {
    output[key] = fromFirestoreValue(value);
  });
  return output;
}

function docIdFromName(name) {
  return String(name).split('/').pop();
}

function createRestTransport(projectId) {
  let cachedToken = null;

  async function token() {
    if (!cachedToken) cachedToken = await getAccessToken();
    return cachedToken;
  }

  async function call(method, urlPath, body) {
    const accessToken = await token();
    const bodyText = body ? JSON.stringify(body) : null;
    try {
      return await requestJson(`https://firestore.googleapis.com/v1/${urlPath}`, {
        method,
        headers: Object.assign(
          { 'Authorization': `Bearer ${accessToken}` },
          bodyText
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyText) }
            : {}
        ),
        body: bodyText
      });
    } catch (error) {
      if (error.statusCode === 401) {
        cachedToken = null;
        const refreshed = await token();
        return requestJson(`https://firestore.googleapis.com/v1/${urlPath}`, {
          method,
          headers: Object.assign(
            { 'Authorization': `Bearer ${refreshed}` },
            bodyText
              ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyText) }
              : {}
          ),
          body: bodyText
        });
      }
      throw error;
    }
  }

  const root = `projects/${projectId}/databases/(default)/documents`;

  return {
    mode: 'rest',
    async getDoc(docPath) {
      try {
        const doc = await call('GET', `${root}/${docPath}`);
        return { exists: true, data: fromFirestoreFields(doc.fields) };
      } catch (error) {
        if (error.statusCode === 404) return { exists: false, data: null };
        throw error;
      }
    },
    async listDocs(collectionPath) {
      const docs = [];
      let pageToken = null;
      do {
        const query = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}&pageSize=500` : '?pageSize=500';
        const result = await call('GET', `${root}/${collectionPath}${query}`);
        (result.documents || []).forEach(doc => {
          docs.push({ id: docIdFromName(doc.name), data: fromFirestoreFields(doc.fields) });
        });
        pageToken = result.nextPageToken || null;
      } while (pageToken);
      return docs;
    },
    async commit(writes) {
      if (!writes.length) return { written: 0 };
      const body = {
        writes: writes.map(write => ({
          update: {
            name: `projects/${projectId}/databases/(default)/documents/${write.path}`,
            fields: toFirestoreFields(write.fields),
            updateMask: { fieldPaths: Object.keys(write.fields) }
          }
        }))
      };
      await call('POST', `projects/${projectId}/databases/(default)/documents:commit`, body);
      return { written: writes.length };
    }
  };
}

function createAdminTransport(projectId, serviceAccountPath) {
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');

  const app = initializeApp({ credential: cert(serviceAccountPath), projectId });
  const db = getFirestore(app);

  function plain(doc) {
    const data = doc.data();
    const output = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value && typeof value.toDate === 'function') output[key] = value.toDate().toISOString();
      else output[key] = value;
    });
    return output;
  }

  return {
    mode: 'firebase-admin',
    async getDoc(docPath) {
      const snapshot = await db.doc(docPath).get();
      return snapshot.exists ? { exists: true, data: plain(snapshot) } : { exists: false, data: null };
    },
    async listDocs(collectionPath) {
      const snapshot = await db.collection(collectionPath).get();
      return snapshot.docs.map(doc => ({ id: doc.id, data: plain(doc) }));
    },
    async commit(writes) {
      if (!writes.length) return { written: 0 };
      let batch = db.batch();
      let size = 0;
      for (const write of writes) {
        batch.set(db.doc(write.path), write.fields, { merge: true });
        size += 1;
        if (size >= 400) {
          await batch.commit();
          batch = db.batch();
          size = 0;
        }
      }
      if (size > 0) await batch.commit();
      return { written: writes.length };
    }
  };
}

/**
 * Creates a Firestore client. Uses firebase-admin when a service account key
 * is configured, otherwise falls back to the Firebase CLI OAuth token.
 */
function createFirestoreClient(options) {
  const opts = options || {};
  const projectId = opts.projectId || process.env.FIREBASE_PROJECT_ID || 'school-project-6dd54';
  const serviceAccountPath = opts.serviceAccountPath
    || process.env.FIREBASE_SERVICE_ACCOUNT
    || process.env.GOOGLE_APPLICATION_CREDENTIALS
    || '';

  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    return Promise.resolve(createAdminTransport(projectId, path.resolve(serviceAccountPath)));
  }

  return Promise.resolve(createRestTransport(projectId));
}

module.exports = {
  createFirestoreClient,
  getAccessToken,
  toFirestoreValue,
  toFirestoreFields,
  fromFirestoreValue,
  fromFirestoreFields
};
