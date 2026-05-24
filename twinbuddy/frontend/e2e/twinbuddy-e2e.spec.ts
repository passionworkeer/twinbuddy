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

function expectPath(page: Page, path: string) {
  expect(page.url()).toMatch(new RegExp(`127\\.0\\.0\\.1:5173(${path})?$`));
}

test.describe('Feed & TwinCard', () => {
  test.beforeEach(async ({ page, request }) => {
    const profile = await createProfile(request);
    await verifyProfile(request, profile.user_id);
    setOnboardingComplete(page, profile.user_id);
  });

  test('feed-scroll: navigate to home, scroll the feed, verify cards are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL(/home/, { timeout: 10_000 });

    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    await expect(page.getByRole('heading', { name: '推荐搭子' })).toBeVisible();
    const carouselCards = page.locator('.overflow-x-auto > article').first();
    await expect(carouselCards).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
  });

  test('card-layer-1: on home page, verify key content and feed section', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
    await expect(page.locator('text=ENFP').first()).toBeVisible();
    await expect(page.locator('text=深圳').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: '推荐搭子' })).toBeVisible();
    await expect(page.locator('text=测试 MBTI')).toBeVisible();
    await expect(page.locator('text=推荐路线')).toBeVisible();
  });

  test('card-expand-layer2: on buddies page, open a card, verify layer 2 opens', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    await page.getByRole('heading', { name: '小满', exact: true }).click();
    await page.waitForTimeout(800);

    await expect(page.locator('text=Layer 2 协商详情')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=契合雷达')).toBeVisible();
    await expect(page.getByText('数字分身协商记录').first()).toBeVisible();
    await expect(page.locator('text=适合进入盲选').first()).toBeVisible();
    await expect(page.locator('button', { hasText: '开始盲选' })).toBeVisible();
    await expect(page.locator('button', { hasText: '私信' })).toBeVisible();
    await expect(page.locator('button', { hasText: '跳过' })).toBeVisible();
    await expect(page.locator('text=已经达成的共识')).toBeVisible();
  });

  test('card-expand-layer3: open layer 2, verify layer 3 action flow is accessible', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    await page.getByRole('heading', { name: '小满', exact: true }).click();
    await expect(page.locator('text=Layer 2 协商详情')).toBeVisible({ timeout: 5_000 });
    const blindGameBtn = page.locator('button', { hasText: '开始盲选' });
    await expect(blindGameBtn).toBeVisible();
    await expect(blindGameBtn).toBeEnabled();
  });
});

