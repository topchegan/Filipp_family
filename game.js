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

// Номер версии VERSION — в файле version.js (меняется только там).

// =============================================
// НАСТРОЙКИ БАЛАНСА
// =============================================
// Все числа, от которых зависит сложность. Меняй их здесь.
// Расстояния — в пикселях уровня (один экран = 240 пикселей).
// Скорости — в пикселях за один шаг игры (шагов 60 в секунду).
const CONFIG = {
  // ----- Лера -----
  leraHeadStart: 3,          // фора: сколько секунд Лера стоит на месте в начале уровня и после «ЕЩЁ РАЗ»
  leraSpeed: 0.8,            // скорость Леры по шкале. Для сравнения: Филипп бежит со скоростью до 1.5
  leraSpeedUp: 0.1,          // на сколько Лера ускоряется после каждого звонка-отмазки
  callPushBack: 200,         // на сколько Леру отбрасывает назад после звонка-отмазки (240 = один экран)
  callPause: 0.5,            // пауза в секундах между касанием телефона и разговором
  alarmDistance: 160,        // если Лера ближе этого расстояния — тревога: шкала мигает, звонит телефон

  // ----- Филипп -----
  playerMaxSpeed: 1.5,       // максимальная скорость бега
  playerAccel: 0.15,         // разгон: чем больше, тем быстрее набирает скорость
  playerFriction: 0.2,       // торможение, когда кнопки отпущены
  jumpSpeed: 3,              // сила прыжка С МЕСТА (3 — примерно на 22 пикселя: 2 плитки и чуть больше)
  jumpSpeedRun: 4,           // сила прыжка С РАЗБЕГА на полной скорости (4 — примерно на 40 пикселей: 5 плиток)
  trampolineSpeed: 5.1,      // сила подброса батута (5.1 — примерно на 8 плиток вверх)
  gravity: 0.2,              // сила тяжести
  maxFall: 4,                // максимальная скорость падения

  // ----- Жизни (кружки пива) -----
  startLives: 3,             // сколько кружек в начале уровня и после «ЕЩЁ РАЗ»
  maxLives: 5,               // больше этого кружек не бывает
  invulnSeconds: 1.5,        // после удара Филипп столько секунд мигает и неуязвим

  // ----- Кураж и бустеры -----
  courageDrainSeconds: 120,  // за сколько секунд кураж сам падает от полного до нуля
  courageMinFactor: 0.7,     // скорость бега и прыжок при нулевом кураже (0.7 = 70%). Выше половины куража — 100%
  courageLow: 0.25,          // меньше этого кураж мигает, Филипп зевает «ЭХ...»
  cigCourage: 0.4,           // сколько куража дают сигареты (0.4 = +40%)
  smokeSeconds: 2,           // сколько секунд за Филиппом тянется дымок
  coffeeSeconds: 6,          // сколько секунд действует кофе
  coffeeSpeedMul: 1.4,       // во сколько раз быстрее с кофе
  coffeeCrashSeconds: 2,     // сколько секунд длится «отходняк» после кофе
  coffeeCrashMul: 0.7,       // скорость во время «отходняка»
  tipsySeconds: 8,           // сколько секунд действует «подпитие» от одного пива
  tipsyDrift: 0.05,          // насколько сильно Филиппа тянет то влево, то вправо (за одно пиво)
  tipsyBrake: 0.35,          // во сколько раз хуже тормозит подвыпивший (меньше — дольше тормозит)
  tipsyJumpMul: 1.15,        // прыжок выше с пива (1.15 = на 15%)
  tipsyThrowMul: 1.25,       // в бою с боссом бросок дальше с пива
  sofaLieSeconds: 1,         // сколько секунд стоять на диване или шезлонге, чтобы лечь
  sofaRefillSeconds: 3,      // за сколько секунд лёжа кураж восполняется от нуля до полного

  // ----- Враги и ловушки -----
  kirillSpeed: 0.5,          // Кирилл ходит туда-сюда
  kirillChaseSpeed: 1.1,     // Кирилл бежит к папе «КУПИ ИГРУ!»
  kirillSitSeconds: 3,       // сколько секунд Кирилл сидит обиженный, если на него запрыгнуть
  catSpeed: 0.35,            // Туся гуляет
  catDashSpeed: 2.0,         // Туся бросается под ноги
  tripSeconds: 1.2,          // сколько секунд Филипп лежит, споткнувшись о Тусю
  vacuumSpeed: 0.6,          // скорость пылесоса
  dazeSeconds: 1,            // сколько секунд Филипп оглушён пылесосом

  // ----- Босс: Вася и Настя -----
  bossPushBack: 3600,        // на сколько отлетает Лера при входе на арену (чтобы на бой было около минуты)
  girlSpeed: 0.8,            // скорость бегущей девочки
  girlJumpChance: 0.01,      // как часто девочка подпрыгивает на бегу (0.01 — примерно раз в 1,5 секунды)
  hugSeconds: 2,             // сколько секунд Филипп стоит в обнимку «ПАПА, ДЕРЖИСЬ!»
  girlRestSeconds: 1.5,      // после обнимашек девочка столько секунд отбегает в сторону (передышка)
  girlPlaySeconds: 2,        // сколько секунд девочка играет после попадания игрушкой
  bossHitsToWin: 3,          // сколько попаданий нужно, чтобы девочка села играть насовсем (и сердечек)
  toyEverySeconds: 3,        // как часто падают игрушки (фаза 1)
  toyEverySecondsPhase2: 1.8,// как часто падают игрушки (фаза 2)
  doubleToyChance: 0.35,     // фаза 2: шанс, что упадут две игрушки сразу
  phase2SpeedMul: 1.5,       // фаза 2: во сколько раз быстрее оставшаяся девочка
  maxCarry: 3,               // сколько игрушек Филипп может нести
  throwSpeed: 3,             // сила броска игрушки (вперёд)
  throwLift: 1.5,            // насколько игрушка взлетает вверх при броске (дуга)

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

// Сигнал «взял телефон»: две ноты вверх «пи-ПИ»
function pickupSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(660, t0, 0.08, 0.06);
  tone(990, t0 + 0.09, 0.12, 0.06);
}

// Батут: «БОЙНГ» — звук быстро скользит снизу вверх
function boingSound() {
  if (!audioCtx || audioCtx.state !== 'running') return;
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(120, t0);
  osc.frequency.exponentialRampToValueAtTime(700, t0 + 0.25);
  gain.gain.setValueAtTime(0.06, t0);
  gain.gain.linearRampToValueAtTime(0, t0 + 0.3);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.3);
}

// Удар: «ой» — короткий звук вниз
function hurtSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(400, t0, 0.06, 0.08);
  tone(250, t0 + 0.06, 0.1, 0.08);
}

// Пиво: «бульк» — два коротких звука
function gulpSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(300, t0, 0.05, 0.07);
  tone(500, t0 + 0.07, 0.05, 0.07);
  tone(380, t0 + 0.14, 0.07, 0.07);
}

// Туся: «мяу» — вверх и вниз
function meowSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(700, t0, 0.06, 0.05);
  tone(900, t0 + 0.06, 0.08, 0.05);
  tone(600, t0 + 0.14, 0.1, 0.05);
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
const keys = { left: false, right: false, jump: false, throw: false };
// Отдельно — кнопки с клавиатуры и с экрана, потом объединяем
const kb = { left: false, right: false, jump: false, throw: false };
const touch = { left: false, right: false, jump: false, throw: false };
// Касания и клики по самому экрану (не по кнопкам). Координаты — в пикселях игры.
let taps = [];
// Нажали ли «Прыжок» с прошлого шага. Запоминаем сразу в момент нажатия,
// чтобы даже очень короткое нажатие не потерялось.
let jumpHit = false;
// То же для кнопки «Бросок» (бой с боссом)
let throwHit = false;

// Какая клавиша за что отвечает
const keyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyZ: 'jump',
  Space: 'jump',
  ArrowUp: 'jump',
  KeyX: 'throw',
};

