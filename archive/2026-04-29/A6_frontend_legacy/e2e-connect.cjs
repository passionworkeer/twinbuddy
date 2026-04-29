// Full E2E test runner using existing Chromium via CDP
process.env.COMSPEC = 'C:/Windows/system32/cmd.exe';

const http = require('http');
const {spawn} = require('child_process');

function waitForUrl(url, timeout = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => resolve()).on('error', () => {
        if (Date.now() - start > timeout) reject(new Error(`Timeout: ${url}`));
        else setTimeout(check, 1000);
      });
    };
    check();
  });
}

async function run() {
  console.log('=== TwinBuddy E2E Test ===\n');

  // Start backend
  console.log('[1/5] Starting backend...');
  const backend = spawn('C:/Windows/system32/cmd.exe', ['/c', 'E:\\desktop\\hecker\\run_backend.bat'], {
    env: {...process.env, COMSPEC: 'C:/Windows/system32/cmd.exe'},
    detached: true, stdio: 'ignore', windowsHide: true
  });
  backend.unref();

  // Start frontend
  console.log('[2/5] Starting frontend...');
  const frontend = spawn('C:/Windows/system32/cmd.exe', ['/c', 'E:\\desktop\\hecker\\run_frontend.bat'], {
    env: {...process.env, COMSPEC: 'C:/Windows/system32/cmd.exe'},
    detached: true, stdio: 'ignore', windowsHide: true
  });
  frontend.unref();

  // Wait for frontend
  try {
    await waitForUrl('http://127.0.0.1:5173', 30000);
    console.log('  Frontend ready!');
  } catch(e) {
    console.error('  Frontend failed:', e.message);
  }

  // Start backend check (non-blocking)
  let backendUp = false;
  waitForUrl('http://127.0.0.1:8000/api/health', 60000).then(() => { backendUp = true; console.log('  Backend ready!'); }).catch(() => {});

  // Connect to Chromium
  console.log('[3/5] Connecting to Chromium...');
  const {chromium} = require('./node_modules/playwright-core');
  let browser;
  try {
    browser = await chromium.connectOverCDP('http://localhost:9223');
    console.log('  Connected!');
  } catch(e) {
    console.error('  Failed to connect:', e.message);
    process.exit(1);
  }

  const context = await browser.newContext({viewport: {width: 390, height: 844}});
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  try {
    // STEP 1: Onboarding - MBTI selection
    console.log('[4/5] Running test steps...');
    await page.goto('http://127.0.0.1:5173/onboarding', {waitUntil: 'networkidle', timeout: 15000});
    console.log('  Page loaded: ' + await page.title());

    // Click ENFP
    await page.getByRole('button', {name: 'ENFP'}).click();
    console.log('  Selected ENFP');

    // Should show travel preference step
    await page.waitForSelector('text=旅行方式', {timeout: 5000});
    console.log('  Travel preference step visible');

    // Select 摄影打卡
    await page.getByRole('button', {name: '摄影打卡'}).click();
    console.log('  Selected travel style: 摄影打卡');

    // Click 继续
    await page.getByRole('button', {name: '继续'}).click();
    console.log('  Clicked 继续');

    // Should show buddy description step
    await page.getByPlaceholder(/描述你理想的搭子/).waitFor({timeout: 5000});
    console.log('  Buddy description step visible');

    // Click 继续 without typing
    await page.getByRole('button', {name: '继续'}).click();
    console.log('  Skipped buddy description');

    // Should show destination step
    await page.waitForSelector('text=目的地', {timeout: 5000});
    console.log('  Destination step visible');

    // Click 开始刷搭子 - use .last() to hit the visible step-4 button,
    // not the hidden footer button (pointer-events-none at step 4)
    await page.getByRole('button', {name: '开始刷搭子'}).last().click();
    console.log('  Clicked 开始刷搭子');

    // React Router navigate() may not trigger CDP URL events reliably.
    // Poll URL until /feed is reached, with a clear fallback diagnostic.
    let navigated = false;
    try {
      await page.waitForFunction(
        () => window.location.pathname === '/feed',
        { timeout: 15000, polling: 500 }
      );
      navigated = true;
      console.log('  Navigated to /feed');
    } catch (e) {
      const currentUrl = page.url();
      console.error('  Navigation check failed. Current URL:', currentUrl);
      // Take a screenshot to see what actually rendered
      await page.screenshot({path: 'e2e-nav-debug.png'}).catch(() => {});
      console.log('  Debug screenshot saved to e2e-nav-debug.png');
      // Still consider passing if the URL contains /feed (hybrid check)
      if (currentUrl.includes('/feed')) {
        navigated = true;
        console.log('  /feed detected in URL despite polling timeout');
      }
    }

    if (!navigated) throw new Error('Failed to navigate to /feed');

    // Wait for feed content to settle
    await page.waitForTimeout(2000);
    console.log('  Feed page loaded');

    // Capture feed page screenshot
    await page.screenshot({path: 'e2e-feed-success.png', fullPage: false});
    console.log('  Feed screenshot saved to e2e-feed-success.png');

    passed++;
    console.log('\nALL E2E TESTS PASSED (' + passed + ' steps)');

  } catch(e) {
    failed++;
    console.error('\nE2E TEST FAILED:', e.message);
    await page.screenshot({path: 'e2e-failure.png'}).catch(() => {});
    console.log('Screenshot saved to e2e-failure.png');
  } finally {
    await browser.close();
  }

  // Cleanup
  try { process.kill(-backend.pid, 'SIGTERM'); } catch(e) {}
  try { process.kill(-frontend.pid, 'SIGTERM'); } catch(e) {}
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
