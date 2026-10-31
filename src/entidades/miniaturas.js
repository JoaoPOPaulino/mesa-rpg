import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const carregador = new GLTFLoader();
const ALTURA_MINIATURA = 1.2;
const mixers = [];

// Carrega as animações UMA vez. Guardamos a "promessa" (Promise):
// quem pedir antes de terminar espera; quem pedir depois recebe na hora.
// É parecido com um CompletableFuture do Java.
const animacoesPromessa = Promise.all([
  carregador.loadAsync('/modelos/animacoes/Rig_Medium_General.glb'),
  carregador.loadAsync('/modelos/animacoes/Rig_Medium_MovementBasic.glb'),
])
  .then(([geral, movimento]) => [...geral.animations, ...movimento.animations])
  .catch((erro) => {
    console.error('Não consegui carregar as animações', erro);
    return []; // segue sem animação em vez de quebrar tudo
  });

// Carrega uma arma e prende no osso da mão indicado
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

// Cria UMA miniatura (herói ou monstro) a partir dos dados do JSON
export async function criarMiniatura(dados, scene) {
  const animacoes = await animacoesPromessa;
  const gltf = await carregador.loadAsync(`/modelos/${dados.modelo}`);
  const modelo = gltf.scene;

  // Mede, escala e posiciona no centro da casa
  const caixa = new THREE.Box3().setFromObject(modelo);
  const altura = caixa.max.y - caixa.min.y;
  const escala = ALTURA_MINIATURA / altura;
  modelo.scale.setScalar(escala);
  modelo.position.set(
    dados.casa.x + 0.5,
    -caixa.min.y * escala,
    dados.casa.z + 0.5
  );

  // Dados em todas as partes (para o clique)
  modelo.traverse((parte) => {
    parte.userData = dados;
  });

  // Armas
  equiparArma(modelo, 'handslotr', dados.armas?.direita, dados);
  equiparArma(modelo, 'handslotl', dados.armas?.esquerda, dados);

  // Animação
  const clipe = THREE.AnimationClip.findByName(animacoes, dados.animacao ?? 'Idle_A');
  if (clipe) {
    const mixer = new THREE.AnimationMixer(modelo);
    const acao = mixer.clipAction(clipe);
    acao.play();
    acao.time = Math.random() * clipe.duration;
    mixers.push(mixer);
  }

  scene.add(modelo);
  return modelo; // quem chamou recebe o modelo pronto
}

// Avança todas as animações (chamada pelo loop)
export function atualizarMiniaturas(delta) {
  for (const mixer of mixers) {
    mixer.update(delta);
  }
}

export function encontrarRaiz(parte, lista) {
  let atual = parte;
  while (atual && !lista.includes(atual)) {
    atual = atual.parent; // sobe um nível na árvore
  }
  return atual; // a miniatura inteira (ou null, se não achou)
}