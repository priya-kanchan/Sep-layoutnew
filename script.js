(() => {
  const header = document.getElementById('header');
  const nav = document.getElementById('nav');
  const burger = document.getElementById('burger');

  /* ---------- Header background on scroll ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 20);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('menu-open', open);
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  window.addEventListener('resize', () => { if (window.innerWidth > 680) setMenu(false); });

  /* ---------- Active nav link while scrolling ---------- */
  const links = [...document.querySelectorAll('.nav__link')];
  const sections = links
    .map((l) => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => spy.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealer = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach((el) => revealer.observe(el));

  /* ---------- Count-up stats ---------- */
  const countUp = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const statObs = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(countUp);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  const stats = document.querySelector('.stats');
  if (stats) statObs.observe(stats);

  /* ---------- Testimonial slider ---------- */
  const slides = [...document.querySelectorAll('.slide')];
  const dotsWrap = document.getElementById('dots');
  let current = 0;
  let timer;

  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Testimonial ${i + 1}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });

  const go = (i) => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, idx) => s.classList.toggle('is-active', idx === current));
    dots.forEach((d, idx) => {
      d.classList.toggle('is-active', idx === current);
      d.setAttribute('aria-selected', String(idx === current));
    });
  };
  const restart = () => {
    clearInterval(timer);
    timer = setInterval(() => go(current + 1), 6000);
  };
  go(0);
  restart();

  // swipe support
  const slider = document.getElementById('slider');
  let startX = null;
  slider.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  slider.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); restart(); }
    startX = null;
  });

  /* ---------- Gallery coverflow ---------- */
  (() => {
    const root = document.getElementById('coverflow');
    if (!root) return;
    const cards = [...root.querySelectorAll('.coverflow__slide')];
    const head = document.querySelector('.gallery__head');
    const titleEl = document.getElementById('galleryTitle');
    const captionEl = document.getElementById('galleryCaption');
    const n = cards.length;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let active = cards.findIndex((c) => c.dataset.title === titleEl.textContent.trim());
    if (active < 0) active = 0;
    let drag = 0;          // current drag distance in slides (fractional)
    let autoplay;

    // shortest signed distance from the active slide, so the carousel loops
    const offsetOf = (i) => {
      let off = i - active - drag;
      off = ((off % n) + n) % n;
      if (off > n / 2) off -= n;
      return off;
    };

    const layout = () => {
      const w = cards[0].offsetWidth;
      const mobile = window.innerWidth <= 680;
      const step = w * (mobile ? 0.62 : 0.9);
      const maxVisible = mobile ? 1.6 : 2.6;

      cards.forEach((card, i) => {
        const off = offsetOf(i);
        const abs = Math.abs(off);
        const clamped = Math.max(-1, Math.min(1, off));
        // spacing tightens further out, like a coverflow
        const x = Math.sign(off) * (Math.min(abs, 1) * step + Math.max(abs - 1, 0) * step * 0.85);
        const z = -Math.min(abs, 3) * (mobile ? 90 : 120);
        const y = -Math.min(abs, 1) * w * 0.07 + Math.max(abs - 1, 0) * w * 0.02;
        const rotY = -clamped * 32;
        const scale = 1 - Math.min(abs, 3) * 0.05;

        card.style.transform = `translate3d(${x}px, ${y}px, ${z}px) rotateY(${rotY}deg) scale(${scale})`;
        card.style.zIndex = String(100 - Math.round(abs * 10));
        card.style.opacity = abs > maxVisible ? '0' : '1';
        card.style.pointerEvents = abs > maxVisible ? 'none' : '';
        card.classList.toggle('is-active', abs < 0.5);
        card.setAttribute('aria-hidden', String(abs >= 0.5));
      });
    };

    const updateText = () => {
      const { title, caption } = cards[active].dataset;
      if (titleEl.textContent === title) return;
      head.classList.add('is-changing');
      setTimeout(() => {
        titleEl.textContent = title;
        captionEl.textContent = caption;
        head.classList.remove('is-changing');
      }, 250);
    };

    const goTo = (i) => {
      active = ((i % n) + n) % n;
      drag = 0;
      layout();
      updateText();
    };
    const next = () => goTo(active + 1);
    const prev = () => goTo(active - 1);

    const stopAuto = () => clearInterval(autoplay);
    const startAuto = () => {
      stopAuto();
      if (!reduceMotion) autoplay = setInterval(next, 4500);
    };

    document.getElementById('cfNext').addEventListener('click', () => { next(); startAuto(); });
    document.getElementById('cfPrev').addEventListener('click', () => { prev(); startAuto(); });

    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { next(); startAuto(); }
      if (e.key === 'ArrowLeft') { prev(); startAuto(); }
    });

    // click a side card to bring it to the centre
    let moved = false;
    cards.forEach((card, i) => card.addEventListener('click', () => {
      if (moved || i === active) return;
      goTo(i);
      startAuto();
    }));

    // drag / swipe (mouse + touch via pointer events)
    let startX = 0;
    let dragging = false;
    root.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      stopAuto();
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        root.classList.add('is-dragging');
      }
      if (!moved) return;
      const step = cards[0].offsetWidth * (window.innerWidth <= 680 ? 0.62 : 0.9);
      drag = -dx / step;
      layout();
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      if (moved) {
        // snap to nearest; a short flick still advances one slide
        const target = Math.abs(drag) > 0.15 && Math.abs(drag) < 0.5 ? Math.sign(drag) : Math.round(drag);
        goTo(active + target);
      }
      startAuto();
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    root.addEventListener('mouseenter', stopAuto);
    root.addEventListener('mouseleave', () => { if (!dragging) startAuto(); });
    window.addEventListener('resize', layout);

    // pause autoplay while the gallery is off-screen
    new IntersectionObserver(([entry]) => (entry.isIntersecting ? startAuto() : stopAuto()))
      .observe(root);

    layout();
  })();

  /* ---------- Enquiry modal form ---------- */
  const enquiry = (() => {
    const modal = document.getElementById('enquiry');
    const form = document.getElementById('enquiryForm');
    const success = document.getElementById('enquirySuccess');
    const titleEl = document.getElementById('enquiryTitle');
    const sourceEl = document.getElementById('enquirySource');
    const submitBtn = form.querySelector('.enquiry__submit');
    const submitLabel = form.querySelector('.enquiry__submit-label');
    const DEFAULT_TITLE = 'Book A Site Visit';
    let lastFocus = null;

    const focusables = () => [...modal.querySelectorAll(
      'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter((el) => !el.disabled && el.offsetParent !== null);

    const resetForm = () => {
      form.reset();
      form.hidden = false;
      success.hidden = true;
      form.querySelectorAll('.has-error').forEach((f) => f.classList.remove('has-error'));
      form.querySelectorAll('.field__error').forEach((e) => { e.textContent = ''; });
      submitBtn.disabled = false;
      submitLabel.textContent = 'Submit Enquiry';
    };

    const open = (title) => {
      resetForm();
      const heading = title || DEFAULT_TITLE;
      titleEl.textContent = heading;
      sourceEl.value = heading;
      modal.querySelector('.enquiry__body').scrollTop = 0;
      lastFocus = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      setTimeout(() => form.querySelector('#enqName').focus(), 350);
    };

    const close = () => {
      if (!modal.classList.contains('is-open')) return;
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
      if (lastFocus) lastFocus.focus();
    };

    // every CTA tagged with data-enquiry opens the form
    document.querySelectorAll('[data-enquiry]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        open(btn.dataset.enquiry);
      });
    });
    modal.querySelectorAll('[data-enquiry-close]').forEach((el) => el.addEventListener('click', close));

    // keep keyboard focus inside the dialog
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // validation
    const rules = {
      enqName: (v) => (v.trim().length < 2 ? 'Please enter your full name.' : ''),
      enqPhone: (v) => (!/^[6-9]\d{9}$/.test(v) ? 'Enter a valid 10-digit mobile number.' : ''),
      enqEmail: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Enter a valid email address.' : ''),
    };
    const validateField = (input) => {
      const msg = rules[input.id](input.value);
      const field = input.closest('.field');
      field.classList.toggle('has-error', !!msg);
      field.querySelector('.field__error').textContent = msg;
      return !msg;
    };
    const phone = form.querySelector('#enqPhone');
    phone.addEventListener('input', () => { phone.value = phone.value.replace(/\D/g, '').slice(0, 10); });
    Object.keys(rules).forEach((id) => {
      const input = form.querySelector('#' + id);
      input.addEventListener('blur', () => { if (input.value) validateField(input); });
      input.addEventListener('input', () => { if (input.closest('.has-error')) validateField(input); });
    });
    const message = form.querySelector('#enqMessage');
    const messageCount = document.getElementById('enqMessageCount');
    const updateCount = () => { messageCount.textContent = `${message.value.length} / ${message.maxLength}`; };
    message.addEventListener('input', updateCount);
    form.addEventListener('reset', () => setTimeout(updateCount));

    const consent = form.querySelector('#enqConsent');
    const consentError = document.getElementById('consentError');
    consent.addEventListener('change', () => { if (consent.checked) consentError.textContent = ''; });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputs = Object.keys(rules).map((id) => form.querySelector('#' + id));
      const valid = inputs.map(validateField);
      consentError.textContent = consent.checked ? '' : 'Please accept to continue.';
      const firstInvalid = inputs[valid.indexOf(false)];
      if (firstInvalid) { firstInvalid.focus(); return; }
      if (!consent.checked) { consent.focus(); return; }

      const data = Object.fromEntries(new FormData(form));
      submitBtn.disabled = true;
      submitLabel.textContent = 'Submitting...';

      // TODO: replace with a real request to your CRM / backend, e.g.
      // fetch('/api/enquiry', { method: 'POST', body: JSON.stringify(data) })
      setTimeout(() => {
        document.getElementById('successName').textContent = ', ' + data.name.trim().split(' ')[0];
        document.getElementById('successSource').textContent = data.source;
        form.hidden = true;
        success.hidden = false;
        success.querySelector('button').focus();
      }, 900);
    });

    return { close };
  })();

  /* ---------- Video modal ---------- */
  const modal = document.getElementById('modal');
  const frame = document.getElementById('modalFrame');
  const openModal = () => {
    frame.innerHTML = '<iframe src="https://www.youtube.com/embed/ScMzIvxBSi4?autoplay=1&rel=0" title="Project film" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    frame.innerHTML = '';
  };
  document.getElementById('playBtn').addEventListener('click', openModal);
  modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    closeModal();
    enquiry.close();
    setMenu(false);
  });

  /* ---------- Price list arrows (mobile swipe cards) ---------- */
  const cardsTrack = document.getElementById('cards');
  const cardsPrev = document.getElementById('cardsPrev');
  const cardsNext = document.getElementById('cardsNext');
  const cardStep = () => {
    const [first, second] = cardsTrack.children;
    return second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
  };
  const updateCardsNav = () => {
    const max = cardsTrack.scrollWidth - cardsTrack.clientWidth;
    cardsPrev.disabled = cardsTrack.scrollLeft <= 4;
    cardsNext.disabled = cardsTrack.scrollLeft >= max - 4;
  };
  cardsPrev.addEventListener('click', () => cardsTrack.scrollBy({ left: -cardStep(), behavior: 'smooth' }));
  cardsNext.addEventListener('click', () => cardsTrack.scrollBy({ left: cardStep(), behavior: 'smooth' }));
  cardsTrack.addEventListener('scroll', updateCardsNav, { passive: true });
  window.addEventListener('resize', updateCardsNav);
  updateCardsNav();

  /* ---------- Disclaimer read more / less ---------- */
  const readMore = document.getElementById('readMore');
  const more = document.getElementById('disclaimerMore');
  const dotsEl = document.getElementById('disclaimerDots');
  readMore.addEventListener('click', () => {
    const expanded = readMore.getAttribute('aria-expanded') === 'true';
    more.hidden = expanded;
    dotsEl.hidden = !expanded;
    readMore.setAttribute('aria-expanded', String(!expanded));
    readMore.textContent = expanded ? 'Read more' : 'Read less';
  });

  /* ---------- Year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
