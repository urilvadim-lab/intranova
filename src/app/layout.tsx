import type { Metadata, Viewport } from "next";
// Шрифты лежат на нашем хостинге: Google Fonts из РФ работает нестабильно.
import "@fontsource/unbounded/500.css";
import "@fontsource/onest/400.css";
import "@fontsource/onest/500.css";
import "@fontsource/onest/600.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://intranova.ru"),
  title: "Интенсив практической работы с психосоматикой · 6 декабря, Москва · INTRANOVA",
  description:
    "Однодневный интенсив: работа с телесными симптомами, эмоциональным напряжением и психологическим компонентом заболеваний. Психологические и гипнотические методы, небольшая группа. Алина Комиссарова, Александр Карачинцев, Марк Орлов. 6 декабря, 11:00–18:00, Москва.",
  openGraph: {
    title: "Интенсив практической работы с психосоматикой · 6 декабря, Москва",
    description: "Работа с телесными симптомами, эмоциональным напряжением и психологическим компонентом заболеваний. Небольшая группа.",
    locale: "ru_RU",
    type: "website",
    url: "https://intranova.ru",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f1024",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
