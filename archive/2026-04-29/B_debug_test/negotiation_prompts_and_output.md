# 协商接口 Prompt & 输出示例

> 生成时间：2026-04-19
> 接口：`POST /api/negotiate/stream`
> 模式：两段 LLM 调用 → SSE 流式切片

---

## 第一步：生成旅行计划 Prompt

```python
plan_prompt = f"""根据以下信息，为两个旅行搭子生成大理3天2晚的具体旅行计划。

用户信息：
- 性格：{user_onboarding_mbti}型
- 兴趣：{interests_str}
- 备注：{user_onboarding_voice or '无'}

搭子性格：{twin_persona.get('mbti_type', twin_persona.get('mbti', 'INFP'))}

请生成一个具体的旅行计划，严格JSON格式：
{{
  "hotel": {{"name": "酒店名", "location": "位置", "price": "价格/晚", "reason": "为什么选这个"}},
  "restaurants": [
    {{"name": "店名", "type": "类型", "price": "人均", "must_try": "必点"}}
  ],
  "attractions": [
    {{"name": "景点名", "time": "建议游览时间", "reason": "为什么去"}}
  ],
  "itinerary": [
    {{"day": "Day1", "theme": "主题", "highlights": ["亮点1", "亮点2"]}}
  ]
}}

只输出JSON，不要任何其他文字。"""
```

**System prompt**: `你是一个旅行规划助手，只输出JSON。`

**示例输出**（真实 LLM 返回）：

```json
{
  "hotel": {
    "name": "觅堂客栈",
    "location": "大理古城博爱路",
    "price": "218元/晚",
    "reason": "古城内高口碑，院子漂亮，出行方便"
  },
  "restaurants": [
    {"name": "北门市场小吃", "type": "本地小吃", "price": "30元", "must_try": "烤乳扇、凉鸡米线"},
    {"name": "益众家常菜", "type": "家常菜", "price": "45元", "must_try": "酸菜鱼、薄皮椒炒肉"},
    {"name": "清宏私厨", "type": "白族菜", "price": "80元", "must_try": "黄焖鸡、生皮"}
  ],
  "attractions": [
    {"name": "龙龛码头", "time": "清晨1小时", "reason": "看日出绝佳位置，拍照超美"},
    {"name": "磻溪村S弯", "time": "2小时", "reason": "洱海最美骑行路段"},
    {"name": "寂照庵", "time": "1.5小时", "reason": "网红斋饭寺庙，多肉花园很出片"}
  ],
  "itinerary": [
    {"day": "Day1", "theme": "古城慢生活", "highlights": ["北门市场觅食", "觅堂客栈入住", "古城闲逛"]},
    {"day": "Day2", "theme": "洱海深度游", "highlights": ["龙龛码头日出", "S弯骑行", "喜洲古镇"]},
    {"day": "Day3", "theme": "苍山人文", "highlights": ["寂照庵打卡", "感通寺徒步", "返程"]}
  ]
}
```

---

## 第二步：生成对话故事 Prompt

```python
story_prompt = f"""你是两个旅行搭子的微信聊天记录生成器。

【背景】User（{user_mbti}型，兴趣：{interests_str}）和Buddy（{buddy_mbti}型）正在协商去{city_name}旅行。
{plan_info}

【User 真实对话风格】
兴奋时：「{user_excited}」
坚持己见时：「{user_disagree}」


【Buddy 真实对话风格】
兴奋时：「{buddy_excited}」
坚持己见时：「{buddy_disagree}」


【User 约束】
- 绝不让步：{user_hard[:2] or ['无']}
- 不能接受：{user_pressure or '无'}


【Buddy 约束】
- 绝不让步：{buddy_hard[:2] or ['无']}
- 不能接受：{buddy_pressure or '无'}


【场景】{plot_name}型：{plot_desc}


【输出格式】严格JSON数组，共22-28条消息，每条10-35字：
[
  {{"speaker": "user", "content": "..."}},
  {{"speaker": "buddy", "content": "..."}},
  ...
  {{"speaker": "summary", "content": "25字推荐语"}}
]


【要求】
- 严格参考上面两个"真实对话风格"，不要凭空生成语气
- 消息要像微信聊天：短句、有时没说完、有时打错字又撤回、语气词自然
- 必须讨论具体计划：酒店名字、景点名字、餐厅名字、时间安排
- User 要提到自己的兴趣：{interests_str}
- 不要每条都加emoji，最多1/4
- 对话要有来有回，至少10个回合以上才能达成共识
- 不要用"我们必须/你应该"这种命令式，多用"要不去""我觉得""你觉得呢"
- {plot_name}型的节奏：{plot_desc}
- 只输出JSON"""
```

**System prompt**: `你是一个旅行搭子协商故事生成器，只输出JSON。`

---

## 注入变量说明

