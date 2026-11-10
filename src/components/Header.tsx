"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { track } from "@/analytics";
import { EVENT, HEADER_NAV, NAV } from "@/content";
import Logo from "./Logo";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={`header${scrolled ? " header--solid" : ""}`}>
      <div className="container header__bar">
        <a href="#top" className="header__logo" aria-label="INTRANOVA — наверх" onClick={() => setOpen(false)}>
          <Logo />
        </a>
        <nav className="header__nav" aria-label="Основная навигация">
          {HEADER_NAV.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <span className="header__date">
          {EVENT.dateLabel} · {EVENT.city}
        </span>
        <a href="#signup" className="btn btn--primary btn--sm header__cta" onClick={() => track("signup_click")}>
          Записаться
        </a>
        <button
          className={`burger${open ? " burger--open" : ""}`}
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            className="mobile-menu"
            aria-label="Мобильная навигация"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="container mobile-menu__inner">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                  {item.label}
                </a>
              ))}
              <a
                href="#signup"
                className="btn btn--primary"
                onClick={() => {
                  track("signup_click");
                  setOpen(false);
                }}
              >
                Записаться · {EVENT.dateLabel}
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
