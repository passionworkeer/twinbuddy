import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatBytes, mockParse } from '../utils/fileUtils';
import type { UploadSlotStatus, ParsedFileSummary } from '../types/persona';

interface Props {
  type: string;
  label: string;
  description: string;
  accepted: string;
  icon: React.ReactNode;
  optional: boolean;
  parsed?: ParsedFileSummary | null;
  onParsed: (file: File, parsed: ParsedFileSummary) => void;
  onRemove: () => void;
}


export function FileUploadSlot({
  type, label, description, accepted, icon, optional, parsed, onParsed, onRemove,
}: Props) {
  const [status, setStatus] = useState<UploadSlotStatus>(parsed ? 'uploaded' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      const validTypes = accepted.split(',').flatMap((t) => t.trim().split('/'));
      // Skip mime-type validation for broad patterns like "application/json"
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      const allowedExts = accepted
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.startsWith('.'))
        .map((t) => t.slice(1).toLowerCase());

      if (allowedExts.length > 0 && !allowedExts.includes(ext)) {
        setStatus('error');
        setErrorMsg(`不支持的文件格式，请上传 ${accepted}`);
        return;
      }
      setErrorMsg('');
      const summary = mockParse(file, type);
      onParsed(file, summary);
      setStatus('uploaded');
    },
    [accepted, type, onParsed],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setStatus('idle');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setStatus('dragover');
  };

  const handleDragLeave = () => setStatus(parsed ? 'uploaded' : 'idle');

  const isActive = status === 'dragover';
  const isUploaded = status === 'uploaded';

  return (
    <div
      className={`
        relative flex flex-col gap-2 rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer
        ${isActive ? 'border-purple-400 bg-purple-50 dark:bg-purple-950/30 shadow-lg shadow-purple-200 scale-[1.02]' : ''}
        ${isUploaded ? 'border-green-400 bg-green-50 dark:bg-green-950/20' : ''}
        ${status === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : ''}
        ${!isActive && !isUploaded && status !== 'error' ? 'border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-300 hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !isUploaded && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accepted}
        className="hidden"
        onChange={handleChange}
      />

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-xl
            ${isUploaded ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'}
          `}>
            {isUploaded ? <CheckCircle2 className="h-5 w-5" /> : icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-100">{label}</span>
              {optional && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400 dark:bg-gray-700 dark:text-gray-400">
                  可选
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>

        {isUploaded && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); setStatus('idle'); }}
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors dark:hover:bg-red-950/30"
            aria-label="移除文件"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Uploaded preview */}
      {isUploaded && parsed && (
        <div className="mt-2 flex items-start gap-3 rounded-xl bg-white/70 p-3 dark:bg-gray-800/60">
          {parsed.preview ? (
            <img
              src={parsed.preview}
              alt="Preview"
              className="h-14 w-14 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-200">
              {parsed.filename}
            </p>
            <p className="text-xs text-gray-500">{formatBytes(parsed.size)}</p>
            <div className="mt-1 flex items-center gap-1">
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                {parsed.summary}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Idle drop hint */}
      {!isUploaded && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Upload className="h-3.5 w-3.5" />
          <span>拖拽上传或点击选择 · 接受 {accepted}</span>
        </div>
      )}
    </div>
  );
}
