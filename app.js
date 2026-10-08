// Набросок «Ремонт под ключ, Казань и Москва». Без библиотек и без отправки данных на сервер:
// заявка собирается в текст и открывается в Telegram Тимура (t.me/xtumyp?text=...), токенов в коде нет.
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const TG = 'xtumyp';
  const RATE = 30000; // «от 30 000 ₽/м²» из профиля Тимура в Telegram
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const tgLink = text => `https://t.me/${TG}?text=${encodeURIComponent(text)}`;
  const rub = n => n.toLocaleString('ru-RU') + ' ₽';
  // Цели Яндекс Метрики: заработают сами, когда на боевом сайте появится счётчик (window.YM_ID)
  const goal = name => { try { if (window.ym && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', name); } catch (e) { /* без Метрики */ } };

  // Общие ссылки «Написать в Telegram»
  const HELLO = 'Здравствуйте, Тимур! Пишу с сайта, хочу обсудить ремонт.';
  $$('[data-tg]').forEach(a => {
    a.href = tgLink(HELLO);
    a.addEventListener('click', () => goal('tg_click'));
  });
  $$('a[href^="tel:"]').forEach(a => a.addEventListener('click', () => goal('phone_click')));

  // Слайдер «до и после». REST: где ползунок останавливается, чтобы «после» было видно чуть больше
  const REST = 38;
  function initBA(el) {
    const after = $('.ba-after', el), line = $('.ba-line', el), handle = $('.ba-handle', el);
    const tagDo = $('.ba-tag-do', el), tagPosle = $('.ba-tag-posle', el);
    let pos = REST, w = el.clientWidth, raf = 0, drag = false, touched = false;
    const set = p => {
      pos = Math.max(0, Math.min(100, p));
      after.style.clipPath = `inset(0 0 0 ${pos}%)`;
      line.style.transform = `translateX(${(pos / 100) * w}px)`;
      handle.setAttribute('aria-valuenow', String(Math.round(pos)));
      handle.setAttribute('aria-valuetext', `До ремонта ${Math.round(pos)}%, после ${100 - Math.round(pos)}%`);
      tagDo.classList.toggle('is-hidden', pos < 12);
      tagPosle.classList.toggle('is-hidden', pos > 88);
    };
    const stop = () => { touched = true; cancelAnimationFrame(raf); };
    const fromX = x => { const r = el.getBoundingClientRect(); return ((x - r.left) / r.width) * 100; };
    new ResizeObserver(() => { w = el.clientWidth; set(pos); }).observe(el);
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      stop(); drag = true; el.classList.add('is-drag'); set(fromX(e.clientX));
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* палец уже отпущен */ }
    });
    el.addEventListener('pointermove', e => { if (drag) set(fromX(e.clientX)); });
    const end = () => { if (!drag) return; drag = false; el.classList.remove('is-drag'); goal('ba_drag'); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    handle.addEventListener('keydown', e => {
      const step = e.shiftKey ? 10 : 4;
      const map = { ArrowLeft: pos - step, ArrowDown: pos - step, ArrowRight: pos + step, ArrowUp: pos + step, Home: 0, End: 100 };
      if (e.key in map) { e.preventDefault(); stop(); set(map[e.key]); }
    });
    set(pos);
    // Один раз при загрузке: «после» выезжает поверх «до», чтобы было понятно, что слайдер двигается
    const sweep = (from, to, dur) => {
      const t0 = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      const tick = now => {
        if (touched) return;
        const t = Math.min(1, (now - t0) / dur);
        set(from + (to - from) * ease(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      set(from); raf = requestAnimationFrame(tick);
    };
    return { set, sweep, isTouched: () => touched };
  }
  const hero = $('[data-ba][data-intro]');
  if (hero) {
    const ba = initBA(hero);
    if (!reduce) {
      ba.set(100);
      const imgs = $$('img', hero).map(i => (i.decode ? i.decode().catch(() => {}) : Promise.resolve()));
      Promise.all(imgs).then(() => setTimeout(() => { if (!ba.isTouched()) ba.sweep(100, REST, 1600); }, 350));
    }
  }

  // Шапка: тонкая линия после начала прокрутки
  const top = $('#top');
  const heroSec = $('.hero');
  if (top && heroSec && 'IntersectionObserver' in window) {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;height:8px;width:1px';
    heroSec.style.position = 'relative';
    heroSec.prepend(sentinel);
    new IntersectionObserver(([e]) => top.classList.toggle('is-scrolled', !e.isIntersecting)).observe(sentinel);
  }

  // Этапы: справа фото того шага, который сейчас посередине экрана
  const steps = $$('.step'), shots = $$('.shots img'), shotCap = $('#shot-cap');
  const CAPS = [
    'Картинка из поста о рабочем проекте, январь 2026',
    'Закупка на новый объект, апрель 2026',
    'Электрика на новом объекте, июнь 2026',
    'Штукатурка К1 и К2-3, сентябрь 2026',
    'Плитка в санузле, декабрь 2025',
    'Санузел перед сдачей, сентябрь 2025',
    'Однокомнатная в Казани, май 2026'
  ];
  const activate = i => {
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    shots.forEach((s, k) => s.classList.toggle('is-active', k === i));
    if (shotCap) shotCap.textContent = CAPS[i] || '';
  };
  if (steps.length && 'IntersectionObserver' in window) {
    activate(0);
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) activate(+en.target.dataset.i); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    steps.forEach(s => io.observe(s));
  }

  // Расчёт и сообщение Тимуру
  const form = $('#calc');
  if (!form) return;
  const areaR = $('#area-r'), areaN = $('#area-n'), areaBox = $('#area-box');
  const sumEl = $('#sum'), sumK = $('#sum-k'), noteEl = $('#sum-note'), msgEl = $('#msg'), send = $('#send');
  const resultEl = $('#result');
  const TYPES = { kvartira: 'квартира', studia: 'студия под аренду', dom: 'дом', sanuzel: 'только санузел', kommerc: 'коммерческое помещение' };
  let shown = 0, tween = 0;

  const fillRange = () => { const p = ((areaR.value - areaR.min) / (areaR.max - areaR.min)) * 100; areaR.style.setProperty('--p', p + '%'); };
  const animateSum = to => {
    cancelAnimationFrame(tween);
    if (reduce || !shown) { shown = to; sumEl.textContent = 'от ' + rub(to); return; }
    const from = shown, t0 = performance.now(), dur = 380;
    const tick = now => {
      const t = Math.min(1, (now - t0) / dur), v = Math.round((from + (to - from) * (1 - Math.pow(1 - t, 3))) / 1000) * 1000;
      sumEl.textContent = 'от ' + rub(t < 1 ? v : to);
      if (t < 1) tween = requestAnimationFrame(tick); else shown = to;
    };
    tween = requestAnimationFrame(tick);
  };

  const read = () => {
    const fd = new FormData(form);
    const clean = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
    return {
      type: fd.get('type'), city: fd.get('city'), cls: fd.get('cls'), when: fd.get('when'),
      area: Math.max(1, Math.min(400, parseInt(areaN.value, 10) || 0)),
      name: clean(fd.get('name'), 40), jk: clean(fd.get('jk'), 60), wish: String(fd.get('wish') || '').trim().slice(0, 400)
    };
  };

  const render = () => {
    const d = read();
    const san = d.type === 'sanuzel';
    areaBox.hidden = san;
    let price = 0;
    if (san) {
      cancelAnimationFrame(tween); shown = 0;
      sumK.textContent = 'Цена санузла';
      sumEl.textContent = 'по замеру';
      noteEl.textContent = 'Санузел считаем отдельно: всё зависит от плитки, сантехники и сложности формы.';
    } else {
      price = d.area * RATE;
      sumK.textContent = 'Ориентир по цене';
      animateSum(price);
      noteEl.textContent = d.cls === 'комфорт'
        ? `${d.area} м² по цене от 30 000 ₽ за м². Точную сумму Тимур назовёт после замера.`
        : `${d.area} м² по нижней цене 30 000 ₽ за м². Класс «${d.cls}» выйдет дороже, точную сумму Тимур назовёт после замера.`;
    }
    const lines = ['Здравствуйте, Тимур! Пишу с сайта, хочу рассчитать ремонт.'];
    lines.push(san ? 'Что: ремонт санузла' : `Что: ${TYPES[d.type]}, ${d.area} м²`);
    lines.push(`Где: ${d.city}${d.jk ? ', ' + d.jk : ''}`);
    lines.push(`Класс: ${d.cls}`);
    lines.push(`Когда начать: ${d.when}`);
    if (!san) lines.push(`Ориентир на сайте: от ${rub(price)}`);
    if (d.wish) lines.push(`Пожелания: ${d.wish}`);
    if (d.name) lines.push(`Меня зовут ${d.name}.`);
    const text = lines.join('\n');
    msgEl.textContent = text;
    send.href = tgLink(text);
    send.dataset.text = text;
  };

  areaR.addEventListener('input', () => { areaN.value = areaR.value; fillRange(); render(); });
  areaN.addEventListener('input', () => {
    const v = parseInt(areaN.value, 10);
    if (v >= +areaR.min) { areaR.value = Math.min(v, +areaR.max); fillRange(); }
    render();
  });
  areaN.addEventListener('blur', () => { const v = parseInt(areaN.value, 10); if (!(v >= 12)) { areaN.value = 12; areaR.value = 12; fillRange(); render(); } });
  form.addEventListener('input', e => { if (e.target !== areaR && e.target !== areaN) render(); });
  form.addEventListener('change', render);
  form.addEventListener('submit', e => e.preventDefault());

  const copyText = async text => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; }
  };
  send.addEventListener('click', () => { goal('form_send'); copyText(send.dataset.text || ''); });
  const copyBtn = $('#copy');
  copyBtn.addEventListener('click', async () => {
    const ok = await copyText(send.dataset.text || '');
    copyBtn.textContent = ok ? 'Текст скопирован' : 'Выделите текст выше и скопируйте';
    copyBtn.classList.toggle('copy-ok', ok);
    setTimeout(() => { copyBtn.textContent = 'Скопировать текст'; copyBtn.classList.remove('copy-ok'); }, 3500);
  });

  // Кнопки «Хочу так же» и «Рассчитать ремонт под аренду» подставляют объект в расчёт
  const setRadio = (name, value) => { const r = form.querySelector(`input[name="${name}"][value="${value}"]`); if (r) r.checked = true; };
  const goCalc = () => {
    $('#raschet').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    resultEl.classList.add('is-flash');
    setTimeout(() => resultEl.classList.remove('is-flash'), 1400);
  };
  $$('[data-want]').forEach(b => b.addEventListener('click', () => {
    setRadio('type', b.dataset.type || 'kvartira');
    if (b.dataset.city) setRadio('city', b.dataset.city);
    $('#f-wish').value = `Хочу так же. Понравился объект: ${b.dataset.want}.`;
    render(); goal('want_click'); goCalc();
  }));
  $$('[data-type-go]').forEach(a => a.addEventListener('click', e => {
    if (a.dataset.typeGo) setRadio('type', a.dataset.typeGo);
    render(); e.preventDefault(); goCalc();
  }));

  fillRange();
  render();

  // Нижняя панель на телефоне: видна после первого экрана, прячется у расчёта
  const mbar = $('#mbar');
  if (mbar && heroSec && 'IntersectionObserver' in window) {
    let heroIn = true, calcIn = false;
    const upd = () => {
      const on = !heroIn && !calcIn;
      mbar.classList.toggle('is-on', on);
      mbar.setAttribute('aria-hidden', String(!on));
      $$('a', mbar).forEach(a => a.tabIndex = on ? 0 : -1);
    };
    new IntersectionObserver(([e]) => { heroIn = e.isIntersecting; upd(); }, { threshold: 0.15 }).observe(heroSec);
    new IntersectionObserver(([e]) => { calcIn = e.isIntersecting; upd(); }).observe($('#raschet'));
  }
})();
