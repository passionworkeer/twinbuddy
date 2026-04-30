import { Link } from "react-router-dom";

export default function Profile() {
  return (
    <div className="flex flex-col gap-section-margin pt-8 px-container-padding">
      {/* Header Section: Avatar & Identity */}
      <section className="flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-32 h-32 rounded-full border-4 border-primary overflow-hidden brutalist-card-inactive bg-surface-variant shadow-[4px_4px_0_0_#000]">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBfCXtlry8DvWg6p2tZ95E6lycjVmwkofpliEaebSUTDk5FZ4YkfeG17I9hYoeTXSxcx6uxDWV3LsGjEa2pngBCFTvN-PKY8Wbc-EOrYJ5DN90-Uqem7eJzt_4zucrGmCXYFafoJOgE8OIJo_XS4A4pPucFpfJZ9SlILzQUpq8CnU-NEvW8lzjMdNWYsKrYZpw5xAXEf6rLniztTH-bXTjHqW9p4w9aO84RrpOgjaK8h1YehgGjQLeemtIhXiZeN1TgP2hX9owRCN7" 
              alt="Profile Avatar" 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary font-label-caps text-label-caps px-4 py-2 rounded-full border-2 border-primary shadow-[2px_2px_0px_rgba(0,0,0,1)] uppercase">
            ENFP
          </div>
        </div>
        <h1 className="font-h1 text-[48px] font-bold text-primary leading-[1.1] tracking-[-0.04em]">Kylia_Z</h1>
        <p className="font-body-lg text-[18px] text-on-surface-variant mt-2">数字游民 / 独立设计师</p>
      </section>

      {/* Middle Section: MING 4D Radar */}
      <section className="bg-surface-container-lowest rounded-DEFAULT border-2 border-primary p-container-padding brutalist-card-inactive shadow-[4px_4px_0_0_#000] relative overflow-hidden transition-transform">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-container rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="font-h2 text-h2 text-primary">MING 4D 认知模型</h2>
          <span className="material-symbols-outlined text-primary text-3xl">psychology</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter relative z-10">
          {/* Cognitive */}
          <div className="bg-surface-container p-4 rounded-DEFAULT border-2 border-outline-variant hover:border-primary transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-caps text-label-caps text-primary uppercase">认知 (Cognitive)</span>
              <span className="font-body-md font-bold text-primary">85%</span>
            </div>
            <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden border border-outline">
              <div className="h-full bg-primary w-[85%] rounded-r-full"></div>
            </div>
          </div>
          {/* Expression */}
          <div className="bg-surface-container p-4 rounded-DEFAULT border-2 border-outline-variant hover:border-primary transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-caps text-label-caps text-primary uppercase">表达 (Expression)</span>
              <span className="font-body-md font-bold text-primary">92%</span>
            </div>
            <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden border border-outline">
              <div className="h-full bg-tertiary-container w-[92%] rounded-r-full"></div>
            </div>
          </div>
          {/* Behavior */}
          <div className="bg-surface-container p-4 rounded-DEFAULT border-2 border-outline-variant hover:border-primary transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-caps text-label-caps text-primary uppercase">行为 (Behavior)</span>
              <span className="font-body-md font-bold text-primary">78%</span>
            </div>
            <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden border border-outline">
              <div className="h-full bg-secondary w-[78%] rounded-r-full"></div>
            </div>
          </div>
          {/* Emotion */}
          <div className="bg-surface-container p-4 rounded-DEFAULT border-2 border-outline-variant hover:border-primary transition-colors">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label-caps text-label-caps text-primary uppercase">情绪 (Emotion)</span>
              <span className="font-body-md font-bold text-primary">88%</span>
            </div>
            <div className="h-3 w-full bg-surface-variant rounded-full overflow-hidden border border-outline">
              <div className="h-full bg-on-tertiary-container w-[88%] rounded-r-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section: Travel Preferences */}
      <section className="flex flex-col gap-6">
        <h2 className="font-h2 text-h2 text-primary">旅行偏好</h2>
        <div className="flex flex-wrap gap-3">
          <div className="px-6 py-3 bg-tertiary-fixed text-on-tertiary-fixed font-label-caps text-label-caps rounded-full border-2 border-primary shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm pt-[2px]">landscape</span>
            自然风光
          </div>
          <div className="px-6 py-3 bg-secondary-fixed text-on-secondary-fixed font-label-caps text-label-caps rounded-full border-2 border-primary shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm pt-[2px]">museum</span>
            深度人文
          </div>
          <div className="px-6 py-3 bg-primary-fixed text-on-primary-fixed font-label-caps text-label-caps rounded-full border-2 border-primary shadow-[2px_2px_0px_rgba(0,0,0,1)] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm pt-[2px]">restaurant</span>
            地道美食
          </div>
          <div className="px-6 py-3 bg-surface-container text-on-surface font-label-caps text-label-caps rounded-full border-2 border-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-sm pt-[2px]">photo_camera</span>
            摄影打卡
          </div>
          <div className="px-6 py-3 bg-surface-container text-on-surface font-label-caps text-label-caps rounded-full border-2 border-outline flex items-center gap-2">
            <span className="material-symbols-outlined text-sm pt-[2px]">nightlife</span>
            夜生活
          </div>
        </div>
      </section>

      {/* Logout Action */}
      <div className="mt-8 flex justify-center">
        <button className="bg-primary text-on-primary font-label-caps text-label-caps px-8 py-4 rounded-full w-full max-w-sm uppercase hover:bg-inverse-surface transition-colors active:scale-95">
            退出登录
        </button>
      </div>
    </div>
  );
}
