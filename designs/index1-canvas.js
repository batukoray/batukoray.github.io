import { getContent, currentLanguage, saveLanguage, languageButtons, notesViewerMarkup, setupNotes, updatedLabel, setupLastUpdated, e } from './content.js';
import { fitMap, projectRect, scrollForMapPoint } from './map-geometry.js';

const app = document.querySelector('#app');
const siteRoot = new URL('../', import.meta.url).href;
const destinations = new Set(['photos', 'track', 'notes', 'research', 'top', 'projects', 'numbers', 'education', 'contact']);
let currentRegion = destinations.has(location.hash.slice(1)) ? location.hash.slice(1) : 'top';
let viewport;
let scrollFrame = 0;
let spaceHeld = false;
let drag = null;
let glideFrame = 0;
let travelFrame = 0;
let ignoreMapClickUntil = 0;
let mapScale = 0;
let mapResizeObserver;
let regionBounds = [];

function motionAllowed() { return !matchMedia('(prefers-reduced-motion: reduce)').matches; }

function stopGlide() {
  if (glideFrame) cancelAnimationFrame(glideFrame);
  glideFrame = 0;
}

function stopTravel() {
  if (travelFrame) cancelAnimationFrame(travelFrame);
  travelFrame = 0;
}

function travelTo(surface, left, top) {
  const startX = surface.scrollLeft;
  const startY = surface.scrollTop;
  const distance = Math.hypot(left - startX, top - startY);
  if (distance < 1) return;
  const duration = Math.min(1200, Math.max(500, distance * .48));
  const started = performance.now();
  const step = (now) => {
    const progress = Math.min(1, (now - started) / duration);
    const eased = 1 - (1 - progress) ** 3;
    surface.scrollTo({
      left: startX + (left - startX) * eased,
      top: startY + (top - startY) * eased,
      behavior: 'auto'
    });
    travelFrame = progress < 1 ? requestAnimationFrame(step) : 0;
  };
  travelFrame = requestAnimationFrame(step);
}

function coast(surface, vx, vy) {
  if (!motionAllowed() || Math.hypot(vx, vy) < .08) return;
  let lastTime = performance.now();
  const step = (now) => {
    const dt = Math.min(32, Math.max(1, now - lastTime));
    lastTime = now;
    const decay = Math.exp(-dt / 230);
    vx *= decay;
    vy *= decay;
    const beforeX = surface.scrollLeft;
    const beforeY = surface.scrollTop;
    surface.scrollLeft += vx * dt;
    surface.scrollTop += vy * dt;
    if (surface.scrollLeft === beforeX) vx = 0;
    if (surface.scrollTop === beforeY) vy = 0;
    glideFrame = Math.hypot(vx, vy) > .025 ? requestAnimationFrame(step) : 0;
  };
  glideFrame = requestAnimationFrame(step);
}

function mapMarkup(c) {
  const photosLabel = { en: 'Photos', tr: 'Fotoğraflar', zh: '照片' }[c.language];
  const nodes = [
    ['photos', photosLabel], ['track', c.nav[0].label], ['notes', c.nav[5].label],
    ['research', c.nav[2].label], ['top', c.name], ['projects', c.nav[3].label],
    ['numbers', c.nav[1].label], ['education', c.nav[4].label], ['contact', c.nav[6].label]
  ];
  return `<nav class="map" aria-label="Page map"><div class="map-grid"><span class="map-camera" aria-hidden="true"></span>${nodes.map(([id, label]) => `<a class="map-node" data-go="${id}" href="#${id}" aria-label="${e(label)}" title="${e(label)}"><span></span></a>`).join('')}</div></nav>`;
}

