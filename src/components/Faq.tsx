"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { CONTACTS, FAQ } from "@/content";
import { SectionHead } from "./Reveal";

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="section" id="faq">
      <div className="container faq">
        <div className="faq__aside">
          <SectionHead label="Вопросы" title="Частые вопросы" />
          <div className="faq__help">
            <p className="h3">Не нашли ответ?</p>
            <p className="muted">Напишите нам — ответим лично и поможем решить, подходит ли вам интенсив.</p>
            <a href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer" className="btn btn--outline">
              Написать в Telegram
            </a>
          </div>
        </div>
        <div className="faq__list">
          {FAQ.map((item, i) => {
            const isOpen = open === i;
            return (
              <div className={`card faq__item${isOpen ? " faq__item--open" : ""}`} key={item.q}>
                <h3>
                  <button
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    {item.q}
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                      className="faq__a"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
