import "@fontsource/literata/400.css";
import "@fontsource/literata/500.css";
import "@fontsource/literata/400-italic.css";
import { Diplomas } from "./KClient";
import { EVENT } from "@/content";

/**
 * Страница психоаналитика — оформление «Кабинет»: тёмный графит, журнальная подача.
 * Человек приходит из Instagram уже с намерением: на первом экране сразу формат, цена, где и как написать.
 * Тон без продаж — «если захотите обратиться».
 */

const TG = "https://t.me/karachinsev_psychotherapy";
const IG = "https://www.instagram.com/karachinsev_psychotherapy/";
const VK = "https://vk.com/karachinsev_psychotherapy";
const YT = "https://www.youtube.com/@karachinsev_psychotherapy";
const MAP = "https://yandex.ru/maps/?text=" + encodeURIComponent("Москва, улица Кравченко, 11");

const REQUESTS = [
  "Сложности в отношениях",
  "Тревога, панические атаки, страхи",
  "Депрессивные состояния, апатия",
  "Чувство вины и стыда",
  "Неуверенность в себе, поиск себя",
  "Внутренние конфликты, поиск смысла",
  "Психосоматические заболевания",
  "Расстройства пищевого поведения",
];

const FAQ = [
  {
    q: "Это конфиденциально?",
    a: "Да. Всё, что звучит в кабинете, остаётся между нами — это основа работы. Исключения есть только те, что прямо предусмотрены законом.",
  },
  {
    q: "Как часто встречаться и сколько длится работа?",
    a: "Частоту выбираем вместе — от одной встречи в неделю. Сколько продлится работа, заранее сказать нельзя: это зависит от вашей истории, и решение всегда остаётся за вами.",
  },
  {
    q: "Онлайн — это так же, как очно?",
    a: "Для анализа важнее регулярность и сам разговор, чем формат. Я и сам проходил анализ и очно, и онлайн. Можно и совмещать.",
  },
  {
    q: "Нужно ли лежать на кушетке?",
    a: "Нет. Можно сидеть лицом к лицу. Кушетка — возможность, а не условие.",
  },
  {
    q: "Чем психоаналитик отличается от психолога?",
    a: "Психоаналитик не даёт советов и готовых техник. Он слушает так, чтобы вы услышали собственную речь и то, что за ней стоит. При этом по образованию я ещё и клинический психолог.",
  },
];

function Contacts({ big }: { big?: boolean }) {
  return (
    <p className={`kf-contacts${big ? " kf-contacts--big" : ""}`}>
      <a href={TG} target="_blank" rel="noopener noreferrer">Telegram</a>
      <a href={IG} target="_blank" rel="noopener noreferrer">Instagram</a>
      <a href={VK} target="_blank" rel="noopener noreferrer">ВКонтакте</a>
    </p>
  );
}

function Head({ n, label, title }: { n: string; label: string; title: React.ReactNode }) {
  return (
    <div className="kf-head">
      <p className="kf-kicker">
        <span>{n}</span> {label}
      </p>
      <h2 className="kf-h2">{title}</h2>
    </div>
  );
}

