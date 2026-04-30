import { Link } from "react-router-dom";

const posts = [
  {
    id: 1,
    author: "林晓月",
    mbti: "ENFP",
    mbtiColor: "bg-tertiary-fixed text-on-tertiary-fixed",
    time: "2小时前",
    content: "刚刚结束了在京都的三天两夜，秋天的红叶真的太美了！强烈推荐大家去清水寺看日落，沿着小路一直走，两边的古建筑配上漫山遍野的红色，简直是一场视觉盛宴。下次一定要带上好朋友一起来体验这绝美的风景，太治愈了！🍂✨",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNIWPbiSJnJ6er53TXOfdIqOKLU0W3jDLnPGDgFVwnZ85-HZCQA9qzuQYe0Db0uOpppdtsfvlLfTiDmaDAEdifLW25F4KLyu9NaCNHSWuXfQpG8DZPq9hBVkA5e_bGCwoTIoZvaRJf5PslJ2HbhgETBABqKYPBffsBUyuDEPe0jOs2CEAhb2QgHiB87g6Jgqu2Obxm0wN0MWOx-akQyBzesWNSAAetHmQM7MWXerUtL1rGaoFi-av6SymbsZWeMTV6PslIw32ks6YR",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGxb6X0e-Ii2f0yYlAU28EeGeKjGRzR11LJiHNsmduun9OQ703zjhI5PYiBKuaXGNXFb6tAyH-4vA6xoTO3lNH6pIdg6tb3ml0qki2-wFv_PT7m-zQg9H8_Dk5a4ezRXvPT8yW6bzRCVcRE6GtLHh-mkWOzgspXn0x36p8M01mmkiEwOSJfYra-Hk-9e9SsCQYOOHeyaf0a33YrwZf3E32arBpb7tJyBsiVPmxIv8gkfDBUqjpqmO5v0YK_-fykQJBId4fSSfsFKyz",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAl5IeBBoO5p5y8ypmi_HTOTybFulplt55HPv9rAFZNQqx6tEq_4oefmaAYdm18XZnzzvEBrpN35qRDQ78mGkNHOLdSZd0yCHFOfk0XfItRTN-YnJlgW5PQFxPgLbasxC-AMz0rcg1viasaPtvSqmw0Y5vR3Oov9in_rPVpjWM5_W1HK7vK3xpg-tMZSr-IW-b0Xs2rYnJL6L7PaLc8mzl4hdH_6k4xZw51lvDEEmE12IuyPmyogpahph-PYTlWFvE3ZdorOEhR6O9G",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBn3r2A_o0pYz1SpADvcGbzD_kDZRZ6icU7ekSXA_11ojJgSngjoxHj_vGhKCP0IMOJlxvNc5CfuEHQjMk98rzQFQvyKQ5wTHpgNopbjs-vb2wMj3yOKwfMPBCuWg-q90bBdDMFPT08l9NviE0jYV7FZ1ds5SDcif-JyI4hQopcfwcabts8zl1ZTivt58mZQ8VjOhBcCBt23SzOKBXd6OILPDJG_ZtvpwRjmd-BYvKwaQwFYFmrAjVnPGFp1GexhxHxSMXKwNHp-2Zl",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDMi1AIwbVb0HFxwtMWCUKQoRaTBhb352ubfkmthg8dT04dHe_6rvugoyGXZ3Yg-_rWJtYBCa-DYELy966LndePJLk3RRjGtQSqz6RfEasjo101UxOwl8fK3q2wufnjifTrztdB1o26bsNb4WvKiO_QEr8U-cYoxC_qUXFCZd1u-CThEZWhNc6HbBTSQ6ednNUyl1fp5hg4v6Ffs3F80HrtXhPRcLImmX3cmNBJD_7f5YlDJAX0TYY8hohlJv3lG2skgHGHaA1BPpD3"
    ],
    likes: 128,
    comments: 45
  },
  {
    id: 2,
    author: "Alex_Traveler",
    mbti: "INTJ",
    mbtiColor: "bg-primary-fixed text-on-primary-fixed",
    time: "5小时前",
    content: "周末去了冰岛的黑沙滩，阴郁的天气反而给这里增添了一丝神秘感。海浪拍打着玄武岩柱，风很大，但站在那里感觉整个世界都很安静。大自然的鬼斧神工总是能让人感到敬畏。这是一次非常适合独自思考的旅行。",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCLkfkLondP8rZevW8R_dfhy-LpT_P5BLmcs7O7k59IkDu61Y_jGe7Ex6kANvopyT6B0EDMY8UGBiw035KxpGaNlprdPuvZM5lt6TL6mbOQ1gFm3_Ww7UBiMS09jj1DAxPR0o7lTWcE6on-BcSzFHJPpJY7_bU7NW4f0Nbp_TiUfGEOd-xVVrimHMlT4O7mZLIXxv7-EoXHQjeuYnftwJnzHGCXVl5x9SlL3gSVHrnobAuQOQDirKUxuL1oBRPNfDvzTbJt6o-6epqE",
    images: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAJJ3aaaHGOA4j6sniC887snaJGtJED8nA13OCB4EYrScI0f2j9R0V83mMf2WV_w8u4ThAFbK4FSgTJyDdcB-zC_J-CN_rrL3uz7cr96M_xfiK70fGU0-bRpPANF5fvWYotpSHaD_BMcAjZlAlXzWoF0jjOP1tcOYmjSwaCKQkpQJh0fYE-g1J_xrGAGmgRsC9ftLIPiDGvf5w2MYVNmoRgfN1rLcuTyNONTqGcH6ywVnfO7TaMGTqJ_VctfwqrMpyhYzC2aHDI1jYe",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBOlM3ub4sokjHHoaSBeyAbF_eGNZmETDRTxImUKP7SaCkmBlhVS0TM1l_Pls4inTchLdY1ZItLKTcgUXIxWc3TVNUYCt7ZK7_abEYBkkKxkXvzCyGoGiLRc-6Hx_D6m_6Ce5P6X7s7AI8ZMaN1EqtSiG9w_VMvs208QRHc02YCrvV8kBhlMJod6sr1GmquRVVgLgE7RK80QznjQblMU--xBB7B9hAC6cG6EjCuyWYr4bVHsPu2NUOWLoSero621aBlwHlEDal8QcTk",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA15LnxAkGhwKgzQxk0GDB-lyo1diRyZS4TAHd8-RYUw2VCSjekpRzxli9VcRFyHPx_W5Hfn3GySWqI6CNH5ppumIaqaBzLnhN2kX-cNhjFtgfSrT0vfPxXIdWjyAMyMUvWnUkpJ2YhBWIGsZWSrmg9cbjw2-bc-f75wY72NBy3VSsOKii4mPobvrAO9dI35xSz2nFofH71p1TDcqSyUsYwaNxhpdzYilJTca7PEsGn-Goln3w49WLlmV0aQ084oiwAH_XmDXtzEhtE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAcUjHY1YexJXQbbBienaIpLP7i0ebobcYKTHn42BrEQL7KFp6fluFiSNuWUXMsgzHHVvmsfzY1IxYr3jw9_IhqfH8fkbnVjJ6bgI9inqSdoy3VlNtzTXXJa2cstLq9-2lpJr4hugjt6YESnvHoJzSiWCm-xwjCPVMhk7eHojh7aQEc2AQ9OGMjpzJAFRx3WxZjDew3BPVRKUxPD8PVJaunaSvNSFpIKYQ1iQfYIGvs7qL0Rxv6NmojitCYS6pZpOQSZ-v2qukV0I8y"
    ],
    likes: 89,
    comments: 12
  }
];

