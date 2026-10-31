import type { Metadata, Viewport } from "next";
import KFinal from "@/components/karachinsev/KFinal";

export const metadata: Metadata = {
  title: "Александр Карачинцев — психоаналитик и клинический психолог · Москва и онлайн",
  description:
    "Психоаналитик, клинический психолог. Практика с 2018 года. Взрослые и подростки. Сессии очно в Москве (м. Проспект Вернадского) и онлайн.",
  openGraph: {
    title: "Александр Карачинцев — психоаналитик",
    description: "Психоаналитик, клинический психолог. Москва и онлайн.",
    locale: "ru_RU",
    type: "profile",
    url: "https://intranova.ru/karachinsev/",
  },
};

export const viewport: Viewport = { themeColor: "#17181b" };

export default function Karachinsev() {
  return <KFinal />;
}
