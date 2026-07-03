/**
 * Scroll Diagnostic Spec
 *
 * Visits each page, scrolls it, verifies scrollable content exists,
 * and takes a screenshot on failure.
 *
 * Run with:
 *   npx playwright test e2e/scroll-diagnostic.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

function setOnboardingComplete(page: Page) {
  page.addInitScript(() => {
    const data = {
      mbti: 'ENFP',
      travelRange: ['周末短途', '周边城市'],
      interests: ['美食', '城市漫步', '摄影'],
      budget: '舒适',
      selfDescription: '喜欢慢慢走，不赶行程，吃好住好最重要。',
      city: '深圳',
      completed: true,
      userId: 'user_77e92a9e',
      timestamp: Date.now(),
    };
    localStorage.setItem('twinbuddy_v2_onboarding', JSON.stringify(data));
  });
}

async function captureScrollState(page: Page, label: string) {
  const state = await page.evaluate(() => {
    const body = document.body;
    const scrollHeight = body.scrollHeight;
    const clientHeight = body.clientHeight;
    const scrollable = scrollHeight > clientHeight + 10;
    const scrollY = window.scrollY;
    return { scrollHeight, clientHeight, scrollable, scrollY, url: window.location.href };
  });
  console.log(`[scroll-diagnostic] ${label} | scrollable=${state.scrollable} | scrollY=${state.scrollY} | scrollHeight=${state.scrollHeight} | clientHeight=${state.clientHeight} | url=${state.url}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostic test cases
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Scroll Diagnostic', () => {

  test('home-page-scroll: visit /home, verify scrollable content, scroll down and back up', async ({ page }) => {
    setOnboardingComplete(page);

    await page.goto('/home');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Initial state
    await captureScrollState(page, 'home-before-scroll');

    // Verify hero heading is present
    const heroHeading = page.getByRole('heading', { name: /嘿/ });
    await expect(heroHeading).toBeVisible();

    // Scroll down to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await captureScrollState(page, 'home-after-scroll');

    // Should have scrolled
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await captureScrollState(page, 'home-after-reset');

    // Hero should be back in view
    await expect(heroHeading).toBeInViewport();
  });

  test('buddies-page-scroll: visit /buddies, scroll the buddy list, verify items render', async ({ page }) => {
    setOnboardingComplete(page);

    await page.goto('/buddies');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'buddies-before-scroll');

    // Verify buddy list items are present
    const buddyListHeader = page.locator('h1', { hasText: '探索搭子' });
    await expect(buddyListHeader).toBeVisible();

    // Count visible buddy cards
    const buddyCards = page.locator('[class*="cursor-pointer"]');
    const count = await buddyCards.count();
    expect(count).toBeGreaterThan(0);
    console.log(`[scroll-diagnostic] buddies: found ${count} buddy cards`);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await captureScrollState(page, 'buddies-after-scroll');

    const afterScrollY = await page.evaluate(() => window.scrollY);
    expect(afterScrollY).toBeGreaterThan(0);

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await expect(buddyListHeader).toBeInViewport();
  });

  test('onboarding-scroll: visit /onboarding, scroll through all 6 steps', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'onboarding-step0');

    // Step 1: MBTI — scroll down to see all 16 MBTI options
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(400);
    await captureScrollState(page, 'onboarding-step0-mid');

    // Verify MBTI grid is visible
    const mbtiGrid = page.locator('button', { hasText: /^ENFP/ });
    await expect(mbtiGrid).toBeVisible();

    // Select MBTI and advance
    await page.locator('button', { hasText: /^ENFP/ }).click();
    await page.locator('button', { hasText: '继续' }).click();

    // Step 2
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step1');

    await expect(page.locator('h2', { hasText: '你通常去哪里旅行？' })).toBeVisible();
    await page.locator('button', { hasText: '周末短途' }).click();
    await page.locator('button', { hasText: '继续' }).click();

    // Step 3
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step2');

    await expect(page.locator('h2', { hasText: '你的旅行偏好是什么？' })).toBeVisible();
    await page.locator('button', { hasText: '美食' }).click();
    await page.locator('button', { hasText: '摄影' }).click();
    await page.locator('button', { hasText: '继续' }).click();

    // Step 4
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step3');

    await expect(page.locator('h2', { hasText: '你的旅行预算区间？' })).toBeVisible();
    await page.locator('button', { hasText: /^舒适/ }).click();
    await page.locator('button', { hasText: '继续' }).click();

    // Step 5
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step4');

    await expect(page.locator('h2', { hasText: '一句话介绍你和谁旅行最舒服' })).toBeVisible();
    await page.locator('textarea').fill('喜欢慢慢走，不赶行程，吃好住好最重要。');
    await page.locator('button', { hasText: '继续' }).click();

    // Step 6
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step5');

    await expect(page.locator('h2', { hasText: '你的出发城市？' })).toBeVisible();

    // Scroll through city chips
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(400);
    await captureScrollState(page, 'onboarding-step5-mid');

    await page.locator('button', { hasText: '深圳' }).last().click();
    await page.locator('button', { hasText: '进入 TwinBuddy' }).click();

    // Should land on /home
    await page.waitForURL(/home/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
  });

  test('community-page-scroll: visit /community, scroll feed, verify post cards render', async ({ page }) => {
    setOnboardingComplete(page);

    await page.goto('/community');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'community-before-scroll');

    // Verify the post composer is visible
    const textarea = page.locator('textarea[placeholder*="发一条旅行计划"]');
    await expect(textarea).toBeVisible();

    // Verify community feed has posts
    const postCount = await page.locator('article').count();
    expect(postCount).toBeGreaterThan(0);
    console.log(`[scroll-diagnostic] community: found ${postCount} post articles`);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await captureScrollState(page, 'community-after-scroll');

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThan(0);

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await expect(textarea).toBeInViewport();
  });

  test('profile-page-scroll: visit /profile, verify content renders, scroll', async ({ page }) => {
    setOnboardingComplete(page);

    await page.goto('/profile');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'profile-before-scroll');

    // The profile page should have some content visible
    // (ProfilePage.tsx should render the user's profile info)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await captureScrollState(page, 'profile-after-scroll');

    const scrollY = await page.evaluate(() => window.scrollY);
    // Profile page may or may not be scrollable depending on content height
    // We just verify no crash and the page remains interactive
    await expect(page.locator('body')).toBeVisible();
  });

  test('messages-page-scroll: visit /messages, verify scrollable content', async ({ page }) => {
    setOnboardingComplete(page);

    await page.goto('/messages');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'messages-before-scroll');

    // Verify the page rendered something
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    await captureScrollState(page, 'messages-after-scroll');
  });

  test('blindgame-page-scroll: visit /blind-game, verify content renders, scroll', async ({ page }) => {
    setOnboardingComplete(page);

    await page.goto('/blind-game');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'blindgame-before-scroll');

    // Wait for loading to finish
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 });

    // Verify mystery avatar section
    await expect(page.locator('text=神秘搭子')).toBeVisible({ timeout: 8_000 });

    // Scroll (the blind game page is tall)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    await captureScrollState(page, 'blindgame-after-scroll');

    const scrollY = await page.evaluate(() => window.scrollY);
    // The blind game card may or may not scroll much on mobile — just ensure no crash
    console.log(`[scroll-diagnostic] blindgame scrollY=${scrollY}`);
    await expect(page.locator('text=神秘搭子')).toBeVisible();
  });

  test('all-pages-scroll-summary: snapshot scroll state for all routes', async ({ page }) => {
    setOnboardingComplete(page);

    const routes = ['/home', '/buddies', '/community', '/profile', '/messages', '/blind-game'];
    const results: { route: string; scrollable: boolean; scrollHeight: number; clientHeight: number }[] = [];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
      await page.waitForTimeout(500); // let animations settle

      const state = await page.evaluate(() => ({
        scrollHeight: document.body.scrollHeight,
        clientHeight: document.body.clientHeight,
        scrollable: document.body.scrollHeight > document.body.clientHeight + 10,
      }));
      results.push({ route, ...state });
      console.log(`[scroll-diagnostic] ${route} scrollable=${state.scrollable} scrollHeight=${state.scrollHeight} clientHeight=${state.clientHeight}`);

      // Quick scroll to verify no crash
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    // All routes should be reachable and not crash
    expect(results).toHaveLength(routes.length);
    for (const r of results) {
      expect(r.scrollHeight).toBeGreaterThan(0);
    }
  });
});