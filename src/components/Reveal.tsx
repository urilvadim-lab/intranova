"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Лёгкое появление блока при прокрутке. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  );
}

/** Единый заголовок секции: метка, заголовок, подзаголовок. */
export function SectionHead({ label, title, lead, light }: { label: string; title: ReactNode; lead?: ReactNode; light?: boolean }) {
  return (
    <Reveal className={`shead${light ? " shead--light" : ""}`}>
      <p className="label">{label}</p>
      <h2 className="h2">{title}</h2>
      {lead && <p className="shead__lead">{lead}</p>}
    </Reveal>
  );
}
