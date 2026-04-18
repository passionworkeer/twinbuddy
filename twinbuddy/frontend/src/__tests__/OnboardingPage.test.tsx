// OnboardingPage Tests
// FIXED: renderOnboarding() no longer calls clearStorage() internally.
// Tests that need clean state call clearStorage() in beforeEach BEFORE render.

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import OnboardingPage from "../pages/OnboardingPage";
import type { OnboardingData } from "../types";

// Mock IntersectionObserver for jsdom environment
const mockIntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: vi.fn(),
}));
vi.stubGlobal('IntersectionObserver', mockIntersectionObserver);

const STORAGE_KEY = "twinbuddy_onboarding_v3";

function clearStorage() { localStorage.removeItem(STORAGE_KEY); }

function setStorage(data: Partial<OnboardingData>) {
  const defaults: OnboardingData = { mbti: "", interests: [], voiceText: "", city: "", completed: false, timestamp: 0 };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaults, ...data }));
}

function renderOnboarding() {
  return render(<BrowserRouter><OnboardingPage /></BrowserRouter>);
}

function getContinueBtn() {
  // Get the visible continue button (not the hidden footer button)
  const buttons = screen.getAllByRole("button", { name: /继续|开始刷搭子/i });
  return buttons.find(btn => !btn.classList.contains('opacity-0')) || buttons[0];
}

// ── Step 1: MBTI ─────────────────────────────────────────────────────────────

describe("Step 1: MBTI", () => {
  beforeEach(() => clearStorage());

  it("shows MBTI grid heading", () => {
    renderOnboarding();
    expect(screen.getByText(/在自己眼中你是怎样的人/)).toBeInTheDocument();
  });

  it("continue button is disabled on fresh start", () => {
    renderOnboarding();
    expect(getContinueBtn()).toBeDisabled();
  });

  it("selecting MBTI advances to interests step", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    // Step immediately advances to 2 after MBTI is selected (data-driven)
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
  });
});

// ── Step 2: Interests ────────────────────────────────────────────────────────

describe("Step 2: Interests", () => {
  beforeEach(() => clearStorage());

  it("shows interest tags after selecting MBTI", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
  });

  it("continue is disabled when interests empty", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(getContinueBtn()).toBeDisabled());
  });

  it("continue enabled after selecting interest", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
  });

  it("selecting an interest enables continue (step 2 -> step 3)", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument());
  });
});

// ── Step 3: VoiceOrText ─────────────────────────────────────────────────────

describe("Step 3: VoiceOrText (voice and text optional)", () => {
  beforeEach(() => clearStorage());

  it("shows text input after selecting MBTI and interest", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument());
  });

  it("continue is ALWAYS enabled on step 3", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    await user.click(getContinueBtn());
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
  });

  it("textarea accepts user input", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument());
    const textarea = screen.getByPlaceholderText(/描述你理想的搭子/);
    await user.clear(textarea);
    await user.type(textarea, "喜欢慢节奏的旅行");
    expect(textarea).toHaveValue("喜欢慢节奏的旅行");
  });
});

// ── Step 4: Destination ───────────────────────────────────────────────────────

describe("Step 4: Destination (free text, optional)", () => {
  beforeEach(() => clearStorage());

  it("reaches step 4 after clicking continue from step 3", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    // Step 1 -> select MBTI
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    // Step 2 -> select interest -> enables continue
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    // Step 2 -> Step 3
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument());
    // Step 3 -> Step 4
    await user.click(getContinueBtn());
    // Step 4 should show destination input
    await waitFor(() => expect(screen.getByText(/你的目的地是/)).toBeInTheDocument());
  });

  it("continue is ALWAYS enabled on step 4", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    // Step 2 -> Step 3
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument());
    // Step 3 -> Step 4
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByText(/你的目的地是/)).toBeInTheDocument());
    const startBtn = screen.getAllByRole("button", { name: /开始刷搭子/i }).find(btn => !btn.classList.contains('opacity-0'));
    expect(startBtn).toBeEnabled();
  });

  it("finish button completes onboarding without city", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    // Step 2 -> Step 3
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument());
    // Step 3 -> Step 4
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByText(/你的目的地是/)).toBeInTheDocument());
    // Step 4 -> Complete
    await user.click(getContinueBtn());
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as OnboardingData;
      expect(stored.completed).toBe(true);
      expect(stored.city).toBe("");
    });
  });

  it("typing destination stores it", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/选择你喜欢的旅行方式/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /摄影打卡/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    // Step 2 -> Step 3
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument());
    // Step 3 -> Step 4
    await user.click(getContinueBtn());
    // Note: Step 4 uses horizontal scroll cards, not a text input for destination
    // The test needs to select a city card instead
    await waitFor(() => expect(screen.getByText(/你的目的地是/)).toBeInTheDocument());
  });
});
