// =============================================
// Филипп: побег на дачу — основной код игры
// =============================================

// ---------- Холст ----------
const W = 240;   // ширина игрового экрана в пикселях
const H = 136;   // высота игрового экрана в пикселях

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Увеличиваем холст под экран в ЦЕЛОЕ число раз,
// чтобы все пиксели были одинакового размера.
function resize() {
  const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
  canvas.style.width = W * scale + 'px';
  canvas.style.height = H * scale + 'px';
}
window.addEventListener('resize', resize);
resize();

// ---------- Уровень ----------
const LEVEL_W = 720;   // ширина уровня — 3 экрана

// Пол и платформы: x, y — левый верхний угол, w, h — ширина и высота
const solids = [
  { x: 0,   y: 120, w: LEVEL_W, h: 16 },  // пол
  { x: 60,  y: 96,  w: 40, h: 6 },
  { x: 130, y: 76,  w: 36, h: 6 },
  { x: 200, y: 56,  w: 44, h: 6 },
  { x: 290, y: 90,  w: 50, h: 6 },
  { x: 380, y: 66,  w: 32, h: 6 },
  { x: 450, y: 44,  w: 40, h: 6 },
  { x: 540, y: 84,  w: 56, h: 6 },
  { x: 630, y: 100, w: 40, h: 6 },
];

// ---------- Герой ----------
const player = {
  x: 20, y: 104,   // позиция (левый верхний угол)
  w: 10, h: 16,    // размер
  vx: 0, vy: 0,    // скорость по x и y
  onGround: false, // стоит ли на земле
};

// Настройки движения (подбираются на глаз)
const ACCEL = 0.15;      // разгон за один шаг
const FRICTION = 0.2;    // торможение, когда кнопки отпущены
const MAX_SPEED = 1.5;   // максимальная скорость бега
const GRAVITY = 0.2;     // сила тяжести
const JUMP_SPEED = 4;    // начальная скорость прыжка
const MAX_FALL = 4;      // максимальная скорость падения

// ---------- Камера ----------
let cameraX = 0;

// ---------- Управление ----------
// Здесь храним, какие кнопки сейчас зажаты
const keys = { left: false, right: false, jump: false };
// Отдельно — кнопки с клавиатуры и с экрана, потом объединяем
const kb = { left: false, right: false, jump: false };
const touch = { left: false, right: false, jump: false };

// Какая клавиша за что отвечает
const keyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyZ: 'jump',
  Space: 'jump',
  ArrowUp: 'jump',
};

window.addEventListener('keydown', (e) => {
  const action = keyMap[e.code];
  if (action) {
    kb[action] = true;
    e.preventDefault(); // чтобы пробел и стрелки не прокручивали страницу
  }
});
window.addEventListener('keyup', (e) => {
  const action = keyMap[e.code];
  if (action) kb[action] = false;
});

// Экранные кнопки. При каждом касании смотрим, какие пальцы
// сейчас лежат на каких кнопках. Так работает мультитач
// и можно вести палец с ← на →.
const buttons = document.querySelectorAll('.btn');

function updateTouches(e) {
  e.preventDefault();
  touch.left = touch.right = touch.jump = false;
  for (const t of e.touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && el.dataset && el.dataset.btn) {
      touch[el.dataset.btn] = true;
    }
  }
  // Подсвечиваем нажатые кнопки
  buttons.forEach((b) => b.classList.toggle('pressed', touch[b.dataset.btn]));
}
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((type) => {
  document.addEventListener(type, updateTouches, { passive: false });
});

// Запрещаем жесты масштабирования в Safari
document.addEventListener('gesturestart', (e) => e.preventDefault());

// ---------- Столкновения ----------
// Пересекаются ли два прямоугольника
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// ---------- Обновление (60 раз в секунду) ----------
let jumpWasPressed = false; // была ли кнопка прыжка нажата в прошлом шаге

