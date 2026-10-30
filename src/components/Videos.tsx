"use client";

import { useState } from "react";
import { VIDEOS } from "@/content";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";

/** Плеер RuTube подгружается только по клику — страница не тяжелеет от iframe. */
function Video({ id, title, duration, index }: { id: string; title: string; duration: string; index: number }) {
  const [play, setPlay] = useState(false);
  return (
    <Reveal as="article" className="video" delay={index * 0.08}>
      <div className="video__frame">
        {play ? (
          <iframe
            src={`https://rutube.ru/play/embed/${id}?autoplay=1`}
            title={title}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button className="video__cover" onClick={() => setPlay(true)} aria-label={`Смотреть: ${title}`}>
            <img src={`https://rutube.ru/api/video/${id}/thumbnail/?redirect=1`} alt="" loading="lazy" />
            <span className="video__play">
              <Icon name="play" size={26} />
            </span>
            <span className="video__time">{duration}</span>
          </button>
        )}
      </div>
      <h3 className="video__title">{title}</h3>
    </Reveal>
  );
}

export default function Videos() {
  return (
    <section className="section section--tint" id="video">
      <div className="container">
        <SectionHead
          label="Видео"
          title="Как проходит работа"
          lead="Фрагменты сессий и разборов — чтобы вы заранее почувствовали формат."
        />
        <div className="videos">
          {VIDEOS.map((v, i) => (
            <Video key={v.id} {...v} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
