(function(){
'use strict';

var $ = function(s,el){ return (el||document).querySelector(s); };
var RAD = Math.PI/180;
var TAPE = 0xf2c00e;

/* ------------------------------------------------------------------ */
/* Aviso rápido                                                        */
/* ------------------------------------------------------------------ */
var toastT;
function toast(msg){
  var t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(function(){ t.classList.remove('show'); }, 4500);
}

if(!window.THREE){
  $('#welcome').innerHTML = '<div class="card"><h1>No se pudo cargar el motor 3D</h1><p>Comprueba tu conexión y recarga la página.</p></div>';
  return;
}

/* ------------------------------------------------------------------ */
/* Modelos de muebles (medidas en metros; frente hacia +Z)             */
/* ------------------------------------------------------------------ */
function box(g,sx,sy,sz,px,py,pz,mat,cast){
  if(sx<=0||sy<=0||sz<=0) return null;
  var m = new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
  m.position.set(px,py+sy/2,pz);
  m.castShadow = cast!==false; m.receiveShadow = true;
  g.add(m); return m;
}
var CORNERS = [[-1,-1],[1,-1],[-1,1],[1,1]];

function buildSofa(g,w,d,h,M){
  var leg=Math.min(0.1,h*0.14), seat=h*0.5, backT=Math.min(d*0.24,0.28), arm=Math.min(w*0.11,0.2);
  box(g,w,seat-leg,d,0,leg,0,M.main);
  box(g,w,h-leg,backT,0,leg,-d/2+backT/2,M.main);
  [-1,1].forEach(function(s){ box(g,arm,h*0.68-leg,d-backT,s*(w/2-arm/2),leg,backT/2,M.main); });
  var cw=(w-2*arm)/2, cd=d-backT-0.02;
  [-1,1].forEach(function(s){
    box(g,cw-0.01,h*0.12,cd,s*cw/2,seat,backT/2,M.soft);
    box(g,cw-0.02,h*0.28,backT*0.55,s*cw/2,seat+h*0.05,-d/2+backT+backT*0.275,M.soft);
  });
  CORNERS.forEach(function(c){ box(g,0.05,leg,0.05,c[0]*(w/2-0.06),0,c[1]*(d/2-0.06),M.accent); });
}
function buildBed(g,w,d,h,M){
  var leg=Math.min(0.14,h*0.16), frame=Math.min(0.28,h*0.22), mat=Math.min(0.24,h*0.2);
  box(g,w,h,0.06,0,0,-d/2+0.03,M.accent);
  box(g,w,frame,d-0.06,0,leg,0.03,M.accent);
  box(g,w*0.96,mat,d-0.1,0,leg+frame,0.05,M.light);
  var top=leg+frame+mat, pd=Math.min(0.4,d*0.2);
  [-1,1].forEach(function(s){ box(g,w*0.4,0.1,pd,s*w*0.23,top,-d/2+0.06+pd/2+0.03,M.light); });
  var bl=(d-0.06)*0.55;
  box(g,w*0.98,0.035,bl,0,top,d/2-bl/2-0.02,M.main);
}
function buildTable(g,w,d,h,M,shelf){
  var t=Math.min(0.04,h*0.12), lw=Math.min(0.07,w*0.15,d*0.15);
  box(g,w,t,d,0,h-t,0,M.main);
  var ix=w/2-lw/2-0.03, iz=d/2-lw/2-0.03;
  CORNERS.forEach(function(c){ box(g,lw,h-t,lw,c[0]*ix,0,c[1]*iz,M.accent); });
  if(shelf) box(g,w*0.85,0.02,d*0.8,0,h*0.25,0,M.accent);
}
function buildChair(g,w,d,h,M){
  var seatY=h*0.5, t=0.05, lw=Math.min(0.045,w*0.12);
  box(g,w,t,d,0,seatY-t,0,M.main);
  box(g,w,h-seatY,0.04,0,seatY,-d/2+0.02,M.main);
  CORNERS.forEach(function(c){ box(g,lw,seatY-t,lw,c[0]*(w/2-lw/2),0,c[1]*(d/2-lw/2),M.accent); });
}
function buildWardrobe(g,w,d,h,M){
  var base=Math.min(0.06,h*0.05);
  box(g,w*0.97,base,d*0.94,0,0,0,M.accent);
  box(g,w,h-base,d,0,base,0,M.main);
  box(g,0.008,h-base-0.06,0.006,0,base+0.03,d/2+0.003,M.accent);
  [-1,1].forEach(function(s){ box(g,0.016,Math.min(0.2,h*0.12),0.02,s*0.05,h*0.5,d/2+0.01,M.accent); });
}
function buildShelf(g,w,d,h,M){
  var t=Math.min(0.025,w*0.1);
  [-1,1].forEach(function(s){ box(g,t,h,d,s*(w/2-t/2),0,0,M.main); });
  box(g,w-2*t,h,0.012,0,0,-d/2+0.006,M.accent);
  var n=Math.max(2,Math.round(h/0.38));
  for(var i=0;i<=n;i++){ box(g,w-2*t,t,d,0,i*(h-t)/n,0,M.main); }
}
function buildDesk(g,w,d,h,M){
  var t=Math.min(0.03,h*0.1), lp=Math.min(0.03,w*0.05), dw=Math.min(w*0.3,0.45);
  box(g,w,t,d,0,h-t,0,M.main);
  box(g,lp,h-t,d*0.92,-(w/2-lp/2-0.02),0,0,M.accent);
  box(g,dw,h-t,d*0.92,w/2-dw/2-0.02,0,0,M.main);
  [0.2,0.5,0.8].forEach(function(f){ box(g,dw*0.3,0.015,0.02,w/2-dw/2-0.02,(h-t)*f,d*0.46+0.01,M.accent); });
}
function buildRug(g,w,d,h,M){
  box(g,w,h,d,0,0,0,M.main,false);
  box(g,w*0.84,h+0.002,d*0.82,0,0,0,M.soft,false);
}
function buildTv(g,w,d,h,M){
  var leg=Math.min(0.14,h*0.28);
  box(g,w,h-leg,d,0,leg,0,M.main);
  box(g,0.008,h-leg-0.04,0.006,0,leg+0.02,d/2+0.003,M.accent);
  box(g,0.008,h-leg-0.04,0.006,w/4,leg+0.02,d/2+0.003,M.accent);
  box(g,0.008,h-leg-0.04,0.006,-w/4,leg+0.02,d/2+0.003,M.accent);
  CORNERS.forEach(function(c){ box(g,0.04,leg,0.04,c[0]*(w/2-0.06),0,c[1]*(d/2-0.06),M.accent); });
}

var IC = function(p){ return '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>'; };
var CATALOG = [
  {id:'sofa',name:'Sofá',dim:{w:200,d:90,h:85},main:'#7E9C86',accent:'#2F3033',build:buildSofa,
   icon:IC('<path d="M6 14v-3a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v3"/><path d="M4 17a2 2 0 0 1 4 0v2h16v-2a2 2 0 0 1 4 0v6H4z"/><path d="M8 23v2M24 23v2"/>')},
  {id:'cama',name:'Cama',dim:{w:160,d:200,h:100},main:'#5D7B99',accent:'#A67B4F',build:buildBed,
   icon:IC('<path d="M5 25V8"/><path d="M5 20h22v5"/><path d="M27 20v-3a3 3 0 0 0-3-3H13v6"/><rect x="8" y="14" width="4" height="3" rx="1"/>')},
  {id:'mesa',name:'Mesa',dim:{w:140,d:80,h:75},main:'#D8B98A',accent:'#5E4433',build:function(g,w,d,h,M){buildTable(g,w,d,h,M,false);},
   icon:IC('<path d="M5 12h22"/><path d="M8 12v13M24 12v13"/><path d="M5 12l1.5-3h19L27 12"/>')},
  {id:'silla',name:'Silla',dim:{w:45,d:50,h:90},main:'#A67B4F',accent:'#2F3033',build:buildChair,
   icon:IC('<path d="M11 6v11h11"/><path d="M11 17h11v3H11z"/><path d="M12 20v6M21 20v6"/>')},
  {id:'armario',name:'Armario',dim:{w:120,d:55,h:210},main:'#EDEBE6',accent:'#3A3A3C',build:buildWardrobe,
   icon:IC('<rect x="7" y="5" width="18" height="22" rx="1.5"/><path d="M16 5v22"/><path d="M13 16v2M19 16v2"/>')},
  {id:'estanteria',name:'Estantería',dim:{w:80,d:30,h:180},main:'#A67B4F',accent:'#EDEBE6',build:buildShelf,
   icon:IC('<rect x="7" y="5" width="18" height="22" rx="1.5"/><path d="M7 12h18M7 19h18"/>')},
  {id:'escritorio',name:'Escritorio',dim:{w:120,d:60,h:75},main:'#D8B98A',accent:'#2F3033',build:buildDesk,
   icon:IC('<path d="M4 11h24"/><path d="M6 11v14M26 11v14"/><rect x="18" y="11" width="8" height="8"/>')},
  {id:'centro',name:'Mesa de centro',dim:{w:90,d:50,h:40},main:'#5E4433',accent:'#2F3033',build:function(g,w,d,h,M){buildTable(g,w,d,h,M,true);},
   icon:IC('<ellipse cx="16" cy="13" rx="10" ry="3.5"/><path d="M8 15v8M24 15v8M16 16.5v8"/>')},
  {id:'alfombra',name:'Alfombra',dim:{w:200,d:140,h:2},minH:1,main:'#9DA3A8',accent:'#2F3033',build:buildRug,
   icon:IC('<path d="M8 10h19l-3 12H5z"/><path d="M11 13h13l-2 6H8z"/>')},
  {id:'tv',name:'Mueble TV',dim:{w:150,d:40,h:50},main:'#5E4433',accent:'#2F3033',build:buildTv,
   icon:IC('<rect x="9" y="5" width="14" height="9" rx="1"/><path d="M5 18h22v5H5z"/><path d="M9 23v3M23 23v3"/>')}
];
var SWATCHES = [
  ['#D8B98A','Arce'],['#A67B4F','Roble'],['#5E4433','Nogal'],['#EDEBE6','Blanco'],
  ['#9DA3A8','Gris'],['#7E9C86','Salvia'],['#5D7B99','Azul'],['#2F3033','Grafito']
];
var LABEL = {w:'Ancho',d:'Fondo',h:'Alto'};
function lim(it,k){ return k==='h' ? {min:it.def.minH||5,max:400} : {min:5,max:500}; }
function fmt(v){ return String(Math.round(v*10)/10); }
function clamp(v,a,b){ return Math.min(b,Math.max(a,v)); }

/* ------------------------------------------------------------------ */
/* Escena 3D                                                           */
/* ------------------------------------------------------------------ */
var stage = $('#stage'), canvas = $('#gl'), labelsEl = $('#labels'), backdrop = $('#backdrop'), cam = $('#cam');
var renderer;
try{
  renderer = new THREE.WebGLRenderer({canvas:canvas,alpha:true,antialias:true});
}catch(e){
  $('#welcome').innerHTML = '<div class="card"><h1>Tu navegador no admite gráficos 3D</h1><p>Prueba con la última versión de Chrome, Safari o Firefox.</p></div>';
  return;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setClearColor(0x000000,0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(65,1,0.05,200);
scene.add(new THREE.HemisphereLight(0xffffff,0x8d8d8d,0.95));
var sun = new THREE.DirectionalLight(0xffffff,0.75);
sun.position.set(3,6,4); sun.castShadow = true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-8; sun.shadow.camera.right=8; sun.shadow.camera.top=8; sun.shadow.camera.bottom=-8;
sun.shadow.camera.near=0.5; sun.shadow.camera.far=24; sun.shadow.bias=-0.0006;
scene.add(sun);

var shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(60,60),new THREE.ShadowMaterial({opacity:0.32}));
shadowFloor.rotation.x = -Math.PI/2; shadowFloor.receiveShadow = true; scene.add(shadowFloor);

var grid = new THREE.GridHelper(20,20,0xffffff,0xffffff);
grid.material.transparent = true; grid.material.opacity = 0.32; grid.material.depthWrite = false;
grid.position.y = 0.003; scene.add(grid);

var selMat = new THREE.LineBasicMaterial({color:TAPE,depthTest:false,transparent:true});
var barMat = new THREE.MeshBasicMaterial({color:TAPE,depthTest:false,transparent:true});
var floorPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
var raycaster = new THREE.Raycaster();

/* Estado */
var cfg = {h:140,fov:65,grid:true,measure:'sel'};
var view = {yaw:0,pitch:40};
var items = [], uid = 1, selected = null, lock = false, baseDim = null;
var SW = 1, SH = 1;

/* ------------------------------------------------------------------ */
/* Muebles                                                             */
/* ------------------------------------------------------------------ */
function makeMats(it){
  var c = new THREE.Color(it.color); var soft = c.clone(); soft.offsetHSL(0,0,0.07);
  return {
    main:new THREE.MeshStandardMaterial({color:c,roughness:0.85}),
    soft:new THREE.MeshStandardMaterial({color:soft,roughness:0.95}),
    accent:new THREE.MeshStandardMaterial({color:new THREE.Color(it.def.accent),roughness:0.6,metalness:0.05}),
    light:new THREE.MeshStandardMaterial({color:0xf1efe9,roughness:0.95})
  };
}
function disposeTree(o){
  o.traverse(function(c){
    if(c.geometry) c.geometry.dispose();
    if(c.material){ (Array.isArray(c.material)?c.material:[c.material]).forEach(function(m){ m.dispose(); }); }
  });
}
function bar(g,a,b){
  var dir = new THREE.Vector3().subVectors(b,a), len = dir.length();
  if(len<1e-4) return;
  var m = new THREE.Mesh(new THREE.BoxGeometry(0.012,0.012,len),barMat);
  m.position.copy(a).addScaledVector(dir,0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir.normalize());
  m.renderOrder = 10; g.add(m);
}
function tick(g,p){
  var m = new THREE.Mesh(new THREE.BoxGeometry(0.03,0.03,0.03),barMat);
  m.position.copy(p); m.renderOrder = 10; g.add(m);
}
function buildOverlay(it){
  if(it.overlay){ it.group.remove(it.overlay); it.overlay.traverse(function(c){ if(c.geometry) c.geometry.dispose(); }); }
  var w = it.dim.w/100, d = it.dim.d/100, h = it.dim.h/100;
  var o = new THREE.Group(), sel = new THREE.Group(), dims = new THREE.Group();
  var ln = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d)),selMat);
  ln.position.y = h/2; ln.renderOrder = 9; sel.add(ln);
  var off = 0.1, y0 = 0.012, V = function(x,y,z){ return new THREE.Vector3(x,y,z); };
  var A=V(-w/2,y0,d/2+off), B=V(w/2,y0,d/2+off);
  bar(dims,A,B); tick(dims,A); tick(dims,B);
  var C=V(w/2+off,y0,-d/2), D=V(w/2+off,y0,d/2);
  bar(dims,C,D); tick(dims,C); tick(dims,D);
  var E=V(w/2+off,0.005,d/2+off), F=V(w/2+off,h,d/2+off);
  bar(dims,E,F); tick(dims,E); tick(dims,F);
  o.add(sel); o.add(dims);
  it.overlay = o; it.selG = sel; it.dimsG = dims;
  it.anchors = {w:V(0,y0,d/2+off),d:V(w/2+off,y0,0),h:V(w/2+off,h/2,d/2+off)};
  it.group.add(o);
  applyVisibility(it);
}
function refreshChips(it){
  ['w','d','h'].forEach(function(k){ it.chips[k].textContent = fmt(it.dim[k])+' cm'; });
}
function rebuild(it){
  if(it.model){ it.group.remove(it.model); disposeTree(it.model); }
  var g = new THREE.Group(); g.userData.itemId = it.id;
  it.def.build(g,it.dim.w/100,it.dim.d/100,it.dim.h/100,makeMats(it));
  it.model = g; it.group.add(g);
  buildOverlay(it); refreshChips(it);
}
function applyVisibility(it){
  if(!it.selG) return;
  it.selG.visible = (it===selected);
  it.dimsG.visible = cfg.measure==='all' || (cfg.measure==='sel' && it===selected);
}
function setRot(it,deg){
  it.rot = ((deg%360)+360)%360;
  it.group.rotation.y = -it.rot*RAD;
}
function setPos(it,x,z){
  it.group.position.set(clamp(x,-12,12),0,clamp(z,-12,12));
}
function addItem(type,x,z,o){
  o = o||{};
  var def = CATALOG.filter(function(c){ return c.id===type; })[0];
  if(!def) return null;
  var it = {id:uid++,type:type,def:def,dim:{w:def.dim.w,d:def.dim.d,h:def.dim.h},color:def.main,rot:0,group:new THREE.Group(),chips:{}};
  if(o.dim){ ['w','d','h'].forEach(function(k){ var v=Number(o.dim[k]); if(isFinite(v)){ var l=lim(it,k); it.dim[k]=clamp(v,l.min,l.max); } }); }
  if(typeof o.color==='string' && /^#[0-9a-f]{6}$/i.test(o.color)) it.color = o.color;
  setPos(it,x,z); setRot(it,Number(o.rot)||0);
  scene.add(it.group); items.push(it);
  ['w','d','h'].forEach(function(k){
    var c = document.createElement('button');
    c.type='button'; c.className='chip'; c.hidden=true;
    c.setAttribute('aria-label','Editar '+LABEL[k].toLowerCase()+' de '+def.name);
    c.addEventListener('click',function(){ focusDim(it,k); });
    labelsEl.appendChild(c); it.chips[k]=c;
  });
  rebuild(it);
  if(!o.silent){ select(it); save(); }
  return it;
}
function removeItem(it){
  scene.remove(it.group);
  disposeTree(it.model);
  it.overlay.traverse(function(c){ if(c.geometry) c.geometry.dispose(); });
  ['w','d','h'].forEach(function(k){ it.chips[k].remove(); });
  items.splice(items.indexOf(it),1);
  if(selected===it) selected = null;
  syncPanel(); save();
}
function select(it){
  selected = it;
  items.forEach(applyVisibility);
  syncPanel();
}

/* ------------------------------------------------------------------ */
/* Panel de propiedades                                                */
/* ------------------------------------------------------------------ */
var panel = $('#panel'), inputs = {w:$('#inW'),d:$('#inD'),h:$('#inH')};
var msg = $('#dimMsg'), rotEl = $('#rot'), rotOut = $('#rotOut'), swsEl = $('#sws');

SWATCHES.forEach(function(s){
  var b = document.createElement('button');
  b.type='button'; b.className='sw'; b.style.background=s[0]; b.dataset.c=s[0];
  b.setAttribute('role','radio'); b.setAttribute('aria-label',s[1]); b.setAttribute('aria-checked','false');
  b.addEventListener('click',function(){ if(!selected) return; selected.color=s[0]; rebuild(selected); syncPanel(); save(); });
  swsEl.appendChild(b);
});

function updateInputs(){
  if(!selected) return;
  ['w','d','h'].forEach(function(k){
    if(document.activeElement!==inputs[k]) inputs[k].value = fmt(selected.dim[k]);
  });
}
function renderList(){
  var ul = $('#list'); ul.innerHTML = '';
  items.forEach(function(it){
    var li = document.createElement('li'), b = document.createElement('button');
    b.type='button'; b.className='row';
    b.innerHTML = '<b></b><span></span>';
    b.firstChild.textContent = it.def.name;
    b.lastChild.textContent = fmt(it.dim.w)+' × '+fmt(it.dim.d)+' × '+fmt(it.dim.h)+' cm';
    b.addEventListener('click',function(){ select(it); });
    li.appendChild(b); ul.appendChild(li);
  });
}
function syncPanel(){
  var has = items.length>0;
  panel.hidden = !has;
  $('#hintwrap').hidden = has;
  $('#viewItem').hidden = !selected;
  $('#viewEmpty').hidden = !!selected;
  if(!has) return;
  if(!selected){ renderList(); return; }
  $('#itemName').textContent = selected.def.name;
  updateInputs();
  rotEl.value = Math.round(selected.rot); rotOut.textContent = Math.round(selected.rot)+'°';
  Array.prototype.forEach.call(swsEl.children,function(b){
    b.setAttribute('aria-checked', b.dataset.c.toLowerCase()===selected.color.toLowerCase() ? 'true' : 'false');
  });
}
function focusDim(it,k){
  if(selected!==it) select(it);
  panel.classList.remove('collapsed');
  $('#collapse').setAttribute('aria-expanded','true');
  inputs[k].focus(); inputs[k].select();
}

['w','d','h'].forEach(function(k){
  var el = inputs[k];
  el.addEventListener('focus',function(){ if(selected) baseDim = {w:selected.dim.w,d:selected.dim.d,h:selected.dim.h}; });
  el.addEventListener('blur',function(){ baseDim = null; if(selected){ el.value = fmt(selected.dim[k]); el.classList.remove('bad'); msg.textContent=''; } });
  el.addEventListener('input',function(){
    if(!selected) return;
    var raw = el.value.replace(',','.');
    var v = parseFloat(raw);
    var l = lim(selected,k);
    if(!isFinite(v) || v<l.min || v>l.max){
      el.classList.add('bad');
      msg.textContent = LABEL[k]+': entre '+l.min+' y '+l.max+' cm';
      return;
    }
    el.classList.remove('bad'); msg.textContent = '';
    var base = baseDim || {w:selected.dim.w,d:selected.dim.d,h:selected.dim.h};
    if(lock && base[k]>0){
      var f = v/base[k];
      ['w','d','h'].forEach(function(kk){
        var ll = lim(selected,kk);
        selected.dim[kk] = clamp(Math.round(base[kk]*f*10)/10,ll.min,ll.max);
      });
    }
    selected.dim[k] = v;
    rebuild(selected); updateInputs(); save();
  });
  el.addEventListener('keydown',function(e){ if(e.key==='Enter') el.blur(); });
});

$('#lock').addEventListener('click',function(){
  lock = !lock; this.setAttribute('aria-pressed',String(lock));
});
rotEl.addEventListener('input',function(){
  if(!selected) return; setRot(selected,parseFloat(rotEl.value)||0);
  rotOut.textContent = Math.round(selected.rot)+'°'; save();
});
function rotateBy(deg){
  if(!selected) return; setRot(selected,selected.rot+deg);
  rotEl.value = Math.round(selected.rot); rotOut.textContent = Math.round(selected.rot)+'°'; save();
}
$('#rotL').addEventListener('click',function(){ rotateBy(-15); });
$('#rotR').addEventListener('click',function(){ rotateBy(15); });
$('#dup').addEventListener('click',function(){
  if(!selected) return;
  var s = selected;
  addItem(s.type,s.group.position.x+0.5,s.group.position.z+0.3,{dim:s.dim,color:s.color,rot:s.rot});
});
$('#reset').addEventListener('click',function(){
  if(!selected) return;
  selected.dim = {w:selected.def.dim.w,d:selected.def.dim.d,h:selected.def.dim.h};
  rebuild(selected); updateInputs(); msg.textContent=''; save();
});
$('#del').addEventListener('click',function(){ if(selected) removeItem(selected); });
$('#closeItem').addEventListener('click',function(){ select(null); });
$('#collapse').addEventListener('click',function(){
  var c = panel.classList.toggle('collapsed');
  this.setAttribute('aria-expanded',String(!c));
  this.setAttribute('aria-label',c?'Ampliar panel':'Contraer panel');
  this.textContent = c ? '⌃' : '⌄';
});

/* ------------------------------------------------------------------ */
/* Cámara virtual, giroscopio y ajustes                                */
/* ------------------------------------------------------------------ */
var euler = new THREE.Euler(0,0,0,'YXZ');
var gyro = {on:false,got:false,yaw0:null,q:new THREE.Quaternion()};
var q1 = new THREE.Quaternion(-Math.SQRT1_2,0,0,Math.SQRT1_2), q0 = new THREE.Quaternion(), zee = new THREE.Vector3(0,0,1), eu = new THREE.Euler();

function applyCamera(){
  camera.position.set(0,cfg.h/100,0);
  if(gyro.on && gyro.got && gyro.yaw0!==null){
    euler.setFromQuaternion(gyro.q,'YXZ'); euler.y -= gyro.yaw0;
    camera.quaternion.setFromEuler(euler);
  }else{
    euler.set(-view.pitch*RAD,view.yaw,0,'YXZ');
    camera.quaternion.setFromEuler(euler);
  }
  camera.updateMatrixWorld(true);
}
function onOrient(e){
  if(e.alpha==null||e.beta==null) return;
  gyro.got = true;
  var o = ((screen.orientation&&screen.orientation.angle)||window.orientation||0)*RAD;
  eu.set((e.beta||0)*RAD,(e.alpha||0)*RAD,-(e.gamma||0)*RAD,'YXZ');
  gyro.q.setFromEuler(eu); gyro.q.multiply(q1); gyro.q.multiply(q0.setFromAxisAngle(zee,-o));
  if(gyro.yaw0===null){
    var t = new THREE.Euler().setFromQuaternion(gyro.q,'YXZ');
    gyro.yaw0 = t.y - view.yaw;
  }
}
var bGyro = $('#bGyro');
function setGyro(on){
  if(!on){
    window.removeEventListener('deviceorientation',onOrient);
    gyro.on = false; bGyro.setAttribute('aria-pressed','false'); $('#sP').disabled = false;
    return Promise.resolve();
  }
  var ask = Promise.resolve('granted');
  try{
    if(typeof DeviceOrientationEvent!=='undefined' && typeof DeviceOrientationEvent.requestPermission==='function'){
      ask = DeviceOrientationEvent.requestPermission();
    }
  }catch(e){ ask = Promise.reject(e); }
  return ask.then(function(r){
    if(r!=='granted'){ toast('Permiso de movimiento denegado. Actívalo en los ajustes del navegador.'); return; }
    gyro.got = false; gyro.yaw0 = null; gyro.on = true;
    window.addEventListener('deviceorientation',onOrient);
    bGyro.setAttribute('aria-pressed','true'); $('#sP').disabled = true;
    setTimeout(function(){
      if(gyro.on && !gyro.got){
        toast('Este dispositivo no envía datos de movimiento. Arrastra sobre la imagen para girar la vista.');
        setGyro(false);
      }
    },1800);
  }).catch(function(){ toast('No se pudo activar el giroscopio en este navegador.'); });
}
bGyro.addEventListener('click',function(){ setGyro(!gyro.on); });

/* Ajustes */
var sH=$('#sH'), sP=$('#sP'), sF=$('#sF');
function syncSettings(){
  sH.value = cfg.h; sF.value = cfg.fov; sP.value = Math.round(view.pitch);
  $('#oH').textContent = cfg.h+' cm'; $('#oF').textContent = cfg.fov+'°'; $('#oP').textContent = Math.round(view.pitch)+'°';
  camera.fov = cfg.fov; camera.updateProjectionMatrix();
  grid.visible = cfg.grid;
  $('#bGrid').setAttribute('aria-pressed',String(cfg.grid));
}
sH.addEventListener('input',function(){ cfg.h = parseInt(sH.value,10); syncSettings(); save(); });
sF.addEventListener('input',function(){ cfg.fov = parseInt(sF.value,10); syncSettings(); save(); });
sP.addEventListener('input',function(){ view.pitch = parseInt(sP.value,10); syncSettings(); });
$('#sReset').addEventListener('click',function(){ cfg.h=140; cfg.fov=65; view.pitch=40; syncSettings(); save(); });
$('#bSet').addEventListener('click',function(){
  var pop = $('#settings'); pop.hidden = !pop.hidden;
  this.setAttribute('aria-pressed',String(!pop.hidden));
});
$('#bGrid').addEventListener('click',function(){ cfg.grid = !cfg.grid; syncSettings(); save(); });

var MODES = ['sel','all','off'];
var MODE_TXT = {sel:'Medidas: selección',all:'Medidas: todas',off:'Medidas: ocultas'};
function syncMeasure(){
  $('#tMeasure').textContent = MODE_TXT[cfg.measure];
  $('#bMeasure').setAttribute('aria-pressed',String(cfg.measure!=='off'));
  items.forEach(applyVisibility);
}
$('#bMeasure').addEventListener('click',function(){
  cfg.measure = MODES[(MODES.indexOf(cfg.measure)+1)%MODES.length];
  syncMeasure(); save();
});

/* ------------------------------------------------------------------ */
/* Fondo: cámara, foto o habitación de muestra                         */
/* ------------------------------------------------------------------ */
var bgMode = 'none', stream = null;
function setBg(mode){
  bgMode = mode;
  cam.classList.toggle('on',mode==='cam');
  backdrop.classList.toggle('has-photo',mode==='photo');
  if(mode!=='photo') backdrop.style.backgroundImage = '';
  if(mode!=='cam' && stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream=null; cam.srcObject=null; }
  $('#bCam').setAttribute('aria-pressed',String(mode==='cam'));
  if(mode!=='none') backdrop.style.removeProperty('--hz');
}
function startCamera(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    toast('Este navegador no permite abrir la cámara aquí. Usa una foto de la habitación.');
    return Promise.resolve(false);
  }
  return navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false})
    .then(function(s){
      if(stream) stream.getTracks().forEach(function(t){ t.stop(); });
      stream = s; cam.srcObject = s; setBg('cam');
      var p = cam.play(); if(p&&p.catch) p.catch(function(){});
      return true;
    })
    .catch(function(err){
      var denied = err && (err.name==='NotAllowedError' || err.name==='SecurityError');
      toast(denied ? 'No hay permiso para usar la cámara. Actívalo en el navegador o usa una foto de la habitación.'
                   : 'No se pudo abrir la cámara. Usa una foto de la habitación.');
      return false;
    });
}
$('#bCam').addEventListener('click',function(){
  if(bgMode==='cam') setBg('none'); else startCamera();
});
var fileEl = $('#file');
function pickPhoto(){ fileEl.click(); }
$('#bPhoto').addEventListener('click',pickPhoto);
$('#wPhoto').addEventListener('click',pickPhoto);
fileEl.addEventListener('change',function(){
  var f = fileEl.files && fileEl.files[0]; if(!f) return;
  var r = new FileReader();
  r.onload = function(){
    setBg('photo'); backdrop.style.backgroundImage = 'url("'+r.result+'")';
    closeWelcome();
  };
  r.onerror = function(){ toast('No se pudo leer la foto.'); };
  r.readAsDataURL(f); fileEl.value = '';
});
function closeWelcome(){ $('#welcome').hidden = true; }
$('#wCam').addEventListener('click',function(){ startCamera().then(function(ok){ if(ok) closeWelcome(); }); });
$('#wSkip').addEventListener('click',closeWelcome);

