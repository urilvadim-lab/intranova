import { CONTACTS, EVENT, NAV, SEO_TAGS } from "@/content";
import Logo from "./Logo";
import TrackedLink from "./TrackedLink";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div>
          <Logo />
          <p className="footer__muted">
            {EVENT.title}. {EVENT.dateLabel}, {EVENT.time}, {EVENT.city}, {EVENT.metro}.
          </p>
        </div>
        <nav className="footer__col" aria-label="Навигация в подвале">
          {NAV.map((n) => (
            <a key={n.href} href={`/${n.href}`}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="footer__col">
          <TrackedLink goal="telegram_click" href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer">
            Telegram
          </TrackedLink>
          <TrackedLink goal="max_click" href={CONTACTS.max} target="_blank" rel="noopener noreferrer">
            MAX
          </TrackedLink>
          <TrackedLink goal="phone_click" href={`tel:${CONTACTS.phoneTel}`}>
            {CONTACTS.phone}
          </TrackedLink>
          <TrackedLink goal="email_click" href={`mailto:${CONTACTS.email}`}>
            {CONTACTS.email}
          </TrackedLink>
          <a href="/privacy/">Политика конфиденциальности</a>
        </div>
      </div>
      <div className="container footer__tags" aria-label="Темы интенсива">
        <p className="footer__tags-title">Темы интенсива</p>
        <ul>
          {SEO_TAGS.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
      <div className="container footer__bottom">© 2026 INTRANOVA</div>
    </footer>
  );
}
