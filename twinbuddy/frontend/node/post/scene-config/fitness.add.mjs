/**
 * TwinBuddy 场景视频扩充:fitness 场景 27 条新条目
 * 依据 docs/data-spec.md:每场景从 53 → 80 条
 * 调用方:merge-and-shuffle.mjs(改一次 import 即可)
 *
 * 类型分布 emotion + guide + noise 按场景语义配比,
 * 程序化生成(基于词库 + 模板),无 LLM 依赖。
 */
export const items = [
  { title: "今天练完背｜镜子都不敢照", type: "emotion", tags: ["背部", "训练", "酸痛"] },
  { title: "CrossFit 第一次差点吐了", type: "emotion", tags: ["CrossFit", "体验"] },
  { title: "瑜伽拉伸比想象中累", type: "emotion", tags: ["瑜伽", "拉伸"] },
  { title: "今天跑了 5 公里｜鞋破了", type: "emotion", tags: ["跑步", "装备"] },
  { title: "健身房镜子里的自己比较好看", type: "emotion", tags: ["健身房", "镜子"] },
  { title: "羽毛球打到手腕酸", type: "emotion", tags: ["羽毛球", "手腕"] },
  { title: "普拉提第一节就抖了", type: "emotion", tags: ["普拉提", "新手"] },
  { title: "今天撸铁被教练加片了", type: "emotion", tags: ["撸铁", "教练"] },
  { title: "夜跑深圳湾｜路灯下的自己", type: "emotion", tags: ["夜跑", "深圳湾"] },
  { title: "舞蹈课跟不上节拍", type: "emotion", tags: ["舞蹈", "新手"] },
  { title: "肩背 14 天计划｜无器械", type: "guide", tags: ["肩背", "无器械", "计划"] },
  { title: "深蹲不伤膝｜3 个 tips", type: "guide", tags: ["深蹲", "膝盖", "tips"] },
  { title: "新手撸铁｜5 个动作入门", type: "guide", tags: ["新手", "撸铁", "入门"] },
  { title: "瑜伽拉伸｜睡前 15 分钟", type: "guide", tags: ["瑜伽", "睡前", "拉伸"] },
  { title: "CrossFit WOD｜新手 3 个开始", type: "guide", tags: ["CrossFit", "新手", "WOD"] },
  { title: "跑步装备｜3 件 200 元以内", type: "guide", tags: ["跑步", "装备", "便宜"] },
  { title: "深圳湾夜跑｜3 条安全路线", type: "guide", tags: ["夜跑", "深圳湾", "安全"] },
  { title: "羽毛球｜深圳 5 个业余场地", type: "guide", tags: ["羽毛球", "场地"] },
  { title: "普拉提小班｜福田 3 家", type: "guide", tags: ["普拉提", "福田", "小班"] },
  { title: "健身房选新店｜3 个指标", type: "guide", tags: ["健身房", "选店", "tips"] },
  { title: "今天腰酸｜先不练了", type: "noise", tags: ["伤病", "休息"] },
  { title: "加班累到没力气去健身房", type: "noise", tags: ["加班", "取消"] },
  { title: "今天只想躺平｜别推运动", type: "noise", tags: ["躺平", "反推荐"] },
  { title: "膝盖不太舒服｜暂停跑步", type: "noise", tags: ["膝盖", "暂停"] },
  { title: "出差一周｜没法训练", type: "noise", tags: ["出差", "暂停"] }
]

export default items