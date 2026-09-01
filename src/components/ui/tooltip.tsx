"use client";

import { Children, cloneElement, useId } from "react";
import type { ReactElement } from "react";

type TooltipTrigger = ReactElement<{ "aria-describedby"?: string }>;

export function Tooltip({ content, children }: { content: string; children: TooltipTrigger }) {
  const id = useId();
  const trigger = Children.only(children);
  return (
    <span className="ui-tooltip">
      {cloneElement(trigger, { "aria-describedby": id })}
      <span id={id} className="ui-tooltip__bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}