function updateHorizon(){
  if(bgMode!=='none') return;
  var d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0;
  var hz = 0;
  if(d.lengthSq()>1e-6){
    d.normalize().multiplyScalar(200);
    var p = new THREE.Vector3(camera.position.x+d.x,camera.position.y,camera.position.z+d.z).project(camera);
    hz = clamp((1-p.y)/2*100,-5,105);
  }
  backdrop.style.setProperty('--hz',hz.toFixed(1)+'%');
}

/* ------------------------------------------------------------------ */
/* Interacción con la vista                                            */
/* ------------------------------------------------------------------ */
var tmp = new THREE.Vector3();
function ndcFrom(cx,cy){
  var r = canvas.getBoundingClientRect();
  return new THREE.Vector2(((cx-r.left)/r.width)*2-1,-(((cy-r.top)/r.height)*2-1));
}
function floorAt(cx,cy){
  raycaster.setFromCamera(ndcFrom(cx,cy),camera);
  var hit = raycaster.ray.intersectPlane(floorPlane,tmp);
  if(!hit) return null;
  if(hit.length()>30) return null;
  return {x:hit.x,z:hit.z};
}
function aheadPoint(dist){
  var d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0;
  if(d.lengthSq()<1e-6) d.set(0,0,-1);
  d.normalize().multiplyScalar(dist);
  return {x:camera.position.x+d.x,z:camera.position.z+d.z};
}
function pick(cx,cy){
  raycaster.setFromCamera(ndcFrom(cx,cy),camera);
  var hits = raycaster.intersectObjects(items.map(function(i){ return i.model; }),true);
  if(!hits.length) return null;
  var o = hits[0].object;
  while(o && !o.userData.itemId) o = o.parent;
  if(!o) return null;
  return items.filter(function(i){ return i.id===o.userData.itemId; })[0] || null;
}

