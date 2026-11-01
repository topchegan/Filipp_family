// =============================================
// «Всем что-то надо от Филиппа» — основной код игры
// =============================================
//
// Игра состоит из «экранов» (состояний):
//   ТИТУЛ → ЗАСТАВКА → УРОВЕНЬ → ПОБЕДА_УРОВНЯ или ПОРАЖЕНИЕ (→ снова УРОВЕНЬ)
// Каждый экран — объект с тремя функциями:
//   enter()        — вызывается один раз, когда экран включается
//   update(input)  — логика, 60 раз в секунду
//   draw()         — рисование
// Переключает экраны функция setState().

const VERSION = 'v0.6';

// =============================================
// НАСТРОЙКИ БАЛАНСА
// =============================================
// Все числа, от которых зависит сложность. Меняй их здесь.
// Расстояния — в пикселях уровня (один экран = 240 пикселей).
// Скорости — в пикселях за один шаг игры (шагов 60 в секунду).
const CONFIG = {
  // ----- Лера -----
  leraHeadStart: 2,          // фора: сколько секунд Лера стоит на месте в начале уровня и после «ЕЩЁ РАЗ»
  leraSpeed: 1.2,            // скорость Леры по шкале. Для сравнения: Филипп бежит со скоростью до 1.5
  leraSpeedUp: 0.1,          // на сколько Лера ускоряется после каждого пройденного чекпоинта
  checkpointPushBack: 200,   // на сколько Леру отбрасывает назад на чекпоинте (240 = один экран)
  alarmDistance: 160,        // если Лера ближе этого расстояния — тревога: шкала мигает, звонит телефон

  // ----- Филипп -----
  playerMaxSpeed: 1.5,       // максимальная скорость бега
  playerAccel: 0.15,         // разгон: чем больше, тем быстрее набирает скорость
  playerFriction: 0.2,       // торможение, когда кнопки отпущены
  jumpSpeed: 4,              // сила прыжка (4 — прыжок примерно на 40 пикселей вверх)
  gravity: 0.2,              // сила тяжести
  maxFall: 4,                // максимальная скорость падения

  // ----- Часы -----
  clockStartHour: 9,         // время на часах в начале уровня: часы...
  clockStartMinute: 30,      // ...и минуты
  secondsPerGameMinute: 1,   // сколько настоящих секунд длится одна игровая минута
};

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

// Вибрация телефона: два низких жужжания «ж-ж… ж-ж»
function vibrate() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(70, t0, 0.25, 0.08);
  tone(70, t0 + 0.35, 0.25, 0.08);
}

// Сигнал чекпоинта: две ноты вверх «пи-ПИ»
function checkpointSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(660, t0, 0.08, 0.06);
  tone(990, t0 + 0.09, 0.12, 0.06);
}

// Стук молотка: короткий низкий «тук»
function knockSound() {
  if (!audioCtx) return;
  tone(110, audioCtx.currentTime, 0.06, 0.1);
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

// Круг и линия на главном холсте (сами функции — в sprites.js)
function fillCircle(cx, cy, r, color) { pixelCircle(ctx, cx, cy, r, color); }
function drawLine(x0, y0, x1, y1, color) { pixelLine(ctx, x0, y0, x1, y1, color); }

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
    if (input.pressed) setState('cutscene');
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

    // Название крупными буквами в две строки (каждая влезает по ширине)
    drawTextCenteredShadow('ВСЕМ ЧТО-ТО НАДО', 120, 14, '#f4f4f4', '#1a1c2c', 2);
    drawTextCenteredShadow('ОТ ФИЛИППА', 120, 33, '#ffcd75', '#b13e53', 2);

    // Мигающая надпись: полсекунды видна, полсекунды нет
    if (Math.floor(this.timer / 30) % 2 === 0) {
      drawTextCenteredShadow('НАЖМИ, ЧТОБЫ НАЧАТЬ', 120, 120, '#f4f4f4', '#1a1c2c');
    }
    drawVersion();
  },
};

// =============================================
// ЭКРАНЫ СО СЦЕНКАМИ: ЗАСТАВКА, ПОРАЖЕНИЕ, ПОБЕДА_УРОВНЯ (движок диалогов)
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

