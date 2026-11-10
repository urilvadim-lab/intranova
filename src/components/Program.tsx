import { EVENT, PROGRAM, PROGRAM_NOTE } from "@/content";
import { Reveal, SectionHead } from "./Reveal";
import TrackedLink from "./TrackedLink";

export default function Program() {
  return (
    <section className="section section--tint" id="program">
      <div className="container program">
        <div className="program__head">
          <SectionHead
            label="Программа дня"
            title={`${EVENT.dateLabel}, ${EVENT.time}`}
            lead="Шесть этапов в течение дня. Расписание предварительное и может уточняться."
          />
          <Reveal>
            <TrackedLink goal="signup_click" href="#signup" className="btn btn--primary">
              Записаться
            </TrackedLink>
          </Reveal>
        </div>

        <Reveal className="card program__table">
          <ol>
            {PROGRAM.map((p) => (
              <li key={p.time} className={`program__row${p.pause ? " program__row--pause" : ""}`}>
                <span className="program__time">{p.time}</span>
                <span className="program__title">
                  {p.stage && <span className="program__stage">Этап {p.stage}</span>}
                  {p.title}
                </span>
              </li>
            ))}
          </ol>
          <p className="program__note">{PROGRAM_NOTE}</p>
        </Reveal>
      </div>
    </section>
  );
}
