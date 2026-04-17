import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import UploadPage from '../../pages/UploadPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('../../utils/fileUtils', () => ({
  formatBytes: (bytes: number) => bytes > 0 ? '1 KB' : '0 B',
  mockParse: vi.fn(() => ({ filename: 'f.json', size: 1024, summary: 'ok' })),
}));
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return { ...actual, Sparkles: () => <span>Sparkles</span>, ArrowRight: () => <span>ArrowRight</span>, Zap: () => <span>Zap</span>, FileJson: () => <span>FileJson</span> };
});

function renderUploadPage() {
  return render(<MemoryRouter><UploadPage /></MemoryRouter>);
}
function createFile(name: string, type: string, size: number): File {
  return new File(['content'], name, { type });
}

describe('UploadPage', () => {
  beforeEach(() => mockNavigate.mockClear());
  afterEach(() => mockNavigate.mockClear());

  it('test_step_indicator_shows_step1', () => {
    renderUploadPage();
    expect(screen.getByText('上传数据')).toBeInTheDocument();
    expect(screen.getByText('生成人格')).toBeInTheDocument();
  });

  it('test_upload_all_slots', () => {
    renderUploadPage();
    expect(screen.getByText('抖音数据')).toBeInTheDocument();
    expect(screen.getByText('MBTI 测试结果')).toBeInTheDocument();
  });

  it('test_generate_button_disabled_until_files', () => {
    renderUploadPage();
    const btn = screen.getByRole('button', { name: /一键生成人格/ });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/bg-gray-200|cursor-not-allowed/);
  });

  it('test_mock_api_called_on_submit', async () => {
    const user = userEvent.setup();
    renderUploadPage();
    const inputs = document.querySelectorAll('input[type="file"]');
    await user.upload(inputs[0], createFile('x.json', 'application/json', 100));
    const btn = screen.getByRole('button', { name: /一键生成人格/ });
    await user.click(btn);
    await new Promise(r => setTimeout(r, 2500));
    expect(mockNavigate).toHaveBeenCalled();
  });

  it('test_navigates_to_result_on_success', async () => {
    const user = userEvent.setup();
    renderUploadPage();
    const inputs = document.querySelectorAll('input[type="file"]');
    await user.upload(inputs[0], createFile('mbti.txt', 'text/plain', 100));
    await user.click(screen.getByRole('button', { name: /一键生成人格/ }));
    await new Promise(r => setTimeout(r, 2500));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });
});
