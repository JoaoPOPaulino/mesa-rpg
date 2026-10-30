import * as THREE from 'three';
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
const goblin = new THREE.Mesh(
  new THREE.ConeGeometry(0.4, 1, 6),
  new THREE.MeshStandardMaterial({ color: 0x6c3483 })
);
goblin.position.set(2.5, 0.5, -1.5);
goblin.userData = {
  nome: 'Goblin Saqueador',
  descricao: 'Pequeno, rápido e covarde. Ataca em bando.',
  vida: 7,
  defesa: 13,
  ataque: '+4 (1d6)',
};
scene.add(goblin);

// CORREÇÃO 2: o lobo precisava ser criado
const lobo = new THREE.Mesh(
  new THREE.ConeGeometry(0.4, 1, 6),
  new THREE.MeshStandardMaterial({ color: 0x555555 })
);
lobo.position.set(3.5, 0.5, 2.5);
lobo.userData = {
  nome: 'Lobo Sombrio',
  descricao: 'Caça à noite. Seus olhos brilham antes do ataque.',
  vida: 11,
  defesa: 12,
  ataque: '+3 (2d4)',
};
scene.add(lobo);

// CORREÇÃO 1: a lista vem DEPOIS que os monstros existem
const monstros = [goblin, lobo];

// ===== CARTA =====
function mostrarCarta(dados) {
  document.getElementById('carta-nome').textContent = dados.nome;
  document.getElementById('carta-descricao').textContent = dados.descricao;
  document.getElementById('carta-vida').textContent = dados.vida;
  document.getElementById('carta-defesa').textContent = dados.defesa;
  document.getElementById('carta-ataque').textContent = dados.ataque;
  document.getElementById('carta').classList.remove('escondida');
}

function esconderCarta() {
  document.getElementById('carta').classList.add('escondida');
}

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

// ===== MOUSE PASSANDO: só o destaque =====
renderer.domElement.addEventListener('mousemove', (evento) => {
  atualizarMouse(evento);
  raycaster.setFromCamera(mouse, camera);

  // CORREÇÃO 4: singular, porque chao é um objeto só
  const acertos = raycaster.intersectObject(chao);

  // CORREÇÃO 3: o código do monstro saiu daqui e foi para o click

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

  // 1º: clicou num monstro? Abre a carta. (CORREÇÃO 3: veio para cá)
  const acertosMonstros = raycaster.intersectObjects(monstros);
  if (acertosMonstros.length > 0) {
    mostrarCarta(acertosMonstros[0].object.userData);
    return;
  }

  // 2º: clicou num token? Seleciona.
  const acertosTokens = raycaster.intersectObjects(tokens);
  if (acertosTokens.length > 0) {
    if (selecionado) {
      selecionado.material.emissive.setHex(0x000000);
    }
    selecionado = acertosTokens[0].object;
    selecionado.material.emissive.setHex(0x444444);
    return;
  }

  // 3º: clicou no chão? Fecha a carta e, se tiver token selecionado, move.
  const acertosChao = raycaster.intersectObject(chao);
  if (acertosChao.length > 0) {
    esconderCarta();

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
const dado = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.6),
  new THREE.MeshStandardMaterial({ color: 0xf1c40f, flatShading: true })
);
dado.position.set(-3.5, 0.6, 3.5);
scene.add(dado);

let quadrosGirando = 0;
let resultado = 0;

function registrar(texto) {
  const linha = document.createElement('p');
  linha.textContent = texto;
  document.getElementById('registro').prepend(linha);
}

document.getElementById('botao-d20').addEventListener('click', () => {
  resultado = Math.floor(Math.random() * 20) + 1;
  quadrosGirando = 60;
});

// ===== LOOP =====
function loop() {
  if (quadrosGirando > 0) {
    dado.rotation.x += 0.3;
    dado.rotation.y += 0.2;
    quadrosGirando--;

    if (quadrosGirando === 0) {
      registrar(`🎲 d20: ${resultado}`);
    }
  }

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