// =============================================
// Филипп: побег на дачу — основной код игры
// =============================================
//
// Игра состоит из «экранов» (состояний): ТИТУЛ → ЗАСТАВКА → УРОВЕНЬ.
// Каждый экран — объект с тремя функциями:
//   enter()        — вызывается один раз, когда экран включается
//   update(input)  — логика, 60 раз в секунду
//   draw()         — рисование
// Переключает экраны функция setState().

const VERSION = 'v0.3';

// ---------- Холст ----------
const W = 240;   // ширина игрового экрана в пикселях
const H = 136;   // высота игрового экрана в пикселях

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false; // при увеличении картинок пиксели остаются чёткими

// Увеличиваем холст под экран в ЦЕЛОЕ число раз,
// чтобы все пиксели были одинакового размера.
function resize() {
  const scale = Math.max(1, Math.floor(Math.min(window.innerWidth / W, window.innerHeight / H)));
  canvas.style.width = W * scale + 'px';
  canvas.style.height = H * scale + 'px';
}
window.addEventListener('resize', resize);
resize();

// =============================================
// ЗВУК (Web Audio)
// =============================================
// На iPad звук можно включить только после касания экрана.
// Поэтому при каждом касании или нажатии вызываем unlockAudio().
let audioCtx = null;

function unlockAudio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;               // браузер совсем без звука
    audioCtx = new AC();
    // Старым iPad нужно «проиграть» тишину, чтобы звук разрешился
    const silence = audioCtx.createBuffer(1, 1, 22050);
    const src = audioCtx.createBufferSource();
    src.buffer = silence;
    src.connect(audioCtx.destination);
    src.start(0);
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

// Один короткий звук квадратной волной (как на Денди).
//   freq — высота в герцах, start — когда начать (секунды), dur — длительность
function tone(freq, start, dur, volume) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.linearRampToValueAtTime(0, start + dur); // плавно затихает, без щелчка
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(start);
  osc.stop(start + dur);
}

// Писк одной буквы в диалоге
function beep(freq) {
  if (!audioCtx) return;
  tone(freq, audioCtx.currentTime, 0.04, 0.05);
}

// Звонок телефона: «ДЗЫНЬ-ДЗЫНЬ» — две трели из быстро чередующихся нот
function phoneRing() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  for (const burst of [0, 0.6]) {
    for (let i = 0; i < 14; i++) {
      tone(i % 2 ? 1300 : 1600, t0 + burst + i * 0.03, 0.03, 0.04);
    }
  }
}

// =============================================
// УПРАВЛЕНИЕ
// =============================================
// Здесь храним, какие кнопки сейчас зажаты
const keys = { left: false, right: false, jump: false };
// Отдельно — кнопки с клавиатуры и с экрана, потом объединяем
const kb = { left: false, right: false, jump: false };
const touch = { left: false, right: false, jump: false };
// Касания и клики по самому экрану (не по кнопкам). Координаты — в пикселях игры.
let taps = [];
// Нажали ли «Прыжок» с прошлого шага. Запоминаем сразу в момент нажатия,
// чтобы даже очень короткое нажатие не потерялось.
let jumpHit = false;

// Какая клавиша за что отвечает
const keyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyZ: 'jump',
  Space: 'jump',
  ArrowUp: 'jump',
};

window.addEventListener('keydown', (e) => {
  unlockAudio();
  const action = keyMap[e.code];
  if (action) {
    if (action === 'jump' && !e.repeat) jumpHit = true; // repeat — это автоповтор при удержании
    kb[action] = true;
    e.preventDefault(); // чтобы пробел и стрелки не прокручивали страницу
  }
});
window.addEventListener('keyup', (e) => {
  const action = keyMap[e.code];
  if (action) kb[action] = false;
});

// Переводит точку на экране устройства в пиксели игры (0–240, 0–136)
function toGameCoords(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (clientX - r.left) / r.width * W,
    y: (clientY - r.top) / r.height * H,
  };
}

// Экранные кнопки. При каждом касании смотрим, какие пальцы
// сейчас лежат на каких кнопках. Так работает мультитач
// и можно вести палец с ← на →.
const buttons = document.querySelectorAll('.btn');

