/**
 * UploadPage Integration Tests
 *
 * NOTE: These tests require the following npm packages to be installed
 * before they can run:
 *   npm install -D vitest @testing-library/react @testing-library/user-event
 *                  @testing-library/jest-dom jsdom
 *
 * After installing, add to package.json scripts:
 *   "test": "vitest"
 * and run: npx vitest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useNavigate } from 'react-router-dom';

// ---------------------------------------------------------------------------
// Mock dependencies before importing the component
// ---------------------------------------------------------------------------

// Mock react-router-dom navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock fileUtils
vi.mock('../../utils/fileUtils', () => ({
  formatBytes: (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  },
  mockParse: vi.fn(
    (_file: File, _type: string) => ({
      filename: 'parsed-file.json',
      size: 2048,
      summary: 'Mock parsed summary',
    }),
  ),
}));

// Lucide icons stub
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Sparkles: () => <span>Sparkles</span>,
    ArrowRight: () => <span>ArrowRight</span>,
    Zap: () => <span>Zap</span>,
    FileJson: () => <span>FileJson</span>,
    FileText: () => <span>FileText</span>,
    MessageSquare: () => <span>MessageSquare</span>,
    Image: () => <span>Image</span>,
    Upload: () => <span>Upload</span>,
    Trash2: () => <span>Trash2</span>,
    CheckCircle2: () => <span>CheckCircle2</span>,
    AlertCircle: () => <span>AlertCircle</span>,
  };
});

// ---------------------------------------------------------------------------
// Test subject
// ---------------------------------------------------------------------------

import UploadPage from '../../pages/UploadPage';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderUploadPage(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <UploadPage />
    </MemoryRouter>,
  );
}

function createFile(name: string, type: string, size: number): File {
  return new File(['content'], name, { type });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UploadPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    mockNavigate.mockClear();
  });

  // ── 1. test_step_indicator_shows_step1 ────────────────────────────────
  it('test_step_indicator_shows_step1 — 初始显示 Step1', () => {
    renderUploadPage();

    // STEPS from config: id 1 = '上传数据'
    expect(screen.getByText('上传数据')).toBeInTheDocument();
    expect(screen.getByText('生成人格')).toBeInTheDocument();
    expect(screen.getByText('找搭子')).toBeInTheDocument();
  });

  // ── 2. test_upload_all_slots ──────────────────────────────────────────
  it('test_upload_all_slots — 4个槽位都能渲染', () => {
    renderUploadPage();

    // All 4 slot labels from config/uploadSlots.ts
    expect(screen.getByText('抖音数据')).toBeInTheDocument();
    expect(screen.getByText('MBTI 测试结果')).toBeInTheDocument();
    expect(screen.getByText('聊天记录')).toBeInTheDocument();
    expect(screen.getByText('个人照片')).toBeInTheDocument();
  });

  // ── 3. test_generate_button_disabled_until_files ───────────────────────
  it('test_generate_button_disabled_until_files — 无文件时按钮禁用', () => {
    renderUploadPage();

    // The "一键生成人格" button should exist
    const btn = screen.getByRole('button', { name: /一键生成人格/ });
    expect(btn).toBeInTheDocument();
    // When no files are uploaded, the button has cursor-not-allowed (visually disabled)
    // In jsdom the disabled attribute reflects the visual state
    // Check the grey-bg class that signals no-user-files state
    expect(btn.className).toMatch(/bg-gray-200|cursor-not-allowed/);
  });

  // ── 4. test_mock_api_called_on_submit ──────────────────────────────────
  it('test_mock_api_called_on_submit — USE_MOCK=true 时点击生成后触发 mock 流程', async () => {
    const user = userEvent.setup();
    renderUploadPage();

    // Simulate uploading a file to one slot via handleParsed callback
    // Find the first slot and directly invoke the file change handler
    const inputs = document.querySelectorAll('input[type="file"]');
    expect(inputs.length).toBeGreaterThan(0);

    // Upload a valid .json file
    const jsonFile = createFile('douyin-export.json', 'application/json', 8192);
    await user.upload(inputs[0], jsonFile);

    // Click generate (even if not visually "enabled", click it to trigger handler)
    const btn = screen.getByRole('button', { name: /一键生成人格/ });
    await user.click(btn);

    // The mockNavigate should be called after the 2s mock delay
    // Wait up to 3 seconds for the async mock to complete
    await new Promise((r) => setTimeout(r, 2500));
    expect(mockNavigate).toHaveBeenCalledWith(
      '/result',
      expect.objectContaining({ state: expect.objectContaining({ persona: expect.any(Object) }) }),
    );
  });

  // ── 5. test_navigates_to_result_on_success ─────────────────────────────
  it('test_navigates_to_result_on_success — 成功后跳转到 /result', async () => {
    const user = userEvent.setup();
    renderUploadPage();

    // Upload a file to the mbti_txt slot (index 1)
    const inputs = document.querySelectorAll('input[type="file"]');
    const txtFile = createFile('mbti-result.txt', 'text/plain', 512);
    await user.upload(inputs[1], txtFile);

    // Click generate
    const btn = screen.getByRole('button', { name: /一键生成人格/ });
    await user.click(btn);

    // Wait for mock delay then verify navigation
    await new Promise((r) => setTimeout(r, 2500));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const [path, opts] = mockNavigate.mock.calls[0];
    expect(path).toBe('/result');
    expect(opts).toHaveProperty('state.persona');
  });

  // ── 6. test_no_files_no_navigation ────────────────────────────────────
  it('test_no_files_no_navigation — 无文件时点击按钮不触发导航', async () => {
    const user = userEvent.setup();
    renderUploadPage();

    const btn = screen.getByRole('button', { name: /一键生成人格/ });

    // Button is disabled — clicking should have no effect
    await user.click(btn);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  // ── 7. test_page_title_renders ─────────────────────────────────────────
  it('test_page_title_renders — 页面标题和副标题正确显示', () => {
    renderUploadPage();

    expect(screen.getByText(/构建你的.*数字孪生/)).toBeInTheDocument();
    expect(screen.getByText(/上传你的数据，让 AI 读懂你是谁/)).toBeInTheDocument();
  });

  // ── 8. test_progress_indicator_on_submit ──────────────────────────────
  it('test_progress_indicator_on_submit — 提交后显示进度', async () => {
    const user = userEvent.setup();
    renderUploadPage();

    // Upload a file first
    const inputs = document.querySelectorAll('input[type="file"]');
    const chatFile = createFile('chat-logs.json', 'application/json', 16384);
    await user.upload(inputs[2], chatFile);

    // Click generate
    const btn = screen.getByRole('button', { name: /一键生成人格/ });
    await user.click(btn);

    // Should show progress text immediately after click (before navigate)
    // The component sets isGenerating=true then navigates after mock delay
    // Use findBy instead of getBy to wait for async render
    const progressText = await screen.findByText(/生成中/, {}, { timeout: 500 });
    expect(progressText).toBeInTheDocument();
  });
});