test.describe('Onboarding', () => {
  test('onboarding-persistence: complete full 6-step onboarding and verify persistence', async ({ page, request }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const step1Heading = page.locator('h2', { hasText: '你的 MBTI 是？' });
    await expect(step1Heading).toBeVisible();
    await page.locator('button', { hasText: /^ENFP/ }).click();
    await page.waitForTimeout(200);
    const nextBtn = page.locator('button', { hasText: '继续' });
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    await expect(page.locator('h2', { hasText: '你通常去哪里旅行？' })).toBeVisible();
    await page.locator('button', { hasText: '周末短途' }).click();
    await page.locator('button', { hasText: '周边城市' }).click();
    await page.waitForTimeout(200);
    await nextBtn.click();

    await expect(page.locator('h2', { hasText: '你的旅行偏好是什么？' })).toBeVisible();
    await page.locator('button', { hasText: '美食优先' }).click();
    await page.locator('button', { hasText: '摄影打卡' }).click();
    await page.waitForTimeout(200);
    await nextBtn.click();

    await expect(page.locator('h2', { hasText: '你的旅行预算区间？' })).toBeVisible();
    await page.locator('button', { hasText: /^舒适/ }).click();
    await page.waitForTimeout(200);
    await nextBtn.click();

    await expect(page.locator('h2', { hasText: '一句话介绍你和谁旅行最舒服' })).toBeVisible();
    const textarea = page.locator('textarea');
    await textarea.fill('喜欢慢慢走，不赶行程，吃好住好最重要。');
    await page.waitForTimeout(200);
    await nextBtn.click();

    await expect(page.locator('h2', { hasText: '你的出发城市？' })).toBeVisible();
    const cityInput = page.locator('input[placeholder*="深圳"]').first();
    await cityInput.fill('深圳');
    await page.waitForTimeout(200);
    await page.locator('button', { hasText: '深圳' }).last().click();
    await page.waitForTimeout(200);

    const submitBtn = page.locator('button', { hasText: '进入 TwinBuddy' });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    await page.waitForURL(/home/, { timeout: 15_000 });

    const lsValue = await page.evaluate(() => localStorage.getItem('twinbuddy_v2_onboarding'));
    expect(lsValue).not.toBeNull();
    const parsed = JSON.parse(lsValue!);
    expect(parsed.completed).toBe(true);
    expect(parsed.mbti).toBe('ENFP');
    expect(parsed.userId).toMatch(/^user_/);

    const profileResponse = await request.get(`http://127.0.0.1:8000/api/profiles/${parsed.userId}`);
    expect(profileResponse.ok()).toBeTruthy();

    await page.reload();
    await page.waitForURL(/home/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
  });

  test('onboarding-step-requires: cannot advance without selection; selecting MBTI enables next', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const continueBtn = page.locator('button', { hasText: '继续' });
    await expect(continueBtn).toBeDisabled();
    await continueBtn.click({ force: true });
    await expect(page.locator('h2', { hasText: '你的 MBTI 是？' })).toBeVisible();
    await page.locator('button', { hasText: /^ENFP/ }).click();
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();
    await expect(page.locator('h2', { hasText: '你通常去哪里旅行？' })).toBeVisible();
  });
});

test.describe('Buddies & Radar Chart', () => {
  test.beforeEach(async ({ page, request }) => {
    const profile = await createProfile(request);
    await verifyProfile(request, profile.user_id);
    setOnboardingComplete(page, profile.user_id);
  });

  test('radar-chart-renders: on Buddies page, open a buddy card, verify the radar chart SVG is visible', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.getByText('小满').click();
    await expect(page.locator('text=契合雷达')).toBeVisible({ timeout: 5_000 });
    const radarSvg = page.locator('svg[viewBox]').first();
    await expect(radarSvg).toBeVisible();
    await expect(page.locator('text=行程节奏').first()).toBeVisible();
  });

  test('negotiation-thread-visible: after opening a card, verify negotiation messages are shown', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    await page.getByRole('heading', { name: '小满', exact: true }).click();
    await expect(page.locator('text=数字分身协商记录').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('text=数字分身').first()).toBeVisible();
    await expect(page.locator('text=适合进入盲选').first()).toBeVisible();
  });

  test('buddy-card-popup: on buddies page, click a buddy card, verify BuddyDetailModal opens', async ({ page }) => {
    await page.goto('/buddies');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const firstBuddyHeading = page.getByRole('heading', { name: '小满', exact: true });
    const firstBuddyName = await firstBuddyHeading.textContent();
    await firstBuddyHeading.click();

    await expect(page.locator('text=Layer 2 协商详情')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(`text=${firstBuddyName}`).first()).toBeVisible();
    const matchScoreBadge = page.locator('[class*="rounded-full"][class*="bg-primary"]').first();
    await expect(matchScoreBadge).toBeVisible();
    const closeBtn = page.getByRole('button', { name: /返回/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Layer 2 协商详情')).not.toBeVisible();
  });
});

