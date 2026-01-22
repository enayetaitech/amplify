## Backend security migration guide

This document describes how to safely upgrade backend dependencies with known security issues, without breaking existing behavior.

---

## Suggested commit message

```text
security: harden backend dependencies and address known vulnerabilities

- Upgrade bcrypt to 6.x to remove high-severity tar/@mapbox/node-pre-gyp issues
- Upgrade canvas, cloudinary, jsonwebtoken, and nodemailer to patched versions
- Refresh archiver and related tooling to pick up fixes in glob and brace-expansion
- Align AWS SDK usage with latest guidance and v3 packages
```

You can adjust the wording to match your project’s commit-message style.

---

## 1) `bcrypt` 5.x → 6.x

**Why**

- `bcrypt@5.x` pulls in `@mapbox/node-pre-gyp` and `tar` versions with high‑severity vulnerabilities.
- `npm audit` recommends upgrading to `bcrypt@6.0.0`.

**Upgrade command**

```bash
cd backend
npm install bcrypt@6.0.0 --save
```

**What to check in your code**

- Common patterns should continue to work:

```js
const hash = await bcrypt.hash(password, saltRounds)
const ok = await bcrypt.compare(plain, hash)
```

or callback style:

```js
bcrypt.hash(password, saltRounds, (err, hash) => { /* ... */ })
bcrypt.compare(plain, hash, (err, ok) => { /* ... */ })
```

- If you are using helpers like `genSaltSync`, `getRounds`, confirm they still exist in v6 and are used according to the official docs.

**Testing checklist**

- Create a new user and ensure the hashed password is stored correctly.
- Log in with:
  - Newly created accounts (hashed with v6).
  - Existing accounts (hashes created by v5). `compare` must still validate old hashes.
- Run your automated tests and a basic smoke test in every environment (local, CI, container) to make sure the native module builds successfully.

---

## 2) `canvas` 2.x → 3.x

**Why**

- `canvas@2.x` is affected by vulnerabilities via `@mapbox/node-pre-gyp` / `tar`.
- `npm audit` recommends upgrading to a 3.x release (for example `3.2.1`).

**Upgrade command**

```bash
cd backend
npm install canvas@3.2.1 --save
```

**What to check in your code**

Most usages look like:

```js
const { createCanvas, loadImage } = require('canvas')

const canvas = createCanvas(width, height)
const ctx = canvas.getContext('2d')
```

In v3:

- `createCanvas`, `loadImage`, `registerFont`, and `Image` still exist.
- The main breaking changes are around build toolchains and supported Node/OS versions, not the core JS API.

**Testing checklist**

- Exercise any endpoints/jobs that:
  - Generate images or PDFs.
  - Export whiteboards, thumbnails, or certificates.
- Visually inspect generated assets.
- Confirm that `canvas` installs and builds cleanly in your production/runtime environment. If build issues arise, consider preferring `@napi-rs/canvas` where feasible.

---

## 3) `nodemailer` 6.x → 7.x

**Why**

- `nodemailer@6.x` has multiple advisories (DoS and interpretation conflicts).
- `npm audit` suggests upgrading to at least `7.0.12`.

**Upgrade command**

```bash
cd backend
npm install nodemailer@7.0.12 --save
```

**What to check in your code**

Typical setup:

```js
const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
})

await transporter.sendMail({
  from,
  to,
  subject,
  text,
  html,
})
```

Review the following against the Nodemailer v7 docs:

- Any use of `service` shortcuts (for example `service: 'gmail'`).
- Non‑SMTP transports (sendmail, SES, etc.) for changed options.
- Deprecated or removed options that might have been silently accepted in v6.

**Testing checklist**

- Trigger all important email flows:
  - Signup / verification.
  - Password reset / OTP.
  - Admin / reporting notifications.
- Verify:
  - Emails are actually delivered (or at least accepted by your SMTP provider).
  - Headers (`from`, `reply-to`, etc.) match expectations.
  - Links render correctly in both HTML and plain‑text versions.

---

## 4) `jsonwebtoken` / `jws` hardening