export default function Community() {
  return (
    <div className="pt-8 px-container-padding flex flex-col gap-card-gap pb-8">
      {posts.map((post) => (
        <article key={post.id} className="bg-surface-container-lowest rounded-DEFAULT border-2 border-outline shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-container-padding hover:-translate-y-1 transition-transform duration-300">
          {/* Header */}
          <div className="flex items-center justify-between mb-gutter">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-outline">
                <img src={post.avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-body-md text-base font-semibold text-on-surface">{post.author}</span>
                  <span className={`${post.mbtiColor} font-label-caps text-label-caps px-2 py-1 rounded-full uppercase border border-outline-variant`}>
                    {post.mbti}
                  </span>
                </div>
                <span className="font-body-md text-[13px] text-on-surface-variant">{post.time}</span>
              </div>
            </div>
            <button className="text-on-surface-variant hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>

          {/* Content */}
          <p className="font-body-md text-base text-on-surface mb-gutter line-clamp-3">
            {post.content}
          </p>

          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-2 rounded-DEFAULT overflow-hidden border-2 border-outline mb-gutter">
            {post.images.map((img, i) => (
              <div key={i} className="aspect-square bg-surface-container">
                <img src={img} alt="Post image" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-6 text-on-surface-variant">
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">favorite</span>
              <span className="font-body-md text-[14px]">{post.likes}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors group">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">chat_bubble</span>
              <span className="font-body-md text-[14px]">{post.comments}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors group ml-auto">
              <span className="material-symbols-outlined group-hover:scale-110 transition-transform">share</span>
            </button>
          </div>
        </article>
      ))}

      {/* Loading Indicator */}
      <div className="flex justify-center items-center py-8">
        <span className="material-symbols-outlined animate-spin text-outline">refresh</span>
      </div>

       {/* Floating Action Button (FAB) */}
      <button className="fixed bottom-[100px] right-6 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.2)] transition-all z-40 border-2 border-transparent">
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  );
}
