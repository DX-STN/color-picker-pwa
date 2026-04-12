// =======================
// 定数・共通変数
// =======================
const STATE_KEY = 'colorPickerState';
const THUMB_KEY = 'colorPickerThumb';
const imageInput = document.getElementById('imageInput');
const navCanvas = document.getElementById('navCanvas');
const mainCanvas = document.getElementById('canvas');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomInBtn = document.getElementById('zoomIn');
const zoomValueSpan = document.getElementById('zoomValue');
const colorPreview = document.getElementById('colorPreview');
const hexCodeSpan = document.getElementById('hexCode');
const rgbCodeSpan = document.getElementById('rgbCode');
const debugInfo = document.getElementById('debugInfo');
const prevMessageArea = document.getElementById('prevMessageArea');
const selectedFileNameLabel = document.getElementById('selectedFileName');
const prevOverlay = document.getElementById('prevOverlay');
const prevOverlayContent = document.getElementById('prevOverlayContent');
const prevThumbCanvas = document.getElementById('prevThumbCanvas');
const prevFileNameDiv = document.getElementById('prevFileName');

let currentImg = null;
let currentFileName = null;
let zoomLevel = 1;
let navCtx = navCanvas.getContext('2d');
let mainCtx = mainCanvas.getContext('2d');
// =======================
// ローカルストレージ関連
// =======================
function saveState() {
  if (!currentImg || !currentFileName) return;
  const state = {
    fileName: currentFileName, imgWidth: currentImg.width, imgHeight: currentImg.height, zoomLevel,
    // 必要であればカーソル位置なども保存
    // cursorPos: { x: ..., y: ... },
    // lastClickPos: { x: ..., y: ... } };
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state));
        } catch (e) {
    console.error('saveState error', e);
}}

function loadState() {
  try {
    const json = localStorage.getItem(STATE_KEY);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('loadState error', e);
    return null;
  }
}

// サムネイル画像（前回用）を保存
function saveThumbnail() {
  if (!navCanvas) return;
  try {
    const dataUrl = navCanvas.toDataURL('image/jpeg', 0.8);
    localStorage.setItem(THUMB_KEY, dataUrl);
  } catch (e) {
    console.error('saveThumbnail error', e);
  }
}
// =======================
// 前回画像の表示関連
// =======================
// メッセージエリア 1 行分を更新
function updatePrevMessageLine() {
  const state = loadState();
  if (!prevMessageArea) return;
  if (!state || !state.fileName) {
    // 行は残すがテキストは空
    prevMessageArea.textContent = '';
    prevMessageArea.style.cursor = 'default';
    return;
  }
  prevMessageArea.textContent = `> 前回使用した画像 ${state.fileName}`;
  prevMessageArea.style.cursor = 'pointer';
}
// オーバーレイに前回サムネイルを描画して表示
function showPrevOverlay() {
  const state = loadState();
  if (!state || !state.fileName) return;
  if (!prevOverlay || !prevThumbCanvas || !prevFileNameDiv) return;
  const ctx = prevThumbCanvas.getContext('2d');
  if (!ctx) return; const dataUrl = localStorage.getItem(THUMB_KEY);
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
// キャンバス描画関連（必要最低限）
// =======================
function clearNavCanvas() {
  if (!navCanvas || !navCtx) return;
  navCtx.clearRect(0, 0, navCanvas.width, navCanvas.height);
}

function clearMainCanvas() {
  if (!mainCanvas || !mainCtx) return;
  mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
}
// 画像を navCanvas にフィット表示（サムネイル）
function drawNavThumbnail() {
  if (!currentImg || !navCanvas || !navCtx) return;
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
// メインキャンバスへの描画（ここはアプリの詳細仕様に合わせて拡張）
function drawMainImage() {
  if (!currentImg || !mainCanvas || !mainCtx) return;
  clearMainCanvas();
  const iw = currentImg.width;
  const ih = currentImg.height;
  const cw = mainCanvas.width;
  const ch = mainCanvas.height;
  // 仮: 画像全体を表示するだけ
  const scale = zoomLevel;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (cw - dw) / 2;
  const dy = (ch - dh) / 2;
  mainCtx.drawImage(currentImg, dx, dy, dw, dh);
}
// ズーム値表示
function updateZoomDisplay() {
  if (!zoomValueSpan) return;
  zoomValueSpan.textContent = `${Math.round(zoomLevel * 100)}%`;
}
// =======================
// 初期化
// =======================
window.addEventListener('load', () => {
  // 起動時：navCanvas と mainCanvas を空にしておく
  clearNavCanvas();
  clearMainCanvas();
  updateZoomDisplay();
  // 前回の状態に応じてメッセージ行を更新
  updatePrevMessageLine();
  // メッセージクリックで前回プルダウン（オーバーレイ）表示
  if (prevMessageArea) {
    prevMessageArea.addEventListener('click', () => {
      const state = loadState();
      if (!state || !state.fileName) return;
      showPrevOverlay();
    });
  }
  // オーバーレイをクリックしたら閉じる
  if (prevOverlay) {
    prevOverlay.addEventListener('click', hidePrevOverlay);
  }
  // ズームボタン
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoomLevel = Math.max(0.1, zoomLevel - 0.1);
      updateZoomDisplay();
      drawMainImage();
    });
  }
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoomLevel = Math.min(5, zoomLevel + 0.1);
      updateZoomDisplay();
      drawMainImage();
    });
  }
  // ここで他の初期化（色取得用のクリックイベントなど）を追加する
});
// =======================
// 画像選択時の処理 
// =======================
if (imageInput) {
  imageInput.addEventListener('change', e => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;
    // ボタン横のラベルに現在のファイル名を出す
    if (selectedFileNameLabel) {
      selectedFileNameLabel.textContent = file.name;
    }
    // 新しい画像を選んだので、前回のオーバーレイとメッセージは消す
    hidePrevOverlay();
    if (prevMessageArea) {
      prevMessageArea.textContent = '';
      prevMessageArea.style.cursor = 'default';
    } currentFileName = file.name;
    const img = new Image();
    img.onload = () => {
      currentImg = img;
      zoomLevel = 1;
      updateZoomDisplay();
      // キャンバスサイズを画像やアプリ仕様に合わせて調整
      mainCanvas.width = img.width;
      mainCanvas.height = img.height;
      drawMainImage();
      drawNavThumbnail();
      saveThumbnail();
      saveState();
      // 同じファイルを選んだときも毎回 change が動くように、value を空に戻す
      imageInput.value = '';
    };
    img.src = URL.createObjectURL(file);
  });
}
