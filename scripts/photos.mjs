// Приводит портреты спикеров к единому виду: кадр 4:5, лицо на одной высоте,
// нейтральный монохром. Плюс квадратные аватарки для первого экрана.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "D:/Claude files/Site";
const OUT = "public/speakers";
mkdirSync(OUT, { recursive: true });

// Кадр подобран так, чтобы глаза были примерно на 20% высоты кадра.
// avatar — квадрат вокруг лица в координатах готового кадра 960×1200.
const photos = [
  { file: "Алина.jpg", out: "alina", crop: { left: 0, top: 30, width: 976, height: 1220 }, gain: 0.86, avatar: { left: 200, top: 40, width: 480, height: 480 } },
  { file: "Александр .PNG", out: "alexander", crop: { left: 250, top: 230, width: 960, height: 1200 }, gain: 1.08, avatar: { left: 240, top: 10, width: 480, height: 480 } },
  { file: "Марк.PNG", out: "mark", crop: { left: 40, top: 90, width: 1200, height: 1500 }, gain: 1.0, avatar: { left: 290, top: 20, width: 480, height: 480 } },
];

for (const p of photos) {
  const frame = await sharp(`${SRC}/${p.file}`)
    .extract(p.crop)
    .resize(960, 1200)
    .grayscale()
    .normalise({ lower: 1, upper: 99 })
    .linear(p.gain * 1.06, -8)
    .toBuffer();

  await sharp(frame).webp({ quality: 82 }).toFile(`${OUT}/${p.out}.webp`);
  await sharp(frame).resize(480, 600).webp({ quality: 80 }).toFile(`${OUT}/${p.out}-sm.webp`);
  await sharp(frame).extract(p.avatar).resize(240, 240).webp({ quality: 82 }).toFile(`${OUT}/${p.out}-avatar.webp`);
  console.log("ok", p.out);
}
