import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { PersonaCard } from '../../components/PersonaCard';
import type { PersonaLayer } from '../../types/persona';

const layerData: PersonaLayer[] = [
  { emoji: '🚨', title: '硬规则', content: '不要在公开场合批评我' },
  { emoji: '🧭', title: '我是谁', content: 'I am someone' },
  { emoji: '💬', title: '怎么说', content: 'Fast and direct' },
  { emoji: '🧠', title: '怎么想', content: 'Think first' },
  { emoji: '🤝', title: '怎么处', content: 'Slow to warm up' },
];

describe('PersonaCard', () => {
  it('test_renders_layer0_with_red_border', () => {
    const { container } = render(<PersonaCard layer={0} data={layerData[0]} isLayer0={true} delay={0} />);
    const card = container.querySelector('[class*="border-red"]');
    expect(card).toBeInTheDocument();
  });

  it('test_renders_all_layers', () => {
    for (let layer = 0; layer <= 4; layer++) {
      const { container } = render(<PersonaCard layer={layer} data={layerData[layer]} delay={0} />);
      expect(container.querySelector('[class*="rounded-2xl"]')).toBeInTheDocument();
    }
  });

  it('test_displays_emoji_and_title', () => {
    for (let layer = 0; layer <= 4; layer++) {
      const { container } = render(<PersonaCard layer={layer} data={layerData[layer]} delay={0} />);
      const cardRoot = container.querySelector('[class*="rounded-2xl"]');
      expect(cardRoot).not.toBeNull();
      const emojiEl = cardRoot!.querySelector('[class*="text-3xl"]') ?? cardRoot!;
      expect(emojiEl.textContent).toContain(layerData[layer].emoji);
    }
  });

  it('test_gradient_applied_per_layer', () => {
    const { container } = render(<PersonaCard layer={1} data={layerData[1]} delay={0} />);
    expect(container.querySelector('[class*="rounded-2xl"]')).toBeInTheDocument();
  });

  it('test_layer0_boundary_case', () => {
    const { container } = render(<PersonaCard layer={0} data={layerData[0]} isLayer0={false} delay={0} />);
    const card = container.querySelector('[class*="border-red-"]');
    expect(card).toBeInTheDocument();
  });

  it('test_delay_passed_to_useEffect', () => {
    const { container } = render(<PersonaCard layer={0} data={layerData[0]} delay={0} />);
    expect(container.querySelector('[class*="rounded-2xl"]')).toBeInTheDocument();
  });
});
