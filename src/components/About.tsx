import { TOPICS, TOPICS_NOTE } from "@/content";
import Audience from "./Audience";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <SectionHead
          label="Об интенсиве"
          title="С чем можно прийти"
          lead="С телесным симптомом, тревогой, эмоциональным напряжением или желанием лучше разобраться в своём состоянии. Можно прийти с одним запросом или с несколькими."
        />

        <div className="topics">
          {TOPICS.map((t, i) => (
            <Reveal as="article" className="card topic" key={t.title} delay={(i % 3) * 0.06}>
              <span className="topic__icon">
                <Icon name={t.icon} />
              </span>
              <h3 className="h3">{t.title}</h3>
              <p className="muted">{t.text}</p>
              {t.items && (
                <ul className="topic__list">
                  {t.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </Reveal>
          ))}
          <Reveal className="topics__note" delay={0.12}>
            <p className="topics__note-title">{TOPICS_NOTE.title}</p>
            <p>{TOPICS_NOTE.text}</p>
          </Reveal>
        </div>

        <Audience />
      </div>
    </section>
  );
}
