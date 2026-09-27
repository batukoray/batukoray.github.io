const copy = window.siteTranslations.copy;
const locales = window.siteTranslations.locales;
const languages = ['en', 'tr', 'zh'];
const storageKey = 'batu-site-language';

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

export const currentLanguage = () => {
  try {
    const saved = localStorage.getItem(storageKey);
    return languages.includes(saved) ? saved : 'en';
  } catch {
    return 'en';
  }
};

export const saveLanguage = (language) => {
  if (!languages.includes(language)) return;
  try { localStorage.setItem(storageKey, language); } catch { /* Storage can be disabled. */ }
};

const linkify = (value, links, language) => {
  let html = escapeHtml(value);
  for (const link of links) {
    const label = link.labels[language];
    html = html.replace(escapeHtml(label), `<a href="${link.href}" target="_blank" rel="noopener">${escapeHtml(label)}</a>`);
  }
  return html;
};

export function getContent(language = currentLanguage()) {
  const t = (key) => copy[key]?.[language] ?? copy[key]?.en ?? '';
  const introLinks = [
    { labels: { en: 'Koç University', tr: 'Koç Üniversitesi', zh: 'Koç 大学' }, href: 'https://www.ku.edu.tr/en/' },
    { labels: { en: 'Özyeğin University', tr: 'Özyeğin Üniversitesi', zh: 'Özyeğin 大学' }, href: 'https://www.ozyegin.edu.tr/en' }
  ];
  const labLinks = [
    { labels: { en: 'SPADE (Security, Privacy and Data Engineering) Lab', tr: 'SPADE (Güvenlik, Gizlilik ve Veri Mühendisliği) Laboratuvarı', zh: 'SPADE（安全、隐私与数据工程）实验室' }, href: 'https://mysite.ku.edu.tr/emregursoy/spade-lab/' },
    introLinks[0]
  ];
  const cpiLinks = [
    { labels: { en: 'Prof. Olcay Taner Yıldız', tr: 'Prof. Olcay Taner Yıldız', zh: 'Olcay Taner Yıldız' }, href: 'https://www.ozyegin.edu.tr/en/faculty/olcayyildiz' },
    { labels: { en: 'ASYU 2026', tr: 'ASYU 2026', zh: 'ASYU 2026' }, href: 'https://asyu2026.ozyegin.edu.tr/en' }
  ];
  const navKeys = ['now', 'standing', 'focus', 'work', 'education', 'notes', 'connect'];
  const navIds = ['track', 'numbers', 'research', 'projects', 'education', 'notes', 'contact'];
  const nav = navKeys.map((key, index) => ({ label: t(`nav.${key}`), id: navIds[index] }));

  return {
    language,
    locale: locales[language],
    t,
    nav,
    name: t('hero.name'),
    hero: {
      intro: linkify(t('hero.intro'), introLinks, language),
      current: t('hero.currentWork'),
      github: t('hero.ctaGithub'),
      personal: t('hero.ctaPersonal'),
      lab: t('hero.card.lab'),
      role: t('hero.card.role'),
      labLogoAlt: t('hero.card.logoAlt')
    },
    track: {
      heading: t('now.heading'),
      subheading: t('now.subheading'),
      roles: [
        { dates: t('now.kusrp.dates'), title: t('now.kusrp.title'), body: linkify(t('now.kusrp.body'), labLinks, language) },
        { dates: t('now.ta.dates'), title: t('now.ta.title'), body: escapeHtml(t('now.ta.body')) }
      ]
    },
    standing: {
      heading: t('signal.heading'),
      subheading: t('signal.subheading'),
      metrics: [
        { number: '3.77', label: t('signal.gpa.label'), caption: t('signal.gpa.caption'), body: t('signal.gpa.body') },
        { number: '3 / 65', label: t('signal.rank.label'), caption: t('signal.rank.caption'), body: t('signal.rank.body') },
        { number: '3%', label: t('signal.faculty.label'), caption: t('signal.faculty.caption'), body: t('signal.faculty.body') },
        { number: '4 / 4', label: t('signal.consistency.label'), caption: t('signal.consistency.caption'), body: t('signal.consistency.body') }
      ]
    },
    focus: {
      heading: t('focus.heading'),
      subheading: t('focus.subheading'),
      items: [1, 2, 3, 4].map((number) => ({ title: t(`focus.item${number}.title`), body: t(`focus.item${number}.body`) }))
    },
    work: {
      heading: t('work.heading'),
      items: [
        { tag: t('work.cpi.tag'), title: t('work.cpi.title'), body: linkify(t('work.cpi.body'), cpiLinks, language), status: t('work.cpi.status') },
        { tag: t('work.llama.tag'), title: t('work.llama.title'), body: escapeHtml(t('work.llama.body')), href: 'https://github.com/batukoray/llama2-from-scratch' },
        { tag: t('work.hadi.tag'), title: t('work.hadi.title'), body: escapeHtml(t('work.hadi.body')), href: 'https://github.com/batukoray/HaDi' },
        { tag: t('work.korado.tag'), title: t('work.korado.title'), body: escapeHtml(t('work.korado.body')), href: 'https://github.com/batukoray/Korado' }
      ]
    },
    notes: {
      heading: t('notes.heading'), subheading: t('notes.subheading'), repo: t('notes.repoLink'),
      kind: t('notes.kind'), title: t('notes.docTitle'), body: t('notes.docBody'),
      open: t('notes.openFull'), pager: t('notes.pager'), hint: t('notes.pagerHint')
    },
    education: {
      heading: t('education.heading'), subheading: t('education.subheading'),
      university: {
        dates: t('education.ozu.dates'), degree: t('education.ozu.degree'), school: t('education.ozu.school'),
        logoAlt: t('education.ozu.logoAlt'),
        facts: [
          { label: t('education.ozu.cgpaLabel'), value: '3.77 / 4.00' },
          { label: t('education.ozu.honorsLabel'), value: t('education.ozu.honorsValue') },
          { label: t('education.ozu.rankLabel'), value: t('education.ozu.rankValue') },
          { label: t('education.ozu.rolesLabel'), value: t('education.ozu.rolesValue') }
        ],
        details: ['honor', 'scholarship', 'advisor', 'toefl'].map((key) => ({
          issuer: t(`education.${key}.issuer`), title: t(`education.${key}.title`), body: t(`education.${key}.body`)
        }))
      },
      highschool: {
        dates: t('education.highschool.dates'), degree: t('education.highschool.degree'),
        school: t('education.highschool.school'), logoAlt: t('education.highschool.logoAlt'),
        frc: { date: t('education.frc.eyebrow'), title: t('education.frc.title'), body: t('education.frc.body'), link: t('education.frc.instagramLink') },
        coursework: { title: t('education.coursework.title'), body: t('education.coursework.body') }
      },
      early: {
        dates: t('education.early.dates'), heading: t('education.early.heading'),
        body: t('education.early.body'), link: t('education.early.archiveLink'),
        scratchAlt: t('education.early.scratchAlt'), scratchCaption: t('education.early.scratchCaption'),
        legoAlt: t('education.early.legoAlt'), legoCaption: t('education.early.legoCaption')
      }
    },
    contact: {
      heading: t('contact.heading'), body: t('contact.body'),
      threads: [1, 2, 3].map((number) => t(`contact.thread${number}`)),
      note: t('contact.note')
    }
  };
}

