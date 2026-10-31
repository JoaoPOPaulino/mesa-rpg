import * as THREE from 'three';
import { mostrarCarta, esconderCarta } from './ui/carta.js';
import { criarDado, rolarD20, atualizarDado } from './dados/dado.js';
  import { criarMonstros, monstros, atualizarMonstros } from './entidades/monstros.js';
import './style.css';

// ===== CENA, CÂMERA, RENDERER =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 8, 8);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ===== LUZES =====
const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(luzAmbiente);

const luzSolar = new THREE.DirectionalLight(0xffffff, 1);
luzSolar.position.set(5, 10, 5);
scene.add(luzSolar);

// ===== TABULEIRO =====
const chao = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x3a5a40 })
);
chao.rotation.x = -Math.PI / 2;
scene.add(chao);

const grade = new THREE.GridHelper(10, 10, 0x000000, 0x000000);
grade.position.y = 0.01;
scene.add(grade);

// ===== TOKENS DOS JOGADORES =====
const tokenGeometria = new THREE.BoxGeometry(0.8, 0.8, 0.8);

const token = new THREE.Mesh(
  tokenGeometria,
  new THREE.MeshStandardMaterial({ color: 0xc0392b })
);
token.position.set(0.5, 0.4, 0.5);
scene.add(token);

const tokenAzul = new THREE.Mesh(
  tokenGeometria,
  new THREE.MeshStandardMaterial({ color: 0x2980b9 })
);
tokenAzul.position.set(-2.5, 0.4, -2.5);
scene.add(tokenAzul);

const tokens = [token, tokenAzul];

// ===== MONSTROS =====
criarMonstros(scene);


// ===== RAYCASTER =====
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function atualizarMouse(evento) {
  mouse.x = (evento.clientX / innerWidth) * 2 - 1;
  mouse.y = -(evento.clientY / innerHeight) * 2 + 1;
}

function centroDaCasa(ponto) {
  return {
    x: Math.floor(ponto.x) + 0.5,
    z: Math.floor(ponto.z) + 0.5,
  };
}

// ===== DESTAQUE DA CASA =====
const destaque = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4 })
);
destaque.rotation.x = -Math.PI / 2;
destaque.position.y = 0.02;
destaque.visible = false;
scene.add(destaque);

// ===== MOUSE PASSANDO =====
renderer.domElement.addEventListener('mousemove', (evento) => {
  atualizarMouse(evento);
  raycaster.setFromCamera(mouse, camera);
  const acertos = raycaster.intersectObject(chao);

  if (acertos.length > 0) {
    const casa = centroDaCasa(acertos[0].point);
    destaque.position.x = casa.x;
    destaque.position.z = casa.z;
    destaque.visible = true;
  } else {
    destaque.visible = false;
  }
});

// ===== CLIQUE: monstro → token → chão =====
let selecionado = null;

renderer.domElement.addEventListener('click', (evento) => {
  atualizarMouse(evento);
  raycaster.setFromCamera(mouse, camera);

  const acertosMonstros = raycaster.intersectObjects(monstros);
  if (acertosMonstros.length > 0) {
    mostrarCarta(acertosMonstros[0].object.userData); // vem do carta.js
    return;
  }

  const acertosTokens = raycaster.intersectObjects(tokens);
  if (acertosTokens.length > 0) {
    if (selecionado) {
      selecionado.material.emissive.setHex(0x000000);
    }
    selecionado = acertosTokens[0].object;
    selecionado.material.emissive.setHex(0x444444);
    return;
  }

  const acertosChao = raycaster.intersectObject(chao);
  if (acertosChao.length > 0) {
    esconderCarta(); // vem do carta.js

    if (selecionado) {
      const casa = centroDaCasa(acertosChao[0].point);
      selecionado.position.x = casa.x;
      selecionado.position.z = casa.z;
      selecionado.material.emissive.setHex(0x000000);
      selecionado = null;
    }
  }
});

   // ===== DADO d20 =====
   criarDado(scene);
   document.getElementById('botao-d20').addEventListener('click', rolarD20);

// ===== LOOP =====
  const relogio = new THREE.Clock();

  function loop() {
    const delta = relogio.getDelta();

    atualizarDado();
    atualizarMonstros(delta);

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  loop();

// ===== REDIMENSIONAR =====
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});