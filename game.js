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
  // ----- Для тестов -----
  DEBUG_MENU: true,          // true — на титульном экране есть «ВЫБОР УРОВНЯ». Когда игра готова — поставить false

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
  jumpSpeed: 3.05,           // сила прыжка С МЕСТА (3.05 — на 23 пикселя; даже на нулевом кураже — на 2 плитки)
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

  // ----- УРОВЕНЬ 2: свои числа для Леры и часов. Чего здесь нет — берётся из настроек выше -----
  level2: {
    leraHeadStart: 3,        // фора Леры в начале уровня, секунд
    leraSpeed: 1.0,          // скорость Леры по шкале (на уровне 1 — 0.8)
    leraSpeedUp: 0.1,        // ускорение после каждого звонка
    callPushBack: 200,       // на сколько Леру отбрасывает звонок
    clockStartHour: 13,      // уровень 2 начинается в 13:30
    clockStartMinute: 30,

    // --- Босс уровня 2: мама. Шкала «ВНИМАНИЕ» от 0 до 1 (1 — победа) ---
    bossPushBack: 4600,      // на сколько отлетает Лера при входе на арену (около минуты на бой)
    momWalkSpeed: 0.35,      // мама медленно ходит по правой половине арены
    momComeSpeed: 0.6,       // фаза 2: мама идёт к Филиппу «ДАЙ ОБНИМУ!»
    momThrowSeconds: 1.2,    // как часто мама что-то бросает (фаза 1)
    momThrowSeconds2: 1.1,   // ...и в фазе 2
    momRequestChance: 0.3,   // фаза 1: доля серых просьб (остальное — сердечки)
    momRequestChance2: 0.55, // фаза 2: просьб больше
    momPhotoChance: 0.15,    // фаза 2: шанс большого сердца «ФОТО ИЗ ДЕТСТВА»
    momFlightSeconds: 1.3,   // сколько летит сердечко или просьба
    momPhotoFlightSeconds: 0.8, // «ФОТО ИЗ ДЕТСТВА» летит быстрее
    momGravity: 0.08,        // как сильно дуга загибается вниз
    momHeartGain: 0.09,      // поймал сердечко — шкала растёт
    momPhotoGain: 0.15,      // поймал «ФОТО ИЗ ДЕТСТВА» — растёт больше
    momHeartLoss: 0.03,      // сердечко упало на землю — шкала чуть падает «НУ ВОТ...»
    momWrenchLoss: 0.2,      // ключ в маму — шкала минус 20%
    momStuckSeconds: 2,      // коснулся просьбы — застрял «ЛАДНО, ПОСМОТРЮ...»
    momHugSeconds: 2,        // фаза 2: сколько секунд постоять рядом, чтобы обняться
    momHugGain: 0.2,         // объятие — шкала +20%
    momHugCooldown: 4,       // после объятия мама отходит на столько секунд
    momPlovGift: 3,          // сколько плова мама даёт в конце
  },

  // ----- Оружие (есть с уровня 2) -----
  weaponsFromLevel: 2,       // с какого уровня есть оружие и видна кнопка «Бросок»
  keysStart: 5,              // гаечных ключей в начале уровня 2
  keysMax: 9,                // больше ключей не бывает
  keyBoxKeys: 3,             // сколько ключей в ящике
  wrenchSpeed: 3.2,          // сила броска ключа вперёд
  wrenchLift: 0.6,           // насколько ключ взлетает вверх (дуга пологая, на уровне пояса)
  wrenchGravity: 0.05,       // как быстро опускается летящий ключ
  enemyStunSeconds: 2,       // сколько секунд враг сидит со звёздочками после ключа
  plovStart: 1,              // бабушка даёт контейнеров плова
  plovSeconds: 8,            // сколько секунд плов лежит на земле
  plovTiles: 3,              // ширина полосы плова в плитках
  slipSeconds: 2.5,          // сколько секунд враг лежит, поскользнувшись на плове

  // ----- Враги и предметы уровня 2 -----
  neighborSpeed: 0.35,       // соседи с сумками ходят медленно
  neighborPush: 2.5,         // как сильно соседи отталкивают «ОСТОРОЖНО!» (кружку не отнимают)
  dogSpeed: 0.4,             // собачка гуляет
  dogRunSpeed: 1.6,          // собачка бежит к Филиппу «ТЯВ!»
  dogSeeDistance: 90,        // с какого расстояния собачка замечает Филиппа
  dogHoldSeconds: 1.5,       // сколько секунд собачка держит шлёпанец
  dogSlowMul: 0.35,          // скорость Филиппа, пока собачка держит шлёпанец
  bikeSpeed: 2.4,            // дети на великах
  bikeEverySeconds: 4,       // как часто проезжает велик, пока Филипп рядом с дорожкой
  bikeWarnSeconds: 1,        // за сколько секунд до велика звенит «ДЗЫНЬ-ДЗЫНЬ» и мигает стрелка
  scooterSpeed: 0.8,         // дети на самокатах (касание отбрасывает, кружку не отнимает)
  sprinklerReach: 48,        // как далеко бьёт струя поливалки
  sprinklerJetSeconds: 2,    // сколько секунд струя бьёт в одну сторону
  sprinklerPauseSeconds: 0.7,// пауза, пока поливалка поворачивается
  gossipRadius: 40,          // размер «зоны сплетен» вокруг лавки с бабушками
  gossipNods: 6,             // сколько раз нажать «Прыжок» («кивнуть»), чтобы вырваться
  gossipAngrySeconds: 5,     // после ключа «ХУЛИГАН!» зона столько секунд больше...
  gossipAngryMul: 1.5,       // ...во столько раз
  slideSpeed: 2.6,           // как быстро съезжаешь с горки
  carouselSpeed: 0.8,        // как сильно карусель тащит влево
  carAlarmSeconds: 3,        // сколько секунд воет сигнализация «УИ-УИ-УИ!»

  // ----- Этап «ЗА РУЛЁМ» (минивэн едет в офис, вид сверху) -----
  drive: {
    length: 11000,             // длина этапа в пикселях дороги (без ошибок — около 1,5 минуты)
    maxSpeed: 2.4,             // наибольшая скорость минивэна (пикселей за шаг)
    accel: 0.02,               // скорость растёт сама: на столько за шаг
    brake: 0.09,               // тормоз («Прыжок»)
    steer: 1.4,                // руль: на сколько пикселей за шаг сдвигается вбок
    carSpeedMin: 1.0,          // попутные машины едут медленнее: от...
    carSpeedMax: 1.7,          // ...до (автобус и грузовик ещё медленнее)
    trafficEvery: 170,         // в среднем через столько пикселей пути появляется машина
    crashSpeed: 0.3,           // скорость после столкновения «БАЦ!»
    crashSkidSeconds: 0.6,     // сколько секунд заносит после удара
    potholes: 8,               // сколько ям на дороге
    potholeSpeedMul: 0.4,      // яма: скорость умножается на это число
    puddles: 6,                // сколько луж
    puddleSkidSeconds: 0.5,    // лужа: сколько секунд заносит вбок...
    puddleDrift: 1.0,          // ...и как сильно
    hornCooldown: 3,           // перезарядка гудка, секунд
    hornReach: 120,            // гудок слышат машины не дальше этого
    jamAt: 0.5,                // где пробка (0.5 — на середине пути)
    jamLength: 900,            // длина пробки
    jamSpeed: 0.5,             // скорость машин в пробке
    jamRowGap: 84,             // расстояние между рядами машин в пробке (просвет между рядами узкий)
    lights: [0.28, 0.75],      // где светофоры (доля пути)
    lightWarnDistance: 260,    // за сколько пикселей до светофора загорается жёлтый, потом красный
    lightRedSeconds: 3,        // сколько горит красный
    inspectorDelay: 1,         // через сколько секунд после проезда на красный появляется инспектор
    inspectorSeconds: 4,       // штраф ГИБДД: столько секунд стоим «ДОКУМЕНТЫ!»
    coffeeAt: [0.18, 0.62],    // где кофе (доля пути)
    coffeeSeconds: 4,          // кофе: столько секунд быстрее...
    coffeeSpeedMul: 1.3,       // ...во столько раз
    cigsAt: [0.4, 0.88],       // где сигареты (+кураж, кураж переносится дальше)
    billboards: [              // рекламные щиты: где (доля пути), с какой стороны (0 — слева), текст
      { at: 0.1, side: 1, text: 'МЕТАЛЛО-\nПРОКАТ —\nЗВОНИТЕ!' },
      { at: 0.36, side: 0, text: 'ШИНО-\nМОНТАЖ' },
      { at: 0.66, side: 1, text: 'ПЕЛЬМЕНИ\nДОМАШНИЕ' },
    ],
    timeLimitSeconds: 115,     // через сколько секунд клиент уходит — поражение
    warnAt: 0.85,              // на этой доле времени звонит начальник «ТЫ ГДЕ?»
    startHour: 15,             // часы этапа: начало в 15:30...
    startMinute: 30,
    secondsPerMinute: 3,       // ...одна игровая минута — 3 секунды (1,5 минуты езды — полчаса)
  },
};


// Какой уровень сейчас собран: 0 — уровень 1, 1 — уровень 2
let currentLevelIndex = 0;

// Число из настроек с учётом уровня: у уровня 2 своё (CONFIG.level2), если оно там есть
function levelCfg(name) {
  const own = CONFIG['level' + (currentLevelIndex + 1)];
  return own && own[name] !== undefined ? own[name] : CONFIG[name];
}

// Какой экран босса у текущего уровня: 'boss' — Вася и Настя, 'mom' — мама
function bossStateName() {
  return bossArena && bossArena.mama ? 'mom' : 'boss';
}

// Есть ли на этом уровне оружие (ключи и плов)
function weaponsOn() {
  return currentLevelIndex + 1 >= CONFIG.weaponsFromLevel;
}

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

// Звук включён? Настройку запоминаем в браузере между запусками (если браузер разрешает)
let soundOn = true;
try { soundOn = localStorage.getItem('filippSound') !== 'off'; } catch (e) { /* без памяти — просто со звуком */ }
function setSound(on) {
  soundOn = on;
  try { localStorage.setItem('filippSound', on ? 'on' : 'off'); } catch (e) { /* не запомнили — не страшно */ }
}

// Один короткий звук квадратной волной (как на Денди).
//   freq — высота в герцах, start — когда начать (секунды), dur — длительность
function tone(freq, start, dur, volume) {
  if (!soundOn || !audioCtx || audioCtx.state !== 'running') return;
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
  if (!soundOn || !audioCtx || audioCtx.state !== 'running') return;
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

// Гаечный ключ попал: «БДЗЫНЬ!» — звонкий металлический звук
function clangSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(1800, t0, 0.05, 0.05);
  tone(1200, t0 + 0.05, 0.15, 0.04);
}

// Собачка: «ТЯВ!» — два коротких высоких звука
function barkSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(900, t0, 0.05, 0.06);
  tone(700, t0 + 0.08, 0.06, 0.06);
}

// Велосипедный звонок «ДЗЫНЬ-ДЗЫНЬ»
function bellSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  for (const d of [0, 0.25]) for (let i = 0; i < 4; i++) tone(i % 2 ? 2100 : 2400, t0 + d + i * 0.03, 0.03, 0.03);
}

// Сигнализация машины «УИ-УИ-УИ!»
function sirenSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  for (let i = 0; i < 6; i++) tone(i % 2 ? 600 : 950, t0 + i * 0.18, 0.16, 0.035);
}

// Гудок минивэна «БИ-БИП!»
function hornSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  tone(330, t0, 0.12, 0.07);
  tone(392, t0 + 0.15, 0.18, 0.07);
}

// Свисток инспектора
function whistleSound() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  for (let i = 0; i < 8; i++) tone(i % 2 ? 2600 : 2900, t0 + i * 0.04, 0.04, 0.04);
  tone(2800, t0 + 0.4, 0.3, 0.04);
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
const kb = { left: false, right: false, jump: false, throw: false, plov: false };
const touch = { left: false, right: false, jump: false, throw: false, wrench: false, plov: false, horn: false, pause: false };
// Касания и клики по самому экрану (не по кнопкам). Координаты — в пикселях игры.
let taps = [];
// Нажали ли «Прыжок» с прошлого шага. Запоминаем сразу в момент нажатия,
// чтобы даже очень короткое нажатие не потерялось.
let jumpHit = false;
// То же для броска: гаечный ключ на уровне (E или X, кнопка «Ключ»)
// и игрушка в бою с Васей и Настей (E или X, кнопка «Бросок»)
let throwHit = false;
// Бросок плова: F или кнопка «Плов» (сразу, без переключения оружия)
let plovHit = false;
// Пауза (кнопка ⏸, P, Esc), выбор в меню (стрелки вверх-вниз), подтверждение (Прыжок, Z, пробел, Enter)
let pauseHit = false;
let menuMove = 0;
let confirmHit = false;

// Какая клавиша за что отвечает.
// Клавиши узнаём по МЕСТУ на клавиатуре (e.code: KeyZ, KeyX...), а не по букве (e.key).
// Поэтому при русской раскладке всё работает так же: «Я» — это KeyZ, «У» — KeyE, «А» — KeyF, «Ч» — KeyX.
const keyMap = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyZ: 'jump',
  Space: 'jump',
  ArrowUp: 'jump',
  KeyE: 'throw',      // ключ (в бою с близнецами — игрушка)
  KeyX: 'throw',      // запасная клавиша для ключа
  KeyF: 'plov',       // плов
};

