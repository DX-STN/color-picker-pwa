const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const hexCodeSpan = document.getElementById('hexCode');
const rgbCodeSpan = document.getElementById('rgbCode');
let currentImg = null;
// 読み込んだ画像
let currentScale = 1;
// 縮尺
let lastClickPos = null;
// 最後にクリックした位置 {x, y} 
// 画像読み込み
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const maxWidth = 600;
    currentScale = Math.min(maxWidth / img.width, 1);
    canvas.width = img.width * currentScale;
    canvas.height = img.height * currentScale;
    currentImg = img;
    lastClickPos = null;
    redraw();
  };
  img.src = URL.createObjectURL(file);
});
// 画像と○を描き直す
function redraw() {
  if (!currentImg) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 画像を描画
  ctx.drawImage( currentImg, 0, 0, currentImg.width * currentScale, currentImg.height * currentScale );
  // ○マーカーを描画
  if (lastClickPos) {
    const { x, y } = lastClickPos;
    const r = 8;
    // 白い外側
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2) ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    // 黒い内側
    ctx.beginPath();
    ctx.arc(x, y, r - 3, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }
}
// キャンバスクリックで色取得＋
canvas.addEventListener('click', e => {
  if (!canvas.width || !canvas.height) return;
  if (!currentImg) return;
  const rect = canvas.getBoundingClientRect();
  // 見かけのサイズに対するクリック位置
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  // 実ピクセルサイズへの変換
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor(clickX * scaleX);
  const y = Math.floor(clickY * scaleY);
  // 色取得
  const pixel = ctx.getImageData(x, y, 1, 1).data;
  const [r, g, b, a] = pixel;
  const hex = rgbToHex(r, g, b);
  const rgb = `rgb(${r}, ${g}, ${b})`;
  colorPreview.style.backgroundColor = hex;
  hexCodeSpan.textContent = hex;
  rgbCodeSpan.textContent = rgb;
  // ○の位置を保存して再描画
  lastClickPos = { x, y };
  redraw();
});

function componentToHex(c){
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
