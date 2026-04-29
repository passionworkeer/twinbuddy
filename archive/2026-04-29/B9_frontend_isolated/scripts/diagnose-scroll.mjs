import { chromium } from '@playwright/test';

const EXE = 'C:/Users/wang/.chromium-browser-snapshots/chromium/win64-1616264/chrome-win/chrome.exe';

async function run() {
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--no-sandbox'],
  });

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Find server
  const ports = [5173, 5176, 5177, 5178];
  for (const port of ports) {
    try {
      const r = await page.goto(`http://localhost:${port}/home`, { timeout: 5000, waitUntil: 'domcontentloaded' });
      if (r?.ok()) { console.log(`Server on ${port}`); break; }
    } catch { /* continue */ }
  }

  await page.goto(page.url(), { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    const root = document..getElementById('root');

    // Find ALL scrollable elements
    const allScrollable = Array.from(document.querySelectorAll('*')).filter(el => {
      const s = getComputedStyle(el);
      return (s.overflowY === 'scroll' || s.overflowY === 'auto');
    }).map(el => ({
      tag: el.tagName,
      id: el.id,
      className: el.className.slice(0, 80),
      overflowY: getComputedStyle(el).overflowY,
      scrollTop: (el as HTMLElement).scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      canScroll: el.scrollHeight > el.clientHeight,
      rect: el.getBoundingClientRect(),
    }));

    // Test programmatic scroll on all scrollable elements
    const testScroll = (el) => {
      const before = el.scrollTop;
      el.scrollTop += 100;
      return { before, after: el.scrollTop, delta: el.scrollTop - before };
    };

    // Check which element has the scrollbar
    const scrollbarEl = allScrollable.find(el => el.canScroll);
    const scrollbarTest = scrollbarEl ? testScroll(scrollbarEl) : null;

    // Check touch-action CSS property
    const touchActions = Array.from(document.querySelectorAll('*')).filter(el => {
      return getComputedStyle(el).touchAction !== 'auto';
    }).map(el => ({
      tag: el.tagName,
      class: el.className.slice(0, 50),
      touchAction: getComputedStyle(el).touchAction,
    }));

    return {
      rootScrollTop: root.scrollTop,
      rootScrollHeight: root.scrollHeight,
      rootClientHeight: root.clientHeight,
      allScrollable,
      scrollbarTest,
      touchActions,
    };
  });

  console.log(JSON.stringify(result, null, 2));

  // Now try: mouse wheel on the scrollable element directly
  const scrollableEl = result.allScrollable.find(el => el.canScroll);
  if (scrollableEl) {
    console.log('\nTrying mouse wheel on scrollable element:',
      scrollableEl.tag, scrollableEl.className?.slice(0, 60));

    await page.mouse.move(
      scrollableEl.rect.left + scrollableEl.rect.width / 2,
      scrollableEl.rect.top + scrollableEl.rect.height / 2
    );
    await page.mouse.wheel(0, 300);

    const afterWheel = await page.evaluate(() => {
      const scrollable = Array.from(document.querySelectorAll('*')).find(el =>
        getComputedStyle(el).overflowY === 'auto' && el.scrollHeight > el.clientHeight
      );
      return scrollable ? (scrollable as HTMLElement).scrollTop : -1;
    });
    console.log('Scroll top after wheel:', afterWheel);
  }

  await browser.close();
}

run().catch(e => { console.error(e); process.exit(1); });