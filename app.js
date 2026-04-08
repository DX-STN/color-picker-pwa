const imageInput = document.getElementById('imageInput');

 const canvas = document.getElementById('canvas');

 const ctx = canvas.getContext('2d');

 const colorPreview = document.getElementById('colorPreview');

 const hexCodeSpan = document.getElementById('hexCode');

 const rgbCodeSpan = document.getElementById('rgbCode');

 let currentImg = null;

 let currentScale = 1;


 // 最後にクリックしたキャンバス座標
 let lastClickPos = null;



 // 画像読み込み 

imageInput.addEventListener('change', e => { const file = e.target.files[0];

 if (!file) return;

 const img = new Image();

 img.onload = () => {

 const maxWidth = 600;

 currentScale = Math.min(maxWidth / img.width, 1);

 canvas.width = img.width * currentScale;

 canvas.height = img.height * currentScale;

 currentImg = img;

 redrawImage();

 };

 img.src = URL.createObjectURL(file);

 });

 // 画像を描き直す
/*
 function redrawImage() {

 if (!currentImg) return;

 ctx.clearRect(0, 0, canvas.width, canvas.height);

 ctx.drawImage( currentImg, 0, 0, currentImg.width * currentScale, currentImg.height * currentScale );

 }
*/



function redrawImage() {

 if (!currentImg) return;

 ctx.clearRect(0, 0, canvas.width, canvas.height);

 ctx.drawImage( currentImg, 0, 0, currentImg.width * currentScale, currentImg.height * currentScale );

 // 最後にクリックした位置があれば丸を描く

 if (lastClickPos) {

 const { x, y } = lastClickPos;

 const radius = 6;

 // 白い外枠

 ctx.beginPath();

 ctx.arc(x, y, radius, 0, Math.PI * 2);

 ctx.lineWidth = 2;

 ctx.strokeStyle = '#ffffff';

 ctx.stroke();

 // 黒い内側の輪 ctx.beginPath();

 ctx.arc(x, y, radius - 2, 0, Math.PI * 2);

 ctx.strokeStyle = '#000000';

 ctx.stroke();

 }

 }




 // キャンバスクリックで色取得 

canvas.addEventListener('click', e => {

/*
console.log('canvas clicked'); // 追加


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


 // クリック位置を保存して描き直す lastClickPos = { x, y }; redrawImage();
*/



const rect = canvas.getBoundingClientRect();

 const clickX = e.clientX - rect.left;

 const clickY = e.clientY - rect.top;

 const scaleX = canvas.width / rect.width;

 const scaleY = canvas.height / rect.height;

 const x = Math.floor(clickX * scaleX);

 const y = Math.floor(clickY * scaleY);

 console.log('click canvas coords:', x, y);

 // まず画像を描き直す

 redrawImage();

 // その上に○を描く

（lastClickPos は一旦使わない） 

const radius = 6;

 ctx.beginPath();

 ctx.arc(x, y, radius, 0, Math.PI * 2);

 ctx.lineWidth = 2;

 ctx.strokeStyle = '#ffffff';

 ctx.stroke();

 ctx.beginPath();

 ctx.arc(x, y, radius - 2, 0, Math.PI * 2);

 ctx.strokeStyle = '#000000';

 ctx.stroke();





 });

 function componentToHex(c) {

 const hex = c.toString(16);

 return hex.length === 1 ? '0' + hex : hex;

 }

 function rgbToHex(r, g, b) {

 return ( '#' + componentToHex(r) + componentToHex(g) + componentToHex(b) );

 }

 // PWA: Service Worker 登録

 if ('serviceWorker' in navigator) {

 window.addEventListener('load', () => {

 navigator.serviceWorker .register('service-worker.js') .catch(console.error);

 });

 }