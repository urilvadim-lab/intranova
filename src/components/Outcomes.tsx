import { OUTCOMES, OUTCOMES_LEAD, OUTCOMES_NOTE } from "@/content";
import { Reveal, SectionHead } from "./Reveal";

/** Что вы получите. */
export default function Outcomes() {
  return (
    <section className="section" id="outcomes">
      <div className="container">
        <SectionHead label="Результат" title="Что вы получите" lead={`${OUTCOMES_LEAD} ${OUTCOMES_NOTE}`} />
        <ol className="outcomes__grid outcomes__grid--3">
          {OUTCOMES.map((o, i) => (
            <Reveal as="li" className="card outcome" key={o.title} delay={(i % 3) * 0.06}>
              <span className="outcome__num">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="h3">{o.title}</h3>
              <p className="muted">{o.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
