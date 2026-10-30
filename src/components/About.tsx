import { AUDIENCE, TOPICS } from "@/content";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <SectionHead
          label="О чём интенсив"
          title="Как чувства и отношения становятся телом"
          lead="За один день разберёмся, откуда берутся телесные симптомы и реакции, и попробуем на практике, как с ними работать."
        />

        <div className="topics">
          {TOPICS.map((t, i) => (
            <Reveal as="article" className="card topic" key={t.title} delay={(i % 3) * 0.06}>
              <span className="topic__icon">
                <Icon name={t.icon} />
              </span>
              <h3 className="h3">{t.title}</h3>
              <p className="muted">{t.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="audience">
          <h3 className="h3 audience__title">Вам подойдёт, если</h3>
          <ul className="audience__list">
            {AUDIENCE.map((a) => (
              <li key={a}>
                <Icon name="check" size={18} />
                {a}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