function updateTouches(e) {
  e.preventDefault();
  unlockAudio();
  touch.left = touch.right = touch.jump = false;
  for (const t of e.touches) {
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (el && el.dataset && el.dataset.btn) {
      touch[el.dataset.btn] = true;
    }
  }
  // Новый палец: на кнопке «Прыжок» — запоминаем прыжок, мимо кнопок — касание экрана
  if (e.type === 'touchstart') {
    for (const t of e.changedTouches) {
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const btn = el && el.dataset ? el.dataset.btn : undefined;
      if (btn === 'jump') jumpHit = true;
      else if (!btn) taps.push(toGameCoords(t.clientX, t.clientY));
    }
  }
  // Подсвечиваем нажатые кнопки
  buttons.forEach((b) => b.classList.toggle('pressed', touch[b.dataset.btn]));
}
['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((type) => {
  document.addEventListener(type, updateTouches, { passive: false });
});

// Клик мышкой (на компьютере) — тоже касание экрана
window.addEventListener('mousedown', (e) => {
  unlockAudio();
  taps.push(toGameCoords(e.clientX, e.clientY));
});

// Запрещаем жесты масштабирования в Safari
document.addEventListener('gesturestart', (e) => e.preventDefault());

// =============================================
// ОБЩИЕ РИСОВАЛКИ
// =============================================

// Текст с тенью: сначала тёмная копия на 1 пиксель ниже и правее, потом сам текст
function drawTextShadow(text, x, y, color, shadow, scale) {
  const s = scale || 1;
  drawText(ctx, text, x + s, y + s, shadow, 0, { scale: s });
  drawText(ctx, text, x, y, color, 0, { scale: s });
}

function drawTextCenteredShadow(text, centerX, y, color, shadow, scale) {
  const s = scale || 1;
  drawTextCentered(ctx, text, centerX + s, y + s, shadow, s);
  drawTextCentered(ctx, text, centerX, y, color, s);
}

// Номер версии в левом верхнем углу
function drawVersion() {
  drawTextShadow(VERSION, 2, 2, '#f4f4f4', '#1a1c2c');
}

// Закрашенный пиксельный круг
function fillCircle(cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(cx - half, cy + y, half * 2 + 1, 1);
  }
}

// Пиксельная линия от точки (x0, y0) до (x1, y1)
function drawLine(x0, y0, x1, y1, color) {
  ctx.fillStyle = color;
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(x0 + (x1 - x0) * i / steps);
    const y = Math.round(y0 + (y1 - y0) * i / steps);
    ctx.fillRect(x, y, 1, 1);
  }
}

// =============================================
// ЭКРАН 1: ТИТУЛ
// =============================================
const titleState = {
  timer: 0,
  silhouette: null,

  enter() {
    this.timer = 0;
    // Силуэт Филиппа в беге (готовим один раз)
    if (!this.silhouette) {
      this.silhouette = makeSilhouette(SPRITES.filipp.anims.run.frames[0], '#1a1c2c');
    }
  },

  update(input) {
    this.timer++;
    // Любое касание или «Прыжок» — начинаем. Звук уже разрешён этим же касанием.
    if (input.pressed) setState('cutscene', 'intro');
  },

  draw() {
    // Небо полосами: сверху тёмное, ниже светлее
    const bands = ['#29366f', '#3b5dc9', '#41a6f6', '#73eff7'];
    bands.forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, i * 28, W, 28);
    });
    // Солнце за спиной героя
    fillCircle(120, 94, 24, '#ffcd75');
    fillCircle(120, 94, 18, '#f4f4f4');
    // Земля
    ctx.fillStyle = '#38b764';
    ctx.fillRect(0, 110, W, 3);
    ctx.fillStyle = '#257179';
    ctx.fillRect(0, 113, W, H - 113);

    // Силуэт Филиппа, увеличенный в 2 раза (32x48), стоит на земле
    ctx.drawImage(this.silhouette, 104, 62, 32, 48);

    // Название крупными буквами
    drawTextCenteredShadow('ФИЛИПП:', 120, 8, '#ffcd75', '#b13e53', 2);
    drawTextCenteredShadow('ПОБЕГ НА ДАЧУ', 120, 28, '#f4f4f4', '#1a1c2c', 2);

    // Мигающая надпись: полсекунды видна, полсекунды нет
    if (Math.floor(this.timer / 30) % 2 === 0) {
      drawTextCenteredShadow('НАЖМИ, ЧТОБЫ НАЧАТЬ', 120, 120, '#f4f4f4', '#1a1c2c');
    }
    drawVersion();
  },
};

