import type { Metadata, Viewport } from "next";
// Шрифты лежат на нашем хостинге: Google Fonts из РФ работает нестабильно.
import "@fontsource/unbounded/500.css";
import "@fontsource/onest/400.css";
import "@fontsource/onest/500.css";
import "@fontsource/onest/600.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://intranova.ru"),
  title: "Интенсив по работе с психосоматикой · 6 декабря, Москва · INTRANOVA",
  description:
    "Однодневный интенсив по психосоматике: телесные реакции, дискомфортные чувства, невербальная коммуникация, особые состояния сознания. Алина Комиссарова, Александр Карачинцев, Марк Орлов. 6 декабря, 12:00–18:00, Москва.",
  openGraph: {
    title: "Интенсив по работе с психосоматикой · 6 декабря, Москва",
    description: "Современная психосоматика, телесные техники и глубокая работа с особыми состояниями сознания.",
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