export default function KFinal() {
  return (
    <div className="kf">
      <header className="kf-top">
        <div className="kf-wrap kf-top__bar">
          <a href="#top" className="kf-top__name">Александр Карачинцев</a>
          <nav className="kf-top__nav" aria-label="Разделы">
            <a href="#about">Обо мне</a>
            <a href="#requests">С чем приходят</a>
            <a href="#education">Образование</a>
            <a href="#faq">Вопросы</a>
            <a href="#contact">Контакты</a>
          </nav>
        </div>
      </header>

      <main>
        {/* Первый экран: кто, сколько, где, как написать */}
        <section className="kf-hero" id="top">
          {/* фото растворяется в фоне, как на последней странице руководства: на компьютере широкий кадр справа, на телефоне портрет сверху */}
          <picture className="kf-hero__photo">
            <source media="(min-width: 861px)" srcSet="/karachinsev/alexander-wide.webp" />
            <img
              src="/karachinsev/alexander.webp"
              srcSet="/karachinsev/alexander-sm.webp 520w, /karachinsev/alexander.webp 960w"
              sizes="100vw"
              alt="Александр Карачинцев"
              width={960}
              height={1200}
            />
          </picture>
          <div className="kf-wrap kf-hero__grid">
            <div className="kf-hero__text">
              <p className="kf-kicker">Психоаналитик · клинический психолог</p>
              <h1 className="kf-h1">Александр Карачинцев</h1>
              <p className="kf-lead">
                <em>Психоанализ — совместное исследование</em> того, что стоит за тревогой, переживаниями, сложностями в
                отношениях и повторяющимися жизненными сценариями.
              </p>
              <div className="kf-card">
                <ul className="kf-card__rows">
                  <li><b>Первая сессия</b> — 50 минут, 5 000 ₽ или 70 $</li>
                  <li><b>Очно</b> — Москва, ул. Кравченко, 11, м. Проспект Вернадского</li>
                  <li><b>Онлайн</b> — в любом мессенджере</li>
                  <li><b>Взрослые и подростки</b></li>
                </ul>
              </div>
              <div className="kf-hero__write">
                <span className="kf-hero__label">Написать</span>
                <Contacts />
              </div>
              <p className="kf-small">
                Как проходит первая встреча — в закреплённом хайлайте «1-я сессия» в{" "}
                <a href={IG} target="_blank" rel="noopener noreferrer">Instagram</a>.
              </p>
            </div>
          </div>
        </section>

        {/* 01 Обо мне */}
        <section className="kf-sec" id="about">
          <div className="kf-wrap kf-cols">
            <Head n="01" label="Обо мне" title="Что стоит знать обо мне до первой встречи" />
            <div className="kf-prose">
              <p className="kf-first">
                Я психоаналитик и клинический психолог, практикую уже восемь лет. А ещё — отец двоих детей, так что о
                детях и родителях знаю не только по книгам.
              </p>
              <p>
                Практиковать я начал рано — ещё в магистратуре, в нашем семейном центре в Севастополе. Занимался в основном
                гипнотерапией и провокативной терапией, изучал КПТ в работе с химическими зависимостями, вёл клуб по
                психосоматике.
              </p>
              <p>
                Каждый метод повлиял на мой профессиональный взгляд. Но ближе всего мне оказался психоанализ: он
                действительно старается <em>услышать человека и его историю</em> — и не подсовывает готовых ответов.
              </p>
            </div>
          </div>
        </section>

        {/* Врезка-цитата */}
        <section className="kf-pull">
          <div className="kf-wrap">
            <blockquote>
              <p>«Интерес к тому, что происходит в психике, — начало настоящего знакомства с собой».</p>
            </blockquote>
          </div>
        </section>

        {/* 02 Почему психоанализ */}
        <section className="kf-sec">
          <div className="kf-wrap kf-cols">
            <Head n="02" label="Подход" title={<>Почему психоанализ? <em>Потому что он честный.</em></>} />
            <div className="kf-prose">
              <p className="kf-lead2">
                Для меня психотерапия — это <em>совместное исследование вашего внутреннего мира.</em>
              </p>
              <p>
                По мере этого исследования то, что казалось хаотичным и непонятным, начинает складываться в единую картину.
                Симптомы, внутренние конфликты и повторяющиеся сценарии постепенно теряют свою власть — потому что перестают
                оставаться бессознательными. Так появляется пространство для большей внутренней свободы.
              </p>
              <p>
                В кабинете больше говорите вы. Вместо готовых ответов я задаю вопросы, которые помогают увидеть скрытое и
                найти собственные способы двигаться дальше.
              </p>
              <p>
                Одно я видел много раз: <em>человек, заручившись поддержкой другого, способен изменить свою жизнь сильнее, чем
                сам от себя ожидал.</em>
              </p>
            </div>
          </div>
        </section>

        {/* 03 С чем приходят */}
        <section className="kf-sec kf-sec--alt" id="requests">
          <div className="kf-wrap kf-cols">
            <Head n="03" label="Запросы" title="С чем приходят" />
            <div>
              <ul className="kf-list">
                {REQUESTS.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="kf-note">
                <em>На первую встречу можно прийти и без чёткого запроса</em> — с ощущением, что что-то не так, или просто из
                интереса. Работаю со взрослыми и подростками.
              </p>
            </div>
          </div>
        </section>

        {/* 04 Образование */}
        <section className="kf-sec" id="education">
          <div className="kf-wrap kf-cols">
            <Head n="04" label="Образование" title="Формальная часть — для тех, кто любит порядок" />
            <div>
              <dl className="kf-edu">
                <dt>2018</dt>
                <dd><b>Бакалавриат, психология</b> КФУ им. В. И. Вернадского, кафедра глубинной психологии и психотерапии</dd>
                <dt>2020</dt>
                <dd><b>Магистратура, психология</b> КФУ им. В. И. Вернадского, кафедра глубинной психологии и психотерапии</dd>
                <dt>2020</dt>
                <dd><b>Клиническая психология</b> Профессиональная переподготовка, КФУ им. В. И. Вернадского, 828 часов</dd>
                <dt>—</dt>
                <dd><b>Психоанализ Фрейда–Лакана</b> Подготовка в ВЕИП</dd>
              </dl>
              <p className="kf-note">Также: гипнотерапия, сенсомоторный психосинтез, когнитивно-поведенческая терапия, психосоматика.</p>
              <Diplomas />
              <div className="kf-beyond">
                <p className="kf-kicker"><span>—</span> Помимо кабинета</p>
                <p>
                  Сам прохожу личный анализ — на кушетке и без неё, у разных аналитиков. Регулярно бываю на супервизиях,
                  участвую в интервизиях и чтениях, веду супервизии для коллег. Читаю лекции о гипнотерапии и психосоматике
                  в Академии им. Бехтерева.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 05 Вопросы */}
        <section className="kf-sec kf-sec--alt" id="faq">
          <div className="kf-wrap kf-cols">
            <Head n="05" label="Вопросы" title="Коротко о частых вопросах" />
            <div className="kf-faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 06 Контакты */}
        <section className="kf-sec" id="contact">
          <div className="kf-wrap kf-cols">
            <Head n="06" label="Контакты" title="Если захотите обратиться" />
            <div className="kf-prose">
              <p className="kf-lead2">
                Напишите мне — как вас зовут, сколько вам лет, коротко о том, с чем хотите прийти, и как часто вам удобно
                встречаться. Если захотите продолжить это исследование вместе — буду рад познакомиться лично.
              </p>
              <Contacts big />
              <ul className="kf-info kf-info--contact">
                <li><b>Первая сессия</b> — 50 минут, 5 000 ₽ или 70 $</li>
                <li>
                  <b>Очно</b> — Москва, ул. Кравченко, 11, м. Проспект Вернадского ·{" "}
                  <a href={MAP} target="_blank" rel="noopener noreferrer">на карте</a>
                </li>
                <li><b>Онлайн</b> — в любом мессенджере</li>
                <li><b>Коллегам</b> — супервизия онлайн, 4 000 ₽ или 60 $</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer className="kf-foot">
        <div className="kf-wrap kf-foot__grid">
          <p>© 2026 Александр Карачинцев</p>
          <p className="kf-foot__links">
            <a href={TG} target="_blank" rel="noopener noreferrer">Telegram</a>
            <a href={IG} target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href={VK} target="_blank" rel="noopener noreferrer">ВКонтакте</a>
            <a href={YT} target="_blank" rel="noopener noreferrer">YouTube</a>
          </p>
          <p>
            <a href="/">{EVENT.title} — {EVENT.dateLabel}</a>
          </p>
        </div>
      </footer>

      {/* на телефоне — тихая строка контактов внизу экрана */}
      <nav className="kf-dock" aria-label="Написать">
        <a href={TG} target="_blank" rel="noopener noreferrer">Telegram</a>
        <a href={IG} target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href={VK} target="_blank" rel="noopener noreferrer">ВКонтакте</a>
      </nav>
    </div>
  );
}
