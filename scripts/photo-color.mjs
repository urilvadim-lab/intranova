// Цветное фото Александра для страницы /karachinsev: тот же кадр, естественный тёплый цвет.
import sharp from "sharp";

const src = "D:/Claude files/Site/Александр .PNG";
const base = sharp(src).extract({ left: 250, top: 230, width: 960, height: 1200 }).resize(960, 1200).modulate({ saturation: 0.92, brightness: 1.04 });
await base.clone().webp({ quality: 84 }).toFile("public/karachinsev/alexander.webp");
await base.clone().resize(520, 650).webp({ quality: 80 }).toFile("public/karachinsev/alexander-sm.webp");
// широкий кадр для варианта «Минимализм» — из оригинала, без увеличения
await sharp(src).extract({ left: 0, top: 120, width: 1706, height: 1137 }).resize(1600, 1067).modulate({ saturation: 0.92, brightness: 1.04 }).webp({ quality: 82 }).toFile("public/karachinsev/alexander-wide.webp");
console.log("ok");
