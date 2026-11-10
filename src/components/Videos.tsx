"use client";

import { useRef, useState } from "react";
import { GROUP_VIDEOS, VIDEOS } from "@/content";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";

type VideoItem = (typeof VIDEOS)[number] & { vertical?: boolean; place?: string };

/** Свой ролик: до клика только лёгкая обложка, видео начинает грузиться после нажатия. */
function Video({ id, title, text, duration, vertical, place, index }: VideoItem & { index: number }) {
  const [play, setPlay] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);
  const start = () => {
    setPlay(true);
    requestAnimationFrame(() => ref.current?.play());
  };
  return (
    <Reveal as="article" className={`video${vertical ? " video--vertical" : ""}`} delay={index * 0.08}>
      <div className="video__frame">
        <video
          ref={ref}
          src={`/video/${id}.mp4`}
          poster={`/video/${id}.webp`}
          preload="none"
          playsInline
          controls={play}
        />
        {!play && (
          <button className="video__cover" onClick={start} aria-label={`Смотреть: ${title}`}>
            <img src={`/video/${id}.webp`} alt="" loading="lazy" />
            <span className="video__play">
              <Icon name="play" size={26} />
            </span>
            {place && <span className="video__place">Снято на {place}</span>}
            <span className="video__time">{duration}</span>
          </button>
        )}
      </div>
      <h3 className="video__title">{title}</h3>
      <p className="video__text">{text}</p>
    </Reveal>
  );
}

export default function Videos() {
  return (
    <section className="section section--tint" id="video">
      <div className="container">
        <SectionHead
          label="Видео"
          title="Видео с реальной работы"
          lead="Фрагменты нашей работы и отзывы участников — чтобы вы заранее почувствовали формат."
        />
        <div className="videos">
          {(VIDEOS as readonly VideoItem[]).map((v, i) => (
            <Video key={v.id} {...v} index={i} />
          ))}
        </div>

        <div className="videos videos--group">
          {(GROUP_VIDEOS as readonly VideoItem[]).map((v, i) => (
            <Video key={v.id} {...v} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