window.addEventListener('keydown', (e) => {
  unlockAudio();
  const action = keyMap[e.code];
  if (action) {
    if (action === 'jump' && !e.repeat) jumpHit = true; // repeat — это автоповтор при удержании
    if (action === 'throw' && !e.repeat) throwHit = true;
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
  touch.left = touch.right = touch.jump = touch.throw = false;
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
      else if (btn === 'throw') throwHit = true;
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

// Сколько шагов длится затемнение (шаг сценки type: 'fade')
const FADE_TIME = 24;

// Кадр анимации «Молоток», в который молоток бьёт (считаем с нуля)
const HAMMER_HIT_FRAME = 1;

// Кнопка «ПРОПУСТИТЬ» в правом верхнем углу
const SKIP = { x: 174, y: 2, w: 64, h: 11 };

// Попал ли тап в кнопку «ПРОПУСТИТЬ» (зону делаем чуть больше кнопки — для пальца)
function tapOnSkip(t) {
  return t.x >= SKIP.x - 6 && t.y <= SKIP.y + SKIP.h + 6;
}

// Движок сценок. Одна и та же «машина» работает для нескольких экранов:
// ЗАСТАВКА, ПОРАЖЕНИЕ, ПОБЕДА_УРОВНЯ и ЗВОНОК. Отличаются они только сценарием.
// createSceneState('intro') создаёт экран, который по умолчанию играет сценарий intro.
// В enter() можно передать имя сценария из scenes.js или сразу готовый сценарий-объект.
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

    enter(scene) {
      this.scene = typeof scene === 'object' ? scene : SCENES[scene || defaultScene];
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
    // и во время разговора по телефону (там HUD уровня)
    showSkip() {
      if (this.scene.background === 'level' || this.scene.background === 'boss') return false;
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
        // Ждём нажатия (первые 20 шагов нажатие не считаем, чтобы не пролистнуть случайно).
        // auto: N — титр сам листается через N секунд
        if (pressed && this.timer > 20) this.nextStep();
        else if (step.auto && this.timer >= step.auto * 60) this.nextStep();
      } else if (step.type === 'fade') {
        // Затемнение: шторки закрываются за 24 шага
        if (this.timer >= FADE_TIME) this.nextStep();
      } else if (step.type === 'picture') {
        // Картинка-анимация: идёт seconds секунд, нажатие — пропустить
        if (this.timer >= (step.seconds || 2) * 60 || (pressed && this.timer > 20)) this.nextStep();
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
      } else if (step.type === 'picture') {
        const p = Math.min(1, this.timer / ((step.seconds || 2) * 60));
        PICTURES[step.picture](ctx, p, this.tick);
      } else {
        // Фон 'level' — замерший уровень (для разговора по телефону)
        if (this.scene.background === 'level') levelState.draw();
        else if (this.scene.background === 'boss') bossState.draw();     // арена босса
        else BACKGROUNDS[this.scene.background](ctx);
        this.drawActors();
        if (step.type === 'phone') this.drawPhone();
        if (step.type === 'say') this.drawDialog(step);
        if (step.type === 'caption') this.drawCaption(step);
        if (step.type === 'fade') {
          // Тёмные полосы растут, пока не закроют весь экран
          const h = Math.ceil(8 * this.timer / FADE_TIME);
          ctx.fillStyle = '#1a1c2c';
          for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, h);
        }
      }

      if (this.showSkip()) this.drawSkipButton();
      if (this.scene.background !== 'level' && this.scene.background !== 'boss') drawVersion();   // на уровне версия уже есть в HUD
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
      if (f) drawPhoneIcon(f.x + 14 + shake, FLOOR_Y - 40, this.timer);
      else drawPhoneIcon(116 + shake, 50, this.timer);     // нет Филиппа на фоне — телефон посередине
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
// Уровень делится на ЧАСТИ (например «Первый этаж», «Второй этаж», «Двор»).
// Каждая часть — свой ряд экранов. Между частями — затемнение и титр.
// Шкала HUD, Лера и часы считают весь уровень целиком, через все части.
const TILE = 8;            // размер плитки
const COLS = 30;           // плиток в ширину на одном экране
const ROWS = 15;           // плиток в высоту (без HUD)
const HUD_H = 16;          // высота HUD сверху (2 ряда плиток)
const SCREEN_W = COLS * TILE;  // 240 — ширина одного экрана

// Символы карты, которые игра знает. Буквы «скоро» пока ничего не делают.
//   N — выход из части (лестница наверх, окно), L — Лера с досками (картинка)
//   b — пиво, k — Кирилл, t — Туся, w — пылесос, l — лего, i — грабли
//   v — Вася, n — Настя (только на арене босса), x — сигареты, u — кофе
const MAP_SYMBOLS = '.#-PCENLbktwlivnxu' + Object.keys(FURNITURE).join('');
const MAP_SOON = 'mgs';

// Размеры особых предметов в плитках (символ — левый нижний угол)
const SPECIAL_SIZES = { E: { w: 4, h: 4 }, N: { w: 3, h: 4 }, L: { w: 2, h: 3 } };

let levelParts = [];     // все части уровня
let partIndex = 0;       // в какой части сейчас Филипп
let level = null;        // текущая часть: всё, что нужно для игры (см. buildPart)
let bossArena = null;    // арена босса: собирается из LEVELS[0].boss как обычная часть
let totalLength = 1;     // длина всего уровня для шкалы HUD: от старта до калитки через все части

// Ошибки в карте. Если они есть, вместо игры показываем экран с ошибками.
const LEVEL_ERRORS = [];

// Пиксели на экране для плитки: столбец c, строка r
function tileX(c) { return c * TILE; }
function tileY(r) { return HUD_H + r * TILE; }

// Проверяем карту и собираем из неё все части уровня
function buildLevel(data) {
  const errors = LEVEL_ERRORS;
  if (!data || !Array.isArray(data.parts) || data.parts.length === 0) {
    errors.push('В LEVELS.JS НЕТ НИ ОДНОЙ ЧАСТИ УРОВНЯ (PARTS).');
    return;
  }
  if (!data.boss) {
    errors.push('В LEVELS.JS НЕТ АРЕНЫ БОССА (BOSS).');
    return;
  }
  // 1) Проверяем каждый экран каждой части и арену: фон, 15 строк по 30 символов, известные символы
  const toCheck = data.parts.concat([{ screens: [data.boss], arena: true }]);
  toCheck.forEach((part, pi) => {
    const pn = part.arena ? 'АРЕНА БОССА' : 'ЧАСТЬ ' + (pi + 1);
    if (!Array.isArray(part.screens) || part.screens.length === 0) {
      errors.push(pn + ': НЕТ НИ ОДНОГО ЭКРАНА.');
      return;
    }
    part.screens.forEach((scr, i) => {
      const n = pn + ', ЭКРАН ' + (i + 1);
      if (!LEVEL_BACKGROUNDS[scr.bg]) errors.push(n + ': НЕИЗВЕСТНЫЙ ФОН «' + scr.bg + '».');
      if (!Array.isArray(scr.map)) {
        errors.push(n + ': НЕТ КАРТЫ MAP.');
        return;
      }
      if (scr.map.length !== ROWS) errors.push(n + ': СТРОК ' + scr.map.length + ', А НУЖНО 15.');
      scr.map.forEach((row, r) => {
        if (row.length !== COLS) {
          errors.push(n + ', СТРОКА ' + (r + 1) + ': СИМВОЛОВ ' + row.length + ', А НУЖНО 30.');
        }
        for (let c = 0; c < row.length; c++) {
          const ch = row[c];
          if (MAP_SYMBOLS.indexOf(ch) === -1 && MAP_SOON.indexOf(ch) === -1) {
            errors.push(n + ', СТРОКА ' + (r + 1) + ', СИМВОЛ ' + (c + 1) + ': НЕИЗВЕСТНЫЙ ЗНАК «' + ch + '».');
          }
        }
      });
    });
  });
  if (errors.length > 0) return;

  // 2) Собираем части. offset — где часть начинается на общей шкале
  levelParts = [];
  let offset = 0;
  data.parts.forEach((part, pi) => {
    const lp = buildPart(part, pi, pi === data.parts.length - 1);
    lp.offset = offset;
    offset += lp.width;
    levelParts.push(lp);
  });
  // 3) Арена босса — отдельная «часть» из одного экрана
  bossArena = buildPart({ name: data.boss.name, screens: [data.boss] }, -1, false, true);
  if (errors.length > 0) return;
  const last = levelParts[levelParts.length - 1];
  totalLength = last.offset + last.gate.x;
  bossArena.offset = totalLength - SCREEN_W / 2;   // на шкале HUD Филипп на арене — у самого финиша
}

// Собирает одну часть уровня из её экранов
// isArena = true — это арена босса: там не нужны ни выход N, ни калитка E
function buildPart(part, pi, isLast, isArena) {
  const errors = LEVEL_ERRORS;
  const pn = isArena ? 'АРЕНА БОССА' : 'ЧАСТЬ ' + (pi + 1);
  const lp = {
    name: part.name || pn,            // название части для титра
    exitScene: part.exitScene,        // сценка при выходе из части (например простыни у окна)
    screens: part.screens,
    width: part.screens.length * SCREEN_W,
    rows: [],          // вся карта части: 15 длинных строк
    solids: [],        // твёрдые прямоугольники: плитки # и предметы
    tops: [],          // полки «-»: стоять сверху, снизу насквозь
    furniture: [],     // предметы для рисования
    stairs: [],        // где стоят лестницы (для надписи Леры)
    phones: [],        // телефоны-звонки {x, y}
    npcs: [],          // Лера с досками {x, y, triggerX}
    beers: [],         // пиво {x, y}
    boosts: [],        // бустеры {kind: 'cig' или 'coffee', x, y}
    spawns: [],        // где появляются враги {type, x, y} (y — где ноги)
    twins: [],         // арена босса: где стоят Вася и Настя {name, x, y}
    lego: [],          // россыпи лего {x, y, w, h}
    rakes: [],         // грабли {x, y, w, h}
    puddles: [],       // лужи {x, y, w, h}: скользко
    hot: [],           // горячий верх мангала {x, y, w, h}
    swings: [],        // качели {x, y}: сиденье раскачивается
    exit: null,        // выход из части {x, y}
    gate: null,        // калитка-финиш {x, y}
    start: null,       // старт Филиппа {x, y}
  };
  for (let r = 0; r < ROWS; r++) lp.rows.push(part.screens.map((s) => s.map[r]).join(''));

  let starts = 0, gates = 0, exits = 0;
  const totalCols = lp.rows[0].length;
  for (let r = 0; r < ROWS; r++) {
    const row = lp.rows[r];
    for (let c = 0; c < totalCols; c++) {
      const ch = row[c];
      const where = pn + ', ЭКРАН ' + (Math.floor(c / COLS) + 1) + ', СТРОКА ' + (r + 1) + ', СИМВОЛ ' + (c % COLS + 1);
      // Соседние плитки # и - в строке склеиваем в один длинный прямоугольник
      if ((ch === '#' || ch === '-') && (c === 0 || row[c - 1] !== ch)) {
        let len = 1;
        while (c + len < totalCols && row[c + len] === ch) len++;
        if (ch === '#') lp.solids.push({ x: tileX(c), y: tileY(r), w: len * TILE, h: TILE });
        else lp.tops.push({ x: tileX(c), y: tileY(r), w: len * TILE });
      }
      if (ch === 'P') {
        starts++;
        lp.start = { x: tileX(c) - 1, y: tileY(r + 1) - player.h };
        continue;
      }
      if (ch === 'C') {
        // Телефон висит над полом плитки: низ телефона на 3 пикселя выше пола
        lp.phones.push({ x: tileX(c), y: tileY(r + 1) - 14 });
        continue;
      }
      if (ch === 'b') { lp.beers.push({ x: tileX(c), y: tileY(r + 1) - 10 }); continue; }
      if (ch === 'x') { lp.boosts.push({ kind: 'cig', x: tileX(c), y: tileY(r + 1) - 9 }); continue; }
      if (ch === 'u') { lp.boosts.push({ kind: 'coffee', x: tileX(c), y: tileY(r + 1) - 9 }); continue; }
      if (ch === 'k') { lp.spawns.push({ type: 'kirill', x: tileX(c), y: tileY(r + 1) }); continue; }
      if (ch === 't') { lp.spawns.push({ type: 'cat', x: tileX(c), y: tileY(r + 1) }); continue; }
      if (ch === 'w') { lp.spawns.push({ type: 'vacuum', x: tileX(c), y: tileY(r + 1) }); continue; }
      if (ch === 'v' || ch === 'n') { lp.twins.push({ name: ch === 'v' ? 'vasya' : 'nastya', x: tileX(c), y: tileY(r + 1) }); continue; }
      if (ch === 'l') { lp.lego.push({ x: tileX(c), y: tileY(r) + 5, w: 8, h: 3 }); continue; }
      if (ch === 'i') { lp.rakes.push({ x: tileX(c), y: tileY(r) + 4, w: 8, h: 4, timer: 0 }); continue; }
      // Крупные вещи: символ — левый нижний угол, предмет растёт вверх и вправо
      const size = FURNITURE[ch] || SPECIAL_SIZES[ch];
      if (!size) continue;
      if (r - size.h + 1 < 0) {
        errors.push(where + ': ПРЕДМЕТ «' + ch + '» НЕ ВЛЕЗАЕТ ПО ВЫСОТЕ. ОПУСТИ ЕГО НИЖЕ.');
        continue;
      }
      if (c + size.w > totalCols) {
        errors.push(where + ': ПРЕДМЕТ «' + ch + '» ВЫЛЕЗАЕТ ЗА ПРАВЫЙ КРАЙ.');
        continue;
      }
      const x = tileX(c);
      const y = tileY(r + 1) - size.h * TILE;   // верх предмета
      if (ch === 'E') { gates++; lp.gate = { x: x, y: y }; continue; }
      if (ch === 'N') { exits++; lp.exit = { x: x, y: y }; continue; }
      if (ch === 'L') { lp.npcs.push({ x: x, y: y }); continue; }
      // Предмет целиком твёрдый: каждая его часть — препятствие
      const def = FURNITURE[ch];
      lp.furniture.push({ def: def, x: x, y: y });
      if (ch === 'I') lp.stairs.push(x);
      for (const p of furnitureParts(def)) {
        lp.solids.push({ x: x + p.x, y: y + p.y, w: p.w, h: p.h, bounce: !!def.bounce, lie: !!def.lie });
        if (def.hot) lp.hot.push({ x: x + p.x - 1, y: y + p.y - 1, w: p.w + 2, h: p.h + 1 });
      }
      if (def.puddle) lp.puddles.push({ x: x + def.puddle.x, y: y + def.puddle.y, w: def.puddle.w, h: def.puddle.h });
      if (def.swing) lp.swings.push({ x: x, y: y });
    }
  }
  if (starts === 0) errors.push(pn + ': НЕТ СТАРТА P. ПОСТАВЬ ОДНУ БУКВУ P.');
  if (starts > 1) errors.push(pn + ': СТАРТОВ P ' + starts + ', А НУЖЕН ОДИН.');
  if (isArena) {
    if (lp.twins.length !== 2) errors.push(pn + ': НУЖНЫ ВАСЯ (V) И НАСТЯ (N) — РОВНО ПО ОДНОЙ.');
  } else if (isLast) {
    if (gates === 0) errors.push(pn + ': НЕТ ФИНИША E. В ПОСЛЕДНЕЙ ЧАСТИ НУЖНА ОДНА БУКВА E.');
    if (gates > 1) errors.push(pn + ': ФИНИШЕЙ E ' + gates + ', А НУЖЕН ОДИН.');
    if (exits > 0) errors.push(pn + ': В ПОСЛЕДНЕЙ ЧАСТИ НЕ НУЖЕН ВЫХОД N — ТАМ ФИНИШ E.');
  } else {
    if (exits === 0) errors.push(pn + ': НЕТ ВЫХОДА N В СЛЕДУЮЩУЮ ЧАСТЬ.');
    if (exits > 1) errors.push(pn + ': ВЫХОДОВ N ' + exits + ', А НУЖЕН ОДИН.');
    if (gates > 0) errors.push(pn + ': ФИНИШ E СТАВЬ ТОЛЬКО В ПОСЛЕДНЕЙ ЧАСТИ.');
  }
  // Телефоны по порядку слева направо
  lp.phones.sort((a, b) => a.x - b.x);
  // Лера говорит «Я ТЕБЯ ЖДУ!», когда Филипп дошёл до ближайшей слева лестницы
  for (const npc of lp.npcs) {
    const left = lp.stairs.filter((sx) => sx < npc.x);
    npc.triggerX = left.length ? Math.max(...left) : npc.x - 120;
  }
  return lp;
}

// x, y, w, h — это ХИТБОКС: невидимая рамка, по которой считаются столкновения.
// Она меньше картинки 16x24 и примерно совпадает с телом.
const player = {
  x: 20, y: 98,    // позиция хитбокса (левый верхний угол) внутри текущей части
  w: 10, h: 22,    // размер хитбокса
  vx: 0, vy: 0,    // скорость по x и y
  onGround: false, // стоит ли на земле
  bouncing: false, // летит вверх после батута (тогда отпущенный прыжок не обрезает полёт)
  stun: 0,         // сколько шагов не слушается кнопок (споткнулся, оглушён, отлетел)
  stunKind: '',    // 'trip' — лежит, 'daze' — звёздочки над головой, 'knock' — отлетел
  standingOn: null,// пылесос, на котором едет
  lying: false,    // лежит на диване или шезлонге (кураж восполняется)
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

// Шкала прогресса в HUD: где на ней точка всего уровня (с учётом частей)
const BAR = { x: 6, y: 11, w: 228, h: 2 };
function barX(globalX) {
  const part = Math.max(0, Math.min(1, globalX / totalLength));
  return Math.round(BAR.x + part * BAR.w);
}

// Где Филипп на всём уровне (а не только в текущей части)
function playerGlobalX() {
  return level.offset + player.x;
}

// Жёлтый силуэт кадра — для свечения от кофе (готовим один раз на каждый кадр)
const glowCache = new Map();
function glowOf(frame) {
  if (!glowCache.has(frame)) glowCache.set(frame, makeSilhouette(frame, '#ffcd75'));
  return glowCache.get(frame);
}

// Мешок для случайных фраз: берём случайную, пока все не кончатся, потом мешок наполняется снова.
// Так фразы не повторяются подряд, пока не прозвучат все.
const phraseBags = {};
function takeFromBag(name, list) {
  if (!phraseBags[name] || phraseBags[name].length === 0) phraseBags[name] = list.slice();
  const bag = phraseBags[name];
  return bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
}

// =============================================
// ВРАГИ: создание и движение
// =============================================
// Размеры хитбоксов врагов. Картинка рисуется по центру хитбокса, ноги — по низу.
const ENEMY_SIZES = {
  kirill: { w: 8,  h: 18 },
  cat:    { w: 10, h: 7 },
  vacuum: { w: 16, h: 7 },
};

// Новый враг из точки появления на карте
function makeEnemy(sp) {
  const size = ENEMY_SIZES[sp.type];
  return {
    type: sp.type, w: size.w, h: size.h,
    x: sp.x + (8 - size.w) / 2, y: sp.y - size.h,   // ноги на полу плитки
    homeX: sp.x, vx: 0, vy: 0, dir: -1,             // сначала идёт влево — навстречу Филиппу
    state: 'walk', timer: Math.floor(Math.random() * 120), cool: 0, onGround: false,
  };
}

// Есть ли под точкой опора (пол, предмет или полка)
function hasGround(x, y) {
  const probe = { x: x, y: y, w: 1, h: 2 };
  return level.solids.some((s) => overlaps(probe, s)) ||
         level.tops.some((t) => x >= t.x && x < t.x + t.w && y >= t.y - 1 && y <= t.y + 2);
}

// Двигаем врага: гравитация, стены, края. avoidEdges — разворачиваться у края, а не падать
function moveEnemy(e, avoidEdges) {
  e.vy = Math.min(CONFIG.maxFall, e.vy + CONFIG.gravity);
  // по X
  const oldX = e.x;
  e.x += e.vx;
  let blocked = e.x < 0 || e.x + e.w > level.width;
  for (const s of level.solids) if (overlaps(e, s)) blocked = true;
  if (!blocked && avoidEdges && e.onGround) {
    const footX = e.vx > 0 ? e.x + e.w : e.x - 1;
    if (!hasGround(footX, e.y + e.h)) blocked = true;
  }
  if (blocked) { e.x = oldX; e.dir = -e.dir; e.vx = 0; }
  // по Y
  const oldBottom = e.y + e.h;
  e.y += e.vy;
  e.onGround = false;
  for (const s of level.solids) {
    if (overlaps(e, s)) {
      if (e.vy > 0) { e.y = s.y - e.h; e.onGround = true; }
      else e.y = s.y + s.h;
      e.vy = 0;
    }
  }
  if (e.vy >= 0) {
    for (const t of level.tops) {
      if (oldBottom <= t.y && e.y + e.h >= t.y && e.x + e.w > t.x && e.x < t.x + t.w) {
        e.y = t.y - e.h; e.vy = 0; e.onGround = true;
      }
    }
  }
}

// Копия списка «какие телефоны взяты» по всем частям
function copyTaken(taken) {
  return taken.map((list) => list.slice());
}

const levelState = {
  leraX: 0,          // где Лера на ВСЁМ уровне (её иконка на шкале)
  leraSpeed: 0,      // её текущая скорость
  waitSteps: 0,      // сколько шагов ещё длится фора
  taken: [],         // для каждой части: какие телефоны уже взяты (true/false)
  saved: null,       // что запомнили на месте последнего звонка — оттуда «ЕЩЁ РАЗ»
  alarm: false,      // Лера близко?
  alarmTimer: 0,     // для мигания и вибрации
  ringing: -1,       // какой телефон сейчас звонит (пауза перед разговором), -1 — никакой
  ringTimer: 0,      // сколько шагов осталось до разговора
  tick: 0,           // счётчик для анимаций
  boingTimer: 0,     // сколько ещё показывать надпись «БОЙНГ!»
  boingX: 0, boingY: 0,
  lives: 3,          // кружки пива = жизни
  invuln: 0,         // сколько шагов ещё мигает и неуязвим после удара
  beersTaken: [],    // для каждой части: какое пиво уже выпито (true/false)
  enemies: [],       // враги текущей части: Кирилл, Туся, пылесос
  popups: [],        // всплывающие надписи «АЙ!», «МЯУ!», «+1»
  swingCool: 0,      // пауза после удара сиденьем качелей
  boostsTaken: [],   // для каждой части: какие сигареты и кофе уже взяты
  courage: 1,        // кураж: 1 — полный, 0 — пусто
  coffee: 0,         // сколько шагов ещё действует кофе
  coffeeCrash: 0,    // сколько шагов ещё длится «отходняк» после кофе
  tipsy: 0,          // сколько шагов ещё действует «подпитие»
  tipsyLevel: 0,     // насколько сильно: 1 — одно пиво, 2 — второе подряд...
  smoke: 0,          // сколько шагов ещё тянется дымок после сигарет
  smokeTrail: [],    // облачка дыма {x, y, t}
  sofaIdle: 0,       // сколько шагов Филипп стоит неподвижно на диване

  // mode:
  //   'resume'   — вернуться после разговора по телефону: ничего не сбрасываем
  //   'nextPart' — перейти в следующую часть уровня (Лера и часы продолжают)
  //   'lastCall' — «ЕЩЁ РАЗ»: продолжить с места последнего звонка
  //   иначе      — начать уровень сначала
  enter(mode) {
    if (mode === 'resume') return;
    if (mode === 'nextPart') {
      partIndex++;
      level = levelParts[partIndex];
      this.placePlayer(level.start.x, level.start.y);
      this.resetPart();
      this.alarm = false;
      player.lying = false;
      return;
    }
    if (mode !== 'lastCall' || !this.saved) {
      this.saved = { part: 0, x: levelParts[0].start.x, y: levelParts[0].start.y, leraX: 0,
                     leraSpeed: CONFIG.leraSpeed, clockSteps: 0,
                     taken: levelParts.map((p) => p.phones.map(() => false)),
                     beersTaken: levelParts.map((p) => p.beers.map(() => false)),
                     boostsTaken: levelParts.map((p) => p.boosts.map(() => false)) };
    }
    // Восстанавливаем всё как было на старте или в момент последнего звонка
    partIndex = this.saved.part;
    level = levelParts[partIndex];
    this.placePlayer(this.saved.x, this.saved.y);
    this.leraX = this.saved.leraX;
    this.leraSpeed = this.saved.leraSpeed;
    this.taken = copyTaken(this.saved.taken);
    this.beersTaken = copyTaken(this.saved.beersTaken);
    this.boostsTaken = copyTaken(this.saved.boostsTaken);
    this.lives = CONFIG.startLives;                   // «ЕЩЁ РАЗ» — снова 3 кружки
    this.resetEffects();                              // и полный кураж, без кофе и пива
    this.invuln = 0;
    this.resetPart();
    clockSteps = this.saved.clockSteps;
    this.waitSteps = CONFIG.leraHeadStart * 60;    // фора в шагах
    this.alarm = false;
    this.alarmTimer = 0;
    this.ringing = -1;
  },

  // Враги и ловушки текущей части — в начальное положение
  resetPart() {
    this.enemies = level.spawns.map((sp) => makeEnemy(sp));
    for (const r of level.rakes) r.timer = 0;
    this.popups = [];
    this.swingCool = 0;
    player.stun = 0;
    player.standingOn = null;
  },

  // Кураж полный, никаких кофе, пива и дыма
  resetEffects() {
    this.courage = 1;
    this.coffee = 0;
    this.coffeeCrash = 0;
    this.tipsy = 0;
    this.tipsyLevel = 0;
    this.smoke = 0;
    this.smokeTrail = [];
    this.sofaIdle = 0;
    player.lying = false;
  },

  // Множитель от куража: выше половины — 100%, ниже — плавно до courageMinFactor (70%) на нуле
  courageFactor() {
    if (this.courage >= 0.5) return 1;
    return CONFIG.courageMinFactor + (1 - CONFIG.courageMinFactor) * (this.courage / 0.5);
  },

  // Множитель скорости бега: кураж, кофе, «отходняк»
  speedFactor() {
    let k = this.courageFactor();
    if (this.coffee > 0) k *= CONFIG.coffeeSpeedMul;
    else if (this.coffeeCrash > 0) k *= CONFIG.coffeeCrashMul;
    return k;
  },

  // Множитель ВЫСОТЫ прыжка: кураж и подпитие
  jumpFactor() {
    let k = this.courageFactor();
    if (this.tipsy > 0) k *= CONFIG.tipsyJumpMul;
    return k;
  },

  // Каждый шаг игры: кураж убывает (или восполняется лёжа), идут таймеры кофе, пива, дыма
  tickEffects() {
    const step = 1 / 60;
    if (player.lying) {
      this.courage = Math.min(1, this.courage + step / CONFIG.sofaRefillSeconds);
      if (this.tick % 90 === 0) this.popup('ХР-Р-Р...', player.x + 10, player.y + 8);
    } else {
      this.courage = Math.max(0, this.courage - step / CONFIG.courageDrainSeconds);
      if (this.courage < CONFIG.courageLow && Math.random() < 1 / 420) this.popup('ЭХ...', player.x + 5, player.y - 2);
    }
    if (this.coffee > 0) {
      this.coffee--;
      if (this.coffee === 0) {
        this.coffeeCrash = Math.round(CONFIG.coffeeCrashSeconds * 60);
        this.popup('ЗЕ-Е-ЕВ...', player.x + 5, player.y - 2);
      }
    } else if (this.coffeeCrash > 0) {
      this.coffeeCrash--;
    }
    if (this.tipsy > 0) {
      this.tipsy--;
      if (this.tipsy === 0) this.tipsyLevel = 0;
      if (Math.random() < 1 / 200) this.popup('ИК!', player.x + 5, player.y - 2);
    }
    if (this.smoke > 0) {
      this.smoke--;
      if (this.smoke % 5 === 0) this.smokeTrail.push({ x: player.x + player.w / 2 - player.facing * 4, y: player.y + 6, t: 0 });
    }
    this.smokeTrail = this.smokeTrail.filter((p) => ++p.t < 40);
  },

  // Подобрал бустер: сигареты, кофе
  takeBoost(kind, x, y) {
    if (kind === 'cig') {
      this.courage = Math.min(1, this.courage + CONFIG.cigCourage);
      this.smoke = Math.round(CONFIG.smokeSeconds * 60);
      this.popup('+КУРАЖ', x + 4, y - 2);
    } else {
      this.coffee = Math.round(CONFIG.coffeeSeconds * 60);
      this.coffeeCrash = 0;
      this.popup('КОФЕ!', x + 4, y - 2);
    }
    pickupSound();
  },

  // Выпил пиво: «подпитие». Второе подряд — сильнее и дольше
  drinkBeer() {
    if (this.tipsy > 0) {
      this.tipsyLevel = Math.min(3, this.tipsyLevel + 1);
      this.tipsy += Math.round(CONFIG.tipsySeconds * 60);
    } else {
      this.tipsyLevel = 1;
      this.tipsy = Math.round(CONFIG.tipsySeconds * 60);
    }
  },

  // Всплывающая надпись над точкой x, y
  popup(text, x, y) {
    this.popups.push({ text: text, x: x, y: y, t: 0 });
  },

  // Удар: минус кружка, отброс, мигание. srcX — откуда пришёл удар (чтобы отбросить в другую сторону)
  hurt(text, srcX) {
    if (this.invuln > 0 || this.coffee > 0) return;   // мигает после удара или пьёт кофе — неуязвим
    this.lives--;
    this.invuln = Math.round(CONFIG.invulnSeconds * 60);
    const cx = player.x + player.w / 2;
    const dir = srcX === undefined ? -player.facing : (cx < srcX ? -1 : 1);
    player.vx = dir * 2;
    player.vy = -2.5;
    player.onGround = false;
    player.stun = 15;                    // чуть-чуть не слушается кнопок — отлетает
    player.stunKind = 'knock';
    hurtSound();
    this.popup(text, cx, player.y - 4);
  },

  // Ставим Филиппа в точку и сразу наводим туда камеру
  placePlayer(x, y) {
    player.x = x;
    player.y = y;
    player.vx = 0; player.vy = 0;
    player.onGround = false;
    player.bouncing = false;
    player.facing = 1;
    player.anim = 'idle';
    player.animTime = 0;
    cameraX = Math.max(0, Math.min(level.width - W, player.x + player.w / 2 - W / 2));
  },

  update(input) {
    this.tick++;
    if (this.boingTimer > 0) this.boingTimer--;

    // --- Звонит телефон: короткая пауза, игра стоит, потом разговор ---
    if (this.ringing >= 0) {
      this.ringTimer--;
      if (this.ringTimer <= 0) this.startCall(this.ringing);
      return;
    }

    this.movePlayer(input);
    clockSteps++;
    this.tickEffects();
    if (this.invuln > 0) this.invuln--;
    if (this.swingCool > 0) this.swingCool--;

    // --- Враги, ловушки, пиво ---
    this.updateEnemies();
    this.updateTraps();
    this.popups = this.popups.filter((p) => ++p.t < 50);

    // Кружки кончились — Лера догоняет
    if (this.lives <= 0) {
      setState('defeat');
      return;
    }

    // --- Телефоны: коснулся — звонок ---
    const taken = this.taken[partIndex];
    for (let i = 0; i < level.phones.length; i++) {
      const ph = level.phones[i];
      const box = { x: ph.x - 2, y: ph.y - 2, w: 11, h: 15 };   // чуть больше телефона — легче попасть
      if (!taken[i] && overlaps(player, box)) {
        taken[i] = true;                          // телефон исчезает
        this.ringing = i;
        this.ringTimer = Math.round(CONFIG.callPause * 60);
        player.vx = 0;
        pickupSound();
        return;
      }
    }

    // --- Выход в следующую часть уровня ---
    if (level.exit && overlaps(player, { x: level.exit.x + 4, y: level.exit.y, w: 16, h: 32 })) {
      this.startPartTransition();
      return;
    }

    // --- Финиш ---
    if (level.gate && player.x + player.w >= level.gate.x + 4) {
      // Калитка ведёт на арену босса: затемнение, дальше — арена
      setState('inLevelScene', { background: 'level', next: 'boss', nextArg: 'intro', steps: [{ type: 'fade' }] });
      return;
    }

    // --- Лера едет по шкале ---
    if (this.waitSteps > 0) this.waitSteps--;         // ещё фора — стоит на месте
    else this.leraX += this.leraSpeed;

    // Догнала — поражение
    if (this.leraX >= playerGlobalX()) {
      setState('defeat');
      return;
    }

    // Близко — тревога: мигание шкалы и вибрация телефона раз в секунду.
    // Пока идёт фора, тревоги нет.
    const wasAlarm = this.alarm;
    this.alarm = this.waitSteps === 0 && playerGlobalX() - this.leraX < CONFIG.alarmDistance;
    if (this.alarm) {
      if (!wasAlarm) this.alarmTimer = 0;
      if (this.alarmTimer % 60 === 0) vibrate();
      this.alarmTimer++;
    }
  },

  // Разговор по телефону: отмазка Филиппа, ответ Леры. Потом Лера отлетает назад.
  startCall(i) {
    this.ringing = -1;
    this.alarm = false;
    // Лера отлетает назад и немного ускоряется
    this.leraX = Math.max(0, this.leraX - CONFIG.callPushBack);
    this.leraSpeed += CONFIG.leraSpeedUp;
    // Тихо запоминаем место звонка: после поражения «ЕЩЁ РАЗ» начнётся отсюда
    const ph = level.phones[i];
    this.saved = { part: partIndex, x: ph.x - 1, y: ph.y + 14 - player.h, leraX: this.leraX,
                   leraSpeed: this.leraSpeed, clockSteps: clockSteps, taken: copyTaken(this.taken),
                   beersTaken: copyTaken(this.beersTaken), boostsTaken: copyTaken(this.boostsTaken) };
    // Сценка разговора поверх замершего уровня
    setState('inLevelScene', {
      background: 'level',
      next: 'level',
      nextArg: 'resume',
      steps: [
        { type: 'say', who: 'filipp', text: takeFromBag('excuses', CALL_EXCUSES) },
        { type: 'say', who: 'lera', text: takeFromBag('answers', CALL_ANSWERS) },
      ],
    });
  },

  // Враги: Кирилл, Туся, пылесос
  updateEnemies() {
    const pcx = player.x + player.w / 2;
    const pBottom = player.y + player.h;
    for (const e of this.enemies) {
      const ecx = e.x + e.w / 2;
      const dx = pcx - ecx;
      const sameRow = Math.abs(pBottom - (e.y + e.h)) < 16;   // Филипп примерно на том же полу
      if (e.cool > 0) e.cool--;
      e.timer++;

      if (e.type === 'kirill') {
        if (e.state === 'sit') {
          e.vx = 0;
          if (e.timer >= CONFIG.kirillSitSeconds * 60) { e.state = 'walk'; e.timer = 0; }
        } else if (e.state === 'chase') {
          e.dir = dx < 0 ? -1 : 1;
          e.vx = e.dir * CONFIG.kirillChaseSpeed;
          if (!sameRow || Math.abs(dx) > 110) { e.state = 'walk'; e.timer = 0; }
        } else {
          if (Math.abs(e.x - e.homeX) > 48) e.dir = e.x > e.homeX ? -1 : 1;   // ходит в своей зоне
          e.vx = e.dir * CONFIG.kirillSpeed;
          if (sameRow && Math.abs(dx) < 72) { e.state = 'chase'; e.timer = 0; }
        }
        moveEnemy(e, true);
        // Касание: сверху — обиделся и сел, сбоку — минус кружка
        if (e.state !== 'sit' && overlaps(player, e)) {
          if (player.vy > 0 && pBottom - e.y < 10) {
            e.state = 'sit'; e.timer = 0;
            player.vy = -3.5;
            this.popup('НУ ПА-А-АП!', ecx, e.y - 6);
          } else {
            this.hurt('АЙ!', ecx);
          }
        }
      }

      if (e.type === 'cat') {
        const catAbove = e.y + e.h < pBottom - 16 && Math.abs(dx) < 50;   // Туся на крыше, Филипп внизу
        if (e.state === 'dash') {
          e.vx = e.dir * CONFIG.catDashSpeed;
          if (e.timer > 150 || Math.abs(dx) > 130) { e.state = 'walk'; e.timer = 0; }
        } else if (e.state === 'wash') {
          e.vx = 0;
          if (e.timer > 120) { e.state = 'walk'; e.timer = 0; }
        } else {
          e.vx = e.dir * CONFIG.catSpeed;
          if (e.timer > 240) { e.state = 'wash'; e.timer = 0; }   // посидеть, умыться
        }
        if (e.state !== 'dash' && e.cool === 0 && ((sameRow && Math.abs(dx) < 60) || catAbove)) {
          e.state = 'dash'; e.timer = 0;                  // бросается под ноги (с крыши — спрыгивает)
          e.dir = dx < 0 ? -1 : 1;
        }
        moveEnemy(e, e.state !== 'dash');
        if (e.cool === 0 && this.coffee === 0 && overlaps(player, e)) {   // с кофе Туся не страшна
          player.stun = Math.round(CONFIG.tripSeconds * 60);   // споткнулся и упал
          player.stunKind = 'trip';
          player.vx = 0;
          meowSound();
          this.popup('МЯУ!', ecx, e.y - 8);
          e.cool = 150;
          e.state = 'walk'; e.timer = 0;
          e.dir = dx < 0 ? 1 : -1;                        // убегает в другую сторону
        }
      }

      if (e.type === 'vacuum') {
        const oldX = e.x;
        e.vx = e.dir * CONFIG.vacuumSpeed;
        moveEnemy(e, true);
        // Филипп стоит сверху — катится вместе с пылесосом
        if (player.standingOn === e) {
          player.x += e.x - oldX;
          player.y = e.y - player.h;
        } else if (e.cool === 0 && this.coffee === 0 && overlaps(player, e)) {
          player.stun = Math.round(CONFIG.dazeSeconds * 60);   // оглушён
          player.stunKind = 'daze';
          player.vx = dx < 0 ? -1.5 : 1.5;
          hurtSound();
          this.popup('БЗЗ!', ecx, e.y - 8);
          e.cool = 70;
        }
      }
    }
  },

  // Ловушки и пиво
  updateTraps() {
    const pcx = player.x + player.w / 2;
    // Лего: наступил — «АЙ!», подпрыгивает от боли, минус кружка
    for (const l of level.lego) {
      if (player.onGround && this.coffee === 0 && overlaps(player, l)) {
        this.hurt('АЙ!', undefined);
        player.vx *= 0.3;
        player.vy = -3;
      }
    }
    // Грабли: наступил — встают и бьют по лбу «БАМ!», звёздочки
    for (const r of level.rakes) {
      if (r.timer > 0) r.timer--;
      if (r.timer === 0 && player.onGround && this.coffee === 0 && overlaps(player, r)) {
        r.timer = 60;
        this.hurt('БАМ!', r.x + 20);
        player.stun = 40;
        player.stunKind = 'daze';
      }
    }
    // Мангал: верх горячий
    for (const h of level.hot) {
      if (overlaps(player, h)) this.hurt('ГОРЯЧО!', h.x + h.w / 2);
    }
    // Качели: сиденье бьёт и отбрасывает (кружку не отнимает)
    if (this.swingCool === 0 && this.coffee === 0) {
      for (const s of level.swings) {
        const seat = swingSeat(s.x, s.y, this.tick);
        if (overlaps(player, seat)) {
          player.vx = seat.swingDir * 2.5;
          player.vy = -2;
          player.onGround = false;
          player.stun = 25;
          player.stunKind = 'knock';
          this.swingCool = 50;
          hurtSound();
          this.popup('ОЙ!', pcx, player.y - 4);
        }
      }
    }
    // Пиво: +1 кружка, «бульк»
    const beers = this.beersTaken[partIndex];
    level.beers.forEach((b, i) => {
      if (!beers[i] && overlaps(player, { x: b.x, y: b.y, w: 8, h: 8 })) {
        beers[i] = true;
        this.lives = Math.min(CONFIG.maxLives, this.lives + 1);
        this.drinkBeer();                             // и «подпитие» на несколько секунд
        gulpSound();
        this.popup('+1', b.x + 4, b.y - 4);
      }
    });
    // Сигареты и кофе: подбираются на бегу, без остановки
    const boosts = this.boostsTaken[partIndex];
    level.boosts.forEach((b, i) => {
      if (!boosts[i] && overlaps(player, { x: b.x - 1, y: b.y - 1, w: 10, h: 10 })) {
        boosts[i] = true;
        this.takeBoost(b.kind, b.x, b.y);
      }
    });
  },

  // Переход в следующую часть: сценка выхода (если есть), затемнение, титр с названием части
  startPartTransition() {
    const next = levelParts[partIndex + 1];
    const steps = [];
    if (level.exitScene && SCENES[level.exitScene]) steps.push(...SCENES[level.exitScene].steps);
    steps.push({ type: 'fade' });
    steps.push({ type: 'title', text: 'ЧАСТЬ ' + (partIndex + 2) + '\n' + next.name.toUpperCase(), auto: 2 });
    setState('inLevelScene', { background: 'level', next: 'level', nextArg: 'nextPart', steps: steps });
  },

  // Бег, прыжки и столкновения Филиппа
  movePlayer(input) {
    // Лежит на диване: любая кнопка — встаёт
    if (player.lying && (keys.left || keys.right || keys.jump || input.jumpPressed || input.throwPressed)) {
      player.lying = false;
      this.sofaIdle = 0;
    }
    // Оглушён, споткнулся, отлетел или лежит — кнопки не слушаются
    const stunned = player.stun > 0 || player.lying;
    if (player.stun > 0) player.stun--;

    // Бег: разгон в сторону нажатой кнопки
    let dir = 0;
    if (!stunned) {
      if (keys.left) dir -= 1;
      if (keys.right) dir += 1;
    }

    // Кураж, кофе и «отходняк» меняют скорость бега
    const maxSpeed = CONFIG.playerMaxSpeed * this.speedFactor();

    // Лужа: очень скользко — разгоняться и тормозить почти невозможно
    const feet = { x: player.x, y: player.y + player.h - 1, w: player.w, h: 2 };
    const slippery = player.onGround && level.puddles.some((p) => overlaps(feet, p));
    const accel = slippery ? 0.03 : CONFIG.playerAccel;
    let friction = slippery ? 0.01 : CONFIG.playerFriction;
    // Подпитие: тормозит с запозданием, и его слегка тянет то влево, то вправо
    if (this.tipsy > 0) {
      friction *= CONFIG.tipsyBrake;
      if (player.onGround && !stunned) player.vx += Math.sin(this.tick / 30) * CONFIG.tipsyDrift * this.tipsyLevel;
    }

    if (dir !== 0) {
      player.vx += dir * accel;
      if (player.vx > maxSpeed) player.vx = maxSpeed;
      if (player.vx < -maxSpeed) player.vx = -maxSpeed;
    } else {
      // Торможение: плавно уменьшаем скорость до нуля
      if (player.vx > 0) player.vx = Math.max(0, player.vx - friction);
      if (player.vx < 0) player.vx = Math.min(0, player.vx + friction);
    }

    // Прыжок: только с земли и только в момент нажатия.
    // Чем быстрее бежит Филипп, тем выше прыжок: с места — jumpSpeed, с разбега — до jumpSpeedRun.
    // Кураж и пиво меняют ВЫСОТУ прыжка (поэтому скорость прыжка — через квадратный корень).
    if (input.jumpPressed && player.onGround && !stunned) {
      const run = Math.min(1, Math.abs(player.vx) / maxSpeed);   // 0 — стоит, 1 — полный бег
      player.vy = -(CONFIG.jumpSpeed + (CONFIG.jumpSpeedRun - CONFIG.jumpSpeed) * run) * Math.sqrt(this.jumpFactor());
      player.onGround = false;
    }
    // Отпустили прыжок, пока летим вверх — прыжок получается ниже.
    // После батута так не делаем: полёт всегда высокий.
    if (!keys.jump && player.vy < -1 && !player.bouncing) {
      player.vy = -1;
    }

    // Гравитация
    player.vy += CONFIG.gravity;
    if (player.vy > CONFIG.maxFall) player.vy = CONFIG.maxFall;
    if (player.vy >= 0) player.bouncing = false;

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
    let bounced = false;
    let standingOnSofa = false;
    for (const s of level.solids) {
      if (overlaps(player, s)) {
        if (player.vy > 0) {        // падали вниз — встали на платформу
          player.y = s.y - player.h;
          if (s.bounce) bounced = true;     // это батут — сейчас подбросит
          else player.onGround = true;
          if (s.lie) standingOnSofa = true; // диван или шезлонг
        } else if (player.vy < 0) { // летели вверх — ударились головой
          player.y = s.y + s.h;
        }
        player.vy = 0;
      }
    }

    // Батут: приземлился сверху — подлетаешь очень высоко, «БОЙНГ!»
    if (bounced) {
      player.vy = -CONFIG.trampolineSpeed;
      player.bouncing = true;
      boingSound();
      this.boingTimer = 30;
      this.boingX = player.x;
      this.boingY = player.y;
    }

    // Тонкие платформы: ловят, только если падаем сверху.
    // Если прыгаем снизу — пролетаем насквозь. Пылесос сверху — тоже такая платформа (едет).
    player.standingOn = null;
    if (player.vy >= 0) {
      for (const e of this.enemies) {
        if (e.type !== 'vacuum') continue;
        const sideBySide = player.x + player.w > e.x && player.x < e.x + e.w;
        if (oldBottom <= e.y + 1 && player.y + player.h >= e.y && sideBySide) {
          player.y = e.y - player.h;
          player.vy = 0;
          player.onGround = true;
          player.standingOn = e;
        }
      }
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

    // Диван или шезлонг: постоял неподвижно — лёг. Лера при этом идёт!
    if (standingOnSofa && !player.lying && dir === 0 && !keys.jump && Math.abs(player.vx) < 0.1 && player.stun === 0) {
      this.sofaIdle++;
      if (this.sofaIdle >= CONFIG.sofaLieSeconds * 60) {
        player.lying = true;
        this.popup('ХР-Р-Р...', player.x + 10, player.y + 8);
      }
    } else if (!player.lying) {
      this.sofaIdle = 0;
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
          // Кронштейны рисуем под крайними плитками полки
          drawShelfTile(ctx, tileX(c) - cam, tileY(r), bg.shelf || ['#ef7d57', '#b13e53'],
                        row[c - 1] !== '-', row[c + 1] !== '-', bg.shelfLook);
        }
      }
    }

    // Выход из части: в окне — открытое окно, иначе — проход наверх
    if (level.exit) {
      const scr = level.screens[Math.floor(level.exit.x / SCREEN_W)];
      drawPartExit(ctx, level.exit.x - cam, level.exit.y, scr.bg === 'windowEnd' ? 'window' : 'stairs', this.tick);
    }
    // Калитка и предметы (с тёмным контуром)
    if (level.gate) drawGate(ctx, level.gate.x - cam, level.gate.y);
    for (const f of level.furniture) {
      if (f.x - cam > W || f.x + f.def.w * TILE - cam < 0) continue;  // за экраном — не рисуем
      drawFurniture(ctx, f.def, f.x - cam, f.y, this.tick);
    }
    // Лера с досками у двери: когда Филипп дошёл до лестницы — «Я ТЕБЯ ЖДУ!»
    for (const npc of level.npcs) {
      drawLeraWithBoards(ctx, npc.x - cam, npc.y, this.tick, player.x + player.w >= npc.triggerX);
    }

    // Ловушки: лего и грабли
    for (const l of level.lego) drawLego(ctx, l.x - cam, l.y - 5);
    for (const r of level.rakes) {
      const lift = r.timer > 40 ? (60 - r.timer) / 20 : r.timer / 40;   // быстро встали, медленно легли
      drawRake(ctx, r.x - cam, r.y - 4, Math.max(0, lift));
    }
    // Пиво, которое ещё не выпито (покачивается)
    const beers = this.beersTaken[partIndex] || [];
    level.beers.forEach((b, i) => {
      if (!beers[i]) drawBeer(ctx, b.x - cam, b.y + Math.round(Math.sin(this.tick / 12 + i) * 1.5));
    });
    // Сигареты и кофе
    const boosts = this.boostsTaken[partIndex] || [];
    level.boosts.forEach((b, i) => {
      if (boosts[i]) return;
      if (b.kind === 'cig') drawCigs(ctx, b.x - cam, b.y);
      else drawCoffee(ctx, b.x - cam, b.y, this.tick);
    });
    // Враги
    for (const e of this.enemies) this.drawEnemy(e, cam);

    // Телефоны, которые ещё не взяты. Звонящий сейчас — трясётся сильнее и «ДЗЫНЬ!»
    const taken = this.taken[partIndex] || [];
    level.phones.forEach((ph, i) => {
      if (i === this.ringing) {
        const shake = (this.ringTimer >> 1) % 2 ? 1 : -1;
        drawPhonePickup(ctx, ph.x - cam + shake, ph.y - 6, this.tick * 3);
        drawTextCenteredShadow('ДЗЫНЬ!', ph.x - cam + 4, Math.max(HUD_H + 2, ph.y - 18), '#ffcd75', '#1a1c2c');
      } else if (!taken[i]) {
        drawPhonePickup(ctx, ph.x - cam, ph.y, this.tick + i * 20);
      }
    });

    // Филипп: берём нужный кадр текущей анимации
    const anim = SPRITES.filipp.anims[player.anim];
    const frameIndex = Math.floor(player.animTime / anim.speed) % anim.frames.length;
    const sx = Math.round(player.x) - SPRITE_OFFSET_X - cam;
    const sy = Math.round(player.y) - SPRITE_OFFSET_Y;
    const blinkOff = this.invuln > 0 && Math.floor(this.invuln / 4) % 2 === 1;   // мигает после удара
    // Дымок после сигарет тянется за Филиппом
    for (const p of this.smokeTrail) drawSmokePuff(ctx, Math.round(p.x) - cam, Math.round(p.y - p.t / 4), p.t / 40);
    // Кофе: Филипп светится — жёлтый силуэт вокруг картинки
    if (this.coffee > 0 && !player.lying && Math.floor(this.tick / 6) % 3 !== 0) {
      const glow = glowOf(anim.frames[frameIndex]);
      for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) drawSprite(ctx, glow, sx + ox, sy + oy, player.facing === -1);
    }
    if (!blinkOff) {
      if (player.lying || (player.stun > 0 && player.stunKind === 'trip')) {
        // Споткнулся о Тусю: лежит на полу (картинка повёрнута на бок)
        ctx.save();
        ctx.translate(sx + 8, sy + 24 - 8);
        ctx.rotate(-Math.PI / 2 * player.facing);
        ctx.drawImage(SPRITES.filipp.anims.idle.frames[0], -8, -12);
        ctx.restore();
      } else {
        drawSprite(ctx, anim.frames[frameIndex], sx, sy, player.facing === -1);
      }
    }
    // Оглушён — звёздочки над головой
    if (player.stun > 0 && player.stunKind === 'daze') drawStars(ctx, sx + 8, sy - 3, this.tick);
    // Кофе — пар над головой
    if (this.coffee > 0 && !player.lying) drawSteam(ctx, sx + 8, sy - 2, this.tick);

    // Всплывающие надписи («АЙ!», «МЯУ!», «+1»): поднимаются и исчезают
    for (const p of this.popups) {
      const half = Math.ceil(textWidth(p.text) / 2) + 2;          // у края экрана не обрезаем
      const px = Math.max(half, Math.min(W - half, Math.round(p.x) - cam));
      drawTextCenteredShadow(p.text, px, Math.max(HUD_H + 2, Math.round(p.y - 10 - p.t / 3)), '#f4f4f4', '#b13e53');
    }

    // Батут: надпись «БОЙНГ!» там, где Филипп оттолкнулся
    if (this.boingTimer > 0) {
      drawTextCenteredShadow('БОЙНГ!', Math.round(this.boingX) + 5 - cam, Math.round(this.boingY) + 4, '#ffcd75', '#1a1c2c');
    }

    // Тревога: над Филиппом звонит телефон «ТЫ ГДЕ?!»
    if (this.alarm) {
      const shake = (this.alarmTimer >> 1) % 2;
      drawPhoneIcon(sx + 4 + shake, sy - 14, this.alarmTimer);
      const textY = Math.max(HUD_H + 2, sy - 24);   // не залезаем на HUD
      drawTextCenteredShadow('ТЫ ГДЕ?!', sx + 8 + shake, textY, '#ffcd75', '#1a1c2c');
    }

    this.drawHud();
  },

  // Рисуем одного врага. Картинка — по центру хитбокса, ноги — по низу
  drawEnemy(e, cam) {
    const ex = Math.round(e.x) - cam, ey = Math.round(e.y);
    if (ex < -20 || ex > W + 20) return;
    if (e.type === 'vacuum') {
      drawVacuum(ctx, ex, ey - 1, this.tick);
      return;
    }
    const spr = SPRITES[e.type === 'kirill' ? 'kirill' : 'tusya'];
    let animName = 'walk';
    if (e.type === 'kirill') animName = e.state === 'sit' ? 'sit' : (e.state === 'chase' ? 'run' : 'walk');
    if (e.type === 'cat') animName = e.state === 'dash' ? 'dash' : (e.state === 'wash' ? 'wash' : 'walk');
    const anim = spr.anims[animName];
    const frame = anim.frames[Math.floor(this.tick / anim.speed) % anim.frames.length];
    const fx = ex + Math.round((e.w - frame.width) / 2);
    const fy = ey + e.h - frame.height;
    // После броска Туся немного мигает: в это время она не мешает
    if (e.type === 'cat' && e.cool > 0 && Math.floor(e.cool / 5) % 2 === 1) return;
    drawSprite(ctx, frame, fx, fy, e.dir < 0);
    // Облачко над Кириллом
    if (e.type === 'kirill') {
      let say = '';
      if (e.state === 'chase') say = 'КУПИ ИГРУ!';
      if (e.state === 'sit' && e.timer < 90) say = 'НУ ПА-А-АП!';
      if (say) {
        const tw = textWidth(say);
        const bx = ex + 4 - Math.round(tw / 2) - 2;
        const by = Math.max(HUD_H + 1, fy - 12);
        ctx.fillStyle = '#f4f4f4';
        ctx.fillRect(bx, by, tw + 4, 10);
        drawText(ctx, say, bx + 2, by + 2, '#b13e53');
      }
    }
  },

  // HUD: полоска сверху (2 ряда плиток) — кружки-жизни, версия, часы, шкала гонки по всему уровню
  drawHud() {
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(0, 0, W, HUD_H);

    // Кружки пива: полные — жизни, пустые — потерянные (до 3, или больше, если набрал)
    const slots = Math.max(CONFIG.startLives, this.lives);
    for (let i = 0; i < slots; i++) drawBeer(ctx, 2 + i * 9, 0, i >= this.lives);

    // Шкала «КУРАЖ»: зелёная, ниже половины — жёлтая, ниже четверти — красная и мигает
    const low = this.courage < CONFIG.courageLow;
    if (!low || Math.floor(this.tick / 15) % 2 === 0) {
      drawText(ctx, 'КУРАЖ', 50, 1, low ? '#b13e53' : '#94b0c2');
      ctx.fillStyle = '#333c57';
      ctx.fillRect(82, 3, 30, 3);
      ctx.fillStyle = low ? '#b13e53' : (this.courage < 0.5 ? '#ffcd75' : '#a7f070');
      ctx.fillRect(82, 3, Math.round(30 * this.courage), 3);
    }

    // Действующие эффекты: значок и убывающая полоска
    let ex = 116;
    const effect = (draw, part, color) => {
      draw(ex);
      ctx.fillStyle = '#333c57';
      ctx.fillRect(ex + 9, 3, 16, 2);
      ctx.fillStyle = color;
      ctx.fillRect(ex + 9, 3, Math.max(1, Math.round(16 * part)), 2);
      ex += 28;
    };
    if (this.coffee > 0) effect((x) => drawCoffee(ctx, x, 0, this.tick), this.coffee / (CONFIG.coffeeSeconds * 60), '#ffcd75');
    else if (this.coffeeCrash > 0) effect((x) => drawCoffee(ctx, x, 0, 0), this.coffeeCrash / (CONFIG.coffeeCrashSeconds * 60), '#b13e53');
    if (this.tipsy > 0) effect((x) => drawBeer(ctx, x, 0, false), Math.min(1, this.tipsy / (CONFIG.tipsySeconds * 60)), '#ffcd75');

    drawText(ctx, VERSION, W - 31 - 6 - textWidth(VERSION), 1, '#566c86');   // версия мелко и тускло, рядом с часами
    drawText(ctx, clockText(), W - 31, 1, '#ffcd75');

    // Шкала: при тревоге мигает красным
    const blinkRed = this.alarm && Math.floor(this.alarmTimer / 8) % 2 === 0;
    ctx.fillStyle = blinkRed ? '#b13e53' : '#566c86';
    ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);

    // Границы частей уровня — маленькие засечки
    ctx.fillStyle = '#94b0c2';
    for (let i = 1; i < levelParts.length; i++) ctx.fillRect(barX(levelParts[i].offset), BAR.y - 2, 1, BAR.h + 4);

    // Значки телефонов, которые ещё не взяты (во всех частях)
    levelParts.forEach((p, pi) => {
      p.phones.forEach((ph, i) => {
        if (this.taken[pi][i] || (pi === partIndex && i === this.ringing)) return;
        drawPhoneMini(ctx, barX(p.offset + ph.x + 4) - 1, BAR.y - 5);
      });
    });
    // Отметка финиша — флажок
    const fx = barX(totalLength);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(fx, BAR.y - 4, 1, BAR.h + 7);
    ctx.fillRect(fx - 3, BAR.y - 4, 3, 3);

    // Иконки-головы: Лера рисуется поверх Филиппа, когда догоняет
    ctx.drawImage(ICONS.filipp.image, barX(playerGlobalX() + player.w / 2) - 4, HUD_H - 8);
    ctx.drawImage(ICONS.lera.image, barX(this.leraX) - 4, HUD_H - 8);
  },
};

// =============================================
// ЭКРАН: БОСС УРОВНЯ 1 — ВАСЯ И НАСТЯ
// =============================================
// Арена — один экран (LEVELS[0].boss). Девочки по очереди бегут обнимать папу,
// сверху падают игрушки. Филипп подбирает игрушки и бросает в девочек:
// попала — девочка садится играть. После 3 попаданий — играет насовсем.
// ФАЗА 1: обе девочки в игре. ФАЗА 2: одна села насовсем — вторая быстрее, игрушек больше.
// Лера идёт и во время боя. Победа — обе девочки играют, Филипп на цыпочках уходит.

const TOY_GRAVITY = 0.2;         // как быстро падают игрушки сверху
const THROW_GRAVITY = 0.15;      // как быстро опускается брошенная игрушка
const TOY_DROP_Y = HUD_H + 12;   // откуда падают игрушки (под шкалами девочек)

const bossState = {
  girls: [],       // Вася и Настя
  toys: [],        // падающие и лежащие игрушки
  thrown: [],      // брошенные Филиппом игрушки в полёте
  carried: [],     // что Филипп несёт (до CONFIG.maxCarry)
  active: 0,       // какая девочка сейчас бежит к папе (номер в girls)
  toyTimer: 0,     // через сколько шагов упадёт следующая игрушка
  outro: false,    // победа: Филипп на цыпочках уходит
  outroTimer: 0,
  saved: null,     // начало арены — для «ЕЩЁ РАЗ»

  // mode: 'intro' — первый вход (Лера отлетает), 'retry' — «ЕЩЁ РАЗ», 'fight' — вернулись после вступления
  enter(mode) {
    if (mode === 'fight') return;
    if (mode === 'intro') {
      levelState.leraX = Math.max(0, levelState.leraX - CONFIG.bossPushBack);
      this.saved = { leraX: levelState.leraX, leraSpeed: levelState.leraSpeed, clockSteps: clockSteps };
    } else if (mode === 'retry') {
      levelState.leraX = this.saved.leraX;
      levelState.leraSpeed = this.saved.leraSpeed;
      clockSteps = this.saved.clockSteps;
      levelState.lives = CONFIG.startLives;          // снова 3 кружки
      levelState.resetEffects();                     // и полный кураж
    }
    this.reset();
    if (mode === 'intro') {
      // Титр и разговор перед боем — поверх арены
      const steps = [{ type: 'title', text: 'БОСС:\nВАСЯ И НАСТЯ', auto: 2 }].concat(SCENES.bossIntro.steps);
      setState('inLevelScene', { background: 'boss', next: 'boss', nextArg: 'fight', steps: steps });
    }
  },

  // Арена в начальное положение
  reset() {
    level = bossArena;
    partIndex = levelParts.length;                   // арена идёт после всех частей уровня
    levelState.enemies = [];
    levelState.popups = [];
    levelState.invuln = 0;
    levelState.alarm = false;
    levelState.ringing = -1;
    levelState.placePlayer(level.start.x, level.start.y);
    player.stun = 0;
    this.girls = level.twins.map((t) => ({
      name: t.name, w: 8, h: 14, x: t.x, y: t.y - 14, homeX: t.x,
      vx: 0, vy: 0, dir: -1, onGround: false, state: 'idle', timer: 0, hits: 0,
    }));
    this.toys = [];
    this.thrown = [];
    this.carried = [];
    this.active = 0;
    this.toyTimer = 90;
    this.outro = false;
    this.outroTimer = 0;
  },

  // Фаза 2 — когда одна из девочек уже играет насовсем
  phase() {
    return this.girls.some((gl) => gl.state === 'out') ? 2 : 1;
  },

  update(input) {
    levelState.tick++;
    if (this.outro) { this.updateOutro(); return; }

    levelState.movePlayer(input);
    clockSteps++;
    levelState.tickEffects();
    if (levelState.invuln > 0) levelState.invuln--;
    levelState.popups = levelState.popups.filter((p) => ++p.t < 50);

    // Лера идёт и во время боя
    levelState.leraX += levelState.leraSpeed;
    if (levelState.leraX >= playerGlobalX()) { this.lose(); return; }
    const wasAlarm = levelState.alarm;
    levelState.alarm = playerGlobalX() - levelState.leraX < CONFIG.alarmDistance;
    if (levelState.alarm) {
      if (!wasAlarm) levelState.alarmTimer = 0;
      if (levelState.alarmTimer % 60 === 0) vibrate();
      levelState.alarmTimer++;
    }

    this.updateGirls();
    this.updateToys();
    this.updateThrow(input);

    if (levelState.lives <= 0) { this.lose(); return; }
    if (this.girls.every((gl) => gl.state === 'out')) this.startOutro();
  },

  // Поражение: та же сценка, но «ЕЩЁ РАЗ» — с начала арены
  lose() {
    setState('defeat', Object.assign({}, SCENES.defeat, { next: 'boss', nextArg: 'retry' }));
  },

  // Следующая девочка бежит к папе (если она ещё в игре)
  nextRunner() {
    const other = 1 - this.active;
    if (this.girls[other].state !== 'out') this.active = other;
    const gl = this.girls[this.active];
    gl.timer = 0;
  },

  updateGirls() {
    const phase2 = this.phase() === 2;
    const speed = CONFIG.girlSpeed * (phase2 ? CONFIG.phase2SpeedMul : 1);
    const pcx = player.x + player.w / 2;
    this.girls.forEach((gl, i) => {
      gl.timer++;
      if (gl.state === 'out') {
        gl.vx = 0;
      } else if (gl.state === 'play') {
        gl.vx = 0;
        if (gl.timer >= CONFIG.girlPlaySeconds * 60) { gl.state = 'idle'; gl.timer = 0; }
      } else if (gl.state === 'hug') {
        // Обнимает папу: держится рядом с ним
        gl.vx = 0;
        gl.x = gl.dir > 0 ? player.x - gl.w + 2 : player.x + player.w - 2;
        if (gl.timer >= CONFIG.hugSeconds * 60) {
          gl.state = 'rest'; gl.timer = 0;            // отпустила — передышка
          this.nextRunner();
        }
      } else if (gl.state === 'rest') {
        // Передышка: отбегает от папы, потом снова может бежать к нему
        gl.dir = pcx < gl.x + gl.w / 2 ? 1 : -1;
        gl.vx = gl.dir * speed * 0.6;
        if (gl.timer >= CONFIG.girlRestSeconds * 60) { gl.state = 'idle'; gl.timer = 0; }
      } else if (i === this.active) {
        // Бежит к папе, иногда подпрыгивает
        gl.state = 'run';
        gl.dir = pcx < gl.x + gl.w / 2 ? -1 : 1;
        gl.vx = gl.dir * speed;
        if (gl.onGround && Math.random() < CONFIG.girlJumpChance) gl.vy = -3.2;
        if (gl.timer > 7 * 60) this.nextRunner();      // долго не догнала — очередь сестры
        if (player.stun === 0 && !player.lying && levelState.coffee === 0 && overlaps(player, gl)) {
          gl.state = 'hug'; gl.timer = 0;
          player.stun = Math.round(CONFIG.hugSeconds * 60);
          player.stunKind = 'hug';
          player.vx = 0;
          levelState.popup('ПАПА, ДЕРЖИСЬ!', pcx, player.y - 2);
        }
      } else {
        // Ждёт своей очереди: возвращается на своё место
        const dx = gl.homeX - gl.x;
        gl.state = Math.abs(dx) > 3 ? 'back' : 'idle';
        gl.vx = gl.state === 'back' ? Math.sign(dx) * speed * 0.6 : 0;
        if (gl.vx !== 0) gl.dir = Math.sign(gl.vx);
      }
      const wantedVx = gl.vx;
      if (gl.state !== 'hug') moveEnemy(gl, false);
      // Упёрлась в скамейку или песочницу — перепрыгивает
      if (wantedVx !== 0 && gl.vx === 0 && gl.onGround) { gl.vy = -3.4; gl.dir = Math.sign(wantedVx); }
    });
  },

  // Новая игрушка: сначала тень на земле (за секунду до падения), потом падает
  spawnToy() {
    const kinds = ['ball', 'cube', 'bear'];
    // Фаза 1: игрушка падает где угодно, но не прямо на Филиппа. Фаза 2: может и на него.
    let x = 0;
    for (let tries = 0; tries < 10; tries++) {
      x = Math.round(8 + Math.random() * (level.width - 24));
      if (this.phase() === 2 || Math.abs(x + 4 - (player.x + player.w / 2)) > 24) break;
    }
    // Где игрушка упадёт: самый высокий пол или предмет под ней
    let landY = H;
    for (const s of level.solids) if (x + 8 > s.x && x < s.x + s.w && s.y < landY && s.y > TOY_DROP_Y) landY = s.y;
    const fallSteps = Math.sqrt(2 * (landY - 8 - TOY_DROP_Y) / TOY_GRAVITY);
    this.toys.push({ kind: kinds[Math.floor(Math.random() * 3)], x: x, y: TOY_DROP_Y, vy: 0, landY: landY,
                     state: 'warn', timer: Math.max(0, Math.round(60 - fallSteps)), age: 0 });
  },

  updateToys() {
    // Игрушки падают раз в несколько секунд, в фазе 2 — чаще и иногда по две
    this.toyTimer--;
    if (this.toyTimer <= 0) {
      const phase2 = this.phase() === 2;
      this.spawnToy();
      if (phase2 && Math.random() < CONFIG.doubleToyChance) this.spawnToy();
      this.toyTimer = Math.round((phase2 ? CONFIG.toyEverySecondsPhase2 : CONFIG.toyEverySeconds) * 60);
    }
    for (const t of this.toys) {
      if (t.state === 'warn') {
        if (--t.timer <= 0) t.state = 'fall';
      } else if (t.state === 'fall') {
        t.vy += TOY_GRAVITY;
        t.y += t.vy;
        if (overlaps(player, { x: t.x, y: t.y, w: 8, h: 8 })) {
          levelState.hurt('ОЙ!', t.x + 4);            // по голове — минус кружка
          t.state = 'ground'; t.y = t.landY - 8;
        } else if (t.y + 8 >= t.landY) {
          t.state = 'ground'; t.y = t.landY - 8;
        }
      } else {
        t.age++;
        // Подобрать: просто коснуться (если руки не заняты)
        if (this.carried.length < CONFIG.maxCarry && overlaps(player, { x: t.x, y: t.y, w: 8, h: 8 })) {
          this.carried.push(t.kind);
          t.taken = true;
          pickupSound();
        }
      }
    }
    // Лежит слишком долго (10 секунд) — исчезает
    this.toys = this.toys.filter((t) => !t.taken && t.age < 600);
  },

  updateThrow(input) {
    // Бросок по дуге в сторону взгляда. Можно и в обнимку — так и освобождаются
    if (input.throwPressed && this.carried.length > 0 && player.stunKind !== 'trip') {
      const kind = this.carried.pop();
      this.thrown.push({ kind: kind, x: player.x + player.w / 2 - 4, y: player.y + 10,   // из рук
                         vx: player.facing * CONFIG.throwSpeed * (levelState.tipsy > 0 ? CONFIG.tipsyThrowMul : 1),
                         vy: -CONFIG.throwLift });
    }
    for (const t of this.thrown) {
      t.vy += THROW_GRAVITY;
      t.x += t.vx;
      t.y += t.vy;
      const box = { x: t.x, y: t.y, w: 8, h: 8 };
      // Попала в девочку?
      for (const gl of this.girls) {
        if (gl.state === 'out' || gl.state === 'play' || !overlaps(box, gl)) continue;
        if (gl.state === 'hug') player.stun = 0;      // отпустила папу
        gl.hits++;
        gl.state = gl.hits >= CONFIG.bossHitsToWin ? 'out' : 'play';
        gl.timer = 0;
        gl.vx = 0;
        levelState.popup('УРА, ' + TOY_NAMES[t.kind] + '!', gl.x + 4, gl.y - 4);
        gulpSound();
        if (this.active === this.girls.indexOf(gl)) this.nextRunner();
        t.done = true;
        break;
      }
      if (t.done) continue;
      // Упала на землю — снова лежит, её можно подобрать
      for (const s of level.solids) {
        if (overlaps(box, s)) {
          this.toys.push({ kind: t.kind, x: Math.round(t.x), y: s.y - 8, vy: 0, landY: s.y, state: 'ground', age: 0 });
          t.done = true;
          break;
        }
      }
      if (t.x < -10 || t.x > level.width + 10) t.done = true;
    }
    this.thrown = this.thrown.filter((t) => !t.done);
  },

  // Победа: обе девочки играют, Филипп на цыпочках уходит вправо
  startOutro() {
    this.outro = true;
    this.outroTimer = 0;
    player.stun = 0;
    this.toys = [];
    this.thrown = [];
    levelState.alarm = false;
    levelState.popup('ПАПА ПОТОМ ПОИГРАЕТ!', player.x + player.w / 2, player.y - 2);
  },

  updateOutro() {
    this.outroTimer++;
    player.facing = 1;
    player.x += 0.7;                                // на цыпочках — не спеша
    player.anim = 'run';
    player.animTime += 0.5;
    // Надпись «ПАПА ПОТОМ ПОИГРАЕТ!» плывёт над Филиппом и не исчезает
    for (const p of levelState.popups) { p.t = 6; p.x = player.x + player.w / 2; }
    if (player.x > level.width + 8 || this.outroTimer > 360) {
      levelState.popups = [];
      player.x = level.width + 40;                  // ушёл за край — на фоне звонка его нет
      setState('levelWin');
    }
  },

  draw() {
    levelState.draw();                              // фон, скамейка, Филипп, надписи, HUD
    const cam = Math.round(cameraX);
    // Тени и игрушки
    for (const t of this.toys) {
      if (t.state !== 'ground') {
        const total = 60;
        const left = t.state === 'warn' ? t.timer + 30 : Math.max(0, (t.landY - 8 - t.y) / 3);
        drawToyShadow(ctx, t.x + 4 - cam, t.landY, 1 - Math.min(1, left / total));
      }
      if (t.state !== 'warn') drawToy(ctx, t.kind, Math.round(t.x) - cam, Math.round(t.y));
    }
    for (const t of this.thrown) drawToy(ctx, t.kind, Math.round(t.x) - cam, Math.round(t.y));
    // Девочки
    for (const gl of this.girls) {
      const anim = SPRITES[gl.name].anims[
        gl.state === 'out' || gl.state === 'play' ? 'sit' :
        !gl.onGround && gl.state !== 'hug' ? 'jump' :
        gl.state === 'run' || gl.state === 'back' || gl.state === 'rest' ? 'run' : 'stand'];
      const frame = anim.frames[Math.floor(levelState.tick / anim.speed) % anim.frames.length];
      drawSprite(ctx, frame, Math.round(gl.x) - 1 - cam, Math.round(gl.y), gl.dir < 0);
      if (gl.state === 'out' || gl.state === 'play') {
        drawToy(ctx, gl.name === 'vasya' ? 'bear' : 'ball', Math.round(gl.x) + 6 - cam, Math.round(gl.y) + 6);
      }
    }
    // Шкалы девочек: «ВАСЯ ♥♥♥» слева, «НАСТЯ ♥♥♥» справа
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(0, HUD_H, W, 9);
    this.girls.forEach((gl, i) => {
      const label = gl.name === 'vasya' ? 'ВАСЯ' : 'НАСТЯ';
      const x0 = i === 0 ? 4 : W - 4 - textWidth(label) - CONFIG.bossHitsToWin * 7 - 3;
      drawText(ctx, label, x0, HUD_H + 1, gl.name === 'vasya' ? '#b13e53' : '#41a6f6');
      for (let h = 0; h < CONFIG.bossHitsToWin; h++) {
        drawHeart(ctx, x0 + textWidth(label) + 4 + h * 7, HUD_H + 2, h < CONFIG.bossHitsToWin - gl.hits);
      }
    });
    // Что Филипп несёт — посередине строки со шкалами девочек
    this.carried.forEach((kind, i) => drawToy(ctx, kind, W / 2 - 14 + i * 10, HUD_H));
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
  inLevelScene: createSceneState(),           // СЦЕНКА ПОВЕРХ УРОВНЯ: звонок-отмазка, переход между частями
  boss: bossState,                            // БОСС: Вася и Настя
  error: errorState,                          // ОШИБКА в карте или в файлах
};
let state = null;

// Включить экран. arg — дополнительные данные (например, «продолжить с места последнего звонка»)
function setState(name, arg) {
  // Кнопка «Бросок» видна только в бою с боссом
  document.body.classList.toggle('boss-fight', name === 'boss');
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
  const throwPressed = throwHit;                   // «Бросок» только что нажали
  throwHit = false;
  const input = {
    jumpPressed: jumpPressed,
    throwPressed: throwPressed,
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
  if (LEVEL_ERRORS.length === 0) level = levelParts[0];
}

if (LEVEL_ERRORS.length > 0) {
  errorState.messages = LEVEL_ERRORS;
  setState('error');
} else {
  setState('title');
}
requestAnimationFrame(loop);
