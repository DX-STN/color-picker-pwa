// =======================
// 定数・要素取得
// =======================
const STATE_KEY = 'colorPickerState';
const THUMB_KEY = 'colorPickerThumb';
const imageInput = document.getElementById('imageInput');
const selectedFileNameLabel = document.getElementById('selectedFileName');
const navCanvas = document.getElementById('navCanvas');
const navCtx = navCanvas.getContext('2d');
const mainCanvas = document.getElementById('canvas');
const mainCtx = mainCanvas.getContext('2d');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomInBtn = document.getElementById('zoomIn');
const zoomValueSpan = document.getElementById('zoomValue');
const colorPreview = document.getElementById('colorPreview');
const hexCodeSpan = document.getElementById('hexCode');
const rgbCodeSpan = document.getElementById('rgbCode');
const debugInfo = document.getElementById('debugInfo');
const prevMessageArea = document.getElementById('prevMessageArea');
const prevOverlay = document.getElementById('prevOverlay');
const prevThumbCanvas = document.getElementById('prevThumbCanvas');
const prevFileNameDiv = document.getElementById('prevFileName');
// =======================
// 状態変数
// =======================
let currentImg = null;
let currentFileName = null;
let zoomLevel = 1;
// 画像の表示オフセット（中心に配置するだけの簡易版）
let offsetX = 0;
let offsetY = 0;
// =======================
// ローカルストレージ
// =======================
function saveState() {
  if (!currentImg || !currentFileName) return;
  const state = {
    fileName: currentFileName, imgWidth: currentImg.width, imgHeight: currentImg.height, zoomLevel, offsetX, offsetY };
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('saveState error', e);
  }
}

function loadState() {
  try {
    const json = localStorage.getItem(STATE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('loadState error', e);
    return null;
  } }

// navCanvas のサムネイルを前回表示用に保存
function saveThumbnail() {
  if (!navCanvas) return;
  try {
    const dataUrl = navCanvas.toDataURL('image/jpeg', 0.8);
    localStorage.setItem(THUMB_KEY, dataUrl);
  } catch (e) {
    console.error('saveThumbnail error', e);
  } }

// =======================
// 前回画像表示（メッセージ＋プルダウン）
// =======================
function updatePrevMessageLine() {
  const state = loadState();
  if (!prevMessageArea) return;
  if (!state || !state.fileName) {
    prevMessageArea.textContent = '';
    prevMessageArea.style.cursor = 'default';
    return;
  }
  prevMessageArea.textContent = `> 前回使用した画像 ${state.fileName}`;
  prevMessageArea.style.cursor = 'pointer';
}

function showPrevOverlay() {
  const state = loadState();
  if (!state || !state.fileName) return;
  if (!prevOverlay || !prevThumbCanvas || !prevFileNameDiv) return;
  const ctx = prevThumbCanvas.getContext('2d');
  if (!ctx) return;
  const dataUrl = localStorage.getItem(THUMB_KEY);
  if (!dataUrl) return;
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, prevThumbCanvas.width, prevThumbCanvas.height);
    ctx.drawImage(img, 0, 0, prevThumbCanvas.width, prevThumbCanvas.height);
    prevFileNameDiv.textContent = state.fileName;
    prevOverlay.style.display = 'flex';
  };
  img.src = dataUrl;
}

function hidePrevOverlay() {
  if (!prevOverlay) return;
  prevOverlay.style.display = 'none';
}

// =======================
// キャンバス描画
// =======================

function clearNavCanvas() {
  navCtx.clearRect(0, 0, navCanvas.width, navCanvas.height);
}

function clearMainCanvas() {
  mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
}

