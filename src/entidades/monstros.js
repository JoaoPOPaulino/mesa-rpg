import dadosMonstros from '../data/monstros.json';
import { criarMiniatura } from './miniaturas.js';

export const monstros = [];

export function criarMonstros(scene) {
  for (const dados of dadosMonstros) {
    criarMiniatura(dados, scene)
      .then((modelo) => monstros.push(modelo)) // quando ficar pronto, entra na lista
      .catch((erro) => console.error(`Não consegui criar "${dados.nome}"`, erro));
  }
}