import { FORMATS } from "@/content";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";

/** Как проходит интенсив: вводный текст и основные форматы работы. */
export default function Format() {
  return (
    <section className="section section--tint" id="format">
      <div className="container format">
        <div>
          <SectionHead label="Формат" title="Как проходит интенсив" />
          <Reveal className="format__text">
            <p>
              Это день практической работы, новых открытий и знакомства с собственными реакциями. Вместе со
              специалистами вы сможете исследовать связь между эмоциональными переживаниями и телесными ощущениями,
              попробовать современные психологические и гипнотические методы, получить новый опыт взаимодействия со
              своим состоянием.
            </p>
            <p>
              В программе предусмотрены индивидуальные, парные и групповые упражнения, практики и демонстрации работы
              специалистов. При желании участников отдельные методы работы могут демонстрироваться на добровольцах с их
              согласия.
            </p>
          </Reveal>
        </div>
        <Reveal className="card format__card" delay={0.08}>
          <p className="h3">Основные форматы</p>
          <ul className="format__list">
            {FORMATS.map((f) => (
              <li key={f}>
                <Icon name="check" size={18} />
                {f}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
