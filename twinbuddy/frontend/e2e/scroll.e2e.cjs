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
      const r = await page.goto(`http://localhost:${port}`, { timeout: 3000, waitUntil: 'domcontentloaded' });
      if (r && r.ok()) { baseUrl = 'http://localhost:' + port; console.log('Dev server: ' + baseUrl); break; }
    } catch (_) { /* continue */ }
  }

  const pages = [
    { path: '/home', label: 'Home' },
    { path: '/buddies', label: 'Buddies' },
    { path: '/onboarding', label: 'Onboarding' },
  ];

  let allPassed = true;

  for (const { path, label } of pages) {
    await page.goto(baseUrl + path, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // Get initial state and max scroll
    const info = await page.evaluate(function() {
      var el = Array.from(document.querySelectorAll('*')).find(function(e) {
        var s = getComputedStyle(e);
        return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
      });
      if (!el) return null;
      var r = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        className: el.className.slice(0, 80),
        maxScroll: el.scrollHeight - el.clientHeight,
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
      };
    });

    if (!info) { console.log('[FAIL] ' + label + ': no scrollable element found'); allPassed = false; continue; }
    var maxScroll = info.maxScroll;
    var wheelAmount = Math.min(200, maxScroll || 1);

    // Reset scroll to 0
    await page.evaluate(function() {
      var el = Array.from(document.querySelectorAll('*')).find(function(e) {
        var s = getComputedStyle(e);
        return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
      });
      if (el) el.scrollTop = 0;
    });
    await page.waitForTimeout(100);

    // Programmatic scroll test: scroll by 200 (capped at maxScroll)
    const progScroll = await page.evaluate(function() {
      var el = Array.from(document.querySelectorAll('*')).find(function(e) {
        var s = getComputedStyle(e);
        return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
      });
      if (!el) return -1;
      var b = el.scrollTop;
      var target = Math.min(b + 200, el.scrollHeight - el.clientHeight);
      el.scrollTop = target;
      var d = el.scrollTop - b;
      el.scrollTop = b; // reset
      return d;
    });

    // Wheel scroll: mouse over element, wheel 200px (capped)
    await page.mouse.move(info.cx, info.cy);
    await page.waitForTimeout(50);
    await page.mouse.wheel(0, wheelAmount);
    await page.waitForTimeout(200);

    const wheelScroll = await page.evaluate(function() {
      var el = Array.from(document.querySelectorAll('*')).find(function(e) {
        var s = getComputedStyle(e);
        return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
      });
      return el ? el.scrollTop : -1;
    });

    // Pass criteria: programmatic worked, wheel moved > 0
    var progOk = progScroll >= Math.min(200, maxScroll) - 1; // allow 1px tolerance
    var wheelOk = wheelScroll > 0;

    if (!progOk || !wheelOk) allPassed = false;

    var status = progOk && wheelOk ? 'PASS' : 'FAIL';
    console.log('[' + status + '] ' + label + ': prog=' + progScroll + '/' + Math.min(200, maxScroll) + ' wheel=' + wheelScroll + 'px');
  }

  await browser.close();
  console.log('\n' + (allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'));
  process.exit(allPassed ? 0 : 1);
}

run().catch(function(e) { console.error(e); process.exit(1); });