**Why**

- Older `jws` versions (pulled in by `jsonwebtoken`) have signature verification issues.
- A safe path is to align to a current `jsonwebtoken` that depends on a fixed `jws`.

**Upgrade command**

```bash
cd backend
npm install jsonwebtoken@latest --save
```

**What to check in your code**

Token creation:

```js
const token = jwt.sign(payload, secretOrPrivateKey, options)
```

Verification:

```js
const decoded = jwt.verify(token, secretOrPublicKey, options)
```

Ensure that you:

- Never use the `none` algorithm.
- Do not broadly disable verification (for example `ignoreExpiration: true` everywhere).
- Restrict allowed algorithms explicitly where appropriate.

**Testing checklist**

- Generate and verify tokens through your normal login/auth flows.
- Confirm:
  - Valid tokens are accepted.
  - Expired or tampered tokens are rejected.
  - Any external services that consume your JWTs (if any) still accept the new tokens.

---

## 5) `cloudinary` 2.6.x → 2.7.0+

**Why**

- `cloudinary@2.6.x` is affected by an arbitrary argument‑injection issue when untrusted data is used in transformation parameters.

**Upgrade command**

```bash
cd backend
npm install cloudinary@latest --save
```

**What to check in your code**

Typical usage:

```js
cloudinary.url(publicId, {
  transformation: [/* options */],
})
```

- Avoid passing raw, unvalidated user input directly into transformation option keys or values.
- Prefer whitelisting allowed transformations and mapping user input onto that whitelist.

**Testing checklist**

- Upload and transform representative images.
- Verify that:
  - URLs are generated correctly.
  - Your Cloudinary security settings (signed URLs, allowed transformations) still behave as expected.

---

## 6) Archiver / glob / brace-expansion

**Why**

- Transitive dependencies like `glob`, `brace-expansion`, and `diff` have low‑ to high‑severity issues (ReDoS and command injection in unusual CLI cases).
- These usually come via `archiver` and related tooling.

**Upgrade command**

```bash
cd backend
npm install archiver@latest --save
```

**What to check in your code**

- Review any code that uses archiving:

```js
const archiver = require('archiver')
const archive = archiver('zip', { zlib: { level: 9 } })
```

- Make sure archive sources (file paths, glob patterns) are not directly constructed from untrusted user input.

**Testing checklist**

- Run any job or endpoint that produces ZIPs or other archives.
- Confirm:
  - Archives are created successfully.
  - Contents and directory structures are as expected.

---

## 7) AWS SDKs (`aws-sdk` v2 and `@aws-sdk/*` v3)

**Why**

- `aws-sdk` v2 has advisories suggesting additional validation of the `region` parameter and/or migrating to v3.
- You already use v3 packages like `@aws-sdk/client-s3`, so you may not need `aws-sdk` v2 at all.

**Recommended cleanup**

```bash
cd backend
npm uninstall aws-sdk --save
npm install @aws-sdk/client-s3@latest @aws-sdk/s3-request-presigner@latest --save
```

**What to check in your code**

- Search for any `require('aws-sdk')` or imports from `aws-sdk`.
- Replace v2 usage with v3 clients where needed (for example `S3Client`, `GetObjectCommand`, `PutObjectCommand`).
- Ensure that `region` values are always validated or sourced from trusted configuration.

---

## 8) Overall rollout plan

1. **Apply upgrades in small batches**
   - First: `bcrypt`, `jsonwebtoken`.
   - Then: `nodemailer`, `cloudinary`, `canvas`, `archiver`.
   - Finally: AWS SDK cleanup.

2. **Run tests**
   - Execute your automated test suite, if available.
   - Perform smoke tests for:
     - Authentication (signup, login, password reset).
     - JWT‑protected endpoints.
     - Email flows.
     - Image upload / processing / exports.
     - Archive generation.

3. **Stage before production**
   - Deploy to a staging environment.
   - Monitor logs for new errors or warnings.
   - Only then roll out to production.

This guide is intended to be a living document; you can update it as you complete each upgrade or as new advisories are published.

