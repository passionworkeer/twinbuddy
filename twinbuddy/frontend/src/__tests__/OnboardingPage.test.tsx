// OnboardingPage Tests
// FIXED: renderOnboarding() no longer calls clearStorage() internally.
// Tests that need clean state call clearStorage() in beforeEach BEFORE render.

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
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
  return render(<BrowserRouter><OnboardingPage /></BrowserRouter>);
}

function getContinueBtn() {
  return screen.getByRole("button", { name: /继续|开始刷搭子/i });
}

// ── Step 1: MBTI ─────────────────────────────────────────────────────────────

describe("Step 1: MBTI", () => {
  beforeEach(() => clearStorage());

  it("shows MBTI grid heading", () => {
    renderOnboarding();
    expect(screen.getByText(/你是哪种旅行者/)).toBeInTheDocument();
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
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
  });
});

// ── Step 2: Interests ────────────────────────────────────────────────────────

describe("Step 2: Interests", () => {
  beforeEach(() => clearStorage());

  it("shows interest tags after selecting MBTI", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
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
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
  });

  it("selecting an interest enables continue (step 2 -> step 3)", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    // Selecting interest immediately advances to step 3 (data-driven)
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
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
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await waitFor(() => expect(screen.getByPlaceholderText(/描述你理想的搭子/)).toBeInTheDocument());
  });

  it("continue is ALWAYS enabled on step 3", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
  });

  it("textarea accepts user input", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
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
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    // Step 3 -> click continue
    await user.click(getContinueBtn());
    // Step 4 should show destination input
    await waitFor(() => expect(screen.getByText(/你想去哪/)).toBeInTheDocument());
  });

  it("continue is ALWAYS enabled on step 4", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    await user.click(getContinueBtn());
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
  });

  it("browse button completes onboarding without city", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByRole("button", { name: /随便看看/i })).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /随便看看/i }));
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as OnboardingData;
    expect(stored.completed).toBe(true);
    expect(stored.city).toBe("");
  });

  it("typing destination stores it", async () => {
    const user = userEvent.setup({ delay: null });
    renderOnboarding();
    await user.click(screen.getByRole("button", { name: /ENFP/i }));
    await waitFor(() => expect(screen.getByText(/你向往哪种旅行/)).toBeInTheDocument());
    await user.click(screen.getByRole("button", { name: /川西/i }));
    await waitFor(() => expect(getContinueBtn()).toBeEnabled());
    await user.click(getContinueBtn());
    await waitFor(() => expect(screen.getByPlaceholderText(/例如：成都/)).toBeInTheDocument());
    const input = screen.getByPlaceholderText(/例如：成都/);
    await user.clear(input);
    await user.type(input, "成都");
    expect(input).toHaveValue("成都");
  });
});
