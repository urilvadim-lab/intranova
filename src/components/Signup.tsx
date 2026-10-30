"use client";

import { useState, type FormEvent } from "react";
import { CONTACTS, EVENT, PRICES } from "@/content";
import Icon from "./Icon";
import { Reveal } from "./Reveal";

type Status = "idle" | "sending" | "sent" | "error";

export default function Signup() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      // GitHub Pages не выполняет серверный код — заявки уходят на почту через FormSubmit
      const data = new FormData(e.currentTarget);
      data.append("_subject", `Заявка на интенсив: ${data.get("name")}`);
      data.append("_template", "table");
      data.append("_captcha", "false");
      const res = await fetch(`https://formsubmit.co/ajax/${CONTACTS.email}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || String(json?.success) !== "true") throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="section section--dark signup" id="signup">
      <div className="methods__aura" aria-hidden="true" />
      <div className="container signup__grid">
        <Reveal className="signup__intro">
          <p className="label">Запись</p>
          <h2 className="h2">Оставьте заявку на интенсив</h2>
          <p className="signup__lead">
            Мы свяжемся с вами, подтвердим место, ответим на вопросы и пришлём реквизиты для оплаты и
            адрес площадки.
          </p>
          <ul className="signup__facts">
            <li>
              <Icon name="calendar" size={18} /> {EVENT.dateLabel}, {EVENT.time}
            </li>
            <li>
              <Icon name="pin" size={18} /> {EVENT.city}
            </li>
          </ul>
          <p className="signup__direct">Или напишите напрямую:</p>
          <div className="signup__links">
            <a href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer" className="btn btn--outline-light">
              <Icon name="tg" size={18} /> Telegram
            </a>
            <a href={`mailto:${CONTACTS.email}`} className="btn btn--outline-light">
              <Icon name="mail" size={18} /> Почта
            </a>
          </div>
        </Reveal>

        <Reveal className="card signup__card" delay={0.08}>
          {status === "sent" ? (
            <div className="signup__done" role="status">
              <p className="h3">Заявка отправлена</p>
              <p className="muted">Мы напишем вам в ближайшее время.</p>
            </div>
          ) : (
            <form className="form" onSubmit={onSubmit}>
              <label className="field">
                <span>Имя</span>
                <input name="name" required autoComplete="name" maxLength={80} placeholder="Как к вам обращаться" />
              </label>
              <label className="field">
                <span>Телефон или Telegram</span>
                <input name="contact" required autoComplete="tel" maxLength={80} placeholder="+7 … или @username" />
              </label>
              <label className="field">
                <span>Формат участия</span>
                <select name="tariff" defaultValue={PRICES[0].name}>
                  {PRICES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} — {p.price}
                    </option>
                  ))}
                  <option value="Пока не решил">Пока не решил(а)</option>
                </select>
              </label>
              <label className="field">
                <span>Вопрос или запрос (необязательно)</span>
                <textarea name="message" rows={3} maxLength={1500} />
              </label>
              {/* ловушка для ботов */}
              <input className="form__trap" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <label className="check">
                <input type="checkbox" name="consent" required />
                <span>
                  Согласен(на) на обработку персональных данных по{" "}
                  <a href="/privacy/">политике конфиденциальности</a>
                </span>
              </label>
              <button className="btn btn--primary btn--wide" disabled={status === "sending"}>
                {status === "sending" ? "Отправляем…" : "Отправить заявку"}
              </button>
              {status === "error" && (
                <p className="form__error" role="alert">
                  Не получилось отправить. Напишите нам в{" "}
                  <a href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer">
                    Telegram
                  </a>{" "}
                  или на {CONTACTS.email}.
                </p>
              )}
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