// navCanvas にサムネイル表示
function drawNavThumbnail() {
  if (!currentImg) return;
  clearNavCanvas();
  const iw = currentImg.width;
  const ih = currentImg.height;
  const cw = navCanvas.width;
  const ch = navCanvas.height;
  const scale = Math.min(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;
  navCtx.drawImage(currentImg, dx, dy, dw, dh);
}

// メインキャンバスに画像表示（ズームと中心オフセット）
function drawMainImage() {
  if (!currentImg) return;
  const iw = currentImg.width;
  const ih = currentImg.height;
  // ひとまず画面横幅に合わせてキャンバスサイズ決定
  const maxWidth = window.innerWidth - 16;
  const baseScale = Math.min(1, maxWidth / iw);
  const w = iw * baseScale;
  const h = ih * baseScale;
  mainCanvas.width = w;
  mainCanvas.height = h;
  clearMainCanvas();
  const scale = baseScale * zoomLevel;
  const dw = iw * scale;
  const dh = ih * scale;
// offsetX, offsetY は中心基準のオフセットとして扱う
  const dx = (w - dw) / 2 + offsetX;
  const dy = (h - dh) / 2 + offsetY;
  mainCtx.drawImage(currentImg, dx, dy, dw, dh);
}

// =======================
// ズーム表示更新
// =======================
function updateZoomDisplay() {
  if (!zoomValueSpan) return;
  zoomValueSpan.textContent = `${Math.round(zoomLevel * 100)}%`;
}

// =======================
// 色取得
// =======================
function pickColorFromCanvas(event) {
  if (!currentImg) return;
  const rect = mainCanvas.getBoundingClientRect();
  const x = Math.floor((event.clientX - rect.left) * (mainCanvas.width / rect.width));
  const y = Math.floor((event.clientY - rect.top) * (mainCanvas.height / rect.height));
  const data = mainCtx.getImageData(x, y, 1, 1).data;
  const [r, g, b, a] = data;
  if (a === 0) return;
  const hex = '#' + [r, g, b] .map(v => v.toString(16).padStart(2, '0').toUpperCase()) .join('');
  colorPreview.style.backgroundColor = hex;
  hexCodeSpan.textContent = hex;
  rgbCodeSpan.textContent = `rgb(${r}, ${g}, ${b})`;
}

// =======================
// 初期化
// =======================
window.addEventListener('load', () => {
  clearNavCanvas();
  clearMainCanvas();
  updateZoomDisplay();
  updatePrevMessageLine();
  // メッセージクリックで前回プルダウンを開く
  if (prevMessageArea) {
    prevMessageArea.addEventListener('click', () => {
      const state = loadState();
      if (!state || !state.fileName) return;
      showPrevOverlay();
    });
  }
  // オーバーレイクリックで閉じる
  if (prevOverlay) {
    prevOverlay.addEventListener('click', hidePrevOverlay);
  }
  // ズームボタン
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoomLevel = Math.max(0.1, zoomLevel - 0.1);
      updateZoomDisplay();
      drawMainImage();
      saveState();
    });
  }
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoomLevel = Math.min(5, zoomLevel + 0.1);
      updateZoomDisplay();
      drawMainImage();
      saveState();
    });
  }
  // キャンバスクリックで色取得
  mainCanvas.addEventListener('click', e => {
    pickColorFromCanvas(e);
  });
  mainCanvas.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.touches[0];
    pickColorFromCanvas(t);
  }, { passive: false });
});

// =======================
// 画像選択時の処理
// =======================
if (imageInput) {
  imageInput.addEventListener('change', e => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    // ボタン横にファイル名
    if (selectedFileNameLabel) {
      selectedFileNameLabel.textContent = file.name;
    }
    // 新しい画像を選んだら、前回表示はリセット
    hidePrevOverlay();
    if (prevMessageArea) {
      prevMessageArea.textContent = '';
      prevMessageArea.style.cursor = 'default';
    }
    currentFileName = file.name;
    const img = new Image();
    img.onload = () => {
      currentImg = img;
      zoomLevel = 1;
      offsetX = 0;
      offsetY = 0;
      updateZoomDisplay();
      drawMainImage();
      drawNavThumbnail();
      saveThumbnail();
      saveState();
      
      // ★この行は必ず残す：同じファイルでも毎回change を発火させる
      imageInput.value = '';
    };
    img.src = URL.createObjectURL(file);
  });
}

// PWA: Service Worker 登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker .register('service-worker.js') .catch(console.error);
  });
}

