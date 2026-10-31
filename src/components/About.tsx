import { TOPICS } from "@/content";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <SectionHead
          label="Об интенсиве"
          title="С чем можно прийти"
          lead="Три направления, с которыми работаем в течение дня. Можно прийти с одним запросом или с несколькими."
        />

        <div className="topics">
          {TOPICS.map((t, i) => (
            <Reveal as="article" className="card topic" key={t.title} delay={i * 0.06}>
              <span className="topic__icon">
                <Icon name={t.icon} />
              </span>
              <h3 className="h3">{t.title}</h3>
              {t.items ? (
                <ul className="topic__list">
                  {t.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="muted">{t.text}</p>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
