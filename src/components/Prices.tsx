import { EVENT, INCLUDED, PRICES } from "@/content";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";

export default function Prices() {
  return (
    <section className="section" id="price">
      <div className="container">
        <SectionHead
          label="Стоимость"
          title="Стоимость участия"
          lead="Формат участия и набор возможностей одинаковы — отличается только срок бронирования."
        />
        <div className="prices">
          {PRICES.map((p, i) => (
            <Reveal as="article" className={`card price${p.featured ? " price--featured" : ""}`} key={p.name} delay={i * 0.08}>
              {p.featured && <span className="price__badge">Выгоднее</span>}
              <h3 className="h3">{p.name}</h3>
              <p className="price__value">{p.price}</p>
              <p className="price__early">{p.term}</p>
              <ul className="price__list">
                {INCLUDED.map((f) => (
                  <li key={f}>
                    <Icon name="check" size={18} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href="#signup" className={`btn ${p.featured ? "btn--primary" : "btn--outline"} btn--wide`}>
                Забронировать
              </a>
            </Reveal>
          ))}
          <Reveal className="price-info" delay={0.16}>
            <p className="h3">Что важно знать</p>
            <ul>
              <li>
                <b>{EVENT.dateLabel}</b>, {EVENT.weekday}, {EVENT.time}
              </li>
              <li>
                <b>{EVENT.city}</b> — {EVENT.place.toLowerCase()}
              </li>
              <li>Оплата после подтверждения заявки</li>
              <li>Можно оплатить для другого человека в подарок</li>
            </ul>
          </Reveal>
        </div>
        <Reveal className="prices__note">
          <span className="hero__seats-dot" aria-hidden="true" />
          Количество мест ограничено. Рекомендуем бронировать участие заранее.
        </Reveal>
      </div>
    </section>
  );
}
