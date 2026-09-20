// BASE DE DATOS DE MUEBLES DE EJEMPLO
const FURNITURE_CATALOG = [
    { id: 'sofa_3p', name: 'Sofá 3 Plazas', category: 'seating', icon: 'fa-couch', defaultDim: { x: 200, y: 85, z: 90 }, color: 0x3b82f6 },
    { id: 'silla_comedor', name: 'Silla Moderna', category: 'seating', icon: 'fa-chair', defaultDim: { x: 50, y: 90, z: 55 }, color: 0x10b981 },
    { id: 'mesa_centro', name: 'Mesa de Centro', category: 'tables', icon: 'fa-table-cells', defaultDim: { x: 120, y: 45, z: 60 }, color: 0xd97706 },
    { id: 'mesa_comedor', name: 'Mesa Comedor', category: 'tables', icon: 'fa-table', defaultDim: { x: 180, y: 75, z: 90 }, color: 0x475569 },
    { id: 'estanteria', name: 'Estantería Alta', category: 'storage', icon: 'fa-box-archive', defaultDim: { x: 80, y: 190, z: 40 }, color: 0x8b5cf6 },
    { id: 'planta_interior', name: 'Planta Decorativa', category: 'decor', icon: 'fa-plant-wilt', defaultDim: { x: 45, y: 110, z: 45 }, color: 0x10b981 }
];

// ESTADO GLOBAL DE LA APLICACIÓN
let scene, camera, renderer, controls;
let placedObjects = [];
let selectedObject = null;
let showDimensions = true;
let isCameraActive = false;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let planeGrid, floorPlane;

// ELEMENTOS DOM
const viewportContainer = document.getElementById('viewport-container');
const canvas = document.getElementById('ar-canvas');
const furnitureGrid = document.getElementById('furniture-grid');
const dimensionLabelsContainer = document.getElementById('dimension-labels-container');

// INSPECTOR DOM
const inspectorEmpty = document.getElementById('inspector-empty');
const inspectorContent = document.getElementById('inspector-content');
const inputDimX = document.getElementById('dim-x');
const inputDimY = document.getElementById('dim-y');
const inputDimZ = document.getElementById('dim-z');
const lockAspect = document.getElementById('lock-aspect');
const inputRotation = document.getElementById('rotation-y');
const textRotationVal = document.getElementById('rotation-val');
const selectedName = document.getElementById('selected-item-name');
const selectedCat = document.getElementById('selected-item-cat');

// INICIALIZACIÓN DE LA APLICACIÓN
window.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    renderCatalog('all');
    setupEventListeners();
    animate();
});

// CONFIGURACIÓN DE THREE.JS
function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);

    camera = new THREE.PerspectiveCamera(60, viewportContainer.clientWidth / viewportContainer.clientHeight, 0.1, 1000);
    camera.position.set(250, 200, 300);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Controles de Cámara (OrbitControls)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.01;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(200, 400, 200);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Suelo y Cuadrícula
    planeGrid = new THREE.GridHelper(600, 30, 0x38bdf8, 0x1e293b);
    scene.add(planeGrid);

    const planeGeo = new THREE.PlaneGeometry(600, 600);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    floorPlane = new THREE.Mesh(planeGeo, planeMat);
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.receiveShadow = true;
    scene.add(floorPlane);

    window.addEventListener('resize', onWindowResize);
}

// REDIMENSIONAR CANVAS
function onWindowResize() {
    camera.aspect = viewportContainer.clientWidth / viewportContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
}

// RENDERIZAR CATÁLOGOS EN SIDEBAR
function renderCatalog(category) {
    furnitureGrid.innerHTML = '';
    const filtered = category === 'all' ? FURNITURE_CATALOG : FURNITURE_CATALOG.filter(f => f.category === category);

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = 'furniture-card';
        card.setAttribute('draggable', true);
        card.innerHTML = `
            <i class="fa-solid ${item.icon}"></i>
            <span class="name">${item.name}</span>
            <span class="dimensions">${item.defaultDim.x} x ${item.defaultDim.z} cm</span>
        `;

        // Eventos Click / Drag
        card.addEventListener('click', () => addFurnitureToScene(item));
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(item));
        });

        furnitureGrid.appendChild(card);
    });
}

