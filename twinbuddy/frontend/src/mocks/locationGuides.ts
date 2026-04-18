import type {
  GuidePreference,
  LocationGuide,
  LocationGuideVersion,
  VideoItem,
} from '../types';
import { guidePreferenceLabel } from '../utils/scenePreference';

type PreferenceVariant = 'indoorRelaxed' | 'indoorCultural' | 'outdoorNormal' | 'outdoorAdventure';

interface LocationGuideVersionSet {
  indoorRelaxed: LocationGuideVersion;
  indoorCultural: LocationGuideVersion;
  outdoorNormal: LocationGuideVersion;
  outdoorAdventure: LocationGuideVersion;
}

interface LocationGuideTemplate {
  locationId: string;
  headline: string;
  description: string;
  versions: LocationGuideVersionSet;
}

const LOCATION_GUIDE_TEMPLATES: Record<string, LocationGuideTemplate> = {
  成都: {
    locationId: 'chengdu',
    headline: '成都慢热攻略：茶馆巷子与熊猫雪山并行',
    description: '从人民公园茶馆切入真实成都生活，再决定是深度文化还是山野冒险，比纯打卡更接地气。',
    versions: {
      indoorRelaxed: {
        heading: '室内治愈放松线',
        summary: '人民公园茶馆 + 老街小馆，慢节奏恢复能量，适合先适应成都"慢生活"。',
        highlights: ['茶馆闲坐', '小吃故事感', '低体力消耗', '本地人氛围'],
        strategies: [
          '上午直奔人民公园老茶馆，点盖碗茶+麻辣兔头或龙抄手，坐2-3小时看老人打牌聊蜀地故事，确认今天节奏。',
          '午后去宽窄巷子或锦里挑一家文艺咖啡馆（如麋鹿咖啡或老书店），喝杯成都特色酸梅汤或咖啡，轻逛1小时，不赶场。',
          '晚餐选春熙路附近非网红小馆（如老妈蹄花或钟水饺），排队短、氛围好，避免高峰期拥挤。',
          '晚上回酒店或附近太古里商场看灯光秀，留充足空白时间早睡，养精蓄锐。'
        ]
      },
      indoorCultural: {
        heading: '室内文化沉浸线',
        summary: '博物馆 + 川剧 + 古迹室内展陈，深度了解蜀文化，适合爱故事的旅行者。',
        highlights: ['三星堆/金沙遗址', '川剧变脸', '历史叙事强', '室内避暑/避雨'],
        strategies: [
          '上午去金沙遗址博物馆或三星堆博物馆（成都馆区），花2-3小时看古蜀青铜器和面具，租讲解器听完整故事。',
          '下午安排四川大剧院或文殊院看川剧变脸表演（提前1天订票），近距离感受非遗震撼。',
          '傍晚去武侯祠或杜甫草堂室内展厅，避开室外人潮，慢慢品三国与诗词文化。',
          '晚餐在附近老店吃正宗火锅，边吃边聊当天所见，控制节奏不熬夜。'
        ]
      },
      outdoorNormal: {
        heading: '户外街巷轻度线',
        summary: '宽窄巷子 + 锦里 + 公园步行，烟火气与拍照结合，轻轻松松感受城市节奏。',
        highlights: ['街巷拍照', '轻徒步', '夜间烟火气', '弹性调整'],
        strategies: [
          '下午4点后进宽窄巷子或锦里，光线柔和适合拍人物和老建筑，每段控制在45分钟内。',
          '中途在人民公园或锦江滨江路公园补给休息，喝茶看本地生活。',
          '晚上转安顺廊桥或天府广场夜景，留一段空白可随时跳过热门点。',
          '全程步行或共享单车，避免高峰挤地铁，带防晒随时切换室内。'
        ]
      },
      outdoorAdventure: {
        heading: '户外雪山冒险线',
        summary: '青城山/都江堰 + 熊猫基地徒步或更高海拔，挑战自然与体能。',
        highlights: ['青城山道教登山', '熊猫谷徒步', '光线黄金段', '野外惊喜'],
        strategies: [
          '清晨去青城山前山或后山徒步（索道+登山，3-5小时），趁早光线好拍道观与森林。',
          '中午转都江堰或熊猫基地户外区，短途徒步看大熊猫野外活动。',
          '下午若体力够，可加峨眉山初级线路（或第二天），标记2-3个停靠点拍照。',
          '每天只设1个核心冒险点，剩余时间给天气和休息，晚上高原补给（氧气+热汤）。'
        ]
      }
    }
  },

  重庆: {
    locationId: 'chongqing',
    headline: '山城层次玩法：江景火锅与坡地夜游并存',
    description: '把洪崖洞夜景和火锅室内拆开，体感轻松，真实感受"8D魔幻城市"。',
    versions: {
      indoorRelaxed: {
        heading: '室内观景放松线',
        summary: '江景餐厅 + 火锅慢吃，减少高坡体力消耗，适合先恢复状态。',
        highlights: ['观景餐厅', '火锅故事感', '避雨友好', '晚间舒适'],
        strategies: [
          '上午先去解放碑附近江景咖啡馆（如L2或观景餐厅），点咖啡看长江，坐2小时观察光线和风向。',
          '午后安排瓷器口古镇室内老店喝茶或吃小面，慢慢听本地人聊山城故事。',
          '晚餐选洪崖洞或南滨路非高峰火锅店（提前订位），慢慢吃正宗毛肚鸭肠，避免排队消耗。',
          '晚上只保留一个室内观景位，早回酒店休息。'
        ]
      },
      indoorCultural: {
        heading: '室内文化沉浸线',
        summary: '三峡博物馆 + 老街室内展陈，深度了解巴渝历史。',
        highlights: ['三峡博物馆', '瓷器口文化', '历史叙事强', '室内舒适'],
        strategies: [
          '上午直奔重庆三峡博物馆，花2-3小时看长江三峡文物和抗战展。',
          '下午去洪崖洞或白公馆室内展厅，了解渣滓洞历史故事。',
          '傍晚安排川剧或轻轨穿楼表演，感受魔幻城市文化。',
          '晚餐在附近老火锅店边吃边复盘当天所学。'
        ]
      },
      outdoorNormal: {
        heading: '户外江边轻度线',
        summary: '洪崖洞外沿 + 长江索道 + 解放碑步行，夜景与城市感结合。',
        highlights: ['江边夜景', '坡地城市感', '拍照氛围强', '轻徒步'],
        strategies: [
          '下午4点后搭长江索道过江，先拍蓝调江景。',
          '傍晚进洪崖洞外沿步道，控制每段30-45分钟，拍灯光和建筑层次。',
          '晚上转南滨路或解放碑夜市，留一段空白可随时跳过热门点。',
          '全程用轻轨+步行，避免连续上下坡。'
        ]
      },
      outdoorAdventure: {
        heading: '户外山地冒险线',
        summary: '武隆天生三桥 + 仙女山徒步，挑战喀斯特地貌与高强度坡地。',
        highlights: ['天生三桥徒步', '仙女山露营', '峡谷光线', '野外挑战'],
        strategies: [
          '清晨去武隆天生三桥景区，徒步完整线路（3-5小时），趁早光线拍喀斯特奇观。',
          '中午补给后转仙女山草原，短途高强度徒步或轻露营。',
          '下午标记2-3个机位，抓黄金光线。',
          '每天只设1个核心冒险点，晚上回市区补给，准备第二天体能。'
        ]
      }
    }
  },

  川西: {
    locationId: 'chuanxi',
    headline: '川西风景优先策略：雪山草原与高原安全并重',
    description: '先保证高质量风景段，再决定是否加码深度点位，真实感受川西高原震撼。',
    versions: {
      indoorRelaxed: {
        heading: '室内补给放松线',
        summary: '高原客栈 + 藏式茶室，优先安全和舒适，适合长途后恢复。',
        highlights: ['补给优先', '减少高海拔暴露', '低风险', '藏式氛围'],
        strategies: [
          '上午在甘孜/阿坝藏式客栈（带供氧和暖气）喝酥油茶，坐2小时调整高原反应。',
          '午后安排室内藏文化体验馆或酒店SPA，慢慢恢复体力。',
          '傍晚只做短停补给，避免长时间户外。',
          '晚间选择有供暖的住宿，早睡养精蓄锐。'
        ]
      },
      indoorCultural: {
        heading: '室内文化沉浸线',
        summary: '寺庙室内 + 藏族文化展，深度了解康巴文化。',
        highlights: ['寺庙展陈', '藏文化故事', '室内舒适', '历史叙事'],
        strategies: [
          '上午去黄龙寺或色达佛学院室内展厅，花2小时听僧侣讲解。',
          '下午安排当地康巴文化博物馆或非遗展。',
          '傍晚在客栈看藏戏或听锅庄故事。',
          '晚餐吃藏餐，边吃边复盘。'
        ]
      },
      outdoorNormal: {
        heading: '户外公路轻度线',
        summary: '九寨沟湖边栈道 + 色达草原轻骑，风景与轻松结合。',
        highlights: ['九寨沟湖光', '草原轻徒步', '公路片段', '黄金光线'],
        strategies: [
          '清晨进九寨沟，沿木栈道慢走核心湖区（诺日朗、珍珠滩），控制3小时内。',
          '中午转色达草原，短途骑马或步行拍照。',
          '下午留机动时间给天气变化。',
          '晚上回补给点，避免夜间高原行车。'
        ]
      },
      outdoorAdventure: {
        heading: '户外高海拔冒险线',
        summary: '四姑娘山 + 稻城亚丁徒步/露营，挑战雪山与原始自然。',
        highlights: ['四姑娘山登山', '亚丁雪山', '高海拔露营', '野外挑战'],
        strategies: [
          '清晨出发四姑娘山双桥沟或长坪沟徒步（4-6小时），索道+徒步结合。',
          '中午补给后转稻城亚丁，冲刺牛奶海/五色海机位。',
          '下午若体力允许，可轻露营拍星空。',
          '每天只设1个核心高海拔点，严格带氧气瓶和专业装备。'
        ]
      }
    }
  },

  大理: {
    locationId: 'dali',
    headline: '大理慢节奏指南：洱海古城与苍山并行',
    description: '洱海与古城之间留白体验，比密集打卡更容易出片。',
    versions: {
      indoorRelaxed: {
        heading: '室内文艺放松线',
        summary: '古城咖啡馆 + 小院民宿，慢聊慢逛，适合先适应大理节奏。',
        highlights: ['文艺咖啡馆', '小院停留', '人文氛围', '低体力'],
        strategies: [
          '上午选古城内小馆（如喜林苑或老树咖啡），边喝咖啡边整理当日路线，坐2小时。',
          '午后去双廊或挖色海景民宿小院，慢慢看书或发呆。',
          '傍晚安排手作店体验（如扎染或银器），保持安静。',
          '晚上早回民宿，留空白时间看洱海夜景。'
        ]
      },
      indoorCultural: {
        heading: '室内文化沉浸线',
        summary: '崇圣寺 + 白族博物馆，深度了解南诏与白族历史。',
        highlights: ['崇圣寺展陈', '白族文化', '历史叙事', '室内舒适'],
        strategies: [
          '上午去崇圣寺三塔室内展厅，看南诏文物。',
          '下午安排大理白族文化博物馆或非遗馆。',
          '傍晚看白族三道茶表演（提前订）。',
          '晚餐吃白族土八碗，边吃边聊文化。'
        ]
      },
      outdoorNormal: {
        heading: '户外环海轻度线',
        summary: '洱海环湖步道 + 古城巷子，风景与人文结合。',
        highlights: ['洱海光线', '古城巷子', '骑行友好', '轻徒步'],
        strategies: [
          '下午4点后骑行或步行洱海半圈（双廊-挖色段），抓逆光拍照。',
          '中途停喜洲古镇或周城，短逛白族民居。',
          '晚上古城夜游，留一段空白可随时返回。',
          '全程电瓶车或自行车，避免暴晒。'
        ]
      },
      outdoorAdventure: {
        heading: '户外苍山冒险线',
        summary: '苍山徒步 + 鸡足山登山，挑战海拔与原始森林。',
        highlights: ['苍山索道徒步', '鸡足山登山', '云海光线', '野外挑战'],
        strategies: [
          '清晨索道上苍山，徒步感通寺-玉局峰线路（3-5小时）。',
          '中午补给后转鸡足山，挑战金顶登山。',
          '下午抓云海和日落机位。',
          '严格带防晒和雨具，每天只设1个核心登山点。'
        ]
      }
    }
  },

  丽江: {
    locationId: 'lijiang',
    headline: '丽江古城分层逛法：主街支巷与雪山并行',
    description: '主街和支巷分开逛，既有热闹也能留出安静时段。',
    versions: {
      indoorRelaxed: {
        heading: '室内静享放松线',
        summary: '茶馆 + 小院民宿，慢节奏整理状态。',
        highlights: ['茶馆慢聊', '小院休息', '夜间轻社交', '低消耗'],
        strategies: [
          '午后优先古城茶馆（如黑龙潭边茶室），坐2小时喝普洱。',
          '傍晚回小院民宿看书或听纳西古乐。',
          '晚上挑安静小馆，轻社交不熬夜。',
          '保证第二天精力。'
        ]
      },
      indoorCultural: {
        heading: '室内文化沉浸线',
        summary: '木府 + 印象丽江表演，深度纳西文化。',
        highlights: ['木府展陈', '纳西古乐', '历史叙事', '室内舒适'],
        strategies: [
          '上午去木府看纳西王宫建筑和文物。',
          '下午安排印象丽江或古乐表演。',
          '傍晚黑龙潭室内展厅品文化。',
          '晚餐纳西特色菜边吃边聊。'
        ]
      },
      outdoorNormal: {
        heading: '户外古城夜游线',
        summary: '丽江古城 + 黑龙潭公园 + 束河古镇步行。',
        highlights: ['古城夜色', '巷道层次', '步行可达', '轻徒步'],
        strategies: [
          '日落前踩点主街，夜里反方向再走一次。',
          '桥边和转角优先拍。',
          '全程穿插短休。',
          '避开中午人流。'
        ]
      },
      outdoorAdventure: {
        heading: '户外雪山冒险线',
        summary: '玉龙雪山 + 虎跳峡徒步，挑战高海拔与峡谷。',
        highlights: ['玉龙雪山索道徒步', '虎跳峡穿越', '雪山光线', '高难度'],
        strategies: [
          '清晨玉龙雪山索道+蓝月谷徒步（3-5小时）。',
          '中午转虎跳峡中虎跳，挑战高难度段。',
          '下午抓雪山日落。',
          '严格高原装备，每天1核心点。'
        ]
      }
    }
  },

  青岛: {
    locationId: 'qingdao',
    headline: '青岛海边轻攻略：海岸步道与啤酒文化并行',
    description: '海边与街区混搭，比单一打卡更有节奏感。',
    versions: {
      indoorRelaxed: {
        heading: '室内海景放松线',
        summary: '海景咖啡馆 + 啤酒小店，适合放松和社交。',
        highlights: ['海景休息', '小店氛围', '低步行强度', '啤酒文化'],
        strategies: [
          '上午海景咖啡馆（如栈桥边）坐下，观察风向和光线。',
          '午后街区慢逛替代暴晒。',
          '晚间啤酒小店收尾。',
          '控制返程距离。'
        ]
      },
      indoorCultural: {
        heading: '室内文化沉浸线',
        summary: '啤酒博物馆 + 德国老建筑室内，深度了解殖民与啤酒历史。',
        highlights: ['啤酒博物馆', '老建筑展', '海军博物馆', '叙事强'],
        strategies: [
          '上午青岛啤酒博物馆全览。',
          '下午德国总督府或八大关室内展。',
          '傍晚海军博物馆。',
          '晚餐啤酒+海鲜。'
        ]
      },
      outdoorNormal: {
        heading: '户外海岸轻度线',
        summary: '八大关 + 栈桥 + 第一海水浴场步道。',
        highlights: ['海岸步行', '海风氛围', '街区切换', '拍照友好'],
        strategies: [
          '傍晚前后走海边主段。',
          '海边后切街区避风。',
          '斜角构图拍照。',
          '弹性调整。'
        ]
      },
      outdoorAdventure: {
        heading: '户外崂山冒险线',
        summary: '崂山登山 + 海边露营，挑战山海结合。',
        highlights: ['崂山徒步', '上清宫线路', '海边露营', '高强度'],
        strategies: [
          '清晨崂山索道+徒步上清宫（4-6小时）。',
          '中午补给后海边短露营。',
          '抓黄金光线。',
          '1核心点+专业装备。'
        ]
      }
    }
  },

  厦门: {
    locationId: 'xiamen',
    headline: '厦门鼓浪屿慢拍路线：街角海风与老建筑并行',
    description: '街角和海风节奏搭配，适合做轻量深度体验。',
    versions: {
      indoorRelaxed: {
        heading: '室内文艺放松线',
        summary: '街角咖啡馆 + 老别墅，慢拍慢逛。',
        highlights: ['老建筑氛围', '街角停留', '节奏友好', '低消耗'],
        strategies: [
          '上午避开高峰船次，先岛内室内点位慢逛。',
          '中段老建筑空间补拍细节。',
          '傍晚海边短停。',
          '避暴晒拥挤。'
        ]
      },
      indoorCultural: {
        heading: '室内文化沉浸线',
        summary: '南普陀寺 + 管风琴博物馆，深度闽南文化。',
        highlights: ['南普陀室内', '管风琴博物馆', '历史叙事', '室内舒适'],
        strategies: [
          '上午南普陀寺室内祈福展。',
          '下午鼓浪屿管风琴博物馆。',
          '傍晚老别墅展陈。',
          '晚餐闽南菜。'
        ]
      },
      outdoorNormal: {
        heading: '户外海风轻度线',
        summary: '鼓浪屿街角 + 海边步道 + 环岛路。',
        highlights: ['海风步道', '街角故事感', '轻徒步', '光影变化'],
        strategies: [
          '先走街角窄巷，后切海边步道。',
          '每30分钟补水。',
          '返程前置缓冲。',
          '避中午高峰。'
        ]
      },
      outdoorAdventure: {
        heading: '户外岛屿冒险线',
        summary: '日光岩攀登 + 胡里山炮台徒步 + 外岛露营。',
        highlights: ['日光岩登山', '胡里山徒步', '外岛露营', '海岛挑战'],
        strategies: [
          '清晨日光岩全攀登。',
          '中午转胡里山周边高强度徒步。',
          '下午大嶝岛短露营。',
          '1核心点+防晒装备。'
        ]
      }
    }
  },

  西安: {
    locationId: 'xian',
    headline: '西安夜色与历史并行：城墙兵马俑与华山冒险',
    description: '大唐不夜城和周边历史片区分时体验，避免同段拥堵。',
    versions: {
      indoorRelaxed: {
        heading: '室内文化放松线',
        summary: '回民街小吃室内 + 书院门茶馆，稳态体验。',
        highlights: ['小吃室内', '茶馆休息', '低体力', '本地氛围'],
        strategies: [
          '上午回民街室内老店慢吃。',
          '午后书院门茶馆休息。',
          '傍晚控制节奏。',
          '早回酒店。'
        ]
      },
      indoorCultural: {
        heading: '室内历史沉浸线',
        summary: '兵马俑 + 陕西历史博物馆 + 大雁塔室内展。',
        highlights: ['兵马俑博物馆', '历史博物馆', '大雁塔展', '叙事强'],
        strategies: [
          '上午兵马俑博物馆2-3小时。',
          '下午陕西历史博物馆。',
          '傍晚大雁塔室内展。',
          '晚餐回民街复盘。'
        ]
      },
      outdoorNormal: {
        heading: '户外城墙夜游线',
        summary: '西安城墙骑行 + 回民街夜市 + 大唐不夜城灯光。',
        highlights: ['城墙夜景', '街区步行', '灯光拍照', '轻徒步'],
        strategies: [
          '蓝调时刻进主轴拍夜景。',
          '主轴后转街区分散人流。',
          '返程前补给。',
          '骑行或步行。'
        ]
      },
      outdoorAdventure: {
        heading: '户外华山冒险线',
        summary: '华山登山 + 秦岭周边徒步/露营，挑战险峰。',
        highlights: ['华山索道徒步', '长空栈道', '秦岭露营', '高难度'],
        strategies: [
          '清晨华山索道+北峰徒步（4-6小时）。',
          '中午补给后秦岭短徒步。',
          '下午抓日落机位。',
          '严格安全装备，1核心点。'
        ]
      }
    }
  },

  travel: {
    locationId: 'travel',
    headline: '本地氛围先看再定路线',
    description: '先用一条轻量路线感受城市节奏，再决定后续深入玩法。',
    versions: {
      indoorRelaxed: {
        heading: '室内松弛线',
        summary: '以安静空间和高质量停留为主，适合先恢复状态。',
        highlights: ['安静坐坐', '避开人潮', '低体力消耗', '本地氛围'],
        strategies: [
          '上午先选一家当地老茶馆或咖啡馆坐下，坐40-60分钟确认今天节奏。',
          '午后安排一处文艺书店或小型展厅，轻逛1小时。',
          '晚餐选非热门但氛围好的本地小店，排队短。',
          '晚上留一段空白时间，避免行程过满。'
        ]
      },
      indoorCultural: {
        heading: '室内文化线',
        summary: '博物馆与本地表演结合，深度了解当地历史故事。',
        highlights: ['博物馆展陈', '本地表演', '历史叙事', '室内舒适'],
        strategies: [
          '上午去当地博物馆或历史展厅，花2小时深度参观。',
          '下午安排一场本地非遗表演或文化体验。',
          '傍晚室内古迹展厅慢逛。',
          '晚餐边吃边复盘当天所学。'
        ]
      },
      outdoorNormal: {
        heading: '户外街巷轻度线',
        summary: '公园与街区结合，烟火气与拍照友好。',
        highlights: ['街巷拍照', '轻徒步', '夜间氛围', '弹性调整'],
        strategies: [
          '下午光线好时进核心街区或公园，每段45分钟。',
          '中途补给点休息。',
          '晚上夜景短游，留跳过空间。',
          '全程步行或共享单车。'
        ]
      },
      outdoorAdventure: {
        heading: '户外自然冒险线',
        summary: '近郊山野徒步或轻露营，挑战自然与体能。',
        highlights: ['登山/徒步', '自然光线', '野外惊喜', '高强度'],
        strategies: [
          '清晨去近郊山或公园徒步核心段（3-5小时）。',
          '中午补给后加深度点位。',
          '下午抓黄金光线。',
          '每天只设1个核心冒险点，剩余时间休息。'
        ]
      }
    }
  }
};

function resolveTemplate(location: string): LocationGuideTemplate {
  return LOCATION_GUIDE_TEMPLATES[location] ?? LOCATION_GUIDE_TEMPLATES.travel;
}

export function buildLocationGuide(
  location: string,
  preference: PreferenceVariant
): LocationGuide {
  const template = resolveTemplate(location);
  const version = template.versions[preference];

  return {
    locationId: template.locationId,
    headline: template.headline,
    description: template.description,
    preference: preference as GuidePreference,
    preferenceLabel: guidePreferenceLabel(preference as GuidePreference),
    version,
  };
}

export function createLocationCardItem(
  sourceVideo: VideoItem,
  preference: PreferenceVariant
): VideoItem {
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
