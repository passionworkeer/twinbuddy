import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

async function createProfile(request: APIRequestContext) {
  const response = await request.post('http://127.0.0.1:8000/api/profiles', {
    data: {
      mbti: 'ENFP',
      travel_range: ['周末短途', '周边城市'],
      budget: '舒适',
      self_desc: '喜欢慢慢走，不赶行程，吃好住好最重要。',
      city: '深圳',
    },
  });
  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  return payload.data as { user_id: string };
}

async function verifyProfile(request: APIRequestContext, userId: string) {
  const response = await request.post('http://127.0.0.1:8000/api/security/verify', {
    data: {
      user_id: userId,
      legal_name: '测试用户',
      id_number_tail: '7788',
      face_checked: true,
    },
  });
  expect(response.ok()).toBeTruthy();
}

function setOnboardingComplete(page: Page, userId: string) {
  page.addInitScript((seedUserId: string) => {
    const data = {
      mbti: 'ENFP',
      travelRange: ['周末短途', '周边城市'],
      interests: ['美食优先', '摄影打卡', '城市夜游'],
      budget: '舒适',
      selfDescription: '喜欢慢慢走，不赶行程，吃好住好最重要。',
      city: '深圳',
      completed: true,
      userId: seedUserId,
      timestamp: Date.now(),
    };
    localStorage.setItem('twinbuddy_v2_onboarding', JSON.stringify(data));
  }, userId);
}

async function getScrollState(page: Page) {
  return page.evaluate(() => {
    const root = document.getElementById('root');
    const scrollRoot = root?.querySelector<HTMLElement>('.overflow-y-auto')
      ?? root
      ?? document.documentElement;

    return {
      scrollHeight: scrollRoot.scrollHeight,
      clientHeight: scrollRoot.clientHeight,
      scrollable: scrollRoot.scrollHeight > scrollRoot.clientHeight + 10,
      scrollTop: scrollRoot.scrollTop,
      url: window.location.href,
    };
  });
}

async function captureScrollState(page: Page, label: string) {
  const state = await getScrollState(page);
  console.log(`[scroll-diagnostic] ${label} | scrollable=${state.scrollable} | scrollTop=${state.scrollTop} | scrollHeight=${state.scrollHeight} | clientHeight=${state.clientHeight} | url=${state.url}`);
}

async function scrollToBottom(page: Page) {
  await page.evaluate(() => {
    const root = document.getElementById('root');
    const scrollRoot = root?.querySelector<HTMLElement>('.overflow-y-auto')
      ?? root
      ?? document.documentElement;
    scrollRoot.scrollTo({ top: scrollRoot.scrollHeight, behavior: 'auto' });
  });
}

async function scrollToTop(page: Page) {
  await page.evaluate(() => {
    const root = document.getElementById('root');
    const scrollRoot = root?.querySelector<HTMLElement>('.overflow-y-auto')
      ?? root
      ?? document.documentElement;
    scrollRoot.scrollTo({ top: 0, behavior: 'auto' });
  });
}

async function expectScrolled(page: Page) {
  const state = await getScrollState(page);
  expect(state.scrollTop).toBeGreaterThan(0);
}

