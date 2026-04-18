# mod 目录视频资源说明

> 更新日期：2026-04-18
> 适用：TwinBuddy 前端 — 懂你卡片弹窗

---

## WebM 动画资源

| 文件名 | 分辨率 | 时长 | 大小 | 内容 |
|--------|--------|------|------|------|
| `greeting.webm` | 2160×2160 | 4.4s | 1.7 MB | 两个人物同框挥手打招呼 |
| `highfive.webm` | 3840×2160 | 3.4s | 1.8 MB | 两个人物同框举手击掌 |
| `happy.webm` | 2160×2160 | 10s | 4.7 MB | 单人双手举起开心庆祝 |

### 技术规格（统一）

| 属性 | 值 |
|------|-----|
| 编码格式 | VP8 |
| 帧率 | 30 fps |
| Alpha 通道 | 支持（透明背景） |
| 音频 | 无 |
| 循环播放 | 支持 |

### 画面特征

- **人物 A**：蓝青色服装，圆脸，大眼睛，卡通风格
- **人物 B**：粉橙色服装，圆脸，大眼睛，卡通风格
- **背景**：深蓝紫色（greeting/highfive）、黄橙渐变（happy）
- **greeting/highfive**：两个人物各自在**圆形毛玻璃框**内，周围为 alpha 透明

---

## 渲染方案建议

### 1. greeting.webm — TwinMatchModal 顶部 Banner

**位置**：`step='match'` 雷达图上方，全宽展示

```tsx
<video
  src="/mod/greeting.webm"
  autoPlay
  muted
  loop
  playsInline
  className="w-full h-[100px] object-contain pointer-events-none"
/>
```

**效果**：两个人物同时挥手打招呼，圆形玻璃框与 TwinBuddy 玻璃态 UI 融合

---

### 2. highfive.webm — 点击「加他好友」后播放

**位置**：TwinMatchModal 底部按钮区，点击时弹出遮罩播放

```tsx
const handleAddFriend = () => {
  setShowHighfive(true);
  highfiveRef.current?.play();
};

<video
  ref={highfiveRef}
  src="/mod/highfive.webm"
  className="hidden"
  onEnded={() => {
    setShowHighfive(false);
    window.open(randomLink, '_blank');
  }}
/>
```

**效果**：用户点击后全屏遮罩播放两人击掌动画，增强仪式感

---

### 3. happy.webm — TwinCard Layer 3 成功层背景

**位置**：`Layer3Success` 组件内，作为背景叠加

```tsx
<div className="absolute inset-0 rounded-[1.5rem] overflow-hidden">
  <video
    src="/mod/happy.webm"
    autoPlay
    muted
    playsInline
    className="w-full h-full object-cover opacity-40 pointer-events-none"
  />
</div>
```

**效果**：单人开心庆祝动画叠加在玻璃态卡片背景，原有 CSS Sparkles 保留作为 fallback

---

## 技术注意事项

1. **必须 `muted`** — 浏览器自动播放策略要求，否则被阻止
2. **必须 `playsInline`** — iOS Safari 兼容
3. **Alpha 通道** — webm 自带透明，可直接叠加在任何背景上
4. **循环 vs 单次** — greeting 建议 loop，highfive/happy 建议单次（`onEnded` 回调）
5. **降级方案** — 视频加载失败时用 CSS Sparkles 兜底

## 文件路径

资产需迁移到 `public/mod/` 才能通过 Vite 访问：

```bash
mkdir -p public/mod
cp mod/*.webm public/mod/
```
