/* ============================================================
 * 动效版个人主页
 * 1. 横向滚动（滚轮 / 触摸 / 键盘 / 导航）
 * 2. 自定义鼠标 + 点击涟漪
 * 3. 首屏粒子：被鼠标推开，点击变换形态
 * 4. 文字随鼠标距离放大变色
 * 5. 作品卡片 3D 倾斜 + 悬停播放视频
 * 6. Showreel 视频播放器（磁吸按钮）
 * 7. 技能跑马灯（滚动越快跑得越快）
 * 8. 磁吸按钮
 * ============================================================ */

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const lerp = (a, b, t) => a + (b - a) * t;

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- 鼠标位置（全局共享） ---------- */
const mouse = { x: innerWidth / 2, y: innerHeight / 2, active: false };
addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; });
document.addEventListener('pointerleave', () => { mouse.active = false; });

/* ============================================================
 * 1. 横向滚动
 * ============================================================ */
const track = document.querySelector('.track');
const progressBar = document.querySelector('.progress span');
const navLinks = [...document.querySelectorAll('.nav nav a')];
const panels = [...document.querySelectorAll('.panel')];

const scroll = { target: 0, current: 0, max: 0, velocity: 0 };
const clampScroll = (v) => Math.max(0, Math.min(scroll.max, v));

function measure() {
  scroll.max = track.scrollWidth - innerWidth;
  scroll.target = clampScroll(scroll.target);
}
addEventListener('resize', measure);
addEventListener('load', measure);
measure();

addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  scroll.target = clampScroll(scroll.target + delta * (e.deltaMode === 1 ? 30 : 1));
}, { passive: false });

let touchStart = null;
addEventListener('touchstart', (e) => {
  const t = e.touches[0];
  touchStart = { x: t.clientX, y: t.clientY, scroll: scroll.target };
}, { passive: true });
addEventListener('touchmove', (e) => {
  if (!touchStart) return;
  const t = e.touches[0];
  const dx = touchStart.x - t.clientX;
  const dy = touchStart.y - t.clientY;
  scroll.target = clampScroll(touchStart.scroll + (Math.abs(dx) > Math.abs(dy) ? dx : dy) * 1.4);
}, { passive: true });
addEventListener('touchend', () => { touchStart = null; });

addEventListener('keydown', (e) => {
  const step = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ' ': 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[e.key];
  if (step) { e.preventDefault(); scroll.target = clampScroll(scroll.target + step * innerWidth * 0.8); }
  if (e.key === 'Home') scroll.target = 0;
  if (e.key === 'End') scroll.target = scroll.max;
});

function goTo(el) { scroll.target = clampScroll(el.offsetLeft); }
document.querySelectorAll('[data-goto]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    goTo(document.querySelector(a.getAttribute('href')));
  });
});
// 键盘 Tab 聚焦到屏幕外的元素时，自动滚过去
document.addEventListener('focusin', (e) => {
  const panel = e.target.closest('.panel');
  if (panel && !e.target.closest('.nav')) goTo(panel);
});

function updateScroll() {
  const prev = scroll.current;
  scroll.current = reduceMotion ? scroll.target : lerp(scroll.current, scroll.target, 0.085);
  if (Math.abs(scroll.target - scroll.current) < 0.1) scroll.current = scroll.target;
  scroll.velocity = scroll.current - prev;
  track.style.transform = `translate3d(${-scroll.current}px,0,0)`;
  progressBar.style.width = (scroll.max ? (scroll.current / scroll.max) * 100 : 0) + '%';

  // 高亮当前所在区块的导航
  const mid = scroll.current + innerWidth / 2;
  const activeId = panels.find((p) => mid >= p.offsetLeft && mid < p.offsetLeft + p.offsetWidth)?.id;
  navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + activeId));
}

/* ============================================================
 * 2. 自定义鼠标 + 点击涟漪
 * ============================================================ */
const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
const ringPos = { x: mouse.x, y: mouse.y };