// CREAR Y AÑADIR MUEBLE A LA ESCENA 3D
function addFurnitureToScene(itemData, position = new THREE.Vector3(0, 0, 0)) {
    const group = new THREE.Group();
    
    const geometry = new THREE.BoxGeometry(itemData.defaultDim.x, itemData.defaultDim.y, itemData.defaultDim.z);
    const material = new THREE.MeshStandardMaterial({ 
        color: itemData.color, 
        roughness: 0.4,
        metalness: 0.1 
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.y = itemData.defaultDim.y / 2;
    group.add(mesh);

    // Borde de Selección
    const bbox = new THREE.BoxHelper(mesh, 0x38bdf8);
    bbox.visible = false;
    group.add(bbox);

    group.position.copy(position);

    group.userData = {
        id: 'inst_' + Date.now(),
        name: itemData.name,
        category: itemData.category,
        dimensions: { ...itemData.defaultDim },
        mesh: mesh,
        bbox: bbox
    };

    scene.add(group);
    placedObjects.push(group);

    selectObject(group);
}

// SELECCIÓN DE OBJETOS
function selectObject(obj) {
    if (selectedObject) {
        selectedObject.userData.bbox.visible = false;
    }

    selectedObject = obj;

    if (selectedObject) {
        selectedObject.userData.bbox.visible = true;
        updateInspectorUI();
    } else {
        showEmptyInspector();
    }
}

// ACTUALIZAR INTERFAZ DEL INSPECTOR DE MEDIDAS
function updateInspectorUI() {
    if (!selectedObject) return;

    inspectorEmpty.style.display = 'none';
    inspectorContent.style.display = 'flex';

    const data = selectedObject.userData;
    selectedName.textContent = data.name;
    selectedCat.textContent = data.category;

    inputDimX.value = Math.round(data.dimensions.x);
    inputDimY.value = Math.round(data.dimensions.y);
    inputDimZ.value = Math.round(data.dimensions.z);

    const rotDeg = Math.round(THREE.MathUtils.radToDeg(selectedObject.rotation.y));
    inputRotation.value = rotDeg;
    textRotationVal.textContent = `${rotDeg}°`;
}

function showEmptyInspector() {
    inspectorEmpty.style.display = 'flex';
    inspectorContent.style.display = 'none';
}

// APLICAR NUEVAS MEDIDAS INGRESADAS EN LOS INPUTS
function updateDimensionsFromInput(changedAxis) {
    if (!selectedObject) return;

    const data = selectedObject.userData;
    let newX = parseFloat(inputDimX.value) || 10;
    let newY = parseFloat(inputDimY.value) || 10;
    let newZ = parseFloat(inputDimZ.value) || 10;

    if (lockAspect.checked) {
        const ratioY = data.dimensions.y / data.dimensions.x;
        const ratioZ = data.dimensions.z / data.dimensions.x;

        if (changedAxis === 'x') {
            newY = newX * ratioY;
            newZ = newX * ratioZ;
        } else if (changedAxis === 'y') {
            newX = newY / ratioY;
            newZ = newX * ratioZ;
        } else if (changedAxis === 'z') {
            newX = newZ / ratioZ;
            newY = newX * ratioY;
        }

        inputDimX.value = Math.round(newX);
        inputDimY.value = Math.round(newY);
        inputDimZ.value = Math.round(newZ);
    }

    data.dimensions = { x: newX, y: newY, z: newZ };

    data.mesh.geometry.dispose();
    data.mesh.geometry = new THREE.BoxGeometry(newX, newY, newZ);
    data.mesh.position.y = newY / 2;
    data.bbox.update();
}

// ACTUALIZAR ETIQUETAS Y COTAS DE MEDIDA 3D
function updateDimensionLabels() {
    dimensionLabelsContainer.innerHTML = '';
    if (!showDimensions) return;

    placedObjects.forEach(obj => {
        if (selectedObject && obj !== selectedObject) return;

        const data = obj.userData;
        const pos = obj.position;

        createLabel(new THREE.Vector3(pos.x, pos.y + data.dimensions.y + 10, pos.z), `${Math.round(data.dimensions.x)} x ${Math.round(data.dimensions.z)} cm`);
    });
}

function createLabel(worldPos, text) {
    const vector = worldPos.clone().project(camera);
    if (vector.z > 1) return;

    const x = (vector.x * 0.5 + 0.5) * viewportContainer.clientWidth;
    const y = (-(vector.y * 0.5) + 0.5) * viewportContainer.clientHeight;

    const label = document.createElement('div');
    label.className = 'dim-label';
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.textContent = text;

    dimensionLabelsContainer.appendChild(label);
}

// ASIGNACIÓN DE EVENTOS
function setupEventListeners() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderCatalog(e.target.dataset.cat);
        });
    });

    inputDimX.addEventListener('input', () => updateDimensionsFromInput('x'));
    inputDimY.addEventListener('input', () => updateDimensionsFromInput('y'));
    inputDimZ.addEventListener('input', () => updateDimensionsFromInput('z'));

    inputRotation.addEventListener('input', (e) => {
        if (!selectedObject) return;
        const deg = e.target.value;
        textRotationVal.textContent = `${deg}°`;
        selectedObject.rotation.y = THREE.MathUtils.degToRad(deg);
        selectedObject.userData.bbox.update();
    });

    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', (e) => {
            if (!selectedObject) return;
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            e.target.classList.add('active');
            const colorHex = e.target.dataset.color;
            selectedObject.userData.mesh.material.color.set(colorHex);
        });
    });

    document.getElementById('btn-delete').addEventListener('click', () => {
        if (!selectedObject) return;
        scene.remove(selectedObject);
        placedObjects = placedObjects.filter(o => o !== selectedObject);
        selectObject(null);
    });

    document.getElementById('btn-duplicate').addEventListener('click', () => {
        if (!selectedObject) return;
        const data = selectedObject.userData;
        addFurnitureToScene({
            name: data.name,
            category: data.category,
            defaultDim: { ...data.dimensions },
            color: selectedObject.userData.mesh.material.color.getHex()
        }, selectedObject.position.clone().add(new THREE.Vector3(20, 0, 20)));
    });

    document.getElementById('btn-toggle-dimensions').addEventListener('click', (e) => {
        showDimensions = !showDimensions;
        e.currentTarget.classList.toggle('active', showDimensions);
    });

    document.getElementById('btn-clear').addEventListener('click', () => {
        placedObjects.forEach(obj => scene.remove(obj));
        placedObjects = [];
        selectObject(null);
    });

    document.getElementById('btn-export').addEventListener('click', openSummaryModal);
    document.getElementById('btn-close-modal').addEventListener('click', closeSummaryModal);

    viewportContainer.addEventListener('pointerdown', onPointerDown);
    viewportContainer.addEventListener('dragover', (e) => e.preventDefault());
    viewportContainer.addEventListener('drop', onCanvasDrop);

    document.getElementById('btn-camera').addEventListener('click', toggleCameraFeed);
}

