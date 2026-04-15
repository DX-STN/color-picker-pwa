/*app.jsA*/
const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const wrapper = document.getElementById('canvasWrapper');
const ctx = canvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const hexCodeSpan = document.getElementById('hexCode');
const rgbCodeSpan = document.getElementById('rgbCode');
const navCanvas = document.getElementById('navCanvas');
const navCtx = navCanvas ? navCanvas.getContext('2d') : null;
let currentImg = null;
let currentScale = 1;
let lastClickPos = null;
let cursorPos = null;
let currentFileName = null;
const STATE_KEY = 'colorPickerState_v1';
const THUMB_KEY = 'thumbnail_v1';
let isPinching = false;
let pinchStartDistance = 0;
let pinchStartScale = currentScale;
const debugInfo = document.getElementById('debugInfo');

function updateDebugInfo() {
  if (!currentImg) {
    debugInfo.textContent = 'no image';
    return;
  }
  const rect = canvas.getBoundingClientRect();
  debugInfo.textContent = `img: ${currentImg.width}x${currentImg.height} ` + `canvas(internal): ${canvas.width}x${canvas.height} ` + `canvas(css): ${Math.round(rect.width)}x${Math.round(rect.height)} ` + `scale: ${currentScale.toFixed(2)}`;
}

function saveState() {
  if (!currentImg || !currentFileName) return;
  const state = { fileName: currentFileName, scale: currentScale, cursorPos: cursorPos, lastClickPos: lastClickPos, imgWidth: currentImg.width, imgHeight: currentImg.height, savedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  } }

function loadState() {
  try {
    const json = localStorage.getItem(STATE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to load state', e);
    return null;
  } }

function drawThumbnail() {
  if (!currentImg || !navCanvas || !navCtx) return;
  const w = navCanvas.width;
  const h = navCanvas.height;
  navCtx.clearRect(0, 0, w, h);
  navCtx.imageSmoothingEnabled = false;
  const scale = Math.min(w / currentImg.width, h / currentImg.height);
  const drawW = currentImg.width * scale;
  const drawH = currentImg.height * scale;
  const offsetX = (w - drawW) / 2;
  const offsetY = (h - drawH) / 2;
  navCtx.drawImage( currentImg, 0, 0, currentImg.width, currentImg.height, offsetX, offsetY, drawW, drawH );
}

function saveThumbnail() {
  if (!navCanvas) return;
  try {
    const dataUrl = navCanvas.toDataURL('image/png');
    localStorage.setItem(THUMB_KEY, dataUrl);
  } catch (e) {
    console.error('Failed to save thumbnail', e);
  } }

function loadThumbnail() {
  if (!navCanvas || !navCtx) return;
  const dataUrl = localStorage.getItem(THUMB_KEY);
  if (!dataUrl) return;
  const img = new Image();
  img.onload = () => {
    navCtx.clearRect(0, 0, navCanvas.width, navCanvas.height);
    navCtx.drawImage(img, 0, 0, navCanvas.width, navCanvas.height);
  };
  img.src = dataUrl;
}
ctx.imageSmoothingEnabled = false;

imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  currentFileName = file.name;
  const img = new Image();
  img.onload = () => {
    currentImg = img;
    lastClickPos = null;
    cursorPos = null;
    const prevState = loadState();
    const wrapper = document.getElementById('canvasWrapper');
    const wrapperRect = wrapper.getBoundingClientRect();
    const wrapperWidth = wrapperRect.width;
    const wrapperHeight = wrapperRect.height;
    const scaleX = wrapperWidth / currentImg.width;
    const scaleY = wrapperHeight / currentImg.height;
    let initialScale = Math.max(scaleX, scaleY);
    const MIN_INITIAL_SCALE = 0.1;
    if (initialScale < MIN_INITIAL_SCALE) {
      initialScale = MIN_INITIAL_SCALE;
    }
    currentScale = initialScale;
    canvas.width = currentImg.width * currentScale;
    canvas.height = currentImg.height * currentScale;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    redraw();
    updateDebugInfo && updateDebugInfo();
    drawThumbnail();
    saveThumbnail();
    const hasPrev = prevState && prevState.fileName === currentFileName && prevState.imgWidth === currentImg.width && prevState.imgHeight === currentImg.height && (prevState.cursorPos || prevState.lastClickPos);
    if (hasPrev) {
      const ok = window.confirm( '前回の作業位置へ復帰しますか？\n\n' + '⚠ 同じ名前・同じサイズの別画像を開いた場合でも、' + 'このダイアログが表示されることがあります。' );
      if (ok) {
        if (typeof prevState.scale === 'number') {
          currentScale = prevState.scale;
          canvas.width = currentImg.width * currentScale;
          canvas.height = currentImg.height * currentScale;
          canvas.style.width = canvas.width + 'px';
          canvas.style.height = canvas.height + 'px';
        }
        cursorPos = prevState.cursorPos || prevState.lastClickPos || null;
        lastClickPos = prevState.lastClickPos || null;
        redraw();
        updateDebugInfo && updateDebugInfo();
      }
    }
    saveState();
    // change を毎回発火させるため
    imageInput.value = '';
  };
  img.src = URL.createObjectURL(file);
});

