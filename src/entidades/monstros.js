import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import dadosMonstros from '../data/monstros.json';

const carregador = new GLTFLoader();
const ALTURA_MINIATURA = 1.2;

export const monstros = [];
const mixers = [];
let animacoes = [];

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

// "async" permite usar "await" aqui dentro: esperar algo carregar
// antes de seguir, sem travar a página
export async function criarMonstros(scene) {
  try {
    // 1. Carrega os dois arquivos de animação AO MESMO TEMPO e espera os dois.
    //    Promise.all = "me avise quando TODOS terminarem"
    const [geral, movimento] = await Promise.all([
      carregador.loadAsync('/modelos/animacoes/Rig_Medium_General.glb'),
      carregador.loadAsync('/modelos/animacoes/Rig_Medium_MovementBasic.glb'),
    ]);

    // Junta os clipes dos dois arquivos numa lista só ("..." espalha os itens)
    animacoes = [...geral.animations, ...movimento.animations];
  } catch (erro) {
    console.error('Não consegui carregar as animações', erro);
  }

  // 2. Agora sim, cria os monstros (já com as animações disponíveis)
  for (const dados of dadosMonstros) {
    carregador.load(
      `/modelos/${dados.modelo}`,
      (gltf) => {
        const modelo = gltf.scene;

        // Mede, escala e posiciona (igual a antes)
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

        // 3. Animação: cria o tocador e manda tocar o clipe
        //    "??" = se o JSON não disser qual animação, usa 'Idle_A'
        const nomeAnimacao = dados.animacao ?? 'Idle_A';
        const clipe = THREE.AnimationClip.findByName(animacoes, nomeAnimacao);

        if (clipe) {
          const mixer = new THREE.AnimationMixer(modelo);
          const acao = mixer.clipAction(clipe);
          acao.play();
          // Começa num ponto aleatório, para não respirarem todos sincronizados
          acao.time = Math.random() * clipe.duration;
          mixers.push(mixer);
        }

        scene.add(modelo);
        monstros.push(modelo);
      },
      undefined,
      (erro) => console.error(`Não consegui carregar o modelo "${dados.modelo}"`, erro)
    );
  }
}

// Chamada pelo loop a cada quadro: avança todas as animações
export function atualizarMonstros(delta) {
  for (const mixer of mixers) {
    mixer.update(delta);
  }
}