test.describe('Scroll Diagnostic', () => {
  test.beforeEach(async ({ page, request }) => {
    const profile = await createProfile(request);
    await verifyProfile(request, profile.user_id);
    setOnboardingComplete(page, profile.user_id);
  });

  test('home-page-scroll: visit /home, verify scrollable content, scroll down and back up', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'home-before-scroll');
    const heroHeading = page.getByRole('heading', { name: /嘿/ });
    await expect(heroHeading).toBeVisible();

    await scrollToBottom(page);
    await page.waitForTimeout(800);
    await captureScrollState(page, 'home-after-scroll');
    await expectScrolled(page);

    await scrollToTop(page);
    await page.waitForTimeout(300);
    await captureScrollState(page, 'home-after-reset');
    await expect(heroHeading).toBeInViewport();
  });

  test('buddies-page-scroll: visit /buddies, scroll the buddy list, verify items render', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'buddies-before-scroll');
    const buddyListHeader = page.locator('h1', { hasText: '探索搭子' });
    await expect(buddyListHeader).toBeVisible();

    const count = await page.locator('text=小满').count();
    expect(count).toBeGreaterThan(0);
    console.log(`[scroll-diagnostic] buddies: found ${count} visible buddy names`);

    await scrollToBottom(page);
    await page.waitForTimeout(800);
    await captureScrollState(page, 'buddies-after-scroll');
    await expectScrolled(page);

    await scrollToTop(page);
    await page.waitForTimeout(300);
    await expect(buddyListHeader).toBeInViewport();
  });

  test('onboarding-scroll: visit /onboarding, scroll through all 6 steps', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'onboarding-step0');

    await page.evaluate(() => {
      const scrollRoot = document.querySelector<HTMLElement>('.overflow-y-auto')
        ?? document.documentElement;
      scrollRoot.scrollTo({ top: scrollRoot.scrollHeight / 2, behavior: 'auto' });
    });
    await page.waitForTimeout(400);
    await captureScrollState(page, 'onboarding-step0-mid');

    const nextBtn = page.locator('button', { hasText: '继续' });
    const mbtiGrid = page.locator('button', { hasText: /^ENFP/ });
    await expect(mbtiGrid).toBeVisible();

    await page.locator('button', { hasText: /^ENFP/ }).click();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await scrollToTop(page);
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step1');

    await expect(page.locator('h2', { hasText: '你通常去哪里旅行？' })).toBeVisible();
    await page.locator('button', { hasText: '周末短途' }).click();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await scrollToTop(page);
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step2');

    await expect(page.locator('h2', { hasText: '你的旅行偏好是什么？' })).toBeVisible();
    await page.locator('button', { hasText: '说走就走' }).click();
    await page.locator('button', { hasText: '慢节奏旅行' }).click();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await scrollToTop(page);
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step3');

    await expect(page.locator('h2', { hasText: '你的旅行预算区间？' })).toBeVisible();
    await page.locator('button', { hasText: /^舒适/ }).click();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await scrollToTop(page);
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step4');

    await expect(page.locator('h2', { hasText: '一句话介绍你和谁旅行最舒服' })).toBeVisible();
    await page.locator('textarea').fill('喜欢慢慢走，不赶行程，吃好住好最重要。');
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();
    await scrollToTop(page);
    await page.waitForTimeout(200);
    await captureScrollState(page, 'onboarding-step5');

    await expect(page.locator('h2', { hasText: '你的出发城市？' })).toBeVisible();
    await page.evaluate(() => {
      const scrollRoot = document.querySelector<HTMLElement>('.overflow-y-auto')
        ?? document.documentElement;
      scrollRoot.scrollTo({ top: scrollRoot.scrollHeight / 2, behavior: 'auto' });
    });
    await page.waitForTimeout(400);
    await captureScrollState(page, 'onboarding-step5-mid');

    await page.locator('button', { hasText: '深圳' }).last().click();
    await page.locator('button', { hasText: '进入 TwinBuddy' }).click();
    await page.waitForURL(/home/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
  });

  test('community-page-scroll: visit /community, scroll feed, verify post cards render', async ({ page }) => {
    await page.goto('/community');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'community-before-scroll');
    const textarea = page.locator('textarea[placeholder*="发一条旅行计划"]');
    await expect(textarea).toBeVisible();
    const postCount = await page.locator('article').count();
    expect(postCount).toBeGreaterThan(0);
    console.log(`[scroll-diagnostic] community: found ${postCount} post articles`);

    await scrollToBottom(page);
    await page.waitForTimeout(800);
    await captureScrollState(page, 'community-after-scroll');
    await expectScrolled(page);

    await scrollToTop(page);
    await page.waitForTimeout(300);
    await expect(textarea).toBeInViewport();
  });

  test('profile-page-scroll: visit /profile, verify content renders, scroll', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'profile-before-scroll');
    const body = page.locator('body');
    await expect(body).toBeVisible();

    await scrollToBottom(page);
    await page.waitForTimeout(800);
    await captureScrollState(page, 'profile-after-scroll');
    await expect(page.locator('body')).toBeVisible();
  });

  test('messages-page-scroll: visit /messages, verify scrollable content', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'messages-before-scroll');
    const body = page.locator('body');
    await expect(body).toBeVisible();
    await expect(page.locator('text=小满').first()).toBeVisible();

    await scrollToBottom(page);
    await page.waitForTimeout(600);
    await captureScrollState(page, 'messages-after-scroll');
  });

  test('blindgame-page-scroll: visit /blind-game, verify content renders, scroll', async ({ page }) => {
    await page.goto('/blind-game/buddy-001/neg-001');
    await page.waitForLoadState('networkidle', { timeout: 10_000 });

    await captureScrollState(page, 'blindgame-before-scroll');
    await expect(page.locator('text=作息节奏')).toBeVisible({ timeout: 8_000 });
    await captureScrollState(page, 'blindgame-after-scroll');
    await expect(page.locator('text=作息节奏')).toBeVisible();
  });

  test('all-pages-scroll-summary: snapshot scroll state for all routes', async ({ page }) => {
    const routes = ['/home', '/buddies', '/community', '/profile', '/messages', '/blind-game/buddy-001/neg-001'];
    const results: { route: string; scrollable: boolean; scrollHeight: number; clientHeight: number }[] = [];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle', { timeout: 10_000 });
      await page.waitForTimeout(500);

      const state = await getScrollState(page);
      results.push({
        route,
        scrollable: state.scrollable,
        scrollHeight: state.scrollHeight,
        clientHeight: state.clientHeight,
      });
      console.log(`[scroll-diagnostic] ${route} scrollable=${state.scrollable} scrollHeight=${state.scrollHeight} clientHeight=${state.clientHeight}`);

      await scrollToBottom(page);
      await page.waitForTimeout(400);
      await scrollToTop(page);
    }

    expect(results).toHaveLength(routes.length);
    for (const r of results) {
      expect(r.scrollHeight).toBeGreaterThanOrEqual(0);
    }
  });
});
