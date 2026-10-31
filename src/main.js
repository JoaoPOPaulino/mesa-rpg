import * as THREE from 'three';
import { mostrarCarta, esconderCarta } from './ui/carta.js';
import { registrar } from './ui/registro.js';
import { criarDado, rolarD20, atualizarDado } from './dados/dado.js';
import { criarMonstros, monstros } from './entidades/monstros.js';
import { criarHerois, herois } from './entidades/herois.js';
import {
  atualizarMiniaturas,
  encontrarRaiz,
  moverPara,
  tocarAnimacao,
} from './entidades/miniaturas.js';
import { atacar } from './regras/combate.js';
import { casaOcupada } from './regras/tabuleiro.js';
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

// ===== MINIATURAS =====
criarMonstros(scene);
criarHerois(scene);

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

// ===== DESTAQUE DA CASA (sob o mouse) =====
const destaque = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.4 })
);
destaque.rotation.x = -Math.PI / 2;
destaque.position.y = 0.02;
destaque.visible = false;
scene.add(destaque);

// ===== ANEL DE SELEÇÃO (sob o herói selecionado) =====
const anel = new THREE.Mesh(
  new THREE.RingGeometry(0.35, 0.45, 32),
  new THREE.MeshBasicMaterial({ color: 0xffd700, side: THREE.DoubleSide })
);
anel.rotation.x = -Math.PI / 2;
anel.position.y = 0.03;
anel.visible = false;
scene.add(anel);

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

// ===== SELEÇÃO =====
let selecionado = null;

function desselecionar() {
  selecionado = null;
  anel.visible = false;
}

// ===== COMBATE =====
// A REGRA (combate.js) calcula; aqui só mostramos o resultado
function resolverAtaque(heroi, monstro) {
  console.log('ATAQUE', heroi.userData.nome, '→', monstro.userData.nome, monstro.userData.vidaAtual);
  const atacante = heroi.userData;
  const alvo = monstro.userData;

  if (alvo.vidaAtual <= 0) {
    registrar(`💀 ${alvo.nome} já foi derrotado.`);
    return;
  }

  // O herói vira para o alvo
  heroi.rotation.y = Math.atan2(
    monstro.position.x - heroi.position.x,
    monstro.position.z - heroi.position.z
  );

  const r = atacar(atacante, alvo);

  let texto = `⚔️ ${atacante.nome} → ${alvo.nome}: 🎲 ${r.d20} + ${atacante.ataque.bonus} = ${r.total} vs Defesa ${alvo.defesa}`;
  if (r.critico) texto += ` — CRÍTICO! ${r.dano} de dano`;
  else if (r.falhaCritica) texto += ' — FALHA CRÍTICA';
  else if (r.acertou) texto += ` — acertou, ${r.dano} de dano`;
  else texto += ' — errou';
  registrar(texto);

  if (r.derrotado) {
    tocarAnimacao(monstro, 'Death_A', { manter: true });
    registrar(`💀 ${alvo.nome} foi derrotado!`);
  } else if (r.acertou) {
    tocarAnimacao(monstro, 'Hit_A');
  }
}

// ===== CLIQUE: monstro → herói → chão =====
renderer.domElement.addEventListener('click', (evento) => {
  atualizarMouse(evento);
  raycaster.setFromCamera(mouse, camera);

  // 1º: clicou num monstro? Se tem herói selecionado, ataca. Depois mostra a carta.
  const acertosMonstros = raycaster.intersectObjects(monstros);
  if (acertosMonstros.length > 0) {
    const monstro = encontrarRaiz(acertosMonstros[0].object, monstros);

    if (selecionado) {
      resolverAtaque(selecionado, monstro);
      desselecionar();
    }

    mostrarCarta(monstro.userData);
    return;
  }

  // 2º: clicou num herói? Seleciona (ou desseleciona, se já era ele).
  const acertosHerois = raycaster.intersectObjects(herois);
  if (acertosHerois.length > 0) {
    const heroi = encontrarRaiz(acertosHerois[0].object, herois);

    if (heroi === selecionado) {
      desselecionar();
    } else {
      selecionado = heroi;
      anel.position.x = heroi.position.x;
      anel.position.z = heroi.position.z;
      anel.visible = true;
    }
    return;
  }

  // 3º: clicou no chão? Fecha a carta e move o herói selecionado.
  const acertosChao = raycaster.intersectObject(chao);
  if (acertosChao.length > 0) {
    esconderCarta();

    if (selecionado) {
      const centro = centroDaCasa(acertosChao[0].point);
      const casa = { x: centro.x - 0.5, z: centro.z - 0.5 };

      // Junta os DADOS de todas as miniaturas, menos o próprio herói selecionado
      const outros = [...herois, ...monstros]
        .filter((m) => m !== selecionado)
        .map((m) => m.userData);

      if (casaOcupada(casa.x, casa.z, outros)) {
        registrar('🚫 Essa casa já está ocupada.');
        return; // não move, e o herói continua selecionado
      }

      moverPara(selecionado, centro.x, centro.z);
      selecionado.userData.casa = casa;
      desselecionar();
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
  atualizarMiniaturas(delta);

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