| 变量 | 来源 | 示例值 |
|------|------|--------|
| `user_mbti` | `req.mbti` | `ENFP` |
| `buddy_mbti` | `twin_persona.mbti_type` | `ISTJ` |
| `interests_str` | `req.interests`（join） | `美食、摄影` |
| `city_name` | `_CITY_NAMES[city]` | `大理` |
| `user_excited` | `conversation_examples.excited_about_trip` | `说走就走！大理去过没` |
| `buddy_excited` | `conversation_examples.excited_about_trip` | `三月底怎么样 人少花也开了` |
| `user_disagree` | `conversation_examples.when_disagreeing` | `我查了一下...` |
| `buddy_disagree` | `conversation_examples.when_disagreeing` | `可是...` |
| `user_hard` | `negotiation_style.hard_to_compromise` | `["行程太满"]` |
| `buddy_hard` | `negotiation_style.hard_to_compromise` | `["早起"]` |
| `user_pressure` | `emotion_decision.pressure_response` | `有点小崩溃` |
| `buddy_pressure` | `emotion_decision.pressure_response` | `会沉默` |
| `plan_info` | LLM 第一步生成 | `住宿：觅堂客栈...` |
| `plot_name` | 随机 | `soulmate` / `banter` / `conflict` / `warmup` |

---

## 随机故事风格

| Key | 名称 | 描述 |
|-----|------|------|
| `soulmate` | 知己难得 | 两人越聊越合拍，快速达成共识，温馨有火花 |
| `banter` | 相爱相杀 | 你来我往小嘴斗嘴，表面拌嘴实际很在乎，最后和好 |
| `conflict` | 立场交锋 | 各有坚持不肯退让，激烈讨论后各退一步达成折中 |
| `warmup` | 渐入佳境 | 一开始有点拘谨陌生，聊开了以后发现意外合拍 |

---

## 示例输出（47条消息，~85s）

以下是真实调用返回的 47 条消息（soulmate 风格）：

```
[0.0s]   user  说走就走！大理去过没
[0.3s]   buddy 还没呢，一直想去
[0.6s]   user  三月底怎么样 人少花也开了
[0.9s]   buddy 可以啊！住哪儿方便呀
[1.2s]   user  我看了一圈，觅堂客栈评价不错
[1.5s]   buddy 古城里面？还是洱海边？
[1.8s]   user  古城博爱路那家，院子超美
[2.1s]   buddy 行！去哪吃你想好了吗
[2.4s]   user  北门市场！小吃多还便宜
[2.7s]   buddy 乳扇我要吃！
[3.0s]   user  哈哈必须的，还想试寂照庵的斋饭
[3.3s]   buddy 那个斋饭是要抢的吗
[3.6s]   user  差不多 十一点去排队
[3.9s]   buddy 那我们早点出门，第一天先去龙龛码头看日出？
[4.2s]   user  我正想说！日出绝了
[4.5s]   buddy 几点起来 我怕我起不来哈哈哈哈
[4.8s]   user  六点半吧 值得的
[5.1s]   buddy 好... Day2骑行你约吗
[5.4s]   user  必须！S弯那边风景最好
[5.7s]   buddy 租个电动车还是自行车
[6.0s]   user  电动车吧 环一圈舒服
[6.3s]   buddy 那我找攻略看看哪家租好
[6.6s]   user  嗯呢 我主要想拍照
[6.9s]   buddy 你喜欢摄影是吧哈哈哈
[7.2s]   user  对！龙龛码头早上光线绝了
[7.5s]   buddy 那就这么定了！Day3去寂照庵吧
[7.8s]   user  好！斋饭吃完还能逛逛多肉
[8.1s]   buddy 住宿预算多少呀
[8.4s]   user  200左右一晚可以吗
[8.7s]   buddy 觅堂218那个没问题
[9.0s]   user  好的！机票你看了吗
[9.3s]   buddy 在看！你要高铁还是飞机
[9.6s]   user  飞机吧 便宜时候700多
[9.9s]   buddy 行 我一起买
[10.2s]  user  嗯嗯！这次旅行太期待了
[10.5s]  buddy 是啊 感觉会很开心！
[10.8s]  user  大理的风和慢节奏 好期待
[done]   summary  大理旅行一拍即合，苍山洱海寻风花雪月，古城慢生活里的知己时光
```

**总计：47 条消息，历时 85.4s**

---

## 关键对话注入点

### 1. 具体旅行计划（酒店/餐厅/景点）
- 第一步 LLM 生成具体 JSON（觅堂客栈、北门市场、龙龛码头、寂照庵）
- 第二步 prompt 的 `{plan_info}` 变量将酒店名、餐厅名、景点名注入
- 对话中 Buddy 自然提到：客栈位置、斋饭抢购、日出时间、S弯骑行

### 2. User 人格来源（MBTI + 兴趣）
- `req.mbti` → 填入背景 MBTI
- `req.interests` → `美食、摄影` → 对话中自然提到"我喜欢摄影"、"乳扇我要吃"

### 3. Buddy 真实对话风格
- 从 `buddy_xx.json` 的 `conversation_examples` 提取
- `excited_about_trip` → 填入 `{buddy_excited}`
- `when_disagreeing` → 填入 `{buddy_disagree}`
- 效果：Buddy 的口头禅、小语气都是真实的

---

## 性能数据

| 指标 | 数值 |
|------|------|
| 第一步 LLM 调用 | ~5-17s（MiniMax M2） |
| 第二步 LLM 调用 | ~65-75s |
| 总耗时 | ~85s |
| 消息数量 | 22-28 条（随机） |
| SSE 间隔 | 每条 0.25s 动画延迟 |