function redraw() {
  if (!currentImg) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(currentScale, currentScale);
  ctx.drawImage(currentImg, 0, 0);
  ctx.restore();
  if (lastClickPos) {
    const { x, y } = lastClickPos;
    const drawX = (x + 0.5) * currentScale;
    const drawY = (y + 0.5) * currentScale;
    const r = 8; ctx.beginPath();
    ctx.arc(drawX, drawY, r, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(drawX, drawY, r - 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }
}
canvas.addEventListener('click', e => {
  if (!canvas.width || !canvas.height) return;
  if (!currentImg) return;
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = Math.floor(clickX * scaleX);
  const canvasY = Math.floor(clickY * scaleY);
  const imgX = Math.floor(canvasX / currentScale);
  const imgY = Math.floor(canvasY / currentScale);
  if ( imgX < 0 || imgY < 0 || imgX >= currentImg.width || imgY >= currentImg.height ) {
    return;
  }
  const pixelCanvasX = imgX * currentScale;
  const pixelCanvasY = imgY * currentScale;
  const pixel = ctx.getImageData(pixelCanvasX, pixelCanvasY, 1, 1).data;
  const [r, g, b, a] = pixel;
  const hex = rgbToHex(r, g, b);
  const rgb = `rgb(${r}, ${g}, ${b})`;
  colorPreview.style.backgroundColor = hex;
  hexCodeSpan.textContent = hex;
  rgbCodeSpan.textContent = rgb;
  lastClickPos = { x: imgX, y: imgY };
  cursorPos = { x: imgX, y: imgY };
  redraw();
  updateDebugInfo();
  saveState();
});

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return ( '#' + componentToHex(r) + componentToHex(g) + componentToHex(b) );
}

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}
wrapper.addEventListener('touchstart', e => {
  if (!currentImg) return;
  if (e.touches.length === 2) {
    e.preventDefault();
    isPinching = true;
    pinchStartDistance = getTouchDistance(e.touches);
    pinchStartScale = currentScale;} }, { passive: false });

wrapper.addEventListener('touchmove', e => {
  if (!isPinching) return;
  if (e.touches.length !== 2) return;
  e.preventDefault();
  const currentDistance = getTouchDistance(e.touches);
  if (pinchStartDistance === 0) return;
  const scaleFactor = currentDistance / pinchStartDistance;
  let newScale = pinchStartScale * scaleFactor;
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 20;
  if (newScale < MIN_SCALE) newScale = MIN_SCALE;
  if (newScale > MAX_SCALE) newScale = MAX_SCALE;
  currentScale = newScale;
  const MAX_CANVAS_SIZE = 12000;
  let scaledWidth = currentImg.width * newScale;
  let scaledHeight = currentImg.height * newScale;
  if (scaledWidth > MAX_CANVAS_SIZE || scaledHeight > MAX_CANVAS_SIZE) {
    const ratioW = MAX_CANVAS_SIZE / currentImg.width;
    const ratioH = MAX_CANVAS_SIZE / currentImg.height;
    newScale = Math.min(ratioW, ratioH);
  }
  currentScale = newScale;
  canvas.width = currentImg.width * currentScale;
  canvas.height = currentImg.height * currentScale;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  redraw();
  updateDebugInfo();
}, { passive: false });

wrapper.addEventListener('touchend', e => {
  if (e.touches.length < 2) {
    isPinching = false;
    pinchStartDistance = 0;
  } });

window.addEventListener('load', () => {
  loadThumbnail();
});


if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker .register('service-worker.js') .catch(console.error);
  }); }
