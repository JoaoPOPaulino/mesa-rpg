import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const carregador = new GLTFLoader();
const ALTURA_MINIATURA = 1.2;
const VELOCIDADE = 2;
const TEMPO_TRANSICAO = 0.2;

const controles = new Map();  // modelo → { mixer, parado, andando, atual, travado }
const movimentos = new Map(); // modelo → destino
let animacoes = [];

const animacoesPromessa = Promise.all([
  carregador.loadAsync('/modelos/animacoes/Rig_Medium_General.glb'),
  carregador.loadAsync('/modelos/animacoes/Rig_Medium_MovementBasic.glb'),
])
  .then(([geral, movimento]) => [...geral.animations, ...movimento.animations])
  .catch((erro) => {
    console.error('Não consegui carregar as animações', erro);
    return [];
  });

function equiparArma(modelo, nomeOsso, arquivo, dados) {
  if (!arquivo) return;

  carregador.load(
    `/modelos/armas/${arquivo}`,
    (gltf) => {
      const arma = gltf.scene;
      arma.traverse((parte) => {
        parte.userData = dados;
      });
      modelo.getObjectByName(nomeOsso).add(arma);
    },
    undefined,
    (erro) => console.error(`Não consegui carregar a arma "${arquivo}"`, erro)
  );
}

// Troca suavemente da animação atual para a nova
function transicionar(c, nova) {
  if (!nova || nova === c.atual) return;
  nova.reset().fadeIn(TEMPO_TRANSICAO).play();
  c.atual?.fadeOut(TEMPO_TRANSICAO);
  c.atual = nova;
}

export async function criarMiniatura(dados, scene) {
  animacoes = await animacoesPromessa;
  const gltf = await carregador.loadAsync(`/modelos/${dados.modelo}`);
  const modelo = gltf.scene;

  // Estado de jogo: a vida atual começa cheia
  dados.vidaAtual = dados.vida;

  const caixa = new THREE.Box3().setFromObject(modelo);
  const altura = caixa.max.y - caixa.min.y;
  const escala = ALTURA_MINIATURA / altura;
  modelo.scale.setScalar(escala);
  modelo.position.set(
    dados.casa.x + 0.5,
    -caixa.min.y * escala,
    dados.casa.z + 0.5
  );

  modelo.traverse((parte) => {
    parte.userData = dados;
  });

  equiparArma(modelo, 'handslotr', dados.armas?.direita, dados);
  equiparArma(modelo, 'handslotl', dados.armas?.esquerda, dados);

  const mixer = new THREE.AnimationMixer(modelo);
  const clipeParado = THREE.AnimationClip.findByName(animacoes, dados.animacao ?? 'Idle_A');
  const clipeAndando = THREE.AnimationClip.findByName(animacoes, 'Walking_A');

  const c = {
    mixer,
    parado: clipeParado ? mixer.clipAction(clipeParado) : null,
    andando: clipeAndando ? mixer.clipAction(clipeAndando) : null,
    atual: null,
    travado: false,
  };

  transicionar(c, c.parado);
  if (c.parado) c.parado.time = Math.random() * clipeParado.duration;

  // Quando uma animação de "uma vez só" termina (ex.: tomar dano),
  // volta a andar ou a ficar parado, a não ser que esteja travado (morto)
  mixer.addEventListener('finished', (evento) => {
    if (c.travado || evento.action !== c.atual) return;
    transicionar(c, movimentos.has(modelo) ? c.andando : c.parado);
  });

  controles.set(modelo, c);
  scene.add(modelo);
  return modelo;
}

// Toca uma animação uma única vez (ex.: 'Hit_A', 'Death_A').
// { manter: true } = fica parado no último quadro e trava (usado na morte).
export function tocarAnimacao(modelo, nome, { manter = false } = {}) {
  const c = controles.get(modelo);
  const clipe = THREE.AnimationClip.findByName(animacoes, nome);
  if (!c || !clipe || c.travado) return;

  const acao = c.mixer.clipAction(clipe);
  acao.setLoop(THREE.LoopOnce, 1); // toca uma vez, sem repetir
  acao.clampWhenFinished = true;   // segura o último quadro ao terminar

  if (c.atual === acao) {
    acao.reset().play(); // já estava tocando essa? recomeça
  } else {
    transicionar(c, acao);
  }

  if (manter) c.travado = true;
}

export function moverPara(modelo, x, z) {
  const c = controles.get(modelo);
  if (c?.travado) return; // morto não anda

  const destino = new THREE.Vector3(x, modelo.position.y, z);
  const direcao = destino.clone().sub(modelo.position);
  if (direcao.length() < 0.01) return;

  modelo.rotation.y = Math.atan2(direcao.x, direcao.z);
  movimentos.set(modelo, destino);
  transicionar(c, c.andando);
}

export function atualizarMiniaturas(delta) {
  for (const c of controles.values()) {
    c.mixer.update(delta);
  }

  for (const [modelo, destino] of movimentos) {
    const passo = VELOCIDADE * delta;
    const distancia = modelo.position.distanceTo(destino);

    if (distancia <= passo) {
      modelo.position.copy(destino);
      movimentos.delete(modelo);
      const c = controles.get(modelo);
      if (!c.travado) transicionar(c, c.parado);
    } else {
      const direcao = destino.clone().sub(modelo.position).normalize();
      modelo.position.addScaledVector(direcao, passo);
    }
  }
}

export function encontrarRaiz(parte, lista) {
  let atual = parte;
  while (atual && !lista.includes(atual)) {
    atual = atual.parent;
  }
  return atual;
}