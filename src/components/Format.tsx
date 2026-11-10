import { FORMAT_INTRO, FORMAT_LEAD, STAGES } from "@/content";
import { Reveal, SectionHead } from "./Reveal";

/** Как проходит интенсив: короткое вступление и шесть этапов. */
export default function Format() {
  return (
    <section className="section section--tint" id="format">
      <div className="container">
        <SectionHead label="Формат" title="Как проходит интенсив" lead={`${FORMAT_LEAD} ${FORMAT_INTRO}`} />

        <ol className="stages">
          {STAGES.map((s, i) => (
            <Reveal as="li" className="card stage" key={s.title} delay={(i % 3) * 0.06}>
              <span className="stage__num">Этап {i + 1}</span>
              <h3 className="h3">{s.title}</h3>
              <p className="muted">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