function onPointerDown(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(placedObjects.map(o => o.userData.mesh));

    if (intersects.length > 0) {
        const hitGroup = intersects[0].object.parent;
        selectObject(hitGroup);
    }
}

function onCanvasDrop(event) {
    event.preventDefault();
    const rawData = event.dataTransfer.getData('text/plain');
    if (!rawData) return;

    const itemData = JSON.parse(rawData);

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(floorPlane);

    const dropPosition = intersects.length > 0 ? intersects[0].point : new THREE.Vector3(0, 0, 0);
    addFurnitureToScene(itemData, dropPosition);
}

function toggleCameraFeed() {
    const video = document.getElementById('webcam-feed');
    const btn = document.getElementById('btn-camera');

    if (!isCameraActive) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                video.srcObject = stream;
                video.style.display = 'block';
                planeGrid.visible = false;
                floorPlane.material.visible = false;
                isCameraActive = true;
                btn.classList.add('active');
            })
            .catch(() => alert('No se pudo acceder a la cámara.'));
    } else {
        if (video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        video.style.display = 'none';
        planeGrid.visible = true;
        floorPlane.material.visible = true;
        isCameraActive = false;
        btn.classList.remove('active');
    }
}

function openSummaryModal() {
    const tbody = document.getElementById('summary-table-body');
    tbody.innerHTML = '';

    placedObjects.forEach(obj => {
        const d = obj.userData;
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${d.name}</strong></td>
            <td>${Math.round(d.dimensions.x)} cm</td>
            <td>${Math.round(d.dimensions.y)} cm</td>
            <td>${Math.round(d.dimensions.z)} cm</td>
            <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#${d.mesh.material.color.getHexString()}"></span></td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('modal-summary').classList.add('active');
}

function closeSummaryModal() {
    document.getElementById('modal-summary').classList.remove('active');
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    updateDimensionLabels();
}