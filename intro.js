// =============================================
// ЗАСТАВКА В СТИЛЕ ОБЛОЖКИ GTA (до пиксельного титульного экрана)
// =============================================
// Обычный HTML-слой поверх игры: картинка art/intro.jpg в полном разрешении.
// 1) Чёрный экран «АВТОР ПРЕДСТАВЛЯЕТ» (2 секунды).
// 2) Картинка на весь экран, медленно приближается (эффект Кена Бёрнса), внизу слева — название,
//    внизу справа — советы и полоска «ЗАГРУЗКА...» (около 3,5 секунды).
// 3) «НАЖМИ, ЧТОБЫ НАЧАТЬ». Тап или любая клавиша (в любой момент) — затемнение и пиксельный титул.
// Тексты — INTRO_TEXT в scenes.js, имя автора — CREDITS_TEXT.author. Выключить — CONFIG.SHOW_INTRO = false.
// Пока заставка на экране, игра под ней не слушает кнопки (window.INTRO_ACTIVE).

(function () {
  if (!CONFIG.SHOW_INTRO) return;
  const T = INTRO_TEXT;
  const tag = VERSION.replace('v', '');
  window.INTRO_ACTIVE = true;

  // Собираем слой
  const box = document.createElement('div');
  box.id = 'intro';
  box.innerHTML =
    '<div id="intro-art"><img alt="" src="art/intro.jpg?v=' + tag + '"></div>' +
    '<div id="intro-presents"></div>' +
    '<div id="intro-title"><span class="l1"></span><span class="l2"></span></div>' +
    '<div id="intro-load"><div id="intro-tip"></div><div id="intro-bar-label"></div>' +
    '<div id="intro-bar"><div id="intro-bar-fill"></div></div><div id="intro-start"></div></div>';
  document.body.appendChild(box);
  box.querySelector('#intro-presents').textContent = CREDITS_TEXT.author + ' ' + T.presents;
  box.querySelector('.l1').textContent = T.title1;
  box.querySelector('.l2').textContent = T.title2;
  box.querySelector('#intro-bar-label').textContent = T.loading;
  box.querySelector('#intro-start').textContent = T.start;
  const tipEl = box.querySelector('#intro-tip');
  const fill = box.querySelector('#intro-bar-fill');

  const timers = [];
  const later = (sec, fn) => timers.push(setTimeout(fn, sec * 1000));

  // Советы: случайно, каждые 3 секунды, не повторяя тот же подряд
  let lastTip = -1;
  function nextTip() {
    let i;
    do i = Math.floor(Math.random() * T.tips.length); while (T.tips.length > 1 && i === lastTip);
    lastTip = i;
    tipEl.textContent = T.tips[i];
  }

  // Низкий синтезаторный удар при появлении названия (если звук уже разрешён)
  function boom() {
    if (typeof soundOn !== 'undefined' && !soundOn) return;
    if (typeof audioCtx === 'undefined' || !audioCtx || audioCtx.state !== 'running') return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(32, t + 0.6);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    const lp = audioCtx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    osc.connect(lp); lp.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 1.25);
  }

  // Сценарий заставки
  later(2, () => box.classList.add('art'));                       // после «ПРЕДСТАВЛЯЕТ» — картинка
  later(2.6, () => { box.classList.add('titled'); boom(); });     // название
  later(2, () => {                                                 // полоска «ЗАГРУЗКА...» и советы
    nextTip();
    timers.push(setInterval(nextTip, T.tipSeconds * 1000));
    const start = performance.now(), dur = T.loadSeconds * 1000;
    (function grow() {
      const k = Math.min(1, (performance.now() - start) / dur);
      fill.style.width = Math.round(k * 100) + '%';
      if (k < 1) requestAnimationFrame(grow);
      else box.classList.add('ready');                             // «НАЖМИ, ЧТОБЫ НАЧАТЬ»
    })();
  });

  // Тап или клавиша — в любой момент: затемнение и пиксельный титул. Это же касание включает звук
  let closing = false;
  function close(e) {
    if (e && e.cancelable && e.type !== 'keydown') e.preventDefault();
    if (closing) return;
    closing = true;
    if (typeof unlockAudio === 'function') unlockAudio();
    timers.forEach((id) => { clearTimeout(id); clearInterval(id); });
    box.classList.add('out');
    setTimeout(() => {
      box.remove();
      window.INTRO_ACTIVE = false;
    }, 650);
  }
  box.addEventListener('touchstart', close, { passive: false });
  box.addEventListener('mousedown', close);
  window.addEventListener('keydown', function onKey(e) {
    if (!window.INTRO_ACTIVE) { window.removeEventListener('keydown', onKey); return; }
    close(e);
  });
})();
