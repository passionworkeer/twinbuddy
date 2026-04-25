import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import VoiceInputButton from '../components/stt/VoiceInputButton';

class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => {
    this.onend?.();
  });
  abort = vi.fn();
}

describe('VoiceInputButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses speech recognition results to fill text', async () => {
    const recognition = new MockSpeechRecognition();
    vi.stubGlobal('webkitSpeechRecognition', vi.fn(() => recognition));

    const onTranscribed = vi.fn();
    const user = userEvent.setup();

    render(<VoiceInputButton onTranscribed={onTranscribed} />);

    await user.click(screen.getByRole('button', { name: /语音输入/i }));
    expect(recognition.start).toHaveBeenCalled();

    await act(async () => {
      recognition.onresult?.({
        results: [
          {
            isFinal: true,
            0: { transcript: '语音转文字成功' },
            length: 1,
          },
        ],
      });
      recognition.onend?.();
    });

    expect(onTranscribed).toHaveBeenCalledWith('语音转文字成功');
  });

  it('shows unsupported state when speech recognition is unavailable', async () => {
    const user = userEvent.setup();
    render(<VoiceInputButton onTranscribed={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /语音输入/i }));
    expect(await screen.findByText(/当前浏览器暂不支持语音输入/i)).toBeInTheDocument();
  });
});