// =============================================
// ЭКРАН 2: ЗАСТАВКА (движок диалогов)
// =============================================

const FLOOR_Y = 86;        // на этой высоте стоят ноги персонажей на фоне
const TYPE_SPEED = 2;      // через сколько шагов печатается следующая буква
const BLINK_TIME = 40;     // сколько шагов персонаж мигает при появлении и уходе

// Окно диалога и его части (в пикселях игры)
const BOX = { x: 2, y: 88, w: 236, h: 46 };
const PORTRAIT_X = 7, PORTRAIT_Y = 94;   // где портрет 32x32
const TEXT_X = 46, TEXT_Y = 104;         // где начинается текст реплики
const TEXT_W = 180;                      // ширина текста — 30 букв в строке
const TEXT_MAX_LINES = 3;                // в окно влезает 3 строки

// Кнопка «ПРОПУСТИТЬ» в правом верхнем углу
const SKIP = { x: 174, y: 2, w: 64, h: 11 };

// Попал ли тап в кнопку «ПРОПУСТИТЬ» (зону делаем чуть больше кнопки — для пальца)
function tapOnSkip(t) {
  return t.x >= SKIP.x - 6 && t.y <= SKIP.y + SKIP.h + 6;
}

const cutsceneState = {
  scene: null,    // текущий сценарий из scenes.js
  index: 0,       // номер текущего шага
  step: null,     // сам текущий шаг
  timer: 0,       // сколько шагов игры длится текущий шаг сценария
  tick: 0,        // общий счётчик для анимаций
  actors: {},     // кто стоит на фоне
  lines: [],      // строки текущей реплики
  fullText: '',   // все буквы реплики подряд
  typed: 0,       // сколько букв уже напечатано

  enter(sceneName) {
    this.scene = SCENES[sceneName];
    this.tick = 0;
    // Копируем персонажей из сценария, чтобы не испортить сам сценарий
    this.actors = {};
    for (const key in this.scene.actors) {
      const a = this.scene.actors[key];
      this.actors[key] = { x: a.x, visible: a.visible, facing: a.facing, blinking: false };
    }
    this.index = -1;
    this.nextStep();
  },

  // Переходим к следующему шагу сценария
  nextStep() {
    this.index++;
    if (this.index >= this.scene.steps.length) {
      this.finish();
      return;
    }
    const step = this.scene.steps[this.index];
    this.step = step;
    this.timer = 0;

    if (step.type === 'say') {
      this.lines = wrapText(step.text, TEXT_W);
      this.fullText = this.lines.join('');
      this.typed = 0;
      if (this.lines.length > TEXT_MAX_LINES) {
        console.warn('Реплика не влезает в окно, раздели её на две: ' + step.text);
      }
    } else if (step.type === 'phone') {
      phoneRing();
    } else if (step.type === 'enter' || step.type === 'leave') {
      const actor = this.actors[step.who];
      actor.visible = true;
      actor.blinking = true;
    }
  },

  // Заставка закончилась — запускаем следующий экран
  finish() {
    setState(this.scene.next || 'level');
  },

  update(input) {
    this.tick++;
    this.timer++;

    // Кнопка «ПРОПУСТИТЬ»
    if (input.taps.some(tapOnSkip)) {
      this.finish();
      return;
    }
    const pressed = input.pressed;
    const step = this.step;

    if (step.type === 'say') {
      const speaker = SPEAKERS[step.who];
      if (this.typed < this.fullText.length) {
        // Текст ещё печатается
        if (pressed) {
          this.typed = this.fullText.length;          // показать целиком
        } else if (this.timer % TYPE_SPEED === 0) {
          const ch = this.fullText[this.typed];
          this.typed++;
          if (ch !== ' ') beep(speaker.pitch);        // писк на каждую букву
        }
      } else if (pressed) {
        this.nextStep();                              // допечатан — дальше
      }
    } else if (step.type === 'title') {
      // Титр ждёт нажатия (первые 20 шагов нажатие не считаем, чтобы не пролистнуть случайно)
      if (pressed && this.timer > 20) this.nextStep();
    } else if (step.type === 'phone') {
      // Телефон звонит полторы секунды или до нажатия
      if (this.timer >= 100 || (pressed && this.timer > 20)) this.nextStep();
    } else if (step.type === 'enter' || step.type === 'leave') {
      // Персонаж мигает, потом остаётся или исчезает
      if (this.timer >= BLINK_TIME) {
        const actor = this.actors[step.who];
        actor.blinking = false;
        if (step.type === 'leave') actor.visible = false;
        this.nextStep();
      }
    }
  },

  draw() {
    const step = this.step;

    if (step.type === 'title') {
      this.drawTitleCard(step.text);
    } else {
      BACKGROUNDS[this.scene.background]();
      this.drawActors();
      if (step.type === 'phone') this.drawPhone();
      if (step.type === 'say') this.drawDialog(step);
    }

    this.drawSkipButton();
    drawVersion();
  },

  // Персонажи на фоне — обычными игровыми спрайтами
  drawActors() {
    for (const key in this.actors) {
      const a = this.actors[key];
      if (!a.visible) continue;
      // Мигание: через каждые 4 шага персонаж то виден, то нет
      if (a.blinking && Math.floor(this.timer / 4) % 2 === 1) continue;
      const anim = SPRITES[key].anims.idle;
      const frame = anim.frames[Math.floor(this.tick / anim.speed) % anim.frames.length];
      drawSprite(ctx, frame, a.x, FLOOR_Y - frame.height, a.facing === 'left');
    }
  },

  // Звонящий телефон над Филиппом
  drawPhone() {
    const f = this.actors.filipp;
    const shake = (this.timer >> 1) % 2;            // трясётся на 1 пиксель
    const px = f.x + 14 + shake;
    const py = FLOOR_Y - 40;
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(px, py, 7, 11);                     // корпус
    ctx.fillStyle = (this.timer >> 3) % 2 ? '#73eff7' : '#f4f4f4';
    ctx.fillRect(px + 1, py + 1, 5, 7);              // мигающий экран
    drawTextCenteredShadow('ДЗЫНЬ-ДЗЫНЬ!', 120 + shake, 18, '#ffcd75', '#1a1c2c', 2);
  },

  // Окно диалога: рамка, портрет, имя, текст, стрелка
  drawDialog(step) {
    const speaker = SPEAKERS[step.who];

    // Тёмный фон и рамка в 2 цвета
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(BOX.x, BOX.y, BOX.w, BOX.h);
    ctx.fillStyle = '#f4f4f4';                       // внешняя рамка — белая
    ctx.fillRect(BOX.x, BOX.y, BOX.w, 1);
    ctx.fillRect(BOX.x, BOX.y + BOX.h - 1, BOX.w, 1);
    ctx.fillRect(BOX.x, BOX.y, 1, BOX.h);
    ctx.fillRect(BOX.x + BOX.w - 1, BOX.y, 1, BOX.h);
    ctx.fillStyle = '#3b5dc9';                       // внутренняя рамка — синяя
    ctx.fillRect(BOX.x + 1, BOX.y + 1, BOX.w - 2, 1);
    ctx.fillRect(BOX.x + 1, BOX.y + BOX.h - 2, BOX.w - 2, 1);
    ctx.fillRect(BOX.x + 1, BOX.y + 1, 1, BOX.h - 2);
    ctx.fillRect(BOX.x + BOX.w - 2, BOX.y + 1, 1, BOX.h - 2);

    // Портрет в рамке
    ctx.fillStyle = '#94b0c2';
    ctx.fillRect(PORTRAIT_X - 1, PORTRAIT_Y - 1, 34, 34);
    ctx.fillStyle = '#333c57';
    ctx.fillRect(PORTRAIT_X, PORTRAIT_Y, 32, 32);
    ctx.drawImage(PORTRAITS[speaker.portrait].image, PORTRAIT_X, PORTRAIT_Y);

    // Имя над текстом
    drawText(ctx, step.name || speaker.name, TEXT_X, PORTRAIT_Y, '#ffcd75');

    // Текст: показываем только напечатанные буквы
    drawText(ctx, step.text, TEXT_X, TEXT_Y, '#f4f4f4', TEXT_W, { maxChars: this.typed });

    // Реплика допечатана — мигает стрелка ▼
    if (this.typed >= this.fullText.length && Math.floor(this.tick / 20) % 2 === 0) {
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(228, 126, 5, 1);
      ctx.fillRect(229, 127, 3, 1);
      ctx.fillRect(230, 128, 1, 1);
    }
  },

  // Титр на весь экран: часы и надпись
  drawTitleCard(text) {
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(0, 0, W, H);

    // Если в тексте есть время (например 09:30) — рисуем часы с этим временем
    const time = text.match(/(\d{1,2}):(\d{2})/);
    if (time) drawClock(120, 50, 16, Number(time[1]), Number(time[2]));

    // Крупно, если влезает, иначе обычным размером
    const scale = textWidth(text) * 2 <= W - 8 ? 2 : 1;
    drawTextCentered(ctx, text, 120, 80, '#ffcd75', scale);

    // Стрелка «дальше», когда можно нажимать
    if (this.timer > 20 && Math.floor(this.tick / 20) % 2 === 0) {
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(228, 126, 5, 1);
      ctx.fillRect(229, 127, 3, 1);
      ctx.fillRect(230, 128, 1, 1);
    }
  },

  // Маленькая кнопка «ПРОПУСТИТЬ»
  drawSkipButton() {
    ctx.fillStyle = '#94b0c2';
    ctx.fillRect(SKIP.x, SKIP.y, SKIP.w, SKIP.h);
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(SKIP.x + 1, SKIP.y + 1, SKIP.w - 2, SKIP.h - 2);
    drawText(ctx, 'ПРОПУСТИТЬ', SKIP.x + 3, SKIP.y + 2, '#f4f4f4');
  },
};

