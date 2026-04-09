const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const hexCodeSpan = document.getElementById('hexCode');
const rgbCodeSpan = document.getElementById('rgbCode');
let currentImg = null;// 読み込んだ画像
let currentScale = 8; // ★ 拡大率（例: 8倍）。あとでUIから変える前提
let lastClickPos = null; // 最後にクリックした位置 {x, y}

// ★ ピクセルをぼかさずに描画する設定（重要）
ctx.imageSmoothingEnabled = false;

// 画像読み込み
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    currentImg = img;
    lastClickPos = null;
    
    // ★ キャンバスサイズ = 画像サイズ × 拡大率
    canvas.width = currentImg.width * currentScale;
    canvas.height = currentImg.height * currentScale;
    redraw();
  };
  img.src = URL.createObjectURL(file);
});

// 画像とマーカーを描きなおす
function redraw() {
  if (!currentImg) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // ★ ピクセルくっきり拡大描画
  ctx.save(); ctx.imageSmoothingEnabled = false; // 念のため毎回OFF
  ctx.scale(currentScale, currentScale);
  ctx.drawImage(currentImg, 0, 0);
  ctx.restore();
  // ○マーカーを描画
  if (lastClickPos) {
    const { x, y } = lastClickPos;
    // ★ x, y は「拡大前の画像ピクセル座標」なので、
    // 表示上のいちにするためにスケールを掛けてから描く
    const drawX = (x + 0.5) * currentScale;// マスの中央に寄せる
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
  // 実際のキャンバスピクセルへの変換
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  // ★ キャンバス座標
  const canvasX = Math.floor(clickX * scaleX);
  const canvasY = Math.floor(clickY * scaleY);
  // ★ 画像ピクセル座標に変換（拡大率で割る）
  const imgX = Math.floor(canvasX / currentScale);
  const imgY = Math.floor(canvasY / currentScale);
  // キャンバス上で色を取得（拡大後でも1ピクセル単位でOK）
  const pixel = ctx.getImageData(canvasX, canvasY, 1, 1).data;
  const [r, g, b, a] = pixel;
  const hex = rgbToHex(r, g, b);
  const rgb = `rgb(${r}, ${g}, ${b})`;
  colorPreview.style.backgroundColor = hex;
  hexCodeSpan.textContent = hex;
  rgbCodeSpan.textContent = rgb;
  // ○の位置を「画像ピクセル座標」で保存して再描画
  lastClickPos = { x: imgX, y: imgY };
  redraw();
});

function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return ( '#' + componentToHex(r) + componentToHex(g) + componentToHex(b) );
}

// PWA: Service Worker 登録（そのまま残す）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker .register('service-worker.js') .catch(console.error);
  });
}
