const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const hexCodeSpan = document.getElementById('hexCode');
const rgbCodeSpan = document.getElementById('rgbCode');
let currentImg = null;
// 読み込んだ画像
let currentScale = 1;// 縮尺 
let lastClickPos = null;// 最後にクリックした位置 {x, y}
// 画像読み込み
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return; const img = new Image();
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
  
