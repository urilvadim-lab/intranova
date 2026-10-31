// Дипломы для страницы /karachinsev: обрезка по краю документа (без пола), большая версия для просмотра и превью.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "D:/Claude files/Site/karachinsec";
const OUT = "public/karachinsev";
mkdirSync(OUT, { recursive: true });

// рамка документа в долях кадра: [x0, y0, x1, y1]
const files = [
  ["IMG_9974.JPG", "diploma-bachelor", [0.05, 0.065, 0.965, 0.93]],
  ["IMG_9973.JPG", "diploma-master", [0.05, 0.075, 0.968, 0.975]],
  ["IMG_9975.JPG", "diploma-clinical", [0.045, 0.135, 0.948, 0.98]],
];
for (const [file, name, [x0, y0, x1, y1]] of files) {
  const buf = await sharp(`${SRC}/${file}`).rotate().toBuffer();
  const { width, height } = await sharp(buf).metadata();
  const img = sharp(buf)
    .extract({
      left: Math.round(x0 * width),
      top: Math.round(y0 * height),
      width: Math.round((x1 - x0) * width),
      height: Math.round((y1 - y0) * height),
    })
    .modulate({ brightness: 1.06, saturation: 0.92 });
  await img.clone().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${OUT}/${name}.webp`);
  await img.clone().resize({ width: 520 }).webp({ quality: 76 }).toFile(`${OUT}/${name}-sm.webp`);
  console.log("ok", name);
}
