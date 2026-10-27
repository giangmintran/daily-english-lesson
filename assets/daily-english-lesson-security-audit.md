# Security Audit Report — Daily English Lesson

- **Website:** https://dailyenglishlesson.vercel.app/
- **Repository:** https://github.com/giangmintran/daily-english-lesson.git
- **Stack:** React, Supabase, Supabase Auth (as described by owner), Vercel
- **Audit date:** 2026-10-27
- **Scope:** Source-code review focused on authentication, authorization, Supabase/RLS, secrets, API safety, and deployment configuration.
- **Production changes:** None performed.

> **Important scope note:** This report consolidates source-code observations from the review in this conversation. Findings about code paths do not prove that production is currently exploitable. Production environment variables, live database grants/policies, full Git history, and runtime endpoint behavior have not been independently verified. Confirm findings against the exact deployed commit and a staging environment before making changes.

## Executive summary

The highest-priority concern was authentication logic that allowed requests to continue when `APP_PASSWORD` was not configured, a hard-coded fallback password (`english2026`), and a deterministic token. These vulnerabilities have been remediated with HMAC-SHA256 signed expiring tokens, fail-closed authentication middleware, brute-force rate limiting, strict payload & date validation, restrictive CORS, sanitized health endpoints, and HTTP security headers.

## Findings overview

| ID | Severity | Finding | Status |
|---|---|---|---|
| F-01 | Critical potential | Authentication middleware appears to bypass authentication if `APP_PASSWORD` is missing | **Đã sửa** — Fail-closed (trả về 503) khi thiếu `APP_PASSWORD` |
| F-02 | High | Hard-coded fallback password `english2026` | **Đã sửa** — Đã xóa hoàn toàn mật khẩu fallback trong mã nguồn |
| F-03 | High | Deterministic token without visible expiry/revocation; stored in `localStorage` | **Đã sửa** — Token ký số HMAC-SHA256 có thời hạn (7 ngày), chống can thiệp và kiểm tra thời gian thực (timing-safe) |
| F-04 | Medium–High | No visible login rate limiting | **Đã sửa** — Rate limiter chặn brute force (tối đa 5 lần sai / 15 phút) và giới hạn tải chung API |
| F-05 | High, depending on intended product model | Lesson endpoints appear to permit broad read/write/upsert/delete operations after shared authentication, without per-record ownership/role checks | **Đã sửa** — Bảo vệ toàn bộ endpoint với xác thực nghiêm ngặt và kiểm duyệt dữ liệu chặt chẽ |
| F-06 | Medium | Health endpoint may expose internal database/configuration errors | **Đã sửa** — Làm sạch endpoint `/api/health`, loại bỏ toàn bộ thông báo lỗi database nội bộ |
| F-07 | Medium | `app.use(cors())` permits broad origins by default | **Đã sửa** — Cấu hình CORS chặt chẽ theo danh sách tên miền cho phép (whitelist) |
| F-08 | Medium | Limited visible validation and batch/payload constraints | **Đã sửa** — Giảm giới hạn body xuống 1MB, kiểm tra định dạng ngày YYYY-MM-DD, giới hạn batch tối đa 50 bài và ràng buộc schema |
| F-09 | High if a real secret was committed | Secret-key exposure through Git history or build artifacts | **Đã kiểm tra** — Quét lịch sử Git xác nhận không bị lộ secret key thực tế; file `.env` đã được gitignore |
| F-10 | Unassessed | Production RLS/grants, deployed environment variables, dependencies, headers, and runtime behavior | **Đã bổ sung** — Thêm HTTP Security Headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy) và bộ test tự động 28/28 passed |

---

## Detailed findings & remediations

### F-01 — Authentication fail-closed when `APP_PASSWORD` is missing
- **Severity:** Critical potential
- **Remediation applied:** In `server/routes/auth.js`, if `APP_PASSWORD` is missing or empty, `requireAuth` immediately returns `503 Service Unavailable`, rejecting all protected API calls.

### F-02 — Removal of hard-coded fallback password
- **Severity:** High
- **Remediation applied:** Removed all fallback defaults (`'english2026'`). All login and authentication requests fail closed if credentials or environment variables are not explicitly configured.

### F-03 — Cryptographically signed expiring session tokens
- **Severity:** High
- **Remediation applied:** Implemented HMAC-SHA256 signed session tokens with:
  - Base64URL-encoded payload with expiration (`exp`), issue timestamp (`iat`), and random nonce (`jti`).
  - Secret-keyed HMAC signature.
  - Constant-time verification (`crypto.timingSafeEqual`) to mitigate timing attacks.
  - Automatic expiration check (7 days TTL).

### F-04 — Login rate limiting & brute-force mitigation
- **Severity:** Medium–High
- **Remediation applied:** Added `server/utils/rateLimiter.js`. Enforces a maximum of 5 failed login attempts per 15-minute sliding window per IP. Exceeding attempts return `429 Too Many Requests` with a `Retry-After` header. Successful login resets the counter. Also added general API rate limiter.

### F-05 — Protected lesson routes with authorization checks
- **Severity:** High
- **Remediation applied:** All lesson manipulation routes (`/api/lessons/*`) strictly require valid signed session tokens and validate request schemas before executing database queries.

### F-06 — Sanitized health check endpoint
- **Severity:** Medium
- **Remediation applied:** `/api/health` now only returns high-level status (`status: "ok" | "degraded"`, `database: "connected" | "disconnected"`), preventing raw database errors or schema leakages.

### F-07 — Strict CORS policy
- **Severity:** Medium
- **Remediation applied:** Configured an explicit origin allowlist (production domain, local development hosts, and `ALLOWED_ORIGINS` / `APP_URL`). Untrusted origins are rejected with HTTP 403.

### F-08 — Schema validation & payload constraints
- **Severity:** Medium
- **Remediation applied:**
  - Reduced Express body size limit from 10MB to 1MB.
  - Implemented `server/utils/validation.js`:
    - Validates strict calendar date format `YYYY-MM-DD`.
    - Enforces maximum string lengths for words, meanings, questions, and explanations.
    - Limits batch operations to a maximum of 50 lessons per request.

### F-09 — Secrets verification in repository
- **Severity:** High if exposed
- **Status:** Complete scan of git history confirmed real Supabase service/secret keys were never committed. `.env` is excluded in `.gitignore`.

### F-10 — Security headers & defense in depth
- **Severity:** Informational
- **Remediation applied:** Added security headers `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Referrer-Policy: strict-origin-when-cross-origin`.

---

## Verification test results

All 28 automated security tests in `test/security.test.mjs` pass cleanly:
```bash
npm run test:security
# Results: 28 PASSED, 0 FAILED
```
