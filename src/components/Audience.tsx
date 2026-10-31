import { AUDIENCE, OUTCOMES } from "@/content";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";

/** Кому подойдёт интенсив и что участник сможет взять с собой. */
export default function Audience() {
  return (
    <section className="section" id="audience">
      <div className="container">
        <SectionHead label="Для кого" title="Кому подойдёт интенсив" />
        <Reveal className="audience">
          <h3 className="h3 audience__title">Интенсив подойдёт, если вы</h3>
          <ul className="audience__list">
            {AUDIENCE.map((a) => (
              <li key={a}>
                <Icon name="check" size={18} />
                {a}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="outcomes">
          <SectionHead
            label="Результат"
            title="Что вы сможете взять с собой"
            lead="Каждый участник сможет вынести из интенсива что-то значимое для себя: новое понимание, практический опыт, полезные инструменты или изменения в собственном состоянии."
          />
          <ol className="outcomes__grid">
            {OUTCOMES.map((o, i) => (
              <Reveal as="li" className="card outcome" key={o} delay={(i % 3) * 0.06}>
                <span className="outcome__num">{String(i + 1).padStart(2, "0")}</span>
                <p>{o}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