// Часы: круг-циферблат, отметки 12, 3, 6, 9 и две стрелки
function drawClock(cx, cy, r, hours, minutes) {
  fillCircle(cx, cy, r, '#94b0c2');        // ободок
  fillCircle(cx, cy, r - 2, '#f4f4f4');    // циферблат
  ctx.fillStyle = '#566c86';
  ctx.fillRect(cx - 1, cy - r + 3, 2, 2);  // 12
  ctx.fillRect(cx + r - 5, cy - 1, 2, 2);  // 3
  ctx.fillRect(cx - 1, cy + r - 5, 2, 2);  // 6
  ctx.fillRect(cx - r + 3, cy - 1, 2, 2);  // 9
  // Угол стрелки: 0 — вверх (на 12), дальше по часовой
  const minAngle = minutes / 60 * Math.PI * 2;
  const hourAngle = ((hours % 12) + minutes / 60) / 12 * Math.PI * 2;
  drawLine(cx, cy, Math.round(cx + Math.sin(hourAngle) * 7), Math.round(cy - Math.cos(hourAngle) * 7), '#1a1c2c');
  drawLine(cx, cy, Math.round(cx + Math.sin(minAngle) * 11), Math.round(cy - Math.cos(minAngle) * 11), '#b13e53');
}

// =============================================
// ФОНЫ ДЛЯ ЗАСТАВОК
// =============================================
const BACKGROUNDS = {
  // Гостиная утром: окно с солнцем, диван, телевизор
  livingRoom() {
    // Стена в полоску
    ctx.fillStyle = '#94b0c2';
    ctx.fillRect(0, 0, W, 66);
    ctx.fillStyle = '#73eff7';
    for (let x = 6; x < W; x += 12) ctx.fillRect(x, 0, 1, 66);
    // Плинтус
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, 66, W, 3);

    // Пол из досок
    ctx.fillStyle = '#b13e53';
    ctx.fillRect(0, 69, W, H - 69);
    ctx.fillStyle = '#5d275d';
    for (let y = 75; y < H; y += 6) {
      ctx.fillRect(0, y, W, 1);                          // швы между рядами досок
      for (let x = (y % 12 === 3 ? 0 : 20); x < W; x += 40) ctx.fillRect(x, y - 5, 1, 5);
    }
    // Солнечное пятно на полу от окна
    ctx.fillStyle = '#ef7d57';
    for (let i = 0; i < 14; i++) ctx.fillRect(96 + i, 70 + i, 50, 1);

    // Окно: штора, рама, небо, солнце, облако
    ctx.fillStyle = '#333c57';
    ctx.fillRect(86, 6, 68, 2);                          // карниз
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(96, 10, 48, 42);                        // рама
    ctx.fillStyle = '#41a6f6';
    ctx.fillRect(98, 12, 44, 38);                        // небо
    fillCircle(130, 22, 6, '#ffcd75');                   // солнце
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(104, 34, 12, 3);                        // облако
    ctx.fillRect(107, 32, 6, 2);
    ctx.fillRect(98, 30, 44, 2);                         // перекладина рамы
    ctx.fillRect(119, 12, 2, 38);
    ctx.fillStyle = '#b13e53';
    ctx.fillRect(88, 8, 8, 50);                          // шторы
    ctx.fillRect(144, 8, 8, 50);
    ctx.fillStyle = '#5d275d';
    ctx.fillRect(91, 8, 1, 50);
    ctx.fillRect(148, 8, 1, 50);

    // Диван
    ctx.fillStyle = '#257179';
    ctx.fillRect(8, 42, 52, 26);                         // спинка и сиденье
    ctx.fillStyle = '#38b764';
    ctx.fillRect(12, 45, 21, 13);                        // подушки
    ctx.fillRect(35, 45, 21, 13);
    ctx.fillStyle = '#257179';
    ctx.fillRect(4, 50, 8, 18);                          // подлокотники
    ctx.fillRect(56, 50, 8, 18);
    ctx.fillStyle = '#a7f070';
    ctx.fillRect(12, 58, 44, 2);                         // край сиденья
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(6, 68, 3, 3);                           // ножки
    ctx.fillRect(59, 68, 3, 3);

    // Телевизор на тумбе
    ctx.fillStyle = '#333c57';
    ctx.fillRect(176, 54, 56, 18);                       // тумба
    ctx.fillStyle = '#566c86';
    ctx.fillRect(178, 58, 24, 1);
    ctx.fillRect(206, 58, 24, 1);
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(182, 26, 44, 28);                       // корпус
    ctx.fillRect(200, 52, 8, 2);                         // ножка
    ctx.fillStyle = '#29366f';
    ctx.fillRect(184, 28, 40, 22);                       // экран
    ctx.fillStyle = '#3b5dc9';
    for (let i = 0; i < 8; i++) ctx.fillRect(190 + i, 30 + i, 3, 1); // блик
  },
};