var drag = null;
canvas.addEventListener('pointerdown',function(e){
  if(!e.isPrimary) return;
  try{ canvas.setPointerCapture(e.pointerId); }catch(_){}
  var hit = pick(e.clientX,e.clientY);
  drag = {id:e.pointerId,sx:e.clientX,sy:e.clientY,lx:e.clientX,ly:e.clientY,moved:false,item:hit,ox:0,oz:0};
  if(hit){
    select(hit);
    var p = floorAt(e.clientX,e.clientY);
    if(p){ drag.ox = hit.group.position.x-p.x; drag.oz = hit.group.position.z-p.z; }
  }
});
canvas.addEventListener('pointermove',function(e){
  if(!drag || e.pointerId!==drag.id) return;
  if(!drag.moved && Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>4) drag.moved = true;
  if(drag.moved){
    if(drag.item){
      var p = floorAt(e.clientX,e.clientY);
      if(p) setPos(drag.item,p.x+drag.ox,p.z+drag.oz);
    }else if(!gyro.on){
      view.yaw += (e.clientX-drag.lx)*0.2*RAD;
      view.pitch = clamp(view.pitch-(e.clientY-drag.ly)*0.2,0,85);
      $('#sP').value = Math.round(view.pitch); $('#oP').textContent = Math.round(view.pitch)+'°';
    }
  }
  drag.lx = e.clientX; drag.ly = e.clientY;
});
function endDrag(e){
  if(!drag || e.pointerId!==drag.id) return;
  if(!drag.moved && !drag.item) select(null);
  if(drag.moved && drag.item) save();
  drag = null;
}
canvas.addEventListener('pointerup',endDrag);
canvas.addEventListener('pointercancel',endDrag);
canvas.addEventListener('wheel',function(e){
  if(!selected) return;
  e.preventDefault(); rotateBy(e.deltaY>0?5:-5);
},{passive:false});
window.addEventListener('keydown',function(e){
  var tag = (e.target.tagName||'').toLowerCase();
  if(tag==='input'||tag==='textarea'){ if(e.key==='Escape') e.target.blur(); return; }
  if((e.key==='Delete'||e.key==='Backspace') && selected){ e.preventDefault(); removeItem(selected); }
  else if(e.key==='Escape') select(null);
  else if((e.key==='r'||e.key==='R') && selected) rotateBy(15);
});