document.addEventListener('pointerover', (e) => {
  document.body.classList.toggle('hovering', !!e.target.closest('a, button, [data-hover]'));
});
addEventListener('pointerdown', (e) => {
  document.body.classList.add('pressing');
  if (reduceMotion) return;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.left = e.clientX + 'px';
  r.style.top = e.clientY + 'px';
  document.body.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
});
addEventListener('pointerup', () => document.body.classList.remove('pressing'));

function updateCursor() {
  if (isTouch) return;
  ringPos.x = lerp(ringPos.x, mouse.x, 0.18);
  ringPos.y = lerp(ringPos.y, mouse.y, 0.18);
  dot.style.transform = `translate(${mouse.x}px,${mouse.y}px) translate(-50%,-50%)`;
  ring.style.transform = `translate(${ringPos.x}px,${ringPos.y}px) translate(-50%,-50%)`;
}

/* ============================================================
 * 3. 首屏粒子
 * ============================================================ */
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
const hero = document.getElementById('hero');
const COLORS = ['#a78bfa', '#f472b6', '#38bdf8', '#f4f4f5'];
const NAME = '你的名字'; // ← 改成你的名字

let W = 0, H = 0, dpr = 1;
let particles = [];
let shapeIndex = 0;

// 在离屏画布上画出形状，再取样出像素点作为粒子的目标位置
function samplePoints(draw, gap) {
  const off = document.createElement('canvas');
  off.width = W; off.height = H;
  const o = off.getContext('2d');
  o.fillStyle = '#fff';
  draw(o);
  const data = o.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += gap) {
    for (let x = 0; x < W; x += gap) {
      if (data[(y * W + x) * 4 + 3] > 128) pts.push({ x, y });
    }
  }
  return pts;
}

function textShape(text) {
  return (o) => {
    o.font = `800 100px ${getComputedStyle(document.body).fontFamily}`;
    const w = o.measureText(text).width;
    const size = Math.min((100 * W * 0.78) / w, H * 0.42);
    o.font = `800 ${size}px ${getComputedStyle(document.body).fontFamily}`;
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.fillText(text, W / 2, H * 0.47);
  };
}

const SHAPES = [
  { name: '名字', draw: textShape(NAME) },
  {
    name: '圆环',
    draw: (o) => {
      const r = Math.min(W, H) * 0.3;
      o.beginPath();
      o.arc(W / 2, H * 0.47, r, 0, Math.PI * 2);
      o.arc(W / 2, H * 0.47, r * 0.72, 0, Math.PI * 2, true);
      o.fill();
    },
  },
  {
    name: '爱心',
    draw: (o) => {
      const s = Math.min(W, H) * 0.021;
      o.beginPath();
      for (let t = 0; t <= Math.PI * 2; t += 0.02) {
        const x = 16 * Math.sin(t) ** 3;
        const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        o.lineTo(W / 2 + x * s, H * 0.45 - y * s);
      }
      o.fill();
    },
  },
  { name: 'HELLO', draw: textShape('HELLO') },
  { name: '星系', galaxy: true },
];

function galaxyPoints(n) {
  const pts = [];
  const R = Math.min(W, H) * 0.42;
  for (let i = 0; i < n; i++) {
    const arm = i % 3;
    const d = Math.random() ** 0.7;
    const a = arm * ((Math.PI * 2) / 3) + d * 5 + (Math.random() - 0.5) * 0.5;
    pts.push({ x: W / 2 + Math.cos(a) * d * R * 1.4, y: H * 0.47 + Math.sin(a) * d * R * 0.8 });
  }
  return pts;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function applyShape(index) {
  const n = particles.length;
  const shape = SHAPES[index];
  const gap = Math.max(4, Math.round(Math.sqrt((W * H) / 60000)) + 3);
  const pts = shuffle(shape.galaxy ? galaxyPoints(n) : samplePoints(shape.draw, gap));
  if (!pts.length) return;
  particles.forEach((p, i) => {
    const t = pts[i % pts.length];
    p.tx = t.x + (Math.random() - 0.5) * 2;
    p.ty = t.y + (Math.random() - 0.5) * 2;
  });
}

function resizeParticles() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = hero.clientWidth;
  H = hero.clientHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.round(Math.min(2600, Math.max(900, (W * H) / 550)) * (reduceMotion ? 0.5 : 1));
  while (particles.length < count) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, tx: W / 2, ty: H / 2,
      size: Math.random() * 1.6 + 0.8,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    });
  }
  particles.length = count;
  applyShape(shapeIndex);
}
addEventListener('resize', resizeParticles);
document.fonts?.ready.then(resizeParticles);
resizeParticles();

