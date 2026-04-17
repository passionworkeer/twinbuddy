// OnboardingPage TDD Tests
// Tests: step navigation, voice/text optionality, city optionality

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import OnboardingPage from "../pages/OnboardingPage";
import type { OnboardingData } from "../types";

const STORAGE_KEY = "twinbuddy_onboarding_v3";

function clearStorage() { localStorage.removeItem(STORAGE_KEY); }

function setStorage(data: Partial<OnboardingData>) {
  const defaults: OnboardingData = { mbti: "", interests: [], voiceText: "", city: "", completed: false, timestamp: 0 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaults, ...data }));
}

function renderOnboarding() {
  clearStorage();
  return render(<BrowserRouter><OnboardingPage /></BrowserRouter>);
}

function getContinueBtn() {
  return screen.getByRole("button", { name: /继续|开始刷搭子/i });
}

// Advance from step 1 to target step using continue button
async function advanceTo(user: ReturnType<typeof userEvent.setup>, targetStep: number) {
  for (let i = 0; i < targetStep - 1; i++) {
    await user.click(getContinueBtn());
  }
}

// ── Step 1: MBTI ─────────────────────────────────────────────────────────────

describe("Step 1: MBTI", () => {
  beforeEach(() => clearStorage());

  it("shows MBTI grid", () => {
    renderOnboarding();
    expect(screen.getByText(/你是哪种旅行者/)).toBeInTheDocument();
  });

  it("continue disabled when no MBTI selected", () => {
    renderOnboarding();
    expect(getContinueBtn()).toBeDisabled();
  });

  it("continue enabled after selecting MBTI", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    expect(getContinueBtn()).toBeEnabled();
  });

  it("selecting MBTI shows label", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    expect(screen.getByText(/热情开拓者/)).toBeInTheDocument();
  });
});

// ── Step 2: Interests ────────────────────────────────────────────────────────

describe("Step 2: Interests", () => {
  beforeEach(() => clearStorage());

  it("continue disabled when no interest selected", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await user.click(getContinueBtn());
    expect(getContinueBtn()).toBeDisabled();
  });

  it("continue enabled after selecting at least 1 interest", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await user.click(getContinueBtn());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    expect(getContinueBtn()).toBeEnabled();
  });
});

// ── Step 3: VoiceOrText ───────────────────────────────────────────────────────

describe("Step 3: VoiceOrText (both optional)", () => {
  beforeEach(() => clearStorage());

  it("shows text input on step 3", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await user.click(getContinueBtn());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await user.click(getContinueBtn());
    expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument();
  });

  it("continue ALWAYS enabled on step 3 (voice and text are optional)", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await user.click(getContinueBtn());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await user.click(getContinueBtn());
    expect(getContinueBtn()).toBeEnabled();
  });

  it("can advance to step 4 with no voice/text", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await user.click(getContinueBtn());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await user.click(getContinueBtn());
    await user.click(getContinueBtn());
    expect(screen.getByText(/你想去哪/)).toBeInTheDocument();
  });
});

// ── Step 4: City (optional) ───────────────────────────────────────────────────

describe("Step 4: City (optional)", () => {
  beforeEach(() => clearStorage());

  it("shows city selection on step 4", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await advanceTo(user, 4);
    expect(screen.getByText(/你想去哪/)).toBeInTheDocument();
  });

  it("continue ALWAYS enabled on step 4 (city is optional)", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await advanceTo(user, 4);
    expect(getContinueBtn()).toBeEnabled();
  });

  it("browse button completes onboarding without city", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await advanceTo(user, 4);
    const browseBtn = screen.getByRole("button", { name: /随便看看/i });
    await user.click(browseBtn);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as OnboardingData;
    expect(stored.completed).toBe(true);
    expect(stored.city).toBe("");
  });
});

// ── Full Flows ────────────────────────────────────────────────────────────────

describe("Full onboarding flows", () => {
  beforeEach(() => clearStorage());

  it("complete flow: MBTI + interest + voice text + city", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await user.click(getContinueBtn());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await user.click(getContinueBtn());
    expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText(/描述你理想的搭子/);
    await user.clear(textarea);
    await user.type(textarea, "喜欢慢节奏的旅行");
    await user.click(getContinueBtn());
    expect(screen.getByText(/你想去哪/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /成都/i }));
    await user.click(getContinueBtn());
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as OnboardingData;
    expect(stored.completed).toBe(true);
    expect(stored.mbti).toBe("ENFP");
    expect(stored.city).toBe("chengdu");
  });

  it("minimal flow: MBTI + interest -> skip voice -> skip city", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await user.click(getContinueBtn());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await user.click(getContinueBtn());
    // Step 3: no voice/text, just continue
    await user.click(getContinueBtn());
    // Step 4: browse button
    expect(screen.getByText(/你想去哪/)).toBeInTheDocument();
    const browseBtn = screen.getByRole("button", { name: /随便看看/i });
    await user.click(browseBtn);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as OnboardingData;
    expect(stored.completed).toBe(true);
    expect(stored.mbti).toBe("ENFP");
    expect(stored.city).toBe("");
  });
});
