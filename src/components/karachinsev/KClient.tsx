"use client";

import { useEffect, useRef, useState } from "react";

/* Интерактивные части страницы /karachinsev: дипломы с увеличением и карта, которая грузится при прокрутке. */

const DIPLOMAS = [
  { id: "diploma-bachelor", title: "Бакалавр психологии", year: "2018" },
  { id: "diploma-master", title: "Магистр психологии", year: "2020" },
  { id: "diploma-clinical", title: "Клиническая психология, 828 ч", year: "2020" },
];

export function Diplomas() {
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="kp-diplomas">
        {DIPLOMAS.map((d, i) => (
          <button key={d.id} className="kp-diploma" onClick={() => setOpen(i)} aria-label={`Открыть диплом: ${d.title}`}>
            <img src={`/karachinsev/${d.id}-sm.webp`} alt={d.title} loading="lazy" width={520} height={390} />
            <span className="kp-diploma__cap">
              <b>{d.title}</b> · {d.year}
            </span>
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="kp-lightbox" role="dialog" aria-modal="true" aria-label={DIPLOMAS[open].title} onClick={() => setOpen(null)}>
          <img src={`/karachinsev/${DIPLOMAS[open].id}.webp`} alt={DIPLOMAS[open].title} />
          <button className="kp-lightbox__close" aria-label="Закрыть" onClick={() => setOpen(null)}>
            ×
          </button>
        </div>
      )}
    </>
  );
}

const MAP_SRC =
  "https://yandex.ru/map-widget/v1/?text=" + encodeURIComponent("Москва, улица Кравченко, 11") + "&z=16";

/** Яндекс-карта подгружается, только когда до неё доскроллили — первый экран на телефоне не тормозит. */
export function LazyMap() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setShow(true);
        io.disconnect();
      }
    }, { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="kp-map" ref={ref}>
      {show ? (
        <iframe src={MAP_SRC} title="Кабинет на карте: Москва, ул. Кравченко, 11" loading="lazy" allowFullScreen />
      ) : (
        <span className="kp-map__stub">Карта загружается…</span>
      )}
    </div>
  );
}