export const e = escapeHtml;

export function updatedLabel(c) {
  const tokens = { en: 'August 2026', tr: 'Ağustos 2026', zh: '2026 年 8 月' };
  const date = window.siteLastUpdatedAt
    ? new Intl.DateTimeFormat(c.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(window.siteLastUpdatedAt))
    : tokens[c.language];
  return c.t('hero.lastUpdated').replace(tokens[c.language], date);
}

export function setupLastUpdated() {
  fetch('https://api.github.com/repos/batukoray/batukoray.github.io/commits?sha=main&per_page=1', {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then((response) => response.ok ? response.json() : Promise.reject(new Error(`GitHub ${response.status}`)))
    .then(([latestCommit]) => {
      const date = latestCommit?.commit?.committer?.date;
      if (!date || Number.isNaN(new Date(date).getTime())) return;
      window.siteLastUpdatedAt = date;
      const label = document.querySelector('[data-last-updated]');
      if (label) label.textContent = updatedLabel(getContent(currentLanguage()));
    })
    .catch(() => { /* Keep the source page's fallback date when unavailable. */ });
}

export function languageButtons(language) {
  return `<div class="languages" role="group" aria-label="${e(copy['a11y.languageLabel'][language])}">${[
    ['en', 'EN'], ['tr', 'TR'], ['zh', '中文']
  ].map(([code, label]) => `<button type="button" data-lang="${code}" aria-pressed="${code === language}">${label}</button>`).join('')}</div>`;
}

export function notesViewerMarkup(notes) {
  return `<div class="notes-viewer" data-pdf-viewer>
    <div class="notes-viewer-heading"><span>${e(notes.kind)}</span><h3>${e(notes.title)}</h3><p>${e(notes.body)}</p>
      <a href="https://github.com/batukoray/batu-academia/blob/main/Differential-Equations/Differential_Equations.pdf" target="_blank" rel="noopener">${e(notes.open)}</a>
    </div>
    <div class="pdf-stage"><div class="pdf-pages"><canvas data-pdf-one aria-label="First page of Differential Equations notes"></canvas><canvas data-pdf-two aria-label="Second page of Differential Equations notes"></canvas></div><p data-pdf-message>Loading preview from GitHub</p></div>
    <div class="pdf-controls"><button type="button" data-pdf-prev aria-label="Previous pages" disabled>←</button><span data-pdf-status>${e(notes.pager)}</span><button type="button" data-pdf-next aria-label="Next pages" disabled>→</button></div>
    <p class="pdf-hint">${e(notes.hint)}</p>
  </div>`;
}

export function setupCommon(render) {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lang]');
    if (button) {
      saveLanguage(button.dataset.lang);
      render();
      return;
    }
    const toggle = event.target.closest('[data-menu-toggle]');
    if (toggle) {
      const menu = document.querySelector('[data-nav]');
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      menu?.classList.toggle('is-open', open);
    }
    if (event.target.closest('[data-nav] a')) {
      document.querySelector('[data-nav]')?.classList.remove('is-open');
      document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false');
    }
  });
}