// 点击：粒子炸开，然后聚成下一个形状
hero.addEventListener('click', (e) => {
  const rect = hero.getBoundingClientRect();
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;
  if (!reduceMotion) {
    particles.forEach((p) => {
      const dx = p.x - cx, dy = p.y - cy;
      const d = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 1 - d / 600) * 28 + 4;
      p.vx += (dx / d) * f * (0.5 + Math.random());
      p.vy += (dy / d) * f * (0.5 + Math.random());
    });
  }
  shapeIndex = (shapeIndex + 1) % SHAPES.length;
  applyShape(shapeIndex);
});

function updateParticles(time) {
  const rect = hero.getBoundingClientRect();
  if (rect.right < 0 || rect.left > innerWidth) return; // 不在屏幕里就不画，省电

  const mx = mouse.x - rect.left;
  const my = mouse.y - rect.top;
  const R = 130;

  ctx.fillStyle = 'rgba(11,11,13,0.32)'; // 半透明覆盖 → 拖尾效果
  ctx.fillRect(0, 0, W, H);

  for (const p of particles) {
    // 弹簧：被拉回目标位置，带一点轻微浮动
    const wobble = reduceMotion ? 0 : Math.sin(time * 0.001 + p.tx * 0.02) * 1.2;
    p.vx += (p.tx - p.x) * 0.012;
    p.vy += (p.ty + wobble - p.y) * 0.012;

    // 鼠标排斥
    if (mouse.active) {
      const dx = p.x - mx, dy = p.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / R) * 3.2;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
      }
    }
    p.vx *= 0.86;
    p.vy *= 0.86;
    p.x += p.vx;
    p.y += p.vy;

    const speed = Math.abs(p.vx) + Math.abs(p.vy);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.min(1, 0.55 + speed * 0.08);
    ctx.fillRect(p.x, p.y, p.size + speed * 0.15, p.size + speed * 0.15);
  }
  ctx.globalAlpha = 1;
}

/* ============================================================
 * 4. 文字随鼠标距离放大变色
 * ============================================================ */
const kinetic = document.querySelector('.kinetic');
kinetic.innerHTML = [...kinetic.dataset.text].map((c) => `<span>${c}</span>`).join('');
const letters = [...kinetic.children];

function updateKinetic() {
  const box = kinetic.getBoundingClientRect();
  if (box.right < 0 || box.left > innerWidth) return;
  for (const s of letters) {
    const r = s.getBoundingClientRect();
    const d = Math.hypot(mouse.x - (r.left + r.width / 2), mouse.y - (r.top + r.height / 2));
    const k = mouse.active ? Math.max(0, 1 - d / 260) : 0;
    s.style.transform = `translateY(${-k * 18}px) scale(${1 + k * 0.35}) rotate(${k * (r.left % 2 ? 6 : -6)}deg)`;
    s.style.color = k > 0.05 ? `hsl(${265 - k * 60}, 90%, ${80 - k * 10}%)` : '';
  }
}

/* ============================================================
 * 5. 作品卡片：3D 倾斜 + 悬停播放
 * ============================================================ */
