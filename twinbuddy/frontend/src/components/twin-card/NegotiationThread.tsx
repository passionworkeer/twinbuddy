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
      content: `我先替你问过了，对方对"${topConsensus}"的接受度很高。`,
    },
    {
      id: 'neg-2',
      role: 'user' as const,
      content: `那就继续往下聊，把"${secondConsensus}"也先对齐。`,
    },
    {
      id: 'neg-3',
      role: 'buddy' as const,
      content: `目前唯一需要留意的是"${topConflict}"，适合进入盲选再确认底层偏好。`,
    },
  ];
}

export default function NegotiationThread({ consensus, conflicts }: Props) {
  const messages = buildMessages(consensus, conflicts);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface">chat_bubble</span>
          <p className="font-h2 text-on-surface text-sm font-semibold">数字分身协商记录</p>
        </div>
        <span className="rounded-full border-2 border-secondary bg-secondary-container px-3 py-1 font-label-caps text-label-caps text-on-secondary-container text-[11px]">
          已完成预协商
        </span>
      </div>

      {/* Chat bubbles */}
      <div className="flex flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === 'user'
                ? 'self-end rounded-tl-sm rounded-tr-DEFAULT rounded-b-DEFAULT border-2 border-primary bg-primary px-4 py-3 shadow-[0_4px_0_0_rgba(0,0,0,0.15)]'
                : 'self-start rounded-tl-DEFAULT rounded-tr-sm rounded-b-DEFAULT border-2 border-outline bg-surface-container px-4 py-3 shadow-[0_4px_0_0_rgba(0,0,0,0.06)]'
            }
          >
            <p className="font-label-caps text-label-caps text-[10px] opacity-60">
              {message.role === 'buddy' ? '数字分身' : '你'}
            </p>
            <p
              className={
                message.role === 'user'
                  ? 'mt-1 font-body-md text-on-primary text-sm'
                  : 'mt-1 font-body-md text-on-surface text-sm'
              }
            >
              {message.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
