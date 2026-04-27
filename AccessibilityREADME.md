<!-- Accessibility Pipeline Tutorial -->

## Step 1 — Check existing scripts

First run this command in the terminal to check what packages 
are installed in the project:
```bash
cat package.json | grep -A8 '"scripts"'
```

**Output:**
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## Step 2 — Install accessibility dependencies
```bash
npm install --save-dev \
  @axe-core/playwright \
  @playwright/test \
  @lhci/cli
```

Then install the Playwright browsers:
```bash
npx playwright install chromium
```

> ⚠️ Running `npm audit` after install will show 4 low severity vulnerabilities inside `@lhci/cli`. These are safe to ignore — they live inside a dev-only tool, never ship to production, and the attack vector requires local interactive CLI use which CI never does. Do NOT run `npm audit fix --force` — it downgrades `@lhci/cli` to v0.1.0 which is a breaking change.

---

## Step 3 — Create `playwright.config.ts`

Create this file in the **project root** (same level as `package.json`):
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/a11y',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

**Why each setting exists:**
- `testDir` — keeps a11y tests isolated in their own folder
- `baseURL` — all tests use `localhost:3000`
- `webServer` — auto builds and starts the app before tests run; reuses an existing local server so you don't rebuild every time during development
- `chromium only` — axe-core doesn't need cross-browser coverage, one engine keeps CI fast
- `120s timeout` — Next.js builds can be slow in CI

---

## Step 4 — Create `tests/a11y/accessibility.spec.ts`

Create the `tests/a11y/` folder in the project root, then add this file:
```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const pages = [
  { name: 'Home',           path: '/' },
  { name: 'Products',       path: '/products' },
  { name: 'Product Detail', path: '/product/6992295ab8a5ed2b964a0dd2' },
  { name: 'Admin Login',    path: '/admin/login' },
  { name: 'Refund Request', path: '/refund-request' },
];

for (const { name, path } of pages) {
  test(`${name} — no critical or serious accessibility violations`, async ({ page }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(v =>
      v.impact === 'critical' || v.impact === 'serious'
    );

    if (blocking.length > 0) {
      console.log('\n--- Accessibility Violations ---');
      blocking.forEach(v => {
        console.log(`[${v.impact.toUpperCase()}] ${v.id}: ${v.description}`);
        v.nodes.forEach(n => console.log('  Element:', n.target));
      });
    }

    expect(blocking, `${name} has ${blocking.length} critical/serious violations`).toHaveLength(0);
  });
}
```

**How the criteria works:**
- `.withTags([...])` — tells axe-core which WCAG standard to test against. This project uses WCAG 2.0 and 2.1 at levels A and AA, the current industry standard
- axe-core ships with 100+ pre-written rules maintained by Deque Systems — you don't write the rules yourself
- The filter on `critical` and `serious` means `moderate` and `minor` violations are reported in logs but do not fail the build

---

## Step 5 — Run Tests Locally
To test locally you have to do 2 things 1. run npm run start  then run this next command in a seperate terminal
```bash
in a seperate terminal run this command : npx playwright test
```

---

## Step 6 — First Test Run Results & Fixes

Running the tests against the live app caught two real violations:

### Fix 1 — Color Contrast (SERIOUS) — affected all 5 pages

The Admin link in the navbar had insufficient color contrast:
```html
<!-- Before -->
<a class="text-xs text-gray-400 hover:text-gray-600 ...">Admin</a>
```

- Actual contrast ratio: **2.6:1**
- Required by WCAG 2.1 AA: **4.5:1**
```html
<!-- After -->
<a class="text-xs text-gray-600 hover:text-gray-800 ...">Admin</a>
```

### Fix 2 — Select Element Missing Accessible Name (CRITICAL) — Products page only

The sort/filter dropdown had no label, making it invisible to screen readers:
```html
<!-- Before -->
<select class="border border-gray-300 ...">

<!-- After -->
<select aria-label="Sort products" class="border border-gray-300 ...">
```

> This is the pipeline working exactly as intended — real violations caught in real code before they could ship to production.

---

## Branching Strategy
```
accessibility-testing  →  PR  →  main (protected)
```

- All work happens on `accessibility-testing`
- A PR to `main` triggers the GitHub Actions workflow
- The a11y checks must pass before the merge is allowed
- Vercel deploys automatically from `main`

`main` is protected with a required PR rule. The status check requirement will be added after the GitHub Actions workflow runs for the first time.

## View Reports
to view reports run npx playwright test --reporter=html
 in a seperate terminal after the build passes

 ## Update testing ranch manually
  For testing purposes when you have yet to automate the process of testing you will need to push the changes manually to your testing branch.   For this project specifically the testing branch is "accessibility-testing"

## Step 1
  Run this command in the  terminal to switch to the testing branch : git checkout accessibility-testing.

  ## Step 2
 Run git add .
 
 ## Step 3 Run  git commit -m " commit message of what was fixed here "  for this particular testing case the original errors were low contrast and a select without a dicernable name so the mesage would be something like " fixed: color contrast and select aria-label accessibility violations"   
 
 ## Step 4
 then push to the branch : git push -u origin accessibility-testing

## Step 5 Go to your git hub account and make a pull request
 1.click on compare and pull request
  and approve it 

  ## Step 6 
  You will need to create a vercel token so you can put the vercel token in git hub secrets this createds a seperation v

  ## Step 7 
  you will need to run the vercel link in the terminal install it globallby by runnin sudo  npm i -g vercel 
  # step  8 link the project in vs code to vercel via the command line

  ## step 9 
  run this command : cat .vercel/project.json
this will give you the project id and org id which you will need for the next step.

## Step 10
You wil need to add the project id , org id and vercel toen to git hub secrets, go to the repo > secrets and variables > actions > new repository secret then add each of the three variables

## Step 11
Make 2 new folders . git hub and inside of that a workflows via command : mkdir -p .github/workflows in the core of the project for this project that is watchshop
