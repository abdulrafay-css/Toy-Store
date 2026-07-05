(function(){
'use strict';

/* =========================================================
   TOY CATALOG
========================================================= */
const TOYS = [
  { id:'ball',   name:'Bouncy Buddy',    price:14, age:'0-3',  tags:['active','cuddly'],  desc:'A featherweight sphere that bounces higher every giggle it hears.', color:0xFF6FB5, kind:'ball' },
  { id:'rings',  name:'Stacking Rings',  price:18, age:'0-3',  tags:['creative','cuddly'],desc:'Three glowing rings that wobble, never tip, and stack a hundred ways.', color:0xFFD93D, kind:'rings' },
  { id:'blocks', name:'Bright Blocks',   price:22, age:'4-7',  tags:['creative'],         desc:'A cluster of soft-edged blocks that click together with a happy snap.', color:0x4FC3F7, kind:'blocks' },
  { id:'top',    name:'Spindle Top',     price:12, age:'4-7',  tags:['active'],           desc:'Give it a flick and watch it hum, wobble, and never quite fall.', color:0x6BCB77, kind:'top' },
  { id:'rocket', name:'Rocket Buddy',    price:26, age:'4-7',  tags:['active','tech'],    desc:'A pocket rocket with fins that flutter mid-flight — floor only, we promise.', color:0xFF9F5A, kind:'rocket' },
  { id:'robo',   name:'Robo Pal',        price:34, age:'8-12', tags:['tech','creative'],  desc:'A friendly little robot who beeps back whenever you tap his chest.', color:0x4FC3F7, kind:'robo' },
  { id:'cube',   name:'Puzzle Cube',     price:16, age:'8-12', tags:['tech','creative'],  desc:'Twist, turn, and untwist — six glowing faces, one satisfying click.', color:0xFF6FB5, kind:'cube' },
  { id:'drone',  name:'Drone Flyer',     price:38, age:'8-12', tags:['tech','active'],    desc:'A tabletop flyer that spins its ring and hovers just an inch up.', color:0xFFD93D, kind:'drone' },
];

const BUNDLES = [
  { ids:['rocket','robo'], label:'Space Explorer Bundle', discount:0.15 },
  { ids:['ball','rings'],  label:'First Toys Bundle',     discount:0.10 },
];

let cart = [];
let wishlist = [];

/* =========================================================
   THREE.JS SETUP
========================================================= */
const canvas = document.getElementById('webgl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1B1B3A, 0.035);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 1.4, 11);
let camLookAt = new THREE.Vector3(0,0.5,0);
camera.lookAt(camLookAt);

// Lights: soft ambient + warm key + cool rim (simulated HDRI feel)
const ambient = new THREE.AmbientLight(0x8888ff, 0.55);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffe3b3, 1.15);
keyLight.position.set(5, 8, 6);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024,1024);
keyLight.shadow.camera.left = -10; keyLight.shadow.camera.right = 10;
keyLight.shadow.camera.top = 10; keyLight.shadow.camera.bottom = -10;
keyLight.shadow.radius = 6;
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x4FC3F7, 1.2, 30);
rimLight.position.set(-6, 3, -5);
scene.add(rimLight);

const fillLight = new THREE.PointLight(0xFF6FB5, 0.7, 25);
fillLight.position.set(6, -2, 3);
scene.add(fillLight);

// Soft ground disc to catch shadows, faint
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(14, 48),
  new THREE.ShadowMaterial({ opacity: 0.28 })
);
ground.rotation.x = -Math.PI/2;
ground.position.y = -2.6;
ground.receiveShadow = true;
scene.add(ground);

// Ambient background sparkle particles
(function addSparkles(){
  const geo = new THREE.BufferGeometry();
  const count = 180;
  const positions = new Float32Array(count*3);
  for(let i=0;i<count;i++){
    positions[i*3]   = (Math.random()-0.5)*40;
    positions[i*3+1] = (Math.random()-0.5)*24;
    positions[i*3+2] = (Math.random()-0.5)*30 - 8;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions,3));
  const mat = new THREE.PointsMaterial({ color:0xffffff, size:0.045, transparent:true, opacity:0.5 });
  scene.add(new THREE.Points(geo, mat));
})();