window.addEventListener('keydown', (e) => {
  unlockAudio();
  if (!e.repeat) {
    if (e.code === 'KeyP' || e.code === 'Escape') pauseHit = true;
    if (e.code === 'ArrowUp') menuMove -= 1;
    if (e.code === 'ArrowDown') menuMove += 1;
    if (e.code === 'Enter' || e.code === 'KeyZ' || e.code === 'Space') confirmHit = true;
  }
  const action = keyMap[e.code];
  if (action) {
    if (action === 'jump' && !e.repeat) jumpHit = true; // repeat — это автоповтор при удержании
    if (action === 'throw' && !e.repeat) throwHit = true;
    if (action === 'plov' && !e.repeat) plovHit = true;
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
const jumpBtn = document.querySelector('.btn.jump');   // за рулём на ней надпись «Тормоз»

function updateTouches(e) {
  e.preventDefault();
  unlockAudio();
  for (const k in touch) touch[k] = false;
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
      if (btn === 'jump') { jumpHit = true; confirmHit = true; }
      else if (btn === 'throw' || btn === 'wrench' || btn === 'horn') throwHit = true;   // «Бросок», «Ключ», «Гудок»
      else if (btn === 'plov') plovHit = true;
      else if (btn === 'pause') pauseHit = true;
      else if (btn === 'left') menuMove -= 1;       // в меню ← и → двигают выбор
      else if (btn === 'right') menuMove += 1;
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
  if (e.target && e.target.dataset && e.target.dataset.btn === 'pause') { pauseHit = true; return; }
  taps.push(toGameCoords(e.clientX, e.clientY));
});

// Автопауза: переключился на другое приложение или вкладку — игра сама встаёт на паузу
document.addEventListener('visibilitychange', () => { if (document.hidden) autoPause(); });
window.addEventListener('blur', () => autoPause());

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
  menu: createMenu(),   // «НАЧАТЬ ИГРУ» / «ВЫБОР УРОВНЯ» (только с CONFIG.DEBUG_MENU)
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
    // Для тестов — меню из двух пунктов. Иначе любое касание или «Прыжок» — начинаем.
    // Звук уже разрешён этим же касанием.
    if (CONFIG.DEBUG_MENU) {
      const choice = menuUpdate(this.menu, 2, input);
      if (choice === 0) { loadLevel(0); setState('cutscene'); }
      if (choice === 1) setState('levelSelect');
    } else if (input.pressed) {
      loadLevel(0);
      setState('cutscene');
    }
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

    if (CONFIG.DEBUG_MENU) {
      drawMenu(this.menu, ['НАЧАТЬ ИГРУ', 'ВЫБОР УРОВНЯ'], 120, 115, 11);
    } else if (Math.floor(this.timer / 30) % 2 === 0) {
      // Мигающая надпись: полсекунды видна, полсекунды нет
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
      if (['level', 'boss', 'mom', 'drive'].indexOf(this.scene.background) !== -1) return false;
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
      // Арена мамы: пока идёт вступление, мама входит в кадр с пакетами
      if (this.scene.background === 'mom') momState.introTick();

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
      } else if (step.type === 'wait') {
        // Пауза: ничего не говорят, просто ждём seconds секунд (например, мама входит в кадр)
        if (this.timer >= (step.seconds || 1) * 60) this.nextStep();
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
        else if (this.scene.background === 'mom') momState.draw();       // арена мамы
        else if (this.scene.background === 'drive') driveState.draw();   // дорога («ЗА РУЛЁМ»)
        else BACKGROUNDS[this.scene.background](ctx, this.tick);
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
      if (['level', 'boss', 'mom', 'drive'].indexOf(this.scene.background) === -1) drawVersion();   // на уровне версия уже есть в HUD
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
    // На аренах боссов окно диалога сверху экрана, чтобы не закрывать персонажей внизу.
    // Возвращает, на сколько пикселей сдвинуть окно вверх (0 — окно на обычном месте, внизу)
    boxShift() {
      return this.scene.background === 'boss' || this.scene.background === 'mom' ? 2 - BOX.y : 0;
    },

    drawDialog(step) {
      const speaker = SPEAKERS[step.who];
      const dy = this.boxShift();
      drawBox(BOX.x, BOX.y + dy, BOX.w, BOX.h);

      // Портрет в рамке
      ctx.fillStyle = '#94b0c2';
      ctx.fillRect(PORTRAIT_X - 1, PORTRAIT_Y - 1 + dy, 34, 34);
      ctx.fillStyle = '#333c57';
      ctx.fillRect(PORTRAIT_X, PORTRAIT_Y + dy, 32, 32);
      ctx.drawImage(PORTRAITS[speaker.portrait].image, PORTRAIT_X, PORTRAIT_Y + dy);

      // Имя над текстом
      drawText(ctx, step.name || speaker.name, TEXT_X, PORTRAIT_Y + dy, '#ffcd75');

      // Текст: показываем только напечатанные буквы
      drawText(ctx, step.text, TEXT_X, TEXT_Y + dy, '#f4f4f4', TEXT_W, { maxChars: this.typed });

      // Реплика допечатана — мигает стрелка ▼
      if (this.typed >= this.fullText.length) this.drawArrow(BOX.y + BOX.h - 8 + dy);
    },

    // Подпись внизу экрана и, если задана, кнопка (например «ЕЩЁ РАЗ»)
    drawCaption(step) {
      // На арене босса подпись (например «ПЛОВ +3») тоже сверху; кнопка «ЕЩЁ РАЗ» всегда внизу
      const dy = step.button ? 0 : (this.boxShift() ? 2 - CAPTION.y : 0);
      drawBox(CAPTION.x, CAPTION.y + dy, CAPTION.w, CAPTION.h);
      drawText(ctx, step.text, CAPTION.x + 6, CAPTION.y + 7 + dy, '#f4f4f4', step.button ? 168 : CAPTION.w - 12);
      if (step.button) {
        // Кнопка мигает рамкой, чтобы её заметили
        const b = CAPTION_BUTTON;
        ctx.fillStyle = Math.floor(this.tick / 20) % 2 === 0 ? '#ffcd75' : '#ef7d57';
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.fillStyle = '#1a1c2c';
        ctx.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
        drawTextCentered(ctx, step.button, b.x + b.w / 2, b.y + 4, '#ffcd75');
      } else if (this.timer > 20) {
        this.drawArrow(CAPTION.y + CAPTION.h - 8 + dy);
      }
    },

    // Мигающая стрелка ▼ в правом нижнем углу окна. y — где её верх (по умолчанию — низ экрана)
    drawArrow(y) {
      if (Math.floor(this.tick / 20) % 2 !== 0) return;
      const ay = y === undefined ? 126 : y;
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(228, ay, 5, 1);
      ctx.fillRect(229, ay + 1, 3, 1);
      ctx.fillRect(230, ay + 2, 1, 1);
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

// ЛЕГЕНДА КАРТЫ — из двух уровней:
// 1) ОБЩИЕ символы — одинаковые во всех уровнях (их нельзя занимать в легенде уровня):
//    . пусто, # пол или стена, - полка, и ещё эти:
const COMMON_SYMBOLS = {
  P: 'start',    // старт части
  C: 'phone',    // телефон-звонок
  E: 'gate',     // калитка «ВЫХОД» — финиш уровня
  N: 'exit',     // выход в следующую часть
  b: 'beer',     // пиво
  x: 'cig',      // сигареты
  u: 'coffee',   // кофе
};
// 2) СВОИ символы у каждого уровня — в levels.js, поле legend: буква → что это.
//    «Что это» — имя предмета из FURNITURE (sofa, table...) или одна из особых вещей:
const SPECIAL_THINGS = ['kirill', 'cat', 'vacuum', 'vasya', 'nastya', 'lego', 'rake', 'lera',
                        // уровень 2: соседи, собачка, дорожка великов, самокат, поливалка,
                        // лавка с 2 и с 3 бабушками, ящик с ключами
                        'neighbor', 'dog', 'biker', 'scooter', 'sprinkler', 'gossip2', 'gossip3', 'keybox',
                        // босс уровня 2
                        'mama'];

// Размеры особых вещей в плитках (символ — левый нижний угол)
const SPECIAL_SIZES = { gate: { w: 4, h: 4 }, exit: { w: 3, h: 4 }, lera: { w: 2, h: 3 },
                        gossip2: { w: 4, h: 2 }, gossip3: { w: 5, h: 2 } };

// Легенда текущего уровня (буква → что это). Ставится в buildLevel
let levelLegend = {};

// Что означает символ карты: сначала общие символы, потом легенда уровня
function symbolThing(ch) {
  return COMMON_SYMBOLS[ch] || levelLegend[ch];
}

let levelParts = [];     // все части уровня
let partIndex = 0;       // в какой части сейчас Филипп
let level = null;        // текущая часть: всё, что нужно для игры (см. buildPart)
let bossArena = null;    // арена босса: собирается из boss уровня как обычная часть (у уровня 2 босса пока нет)
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
  // Легенда уровня: каждая буква — известный предмет или особая вещь, и не общий символ
  levelLegend = data.legend || {};
  for (const ch in levelLegend) {
    const thing = levelLegend[ch];
    if (COMMON_SYMBOLS[ch] || '.#-'.indexOf(ch) !== -1) {
      errors.push('ЛЕГЕНДА: БУКВА «' + ch + '» — ОБЩИЙ СИМВОЛ, ЕЁ НЕЛЬЗЯ ЗАНИМАТЬ.');
    } else if (!FURNITURE[thing] && SPECIAL_THINGS.indexOf(thing) === -1) {
      errors.push('ЛЕГЕНДА: БУКВА «' + ch + '» — НЕИЗВЕСТНАЯ ВЕЩЬ «' + thing + '».');
    }
  }
  if (errors.length > 0) return;
  // 1) Проверяем каждый экран каждой части и арену: фон, 15 строк по 30 символов, известные символы
  const toCheck = data.boss ? data.parts.concat([{ screens: [data.boss], arena: true }]) : data.parts;
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
          if ('.#-'.indexOf(ch) === -1 && !symbolThing(ch)) {
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
  // 3) Арена босса — отдельная «часть» из одного экрана (если у уровня есть босс)
  bossArena = data.boss ? buildPart({ name: data.boss.name, screens: [data.boss] }, -1, false, true) : null;
  if (errors.length > 0) return;
  const last = levelParts[levelParts.length - 1];
  totalLength = last.offset + last.gate.x;
  if (bossArena) bossArena.offset = totalLength - SCREEN_W / 2;   // на шкале HUD Филипп на арене — у самого финиша
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
    ramps: [],         // горки {x, y, w, h}: съезжаешь вниз вправо
    keyBoxes: [],      // ящики с гаечными ключами {x, y}
    bikeLanes: [],     // дорожки великов {x, y}: отсюда и рядом мчатся дети на великах
    sprinklers: [],    // поливалки {x, y}
    gossips: [],       // лавки с бабушками {x, y, w, n}: вокруг «зона сплетен»
    cars: [],          // машины (для сигнализации)
    mama: null,        // арена уровня 2: где стоит мама {x, y} (y — где ноги)
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
      const thing = symbolThing(ch);
      if (thing === 'start') {
        starts++;
        lp.start = { x: tileX(c) - 1, y: tileY(r + 1) - player.h };
        continue;
      }
      if (thing === 'phone') {
        // Телефон висит над полом плитки: низ телефона на 3 пикселя выше пола
        lp.phones.push({ x: tileX(c), y: tileY(r + 1) - 14 });
        continue;
      }
      if (thing === 'beer') { lp.beers.push({ x: tileX(c), y: tileY(r + 1) - 10 }); continue; }
      if (thing === 'cig' || thing === 'coffee') { lp.boosts.push({ kind: thing, x: tileX(c), y: tileY(r + 1) - 9 }); continue; }
      if (thing === 'kirill' || thing === 'cat' || thing === 'vacuum' || thing === 'neighbor' || thing === 'dog' || thing === 'scooter') {
        lp.spawns.push({ type: thing, x: tileX(c), y: tileY(r + 1) });
        continue;
      }
      if (thing === 'keybox') { lp.keyBoxes.push({ x: tileX(c), y: tileY(r + 1) - 8 }); continue; }
      if (thing === 'biker') { lp.bikeLanes.push({ x: tileX(c), y: tileY(r + 1) }); continue; }
      if (thing === 'sprinkler') { lp.sprinklers.push({ x: tileX(c), y: tileY(r) }); continue; }
      if (thing === 'vasya' || thing === 'nastya') { lp.twins.push({ name: thing, x: tileX(c), y: tileY(r + 1) }); continue; }
      if (thing === 'mama') { lp.mama = { x: tileX(c), y: tileY(r + 1) }; continue; }
      if (thing === 'lego') { lp.lego.push({ x: tileX(c), y: tileY(r) + 5, w: 8, h: 3 }); continue; }
      if (thing === 'rake') { lp.rakes.push({ x: tileX(c), y: tileY(r) + 4, w: 8, h: 4, timer: 0 }); continue; }
      // Крупные вещи: символ — левый нижний угол, предмет растёт вверх и вправо
      const size = FURNITURE[thing] || SPECIAL_SIZES[thing];
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
      if (thing === 'gate') { gates++; lp.gate = { x: x, y: y }; continue; }
      if (thing === 'exit') { exits++; lp.exit = { x: x, y: y }; continue; }
      if (thing === 'lera') { lp.npcs.push({ x: x, y: y }); continue; }
      if (thing === 'gossip2' || thing === 'gossip3') {
        lp.gossips.push({ x: x, y: y, w: size.w * TILE, n: thing === 'gossip3' ? 3 : 2, ground: tileY(r + 1) });
        continue;
      }
      // Предмет целиком твёрдый: каждая его часть — препятствие
      const def = FURNITURE[thing];
      const item = { def: def, x: x, y: y, alarm: 0 };
      lp.furniture.push(item);
      if (thing === 'stairs') lp.stairs.push(x);
      if (def.car) lp.cars.push(item);
      for (const p of furnitureParts(def)) {
        lp.solids.push({ x: x + p.x, y: y + p.y, w: p.w, h: p.h, bounce: !!def.bounce, lie: !!def.lie,
                         step: !!def.step, conveyor: def.conveyor || 0, car: def.car ? item : null });
        if (def.hot) lp.hot.push({ x: x + p.x - 1, y: y + p.y - 1, w: p.w + 2, h: p.h + 1 });
      }
      // Тонкие платформы предмета (крона дерева, перекладины) и горки
      for (const t of def.tops || []) lp.tops.push({ x: x + t.x, y: y + t.y, w: t.w });
      for (const rp of def.ramps || []) lp.ramps.push({ x: x + rp.x, y: y + rp.y, w: rp.w, h: rp.h });
      if (def.puddle) lp.puddles.push({ x: x + def.puddle.x, y: y + def.puddle.y, w: def.puddle.w, h: def.puddle.h });
      if (def.swing) lp.swings.push({ x: x, y: y });
    }
  }
  if (starts === 0) errors.push(pn + ': НЕТ СТАРТА P. ПОСТАВЬ ОДНУ БУКВУ P.');
  if (starts > 1) errors.push(pn + ': СТАРТОВ P ' + starts + ', А НУЖЕН ОДИН.');
  if (isArena) {
    if (lp.twins.length > 0 && lp.twins.length !== 2) errors.push(pn + ': НУЖНЫ ВАСЯ И НАСТЯ — РОВНО ПО ОДНОЙ.');
    if (lp.twins.length === 0 && !lp.mama) errors.push(pn + ': НА АРЕНЕ НЕТ БОССА (ВАСИ И НАСТИ ИЛИ МАМЫ).');
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
  const total = levelCfg('clockStartHour') * 60 + levelCfg('clockStartMinute') +
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

// =============================================
// ПОДСКАЗКИ: короткая надпись внизу экрана на 3 секунды, каждая — один раз за игру
// =============================================
const hintsShown = {};   // какие подсказки уже были (до перезагрузки страницы)
let hint = null;         // подсказка на экране {text, t}

function showHint(id, text) {
  if (hintsShown[id]) return;
  hintsShown[id] = true;
  hint = { text: text, t: 180 };
}

// Каждый шаг игры: подсказка тает
function tickHint() {
  if (hint && --hint.t <= 0) hint = null;
}

// Рисуем подсказку внизу, над экранными кнопками
function drawHint() {
  if (!hint) return;
  const w = textWidth(hint.text) + 10;
  const x = Math.round(W / 2 - w / 2), y = H - 46;
  drawBox(x, y, w, 13);
  drawText(ctx, hint.text, x + 5, y + 3, '#ffcd75');
}

// Значки оружия под HUD слева (уровень 2): «ключ x5» и «плов x1» — сколько осталось
const WEAPON_PANEL = { x: 2, y: HUD_H + 1, w: 54, h: 11 };

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
  neighbor: { w: 10, h: 20 },   // соседи с сумками (уровень 2)
  dog:      { w: 12, h: 7 },    // собачка
  scooter:  { w: 10, h: 17 },   // ребёнок на самокате
};

// Новый враг из точки появления на карте
function makeEnemy(sp) {
  const size = ENEMY_SIZES[sp.type];
  return {
    type: sp.type, w: size.w, h: size.h,
    x: sp.x + (8 - size.w) / 2, y: sp.y - size.h,   // ноги на полу плитки
    homeX: sp.x, vx: 0, vy: 0, dir: -1,             // сначала идёт влево — навстречу Филиппу
    state: 'walk', timer: Math.floor(Math.random() * 120), cool: 0, onGround: false,
    variant: (sp.x / TILE) % 2,                     // соседка или сосед, рыжий или тёмный на самокате
    stunT: 0,                                       // сидит со звёздочками после ключа
    slipT: 0,                                       // лежит, поскользнувшись на плове
  };
}

// Есть ли под точкой опора (пол, предмет или полка). deep = true — смотрим глубже (ступеньки лестницы)
function hasGround(x, y, deep) {
  const probe = { x: x, y: y, w: 1, h: deep ? 6 : 2 };
  return level.solids.some((s) => overlaps(probe, s)) ||
         level.tops.some((t) => x >= t.x && x < t.x + t.w && y >= t.y - 1 && y <= t.y + 2);
}

// Двигаем врага: гравитация, стены, края. avoidEdges — разворачиваться у края, а не падать.
// stairs = true — умеет ходить по ступенькам лестницы вверх и вниз (соседи, собачка)
function moveEnemy(e, avoidEdges, stairs) {
  e.vy = Math.min(CONFIG.maxFall, e.vy + CONFIG.gravity);
  // по X
  const oldX = e.x;
  e.x += e.vx;
  let blocked = e.x < 0 || e.x + e.w > level.width;
  for (const s of level.solids) {
    if (!overlaps(e, s)) continue;
    if (stairs && s.step && e.y + e.h - s.y <= 5) { e.y = s.y - e.h; continue; }   // шагнул на ступеньку
    blocked = true;
  }
  if (!blocked && avoidEdges && e.onGround) {
    const footX = e.vx > 0 ? e.x + e.w : e.x - 1;
    if (!hasGround(footX, e.y + e.h, stairs)) blocked = true;
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
  // --- Уровень 2 ---
  keys: 0,           // гаечные ключи
  plov: 0,           // контейнеры плова
  shots: [],         // летящие ключи и контейнеры плова
  plovs: [],         // плов на земле {x, y, w, timer}
  bikes: [],         // дети на великах {lane, x, y, dir, state, timer}
  laneTimers: [],    // для каждой дорожки великов: сколько шагов до следующего велика
  boxesTaken: [],    // для каждой части: какие ящики с ключами уже взяты
  gossipHold: null,  // у какой лавки с бабушками застрял Филипп (или null)
  nods: 0,           // сколько раз Филипп «кивнул» бабушкам
  nodTimer: 0,       // для картинки кивка
  slowT: 0,          // сколько шагов ещё собачка держит шлёпанец
  thought: null,     // мысль над Филиппом {text, t} — «ЭТО ПРАВДА.»
  truthDone: false,  // мысль у граффити уже была
  carry: null,       // что переносится в следующий уровень: кружки, ключи, плов

  // mode:
  //   'resume'   — вернуться после разговора по телефону: ничего не сбрасываем
  //   'nextPart' — перейти в следующую часть уровня (Лера и часы продолжают)
  //   'lastCall' — «ЕЩЁ РАЗ»: продолжить с места последнего звонка
  //   'nextLevel'— начать следующий уровень (кружки переносятся, но не меньше 3)
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
    if (mode === 'nextLevel') {
      // Запоминаем, что унести с собой, и собираем следующий уровень
      this.carry = { lives: this.lives, keys: this.keys, plov: this.plov, armed: weaponsOn() };
      loadLevel(currentLevelIndex + 1);
    }
    const fresh = mode !== 'lastCall' || !this.saved;
    if (fresh) {
      // Ключи и плов переносятся, если на прошлом уровне уже было оружие.
      // На уровень 2 Филипп приходит без них: ключи берёт у бабушки, плов она даёт с собой.
      const c = this.carry;
      this.carry = null;
      const armed = c && c.armed;
      this.saved = { part: 0, x: levelParts[0].start.x, y: levelParts[0].start.y, leraX: 0,
                     leraSpeed: levelCfg('leraSpeed'), clockSteps: 0,
                     taken: levelParts.map((p) => p.phones.map(() => false)),
                     beersTaken: levelParts.map((p) => p.beers.map(() => false)),
                     boostsTaken: levelParts.map((p) => p.boosts.map(() => false)),
                     boxesTaken: levelParts.map((p) => p.keyBoxes.map(() => false)),
                     keys: armed ? c.keys : CONFIG.keysStart,
                     plov: armed ? c.plov : CONFIG.plovStart,
                     lives: c ? Math.max(CONFIG.startLives, c.lives) : CONFIG.startLives };
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
    this.boxesTaken = copyTaken(this.saved.boxesTaken);
    this.keys = this.saved.keys;
    this.plov = this.saved.plov;
    // Новый уровень — кружки с прошлого уровня (не меньше 3). «ЕЩЁ РАЗ» — снова 3 кружки
    this.lives = fresh ? this.saved.lives : CONFIG.startLives;
    this.resetEffects();                              // и полный кураж, без кофе и пива
    this.invuln = 0;
    this.resetPart();
    clockSteps = this.saved.clockSteps;
    this.waitSteps = levelCfg('leraHeadStart') * 60;    // фора в шагах
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
    player.groundSolid = null;
    player.onRamp = false;
    player.carOn = null;
    // Уровень 2: ключи в полёте, плов, велики, бабушки, поливалки, машины
    this.shots = [];
    this.plovs = [];
    this.bikes = [];
    this.laneTimers = level.bikeLanes.map(() => 0);
    this.gossipHold = null;
    this.nods = 0;
    this.slowT = 0;
    this.thought = null;
    this.truthDone = false;
    for (const g of level.gossips) { g.angry = 0; g.released = false; }
    for (const sp of level.sprinklers) { sp.timer = 0; sp.dir = 0; }
    for (const c of level.cars) c.alarm = 0;
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

  // Множитель скорости бега: кураж, кофе, «отходняк», собачка держит шлёпанец
  speedFactor() {
    let k = this.courageFactor();
    if (this.coffee > 0) k *= CONFIG.coffeeSpeedMul;
    else if (this.coffeeCrash > 0) k *= CONFIG.coffeeCrashMul;
    if (this.slowT > 0) k *= CONFIG.dogSlowMul;
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
  // Если на этом месте уже есть надпись, новая встаёт выше. Выше места нет (там HUD) — старая
  // надпись убирается. Та же самая надпись не повторяется, а просто начинается заново.
  popup(text, x, y) {
    const w = textWidth(text);
    let ny = y;
    for (let tries = 0; tries < 6; tries++) {
      // Где надпись сейчас (она поднимается со временем)
      const clash = this.popups.find((p) => Math.abs(p.x - x) < (textWidth(p.text) + w) / 2 + 3 &&
                                            Math.abs((p.y - p.t / 3) - ny) < 9);
      if (!clash) break;
      if (clash.text === text) { clash.t = 0; clash.x = x; clash.y = ny; return; }
      const above = clash.y - clash.t / 3 - 9;
      if (above - 10 < HUD_H + 2) { this.popups.splice(this.popups.indexOf(clash), 1); continue; }
      ny = above;
    }
    this.popups.push({ text: text, x: x, y: ny, t: 0 });
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

    tickHint();
    if (weaponsOn()) showHint('weapons', HINTS.weapons);   // уровень 2: впервые есть оружие
    this.updateGossip(input);                         // бабушки на лавке держат — кнопки не слушаются
    this.movePlayer(input);
    clockSteps++;
    this.tickEffects();
    if (this.invuln > 0) this.invuln--;
    if (this.swingCool > 0) this.swingCool--;
    if (this.slowT > 0) this.slowT--;

    // --- Враги, ловушки, пиво ---
    this.updateEnemies();
    this.updateTraps();
    // --- Уровень 2: оружие, велики, поливалки, машины, ящики с ключами, граффити ---
    this.updateWeapons(input);
    this.updateBikes();
    this.updateSprinklers();
    this.updateYard();
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
      if (bossArena) {
        // Калитка (арка) ведёт на арену босса: затемнение, дальше — арена
        setState('inLevelScene', { background: 'level', next: bossStateName(), nextArg: 'intro', steps: [{ type: 'fade' }] });
      } else {
        // Босса нет (уровень 2 пока): сценка конца уровня из scenes.js, например level2End
        const end = SCENES['level' + (currentLevelIndex + 1) + 'End'];
        setState('inLevelScene', { background: 'level', next: end.next, nextArg: end.nextArg,
                                   steps: [{ type: 'fade' }].concat(end.steps) });
      }
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
    this.leraX = Math.max(0, this.leraX - levelCfg('callPushBack'));
    this.leraSpeed += levelCfg('leraSpeedUp');
    // Тихо запоминаем место звонка: после поражения «ЕЩЁ РАЗ» начнётся отсюда
    const ph = level.phones[i];
    this.saved = { part: partIndex, x: ph.x - 1, y: ph.y + 14 - player.h, leraX: this.leraX,
                   leraSpeed: this.leraSpeed, clockSteps: clockSteps, taken: copyTaken(this.taken),
                   beersTaken: copyTaken(this.beersTaken), boostsTaken: copyTaken(this.boostsTaken),
                   boxesTaken: copyTaken(this.boxesTaken), keys: this.keys, plov: this.plov };
    // Сценка разговора поверх замершего уровня
    setState('inLevelScene', {
      background: 'level',
      next: 'level',
      nextArg: 'resume',
      steps: [
        { type: 'say', who: 'filipp', text: takeFromBag('excuses' + currentLevelIndex, this.callExcuses()) },
        { type: 'say', who: 'lera', text: takeFromBag('answers' + currentLevelIndex, this.callAnswers()) },
      ],
    });
  },

  // Отмазки и ответы Леры для текущего уровня (scenes.js). Для уровня 2 — свои, если они есть
  callExcuses() {
    return currentLevelIndex === 1 && typeof CALL_EXCUSES_2 !== 'undefined' ? CALL_EXCUSES_2 : CALL_EXCUSES;
  },
  callAnswers() {
    return currentLevelIndex === 1 && typeof CALL_ANSWERS_2 !== 'undefined' ? CALL_ANSWERS_2 : CALL_ANSWERS;
  },

  // Толчок без потери кружки: соседи «ОСТОРОЖНО!», самокаты, поливалка. srcX — откуда толкнули
  shove(text, srcX, power) {
    if (this.coffee > 0) return;                     // с кофе Филипп проскакивает
    const cx = player.x + player.w / 2;
    const dir = cx < srcX ? -1 : 1;
    player.vx = dir * power;
    player.vy = -2;
    player.onGround = false;
    player.stun = 20;
    player.stunKind = 'knock';
    hurtSound();
    this.popup(text, cx, player.y - 4);
  },

  // Стоит ли враг ногами в плове
  onPlov(e) {
    const feet = { x: e.x, y: e.y + e.h - 2, w: e.w, h: 4 };
    return this.plovs.some((p) => overlaps(feet, { x: p.x, y: p.y, w: p.w, h: 4 }));
  },

  // Ключ попал во врага: «БДЗЫНЬ!», враг сидит со звёздочками
  stunEnemy(e) {
    e.stunT = Math.round(CONFIG.enemyStunSeconds * 60);
    e.vx = 0;
    if (e.type === 'dog' && e.state === 'bite') this.slowT = 0;   // отпустила шлёпанец
    if (e.type === 'kirill' || e.type === 'dog' || e.type === 'cat') { e.state = 'walk'; e.timer = 0; }
    clangSound();
    this.popup('БДЗЫНЬ!', e.x + e.w / 2, e.y - 6);
  },

  // Враги: Кирилл, Туся, пылесос (уровень 1), соседи, собачка, самокаты (уровень 2)
  updateEnemies() {
    const pcx = player.x + player.w / 2;
    const pBottom = player.y + player.h;
    for (const e of this.enemies) {
      const ecx = e.x + e.w / 2;
      const dx = pcx - ecx;
      const sameRow = Math.abs(pBottom - (e.y + e.h)) < 16;   // Филипп примерно на том же полу
      if (e.cool > 0) e.cool--;
      e.timer++;

      // Оглушён ключом (звёздочки) или поскользнулся на плове — стоит или лежит и никого не трогает
      if (e.stunT > 0 || e.slipT > 0) {
        if (e.stunT > 0) e.stunT--;
        else e.slipT--;
        e.vx = 0;
        if (e.type !== 'vacuum') moveEnemy(e, true);
        continue;
      }
      // Наступил на плов — поскользнулся и упал
      if (e.type !== 'vacuum' && e.state !== 'bite' && e.onGround && this.onPlov(e)) {
        e.slipT = Math.round(CONFIG.slipSeconds * 60);
        this.popup('ШМЯК!', ecx, e.y - 6);
        continue;
      }

      if (e.type === 'neighbor') {
        // Сосед с сумками медленно ходит по пролёту туда-сюда. Касание — «ОСТОРОЖНО!» и отталкивает
        if (Math.abs(e.x - e.homeX) > 48) e.dir = e.x > e.homeX ? -1 : 1;
        e.vx = e.dir * CONFIG.neighborSpeed;
        moveEnemy(e, true, true);
        if (e.cool === 0 && overlaps(player, e)) {
          this.shove('ОСТОРОЖНО!', ecx, CONFIG.neighborPush);
          e.cool = 60;
        }
      }

      if (e.type === 'scooter') {
        // Ребёнок на самокате катается туда-сюда. Касание отбрасывает (кружку не отнимает)
        if (Math.abs(e.x - e.homeX) > 64) e.dir = e.x > e.homeX ? -1 : 1;
        e.vx = e.dir * CONFIG.scooterSpeed;
        moveEnemy(e, true);
        if (e.cool === 0 && overlaps(player, e)) {
          this.shove('БИП-БИП!', ecx, CONFIG.neighborPush);
          e.cool = 60;
        }
      }

      if (e.type === 'dog') {
        if (e.state === 'bite') {
          // Вцепилась в шлёпанец: держится у ног Филиппа, он еле идёт
          e.dir = player.facing;
          e.x = player.facing > 0 ? player.x - e.w + 3 : player.x + player.w - 3;
          e.y = player.y + player.h - e.h;
          if (this.slowT <= 0) {
            e.state = 'walk'; e.timer = 0; e.cool = 180;
            e.dir = -player.facing;                       // отпустила и убегает
          }
        } else if (e.state === 'run') {
          e.dir = dx < 0 ? -1 : 1;
          e.vx = e.dir * CONFIG.dogRunSpeed;
          if (!sameRow || Math.abs(dx) > 150) { e.state = 'walk'; e.timer = 0; }
          moveEnemy(e, true, true);
          if (this.coffee === 0 && overlaps(player, e)) {
            e.state = 'bite'; e.timer = 0;
            this.slowT = Math.round(CONFIG.dogHoldSeconds * 60);
            barkSound();
            this.popup('ГРРР!', ecx, e.y - 6);
          }
        } else {
          if (Math.abs(e.x - e.homeX) > 32) e.dir = e.x > e.homeX ? -1 : 1;
          e.vx = e.dir * CONFIG.dogSpeed;
          if (e.cool === 0 && sameRow && Math.abs(dx) < CONFIG.dogSeeDistance) {
            e.state = 'run'; e.timer = 0;                 // заметила — «ТЯВ!» и бежит к Филиппу
            barkSound();
            this.popup('ТЯВ!', ecx, e.y - 6);
          }
          moveEnemy(e, true, true);
        }
      }

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

  // ---------- УРОВЕНЬ 2 ----------

  // Бабушки на лавке: «зона сплетен». Вошёл — застрял, вырваться — «кивнуть» 6 раз (Прыжок)
  gossipZone(g) {
    const k = g.angry > 0 ? CONFIG.gossipAngryMul : 1;           // после ключа «ХУЛИГАН!» зона больше
    return { cx: g.x + g.w / 2, cy: g.ground, rx: CONFIG.gossipRadius * k, ry: CONFIG.gossipRadius * 0.7 * k };
  },
  inGossip(g, margin) {
    const z = this.gossipZone(g);
    const dx = (player.x + player.w / 2 - z.cx) / (z.rx * margin);
    const dy = (player.y + player.h - 11 - z.cy) / (z.ry * margin);   // середина Филиппа
    return dx * dx + dy * dy < 1;
  },
  updateGossip(input) {
    for (const g of level.gossips) {
      if (g.angry > 0) g.angry--;
      // Отпустили — не ловят, пока Филипп не отойдёт подальше (можно отойти для разбега)
      if (g.released && Math.abs(player.x + player.w / 2 - (g.x + g.w / 2)) > this.gossipZone(g).rx + 48) g.released = false;
    }
    if (this.nodTimer > 0) this.nodTimer--;
    if (this.gossipHold) {
      const g = this.gossipHold;
      player.stun = Math.max(player.stun, 2);          // стоит, кнопки не слушаются
      player.stunKind = 'gossip';
      player.vx = 0;
      if (input.jumpPressed) {
        this.nods++;
        this.nodTimer = 8;
        if (this.nods >= CONFIG.gossipNods) {
          g.released = true;                            // отпустили — можно идти дальше
          this.gossipHold = null;
          player.stun = 0;
          this.popup(GOSSIP_BYE, player.x + player.w / 2, player.y - 4);
        }
      }
      return;
    }
    for (const g of level.gossips) {
      if (!g.released && this.inGossip(g, 1)) {
        this.gossipHold = g;
        this.nods = 0;
        showHint('gossip', HINTS.gossip);              // первая лавка с бабушками
        player.vx = 0;
        g.talkStart = this.tick;
        break;
      }
    }
  },
  // Где сидят бабушки (для попадания ключом)
  gossipBox(g) {
    return { x: g.x, y: g.ground - 22, w: g.w, h: 22 };
  },

  // Оружие: ключ (E или X, кнопка «Ключ») и плов (F, кнопка «Плов») — каждое своей кнопкой.
  // Дальше — полёт ключей и плова
  updateWeapons(input) {
    if (!weaponsOn()) return;
    const canThrow = !player.lying && !this.gossipHold && !(player.stun > 0 && player.stunKind === 'trip');
    const cx = player.x + player.w / 2;
    if (input.throwPressed && canThrow) {
      if (this.keys > 0) {
        this.keys--;
        this.shots.push({ kind: 'wrench', x: cx + player.facing * 4, y: player.y + 13, t: 0,
                          vx: player.facing * CONFIG.wrenchSpeed, vy: -CONFIG.wrenchLift });
      } else {
        this.popup('КЛЮЧЕЙ НЕТ!', cx, player.y - 4);
      }
    }
    if (input.plovPressed && canThrow) {
      if (this.plov > 0) {
        this.plov--;
        this.shots.push({ kind: 'plov', x: cx + player.facing * 4, y: player.y + 9, t: 0,
                          vx: player.facing * 1.6, vy: -1.5 });
      } else {
        this.popup('ПЛОВА НЕТ!', cx, player.y - 4);
      }
    }
    for (const sh of this.shots) {
      sh.t++;
      sh.vy += sh.kind === 'wrench' && !sh.bounced ? CONFIG.wrenchGravity : 0.2;
      sh.x += sh.vx;
      sh.y += sh.vy;
      const box = { x: sh.x - 4, y: sh.y - 4, w: 8, h: 8 };
      if (state === momState && momState.hitByShot(sh, box)) { sh.done = true; continue; }   // попал в маму
      if (sh.kind === 'wrench' && !sh.bounced) {
        // Попал во врага — «БДЗЫНЬ!», враг сидит со звёздочками
        for (const e of this.enemies) {
          if (e.stunT > 0 || e.slipT > 0 || !overlaps(box, e)) continue;
          this.stunEnemy(e);
          sh.done = true;
          break;
        }
        // Попал в ребёнка на велике — сбил с велика «ОЙ!»
        for (const b of this.bikes) {
          if (sh.done || b.state !== 'ride' || !overlaps(box, this.bikeBox(b))) continue;
          b.state = 'fall';
          b.timer = Math.round(CONFIG.enemyStunSeconds * 60);
          clangSound();
          this.popup('БДЗЫНЬ!', b.x + 10, b.y - 20);
          this.popup('ОЙ!', b.x + 10, b.y - 8);
          sh.done = true;
        }
        // Попал в бабушек — ключ отскакивает, «ХУЛИГАН!», зона сплетен больше
        for (const g of level.gossips) {
          if (sh.done || !overlaps(box, this.gossipBox(g))) continue;
          sh.bounced = true;
          sh.vx = -sh.vx * 0.4;
          sh.vy = -2;
          g.angry = Math.round(CONFIG.gossipAngrySeconds * 60);
          this.popup('ХУЛИГАН!', g.x + g.w / 2, g.ground - 26);
        }
      }
      if (sh.done) continue;
      if (sh.kind === 'plov' && sh.vy > 0) {
        // Контейнер упал — плов высыпается полосой
        let landY = null;
        for (const o of level.solids) if (overlaps(box, o)) landY = o.y;
        for (const t of level.tops) {
          if (sh.x >= t.x && sh.x < t.x + t.w && sh.y + 3 >= t.y && sh.y + 3 - sh.vy <= t.y) landY = t.y;
        }
        if (landY !== null) {
          const w = CONFIG.plovTiles * TILE;
          this.plovs.push({ x: Math.round(sh.x - w / 2), y: landY - 3, w: w, timer: Math.round(CONFIG.plovSeconds * 60) });
          sh.done = true;
          continue;
        }
      } else if (level.solids.some((o) => overlaps(box, o))) {
        sh.done = true;                               // ключ ударился о стену или упал — исчез
      }
      if (sh.x < cameraX - 16 || sh.x > cameraX + W + 16 || sh.y > H + 8) sh.done = true;
    }
    this.shots = this.shots.filter((sh) => !sh.done);
    for (const pl of this.plovs) pl.timer--;
    this.plovs = this.plovs.filter((pl) => pl.timer > 0);
  },

  // Хитбокс велика: низкий, чтобы его можно было перепрыгнуть
  bikeBox(b) {
    return { x: b.x + 2, y: b.y - 12, w: 16, h: 12 };
  },

  // Дети на великах: пока Филипп рядом с дорожкой, раз в несколько секунд мчится велик.
  // За секунду до него — «ДЗЫНЬ-ДЗЫНЬ» и стрелка у правого края экрана
  updateBikes() {
    level.bikeLanes.forEach((lane, i) => {
      const near = player.x > lane.x - 240 && player.x < lane.x + 60;
      if (!near) { this.laneTimers[i] = 20; return; }
      if (--this.laneTimers[i] > 0) return;
      this.laneTimers[i] = Math.round(CONFIG.bikeEverySeconds * 60);
      this.bikes.push({ lane: i, x: 0, y: lane.y, dir: -1, state: 'warn',
                        timer: Math.round(CONFIG.bikeWarnSeconds * 60), variant: i % 2, hit: false });
      bellSound();
    });
    for (const b of this.bikes) {
      if (b.state === 'warn') {
        if (--b.timer <= 0) { b.state = 'ride'; b.x = Math.round(cameraX) + W + 2; }
        continue;
      }
      if (b.state === 'fall') {
        if (--b.timer <= 0) b.state = 'ride';         // встал и поехал дальше
        continue;
      }
      b.x += b.dir * CONFIG.bikeSpeed;
      const box = this.bikeBox(b);
      if (this.plovs.some((pl) => overlaps(box, { x: pl.x, y: pl.y, w: pl.w, h: 4 }))) {
        b.state = 'fall';                              // наехал на плов — упал
        b.timer = Math.round(CONFIG.slipSeconds * 60);
        this.popup('ШМЯК!', b.x + 10, b.y - 20);
        continue;
      }
      if (!b.hit && overlaps(player, box)) {
        b.hit = true;
        this.hurt('БАЦ!', b.x + 10);                   // удар — минус кружка
      }
      if (b.x < cameraX - 40) b.gone = true;
    }
    this.bikes = this.bikes.filter((b) => !b.gone);
  },

  // Точки струи поливалки: дуга от головки до земли
  sprinklerArc(sp) {
    const pts = [];
    const x0 = sp.x + 4, y0 = sp.y + 2, ground = sp.y + 8;
    for (let t = 0.1; t <= 1.001; t += 0.1) {
      pts.push({ x: x0 + sp.dir * CONFIG.sprinklerReach * t, y: y0 + (ground - y0) * t - 4 * 24 * t * (1 - t) });
    }
    return pts;
  },
  // Поливалка: струя бьёт то влево, то вправо и отталкивает (кружку не отнимает)
  updateSprinklers() {
    const jet = Math.round(CONFIG.sprinklerJetSeconds * 60);
    const pause = Math.round(CONFIG.sprinklerPauseSeconds * 60);
    for (const sp of level.sprinklers) {
      sp.timer = (sp.timer + 1) % (2 * (jet + pause));
      sp.dir = sp.timer < jet ? -1 : (sp.timer >= jet + pause && sp.timer < 2 * jet + pause ? 1 : 0);
      if (sp.dir === 0 || this.swingCool > 0) continue;
      if (this.sprinklerArc(sp).some((pt) => overlaps(player, { x: pt.x - 2, y: pt.y - 2, w: 4, h: 4 }))) {
        this.shove('ПШШ!', sp.x + 4, CONFIG.neighborPush);
        this.swingCool = 40;
      }
    }
  },

  // Двор: сигнализация машин, ящики с ключами, граффити «ЭТО ПРАВДА.»
  updateYard() {
    for (const c of level.cars) if (c.alarm > 0) c.alarm--;
    if (weaponsOn()) {
      const boxes = this.boxesTaken[partIndex];
      level.keyBoxes.forEach((b, i) => {
        if (boxes[i] || this.keys >= CONFIG.keysMax) return;
        if (overlaps(player, { x: b.x - 1, y: b.y - 2, w: 10, h: 10 })) {
          boxes[i] = true;
          this.keys = Math.min(CONFIG.keysMax, this.keys + CONFIG.keyBoxKeys);
          pickupSound();
          this.popup('+' + CONFIG.keyBoxKeys + ' КЛЮЧА', b.x + 4, b.y - 4);
        }
      });
    }
    // Стена с граффити: Филипп дошёл до середины экрана — думает «ЭТО ПРАВДА.»
    const pcx = player.x + player.w / 2;
    const scr = level.screens[Math.floor(pcx / SCREEN_W)];
    if (!this.truthDone && scr && LEVEL_BACKGROUNDS[scr.bg].truth && pcx % SCREEN_W > 110) {
      this.truthDone = true;
      this.thought = { text: GRAFFITI_THOUGHT, t: 180 };
    }
    if (this.thought && --this.thought.t <= 0) this.thought = null;
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
    if (player.lying && (keys.left || keys.right || keys.jump || input.jumpPressed || input.throwPressed || input.plovPressed)) {
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

    // Горка: съезжаешь быстро вправо, кнопки «влево-вправо» не помогают
    const wasOnRamp = player.onRamp;
    if (player.onRamp) { dir = 0; player.vx = CONFIG.slideSpeed; }
    // Карусель: стоишь на ней — тащит в сторону
    if (player.onGround && player.groundSolid && player.groundSolid.conveyor) {
      player.x += player.groundSolid.conveyor * CONFIG.carouselSpeed;
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
        // Низкая ступенька лестничного пролёта: заходим на неё без прыжка
        const upY = s.y - player.h;
        if (s.step && player.y + player.h - s.y <= 5 &&
            !level.solids.some((o) => o !== s && overlaps({ x: player.x, y: upY, w: player.w, h: player.h }, o))) {
          player.y = upY;
          continue;
        }
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
    let landed = null;              // на чём стоим (для карусели и машин)
    for (const s of level.solids) {
      if (overlaps(player, s)) {
        if (player.vy > 0) {        // падали вниз — встали на платформу
          player.y = s.y - player.h;
          landed = s;
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

    // Горка: скат — наклонная линия. Встал на него сверху — едешь вниз
    player.onRamp = false;
    if (player.vy >= 0) {
      const cx = player.x + player.w / 2;
      for (const rp of level.ramps) {
        if (cx < rp.x || cx > rp.x + rp.w) continue;
        const surf = rp.y + (cx - rp.x) / rp.w * rp.h;
        const bottom = player.y + player.h;
        if (bottom >= surf - (wasOnRamp ? 6 : 0) && oldBottom <= surf + 3) {
          player.y = surf - player.h;
          player.vy = 0;
          player.onGround = true;
          player.onRamp = true;
          if (!wasOnRamp) this.popup('УИ-И-И!', cx, player.y - 4);
        }
      }
    }

    // На чём стоим: карусель тащит, на машине — сигнализация «УИ-УИ-УИ!» (просто шутка)
    player.groundSolid = player.onGround ? landed : null;
    if (player.onGround) {
      const car = landed && landed.car;
      if (car && car !== player.carOn && car.alarm === 0) {
        car.alarm = Math.round(CONFIG.carAlarmSeconds * 60);
        sirenSound();
      }
      player.carOn = car || null;
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
      const look = LEVEL_BACKGROUNDS[scr.bg].exitLook || (scr.bg === 'windowEnd' ? 'window' : 'stairs');
      drawPartExit(ctx, level.exit.x - cam, level.exit.y, look, this.tick);
    }
    // Калитка (на уровне 2 — арка) и предметы (с тёмным контуром)
    if (level.gate) {
      const scr = level.screens[Math.floor(level.gate.x / SCREEN_W)];
      if (LEVEL_BACKGROUNDS[scr.bg].gateLook === 'arch') drawArch(ctx, level.gate.x - cam, level.gate.y);
      else drawGate(ctx, level.gate.x - cam, level.gate.y);
    }
    for (const f of level.furniture) {
      if (f.x - cam > W || f.x + f.def.w * TILE - cam < 0) continue;  // за экраном — не рисуем
      drawFurniture(ctx, f.def, f.x - cam, f.y, this.tick);
    }
    // Машины с сигнализацией: мигают фары
    for (const c of level.cars) {
      if (c.alarm <= 0 || Math.floor(c.alarm / 6) % 2) continue;
      const w = c.def.w * TILE, by = c.y + c.def.parts[0].y;
      ctx.fillStyle = '#ffcd75';
      ctx.fillRect(c.x - cam + w - 4, by + 1, 5, 5);
      ctx.fillStyle = '#ef7d57';
      ctx.fillRect(c.x - cam - 1, by + 1, 4, 5);
    }
    // Лавки с бабушками и «зона сплетен»
    for (const g of level.gossips) this.drawGossip(g, cam);
    // Поливалки и струя воды
    for (const sp of level.sprinklers) {
      drawSprinkler(ctx, sp.x - cam, sp.y, this.tick);
      if (sp.dir !== 0) {
        this.sprinklerArc(sp).forEach((pt, i) => drawWaterDrop(ctx, Math.round(pt.x) - cam + ((this.tick + i) % 3) - 1, Math.round(pt.y), i % 2));
      }
    }
    // Ящики с ключами
    const boxes = this.boxesTaken[partIndex] || [];
    level.keyBoxes.forEach((b, i) => { if (!boxes[i]) drawKeyBox(ctx, b.x - cam, b.y); });
    // Плов на земле
    for (const pl of this.plovs) drawPlovStrip(ctx, pl.x - cam, pl.y, pl.w, pl.timer / (CONFIG.plovSeconds * 60));
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
    // Дети на великах
    for (const b of this.bikes) {
      if (b.state === 'warn') continue;
      const spr = SPRITES[b.variant ? 'bikerB' : 'bikerA'];
      const anim = spr.anims[b.state === 'fall' ? 'fall' : 'ride'];
      const frame = anim.frames[Math.floor(this.tick / anim.speed) % anim.frames.length];
      drawSprite(ctx, frame, Math.round(b.x) - cam, b.y - 18, b.dir < 0);
      if (b.state === 'fall') drawStars(ctx, Math.round(b.x) - cam + 10, b.y - 14, this.tick);
    }
    // Летящие ключи (крутятся) и контейнеры плова
    for (const sh of this.shots) {
      if (sh.kind === 'wrench') drawWrench(ctx, sh.x - cam, sh.y, sh.t * 0.5);
      else ctx.drawImage(ICON_PLOV, Math.round(sh.x) - 4 - cam, Math.round(sh.y) - 4);
    }

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
      if (this.gossipHold) {
        // Застрял у бабушек: стоит и кивает
        drawSprite(ctx, SPRITES.filipp.anims.idle.frames[0], sx, sy + (this.nodTimer > 4 ? 1 : 0), player.facing === -1);
      } else if (player.lying || (player.stun > 0 && player.stunKind === 'trip')) {
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

    // Мысль над Филиппом («ЭТО ПРАВДА.») и подсказка «КИВАЙ!» у бабушек
    if (this.thought) {
      drawTextCenteredShadow(this.thought.text, Math.max(30, Math.min(W - 30, sx + 8)), Math.max(HUD_H + 14, sy - 12), '#ffcd75', '#1a1c2c');
    }
    if (this.gossipHold) {
      const hint = 'КИВАЙ! ' + this.nods + '/' + CONFIG.gossipNods;
      drawTextCenteredShadow(hint, Math.max(30, Math.min(W - 30, sx + 8)), Math.max(HUD_H + 14, sy - 12), '#ffcd75', '#1a1c2c');
    }
    // Собачка держит шлёпанец
    if (this.slowT > 0 && Math.floor(this.tick / 10) % 2) drawText(ctx, 'ГРРР', sx - 6, sy + 14, '#f4f4f4');

    // Велик скоро выедет: «ДЗЫНЬ-ДЗЫНЬ» и мигающая стрелка у правого края
    for (const b of this.bikes) {
      if (b.state !== 'warn') continue;
      drawWarnArrow(ctx, W - 9, b.y - 8, -1, this.tick);
      drawTextShadow('ДЗЫНЬ-ДЗЫНЬ', W - 16 - textWidth('ДЗЫНЬ-ДЗЫНЬ'), b.y - 11, '#ffcd75', '#1a1c2c');
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
    if (state === levelState || state === momState) drawHint();   // в сценках подсказку не показываем
  },

  // Лавка с бабушками: пунктирный полукруг «зоны сплетен», «БУ-БУ-БУ», реплики, когда Филипп застрял
  drawGossip(g, cam) {
    const z = this.gossipZone(g);
    if (z.cx + z.rx - cam < 0 || z.cx - z.rx - cam > W) return;
    // Пунктирный полукруг: точки по краю зоны. Злые бабушки — красный
    ctx.fillStyle = g.angry > 0 ? '#b13e53' : '#333c57';
    for (let a = 0; a <= Math.PI; a += 0.09) {
      if (Math.floor((a * 20 + this.tick / 6)) % 2) continue;
      ctx.fillRect(Math.round(z.cx + Math.cos(a) * z.rx) - cam, Math.round(z.cy - Math.sin(a) * z.ry), 2, 1);
    }
    drawGossipBench(ctx, g.x - cam, g.ground - 16, g.w);
    const names = ['grannyRed', 'grannyGreen', 'grannyBlue'];
    const gap = g.w / g.n;
    for (let i = 0; i < g.n; i++) {
      const spr = SPRITES[names[(i + Math.floor(g.x / 8)) % 3]].anims.talk;
      const talking = this.gossipHold === g || Math.floor(this.tick / 40 + i) % 3 === 0;
      const frame = spr.frames[talking ? Math.floor(this.tick / spr.speed) % 2 : 0];
      // смотрят на Филиппа
      drawSprite(ctx, frame, Math.round(g.x + gap * i + gap / 2 - 5) - cam, g.ground - 24, player.x + player.w / 2 < g.x + gap * i + gap / 2);
    }
    const cx = Math.round(z.cx) - cam;
    if (this.gossipHold === g) {
      // Реплики по очереди: каждые 1,2 секунды говорит другая бабушка
      const k = Math.floor((this.tick - (g.talkStart || 0)) / 72);
      const text = GOSSIP_LINES[k % GOSSIP_LINES.length];
      const bx = Math.round(g.x + gap * (k % g.n) + gap / 2) - cam;
      const tw = textWidth(text);
      const x0 = Math.max(2, Math.min(W - tw - 6, bx - Math.round(tw / 2) - 2));
      const y0 = Math.max(HUD_H + 14, g.ground - 54);   // выше подсказки «КИВАЙ!»
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(x0, y0, tw + 4, 10);
      ctx.fillRect(Math.max(x0 + 2, Math.min(x0 + tw, bx)), y0 + 10, 2, 3);   // хвостик облачка
      drawText(ctx, text, x0 + 2, y0 + 2, '#b13e53');
    } else if (Math.abs(player.x - z.cx) < 160 && Math.floor(this.tick / 30) % 2 === 0) {
      drawTextCentered(ctx, 'БУ-БУ-БУ', cx, Math.max(HUD_H + 14, g.ground - 34), '#f4f4f4');
    }
  },

  // Рисуем одного врага. Картинка — по центру хитбокса, ноги — по низу
  drawEnemy(e, cam) {
    const ex = Math.round(e.x) - cam, ey = Math.round(e.y);
    if (ex < -20 || ex > W + 20) return;
    if (e.type === 'neighbor' || e.type === 'dog' || e.type === 'scooter') {
      const key = e.type === 'neighbor' ? (e.variant ? 'neighborM' : 'neighborW') :
                  e.type === 'dog' ? 'dog' : (e.variant ? 'scooterB' : 'scooterA');
      const spr = SPRITES[key];
      const animName = e.type === 'dog' ? (e.state === 'bite' ? 'bite' : (e.state === 'run' ? 'run' : 'walk')) :
                       e.type === 'neighbor' ? 'walk' : 'ride';
      const anim = spr.anims[animName];
      const still = e.stunT > 0 || e.slipT > 0;
      const frame = anim.frames[still ? 0 : Math.floor(this.tick / anim.speed) % anim.frames.length];
      const fx = ex + Math.round((e.w - frame.width) / 2);
      const fy = ey + e.h - frame.height;
      if (e.slipT > 0) {
        // Поскользнулся на плове: лежит на земле (картинка на боку)
        ctx.save();
        ctx.translate(ex + e.w / 2, ey + e.h - frame.width / 2);
        ctx.rotate(-Math.PI / 2 * (e.dir < 0 ? -1 : 1));
        ctx.drawImage(frame, -frame.width / 2, -frame.height / 2);
        ctx.restore();
        return;
      }
      drawSprite(ctx, frame, fx, fy, e.dir < 0);
      if (e.stunT > 0) drawStars(ctx, ex + e.w / 2, fy - 3, this.tick);
      return;
    }
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

    // Оружие (с уровня 2): «ключ x5» и «плов x1» — только для информации. Кончилось — число тусклое
    if (weaponsOn() && state !== bossState) {
      const P = WEAPON_PANEL;
      ctx.fillStyle = '#1a1c2c';
      ctx.fillRect(P.x, P.y, P.w, P.h);
      [[ICON_WRENCH, this.keys], [ICON_PLOV, this.plov]].forEach(([img, n], i) => {
        const x = P.x + i * (P.w / 2);
        ctx.drawImage(img, x + 2, P.y + 2);
        drawText(ctx, 'X' + n, x + 12, P.y + 2, n > 0 ? '#f4f4f4' : '#566c86');
      });
    }
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
// ЭКРАН: БОСС УРОВНЯ 2 — МАМА
// =============================================
// Арена — один экран (boss уровня 2 в levels.js). Мама ходит по правой половине и бросает по дуге:
//   розовые сердечки — поймал, и шкала «ВНИМАНИЕ» растёт; упало на землю — чуть падает «НУ ВОТ...»;
//   серые просьбы (кран, унитаз, лампочка, плитка) — коснулся, и Филипп 2 секунды стоит «ЛАДНО, ПОСМОТРЮ...».
// ФАЗА 1: шкала меньше половины. ФАЗА 2: мама идёт к Филиппу «ДАЙ ОБНИМУ!» — постоял рядом 2 секунды,
// и объятие: шкала +20%. Просьб больше, иногда летит большое сердце «ФОТО ИЗ ДЕТСТВА».
// Ключ в маму — шкала минус 20%, плов в маму — пропал зря. Лера идёт и во время боя.
// Победа — шкала полная. Все числа — в CONFIG.level2.
const REQUEST_KINDS = ['tap', 'toilet', 'bulb', 'tile'];   // кран, унитаз, лампочка, плитка

const momState = {
  mama: null,       // мама {x, y, w, h, ...} — хитбокс
  flying: [],       // летящие сердечки и просьбы
  attention: 0,     // шкала «ВНИМАНИЕ»: 0 — пусто, 1 — победа
  hugT: 0,          // сколько шагов Филипп стоит рядом с мамой (для объятия)
  hugging: 0,       // сколько шагов ещё длится объятие
  hugCool: 0,       // после объятия мама отходит
  throwTimer: 0,    // через сколько шагов мама бросит следующее
  sadT: 0,          // сколько шагов мама грустит «НУ ВОТ...»
  phase2Said: false,// уже сказала «ДАЙ ОБНИМУ!» при начале фазы 2
  intro: false,     // идёт вступление: мама входит в кадр
  saved: null,      // начало арены — для «ЕЩЁ РАЗ»

  // mode: 'intro' — первый вход (Лера отлетает), 'retry' — «ЕЩЁ РАЗ», 'fight' — вернулись после вступления
  enter(mode) {
    if (mode === 'fight') { this.intro = false; this.mama.x = this.mama.homeX; return; }
    if (mode === 'intro') {
      levelState.leraX -= levelCfg('bossPushBack');   // может уйти за начало шкалы — так даже лучше
      this.saved = { leraX: levelState.leraX, leraSpeed: levelState.leraSpeed, clockSteps: clockSteps,
                     keys: levelState.keys, plov: levelState.plov };
    } else if (mode === 'retry') {
      levelState.leraX = this.saved.leraX;
      levelState.leraSpeed = this.saved.leraSpeed;
      clockSteps = this.saved.clockSteps;
      levelState.keys = this.saved.keys;
      levelState.plov = this.saved.plov;
      levelState.lives = CONFIG.startLives;
      levelState.resetEffects();
    }
    this.reset();
    if (mode === 'intro') {
      // Титр и разговор перед боем — поверх арены. Мама входит в кадр справа
      this.intro = true;
      this.mama.x = W + 12;
      const steps = [{ type: 'title', text: 'БОСС:\nМАМА', auto: 2 }].concat(SCENES.momIntro.steps);
      setState('inLevelScene', { background: 'mom', next: 'mom', nextArg: 'fight', steps: steps });
    }
  },

  // Арена в начальное положение
  reset() {
    level = bossArena;
    partIndex = levelParts.length;
    levelState.resetPart();
    levelState.invuln = 0;
    levelState.alarm = false;
    levelState.ringing = -1;
    levelState.placePlayer(level.start.x, level.start.y);
    cameraX = 0;
    const m = level.mama;
    this.mama = { x: m.x, y: m.y - 20, w: 10, h: 20, homeX: m.x, goalX: m.x, dir: -1,
                  vx: 0, vy: 0, onGround: true, timer: 0 };
    this.flying = [];
    this.attention = 0;
    this.hugT = 0;
    this.hugging = 0;
    this.hugCool = 0;
    this.throwTimer = 90;
    this.sadT = 0;
    this.phase2Said = false;
  },

  // Вступление: мама идёт из-за правого края на своё место
  introTick() {
    if (!this.intro) return;
    const m = this.mama;
    if (m.x > m.homeX) { m.x = Math.max(m.homeX, m.x - 0.8); m.dir = -1; m.walking = true; }
    else m.walking = false;
    levelState.tick++;
  },

  phase() {
    return this.attention >= 0.5 ? 2 : 1;
  },

  update(input) {
    levelState.tick++;
    tickHint();
    levelState.movePlayer(input);
    clockSteps++;
    levelState.tickEffects();
    if (levelState.invuln > 0) levelState.invuln--;
    levelState.popups = levelState.popups.filter((p) => ++p.t < 50);
    levelState.updateWeapons(input);                 // ключ и плов (попадание в маму — hitByShot)

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

    this.updateHug();
    this.updateMama();
    this.updateFlying();
    if (this.attention >= 1) this.win();
  },

  // Поражение: та же сценка, но «ЕЩЁ РАЗ» — с начала арены
  lose() {
    setState('defeat', Object.assign({}, SCENES.defeat, { next: 'mom', nextArg: 'retry' }));
  },

  // Шкала «ВНИМАНИЕ» меняется: от 0 до 1
  addAttention(d) {
    this.attention = Math.max(0, Math.min(1, this.attention + d));
  },

  // Мама ходит: в фазе 1 — по правой половине, в фазе 2 — к Филиппу «ДАЙ ОБНИМУ!»
  updateMama() {
    const m = this.mama;
    m.timer++;
    if (this.sadT > 0) this.sadT--;
    if (this.hugging > 0) { m.walking = false; return; }
    const pcx = player.x + player.w / 2;
    let speed = levelCfg('momWalkSpeed');
    if (this.phase() === 2 && this.hugCool === 0) {
      if (!this.phase2Said) { this.phase2Said = true; levelState.popup(MOM_TEXT.hug, m.x + 5, m.y - 4); }
      // Подходит к Филиппу и встаёт рядом
      m.goalX = Math.max(4, Math.min(W - 14, pcx + (pcx < m.x + 5 ? 8 : -18)));
      speed = levelCfg('momComeSpeed');
    } else if (Math.abs(m.goalX - m.x) < 2 || m.timer % 180 === 0) {
      // Гуляет по правой половине арены
      m.goalX = W / 2 + 8 + Math.random() * (W / 2 - 32);
    }
    const dx = m.goalX - m.x;
    m.walking = Math.abs(dx) > 1;
    if (m.walking) { m.dir = Math.sign(dx); m.x += m.dir * Math.min(speed, Math.abs(dx)); }
    else m.dir = pcx < m.x + 5 ? -1 : 1;              // стоит — смотрит на сына

    // Бросает сердечко или просьбу
    if (--this.throwTimer <= 0) {
      this.launch();
      this.throwTimer = Math.round(levelCfg(this.phase() === 2 ? 'momThrowSeconds2' : 'momThrowSeconds') * 60);
    }
  },

  // Мама бросает по дуге: сердечко, просьбу или (в фазе 2) большое сердце «ФОТО ИЗ ДЕТСТВА»
  launch() {
    const m = this.mama;
    const phase2 = this.phase() === 2;
    let kind;
    if (phase2 && Math.random() < levelCfg('momPhotoChance')) kind = 'photo';
    else kind = Math.random() < levelCfg(phase2 ? 'momRequestChance2' : 'momRequestChance') ? 'request' : 'heart';
    // Куда упадёт: просьба — почти на Филиппа (в фазе 2 разбросаннее, их больше), сердечко — где-то
    // рядом с ним (чтобы успеть добежать)
    const pcx = player.x + player.w / 2;
    let tx = pcx + (Math.random() - 0.5) * (kind === 'request' ? (phase2 ? 120 : 50) : 150);
    tx = Math.max(10, Math.min(W - 10, tx));
    const size = kind === 'photo' ? { w: 14, h: 12 } : kind === 'heart' ? { w: 7, h: 7 } : { w: 14, h: 11 };
    let landY = H;                                    // земля или предмет под точкой падения
    for (const s of level.solids) if (tx >= s.x && tx < s.x + s.w && s.y < landY && s.y > HUD_H + 30) landY = s.y;
    const x0 = m.x + 5, y0 = m.y + 2;
    const T = Math.round(levelCfg(kind === 'photo' ? 'momPhotoFlightSeconds' : 'momFlightSeconds') * 60);
    const gr = levelCfg('momGravity');
    this.flying.push({
      kind: kind, w: size.w, h: size.h, tx: tx, landY: landY, t: 0, T: T,
      x: x0 - size.w / 2, y: y0 - size.h / 2,
      vx: (tx - x0) / T, vy: (landY - size.h / 2 - y0 - gr * T * T / 2) / T,
      icon: REQUEST_KINDS[Math.floor(Math.random() * REQUEST_KINDS.length)],
    });
    m.dir = tx < x0 ? -1 : 1;
    if (kind === 'heart') levelState.popup(takeFromBag('momHearts', MOM_TEXT.hearts), m.x + 5, m.y - 4);
    if (kind === 'photo') levelState.popup(MOM_TEXT.photo, m.x + 5, m.y - 4);
  },

  // Полёт: поймал сердечко — шкала растёт; упало — чуть падает; просьба — застрял
  updateFlying() {
    const gr = levelCfg('momGravity');
    for (const f of this.flying) {
      f.t++;
      f.vy += gr;
      f.x += f.vx;
      f.y += f.vy;
      const box = { x: f.x - 1, y: f.y - 1, w: f.w + 2, h: f.h + 2 };   // чуть больше — легче поймать
      if (overlaps(player, box)) {
        f.done = true;
        if (f.kind === 'request') {
          if (!(player.stun > 0 && player.stunKind === 'request')) {
            player.stun = Math.round(levelCfg('momStuckSeconds') * 60);
            player.stunKind = 'request';
            player.vx = 0;
            this.hugT = 0;
            hurtSound();
            levelState.popup(MOM_TEXT.stuck, player.x + player.w / 2, player.y - 4);
          }
        } else {
          this.addAttention(levelCfg(f.kind === 'photo' ? 'momPhotoGain' : 'momHeartGain'));
          gulpSound();
          levelState.popup(f.kind === 'photo' ? '+' + Math.round(levelCfg('momPhotoGain') * 100) + '%' : '+', f.x + f.w / 2, f.y - 2);
        }
        continue;
      }
      if (f.y + f.h >= f.landY) {
        f.done = true;
        if (f.kind !== 'request') {                    // сердечко упало — мама вздыхает
          this.addAttention(-levelCfg('momHeartLoss'));
          this.sadT = 70;
          levelState.popup(MOM_TEXT.sigh, this.mama.x + 5, this.mama.y - 4);
        }
      }
    }
    this.flying = this.flying.filter((f) => !f.done);
  },

  // Фаза 2: постоял рядом с мамой 2 секунды (не бегая) — объятие, шкала +20%
  updateHug() {
    if (this.hugCool > 0) this.hugCool--;
    const m = this.mama;
    if (this.hugging > 0) {
      this.hugging--;
      player.stun = Math.max(player.stun, 2);
      player.stunKind = 'hug';
      if (this.hugging === 0) {
        this.hugCool = Math.round(levelCfg('momHugCooldown') * 60);
        m.goalX = W / 2 + 40;                         // отходит обратно
      }
      return;
    }
    const near = this.phase() === 2 && this.hugCool === 0 && player.onGround && player.stun === 0 &&
                 Math.abs(player.vx) < 0.3 && Math.abs(player.x + player.w / 2 - (m.x + 5)) < 22;
    if (!near) { this.hugT = 0; return; }
    if (++this.hugT >= levelCfg('momHugSeconds') * 60) {
      this.hugT = 0;
      this.hugging = 60;
      this.addAttention(levelCfg('momHugGain'));
      gulpSound();
      levelState.popup(MOM_TEXT.hugDone, m.x + 5, m.y - 4);
    }
  },

  // Ключ или плов попали в маму. Возвращает true, если попали
  hitByShot(sh, box) {
    if (sh.bounced || !overlaps(box, this.mama)) return false;
    const m = this.mama;
    if (sh.kind === 'wrench') {
      this.addAttention(-levelCfg('momWrenchLoss'));
      clangSound();
      levelState.popup(MOM_TEXT.wrench, m.x + 5, m.y - 4);
    } else {
      levelState.popup(MOM_TEXT.plov, m.x + 5, m.y - 4);
    }
    this.sadT = 90;
    return true;
  },

  // Победа: мама даёт плов, потом звонок начальника и конец уровня (scenes.js: level2Win)
  win() {
    this.flying = [];
    this.hugging = 0;
    this.sadT = 0;
    player.stun = 0;
    levelState.alarm = false;
    levelState.popups = [];
    levelState.plov += levelCfg('momPlovGift');
    setState('inLevelScene', SCENES.level2Win);
  },

  draw() {
    levelState.draw();                               // фон, Филипп, надписи, HUD
    const m = this.mama;
    // Мама
    const animName = this.hugging > 0 ? 'hug' : (this.sadT > 0 ? 'sad' : (m.walking ? 'walk' : 'stand'));
    const anim = SPRITES.mama.anims[animName];
    const frame = anim.frames[Math.floor(levelState.tick / anim.speed) % anim.frames.length];
    drawSprite(ctx, frame, Math.round(m.x) - 2, Math.round(m.y) + m.h - 22, m.dir < 0);
    // Фаза 2: «ДАЙ ОБНИМУ!» над мамой и сердечко-полоска, сколько осталось постоять рядом
    const busy = levelState.popups.some((p) => Math.abs(p.x - (m.x + 5)) < 40);   // над мамой уже есть надпись
    if (state === momState && !busy && this.phase() === 2 && this.hugCool === 0 && this.hugging === 0 && Math.floor(levelState.tick / 30) % 2 === 0) {
      drawTextCenteredShadow(MOM_TEXT.hug, Math.max(34, Math.min(W - 34, Math.round(m.x) + 5)), Math.round(m.y) - 12, '#ef7d57', '#1a1c2c');
    }
    if (this.hugT > 0) {
      const p = this.hugT / (levelCfg('momHugSeconds') * 60);
      const bx = Math.round(player.x) - 3;
      ctx.fillStyle = '#1a1c2c';
      ctx.fillRect(bx, Math.round(player.y) - 8, 16, 3);
      ctx.fillStyle = '#ef7d57';
      ctx.fillRect(bx, Math.round(player.y) - 8, Math.round(16 * p), 3);
    }
    if (this.hugging > 0) drawLoveHeart(ctx, Math.round((player.x + m.x) / 2) + 2, Math.round(m.y) - 10 - Math.floor((60 - this.hugging) / 6), false);
    // Сердечки и просьбы в полёте
    for (const f of this.flying) {
      if (f.kind === 'request') drawRequest(ctx, Math.round(f.x), Math.round(f.y), f.icon);
      else drawLoveHeart(ctx, Math.round(f.x), Math.round(f.y), f.kind === 'photo');
    }
    // Шкала «ВНИМАНИЕ» под HUD справа (слева — значки оружия)
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(60, HUD_H, W - 60, 10);
    drawText(ctx, 'ВНИМАНИЕ', 64, HUD_H + 2, '#ef7d57');
    const bx = 118, bw = W - bx - 6;
    ctx.fillStyle = '#333c57';
    ctx.fillRect(bx, HUD_H + 3, bw, 5);
    ctx.fillStyle = '#ef7d57';
    ctx.fillRect(bx, HUD_H + 3, Math.round(bw * this.attention), 5);
    ctx.fillStyle = '#b13e53';
    ctx.fillRect(bx, HUD_H + 7, Math.round(bw * this.attention), 1);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(bx + Math.round(bw / 2), HUD_H + 2, 1, 7);   // середина — начало фазы 2
  },
};

// =============================================
// ЭКРАН: ЭТАП «ЗА РУЛЁМ» — минивэн едет в офис (вид сверху)
// =============================================
// Дорога из 3 полос едет сверху вниз, минивэн внизу экрана, нос вверх.
// ← → — руль, скорость растёт сама, «Прыжок» — тормоз, «Бросок» — гудок «БИ-БИП!».
// Мешают: попутные машины (столкновение — «БАЦ!», скорость почти ноль), ямы, лужи, пробка,
// светофор (проехал на красный — инспектор ГИБДД, 4 секунды «ДОКУМЕНТЫ!»).
// Угроза — время: начальник ждёт. Иконка начальника ползёт по шкале пути, как Лера на уровне.
// Все числа — в CONFIG.drive.

const ROAD_X = 72;                       // левый край дороги
const LANE_W = 32;                       // ширина полосы
const LANES = [88, 120, 152];            // середины полос
const VAN_Y = 100;                       // где на экране нос минивэна

// Генератор случайных чисел «с зерном»: каждый раз одна и та же дорога (для «ЕЩЁ РАЗ»)
function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const driveState = {
  dist: 0,          // сколько пикселей проехали (нос минивэна на дороге)
  speed: 0,         // скорость минивэна
  x: 0,             // левый край минивэна на экране
  steps: 0,         // сколько шагов идёт этап (время)
  cars: [],         // попутные машины на экране
  spawns: [],       // когда появятся следующие машины {at, lane, kind, speed}
  things: [],       // ямы, лужи, кофе, сигареты {kind, pos, x, taken}
  decor: [],        // обочины: деревья, дома, щиты {pos, x, kind}
  lights: [],       // светофоры {pos, state, timer}
  popups: [],       // надписи «БАЦ!», «БИ-БИП!»
  skid: 0, skidDir: 1,     // занос после удара
  drift: 0, driftDir: 1,   // занос на луже
  bump: 0,          // подбросило на яме
  crashCool: 0,     // после удара немного не бьёмся снова
  hornCool: 0,      // перезарядка гудка
  coffee: 0,        // сколько шагов ещё действует кофе
  inspector: 0,     // сколько шагов ещё стоим у инспектора
  inspectorWait: 0, // через сколько шагов появится инспектор
  warned: false,    // начальник уже звонил «ТЫ ГДЕ?»
  outro: 0,         // финиш: минивэн заезжает на парковку
  startCourage: 1,  // кураж в начале этапа (для «ЕЩЁ РАЗ»)
  tick: 0,

  // mode: 'new' — начать этап, 'retry' — «ЕЩЁ РАЗ» (с начала), 'resume' — после звонка начальника
  enter(mode) {
    if (mode === 'resume') return;
    if (mode !== 'retry') this.startCourage = levelState.courage;
    levelState.courage = this.startCourage;
    this.build();
    showHint('drive', HINTS.drive);
  },

  // Собираем дорогу: каждый раз одинаковую
  build() {
    const D = CONFIG.drive;
    const rnd = seededRandom(15);
    const L = D.length;
    this.dist = 0;
    this.speed = 0;
    this.x = LANES[1] - CAR_TOP.van.w / 2;
    this.steps = 0;
    this.cars = [];
    this.popups = [];
    this.skid = this.drift = this.bump = this.crashCool = this.hornCool = this.coffee = 0;
    this.inspector = this.inspectorWait = 0;
    this.warned = false;
    this.outro = 0;
    // Светофоры и пробка
    this.lights = D.lights.map((k) => ({ pos: Math.round(L * k), state: 'green', timer: 0, passed: false }));
    const jamStart = Math.round(L * D.jamAt);
    const near = (pos, gap) => this.lights.some((l) => Math.abs(l.pos - pos) < gap) ||
                               (pos > jamStart - gap && pos < jamStart + D.jamLength + gap);
    // Попутные машины: появляются сверху, когда до них доехали
    this.spawns = [];
    const kinds = ['sedan', 'sedan', 'sedan', 'sedan', 'zhiguli', 'zhiguli', 'bus', 'truck'];
    let lastLane = -1;
    for (let at = 300; at < L - 300; at += D.trafficEvery * (0.6 + rnd() * 0.8)) {
      if (near(at + 120, 160)) continue;
      let lane = Math.floor(rnd() * 3);
      if (lane === lastLane) lane = (lane + 1 + Math.floor(rnd() * 2)) % 3;
      lastLane = lane;
      const kind = kinds[Math.floor(rnd() * kinds.length)];
      const slow = kind === 'bus' || kind === 'truck' ? 0.7 : 1;
      this.spawns.push({ at: Math.round(at), lane: lane, kind: kind, color: Math.floor(rnd() * SEDAN_COLORS.length),
                         speed: (D.carSpeedMin + rnd() * (D.carSpeedMax - D.carSpeedMin)) * slow });
    }
    // Пробка: ряды медленных машин, в каждом ряду одна полоса свободна (узкий просвет)
    let free = 1;
    for (let pos = jamStart; pos < jamStart + D.jamLength; pos += D.jamRowGap) {
      free = Math.max(0, Math.min(2, free + (rnd() < 0.5 ? -1 : 1)));
      for (let lane = 0; lane < 3; lane++) {
        if (lane === free) continue;
        // Вся пробка появляется сразу (за 150 пикселей до начала): ряды едут вместе и не съезжаются
        this.spawns.push({ at: jamStart - 150, pos: pos, lane: lane, kind: rnd() < 0.8 ? 'sedan' : 'zhiguli',
                           color: Math.floor(rnd() * SEDAN_COLORS.length), speed: D.jamSpeed });
      }
    }
    this.spawns.sort((a, b) => a.at - b.at);
    // Ямы, лужи, кофе, сигареты
    this.things = [];
    const put = (kind, n) => {
      for (let i = 0; i < n; i++) {
        let pos;
        do pos = 400 + rnd() * (L - 900); while (near(pos, 120));
        this.things.push({ kind: kind, pos: Math.round(pos), x: LANES[Math.floor(rnd() * 3)], taken: false });
      }
    };
    put('pothole', D.potholes);
    put('puddle', D.puddles);
    D.coffeeAt.forEach((k, i) => this.things.push({ kind: 'coffee', pos: Math.round(L * k), x: LANES[i % 3], taken: false }));
    D.cigsAt.forEach((k, i) => this.things.push({ kind: 'cig', pos: Math.round(L * k), x: LANES[(i + 2) % 3], taken: false }));
    // Обочины: деревья и дома, рекламные щиты
    this.decor = [];
    for (let pos = 0; pos < L + 200; pos += 34) {
      for (const side of [0, 1]) {
        const r = rnd();
        const x = side === 0 ? 4 + Math.floor(rnd() * 40) : 174 + Math.floor(rnd() * 40);
        if (r < 0.45) this.decor.push({ pos: pos, x: x + 10, kind: 'tree', r: 6 + Math.floor(rnd() * 5) });
        else if (r < 0.62) this.decor.push({ pos: pos, x: x, kind: 'house', roof: ['#b13e53', '#5d275d', '#257179'][Math.floor(rnd() * 3)] });
      }
    }
    D.billboards.forEach((b) => {
      const pos = Math.round(L * b.at);
      this.decor = this.decor.filter((d) => Math.abs(d.pos - pos) > 50 || (d.x < 120) !== (b.side === 0));
      this.decor.push({ pos: pos, x: b.side === 0 ? 4 : 176, kind: 'board', text: b.text });
    });
  },

  // Где на экране точка дороги pos (по высоте)
  screenY(pos) {
    return VAN_Y - (pos - this.dist);
  },

  // Хитбокс минивэна и машины на экране
  vanBox() {
    return { x: this.x + 1, y: VAN_Y - (this.bump > 0 ? 2 : 0), w: CAR_TOP.van.w - 2, h: CAR_TOP.van.h };
  },
  carBox(c) {
    return { x: c.x + 1, y: this.screenY(c.pos), w: c.w - 2, h: c.h };
  },

  // В какой полосе точка x (номер 0–2)
  laneOf(cx) {
    return Math.max(0, Math.min(2, Math.round((cx - LANES[0]) / LANE_W)));
  },

  popup(text, x, y) {
    levelState.popup.call(this, text, x, y);       // та же логика: не наезжают друг на друга
  },

  update(input) {
    const D = CONFIG.drive;
    this.tick++;
    tickHint();
    this.popups = this.popups.filter((p) => ++p.t < 50);
    if (this.outro > 0) { this.updateOutro(); return; }
    this.steps++;

    // --- Время: начальник ждёт. Сначала звонок «ТЫ ГДЕ?», потом — опоздал ---
    const limit = D.timeLimitSeconds * 60;
    if (!this.warned && this.steps >= limit * D.warnAt) {
      this.warned = true;
      setState('inLevelScene', { background: 'drive', next: 'drive', nextArg: 'resume', steps: SCENES.driveCall.steps });
      return;
    }
    if (this.steps >= limit) {
      setState('defeat', Object.assign({}, SCENES.driveLose));
      return;
    }

    // --- Минивэн: газ сам, тормоз, руль ---
    if (this.crashCool > 0) this.crashCool--;
    if (this.hornCool > 0) this.hornCool--;
    if (this.bump > 0) this.bump--;
    if (this.coffee > 0) this.coffee--;
    const maxSpeed = D.maxSpeed * (this.coffee > 0 ? D.coffeeSpeedMul : 1);
    if (this.inspectorWait > 0 && --this.inspectorWait === 0) {
      this.inspector = Math.round(D.inspectorSeconds * 60);   // инспектор ГИБДД: стоим
      whistleSound();
    }
    if (this.inspector > 0) {
      this.inspector--;
      this.speed = Math.max(0, this.speed - D.brake * 2);
    } else if (keys.jump) {
      this.speed = Math.max(0, this.speed - D.brake);
    } else if (this.speed < maxSpeed) {
      this.speed = Math.min(maxSpeed, this.speed + D.accel);
    } else {
      this.speed = Math.max(maxSpeed, this.speed - D.brake);  // кофе кончился — плавно сбавляем
    }
    if (this.skid > 0) {
      this.skid--;
      this.x += this.skidDir * 0.6;                  // занесло после удара
    } else if (this.inspector === 0) {
      let dir = 0;
      if (keys.left) dir -= 1;
      if (keys.right) dir += 1;
      this.x += dir * D.steer;
    }
    if (this.drift > 0) { this.drift--; this.x += this.driftDir * D.puddleDrift; }
    this.x = Math.max(ROAD_X + 1, Math.min(ROAD_X + 3 * LANE_W - CAR_TOP.van.w - 1, this.x));
    this.dist += this.speed;

    // --- Гудок «БИ-БИП!»: машина впереди в той же полосе перестраивается, если рядом свободно ---
    if (input.throwPressed && this.hornCool === 0 && this.inspector === 0) {
      this.hornCool = Math.round(D.hornCooldown * 60);
      hornSound();
      this.popup('БИ-БИП!', this.x + 8, VAN_Y - 2);
      this.honk();
    }

    this.updateCars();
    this.updateThings();
    this.updateLights();

    // --- Финиш: доехали до офиса ---
    if (this.dist >= D.length) {
      this.outro = 1;
      this.speed = 1;
    }
  },

  // Гудок: ближайшая машина впереди в нашей полосе уходит в соседнюю свободную
  honk() {
    const D = CONFIG.drive;
    const lane = this.laneOf(this.x + 8);
    const ahead = this.cars.filter((c) => c.lane === lane && c.pos - c.h > this.dist - 4 && c.pos - c.h - this.dist < D.hornReach)
                           .sort((a, b) => a.pos - b.pos)[0];
    if (!ahead) return;
    const options = [lane - 1, lane + 1].filter((l) => l >= 0 && l <= 2 &&
      !this.cars.some((o) => o !== ahead && o.lane === l && Math.abs(o.pos - ahead.pos) < ahead.h + o.h + 8));
    if (options.length === 0) { this.popup('НЕКУДА!', ahead.x + ahead.w / 2, this.screenY(ahead.pos) - 2); return; }
    const to = options[Math.floor(Math.random() * options.length)];
    ahead.lane = to;
    ahead.targetX = LANES[to] - ahead.w / 2;
  },

  // Попутные машины: появляются сверху, едут медленнее, перестраиваются, уезжают вниз
  updateCars() {
    const D = CONFIG.drive;
    while (this.spawns.length && this.dist >= this.spawns[0].at) {
      const s = this.spawns.shift();
      const size = CAR_TOP[s.kind];
      const pos = s.pos !== undefined ? s.pos : this.dist + VAN_Y - HUD_H + size.h + 4;   // сразу за верхним краем
      if (this.cars.some((o) => o.lane === s.lane && Math.abs(o.pos - pos) < size.h + o.h)) continue;
      const col = SEDAN_COLORS[s.color];
      this.cars.push({ kind: s.kind, lane: s.lane, w: size.w, h: size.h, x: LANES[s.lane] - size.w / 2,
                       targetX: LANES[s.lane] - size.w / 2, pos: pos, speed: s.speed, base: s.speed,
                       body: s.kind === 'sedan' ? col[0] : undefined, shade: s.kind === 'sedan' ? col[1] : undefined });
    }
    for (const c of this.cars) {
      // На красный машины тоже стоят у стоп-линии
      let speed = c.base;
      for (const l of this.lights) if (l.state !== 'green' && c.pos < l.pos && l.pos - c.pos < 24) speed = 0;
      // Не въезжать в машину впереди в той же полосе
      for (const o of this.cars) {
        if (o === c || o.lane !== c.lane) continue;
        const gap = (o.pos - o.h) - c.pos;
        if (gap >= 0 && gap < 8) speed = Math.min(speed, o.speed);
      }
      c.speed = speed;
      c.pos += speed;
      if (c.x !== c.targetX) c.x += Math.sign(c.targetX - c.x) * Math.min(1, Math.abs(c.targetX - c.x));
      // Столкновение с минивэном
      if (this.crashCool === 0 && overlaps(this.vanBox(), this.carBox(c))) {
        this.crashCool = 50;
        this.speed = D.crashSpeed;
        this.skid = Math.round(D.crashSkidSeconds * 60);
        this.skidDir = this.x + 8 < c.x + c.w / 2 ? -1 : 1;
        if (c.pos - c.h > this.dist - 10) c.pos = this.dist + c.h + 4;   // машину впереди чуть отталкивает
        hurtSound();
        this.popup('БАЦ!', this.x + 8, VAN_Y - 2);
      }
    }
    // Уехали далеко вниз — убираем. У офиса машины сворачивают — тоже убираем
    this.cars = this.cars.filter((c) => this.screenY(c.pos) < H + 20 && c.pos - c.h < D.length);
  },

  // Ямы, лужи, кофе, сигареты
  updateThings() {
    const D = CONFIG.drive;
    const van = this.vanBox();
    for (const t of this.things) {
      if (t.taken) continue;
      const y = this.screenY(t.pos);
      if (y > H + 10 || y < -20) continue;
      const box = t.kind === 'pothole' ? { x: t.x - 6, y: y, w: 12, h: 8 } :
                  t.kind === 'puddle' ? { x: t.x - 8, y: y, w: 16, h: 8 } : { x: t.x - 5, y: y - 1, w: 10, h: 10 };
      if (!overlaps(van, box)) continue;
      t.taken = true;
      if (t.kind === 'pothole') {
        this.speed *= D.potholeSpeedMul;
        this.bump = 14;
        knockSound();
        this.popup('БУМ!', this.x + 8, VAN_Y - 2);
      } else if (t.kind === 'puddle') {
        this.drift = Math.round(D.puddleSkidSeconds * 60);
        this.driftDir = Math.random() < 0.5 ? -1 : 1;
        this.popup('ВЖЖ!', this.x + 8, VAN_Y - 2);
      } else if (t.kind === 'coffee') {
        this.coffee = Math.round(D.coffeeSeconds * 60);
        pickupSound();
        this.popup('КОФЕ!', this.x + 8, VAN_Y - 2);
      } else {
        levelState.courage = Math.min(1, levelState.courage + CONFIG.cigCourage);
        pickupSound();
        this.popup('+КУРАЖ', this.x + 8, VAN_Y - 2);
      }
    }
  },

  // Светофоры: подъезжаешь — загорается жёлтый, потом красный, потом снова зелёный.
  // Проехал стоп-линию на красный — через секунду инспектор ГИБДД
  updateLights() {
    const D = CONFIG.drive;
    for (const l of this.lights) {
      if (l.state === 'green' && !l.done && l.pos - this.dist < D.lightWarnDistance) { l.state = 'yellow'; l.timer = 30; }
      else if (l.state === 'yellow' && --l.timer <= 0) { l.state = 'red'; l.timer = Math.round(D.lightRedSeconds * 60); }
      else if (l.state === 'red' && --l.timer <= 0) { l.state = 'green'; l.done = true; }
      if (!l.passed && this.dist >= l.pos) {
        l.passed = true;
        if (l.state === 'red') {
          this.inspectorWait = Math.round(D.inspectorDelay * 60);
          this.popup('ФЬЮ-ФЬЮТЬ!', this.x + 8, VAN_Y - 2);
        }
      }
    }
  },

  // Финиш: минивэн заезжает на парковку, потом сценка
  updateOutro() {
    this.outro++;
    this.x += Math.sign(LANES[1] - 8 - this.x) * Math.min(1, Math.abs(LANES[1] - 8 - this.x));
    if (this.outro > 60) {
      setState('inLevelScene', SCENES.driveWin);
    }
  },

  draw() {
    const D = CONFIG.drive;
    // Трава и тротуары
    ctx.fillStyle = '#38b764';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#94b0c2';
    ctx.fillRect(ROAD_X - 8, 0, 8, H);
    ctx.fillRect(ROAD_X + 3 * LANE_W, 0, 8, H);
    // Обочины: дома, деревья, щиты
    for (const d of this.decor) {
      const y = this.screenY(d.pos);
      if (y < -40 || y > H + 10) continue;
      if (d.kind === 'tree') drawTreeTop(ctx, d.x, y, d.r);
      else if (d.kind === 'house') drawHouseTop(ctx, d.x, y - 22, 26, 22, d.roof);
      else drawBillboard(ctx, d.x, y - 28, d.text);
    }
    // Дорога и разметка (пунктир бежит вниз)
    ctx.fillStyle = '#566c86';
    ctx.fillRect(ROAD_X, 0, 3 * LANE_W, H);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(ROAD_X, 0, 2, H);
    ctx.fillRect(ROAD_X + 3 * LANE_W - 2, 0, 2, H);
    const phase = Math.floor(this.dist) % 16;
    for (const lx of [ROAD_X + LANE_W, ROAD_X + 2 * LANE_W]) {
      for (let y = -16 + phase; y < H; y += 16) ctx.fillRect(lx - 1, y, 2, 8);
    }
    // Офис и парковка в конце пути
    const officeY = this.screenY(D.length + 30);      // низ здания; под ним — парковка
    if (officeY > -70) drawOffice(ctx, officeY);
    // Стоп-линии и светофоры
    for (const l of this.lights) {
      const y = this.screenY(l.pos);
      if (y < -30 || y > H + 4) continue;
      ctx.fillStyle = '#f4f4f4';
      ctx.fillRect(ROAD_X, y, 3 * LANE_W, 3);
      drawTrafficLight(ctx, ROAD_X - 12, y - 22, l.state);
      drawTrafficLight(ctx, ROAD_X + 3 * LANE_W + 4, y - 22, l.state);
    }
    // Ямы, лужи, кофе, сигареты
    for (const t of this.things) {
      if (t.taken) continue;
      const y = this.screenY(t.pos);
      if (y < -12 || y > H + 4) continue;
      if (t.kind === 'pothole') drawPothole(ctx, t.x - 6, y);
      else if (t.kind === 'puddle') drawRoadPuddle(ctx, t.x - 8, y);
      else if (t.kind === 'coffee') drawCoffee(ctx, t.x - 4, y, this.tick);
      else drawCigs(ctx, t.x - 4, y);
    }
    // Машины
    for (const c of this.cars) {
      const y = this.screenY(c.pos);
      if (y > H || y + c.h < 0) continue;
      drawCarTop(ctx, c.kind, Math.round(c.x), Math.round(y), c.body, c.shade);
    }
    // Минивэн Филиппа: при ударе и на луже — повёрнут, на яме — подпрыгнул
    const vy = VAN_Y - Math.min(26, Math.floor(this.outro / 2)) - (this.bump > 7 ? 2 : 0);   // финиш: заезжает на парковку
    const angle = this.skid > 0 ? this.skidDir * 0.35 * Math.sin(this.skid / 3) : (this.drift > 0 ? this.driftDir * 0.2 : 0);
    ctx.save();
    ctx.translate(Math.round(this.x) + 8, vy + 15);
    ctx.rotate(angle);
    drawCarTop(ctx, 'van', -8, -15);
    ctx.restore();
    if (this.coffee > 0) drawSteam(ctx, Math.round(this.x) + 8, vy - 2, this.tick);
    // Инспектор ГИБДД на обочине у минивэна
    if (this.inspector > 0) {
      drawSprite(ctx, SPRITES.inspector.anims.stand.frames[0], ROAD_X + 3 * LANE_W + 6, VAN_Y + 4, false);
      drawTextCenteredShadow('ДОКУМЕНТЫ!', 180, VAN_Y - 10, '#ffcd75', '#1a1c2c');
    }
    // Впереди светофор (ещё не виден) — значок вверху дороги
    for (const l of this.lights) {
      const y = this.screenY(l.pos);
      if (y < HUD_H && l.state !== 'green' && !l.passed) {
        drawTrafficLight(ctx, ROAD_X + 3 * LANE_W / 2 - 4, HUD_H + 2, l.state);
      }
    }
    // Надписи
    for (const p of this.popups) {
      const half = Math.ceil(textWidth(p.text) / 2) + 2;
      const px = Math.max(half, Math.min(W - half, Math.round(p.x)));
      drawTextCenteredShadow(p.text, px, Math.max(HUD_H + 2, Math.round(p.y - 10 - p.t / 3)), '#f4f4f4', '#b13e53');
    }
    this.drawHud();
    if (state === driveState) drawHint();
  },

  // HUD: кураж, кофе, часы; шкала пути до офиса: минивэн, а за ним — начальник (время)
  drawHud() {
    const D = CONFIG.drive;
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(0, 0, W, HUD_H);
    drawText(ctx, 'КУРАЖ', 4, 1, '#94b0c2');
    ctx.fillStyle = '#333c57';
    ctx.fillRect(36, 3, 30, 3);
    ctx.fillStyle = levelState.courage < 0.5 ? '#ffcd75' : '#a7f070';
    ctx.fillRect(36, 3, Math.round(30 * levelState.courage), 3);
    if (this.coffee > 0) {
      drawCoffee(ctx, 72, 0, this.tick);
      ctx.fillStyle = '#ffcd75';
      ctx.fillRect(81, 3, Math.max(1, Math.round(16 * this.coffee / (D.coffeeSeconds * 60))), 2);
    }
    // Гудок: готов или перезаряжается
    drawText(ctx, 'ГУДОК', 104, 1, this.hornCool > 0 ? '#566c86' : '#ffcd75');
    drawText(ctx, VERSION, W - 31 - 6 - textWidth(VERSION), 1, '#566c86');
    const total = D.startHour * 60 + D.startMinute + Math.floor(this.steps / (60 * D.secondsPerMinute));
    drawText(ctx, String(Math.floor(total / 60) % 24).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0'), W - 31, 1, '#ffcd75');
    // Шкала пути
    const limit = D.timeLimitSeconds * 60;
    const late = this.steps / limit;
    const blink = late > D.warnAt && Math.floor(this.tick / 8) % 2 === 0;
    ctx.fillStyle = blink ? '#b13e53' : '#566c86';
    ctx.fillRect(BAR.x, BAR.y, BAR.w, BAR.h);
    const fx = BAR.x + BAR.w;
    ctx.fillStyle = '#f4f4f4';                        // флажок — офис
    ctx.fillRect(fx, BAR.y - 4, 1, BAR.h + 7);
    ctx.fillRect(fx - 3, BAR.y - 4, 3, 3);
    const vx = BAR.x + Math.round(BAR.w * Math.min(1, this.dist / D.length));
    ctx.fillStyle = '#1a1c2c';                        // минивэн на шкале
    ctx.fillRect(vx - 4, BAR.y - 3, 8, 6);
    ctx.fillStyle = '#b13e53';
    ctx.fillRect(vx - 3, BAR.y - 2, 6, 4);
    ctx.drawImage(ICONS.nachalnik.image, BAR.x + Math.round(BAR.w * Math.min(1, late)) - 4, HUD_H - 8);
  },
};

// =============================================
// МЕНЮ: пункты выбираются пальцем (тап по пункту) или стрелками вверх-вниз и «Прыжком»
// =============================================
function createMenu() {
  return { index: 0, rects: [] };
}

// Возвращает номер выбранного пункта или -1, если ничего не выбрали
function menuUpdate(menu, count, input) {
  if (input.menuMove) menu.index = ((menu.index + input.menuMove) % count + count) % count;
  for (const t of input.taps) {
    const i = menu.rects.findIndex((r) => r && t.x >= r.x && t.x < r.x + r.w && t.y >= r.y && t.y < r.y + r.h);
    if (i !== -1) { menu.index = i; return i; }
  }
  if (input.confirm) return menu.index;
  return -1;
}

// Рисует пункты столбиком по центру. Выбранный — жёлтый, со стрелками > <
function drawMenu(menu, items, cx, y0, step, first) {
  menu.rects = [];
  const from = first || 0;
  items.forEach((text, i) => {
    if (i < from) return;
    const y = y0 + (i - from) * step;
    if (y > H - 8) return;
    const w = textWidth(text);
    const sel = i === menu.index;
    if (sel) {
      ctx.fillStyle = '#333c57';
      ctx.fillRect(Math.round(cx - w / 2) - 10, y - 2, w + 20, 11);
      drawText(ctx, '>', Math.round(cx - w / 2) - 8, y, '#ffcd75');
      drawText(ctx, '<', Math.round(cx + w / 2) + 3, y, '#ffcd75');
    }
    drawTextCentered(ctx, text, cx, y, sel ? '#ffcd75' : '#f4f4f4');
    menu.rects[i] = { x: cx - w / 2 - 12, y: y - 3, w: w + 24, h: step };   // зона для пальца
  });
}

// =============================================
// ПАУЗА — поверх замершей игры. Пока пауза, игра не обновляется: стоит всё
// =============================================
let paused = false;
const pauseMenu = createMenu();
let pauseControls = false;   // открыт список «УПРАВЛЕНИЕ»
let dimImage = null;      // затемнение «сеточкой» (только цвет палитры), готовим один раз

// Можно ставить на паузу только на уровне и в бою (не в сценках)
function canPause() {
  return state === levelState || state === bossState || state === momState || state === driveState;
}

function autoPause() {
  if (canPause()) { paused = true; pauseMenu.index = 0; }
}

function pauseItems() {
  return [
    'ПРОДОЛЖИТЬ',
    state === bossState || state === momState ? 'НАЧАТЬ БОЙ ЗАНОВО' :
      (state === driveState ? 'НАЧАТЬ ЭТАП ЗАНОВО' : 'НАЧАТЬ С ПОСЛЕДНЕГО ЗВОНКА'),
    'ЗВУК: ' + (soundOn ? 'ВКЛ' : 'ВЫКЛ'),
    'УПРАВЛЕНИЕ',
    'ВЫЙТИ В ГЛАВНОЕ МЕНЮ',
  ];
}

function updatePause(input) {
  // Открыт список «УПРАВЛЕНИЕ»: любое нажатие — назад в меню паузы
  if (pauseControls) {
    if (input.confirm || input.taps.length > 0 || input.menuMove) pauseControls = false;
    return;
  }
  const choice = menuUpdate(pauseMenu, 5, input);
  if (choice === 0) paused = false;
  if (choice === 1) {
    paused = false;
    if (state === bossState) setState('boss', 'retry');
    else if (state === momState) setState('mom', 'retry');
    else if (state === driveState) setState('drive', 'retry');
    else setState('level', 'lastCall');
  }
  if (choice === 2) setSound(!soundOn);
  if (choice === 3) pauseControls = true;
  if (choice === 4) { paused = false; setState('title'); }
}

function drawPause() {
  if (!dimImage) {
    dimImage = document.createElement('canvas');
    dimImage.width = W; dimImage.height = H;
    const g = dimImage.getContext('2d');
    g.fillStyle = '#1a1c2c';
    for (let y = 0; y < H; y++) for (let x = (y % 2); x < W; x += 2) g.fillRect(x, y, 1, 1);
  }
  ctx.drawImage(dimImage, 0, 0);
  if (pauseControls) { drawControls(); return; }
  drawBox(30, 22, 180, 96);
  drawTextCentered(ctx, 'ПАУЗА', 120, 29, '#ffcd75', 2);
  drawMenu(pauseMenu, pauseItems(), 120, 52, 12);
}

// Список «УПРАВЛЕНИЕ» в меню паузы
function drawControls() {
  drawBox(8, 4, 224, 128);
  drawTextCentered(ctx, 'УПРАВЛЕНИЕ', 120, 9, '#ffcd75');
  const rows = [
    ['КЛАВИАТУРА:', '#94b0c2'],
    ['СТРЕЛКИ — БЕГ', '#f4f4f4'],
    ['Z ИЛИ ПРОБЕЛ — ПРЫЖОК', '#f4f4f4'],
    ['E — КЛЮЧ (ЗАПАСНАЯ КЛАВИША — X)', '#f4f4f4'],
    ['F — ПЛОВ', '#f4f4f4'],
    ['P ИЛИ ESC — ПАУЗА', '#f4f4f4'],
    ['ЗА РУЛЁМ: Z — ТОРМОЗ, E ИЛИ X — ГУДОК', '#f4f4f4'],
    ['(РАБОТАЕТ И ПРИ РУССКОЙ РАСКЛАДКЕ)', '#566c86'],
    ['IPAD:', '#94b0c2'],
    ['СЛЕВА ВНИЗУ — БЕГ', '#f4f4f4'],
    ['СПРАВА — ПРЫЖОК, КЛЮЧ, ПЛОВ', '#f4f4f4'],
    ['КНОПКА ВВЕРХУ СПРАВА — ПАУЗА', '#f4f4f4'],
  ];
  rows.forEach(([text, color], i) => drawText(ctx, text, 16, 21 + i * 9, color));
  drawTextCentered(ctx, 'НАЖМИ, ЧТОБЫ ВЕРНУТЬСЯ', 120, 122, '#ffcd75');
}

// =============================================
// ЭКРАН: ВЫБОР УРОВНЯ (только для тестов, если CONFIG.DEBUG_MENU = true)
// =============================================
// Список строится сам из levels.js: для каждого уровня — все его части и босс.

// Собрать нужный уровень (если сейчас собран другой)
function loadLevel(li) {
  if (li === currentLevelIndex && levelParts.length) return;
  buildLevel(LEVELS[li]);
  currentLevelIndex = li;
  level = levelParts[0];
}

const levelSelectState = {
  menu: createMenu(),
  entries: [],    // что запустить: {level, part} или {level, boss: true}, или назад
  labels: [],
  enter() {
    this.entries = [];
    this.labels = [];
    LEVELS.forEach((lv, li) => {
      lv.parts.forEach((part, pi) => {
        this.entries.push({ level: li, part: pi });
        this.labels.push('УРОВЕНЬ ' + (li + 1) + ' — ЧАСТЬ ' + (pi + 1) + ': ' + (part.name || '').toUpperCase());
      });
      if (lv.boss) {
        this.entries.push({ level: li, boss: true });
        this.labels.push('УРОВЕНЬ ' + (li + 1) + ' — БОСС: ' + (lv.boss.name || '').toUpperCase());
      }
    });
    this.entries.push({ drive: true });
    this.labels.push('ЗА РУЛЁМ');
    this.entries.push({ back: true });
    this.labels.push('НАЗАД');
    this.menu.index = 0;
  },
  update(input) {
    const choice = menuUpdate(this.menu, this.entries.length, input);
    if (choice === -1) return;
    const e = this.entries[choice];
    if (e.back) { setState('title'); return; }
    if (e.drive) { setState('drive', 'new'); return; }
    loadLevel(e.level);
    setState('level');                              // всё с чистого листа
    if (e.boss) {
      // Как будто дошёл до калитки: Лера позади, телефоны «отзвонены»
      levelState.leraX = totalLength * 0.7;
      levelState.leraSpeed = levelCfg('leraSpeed') + 4 * levelCfg('leraSpeedUp');
      setState(bossStateName(), 'intro');
    } else if (e.part > 0) {
      // Начать с нужной части: Лера немного позади, телефоны прошлых частей уже взяты
      const lp = levelParts[e.part];
      const s = levelState.saved;
      s.part = e.part;
      s.x = lp.start.x;
      s.y = lp.start.y;
      s.leraX = Math.max(0, lp.offset - 300);
      s.taken = levelParts.map((p, i) => p.phones.map(() => i < e.part));
      setState('level', 'lastCall');
    }
  },
  draw() {
    ctx.fillStyle = '#1a1c2c';
    ctx.fillRect(0, 0, W, H);
    drawTextCentered(ctx, 'ВЫБОР УРОВНЯ', 120, 6, '#ffcd75', 2);
    drawText(ctx, 'ТОЛЬКО ДЛЯ ТЕСТОВ', 4, H - 9, '#566c86');
    // Если пунктов много — список прокручивается за выбранным
    const visible = 8;
    const first = Math.max(0, Math.min(this.menu.index - visible + 1, this.labels.length - visible));
    drawMenu(this.menu, this.labels, 120, 30, 12, first);
    drawVersion();
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
  mom: momState,                              // БОСС УРОВНЯ 2: мама
  drive: driveState,                          // ЭТАП «ЗА РУЛЁМ»: минивэн едет в офис
  levelSelect: levelSelectState,              // ВЫБОР УРОВНЯ (для тестов)
  error: errorState,                          // ОШИБКА в карте или в файлах
};
let state = null;

// Включить экран. arg — дополнительные данные (например, «продолжить с места последнего звонка»)
function setState(name, arg) {
  state = states[name];
  state.enter(arg);
  if (state !== states[name]) return;     // экран сам сразу включил другой (например, босс — сценку)
  // Кнопка «Бросок» видна в бою с боссом и на уровнях с оружием, кнопка паузы — на уровне и в бою.
  // Ставим после enter: при переходе на уровень 2 номер уровня меняется внутри enter
  document.body.classList.toggle('boss-fight', name === 'boss');
  document.body.classList.toggle('armed', (name === 'level' || name === 'mom') && weaponsOn());
  document.body.classList.toggle('playing', name === 'level' || name === 'boss' || name === 'mom' || name === 'drive');
  // За рулём: «Прыжок» — тормоз, вместо бросков — «Гудок»
  document.body.classList.toggle('driving', name === 'drive');
  if (jumpBtn) jumpBtn.textContent = name === 'drive' ? 'Тормоз' : 'Прыжок';
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
  const plovPressed = plovHit;                     // F или кнопка «Плов»
  plovHit = false;
  const input = {
    jumpPressed: jumpPressed,
    throwPressed: throwPressed,
    plovPressed: plovPressed,
    menuMove: menuMove,                             // стрелки вверх-вниз в меню
    confirm: confirmHit,                            // «Прыжок», Z, пробел, Enter — выбрать пункт
    taps: taps,                                     // касания экрана
    pressed: jumpPressed || taps.length > 0,        // любое «нажатие»
  };
  taps = [];
  menuMove = 0;
  confirmHit = false;

  // Пауза: ⏸, P или Esc
  if (pauseHit) {
    pauseHit = false;
    pauseControls = false;
    if (paused) paused = false;
    else if (canPause()) { paused = true; pauseMenu.index = 0; }
  }
  if (paused && !canPause()) paused = false;        // на всякий случай: пауза бывает только в игре
  if (paused) {
    updatePause(input);                             // на паузе игра не обновляется — стоит всё
    return;
  }

  state.update(input);
  updateWeaponButtons();
}

// Экранные кнопки «Ключ» и «Плов»: на них число оставшихся, кончилось — кнопка тусклая.
// Меняем надпись, только когда число изменилось (так быстрее)
const wrenchBtn = document.querySelector('.btn.wrench');
const plovBtn = document.querySelector('.btn.plov');
let shownAmmo = '';
function updateWeaponButtons() {
  if (!wrenchBtn || !plovBtn) return;
  const ammo = levelState.keys + '/' + levelState.plov;
  if (ammo === shownAmmo) return;
  shownAmmo = ammo;
  wrenchBtn.textContent = 'КЛЮЧ ' + levelState.keys;
  plovBtn.textContent = 'ПЛОВ ' + levelState.plov;
  wrenchBtn.classList.toggle('empty', levelState.keys === 0);
  plovBtn.classList.toggle('empty', levelState.plov === 0);
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
  if (paused) drawPause();
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
  // Проверяем все уровни (с конца), а собранным оставляем первый
  for (let li = LEVELS.length - 1; li >= 0; li--) {
    const before = LEVEL_ERRORS.length;
    buildLevel(LEVELS[li]);
    if (LEVELS.length > 1) {
      for (let k = before; k < LEVEL_ERRORS.length; k++) LEVEL_ERRORS[k] = 'УРОВЕНЬ ' + (li + 1) + ': ' + LEVEL_ERRORS[k];
    }
  }
  currentLevelIndex = 0;
  if (LEVEL_ERRORS.length === 0) level = levelParts[0];
}

if (LEVEL_ERRORS.length > 0) {
  errorState.messages = LEVEL_ERRORS;
  setState('error');
} else {
  setState('title');
}
requestAnimationFrame(loop);
