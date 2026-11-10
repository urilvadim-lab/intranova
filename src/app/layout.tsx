import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { CONTACTS, EVENT, METRIKA_ID, PRICES, SPEAKERS } from "@/content";
// Шрифты лежат на нашем хостинге: Google Fonts из РФ работает нестабильно.
import "@fontsource/unbounded/500.css";
import "@fontsource/onest/400.css";
import "@fontsource/onest/500.css";
import "@fontsource/onest/600.css";
import "./globals.css";

const SITE = "https://intranova.ru";
const TITLE = "INTRANOVA — интенсив практической работы с психосоматикой и внутренним состоянием · 6 декабря, Москва";
const DESCRIPTION =
  "Однодневный интенсив INTRANOVA: практическая работа с психосоматикой, тревогой, эмоциональным напряжением и внутренним состоянием. Психологические, телесные и гипнотические методы, небольшая группа. 6 декабря, 12:00–18:00, Москва.";
const OG_DESCRIPTION =
  "Психосоматика, тревога, эмоциональное напряжение, внутреннее состояние. Три специалиста — единое пространство практической работы. 6 декабря, Москва.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "INTRANOVA — интенсив практической работы с психосоматикой и внутренним состоянием",
    description: OG_DESCRIPTION,
    locale: "ru_RU",
    type: "website",
    url: SITE,
    siteName: "INTRANOVA",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "INTRANOVA — интенсив практической работы с психосоматикой" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "INTRANOVA — интенсив практической работы с психосоматикой и внутренним состоянием",
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1024",
};

const eventLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: `INTRANOVA — ${EVENT.title}`,
  description: DESCRIPTION,
  startDate: EVENT.startsAt,
  endDate: EVENT.endsAt,
  eventStatus: "https://schema.org/EventScheduled",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  inLanguage: "ru",
  image: [`${SITE}/og.png`],
  url: SITE,
  location: {
    "@type": "Place",
    name: "Площадка в Москве (адрес сообщается после записи)",
    address: { "@type": "PostalAddress", addressLocality: EVENT.city, addressCountry: "RU" },
  },
  organizer: { "@type": "Organization", name: "INTRANOVA", url: SITE, telephone: CONTACTS.phoneTel, email: CONTACTS.email },
  performer: SPEAKERS.map((s) => ({ "@type": "Person", name: s.name, jobTitle: s.role })),
  offers: PRICES.map((p) => ({
    "@type": "Offer",
    name: p.name,
    price: p.price.replace(/\D/g, ""),
    priceCurrency: "RUB",
    availability: "https://schema.org/InStock",
    url: `${SITE}/#signup`,
  })),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }} />
        <Script id="yandex-metrika" strategy="afterInteractive">
          {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}','ym');ym(${METRIKA_ID},'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`}
        </Script>
        <noscript>
          <div>
            <img src={`https://mc.yandex.ru/watch/${METRIKA_ID}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
          </div>
        </noscript>
      </body>
    </html>
  );
}