/* =========================================================
   TOY MESH BUILDERS (stylized primitives standing in for models)
========================================================= */
function stdMat(color, extra){
  return new THREE.MeshStandardMaterial(Object.assign({
    color, roughness:0.35, metalness:0.08, envMapIntensity:1
  }, extra||{}));
}

function buildToy(def){
  const g = new THREE.Group();
  const c = def.color;
  switch(def.kind){
    case 'ball': {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.9,32,32), stdMat(c, {roughness:0.25}));
      m.castShadow = true; g.add(m);
      break;
    }
    case 'rings': {
      const cols = [c, 0xffffff, 0x000000].map(()=>c);
      const colors = [c, 0xFFD93D, 0x6BCB77];
      for(let i=0;i<3;i++){
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.85 - i*0.22, 0.16, 16, 32), stdMat(colors[i%colors.length]));
        t.position.y = -0.5 + i*0.45;
        t.castShadow = true; g.add(t);
      }
      break;
    }
    case 'blocks': {
      const offsets = [[-0.5,-0.4,0],[0.45,-0.4,0.1],[-0.05,0.45,-0.1]];
      const colors = [c, 0xFFD93D, 0xFF6FB5];
      offsets.forEach((o,i)=>{
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.75,0.75,0.75), stdMat(colors[i%colors.length]));
        b.position.set(o[0],o[1],o[2]);
        b.rotation.set(Math.random(),Math.random(),Math.random());
        b.castShadow = true; g.add(b);
      });
      break;
    }
    case 'top': {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.75,1.2,24), stdMat(c));
      cone.rotation.x = Math.PI; cone.position.y = 0.2; cone.castShadow = true; g.add(cone);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.5,0.5,24), stdMat(0xFFD93D));
      cap.position.y = 0.85; cap.castShadow = true; g.add(cap);
      break;
    }
    case 'rocket': {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,1.4,24), stdMat(c));
      body.castShadow = true; g.add(body);
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.4,0.7,24), stdMat(0xFF6FB5));
      nose.position.y = 1.05; nose.castShadow = true; g.add(nose);
      for(let i=0;i<3;i++){
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12,0.5,0.35), stdMat(0x4FC3F7));
        const ang = (i/3)*Math.PI*2;
        fin.position.set(Math.cos(ang)*0.45, -0.75, Math.sin(ang)*0.45);
        fin.castShadow = true; g.add(fin);
      }
      break;
    }
    case 'robo': {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8,0.7,0.7), stdMat(c));
      head.position.y = 0.55; head.castShadow = true; g.add(head);
      const body = new THREE.Mesh(new THREE.BoxGeometry(1,1,0.7), stdMat(0xFFD93D));
      body.position.y = -0.45; body.castShadow = true; g.add(body);
      const eyeGeo = new THREE.SphereGeometry(0.08,12,12);
      [-0.2,0.2].forEach(x=>{
        const e = new THREE.Mesh(eyeGeo, stdMat(0x14142B, {emissive:0x4FC3F7, emissiveIntensity:0.9}));
        e.position.set(x, 0.6, 0.37); g.add(e);
      });
      break;
    }
    case 'cube': {
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.2,1.2,1.2), stdMat(c, {roughness:0.2, metalness:0.15}));
      b.castShadow = true; g.add(b);
      const wire = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), new THREE.LineBasicMaterial({color:0xffffff, transparent:true, opacity:0.35}));
      b.add(wire);
      break;
    }
    case 'drone': {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85,0.12,16,32), stdMat(c));
      ring.rotation.x = Math.PI/2; ring.castShadow = true; g.add(ring);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.35,20,20), stdMat(0xFF6FB5));
      core.castShadow = true; g.add(core);
      break;
    }
  }
  g.userData.toy = def;
  g.userData.baseY = 0;
  g.userData.floatOffset = Math.random()*Math.PI*2;
  g.userData.floatSpeed = 0.6 + Math.random()*0.4;
  return g;
}

const toyMeshes = TOYS.map(t=>{
  const mesh = buildToy(t);
  scene.add(mesh);
  return mesh;
});