export function setupNotes() {
  const viewer = document.querySelector('[data-pdf-viewer]');
  if (!viewer) return;
  const canvasOne = viewer.querySelector('[data-pdf-one]');
  const canvasTwo = viewer.querySelector('[data-pdf-two]');
  const status = viewer.querySelector('[data-pdf-status]');
  const message = viewer.querySelector('[data-pdf-message]');
  const previous = viewer.querySelector('[data-pdf-prev]');
  const next = viewer.querySelector('[data-pdf-next]');
  let pdf;
  let startPage = 1;
  let generation = 0;

  const renderPages = async () => {
    if (!pdf || !viewer.isConnected) return;
    const current = ++generation;
    const pages = [startPage, startPage + 1];
    for (const [index, pageNumber] of pages.entries()) {
      const canvas = index === 0 ? canvasOne : canvasTwo;
      if (pageNumber > pdf.numPages) { canvas.hidden = true; continue; }
      const page = await pdf.getPage(pageNumber);
      if (current !== generation || !viewer.isConnected) return;
      const scale = Math.min(1.4, Math.max(.7, 650 / page.getViewport({ scale: 1 }).width));
      const viewport = page.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.hidden = false;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
    const template = getContent(currentLanguage()).notes.pager;
    status.textContent = template.replace('1–2', `${startPage}–${Math.min(startPage + 1, pdf.numPages)}`).replace('102', String(pdf.numPages));
    previous.disabled = startPage <= 1;
    next.disabled = startPage + 2 > pdf.numPages;
  };

  previous.addEventListener('click', () => { startPage = Math.max(1, startPage - 2); renderPages(); });
  next.addEventListener('click', () => { startPage = Math.min(pdf.numPages, startPage + 2); renderPages(); });

  const observer = new IntersectionObserver(async (entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    try {
      const pdfjs = await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
      pdf = await pdfjs.getDocument('https://raw.githubusercontent.com/batukoray/batu-academia/main/Differential-Equations/Differential_Equations.pdf').promise;
      if (!viewer.isConnected) return;
      message.hidden = true;
      await renderPages();
    } catch {
      if (viewer.isConnected) message.innerHTML = 'This preview could not be rendered. <a href="https://github.com/batukoray/batu-academia/blob/main/Differential-Equations/Differential_Equations.pdf" target="_blank" rel="noopener">Open the full notes ↗</a>';
    }
  }, { rootMargin: '500px' });
  observer.observe(viewer);
}
