import { CONTACTS, EVENT } from "@/content";
import Icon from "./Icon";
import { Reveal, SectionHead } from "./Reveal";
import TrackedLink from "./TrackedLink";

/** Контакты: Telegram, MAX, телефон, почта. */
export default function Contacts() {
  return (
    <section className="section section--tint" id="contacts">
      <div className="container">
        <SectionHead
          label="Контакты"
          title="Свяжитесь с нами удобным способом"
          lead="Ответим на вопросы об интенсиве, поможем понять, подходит ли он вам, и забронируем место."
        />
        <div className="contacts__grid">
          <Reveal as="article" className="card contact">
            <span className="topic__icon">
              <Icon name="tg" />
            </span>
            <h3 className="h3">Telegram</h3>
            <p className="muted">Напишите нам — ответим в мессенджере.</p>
            <TrackedLink goal="telegram_click" href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
              Написать в Telegram
            </TrackedLink>
          </Reveal>
          <Reveal as="article" className="card contact" delay={0.06}>
            <span className="topic__icon">
              <Icon name="max" />
            </span>
            <h3 className="h3">MAX</h3>
            <p className="muted">Если вам удобнее российский мессенджер.</p>
            <TrackedLink goal="max_click" href={CONTACTS.max} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
              Написать в MAX
            </TrackedLink>
          </Reveal>
          <Reveal as="article" className="card contact" delay={0.12}>
            <span className="topic__icon">
              <Icon name="phone" />
            </span>
            <h3 className="h3">Телефон</h3>
            <p className="muted">{CONTACTS.phoneName}. Если не ответим сразу — напишите в Telegram или MAX.</p>
            <TrackedLink goal="phone_click" href={`tel:${CONTACTS.phoneTel}`} className="btn btn--primary">
              <Icon name="phone" size={18} /> {CONTACTS.phone}
            </TrackedLink>
          </Reveal>
        </div>
        <Reveal className="contacts__meta">
          <p>
            <b>{EVENT.dateLabel}, {EVENT.time}</b> · {EVENT.city}, {EVENT.metro} · {EVENT.place}
          </p>
          <p>
            Почта:{" "}
            <TrackedLink goal="email_click" href={`mailto:${CONTACTS.email}`}>
              {CONTACTS.email}
            </TrackedLink>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