/* Layouts */
function layoutHomeCluster(){
  const R = 2.6;
  toyMeshes.forEach((m,i)=>{
    const ang = (i/toyMeshes.length)*Math.PI*2;
    const x = Math.cos(ang)*R*0.9;
    const y = Math.sin(i*1.7)*0.9;
    const z = Math.sin(ang)*R*0.6 - 1;
    gsap.to(m.position, { x, y, z, duration:1.1, ease:'power3.out' });
    gsap.to(m.rotation, { y: ang, duration:1.1, ease:'power3.out' });
    gsap.to(m.scale, { x:1, y:1, z:1, duration:0.9, ease:'back.out(2)' });
    m.userData.baseY = y;
    m.visible = true;
  });
}

function layoutShopGrid(filterFn){
  const visible = toyMeshes.filter(m => filterFn(m.userData.toy));
  const cols = Math.min(4, visible.length) || 1;
  const spacingX = 2.6, spacingY = 2.2;
  const rows = Math.ceil(visible.length/cols);
  visible.forEach((m,i)=>{
    const col = i % cols, row = Math.floor(i/cols);
    const x = (col - (cols-1)/2) * spacingX;
    const y = ((rows-1)/2 - row) * spacingY - 0.3;
    const z = 0;
    m.visible = true;
    gsap.killTweensOf(m.scale);
    gsap.fromTo(m.scale, {x:0.001,y:0.001,z:0.001}, { x:1,y:1,z:1, duration:0.7, delay:i*0.04, ease:'elastic.out(1,0.6)' });
    gsap.to(m.position, { x, y, z, duration:0.8, delay:i*0.02, ease:'power3.out' });
    m.userData.baseY = y;
  });
  toyMeshes.filter(m => !filterFn(m.userData.toy)).forEach(m=>{
    gsap.killTweensOf(m.scale);
    gsap.to(m.scale, { x:0.001, y:0.001, z:0.001, duration:0.4, ease:'back.in(2)', onComplete:()=>{ m.visible=false; } });
  });
}

/* =========================================================
   VIEW / STATE MACHINE
========================================================= */
let state = 'home'; // home | shop | detail
let selectedMesh = null;
let currentFilterAge = 'all';
let currentSearch = '';
let currentTagFilter = null; // used by quiz result

const elHome = document.getElementById('view-home');
const elShop = document.getElementById('view-shop');
const elDetail = document.getElementById('view-detail');
const scrollHint = document.getElementById('scrollHint');
const toyCaption = document.getElementById('toyCaption');
const backBtn = document.getElementById('backBtn');

function passesFilter(toy){
  const ageOk = currentFilterAge === 'all' || toy.age === currentFilterAge;
  const searchOk = !currentSearch || toy.name.toLowerCase().includes(currentSearch);
  const tagOk = !currentTagFilter || toy.tags.includes(currentTagFilter);
  return ageOk && searchOk && tagOk;
}

function goHome(){
  state = 'home';
  elHome.style.display = 'flex'; elShop.style.display = 'none'; elDetail.style.display = 'none';
  scrollHint.style.opacity = '1';
  toyCaption.classList.remove('show');
  setDock('home');
  gsap.to(camera.position, { x:0, y:1.4, z:11, duration:1.2, ease:'power3.inOut' });
  animateLookAt(new THREE.Vector3(0,0.5,0));
  layoutHomeCluster();
}

function goShop(){
  state = 'shop';
  elHome.style.display = 'none'; elShop.style.display = 'flex'; elDetail.style.display = 'none';
  scrollHint.style.opacity = '0';
  setDock('shop');
  gsap.to(camera.position, { x:0, y:0.6, z:9.5, duration:1.2, ease:'power3.inOut' });
  animateLookAt(new THREE.Vector3(0,0,0));
  layoutShopGrid(passesFilter);
}

