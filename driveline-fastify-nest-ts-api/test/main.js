import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter } from 'k6/metrics';
import { VU_COUNT, DURATION, THRESHOLDS, BASE_URL, baseHeaders, authHeaders, STAGGER_START_SECONDS } from './secureConst.js';
import { newUser, makeShortsPayload, makeFixServicePayload, makeCoursePayload } from './data.js';

const SIGN_KEY = __ENV.SIGN_KEY || 'k6-sign-key';
export const options = {
  vus: VU_COUNT,
  duration: DURATION,
  thresholds: THRESHOLDS,
};


const errors = new Counter('errors');
const auth_errors = new Counter('auth_errors');
const business_logic_errors = new Counter('business_logic_errors');

function safeJson(res) {
  try {
    return res.json();
  } catch (e) {
    return {};
  }
}

function truncateStr(s, n = 1000) {
  if (s == null) return '';
  const str = String(s);
  return str.length > n ? str.slice(0, n) + '... [truncated]' : str;
}

function logResp(label, res) {
  try {
    const bodyText = res && typeof res.body !== 'undefined' ? res.body : '';
    let formatted = '';
    try {
      formatted = JSON.stringify(JSON.parse(bodyText), null, 2);
    } catch (e) {
      formatted = bodyText;
    }

    // Request info if available
    let reqInfo = '';
    try {
      const req = res && res.request ? res.request : undefined;
      if (req) {
        const method = req.method || '';
        const url = req.url || '';
        const reqBody = typeof req.body !== 'undefined' ? truncateStr(req.body, 500) : '';
        reqInfo = ` req=${method} ${url} reqBody=${reqBody}`;
      }
    } catch (e) {
      reqInfo = '';
    }

    // Error info if available (transport-level errors may not have body)
    const errInfo = (res && (res.error || res.error_code)) ? ` error=${res.error || res.error_code}` : '';

    console.log(`[k6][${label}] status=${res && res.status}${errInfo}${reqInfo} body=${truncateStr(formatted, 1000)}`);
  } catch (e) {
    console.log(`[k6][${label}] failed to log response: ${e}`);
  }
}

function checkAndLog(label, res, checks) {
  const ok = check(res, checks);
  if (!ok) {
    try {
      logResp(label, res);
    } catch (e) {
      console.log(`[k6][${label}] failed to log response: ${e}`);
    }
  }
  return ok;
}

function randomIPv4() {
  return Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 256)
  ).join('.');
}

