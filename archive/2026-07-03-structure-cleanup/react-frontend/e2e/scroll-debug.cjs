const { chromium } = require('@playwright/test');

const EXE = 'C:/Users/wang/.chromium-browser-snapshots/chromium/win64-1616264/chrome-win/chrome.exe';

async function run() {
  const browser = await chromium.launch({ executablePath: EXE, headless: true, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Find server
  const ports = [5173, 5176, 5177, 5178];
  let baseUrl = 'http://localhost:5176';
  for (const port of ports) {
    try {
      const r = await page.goto(`http://localhost:${port}/home`, { timeout: 3000, waitUntil: 'domcontentloaded' });
      if (r && r.ok()) { baseUrl = 'http://localhost:' + port; console.log('Server: ' + baseUrl); break; }
    } catch (_) { /* continue */ }
  }

  await page.goto(baseUrl + '/home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Find scrollable element and its center
  const scrollInfo = await page.evaluate(function() {
    var el = Array.from(document.querySelectorAll('*')).find(function(e) {
      var s = getComputedStyle(e);
      return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
    });
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return {
      rect: { top: r.top, left: r.left, w: r.width, h: r.height },
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      tag: el.tagName,
      className: el.className.slice(0, 80),
      overflowY: getComputedStyle(el).overflowY,
    };
  });

  console.log('Scrollable element:', JSON.stringify(scrollInfo, null, 2));

  // Test programmatic
  const prog = await page.evaluate(function() {
    var el = Array.from(document.querySelectorAll('*')).find(function(e) {
      var s = getComputedStyle(e);
      return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
    });
    if (!el) return null;
    var b = el.scrollTop;
    el.scrollTop += 200;
    var d = el.scrollTop - b;
    el.scrollTop = b;
    return { before: b, after: el.scrollTop, delta: d };
  });
  console.log('Programmatic:', JSON.stringify(prog));

  // Reset scroll to 0
  await page.evaluate(function() {
    var el = Array.from(document.querySelectorAll('*')).find(function(e) {
      var s = getComputedStyle(e);
      return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
    });
    if (el) el.scrollTop = 0;
  });

  // Move mouse and wheel
  console.log('Moving mouse to', scrollInfo.cx, scrollInfo.cy, 'and wheeling...');
  await page.mouse.move(scrollInfo.cx, scrollInfo.cy);
  await page.waitForTimeout(100);

  // Try different wheel amounts
  for (const delta of [100, 200, 500]) {
    await page.evaluate(function() {
      var el = Array.from(document.querySelectorAll('*')).find(function(e) {
        var s = getComputedStyle(e);
        return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
      });
      if (el) el.scrollTop = 0;
    });
    await page.waitForTimeout(100);
    await page.mouse.wheel(0, delta);
    await page.waitForTimeout(300);
    const st = await page.evaluate(function() {
      var el = Array.from(document.querySelectorAll('*')).find(function(e) {
        var s = getComputedStyle(e);
        return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
      });
      return el ? el.scrollTop : -1;
    });
    console.log('wheel(' + delta + ') -> scrollTop=' + st);
  }

  // Try dispatchEvent wheel
  const dispatched = await page.evaluate(function() {
    var el = Array.from(document.querySelectorAll('*')).find(function(e) {
      var s = getComputedStyle(e);
      return (s.overflowY === 'scroll' || s.overflowY === 'auto') && e.scrollHeight > e.clientHeight;
    });
    if (!el) return 'none';
    el.scrollTop = 0;
    var evt = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 300 });
    var result = el.dispatchEvent(evt);
    return { dispatched: result, scrollTop: el.scrollTop };
  });
  console.log('dispatchEvent WheelEvent(300):', JSON.stringify(dispatched));

  await browser.close();
}

run().catch(function(e) { console.error(e); process.exit(1); });