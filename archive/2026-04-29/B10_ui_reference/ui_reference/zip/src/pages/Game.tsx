import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Game() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);

  const options = [
    { id: 1, title: "暴走打卡", icon: "directions_run" },
    { id: 2, title: "慢旅行", icon: "self_improvement" }
  ];

  return (
    <div className="bg-background text-on-background fixed inset-0 z-50 flex flex-col justify-center items-center selection:bg-primary selection:text-on-primary overflow-hidden">
      <main className="w-full max-w-md bg-surface-container-lowest h-full relative shadow-2xl overflow-hidden flex flex-col">
        {/* Game Header */}
        <header className="px-container-padding pt-8 pb-4 flex flex-col gap-6 z-10 relative">
          
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              className="w-12 h-12 rounded-full border-2 border-outline-variant flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 bg-surface-container rounded-full pr-5 pl-1.5 py-1.5 border border-outline-variant shadow-sm">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAs6d-TSqiyvXmuCLSbb1iZ58H2hFtvp-jtFxgB8OqfVvO5wP-E1xtZwMEwf1_oQ5BOhl95j49WU2Hegar5cZZKSCQlCoQt7tvPYOQ7yU-36KzUXLTK7XWMMcl5TBZLkZnzEVzkKodwcL-6aIiPbjZETOuOoBFmRwVUbEz79dsVU19jD_-gPFqRl4uQHswaL0CY0JQ_BoTnZkb6qNY47O7PvEnWL458eQSRQ8h9iUBw3XwqGF2KjaBISzJqIg1I4MHG_rjl1SkY1ahC" 
                alt="Opponent Avatar" 
                className="w-10 h-10 rounded-full object-cover border-2 border-surface-container-lowest" 
              />
              <div className="flex flex-col">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest text-[10px]">Opponent</span>
                <span className="font-body-md text-sm font-semibold text-on-surface leading-none mt-1">Mystery Player</span>
              </div>
            </div>
            {/* Spacer for centering */}
            <div className="w-12 h-12"></div>
          </div>

          {/* Progress Bar Section */}
          <div className="flex flex-col gap-3 mt-4">
            <div className="flex justify-between items-end">
              <span className="font-label-caps text-label-caps text-primary uppercase">Question 3</span>
              <span className="font-label-caps text-[10px] text-on-surface-variant uppercase">6 Total</span>
            </div>
            <div className="h-2.5 w-full bg-surface-container-high rounded-full overflow-hidden relative border border-outline-variant">
              <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500 ease-out w-1/2"></div>
            </div>
          </div>
        </header>

        {/* Question Area */}
        <div className="px-container-padding pt-10 pb-12 flex-shrink-0 flex items-center justify-center text-center">
          <h1 className="font-question-serif text-[36px] font-medium text-on-surface tracking-tight leading-snug">
            旅行节奏?
          </h1>
        </div>

        {/* Options / Bento Grid Area */}
        <div className="px-container-padding flex-grow flex flex-col gap-card-gap pb-12 z-10 w-full mb-8">
          {options.map((opt, i) => {
            const isSelected = selected === opt.id;
            return (
              <button 
                key={opt.id}
                onClick={() => setSelected(opt.id)}
                className={cn(
                  "group w-full flex-1 border-2 rounded-lg p-container-padding flex flex-col items-center justify-center gap-6 relative overflow-hidden transition-all duration-300 focus:outline-none active:scale-[0.98]",
                  isSelected ? "bg-surface-container border-primary shadow-[0_12px_40px_rgba(0,0,0,0.08)] -translate-y-1" : "bg-surface-container border-outline-variant hover:border-primary hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
                )}
              >
                {/* Decorative blob */}
                <div className={cn(
                  "absolute w-32 h-32 rounded-full blur-2xl transition-colors duration-500 pointer-events-none",
                  i === 0 ? "-right-8 -top-8 bg-primary/5 group-hover:bg-primary/10" : "-left-8 -bottom-8 bg-secondary/5 group-hover:bg-secondary/10",
                  isSelected && (i === 0 ? "bg-primary/15" : "bg-secondary/15")
                )}></div>
                
                <div className={cn(
                  "w-20 h-20 rounded-full border flex items-center justify-center transition-all duration-300 shadow-sm z-10",
                  isSelected 
                    ? "bg-primary text-on-primary border-primary" 
                    : "bg-surface-container-lowest text-on-surface border-outline-variant group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary"
                )}>
                  <span className="material-symbols-outlined text-[40px] font-light fill">{opt.icon}</span>
                </div>
                <span className="font-h2 text-[32px] text-on-surface tracking-tight z-10">{opt.title}</span>
                
                {/* Selection Radio Indicator */}
                <div className={cn(
                  "absolute top-6 right-6 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                  isSelected ? "border-primary" : "border-outline-variant group-hover:border-primary"
                )}>
                  <div className={cn("w-3.5 h-3.5 rounded-full transition-colors", isSelected ? "bg-primary" : "bg-transparent")}></div>
                </div>
              </button>
            )
          })}
        </div>
      </main>
    </div>
  );
}
