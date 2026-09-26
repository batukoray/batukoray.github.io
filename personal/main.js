const canvas = document.querySelector('#starfield');
const context = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointer = { x: .5, y: .5, targetX: .5, targetY: .5 };
let stars = [];
let width = 0;
let height = 0;
let pixelRatio = 1;

const createStars = () => {
  const count = Math.min(310, Math.max(150, Math.round((width * height) / 6800)));
  stars = Array.from({ length: count }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    radius: Math.random() * 1.25 + .18,
    alpha: Math.random() * .7 + .2,
    depth: Math.random() * .8 + .2,
    rust: index % 17 === 0
  }));
};

const resize = () => {
  width = window.innerWidth;
  height = window.innerHeight;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.floor(width * pixelRatio);
  canvas.height = Math.floor(height * pixelRatio);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  createStars();
  draw(0);
};

const draw = (time) => {
  context.clearRect(0, 0, width, height);
  const drift = reduceMotion ? 0 : time * .000004;
  const offsetX = (pointer.x - .5) * -18;
  const offsetY = (pointer.y - .5) * -12;

  stars.forEach((star, index) => {
    const x = (star.x * width + offsetX * star.depth + width + (index % 3) * drift * width) % width;
    const y = (star.y * height + offsetY * star.depth + height + drift * height * star.depth) % height;
    const pulse = reduceMotion ? 1 : .8 + Math.sin(time * .0012 + index) * .2;
    context.beginPath();
    context.fillStyle = star.rust ? `rgba(200, 93, 49, ${star.alpha * pulse})` : `rgba(232, 224, 208, ${star.alpha * pulse})`;
    context.arc(x, y, star.radius, 0, Math.PI * 2);
    context.fill();
  });
};

const animate = (time) => {
  pointer.x += (pointer.targetX - pointer.x) * .035;
  pointer.y += (pointer.targetY - pointer.y) * .035;
  draw(time);
  if (!reduceMotion) window.requestAnimationFrame(animate);
};

window.addEventListener('resize', resize, { passive: true });
window.addEventListener('pointermove', (event) => {
  pointer.targetX = event.clientX / width;
  pointer.targetY = event.clientY / height;
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: .16 });
document.querySelectorAll('[data-reveal]').forEach((element) => revealObserver.observe(element));

resize();
document.querySelectorAll('.hero [data-reveal]').forEach((element) => element.classList.add('is-visible'));
if (!reduceMotion) window.requestAnimationFrame(animate);
