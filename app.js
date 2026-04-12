const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const wrapper = document.getElementById('canvasWrapper'); // ★追加
const ctx = canvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const hexCodeSpan = document.getElementById('hexCode');
const rgbCodeSpan = document.getElementById('rgbCode');

// サムネイル用キャンバス（HTML に <canvas id="navCanvas"> を用意しておく）
const navCanvas = document.getElementById('navCanvas');
const navCtx = navCanvas ? navCanvas.getContext('2d') : null;

// 読み込んだ画像
let currentImg = null;
let currentScale = 1;// 初期倍率（とりあえず2倍から）
let lastClickPos = null;// 最後にクリックした位置 {x, y}（画像ピクセル座標）
let cursorPos = null; // 最後に「ここを見ていた」位置 {x, y}（現時点ではクリックと同じ）

// どのファイルで作業しているか
let currentFileName = null;

// 状態保存用キー
const STATE_KEY = 'colorPickerState_v1';
const THUMB_KEY = 'thumbnail_v1';

// ピンチ操作用の状態
let isPinching = false;
let pinchStartDistance = 0;
let pinchStartScale = currentScale;

//デバッグ用
const debugInfo = document.getElementById('debugInfo');
function updateDebugInfo() {
  if (!currentImg) {
    debugInfo.textContent = 'no image';
    return;
  } const rect = canvas.getBoundingClientRect();
  debugInfo.textContent = `img: ${currentImg.width}x${currentImg.height} ` + `canvas(internal): ${canvas.width}x${canvas.height} ` + `canvas(css): ${Math.round(rect.width)}x${Math.round(rect.height)} ` + `scale: ${currentScale.toFixed(2)}`;
}

function saveState() {
  if (!currentImg || !currentFileName) return;
  const state = {
    fileName: currentFileName,
    scale: currentScale,
    cursorPos: cursorPos,//追加
    lastClickPos: lastClickPos,
    imgWidth: currentImg.width,
    imgHeight: currentImg.height,
    savedAt: new Date().toISOString()
  };
  
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state));
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

// サムネイル用に画像全体をnavCanvas に描く
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

// サムネイルを localStorage に最新1枚だけ保存
function saveThumbnail() {
  if (!navCanvas) return;
  try {
    const dataUrl = navCanvas.toDataURL('image/png');
    localStorage.setItem(THUMB_KEY, dataUrl);
  } catch (e) {
    console.error('Failed to save thumbnail', e);
  } }

// 起動時に前回のサムネイルを読み込む
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

// ピクセルをぼかさずに描画する設定
ctx.imageSmoothingEnabled = false;
// 画像読み込み

/*
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
*/



