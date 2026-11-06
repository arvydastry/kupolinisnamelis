/* Kupolinis namelis – demo maketo JS (be priklausomybių; Lenis – neprivalomas, iš CDN) */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);

  /* ---------- tolygus slinkimas (Salient: Theme Options → Smooth Scrolling) ---------- */
  let lenis = null;
  function initLenis() {
    if (reduced || !window.Lenis) return;
    lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  window.addEventListener('load', initLenis);

  function scrollToEl(el, offset = -90) {
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: reduced ? 'auto' : 'smooth' });
  }

  // vidinės nuorodos (#…) – per Lenis
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    scrollToEl(target);
    history.replaceState(null, '', url.hash);
  });

  /* ---------- antraštė ---------- */
  const header = $('[data-header]');
  const hasHero = !!$('.hero, .page-hero');
  let lastY = window.scrollY;
  function onHeaderScroll() {
    const y = window.scrollY;
    const solid = !hasHero || y > 40;
    header.classList.toggle('is-solid', solid);
    if (!document.body.classList.contains('menu-open')) {
      header.classList.toggle('is-hidden', y > 320 && y > lastY + 2);
      if (y < lastY - 2) header.classList.remove('is-hidden');
    }
    lastY = y;
  }

  /* ---------- mobilus meniu ---------- */
  const burger = $('[data-burger]');
  const menu = $('[data-mobile-menu]');
  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('is-open'));
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Uždaryti meniu');
    document.body.classList.add('menu-open');
    header.classList.remove('is-hidden');
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Atidaryti meniu');
    document.body.classList.remove('menu-open');
    if (lenis) lenis.start();
    setTimeout(() => { menu.hidden = true; }, 400);
  }
  burger && burger.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- skaidomos antraštės (Salient: Split Line Heading) ---------- */
  $$('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach((w, i) => {
      const outer = document.createElement('span');
      outer.className = 'w';
      const inner = document.createElement('span');
      inner.className = 'wi';
      inner.style.setProperty('--i', i);
      inner.textContent = w;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    el.setAttribute('aria-label', words.join(' '));
  });

  /* ---------- atsiradimas slenkant ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      if (en.target.matches('[data-count-wrap]')) runCounters(en.target);
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal, .mask-reveal, .split, .g-item').forEach((el) => io.observe(el));

  // hero elementai – iškart
  requestAnimationFrame(() => $$('.hero .reveal, .hero .split, .page-hero .reveal, .page-hero .split').forEach((el) => el.classList.add('is-in')));

  /* ---------- skaitikliai (Salient: Milestone) ---------- */
  const stats = $('.stats');
  if (stats) { stats.setAttribute('data-count-wrap', ''); io.observe(stats); }
  function runCounters(root) {
    $$('[data-count]', root).forEach((el) => {
      const to = +el.dataset.count;
      if (reduced) { el.textContent = to; return; }
      const t0 = performance.now();
      const dur = 1600;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  }

  /* ---------- paralaksas ---------- */
  const px = $$('[data-parallax]');
  const pxBg = $$('[data-parallax-bg]');
  const pxWrap = $$('[data-parallax-wrap]');
  const heroMedia = $('.hero__media');
  function parallax() {
    if (reduced) return;
    const vh = window.innerHeight;
    const run = (el, speed, ref = el) => {
      const r = ref.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = (r.top + r.height / 2 - vh / 2) * speed;
      el.style.translate = `0 ${off.toFixed(1)}px`;
    };
    px.forEach((el) => run(el, +el.dataset.parallax, el.parentElement));
    pxWrap.forEach((el) => run(el, +el.dataset.parallaxWrap, el.parentElement));
    pxBg.forEach((el) => run(el, -0.12, el.parentElement));
    if (heroMedia && window.scrollY < vh * 1.2) heroMedia.style.translate = `0 ${(window.scrollY * 0.28).toFixed(1)}px`;
  }

  /* ---------- slinkimo ciklas ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onHeaderScroll();
      parallax();
      updateMobileBook();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- video ---------- */
  const heroVideo = $('[data-hero-video]');
  if (heroVideo && !reduced && !saveData) {
    heroVideo.src = window.innerWidth < 768 ? heroVideo.dataset.srcSmall : heroVideo.dataset.srcLarge;
    heroVideo.play().catch(() => {});
  }
  $$('[data-lazy-video]').forEach((v) => {
    if (reduced || saveData) return;
    const vio = new IntersectionObserver(([en]) => {
      if (en.isIntersecting) {
        const s = v.querySelector('source[data-src]');
        if (s) { s.src = s.dataset.src; s.removeAttribute('data-src'); v.load(); }
        v.play().catch(() => {});
      } else v.pause();
    }, { threshold: 0.25 });
    vio.observe(v);
  });

  /* ---------- patogumai: sąrašas + keičiamas paveikslas ---------- */
  const amenityFigure = $('[data-amenity-figure]');
  const amenities = $$('[data-amenities] .amenity');
  const desktop = () => window.matchMedia('(min-width: 961px)').matches;
  function setAmenity(li) {
    if (li.classList.contains('is-active')) return;
    amenities.forEach((a) => a.classList.toggle('is-active', a === li));
    if (!amenityFigure) return;
    const img = document.createElement('img');
    img.src = li.dataset.img;
    img.alt = '';
    img.className = 'is-entering';
    amenityFigure.appendChild(img);
    const show = () => requestAnimationFrame(() => requestAnimationFrame(() => img.classList.remove('is-entering')));
    img.complete ? show() : img.addEventListener('load', show, { once: true });
    setTimeout(() => {
      $$('img', amenityFigure).slice(0, -1).forEach((old) => old.remove());
    }, 1300);
  }
  amenities.forEach((li) => {
    const btn = $('.amenity__btn', li);
    btn.addEventListener('click', () => setAmenity(li));
    btn.addEventListener('mouseenter', () => desktop() && setAmenity(li));
    btn.addEventListener('focus', () => desktop() && setAmenity(li));
  });
  // paveikslų išankstinis įkėlimas
  window.addEventListener('load', () => amenities.forEach((li) => { const i = new Image(); i.src = li.dataset.img; }));

  /* ---------- galerija: filtras, „rodyti daugiau“, lightbox ---------- */
  const grid = $('[data-gallery]');
  const moreBtn = $('[data-gallery-more]');
  let galleryFilter = 'all';
  let showAll = false;
  function applyGallery() {
    if (!grid) return;
    $$('.g-item', grid).forEach((it) => {
      const match = galleryFilter === 'all' || it.dataset.cat === galleryFilter;
      const hide = !match || (galleryFilter === 'all' && !showAll && it.classList.contains('is-extra'));
      const wasHidden = it.hidden;
      it.hidden = hide;
      if (wasHidden && !hide) {
        it.classList.remove('is-in');
        requestAnimationFrame(() => requestAnimationFrame(() => it.classList.add('is-in')));
      }
    });
    if (moreBtn) moreBtn.parentElement.hidden = galleryFilter !== 'all' || showAll;
  }
  $$('[data-filters] button').forEach((b) => b.addEventListener('click', () => {
    $$('[data-filters] button').forEach((x) => x.classList.toggle('is-active', x === b));
    galleryFilter = b.dataset.filter;
    applyGallery();
  }));
  moreBtn && moreBtn.addEventListener('click', () => { showAll = true; applyGallery(); });
  applyGallery();

  const lb = $('[data-lightbox-root]');
  const lbImg = $('[data-lb-img]');
  const lbCap = $('[data-lb-caption]');
  let lbItems = [];
  let lbIndex = 0;
  function lbShow(i) {
    lbIndex = (i + lbItems.length) % lbItems.length;
    const a = lbItems[lbIndex];
    lbImg.src = a.getAttribute('href');
    lbImg.alt = a.dataset.caption || '';
    lbCap.textContent = `${a.dataset.caption || ''}  ·  ${lbIndex + 1} / ${lbItems.length}`;
  }
  function lbOpen(a) {
    lbItems = $$('[data-lightbox]').filter((x) => !x.closest('[hidden]'));
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    lbShow(lbItems.indexOf(a));
    if (lenis) lenis.stop();
    document.body.style.overflow = 'hidden';
    $('[data-lb-close]').focus();
  }
  function lbClose() {
    lb.classList.remove('is-open');
    if (lenis) lenis.start();
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; lbImg.removeAttribute('src'); }, 350);
  }
  if (lb) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-lightbox]');
      if (!a) return;
      e.preventDefault();
      lbOpen(a);
    });
    $('[data-lb-close]').addEventListener('click', lbClose);
    $('[data-lb-prev]').addEventListener('click', () => lbShow(lbIndex - 1));
    $('[data-lb-next]').addEventListener('click', () => lbShow(lbIndex + 1));
    lb.addEventListener('click', (e) => { if (e.target === lb) lbClose(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape') lbClose();
      if (e.key === 'ArrowLeft') lbShow(lbIndex - 1);
      if (e.key === 'ArrowRight') lbShow(lbIndex + 1);
    });
    let sx = null;
    lb.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    lb.addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 50) lbShow(lbIndex + (dx < 0 ? 1 : -1));
      sx = null;
    });
  }

  /* ---------- pramogų panelės ---------- */
  const panels = $$('[data-panels] .panel');
  panels.forEach((p) => {
    const label = document.createElement('span');
    label.className = 'panel__label';
    label.setAttribute('aria-hidden', 'true');
    label.textContent = $('h3', p).textContent;
    p.appendChild(label);
    const open = () => panels.forEach((x) => x.classList.toggle('is-open', x === p));
    p.addEventListener('mouseenter', () => window.matchMedia('(min-width: 900px)').matches && open());
    p.addEventListener('focus', open);
    p.addEventListener('click', open);
  });

  /* ---------- kainų skaičiuoklė ---------- */
  const booker = $('[data-booker]');
  const PRICE_WD = 100;
  const PRICE_WE = 140;
  const PRICE_EXTRA_GUEST = 15;
  // Lietuvos valstybinės šventės (2026–2027) – naktis, prasidedanti šią dieną, skaičiuojama 140 €
  const HOLIDAYS = new Set([
    '2026-01-01', '2026-02-16', '2026-03-11', '2026-04-05', '2026-04-06', '2026-05-01', '2026-05-03', '2026-06-07',
    '2026-06-24', '2026-07-06', '2026-08-15', '2026-11-01', '2026-11-02', '2026-12-24', '2026-12-25', '2026-12-26',
    '2027-01-01', '2027-02-16', '2027-03-11', '2027-03-28', '2027-03-29', '2027-05-01', '2027-05-02', '2027-06-06',
    '2027-06-24', '2027-07-06', '2027-08-15', '2027-11-01', '2027-11-02', '2027-12-24', '2027-12-25', '2027-12-26',
  ]);
  const MONTHS = ['sausis', 'vasaris', 'kovas', 'balandis', 'gegužė', 'birželis', 'liepa', 'rugpjūtis', 'rugsėjis', 'spalis', 'lapkritis', 'gruodis'];
  const MONTHS_GEN = ['sausio', 'vasario', 'kovo', 'balandžio', 'gegužės', 'birželio', 'liepos', 'rugpjūčio', 'rugsėjo', 'spalio', 'lapkričio', 'gruodžio'];
  const DOW = ['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Še', 'Sk'];
  const EXTRA_NAMES = { ofuro: 'Ofūro vonia', pirtis: 'Mobili pirtis, 2 val.', lankai: 'Šaudymas lanku, 1,5 val.', baidares: 'Baidarės' };

  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isPremium = (d) => d.getDay() === 5 || d.getDay() === 6 || HOLIDAYS.has(iso(d));
  const nightWord = (n) => {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return 'nakvynė';
    if (a >= 2 && a <= 9 && (b < 10 || b >= 20)) return 'nakvynės';
    return 'nakvynių';
  };
  const eur = (n) => `${n.toLocaleString('lt-LT')} €`;
  const fmtDay = (d) => `${MONTHS_GEN[d.getMonth()]} ${d.getDate()} d.`;

  if (booker) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxMonth = new Date(today.getFullYear(), today.getMonth() + 12, 1);
    const state = { view: new Date(minMonth), start: null, end: null, guests: 2 };
    const monthsEl = $('[data-cal-months]', booker);
    const prevBtn = $('[data-cal-prev]', booker);
    const nextBtn = $('[data-cal-next]', booker);
    const guestsOut = $('[data-guests]', booker);
    const rangeLabel = $('[data-range-label]', booker);
    const linesEl = $('[data-summary-lines]', booker);
    const totalEl = $('[data-total]', booker);
    const toForm = $('[data-to-form]', booker);
    const extras = $$('[data-extra]', booker);

    const monthCount = () => (booker.clientWidth >= 560 ? 2 : 1);

    function renderCal() {
      const n = monthCount();
      monthsEl.style.setProperty('--months', n);
      monthsEl.innerHTML = '';
      for (let m = 0; m < n; m++) {
        const first = new Date(state.view.getFullYear(), state.view.getMonth() + m, 1);
        const wrap = document.createElement('div');
        wrap.className = 'cal__month';
        wrap.innerHTML = `<h4>${MONTHS[first.getMonth()]} ${first.getFullYear()}</h4>`;
        const g = document.createElement('div');
        g.className = 'cal__grid';
        g.setAttribute('role', 'grid');
        DOW.forEach((d) => { g.insertAdjacentHTML('beforeend', `<span class="cal__dow">${d}</span>`); });
        const lead = (first.getDay() + 6) % 7;
        for (let i = 0; i < lead; i++) g.insertAdjacentHTML('beforeend', '<span></span>');
        const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
        for (let day = 1; day <= days; day++) {
          const d = new Date(first.getFullYear(), first.getMonth(), day);
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'cal__day';
          b.dataset.date = iso(d);
          const prem = isPremium(d);
          if (prem) b.classList.add('is-we');
          if (+d === +today) b.classList.add('is-today');
          if (d < today) b.disabled = true;
          const price = prem ? PRICE_WE : PRICE_WD;
          b.innerHTML = `<b>${day}</b><i>${price}</i>`;
          b.setAttribute('aria-label', `${fmtDay(d)}, nakvynė ${price} €${HOLIDAYS.has(iso(d)) ? ', šventinė diena' : ''}`);
          if (state.start && +d === +state.start) b.classList.add('is-start');
          if (state.end && +d === +state.end) b.classList.add('is-end');
          if (state.start && !state.end && +d === +state.start) b.classList.add('single');
          if (state.start && state.end && d > state.start && d < state.end) b.classList.add('in-range');
          g.appendChild(b);
        }
        wrap.appendChild(g);
        monthsEl.appendChild(wrap);
      }
      prevBtn.disabled = +state.view <= +minMonth;
      nextBtn.disabled = +state.view >= +maxMonth;
    }

    function calc() {
      const lines = [];
      let total = 0;
      let nights = 0, wd = 0, we = 0;
      if (state.start && state.end) {
        for (let d = new Date(state.start); d < state.end; d.setDate(d.getDate() + 1)) {
          nights++;
          if (isPremium(d)) we++; else wd++;
        }
        if (wd) { lines.push([`${wd} ${nightWord(wd)} darbo dienomis × ${PRICE_WD} €`, wd * PRICE_WD]); total += wd * PRICE_WD; }
        if (we) { lines.push([`${we} ${nightWord(we)} savaitgalį ar šventėmis × ${PRICE_WE} €`, we * PRICE_WE]); total += we * PRICE_WE; }
        const extraGuests = Math.max(0, state.guests - 2);
        if (extraGuests) {
          const sum = extraGuests * nights * PRICE_EXTRA_GUEST;
          lines.push([`Papildomi asmenys: ${extraGuests} × ${nights} n. × ${PRICE_EXTRA_GUEST} €`, sum]);
          total += sum;
        }
      }
      let from = false;
      extras.filter((x) => x.checked).forEach((x) => {
        const p = +x.dataset.price;
        if (x.hasAttribute('data-from')) from = true;
        lines.push([EXTRA_NAMES[x.value], p, x.hasAttribute('data-from')]);
        total += p;
      });
      return { lines, total, nights, from };
    }

    function update() {
      renderCal();
      guestsOut.textContent = state.guests;
      $('[data-step="-1"]', booker).disabled = state.guests <= 1;
      $('[data-step="1"]', booker).disabled = state.guests >= 4;
      const { lines, total, nights, from } = calc();
      if (state.start && state.end) rangeLabel.textContent = `${fmtDay(state.start)} – ${fmtDay(state.end)} · ${nights} ${nightWord(nights)}`;
      else if (state.start) rangeLabel.textContent = `Atvykimas ${fmtDay(state.start)} – pažymėkite išvykimo dieną`;
      else rangeLabel.textContent = 'Pažymėkite atvykimo ir išvykimo dienas';

      if (!lines.length) {
        linesEl.innerHTML = '<li class="summary__empty">Pasirinkus datas čia matysite kainos išklotinę.</li>';
      } else {
        linesEl.innerHTML = lines.map(([l, v, f]) => `<li><span>${l}</span><span>${f ? 'nuo ' : ''}${eur(v)}</span></li>`).join('');
        if (!nights) linesEl.insertAdjacentHTML('afterbegin', '<li class="summary__empty">Pasirinkite datas, kad pamatytumėte nakvynės kainą.</li>');
      }
      totalEl.textContent = nights ? `${from ? 'nuo ' : ''}${eur(total)}` : '–';
      toForm.disabled = !nights;
    }

    monthsEl.addEventListener('click', (e) => {
      const b = e.target.closest('.cal__day');
      if (!b || b.disabled) return;
      const [y, m, d] = b.dataset.date.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (!state.start || state.end) { state.start = date; state.end = null; }
      else if (date <= state.start) { state.start = date; }
      else { state.end = date; }
      update();
    });
    prevBtn.addEventListener('click', () => { state.view.setMonth(state.view.getMonth() - 1); update(); });
    nextBtn.addEventListener('click', () => { state.view.setMonth(state.view.getMonth() + 1); update(); });
    $$('[data-step]', booker).forEach((b) => b.addEventListener('click', () => {
      state.guests = Math.min(4, Math.max(1, state.guests + +b.dataset.step));
      update();
    }));
    extras.forEach((x) => x.addEventListener('change', update));
    let rw = booker.clientWidth;
    window.addEventListener('resize', () => { if (Math.abs(booker.clientWidth - rw) > 20) { rw = booker.clientWidth; renderCal(); } });

    // „Pridėti prie užklausos“ iš ofūro sekcijos
    $$('[data-add-extra]').forEach((b) => b.addEventListener('click', () => {
      const box = extras.find((x) => x.value === b.dataset.addExtra);
      if (box) { box.checked = true; update(); }
      scrollToEl($('#kainos'));
    }));

    // perkelti į kontaktų formą
    toForm.addEventListener('click', () => {
      const { lines, total, nights, from } = calc();
      const subj = $('[data-form-subject]');
      const msg = $('[data-form-message]');
      if (subj) subj.value = `Rezervacijos užklausa: ${fmtDay(state.start)} – ${fmtDay(state.end)}`;
      if (msg) {
        msg.value = [
          'Sveiki,',
          `norėtume apsistoti ${fmtDay(state.start)} – ${fmtDay(state.end)} (${nights} ${nightWord(nights)}), svečių: ${state.guests}.`,
          '',
          ...lines.map(([l, v, f]) => `• ${l}: ${f ? 'nuo ' : ''}${eur(v)}`),
          `Preliminari suma: ${from ? 'nuo ' : ''}${eur(total)}`,
          '',
          'Ar šios datos laisvos?',
        ].join('\n');
      }
      const form = $('[data-demo-form]');
      scrollToEl(form, -110);
      setTimeout(() => {
        form.classList.remove('is-flash'); void form.offsetWidth; form.classList.add('is-flash');
        const name = $('input[name="vardas"]', form);
        name && name.focus({ preventScroll: true });
      }, reduced ? 0 : 900);
    });

    update();
  }

  /* ---------- demo forma (nesiunčiama) ---------- */
  $$('[data-demo-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('input[required]', form).forEach((inp) => {
        const bad = !inp.value.trim() || (inp.type === 'email' && !/^\S+@\S+\.\S+$/.test(inp.value));
        inp.closest('.field').classList.toggle('is-invalid', bad);
        if (bad && ok) { inp.focus(); ok = false; }
      });
      if (!ok) return;
      $('[data-form-thanks]', form).hidden = false;
      form.reset();
    });
  });

  /* ---------- mobilioji rezervacijos juosta ---------- */
  const mobileBook = $('[data-mobile-book]');
  const hideZones = $$('#kainos, #kontaktai');
  function updateMobileBook() {
    if (!mobileBook) return;
    const vh = window.innerHeight;
    const past = window.scrollY > vh * 0.7;
    const inZone = hideZones.some((z) => { const r = z.getBoundingClientRect(); return r.top < vh * 0.9 && r.bottom > 0; });
    mobileBook.classList.toggle('is-visible', past && !inZone);
  }

  onScroll();
})();
