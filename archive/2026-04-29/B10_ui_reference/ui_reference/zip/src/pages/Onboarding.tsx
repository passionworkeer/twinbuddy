import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Onboarding() {
  const navigate = useNavigate();
  // State maps axis (0, 1, 2, 3) to selected index (0 or 1)
  const [selections, setSelections] = useState<Record<number, number>>({
    0: 0, // Default to E for demo
    1: 1, // Default to N for demo
    3: 0, // Default to J for demo
  });

  const mbtiData = [
    {
      title: "能量來源 ENERGY",
      options: [
        { letter: "E", name: "外向", desc: "從外部互動獲取能量\n偏好熱鬧的團體行程", icon: "groups" },
        { letter: "I", name: "內向", desc: "從獨處中恢復能量\n偏好深度的小眾體驗", icon: "self_improvement" }
      ]
    },
    {
      title: "資訊處理 INFORMATION",
      options: [
        { letter: "S", name: "實感", desc: "關注當下的細節與現實\n按部就班走訪景點", icon: "visibility" },
        { letter: "N", name: "直覺", desc: "看重大方向與潛在可能\n享受旅途中的不期而遇", icon: "psychology" }
      ]
    },
    {
      title: "決策方式 DECISIONS",
      options: [
        { letter: "T", name: "思考", desc: "客觀分析利弊\n追求行程的高效與合理性", icon: "account_tree" },
        { letter: "F", name: "情感", desc: "依賴價值觀與感受\n重視旅伴的情緒與氛圍", icon: "favorite" }
      ]
    },
    {
      title: "生活態度 LIFESTYLE",
      options: [
        { letter: "J", name: "判斷", desc: "喜歡有條理的計畫\n出發前必須搞定所有行程表", icon: "event_available" },
        { letter: "P", name: "感知", desc: "保持靈活與開放\n隨遇而安，討厭被計畫綁死", icon: "explore" }
      ]
    }
  ];

  const handleSelect = (axisIndex: number, optionIndex: number) => {
    setSelections(prev => ({ ...prev, [axisIndex]: optionIndex }));
  };

  const completedCount = Object.keys(selections).length;

  return (
    <div className="bg-background min-h-screen flex flex-col relative w-full absolute inset-0 z-50">
      {/* Minimal Header / Progress */}
      <header className="w-full px-6 py-4 flex items-center justify-between z-10 relative bg-background/80 backdrop-blur-xl border-b-2 border-outline-variant/30">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <div className="flex flex-col items-end">
          <span className="font-label-caps text-[10px] text-outline mb-2 tracking-widest hidden sm:block">STEP 2.2 OF 4</span>
          <div className="w-32 h-2 bg-surface-variant rounded-full overflow-hidden flex">
            <div className="w-full bg-primary rounded-full"></div>
            <div className="w-1/2 bg-surface-variant"></div>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-6 pt-10 pb-40 flex flex-col gap-section-margin">
        <div className="flex flex-col gap-4">
          <span className="font-label-caps text-label-caps text-tertiary-container bg-tertiary-fixed inline-block px-3 py-1.5 rounded-full w-max border-2 border-tertiary-container">
            MBTI PROFILING
          </span>
          <h1 className="font-h1 text-[40px] leading-tight text-primary font-bold tracking-tight">建立你的旅行人格</h1>
          <p className="font-body-lg text-base text-on-surface-variant max-w-md">
            選擇最符合你的描述。這將幫助我們為你配對最合拍的旅伴與行程建議。
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {mbtiData.map((axis, axisIndex) => (
            <div key={axis.title} className="flex flex-col gap-base">
              <div className="flex justify-between items-center px-2">
                <span className="font-label-caps text-[10px] tracking-[0.1em] text-on-surface-variant">{axis.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-gutter">
                {axis.options.map((option, optionIndex) => {
                  const isSelected = selections[axisIndex] === optionIndex;
                  return (
                    <button
                      key={option.letter}
                      onClick={() => handleSelect(axisIndex, optionIndex)}
                      className={cn(
                        "text-left rounded-lg p-container-padding transition-all relative overflow-hidden group min-h-[220px]",
                        isSelected
                          ? "border-2 border-primary bg-primary text-on-primary brutalist-card-active"
                          : "border-2 border-outline-variant bg-surface-container-lowest text-on-surface brutalist-card-inactive"
                      )}
                    >
                      <div className="relative z-10 flex flex-col h-full">
                        <span className={cn("font-h1 text-[48px] block mb-1", !isSelected && "text-outline group-hover:text-primary transition-colors")}>
                          {option.letter}
                        </span>
                        <span className={cn("font-body-lg text-lg font-bold block mb-4", !isSelected && "text-on-surface-variant group-hover:text-on-surface transition-colors")}>
                          {option.name}
                        </span>
                        <span className={cn("font-label-caps text-[10px] leading-relaxed block mt-auto", isSelected ? "opacity-80" : "text-outline group-hover:text-on-surface-variant transition-colors")}>
                          {option.desc.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
                        </span>
                      </div>
                      <span className={cn(
                        "material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] font-bold transition-transform group-hover:scale-110",
                        isSelected ? "opacity-10 text-on-primary" : "opacity-5 text-primary group-hover:opacity-10"
                      )}>
                        {option.icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Fixed Bottom Action Area */}
      <div className="fixed bottom-0 left-0 w-full bg-background/90 backdrop-blur-xl border-t-2 border-outline-variant/30 p-6 z-50 flex justify-center pb-safe">
        <div className="w-full max-w-2xl flex gap-4 items-center">
          <span className="font-body-md text-sm text-on-surface-variant flex-1 text-center sm:text-left hidden sm:block">
             已完成 {completedCount}/4 選擇
          </span>
          <Link to="/" className="w-full sm:w-auto flex-1 sm:flex-none bg-primary text-on-primary font-label-caps text-label-caps px-12 py-5 rounded-full border-2 border-primary hover:bg-surface hover:text-primary transition-all active:scale-95 flex items-center justify-center gap-2 brutalist-card-inactive shadow-[4px_4px_0_0_#000]">
            <span>下一步 NEXT</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