// Окно подписи внизу экрана и кнопка в нём (например «ЕЩЁ РАЗ»)
const CAPTION = { x: 2, y: 104, w: 236, h: 30 };
const CAPTION_BUTTON = { x: 184, y: 110, w: 48, h: 15 };

// Кадр анимации «Молоток», в который молоток бьёт (считаем с нуля)
const HAMMER_HIT_FRAME = 1;

// Кнопка «ПРОПУСТИТЬ» в правом верхнем углу
const SKIP = { x: 174, y: 2, w: 64, h: 11 };

// Попал ли тап в кнопку «ПРОПУСТИТЬ» (зону делаем чуть больше кнопки — для пальца)
function tapOnSkip(t) {
  return t.x >= SKIP.x - 6 && t.y <= SKIP.y + SKIP.h + 6;
}

// Движок сценок. Одна и та же «машина» работает для нескольких экранов:
// ЗАСТАВКА, ПОРАЖЕНИЕ и ПОБЕДА_УРОВНЯ. Отличаются они только сценарием из scenes.js.
// createSceneState('intro') создаёт экран, который по умолчанию играет сценарий intro.
function createSceneState(defaultScene) {
  return {
    scene: null,    // текущий сценарий из scenes.js
    index: 0,       // номер текущего шага
    step: null,     // сам текущий шаг
    timer: 0,       // сколько шагов игры длится текущий шаг сценария
    tick: 0,        // общий счётчик для анимаций
    actors: {},     // кто стоит на фоне
    lines: [],      // строки текущей реплики
    fullText: '',   // все буквы реплики подряд
    typed: 0,       // сколько букв уже напечатано
    titleText: '',  // текст титра (с подставленным временем)

    enter(sceneName) {
      this.scene = SCENES[sceneName || defaultScene];
      this.tick = 0;
      // Копируем персонажей из сценария, чтобы не испортить сам сценарий
      this.actors = {};
      const list = this.scene.actors || {};
      for (const key in list) {
        const a = list[key];
        this.actors[key] = { x: a.x, visible: a.visible, facing: a.facing, blinking: false, anim: 'idle' };
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
      } else if (step.type === 'title') {
        // {ВРЕМЯ} заменяем на время с игровых часов
        this.titleText = step.text.replace('{ВРЕМЯ}', clockText());
      } else if (step.type === 'phone') {
        phoneRing();
      } else if (step.type === 'enter' || step.type === 'leave') {
        const actor = this.actors[step.who];
        actor.visible = true;
        actor.blinking = true;
      } else if (step.type === 'anim') {
        // Персонаж меняет движение — и сразу следующий шаг
        this.actors[step.who].anim = step.anim;
        this.nextStep();
      }
    },

    // Сценка закончилась — запускаем следующий экран
    finish() {
      setState(this.scene.next || 'level', this.scene.nextArg);
    },

    // Показывать ли «ПРОПУСТИТЬ»: не показываем, когда на экране своя кнопка (например «ЕЩЁ РАЗ»)
    showSkip() {
      return !(this.step.type === 'caption' && this.step.button);
    },

    update(input) {
      this.tick++;
      this.timer++;

      // Кнопка «ПРОПУСТИТЬ»
      if (this.showSkip() && input.taps.some(tapOnSkip)) {
        this.finish();
        return;
      }
      const pressed = input.pressed;
      const step = this.step;

      // Молоток: в момент удара — звук «тук»
      for (const key in this.actors) {
        const a = this.actors[key];
        if (a.visible && a.anim === 'hammer' && this.tick % SPRITES[key].anims.hammer.speed === 0 &&
            this.actorFrameIndex(key, a) === HAMMER_HIT_FRAME) {
          knockSound();
        }
      }

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
      } else if (step.type === 'title' || step.type === 'caption') {
        // Ждём нажатия (первые 20 шагов нажатие не считаем, чтобы не пролистнуть случайно)
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
        this.drawTitleCard(this.titleText);
      } else {
        BACKGROUNDS[this.scene.background](ctx);
        this.drawActors();
        if (step.type === 'phone') this.drawPhone();
        if (step.type === 'say') this.drawDialog(step);
        if (step.type === 'caption') this.drawCaption(step);
      }

      if (this.showSkip()) this.drawSkipButton();
      drawVersion();
    },

    // Какой кадр анимации сейчас у персонажа на фоне
    actorFrameIndex(key, a) {
      const anim = SPRITES[key].anims[a.anim];
      return Math.floor(this.tick / anim.speed) % anim.frames.length;
    },

    // Персонажи на фоне — обычными игровыми спрайтами
    drawActors() {
      for (const key in this.actors) {
        const a = this.actors[key];
        if (!a.visible) continue;
        // Мигание: через каждые 4 шага персонаж то виден, то нет
        if (a.blinking && Math.floor(this.timer / 4) % 2 === 1) continue;
        const index = this.actorFrameIndex(key, a);
        const frame = SPRITES[key].anims[a.anim].frames[index];
        const y = FLOOR_Y - frame.height;
        drawSprite(ctx, frame, a.x, y, a.facing === 'left');
        // Удар молотком — надпись «ТУК-ТУК!» у молотка
        if (a.anim === 'hammer' && index === HAMMER_HIT_FRAME) {
          drawTextShadow('ТУК-ТУК!', a.x + 10, y - 10, '#f4f4f4', '#1a1c2c');
        }
      }
    },

    // Звонящий телефон над Филиппом
    drawPhone() {
      const f = this.actors.filipp;
      const shake = (this.timer >> 1) % 2;            // трясётся на 1 пиксель
      drawPhoneIcon(f.x + 14 + shake, FLOOR_Y - 40, this.timer);
      drawTextCenteredShadow('ДЗЫНЬ-ДЗЫНЬ!', 120 + shake, 18, '#ffcd75', '#1a1c2c', 2);
    },

    // Окно диалога: рамка, портрет, имя, текст, стрелка
    drawDialog(step) {
      const speaker = SPEAKERS[step.who];
      drawBox(BOX.x, BOX.y, BOX.w, BOX.h);

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
      if (this.typed >= this.fullText.length) this.drawArrow();
    },

    // Подпись внизу экрана и, если задана, кнопка (например «ЕЩЁ РАЗ»)
    drawCaption(step) {
      drawBox(CAPTION.x, CAPTION.y, CAPTION.w, CAPTION.h);
      drawText(ctx, step.text, CAPTION.x + 6, CAPTION.y + 7, '#f4f4f4', step.button ? 168 : CAPTION.w - 12);
      if (step.button) {
        // Кнопка мигает рамкой, чтобы её заметили
        const b = CAPTION_BUTTON;
        ctx.fillStyle = Math.floor(this.tick / 20) % 2 === 0 ? '#ffcd75' : '#ef7d57';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#1a1c2c';
        ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
        drawTextCentered(ctx, step.button, b.x + b.w / 2, b.y + 4, '#ffcd75');
      } else if (this.timer > 20) {
        this.drawArrow();
      }
    },

    // Мигающая стрелка ▼ в правом нижнем углу
    drawArrow() {
      if (Math.floor(this.tick / 20) % 2 !== 0) return;
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(228, 126, 5, 1);
      ctx.fillRect(229, 127, 3, 1);
      ctx.fillRect(230, 128, 1, 1);
    },

    // Титр на весь экран: часы и надпись (можно в несколько строк через \n)
    drawTitleCard(text) {
      ctx.fillStyle = '#1a1c2c';
      ctx.fillRect(0, 0, W, H);

      // Если в тексте есть время (например 09:30) — рисуем часы с этим временем
      const time = text.match(/(\d{1,2}):(\d{2})/);
      if (time) drawClock(120, 44, 16, Number(time[1]), Number(time[2]));

      // Крупно, если самая длинная строка влезает, иначе обычным размером
      const lines = text.split('\n');
      const longest = Math.max(...lines.map((l) => textWidth(l)));
      const scale = longest * 2 <= W - 8 ? 2 : 1;
      const top = lines.length === 1 ? 76 : 70;
      lines.forEach((line, i) => {
        drawTextCentered(ctx, line, 120, top + i * (LINE_STEP + 2) * scale, '#ffcd75', scale);
      });

      // Стрелка «дальше», когда можно нажимать
      if (this.timer > 20) this.drawArrow();
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
}

// Окно с тёмным фоном и рамкой в 2 цвета (для диалогов и подписей)
function drawBox(x, y, w, h) {
  ctx.fillStyle = '#1a1c2c';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#f4f4f4';                       // внешняя рамка — белая
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
  ctx.fillStyle = '#3b5dc9';                       // внутренняя рамка — синяя
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
  ctx.fillRect(x + 1, y + h - 2, w - 2, 1);
  ctx.fillRect(x + 1, y + 1, 1, h - 2);
  ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
}

// Телефон 7x11 с мигающим экраном
function drawPhoneIcon(x, y, timer) {
  ctx.fillStyle = '#1a1c2c';
  ctx.fillRect(x, y, 7, 11);                       // корпус
  ctx.fillStyle = (timer >> 3) % 2 ? '#73eff7' : '#f4f4f4';
  ctx.fillRect(x + 1, y + 1, 5, 7);                // мигающий экран
}

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
// ЭКРАН 3: УРОВЕНЬ (гонка с Лерой)
// =============================================
// Уровень собирается из карты в levels.js (плитки 8x8).
const TILE = 8;            // размер плитки
const COLS = 30;           // плиток в ширину на одном экране
const ROWS = 15;           // плиток в высоту (без HUD)
const HUD_H = 16;          // высота HUD сверху (2 ряда плиток)
const SCREEN_W = COLS * TILE;  // 240 — ширина одного экрана

// Символы карты, которые игра знает. Буквы «скоро» пока ничего не делают.
const MAP_SYMBOLS = '.#-PCE' + Object.keys(FURNITURE).join('');
const MAP_SOON = 'kvntmgbs';

// Сюда складываем собранный уровень
const level = {
  width: 0,          // ширина в пикселях
  screens: [],       // экраны: фон и карта
  rows: [],          // вся карта целиком: 15 длинных строк
  solids: [],        // твёрдые прямоугольники: плитки # и твёрдые части мебели
  tops: [],          // тонкие платформы: «-» и полки мебели (стоять сверху)
  furniture: [],     // мебель для рисования
  checkpoints: [],   // дверные проёмы-чекпоинты {x, y}
  gate: null,        // калитка-финиш {x, y}
  start: null,       // старт Филиппа {x, y}
};

// Ошибки в карте. Если они есть, вместо игры показываем экран с ошибками.
const LEVEL_ERRORS = [];

// Пиксели на экране для плитки: столбец c, строка r
function tileX(c) { return c * TILE; }
function tileY(r) { return HUD_H + r * TILE; }

// Проверяем карту и собираем из неё уровень
function buildLevel(data) {
  const errors = LEVEL_ERRORS;
  if (!data || !Array.isArray(data.screens) || data.screens.length === 0) {
    errors.push('В LEVELS.JS НЕТ НИ ОДНОГО ЭКРАНА.');
    return;
  }
  // 1) Проверяем каждый экран: фон, 15 строк по 30 символов, известные символы
  data.screens.forEach((scr, i) => {
    const n = i + 1;
    if (!LEVEL_BACKGROUNDS[scr.bg]) {
      errors.push('ЭКРАН ' + n + ': НЕИЗВЕСТНЫЙ ФОН «' + scr.bg + '».');
    }
    if (!Array.isArray(scr.map)) {
      errors.push('ЭКРАН ' + n + ': НЕТ КАРТЫ MAP.');
      return;
    }
    if (scr.map.length !== ROWS) {
      errors.push('ЭКРАН ' + n + ': СТРОК ' + scr.map.length + ', А НУЖНО 15.');
    }
    scr.map.forEach((row, r) => {
      if (row.length !== COLS) {
        errors.push('ЭКРАН ' + n + ', СТРОКА ' + (r + 1) + ': СИМВОЛОВ ' + row.length + ', А НУЖНО 30.');
      }
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (MAP_SYMBOLS.indexOf(ch) === -1 && MAP_SOON.indexOf(ch) === -1) {
          errors.push('ЭКРАН ' + n + ', СТРОКА ' + (r + 1) + ', СИМВОЛ ' + (c + 1) + ': НЕИЗВЕСТНЫЙ ЗНАК «' + ch + '».');
        }
      }
    });
  });
  if (errors.length > 0) return;

  // 2) Склеиваем экраны в одну длинную карту
  level.screens = data.screens;
  level.width = data.screens.length * SCREEN_W;
  level.rows = [];
  for (let r = 0; r < ROWS; r++) {
    level.rows.push(data.screens.map((s) => s.map[r]).join(''));
  }

  // 3) Разбираем символы
  level.solids = []; level.tops = []; level.furniture = []; level.checkpoints = [];
  level.gate = null; level.start = null;
  let starts = 0, gates = 0;
  const totalCols = level.rows[0].length;
  for (let r = 0; r < ROWS; r++) {
    const row = level.rows[r];
    for (let c = 0; c < totalCols; c++) {
      const ch = row[c];
      const where = 'ЭКРАН ' + (Math.floor(c / COLS) + 1) + ', СТРОКА ' + (r + 1) + ', СИМВОЛ ' + (c % COLS + 1);
      // Соседние плитки # и - в строке склеиваем в один длинный прямоугольник
      if ((ch === '#' || ch === '-') && (c === 0 || row[c - 1] !== ch)) {
        let len = 1;
        while (c + len < totalCols && row[c + len] === ch) len++;
        if (ch === '#') level.solids.push({ x: tileX(c), y: tileY(r), w: len * TILE, h: TILE });
        else level.tops.push({ x: tileX(c), y: tileY(r), w: len * TILE });
      }
      // Крупные вещи: символ — левый нижний угол, предмет растёт вверх и вправо
      let size = null;
      if (FURNITURE[ch]) size = FURNITURE[ch];
      if (ch === 'C') size = { w: 3, h: 4 };
      if (ch === 'E') size = { w: 4, h: 4 };
      if (!size) {
        if (ch === 'P') {
          starts++;
          level.start = { x: tileX(c) - 1, y: tileY(r + 1) - player.h };
        }
        continue;
      }
      if (r - size.h + 1 < 0) {
        errors.push(where + ': ПРЕДМЕТ «' + ch + '» НЕ ВЛЕЗАЕТ ПО ВЫСОТЕ. ОПУСТИ ЕГО НИЖЕ.');
        continue;
      }
      if (c + size.w > totalCols) {
        errors.push(where + ': ПРЕДМЕТ «' + ch + '» ВЫЛЕЗАЕТ ЗА ПРАВЫЙ КРАЙ УРОВНЯ.');
        continue;
      }
      const x = tileX(c);
      const y = tileY(r + 1) - size.h * TILE;   // верх предмета
      if (ch === 'C') {
        level.checkpoints.push({ x: x, y: y });
      } else if (ch === 'E') {
        gates++;
        level.gate = { x: x, y: y, w: 32 };
      } else {
        const def = FURNITURE[ch];
        level.furniture.push({ def: def, x: x, y: y });
        for (const p of def.parts) {
          if (p.kind === 'solid') level.solids.push({ x: x + p.x, y: y + p.y, w: p.w, h: p.h });
          else level.tops.push({ x: x + p.x, y: y + p.y, w: p.w });
        }
      }
    }
  }
  if (starts === 0) errors.push('НА КАРТЕ НЕТ СТАРТА P. ПОСТАВЬ ОДНУ БУКВУ P.');
  if (starts > 1) errors.push('СТАРТОВ P НА КАРТЕ ' + starts + ', А НУЖЕН ОДИН.');
  if (gates === 0) errors.push('НА КАРТЕ НЕТ ФИНИША E. ПОСТАВЬ ОДНУ БУКВУ E.');
  if (gates > 1) errors.push('ФИНИШЕЙ E НА КАРТЕ ' + gates + ', А НУЖЕН ОДИН.');
  // Чекпоинты по порядку слева направо
  level.checkpoints.sort((a, b) => a.x - b.x);
}

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

