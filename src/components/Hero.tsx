"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { track } from "@/analytics";
import { EVENT, SPEAKERS } from "@/content";
import dynamic from "next/dynamic";
import Icon from "./Icon";
import NeuroCanvas from "./NeuroCanvas";

// тяжёлые WebGL-образы грузим только в браузере и только там, где они нужны
const NeuroFace = dynamic(() => import("./neuro/NeuroFace"), { ssr: false });
const NeuroDance = dynamic(() => import("./neuro/NeuroDance"), { ssr: false });
const NeuroDancer = dynamic(() => import("./neuro/NeuroDancer"), { ssr: false });
const NeuroSwarm = dynamic(() => import("./neuro/NeuroSwarm"), { ssr: false });

export type HeroVisual = "network" | "face" | "dance" | "dancer" | "swarm";

function useCountdown(target: string) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Hero({ visual = "network" }: { visual?: HeroVisual }) {
  const reduce = useReducedMotion();
  const t = useCountdown(EVENT.startsAt);
  const fade = (delay: number) =>
    reduce ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <section className={`hero${visual === "network" ? "" : " hero--deep"}`} id="top">
      {visual === "network" && (
        <>
          <div className="hero__aura" aria-hidden="true" />
          <NeuroCanvas className="hero__canvas" />
        </>
      )}
      {visual === "face" && <NeuroFace className="hero__canvas" />}
      {visual === "dance" && <NeuroDance className="hero__canvas" />}
      {visual === "dancer" && <NeuroDancer className="hero__canvas" />}
      {visual === "swarm" && <NeuroSwarm className="hero__canvas" />}
      {visual !== "network" && <div className="nh-vignette" aria-hidden="true" />}

      <div className="container hero__inner">
        <div className="hero__content">
          <motion.p className="chip" {...fade(0.05)}>
            <span className="chip__dot" /> Однодневный интенсив · офлайн
          </motion.p>

          <motion.h1 className="h1 hero__title" {...fade(0.12)}>
            <span className="hero__line">Интенсив практической</span>
            <span className="hero__line">
              работы с <span className="grad">психосоматикой</span>
            </span>
            <span className="hero__title-2">и&nbsp;внутренним состоянием</span>
          </motion.h1>

          <motion.p className="hero__lead" {...fade(0.2)}>
            Работа с телесными симптомами, тревогой, эмоциональным напряжением и психологическим компонентом заболеваний.
            <span className="hero__lead-2">
              Современные психологические и гипнотические методы терапии и саморегуляции.
            </span>
          </motion.p>

          <motion.ul className="hero__facts" {...fade(0.28)}>
            <li>
              <Icon name="calendar" />
              <span>
                <b>{EVENT.dateLabel}</b>
                {EVENT.weekday}
              </span>
            </li>
            <li>
              <Icon name="clock" />
              <span>
                <b>{EVENT.time}</b>{EVENT.duration}
              </span>
            </li>
            <li>
              <Icon name="pin" />
              <span>
                <b>{EVENT.city}</b>{EVENT.metro}
              </span>
            </li>
          </motion.ul>

          <motion.div className="hero__group" {...fade(0.32)}>
            <p className="hero__seats">
              <span className="hero__seats-dot" aria-hidden="true" />
              {EVENT.seats ? `Всего ${EVENT.seats} мест. ` : "Количество мест ограничено. "}
              Места бронируются заранее
            </p>
            <p className="hero__group-title">Небольшая группа — внимание каждому участнику</p>
          </motion.div>

          <motion.div className="hero__actions" {...fade(0.36)}>
            <a href="#signup" className="btn btn--primary" onClick={() => track("signup_click")}>
              Записаться <Icon name="arrow" size={18} />
            </a>
            <a href="#program" className="btn btn--outline-light">
              Программа
            </a>
          </motion.div>

          <motion.a href="#speakers" className="hero__speakers" {...fade(0.44)}>
            <span className="avatars">
              {SPEAKERS.map((s) => (
                <img key={s.id} src={`/speakers/${s.id}-avatar.webp`} alt="" width={48} height={48} />
              ))}
            </span>
            <span className="hero__speakers-text">
              <b>3 спикера</b>
              Алина Комиссарова, Александр Карачинцев, Марк Орлов
            </span>
          </motion.a>
        </div>

        <motion.div className="countdown" {...fade(0.5)} aria-label="До начала интенсива">
          <p className="countdown__label">До начала</p>
          <div className="countdown__row">
            {[
              [t?.d, "дней"],
              [t?.h, "часов"],
              [t?.m, "минут"],
              [t?.s, "секунд"],
            ].map(([v, l]) => (
              <div className="countdown__cell" key={l as string}>
                <span className="countdown__num">{v === undefined ? "--" : pad(v as number)}</span>
                <span className="countdown__unit">{l}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
