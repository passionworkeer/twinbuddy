import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Wallet } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { NegotiationResult, NegotiationReportSnapshots } from '../types';
import { STORAGE_KEYS } from '../types';
import { FullChatHistory } from '../components/immersive-feed/FullChatHistory';

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

  const locationState = location.state as { result?: NegotiationResult; reportId?: string; source?: string } | null;
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

  const handleBack = () => {
    if (locationState?.source === 'feed') {
        navigate('/feed');
    } else {
        navigate('/result', {
          state: { result: resultData, reportId: resolvedReportId },
        });
    }
  };

  if (!resultData) {
    return (
      <div className="min-h-[100dvh] bg-[#0B1C15] flex items-center justify-center p-6">
        <div className="text-center text-white/60">数据已丢失，请返回重新测试</div>
      </div>
    );
  }

  const messagesData = resultData.messages.map((msg, idx) => ({
      id: idx,
      text: msg.content,
      isSelf: msg.speaker === 'user'
  }));

  return (
    <div className="min-h-[100dvh] bg-[#0B1C15] text-white flex flex-col relative overflow-y-auto overflow-x-hidden animate-fade-in">
      {/* 模糊背景层 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[#0B1C15]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#1E2A23]/50 via-transparent to-transparent"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0B1C15]/80 backdrop-blur-xl border-b border-white/5 pt-[env(safe-area-inset-top,24px)] pb-3 px-4">
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="p-2 -ml-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-headline tracking-wide text-[17px] font-medium">完整协商记录</span>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 relative z-10 flex flex-col gap-6 pb-[env(safe-area-inset-bottom,32px)]">
        
        {/* 行程概要卡片 */}
        <div className="w-full bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
           <h3 className="text-white/60 text-xs font-medium mb-4 tracking-wider">当前行程共识</h3>
           <div className="flex items-center justify-between">
              <div className="flex flex-col items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-[#1E2A23] flex items-center justify-center border border-white/5">
                   <MapPin className="w-5 h-5 text-[#4ade80]" />
                 </div>
                 <span className="text-[13px] font-medium">{resultData.destination}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-[#1E2A23] flex items-center justify-center border border-white/5">
                   <Calendar className="w-5 h-5 text-[#4ade80]" />
                 </div>
                 <span className="text-[13px] font-medium">{resultData.dates === '待定' ? '时间灵活' : resultData.dates}</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <div className="w-10 h-10 rounded-full bg-[#1E2A23] flex items-center justify-center border border-white/5">
                   <Wallet className="w-5 h-5 text-[#4ade80]" />
                 </div>
                 <span className="text-[13px] font-medium">{resultData.budget}</span>
              </div>
           </div>
        </div>

        {/* 聊天记录核心组件复用 */}
        <div className="flex-1 -mt-4">
            <FullChatHistory 
                messages={messagesData} 
                onCollapse={handleBack} 
                result={resultData}
            />
        </div>

      </div>
    </div>
  );
}