// =============================================
// ЭКРАН 3: УРОВЕНЬ
// =============================================
const LEVEL_W = 720;   // ширина уровня — 3 экрана

// Пол и платформы: x, y — левый верхний угол, w, h — ширина и высота.
// Низ платформы должен быть выше 98, иначе Филипп (рост 22) упрётся в неё головой.
const solids = [
  { x: 0,   y: 120, w: LEVEL_W, h: 16 },  // пол
  { x: 60,  y: 88,  w: 40, h: 6 },
  { x: 130, y: 76,  w: 36, h: 6 },
  { x: 200, y: 56,  w: 44, h: 6 },
  { x: 290, y: 88,  w: 50, h: 6 },
  { x: 380, y: 66,  w: 32, h: 6 },
  { x: 450, y: 44,  w: 40, h: 6 },
  { x: 540, y: 84,  w: 56, h: 6 },
  { x: 630, y: 88,  w: 40, h: 6 },
];

// x, y, w, h — это ХИТБОКС: невидимая рамка, по которой считаются столкновения.
// Она меньше картинки 16x24 и примерно совпадает с телом.
const player = {
  x: 20, y: 98,    // позиция хитбокса (левый верхний угол)
  w: 10, h: 22,    // размер хитбокса
  vx: 0, vy: 0,    // скорость по x и y
  onGround: false, // стоит ли на земле
  facing: 1,       // куда смотрит: 1 — вправо, -1 — влево
  anim: 'idle',    // текущая анимация
  animTime: 0,     // сколько шагов идёт текущая анимация
};

