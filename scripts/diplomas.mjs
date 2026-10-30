// Дипломы для страницы /karachinsev: большая версия для просмотра и превью.
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SRC = "D:/Claude files/Site/karachinsec";
const OUT = "public/karachinsev";
mkdirSync(OUT, { recursive: true });

const files = [
  ["IMG_9974.JPG", "diploma-bachelor"],
  ["IMG_9973.JPG", "diploma-master"],
  ["IMG_9975.JPG", "diploma-clinical"],
];
for (const [file, name] of files) {
  const img = sharp(`${SRC}/${file}`).rotate();
  await img.clone().resize({ width: 1400, withoutEnlargement: true }).webp({ quality: 80 }).toFile(`${OUT}/${name}.webp`);
  await img.clone().resize({ width: 520 }).webp({ quality: 74 }).toFile(`${OUT}/${name}-sm.webp`);
  console.log("ok", name);
}