function openDetail(mesh){
  selectedMesh = mesh;
  const toy = mesh.userData.toy;
  state = 'detail';
  elShop.style.display = 'none'; elHome.style.display = 'none'; elDetail.style.display = 'block';
  toyCaption.classList.remove('show');

  document.getElementById('detName').textContent = toy.name;
  document.getElementById('detDesc').textContent = toy.desc;
  document.getElementById('detPrice').textContent = '$' + toy.price;
  document.getElementById('detAge').textContent = toy.age.replace('-','–') + (toy.age==='8-12' ? '+' : '');
  document.getElementById('wishToggleBtn').textContent = wishlist.includes(toy.id) ? '♥' : '♡';

  const targetPos = mesh.position.clone().add(new THREE.Vector3(0.4, 0.3, 3.2));
  gsap.to(camera.position, { x:targetPos.x, y:targetPos.y, z:targetPos.z, duration:1.0, ease:'power3.inOut' });
  animateLookAt(mesh.position.clone());
  gsap.to(mesh.scale, { x:1.3, y:1.3, z:1.3, duration:0.6, ease:'elastic.out(1,0.5)' });
}

function closeDetail(){
  if(selectedMesh){ gsap.to(selectedMesh.scale, { x:1, y:1, z:1, duration:0.4, ease:'power2.out' }); }
  selectedMesh = null;
  goShop();
}

function animateLookAt(target){
  gsap.to(camLookAt, { x:target.x, y:target.y, z:target.z, duration:1.1, ease:'power3.inOut',
    onUpdate:()=> camera.lookAt(camLookAt) });
}

function setDock(view){
  document.querySelectorAll('.dock-item').forEach(btn=>{
    const active = btn.dataset.view === view;
    btn.classList.toggle('active', active);
    const pill = btn.querySelector('.dock-pill');
    pill.style.display = active ? 'block' : 'none';
  });
}

document.querySelectorAll('.dock-item').forEach(btn=>{
  btn.addEventListener('click', ()=>{ btn.dataset.view === 'home' ? goHome() : goShop(); });
});
document.getElementById('goShopBtn').addEventListener('click', goShop);
backBtn.addEventListener('click', closeDetail);

/* Wheel/scroll on home nudges into shop, per brief ("scrolling transitions camera") */
let scrollLock = false;
window.addEventListener('wheel', (e)=>{
  if(state === 'home' && e.deltaY > 12 && !scrollLock){
    scrollLock = true;
    goShop();
    setTimeout(()=> scrollLock=false, 1200);
  } else if (state === 'shop' && e.deltaY < -12 && !scrollLock && window.scrollY === 0){
    scrollLock = true;
    goHome();
    setTimeout(()=> scrollLock=false, 1200);
  }
}, { passive:true });

/* =========================================================
   RAYCAST / POINTER INTERACTION
========================================================= */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let isDragging = false, dragStart = {x:0,y:0}, dragged = false;

function setPointer(e){
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  pointer.x = (cx / window.innerWidth) * 2 - 1;
  pointer.y = -(cy / window.innerHeight) * 2 + 1;
  return {cx, cy};
}

canvas.addEventListener('pointerdown', (e)=>{
  isDragging = true; dragged = false;
  dragStart = { x:e.clientX, y:e.clientY };
});

canvas.addEventListener('pointermove', (e)=>{
  if(!isDragging) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if(Math.abs(dx) > 3 || Math.abs(dy) > 3) dragged = true;

  if(state === 'detail' && selectedMesh){
    selectedMesh.rotation.y += dx * 0.008;
    selectedMesh.rotation.x += dy * 0.006;
    dragStart = { x:e.clientX, y:e.clientY };
  } else if (state === 'shop'){
    setPointer(e);
    updateHoverCaption();
  }
});

canvas.addEventListener('pointerup', (e)=>{
  isDragging = false;
  if(dragged) return; // was a drag/rotate, not a click
  if(state !== 'shop') return;
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  const visibleMeshes = toyMeshes.filter(m=>m.visible);
  const hits = raycaster.intersectObjects(visibleMeshes, true);
  if(hits.length){
    let obj = hits[0].object;
    while(obj.parent && !obj.userData.toy) obj = obj.parent;
    if(obj.userData.toy) openDetail(obj);
  }
});

function updateHoverCaption(){
  raycaster.setFromCamera(pointer, camera);
  const visibleMeshes = toyMeshes.filter(m=>m.visible);
  const hits = raycaster.intersectObjects(visibleMeshes, true);
  if(hits.length){
    let obj = hits[0].object;
    while(obj.parent && !obj.userData.toy) obj = obj.parent;
    if(obj.userData.toy){
      document.getElementById('capName').textContent = obj.userData.toy.name;
      document.getElementById('capPrice').textContent = '$' + obj.userData.toy.price;
      toyCaption.classList.add('show');
      canvas.style.cursor = 'pointer';
      return;
    }
  }
  toyCaption.classList.remove('show');
  canvas.style.cursor = 'default';
}