/* ------------------------------------------------------------------ */
/* Catálogo: arrastrar al espacio                                      */
/* ------------------------------------------------------------------ */
var rail = $('#rail'), ghost = $('#ghost'), rd = null;
CATALOG.forEach(function(def){
  var b = document.createElement('button');
  b.type='button'; b.className='item'; b.dataset.id = def.id; b.draggable = false;
  b.setAttribute('aria-label','Añadir '+def.name.toLowerCase()+' (toca o arrastra al suelo)');
  b.innerHTML = def.icon + '<span></span>';
  b.lastChild.textContent = def.name;
  rail.appendChild(b);
});
function placeFromScreen(def,cx,cy){
  var p = floorAt(cx,cy) || aheadPoint(2.2);
  addItem(def.id,p.x,p.z);
}
rail.addEventListener('pointerdown',function(e){
  var b = e.target.closest('.item'); if(!b || !e.isPrimary) return;
  var def = CATALOG.filter(function(c){ return c.id===b.dataset.id; })[0];
  rd = {id:e.pointerId,def:def,sx:e.clientX,sy:e.clientY,moved:false};
  try{ b.setPointerCapture(e.pointerId); }catch(_){}
});
rail.addEventListener('pointermove',function(e){
  if(!rd || e.pointerId!==rd.id) return;
  if(!rd.moved && Math.hypot(e.clientX-rd.sx,e.clientY-rd.sy)>8){
    rd.moved = true; ghost.innerHTML = rd.def.icon + '<span></span>'; ghost.lastChild.textContent = rd.def.name; ghost.hidden = false;
  }
  if(rd.moved) ghost.style.transform = 'translate('+e.clientX+'px,'+e.clientY+'px) translate(-50%,-50%)';
});
function endRail(e,cancelled){
  if(!rd || e.pointerId!==rd.id) return;
  var r = rd; rd = null; ghost.hidden = true;
  if(cancelled) return;
  if(!r.moved){
    var sr = stage.getBoundingClientRect();
    placeFromScreen(r.def,sr.left+sr.width*0.55,sr.top+sr.height*0.72);
    return;
  }
  var el = document.elementFromPoint(e.clientX,e.clientY);
  if(el && el.closest('#rail,#panel,#topwrap,#settings,#welcome')) return;
  placeFromScreen(r.def,e.clientX,e.clientY);
}
rail.addEventListener('pointerup',function(e){ endRail(e,false); });
rail.addEventListener('pointercancel',function(e){ endRail(e,true); });
rail.addEventListener('dragstart',function(e){ e.preventDefault(); });