export default function () {
  // Stagger VU start to avoid simultaneous requests (jitter in seconds)
  if (STAGGER_START_SECONDS && STAGGER_START_SECONDS > 0) {
    const jitter = Math.random() * STAGGER_START_SECONDS;
    sleep(0.1);
  }
  const ipAddress = randomIPv4();
  const base = baseHeaders(ipAddress);
  let iterationOk = true;
  // 1) Register
  group('auth: register -> login', () => {
    const user = newUser();
    const regRes = http.post(`${BASE_URL}/auth/register`, JSON.stringify(user), { headers: base });
    const regOk = checkAndLog('register', regRes, {
      'register status 201|200': (r) => r.status === 201 || r.status === 200,
    });
    if (!regOk) { errors.add(1); iterationOk = false; }
    sleep(0.1);


    // 2) Login (requires sign-key header)
    const loginBody = { email: user.email, password: user.password };
    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify(loginBody), { headers: base });
    const loginJson = safeJson(loginRes);
    const loginOk = checkAndLog('login', loginRes, {
      'login status 201|200': (r) => (r.status === 201 || r.status === 200) && !!loginJson.token,
      'login returns id': (r) => !!loginJson.id || (!!loginJson.user && (loginJson.user._id || loginJson.user.id)),
    });
    if (!loginOk) { errors.add(1); auth_errors.add(1); iterationOk = false; }

    const token = loginJson.token;
    const userId = loginJson.id || (loginJson.user && (loginJson.user._id || loginJson.user.id));
    if (!token || !userId) {
      console.log('[k6] aborting iteration - missing token or userId after login');
      logResp('login', loginRes);
      iterationOk = false;
      return;
    }

    const authHdrs = (extra = {}) => ({ headers: { ...base, ...authHeaders(token, userId), ...extra } });

    sleep(0.1);

    // 3) Patch Update User
    group('user: patch update', () => {
      const patchRes = http.patch(`${BASE_URL}/users/identify/${userId}`, JSON.stringify(user), authHdrs({ 'user-id': userId }));
      const patchOk = checkAndLog('patch-update', patchRes, {
        'patch status 200': (r) => r.status === 200 || r.status === 204,
      });
      if (!patchOk) { errors.add(1); business_logic_errors.add(1); iterationOk = false; }
      sleep(0.1);
    });

    // 4) createShortsVideo
    group('shorts: create & fetch', () => {
      const shortsPayload = makeShortsPayload();
      const createShortRes = http.post(`${BASE_URL}/video/shorts`, JSON.stringify(shortsPayload), authHdrs({ 'user-id': userId }));
      const createShortJson = safeJson(createShortRes);
      const shortOk = checkAndLog('create-short', createShortRes, {
        'create short status 201|200': (r) => r.status === 201 || r.status === 200,
      });
      if (!shortOk) { errors.add(1); business_logic_errors.add(1); iterationOk = false; }
      sleep(0.1);

      // 7) getLastShorts
      const latestRes = http.get(`${BASE_URL}/video/latest/shorts?limit=1`, authHdrs({ 'user-id': userId }));
      const latestJson = safeJson(latestRes);
      const latestOk = checkAndLog('latest-shorts', latestRes, {
        'fetch latest shorts status 200': (r) => r.status === 200,
        'latest returns array': (r) => Array.isArray(latestJson?.data?.videos || latestJson?.data || latestJson || []),
      });
      if (!latestOk) { errors.add(1); business_logic_errors.add(1); iterationOk = false; }
      sleep(0.1);
    });

    // 5) createFixServices
    group('fix-services: create', () => {
      const fixPayload = makeFixServicePayload(userId);
      // API path: /fix-services/services
      const createFixRes = http.post(`${BASE_URL}/fix-services/services`, JSON.stringify(fixPayload), authHdrs({ 'user-id': userId }));
      const fixOk = checkAndLog('create-fix', createFixRes, {
        'create fix-service status 201|200': (r) => r.status === 201 || r.status === 200,
      });
      if (!fixOk) { errors.add(1); business_logic_errors.add(1); iterationOk = false; }
      sleep(0.1);
    });

    // 6) createCourse
    group('courses: create', () => {
      const coursePayload = makeCoursePayload(userId);
      // API path: /school/courses
      const createCourseRes = http.post(`${BASE_URL}/school/courses`, JSON.stringify(coursePayload), authHdrs({ 'user-id': userId }));
      const courseOk = checkAndLog('create-course', createCourseRes, {
        'create course status 201|200': (r) => r.status === 201 || r.status === 200,
      });
      if (!courseOk) { errors.add(1); business_logic_errors.add(1); iterationOk = false; }
      sleep(0.1);
    });

    // 8) getProfile
    group('user: get profile', () => {
      const profileRes = http.get(`${BASE_URL}/users/profile/${userId}`, authHdrs({ 'user-id': userId }));
      const profileOk = checkAndLog('get-profile', profileRes, {
        'get profile status 200': (r) => r.status === 200,
      });
      if (!profileOk) { errors.add(1); business_logic_errors.add(1); iterationOk = false; }
      sleep(0.1);
    });
  });
  /*if (iterationOk) {
    console.log(`[k6] All Done, IP: ${ipAddress}`);
  } else {
    console.log(`[k6] Iteration completed with errors, IP: ${ipAddress}`);
  }*/
  // between-iterations think time
  sleep(0.1);
}