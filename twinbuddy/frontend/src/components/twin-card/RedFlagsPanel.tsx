interface Props {
  items: string[];
}

export default function RedFlagsPanel({ items }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-on-surface">warning</span>
        <p className="font-h2 text-on-surface text-sm font-semibold">仍需留意</p>
      </div>
      <p className="font-label-caps text-label-caps text-[10px] text-on-surface-variant">
        这些不是一票否决，但建议在见面前说清楚。
      </p>

      {/* Conflict items */}
      {items.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-DEFAULT border-l-4 border-tertiary-fixed border-2 border-outline bg-surface-container px-4 py-3"
            >
              <span className="font-body-md text-on-surface text-sm leading-6">{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        /* Success state */
        <div className="rounded-DEFAULT border-2 border-secondary bg-secondary-container px-4 py-3">
          <span className="font-body-md text-on-secondary-container text-sm">
            暂无重大冲突，协商结果良好
          </span>
        </div>
      )}
    </div>
  );
}