function render() {
  stopGlide();
  stopTravel();
  mapResizeObserver?.disconnect();
  drag = null;
  const c = getContent(currentLanguage());
  const photosLabel = { en: 'Photos', tr: 'Fotoğraflar', zh: '照片' }[c.language];
  document.documentElement.lang = c.locale;
  document.title = c.name;
  document.querySelector('meta[name="description"]').content = c.t('meta.description');
  document.querySelector('.skip-link').textContent = c.t('a11y.skipToContent');

  app.innerHTML = `
    <header class="site-header">
      ${languageButtons(c.language)}
      <button type="button" class="menu-toggle" data-menu-toggle aria-label="Open navigation" aria-controls="page-navigation" aria-expanded="false"><span></span><span></span></button>
      <nav class="primary-nav" id="page-navigation" data-nav aria-label="Primary navigation">${c.nav.map((item) => `<a data-go="${item.id}" href="#${item.id}">${e(item.label)}</a>`).join('')}</nav>
    </header>

    <main id="main" class="canvas-viewport" tabindex="0" aria-label="Scrollable portfolio">
      <div class="world">
        <section class="region photos-region" id="photos" aria-labelledby="photos-heading">
          <h2 id="photos-heading" class="sr-only">${e(photosLabel)}</h2>
          <figure class="photo-teaching"><img src="${siteRoot}images/batu-teaching-eulers-identity.webp" width="1390" height="1392" loading="lazy" decoding="async" alt="${e(c.t('portrait.teaching.alt'))}"><figcaption>${e(c.t('portrait.teaching.description'))}</figcaption></figure>
          <figure class="photo-greece"><img src="${siteRoot}images/batu-with-cat-greece.webp" width="1280" height="1280" loading="lazy" decoding="async" alt="${e(c.t('portrait.greeceCat.alt'))}"><figcaption>${e(c.t('portrait.greeceCat.description'))}</figcaption></figure>
        </section>

        <section class="region track-region" id="track" aria-labelledby="track-heading">
          <div class="region-head"><h2 id="track-heading">${e(c.track.heading)}</h2><p>${e(c.track.subheading)}</p></div>
          <div class="track-entries">${c.track.roles.map((role) => `<article class="track-entry"><time>${e(role.dates)}</time><h3>${e(role.title)}</h3><p>${role.body}</p></article>`).join('')}</div>
        </section>

        <section class="region notes-region" id="notes" aria-labelledby="notes-heading">
          <div class="region-head"><h2 id="notes-heading">${e(c.notes.heading)}</h2><p>${e(c.notes.subheading)}</p><a href="https://github.com/batukoray/batu-academia/tree/main" target="_blank" rel="noopener">${e(c.notes.repo)}</a></div>
          ${notesViewerMarkup(c.notes)}
        </section>

        <section class="region research-region" id="research" aria-labelledby="research-heading">
          <div class="region-head"><h2 id="research-heading">${e(c.focus.heading)}</h2><p>${e(c.focus.subheading)}</p></div>
          <div class="focus-items">${c.focus.items.map((item) => `<article><h3>${e(item.title)}</h3><p>${e(item.body)}</p></article>`).join('')}</div>
        </section>

        <section class="region home-region" id="top" aria-labelledby="home-heading">
          <div class="edge-links" aria-label="Nearby sections"><a data-go="track" href="#track">↑ ${e(c.track.heading)}</a><a data-go="research" href="#research">← ${e(c.focus.heading)}</a><a data-go="projects" href="#projects">${e(c.work.heading)} →</a><a data-go="education" href="#education">↓ ${e(c.education.heading)}</a></div>
          <div class="home-main"><div class="home-copy"><h1 id="home-heading"><span>Batu Koray</span><span>Masak</span></h1><p class="updated" data-last-updated>${e(updatedLabel(c))}</p><p>${c.hero.intro}</p><p>${e(c.hero.current)}</p><div class="home-actions"><a href="https://github.com/batukoray" target="_blank" rel="noopener">${e(c.hero.github)} ↗</a><a href="${siteRoot}personal/">${e(c.hero.personal)} ↗</a></div></div><figure class="home-portrait"><img src="${siteRoot}images/batu-library-picture.webp" width="1440" height="1440" fetchpriority="high" decoding="async" alt="${e(c.t('portrait.library.alt'))}"><figcaption>${e(c.t('portrait.library.description'))}</figcaption></figure></div>
          <div class="home-lab"><a href="https://mysite.ku.edu.tr/emregursoy/spade-lab/" target="_blank" rel="noopener">${e(c.hero.lab)} ↗</a><span>${e(c.hero.role)}</span><a href="https://www.ku.edu.tr/en/" target="_blank" rel="noopener"><img src="https://upload.wikimedia.org/wikipedia/en/thumb/2/24/Ko%C3%A7_University_logo.svg/3840px-Ko%C3%A7_University_logo.svg.png" loading="lazy" decoding="async" alt="${e(c.hero.labLogoAlt)}"></a></div>
        </section>

        <section class="region work-region" id="projects" aria-labelledby="work-heading">
          <div class="region-head"><h2 id="work-heading">${e(c.work.heading)}</h2></div>
          <div class="work-list">${c.work.items.map((item, index) => `<details class="work-item" ${index === 0 ? 'open' : ''}><summary><span class="work-tag">${e(item.tag)}</span><strong>${e(item.title)}</strong><span class="work-plus" aria-hidden="true">+</span></summary><div class="work-body"><p>${item.body}</p>${item.status ? `<span>${e(item.status)}</span>` : ''}${item.href ? `<a href="${item.href}" target="_blank" rel="noopener">${e(item.title)} ↗</a>` : ''}</div></details>`).join('')}</div>
        </section>

        <section class="region standing-region" id="numbers" aria-labelledby="standing-heading">
          <div class="region-head"><h2 id="standing-heading">${e(c.standing.heading)}</h2><p>${e(c.standing.subheading)}</p></div>
          <div class="standing-list">${c.standing.metrics.map((metric) => `<article><strong>${e(metric.number)}</strong><div><span>${e(metric.label)}</span><h3>${e(metric.caption)}</h3><p>${e(metric.body)}</p></div></article>`).join('')}</div>
        </section>

        <section class="region education-region" id="education" aria-labelledby="education-heading">
          <div class="region-head"><h2 id="education-heading">${e(c.education.heading)}</h2><p>${e(c.education.subheading)}</p></div>
          <article class="education-main"><time>${e(c.education.university.dates)}</time><h3>${e(c.education.university.degree)}</h3><p class="school"><img src="https://github.com/batukoray/assets_of_mine/blob/main/ozyegin_logo.png?raw=true" loading="lazy" alt="${e(c.education.university.logoAlt)}"><a href="https://www.ozyegin.edu.tr/en" target="_blank" rel="noopener">${e(c.education.university.school)}</a></p><div class="education-facts">${c.education.university.facts.map((fact) => `<p><strong>${e(fact.label)}</strong><span>${e(fact.value)}</span></p>`).join('')}</div><div class="education-details">${c.education.university.details.map((detail) => `<article><span>${e(detail.issuer)}</span><h4>${e(detail.title)}</h4><p>${e(detail.body)}</p></article>`).join('')}</div></article>
          <article class="education-main"><time>${e(c.education.highschool.dates)}</time><h3>${e(c.education.highschool.degree)}</h3><p class="school"><img src="https://www.eyuboglu.k12.tr/images/eyuboglu.webp" loading="lazy" alt="${e(c.education.highschool.logoAlt)}"><a href="https://www.eyuboglu.k12.tr/en" target="_blank" rel="noopener">${e(c.education.highschool.school)}</a></p><div class="education-details"><article><span>${e(c.education.highschool.frc.date)}</span><h4>${e(c.education.highschool.frc.title)}</h4><p>${e(c.education.highschool.frc.body)}</p><a href="https://www.instagram.com/frc_wildfire_8151/" target="_blank" rel="noopener">${e(c.education.highschool.frc.link)}</a></article><article><h4>${e(c.education.highschool.coursework.title)}</h4><p>${e(c.education.highschool.coursework.body)}</p></article></div></article>
        </section>

        <footer class="region contact-region" id="contact"><h2>${e(c.contact.heading)}</h2><p>${e(c.contact.body)}</p><div class="contact-links"><a href="mailto:batu.masak@ozu.edu.tr">batu.masak [at] ozu.edu.tr ↗</a><a href="mailto:batukoraymasak@gmail.com">batukoraymasak [at] gmail.com ↗</a><a href="https://github.com/batukoray" target="_blank" rel="noopener">GitHub ↗</a><a href="https://www.linkedin.com/in/batu-koray-masak/" target="_blank" rel="noopener">LinkedIn ↗</a></div><div class="contact-topics">${c.contact.threads.map((thread) => `<span>${e(thread)}</span>`).join('')}</div><small>${e(c.contact.note)}</small></footer>
      </div>
    </main>
    ${mapMarkup(c)}`;

  // Keep reading and tab order logical; desktop placement is controlled by the grid.
  const world = app.querySelector('.world');
  ['top', 'track', 'research', 'projects', 'numbers', 'notes', 'education', 'photos', 'contact']
    .forEach((id) => world.append(document.getElementById(id)));

  viewport = document.querySelector('.canvas-viewport');
  setupNotes();
  setupViewport();
  requestAnimationFrame(() => navigate(currentRegion, false, false));
}

