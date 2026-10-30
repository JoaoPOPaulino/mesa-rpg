import * as THREE from 'three';
import { registrar } from '../ui/registro.js'; // ".." = sobe uma pasta (de dados/ para src/)

// ===== ESTADO PRIVADO (sem export: ninguém de fora acessa) =====
let dado = null;
let quadrosGirando = 0;
let resultado = 0;

// Cria o dado e coloca na cena que o main.js entregar
export function criarDado(scene) {
  dado = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.6),
    new THREE.MeshStandardMaterial({ color: 0xf1c40f, flatShading: true })
  );
  dado.position.set(-3.5, 0.6, 3.5);
  scene.add(dado);
}

// Começa uma rolagem
export function rolarD20() {
  if (quadrosGirando > 0) return; // já está girando? ignora o clique (bônus: evita rolagem dupla)

  resultado = Math.floor(Math.random() * 20) + 1;
  quadrosGirando = 60;
}

// Chamada pelo loop a cada quadro
export function atualizarDado() {
  if (quadrosGirando === 0) return; // parado? não faz nada

  dado.rotation.x += 0.3;
  dado.rotation.y += 0.2;
  quadrosGirando--;

  if (quadrosGirando === 0) {
    let texto = `🎲 d20: ${resultado}`;

    if (resultado === 20) {
      texto = texto + ' — CRÍTICO!';
    } else if (resultado === 1) {
      texto = texto + ' — FALHA CRÍTICA';
    }

    registrar(texto);
  }
}