/* ------------------------------------------------------------------ */
/* Guardado local de la habitación                                     */
/* ------------------------------------------------------------------ */
var KEY = 'amueblar-ar-v1', saveT;
function save(){
  clearTimeout(saveT);
  saveT = setTimeout(function(){
    try{
      localStorage.setItem(KEY,JSON.stringify({
        items:items.map(function(i){ return {t:i.type,d:i.dim,c:i.color,r:i.rot,x:i.group.position.x,z:i.group.position.z}; }),
        cfg:{h:cfg.h,fov:cfg.fov,grid:cfg.grid,measure:cfg.measure}
      }));
    }catch(_){}
  },400);
}
function restore(){
  try{
    var s = JSON.parse(localStorage.getItem(KEY)||'null'); if(!s) return;
    if(s.cfg){
      if(isFinite(s.cfg.h)) cfg.h = clamp(s.cfg.h,80,220);
      if(isFinite(s.cfg.fov)) cfg.fov = clamp(s.cfg.fov,45,90);
      if(typeof s.cfg.grid==='boolean') cfg.grid = s.cfg.grid;
      if(MODES.indexOf(s.cfg.measure)>-1) cfg.measure = s.cfg.measure;
    }
    (s.items||[]).slice(0,60).forEach(function(o){
      if(CATALOG.some(function(c){ return c.id===o.t; })) addItem(o.t,Number(o.x)||0,Number(o.z)||0,{dim:o.d,color:o.c,rot:o.r,silent:true});
    });
  }catch(_){}
}

