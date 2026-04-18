import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Wallet,
  AlertTriangle,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react';
import { RadarChart } from '../components/twin-card/RadarChart';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { NegotiationResult, NegotiationReportSnapshots } from '../types';
import { STORAGE_KEYS } from '../types';

function formatMessageTime(ts: number): string {
  if (!Number.isFinite(ts)) {
    return '--:--';
  }
  const date = new Date(ts * 1000);
  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export default function MatchReportDetailPage() {
  const navigate = useNavigate();
  const params = useParams<{ reportId: string }>();
  const location = useLocation();

  const [reportSnapshots] = useLocalStorage<NegotiationReportSnapshots>(
    STORAGE_KEYS.negotiation_reports,
    {},
  );
  const [latestReportId] = useLocalStorage<string | null>(
    STORAGE_KEYS.latest_report_id,
    null,
  );
  const [storedResult] = useLocalStorage<NegotiationResult | null>(
    STORAGE_KEYS.negotiation_result,
    null,
  );

  const locationState = location.state as { result?: NegotiationResult; reportId?: string } | null;
  const resolvedReportId = params.reportId ?? locationState?.reportId ?? latestReportId ?? null;

  const resultData = useMemo(() => {
    if (locationState?.result) {
      return locationState.result;
    }
    if (resolvedReportId && reportSnapshots[resolvedReportId]) {
      return reportSnapshots[resolvedReportId];
    }
    return storedResult;
  }, [locationState?.result, reportSnapshots, resolvedReportId, storedResult]);

  const handleBackToResult = () => {
    navigate('/result', {
      state: { result: resultData, reportId: resolvedReportId },
    });
  };

  if (!resultData) {
    return (
      <div className="min-h-screen bg-neon-bg px-4 py-12">
        <div className="mx-auto max-w-md glass-panel p-6 text-center space-y-3">
          <h1 className="text-lg font-bold text-neon-text">协商详情暂不可用</h1>
          <p className="text-sm text-neon-text-secondary">当前没有可读取的协商快照，请先返回结果页重新触发一次协商。</p>
          <button
            onClick={() => navigate('/result')}
            className="rounded-xl border border-neon-primary/30 px-4 py-2 text-sm text-neon-text hover:bg-neon-primary/10 transition-all"
          >
            返回结果页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neon-bg pb-24">
      <div className="sticky top-0 z-20 glass-panel-strong border-b border-white/8 px-4 py-3">
        <div className="mx-auto max-w-md flex items-center justify-between gap-3">
          <button
            onClick={handleBackToResult}
            className="flex items-center gap-1 text-sm text-neon-text-secondary hover:text-neon-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回概览
          </button>
          <div className="text-right">
            <h1 className="text-sm font-semibold text-neon-text">协商详情</h1>
            {resolvedReportId && (
              <p className="text-[11px] text-neon-text-disabled">报告ID: {resolvedReportId.slice(0, 8)}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-6 space-y-5">
        <div className="glass-panel p-4 flex items-center justify-around">
          <div className="flex flex-col items-center gap-1">
            <MapPin className="w-4 h-4 text-neon-secondary" />
            <span className="text-sm font-semibold text-neon-text">{resultData.destination}</span>
            <span className="text-[11px] text-neon-text-secondary">目的地</span>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div className="flex flex-col items-center gap-1">
            <Calendar className="w-4 h-4 text-neon-secondary" />
            <span className="text-sm font-semibold text-neon-text">{resultData.dates}</span>
            <span className="text-[11px] text-neon-text-secondary">日期</span>
          </div>
          <div className="w-px h-8 bg-white/8" />
          <div className="flex flex-col items-center gap-1">
            <Wallet className="w-4 h-4 text-neon-secondary" />
            <span className="text-sm font-semibold text-neon-text">{resultData.budget}</span>
            <span className="text-[11px] text-neon-text-secondary">预算</span>
          </div>
        </div>

        <div className="glass-panel p-5">
          <h2 className="text-xs font-semibold text-neon-text-secondary mb-3 uppercase tracking-widest">六维兼容雷达</h2>
          <RadarChart data={resultData.radar} size={220} />
        </div>

        <div className="glass-panel p-5 space-y-3">
          <h2 className="text-xs font-semibold text-neon-text-secondary uppercase tracking-widest flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            完整协商记录
          </h2>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {resultData.messages.map((msg, idx) => (
              <div key={`${msg.timestamp}-${idx}`} className="space-y-1">
                <div className={msg.speaker === 'user' ? 'bubble-user' : 'bubble-buddy'}>
                  <p className="text-sm text-neon-text leading-relaxed">{msg.content}</p>
                </div>
                <p className="text-[11px] text-neon-text-disabled px-1">{formatMessageTime(msg.timestamp)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5 space-y-3">
          <h2 className="text-xs font-semibold text-neon-text-secondary uppercase tracking-widest">最终方案</h2>
          <div className="space-y-2">
            {resultData.plan.map((item, idx) => (
              <div key={`${item}-${idx}`} className="flex items-start gap-2 text-sm text-neon-text">
                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-neon-primary/35 bg-neon-primary/10 text-xs font-semibold text-neon-primary">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {!!resultData.red_flags.length && (
          <div className="glass-panel p-5 space-y-2 border border-yellow-400/25 bg-yellow-500/5">
            <h2 className="text-xs font-semibold text-yellow-200 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              风险提示
            </h2>
            <ul className="space-y-1.5">
              {resultData.red_flags.map((flag, idx) => (
                <li key={`${flag}-${idx}`} className="text-sm text-neon-text-secondary">• {flag}</li>
              ))}
            </ul>
          </div>
        )}

        {!!resultData.analysis_report && (
          <div className="glass-panel p-5 space-y-3">
            <h2 className="text-xs font-semibold text-neon-text-secondary uppercase tracking-widest">AI 协商总结</h2>
            <p className="text-sm text-neon-text leading-relaxed">{resultData.analysis_report}</p>
            {!!resultData.analysis_basis?.input_tags?.length && (
              <div className="flex flex-wrap gap-2">
                {resultData.analysis_basis.input_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-neon-primary/35 bg-neon-primary/10 px-2.5 py-1 text-xs text-neon-text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/8 glass-panel-strong px-4 py-4 z-30">
        <div className="mx-auto max-w-md flex gap-3">
          <button
            onClick={handleBackToResult}
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-neon-text-secondary hover:text-neon-text hover:border-white/20 transition-all"
          >
            返回概览
          </button>
          <button
            onClick={handleBackToResult}
            className="flex-1 rounded-2xl bg-gradient-to-r from-neon-primary to-neon-primary-dark py-3 text-sm font-bold text-neon-bg shadow-glow-primary hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            确认搭子
          </button>
        </div>
      </div>
    </div>
  );
}
