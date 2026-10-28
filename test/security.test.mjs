import http from 'http';
import app from '../server/app.js';
import { generateSignedToken, verifySignedToken } from '../server/routes/auth.js';
import { validateProgressPayload } from '../server/utils/validation.js';

let server;
const PORT = 5099;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('--- Starting Automated Security Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // Helper fetch
  async function api(path, options = {}) {
    const res = await fetch(`${BASE_URL}${path}`, options);
    let json = null;
    try {
      json = await res.json();
    } catch {
      // not json
    }
    return { status: res.status, headers: res.headers, json };
  }

  // TEST 1: Missing APP_PASSWORD -> Fail Closed
  delete process.env.APP_PASSWORD;
  {
    const resAuth = await api('/api/lessons');
    assert(resAuth.status === 503, 'F-01: requireAuth returns 503 when APP_PASSWORD is missing');

    const resLogin = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'english2026' }),
    });
    assert(resLogin.status === 503, 'F-01/F-02: /login returns 503 when APP_PASSWORD is missing (fallback removed)');

    const resVerify = await api('/api/auth/verify');
    assert(resVerify.status === 401, 'F-01: /verify returns 401 when APP_PASSWORD is missing');
  }

  // Setup valid APP_PASSWORD
  const TEST_PASSWORD = 'super-secret-password-xyz-2026';
  process.env.APP_PASSWORD = TEST_PASSWORD;

  // TEST 2: Hardcoded fallback english2026 is rejected
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'english2026' }),
    });
    assert(res.status === 401, 'F-02: Hard-coded fallback password "english2026" is rejected with 401');
  }

  // TEST 3: Correct login produces signed token
  let validToken = '';
  {
    const res = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PASSWORD }),
    });
    assert(res.status === 200 && res.json.token, 'Login succeeds with valid password and returns token');
    validToken = res.json.token;

    // Verify token format
    const parts = validToken.split('.');
    assert(parts.length === 2, 'F-03: Token is signed token with payload and signature');

    // Verify token with verifySignedToken
    const verified = verifySignedToken(validToken, TEST_PASSWORD);
    assert(verified.valid === true, 'F-03: Token verifies successfully with HMAC-SHA256');

    // Test tampered signature
    const tampered = `${parts[0]}.invalid_signature`;
    const tamperedRes = verifySignedToken(tampered, TEST_PASSWORD);
    assert(tamperedRes.valid === false, 'F-03: Tampered signature is rejected');

    // Test tampered payload
    const fakePayload = Buffer.from(JSON.stringify({ exp: Date.now() + 100000 })).toString('base64url');
    const tamperedPayloadRes = verifySignedToken(`${fakePayload}.${parts[1]}`, TEST_PASSWORD);
    assert(tamperedPayloadRes.valid === false, 'F-03: Tampered payload is rejected');

    // Test expired token
    const expiredPayload = Buffer.from(JSON.stringify({ exp: Date.now() - 1000, iat: Date.now() - 2000 })).toString('base64url');
    const expiredSignature = (await import('crypto')).default
      .createHmac('sha256', TEST_PASSWORD)
      .update(expiredPayload)
      .digest('base64url');
    const expiredToken = `${expiredPayload}.${expiredSignature}`;
    const expiredRes = verifySignedToken(expiredToken, TEST_PASSWORD);
    assert(expiredRes.valid === false && expiredRes.reason === 'expired', 'F-03: Expired token is rejected');
  }

  // TEST 4: Token authentication in middleware
  {
    const resValid = await api('/api/auth/verify', {
      headers: { 'x-access-token': validToken },
    });
    assert(resValid.status === 200 && resValid.json.authenticated === true, 'Valid token passes /verify');

    const resBearer = await api('/api/auth/verify', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    assert(resBearer.status === 200 && resBearer.json.authenticated === true, 'Authorization Bearer header works for /verify');

    const resInvalid = await api('/api/auth/verify', {
      headers: { 'x-access-token': 'bad.token' },
    });
    assert(resInvalid.status === 401, 'Invalid token rejected with 401 on /verify');
  }

  // TEST 5: Health Check Sanitization (F-06)
  {
    const res = await api('/api/health');
    assert(res.status === 200, 'Health endpoint responds with 200');
    assert(res.json.status !== undefined && res.json.database !== undefined, 'F-06: Health response has status and database fields');
    assert(res.json.message === undefined, 'F-06: Health response does NOT leak raw database error messages');
    assert(res.json.supabase === undefined, 'F-06: Health response does NOT leak supabase connection internals');
  }

  // TEST 6: Input Validation (F-08)
  {
    // Invalid date on GET /lessons/:date
    const resBadDate = await api('/api/lessons/invalid-date-format', {
      headers: { 'x-access-token': validToken },
    });
    assert(resBadDate.status === 400, 'F-08: GET /api/lessons/:date rejects invalid date format with 400');

    // Invalid date on DELETE /lessons/:date
    const resBadDeleteDate = await api('/api/lessons/2026-02-31', {
      method: 'DELETE',
      headers: { 'x-access-token': validToken },
    });
    assert(resBadDeleteDate.status === 400, 'F-08: DELETE /api/lessons/:date rejects non-existent calendar date with 400');

    // Invalid payload on POST /lessons
    const resBadPayload = await api('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-token': validToken },
      body: JSON.stringify({ lesson: { date: '2026-02-31' } }),
    });
    assert(resBadPayload.status === 400, 'F-08: POST /api/lessons rejects invalid date with 400');

    // Empty vocabulary item
    const resBadVocab = await api('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-token': validToken },
      body: JSON.stringify({
        lesson: {
          date: '2026-10-27',
          vocabulary: [{ word: '' }],
        },
      }),
    });
    assert(resBadVocab.status === 400, 'F-08: POST /api/lessons rejects empty word with 400');

    // Oversized batch (51 items > limit 50)
    const bigBatch = Array.from({ length: 51 }, (_, i) => ({
      date: `2026-01-01`,
      vocabulary: [],
      exercises: [],
    }));
    const resBigBatch = await api('/api/lessons/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-access-token': validToken },
      body: JSON.stringify(bigBatch),
    });
    assert(resBigBatch.status === 400, 'F-08: POST /api/lessons/batch rejects > 50 items with 400');

    // Progress payload preservation & validation
    const progressCheck = validateProgressPayload({
      wordsMastered: ['v1', 'v2'],
      exerciseResults: {
        '1': { userAnswer: 'went', isCorrect: true },
        '2': { userAnswer: 'goes', isCorrect: false },
        '3': true,
      },
    });
    assert(
      progressCheck.progress.exerciseResults['1'].userAnswer === 'went' &&
      progressCheck.progress.exerciseResults['1'].isCorrect === true &&
      progressCheck.progress.exerciseResults['2'].userAnswer === 'goes' &&
      progressCheck.progress.exerciseResults['2'].isCorrect === false &&
      progressCheck.progress.exerciseResults['3'].isCorrect === true,
      'Progress validation preserves exerciseResults { userAnswer, isCorrect } and handles legacy boolean'
    );
  }

  // TEST 7: CORS Policy (F-07)
  {
    const resEvil = await api('/api/health', {
      headers: { Origin: 'https://malicious-website.com' },
    });
    assert(resEvil.status === 403, 'F-07: CORS blocks untrusted origin with 403');

    const resAllowed = await api('/api/health', {
      headers: { Origin: 'https://dailyenglishlesson.vercel.app' },
    });
    assert(resAllowed.status === 200, 'F-07: CORS allows production domain');
  }

  // TEST 8: Security Response Headers
  {
    const res = await api('/api/health');
    assert(res.headers.get('x-content-type-options') === 'nosniff', 'Security header X-Content-Type-Options: nosniff is set');
    assert(res.headers.get('x-frame-options') === 'DENY', 'Security header X-Frame-Options: DENY is set');
    assert(res.headers.get('referrer-policy') === 'strict-origin-when-cross-origin', 'Security header Referrer-Policy is set');
  }

  // TEST 9: Login Rate Limiting (F-04)
  {
    let rateLimited = false;
    for (let i = 0; i < 7; i++) {
      const res = await api('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong-guess-password' }),
      });
      if (res.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assert(rateLimited, 'F-04: Login rate limiter returns 429 after repeated failed attempts');
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

server = http.createServer(app);
server.listen(PORT, () => {
  runTests();
});