imageInput.addEventListener('change', e => {
  console.log('change event fired', e.target.files);
  const file = e.target.files[0];
  if (!file) {
    console.warn('no file selected or access denied');
    return;
  } console.log('selected file', file.name);



  
  // どのファイルか覚えておく（状態保存で使う）
  currentFileName = file.name;
  const img = new Image();

img.onload = () => {
  currentImg = img;
  lastClickPos = null;
  cursorPos = null; //★①／2 新規追加
  
  //★②／2 ここで前回状態を読み込んでおく（まだ saveState は呼ばない）
  const prevState = loadState();
  // ラッパー要素のサイズを取得
  const wrapper = document.getElementById('canvasWrapper');
  const wrapperRect = wrapper.getBoundingClientRect();
  const wrapperWidth = wrapperRect.width;
  const wrapperHeight = wrapperRect.height;
  // 画像を「全体が収まる」ようにする倍率を計算
  const scaleX = wrapperWidth / currentImg.width;
  const scaleY = wrapperHeight / currentImg.height;
  
  // 縦横どちらか小さい方を採用
  // 大きい方を使う → どちらか一方がピッタリ合う
  let initialScale = Math.max(scaleX, scaleY);
  // 小さすぎると真っ白に見えがちなので、下限を少し決めておく（お好みで調整）
  const MIN_INITIAL_SCALE = 0.1;//✪0.1
  if (initialScale < MIN_INITIAL_SCALE) {
    initialScale = MIN_INITIAL_SCALE;
  }
  currentScale = initialScale;
  // キャンバスサイズを決定
  canvas.width = currentImg.width * currentScale;
  canvas.height = currentImg.height * currentScale;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  redraw();
  updateDebugInfo && updateDebugInfo(); // debugInfo を入れている場合だけ呼ばれるように
  
  // ここでサムネイルを描いて保存
  drawThumbnail();
  saveThumbnail();

  // ここで「前回の作業状態」が同じファイルかどうか判定
  const hasPrev = prevState && prevState.fileName === currentFileName && prevState.imgWidth === currentImg.width && prevState.imgHeight === currentImg.height && (prevState.cursorPos || prevState.lastClickPos);
  if (hasPrev) {
    const ok = window.confirm( '前回の作業位置へ復帰しますか？\\n\\n' + '⚠ 同じ名前・同じサイズの別画像を開いた場合でも、' + 'このダイアログが表示されることがあります。' );
    if (ok) {
      // スケール復元
      if (typeof prevState.scale === 'number') {
        currentScale = prevState.scale;
        canvas.width = currentImg.width * currentScale;
        canvas.height = currentImg.height * currentScale;
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
      }
      // 位置復元（cursorPos を優先、なければ lastClickPos）
      cursorPos = prevState.cursorPos || prevState.lastClickPos || null;
      lastClickPos = prevState.lastClickPos || null;
      redraw();
      updateDebugInfo && updateDebugInfo();
    } }
  // 最後に現在の状態を保存（今回の画像で上書き）
  saveState();
  // ★ここで毎回リセット
  //imageInput.value = '';
  
};
  img.src = URL.createObjectURL(file);
});

