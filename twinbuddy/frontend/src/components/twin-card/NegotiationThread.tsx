interface Props {
  consensus: string[];
  conflicts: string[];
}

function buildMessages(consensus: string[], conflicts: string[]) {
  const [topConsensus = '节奏更接近'] = consensus;
  const [secondConsensus = '预算和出发方式可继续细化'] = consensus.slice(1);
  const [topConflict = '仍有一个需要明确的小分歧'] = conflicts;

  return [
    {
      id: 'neg-1',
      role: 'buddy' as const,
      content: `我先替你问过了，对方对“${topConsensus}”的接受度很高。`,
    },
    {
      id: 'neg-2',
      role: 'user' as const,
      content: `那就继续往下聊，把“${secondConsensus}”也先对齐。`,
    },
    {
      id: 'neg-3',
      role: 'buddy' as const,
      content: `目前唯一需要留意的是“${topConflict}”，适合进入盲选再确认底层偏好。`,
    },
  ];
}

export default function NegotiationThread({ consensus, conflicts }: Props) {
  const messages = buildMessages(consensus, conflicts);

  return (
    <section className="rounded-3xl border border-white/8 bg-black/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">数字分身协商记录</p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">把高概率踩雷点先聊掉，再决定要不要正式认识。</p>
        </div>
        <span className="rounded-full border border-[rgba(175,255,251,0.2)] bg-[rgba(175,255,251,0.08)] px-3 py-1 text-[11px] text-[var(--color-secondary)]">
          已完成预协商
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {messages.map((message) => (
          <div key={message.id} className={message.role === 'user' ? 'bubble-user' : 'bubble-buddy'}>
            {message.content}
          </div>
        ))}
      </div>
    </section>
  );
}