// Насколько картинка сдвинута относительно хитбокса.
// Картинка шире и выше, поэтому рисуем её левее и выше на эти пиксели.
const SPRITE_OFFSET_X = 3;
const SPRITE_OFFSET_Y = 2;

// Настройки движения (подбираются на глаз)
const ACCEL = 0.15;      // разгон за один шаг
const FRICTION = 0.2;    // торможение, когда кнопки отпущены
const MAX_SPEED = 1.5;   // максимальная скорость бега
const GRAVITY = 0.2;     // сила тяжести
const JUMP_SPEED = 4;    // начальная скорость прыжка
const MAX_FALL = 4;      // максимальная скорость падения

let cameraX = 0;

// Пересекаются ли два прямоугольника
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

const levelState = {
  // Ставим героя в начало уровня
  enter() {
    player.x = 20; player.y = 98;
    player.vx = 0; player.vy = 0;
    player.onGround = false;
    player.facing = 1;
    player.anim = 'idle';
    player.animTime = 0;
    cameraX = 0;
  },

  update(input) {
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
    if (input.jumpPressed && player.onGround) {
      player.vy = -JUMP_SPEED;
      player.onGround = false;
    }
    // Отпустили прыжок, пока летим вверх — прыжок получается ниже
    if (!keys.jump && player.vy < -1) {
      player.vy = -1;
    }

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

    // Куда смотрит герой: меняем только когда нажата кнопка
    if (dir !== 0) player.facing = dir;

    // Выбираем анимацию по тому, что делает герой
    let anim;
    if (!player.onGround) anim = player.vy < 0 ? 'jump' : 'fall';
    else if (Math.abs(player.vx) > 0.1) anim = 'run';
    else anim = 'idle';
    if (anim !== player.anim) {   // анимация сменилась — начинаем её с первого кадра
      player.anim = anim;
      player.animTime = 0;
    }
    player.animTime++;

    // Камера плавно догоняет героя, держа его в центре экрана
    const target = player.x + player.w / 2 - W / 2;
    cameraX += (target - cameraX) * 0.1;
    // Камера не выходит за края уровня
    cameraX = Math.max(0, Math.min(LEVEL_W - W, cameraX));
  },

  draw() {
    const cam = Math.round(cameraX); // целые пиксели — без размытия

    // Небо
    ctx.fillStyle = '#41a6f6';
    ctx.fillRect(0, 0, W, H);

    // Пол и платформы
    ctx.fillStyle = '#566c86';
    for (const s of solids) {
      ctx.fillRect(s.x - cam, s.y, s.w, s.h);
    }

    // Филипп: берём нужный кадр текущей анимации
    const anim = SPRITES.filipp.anims[player.anim];
    const frameIndex = Math.floor(player.animTime / anim.speed) % anim.frames.length;
    drawSprite(
      ctx,
      anim.frames[frameIndex],
      Math.round(player.x) - SPRITE_OFFSET_X - cam,
      Math.round(player.y) - SPRITE_OFFSET_Y,
      player.facing === -1   // смотрит влево — отражаем картинку
    );

    drawVersion();
  },
};

// =============================================
// ПЕРЕКЛЮЧАТЕЛЬ ЭКРАНОВ
// =============================================
const states = {
  title: titleState,
  cutscene: cutsceneState,
  level: levelState,
};
let state = null;

// Включить экран. arg — дополнительные данные (например, имя заставки)
function setState(name, arg) {
  state = states[name];
  state.enter(arg);
}

// =============================================
// ИГРОВОЙ ЦИКЛ
// =============================================
// Один шаг игры (60 раз в секунду)
function update() {
  // Объединяем клавиатуру и экранные кнопки
  keys.left = kb.left || touch.left;
  keys.right = kb.right || touch.right;
  keys.jump = kb.jump || touch.jump;

  // Что произошло за этот шаг — передаём текущему экрану
  const jumpPressed = jumpHit;                     // «Прыжок» только что нажали
  jumpHit = false;
  const input = {
    jumpPressed: jumpPressed,
    taps: taps,                                     // касания экрана
    pressed: jumpPressed || taps.length > 0,        // любое «нажатие»
  };
  taps = [];

  state.update(input);
}

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
  state.draw();
  requestAnimationFrame(loop);
}

setState('title');
requestAnimationFrame(loop);
