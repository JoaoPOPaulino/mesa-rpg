import * as THREE from 'three';
import dadosMonstros from '../data/monstros.json'; // o Vite lê JSON direto

// Lista dos monstros na cena (exportada para o clique poder testar o raio nela)
export const monstros = [];

export function criarMonstros(scene) {
  // for...of = o "for each" do Java: for (Monstro dados : dadosMonstros)
  for (const dados of dadosMonstros) {
    const monstro = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 1, 6),
      new THREE.MeshStandardMaterial({ color: dados.cor })
    );

    // Casa (dado do jogo) → posição 3D (visual): +0.5 para ficar no centro
    monstro.position.set(dados.casa.x + 0.5, 0.5, dados.casa.z + 0.5);

    monstro.userData = dados; // a carta continua lendo nome, vida etc. daqui
    scene.add(monstro);
    monstros.push(monstro);   // push = add() do ArrayList
  }
}