/* ------------------------------------------------------------------ */
/* Bucle de dibujo                                                     */
/* ------------------------------------------------------------------ */
function resize(){
  var r = stage.getBoundingClientRect();
  SW = Math.max(1,r.width); SH = Math.max(1,r.height);
  renderer.setSize(SW,SH,false);
  camera.aspect = SW/SH; camera.updateProjectionMatrix();
}
if(window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize',resize);

var _v = new THREE.Vector3();
function updateChips(){
  items.forEach(function(it){
    var show = it.dimsG.visible;
    ['w','d','h'].forEach(function(k){
      var c = it.chips[k];
      if(!show){ if(!c.hidden) c.hidden = true; return; }
      _v.copy(it.anchors[k]); it.group.localToWorld(_v); _v.project(camera);
      if(_v.z>1 || _v.z<-1 || Math.abs(_v.x)>1.05 || Math.abs(_v.y)>1.05){ c.hidden = true; return; }
      c.hidden = false;
      c.style.transform = 'translate('+((_v.x*0.5+0.5)*SW).toFixed(1)+'px,'+((-_v.y*0.5+0.5)*SH).toFixed(1)+'px) translate(-50%,-50%)';
    });
  });
}
function frame(){
  requestAnimationFrame(frame);
  applyCamera();
  updateHorizon();
  renderer.render(scene,camera);
  updateChips();
}

/* Inicio */
restore();
syncSettings(); syncMeasure(); syncPanel(); resize();
frame();
})();