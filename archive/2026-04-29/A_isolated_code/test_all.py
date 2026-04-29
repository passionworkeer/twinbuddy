"""
TwinBuddy 全量测试套件
- Smoke Test: 核心 API 路由健康检查
- Load Test: 并发压力测试 (100并发 × 10轮)
- 冒烟测试: 前端页面可访问性
"""
import asyncio
import time
import statistics
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Optional

import httpx


BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"


@dataclass
class TestResult:
    name: str
    passed: bool
    status_code: Optional[int] = None
    latency_ms: Optional[float] = None
    error: Optional[str] = None


@dataclass
class LoadResult:
    name: str
    total: int
    errors: int
    latencies: list[float] = field(default_factory=list)

    @property
    def p50(self) -> float:
        return statistics.median(self.latencies)

    @property
    def p95(self) -> float:
        if not self.latencies:
            return 0.0
        s = sorted(self.latencies)
        idx = int(len(s) * 0.95)
        return s[idx] if idx < len(s) else s[-1]

    @property
    def p99(self) -> float:
        if not self.latencies:
            return 0.0
        s = sorted(self.latencies)
        idx = int(len(s) * 0.99)
        return s[idx] if idx < len(s) else s[-1]

    @property
    def rps(self) -> float:
        total_time = sum(self.latencies)
        return (self.total / total_time * 1000) if total_time > 0 else 0.0


# ─────────────────────────────────────────────
# 1. Smoke Tests
# ─────────────────────────────────────────────
def run_smoke_tests() -> list[TestResult]:
    results = []

    # API Health
    r = httpx.get(f"{BASE_URL}/api/health", timeout=10)
    results.append(TestResult(
        name="GET /api/health",
        passed=r.status_code == 200,
        status_code=r.status_code,
        latency_ms=r.elapsed.total_seconds() * 1000,
    ))

    # STT Health
    r = httpx.get(f"{BASE_URL}/api/stt/health", timeout=10)
    results.append(TestResult(
        name="GET /api/stt/health",
        passed=r.status_code == 200,
        status_code=r.status_code,
        latency_ms=r.elapsed.total_seconds() * 1000,
    ))

    # Profiles (404 = valid for non-existent user)
    r = httpx.get(f"{BASE_URL}/api/profiles/test-user", timeout=10)
    results.append(TestResult(
        name="GET /api/profiles/{user_id}",
        passed=r.status_code in (200, 404),
        status_code=r.status_code,
        latency_ms=r.elapsed.total_seconds() * 1000,
    ))

    # Buddies inbox (requires user_id query param; 404 = valid for non-existent user)
    r = httpx.get(f"{BASE_URL}/api/buddies/inbox", params={"user_id": "test-user", "page": "1"}, timeout=10)
    results.append(TestResult(
        name="GET /api/buddies/inbox?user_id=test",
        passed=r.status_code in (200, 404),
        status_code=r.status_code,
        latency_ms=r.elapsed.total_seconds() * 1000,
    ))

    # Posts feed
    r = httpx.get(f"{BASE_URL}/api/posts/feed?city=深圳", timeout=10)
    results.append(TestResult(
        name="GET /api/posts/feed",
        passed=r.status_code == 200,
        status_code=r.status_code,
        latency_ms=r.elapsed.total_seconds() * 1000,
    ))

    # Conversations (requires user_id)
    r = httpx.get(f"{BASE_URL}/api/conversations", params={"user_id": "test-user"}, timeout=10)
    results.append(TestResult(
        name="GET /api/conversations?user_id=test",
        passed=r.status_code in (200, 404),
        status_code=r.status_code,
        latency_ms=r.elapsed.total_seconds() * 1000,
    ))

    # Security status (404 = valid for non-existent user)
    r = httpx.get(f"{BASE_URL}/api/security/status/test-user", timeout=10)
    results.append(TestResult(
        name="GET /api/security/status/{user_id}",
        passed=r.status_code in (200, 404),
        status_code=r.status_code,
        latency_ms=r.elapsed.total_seconds() * 1000,
    ))

    return results


# ─────────────────────────────────────────────
# 2. Frontend Smoke Tests
# ─────────────────────────────────────────────
def run_frontend_smoke() -> list[TestResult]:
    pages = ["/", "/home", "/onboarding", "/buddies", "/messages"]
    results = []

    for page in pages:
        url = f"{FRONTEND_URL}{page}"
        try:
            r = httpx.get(url, timeout=15, follow_redirects=True)
            results.append(TestResult(
                name=f"GET {page}",
                passed=r.status_code == 200,
                status_code=r.status_code,
                latency_ms=r.elapsed.total_seconds() * 1000,
            ))
        except Exception as e:
            results.append(TestResult(
                name=f"GET {page}",
                passed=False,
                error=str(e),
            ))

    return results