test.describe('Community', () => {
  test.beforeEach(async ({ page, request }) => {
    const profile = await createProfile(request);
    setOnboardingComplete(page, profile.user_id);
  });

  test('community-post: on community page, write a post, submit, verify it appears in the feed', async ({ page }) => {
    await page.goto('/community');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    const postTextarea = page.locator('textarea[placeholder*="发一条旅行计划"]');
    await expect(postTextarea).toBeVisible();

    const testContent = '周末去顺德吃鱼生，找一个不赶行程的搭子，慢慢逛老城区。';
    await postTextarea.fill(testContent);

    const publishBtn = page.locator('button', { hasText: '发布动态' });
    await expect(publishBtn).toBeEnabled();
    await publishBtn.click();

    await expect(page.locator('text=动态已发布')).toBeVisible({ timeout: 5_000 });
    const newPost = page.locator('article').filter({ hasText: testContent }).first();
    await expect(newPost).toBeVisible();
    await expect(newPost.locator('text=深圳').first()).toBeVisible();
  });
});

test.describe('Bottom Navigation', () => {
  test.beforeEach(async ({ page, request }) => {
    const profile = await createProfile(request);
    await verifyProfile(request, profile.user_id);
    setOnboardingComplete(page, profile.user_id);
  });

  test('bottom-nav-switch: click through all 5 bottom nav tabs and verify each page loads', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    await expect(page.getByRole('heading', { name: /嘿/ })).toBeVisible();
    expectPath(page, '/home');

    await page.evaluate(() => {
      const link = document.querySelector('nav a[href="/buddies"]');
      if (link) (link as HTMLAnchorElement).click();
    });
    await page.waitForURL(/buddies/, { timeout: 8_000 });
    await expect(page.getByRole('heading', { name: '探索搭子' })).toBeVisible();
    expectPath(page, '/buddies');

    await page.evaluate(() => {
      const link = document.querySelector('nav a[href="/messages"]');
      if (link) (link as HTMLAnchorElement).click();
    });
    await page.waitForURL(/messages/, { timeout: 8_000 });
    expectPath(page, '/messages');

    await page.evaluate(() => {
      const link = document.querySelector('nav a[href="/community"]');
      if (link) (link as HTMLAnchorElement).click();
    });
    await page.waitForURL(/community/, { timeout: 8_000 });
    await expect(page.locator('text=把旅行计划')).toBeVisible();
    expectPath(page, '/community');

    await page.evaluate(() => {
      const link = document.querySelector('nav a[href="/profile"]');
      if (link) (link as HTMLAnchorElement).click();
    });
    await page.waitForURL(/profile/, { timeout: 8_000 });
    expectPath(page, '/profile');
  });
});

test.describe('BlindGame', () => {
  test.beforeEach(async ({ page, request }) => {
    const profile = await createProfile(request);
    await verifyProfile(request, profile.user_id);
    setOnboardingComplete(page, profile.user_id);
  });

  test('blindgame-ab-select: on BlindGame page, verify A/B options are present and selection registers', async ({ page }) => {
    await page.goto('/blind-game/buddy-001/neg-001');
    await expect(page.locator('text=作息节奏')).toBeVisible({ timeout: 10_000 });
    const optionA = page.getByRole('button', { name: /早睡早起/i });
    const optionB = page.getByRole('button', { name: /晚睡晚起/i });
    await expect(optionA).toBeVisible();
    await expect(optionB).toBeVisible();
    await optionA.click();
    await expect(page.locator('text=行程风格')).toBeVisible({ timeout: 5_000 });
  });

  test('blindgame-report-flow: completing rounds renders a report', async ({ page }) => {
    await page.goto('/blind-game/buddy-001/neg-001');
    await expect(page.locator('text=作息节奏')).toBeVisible({ timeout: 10_000 });
    const answers = ['早睡早起', '计划周全', '省钱第一', '必须出片', '社交达人', '深度美食游'];
    for (const answer of answers) {
      await page.getByRole('button', { name: new RegExp(answer) }).click();
    }
    await expect(page.locator('text=默契报告已生成')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/匹配得分/)).toBeVisible();
  });
});
