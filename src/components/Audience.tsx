import { AUDIENCE } from "@/content";
import Icon from "./Icon";
import { Reveal } from "./Reveal";

/** Кому подойдёт интенсив — тёмная плашка внутри блока «С чем можно прийти». */
export default function Audience() {
  return (
    <div id="audience" className="audience-wrap">
      <Reveal className="audience">
        <h3 className="h3 audience__title">Интенсив подойдёт, если вы</h3>
        <ul className="audience__list">
          {AUDIENCE.map((a) => (
            <li key={a}>
              <Icon name="check" size={18} />
              {a}
            </li>
          ))}
        </ul>
      </Reveal>
    </div>
  );
}
