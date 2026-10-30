import * as THREE from 'three';
import './style.css';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 8, 8);
camera.lookAt(0, 0, 0);


const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(luzAmbiente);

const luzSolar = new THREE.DirectionalLight(0xffffff, 1);
luzSolar.position.set(5, 10, 5);
scene.add(luzSolar);

const chaoGeometria = new THREE.PlaneGeometry(10, 10);
const chaoMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5a40 });
const chao = new THREE.Mesh(chaoGeometria, chaoMaterial);
chao.rotation.x = -Math.PI / 2;
scene.add(chao);  

const grade = new THREE.GridHelper(10, 10, 0x0000, 0x000000);
grade.position.y = 0.01;
scene.add(grade);

const tokenGeometria = new THREE.BoxGeometry(0.8, 0.8, 0.8);
const tokenMaterial = new THREE.MeshStandardMaterial({ color: 0xc0392b });
const token = new THREE.Mesh(tokenGeometria, tokenMaterial);
token.position.set(0.5, 0.4, 0.5);
scene.add(token);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function atualizarMouse(evento){
  mouse.x = (evento.clientX / innerWidth) * 2 - 1;
  mouse.y = -(evento.clientY / innerHeight) * 2 + 1;
}

function centroDaCasa(ponto) {
  return {
    x: Math.floor(ponto.x) + 0.5,
    z: Math.floor(ponto.z) + 0.5,
  };
}

const destaque = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4})
);
destaque.rotation.x = -Math.PI / 2;
destaque.position.y = 0.02;
destaque.visible = false;
scene.add(destaque);

renderer.domElement.addEventListener('mousemove', (evento) => {
  atualizarMouse(evento);
  raycaster.setFromCamera(mouse, camera);
  const acertos = raycaster.intersectObjects(chao);

  if (acertos.length > 0) {
    const casa = centroDaCasa(acertos[0].point);
    destaque.position.x = casa.x;
    destaque.position.z = casa.z;
    destaque.visible = true;
  } else {
    destaque.visible = false;
  }
});

let selecionado = null;

renderer.domElement.addEventListener('click', (evento) => {
  atualizarMouse(evento);
  raycaster.setFromCamera(mouse, camera);

  if (raycaster.intersectObject(token).length > 0) {
    selecionado = token;
    token.material.emissive.setHex(0x444444);
    return;
  }


  const acertosChao = raycaster.intersectObject(chao);
  if (selecionado && acertosChao.length > 0) {
    const casa = centroDaCasa(acertosChao[0].point);
    selecionado.position.x = casa.x;
    selecionado.position.z = casa.z;

    selecionado.material.emissive.setHex(0x000000);
    selecionado = null;
  }
})

function loop() {
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

loop();

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});