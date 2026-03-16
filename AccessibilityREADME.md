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

---

## Step 3 — Create `playwright.config.ts`

Create this file in the **project root**:
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