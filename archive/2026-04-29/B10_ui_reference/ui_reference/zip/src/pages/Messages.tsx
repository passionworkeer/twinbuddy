import { Link } from "react-router-dom";

const messages = [
  {
    id: 1,
    name: "李华 (Li Hua)",
    time: "10:30 AM",
    msg: "我们这周末去复习高级生物学吧？我已经整理好了前三章的知识点。",
    unread: 2,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiP3i7U77QoXxE4S-fblUTyU7mPXcw0EwWnoXXmbERYXIxDOAqh4l6FwE6SE4MqSdEGjk9ofFjLQMypT5wxj0oBFGqhA1CG1xVWqH98kP44WO3aiB4dLpkHfZK4ltGScYDl4qiF19iakLl_uVUnGcpWOS78P_Sz8hQ0qrnVezzLxS1dj0B0CQMvfTXT4KIQ7zWV9KVp0pdDE-rKU-zBBxpSbeDJr-z5DL5Kqx1r1lwbryoyc6mqneKjmkWc3M86C1qT5YvhsZD80hB",
    read: false,
    online: true,
  },
  {
    id: 2,
    name: "张伟 (Zhang Wei)",
    time: "昨天",
    msg: "昨天的微积分讲义你发我一份可以吗？",
    unread: 1,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVMe7z2hcNRf6p486Ik0tlc_FQbD8zfG_8Iqf2hzJnLsnB9Z6e5rNtbNWOn4c_WCYKwpkfIKPM7v71ZTC2vEViC7mP6wQh0hfJ4BboePdnSOM3gqBAe1FHMSo1TR4o0gscnEZimyYNyMgRazrrgtzVMr2_DDagF0fkHNJLiUmIgAWNXWH8PM73ROAbGNikEPjfDVmbUrmvHC1omheRPr9SviUYB67uE8bANXSjUvZ-uoB0tIEAuEx15XdvbceUlxP3JWu136iN5D74",
    read: false,
    online: false,
  },
  {
    id: 3,
    name: "王芳 (Wang Fang)",
    time: "星期二",
    msg: "好的，那我们图书馆见！",
    unread: 0,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUM7xYAThH0g2Ygi7g4IZCGGcLiVGsi-QGbxHtoYNPdieXttLEEDFCy9nuTBOoRxefDvE2dWV-4OmctMdsFccPoxgED7DnYCubhsg_d_IQ-lgSFEsl4TFDUCKw5cwTSI1Kl21auWeiTz9-DiX_CNTtorGQyJePsNcyHwUhq7AQGXB72Wk311zYWJwwlLnkbb1UafwjMJpDl1j6xAvCHStIG6Mbxw0-91EQx_JgSxNyntKVC2jpVeLTaaBgFQhO8E00VCVKQ_RF95vK",
    read: true,
    online: false,
  },
  {
    id: 4,
    name: "赵雷 (Zhao Lei)",
    time: "星期一",
    msg: "谢谢你上次的帮忙，下次换我请客。",
    unread: 0,
    avatar: null,
    read: true,
    online: false,
    initial: "Z",
  }
];

export default function Messages() {
  return (
    <div className="pt-8 px-container-padding max-w-3xl mx-auto flex flex-col">
      <header className="mb-gutter flex items-center justify-between">
        <h1 className="font-h1 text-h1 text-primary">消息</h1>
      </header>

      {/* Search Bar (Neo-Brutalist) */}
      <div className="relative mb-section-margin group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline">search</span>
        </div>
        <input 
          type="text" 
          className="w-full bg-surface-container-lowest border-2 border-primary rounded-full py-4 pl-12 pr-4 font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:outline-none focus:ring-4 focus:ring-secondary-container transition-shadow shadow-[0_4px_0_0_#000] focus:shadow-[0_2px_0_0_#000] focus:translate-y-[2px]" 
          placeholder="搜索对话..." 
        />
      </div>

      {/* Messages List */}
      <div className="flex flex-col gap-card-gap">
        {messages.map((chat) => (
          <button 
            key={chat.id}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left group transition-all ${
              !chat.read 
                ? 'bg-surface-container-lowest border-2 border-primary shadow-[0_4px_0_0_#000] hover:translate-y-[-2px] hover:shadow-[0_6px_0_0_#000]'
                : 'bg-surface-container-low border-2 border-transparent hover:border-outline-variant hover:bg-surface-container-lowest'
            }`}
          >
            <div className={`relative shrink-0 ${chat.read ? 'opacity-80 group-hover:opacity-100 transition-opacity' : ''}`}>
              {chat.avatar ? (
                <img 
                  src={chat.avatar} 
                  alt="Avatar" 
                  className={`w-16 h-16 rounded-full object-cover group-hover:scale-105 transition-transform ${!chat.read ? 'border-2 border-primary' : 'border-2 border-outline-variant'}`}
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-outline-variant bg-tertiary-fixed-dim flex items-center justify-center">
                  <span className="font-h2 text-h2 text-on-tertiary-fixed-variant">{chat.initial}</span>
                </div>
              )}
              {chat.online && (
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-secondary border-2 border-surface-container-lowest rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className={`font-body-lg text-body-lg truncate ${!chat.read ? 'font-bold text-primary' : 'font-medium text-on-surface'}`}>
                  {chat.name}
                </h3>
                <span className={`font-label-caps text-label-caps shrink-0 ml-2 ${!chat.read ? 'text-secondary' : 'text-outline'}`}>
                  {chat.time}
                </span>
              </div>
              <p className={`font-body-md text-body-md truncate ${!chat.read ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                {chat.msg}
              </p>
            </div>
            
            {!chat.read && (
              <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-on-secondary font-label-caps text-label-caps border-2 border-primary">
                {chat.unread}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