function isSpatial() { return matchMedia('(min-width: 781px)').matches; }

function markCurrent(id) {
  document.querySelectorAll('.map-node, .primary-nav a').forEach((node) => {
    if (node.dataset.go === id) node.setAttribute('aria-current', 'location');
    else node.removeAttribute('aria-current');
  });
}

function closeMenu() {
  document.querySelector('[data-nav]')?.classList.remove('is-open');
  document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false');
}

function navigate(id, smooth = true, updateHistory = true) {
  if (!destinations.has(id)) return;
  const section = document.getElementById(id);
  if (!section || !viewport) return;
  stopGlide();
  stopTravel();
  currentRegion = id;
  const behavior = smooth && motionAllowed() ? 'smooth' : 'auto';
  if (isSpatial()) {
    const left = section.offsetLeft + section.offsetWidth / 2 - viewport.clientWidth / 2;
    const top = section.offsetTop + Math.min(section.offsetHeight, viewport.clientHeight) / 2 - viewport.clientHeight / 2;
    if (behavior === 'smooth') travelTo(viewport, left, top);
    else viewport.scrollTo({ left, top, behavior: 'auto' });
    updateCamera();
  } else {
    section.scrollIntoView({ behavior, block: 'start' });
  }
  markCurrent(id);
  if (updateHistory) history.replaceState(null, '', `#${id}`);
}