function update() {
  // Объединяем клавиатуру и экранные кнопки
  keys.left = kb.left || touch.left;
  keys.right = kb.right || touch.right;
  keys.jump = kb.jump || touch.jump;

  // Бег: разгон в сторону нажатой кнопки
  let dir = 0;
  if (keys.left) dir -= 1;
  if (keys.right) dir += 1;

  if (dir !== 0) {
    player.vx += dir * ACCEL;
    if (player.vx > MAX_SPEED) player.vx = MAX_SPEED;
    if (player.vx < -MAX_SPEED) player.vx = -MAX_SPEED;
  } else {
    // Торможение: плавно уменьшаем скорость до нуля
    if (player.vx > 0) player.vx = Math.max(0, player.vx - FRICTION);
    if (player.vx < 0) player.vx = Math.min(0, player.vx + FRICTION);
  }

  // Прыжок: только с земли и только в момент нажатия
  if (keys.jump && !jumpWasPressed && player.onGround) {
    player.vy = -JUMP_SPEED;
    player.onGround = false;
  }
  // Отпустили прыжок, пока летим вверх — прыжок получается ниже
  if (!keys.jump && player.vy < -1) {
    player.vy = -1;
  }
  jumpWasPressed = keys.jump;

  // Гравитация
  player.vy += GRAVITY;
  if (player.vy > MAX_FALL) player.vy = MAX_FALL;

  // Двигаем по X и выталкиваем из стен
  player.x += player.vx;
  for (const s of solids) {
    if (overlaps(player, s)) {
      if (player.vx > 0) player.x = s.x - player.w;
      else if (player.vx < 0) player.x = s.x + s.w;
      player.vx = 0;
    }
  }

  // Не даём уйти за края уровня
  if (player.x < 0) { player.x = 0; player.vx = 0; }
  if (player.x > LEVEL_W - player.w) { player.x = LEVEL_W - player.w; player.vx = 0; }

  // Двигаем по Y и выталкиваем из пола/потолка
  player.y += player.vy;
  player.onGround = false;
  for (const s of solids) {
    if (overlaps(player, s)) {
      if (player.vy > 0) {        // падали вниз — встали на платформу
        player.y = s.y - player.h;
        player.onGround = true;
      } else if (player.vy < 0) { // летели вверх — ударились головой
        player.y = s.y + s.h;
      }
      player.vy = 0;
    }
  }

  // Камера плавно догоняет героя, держа его в центре экрана
  const target = player.x + player.w / 2 - W / 2;
  cameraX += (target - cameraX) * 0.1;
  // Камера не выходит за края уровня
  cameraX = Math.max(0, Math.min(LEVEL_W - W, cameraX));
}

// ---------- Рисование ----------
function draw() {
  const cam = Math.round(cameraX); // целые пиксели — без размытия

  // Небо
  ctx.fillStyle = '#41a6f6';
  ctx.fillRect(0, 0, W, H);

  // Пол и платформы
  ctx.fillStyle = '#566c86';
  for (const s of solids) {
    ctx.fillRect(s.x - cam, s.y, s.w, s.h);
  }

  // Филипп
  ctx.fillStyle = '#ef7d57';
  ctx.fillRect(Math.round(player.x) - cam, Math.round(player.y), player.w, player.h);

  // Версия в углу
  ctx.fillStyle = '#f4f4f4';
  ctx.font = '8px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText('v0.1', 2, 2);
}

// ---------- Игровой цикл ----------
// Логика всегда обновляется 60 раз в секунду, даже если
// экран рисует кадры чаще или реже (фиксированный шаг).
const STEP = 1000 / 60;  // длина одного шага в миллисекундах
let lastTime = performance.now();
let accumulator = 0;     // сколько времени накопилось на обновления

function loop(now) {
  accumulator += now - lastTime;
  lastTime = now;
  // Если вкладка была скрыта, не пытаемся догнать всё сразу
  if (accumulator > 250) accumulator = 250;

  while (accumulator >= STEP) {
    update();
    accumulator -= STEP;
  }
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
