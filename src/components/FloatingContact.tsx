"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { CONTACTS } from "@/content";
import Icon from "./Icon";
import TrackedLink from "./TrackedLink";

/** Плавающая кнопка связи: Telegram / MAX / звонок. Появляется после прокрутки первого экрана. */
export default function FloatingContact() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!visible && !open) return null;

  return (
    <div className="fab">
      <AnimatePresence>
        {open && (
          <motion.div
            id="fab-menu"
            className="fab__menu"
            role="menu"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.96 }}
            transition={{ duration: 0.2 }}
          >
            <TrackedLink goal="telegram_click" role="menuitem" href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <Icon name="tg" size={20} /> Написать в Telegram
            </TrackedLink>
            <TrackedLink goal="max_click" role="menuitem" href={CONTACTS.max} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <Icon name="max" size={20} /> Написать в MAX
            </TrackedLink>
            <TrackedLink goal="phone_click" role="menuitem" href={`tel:${CONTACTS.phoneTel}`} onClick={() => setOpen(false)}>
              <Icon name="phone" size={20} /> Позвонить
            </TrackedLink>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        className="fab__btn"
        aria-label={open ? "Закрыть меню связи" : "Связаться с нами"}
        aria-expanded={open}
        aria-controls="fab-menu"
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name={open ? "close" : "chat"} size={26} />
      </button>
    </div>
  );
}
