import { SPEAKERS, WHY } from "@/content";
import { Reveal, SectionHead } from "./Reveal";

/** Почему INTRANOVA + специалисты в одном блоке: идея объединения и три человека. */
export default function Why() {
  return (
    <section className="section" id="why">
      <div className="container">
        <SectionHead
          label="Почему INTRANOVA"
          title={
            <>
              {WHY.titleLines.map((line) => (
                <span className="why__line" key={line}>
                  {line}
                </span>
              ))}
            </>
          }
          lead={WHY.lead}
        />

        <Reveal className="why__tags" delay={0.04}>
          {WHY.approaches.map((a) => (
            <span className="why__tag" key={a}>
              {a}
            </span>
          ))}
        </Reveal>

        <div className="speakers" id="speakers">
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
              <div className="speaker__body">
                <h3 className="h3 speaker__name">{s.name}</h3>
                <p className="speaker__role">{s.role}</p>
                <p className="muted">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="why__closing">
          <p>{WHY.closing}</p>
        </Reveal>
      </div>
    </section>
  );
}