function updateCamera() {
  const camera = document.querySelector('.map-camera');
  if (!camera || !viewport || !mapScale || !isSpatial()) return;
  const frame = projectRect({
    left: viewport.scrollLeft,
    top: viewport.scrollTop,
    width: viewport.clientWidth,
    height: viewport.clientHeight
  }, mapScale);
  const width = `${frame.width}px`;
  const height = `${frame.height}px`;
  if (camera.style.width !== width) camera.style.width = width;
  if (camera.style.height !== height) camera.style.height = height;
  camera.style.transform = `translate3d(${frame.left}px, ${frame.top}px, 0)`;
}

function updateMapLayout() {
  if (!viewport || !isSpatial()) return;
  const grid = document.querySelector('.map-grid');
  if (!grid) return;
  const worldWidth = viewport.scrollWidth;
  const worldHeight = viewport.scrollHeight;
  const fitted = fitMap(worldWidth, worldHeight);
  if (!fitted.scale) return;
  mapScale = fitted.scale;
  grid.style.width = `${fitted.width}px`;
  grid.style.height = `${fitted.height}px`;
  regionBounds = [...destinations].flatMap((id) => {
    const region = document.getElementById(id);
    return region ? [{
      id,
      left: region.offsetLeft,
      top: region.offsetTop,
      width: region.offsetWidth,
      height: region.offsetHeight
    }] : [];
  });
  const boundsById = new Map(regionBounds.map((bounds) => [bounds.id, bounds]));
  grid.querySelectorAll('.map-node').forEach((node) => {
    const bounds = boundsById.get(node.dataset.go);
    if (!bounds) return;
    const rect = projectRect(bounds, mapScale);
    node.style.left = `${rect.left}px`;
    node.style.top = `${rect.top}px`;
    node.style.width = `${rect.width}px`;
    node.style.height = `${rect.height}px`;
  });
  updateCamera();
}

