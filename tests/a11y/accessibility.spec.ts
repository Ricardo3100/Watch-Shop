
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
// These are the pages we want to test for accessibility. 
// You can add more pages as needed.
const pages = [
  { name: 'Home',          path: '/' },
  { name: 'Products',      path: '/products' },
  { name: 'Product Detail',path: '/product/6992295ab8a5ed2b964a0dd2'},
  { name: 'Admin Login',   path: '/admin/login' },
  { name: 'Refund Request',path: '/refund-request' },
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


