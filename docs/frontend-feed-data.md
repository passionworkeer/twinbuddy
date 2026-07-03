# Frontend feed 视频数据来源说明

> 写于 2026-07-03,基于 `codex/project-structure-cleanup` 分支当时的代码。

## 数量

feed 推荐视频的 mock 数据是**两段拼接**的,数量由数据文件本身决定,不是写死常量:

| 数据文件 | 条数 | 何时装载 | 备注 |
| --- | --- | --- | --- |
| `twinbuddy/frontend/src/assets/data/posts6.json` | **6** | 启动时立即导入 | 这 6 条内嵌了 `author` 字段,首屏可见 |
| `twinbuddy/frontend/public/data/videos.md` | **832**(7z 压缩,解压后) | mock 启动 ~1s 后异步 fetch | 通过 `r.json()` 解析后 concat 到列表末尾 |

拼接顺序见 `src/mock/index.ts:19-22` 与 `:114-132`:

```ts
let allRecommendVideos = posts6.map(...)           // 6 条
// ... 1s 后:
_fetch(BASE_URL + '/data/videos.md').then(r => r.json().then(v => {
  allRecommendVideos = allRecommendVideos.concat(v)  // +832 → 838 条
}))
```

mock 在 `/video/recommended` 端点里写死返回 `total: 844`,这个值与实际拼接条数不一致(代码里有一段历史注释也提到过),只是给前端分页用的"伪总量",**不会影响实际可刷到的数据**,只是 `loadMore` 提前结束判断的阈值。

## 是否固定

**数据本身固定**,但用户可见的"前几屏"内容会随 mock 启动时序变化:

- mock 启动瞬间(0~1s 内)请求 `/video/recommended` → 只返回 6 条
- 1s 后再请求 → 返回 838 条(前 6 条还是 posts6,后面是 videos.md 里的)

## 请求分页

`src/pages/home/slide/SlideList.vue:60-99`:

```ts
state.pageSize = 10
let res = await props.api({
  start: refresh ? 0 : state.list.length,
  pageSize: state.pageSize
})
```

每次上拉加载 10 条,直到 `state.totalSize === state.list.length` 停止。

`recommendedVideo` 这个 API 被 home 下 4 个 tab 共用:

- `Slide0.vue`(首页-附近/同城,uniqueId=`hot`)
- `Slide2.vue`(首页-关注)
- `Slide4.vue`(首页-推荐,uniqueId=`home`)
- `LongVideo.vue` 用 `recommendedLongVideo`(`/video/long/recommended/`),对同一份数据做 `slice(start, start+pageSize)`

## 内容主题

`videos.json` 832 条的画像(发布者/hashtag 都是抖音真实公开数据,被批量抓取下来的):

- **发布者**:分散在 ~30 个账号,Top3 账号(68310389333 / 2739632844317827 / 62790495105)合计 237 条,占 28%
- **时长**:中位数 12.6s,最短 4.1s,最长 844.8s;`long_video=true` 标记 0 条(实际超过 1 分钟的视频仍然存在,但字段没标)
- **主要 hashtag / 内容类型**:
  - 美食:`#抖音美食创作人`(53)、`#美食趣胃计划`(22)、`#在家做个拿手菜`(7)、`#跟我学做菜`(4)、`#抖音美食国潮味儿`(4)
  - 时尚 / 颜值:`#模特`(24)、`#小蛮腰马甲线`(17)、`#御姐`(7)、`#氛围感`(5)、`#美丽坏女人`(4)、`#高级感穿搭`(4)、`#法式浪漫`(4)、`#马面裙`(3)
  - 国风 / 节气:`#李子柒添福添年味`(10)、`#芒种`、`#原创国风计划`
  - 生活方式:`#夏天该有的样子`、`#泳池`、`#背影杀`、`#原地猫步`
- **desc 为空**:14 条(纯图集/背景视频,无文字描述)

## 没有讲述(文案/旁白)字段

视频条目的文本字段只有 `desc`(用户自己写的简介/标题),**没有独立的"讲述""旁白""脚本"字段**。`text_extra` 字段在结构上存在,但实测里只用来挂 hashtag 标签,没有大段叙述内容。`share_info` / `suggest_words` 是分享文案建议,不是内容讲述。

## 同目录其他数据

`public/data/` 下还有几份周边数据,跟主 feed 走的是不同端点:

- `videos-old.json`(4.9MB) / `posts6-old.json`(66KB):旧版本备份,没被任何 mock 引用,可清理
- `posts.json`(62 条)/ `posts.md`:图文动态,被 `/post/recommended` 用
- `goods.json` / `goods.md`:商品,被 `/shop/recommended` 用
- `users.json` / `users.md`:用户档案,被 `user/panel`、`user/friends` 用
- `comments/<video_id>.md`:每个视频的评论,被 `/video/comments` 用
- `user_video_list/user-<id>.md`:指定用户的作品列表,被 `/user/video_list` 和 `/video/my` 用
