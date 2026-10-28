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