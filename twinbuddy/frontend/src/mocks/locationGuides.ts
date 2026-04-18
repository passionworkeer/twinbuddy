import type {
  GuidePreference,
  LocationGuide,
  LocationGuideVersion,
  VideoItem,
} from '../types';
import { guidePreferenceLabel } from '../utils/scenePreference';

interface LocationGuideTemplate {
  locationId: string;
  headline: string;
  description: string;
  versions: {
    indoor: LocationGuideVersion;
    outdoor: LocationGuideVersion;
  };
}

const DEFAULT_TEMPLATE: LocationGuideTemplate = {
  locationId: 'travel',
  headline: '本地氛围先看再定路线',
  description: '先用一条轻量路线感受城市节奏，再决定后续深入玩法。',
  versions: {
    indoor: {
      heading: '室内松弛线',
      summary: '以安静空间和高质量停留为主，适合先恢复状态。',
      highlights: ['安静坐坐', '避开人潮', '低体力消耗'],
      strategies: [
        '先去一间安静的小馆子坐 40 分钟，确认今天节奏。',
        '选择步行可达的两处点位，避免高密度赶场。',
        '给晚上留一段空白时间，避免行程过满。',
      ],
    },
    outdoor: {
      heading: '户外沉浸线',
      summary: '先看地标风景，再穿插在地体验，保持轻量但有画面感。',
      highlights: ['风景优先', '拍照友好', '路线可弹性调整'],
      strategies: [
        '优先安排一处高景观位，趁光线好先拍主画面。',
        '中段留一处补给点，避免连续暴走。',
        '把最后一个点设为可跳过，留给临场惊喜。',
      ],
    },
  },
};