// 画像とマーカーを描き直す
function redraw() {
  if (!currentImg) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ピクセルくっきり拡大描画
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.scale(currentScale, currentScale);
  ctx.drawImage(currentImg, 0, 0);
  ctx.restore();
  // ○マーカーを描画（画像ピクセル座標から計算）
  if (lastClickPos) {
    const { x, y } = lastClickPos;
    // 画像ピクセルの「中央」に丸を置く
    const drawX = (x + 0.5) * currentScale;
    const drawY = (y + 0.5) * currentScale;
    const r = 8;
    // 白い外側
    ctx.beginPath();
    ctx.arc(drawX, drawY, r, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    // 黒い内側
    ctx.beginPath();
    ctx.arc(drawX, drawY, r - 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }
}

// キャンバスクリックで色取得
canvas.addEventListener('click', e => {
  if (!canvas.width || !canvas.height) return;
  if (!currentImg) return;
  const rect = canvas.getBoundingClientRect();
  // 見かけのサイズに対するクリック位置（CSSピクセル）
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  // キャンバス内部ピクセルへの変換
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  // キャンバス座標
  const canvasX = Math.floor(clickX * scaleX);
  const canvasY = Math.floor(clickY * scaleY);
  // 画像ピクセル座標に変換（拡大率で割る）
  const imgX = Math.floor(canvasX / currentScale);
  const imgY = Math.floor(canvasY / currentScale);
  // 範囲外なら無視
  if (imgX < 0 || imgY < 0 || imgX >= currentImg.width || imgY >= currentImg.height) {
    return;
  }
  // 画像ピクセルに対応するキャンバス上の左上座標
  const pixelCanvasX = imgX * currentScale;
  const pixelCanvasY = imgY * currentScale;
  // その1ピクセル分（拡大後のマス）から色を取得
  const pixel = ctx.getImageData(pixelCanvasX, pixelCanvasY, 1, 1).data;
  const [r, g, b, a] = pixel;
  const hex = rgbToHex(r, g, b);
  const rgb = `rgb(${r}, ${g}, ${b})`;
  colorPreview.style.backgroundColor = hex;
  hexCodeSpan.textContent = hex;
  rgbCodeSpan.textContent = rgb;
  // ○の位置を「画像ピクセル座標」で保存して再描画
  lastClickPos = { x: imgX, y: imgY };
  // いまの注目位置としても更新しておく  
  cursorPos = { x: imgX, y: imgY };
  
  redraw();
  updateDebugInfo();
  // クリック位置が変わったので状態を保存
  saveState();
});

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return ( '#' + componentToHex(r) + componentToHex(g) + componentToHex(b) );
}

// ======================= 
// ピンチイン・アウト対応 
// ======================= 
// 2本指の距離を返すユーティリティ

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

// タッチ開始
wrapper.addEventListener('touchstart', e => {
  if (!currentImg) return;
  if (e.touches.length === 2) {
    // ブラウザのズームなどを抑制
    e.preventDefault();
    isPinching = true;
    pinchStartDistance = getTouchDistance(e.touches);
    pinchStartScale = currentScale;
  }
}, { passive: false });

// タッチ移動
wrapper.addEventListener('touchmove', e => {
  if (!isPinching) return;
  if (e.touches.length !== 2) return;
  e.preventDefault();
  const currentDistance = getTouchDistance(e.touches);
  if (pinchStartDistance === 0) return;
  // 距離の比率から倍率を計算
  const scaleFactor = currentDistance / pinchStartDistance;
  // 新しいスケール
  let newScale = pinchStartScale * scaleFactor;
  // 最小・最大倍率を制限（お好みで調整）
  const MIN_SCALE = 0.1;
  const MAX_SCALE = 20;//✪8クラッシュ防止
  if (newScale < MIN_SCALE) newScale = MIN_SCALE;
  if (newScale > MAX_SCALE) newScale = MAX_SCALE;
  currentScale = newScale;

  // キャンバス自体の最大サイズでも制限する
  const MAX_CANVAS_SIZE = 12000;//✪✪15000クラッシュ防止
  let scaledWidth = currentImg.width * newScale;
  let scaledHeight = currentImg.height * newScale;
  if (scaledWidth > MAX_CANVAS_SIZE || scaledHeight > MAX_CANVAS_SIZE) {
    const ratioW = MAX_CANVAS_SIZE / currentImg.width;
    const ratioH = MAX_CANVAS_SIZE / currentImg.height;
    newScale = Math.min(ratioW, ratioH);
  }
  currentScale = newScale;
  // 画像に合わせてキャンバスサイズを更新
  canvas.width = currentImg.width * currentScale;
  canvas.height = currentImg.height * currentScale;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  redraw();
  updateDebugInfo();
}, { passive: false });

// タッチ終了
wrapper.addEventListener('touchend', e => {
  if (e.touches.length < 2) {
    // 2本指でなくなったらピンチ終了
    isPinching = false;
    pinchStartDistance = 0;
  }
});


/*
const zoomOutBtn = document.getElementById('zoomOut');
const zoomInBtn = document.getElementById('zoomIn');
const zoomValueSpan = document.getElementById('zoomValue');

// 表示用にcurrentScale を丸めて文字表示
function updateZoomLabel() {
  zoomValueSpan.textContent = `${currentScale.toFixed(1)}x`;
}

function applyScaleAndRedraw() {
  if (!currentImg) return;
  
  canvas.width = currentImg.width * currentScale;
  canvas.height = currentImg.height * currentScale;
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  
  redraw();
  updateZoomLabel();
}
// 画像読み込み時に呼ぶ処理を少し変更
// img.onload の中を次のようにしてみてください
img.onload = () => {
  currentImg = img;
  lastClickPos = null;
  
  // ここで currentScale の初期値を設定
  currentScale = 1; // まずは 1x から確かめる
  
  applyScaleAndRedraw();
};

// ズームボタンのイベント
zoomInBtn.addEventListener('click', () => {
  currentScale *= 2;// 2倍ずつ拡大（お好みで）
  if (currentScale > 20) currentScale = 20;
  applyScaleAndRedraw();
});

zoomOutBtn.addEventListener('click', () => {
  currentScale /= 2; // 1/2ずつ縮小
  if (currentScale < 1) currentScale = 1;
  applyScaleAndRedraw();
});
// 初期表示用ラベル
updateZoomLabel();
*/



// 起動時に前回のサムネイルを復元
window.addEventListener('load', () => {
  loadThumbnail();
});


// PWA: Service Worker 登録（そのまま残す）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker .register('service-worker.js') .catch(console.error);
  });
}
