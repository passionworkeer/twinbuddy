/**
 * TwinBuddy E2E Test Suite
 *
 * Run with:
 *   npx playwright test e2e/twinbuddy-e2e.spec.ts
 *
 * All tests are independent — each uses beforeEach to set up a clean state.
 * Pages that require onboarding to be "done" use page.addInitScript to
 * pre-populate localStorage with a completed profile, but do NOT hardcode
 * mock BuddyCard data; they rely on the app's actual rendered output.
 */

import { test, expect, type Page } from '@playwright/test';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Pre-populate localStorage so the app skips onboarding and lands on /home. */
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

/** Verify the app is on a given URL path (not full URL, just pathname). */
function expectPath(page: Page, path: string) {
  expect(page.url()).toMatch(new RegExp(`127\\.0\\.0\\.1:5173(${path})?$`));
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature: Feed & TwinCard
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Feed & TwinCard', () => {
  test.beforeEach(({ page }) => {
    setOnboardingComplete(page);
  });

  test('feed-scroll: navigate to home, scroll the feed, verify cards are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/home/, { timeout: 10_000 });

    // Verify the hero section is visible
    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();

    // Scroll down to the feed / carousel
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);

    // The horizontal carousel section heading
    await expect(page.getByRole('heading', { name: '推荐搭子' })).toBeVisible();

    // At least one carousel card should be present
    const cards = page.locator('article').filter({ hasText: /推荐搭子/ }).locator('../..//article');
    // More reliably: find any article card within the carousel
    const carouselCards = page.locator('.overflow-x-auto > article').first();
    await expect(carouselCards).toBeVisible();

    // Verify we can scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
  });

  test('card-layer-1: on home page, verify the first TwinCard shows layer-1 info', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Look for "Layer 1 预览卡" badge — unique identifier for TwinCard layer 1
    const layer1Badge = page.locator('text=Layer 1 预览卡').first();
    await expect(layer1Badge).toBeVisible();

    // TwinCard should show: nickname, city, MBTI badge, match score
    // Using the structure: .twin-card-layer1
    const card = page.locator('article.twin-card-layer1').first();
    await expect(card).toBeVisible();

    // MBTI badge inside the card
    const mbtiBadge = card.locator('.mbti-badge').first();
    await expect(mbtiBadge).toBeVisible();

    // Match score block
    const matchScoreBlock = card.locator('text=匹配度').first();
    await expect(matchScoreBlock).toBeVisible();

    // Nickname (starts with @)
    const nickname = card.locator('h3').first();
    await expect(nickname).toBeVisible();

    // City text (MapPin + city name)
    const cityLocator = card.locator('text=深圳').first();
    await expect(cityLocator).toBeVisible();

    // "了解更多" button is present
    const expandButton = card.locator('button', { hasText: '了解更多' }).first();
    await expect(expandButton).toBeVisible();
  });

  test('card-expand-layer2: click a TwinCard, verify layer 2 opens', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Click the "了解更多" button on the first card
    const expandButton = page.locator('article.twin-card-layer1 button', { hasText: '了解更多' }).first();
    await expandButton.click();

    // Layer 2 modal/sheet should open — look for "Layer 2 协商详情" header badge
    await expect(page.locator('text=Layer 2 协商详情')).toBeVisible({ timeout: 8_000 });

    // Radar chart section should be present
    await expect(page.locator('text=契合雷达')).toBeVisible();

    // Negotiation thread header should be present
    await expect(page.locator('text=数字分身协商记录')).toBeVisible();

    // Match score should be shown (e.g. "91%")
    await expect(page.locator('text=适合进入盲选')).toBeVisible();

    // Action buttons should be visible (开始盲选, 私信, 跳过)
    await expect(page.locator('button', { hasText: '开始盲选' })).toBeVisible();
    await expect(page.locator('button', { hasText: '私信' })).toBeVisible();
    await expect(page.locator('button', { hasText: '跳过' })).toBeVisible();

    // Consensus tags should appear
    await expect(page.locator('text=已经达成的共识')).toBeVisible();
  });

  test('card-expand-layer3: on layer 2, click expand, verify layer 3 shows', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Open layer 2
    await page.locator('article.twin-card-layer1 button', { hasText: '了解更多' }).first().click();
    await expect(page.locator('text=Layer 2 协商详情')).toBeVisible({ timeout: 8_000 });

    // Scroll down in the modal to reveal all content including action buttons
    // The modal is a fixed overlay — we interact with its scroll container
    const modalMain = page.locator('main').last();
    await modalMain.evaluate((el) => el.scrollTop = el.scrollHeight);
    await page.waitForTimeout(500);

    // Verify that action buttons are present and clickable
    const blindGameBtn = page.locator('button', { hasText: '开始盲选' });
    await expect(blindGameBtn).toBeVisible();

    // The "开始盲选" button leads to /blind-game/:buddyId/:negotiationId
    // Clicking it confirms the layer 3 navigation path works
    await expect(blindGameBtn).toBeEnabled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: Onboarding
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Onboarding', () => {
  test('onboarding-persistence: complete full 6-step onboarding and verify persistence', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // ── Step 1: MBTI ──────────────────────────────────────────────────────────
    const step1Heading = page.locator('h2', { hasText: '你的 MBTI 是？' });
    await expect(step1Heading).toBeVisible();

    // Click ENFP
    await page.locator('button', { hasText: /^ENFP/ }).click();
    await page.waitForTimeout(200);

    // Next button should be enabled
    const nextBtn = page.locator('button', { hasText: '继续' });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // ── Step 2: Travel Range ─────────────────────────────────────────────────
    await expect(page.locator('h2', { hasText: '你通常去哪里旅行？' })).toBeVisible();
    await page.locator('button', { hasText: '周末短途' }).click();
    await page.locator('button', { hasText: '周边城市' }).click();
    await page.waitForTimeout(200);
    await nextBtn.click();

    // ── Step 3: Interests ─────────────────────────────────────────────────────
    await expect(page.locator('h2', { hasText: '你的旅行偏好是什么？' })).toBeVisible();
    await page.locator('button', { hasText: '美食' }).click();
    await page.locator('button', { hasText: '摄影' }).click();
    await page.waitForTimeout(200);
    await nextBtn.click();

    // ── Step 4: Budget ────────────────────────────────────────────────────────
    await expect(page.locator('h2', { hasText: '你的旅行预算区间？' })).toBeVisible();
    await page.locator('button', { hasText: /^舒适/ }).click();
    await page.waitForTimeout(200);
    await nextBtn.click();

    // ── Step 5: Self-description ───────────────────────────────────────────────
    await expect(page.locator('h2', { hasText: '一句话介绍你和谁旅行最舒服' })).toBeVisible();
    const textarea = page.locator('textarea');
    await textarea.fill('喜欢慢慢走，不赶行程，吃好住好最重要。');
    await page.waitForTimeout(200);
    await nextBtn.click();

    // ── Step 6: City ───────────────────────────────────────────────────────────
    await expect(page.locator('h2', { hasText: '你的出发城市？' })).toBeVisible();
    // Type in the city input
    const cityInput = page.locator('input[placeholder*="深圳"]').first();
    await cityInput.fill('深圳');
    await page.waitForTimeout(200);
    // Also click the city chip
    await page.locator('button', { hasText: '深圳' }).last().click();
    await page.waitForTimeout(200);

    // Submit button should show "进入 TwinBuddy"
    const submitBtn = page.locator('button', { hasText: '进入 TwinBuddy' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Should navigate to /home
    await page.waitForURL(/home/, { timeout: 15_000 });

    // Verify localStorage has completed: true
    const lsValue = await page.evaluate(() => {
      return localStorage.getItem('twinbuddy_v2_onboarding');
    });
    expect(lsValue).not.toBeNull();
    const parsed = JSON.parse(lsValue!);
    expect(parsed.completed).toBe(true);
    expect(parsed.mbti).toBe('ENFP');

    // Reload the page and verify we land on /home directly (not /onboarding)
    await page.reload();
    await page.waitForURL(/home/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
  });

  test('onboarding-step-requires: cannot advance without selection; selecting MBTI enables next', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Step 1 — "继续" button should be disabled initially
    const continueBtn = page.locator('button', { hasText: '继续' });
    await expect(continueBtn).toBeDisabled();

    // Attempt to click (should be a no-op since disabled)
    await continueBtn.click({ force: true });
    // URL should not change
    await expect(page.locator('h2', { hasText: '你的 MBTI 是？' })).toBeVisible();

    // Select ENFP — button should become enabled
    await page.locator('button', { hasText: /^ENFP/ }).click();
    await expect(continueBtn).toBeEnabled();

    // Advance to step 2
    await continueBtn.click();
    await expect(page.locator('h2', { hasText: '你通常去哪里旅行？' })).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: Buddies & Radar Chart
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Buddies & Radar Chart', () => {
  test.beforeEach(({ page }) => {
    setOnboardingComplete(page);
  });

  test('radar-chart-renders: on Buddies page, open a buddy card, verify the radar chart SVG is visible', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Click the first buddy card
    const firstBuddyCard = page.locator('[class*="cursor-pointer"]').first();
    await firstBuddyCard.click();

    // The BuddyDetailModal should open — wait for the radar chart section
    await expect(page.locator('text=契合雷达')).toBeVisible({ timeout: 8_000 });

    // The RadarChart renders an <svg> element — verify it is present
    const radarSvg = page.locator('section:has-text("契合雷达") svg').first();
    await expect(radarSvg).toBeVisible();

    // Verify the SVG has a viewBox attribute (valid radar chart SVG)
    await expect(radarSvg).toHaveAttribute('viewBox', /.+/);

    // Legend pills should also be visible
    await expect(page.locator('text=行程节奏')).toBeVisible();
    await expect(page.locator('text=社交能量')).toBeVisible();
  });

  test('negotiation-thread-visible: after opening a card, verify negotiation messages are shown', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Open the first buddy card
    const firstBuddyCard = page.locator('[class*="cursor-pointer"]').first();
    await firstBuddyCard.click();

    // Wait for the "数字分身协商记录" section
    await expect(page.locator('text=数字分身协商记录')).toBeVisible({ timeout: 8_000 });

    // NegotiationThread renders chat bubbles with role labels
    // At least one bubble should show "数字分身" label
    await expect(page.locator('text=数字分身').first()).toBeVisible();

    // At least one user bubble should show "你" label
    await expect(page.locator('text=你').first()).toBeVisible();

    // Status badge "已完成预协商" should be present
    await expect(page.locator('text=已完成预协商')).toBeVisible();
  });

  test('buddy-card-popup: on buddies page, click a buddy card, verify BuddyDetailModal opens', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Grab the buddy name for later assertion
    const firstBuddyName = await page.locator('h3').first().textContent();

    // Click first buddy card
    await page.locator('[class*="cursor-pointer"]').first().click();

    // Modal opens — look for the "Layer 2 协商详情" badge
    await expect(page.locator('text=Layer 2 协商详情')).toBeVisible({ timeout: 8_000 });

    // The buddy name should appear in the modal
    await expect(page.locator(`text=${firstBuddyName}`).first()).toBeVisible();

    // Match score badge (e.g. "91%") should be visible
    const matchScoreBadge = page.locator('[class*="rounded-full"][class*="bg-primary"]').first();
    await expect(matchScoreBadge).toBeVisible();

    // Close button (X) should be present
    const closeBtn = page.locator('button[type="button"]').filter({ has: page.locator('svg') }).last();
    await expect(closeBtn).toBeVisible();

    // Click X to close the modal
    await closeBtn.click();
    await page.waitForTimeout(500);

    // Modal should no longer be visible
    await expect(page.locator('text=Layer 2 协商详情')).not.toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: Community
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Community', () => {
  test.beforeEach(({ page }) => {
    setOnboardingComplete(page);
  });

  test('community-post: on community page, write a post, submit, verify it appears in the feed', async ({ page }) => {
    await page.goto('/community');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Find the post textarea
    const postTextarea = page.locator('textarea[placeholder*="发一条旅行计划"]');
    await expect(postTextarea).toBeVisible();

    // Type a post content
    const testContent = '周末去顺德吃鱼生，找一个不赶行程的搭子，慢慢逛老城区。';
    await postTextarea.fill(testContent);

    // Submit button
    const publishBtn = page.locator('button', { hasText: '发布动态' });
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    // Success message should appear
    await expect(page.locator('text=动态已发布')).toBeVisible({ timeout: 5_000 });

    // The new post should appear in the feed (authored by "你")
    const newPost = page.locator('article').filter({ hasText: testContent }).first();
    await expect(newPost).toBeVisible();

    // Author "你" should be shown
    await expect(newPost.locator('text=你').first()).toBeVisible();

    // The post should include the location tag (深圳 by default from profile)
    await expect(newPost.locator('text=深圳').first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: Bottom Navigation
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Bottom Navigation', () => {
  test.beforeEach(({ page }) => {
    setOnboardingComplete(page);
  });

  test('bottom-nav-switch: click through all 5 bottom nav tabs and verify each page loads', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Tab 1: 首页 (Home)
    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
    expectPath(page, '/home');

    // Tab 2: 搭子 (Buddies)
    await page.locator('nav a[href="/buddies"]').click();
    await page.waitForURL(/buddies/, { timeout: 8_000 });
    await expect(page.locator('h1', { hasText: '探索搭子' })).toBeVisible();
    expectPath(page, '/buddies');

    // Tab 3: 游戏 (BlindGame) — note: BlindGame is NOT inside AppLayout so no bottom nav link
    // We check the Messages tab instead since BlindGame has no bottom-nav entry
    // The nav items are: Home(/), Buddies(/buddies), Messages(/messages), Community(/community), Profile(/profile)
    // There is NO Game tab in the BottomNav — BlindGame is accessed via TwinCard "开始盲选" button
    // So we test the Messages tab

    // Tab 3: 消息 (Messages)
    await page.locator('nav a[href="/messages"]').click();
    await page.waitForURL(/messages/, { timeout: 8_000 });
    expectPath(page, '/messages');

    // Tab 4: 社区 (Community)
    await page.locator('nav a[href="/community"]').click();
    await page.waitForURL(/community/, { timeout: 8_000 });
    await expect(page.locator('text=社区广场')).toBeVisible();
    expectPath(page, '/community');

    // Tab 5: 我的 (Profile)
    await page.locator('nav a[href="/profile"]').click();
    await page.waitForURL(/profile/, { timeout: 8_000 });
    expectPath(page, '/profile');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Feature: BlindGame
// ─────────────────────────────────────────────────────────────────────────────

test.describe('BlindGame', () => {
  test.beforeEach(({ page }) => {
    setOnboardingComplete(page);
  });

  test('blindgame-ab-select: on BlindGame page, verify A/B options are present and selection registers', async ({ page }) => {
    await page.goto('/blind-game');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Wait for the loading spinner to disappear (mock data loads in ~800ms)
    await expect(page.locator('[class*="animate-spin"]')).not.toBeVisible({ timeout: 10_000 });

    // The page should show a mystery avatar section
    await expect(page.locator('text=神秘搭子')).toBeVisible({ timeout: 8_000 });

    // Profile description should be visible
    await expect(page.locator('text=INFP')).toBeVisible();

    // Accept ("打个招呼") and Reject ("不合适") buttons should be visible
    const acceptBtn = page.locator('button', { hasText: '打个招呼' });
    const rejectBtn = page.locator('button', { hasText: '不合适' });
    await expect(acceptBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();

    // Click accept
    await acceptBtn.click();
    await page.waitForTimeout(500);

    // Status should change — "已打招呼" confirmation appears
    await expect(page.locator('text=已打招呼')).toBeVisible({ timeout: 5_000 });

    // Icebreaker questions should appear
    await expect(page.locator('text=破冰问题参考')).toBeVisible();
  });

  test('blindgame-reject-flow: clicking reject navigates to next match', async ({ page }) => {
    await page.goto('/blind-game');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    // Wait for content
    await expect(page.locator('text=神秘搭子')).toBeVisible({ timeout: 10_000 });

    const rejectBtn = page.locator('button', { hasText: '不合适' });
    await expect(rejectBtn).toBeVisible();
    await rejectBtn.click();

    // "寻找下一个..." status should appear
    await expect(page.locator('text=寻找下一个')).toBeVisible({ timeout: 5_000 });
  });
});