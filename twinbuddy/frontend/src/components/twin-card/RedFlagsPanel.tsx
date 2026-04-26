interface Props {
  items: string[];
}

export default function RedFlagsPanel({ items }: Props) {
  return (
    <section className="rounded-3xl border border-[rgba(251,191,36,0.15)] bg-[rgba(30,25,5,0.35)] p-4">
      <div className="flex items-center gap-2">
        <span className="red-flag-badge">需要留意</span>
        <p className="text-sm text-[var(--color-text-secondary)]">这些不是一票否决，但建议在见面前说清楚。</p>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-white">
        {items.map((item) => (
          <li key={item} className="rounded-2xl border border-white/8 bg-black/10 px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
