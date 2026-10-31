import { EVENT, PROGRAM } from "@/content";
import { Reveal, SectionHead } from "./Reveal";

export default function Program() {
  return (
    <section className="section section--tint" id="program">
      <div className="container program">
        <div className="program__head">
          <SectionHead
            label="Программа"
            title={`${EVENT.dateLabel}, ${EVENT.time}`}
            lead="Предварительное расписание: оно может уточняться после согласования содержания со спикерами."
          />
          <Reveal>
            <a href="#signup" className="btn btn--primary">
              Записаться
            </a>
          </Reveal>
        </div>

        <Reveal className="card program__table">
          <ol>
            {PROGRAM.map((p) => (
              <li key={p.time} className={`program__row${p.pause ? " program__row--pause" : ""}`}>
                <span className="program__time">{p.time}</span>
                <span className="program__title">{p.title}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
