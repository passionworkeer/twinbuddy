const { chromium } = require('@playwright/test');

const EXE = 'C:/Users/wang/.chromium-browser-snapshots/chromium/win64-1616264/chrome-win/chrome.exe';

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  const ports = [5173, 5176, 5177, 5178];
  let baseUrl = 'http://localhost:5176';
  for (const port of ports) {
    try {
      const r = await page.goto(`http://localhost:${port}/home`, { timeout: 5000, waitUntil: 'domcontentloaded' });
      if (r && r.ok()) { baseUrl = 'http://localhost:' + port; console.log('Server on ' + port); break; }
    } catch (_) { /* continue */ }
  }

  // Test each page
  const pages = [
    { url: baseUrl + '/home', label: 'Home' },
    { url: baseUrl + '/buddies', label: 'Buddies' },
    { url: baseUrl + '/onboarding', label: 'Onboarding' },
  ];

  for (const p of pages) {
    await page.goto(p.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(500);

    const r = await page.evaluate(function() {
      // Find the scrollable content element inside AppShell
      var allScrollable = Array.from(document.querySelectorAll('*')).filter(function(el) {
        var s = getComputedStyle(el);
        return (s.overflowY === 'scroll' || s.overflowY === 'auto') && el.scrollHeight > el.clientHeight;
      });

      var scrollEl = allScrollable[0]; // should be the inner scroll container
      var rect = scrollEl ? scrollEl.getBoundingClientRect() : null;
      var cs = scrollEl ? getComputedStyle(scrollEl) : null;

      // Programmatic scroll test
      var scrollResult = null;
      if (scrollEl) {
        var before = scrollEl.scrollTop;
        scrollEl.scrollTop += 200;
        var delta = scrollEl.scrollTop - before;
        scrollEl.scrollTop = before;
        scrollResult = { tag: scrollEl.tagName, className: scrollEl.className.slice(0, 80), before: before, delta: delta };
      }

      // Wheel test
      var wheelResult = null;
      if (rect) {
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        // move mouse and wheel
        return { scrollResult: scrollResult, rect: { top: Math.round(rect.top), left: Math.round(rect.left), w: Math.round(rect.width), h: Math.round(rect.height) } };
      }

      return { scrollResult: scrollResult };
    });

    // Mouse wheel on the scrollable element
    var scrollElBox = r.rect;
    if (scrollElBox) {
      await page.mouse.move(scrollElBox.left + scrollElBox.w / 2, scrollElBox.top + scrollElBox.h / 2);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(300);
    }

    var afterWheel = await page.evaluate(function() {
      var el = Array.from(document.querySelectorAll('*')).find(function(e) {
        return (getComputedStyle(e).overflowY === 'scroll' || getComputedStyle(e).overflowY === 'auto') && e.scrollHeight > e.clientHeight;
      });
      return el ? el.scrollTop : -1;
    });

    console.log(p.label + ': scrollResult=' + JSON.stringify(r.scrollResult) + ' | wheel=' + afterWheel + 'px');
  }

  await browser.close();
}

run().catch(function(e) { console.error(e); process.exit(1); });