/* =========================================================
   FILTER UI
========================================================= */
document.getElementById('ageFilters').addEventListener('click', (e)=>{
  const btn = e.target.closest('.chip'); if(!btn) return;
  document.querySelectorAll('#ageFilters .chip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active');
  currentFilterAge = btn.dataset.age;
  currentTagFilter = null;
  layoutShopGrid(passesFilter);
});

document.getElementById('searchInput').addEventListener('input', (e)=>{
  currentSearch = e.target.value.trim().toLowerCase();
  layoutShopGrid(passesFilter);
});

/* =========================================================
   CART
========================================================= */
const cartPanel = document.getElementById('cartPanel');
const cartScrim = document.getElementById('cartScrim');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartBadge = document.getElementById('cartBadge');
const bundleSlot = document.getElementById('bundleSlot');
const wishBadge = document.getElementById('wishBadge');

function openCart(){
  cartScrim.classList.add('open');
  gsap.to(cartPanel, { x:0, duration:0.55, ease:'power3.out' });
}
function closeCart(){
  cartScrim.classList.remove('open');
  gsap.to(cartPanel, { x: '100%', duration:0.45, ease:'power2.in' });
}
document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
cartScrim.addEventListener('click', closeCart);

function addToCart(toy){
  cart.push(toy);
  updateCartUI();
  showToast(toy.name + ' added to cart 🎉');
  bounceIcon(document.getElementById('cartBtn'));
}
function removeFromCart(idx){
  cart.splice(idx,1);
  updateCartUI();
}
function activeBundle(){
  const ids = cart.map(t=>t.id);
  for(const b of BUNDLES){
    if(b.ids.every(id => ids.includes(id))) return b;
  }
  return null;
}
function updateCartUI(){
  cartBadge.style.display = cart.length ? 'flex' : 'none';
  cartBadge.textContent = cart.length;

  if(!cart.length){
    cartItemsEl.innerHTML = '<div class="cart-empty">Your shelf is empty — go bounce around the shop!</div>';
  } else {
    cartItemsEl.innerHTML = cart.map((t,i)=>`
      <div class="cart-row">
        <div class="cart-swatch" style="background:#${t.color.toString(16).padStart(6,'0')}"></div>
        <div class="cart-info"><div class="n">${t.name}</div><div class="p">$${t.price}</div></div>
        <button class="cart-remove" data-idx="${i}" aria-label="Remove">✕</button>
      </div>`).join('');
  }
  cartItemsEl.querySelectorAll('.cart-remove').forEach(b=>{
    b.addEventListener('click', ()=> removeFromCart(parseInt(b.dataset.idx)));
  });

  let subtotal = cart.reduce((s,t)=>s+t.price,0);
  const bundle = activeBundle();
  if(bundle){
    const off = subtotal * bundle.discount;
    subtotal -= off;
    bundleSlot.innerHTML = `<div class="bundle-banner">🎁 ${bundle.label} unlocked — ${Math.round(bundle.discount*100)}% off applied!</div>`;
  } else {
    bundleSlot.innerHTML = cart.length>=3 ? '<div class="bundle-banner">✨ One more distinct pair away from a bundle deal!</div>' : '';
  }
  cartTotalEl.textContent = '$' + subtotal.toFixed(2);
}

/* Wishlist */
function toggleWishlist(toyId){
  const idx = wishlist.indexOf(toyId);
  if(idx>-1){ wishlist.splice(idx,1); } else { wishlist.push(toyId); }
  wishBadge.style.display = wishlist.length ? 'flex' : 'none';
  wishBadge.textContent = wishlist.length;
  document.getElementById('wishToggleBtn').textContent = wishlist.includes(toyId) ? '♥' : '♡';
}

