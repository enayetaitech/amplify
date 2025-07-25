# Automating Build Break Protection with GitHub Actions
Keeping your main branch green and deployable is critical. With a few lines of YAML in .github/workflows/ci.yml, you can:

Automatically run your backend and frontend builds whenever someone pushes or merges into main.

Block merging via branch protection if either build fails (you’ll wire up the status checks in Settings).

Here’s what the workflow does, step by step.

```yml
# .github/workflows/ci.yml
name: Build Breaks

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  backend-build:
    name: 🛠 Backend Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
       

      - name: Install backend dependencies
        run: |
          cd backend
          npm ci

      - name: Build backend
        run: |
          cd backend
          npm run build
          

  frontend-build:
    name: 🎨 Frontend Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18.x"
        

      - name: Install frontend dependencies (ignore peer-dep conflicts)
        run: |
          cd frontend
          npm ci --legacy-peer-deps

      - name: Build frontend
        run: |
          cd frontend
          npm run build
```

1. When this workflow runs
- `on.push.branches: [main]`
Every time code is pushed directly to `main`.

- `on.pull_request.branches: [main]`
Every time a PR is opened or updated targeting `main`.

Together with branch protection (in your repo settings), this means:

- No direct push or merge will complete until these build jobs pass.
- Any failure will block merges, keeping `main` healthy.

2. Two parallel jobs: backend-build & frontend-build

GitHub Actions splits your CI into two independent jobs, one for each part of your stack:

🛠 Backend Build
1. `runs-on: ubuntu-latest`
Spins up a fresh Ubuntu VM.

2. Checkout code

```yaml
- uses: actions/checkout@v3
```
3. Install Node.js
```yaml
- uses: actions/setup-node@v3
  with:
    node-version: "18.x"
```
4. Install dependencies
```bash
cd backend
npm ci
```
- `npm ci` is optimized for CI: it installs exactly what’s in `package-lock.json`.

5. Run your build
```bash
cd backend
npm run build
```
-Fails fast if any compile or bundling error occurs.

🎨 Frontend Build
1. `runs-on: ubuntu-latest`

2. Checkout code

3. Install Node.js

4. Install dependencies
```bash
cd frontend
npm ci --legacy-peer-deps
```
- Uses `--legacy-peer-deps` to bypass any peer-dependency conflicts.
5. Run your build
```bash
cd frontend
npm run build
```

3. Wiring it into branch protection
Once this workflow lives in your repo:

Go to Settings → Branches → Add branch ruleset.

- In the Ruleset Name* type a name for the ruleset.
- From the enforcement status dropdown select Active.
- From the Add target dropdown click Include by pattern type main and click Add Inclusion pattern button.
- Check Restrict deletions
- Check Require a pull request before merging
  - From the Required approvals select 1 or 2 as per your requirement. (I have selected 1).
- Check Require status checks to pass
  - Check Require branches to be up to date before merging
  - Click on Add checks dropdown and write test name from the earlier workflow in the search bar and check it. In my case test names are backend-build & frontend-build.
- Click create and then click save


Now:

Direct pushes to main are blocked.

PRs can only be merged if both build steps succeed.

## Why this matters

Zero manual gating: Every push or PR automatically kicks off your build.

Immediate feedback: Broken builds are flagged in GitHub’s UI before any human review.

Safer main: With branch protection, you prevent regressions from ever landing in your production-ready code.

That’s it—no servers to configure, no extra CI software. Just drop in this YAML, set up branch protection, and let GitHub Actions guard your main branch for you.