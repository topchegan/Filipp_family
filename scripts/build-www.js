// =============================================
// СБОРКА ПАПКИ www ДЛЯ ANDROID-ПРИЛОЖЕНИЯ (Capacitor)
// =============================================
// Запуск: npm run build  (или node scripts/build-www.js)
// Копирует файлы игры из корня репозитория в папку www — её Capacitor кладёт внутрь APK.
// Сайт на GitHub Pages работает как раньше, прямо из корня: папка www нужна только приложению
// и в репозиторий не попадает (она в .gitignore).
// Копируем ВСЁ из корня, кроме списка ниже. Поэтому новый файл игры (js, css, картинка)
// попадёт в приложение сам — дописывать его сюда не нужно.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'www');

// Что НЕ нужно внутри приложения
const SKIP = new Set([
  '.git', '.github', '.gitignore', 'node_modules', 'android', 'www', 'scripts', 'docs',
  'package.json', 'package-lock.json', 'capacitor.config.json',
  'README.md', 'CLAUDE.md',
  'sw.js',          // офлайн-режим нужен только сайту: в приложении файлы и так внутри
  'sprites.html',   // витрина спрайтов — для разработки
]);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
let count = 0;
for (const name of fs.readdirSync(ROOT)) {
  if (SKIP.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
  count++;
}

// Номер версии — для проверки в журнале сборки
const version = fs.readFileSync(path.join(ROOT, 'version.js'), 'utf8').match(/VERSION = '(v[0-9.]+)'/)[1];
console.log('Папка www готова: ' + count + ' файлов и папок, версия игры ' + version);