document.getElementById('addToCartBtn').addEventListener('click', ()=>{
  if(selectedMesh) addToCart(selectedMesh.userData.toy);
});
document.getElementById('wishToggleBtn').addEventListener('click', ()=>{
  if(selectedMesh) toggleWishlist(selectedMesh.userData.toy.id);
});
document.getElementById('wishlistBtn').addEventListener('click', ()=>{
  showToast(wishlist.length ? wishlist.length + ' toy(s) saved for later 💛' : 'Your wishlist is empty so far');
});

/* =========================================================
   GIFT FINDER QUIZ
========================================================= */
const quizScrim = document.getElementById('quizScrim');
const quizBody = document.getElementById('quizBody');
let quizAnswers = {};

const QUIZ_STEPS = [
  { label:'Step 1 of 2', q:'Who are you buying for?', key:'age',
    opts:[ {label:'A toddler (0–3)', val:'0-3'}, {label:'A kid (4–7)', val:'4-7'}, {label:'A preteen (8–12+)', val:'8-12'} ] },
  { label:'Step 2 of 2', q:'What are they into lately?', key:'tag',
    opts:[ {label:'🏃 Always moving', val:'active'}, {label:'🎨 Making things', val:'creative'}, {label:'🤖 Gadgets & buttons', val:'tech'}, {label:'🧸 Soft & snuggly', val:'cuddly'} ] },
];
let quizStep = 0;

function openQuiz(){
  quizStep = 0; quizAnswers = {};
  renderQuizStep();
  quizScrim.classList.add('open');
}
function closeQuiz(){ quizScrim.classList.remove('open'); }
function renderQuizStep(){
  const step = QUIZ_STEPS[quizStep];
  quizBody.innerHTML = `
    <div class="quiz-step-label">${step.label}</div>
    <div class="quiz-q">${step.q}</div>
    <div class="quiz-opts">${step.opts.map(o=>`<button class="quiz-opt" data-val="${o.val}">${o.label}</button>`).join('')}</div>
  `;
  quizBody.querySelectorAll('.quiz-opt').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      quizAnswers[step.key] = btn.dataset.val;
      if(quizStep < QUIZ_STEPS.length-1){ quizStep++; renderQuizStep(); }
      else finishQuiz();
    });
  });
}
function finishQuiz(){
  closeQuiz();
  currentFilterAge = quizAnswers.age || 'all';
  currentTagFilter = quizAnswers.tag || null;
  document.querySelectorAll('#ageFilters .chip').forEach(c=>{
    c.classList.toggle('active', c.dataset.age === currentFilterAge);
  });
  goShop();
  layoutShopGrid(passesFilter);
  showToast('Picked a few favorites just for them ✨');
}
document.getElementById('openQuizBtn').addEventListener('click', openQuiz);
document.getElementById('quizCloseBtn').addEventListener('click', closeQuiz);
quizScrim.addEventListener('click', (e)=>{ if(e.target === quizScrim) closeQuiz(); });

/* =========================================================
   TOAST + misc utils
========================================================= */
const toastEl = document.getElementById('toast');
let toastTween;
function showToast(msg){
  toastEl.textContent = msg;
  if(toastTween) toastTween.kill();
  gsap.set(toastEl, { opacity:1, y:0 });
  toastTween = gsap.timeline()
    .to(toastEl, { y:0, opacity:1, duration:0.3, ease:'back.out(2)' })
    .to(toastEl, { opacity:0, y:-10, duration:0.4, delay:1.6, ease:'power2.in' });
}
function bounceIcon(el){
  gsap.fromTo(el, { scale:1 }, { scale:1.25, duration:0.18, yoyo:true, repeat:1, ease:'power1.inOut' });
}

/* =========================================================
   RENDER LOOP
========================================================= */
const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  toyMeshes.forEach(m=>{
    if(!m.visible) return;
    const isSelected = (m === selectedMesh);
    m.position.y = m.userData.baseY + Math.sin(t*m.userData.floatSpeed + m.userData.floatOffset) * (state==='home' ? 0.18 : 0.1);
    if(!isSelected){
      m.rotation.y += 0.0035 * (state==='home' ? 1.4 : 0.6);
    }
  });

  rimLight.position.x = Math.sin(t*0.2)*6;
  fillLight.position.x = Math.cos(t*0.15)*6;

  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* Init */
layoutHomeCluster();
goHome();

})();