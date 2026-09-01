"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export type TabItem = { id: string; label: string; content: ReactNode };

export function Tabs({ items, label }: { items: TabItem[]; label: string }) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    const direction = document.documentElement.dir === "rtl" ? -1 : 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
    if (event.key === "ArrowRight") nextIndex = (index + direction + items.length) % items.length;
    if (event.key === "ArrowLeft") nextIndex = (index - direction + items.length) % items.length;
    if (nextIndex === null) return;
    event.preventDefault();
    const item = items[nextIndex];
    if (!item) return;
    setActiveId(item.id);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="ui-tabs">
      <div className="ui-tabs__list" role="tablist" aria-label={label}>
        {items.map((item, index) => {
          const selected = item.id === activeId;
          return (
            <button
              ref={(node) => {
                buttonRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-controls={`${baseId}-panel-${item.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              key={item.id}
              onClick={() => setActiveId(item.id)}
              onKeyDown={(event) => moveFocus(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          className="ui-tabs__panel"
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== activeId}
          tabIndex={0}
          key={item.id}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