const LOCATION_GUIDE_TEMPLATES: Record<string, LocationGuideTemplate> = {
  成都: {
    locationId: 'chengdu',
    headline: '成都慢热攻略',
    description: '从巷子与茶馆切入，会比打卡清单更像真正的成都。',
    versions: {
      indoor: {
        heading: '室内治愈线',
        summary: '茶馆和老店为主，适合慢聊和恢复能量。',
        highlights: ['茶馆停留', '小馆子故事感', '节奏舒缓'],
        strategies: [
          '上午先选一家老茶馆坐下，把第一段状态调慢。',
          '午后安排一间文艺咖啡馆或书店，做轻量 citywalk。',
          '晚餐选街边小店，不追热门榜单，优先排队短且氛围好的店。',
        ],
      },
      outdoor: {
        heading: '户外街巷线',
        summary: '宽窄巷子和周边街区串联，重点在生活感与烟火气。',
        highlights: ['街巷拍照', '轻徒步', '夜间烟火气'],
        strategies: [
          '下午四点后进街区，光线更适合拍人物和街景。',
          '把路线拆成两段，每段控制在 45 分钟内。',
          '夜里留给河边散步或小酒馆，避免晚高峰挤热门点。',
        ],
      },
    },
  },
  重庆: {
    locationId: 'chongqing',
    headline: '山城层次玩法',
    description: '把夜景和坡地步行拆开体验，体感会轻松很多。',
    versions: {
      indoor: {
        heading: '室内观景线',
        summary: '选择室内观景位和特色餐馆，减少高坡体力消耗。',
        highlights: ['观景餐厅', '避雨友好', '晚间舒适'],
        strategies: [
          '先在室内观景位看江景，把夜景核心画面拿到。',
          '火锅安排在非高峰时段，减少排队消耗。',
          '晚间只保留一个步行点，控制连续上下坡。',
        ],
      },
      outdoor: {
        heading: '户外夜游线',
        summary: '洪崖洞外沿和江边步道为主，强调层次夜景。',
        highlights: ['江边夜景', '坡地城市感', '拍照氛围强'],
        strategies: [
          '蓝调时刻前抵达江边，先拍天色过渡。',
          '从高位到低位走一段，镜头画面会更立体。',
          '夜游结束后预留返程缓冲，避免最后一程太赶。',
        ],
      },
    },
  },
  川西: {
    locationId: 'chuanxi',
    headline: '川西风景优先策略',
    description: '先保证高质量风景段，再决定是否加码深度点位。',
    versions: {
      indoor: {
        heading: '室内补给线',
        summary: '把高原长途拆成补给节奏，优先安全和舒适。',
        highlights: ['补给优先', '减少高海拔暴露', '低风险'],
        strategies: [
          '把车程按 60-90 分钟切段，固定补给和休整。',
          '高海拔点只做短停拍照，不做长时间暴露。',
          '晚间尽量选择供暖和供氧条件更好的住宿点。',
        ],
      },
      outdoor: {
        heading: '户外公路线',
        summary: '以雪山草原公路段为主，重点抓光线和停靠点。',
        highlights: ['雪山草甸', '公路片段', '黄金光线'],
        strategies: [
          '清晨或傍晚跑主景段，中午改为机动转场。',
          '预先标记三个可停靠点，不临时急刹找机位。',
          '每天只设一个核心景观点，剩余时间给天气变化。',
        ],
      },
    },
  },
  大理: {
    locationId: 'dali',
    headline: '大理慢节奏指南',
    description: '洱海与古城之间留白体验，比密集打卡更容易出片。',
    versions: {
      indoor: {
        heading: '室内文艺线',
        summary: '咖啡馆、小院和在地手作店为主，适合慢聊慢逛。',
        highlights: ['文艺咖啡馆', '小院停留', '人文氛围'],
        strategies: [
          '上午先选古城内小馆，边休息边整理当日路线。',
          '中段安排一处手作店或展陈空间，保持安静体验。',
          '傍晚再出门看海边光线，避免全天暴露在强日照下。',
        ],
      },
      outdoor: {
        heading: '户外环海线',
        summary: '环洱海和古城步行结合，保留风景与机动空间。',
        highlights: ['洱海光线', '古城巷子', '骑行友好'],
        strategies: [
          '环海路线先做半圈，剩余半圈看体力和天气再定。',
          '古城段放在晚饭前后，避开中午人流和强光。',
          '拍照以逆光和侧光为主，减少正午硬光废片。',
        ],
      },
    },
  },
  丽江: {
    locationId: 'lijiang',
    headline: '丽江古城分层逛法',
    description: '主街和支巷分开逛，既有热闹也能留出安静时段。',
    versions: {
      indoor: {
        heading: '室内静享线',
        summary: '茶馆和小院民宿为主，适合慢节奏整理状态。',
        highlights: ['茶馆慢聊', '小院休息', '夜间轻社交'],
        strategies: [
          '午后优先室内停留，晚间再出门看古城灯光。',
          '把最热闹区域只作为短停点，不做长时间逗留。',
          '夜间挑一间安静小馆，保证第二天精力。',
        ],
      },
      outdoor: {
        heading: '户外夜游线',
        summary: '以古城夜景和桥巷光影为主，适合步行拍摄。',
        highlights: ['古城夜色', '巷道层次', '步行可达'],
        strategies: [
          '日落前踩点，夜里按反方向再走一次主路线。',
          '桥边和转角位优先拍，画面层次更明显。',
          '全程穿插短休，避免连续站立导致后段疲劳。',
        ],
      },
    },
  },
  青岛: {
    locationId: 'qingdao',
    headline: '青岛海边轻攻略',
    description: '海边与街区混搭，比单一打卡更有节奏感。',
    versions: {
      indoor: {
        heading: '室内舒适线',
        summary: '海景咖啡馆加啤酒小店，适合放松和社交。',
        highlights: ['海景休息', '小店氛围', '低步行强度'],
        strategies: [
          '先在海景馆坐下，观察风向和光线再决定外拍时段。',
          '午后用街区慢逛替代长距离海边暴晒。',
          '晚间安排啤酒小店收尾，控制返程距离。',
        ],
      },
      outdoor: {
        heading: '户外海岸线',
        summary: '海边步道和小街串联，重点抓风景和人文对比。',
        highlights: ['海岸步行', '海风氛围', '街区切换'],
        strategies: [
          '傍晚前后走海边主段，风景和体感都更好。',
          '海边段结束后立即切到街区，避免风大体温下降。',
          '拍照选择海岸线斜角构图，画面更有纵深。',
        ],
      },
    },
  },
  厦门: {
    locationId: 'xiamen',
    headline: '厦门鼓浪屿慢拍路线',
    description: '街角和海风节奏搭配，适合做轻量深度体验。',
    versions: {
      indoor: {
        heading: '室内文艺线',
        summary: '街角咖啡馆和老建筑空间为主，适合慢拍慢逛。',
        highlights: ['老建筑氛围', '街角停留', '节奏友好'],
        strategies: [
          '上午避开高峰船次，先在岛内室内点位慢逛。',
          '中段选择一处老建筑空间补拍细节。',
          '傍晚再去海边短停，避免暴晒和拥挤。',
        ],
      },
      outdoor: {
        heading: '户外海风线',
        summary: '鼓浪屿街角和海边步道结合，重点抓光影变化。',
        highlights: ['海风步道', '街角故事感', '轻徒步'],
        strategies: [
          '先走街角窄巷，后切海边步道，体感更顺。',
          '每 30 分钟补水一次，避免海边步行脱水。',
          '把返程时间前置，预留船班机动缓冲。',
        ],
      },
    },
  },
  西安: {
    locationId: 'xian',
    headline: '西安夜色与历史并行',
    description: '大唐不夜城和周边历史片区分时体验，避免同段拥堵。',
    versions: {
      indoor: {
        heading: '室内文化线',
        summary: '馆内展陈和晚间商圈结合，适合稳态体验。',
        highlights: ['文化沉浸', '强叙事感', '低体力消耗'],
        strategies: [
          '白天先看室内展陈，晚上再进不夜城核心段。',
          '把就餐和休息点提前锁定，减少高峰排队。',
          '夜间拍摄控制在一到两个核心机位，不做全线暴走。',
        ],
      },
      outdoor: {
        heading: '户外夜色线',
        summary: '不夜城主轴和周边街区联动，重点抓灯光节点。',
        highlights: ['夜景灯光', '街区步行', '拍照表现强'],
        strategies: [
          '蓝调时刻进入主轴，优先完成核心夜景拍摄。',
          '主轴结束后转入相邻街区，分散人流压力。',
          '返程前做一次补给，避免最后阶段体力下滑。',
        ],
      },
    },
  },
};

function resolveTemplate(location: string): LocationGuideTemplate {
  return LOCATION_GUIDE_TEMPLATES[location] ?? DEFAULT_TEMPLATE;
}

export function buildLocationGuide(location: string, preference: GuidePreference): LocationGuide {
  const template = resolveTemplate(location);
  const version = template.versions[preference];

  return {
    locationId: template.locationId,
    headline: template.headline,
    description: template.description,
    preference,
    preferenceLabel: guidePreferenceLabel(preference),
    version,
  };
}

export function createLocationCardItem(sourceVideo: VideoItem, preference: GuidePreference): VideoItem {
  const guide = buildLocationGuide(sourceVideo.location, preference);

  return {
    id: 'location-guide-1',
    type: 'location_card',
    cover_url: sourceVideo.cover_url,
    video_url: sourceVideo.video_url,
    location: sourceVideo.location,
    title: guide.headline,
    description: guide.description,
    buddy: sourceVideo.buddy,
    locationGuide: guide,
  };
}