let cameraX = 0;

// Игровые часы: сколько шагов игры прошло с начала уровня
let clockSteps = 0;

// Время на игровых часах строкой, например «09:47»
function clockText() {
  const total = CONFIG.clockStartHour * 60 + CONFIG.clockStartMinute +
                Math.floor(clockSteps / (60 * CONFIG.secondsPerGameMinute));
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
}

// Пересекаются ли два прямоугольника
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
         a.y < b.y + b.h && a.y + a.h > b.y;
}

// Шкала прогресса в HUD: где на ней точка уровня x
const BAR = { x: 6, y: 11, w: 228, h: 2 };
function barX(levelX) {
  const part = Math.max(0, Math.min(1, levelX / level.gate.x));
  return Math.round(BAR.x + part * BAR.w);
}

const levelState = {
  leraX: 0,          // где Лера на уровне (её иконка на шкале)
  leraSpeed: 0,      // её текущая скорость
  waitSteps: 0,      // сколько шагов ещё длится фора
  passed: [],        // какие чекпоинты уже пройдены (true/false)
  saved: null,       // что запомнили на последнем чекпоинте — оттуда «ЕЩЁ РАЗ»
  alarm: false,      // Лера близко?
  alarmTimer: 0,     // для мигания и вибрации

  // mode = 'checkpoint' — продолжить с последнего чекпоинта, иначе — с начала
  enter(mode) {
    if (mode !== 'checkpoint' || !this.saved) {
      this.passed = level.checkpoints.map(() => false);
      this.saved = { x: level.start.x, y: level.start.y, leraX: 0, leraSpeed: CONFIG.leraSpeed, clockSteps: 0 };
    }
    // Восстанавливаем всё как было на старте или на чекпоинте
    player.x = this.saved.x;
    player.y = this.saved.y;
    player.vx = 0; player.vy = 0;
    player.onGround = false;
    player.facing = 1;
    player.anim = 'idle';
    player.animTime = 0;
    this.leraX = this.saved.leraX;
    this.leraSpeed = this.saved.leraSpeed;
    clockSteps = this.saved.clockSteps;
    this.waitSteps = CONFIG.leraHeadStart * 60;    // фора в шагах
    this.alarm = false;
    this.alarmTimer = 0;
    // Камера сразу на герое, без плавного подъезда
    cameraX = Math.max(0, Math.min(level.width - W, player.x + player.w / 2 - W / 2));
  },

  update(input) {
    this.movePlayer(input);
    clockSteps++;

    // --- Чекпоинты ---
    level.checkpoints.forEach((cp, i) => {
      if (!this.passed[i] && player.x + player.w / 2 >= cp.x + 12) {
        this.passed[i] = true;
        checkpointSound();
        // Лера отлетает назад и немного ускоряется
        this.leraX = Math.max(0, this.leraX - CONFIG.checkpointPushBack);
        this.leraSpeed += CONFIG.leraSpeedUp;
        // Запоминаем, откуда начинать после поражения: Филипп стоит в проёме
        this.saved = { x: cp.x + 7, y: cp.y + 32 - player.h, leraX: this.leraX,
                       leraSpeed: this.leraSpeed, clockSteps: clockSteps };
      }
    });

    // --- Финиш ---
    if (player.x + player.w >= level.gate.x + 4) {
      setState('levelWin');
      return;
    }

    // --- Лера едет по шкале ---
    if (this.waitSteps > 0) this.waitSteps--;         // ещё фора — стоит на месте
    else this.leraX += this.leraSpeed;

    // Догнала — поражение
    if (this.leraX >= player.x) {
      setState('defeat');
      return;
    }

    // Близко — тревога: мигание шкалы и вибрация телефона раз в секунду.
    // Пока идёт фора, тревоги нет.
    const wasAlarm = this.alarm;
    this.alarm = this.waitSteps === 0 && player.x - this.leraX < CONFIG.alarmDistance;
    if (this.alarm) {
      if (!wasAlarm) this.alarmTimer = 0;
      if (this.alarmTimer % 60 === 0) vibrate();
      this.alarmTimer++;
    }
  },

  // Бег, прыжки и столкновения Филиппа
  movePlayer(input) {
    // Бег: разгон в сторону нажатой кнопки
    let dir = 0;
    if (keys.left) dir -= 1;
    if (keys.right) dir += 1;

    if (dir !== 0) {
      player.vx += dir * CONFIG.playerAccel;
      if (player.vx > CONFIG.playerMaxSpeed) player.vx = CONFIG.playerMaxSpeed;
      if (player.vx < -CONFIG.playerMaxSpeed) player.vx = -CONFIG.playerMaxSpeed;
    } else {
      // Торможение: плавно уменьшаем скорость до нуля
      if (player.vx > 0) player.vx = Math.max(0, player.vx - CONFIG.playerFriction);
      if (player.vx < 0) player.vx = Math.min(0, player.vx + CONFIG.playerFriction);
    }

    // Прыжок: только с земли и только в момент нажатия
    if (input.jumpPressed && player.onGround) {
      player.vy = -CONFIG.jumpSpeed;
      player.onGround = false;
    }
    // Отпустили прыжок, пока летим вверх — прыжок получается ниже
    if (!keys.jump && player.vy < -1) {
      player.vy = -1;
    }

    // Гравитация
    player.vy += CONFIG.gravity;
    if (player.vy > CONFIG.maxFall) player.vy = CONFIG.maxFall;

    // Двигаем по X и выталкиваем из стен
    player.x += player.vx;
    for (const s of level.solids) {
      if (overlaps(player, s)) {
        if (player.vx > 0) player.x = s.x - player.w;
        else if (player.vx < 0) player.x = s.x + s.w;
        player.vx = 0;
      }
    }

    // Не даём уйти за края уровня
    if (player.x < 0) { player.x = 0; player.vx = 0; }
    if (player.x > level.width - player.w) { player.x = level.width - player.w; player.vx = 0; }

    // Двигаем по Y и выталкиваем из пола/потолка
    const oldBottom = player.y + player.h;   // где были ноги до движения
    player.y += player.vy;
    player.onGround = false;
    for (const s of level.solids) {
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

    // Тонкие платформы: ловят, только если падаем сверху.
    // Если прыгаем снизу — пролетаем насквозь.
    if (player.vy >= 0) {
      for (const t of level.tops) {
        const above = oldBottom <= t.y;                     // ноги были выше полки
        const below = player.y + player.h >= t.y;            // а теперь на ней или ниже
        const sideBySide = player.x + player.w > t.x && player.x < t.x + t.w;
        if (above && below && sideBySide) {
          player.y = t.y - player.h;
          player.vy = 0;
          player.onGround = true;
        }
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
    cameraX = Math.max(0, Math.min(level.width - W, cameraX));
  },

  draw() {
    const cam = Math.round(cameraX); // целые пиксели — без размытия

    // Экраны, которые сейчас видны (обычно два соседних)
    const first = Math.floor(cam / SCREEN_W);
    for (let s = first; s <= first + 1 && s < level.screens.length; s++) {
      const bg = LEVEL_BACKGROUNDS[level.screens[s].bg];
      bg.draw(ctx, s * SCREEN_W - cam, HUD_H);
    }

    // Плитки # и - (только видимые столбцы)
    const c0 = Math.floor(cam / TILE);
    const c1 = Math.min(level.rows[0].length - 1, c0 + COLS);
    for (let r = 0; r < ROWS; r++) {
      const row = level.rows[r];
      for (let c = c0; c <= c1; c++) {
        const ch = row[c];
        if (ch !== '#' && ch !== '-') continue;
        const bg = LEVEL_BACKGROUNDS[level.screens[Math.floor(c / COLS)].bg];
        if (ch === '#') {
          const topOpen = r === 0 || level.rows[r - 1][c] !== '#';
          drawSolidTile(ctx, tileX(c) - cam, tileY(r), bg.tile, topOpen, r);
        } else {
          drawShelfTile(ctx, tileX(c) - cam, tileY(r), bg.shelf);
        }
      }
    }

    // Дверные проёмы-чекпоинты, калитка, мебель
    level.checkpoints.forEach((cp, i) => drawDoorway(ctx, cp.x - cam, cp.y, this.passed[i]));
    drawGate(ctx, level.gate.x - cam, level.gate.y);
    for (const f of level.furniture) {
      if (f.x - cam > W || f.x + f.def.w * TILE - cam < 0) continue;  // за экраном — не рисуем
      f.def.draw(ctx, f.x - cam, f.y);
    }

    // Филипп: берём нужный кадр текущей анимации
    const anim = SPRITES.filipp.anims[player.anim];
    const frameIndex = Math.floor(player.animTime / anim.speed) % anim.frames.length;
    const sx = Math.round(player.x) - SPRITE_OFFSET_X - cam;
    const sy = Math.round(player.y) - SPRITE_OFFSET_Y;
    drawSprite(ctx, anim.frames[frameIndex], sx, sy, player.facing === -1);

    // Тревога: над Филиппом звонит телефон «ТЫ ГДЕ?!»
    if (this.alarm) {
      const shake = (this.alarmTimer >> 1) % 2;
      drawPhoneIcon(sx + 4 + shake, sy - 14, this.alarmTimer);
      const textY = Math.max(HUD_H + 2, sy - 24);   // не залезаем на HUD
      drawTextCenteredShadow('ТЫ ГДЕ?!', sx + 8 + shake, textY, '#ffcd75', '#1a1c2c');
    }

    this.drawHud();
  },

  // HUD: полоска сверху (2 ряда плиток) — версия, часы, шкала гонки с иконками
  drawHud() {
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(0, 0, W, HUD_H);

    drawText(ctx, VERSION, 2, 1, '#94b0c2');
    drawText(ctx, clockText(), W - 31, 1, '#ffcd75');

    // Шкала: при тревоге мигает красным
    const blinkRed = this.alarm && Math.floor(this.alarmTimer / 8) % 2 === 0;
    ctx.fillStyle = blinkRed ? '#b13e53' : '#566c86';
    ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);

    // Отметки чекпоинтов: жёлтые, пройденные — зелёные
    level.checkpoints.forEach((cp, i) => {
      ctx.fillStyle = this.passed[i] ? '#a7f070' : '#ffcd75';
      ctx.fillRect(barX(cp.x + 12), BAR.y - 3, 1, BAR.h + 6);
    });
    // Отметка финиша — флажок
    const fx = barX(level.gate.x);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(fx, BAR.y - 4, 1, BAR.h + 7);
    ctx.fillRect(fx - 3, BAR.y - 4, 3, 3);

    // Иконки-головы: Лера рисуется поверх Филиппа, когда догоняет
    ctx.drawImage(ICONS.filipp.image, barX(player.x + player.w / 2) - 4, HUD_H - 8);
    ctx.drawImage(ICONS.lera.image, barX(this.leraX) - 4, HUD_H - 8);
  },
};

// =============================================
// ЭКРАН ОШИБКИ: в карте или в файле что-то не так
// =============================================
const errorState = {
  messages: [],
  enter() {},
  update() {},
  draw() {
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(0, 0, W, H);
    drawText(ctx, 'ОШИБКА В КАРТЕ УРОВНЯ', 4, 4, '#b13e53');
    let y = 16;
    for (const msg of this.messages) {
      const lines = drawText(ctx, msg, 4, y, '#f4f4f4', W - 8);
      y += lines * LINE_STEP + 3;
      if (y > H - 24) break;                       // больше не влезает
    }
    drawText(ctx, 'ПОПРАВЬ LEVELS.JS И ОБНОВИ СТРАНИЦУ.', 4, H - 20, '#ffcd75', W - 8);
    drawText(ctx, VERSION, 2, H - 9, '#566c86');
  },
};

// =============================================
// ПЕРЕКЛЮЧАТЕЛЬ ЭКРАНОВ
// =============================================
const states = {
  title: titleState,                          // ТИТУЛ
  cutscene: createSceneState('intro'),        // ЗАСТАВКА (завязка)
  level: levelState,                          // УРОВЕНЬ
  defeat: createSceneState('defeat'),         // ПОРАЖЕНИЕ
  levelWin: createSceneState('levelWin'),     // ПОБЕДА_УРОВНЯ
  error: errorState,                          // ОШИБКА в карте или в файлах
};
let state = null;

// Включить экран. arg — дополнительные данные (например, «продолжить с чекпоинта»)
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

// Перед запуском проверяем файлы и карту уровня.
// LOAD_ERRORS собирает index.html: туда попадают ошибки в файлах (например, забытая кавычка).
for (const e of window.LOAD_ERRORS || []) {
  LEVEL_ERRORS.push('ОШИБКА В ФАЙЛЕ ' + e.file.toUpperCase() + ', СТРОКА ' + e.line +
                    '. ЧАЩЕ ВСЕГО ЭТО ЗАБЫТАЯ КАВЫЧКА ИЛИ ЗАПЯТАЯ.');
}
if (typeof LEVELS === 'undefined') {
  if (LEVEL_ERRORS.length === 0) LEVEL_ERRORS.push('ФАЙЛ LEVELS.JS НЕ ЗАГРУЗИЛСЯ.');
} else if (LEVEL_ERRORS.length === 0) {
  buildLevel(LEVELS[0]);
}

if (LEVEL_ERRORS.length > 0) {
  errorState.messages = LEVEL_ERRORS;
  setState('error');
} else {
  setState('title');
}
requestAnimationFrame(loop);
