import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUploadSlot } from '../../components/FileUploadSlot';
import type { ParsedFileSummary } from '../../types/persona';

function createFile(name: string, type: string, size: number): File {
  return new File(['content'], name, { type });
}

const defaultProps = {
  type: 'douyin_json' as const,
  label: '抖音数据',
  description: '上传 JSON',
  accepted: '.json,application/json',
  optional: true,
  onParsed: vi.fn(),
  onRemove: vi.fn(),
};

describe('FileUploadSlot', () => {
  it('test_renders_idle_state', () => {
    render(<FileUploadSlot {...defaultProps} />);
    expect(screen.getByText(/拖拽上传或点击选择/)).toBeInTheDocument();
  });

  it('test_accepts_dragover', async () => {
    const user = userEvent.setup();
    render(<FileUploadSlot {...defaultProps} />);
    const slot = screen.getByText(/拖拽上传或点击选择/).closest('div');
    expect(slot).toBeInTheDocument();
    await user.hover(slot!);
    expect(screen.getByText(/拖拽上传或点击选择/)).toBeInTheDocument();
  });

  it('test_shows_file_info_on_upload', () => {
    const parsed: ParsedFileSummary = { filename: 'test.json', size: 1024, summary: 'ok' };
    render(<FileUploadSlot {...defaultProps} parsed={parsed} />);
    expect(screen.getByText('test.json')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /移除文件/ })).toBeInTheDocument();
  });

  it('test_remove_button_works', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onParsed = vi.fn();
    const parsed: ParsedFileSummary = { filename: 'x.jpg', size: 100, summary: 'ok' };
    render(<FileUploadSlot {...defaultProps} onRemove={onRemove} onParsed={onParsed} parsed={parsed} />);
    await user.click(screen.getByRole('button', { name: /移除文件/ }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('test_optional_badge_renders', () => {
    render(<FileUploadSlot {...defaultProps} optional={true} />);
    expect(screen.getByText('可选')).toBeInTheDocument();
  });

  it('test_no_optional_badge_when_required', () => {
    render(<FileUploadSlot {...defaultProps} optional={false} />);
    expect(screen.queryByText('可选')).not.toBeInTheDocument();
  });

  it('test_error_or_idle_on_invalid_type', async () => {
    const user = userEvent.setup();
    const onParsed = vi.fn();
    render(<FileUploadSlot {...defaultProps} accepted=".json" onParsed={onParsed} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, createFile('notes.txt', 'text/plain', 1024));
    const hasError = screen.queryByText(/不支持的文件格式/);
    const hasIdle = screen.queryByText(/拖拽上传或点击选择/);
    expect(hasError !== null || hasIdle !== null).toBe(true);
    expect(onParsed).not.toHaveBeenCalled();
  });
});
