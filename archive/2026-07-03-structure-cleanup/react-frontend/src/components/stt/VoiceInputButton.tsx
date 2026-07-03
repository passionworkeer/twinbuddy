import { LoaderCircle, Mic, Square } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  onTranscribed: (text: string) => void;
  disabled?: boolean;
  className?: string;
}

const ERROR_COPY: Record<string, string> = {
  'no-speech': '没有识别到清晰语音，请再试一次。',
  aborted: '语音输入已取消。',
  'audio-capture': '当前设备麦克风不可用。',
  network: '语音服务网络异常，请稍后再试。',
  'not-allowed': '当前浏览器未授予麦克风权限。',
  'service-not-allowed': '当前浏览器不允许语音识别。',
  'language-not-supported': '当前浏览器暂不支持中文语音识别。',
};

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export default function VoiceInputButton({ onTranscribed, disabled = false, className = '' }: Props) {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const latestTranscriptRef = useRef('');
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const handleToggle = () => {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setStatusText('当前浏览器暂不支持语音输入，请使用 Chrome 系浏览器。');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    finalTranscriptRef.current = '';
    latestTranscriptRef.current = '';

    const recognition = new Recognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      if (finalText.trim()) {
        finalTranscriptRef.current = `${finalTranscriptRef.current}${finalText}`.trim();
      }
      latestTranscriptRef.current = (finalTranscriptRef.current || interimText).trim();

      if (latestTranscriptRef.current) {
        setStatusText(`识别中：${latestTranscriptRef.current}`);
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      recognitionRef.current = null;
      setStatusText(ERROR_COPY[event.error] ?? '语音输入失败，请稍后重试。');
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      const finalText = (finalTranscriptRef.current || latestTranscriptRef.current).trim();
      if (finalText) {
        onTranscribed(finalText);
        setStatusText(`已填入：${finalText}`);
      } else {
        setStatusText('没有识别到清晰语音，请再试一次。');
      }
    };

    recognitionRef.current = recognition;
    setStatusText('正在听，请开始说话');
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <button
        aria-label="语音输入"
        className={`btn-icon ${isListening ? 'liked' : ''}`}
        disabled={disabled}
        onClick={handleToggle}
        type="button"
      >
        {isListening ? (
          <Square className="h-4 w-4" />
        ) : disabled ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </button>
      {statusText ? (
        <p className="max-w-44 text-xs leading-5 text-[var(--color-text-secondary)] sm:max-w-60">
          {statusText}
        </p>
      ) : null}
    </div>
  );
}
