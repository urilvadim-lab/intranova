import { WHY } from "@/content";
import { Reveal, SectionHead } from "./Reveal";

/** Почему INTRANOVA: три специалиста — единое пространство практической работы. */
export default function Why() {
  return (
    <section className="section" id="why">
      <div className="container">
        <SectionHead label="Почему INTRANOVA" title={WHY.title} lead={WHY.lead} />

        <Reveal className="why__tags" delay={0.04}>
          {WHY.approaches.map((a) => (
            <span className="why__tag" key={a}>
              {a}
            </span>
          ))}
        </Reveal>

        <div className="why__cards">
          {WHY.cards.map((c, i) => (
            <Reveal as="article" className="card why__card" key={c.who} delay={i * 0.06}>
              <p className="why__who">{c.who}</p>
              <h3 className="h3">{c.approach}</h3>
              <p className="muted">{c.text}</p>
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
