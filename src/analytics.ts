import { METRIKA_ID } from "@/content";

type Ym = (id: number, action: string, goal?: string) => void;

/** Цели Яндекс.Метрики. Счётчик подключён один раз в layout.tsx; здесь только вызов целей. */
export type Goal = "signup_click" | "signup_submit" | "telegram_click" | "max_click" | "phone_click" | "email_click";

export function track(goal: Goal) {
  try {
    const ym = (window as unknown as { ym?: Ym }).ym;
    if (ym) ym(METRIKA_ID, "reachGoal", goal);
  } catch {
    /* аналитика не должна ломать сайт */
  }
}
