import { SPEAKERS } from "@/content";
import { Reveal, SectionHead } from "./Reveal";

export default function Speakers() {
  return (
    <section className="section" id="speakers">
      <div className="container">
        <SectionHead
          label="Спикеры"
          title="Три специалиста — три взгляда на симптом"
          lead="Клиническая психология, работа с эмоциями и телесными реакциями, гипнотерапия — в одном дне."
        />
        <div className="speakers">
          {SPEAKERS.map((s, i) => (
            <Reveal as="article" className="speaker" key={s.id} delay={i * 0.08}>
              <div className="speaker__photo">
                <img
                  src={`/speakers/${s.id}.webp`}
                  srcSet={`/speakers/${s.id}-sm.webp 480w, /speakers/${s.id}.webp 960w`}
                  sizes="(max-width: 700px) 92vw, 31vw"
                  alt={s.name}
                  width={960}
                  height={1200}
                  loading="lazy"
                />
              </div>
              <h3 className="h3 speaker__name">{s.name}</h3>
              <p className="speaker__role">{s.role}</p>
              <p className="muted">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