function updateNearest() {
  scrollFrame = 0;
  updateCamera();
  if (!isSpatial() || !viewport || travelFrame) return;
  const centerX = viewport.scrollLeft + viewport.clientWidth / 2;
  const centerY = viewport.scrollTop + viewport.clientHeight / 2;
  let best = currentRegion;
  let distance = Infinity;
  for (const region of regionBounds) {
    const dx = Math.max(region.left - centerX, 0, centerX - region.left - region.width);
    const dy = Math.max(region.top - centerY, 0, centerY - region.top - region.height);
    const score = dx * dx + dy * dy;
    if (score < distance) { distance = score; best = region.id; }
  }
  if (best !== currentRegion) {
    currentRegion = best;
    markCurrent(best);
  }
}

function setupViewport() {
  const grid = document.querySelector('.map-grid');
  const world = viewport.querySelector('.world');
  let mapDrag = null;
  const panFromMap = (event) => {
    const rect = grid.getBoundingClientRect();
    const target = scrollForMapPoint(
      { x: event.clientX - rect.left, y: event.clientY - rect.top },
      { x: mapDrag.offsetX, y: mapDrag.offsetY },
      mapScale,
      { width: viewport.scrollWidth, height: viewport.scrollHeight },
      { width: viewport.clientWidth, height: viewport.clientHeight }
    );
    viewport.scrollTo({
      left: target.left,
      top: target.top,
      behavior: 'auto'
    });
  };
  grid.addEventListener('pointerdown', (event) => {
    if (!isSpatial() || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const camera = grid.querySelector('.map-camera').getBoundingClientRect();
    const insideCamera = event.clientX >= camera.left && event.clientX <= camera.right && event.clientY >= camera.top && event.clientY <= camera.bottom;
    mapDrag = {
      id: event.pointerId, x: event.clientX, y: event.clientY, moved: false,
      offsetX: insideCamera ? event.clientX - (camera.left + camera.width / 2) : 0,
      offsetY: insideCamera ? event.clientY - (camera.top + camera.height / 2) : 0
    };
  });
  grid.addEventListener('pointermove', (event) => {
    if (!mapDrag || event.pointerId !== mapDrag.id) return;
    if (!mapDrag.moved && Math.hypot(event.clientX - mapDrag.x, event.clientY - mapDrag.y) > 5) {
      mapDrag.moved = true;
      stopTravel();
      stopGlide();
      grid.setPointerCapture(event.pointerId);
      grid.classList.add('is-dragging');
    }
    if (mapDrag.moved) panFromMap(event);
  });
  const endMapDrag = (event) => {
    if (!mapDrag || event.pointerId !== mapDrag.id) return;
    if (mapDrag.moved) {
      ignoreMapClickUntil = performance.now() + 350;
    }
    mapDrag = null;
    grid.classList.remove('is-dragging');
  };
  grid.addEventListener('pointerup', endMapDrag);
  grid.addEventListener('pointercancel', endMapDrag);
  grid.addEventListener('lostpointercapture', endMapDrag);
  viewport.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNearest);
  }, { passive: true });
  updateMapLayout();
  if ('ResizeObserver' in window) {
    mapResizeObserver = new ResizeObserver(updateMapLayout);
    mapResizeObserver.observe(world);
    mapResizeObserver.observe(viewport);
  }
  const interruptMotion = () => { stopGlide(); stopTravel(); };
  viewport.addEventListener('wheel', interruptMotion, { passive: true });
  viewport.addEventListener('touchstart', interruptMotion, { passive: true });
  viewport.addEventListener('pointerdown', (event) => {
    if (!isSpatial() || event.pointerType !== 'mouse' || event.button !== 0) return;
    stopTravel();
    if (event.target.closest('a, button, summary, canvas')) return;
    if (!spaceHeld && event.target.closest('p, h1, h2, h3, h4, figcaption')) return;
    if (!spaceHeld && !event.target.closest('.region, .world')) return;
    stopGlide();
    event.preventDefault();
    viewport.focus({ preventScroll: true });
    drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, vx: 0, vy: 0, lastTime: performance.now() };
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const now = performance.now();
    const dt = Math.max(1, now - drag.lastTime);
    const beforeX = viewport.scrollLeft;
    const beforeY = viewport.scrollTop;
    viewport.scrollLeft -= event.clientX - drag.x;
    viewport.scrollTop -= event.clientY - drag.y;
    drag.vx = Math.max(-2.4, Math.min(2.4, drag.vx * .55 + (viewport.scrollLeft - beforeX) / dt * .45));
    drag.vy = Math.max(-2.4, Math.min(2.4, drag.vy * .55 + (viewport.scrollTop - beforeY) / dt * .45));
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.lastTime = now;
  });
  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const released = drag;
    drag = null;
    viewport.classList.remove('is-dragging');
    if (event.type === 'pointerup' && performance.now() - released.lastTime < 80) {
      coast(viewport, released.vx, released.vy);
    }
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('lostpointercapture', endDrag);
}

