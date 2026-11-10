"use client";

import type { AnchorHTMLAttributes } from "react";
import { track, type Goal } from "@/analytics";

/** Обычная ссылка, которая при нажатии отправляет цель в Яндекс.Метрику. */
export default function TrackedLink({
  goal,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { goal: Goal }) {
  return (
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    <a
      {...props}
      onClick={(e) => {
        track(goal);
        onClick?.(e);
      }}
    />
  );
}
