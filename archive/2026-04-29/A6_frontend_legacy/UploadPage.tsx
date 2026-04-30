import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { FileUploadSlot } from '../components/FileUploadSlot';
import { StepIndicator } from '../components/StepIndicator';
import { MOCK_PERSONA } from '../utils/mockData';
import { SLOTS, STEPS } from '../config/uploadSlots';
import type { ParsedFileSummary, Persona, FileSlotType } from '../types/persona';

const API_BASE = '/api';
const USE_MOCK = true; // Toggle to false when backend is ready



export default function UploadPage() {
  const navigate = useNavigate();
  const [activeStep] = useState(1);
  // Keyed by FileSlotType so each slot has exactly one file
  const [files, setFiles] = useState<Partial<Record<FileSlotType, { file: File; parsed: ParsedFileSummary }>>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [genError, setGenError] = useState('');

  const handleParsed = useCallback((slotType: FileSlotType, file: File, parsed: ParsedFileSummary) => {
    setFiles((prev) => ({ ...prev, [slotType]: { file, parsed } }));
  }, []);

  const handleRemove = useCallback((slotType: FileSlotType) => {
    setFiles((prev) => {
      const next = { ...prev };
      delete next[slotType];
      return next;
    });
  }, []);

  const hasAnyFile = Object.keys(files).length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError('');
    setProgress(0);

    try {
      if (USE_MOCK) {
        for (let p = 0; p <= 90; p += 10) {
          await new Promise((r) => setTimeout(r, 200));
          setProgress(p);
        }
        setProgress(100);
        navigate('/result', { state: { persona: MOCK_PERSONA } });
        return;
      }

      const form = new FormData();
      (Object.entries(files) as [FileSlotType, { file: File }][]).forEach(([, val]) => {
        form.append(val.file.name, val.file);
      });

      setProgress(20);
      const res = await fetch(`${API_BASE}/generate_avatar`, { method: 'POST', body: form });
      setProgress(70);
      if (!res.ok) throw new Error(`服务器错误: ${res.status}`);
      const persona: Persona = await res.json();
      setProgress(100);
      navigate('/result', { state: { persona } });
    } catch (err) {
      setGenError(err instanceof Error ? err.message : '未知错误，请重试');
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-gray-950 dark:to-purple-950 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-2xl">
        {/* Page header */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 text-sm font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            <Sparkles className="h-4 w-4" />
            TwinBuddy · Hackathon MVP
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            构建你的{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              数字孪生
            </span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            上传你的数据，让 AI 读懂你是谁
          </p>
        </div>

        {/* Step indicator */}
        <StepIndicator steps={STEPS} activeStep={activeStep} />

        {/* Upload slots */}
        <div className="mb-8 space-y-3">
          {SLOTS.map((slot) => (
            <FileUploadSlot
              key={slot.type}
              type={slot.type}
              label={slot.label}
              description={slot.description}
              accepted={slot.accepted}
              icon={slot.icon}
              optional={slot.optional}
              parsed={files[slot.type]?.parsed ?? null}
              onParsed={(file, parsed) => handleParsed(slot.type, file, parsed)}
              onRemove={() => handleRemove(slot.type)}
            />
          ))}
        </div>

        {/* Hint */}
        {!hasAnyFile && (
          <p className="mb-6 text-center text-xs text-gray-400">
            至少上传一个文件即可开始分析 · 所有数据仅本地处理，不会上传至第三方
          </p>
        )}

        {/* Error */}
        {genError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
            {genError}
          </div>
        )}

        {/* CTA button */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`
              group relative flex flex-1 items-center justify-center gap-2 rounded-2xl py-4 px-6
              text-base font-bold transition-all duration-200
              ${isGenerating
                ? 'bg-purple-400 text-white cursor-not-allowed'
                : hasAnyFile
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-200 hover:shadow-2xl hover:shadow-purple-300 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>生成中 {progress}%</span>
                <div
                  className="absolute bottom-0 left-0 h-1 rounded-b-2xl bg-white/30 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </>
            ) : (
              <>
                <Zap className="h-5 w-5" />
                <span>一键生成人格</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          Powered by AI · 数据脱敏处理 · 隐私优先
        </p>
      </div>
    </div>
  );
}
