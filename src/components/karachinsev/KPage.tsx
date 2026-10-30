import "@fontsource/literata/400.css";
import "@fontsource/literata/500.css";
import "@fontsource/literata/400-italic.css";
import { Diplomas } from "./KClient";
import { EVENT } from "@/content";

/**
 * Страница психоаналитика. Три оформления на одном тексте:
 * a — «Книга» (бумага, засечки, тёмно-синий), b — «Кабинет» (графит, светлый текст), c — «Минимализм» (белый, чёрный).
 * Тон — без продаж: не «записывайтесь», а «если захотите обратиться».
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

export default function KPage({ variant }: { variant: "a" | "b" | "c" }) {
  return (
    <div className={`kv kv--${variant}`}>
      <header className="kv-top">
        <div className="kv-wrap kv-top__bar">
          <a href="#top" className="kv-top__name">Александр Карачинцев</a>
          <nav className="kv-top__nav" aria-label="Разделы">
            <a href="#about">Обо мне</a>
            <a href="#work">Работа</a>
            <a href="#education">Образование</a>
            <a href="#contact">Контакты</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="kv-hero" id="top">
          <div className="kv-wrap kv-hero__grid">
            <div className="kv-hero__text">
              <p className="kv-kicker">Москва · онлайн</p>
              <h1 className="kv-h1">Александр Карачинцев</h1>
              <p className="kv-role">Психоаналитик, клинический психолог</p>
              <p className="kv-lead">
                Двух одинаковых историй не бывает. Психоанализ не учит, как жить, — он помогает услышать себя и добраться
                до причин того, что с вами происходит.
              </p>
            </div>
            <figure className="kv-hero__photo">
              {variant === "c" ? (
                <picture>
                  <source media="(max-width: 860px)" srcSet="/karachinsev/alexander-sm.webp 520w, /karachinsev/alexander.webp 960w" />
                  <img src="/karachinsev/alexander-wide.webp" alt="Александр Карачинцев" width={1600} height={1067} />
                </picture>
              ) : (
                <img
                  src="/karachinsev/alexander.webp"
                  srcSet="/karachinsev/alexander-sm.webp 520w, /karachinsev/alexander.webp 960w"
                  sizes="(max-width: 860px) 100vw, 40vw"
                  alt="Александр Карачинцев"
                  width={960}
                  height={1200}
                />
              )}
            </figure>
          </div>
        </section>

        <section className="kv-sec" id="about">
          <div className="kv-wrap kv-cols">
            <h2 className="kv-h2">Что стоит знать обо мне до первой встречи</h2>
            <div className="kv-prose">
              <p>
                Я психоаналитик и клинический психолог, практикую уже более семи лет. А ещё — отец двоих детей, так что о
                детях и родителях знаю не только по книгам.
              </p>
              <p>
                Практиковать я начал ещё в магистратуре, в нашем семейном центре в Севастополе: гипнотерапия, провокативная
                терапия, КПТ в работе с химическими зависимостями, клуб по психосоматике.
              </p>
              <p>
                Каждый метод повлиял на мой взгляд. Но ближе всего мне оказался психоанализ: он действительно старается
                услышать человека и его историю — и не подсовывает готовых ответов.
              </p>
            </div>
          </div>
          <div className="kv-wrap">
            <blockquote className="kv-quote">
              <p>
                В кабинете я больше молчу. Это не равнодушие, а место для вас: говорите вы, а я слушаю так, чтобы вы смогли
                услышать себя.
              </p>
              <footer>За пределами кабинета молчу меньше и шучу больше.</footer>
            </blockquote>
          </div>
        </section>

        <section className="kv-sec kv-sec--alt">
          <div className="kv-wrap kv-cols">
            <h2 className="kv-h2">Почему психоанализ</h2>
            <div className="kv-prose">
              <p>
                Потому что он честный. Он не учит, как жить, и не раздаёт ярлыки. Он помогает добраться до причин
                симптомов — понять, что вы на самом деле чувствуете, говорите и думаете.
              </p>
              <p>
                Это честный разговор с собой. И он всегда интересен, потому что речь о конкретном человеке — о вас.
              </p>
              <p>
                Одно я видел много раз: человек, заручившись поддержкой другого, способен изменить свою жизнь сильнее, чем
                сам от себя ожидал.
              </p>
            </div>
          </div>
        </section>

        <section className="kv-sec" id="work">
          <div className="kv-wrap kv-cols">
            <h2 className="kv-h2">С чем приходят</h2>
            <div>
              <ul className="kv-list">
                {REQUESTS.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="kv-note">
                На первую встречу можно прийти и без чёткого запроса — с ощущением, что что-то не так, или просто из
                интереса.
              </p>
            </div>
          </div>
          <div className="kv-wrap kv-cols kv-cols--gap">
            <h2 className="kv-h2">Помимо кабинета</h2>
            <div className="kv-prose">
              <p>
                Сам прохожу личный анализ — на кушетке и без неё, у разных аналитиков. Регулярно бываю на супервизиях,
                участвую в интервизиях и чтениях, веду супервизии для коллег.
              </p>
              <p>Читаю лекции о гипнотерапии и психосоматике в Академии им. Бехтерева, пишу научные статьи.</p>
            </div>
          </div>
        </section>

        <section className="kv-sec kv-sec--alt" id="education">
          <div className="kv-wrap kv-cols">
            <h2 className="kv-h2">Образование</h2>
            <div>
              <dl className="kv-edu">
                <dt>2018</dt>
                <dd>Бакалавриат, психология — КФУ им. В. И. Вернадского, кафедра глубинной психологии и психотерапии</dd>
                <dt>2020</dt>
                <dd>Магистратура, психология — КФУ им. В. И. Вернадского, кафедра глубинной психологии и психотерапии</dd>
                <dt>2020</dt>
                <dd>Клиническая психология — профессиональная переподготовка, КФУ им. В. И. Вернадского, 828 часов</dd>
                <dt>—</dt>
                <dd>Психоанализ Фрейда–Лакана — подготовка в ВЕИП</dd>
              </dl>
              <p className="kv-note">
                Также: гипнотерапия, сенсомоторный психосинтез, когнитивно-поведенческая терапия, психосоматика.
              </p>
              <Diplomas />
            </div>
          </div>
        </section>

        <section className="kv-sec" id="contact">
          <div className="kv-wrap kv-cols">
            <h2 className="kv-h2">Если захотите обратиться</h2>
            <div className="kv-prose">
              <p>
                Напишите мне в Telegram или в директ Instagram: как вас зовут, сколько вам лет, коротко — с чем хотите
                прийти и как часто вам удобно встречаться.
              </p>
              <div className="kv-links">
                <a href={TG} target="_blank" rel="noopener noreferrer">Telegram →</a>
                <a href={IG} target="_blank" rel="noopener noreferrer">Instagram →</a>
                <a href={VK} target="_blank" rel="noopener noreferrer">ВКонтакте →</a>
              </div>
              <dl className="kv-facts">
                <dt>Сессия</dt>
                <dd>50 минут · 5 000 ₽ или 70 $</dd>
                <dt>Где</dt>
                <dd>
                  Москва, ул. Кравченко, 11, м. Проспект Вернадского ·{" "}
                  <a href={MAP} target="_blank" rel="noopener noreferrer">на карте</a>
                  <br />
                  или онлайн, в любом мессенджере
                </dd>
                <dt>Коллегам</dt>
                <dd>Супервизия онлайн · 4 000 ₽ или 60 $</dd>
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="kv-foot">
        <div className="kv-wrap kv-foot__grid">
          <p>© 2026 Александр Карачинцев</p>
          <p className="kv-foot__links">
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
    </div>
  );
}
