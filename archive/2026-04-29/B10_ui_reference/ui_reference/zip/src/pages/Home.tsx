import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="px-container-padding flex flex-col gap-section-margin relative h-full pt-8">
      {/* Greeting Section with Vibrant Mesh Hint */}
      <section className="relative mt-4">
        <div className="absolute -top-10 -left-10 w-48 h-48 bg-tertiary-fixed blur-[60px] opacity-40 -z-10 rounded-full pointer-events-none"></div>
        <div className="absolute top-10 -right-10 w-48 h-48 bg-secondary-fixed blur-[60px] opacity-40 -z-10 rounded-full pointer-events-none"></div>
        
        <h1 className="font-h1 text-h1 text-on-background mb-gutter leading-tight">
          嘿 Alex!<br />今天想去哪儿?
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[80%]">
          发现与你频率一致的旅行搭子，开启新冒险。
        </p>

        <div className="flex gap-4 mt-8">
          <Link to="/onboarding" className="bg-primary text-on-primary font-label-caps text-label-caps px-6 py-3 rounded-full hover:bg-surface-tint transition-colors uppercase border-2 border-primary brutalist-card-inactive shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            测试 MBTI
          </Link>
          <Link to="/game" className="bg-secondary-container text-on-secondary-container font-label-caps text-label-caps px-6 py-3 rounded-full hover:brightness-95 transition-colors uppercase border-2 border-primary brutalist-card-inactive shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            盲盒破冰
          </Link>
        </div>
      </section>

      {/* Recommendation Carousel */}
      <section className="flex flex-col gap-gutter mt-4">
        <div className="flex items-end justify-between">
          <h2 className="font-h2 text-[32px] text-on-background leading-none">推荐搭子</h2>
          <Link to="/buddies" className="font-label-caps text-label-caps text-primary hover:text-surface-tint uppercase transition-colors">
            查看全部
          </Link>
        </div>
        
        <div className="flex overflow-x-auto gap-card-gap snap-x snap-mandatory hide-scrollbar pb-4 -mx-container-padding px-container-padding">
          
          {/* Card 1 */}
          <article className="flex-shrink-0 w-[260px] snap-center bg-surface-container-lowest rounded-lg border-2 border-outline-variant shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-transform hover:-translate-y-1 duration-300">
            <div className="h-[280px] w-full relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCRl1gY3gskhHXkZikH96EYt8YQtdfY5lKo6SLbFgmhUU1dGUHhGgxqaO8KVpQoDLn_mL3s77NZB1H9_f8nY5MojExLzH7Pf-WexlqYxz0d7Zq_qMdTdX-jGcWfNNAYaS37K6XIxCqGYXFp3zR_KDpiQpAdn3-YRgN8TutzjG_6VBJgEVLCel-jb6mGZ8SdeTxFSUGit6knO0EkzrtiNGfy78VQ3yWPxEXfJNSQArY8g3cEyRn3NZVTBI1hDmSQpwmEDTXEErb0Dko2" 
                alt="Travel Buddy" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-base right-base bg-primary-container text-on-primary font-label-caps text-label-caps px-3 py-1.5 rounded-full backdrop-blur-md bg-opacity-90">
                98% 匹配
              </div>
            </div>
            <div className="p-container-padding flex flex-col gap-base bg-surface-container-lowest">
              <h3 className="font-h2 text-[24px] leading-tight text-on-background">Sarah, 24</h3>
              <p className="font-body-md text-base text-on-surface-variant line-clamp-1">独立摄影师 / 咖啡爱好者</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="font-label-caps text-[10px] text-on-secondary-container bg-secondary-container px-2 py-1 rounded-sm uppercase tracking-wider">东京计划</span>
                <span className="font-label-caps text-[10px] text-on-tertiary-container bg-tertiary-fixed px-2 py-1 rounded-sm uppercase tracking-wider">美术馆</span>
              </div>
            </div>
          </article>

          {/* Card 2 */}
          <article className="flex-shrink-0 w-[260px] snap-center bg-surface-container-lowest rounded-lg border-2 border-outline-variant shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-transform hover:-translate-y-1 duration-300">
            <div className="h-[280px] w-full relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUaJX_Ri2CatVqHIleZZJOOhud_xqlopeR3Jy2tehAHrwv3y3bjpi4R_WpTulbcj7bOe6pyAEuYwu9lboKvInLJGgJYj5dnvTp2Ogl4jUc_9eUatW7SDFkDfp2bR2F8PagfakJ1pH8YrPNA5g_bMwA0xvt0Mtt-MHwuIs_7Utifbx5X-AIrV9i2sbw_XAXiB_wp82jk7KJF8DaGEx4ubdudDvIqB3xeSR8_l-QIO3qgVbdppf_97F7JzJLYpcBPMkBP96SFF6k_3sF" 
                alt="Travel Buddy" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-base right-base bg-primary-container text-on-primary font-label-caps text-label-caps px-3 py-1.5 rounded-full backdrop-blur-md bg-opacity-90">
                92% 匹配
              </div>
            </div>
            <div className="p-container-padding flex flex-col gap-base bg-surface-container-lowest">
              <h3 className="font-h2 text-[24px] leading-tight text-on-background">David, 27</h3>
              <p className="font-body-md text-base text-on-surface-variant line-clamp-1">户外探险 / 极限运动</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="font-label-caps text-[10px] text-on-secondary-container bg-secondary-container px-2 py-1 rounded-sm uppercase tracking-wider">周末徒步</span>
                <span className="font-label-caps text-[10px] text-on-surface-variant bg-surface-variant px-2 py-1 rounded-sm uppercase tracking-wider">露营</span>
              </div>
            </div>
          </article>

          {/* Card 3 */}
          <article className="flex-shrink-0 w-[260px] snap-center bg-surface-container-lowest rounded-lg border-2 border-outline-variant shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden transition-transform hover:-translate-y-1 duration-300">
            <div className="h-[280px] w-full relative">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAN1jRYL1sBSwa6aIyqnNDwVTfjWSRv8jjzzZ9NwWyRwP-T8YTgNPBYFTUyQUjl6lLCZZaGmVW-Sz1C_qn3m9RXINZE7L4XDv6rMenavfmpXq-Ku2eomQUkbsEB_0spcgrY6zRSP3lTsOM_OIFjOYfuY3grvy8QzzuZzH6vRqMHhWnMPpUYdcTXJd3ETRQRDfc4J_7K_biyAJT3umytjXSbEqCBYnrB-YpbTsEhXyP6yW-uPJOLg4r4841AZRLlBnOo48pteuV-sw-U"
                alt="Travel Buddy" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute top-base right-base bg-primary-container text-on-primary font-label-caps text-label-caps px-3 py-1.5 rounded-full backdrop-blur-md bg-opacity-90">
                88% 匹配
              </div>
            </div>
            <div className="p-container-padding flex flex-col gap-base bg-surface-container-lowest">
              <h3 className="font-h2 text-[24px] leading-tight text-on-background">Chloe, 22</h3>
              <p className="font-body-md text-base text-on-surface-variant line-clamp-1">美食寻觅者 / 城市漫游</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="font-label-caps text-[10px] text-on-secondary-container bg-secondary-container px-2 py-1 rounded-sm uppercase tracking-wider">曼谷夜市</span>
                <span className="font-label-caps text-[10px] text-on-tertiary-container bg-tertiary-fixed px-2 py-1 rounded-sm uppercase tracking-wider">探店</span>
              </div>
            </div>
          </article>

        </div>
      </section>

      {/* AI Chat Input Bar (Floating above bottom nav) */}
      <div className="fixed bottom-[88px] left-0 right-0 px-container-padding z-40 md:hidden pointer-events-none">
        <div className="max-w-screen-md mx-auto pointer-events-auto">
          <div className="bg-surface-container-lowest rounded-full border-2 border-primary shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex items-center p-2 backdrop-blur-xl bg-opacity-90">
            <span className="material-symbols-outlined text-primary ml-4 mr-2 fill">robot_2</span>
            <input 
              type="text" 
              placeholder="AI 旅行顾问：想找什么样的搭子？" 
              className="flex-1 bg-transparent border-none focus:ring-0 font-body-md text-base text-on-background placeholder:text-outline py-2 px-2 outline-none"
            />
            <button className="bg-primary text-on-primary w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-tint transition-colors active:scale-95 shrink-0">
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
