import type { ShowcaseItem } from '../components/v2/ShowcaseCarousel';

export const homeShowcases: ShowcaseItem[] = [
  {
    id: 'home-1',
    eyebrow: '今日高匹配场景',
    title: '深圳出发 2 天顺德慢吃线',
    body: '系统判断你更适合“白天逛街区、晚上留白散步”的节奏，这条线同时兼容预算和第一次见面的社交强度。',
    metricLabel: '数字分身信心',
    metricValue: '91%',
    tags: ['顺德', '周末', '慢节奏'],
  },
  {
    id: 'home-2',
    eyebrow: 'AI 正在观察的偏好',
    title: '你最近对“好吃但不赶”的表达更稳定了',
    body: '近几次对话里，你的关键词逐渐收敛到美食、散步、周边城市，系统会因此把过度特种兵路线往后排。',
    metricLabel: '近 7 天偏好收敛',
    metricValue: '76%',
    tags: ['美食导向', '周边城市', '轻社交'],
  },
  {
    id: 'home-3',
    eyebrow: '值得继续追问的问题',
    title: '你的预算弹性可能比你想象的大',
    body: '当路线足够舒服、吃住不踩雷时，你对“稍微贵一点”的接受度在上升，这会影响后续匹配优先级。',
    metricLabel: '预算弹性',
    metricValue: '+18%',
    tags: ['舒适优先', '体验型消费'],
  },
];

export const buddyShowcases: ShowcaseItem[] = [
  {
    id: 'buddy-hero-1',
    eyebrow: '今日预协商速报',
    title: '小满愿意做攻略，但不想把每一分钟都排满',
    body: '这类搭子适合先进入盲选，因为显性偏好已足够接近，剩下主要看你们在节奏和消费观上的底层一致度。',
    metricLabel: '进入盲选建议值',
    metricValue: '88%',
    tags: ['会做攻略', '松弛感', '周末短途'],
  },
  {
    id: 'buddy-hero-2',
    eyebrow: '仍需观察',
    title: '阿杰的社交强度偏低，但旅行预算极稳',
    body: '如果你更在意不吵架、少临时改计划，他是值得保留的对象；如果你很需要互动感，就要小心落差。',
    metricLabel: '冲突风险',
    metricValue: '中',
    tags: ['预算稳定', '少社交', '理性型'],
  },
  {
    id: 'buddy-hero-3',
    eyebrow: '系统提醒',
    title: 'Momo 的出片诉求偏强，适合拍照耐心更高的人',
    body: '你们在吃和逛上是对齐的，但若你不想被照片节奏打断，建议先在盲选里验证拍照态度。',
    metricLabel: '照片冲突提示',
    metricValue: '72%',
    tags: ['出片需求', '美食导向', '城市散步'],
  },
];

export const communityShowcases: ShowcaseItem[] = [
  {
    id: 'community-1',
    eyebrow: '广场热门标签',
    title: '“五一 + 顺德 + 慢吃” 正在变热',
    body: '这类帖子不仅容易获得互动，也会更快进入数字分身代聊，因为目的地、预算和节奏信息都更完整。',
    metricLabel: '近 24h 发帖热度',
    metricValue: '142',
    tags: ['五一', '顺德', '美食'],
  },
  {
    id: 'community-2',
    eyebrow: '最容易被认领的帖子',
    title: '带明确日期和预算的搭子帖更容易促成后续私信',
    body: '如果你想提高认领率，最好把 trip date、天数和预算范围写得清楚，系统也更容易帮你筛到合适对象。',
    metricLabel: '认领率提升',
    metricValue: '+34%',
    tags: ['日期明确', '预算明确', '找搭子'],
  },
  {
    id: 'community-3',
    eyebrow: '代聊命中提醒',
    title: '同城帖子会优先触发地理邻近的数字分身代聊',
    body: '这能降低陌生匹配成本，也更符合真实线下见面场景，适合先用来做产品冷启动。',
    metricLabel: '同城优先级',
    metricValue: 'P1',
    tags: ['同城优先', '冷启动', '附近的人'],
  },
];

export const messageShowcases: ShowcaseItem[] = [
  {
    id: 'message-1',
    eyebrow: '建议你现在聊什么',
    title: '先确认“到店时间 + 预算上限”，比闲聊更能推进关系',
    body: '匹配成功后的前 20 分钟，如果能快速对齐到达方式、预算上限和起床时间，后续更容易落到真的出行计划。',
    metricLabel: '推进效率',
    metricValue: '高',
    tags: ['预算上限', '到店时间', '起床节奏'],
  },
  {
    id: 'message-2',
    eyebrow: '私信场景卡',
    title: '先抛一个轻量行程卡，会比纯文字更稳',
    body: '哪怕只是“顺德两天一夜，吃和散步为主”的半成品，也能帮助双方快速理解节奏，减少来回猜测。',
    metricLabel: '推荐消息形态',
    metricValue: 'Trip Card',
    tags: ['行程卡片', '低压沟通', '少误解'],
  },
  {
    id: 'message-3',
    eyebrow: '关系温度计',
    title: '如果 24 小时没回复，数字分身可以接手做轻提醒',
    body: '后续接入自动调度后，系统可用不打扰的方式帮你们把对话从“匹配成功”推进到“确定出发”。',
    metricLabel: '未来能力',
    metricValue: '待接入',
    tags: ['自动跟进', '轻提醒', '代聊调度'],
  },
];

export const profileShowcases: ShowcaseItem[] = [
  {
    id: 'profile-1',
    eyebrow: '人格快照',
    title: '你更像“有计划的松弛派”',
    body: '你并不抗拒做攻略，只是讨厌过度压缩行程。这个标签会让系统优先找愿意留白、但不混乱的人。',
    metricLabel: '当前人格标签',
    metricValue: 'Balanced Planner',
    tags: ['留白', '不混乱', '稳节奏'],
  },
  {
    id: 'profile-2',
    eyebrow: '行为信号',
    title: '你最近的表达更少“必须”，更多“最好”',
    body: '这说明你的协商风格在朝柔和方向走，匹配系统会因此适度抬高和探索型人格的兼容度。',
    metricLabel: '协商柔和度',
    metricValue: '67%',
    tags: ['柔和表达', '弹性提高'],
  },
  {
    id: 'profile-3',
    eyebrow: '安全侧画像',
    title: '完成实名认证后，你的匹配优先级也会提升',
    body: '因为平台能把你纳入完整的见面链路，包括盲选后行程上报、紧急联系人和正式私信关系。',
    metricLabel: '安全完成度',
    metricValue: '待完成',
    tags: ['实名认证', '行程上报', '正式认识'],
  },
];
