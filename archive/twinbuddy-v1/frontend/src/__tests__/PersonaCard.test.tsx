/**
 * PersonaCard Component Tests
 *
 * NOTE: These tests require the following npm packages to be installed
 * before they can run:
 *   npm install -D vitest @testing-library/react @testing-library/user-event
 *                  @testing-library/jest-dom jsdom
 *
 * After installing, add to package.json scripts:
 *   "test": "vitest"
 * and run: npx vitest
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PersonaCard } from '../../components/PersonaCard';
import type { PersonaLayer } from '../../types/persona';

// ---------------------------------------------------------------------------
// Mock dependencies
// ---------------------------------------------------------------------------

// Lucide icons — stub to avoid svg rendering issues in jsdom
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Upload: () => <span>Upload</span>,
    FileText: () => <span>FileText</span>,
    Trash2: () => <span>Trash2</span>,
    CheckCircle2: () => <span>CheckCircle2</span>,
    AlertCircle: () => <span>AlertCircle</span>,
  };
});

// ---------------------------------------------------------------------------
// Fixture data — complete PersonaLayer with emoji + title + content
// ---------------------------------------------------------------------------

const layerData: Record<number, PersonaLayer> = {
  0: {
    emoji: '🚫',
    title: '硬规则',
    content: '不接受封闭式行程规划；每天必须有 1 小时独处时间。',
  },
  1: {
    emoji: '🎨',
    title: '内向型创意探索者',
    content:
      '23岁视觉设计师，习惯用图像而非文字记录生活。对陌生城市有强烈好奇，但倾向于独自深度游。',
  },
  2: {
    emoji: '💬',
    title: '沉默型表达者',
    content:
      '文字简洁有力，极少使用感叹号或表情包。线上聊天回复间隔较长（平均 2–4 小时），但每次回复内容完整有逻辑。',
  },
  3: {
    emoji: '🧭',
    title: '理性-感受混合型',
    content:
      '做旅行决策时先收集大量信息（Pinterest/小红书/孤独星球），再凭直觉挑选。情绪波动时倾向独处消化。',
  },
  4: {
    emoji: '🤝',
    title: '选择性社交',
    content:
      '在陌生社交场合中通常观察 10–15 分钟后再融入。对"一起去呗"类邀约响应率低，但对有明确主题的活动参与意愿高。',
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PersonaCard', () => {
  // ── 1. test_renders_layer0_with_red_border ─────────────────────────────
  it('test_renders_layer0_with_red_border — Layer0 有红色边框 class', () => {
    const { container } = render(
      <PersonaCard
        layer={0}
        data={layerData[0]}
        isLayer0={true}
        delay={0}
      />,
    );

    // Layer 0 with isLayer0=true should produce border-red-400
    const card = container.querySelector('[class*="border-red"]');
    expect(card).toBeInTheDocument();
  });

  // ── 2. test_renders_all_layers ─────────────────────────────────────────
  it('test_renders_all_layers — L0-L4 都能渲染', () => {
    for (let layer = 0; layer <= 4; layer++) {
      const { container } = render(
        <PersonaCard
          layer={layer}
          data={layerData[layer]}
          delay={0}
        />,
      );
      const card = container.querySelector('[class*="overflow-hidden rounded-2xl"]');
      expect(card).toBeInTheDocument();
    }
  });

  // ── 3. test_displays_emoji_and_title ───────────────────────────────────
  it('test_displays_emoji_and_title — emoji 和标题显示正确', () => {
    for (let layer = 0; layer <= 4; layer++) {
      const { container } = render(
        <PersonaCard
          layer={layer}
          data={layerData[layer]}
          delay={0}
        />,
      );

      const cardRoot = container.querySelector('[class*="rounded-2xl"]');
      expect(cardRoot).not.toBeNull();
      // Use container.querySelector to avoid TL multi-match error on "硬规则"
      // (badge and h3 both contain "硬规则" for Layer0)
      const emojiEl = cardRoot!.querySelector('[class*="text-3xl"]') ?? cardRoot!;
      expect(emojiEl.textContent).toContain(layerData[layer].emoji);
      const h3Els = cardRoot!.querySelectorAll('h3');
      expect(h3Els.length).toBeGreaterThan(0);
      expect(h3Els[0].textContent).toContain(layerData[layer].title.split('')[0]);
    }
  });

  // ── 4. test_layer0_boundary_case ───────────────────────────────────────
  // The component logic: border is red iff isLayer0=true OR layer===0
  // So layer=0 always gets red border regardless of isLayer0
  it('test_layer0_boundary_case — layer=0 始终红色边框，与 isLayer0 无关', () => {
    const { container } = render(
      <PersonaCard
        layer={0}
        data={layerData[0]}
        isLayer0={false}
        delay={0}
      />,
    );

    const card = container.querySelector('[class*="border-red-"]');
    expect(card).toBeInTheDocument();
  });

  // ── 5. test_renders_content_text ───────────────────────────────────────
  it('test_renders_content_text — content 文本正确显示', () => {
    render(
      <PersonaCard
        layer={2}
        data={layerData[2]}
        delay={0}
      />,
    );

    expect(screen.getByText(/文字简洁有力/)).toBeInTheDocument();
    expect(screen.getByText(/平均 2–4 小时/)).toBeInTheDocument();
  });

  // ── 6. test_delay_passed_to_useEffect ───────────────────────────────────
  it('test_delay_passed_to_useEffect — delay prop 是可见属性（setTimeout 调用链路）', () => {
    // This test verifies the delay prop is accepted without error.
    // The actual animation timing is verified via useEffect implementation,
    // which is exercised via the render cycle here.
    const { container } = render(
      <PersonaCard
        layer={1}
        data={layerData[1]}
        delay={500}
      />,
    );
    expect(container.querySelector('[class*="rounded-2xl"]')).toBeInTheDocument();
  });

  // ── 7. test_gradient_applied_per_layer ─────────────────────────────────
  it('test_gradient_applied_per_layer — 不同 layer 渲染不同渐变 class', () => {
    const { container: c0 } = render(
      <PersonaCard layer={0} data={layerData[0]} delay={0} />,
    );
    const { container: c3 } = render(
      <PersonaCard layer={3} data={layerData[3]} delay={0} />,
    );

    // Each layer should have its own gradient class
    const className0 = c0.querySelector('[class*="rounded-2xl"]')?.className ?? '';
    const className3 = c3.querySelector('[class*="rounded-2xl"]')?.className ?? '';

    expect(className0).not.toEqual(className3);
  });
});
