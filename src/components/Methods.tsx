import { METHODS, METHODS_LEAD } from "@/content";
import { Reveal, SectionHead } from "./Reveal";

export default function Methods() {
  return (
    <section className="section section--dark methods" id="methods">
      <div className="methods__aura" aria-hidden="true" />
      <div className="container">
        <SectionHead light label="Как будем работать" title="Методы и подходы" lead={METHODS_LEAD} />
        <ol className="methods__grid methods__grid--6">
          {METHODS.map((m, i) => (
            <Reveal as="li" className="method" key={m.title} delay={(i % 3) * 0.06}>
              <span className="method__num">0{i + 1}</span>
              <h3 className="h3">{m.title}</h3>
              <p>{m.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
