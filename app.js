const imageInput = document.getElementById('imageInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colorPreview = document.getElementById('colorPreview');
const hexCodeSpan = document.getElementById('hexCode');
const rgbCodeSpan = document.getElementById('rgbCode');




let currentImg = null; let currentScale = 1; 

imageInput.addEventListener('change', e => {
 const file = e.target.files[0];

 if (!file) return;
 const img = new Image();
 img.onload = () => {

 const maxWidth = 600;
 cur

rentScale = Math.min(maxWidth / img.width, 1) canvas.width = img.width * currentScale;

 canvas.height = img.height * currentScale;

 currentImg = img;

 redrawImage();

 };

 img.src = URL.createObjectURL(file);

 });



 function redrawImage() {

 if (!currentImg) return;

 ctx.clearRect(0, 0, canvas.width, canvas.height)
;

 ctx.drawImage( currentImg, 0, 0, currentImg.width * currentScale, currentImg.height * currentScale );

 }




// 画像読み込み
imageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.onload = () => {
    const maxWidth = 600;
    const scale = Math.min(maxWidth / img.width, 1);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
  img.src = URL.createObjectURL(file);
});

// キャンバスクリックで色取得

canvas.addEventListener('click', e => {

 if (!canvas.width || !canvas.height) return;

 const rect = canvas.getBoundingClientRect();

 // 見かけのサイズに対するクリック位置

 const clickX = e.clientX - rect.left;
 const clickY = e.clientY - rect.top;

 // 実ピクセルサイズへの変換

 const scaleX = canvas.width / rect.width;
 const scaleY = canvas.height / rect.height;

 const x = Math.floor(clickX * scaleX);
 const y = Math.floor(clickY * scaleY);

 const pixel = ctx.getImageData(x, y, 1, 1).data;

 const [r, g, b, a] = pixel;
 const hex = rgbToHex(r, g, b);
 const rgb = `rgb(${r}, ${g}, ${b})`;

 colorPreview.style.backgroundColor = hex;

 hexCodeSpan.textContent = hex;
 rgbCodeSpan.textContent = rgb;

 });






function componentToHex(c) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

function rgbToHex(r, g, b) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

// PWA: Service Worker 登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
 navigator.serviceWorker.register('service-worker.js').catch(console.error);
  });
}