document.addEventListener('click', (event) => {
  if (performance.now() < ignoreMapClickUntil && event.target.closest('.map-grid')) {
    event.preventDefault();
    return;
  }
  const language = event.target.closest('[data-lang]');
  if (language) {
    saveLanguage(language.dataset.lang);
    render();
    return;
  }
  const menuToggle = event.target.closest('[data-menu-toggle]');
  if (menuToggle) {
    const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(expanded));
    document.querySelector('[data-nav]')?.classList.toggle('is-open', expanded);
    return;
  }
  const link = event.target.closest('a[data-go]');
  if (link) {
    event.preventDefault();
    closeMenu();
    navigate(link.dataset.go);
    return;
  }
  if (!event.target.closest('.site-header')) closeMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
  if (!isSpatial() || event.target.closest('a, button, summary, input, textarea, select')) return;
  if (event.code === 'Space' && event.target === viewport && !event.repeat) {
    spaceHeld = true;
    viewport?.classList.add('is-pan-ready');
    event.preventDefault();
  }
  if (event.target === viewport && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    stopGlide();
    stopTravel();
    viewport.scrollBy({
      left: (event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0) * viewport.clientWidth * .55,
      top: (event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0) * viewport.clientHeight * .55,
      behavior: motionAllowed() ? 'smooth' : 'auto'
    });
  }
});
document.addEventListener('keyup', (event) => {
  if (event.code === 'Space') { spaceHeld = false; viewport?.classList.remove('is-pan-ready'); }
});
window.addEventListener('blur', () => { spaceHeld = false; viewport?.classList.remove('is-pan-ready'); });
window.addEventListener('hashchange', () => navigate(location.hash.slice(1), false, false));
window.addEventListener('resize', () => requestAnimationFrame(() => {
  updateMapLayout();
  navigate(currentRegion, false, false);
}));

render();
setupLastUpdated();