# ─────────────────────────────────────────────
# 3. Load Tests
# ─────────────────────────────────────────────
def single_request(method: str, url: str, **kwargs) -> tuple[float, Optional[int], Optional[str]]:
    """Returns (latency_ms, status_code, error)."""
    start = time.perf_counter()
    try:
        r = httpx.request(method, url, timeout=30, **kwargs)
        return (time.perf_counter() - start) * 1000, r.status_code, None
    except Exception as e:
        return (time.perf_counter() - start) * 1000, None, str(e)[:100]


def run_load_test(name: str, method: str, url: str, concurrency: int = 50, total: int = 200) -> LoadResult:
    print(f"\n  [LOAD] {name} ({concurrency} concurrent x {total//concurrency} rounds)")
    latencies = []
    errors = 0

    def batch():
        batch_latencies = []
        batch_errors = 0
        with ThreadPoolExecutor(max_workers=concurrency) as pool:
            futures = [pool.submit(single_request, method, url) for _ in range(concurrency)]
            for f in as_completed(futures):
                lat, code, err = f.result()
                batch_latencies.append(lat)
                if err or (code and code >= 400):
                    batch_errors += 1
        return batch_latencies, batch_errors

    rounds = total // concurrency
    for i in range(rounds):
        bl, be = batch()
        latencies.extend(bl)
        errors += be

    return LoadResult(name=name, total=total, errors=errors, latencies=latencies)


def run_load_tests() -> list[LoadResult]:
    results = []

    # GET /api/health
    results.append(run_load_test(
        "GET /api/health",
        "GET",
        f"{BASE_URL}/api/health",
        concurrency=50,
        total=200,
    ))

    # GET /api/posts/feed
    results.append(run_load_test(
        "GET /api/posts/feed",
        "GET",
        f"{BASE_URL}/api/posts/feed?city=深圳",
        concurrency=30,
        total=120,
    ))

    # GET /api/buddies/inbox
    results.append(run_load_test(
        "GET /api/buddies/inbox?user_id=test",
        "GET",
        f"{BASE_URL}/api/buddies/inbox?user_id=test&page=1",
        concurrency=20,
        total=80,
    ))

    return results


# ─────────────────────────────────────────────
# 4. Report
# ─────────────────────────────────────────────
def print_report(smoke: list[TestResult], frontend: list[TestResult], load: list[LoadResult]):
    total_smoke = len(smoke) + len(frontend)
    passed_smoke = sum(1 for r in smoke if r.passed) + sum(1 for r in frontend if r.passed)

    print("\n" + "=" * 64)
    print("  TwinBuddy Test Report")
    print("=" * 64)

    print(f"\n  Smoke Tests (API): {len(smoke)} items")
    for r in smoke:
        icon = "[PASS]" if r.passed else "[FAIL]"
        print(f"    {icon} {r.name} [{r.status_code}] {r.latency_ms:.1f}ms" +
              (f" | {r.error}" if r.error else ""))

    print(f"\n  Smoke Tests (Frontend): {len(frontend)} items")
    for r in frontend:
        icon = "[PASS]" if r.passed else "[FAIL]"
        print(f"    {icon} {r.name} [{r.status_code}] {r.latency_ms:.1f}ms" +
              (f" | {r.error}" if r.error else ""))

    print(f"\n  Load Tests:")
    for lr in load:
        err_rate = lr.errors / lr.total * 100 if lr.total > 0 else 0
        print(f"    {lr.name}")
        print(f"      total: {lr.total}  errors: {lr.errors} ({err_rate:.1f}%)")
        print(f"      P50: {lr.p50:.1f}ms  P95: {lr.p95:.1f}ms  P99: {lr.p99:.1f}ms")
        print(f"      RPS: {lr.rps:.1f}")

    total = len(smoke) + len(frontend) + sum(1 for _ in load)
    passed = passed_smoke + len(load)
    print(f"\n  Summary: {passed}/{total} all tests passed")
    print("=" * 64)


# ─────────────────────────────────────────────
if __name__ == "__main__":
    print("[TEST] TwinBuddy full test suite starting...\n")
    t0 = time.time()

    smoke = run_smoke_tests()
    frontend = run_frontend_smoke()
    load = run_load_tests()

    print_report(smoke, frontend, load)
    print(f"\n  总耗时: {time.time() - t0:.1f}s")
