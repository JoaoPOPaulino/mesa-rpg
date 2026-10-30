import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import dadosMonstros from '../data/monstros.json';

const carregador = new GLTFLoader();
const ALTURA_MINIATURA = 1.2; // altura desejada, em "casas"

export const monstros = [];

export function criarMonstros(scene) {
  for (const dados of dadosMonstros) {
    carregador.load(`/modelos/${dados.modelo}`, (gltf) => {
      const modelo = gltf.scene;

      // TEMPORÁRIO: lista os ossos do modelo no console
      modelo.getObjectByName('upperarmr')?.rotateX(-1.2);
      modelo.getObjectByName('upperarml')?.rotateX(-1.2);

      // 1. Mede o modelo com uma caixa invisível
      const caixa = new THREE.Box3().setFromObject(modelo);
      const altura = caixa.max.y - caixa.min.y;

      // 2. Escala: se o modelo tem 3 de altura e queremos 1.2, multiplicamos por 0.4
      const escala = ALTURA_MINIATURA / altura;
      modelo.scale.setScalar(escala); // mesma escala em x, y e z

      // 3. Posiciona no centro da casa, com os pés encostados no chão
      modelo.position.set(
        dados.casa.x + 0.5,
        -caixa.min.y * escala,
        dados.casa.z + 0.5
      );

      // 4. Coloca os dados em TODAS as partes do modelo,
      //    para o clique funcionar em qualquer pedaço dele
      modelo.traverse((parte) => {
        parte.userData = dados;
      });

      scene.add(modelo);
      monstros.push(modelo);
    });
  }
}