document.querySelectorAll('.card').forEach((card) => {
  const video = card.querySelector('video');
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 14}deg) translateZ(10px)`;
  });
  card.addEventListener('pointerleave', () => {
    card.style.transform = '';
    if (video) video.pause();
  });
  // 作品卡片（带链接、用图片）只保留倾斜效果，点击直接打开作品
  if (!video) return;
  card.addEventListener('pointerenter', () => video.play().catch(() => {}));
  // 手机上：点一下播放 / 暂停
  if (isTouch) card.addEventListener('click', () => (video.paused ? video.play().catch(() => {}) : video.pause()));
});

/* ============================================================
 * 6. Showreel 播放器
 * ============================================================ */
const stage = document.querySelector('.stage');
const reel = document.getElementById('reel-video');
const playBtn = stage.querySelector('.play');
const playLabel = playBtn.querySelector('.label');
const timeline = stage.querySelector('.timeline span');
const btnPos = { x: 0, y: 0, tx: 0, ty: 0 };

function togglePlay() {
  if (reel.paused) reel.play().catch(() => {}); else reel.pause();
}
stage.addEventListener('click', togglePlay);
reel.addEventListener('play', () => { stage.classList.add('playing'); playLabel.textContent = '暂停'; });
reel.addEventListener('pause', () => { stage.classList.remove('playing'); playLabel.textContent = '播放'; });
reel.addEventListener('timeupdate', () => {
  timeline.style.width = (reel.duration ? (reel.currentTime / reel.duration) * 100 : 0) + '%';
});
// 播放按钮跟着鼠标走（磁吸）
stage.addEventListener('pointermove', (e) => {
  const r = stage.getBoundingClientRect();
  btnPos.tx = e.clientX - (r.left + r.width / 2);
  btnPos.ty = e.clientY - (r.top + r.height / 2);
});
stage.addEventListener('pointerleave', () => { btnPos.tx = 0; btnPos.ty = 0; });
// 滑走时自动暂停
function updateReel() {
  btnPos.x = lerp(btnPos.x, btnPos.tx, 0.12);
  btnPos.y = lerp(btnPos.y, btnPos.ty, 0.12);
  playBtn.style.transform = `translate(${btnPos.x}px,${btnPos.y}px)`;
  const r = stage.getBoundingClientRect();
  if (!reel.paused && (r.right < 0 || r.left > innerWidth)) reel.pause();
}

/* ============================================================
 * 7. 技能跑马灯
 * ============================================================ */
const marquees = [...document.querySelectorAll('.marquee')].map((el) => {
  const inner = el.querySelector('.marquee-inner');
  inner.innerHTML = inner.innerHTML.repeat(6); // 复制几份，保证无缝循环
  return { inner, dir: Number(el.dataset.dir), offset: 0 };
});

function updateMarquees() {
  const boost = Math.min(30, Math.abs(scroll.velocity) * 0.6);
  for (const m of marquees) {
    const half = m.inner.scrollWidth / 2;
    m.offset = (m.offset + (reduceMotion ? 0 : 1.2 + boost) * m.dir + half) % half;
    m.inner.style.transform = `translate3d(${-m.offset}px,0,0)`;
  }
}

/* ============================================================
 * 8. 磁吸按钮
 * ============================================================ */
document.querySelectorAll('.magnet').forEach((btn) => {
  const label = btn.querySelector('span');
  btn.addEventListener('pointermove', (e) => {
    const r = btn.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    btn.style.transform = `translate(${x * 0.35}px,${y * 0.35}px)`;
    label.style.transform = `translate(${x * 0.2}px,${y * 0.2}px)`;
  });
  btn.addEventListener('pointerleave', () => {
    btn.style.transition = 'transform .5s cubic-bezier(.2,.9,.3,1.4), background .3s, color .3s';
    btn.style.transform = label.style.transform = '';
    setTimeout(() => (btn.style.transition = ''), 500);
  });
});

/* ============================================================
 * 主循环
 * ============================================================ */
function frame(time) {
  updateScroll();
  updateCursor();
  updateParticles(time);
  updateKinetic();
  updateReel();
  updateMarquees();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
