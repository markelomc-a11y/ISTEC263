const canvas = document.getElementById('sceneCanvas');
const ctx = canvas.getContext('2d');
const wrap = document.querySelector('.canvas-wrap');

const imageSources = ['image1.png', 'image2.png'];
const loadedImages = [];
const imageRects = [];
const activeDrips = [];
let hoveredIndex = -1;
let animationFrame = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const { width, height } = wrap.getBoundingClientRect();
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawScene();
}

function fitImage(img, targetX, targetY, targetWidth, targetHeight) {
  const imgRatio = img.width / img.height;
  const targetRatio = targetWidth / targetHeight;

  let drawWidth = targetWidth;
  let drawHeight = targetHeight;
  let drawX = targetX;
  let drawY = targetY;

  if (imgRatio > targetRatio) {
    drawHeight = targetHeight;
    drawWidth = drawHeight * imgRatio;
    drawX = targetX - (drawWidth - targetWidth) / 2;
  } else {
    drawWidth = targetWidth;
    drawHeight = drawWidth / imgRatio;
    drawY = targetY - (drawHeight - targetHeight) / 2;
  }

  return { drawX, drawY, drawWidth, drawHeight };
}

function computeLayout() {
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  const gap = Math.max(12, Math.min(28, width * 0.025));
  const padding = Math.max(14, Math.min(28, width * 0.03));
  const isMobile = width < 700;

  imageRects.length = 0;

  if (isMobile) {
    const cardHeight = (height - padding * 2 - gap) / 2;
    imageRects.push({ x: padding, y: padding, w: width - padding * 2, h: cardHeight });
    imageRects.push({ x: padding, y: padding + cardHeight + gap, w: width - padding * 2, h: cardHeight });
  } else {
    const cardWidth = (width - padding * 2 - gap) / 2;
    imageRects.push({ x: padding, y: padding, w: cardWidth, h: height - padding * 2 });
    imageRects.push({ x: padding + cardWidth + gap, y: padding, w: cardWidth, h: height - padding * 2 });
  }
}

function drawRoundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawImages() {
  computeLayout();

  imageRects.forEach((rect, index) => {
    const radius = 22;
    ctx.save();
    drawRoundedRect(rect.x, rect.y, rect.w, rect.h, radius);
    ctx.clip();

    const img = loadedImages[index];
    const fitted = fitImage(img, rect.x, rect.y, rect.w, rect.h);
    ctx.drawImage(img, fitted.drawX, fitted.drawY, fitted.drawWidth, fitted.drawHeight);

    const overlay = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    overlay.addColorStop(0, 'rgba(0,0,0,0.05)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = overlay;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();

    ctx.lineWidth = hoveredIndex === index ? 3 : 1.5;
    ctx.strokeStyle = hoveredIndex === index ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)';
    drawRoundedRect(rect.x, rect.y, rect.w, rect.h, radius);
    ctx.stroke();
  });
}

function createDripsForImage(index) {
  const rect = imageRects[index];
  const count = Math.max(10, Math.floor(rect.w / 34));

  for (let i = 0; i < count; i += 1) {
    activeDrips.push({
      imageIndex: index,
      x: rect.x + Math.random() * rect.w,
      y: rect.y - Math.random() * 30,
      width: 4 + Math.random() * 10,
      length: 20 + Math.random() * 90,
      speed: 1.4 + Math.random() * 2.6,
      headRadius: 4 + Math.random() * 7,
      alpha: 0.65 + Math.random() * 0.3,
    });
  }
}

function updateAndDrawDrips() {
  for (let i = activeDrips.length - 1; i >= 0; i -= 1) {
    const drip = activeDrips[i];
    const rect = imageRects[drip.imageIndex];

    drip.y += drip.speed;

    if (drip.y - rect.y > rect.h + drip.length + 20) {
      activeDrips.splice(i, 1);
      continue;
    }

    ctx.save();
    drawRoundedRect(rect.x, rect.y, rect.w, rect.h, 22);
    ctx.clip();

    const tailTop = Math.max(rect.y, drip.y - drip.length);
    const gradient = ctx.createLinearGradient(drip.x, tailTop, drip.x, drip.y + drip.headRadius);
    gradient.addColorStop(0, `rgba(90, 0, 0, 0)`);
    gradient.addColorStop(0.35, `rgba(125, 0, 0, ${drip.alpha * 0.7})`);
    gradient.addColorStop(1, `rgba(190, 0, 0, ${drip.alpha})`);

    ctx.strokeStyle = gradient;
    ctx.lineWidth = drip.width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(drip.x, tailTop);
    ctx.lineTo(drip.x, drip.y);
    ctx.stroke();

    ctx.fillStyle = `rgba(170, 0, 0, ${drip.alpha})`;
    ctx.beginPath();
    ctx.arc(drip.x, drip.y, drip.headRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawLabels() {
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '600 16px Arial';
  imageRects.forEach((rect, index) => {
    ctx.fillText(`Image ${index + 1}`, rect.x + 14, rect.y + 26);
  });
}

function drawScene() {
  const width = wrap.clientWidth;
  const height = wrap.clientHeight;
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#141414');
  bg.addColorStop(1, '#050505');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  if (loadedImages.length === 2) {
    drawImages();
    updateAndDrawDrips();
    drawLabels();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 18px Arial';
    ctx.fillText('Loading images...', 24, 36);
  }

  animationFrame = requestAnimationFrame(drawScene);
}

function getImageIndexAtPoint(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  return imageRects.findIndex((item) => x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h);
}

canvas.addEventListener('click', (event) => {
  const index = getImageIndexAtPoint(event.clientX, event.clientY);
  if (index >= 0) {
    createDripsForImage(index);
  }
});

canvas.addEventListener('mousemove', (event) => {
  hoveredIndex = getImageIndexAtPoint(event.clientX, event.clientY);
});

canvas.addEventListener('mouseleave', () => {
  hoveredIndex = -1;
});

window.addEventListener('resize', resizeCanvas);

Promise.all(imageSources.map(loadImage))
  .then((images) => {
    loadedImages.push(...images);
    resizeCanvas();
    if (!animationFrame) drawScene();
  })
  .catch((error) => {
    console.error(error);
    ctx.fillStyle = '#fff';
    ctx.font = '600 18px Arial';
    ctx.fillText('Failed to load local images from /images.', 24, 36);
  });
