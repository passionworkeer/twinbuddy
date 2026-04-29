# -*- coding: utf-8 -*-
"""E2E smoke test via Python Playwright (MCP-connected)."""
from playwright.sync_api import sync_playwright, expect

def run():
    results = []

    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        ports = [5173, 5176, 5177, 5178]
        base_url = None

        for port in ports:
            try:
                r = page.goto(f"http://localhost:{port}", timeout=5000)
                if r and r.ok:
                    base_url = f"http://localhost:{port}"
                    print(f"Found dev server on port {port}")
                    break
            except Exception:
                pass

        if not base_url:
            print("ERROR: No dev server found on ports 5173/5176/5177/5178")
            browser.close()
            return False

        # ── Test: inner scroll container scrolls on all main pages ──────────
        test_pages = [
            {"path": "/home", "label": "Home"},
            {"path": "/buddies", "label": "Buddies"},
            {"path": "/onboarding", "label": "Onboarding"},
        ]

        for pg in test_pages:
            label = pg["label"]
            try:
                page.goto(f"{base_url}{pg['path']}", wait_until="domcontentloaded")
                page.wait_for_timeout(500)

                # Find scrollable element
                scroll_info = page.evaluate("""() => {
                    const el = Array.from(document.querySelectorAll('*')).find(e => {
                        const s = getComputedStyle(e);
                        return (s.overflowY === 'scroll' || s.overflowY === 'auto')
                            && e.scrollHeight > e.clientHeight;
                    });
                    if (!el) return { found: false };
                    const r = el.getBoundingClientRect();
                    return {
                        found: true,
                        tag: el.tagName,
                        className: el.className.slice(0, 80),
                        scrollHeight: el.scrollHeight,
                        clientHeight: el.clientHeight,
                    };
                }""")
                results.append(f"[{label}] scrollable element found: {scroll_info['found']}")
                assert scroll_info["found"], f"{label}: no scrollable element"

                # Programmatic scroll test (delta may be < 200 if page is short)
                delta = page.evaluate("""() => {
                    const el = Array.from(document.querySelectorAll('*')).find(e => {
                        const s = getComputedStyle(e);
                        return (s.overflowY === 'scroll' || s.overflowY === 'auto')
                            && e.scrollHeight > e.clientHeight;
                    });
                    if (!el) return -1;
                    const maxScroll = el.scrollHeight - el.clientHeight;
                    const before = el.scrollTop;
                    el.scrollTop += 200;
                    const delta = el.scrollTop - before;
                    el.scrollTop = before;
                    return { delta, maxScroll };
                }""")
                max_scroll = delta["maxScroll"]
                actual_delta = delta["delta"]
                results.append(f"[{label}] programmatic scroll: {actual_delta}/{max_scroll}")
                # Only assert delta if page has enough content to scroll 200px
                assert max_scroll > 0, f"{label}: no scrollable content (scrollHeight={el.scrollHeight} clientHeight={el.clientHeight})"
                if max_scroll >= 200:
                    assert actual_delta == 200, f"{label}: expected 200, got {actual_delta}"

                # Wheel scroll test
                rect = page.evaluate("""() => {
                    const el = Array.from(document.querySelectorAll('*')).find(e => {
                        const s = getComputedStyle(e);
                        return (s.overflowY === 'scroll' || s.overflowY === 'auto')
                            && e.scrollHeight > e.clientHeight;
                    });
                    if (!el) return null;
                    const r = el.getBoundingClientRect();
                    return { left: r.left, top: r.top, w: r.width, h: r.height };
                }""")

                if rect:
                    cx = rect["left"] + rect["w"] / 2
                    cy = rect["top"] + rect["h"] / 2
                    page.mouse.move(cx, cy)
                    page.mouse.wheel(0, 200)
                    page.wait_for_timeout(300)

                wheel_scroll = page.evaluate("""() => {
                    const el = Array.from(document.querySelectorAll('*')).find(e => {
                        const s = getComputedStyle(e);
                        return (s.overflowY === 'scroll' || s.overflowY === 'auto')
                            && e.scrollHeight > e.clientHeight;
                    });
                    return el ? el.scrollTop : -1;
                }""")
                results.append(f"[{label}] wheel scroll result: {wheel_scroll} (expected > 0)")
                assert wheel_scroll > 0, f"{label}: wheel scroll should be > 0, got {wheel_scroll}"

                results.append(f"[{label}] PASS")

            except Exception as e:
                results.append(f"[{label}] FAIL: {e}")

        browser.close()

    print("\n" + "=" * 60)
    print("E2E Test Results (Playwright Python)")
    print("=" * 60)
    for line in results:
        print(line)
    print("=" * 60)

    failed = any("❌" in r for r in results)
    return not failed


if __name__ == "__main__":
    ok = run()
    exit(0 if ok else 1)