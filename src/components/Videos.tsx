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

const all = [...(VIDEOS as readonly VideoItem[]), ...(GROUP_VIDEOS as readonly VideoItem[])];
// вертикальные: чередуем — один наш, один Алины; горизонтальные уходят в колонку рядом
const vertical = (() => {
  const mine = all.filter((v) => v.vertical && !v.id.startsWith("alina"));
  const hers = all.filter((v) => v.vertical && v.id.startsWith("alina"));
  const out: VideoItem[] = [];
  for (let i = 0; i < Math.max(mine.length, hers.length); i++) {
    if (mine[i]) out.push(mine[i]);
    if (hers[i]) out.push(hers[i]);
  }
  return out;
})();
const wideAll = all.filter((v) => !v.vertical);
// первый горизонтальный слот переключается стрелками: Марк ↔ работа со страхом в гипнозе
const wideSlider = ["mark", "hypnosis"].map((id) => wideAll.find((v) => v.id === id)).filter(Boolean) as VideoItem[];
const wide = wideAll.filter((v) => !wideSlider.some((w) => w.id === v.id));

export default function Videos() {
  const track = useRef<HTMLDivElement>(null);
  const wtrack = useRef<HTMLDivElement>(null);
  const go = (dir: 1 | -1, ref: React.RefObject<HTMLDivElement | null> = track) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" });
  };
  return (
    <section className="section section--tint" id="video">
      <div className="container">
        <SectionHead
          label="Видео"
          title="Видео с реальной работы"
          lead="Фрагменты нашей работы и отзывы участников — чтобы вы заранее почувствовали формат."
        />
        <div className="vgallery">
          <div className="vgallery__slider">
            <div className="vslider" ref={track} tabIndex={0} aria-label="Вертикальные видео">
              {vertical.map((v, i) => (
                <div className="vslider__item" key={v.id}>
                  <Video {...v} index={i % 2} />
                </div>
              ))}
            </div>
            <div className="vslider__nav">
              <button type="button" onClick={() => go(-1, track)} aria-label="Назад" className="vslider__btn">
                <Icon name="arrow" size={18} className="vslider__arrow vslider__arrow--back" />
              </button>
              <button type="button" onClick={() => go(1, track)} aria-label="Дальше" className="vslider__btn">
                <Icon name="arrow" size={18} />
              </button>
            </div>
          </div>
          <div className="vgallery__wide">
            <div className="hslider-wrap">
              <div className="vslider hslider" ref={wtrack} tabIndex={0} aria-label="Горизонтальные видео">
                {wideSlider.map((v, i) => (
                  <div className="hslider__item" key={v.id}>
                    <Video {...v} index={i} />
                  </div>
                ))}
              </div>
              <div className="vslider__nav">
                <button type="button" onClick={() => go(-1, wtrack)} aria-label="Предыдущее видео" className="vslider__btn">
                  <Icon name="arrow" size={18} className="vslider__arrow vslider__arrow--back" />
                </button>
                <button type="button" onClick={() => go(1, wtrack)} aria-label="Следующее видео" className="vslider__btn">
                  <Icon name="arrow" size={18} />
                </button>
              </div>
            </div>
            {wide.map((v, i) => (
              <Video key={v.id} {...v} index={i} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
